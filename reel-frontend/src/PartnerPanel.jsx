import React, { useState, useEffect } from "react";
import { Loader2, Users, CreditCard, TrendingUp, RefreshCw, Lock } from "lucide-react";

const BACKEND_BASE = "https://reel-studio-production-b994.up.railway.app";

const PLAN_LABELS = {
  basic: "Asosiy",
  standard: "Standart",
  pro: "Pro",
  max: "Max",
};

function formatMoney(n) {
  return new Intl.NumberFormat("uz-UZ").format(n || 0) + " so'm";
}

function formatDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString("uz-UZ", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return iso;
  }
}

export default function PartnerPanel() {
  const [partnerKey, setPartnerKey] = useState(() => {
    try {
      return localStorage.getItem("reelstudio_partner_key") || "";
    } catch {
      return "";
    }
  });
  const [keyInput, setKeyInput] = useState("");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  function saveKey() {
    if (!keyInput.trim()) return;
    setPartnerKey(keyInput.trim());
    try {
      localStorage.setItem("reelstudio_partner_key", keyInput.trim());
    } catch {}
  }

  function handleLogout() {
    setPartnerKey("");
    setData(null);
    try {
      localStorage.removeItem("reelstudio_partner_key");
    } catch {}
  }

  async function fetchData() {
    if (!partnerKey) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_BASE}/api/partner/data`, {
        headers: { "x-partner-key": partnerKey },
      });
      if (res.status === 401) {
        setError("Noto'g'ri kalit.");
        setData(null);
        setLoading(false);
        return;
      }
      if (!res.ok) throw new Error("Server xatosi: " + res.status);
      const json = await res.json();
      setData(json);
    } catch (err) {
      setError(err.message);
    }
    setLoading(false);
  }

  useEffect(() => {
    if (partnerKey) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [partnerKey]);

  if (!partnerKey) {
    return (
      <div className="min-h-screen w-full bg-[#F7F7FA] flex items-center justify-center px-6">
        <div className="max-w-sm w-full">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6 bg-[#18181B]">
            <Lock size={24} className="text-white" />
          </div>
          <h1 className="text-[18px] text-[#18181B] mb-2 text-center">Hamkor kalitni kiriting</h1>
          <p className="text-[13px] text-[#71717A] mb-6 text-center">
            Sizga berilgan maxfiy kalitni kiriting
          </p>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && saveKey()}
            placeholder="Kalit"
            className="w-full bg-white border border-[#E4E4E7] rounded-lg px-4 py-3 text-[14px] outline-none focus:border-[#8B5CF6] mb-3"
          />
          <button
            onClick={saveKey}
            className="w-full py-3 rounded-lg text-[14px] font-medium text-white"
            style={{ background: "linear-gradient(135deg, #8B5CF6, #3B82F6)" }}
          >
            Kirish
          </button>
        </div>
      </div>
    );
  }

  const stats = data?.stats;
  const users = data?.users || [];
  const purchases = data?.purchases || [];

  return (
    <div className="min-h-screen w-full bg-[#F7F7FA] text-[#18181B]" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <header className="border-b border-[#E4E4E7] bg-white">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <h1 className="text-[18px] font-medium">Reel Studio — Hamkor paneli</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 text-[13px] text-[#71717A] border border-[#E4E4E7] rounded-lg px-3 py-1.5 hover:border-[#8B5CF6] transition-colors"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Yangilash
            </button>
            <button
              onClick={handleLogout}
              className="text-[13px] text-[#71717A] border border-[#E4E4E7] rounded-lg px-3 py-1.5 hover:border-[#8B5CF6] transition-colors"
            >
              Chiqish
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-8">
        {error && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-[14px]">
            {error}
          </div>
        )}

        {loading && !data ? (
          <div className="flex justify-center py-20">
            <Loader2 size={24} className="animate-spin text-[#A1A1AA]" />
          </div>
        ) : (
          <>
            <div className="grid sm:grid-cols-3 gap-4 mb-8">
              <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E4E4E7" }}>
                <div className="flex items-center gap-2 text-[#71717A] text-[12px] mb-2">
                  <Users size={14} /> Siz orqali kelgan foydalanuvchilar
                </div>
                <div className="text-[28px] font-medium">{stats?.totalUsers ?? 0}</div>
              </div>
              <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E4E4E7" }}>
                <div className="flex items-center gap-2 text-[#71717A] text-[12px] mb-2">
                  <CreditCard size={14} /> Ularning sotib olishlari
                </div>
                <div className="text-[28px] font-medium">{stats?.totalPurchases ?? 0}</div>
              </div>
              <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E4E4E7" }}>
                <div className="flex items-center gap-2 text-[#71717A] text-[12px] mb-2">
                  <TrendingUp size={14} /> Ularning jami tushumi
                </div>
                <div className="text-[24px] font-medium">{formatMoney(stats?.totalRevenue)}</div>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden mb-8" style={{ border: "1px solid #E4E4E7" }}>
              <div className="px-5 py-4 border-b border-[#E4E4E7]">
                <h3 className="text-[14px] font-medium">Foydalanuvchilar ({users.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-[#71717A] border-b border-[#E4E4E7]">
                      <th className="px-5 py-3 font-medium">Email</th>
                      <th className="px-5 py-3 font-medium">Ism</th>
                      <th className="px-5 py-3 font-medium">Kredit</th>
                      <th className="px-5 py-3 font-medium">Reja</th>
                      <th className="px-5 py-3 font-medium">Ro'yxatdan o'tdi</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.uid} className="border-b border-[#F0F0F3] last:border-0">
                        <td className="px-5 py-3">{u.email || "—"}</td>
                        <td className="px-5 py-3">{u.name || "—"}</td>
                        <td className="px-5 py-3 font-medium">{u.credits ?? 0}</td>
                        <td className="px-5 py-3">
                          {u.plan && u.plan !== "free" ? (
                            <span className="text-[11px] font-medium px-2 py-1 rounded-full" style={{ background: "rgba(139,92,246,0.1)", color: "#7C3AED" }}>
                              {PLAN_LABELS[u.plan] || u.plan}
                            </span>
                          ) : (
                            <span className="text-[#A1A1AA]">Bepul</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-[#71717A]">{formatDate(u.createdAt)}</td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={5} className="px-5 py-8 text-center text-[#A1A1AA]">
                          Hozircha siz orqali kelgan foydalanuvchi yo'q
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E4E4E7" }}>
              <div className="px-5 py-4 border-b border-[#E4E4E7]">
                <h3 className="text-[14px] font-medium">Sotib olishlar ({purchases.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-[#71717A] border-b border-[#E4E4E7]">
                      <th className="px-5 py-3 font-medium">Reja</th>
                      <th className="px-5 py-3 font-medium">Summa</th>
                      <th className="px-5 py-3 font-medium">Kredit</th>
                      <th className="px-5 py-3 font-medium">Sana</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p) => (
                      <tr key={p.id} className="border-b border-[#F0F0F3] last:border-0">
                        <td className="px-5 py-3">{PLAN_LABELS[p.planId] || p.planId}</td>
                        <td className="px-5 py-3 font-medium">{formatMoney(p.amount)}</td>
                        <td className="px-5 py-3">{p.credits}</td>
                        <td className="px-5 py-3 text-[#71717A]">{formatDate(p.createdAt)}</td>
                      </tr>
                    ))}
                    {purchases.length === 0 && (
                      <tr>
                        <td colSpan={4} className="px-5 py-8 text-center text-[#A1A1AA]">
                          Hozircha sotib olishlar yo'q
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </>
        )}
      </main>
    </div>
  );
}