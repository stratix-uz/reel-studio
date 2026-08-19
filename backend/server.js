// ============ VIDEO GENERATSIYA: BOSHLASH ============
app.post("/api/generate-video/start", async (req, res) => {
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

    const prediction = await createRes.json();
    res.json({ predictionId: prediction.id });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});

// ============ VIDEO GENERATSIYA: HOLATNI TEKSHIRISH ============
app.get("/api/generate-video/status/:id", async (req, res) => {
  const { id } = req.params;
  try {
    const pollRes = await fetch(`https://api.replicate.com/v1/predictions/${id}`, {
      headers: { Authorization: `Bearer ${REPLICATE_API_TOKEN}` },
    });
    const prediction = await pollRes.json();

    if (prediction.status === "succeeded") {
      const videoUrl = Array.isArray(prediction.output) ? prediction.output[0] : prediction.output;
      return res.json({ status: "succeeded", videoUrl });
    }
    if (prediction.status === "failed" || prediction.status === "canceled") {
      return res.json({ status: "failed", error: prediction.error || "Video yaratish muvaffaqiyatsiz tugadi" });
    }
    res.json({ status: prediction.status });
  } catch (err) {
    console.error(err);
    res.status(500).json({ error: err.message });
  }
});