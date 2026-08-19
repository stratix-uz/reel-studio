// Bu skript Click serverining so'rovlarini simulyatsiya qiladi (pul ishtirokisiz)
// Ishlatish: backend papkasida `node test-click.js` buyrug'ini bering
// Server (node server.js) alohida terminalda ishlab turishi kerak

require("dotenv").config();
const crypto = require("crypto");
const fetch = require("node-fetch");

const BASE_URL = "http://localhost:3001";
const CLICK_SERVICE_ID = process.env.CLICK_SERVICE_ID;
const CLICK_SECRET_KEY = process.env.CLICK_SECRET_KEY;

// Test qilinayotgan foydalanuvchi UID (Firestore'dagi haqiqiy foydalanuvchi UID'ini shu yerga yozing)
const TEST_UID = "dhBxpDlQSaOSNnSsfXsLp3BVSzB3";

async function main() {
  console.log("1) Buyurtma yaratilmoqda...");
  const createRes = await fetch(`${BASE_URL}/api/click/create-order`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId: "basic", uid: TEST_UID }),
  });
  const createData = await createRes.json();
  console.log("Buyurtma yaratildi:", createData);

  const orderId = createData.orderId;
  const amountMatch = createData.checkoutUrl.match(/amount=(\d+)/);
  const amount = amountMatch[1];

  const clickTransId = "test_trans_" + Date.now();
  const signTime = new Date().toISOString().slice(0, 19).replace("T", " ");

  console.log("\n2) Prepare so'rovi yuborilmoqda...");
  const prepareSign = crypto
    .createHash("md5")
    .update(clickTransId + CLICK_SERVICE_ID + CLICK_SECRET_KEY + orderId + amount + "0" + signTime)
    .digest("hex");

  const prepareRes = await fetch(`${BASE_URL}/api/click/prepare`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      click_trans_id: clickTransId,
      service_id: CLICK_SERVICE_ID,
      merchant_trans_id: orderId,
      amount: amount,
      action: "0",
      sign_time: signTime,
      sign_string: prepareSign,
    }),
  });
  const prepareData = await prepareRes.json();
  console.log("Prepare javobi:", prepareData);

  if (prepareData.error !== 0) {
    console.log("\n❌ Prepare bosqichida xatolik. To'xtatildi.");
    return;
  }

  console.log("\n3) Complete so'rovi yuborilmoqda...");
  const completeSign = crypto
    .createHash("md5")
    .update(
      clickTransId + CLICK_SERVICE_ID + CLICK_SECRET_KEY + orderId + prepareData.merchant_prepare_id + amount + "1" + signTime
    )
    .digest("hex");

  const completeRes = await fetch(`${BASE_URL}/api/click/complete`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      click_trans_id: clickTransId,
      service_id: CLICK_SERVICE_ID,
      merchant_trans_id: orderId,
      merchant_prepare_id: prepareData.merchant_prepare_id,
      amount: amount,
      action: "1",
      sign_time: signTime,
      sign_string: completeSign,
      error: 0,
    }),
  });
  const completeData = await completeRes.json();
  console.log("Complete javobi:", completeData);

  if (completeData.error === 0) {
    console.log("\n✅ Test muvaffaqiyatli! Firestore'da foydalanuvchi krediti oshgan bo'lishi kerak.");
    console.log(`Firebase Console'da users/${TEST_UID} hujjatini tekshiring.`);
  } else {
    console.log("\n❌ Complete bosqichida xatolik.");
  }
}

main().catch((err) => console.error("Test xatosi:", err));