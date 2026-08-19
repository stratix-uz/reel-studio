import React, { useState } from "react";
import { X, Check, Sparkles, Loader2 } from "lucide-react";

const BACKEND_URL = "https://reel-studio-production-b994.up.railway.app";

const PLANS = [
  {
    id: "basic",
    name: "Asosiy",
    price: "29.90",
    perCredit: "0.037",
    credits: "800",
    featured: false,
  },
  {
    id: "standard",
    name: "Standart",
    price: "49.90",
    perCredit: "0.031",
    credits: "1,600",
    featured: true,
  },
  {
    id: "pro",
    name: "Pro",
    price: "99.90",
    perCredit: "0.025",
    credits: "4,000",
    featured: false,
  },
  {
    id: "max",
    name: "Max",
    price: "199.90",
    perCredit: "0.020",
    credits: "10,000",
    featured: false,
  },
];

const FEATURES = [
  "Kinematik, anime, realistik va 3D uslublar",
  "16:9, 9:16 va 1:1 nisbatlar",
  "HD sifatda yuklab olish",
  "Cheksiz saqlanadigan galereya",
];

export default function Pricing({ onClose, uid }) {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState("");

  async function handleSelectPlan(plan) {
    setLoadingPlan(plan.id);
    setError("");
    try {
      const res = await fetch(`${BACKEND_URL}/api/click/create-order`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ planId: plan.id, uid }),
      });
      if (!res.ok) throw new Error("Buyurtma yaratilmadi");
      const data = await res.json();
      window.location.href = data.checkoutUrl;
    } catch (err) {
      setError("To'lov sahifasiga o'tib bo'lmadi. Backend ishlab turganini tekshiring.");
      setLoadingPlan(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-10 px-4"
      style={{ background: "rgba(10, 8, 6, 0.85)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-4xl bg-[#14110F] border border-[#2E2822] rounded-2xl"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-8 py-6 border-b border-[#2E2822]">
          <div>
            <h2 className="text-[22px] tracking-tight text-[#F2EDE6]" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              Narxlar
            </h2>
            <p className="text-[13px] text-[#8A8178] mt-1">
              Sizga eng mos tarifni tanlang. Barcha tariflar asosiy funksiyalarimizdan foydalanishni o'z ichiga oladi.
            </p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#6B635C] hover:text-[#B5AEA5] hover:bg-[#1A1613] transition-colors shrink-0"
            aria-label="Yopish"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {PLANS.map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl bg-[#1A1613] p-5 flex flex-col"
                style={{
                  border: plan.featured ? "2px solid #C9622C" : "1px solid #2E2822",
                }}
              >
                {plan.featured && (
                  <span
                    className="self-start text-[11px] font-medium px-2.5 py-1 rounded-full mb-3"
                    style={{ background: "#3A2718", color: "#E8A05A" }}
                  >
                    Eng ommabop
                  </span>
                )}
                <h3 className="text-[16px] text-[#F2EDE6] mb-1">{plan.name}</h3>
                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-[28px] text-[#F2EDE6] leading-none">${plan.price}</span>
                  <span className="text-[13px] text-[#6B635C]">/oy</span>
                </div>
                <p className="text-[12px] text-[#6B635C] mb-4">
                  Har bir kredit uchun ${plan.perCredit}
                </p>

                <div className="flex items-center gap-1.5 text-[13px] text-[#B5AEA5] mb-5 pb-5 border-b border-[#2E2822]">
                  <Sparkles size={13} className="text-[#C9622C]" />
                  {plan.credits} kredit / oy
                </div>

                <ul className="space-y-2.5 mb-6 flex-1">
                  {FEATURES.map((f) => (
                    <li key={f} className="flex items-start gap-2 text-[12.5px] text-[#8A8178]">
                      <Check size={14} className="text-[#5DCAA5] shrink-0 mt-0.5" />
                      {f}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={loadingPlan !== null}
                  className="w-full py-2.5 rounded-lg text-[14px] font-medium transition-colors flex items-center justify-center gap-2"
                  style={
                    plan.featured
                      ? { background: "#C9622C", color: "#14110F" }
                      : { background: "#221D19", color: "#F2EDE6", border: "1px solid #3A342F" }
                  }
                >
                  {loadingPlan === plan.id ? (
                    <React.Fragment>
                      <Loader2 size={14} className="animate-spin" />
                      Yuklanmoqda
                    </React.Fragment>
                  ) : (
                    "Tanlash"
                  )}
                </button>
              </div>
            ))}
          </div>

          {error && (
            <p className="text-[13px] text-[#E8917A] text-center mt-4">{error}</p>
          )}

          <p className="text-[12px] text-[#5C554E] text-center mt-6">
            To'lov Click orqali amalga oshiriladi. Istalgan vaqtda bekor qilishingiz mumkin.
          </p>
        </div>
      </div>
    </div>
  );
}