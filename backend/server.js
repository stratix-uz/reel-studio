require("dotenv").config();
const express = require("express");
const cors = require("cors");
const fetch = require("node-fetch");
const crypto = require("crypto");
const { initializeApp, cert } = require("firebase-admin/app");
const { getFirestore, FieldValue } = require("firebase-admin/firestore");
const serviceAccount = require("./serviceAccountKey.json");

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

// Tariflar: reja nomi -> narx (so'mda) va beriladigan kredit soni
// Diqqat: bu yerdagi kreditlar bizning ilovamizning "video krediti", Click to'lov summasi UZS'da
const PLANS = {
  basic: { priceUsd: 29.9, credits: 10 },
  standard: { priceUsd: 49.9, credits: 20 },
  pro: { priceUsd: 99.9, credits: 45 },
  max: { priceUsd: 199.9, credits: 100 },
};

// Vaqtinchalik xotirada saqlanadigan buyurtmalar (production'da Firestore ishlatiladi)
const orders = {};

// ============ VIDEO GENERATSIYA (avvalgi kod) ============
app.post("/api/generate-video", async (req, res) => {
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

    let prediction = await createRes.json();
    const pollUrl = prediction.urls.get;
    while (prediction.status !== "succeeded" && prediction.status !== "failed" && prediction.status !== "canceled") {
      await new Promise((r) => setTimeout(r, 3000));
      const pollRes = await fetch(pollUrl, {
        headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
      });
      prediction = await pollRes.json();
    }

    if (prediction.status !== "succeeded") {
      throw new Error("Video generatsiya muvaffaqiyatsiz tugadi: " + prediction.status);
    }

    const videoUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
    res.json({ videoUrl });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============ CLICK: TO'LOV BOSHLASH ============
// Frontend bu endpointni chaqirib, Click checkout URL'ini oladi
app.post("/api/click/create-order", (req, res) => {
  const { planId, uid } = req.body;

  const plan = PLANS[planId];
  if (!plan) {
    return res.status(400).json({ error: "Noma'lum reja" });
  }
  if (!uid) {
    return res.status(400).json({ error: "Foydalanuvchi aniqlanmadi" });
  }

  // Buyurtma raqami yaratamiz
  const orderId = "order_" + Date.now() + "_" + Math.floor(Math.random() * 10000);

  // Narxni USD dan UZS ga taxminiy aylantirish (haqiqiy kursni API orqali olish tavsiya etiladi)
  const usdToUzs = 12700;
  const amountUzs = Math.round(plan.priceUsd * usdToUzs);

  orders[orderId] = {
    uid,
    planId,
    credits: plan.credits,
    amount: amountUzs,
    status: "pending",
  };

  const returnUrl = "http://localhost:5177";
  const checkoutUrl = `https://my.click.uz/services/pay?service_id=${CLICK_SERVICE_ID}&merchant_id=${CLICK_MERCHANT_ID}&amount=${amountUzs}&transaction_param=${orderId}&return_url=${encodeURIComponent(returnUrl)}`;

  res.json({ checkoutUrl, orderId });
});

// ============ CLICK: PREPARE ============
// Click serveri to'lov boshlanishini tasdiqlash uchun bu endpointga so'rov yuboradi
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
// To'lov muvaffaqiyatli yakunlangach, Click bu endpointga so'rov yuboradi
// Shu yerda foydalanuvchi kreditini oshiramiz
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
      { credits: FieldValue.increment(order.credits) },
      { merge: true }
    );
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

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => console.log(`Server ${PORT}-portda ishlamoqda`));