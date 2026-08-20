import React, { useState, useRef, useEffect } from "react";
import { Play, Download, Loader2, Sparkles, Clock, Ratio, Wand2, Clapperboard, LogOut, RefreshCw, Zap, Film } from "lucide-react";
import { auth, googleProvider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc } from "firebase/firestore";
import Pricing from "./Pricing";

const STYLES = [
  { id: "cinematic", label: "Kinematik" },
  { id: "anime", label: "Anime" },
  { id: "realistic", label: "Realistik" },
  { id: "3d", label: "3D animatsiya" },
];

const DURATIONS = ["5s", "10s"];
const RATIOS = ["16:9", "9:16", "1:1"];

const BACKEND_BASE = "https://reel-studio-production-b994.up.railway.app";

const INSPIRATION = [
  { label: "Kinematik", tag: "Sahro g'oliblari" },
  { label: "Mahsulot", tag: "Zamonaviy soat" },
  { label: "Anime", tag: "Tungi shahar" },
  { label: "Fashion", tag: "Podium yurishi" },
];

function BackgroundGlow() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full opacity-20 blur-[130px]" style={{ background: "#8B5CF6" }} />
      <div className="absolute -top-20 -right-20 w-[600px] h-[600px] rounded-full opacity-15 blur-[130px]" style={{ background: "#3B82F6" }} />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full opacity-10 blur-[130px]" style={{ background: "#EC4899" }} />
    </div>
  );
}

function Sprocket() {
  return (
    <div className="flex gap-2.5 justify-center py-2">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="w-1.5 h-1.5 rounded-[2px] bg-[#E4E4E7]" />
      ))}
    </div>
  );
}

