import React, { useState, useRef, useEffect } from "react";
import { Play, Download, Loader2, Sparkles, Clock, Ratio, Wand2, Clapperboard, LogOut, RefreshCw, Zap, Film, Globe, Menu, X, Smartphone, Video, Image as ImageIcon } from "lucide-react";
import { auth, googleProvider, db } from "./firebase";
import { signInWithPopup, signOut, onAuthStateChanged } from "firebase/auth";
import { doc, getDoc, setDoc, addDoc, collection, query, orderBy, getDocs } from "firebase/firestore";
import Pricing from "./Pricing";
import { LANGUAGES, translations } from "./translations";

const STYLE_IDS = ["cinematic", "anime", "realistic", "3d"];
const DURATIONS = ["5s", "10s"];
const RATIOS = ["16:9", "9:16", "1:1"];

const BACKEND_BASE = "https://reel-studio-production-b994.up.railway.app";
const APK_URL = "/downloads/reelstudio.apk";

function BackgroundGlow() {
  return (
    <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
      <div className="absolute -top-20 -left-20 w-[600px] h-[600px] rounded-full opacity-20 blur-[130px]" style={{ background: "#8B5CF6" }} />
      <div className="absolute -top-20 -right-20 w-[600px] h-[600px] rounded-full opacity-15 blur-[130px]" style={{ background: "#3B82F6" }} />
      <div className="absolute bottom-0 left-1/3 w-[500px] h-[500px] rounded-full opacity-10 blur-[130px]" style={{ background: "#EC4899" }} />
    </div>
  );
}

function LanguageSwitcher({ lang, setLang }) {
  return (
    <div className="relative flex items-center gap-1.5 text-[12px] font-medium text-[#71717A] border border-[#E4E4E7] rounded-full pl-2.5 pr-1.5 py-1.5 hover:border-[#8B5CF6] transition-colors shrink-0">
      <Globe size={13} />
      <select
        value={lang}
        onChange={(e) => setLang(e.target.value)}
        className="bg-transparent text-[12px] font-medium text-[#71717A] outline-none cursor-pointer appearance-none pr-1"
      >
        {LANGUAGES.map((l) => (
          <option key={l.code} value={l.code}>
            {l.label}
          </option>
        ))}
      </select>
    </div>
  );
}

function InspirationCard({ item, t }) {
  const videoRef = useRef(null);

  function handleEnter() {
    if (videoRef.current) {
      videoRef.current.currentTime = 0;
      videoRef.current.play().catch(() => {});
    }
  }

  function handleLeave() {
    if (videoRef.current) {
      videoRef.current.pause();
      videoRef.current.currentTime = 0;
    }
  }

  return (
    <div
      className="rounded-xl overflow-hidden aspect-[3/4] relative group cursor-pointer bg-black"
      style={{ border: "1px solid #E4E4E7" }}
      onMouseEnter={handleEnter}
      onMouseLeave={handleLeave}
      onTouchStart={handleEnter}
    >
      <video
        ref={videoRef}
        src={item.video}
        muted
        loop
        playsInline
        preload="metadata"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div
        className="absolute inset-0 flex items-end p-3 transition-opacity"
        style={{ background: "linear-gradient(180deg, rgba(0,0,0,0) 40%, rgba(0,0,0,0.55) 100%)" }}
      >
        <div className="relative z-10">
          <p className="text-[12px] sm:text-[13px] font-medium text-white">{t(item.tagKey)}</p>
          <p className="text-[10px] sm:text-[11px] text-white/70">{t(item.labelKey)}</p>
        </div>
      </div>
      <div className="absolute top-2.5 right-2.5 w-7 h-7 rounded-full flex items-center justify-center bg-white/90 opacity-0 group-hover:opacity-100 transition-opacity">
        <Play size={12} className="text-[#18181B] ml-0.5" fill="#18181B" />
      </div>
    </div>
  );
}

