import React, { useState, useRef } from "react";
import { Film, Play, Download, Loader2, Sparkles, Clock, Ratio, Wand2 } from "lucide-react";

const STYLES = [
  { id: "cinematic", label: "Kinematik" },
  { id: "anime", label: "Anime" },
  { id: "realistic", label: "Realistik" },
  { id: "3d", label: "3D animatsiya" },
];

const DURATIONS = ["4s", "6s", "10s"];
const RATIOS = ["16:9", "9:16", "1:1"];

const BACKEND_URL = "http://localhost:3001/api/generate-video";

function ReelIcon({ spinning }) {
  return (
    <div
      style={{
        width: 18,
        height: 18,
        borderRadius: "50%",
        border: "2px solid #C9622C",
        borderTopColor: "transparent",
        animation: spinning ? "spin 0.8s linear infinite" : "none",
      }}
    />
  );
}

export default function VideoAIApp() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("cinematic");
  const [duration, setDuration] = useState("6s");
  const [ratio, setRatio] = useState("16:9");
  const [status, setStatus] = useState("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [gallery, setGallery] = useState([]);
  const abortRef = useRef(null);

  const canGenerate = prompt.trim().length > 3 && status !== "generating";

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
        body: JSON.stringify({ prompt, style, duration, ratio }),
        signal: controller.signal,
      });

      if (!res.ok) throw new Error(`Server xatosi: ${res.status}`);
      const data = await res.json();

      if (!data.videoUrl) throw new Error("Video URL topilmadi. Backend javobini tekshiring.");

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

  return (
    <div className="min-h-screen w-full bg-[#161311] text-[#F2EDE6] font-sans">
      <style>{`
        @keyframes spin { to { transform: rotate(360deg); } }
        .film-sprocket { background-image: radial-gradient(circle, #F2EDE6 2px, transparent 2px); background-size: 14px 14px; }
      `}</style>

      <header className="border-b border-[#2E2926] px-6 py-5 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-[#C9622C] flex items-center justify-center">
          <Film size={18} className="text-[#161311]" />
        </div>
        <div>
          <h1 className="text-lg font-medium tracking-tight" style={{ fontFamily: "Georgia, serif" }}>
            Reel Studio
          </h1>
          <p className="text-xs text-[#9A9088]">Matndan videoga</p>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-10">
        <div className="mb-6">
          <label className="block text-sm text-[#C9622C] mb-2 tracking-wide uppercase" style={{ fontSize: 12, letterSpacing: "0.08em" }}>
            Sahnani tasvirlang
          </label>
          <textarea
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            placeholder="Masalan: Quyosh botayotganda cho'lda yurayotgan tuya, kinematik yorug'lik, sekin harakat..."
            rows={4}
            className="w-full bg-[#1F1B18] border border-[#3A342F] rounded-lg p-4 text-[15px] leading-relaxed placeholder-[#6B635C] outline-none focus:border-[#C9622C] transition-colors resize-none"
          />
        </div>

        <div className="grid grid-cols-3 gap-4 mb-8">
          <div>
            <label className="flex items-center gap-1.5 text-xs text-[#9A9088] mb-2">
              <Wand2 size={13} /> Stil
            </label>
            <select
              value={style}
              onChange={(e) => setStyle(e.target.value)}
              className="w-full bg-[#1F1B18] border border-[#3A342F] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#C9622C]"
            >
              {STYLES.map((s) => (
                <option key={s.id} value={s.id}>{s.label}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs text-[#9A9088] mb-2">
              <Clock size={13} /> Davomiylik
            </label>
            <select
              value={duration}
              onChange={(e) => setDuration(e.target.value)}
              className="w-full bg-[#1F1B18] border border-[#3A342F] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#C9622C]"
            >
              {DURATIONS.map((d) => (
                <option key={d} value={d}>{d}</option>
              ))}
            </select>
          </div>
          <div>
            <label className="flex items-center gap-1.5 text-xs text-[#9A9088] mb-2">
              <Ratio size={13} /> Nisbat
            </label>
            <select
              value={ratio}
              onChange={(e) => setRatio(e.target.value)}
              className="w-full bg-[#1F1B18] border border-[#3A342F] rounded-lg px-3 py-2 text-sm outline-none focus:border-[#C9622C]"
            >
              {RATIOS.map((r) => (
                <option key={r} value={r}>{r}</option>
              ))}
            </select>
          </div>
        </div>

        <button
          onClick={handleGenerate}
          disabled={!canGenerate}
          className="w-full flex items-center justify-center gap-2 py-3.5 rounded-lg font-medium text-[15px] transition-all"
          style={{
            background: canGenerate ? "#C9622C" : "#3A342F",
            color: canGenerate ? "#161311" : "#6B635C",
            cursor: canGenerate ? "pointer" : "not-allowed",
          }}
        >
          {status === "generating" ? (
            <>
              <Loader2 size={18} className="animate-spin" />
              Video yaratilmoqda...
            </>
          ) : (
            <>
              <Sparkles size={18} />
              Video yaratish
            </>
          )}
        </button>

        {status === "error" && (
          <div className="mt-4 p-3 rounded-lg bg-[#3A1F1A] border border-[#5C2E24] text-[#E8917A] text-sm">
            {errorMsg}
          </div>
        )}

        {status === "generating" && (
          <div className="mt-6 flex items-center gap-3 text-[#9A9088] text-sm">
            <ReelIcon spinning />
            Model kadrlarni ishlab chiqarmoqda, bu bir necha daqiqa vaqt olishi mumkin...
          </div>
        )}

        {gallery.length > 0 && (
          <div className="mt-12">
            <h2 className="text-sm text-[#9A9088] mb-4 tracking-wide uppercase" style={{ fontSize: 12, letterSpacing: "0.08em" }}>
              Yaratilgan videolar
            </h2>
            <div className="space-y-4">
              {gallery.map((item) => (
                <div key={item.id} className="border border-[#3A342F] rounded-lg overflow-hidden bg-[#1F1B18]">
                  <video src={item.url} controls className="w-full block bg-black" style={{ maxHeight: 400 }} />
                  <div className="p-3 flex items-center justify-between">
                    <p className="text-xs text-[#9A9088] truncate pr-4">{item.prompt}</p>
                    
                      href={item.url}
                      download
                      className="flex items-center gap-1.5 text-xs text-[#C9622C] shrink-0 hover:underline"
                    >
                      <Download size={13} /> Yuklab olish
                    </a>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {gallery.length === 0 && status === "idle" && (
          <div className="mt-16 text-center py-12 border border-dashed border-[#3A342F] rounded-lg">
            <Play size={28} className="mx-auto mb-3 text-[#3A342F]" />
            <p className="text-sm text-[#6B635C]">Birinchi videongizni yaratish uchun tasvir yozing</p>
          </div>
        )}
      </main>
    </div>
  );
}