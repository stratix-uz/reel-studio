require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const crypto = require("crypto");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT);

initializeApp({
  credential: cert(serviceAccount),
});
const db = getFirestore();

const app = express();
app.use(cors());
app.use(express.json({ limit: "15mb" }));
app.use(express.urlencoded({ extended: true, limit: "15mb" }));

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const VIDEO_MODEL_VERSION = "kwaivgi/kling-v1.6-standard";
const IMAGE_MODEL_VERSION = "black-forest-labs/flux-dev";

const CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID;
const CLICK_MERCHANT_ID = process.env.CLICK_MERCHANT_ID;
const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY;
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;

const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;

// Hamkorlik / referal dasturi sozlamalari
const PARTNER_SECRET_KEY = process.env.PARTNER_SECRET_KEY;
const PARTNER_REFERRAL_ID = "1118725021";
const PARTNER_DISCOUNT_PERCENT = 1; // faqat pro va max uchun

// Tariflar: reja nomi -> narx (so'mda) va beriladigan kredit soni
const PLANS = {
  basic: { priceUsd: 29.9, credits: 10 },
  standard: { priceUsd: 49.9, credits: 20 },
  pro: { priceUsd: 99.9, credits: 45 },
  max: { priceUsd: 199.9, credits: 100 },
};

// Chegirma faqat shu rejalar uchun amal qiladi
const DISCOUNTABLE_PLANS = ["pro", "max"];

// Rasm o'lcham nisbati -> piksel o'lchamlari (FLUX talab qiladigan format)
const IMAGE_ASPECT_MAP = {
  "16:9": "16:9",
  "9:16": "9:16",
  "1:1": "1:1",
  "4:5": "4:5",
  "21:9": "21:9",
};

// Kamera harakati/turi/kuchi -> promptga qo'shiladigan ingliz tilidagi tavsif
const CAMERA_MOVEMENT_TEXT = {
  none: "",
  zoom_in: "slow cinematic zoom in",
  zoom_out: "slow cinematic zoom out",
  pan_left: "smooth camera pan to the left",
  pan_right: "smooth camera pan to the right",
  tilt: "gentle camera tilt movement",
  orbit: "camera orbiting around the subject",
  static: "static locked camera shot",
};

const CAMERA_TYPE_TEXT = {
  none: "",
  cinematic: "cinematic camera",
  drone: "aerial drone shot",
  handheld: "handheld camera style",
  fpv: "FPV first-person camera style",
};

const MOTION_LEVEL_TEXT = {
  low: "subtle, slow motion",
  medium: "natural, moderate motion",
  high: "dynamic, fast-paced motion",
};

function buildVideoPromptExtras(advanced) {
  if (!advanced) return "";
  const parts = [];
  if (advanced.cameraMovement && CAMERA_MOVEMENT_TEXT[advanced.cameraMovement]) {
    parts.push(CAMERA_MOVEMENT_TEXT[advanced.cameraMovement]);
  }
  if (advanced.cameraType && CAMERA_TYPE_TEXT[advanced.cameraType]) {
    parts.push(CAMERA_TYPE_TEXT[advanced.cameraType]);
  }
  if (advanced.motionLevel && MOTION_LEVEL_TEXT[advanced.motionLevel]) {
    parts.push(MOTION_LEVEL_TEXT[advanced.motionLevel]);
  }
  return parts.length ? ", " + parts.join(", ") : "";
}

// Promptni avtomatik inglizchaga tarjima qilish
async function translateToEnglish(text) {
  try {
    const url = `https://translate.googleapis.com/translate_a/single?client=gtx&sl=auto&tl=en&dt=t&q=${encodeURIComponent(text)}`;
    const res = await fetch(url);
    if (!res.ok) return text;
    const data = await res.json();
    const translated = data[0].map((part) => part[0]).join("");
    return translated || text;
  } catch (err) {
    console.error("Tarjima xatosi:", err);
    return text;
  }
}

// Vaqtinchalik xotirada saqlanadigan buyurtmalar
const orders = {};