function LoginScreen({ onLogin, loading, lang, setLang, t }) {
  return (
    <div className="min-h-screen w-full bg-[#F7F7FA] text-[#18181B] flex items-center justify-center px-6 relative">
      <BackgroundGlow />
      <div className="absolute top-5 right-5 sm:top-6 sm:right-6">
        <LanguageSwitcher lang={lang} setLang={setLang} />
      </div>
      <div className="max-w-sm w-full text-center relative">
        <div className="w-14 h-14 rounded-xl flex items-center justify-center mx-auto mb-6" style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
          <Clapperboard size={26} className="text-white" strokeWidth={2} />
        </div>
        <h1 className="text-[26px] sm:text-[28px] tracking-tight mb-2" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
          Reel Studio
        </h1>
        <p className="text-[14px] text-[#71717A] mb-8">{t("appTagline")}</p>

        <button
          onClick={onLogin}
          disabled={loading}
          className="w-full flex items-center justify-center gap-3 py-3.5 rounded-xl text-[15px] font-medium bg-white border border-[#E4E4E7] hover:border-[#8B5CF6]/50 shadow-sm transition-colors active:scale-[0.98]"
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
          {t("googleLogin")}
        </button>

        <p className="text-[12px] text-[#A1A1AA] mt-6">
          {t("freeVideoNote")} <span className="text-[#71717A]">{t("freeVideoNote2")}</span> {t("freeVideoNote3")}
        </p>

        <a
          href={APK_URL}
          download
          className="mt-4 inline-flex items-center justify-center gap-2 text-[12px] font-medium text-[#71717A] border border-[#E4E4E7] rounded-full px-4 py-2 hover:border-[#8B5CF6] hover:text-[#7C3AED] transition-colors"
        >
          <Smartphone size={13} />
          {t("downloadApp")}
        </a>
      </div>
    </div>
  );
}

