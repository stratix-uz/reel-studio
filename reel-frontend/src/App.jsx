import React, { useState, useRef, useEffect } from "react";
import { Film, Play, Download, Loader2, Sparkles, Clock, Ratio, Wand2, Clapperboard, LogOut } from "lucide-react";
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

const DURATIONS = ["4s", "6s", "10s"];
const RATIOS = ["16:9", "9:16", "1:1"];

const BACKEND_URL = "https://reel-studio-production-b994.up.railway.app/api/generate-video";

function Sprocket() {
  return (
    <div className="flex gap-2.5 justify-center py-2">
      {Array.from({ length: 14 }).map((_, i) => (
        <div key={i} className="w-1.5 h-1.5 rounded-[2px] bg-[#3A342F]" />
      ))}
    </div>
  );
}

function LoginScreen({ onLogin, loading }) {
  return (
    <div className="min-h-screen w-full bg-[#14110F] text-[#F2EDE6] flex items-center justify-center px-6">
      <div className="max-w-sm w-full text-center">
        <div className="w-14 h-14 rounded-xl bg-[#C9622C] flex items-center justify-center mx-auto mb-6">
          <Clapperboard size={26} className="text-[#14110F]" strokeWidth={2} />
        </div>
        <h1 className="text-[28px] tracking-tight mb-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          Reel Studio
        </h1>
        <p className="text-[14px] text-[#8A8178] mb-8">Matndan videoga, bir necha soniyada</p>

        <button
          onClick={onLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-[15px] font-medium bg-[#1A1613] border border-[#2E2822] hover:border-[#3A342F] transition-colors"
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

        <p className="text-[12px] text-[#5C554E] mt-6">
          Ro'yxatdan o'tgan har bir kishiga <span className="text-[#8A8178]">1 ta bepul video</span> beriladi
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
  const [duration, setDuration] = useState("6s");
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

  async function handleGenerate() {
    if (!canGenerate) return;
    setStatus("generating");
    setErrorMsg("");
    try {
      const controller = new AbortController();
      abortRef.current = controller;
      const res = await fetch(BACKEND_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, duration, ratio, uid: user.uid }),
        signal: controller.signal,
      });
      if (!res.ok) throw new Error("Server xatosi: " + res.status);
      const data = await res.json();
      if (!data.videoUrl) throw new Error("Video URL topilmadi. Backend javobini tekshiring.");

      const userRef = doc(db, "users", user.uid);
      const newCredits = Math.max(0, (credits ?? 1) - 1);
      await setDoc(userRef, { credits: newCredits }, { merge: true });
      setCredits(newCredits);

      setGallery((g) => [
        { id: Date.now(), url: data.videoUrl, prompt, style, duration, ratio },
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

  const styleLabel = STYLES.find((s) => s.id === style)?.label ?? style;

  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-[#14110F] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#5C554E]" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} loading={loginLoading} />;
  }

  return (
    <div className="min-h-screen w-full bg-[#14110F] text-[#F2EDE6]" style={{ fontFamily: "'Segoe UI', system-ui, sans-serif" }}>
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        @keyframes pulse-dot { 0%, 100% { opacity: 0.25; } 50% { opacity: 1; } }
        ::selection { background: #C9622C; color: #14110F; }
        ::placeholder { color: #5C554E; }
        textarea, select { color-scheme: dark; }
      `}</style>

      <header className="border-b border-[#26211D]">
        <div className="max-w-3xl mx-auto px-6 py-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-lg bg-[#C9622C] flex items-center justify-center shrink-0">
              <Clapperboard size={20} className="text-[#14110F]" strokeWidth={2} />
            </div>
            <div>
              <h1 className="text-[22px] leading-none tracking-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                Reel Studio
              </h1>
              <p className="text-[13px] text-[#8A8178] mt-1.5">Matndan videoga, bir necha soniyada</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setShowPricing(true)}
              className="hidden sm:flex items-center gap-1.5 text-[12px] text-[#B5AEA5] border border-[#2E2822] rounded-full px-3 py-1.5 hover:border-[#3A342F] transition-colors"
            >
              <Sparkles size={12} className="text-[#C9622C]" />
              {credits ?? 0} kredit
            </button>
            <button
              onClick={() => setShowPricing(true)}
              className="text-[13px] text-[#8A8178] hover:text-[#B5AEA5] transition-colors"
            >
              Tariflar
            </button>
            {user.photoURL && (
              <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-[#2E2822]" />
            )}
            <button
              onClick={handleLogout}
              className="text-[#6B635C] hover:text-[#B5AEA5] transition-colors"
              aria-label="Chiqish"
            >
              <LogOut size={18} />
            </button>
          </div>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-12">
        <div className="border border-[#2E2822] rounded-2xl bg-[#1A1613] overflow-hidden">
          <div className="px-6 pt-6 pb-2">
            <label className="flex items-center gap-2 text-[12px] font-medium text-[#C9622C] tracking-[0.08em] uppercase mb-3">
              <Sparkles size={13} strokeWidth={2.5} />
              Sahnani tasvirlang
            </label>
            <textarea
              value={prompt}
              onChange={(e) => setPrompt(e.target.value)}
              placeholder="Masalan: quyosh botayotganda cho'lda yurayotgan tuya, kinematik yorug'lik, sekin harakat, oltin rang..."
              rows={4}
              className="w-full bg-transparent text-[16px] leading-relaxed outline-none resize-none"
            />
          </div>

          <div className="border-t border-[#2E2822] px-6 py-5 grid grid-cols-3 gap-4">
            <div>
              <label className="flex items-center gap-1.5 text-[11px] text-[#8A8178] mb-2 tracking-wide">
                <Wand2 size={12} /> STIL
              </label>
              <select
                value={style}
                onChange={(e) => setStyle(e.target.value)}
                className="w-full bg-[#221D19] border border-[#3A342F] rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-[#C9622C] transition-colors cursor-pointer"
              >
                {STYLES.map((s) => (
                  <option key={s.id} value={s.id}>{s.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[11px] text-[#8A8178] mb-2 tracking-wide">
                <Clock size={12} /> DAVOMIYLIK
              </label>
              <select
                value={duration}
                onChange={(e) => setDuration(e.target.value)}
                className="w-full bg-[#221D19] border border-[#3A342F] rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-[#C9622C] transition-colors cursor-pointer"
              >
                {DURATIONS.map((d) => (
                  <option key={d} value={d}>{d}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="flex items-center gap-1.5 text-[11px] text-[#8A8178] mb-2 tracking-wide">
                <Ratio size={12} /> NISBAT
              </label>
              <select
                value={ratio}
                onChange={(e) => setRatio(e.target.value)}
                className="w-full bg-[#221D19] border border-[#3A342F] rounded-lg px-3 py-2.5 text-[14px] outline-none focus:border-[#C9622C] transition-colors cursor-pointer"
              >
                {RATIOS.map((r) => (
                  <option key={r} value={r}>{r}</option>
                ))}
              </select>
            </div>
          </div>
        </div>

        {credits === 0 && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-[#2B2112] border border-[#4A3A18] text-[#E8C57A] text-[14px] flex items-center justify-between gap-4">
            <span>Bepul videongiz tugadi. Davom etish uchun tarif tanlang.</span>
            <button
              onClick={() => setShowPricing(true)}
              className="shrink-0 text-[13px] font-medium px-3 py-1.5 rounded-lg bg-[#3A2718] text-[#E8A05A] hover:bg-[#452D1C] transition-colors"
            >
              Tariflarni ko'rish
            </button>
          </div>
        )}

        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full mt-4 flex items-center justify-center gap-2.5 py-4 rounded-xl text-[15px] font-medium transition-all active:scale-[0.99]"
          style={{
            background: canGenerate ? "#C9622C" : "#221D19",
            color: canGenerate ? "#14110F" : "#5C554E",
            cursor: canGenerate ? "pointer" : "not-allowed",
            border: canGenerate ? "none" : "1px solid #2E2822",
          }}
        >
          {status === "generating" ? (
            <React.Fragment>
              <Loader2 size={18} className="animate-spin" />
              Video yaratilmoqda
            </React.Fragment>
          ) : (
            <React.Fragment>
              <Sparkles size={18} />
              Video yaratish
            </React.Fragment>
          )}
        </button>

        {status === "error" && (
          <div className="mt-4 px-4 py-3 rounded-xl bg-[#2B1712] border border-[#4A2318] text-[#E8917A] text-[14px]">
            {errorMsg}
          </div>
        )}

        {status === "generating" && (
          <div className="mt-6 border border-[#2E2822] rounded-xl bg-[#1A1613] px-5 py-5">
            <div className="flex items-center gap-3">
              <div className="flex gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9622C]" style={{ animation: "pulse-dot 1.2s ease-in-out infinite" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9622C]" style={{ animation: "pulse-dot 1.2s ease-in-out infinite 0.2s" }} />
                <span className="w-1.5 h-1.5 rounded-full bg-[#C9622C]" style={{ animation: "pulse-dot 1.2s ease-in-out infinite 0.4s" }} />
              </div>
              <p className="text-[14px] text-[#B5AEA5]">
                {styleLabel} uslubida {duration} davomiylikdagi video ishlab chiqilmoqda
              </p>
            </div>
            <p className="text-[12px] text-[#6B635C] mt-2 ml-6">Bu odatda 1-3 daqiqa vaqt oladi</p>
          </div>
        )}

        {gallery.length > 0 && (
          <div className="mt-14">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-[13px] font-medium text-[#8A8178] tracking-[0.06em] uppercase">Yaratilgan videolar</h2>
              <div className="flex-1 h-px bg-[#2E2822]" />
              <span className="text-[12px] text-[#5C554E]">{gallery.length}</span>
            </div>
            <div className="space-y-4">
              {gallery.map((item) => (
                <div key={item.id} className="border border-[#2E2822] rounded-xl overflow-hidden bg-[#1A1613]">
                  <video src={item.url} controls className="w-full block bg-black" style={{ maxHeight: 420 }} />
                  <div className="px-4 py-3.5 flex items-center justify-between gap-4">
                    <div className="min-w-0">
                      <p className="text-[13px] text-[#B5AEA5] truncate">{item.prompt}</p>
                      <p className="text-[11px] text-[#5C554E] mt-1">
                        {STYLES.find((s) => s.id === item.style)?.label} · {item.duration} · {item.ratio}
                      </p>
                    </div>
                    <a
                      href={item.url}
                      download
                      className="flex items-center gap-1.5 text-[13px] text-[#C9622C] shrink-0 hover:text-[#E8825A] transition-colors"
                    >
                      <Download size={14} /> Yuklab olish
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {gallery.length === 0 && status === "idle" && (
          <div className="mt-14">
            <Sprocket />
            <div className="text-center py-14 border border-dashed border-[#2E2822] rounded-xl">
              <div className="w-12 h-12 rounded-full border border-[#3A342F] flex items-center justify-center mx-auto mb-4">
                <Play size={18} className="text-[#5C554E] ml-0.5" />
              </div>
              <p className="text-[14px] text-[#8A8178]">Birinchi videongizni yaratish uchun tasvir yozing</p>
              <p className="text-[12px] text-[#5C554E] mt-1.5">Batafsil tasvir — yaxshiroq natija</p>
            </div>
            <Sprocket />
          </div>
        )}
      </main>

      {showPricing && (
        <Pricing
          onClose={() => setShowPricing(false)}
          uid={user.uid}
        />
      )}
    </div>
  );
}