// ============ VIDEO GENERATSIYA: BOSHLASH ============
app.post("/api/generate-video/start", async (req, res) => {
  const { prompt, style, duration, ratio, advanced, startImage } = req.body;

  if (!prompt || prompt.trim().length < 3) {
    return res.status(400).json({ error: "Prompt juda qisqa" });
  }
  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: "REPLICATE_API_TOKEN sozlanmagan (.env faylini tekshiring)" });
  }

  const cameraExtras = buildVideoPromptExtras(advanced);
  const fullPrompt = `${prompt}, ${style} style${cameraExtras}`;

  const input = {
    prompt: fullPrompt,
    duration: parseInt(duration) || 6,
    aspect_ratio: ratio || "16:9",
  };

  if (advanced && advanced.negativePrompt && advanced.negativePrompt.trim()) {
    input.negative_prompt = advanced.negativePrompt.trim();
  }
  if (advanced && typeof advanced.cfgScale === "number" && advanced.cfgScale >= 0 && advanced.cfgScale <= 1) {
    input.cfg_scale = advanced.cfgScale;
  }

  // Rasm -> video: agar foydalanuvchi boshlang'ich rasm yuklagan bo'lsa
  if (startImage && typeof startImage === "string" && startImage.startsWith("data:image")) {
    input.start_image = startImage;
  }

  try {
    const createRes = await fetch("https://api.replicate.com/v1/models/" + VIDEO_MODEL_VERSION + "/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Replicate xatosi: ${errText}`);
    }

    const prediction = await createRes.json();
    res.json({ predictionId: prediction.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============ VIDEO GENERATSIYA: HOLATNI TEKSHIRISH ============
app.get("/api/generate-video/status/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
    });
    const prediction = await pollRes.json();

    if (prediction.status === "succeeded") {
      const videoUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      return res.json({ status: "succeeded", videoUrl });
    }
    if (prediction.status === "failed" || prediction.status === "canceled") {
      return res.json({ status: "failed", error: prediction.error || "Video yaratish muvaffaqiyatsiz tugadi" });
    }
    res.json({ status: prediction.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============ RASM GENERATSIYA: BOSHLASH ============
app.post("/api/generate-image/start", async (req, res) => {
  const { prompt, style, ratio, advanced } = req.body;

  if (!prompt || prompt.trim().length < 3) {
    return res.status(400).json({ error: "Prompt juda qisqa" });
  }
  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: "REPLICATE_API_TOKEN sozlanmagan (.env faylini tekshiring)" });
  }

  const translatedPrompt = await translateToEnglish(prompt);
  const fullPrompt = `${translatedPrompt}, ${style} style`;
  const aspectRatio = IMAGE_ASPECT_MAP[ratio] || "1:1";

  const input = {
    prompt: fullPrompt,
    aspect_ratio: aspectRatio,
    output_format: "png",
  };

  if (advanced && Number.isInteger(advanced.seed)) {
    input.seed = advanced.seed;
  }
  if (advanced && typeof advanced.guidance === "number" && advanced.guidance >= 0 && advanced.guidance <= 10) {
    input.guidance = advanced.guidance;
  }

  try {
    const createRes = await fetch("https://api.replicate.com/v1/models/" + IMAGE_MODEL_VERSION + "/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ input }),
    });

    if (!createRes.ok) {
      const errText = await createRes.text();
      throw new Error(`Replicate xatosi: ${errText}`);
    }

    const prediction = await createRes.json();
    res.json({ predictionId: prediction.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============ RASM GENERATSIYA: HOLATNI TEKSHIRISH ============
app.get("/api/generate-image/status/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
    });
    const prediction = await pollRes.json();

    if (prediction.status === "succeeded") {
      const imageUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      return res.json({ status: "succeeded", imageUrl });
    }
    if (prediction.status === "failed" || prediction.status === "canceled") {
      return res.json({ status: "failed", error: prediction.error || "Rasm yaratish muvaffaqiyatsiz tugadi" });
    }
    res.json({ status: prediction.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============ AI: PROMPTNI YAXSHILASH ============
app.post("/api/enhance-prompt", async (req, res) => {
  const { prompt, mediaType } = req.body;

  if (!prompt || prompt.trim().length < 2) {
    return res.status(400).json({ error: "Prompt juda qisqa" });
  }
  if (!ANTHROPIC_API_KEY) {
    return res.status(500).json({ error: "ANTHROPIC_API_KEY sozlanmagan" });
  }

  const kind = mediaType === "image" ? "image" : "video";

  const systemPrompt = `You are a professional prompt engineer for AI ${kind} generation (like Midjourney/Runway/Kling style). 
The user will give you a short idea, possibly in Uzbek, Russian, or English. 
Rewrite it into a single, vivid, detailed, professional English prompt suitable for cinematic AI ${kind} generation. 
Include visual details: lighting, camera angle/movement, mood, composition, quality descriptors. 
Keep it to 1-3 sentences, no explanations, no quotes, just the final prompt text in English.`;

  try {
    const claudeRes = await fetch("https://api.anthropic.com/v1/messages", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "x-api-key": ANTHROPIC_API_KEY,
        "anthropic-version": "2023-06-01",
      },
      body: JSON.stringify({
        model: "claude-sonnet-4-5-20250929",
        max_tokens: 300,
        system: systemPrompt,
        messages: [{ role: "user", content: prompt }],
      }),
    });

    if (!claudeRes.ok) {
      const errText = await claudeRes.text();
      throw new Error(`Claude API xatosi: ${errText}`);
    }

    const data = await claudeRes.json();
    const enhanced = data.content?.[0]?.text?.trim();

    if (!enhanced) throw new Error("Bo'sh javob qaytdi");

    res.json({ enhancedPrompt: enhanced });
  } catch (err) {
    console.error("Prompt yaxshilash xatosi:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============ CLICK: TO'LOV BOSHLASH ============
app.post("/api/click/create-order", async (req, res) => {
  const { planId, uid } = req.body;

  const plan = PLANS[planId];
  if (!plan) {
    return res.status(400).json({ error: "Noma'lum reja" });
  }
  if (!uid) {
    return res.status(400).json({ error: "Foydalanuvchi aniqlanmadi" });
  }

  const orderId = "order_" + Date.now() + "_" + Math.floor(Math.random() * 10000);

  const usdToUzs = 12700;
  let amountUzs = Math.round(plan.priceUsd * usdToUzs);

  // Referal orqali kelgan foydalanuvchilar uchun chegirma (faqat pro/max)
  let discountApplied = false;
  try {
    if (DISCOUNTABLE_PLANS.includes(planId)) {
      const userSnap = await db.collection("users").doc(uid).get();
      if (userSnap.exists) {
        const userData = userSnap.data();
        if (userData.referredBy === PARTNER_REFERRAL_ID) {
          amountUzs = Math.round(amountUzs * (1 - PARTNER_DISCOUNT_PERCENT / 100));
          discountApplied = true;
        }
      }
    }
  } catch (err) {
    console.error("Chegirmani tekshirishda xatolik:", err);
  }

  orders[orderId] = {
    uid,
    planId,
    credits: plan.credits,
    amount: amountUzs,
    status: "pending",
    discountApplied,
  };

  const returnUrl = process.env.FRONTEND_URL || "http://localhost:5177";
  const checkoutUrl = `https://my.click.uz/services/pay?service_id=${CLICK_SERVICE_ID}&merchant_id=${CLICK_MERCHANT_ID}&amount=${amountUzs}&transaction_param=${orderId}&return_url=${encodeURIComponent(returnUrl)}`;

  res.json({ checkoutUrl, orderId });
});

// ============ CLICK: PREPARE ============
app.post("/api/click/prepare", (req, res) => {
  const {
    click_trans_id,
    service_id,
    merchant_trans_id,
    amount,
    action,
    sign_time,
    sign_string,
  } = req.body;

  const signCheck = crypto
    .createHash("md5")
    .update(click_trans_id + service_id + CLICK_SECRET_KEY + merchant_trans_id + amount + action + sign_time)
    .digest("hex");

  if (signCheck !== sign_string) {
    return res.json({ error: -1, error_note: "Imzo noto'g'ri" });
  }

  const order = orders[merchant_trans_id];
  if (!order) {
    return res.json({ error: -5, error_note: "Buyurtma topilmadi" });
  }

  res.json({
    click_trans_id,
    merchant_trans_id,
    merchant_prepare_id: merchant_trans_id,
    error: 0,
    error_note: "Success",
  });
});

// ============ CLICK: COMPLETE ============
app.post("/api/click/complete", async (req, res) => {
  const {
    click_trans_id,
    service_id,
    merchant_trans_id,
    merchant_prepare_id,
    amount,
    action,
    sign_time,
    sign_string,
    error,
  } = req.body;

  const signCheck = crypto
    .createHash("md5")
    .update(
      click_trans_id + service_id + CLICK_SECRET_KEY + merchant_trans_id + merchant_prepare_id + amount + action + sign_time
    )
    .digest("hex");

  if (signCheck !== sign_string) {
    return res.json({ error: -1, error_note: "Imzo noto'g'ri" });
  }

  const order = orders[merchant_trans_id];
  if (!order) {
    return res.json({ error: -5, error_note: "Buyurtma topilmadi" });
  }

  if (Number(error) < 0) {
    order.status = "failed";
    return res.json({
      click_trans_id,
      merchant_trans_id,
      merchant_confirm_id: merchant_trans_id,
      error: 0,
      error_note: "Success",
    });
  }

  order.status = "paid";

  try {
    const userRef = db.collection("users").doc(order.uid);
    await userRef.set(
      {
        credits: FieldValue.increment(order.credits),
        plan: order.planId,
        lastPurchaseAt: new Date().toISOString(),
      },
      { merge: true }
    );

    await db.collection("purchases").add({
      uid: order.uid,
      planId: order.planId,
      credits: order.credits,
      amount: order.amount,
      orderId: merchant_trans_id,
      discountApplied: order.discountApplied || false,
      createdAt: new Date().toISOString(),
    });

    console.log(`To'lov muvaffaqiyatli: uid=${order.uid}, +${order.credits} kredit qo'shildi`);
  } catch (err) {
    console.error("Firestore yozishda xatolik:", err);
  }

  res.json({
    click_trans_id,
    merchant_trans_id,
    merchant_confirm_id: merchant_trans_id,
    error: 0,
    error_note: "Success",
  });
});

// ============ ADMIN: STATISTIKA VA FOYDALANUVCHILAR ============
app.get("/api/admin/data", async (req, res) => {
  const key = req.headers["x-admin-key"];
  if (!ADMIN_SECRET_KEY || key !== ADMIN_SECRET_KEY) {
    return res.status(401).json({ error: "Ruxsat yo'q" });
  }

  try {
    const usersSnap = await db.collection("users").get();
    const users = usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));

    const purchasesSnap = await db.collection("purchases").orderBy("createdAt", "desc").get();
    const purchases = purchasesSnap.docs.map((d) => ({ id: d.id, ...d.data() }));

    const totalUsers = users.length;
    const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);
    const totalPurchases = purchases.length;

    const planCounts = {};
    purchases.forEach((p) => {
      planCounts[p.planId] = (planCounts[p.planId] || 0) + 1;
    });

    res.json({
      stats: { totalUsers, totalRevenue, totalPurchases, planCounts },
      users,
      purchases,
    });
  } catch (err) {
    console.error("Admin data xatosi:", err);
    res.status(500).json({ error: err.message });
  }
});

// ============ HAMKOR: FAQAT O'ZI ORQALI KELGAN FOYDALANUVCHILAR ============
app.get("/api/partner/data", async (req, res) => {
  const key = req.headers["x-partner-key"];
  if (!PARTNER_SECRET_KEY || key !== PARTNER_SECRET_KEY) {
    return res.status(401).json({ error: "Ruxsat yo'q" });
  }

  try {
    const usersSnap = await db
      .collection("users")
      .where("referredBy", "==", PARTNER_REFERRAL_ID)
      .get();
    const users = usersSnap.docs.map((d) => ({ uid: d.id, ...d.data() }));

    const uidSet = new Set(users.map((u) => u.uid));

    const purchasesSnap = await db.collection("purchases").orderBy("createdAt", "desc").get();
    const purchases = purchasesSnap.docs
      .map((d) => ({ id: d.id, ...d.data() }))
      .filter((p) => uidSet.has(p.uid));

    const totalUsers = users.length;
    const totalPurchases = purchases.length;
    const totalRevenue = purchases.reduce((sum, p) => sum + (p.amount || 0), 0);

    res.json({
      stats: { totalUsers, totalPurchases, totalRevenue },
      users,
      purchases,
    });
  } catch (err) {
    console.error("Partner data xatosi:", err);
    res.status(500).json({ error: err.message });
  }
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server ${PORT}-portda ishlamoqda`));