import React, { useState, useEffect } from "react";
import { Loader2, Users, CreditCard, TrendingUp, LogOut, RefreshCw, Lock } from "lucide-react";
import { auth, googleProvider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";

const BACKEND_BASE = "https://reel-studio-production-b994.up.railway.app";

// Admin panelga kirish huquqiga ega email(lar)
const ADMIN_EMAILS = ["bekxamrayev2024@gmail.com"];

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

export default function AdminPanel() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);

  const [adminKey, setAdminKey] = useState(() => {
    try {
      return localStorage.getItem("reelstudio_admin_key") || "";
    } catch {
      return "";
    }
  });
  const [keyInput, setKeyInput] = useState("");

  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
    });
    return () => unsub();
  }, []);

  async function handleLogin() {
    setLoginLoading(true);
    try {
      await signInWithPopup(auth, googleProvider);
    } catch (err) {
      console.error(err);
    }
    setLoginLoading(false);
  }

  async function handleLogout() {
    await signOut(auth);
    setData(null);
  }

  function saveKey() {
    if (!keyInput.trim()) return;
    setAdminKey(keyInput.trim());
    try {
      localStorage.setItem("reelstudio_admin_key", keyInput.trim());
    } catch {}
  }

  async function fetchData() {
    if (!adminKey) return;
    setLoading(true);
    setError("");
    try {
      const res = await fetch(`${BACKEND_BASE}/api/admin/data`, {
        headers: { "x-admin-key": adminKey },
      });
      if (res.status === 401) {
        setError("Noto'g'ri admin kalit.");
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
    if (user && adminKey && ADMIN_EMAILS.includes(user.email)) {
      fetchData();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [user, adminKey]);

  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-[#F7F7FA] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#A1A1AA]" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="min-h-screen w-full bg-[#F7F7FA] flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6 bg-[#18181B]">
            <Lock size={24} className="text-white" />
          </div>
          <h1 className="text-[22px] tracking-tight mb-2 text-[#18181B]" style={{ fontFamily: "Georgia, serif" }}>
            Admin Panel
          </h1>
          <p className="text-[14px] text-[#71717A] mb-8">Reel Studio boshqaruv paneli</p>
          <button
            onClick={handleLogin}
            disabled={loginLoading}
            className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-[15px] font-medium bg-white border border-[#E4E4E7] hover:border-[#8B5CF6]/50 shadow-sm transition-colors"
          >
            {loginLoading ? <Loader2 size={18} className="animate-spin" /> : "Google orqali kirish"}
          </button>
        </div>
      </div>
    );
  }

  if (!ADMIN_EMAILS.includes(user.email)) {
    return (
      <div className="min-h-screen w-full bg-[#F7F7FA] flex items-center justify-center px-6">
        <div className="max-w-sm w-full text-center">
          <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6 bg-[#FEE2E2]">
            <Lock size={24} className="text-[#DC2626]" />
          </div>
          <h1 className="text-[18px] text-[#18181B] mb-2">Ruxsat yo'q</h1>
          <p className="text-[14px] text-[#71717A] mb-6">
            {user.email} admin panelga kirish huquqiga ega emas.
          </p>
          <button
            onClick={handleLogout}
            className="text-[13px] text-[#71717A] border border-[#E4E4E7] rounded-lg px-4 py-2 hover:border-[#8B5CF6] transition-colors"
          >
            Chiqish
          </button>
        </div>
      </div>
    );
  }

  if (!adminKey) {
    return (
      <div className="min-h-screen w-full bg-[#F7F7FA] flex items-center justify-center px-6">
        <div className="max-w-sm w-full">
          <h1 className="text-[18px] text-[#18181B] mb-2 text-center">Admin kalitni kiriting</h1>
          <p className="text-[13px] text-[#71717A] mb-6 text-center">
            Railway'dagi ADMIN_SECRET_KEY qiymatini kiriting
          </p>
          <input
            type="password"
            value={keyInput}
            onChange={(e) => setKeyInput(e.target.value)}
            placeholder="Admin kalit"
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
          <h1 className="text-[18px] font-medium">Reel Studio — Admin</h1>
          <div className="flex items-center gap-3">
            <button
              onClick={fetchData}
              disabled={loading}
              className="flex items-center gap-1.5 text-[13px] text-[#71717A] border border-[#E4E4E7] rounded-lg px-3 py-1.5 hover:border-[#8B5CF6] transition-colors"
            >
              <RefreshCw size={13} className={loading ? "animate-spin" : ""} />
              Yangilash
            </button>
            <button onClick={handleLogout} className="text-[#A1A1AA] hover:text-[#71717A] transition-colors" aria-label="Chiqish">
              <LogOut size={18} />
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
                  <Users size={14} /> Jami foydalanuvchilar
                </div>
                <div className="text-[28px] font-medium">{stats?.totalUsers ?? 0}</div>
              </div>
              <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E4E4E7" }}>
                <div className="flex items-center gap-2 text-[#71717A] text-[12px] mb-2">
                  <CreditCard size={14} /> Jami sotuvlar
                </div>
                <div className="text-[28px] font-medium">{stats?.totalPurchases ?? 0}</div>
              </div>
              <div className="bg-white rounded-xl p-5" style={{ border: "1px solid #E4E4E7" }}>
                <div className="flex items-center gap-2 text-[#71717A] text-[12px] mb-2">
                  <TrendingUp size={14} /> Jami tushum
                </div>
                <div className="text-[24px] font-medium">{formatMoney(stats?.totalRevenue)}</div>
              </div>
            </div>

            {stats?.planCounts && Object.keys(stats.planCounts).length > 0 && (
              <div className="bg-white rounded-xl p-5 mb-8" style={{ border: "1px solid #E4E4E7" }}>
                <h3 className="text-[13px] font-medium text-[#71717A] uppercase tracking-wide mb-4">
                  Rejalar bo'yicha sotuvlar
                </h3>
                <div className="flex flex-wrap gap-3">
                  {Object.entries(stats.planCounts).map(([plan, count]) => (
                    <div key={plan} className="flex items-center gap-2 bg-[#F7F7FA] rounded-lg px-3 py-2">
                      <span className="text-[13px] font-medium">{PLAN_LABELS[plan] || plan}</span>
                      <span className="text-[13px] text-[#7C3AED] font-medium">{count}</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

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
                      <th className="px-5 py-3 font-medium">Oxirgi to'lov</th>
                    </tr>
                  </thead>
                  <tbody>
                    {users.map((u) => (
                      <tr key={u.uid} className="border-b border-[#F0F0F3] last:border-0">
                        <td className="px-5 py-3">{u.email || "—"}</td>
                        <td className="px-5 py-3">{u.name || "—"}</td>
                        <td className="px-5 py-3 font-medium">{u.credits ?? 0}</td>
                        <td className="px-5 py-3">
                          {u.plan ? (
                            <span className="text-[11px] font-medium px-2 py-1 rounded-full" style={{ background: "rgba(139,92,246,0.1)", color: "#7C3AED" }}>
                              {PLAN_LABELS[u.plan] || u.plan}
                            </span>
                          ) : (
                            <span className="text-[#A1A1AA]">Bepul</span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-[#71717A]">{formatDate(u.createdAt)}</td>
                        <td className="px-5 py-3 text-[#71717A]">{formatDate(u.lastPurchaseAt)}</td>
                      </tr>
                    ))}
                    {users.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-[#A1A1AA]">
                          Hozircha foydalanuvchilar yo'q
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl overflow-hidden" style={{ border: "1px solid #E4E4E7" }}>
              <div className="px-5 py-4 border-b border-[#E4E4E7]">
                <h3 className="text-[14px] font-medium">Sotuvlar tarixi ({purchases.length})</h3>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-[13px]">
                  <thead>
                    <tr className="text-left text-[#71717A] border-b border-[#E4E4E7]">
                      <th className="px-5 py-3 font-medium">Buyurtma ID</th>
                      <th className="px-5 py-3 font-medium">UID</th>
                      <th className="px-5 py-3 font-medium">Reja</th>
                      <th className="px-5 py-3 font-medium">Summa</th>
                      <th className="px-5 py-3 font-medium">Kredit</th>
                      <th className="px-5 py-3 font-medium">Sana</th>
                    </tr>
                  </thead>
                  <tbody>
                    {purchases.map((p) => (
                      <tr key={p.id} className="border-b border-[#F0F0F3] last:border-0">
                        <td className="px-5 py-3 text-[#71717A] font-mono text-[11px]">{p.orderId}</td>
                        <td className="px-5 py-3 text-[#71717A] font-mono text-[11px]">{p.uid?.slice(0, 10)}...</td>
                        <td className="px-5 py-3">{PLAN_LABELS[p.planId] || p.planId}</td>
                        <td className="px-5 py-3 font-medium">{formatMoney(p.amount)}</td>
                        <td className="px-5 py-3">{p.credits}</td>
                        <td className="px-5 py-3 text-[#71717A]">{formatDate(p.createdAt)}</td>
                      </tr>
                    ))}
                    {purchases.length === 0 && (
                      <tr>
                        <td colSpan={6} className="px-5 py-8 text-center text-[#A1A1AA]">
                          Hozircha sotuvlar yo'q
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