function LoginScreen({ onLogin, loading }) {
  return (
    <div className="min-h-screen w-full bg-[#F7F7FA] text-[#18181B] flex items-center justify-center px-6 relative">
      <BackgroundGlow />
      <div className="max-w-sm w-full text-center relative">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
          <Clapperboard size={26} className="text-white" strokeWidth={2} />
        </div>
        <h1 className="text-[28px] tracking-tight mb-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          Reel Studio
        </h1>
        <p className="text-[14px] text-[#71717A] mb-8">Matndan videoga, bir necha soniyada</p>

        <button
          onClick={onLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-[15px] font-medium bg-white border border-[#E4E4E7] hover:border-[#8B5CF6]/50 shadow-sm transition-colors"
        >
          {loading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <svg width="18" height="18" viewBox="0 0 18 18">
              <path fill="#4285F4" d="M17.64 9.2c0-.64-.06-1.25-.16-1.84H9v3.48h4.84a4.14 4.14 0 0 1-1.8 2.72v2.26h2.92c1.7-1.57 2.68-3.88 2.68-6.62z"></path>
              <path fill="#34A853" d="M9 18c2.43 0 4.47-.8 5.96-2.18l-2.92-2.26c-.81.54-1.84.86-3.04.86-2.34 0-4.32-1.58-5.03-3.7H.96v2.33A9 9 0 0 0 9 18z"></path>
              <path fill="#FBBC05" d="M3.97 10.72A5.4 5.4 0 0 1 3.68 9c0-.6.1-1.18.29-1.72V4.95H.96A9 9 0 0 0 0 9c0 1.45.35 2.83.96 4.05l3.01-2.33z"></path>
              <path fill="#EA4335" d="M9 3.58c1.32 0 2.51.45 3.44 1.35l2.58-2.58C13.46.89 11.43 0 9 0A9 9 0 0 0 .96 4.95l3.01 2.33C4.68 5.16 6.66 3.58 9 3.58z"></path>
            </svg>
          )}
          Google orqali kirish
        </button>

        <p className="text-[12px] text-[#A1A1AA] mt-6">
          Ro'yxatdan o'tgan har bir kishiga <span className="text-[#71717A]">1 ta bepul video</span> beriladi
        </p>
      </div>
    </div>
  );
}

export default function App() {
  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [credits, setCredits] = useState(null);

  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("cinematic");
  const [duration, setDuration] = useState("5s");
  const [ratio, setRatio] = useState("16:9");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [gallery, setGallery] = useState([]);
  const [showPricing, setShowPricing] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          await setDoc(userRef, {
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            credits: 1,
            plan: "free",
            createdAt: new Date().toISOString(),
          });
          setCredits(1);
        } else {
          setCredits(snap.data().credits);
        }
      }
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
    setGallery([]);
    setCredits(null);
  }

  const canGenerate = prompt.trim().length > 3 && status !== "generating" && credits > 0;

  async function generateVideo() {
    setStatus("generating");
    setErrorMsg("");
    try {
      const startRes = await fetch(`${BACKEND_BASE}/api/generate-video/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, duration, ratio, uid: user.uid }),
      });
      if (!startRes.ok) throw new Error("Server xatosi: " + startRes.status);
      const startData = await startRes.json();
      if (!startData.predictionId) throw new Error("Video jarayoni boshlanmadi.");

      const predictionId = startData.predictionId;
      let videoUrl = null;

      while (!videoUrl) {
        await new Promise((r) => setTimeout(r, 4000));
        const pollRes = await fetch(`${BACKEND_BASE}/api/generate-video/status/${predictionId}`);
        if (!pollRes.ok) throw new Error("Holatni tekshirishda xatolik: " + pollRes.status);
        const pollData = await pollRes.json();

        if (pollData.status === "succeeded") {
          videoUrl = pollData.videoUrl;
        } else if (pollData.status === "failed") {
          throw new Error(pollData.error || "Video yaratish muvaffaqiyatsiz tugadi");
        }
      }

      const userRef = doc(db, "users", user.uid);
      const newCredits = Math.max(0, (credits ?? 1) - 1);
      await setDoc(userRef, { credits: newCredits }, { merge: true });
      setCredits(newCredits);

      setGallery((g) => [
        { id: Date.now(), url: videoUrl, prompt, style, duration, ratio },
        ...g,
      ]);
      setStatus("done");
    } catch (err) {
      setErrorMsg(
        err.message.includes("Failed to fetch")
          ? "Backendga ulanib bo'lmadi. BACKEND_URL sozlanganini va server ishga tushirilganini tekshiring."
          : err.message
      );
      setStatus("error");
    }
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    await generateVideo();
  }

  async function handleRegenerate(item) {
    if (status === "generating" || credits <= 0) return;
    setPrompt(item.prompt);
    setStyle(item.style);
    setDuration(item.duration);
    setRatio(item.ratio);
    await generateVideo();
  }

  const styleLabel = STYLES.find((s) => s.id === style)?.label ?? style;
  const latestVideo = gallery[0] || null;

  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-[#F7F7FA] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#A1A1AA]" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} loading={loginLoading} />;
  }

  return (
    <div className="min-h-screen w-full bg-[#F7F7FA] text-[#18181B] relative" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
        ::selection { background: #8B5CF6; color: #FFFFFF; }
        ::placeholder { color: #A1A1AA; }
      `}</style>

      <BackgroundGlow />

      <header className="border-b border-[#E4E4E7] relative bg-white/70 backdrop-blur-sm">
        <div className="max-w-6xl mx-auto px-6 py-5 flex items-center justify-between">
          <div className="flex items-center gap-8">
            <div className="flex items-center gap-2.5">
              <div className="w-9 h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
                <Clapperboard size={18} className="text-white" strokeWidth={2} />
              </div>
              <span className="text-[18px] tracking-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                Reel Studio
              </span>
            </div>
            <nav className="hidden md:flex items-center gap-6 text-[13px] text-[#71717A]">
              <span className="text-[#18181B] font-medium">Yaratish</span>
              <span className="hover:text-[#18181B] transition-colors cursor-pointer">Mening videolarim</span>
              <span className="hover:text-[#18181B] transition-colors cursor-pointer">Ilhom</span>
            </nav>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPricing(true)}
              className="hidden sm:flex items-center gap-1.5 text-[12px] font-medium rounded-full px-3 py-1.5 transition-colors"
              style={{ background: "rgba(249,115,22,0.08)", color: "#EA580C", border: "1px solid rgba(249,115,22,0.25)" }}
            >
              <Sparkles size={12} />
              {credits ?? 0} kredit
            </button>
            <button
              onClick={() => setShowPricing(true)}
              className="text-[13px] text-[#71717A] border border-transparent hover:border-[#8B5CF6] hover:text-[#7C3AED] rounded-full px-3 py-1.5 transition-colors"
            >
              Tariflar
            </button>
            {user.photoURL && <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-[#E4E4E7]" />}
            <button onClick={handleLogout} className="text-[#A1A1AA] hover:text-[#71717A] transition-colors" aria-label="Chiqish">
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-6xl mx-auto px-6 py-14 relative">
        <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-10 items-start">
          <div>
            <h1
              className="text-[34px] sm:text-[44px] leading-[1.1] tracking-tight mb-4"
              style={{
                fontFamily: "Georgia, 'Times New Roman', serif",
                background: "linear-gradient(135deg, #18181B, #7C3AED 60%, #2563EB)",
                WebkitBackgroundClip: "text",
                WebkitTextFillColor: "transparent",
                backgroundClip: "text",
              }}
            >
              Tasavvuringizni videoga aylantiring
            </h1>
            <p className="text-[15px] text-[#71717A] mb-8 max-w-md">
              Birgina g'oyadan professional, kinematik AI video yarating.
            </p>

            <div
              className="rounded-2xl overflow-hidden bg-white"
              style={{
                border: "1px solid #E4E4E7",
                boxShadow: "0 4px 30px rgba(139,92,246,.08)",
              }}
            >
              <div className="px-6 pt-6 pb-2">
                <label className="flex items-center gap-2 text-[12px] font-medium tracking-[0.08em] uppercase mb-3" style={{ color: "#7C3AED" }}>
                  <Sparkles size={13} strokeWidth={2.5} />
                  Sahnani tasvirlang
                </label>
                <textarea
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="Masalan: quyosh botayotganda cho'lda yurayotgan tuya, kinematik yorug'lik, sekin harakat, oltin rang..."
                  rows={5}
                  className="w-full bg-transparent text-[15px] leading-relaxed outline-none resize-none min-h-[110px] text-[#18181B]"
                />
              </div>

              <div className="border-t border-[#E4E4E7] px-6 py-5 grid grid-cols-3 gap-3">
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] text-[#71717A] mb-2 tracking-wide">
                    <Wand2 size={12} /> STIL
                  </label>
                  <select
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full bg-[#F7F7FA] border border-[#E4E4E7] rounded-lg px-2.5 py-2.5 text-[13px] outline-none focus:border-[#8B5CF6] transition-colors cursor-pointer text-[#18181B]"
                  >
                    {STYLES.map((s) => (
                      <option key={s.id} value={s.id}>{s.label}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] text-[#71717A] mb-2 tracking-wide">
                    <Clock size={12} /> VAQT
                  </label>
                  <select
                    value={duration}
                    onChange={(e) => setDuration(e.target.value)}
                    className="w-full bg-[#F7F7FA] border border-[#E4E4E7] rounded-lg px-2.5 py-2.5 text-[13px] outline-none focus:border-[#8B5CF6] transition-colors cursor-pointer text-[#18181B]"
                  >
                    {DURATIONS.map((d) => (
                      <option key={d} value={d}>{d}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label className="flex items-center gap-1.5 text-[11px] text-[#71717A] mb-2 tracking-wide">
                    <Ratio size={12} /> NISBAT
                  </label>
                  <select
                    value={ratio}
                    onChange={(e) => setRatio(e.target.value)}
                    className="w-full bg-[#F7F7FA] border border-[#E4E4E7] rounded-lg px-2.5 py-2.5 text-[13px] outline-none focus:border-[#8B5CF6] transition-colors cursor-pointer text-[#18181B]"
                  >
                    {RATIOS.map((r) => (
                      <option key={r} value={r}>{r}</option>
                    ))}
                  </select>
                </div>
              </div>
            </div>

            {credits === 0 && (
              <div className="mt-4 px-4 py-3 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-[14px] flex items-center justify-between gap-4">
                <span>Bepul videongiz tugadi.</span>
                <button
                  onClick={() => setShowPricing(true)}
                  className="shrink-0 text-[13px] font-medium px-3 py-1.5 rounded-lg bg-[#FDE68A] text-[#78350F] hover:bg-[#FCD34D] transition-colors"
                >
                  Tariflarni ko'rish
                </button>
              </div>
            )}

            <button
              onClick={handleGenerate}
              disabled={!canGenerate}
              className="w-full mt-4 flex items-center justify-center gap-2.5 py-4 rounded-xl text-[16px] font-semibold transition-all active:scale-[0.99]"
              style={
                canGenerate
                  ? {
                      background: "linear-gradient(135deg, #8B5CF6, #3B82F6)",
                      color: "#FFFFFF",
                      boxShadow: "0 8px 30px rgba(139,92,246,.25)",
                      border: "none",
                      cursor: "pointer",
                    }
                  : { background: "#F0F0F3", color: "#A1A1AA", border: "1px solid #E4E4E7", cursor: "not-allowed" }
              }
            >
              {status === "generating" ? (
                <React.Fragment>
                  <Loader2 size={19} className="animate-spin" />
                  Video yaratilmoqda
                </React.Fragment>
              ) : (
                <React.Fragment>
                  <Zap size={19} />
                  Video yaratish
                </React.Fragment>
              )}
            </button>

            {status === "error" && (
              <div className="mt-4 px-4 py-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-[14px]">
                {errorMsg}
              </div>
            )}
          </div>

          <div className="lg:sticky lg:top-8">
            <div
              className="rounded-2xl overflow-hidden aspect-[9/13] flex items-center justify-center relative"
              style={{
                border: "1px solid #E4E4E7",
                background: "linear-gradient(160deg, rgba(139,92,246,.10), rgba(59,130,246,.08) 50%, rgba(236,72,153,.08))",
              }}
            >
              {status === "generating" ? (
                <div className="text-center px-6">
                  <div className="flex gap-1.5 justify-center mb-4">
                    <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" style={{ animation: "pulse-dot 1.2s ease-in-out infinite" }} />
                    <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" style={{ animation: "pulse-dot 1.2s ease-in-out infinite 0.2s" }} />
                    <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" style={{ animation: "pulse-dot 1.2s ease-in-out infinite 0.4s" }} />
                  </div>
                  <p className="text-[14px] text-[#71717A]">{styleLabel} uslubida video yaratilmoqda</p>
                  <p className="text-[12px] text-[#A1A1AA] mt-2">Bu odatda 1-3 daqiqa vaqt oladi</p>
                </div>
              ) : latestVideo ? (
                <video src={latestVideo.url} controls className="w-full h-full object-cover" />
              ) : (
                <div className="text-center px-6">
                  <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-white" style={{ border: "1px solid #E4E4E7" }}>
                    <Film size={22} className="text-[#7C3AED]" />
                  </div>
                  <p className="text-[14px] text-[#18181B] font-medium mb-1">Video shu yerda ko'rinadi</p>
                  <p className="text-[12px] text-[#A1A1AA]">Chapdagi maydonga tasvir yozib boshlang</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {gallery.length > 1 && (
          <div className="mt-16">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-[13px] font-medium text-[#71717A] tracking-[0.06em] uppercase">Oldingi videolar</h2>
              <div className="flex-1 h-px bg-[#E4E4E7]" />
              <span className="text-[12px] text-[#A1A1AA]">{gallery.length - 1}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {gallery.slice(1).map((item) => (
                <div
                  key={item.id}
                  className="rounded-xl overflow-hidden bg-white"
                  style={{ border: "1px solid #E4E4E7" }}
                >
                  <video src={item.url} controls className="w-full block bg-black" style={{ maxHeight: 320 }} />
                  <div className="px-4 py-3.5">
                    <p className="text-[13px] text-[#71717A] truncate mb-1">{item.prompt}</p>
                    <p className="text-[11px] text-[#A1A1AA] mb-3">
                      {STYLES.find((s) => s.id === item.style)?.label} · {item.duration} · {item.ratio}
                    </p>
                    <div className="flex items-center gap-2">
                      
                        href={item.url}
                        download
                        className="flex items-center gap-1.5 text-[12px] font-medium text-[#18181B] bg-[#F7F7FA] border border-[#E4E4E7] rounded-lg px-2.5 py-1.5 hover:border-[#8B5CF6] hover:text-[#7C3AED] transition-colors"
                      >
                        <Download size={13} /> Yuklab olish
                      </a>
                      <button
                        onClick={() => handleRegenerate(item)}
                        disabled={status === "generating" || credits <= 0}
                        className="flex items-center gap-1.5 text-[12px] font-medium text-[#18181B] bg-[#F7F7FA] border border-[#E4E4E7] rounded-lg px-2.5 py-1.5 hover:border-[#8B5CF6] hover:text-[#7C3AED] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
                      >
                        <RefreshCw size={13} /> Qayta yaratish
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {gallery.length === 0 && status === "idle" && (
          <div className="mt-20">
            <div className="text-center mb-8">
              <h2 className="text-[13px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: "#7C3AED" }}>
                ✦ Ilhom oling
              </h2>
              <p className="text-[14px] text-[#A1A1AA]">AI yordamida yaratilgan kinematik videolar</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              {INSPIRATION.map((item, i) => (
                <div
                  key={i}
                  className="rounded-xl overflow-hidden aspect-[3/4] flex items-end p-3 relative group cursor-pointer"
                  style={{
                    border: "1px solid #E4E4E7",
                    background: `linear-gradient(160deg, rgba(139,92,246,.12), rgba(59,130,246,.08) 50%, rgba(236,72,153,.10))`,
                  }}
                >
                  <div className="relative z-10">
                    <p className="text-[13px] font-medium text-[#18181B]">{item.tag}</p>
                    <p className="text-[11px] text-[#71717A]">{item.label}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </main>

      {showPricing && <Pricing onClose={() => setShowPricing(false)} uid={user.uid} />}
    </div>
  );
}