export default function App() {
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const ref = params.get("ref");
    if (ref) {
      try {
        localStorage.setItem("reelstudio_ref", ref);
      } catch {}
    }
  }, []);

  const [lang, setLang] = useState(() => {
    try {
      return localStorage.getItem("reelstudio_lang") || "uz";
    } catch {
      return "uz";
    }
  });

  function t(key) {
    return translations[lang]?.[key] ?? translations.uz[key] ?? key;
  }

  function handleSetLang(code) {
    setLang(code);
    try {
      localStorage.setItem("reelstudio_lang", code);
    } catch {}
  }

  const STYLES = STYLE_IDS.map((id) => ({
    id,
    label: t(
      id === "cinematic"
        ? "styleCinematic"
        : id === "anime"
        ? "styleAnime"
        : id === "realistic"
        ? "styleRealistic"
        : "style3d"
    ),
  }));

  const INSPIRATION = [
    { labelKey: "tagKinematik", tagKey: "inspirationSahro", video: "/inspiration/sahro-goliblari.mp4" },
    { labelKey: "tagMahsulot", tagKey: "inspirationSoat", video: "/inspiration/zamonaviy-soat.mp4" },
  ];

  const [user, setUser] = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [loginLoading, setLoginLoading] = useState(false);
  const [credits, setCredits] = useState(null);

  const [mediaType, setMediaType] = useState("video");
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("cinematic");
  const [duration, setDuration] = useState("5s");
  const [ratio, setRatio] = useState("16:9");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [gallery, setGallery] = useState([]);
  const [showPricing, setShowPricing] = useState(false);
  const [view, setView] = useState("create");
  const [menuOpen, setMenuOpen] = useState(false);
  const abortRef = useRef(null);

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, async (firebaseUser) => {
      setUser(firebaseUser);
      setAuthLoading(false);
      if (firebaseUser) {
        const userRef = doc(db, "users", firebaseUser.uid);
        const snap = await getDoc(userRef);
        if (!snap.exists()) {
          let referredBy = null;
          try {
            referredBy = localStorage.getItem("reelstudio_ref") || null;
          } catch {}
          await setDoc(userRef, {
            email: firebaseUser.email,
            name: firebaseUser.displayName,
            credits: 1,
            plan: "free",
            createdAt: new Date().toISOString(),
            referredBy,
          });
          setCredits(1);
        } else {
          setCredits(snap.data().credits);
        }

        try {
          const videosSnap = await getDocs(
            query(collection(db, "users", firebaseUser.uid, "videos"), orderBy("createdAt", "desc"))
          );
          const loaded = videosSnap.docs.map((d) => ({ id: d.id, ...d.data() }));
          setGallery(loaded);
        } catch (err) {
          console.error("Kontentni yuklashda xatolik:", err);
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
    setView("create");
    setMenuOpen(false);
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
      if (!startRes.ok) throw new Error(`${t("serverError")}: ${startRes.status}`);
      const startData = await startRes.json();
      if (!startData.predictionId) throw new Error(t("videoNotStarted"));

      const predictionId = startData.predictionId;
      let mediaUrl = null;

      while (!mediaUrl) {
        await new Promise((r) => setTimeout(r, 4000));
        const pollRes = await fetch(`${BACKEND_BASE}/api/generate-video/status/${predictionId}`);
        if (!pollRes.ok) throw new Error(`${t("statusCheckError")}: ${pollRes.status}`);
        const pollData = await pollRes.json();

        if (pollData.status === "succeeded") {
          mediaUrl = pollData.videoUrl;
        } else if (pollData.status === "failed") {
          throw new Error(pollData.error || t("videoGenerationFailed"));
        }
      }

      await finalizeGeneration(mediaUrl, "video");
    } catch (err) {
      setErrorMsg(err.message.includes("Failed to fetch") ? t("backendConnectionError") : err.message);
      setStatus("error");
    }
  }

  async function generateImage() {
    setStatus("generating");
    setErrorMsg("");
    try {
      const startRes = await fetch(`${BACKEND_BASE}/api/generate-image/start`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, style, ratio, uid: user.uid }),
      });
      if (!startRes.ok) throw new Error(`${t("serverError")}: ${startRes.status}`);
      const startData = await startRes.json();
      if (!startData.predictionId) throw new Error(t("imageNotStarted"));

      const predictionId = startData.predictionId;
      let mediaUrl = null;

      while (!mediaUrl) {
        await new Promise((r) => setTimeout(r, 2000));
        const pollRes = await fetch(`${BACKEND_BASE}/api/generate-image/status/${predictionId}`);
        if (!pollRes.ok) throw new Error(`${t("statusCheckError")}: ${pollRes.status}`);
        const pollData = await pollRes.json();

        if (pollData.status === "succeeded") {
          mediaUrl = pollData.imageUrl;
        } else if (pollData.status === "failed") {
          throw new Error(pollData.error || t("imageGenerationFailed"));
        }
      }

      await finalizeGeneration(mediaUrl, "image");
    } catch (err) {
      setErrorMsg(err.message.includes("Failed to fetch") ? t("backendConnectionError") : err.message);
      setStatus("error");
    }
  }

  async function finalizeGeneration(url, type) {
    const userRef = doc(db, "users", user.uid);
    const newCredits = Math.max(0, (credits ?? 1) - 1);
    await setDoc(userRef, { credits: newCredits }, { merge: true });
    setCredits(newCredits);

    const contentDoc = {
      url,
      type,
      prompt,
      style,
      duration: type === "video" ? duration : null,
      ratio,
      createdAt: new Date().toISOString(),
    };
    const docRef = await addDoc(collection(db, "users", user.uid, "videos"), contentDoc);
    setGallery((g) => [{ id: docRef.id, ...contentDoc }, ...g]);

    setStatus("done");
  }

  async function handleGenerate() {
    if (!canGenerate) return;
    if (mediaType === "video") {
      await generateVideo();
    } else {
      await generateImage();
    }
  }

  async function handleRegenerate(item) {
    if (status === "generating" || credits <= 0) return;
    setPrompt(item.prompt);
    setStyle(item.style);
    if (item.duration) setDuration(item.duration);
    setRatio(item.ratio);
    setMediaType(item.type === "image" ? "image" : "video");
    setView("create");
    setMenuOpen(false);
    if (item.type === "image") {
      await generateImage();
    } else {
      await generateVideo();
    }
  }

  function goTo(v) {
    setView(v);
    setMenuOpen(false);
  }

  const styleLabel = STYLES.find((s) => s.id === style)?.label ?? style;
  const latestItem = gallery[0] || null;

  if (authLoading) {
    return (
      <div className="min-h-screen w-full bg-[#F7F7FA] flex items-center justify-center">
        <Loader2 size={24} className="animate-spin text-[#A1A1AA]" />
      </div>
    );
  }

  if (!user) {
    return <LoginScreen onLogin={handleLogin} loading={loginLoading} lang={lang} setLang={handleSetLang} t={t} />;
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

      <header className="border-b border-[#E4E4E7] relative bg-white/70 backdrop-blur-sm sticky top-0 z-30">
        <div className="max-w-6xl mx-auto px-4 sm:px-6 py-4 sm:py-5 flex items-center justify-between">
          <div className="flex items-center gap-4 sm:gap-8 min-w-0">
            <button onClick={() => goTo("create")} className="flex items-center gap-2 sm:gap-2.5 shrink-0">
              <div className="w-8 h-8 sm:w-9 sm:h-9 rounded-lg flex items-center justify-center shrink-0" style={{ background: "linear-gradient(135deg, #F97316, #EA580C)" }}>
                <Clapperboard size={16} className="text-white sm:hidden" strokeWidth={2} />
                <Clapperboard size={18} className="text-white hidden sm:block" strokeWidth={2} />
              </div>
              <span className="text-[16px] sm:text-[18px] tracking-tight whitespace-nowrap" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
                Reel Studio
              </span>
            </button>
            <nav className="hidden md:flex items-center gap-6 text-[13px] text-[#71717A]">
              <button onClick={() => goTo("create")} className={view === "create" ? "text-[#18181B] font-medium" : "hover:text-[#18181B] transition-colors cursor-pointer"}>
                {t("navCreate")}
              </button>
              <button onClick={() => goTo("library")} className={view === "library" ? "text-[#18181B] font-medium" : "hover:text-[#18181B] transition-colors cursor-pointer"}>
                {t("navLibrary")}
              </button>
              <button onClick={() => goTo("inspire")} className={view === "inspire" ? "text-[#18181B] font-medium" : "hover:text-[#18181B] transition-colors cursor-pointer"}>
                {t("navInspire")}
              </button>
            </nav>
          </div>
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            <a href={APK_URL} download className="hidden lg:flex items-center gap-1.5 text-[12px] font-medium text-[#71717A] border border-[#E4E4E7] rounded-full px-3 py-1.5 hover:border-[#8B5CF6] hover:text-[#7C3AED] transition-colors whitespace-nowrap">
              <Smartphone size={13} />
              {t("downloadApp")}
            </a>
            <div className="hidden sm:block">
              <LanguageSwitcher lang={lang} setLang={handleSetLang} />
            </div>
            <button onClick={() => setShowPricing(true)} className="flex items-center gap-1 sm:gap-1.5 text-[11px] sm:text-[12px] font-medium rounded-full px-2 sm:px-3 py-1.5 transition-colors whitespace-nowrap" style={{ background: "rgba(249,115,22,0.08)", color: "#EA580C", border: "1px solid rgba(249,115,22,0.25)" }}>
              <Sparkles size={12} />
              {credits ?? 0}
              <span className="hidden sm:inline">{t("credits")}</span>
            </button>
            <button onClick={() => setShowPricing(true)} className="hidden sm:block text-[13px] text-[#71717A] border border-transparent hover:border-[#8B5CF6] hover:text-[#7C3AED] rounded-full px-3 py-1.5 transition-colors">
              {t("pricing")}
            </button>
            {user.photoURL && <img src={user.photoURL} alt="" className="w-7 h-7 sm:w-8 sm:h-8 rounded-full border border-[#E4E4E7] hidden sm:block" />}
            <button onClick={handleLogout} className="hidden sm:block text-[#A1A1AA] hover:text-[#71717A] transition-colors" aria-label="Chiqish">
              <LogOut size={18} />
            </button>
            <button onClick={() => setMenuOpen((o) => !o)} className="md:hidden text-[#18181B] p-1.5 -mr-1.5" aria-label="Menu">
              {menuOpen ? <X size={22} /> : <Menu size={22} />}
            </button>
          </div>
        </div>

        {menuOpen && (
          <div className="md:hidden border-t border-[#E4E4E7] bg-white px-4 py-4">
            <nav className="flex flex-col gap-1 text-[14px] mb-4">
              <button onClick={() => goTo("create")} className={`text-left px-3 py-2.5 rounded-lg ${view === "create" ? "bg-[#F7F7FA] text-[#18181B] font-medium" : "text-[#71717A]"}`}>
                {t("navCreate")}
              </button>
              <button onClick={() => goTo("library")} className={`text-left px-3 py-2.5 rounded-lg ${view === "library" ? "bg-[#F7F7FA] text-[#18181B] font-medium" : "text-[#71717A]"}`}>
                {t("navLibrary")}
              </button>
              <button onClick={() => goTo("inspire")} className={`text-left px-3 py-2.5 rounded-lg ${view === "inspire" ? "bg-[#F7F7FA] text-[#18181B] font-medium" : "text-[#71717A]"}`}>
                {t("navInspire")}
              </button>
              <button onClick={() => { setShowPricing(true); setMenuOpen(false); }} className="text-left px-3 py-2.5 rounded-lg text-[#71717A]">
                {t("pricing")}
              </button>
              <a href={APK_URL} download className="flex items-center gap-2 text-left px-3 py-2.5 rounded-lg text-[#71717A]">
                <Smartphone size={15} />
                {t("downloadApp")}
              </a>
            </nav>
            <div className="flex items-center justify-between px-3 pt-3 border-t border-[#E4E4E7]">
              <div className="flex items-center gap-2.5">
                {user.photoURL && <img src={user.photoURL} alt="" className="w-8 h-8 rounded-full border border-[#E4E4E7]" />}
                <span className="text-[13px] text-[#71717A] truncate max-w-[140px]">{user.displayName || user.email}</span>
              </div>
              <button onClick={handleLogout} className="text-[#A1A1AA] hover:text-[#71717A] transition-colors p-1.5" aria-label="Chiqish">
                <LogOut size={18} />
              </button>
            </div>
            <div className="mt-4 px-3">
              <LanguageSwitcher lang={lang} setLang={handleSetLang} />
            </div>
          </div>
        )}
      </header>

      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-8 sm:py-14 relative">
        {view === "create" && (
          <div className="grid lg:grid-cols-[1.15fr_0.85fr] gap-6 sm:gap-10 items-start">
            <div>
              <h1 className="text-[26px] xs:text-[30px] sm:text-[44px] leading-[1.15] sm:leading-[1.1] tracking-tight mb-3 sm:mb-4" style={{ fontFamily: "Georgia, 'Times New Roman', serif", background: "linear-gradient(135deg, #18181B, #7C3AED 60%, #2563EB)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", backgroundClip: "text" }}>
                {t("heroTitle1")} <span>{t("heroTitle2")}</span> {t("heroTitle3")}
              </h1>
              <p className="text-[14px] sm:text-[15px] text-[#71717A] mb-5 max-w-md">{t("heroSubtitle")}</p>

              <div className="inline-flex items-center gap-1 p-1 rounded-xl bg-[#F0F0F3] mb-5">
                <button onClick={() => setMediaType("video")} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-all" style={mediaType === "video" ? { background: "#FFFFFF", color: "#18181B", boxShadow: "0 1px 3px rgba(0,0,0,.1)" } : { color: "#71717A" }}>
                  <Video size={14} /> {t("modeVideo")}
                </button>
                <button onClick={() => setMediaType("image")} className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-[13px] font-medium transition-all" style={mediaType === "image" ? { background: "#FFFFFF", color: "#18181B", boxShadow: "0 1px 3px rgba(0,0,0,.1)" } : { color: "#71717A" }}>
                  <ImageIcon size={14} /> {t("modeImage")}
                </button>
              </div>

              <div className="rounded-2xl overflow-hidden bg-white" style={{ border: "1px solid #E4E4E7", boxShadow: "0 4px 30px rgba(139,92,246,.08)" }}>
                <div className="px-4 sm:px-6 pt-5 sm:pt-6 pb-2">
                  <label className="flex items-center gap-2 text-[11px] sm:text-[12px] font-medium tracking-[0.08em] uppercase mb-3" style={{ color: "#7C3AED" }}>
                    <Sparkles size={13} strokeWidth={2.5} />
                    {t("describeScene")}
                  </label>
                  <textarea value={prompt} onChange={(e) => setPrompt(e.target.value)} placeholder={t("promptPlaceholder")} rows={4} className="w-full bg-transparent text-[14px] sm:text-[15px] leading-relaxed outline-none resize-none min-h-[90px] sm:min-h-[110px] text-[#18181B]" />
                </div>

                <div className={`border-t border-[#E4E4E7] px-4 sm:px-6 py-4 sm:py-5 grid ${mediaType === "video" ? "grid-cols-3" : "grid-cols-2"} gap-2 sm:gap-3`}>
                  <div>
                    <label className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-[#71717A] mb-1.5 sm:mb-2 tracking-wide">
                      <Wand2 size={11} /> <span className="truncate">{t("style")}</span>
                    </label>
                    <select value={style} onChange={(e) => setStyle(e.target.value)} className="w-full bg-[#F7F7FA] border border-[#E4E4E7] rounded-lg px-1.5 sm:px-2.5 py-2 sm:py-2.5 text-[11px] sm:text-[13px] outline-none focus:border-[#8B5CF6] transition-colors cursor-pointer text-[#18181B]">
                      {STYLES.map((s) => (
                        <option key={s.id} value={s.id}>{s.label}</option>
                      ))}
                    </select>
                  </div>
                  {mediaType === "video" && (
                    <div>
                      <label className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-[#71717A] mb-1.5 sm:mb-2 tracking-wide">
                        <Clock size={11} /> <span className="truncate">{t("duration")}</span>
                      </label>
                      <select value={duration} onChange={(e) => setDuration(e.target.value)} className="w-full bg-[#F7F7FA] border border-[#E4E4E7] rounded-lg px-1.5 sm:px-2.5 py-2 sm:py-2.5 text-[11px] sm:text-[13px] outline-none focus:border-[#8B5CF6] transition-colors cursor-pointer text-[#18181B]">
                        {DURATIONS.map((d) => (
                          <option key={d} value={d}>{d}</option>
                        ))}
                      </select>
                    </div>
                  )}
                  <div>
                    <label className="flex items-center gap-1 sm:gap-1.5 text-[10px] sm:text-[11px] text-[#71717A] mb-1.5 sm:mb-2 tracking-wide">
                      <Ratio size={11} /> <span className="truncate">{t("ratio")}</span>
                    </label>
                    <select value={ratio} onChange={(e) => setRatio(e.target.value)} className="w-full bg-[#F7F7FA] border border-[#E4E4E7] rounded-lg px-1.5 sm:px-2.5 py-2 sm:py-2.5 text-[11px] sm:text-[13px] outline-none focus:border-[#8B5CF6] transition-colors cursor-pointer text-[#18181B]">
                      {RATIOS.map((r) => (
                        <option key={r} value={r}>{r}</option>
                      ))}
                    </select>
                  </div>
                </div>
              </div>

              {credits === 0 && (
                <div className="mt-4 px-4 py-3 rounded-xl bg-[#FEF3C7] border border-[#FDE68A] text-[#92400E] text-[13px] sm:text-[14px] flex items-center justify-between gap-3 sm:gap-4">
                  <span>{t("outOfCredits")}</span>
                  <button onClick={() => setShowPricing(true)} className="shrink-0 text-[12px] sm:text-[13px] font-medium px-2.5 sm:px-3 py-1.5 rounded-lg bg-[#FDE68A] text-[#78350F] hover:bg-[#FCD34D] transition-colors">
                    {t("viewPricing")}
                  </button>
                </div>
              )}

              <button onClick={handleGenerate} disabled={!canGenerate} className="w-full mt-4 flex items-center justify-center gap-2.5 py-3.5 sm:py-4 rounded-xl text-[15px] sm:text-[16px] font-semibold transition-all active:scale-[0.99]" style={canGenerate ? { background: "linear-gradient(135deg, #8B5CF6, #3B82F6)", color: "#FFFFFF", boxShadow: "0 8px 30px rgba(139,92,246,.25)", border: "none", cursor: "pointer" } : { background: "#F0F0F3", color: "#A1A1AA", border: "1px solid #E4E4E7", cursor: "not-allowed" }}>
                {status === "generating" ? (
                  <React.Fragment>
                    <Loader2 size={19} className="animate-spin" />
                    {mediaType === "video" ? t("generating") : t("generatingImageText")}
                  </React.Fragment>
                ) : (
                  <React.Fragment>
                    <Zap size={19} />
                    {mediaType === "video" ? t("generateVideo") : t("generateImage")}
                  </React.Fragment>
                )}
              </button>

              {status === "error" && (
                <div className="mt-4 px-4 py-3 rounded-xl bg-[#FEE2E2] border border-[#FCA5A5] text-[#991B1B] text-[13px] sm:text-[14px]">
                  {errorMsg}
                </div>
              )}
            </div>

            <div className="lg:sticky lg:top-24">
              <div className="rounded-2xl overflow-hidden aspect-[9/13] max-w-[380px] mx-auto lg:max-w-none flex items-center justify-center relative" style={{ border: "1px solid #E4E4E7", background: "linear-gradient(160deg, rgba(139,92,246,.10), rgba(59,130,246,.08) 50%, rgba(236,72,153,.08))" }}>
                {status === "generating" ? (
                  <div className="text-center px-6">
                    <div className="flex gap-1.5 justify-center mb-4">
                      <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" style={{ animation: "pulse-dot 1.2s ease-in-out infinite" }} />
                      <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" style={{ animation: "pulse-dot 1.2s ease-in-out infinite 0.2s" }} />
                      <span className="w-2 h-2 rounded-full bg-[#8B5CF6]" style={{ animation: "pulse-dot 1.2s ease-in-out infinite 0.4s" }} />
                    </div>
                    <p className="text-[13px] sm:text-[14px] text-[#71717A]">
                      {mediaType === "video" ? `${styleLabel} ${t("generatingStyle")}` : `${styleLabel} ${t("generatingImageText")}`}
                    </p>
                    {mediaType === "video" && (
                      <p className="text-[11px] sm:text-[12px] text-[#A1A1AA] mt-2">{t("generatingTime")}</p>
                    )}
                  </div>
                ) : latestItem ? (
                  latestItem.type === "image" ? (
                    <img src={latestItem.url} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <video src={latestItem.url} controls className="w-full h-full object-cover" />
                  )
                ) : (
                  <div className="text-center px-6">
                    <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-white" style={{ border: "1px solid #E4E4E7" }}>
                      <Film size={22} className="text-[#7C3AED]" />
                    </div>
                    <p className="text-[13px] sm:text-[14px] text-[#18181B] font-medium mb-1">
                      {mediaType === "video" ? t("videoAppearsHere") : t("imageAppearsHere")}
                    </p>
                    <p className="text-[11px] sm:text-[12px] text-[#A1A1AA]">{t("startTyping")}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {view === "create" && gallery.length > 1 && (
          <div className="mt-12 sm:mt-16">
            <div className="flex items-center gap-3 mb-5">
              <h2 className="text-[12px] sm:text-[13px] font-medium text-[#71717A] tracking-[0.06em] uppercase">{t("previousVideos")}</h2>
              <div className="flex-1 h-px bg-[#E4E4E7]" />
              <span className="text-[12px] text-[#A1A1AA]">{gallery.length - 1}</span>
            </div>
            <div className="grid sm:grid-cols-2 gap-4">
              {gallery.slice(1).map((item) => (
                <div key={item.id} className="rounded-xl overflow-hidden bg-white" style={{ border: "1px solid #E4E4E7" }}>
                  {item.type === "image" ? (
                    <img src={item.url} alt="" className="w-full block bg-black" style={{ maxHeight: 320, objectFit: "cover" }} />
                  ) : (
                    <video src={item.url} controls className="w-full block bg-black" style={{ maxHeight: 320 }} />
                  )}
                  <div className="px-4 py-3.5">
                    <p className="text-[13px] text-[#71717A] truncate mb-1">{item.prompt}</p>
                    <p className="text-[11px] text-[#A1A1AA] mb-3">
                      {STYLES.find((s) => s.id === item.style)?.label}
                      {item.duration ? ` · ${item.duration}` : ""} · {item.ratio}
                    </p>
                    <div className="flex items-center gap-2">
                      <a href={item.url} download className="flex items-center gap-1.5 text-[12px] font-medium text-[#18181B] bg-[#F7F7FA] border border-[#E4E4E7] rounded-lg px-2.5 py-1.5 hover:border-[#8B5CF6] hover:text-[#7C3AED] transition-colors">
                        <Download size={13} /> {t("download")}
                      </a>
                      <button onClick={() => handleRegenerate(item)} disabled={status === "generating" || credits <= 0} className="flex items-center gap-1.5 text-[12px] font-medium text-[#18181B] bg-[#F7F7FA] border border-[#E4E4E7] rounded-lg px-2.5 py-1.5 hover:border-[#8B5CF6] hover:text-[#7C3AED] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                        <RefreshCw size={13} /> {t("regenerate")}
                      </button>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {view === "library" && (
          <div>
            <h2 className="text-[20px] sm:text-[24px] mb-5 sm:mb-6 tracking-tight" style={{ fontFamily: "Georgia, 'Times New Roman', serif" }}>
              {t("myVideos")}
            </h2>
            {gallery.length === 0 ? (
              <div className="text-center py-16 sm:py-20">
                <div className="w-14 h-14 rounded-full flex items-center justify-center mx-auto mb-4 bg-white" style={{ border: "1px solid #E4E4E7" }}>
                  <Film size={22} className="text-[#7C3AED]" />
                </div>
                <p className="text-[14px] text-[#71717A] mb-1">{t("noVideosYet")}</p>
                <button onClick={() => goTo("create")} className="mt-4 inline-flex items-center gap-2 text-[13px] font-medium text-white rounded-lg px-4 py-2" style={{ background: "linear-gradient(135deg, #8B5CF6, #3B82F6)" }}>
                  <Zap size={14} /> {t("generateVideo")}
                </button>
              </div>
            ) : (
              <div className="grid sm:grid-cols-2 gap-4">
                {gallery.map((item) => (
                  <div key={item.id} className="rounded-xl overflow-hidden bg-white" style={{ border: "1px solid #E4E4E7" }}>
                    {item.type === "image" ? (
                      <img src={item.url} alt="" className="w-full block bg-black" style={{ maxHeight: 320, objectFit: "cover" }} />
                    ) : (
                      <video src={item.url} controls className="w-full block bg-black" style={{ maxHeight: 320 }} />
                    )}
                    <div className="px-4 py-3.5">
                      <p className="text-[13px] text-[#71717A] truncate mb-1">{item.prompt}</p>
                      <p className="text-[11px] text-[#A1A1AA] mb-3">
                        {STYLES.find((s) => s.id === item.style)?.label}
                        {item.duration ? ` · ${item.duration}` : ""} · {item.ratio}
                      </p>
                      <div className="flex items-center gap-2">
                        <a href={item.url} download className="flex items-center gap-1.5 text-[12px] font-medium text-[#18181B] bg-[#F7F7FA] border border-[#E4E4E7] rounded-lg px-2.5 py-1.5 hover:border-[#8B5CF6] hover:text-[#7C3AED] transition-colors">
                          <Download size={13} /> {t("download")}
                        </a>
                        <button onClick={() => handleRegenerate(item)} disabled={status === "generating" || credits <= 0} className="flex items-center gap-1.5 text-[12px] font-medium text-[#18181B] bg-[#F7F7FA] border border-[#E4E4E7] rounded-lg px-2.5 py-1.5 hover:border-[#8B5CF6] hover:text-[#7C3AED] transition-colors disabled:opacity-40 disabled:cursor-not-allowed">
                          <RefreshCw size={13} /> {t("regenerate")}
                        </button>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {view === "inspire" && (
          <div>
            <div className="text-center mb-6 sm:mb-8">
              <h2 className="text-[12px] sm:text-[13px] font-medium tracking-[0.08em] uppercase mb-2" style={{ color: "#7C3AED" }}>
                ✦ {t("getInspired")}
              </h2>
              <p className="text-[13px] sm:text-[14px] text-[#A1A1AA]">{t("inspireSubtitle")}</p>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3 sm:gap-4">
              {INSPIRATION.map((item, i) => (
                <InspirationCard key={i} item={item} t={t} />
              ))}
            </div>
          </div>
        )}
      </main>

      {showPricing && <Pricing onClose={() => setShowPricing(false)} uid={user.uid} lang={lang} t={t} />}
    </div>
  );
}