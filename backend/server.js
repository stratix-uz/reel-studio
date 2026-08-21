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
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

const REPLICATE_API_TOKEN = process.env.REPLICATE_API_TOKEN;
const MODEL_VERSION = "kwaivgi/kling-v1.6-standard";

const CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID;
const CLICK_MERCHANT_ID = process.env.CLICK_MERCHANT_ID;
const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY;
const ADMIN_SECRET_KEY = process.env.ADMIN_SECRET_KEY;

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

// Vaqtinchalik xotirada saqlanadigan buyurtmalar
const orders = {};

// ============ VIDEO GENERATSIYA: BOSHLASH ============
app.post("/api/generate-video/start", async (req, res) => {
  const { prompt, style, duration, ratio } = req.body;

  if (!prompt || prompt.trim().length < 3) {
    return res.status(400).json({ error: "Prompt juda qisqa" });
  }
  if (!REPLICATE_API_TOKEN) {
    return res.status(500).json({ error: "REPLICATE_API_TOKEN sozlanmagan (.env faylini tekshiring)" });
  }

  const fullPrompt = `${prompt}, ${style} style`;

  try {
    const createRes = await fetch("https://api.replicate.com/v1/models/" + MODEL_VERSION + "/predictions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${REPLICATE_API_TOKEN}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        input: {
          prompt: fullPrompt,
          duration: parseInt(duration) || 6,
          aspect_ratio: ratio || "16:9",
        },
      }),
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

    // Sotuvlar tarixiga yozamiz (admin panel uchun)
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