import React, { useState } from "react";
import { X, Check, Sparkles, Loader2 } from "lucide-react";

const BACKEND_URL = "https://reel-studio-production-b994.up.railway.app";
const USD_TO_UZS = 12700;

const PLAN_META = [
  { id: "small", nameKey: "planSmall", priceUzs: 35700, credits: "10", featured: false },
  { id: "basic", nameKey: "planBasic", priceUzs: Math.round(29.9 * USD_TO_UZS), credits: "800", featured: false },
  { id: "standard", nameKey: "planStandard", priceUzs: Math.round(49.9 * USD_TO_UZS), credits: "1,600", featured: true },
  { id: "pro", nameKey: "planPro", priceUzs: Math.round(99.9 * USD_TO_UZS), credits: "4,000", featured: false },
  { id: "max", nameKey: "planMax", priceUzs: Math.round(199.9 * USD_TO_UZS), credits: "10,000", featured: false },
];

const FEATURE_KEYS = ["featurePlan1", "featurePlan2", "featurePlan3", "featurePlan4"];

function formatUzs(n) {
  return new Intl.NumberFormat("uz-UZ").format(n) + " so'm";
}

export default function Pricing({ onClose, uid, t }) {
  const [loadingPlan, setLoadingPlan] = useState(null);
  const [error, setError] = useState("");

  const translate = t || ((key) => key);

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
      setError(translate("orderError"));
      setLoadingPlan(null);
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto py-4 sm:py-10 px-3 sm:px-4"
      style={{ background: "rgba(24, 24, 27, 0.45)", backdropFilter: "blur(2px)" }}
      onClick={onClose}
    >
      <div
        className="w-full max-w-5xl bg-white rounded-2xl my-auto sm:my-0"
        style={{ border: "1px solid #E4E4E7", boxShadow: "0 20px 60px rgba(0,0,0,.15)" }}
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between px-5 sm:px-8 py-5 sm:py-6 border-b border-[#E4E4E7]">
          <div className="pr-3">
            <h2
              className="text-[19px] sm:text-[22px] tracking-tight text-[#18181B]"
              style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}
            >
              {translate("pricingTitle")}
            </h2>
            <p className="text-[12px] sm:text-[13px] text-[#71717A] mt-1 max-w-md">{translate("pricingSubtitle")}</p>
          </div>
          <button
            onClick={onClose}
            className="w-8 h-8 rounded-lg flex items-center justify-center text-[#A1A1AA] hover:text-[#71717A] hover:bg-[#F7F7FA] transition-colors shrink-0"
            aria-label={translate("close")}
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 sm:p-8">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-3 sm:gap-4">
            {PLAN_META.map((plan) => (
              <div
                key={plan.id}
                className="rounded-xl bg-[#F7F7FA] p-4 sm:p-5 flex flex-col"
                style={{
                  border: plan.featured ? "2px solid #8B5CF6" : "1px solid #E4E4E7",
                  boxShadow: plan.featured ? "0 8px 24px rgba(139,92,246,.15)" : "none",
                }}
              >
                {plan.featured && (
                  <span
                    className="self-start text-[11px] font-medium px-2.5 py-1 rounded-full mb-3"
                    style={{ background: "rgba(139,92,246,0.1)", color: "#7C3AED" }}
                  >
                    {translate("mostPopular")}
                  </span>
                )}
                <h3 className="text-[15px] sm:text-[16px] text-[#18181B] mb-1">{translate(plan.nameKey)}</h3>

                <div className="flex items-baseline gap-1 mb-1">
                  <span className="text-[20px] sm:text-[22px] text-[#18181B] leading-none">{formatUzs(plan.priceUzs)}</span>
                </div>
                <p className="text-[11px] sm:text-[12px] text-[#A1A1AA] mb-4">
                  {translate("perCredit")} {formatUzs(Math.round(plan.priceUzs / parseInt(plan.credits.replace(/,/g, ""))))}
                </p>

                <div className="flex items-center gap-1.5 text-[12px] sm:text-[13px] text-[#71717A] mb-4 sm:mb-5 pb-4 sm:pb-5 border-b border-[#E4E4E7]">
                  <Sparkles size={13} className="text-[#7C3AED]" />
                  {plan.credits} {translate("creditsPerMonth")}
                </div>

                <ul className="space-y-2 sm:space-y-2.5 mb-5 sm:mb-6 flex-1">
                  {FEATURE_KEYS.map((fKey) => (
                    <li key={fKey} className="flex items-start gap-2 text-[12px] sm:text-[12.5px] text-[#71717A]">
                      <Check size={14} className="text-[#22C55E] shrink-0 mt-0.5" />
                      {translate(fKey)}
                    </li>
                  ))}
                </ul>

                <button
                  onClick={() => handleSelectPlan(plan)}
                  disabled={loadingPlan !== null}
                  className="w-full py-2.5 rounded-lg text-[14px] font-medium transition-colors flex items-center justify-center gap-2 disabled:opacity-60 active:scale-[0.98]"
                  style={
                    plan.featured
                      ? { background: "linear-gradient(135deg, #8B5CF6, #3B82F6)", color: "#FFFFFF" }
                      : { background: "#FFFFFF", color: "#18181B", border: "1px solid #E4E4E7" }
                  }
                >
                  {loadingPlan === plan.id ? (
                    <React.Fragment>
                      <Loader2 size={14} className="animate-spin" />
                      {translate("loading")}
                    </React.Fragment>
                  ) : (
                    translate("selectPlan")
                  )}
                </button>
              </div>
            ))}
          </div>

          {error && <p className="text-[13px] text-[#DC2626] text-center mt-4">{error}</p>}

          <p className="text-[11px] sm:text-[12px] text-[#A1A1AA] text-center mt-5 sm:mt-6">{translate("paymentNote")}</p>
        </div>
      </div>
    </div>
  );
}