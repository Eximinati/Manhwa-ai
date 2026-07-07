import React, { useState, useRef, useEffect } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import { showToast } from "../utils/toast";
import { Upload, Download, Loader2, Video, CheckCircle, AlertCircle, FileText, Trash } from "lucide-react";
import { generateAudioStory, checkTaskStatus, analyzeScriptStyle } from '../api/api';
import { generateVideoFromScenes } from '../utils/videoMaker';
import Watermark from "../components/Watermark";

const UploadPage = () => {
  const [file, setFile] = useState(null);
  const [mangaName, setMangaName] = useState("");
  const [language, setLanguage] = useState("hinglish");
  const [orientation, setOrientation] = useState("vertical");
  const [readingDirection, setReadingDirection] = useState("right-to-left");
  const [videoUrl, setVideoUrl] = useState(null);
  const [videoBlob, setVideoBlob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const [error, setError] = useState(null);
  const [storyData, setStoryData] = useState(null);
  const [panelImages, setPanelImages] = useState([]);
  const [isGeneratingVideo, setIsGeneratingVideo] = useState(false);
  const [videoProgress, setVideoProgress] = useState(0);
  const [videoLogs, setVideoLogs] = useState([]);
  const [isDownloading, setIsDownloading] = useState(false);
  const [removedPanels, setRemovedPanels] = useState(new Set());
  const [editingScript, setEditingScript] = useState(false);
  const [editedScenes, setEditedScenes] = useState([]);
  const [scriptStyle, setScriptStyle] = useState("");
  const [scriptMode, setScriptMode] = useState("auto");
  const [exampleFile, setExampleFile] = useState(null);
  const [exampleScript, setExampleScript] = useState("");
  const [styleGuideline, setStyleGuideline] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const exampleFileRef = useRef(null);

  const SCRIPT_PRESETS = [
    { label: "🎬 Cinematic", desc: "Epic, movie-trailer narration", value: "Dramatic, epic, like a movie trailer. Use vivid imagery and build tension." },
    { label: "😂 Funny", desc: "Meme-y, casual roast style", value: "Funny, casual, roast the characters. Use modern slang and humor." },
    { label: "🌙 Dark", desc: "Gritty, intense, serious tone", value: "Dark, gritty, serious. Focus on conflict, stakes, and emotional weight." },
    { label: "💖 Romantic", desc: "Soft, emotional, poetic", value: "Soft, emotional, poetic. Focus on relationships and inner feelings." },
    { label: "⚡ Hype", desc: "Short, punchy, high energy", value: "High energy, fast-paced. Short punchy sentences, intense hype." },
    { label: "🧠 Analytical", desc: "Deep lore, detailed breakdown", value: "Analytical, detailed. Break down strategies, powers, and lore." },
  ];

  const fileInputRef = useRef(null);
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();

  // Phase: upload | configure | processing | preview | rendering | done
  const [phase, setPhase] = useState("upload");

  const resetAll = () => {
    setFile(null);
    setMangaName("");
    setLanguage("hinglish");
    setOrientation("vertical");
    setReadingDirection("right-to-left");
    setVideoUrl(null);
    setVideoBlob(null);
    setIsProcessing(false);
    setProgress(0);
    setError(null);
    setStoryData(null);
    setPanelImages([]);
    setIsGeneratingVideo(false);
    setVideoProgress(0);
    setVideoLogs([]);
    setIsDownloading(false);
    setRemovedPanels(new Set());
    setEditingScript(false);
    setEditedScenes([]);
    setScriptStyle("");
    setScriptMode("auto");
    setExampleFile(null);
    setExampleScript("");
    setStyleGuideline("");
    setIsAnalyzing(false);
    setPhase("upload");
    ["pendingStory", "pendingFileName", "pendingVideoUrl", "isGeneratingVideo", "videoProgress", "videoLogs"].forEach(k => sessionStorage.removeItem(k));
    window.scrollTo({ top: 0, behavior: "smooth" });
  };

  // Escape closes any phase
  useEffect(() => {
    const handler = (e) => { if (e.key === "Escape") resetAll(); };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, []);

  // Restore session
  useEffect(() => {
    const savedData = sessionStorage.getItem("pendingStory");
    const savedFileName = sessionStorage.getItem("pendingFileName");
    const savedVideoUrl = sessionStorage.getItem("pendingVideoUrl");
    const savedIsGenerating = sessionStorage.getItem("isGeneratingVideo");
    const savedVProgress = sessionStorage.getItem("videoProgress");
    const savedVLogs = sessionStorage.getItem("videoLogs");

    if (savedData && savedFileName) {
      try {
        const parsed = JSON.parse(savedData);
        setStoryData(parsed);
        setPanelImages(parsed.image_urls || []);
        setMangaName(savedFileName);
        setFile({ name: savedFileName, size: 0, type: "application/pdf" });
        if (savedVideoUrl) { setVideoUrl(savedVideoUrl); setPhase("done"); }
        else if (savedIsGenerating === "true") {
          setIsGeneratingVideo(true); setPhase("rendering");
          setVideoProgress(parseInt(savedVProgress || "0"));
          if (savedVLogs) setVideoLogs(JSON.parse(savedVLogs));
          resumeVideoGeneration(parsed);
        }
        else { setPhase("preview"); }
      } catch (e) { console.error(e); }
    }
  }, []);

  useEffect(() => {
    if (isGeneratingVideo) {
      sessionStorage.setItem("isGeneratingVideo", "true");
      sessionStorage.setItem("videoProgress", videoProgress.toString());
      sessionStorage.setItem("videoLogs", JSON.stringify(videoLogs));
    } else {
      sessionStorage.removeItem("isGeneratingVideo");
      sessionStorage.removeItem("videoProgress");
      sessionStorage.removeItem("videoLogs");
    }
  }, [isGeneratingVideo, videoProgress, videoLogs]);

  useEffect(() => { if (videoUrl) sessionStorage.setItem("pendingVideoUrl", videoUrl); }, [videoUrl]);

  const resumeVideoGeneration = async (data) => {
    try {
      setVideoLogs(prev => [...prev, "Resuming..."]);
      const r = await generateVideoFromScenes({
        imageUrls: data.image_urls, audioUrl: data.audio_url, scenes: data.final_video_segments, orientation,
        onProgress: (p) => { setVideoProgress(Math.min(Math.floor(p), 100)); },
        onLog: (m) => setVideoLogs(prev => [...prev, m]),
      });
      setVideoUrl(r.videoUrl); setVideoBlob(r.blob); setVideoProgress(100);
      setTimeout(() => setIsGeneratingVideo(false), 500);
      showToast.success("Video ready!");
      setPhase("done");
    } catch (err) {
      setError(err.message); setIsGeneratingVideo(false);
      showToast.error(err.message);
    }
  };

  const validateFile = (f) => {
    if (!f) return false;
    if (!f.type.includes("pdf")) { showToast.error("PDF only"); return false; }
    if (f.size > 50 * 1024 * 1024) { showToast.error("Max 50MB"); return false; }
    setError(null); return true;
  };

  const handleFile = (selectedFile) => {
    if (validateFile(selectedFile)) {
      setFile(selectedFile); setVideoUrl(null); setVideoBlob(null);
      setMangaName(selectedFile.name.replace(".pdf", ""));
      setPanelImages([]); setStoryData(null); setProgress(0); setError(null);
      setVideoLogs([]); setPhase("configure");
      sessionStorage.removeItem("pendingStory"); sessionStorage.removeItem("pendingFileName"); sessionStorage.removeItem("pendingVideoUrl");
    }
  };

  const handleDrop = (e) => { e.preventDefault(); setIsDragging(false); handleFile(e.dataTransfer.files[0]); };
  const removeFile = () => {
    setFile(null); setMangaName(""); setVideoUrl(null); setVideoBlob(null);
    setError(null); setProgress(0); setPanelImages([]); setStoryData(null); setVideoLogs([]);
    setPhase("upload");
    sessionStorage.removeItem("pendingStory"); sessionStorage.removeItem("pendingFileName"); sessionStorage.removeItem("pendingVideoUrl");
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleGenerateStory = async () => {
    if (!file || file.size === 0) { showToast.error("Upload a PDF first"); return; }
    setIsProcessing(true); setProgress(0); setError(null); setPanelImages([]); setStoryData(null);
    setVideoUrl(null); setVideoBlob(null); setPhase("processing");
    sessionStorage.removeItem("pendingVideoUrl");

    try {
      const fd = new FormData();
      fd.append("manga_pdf", file);
      fd.append("manga_name", mangaName);
      fd.append("manga_genre", "Action");
      fd.append("manga_language", language);
      fd.append("reading_direction", readingDirection);
      if (scriptStyle) fd.append("custom_instructions", scriptStyle);
      if (styleGuideline) fd.append("style_guideline", styleGuideline);
      if (user?.id) fd.append("user_id", user.id);

      const startRes = await generateAudioStory(fd);
      const taskId = startRes.task_id;

      let done = false;
      const poll = setInterval(async () => {
        if (done) return;
        try {
          const st = await checkTaskStatus(taskId);
          if (done) return;
          if (st.state === 'PROCESSING') { setProgress(st.progress || 20); }
          else if (st.state === 'SUCCESS') {
            done = true; clearInterval(poll); setProgress(100);
            let res = st.result;
            if (typeof res === "string" && res.startsWith("http")) {
              const r = await fetch(res); res = await r.json();
            }
            const imgs = res.image_urls || res.panel_images || [];
            setPanelImages(imgs); setRemovedPanels(new Set());
            setEditedScenes(JSON.parse(JSON.stringify(res.final_video_segments || [])));
            setStoryData(res); setPhase("preview");
            sessionStorage.setItem("pendingStory", JSON.stringify(res));
            sessionStorage.setItem("pendingFileName", mangaName);
            setTimeout(() => setIsProcessing(false), 400);
            showToast.successLong(`${imgs.length} panels extracted`);
          } else if (st.state === 'FAILURE') {
            done = true; clearInterval(poll);
            throw new Error(st.error || "Failed");
          }
        } catch (err) {
          if (err.message.includes("Backend returned non-JSON")) {
            clearInterval(poll); setError(err.message); setIsProcessing(false);
          }
        }
      }, 2000);
    } catch (err) {
      setError(err.message); setIsProcessing(false); setProgress(0);
      showToast.error(err.message);
    }
  };

  const handleGenerateVideo = async () => {
    if (!user) { showToast.info("Login required"); setTimeout(() => navigate("/login", { state: { from: location.pathname } }), 2000); return; }
    if (!storyData) { showToast.error("Generate story first"); return; }

    setIsGeneratingVideo(true); setVideoProgress(0); setVideoLogs([]); setError(null); setPhase("rendering");

    try {
      let data = storyData;
      if (typeof data === 'string' && data.startsWith('http')) {
        const r = await fetch(data); data = await r.json(); setStoryData(data);
        sessionStorage.setItem("pendingStory", JSON.stringify(data));
      }

      const allImgs = data.image_urls || data.panel_images || [];
      const allScenes = data.final_video_segments || [];
      if (editedScenes.length) {
        for (let i = 0; i < allScenes.length && i < editedScenes.length; i++) {
          if (editedScenes[i]?.narration_segment) allScenes[i].narration_segment = editedScenes[i].narration_segment;
        }
      }
      if (!allImgs.length) throw new Error("No images");
      if (!allScenes.length) throw new Error("No scenes");
      if (!data.audio_url) throw new Error("No audio");

      sessionStorage.setItem("isGeneratingVideo", "true");
      sessionStorage.setItem("videoProgress", "0");
      sessionStorage.setItem("videoLogs", "[]");

      const r = await generateVideoFromScenes({
        imageUrls: allImgs,
        audioUrl: data.audio_url,
        scenes: allScenes,
        removedPanels,
        orientation,
        onProgress: (p) => setVideoProgress(Math.min(Math.floor(p), 100)),
        onLog: (m) => setVideoLogs(prev => [...prev, m]),
      });

      setVideoUrl(r.videoUrl); setVideoBlob(r.blob); setVideoProgress(100);
      sessionStorage.setItem("videoProgress", "100");
      setTimeout(() => { setIsGeneratingVideo(false); sessionStorage.removeItem("isGeneratingVideo"); }, 500);
      showToast.success("Video generated!");
      setPhase("done");
    } catch (err) {
      setError(err.message); setIsGeneratingVideo(false);
      showToast.error(err.message);
    }
  };

  const handleDownload = async () => {
    if (isDownloading) return; setIsDownloading(true);
    const name = `${mangaName || 'manga-video'}.mp4`;
    try {
      let blob = videoBlob;
      if (!blob && videoUrl) { const r = await fetch(videoUrl); blob = await r.blob(); setVideoBlob(blob); }
      if (blob) {
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a'); a.href = url; a.download = name; a.click();
        setTimeout(() => URL.revokeObjectURL(url), 100);
        showToast.successBottom("Downloaded!"); setIsDownloading(false); return;
      }
      throw new Error("No video");
    } catch { showToast.error("Download failed"); setIsDownloading(false); }
  };

  const handleAnalyzeStyle = async () => {
    if (!exampleScript.trim() && !exampleFile) { showToast.error("Provide example script or PDF"); return; }
    setIsAnalyzing(true);
    try {
      const fd = new FormData();
      if (exampleFile) fd.append("example_pdf", exampleFile);
      fd.append("example_script", exampleScript);
      fd.append("language", language);
      const res = await analyzeScriptStyle(fd);
      setStyleGuideline(res.guideline);
      showToast.success("Style guide generated");
    } catch (err) {
      showToast.error(err.message || "Analysis failed");
    }
    setIsAnalyzing(false);
  };

  const handleExampleFile = (f) => {
    if (!f || !f.type.includes("pdf")) { showToast.error("PDF only"); return; }
    setExampleFile(f);
  };

  return (
    <main className="min-h-screen bg-[#0A0A1A] text-white px-6 py-12 relative">
      <Watermark text="生成" sub="GENERATE" />
      <div className="max-w-4xl mx-auto">
        {/* Phase indicator + close button */}
        <div className="flex items-start justify-between mb-16">
          <div className="flex items-center gap-3 font-body text-xs text-gray-600">
            {["Upload", "Configure", "Process", "Preview", "Render", "Done"].map((p, i) => {
              const phases = ["upload", "configure", "processing", "preview", "rendering", "done"];
              const idx = phases.indexOf(phase);
              const active = i === idx; const past = i < idx;
              return (
                <div key={p} className="flex items-center gap-3">
                  <span className={active ? "text-[#FF006E]" : past ? "text-[#00F5D4]" : ""}>
                    {past ? "✓" : active ? "◆" : "○"} {p}
                  </span>
                  {i < phases.length - 1 && <span className="text-white/10">—</span>}
                </div>
              );
            })}
          </div>
          {phase !== "upload" && (
            <button onClick={resetAll}
              className="w-8 h-8 flex items-center justify-center text-white/20 hover:text-[#FF006E] transition-colors text-lg leading-none flex-shrink-0 mt-0.5"
              title="Close and go back to upload">
              ✕
            </button>
          )}
        </div>

        {/* PHASE: Upload */}
        {phase === "upload" && (
          <div
            onDrop={handleDrop} onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
            onDragLeave={() => setIsDragging(false)}
            onClick={() => fileInputRef.current?.click()}
            className={`border border-dashed ${isDragging ? "border-[#FF006E] bg-[#FF006E]/5" : "border-white/20 hover:border-white/40"} p-16 sm:p-24 text-center transition-all cursor-pointer group`}
          >
            <input ref={fileInputRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleFile(e.target.files[0])} />
            <div className="text-4xl mb-6 group-hover:scale-110 transition-transform">📄</div>
            <h2 className="display text-4xl sm:text-5xl text-white mb-3 tracking-wider">Upload your manga</h2>
            <p className="font-body text-sm text-gray-500">Drop a PDF or click to browse. Max 50MB.</p>
          </div>
        )}

        {/* PHASE: Configure */}
        {phase === "configure" && (
          <div>
            <div className="flex items-center gap-4 mb-8">
              <span className="text-3xl">📄</span>
              <div className="flex-1">
                <h2 className="display text-2xl tracking-wider text-white">{file?.name}</h2>
                <button onClick={removeFile} className="font-body text-xs text-gray-500 hover:text-red-400 transition-colors">Remove</button>
              </div>
            </div>

            <div className="grid sm:grid-cols-2 gap-8 mb-10">
              <div>
                <label className="font-body text-xs text-gray-500 uppercase tracking-wider mb-2 block">Language</label>
                <select value={language} onChange={(e) => setLanguage(e.target.value)}
                  className="w-full p-3 bg-transparent border border-white/10 text-white font-body text-sm focus:border-[#FF006E] transition-colors">
                  <option value="hinglish">Hinglish</option>
                  <option value="hindi">Hindi</option>
                  <option value="english">English</option>
                </select>
              </div>
              <div>
                <label className="font-body text-xs text-gray-500 uppercase tracking-wider mb-2 block">Reading direction</label>
                <select value={readingDirection} onChange={(e) => setReadingDirection(e.target.value)}
                  className="w-full p-3 bg-transparent border border-white/10 text-white font-body text-sm focus:border-[#FF006E] transition-colors">
                  <option value="right-to-left">Right to Left (Manga)</option>
                  <option value="left-to-right">Left to Right (Manhwa)</option>
                  <option value="vertical">Top to Bottom (Webtoon)</option>
                </select>
              </div>
              <div>
                <label className="font-body text-xs text-gray-500 uppercase tracking-wider mb-2 block">Orientation</label>
                <select value={orientation} onChange={(e) => setOrientation(e.target.value)}
                  className="w-full p-3 bg-transparent border border-white/10 text-white font-body text-sm focus:border-[#FF006E] transition-colors">
                  <option value="vertical">Vertical (Shorts)</option>
                  <option value="horizontal">Horizontal (16:9)</option>
                </select>
              </div>
              <div className="flex items-end">
                <p className="font-body text-xs text-gray-600">AI Enhanced and Hybrid modes coming soon</p>
              </div>
            </div>

            {/* Script Guide */}
            <div className="mb-10">
              <label className="font-body text-xs text-gray-500 uppercase tracking-wider mb-4 block">Script guide</label>

              {/* Mode selector */}
              <div className="flex gap-0 mb-6 border border-white/10 w-fit">
                {[
                  { key: "auto", label: "AI decides" },
                  { key: "write", label: "Write guide" },
                  { key: "learn", label: "Learn from example" },
                ].map((m) => (
                  <button key={m.key} onClick={() => { setScriptMode(m.key); if (m.key !== "learn") setStyleGuideline(""); }}
                    className={`px-4 py-2 text-xs font-body tracking-wider transition-all ${
                      scriptMode === m.key ? "bg-[#FF006E] text-white" : "text-gray-500 hover:text-white"
                    }`}>
                    {m.label}
                  </button>
                ))}
              </div>

              {/* Mode: AI decides — nothing to show */}
              {scriptMode === "auto" && (
                <p className="font-body text-xs text-gray-600 italic">AI will write the script based on the manga content and selected language. No guidance needed.</p>
              )}

              {/* Mode: Write guide — presets + textarea */}
              {scriptMode === "write" && (
                <>
                  <div className="flex flex-wrap gap-2 mb-4">
                    {SCRIPT_PRESETS.map((p) => (
                      <button key={p.value} onClick={() => setScriptStyle(scriptStyle === p.value ? "" : p.value)}
                        className={`px-3 py-2 text-xs font-body tracking-wider border transition-all ${
                          scriptStyle === p.value
                            ? "border-[#FF006E] text-[#FF006E] bg-[#FF006E]/10"
                            : "border-white/10 text-gray-500 hover:border-white/30 hover:text-white"
                        }`}>
                        {p.label}
                        <span className="block text-[9px] opacity-60 font-normal">{p.desc}</span>
                      </button>
                    ))}
                  </div>
                  <textarea value={scriptStyle} onChange={(e) => setScriptStyle(e.target.value)}
                    placeholder="Write your own: 'Narrate like a noir detective. Make every panel sound like a crime scene report.'"
                    className="w-full p-3 bg-transparent border border-white/10 text-white font-body text-sm resize-none focus:border-[#FF006E] transition-colors"
                    rows={2} />
                </>
              )}

              {/* Mode: Learn from example */}
              {scriptMode === "learn" && (
                <div className="space-y-4">
                  <p className="font-body text-xs text-gray-600">Upload a sample manga PDF and paste its narration script. AI will analyze the writing style and create a guideline for your manga.</p>

                  {/* Example file upload */}
                  <div className="flex items-center gap-4">
                    <button onClick={() => exampleFileRef.current?.click()}
                      className="px-4 py-2 text-xs font-body border border-white/10 text-gray-400 hover:border-white/30 hover:text-white transition-all">
                      {exampleFile ? `📄 ${exampleFile.name}` : "+ Upload example PDF"}
                    </button>
                    <input ref={exampleFileRef} type="file" accept="application/pdf" className="hidden" onChange={(e) => handleExampleFile(e.target.files[0])} />
                    {exampleFile && (
                      <button onClick={() => setExampleFile(null)} className="font-body text-[10px] text-gray-600 hover:text-red-400 transition-colors">
                        ✕ remove
                      </button>
                    )}
                  </div>

                  {/* Example script text */}
                  <textarea value={exampleScript} onChange={(e) => setExampleScript(e.target.value)}
                    placeholder="Paste the example narration script here... (1-2 paragraphs showing the style you want)"
                    className="w-full p-3 bg-transparent border border-white/10 text-white font-body text-sm resize-none focus:border-[#FF006E] transition-colors"
                    rows={4} />

                  {/* Analyze button */}
                  <button onClick={handleAnalyzeStyle} disabled={isAnalyzing}
                    className="px-5 py-2 text-xs font-body border border-[#FF006E]/50 text-[#FF006E] hover:bg-[#FF006E]/10 transition-all disabled:opacity-30">
                    {isAnalyzing ? "Analyzing..." : "⚡ Analyze Style"}
                  </button>

                  {/* Editable guideline */}
                  {styleGuideline && (
                    <div className="border border-[#00F5D4]/20 bg-[#00F5D4]/5 p-4">
                      <label className="font-body text-[10px] text-[#00F5D4] uppercase tracking-wider mb-2 block">AI-generated style guideline (edit freely)</label>
                      <textarea value={styleGuideline} onChange={(e) => setStyleGuideline(e.target.value)}
                        className="w-full bg-transparent text-white font-body text-sm resize-none focus:outline-none"
                        rows={5} />
                    </div>
                  )}
                </div>
              )}
            </div>

            <button onClick={handleGenerateStory}
              className="w-full py-4 display text-lg tracking-wider bg-[#FF006E] text-white hover:bg-[#FF006E]/80 transition-all active:scale-[0.98]">
              Extract & Generate
            </button>
          </div>
        )}

        {/* PHASE: Processing */}
        {phase === "processing" && (
          <div className="py-16">
            <div className="flex items-center gap-4 mb-6">
              <Loader2 className="w-6 h-6 animate-spin text-[#FF006E]" />
              <h2 className="display text-2xl tracking-wider text-white">Processing</h2>
            </div>
            <div className="h-1 bg-white/10 mb-3 overflow-hidden">
              <div className="h-full bg-[#FF006E] transition-all duration-500" style={{ width: `${progress}%` }} />
            </div>
            <p className="font-body text-sm text-gray-500">{progress}% — Extracting panels, generating script & audio</p>
          </div>
        )}

        {/* PHASE: Preview */}
        {phase === "preview" && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <h2 className="display text-2xl tracking-wider text-white">
                Storyboard <span className="font-body text-sm text-gray-500">({editedScenes.filter(s => !removedPanels.has(s.image_page_index)).length}/{editedScenes.length} scenes)</span>
              </h2>
              <div className="flex items-center gap-3">
                {removedPanels.size > 0 && (
                  <button onClick={() => setRemovedPanels(new Set())} className="font-body text-xs text-gray-500 hover:text-white transition-colors">
                    Restore all
                  </button>
                )}
              </div>
            </div>

            {/* Panel-by-panel cards */}
            <div className="space-y-5 mb-10">
              {editedScenes.map((scene, idx) => {
                const imgIdx = scene.image_page_index;
                const removed = removedPanels.has(imgIdx);
                const imgUrl = panelImages[imgIdx];
                if (!imgUrl) return null;
                return (
                  <div key={idx}
                    className={`flex flex-col border transition-all ${
                      removed ? "border-white/5 opacity-30" : "border-white/10 hover:border-white/20"
                    }`}>
                    {/* Image + Narration side by side */}
                    <div className="flex flex-col sm:flex-row">
                      {/* Image — big */}
                      <div className="sm:w-[300px] sm:min-w-[300px] flex-shrink-0 bg-black/40 relative border-b sm:border-b-0 sm:border-r border-white/5">
                        <img src={imgUrl} alt={`panel ${imgIdx}`}
                          crossOrigin="anonymous" referrerPolicy="no-referrer"
                          className="w-full h-auto sm:h-[220px] object-cover"
                          onError={(e) => { e.target.style.opacity = 0.3; }} />
                        <div className="absolute top-2 left-2 bg-black/80 px-2 py-1">
                          <span className="font-body text-xs text-white/70">Panel #{idx + 1}</span>
                        </div>
                      </div>

                      {/* Narration */}
                      <div className="flex-1 p-4 sm:p-5 flex flex-col">
                        <div className="flex items-center gap-3 mb-3">
                          <span className="font-body text-[11px] text-gray-500 uppercase tracking-wider">Scene {idx + 1}</span>
                          {scene.duration && <span className="font-body text-[11px] text-gray-600">({scene.duration}s)</span>}
                          {!removed ? (
                            <span className="font-body text-[10px] text-[#00F5D4]/60">active</span>
                          ) : (
                            <span className="font-body text-[10px] text-red-400/60">skipped</span>
                          )}
                        </div>
                        <textarea value={scene.narration_segment}
                          onChange={(e) => {
                            const n = [...editedScenes];
                            n[idx] = { ...n[idx], narration_segment: e.target.value };
                            setEditedScenes(n);
                          }}
                          className="w-full bg-white/5 text-white font-body text-base leading-relaxed resize-none focus:outline-none focus:bg-white/[0.08] transition-colors p-3 rounded"
                          rows={5} />
                      </div>
                    </div>

                    {/* Remove bar */}
                    <div className="flex border-t border-white/5">
                      <button onClick={() => { const n = new Set(removedPanels); removed ? n.delete(imgIdx) : n.add(imgIdx); setRemovedPanels(n); }}
                        className={`flex-1 py-2.5 flex items-center justify-center gap-2 font-body text-xs tracking-wider transition-all ${
                          removed ? "text-[#00F5D4] bg-[#00F5D4]/5" : "text-white/20 hover:text-red-400 hover:bg-red-500/5"
                        }`}>
                        <Trash className="w-3.5 h-3.5" />
                        {removed ? "Restore panel" : "Remove panel"}
                      </button>
                    </div>
                  </div>
                );
              })}
              {editedScenes.length === 0 && (
                <p className="font-body text-sm text-gray-600 italic py-8 text-center">No story panels found. The PDF may have been all non-story content (ads, covers).</p>
              )}
            </div>

            {/* Action */}
            <div className="flex gap-3">
              <button onClick={handleGenerateStory}
                className="px-6 py-3 font-body text-sm border border-white/20 text-white hover:border-[#FF006E]/50 transition-all">
                Regenerate
              </button>
              <button onClick={handleGenerateVideo}
                className="flex-1 py-3 display text-base tracking-wider bg-[#FF006E] text-white hover:bg-[#FF006E]/80 transition-all active:scale-[0.98]">
                Generate Video
              </button>
            </div>
          </div>
        )}

        {/* PHASE: Rendering */}
        {phase === "rendering" && (
          <div className="py-16">
            <div className="flex items-center gap-4 mb-6">
              <Video className="w-6 h-6 animate-pulse text-[#FF006E]" />
              <h2 className="display text-2xl tracking-wider text-white">Rendering video</h2>
            </div>
            <div className="h-1 bg-white/10 mb-3 overflow-hidden">
              <div className="h-full bg-gradient-to-r from-[#FF006E] via-[#FF6B35] to-[#FFD60A] transition-all duration-300" style={{ width: `${videoProgress}%` }} />
            </div>
            <p className="font-body text-sm text-gray-500 mb-6">{videoProgress}%</p>
            <div className="bg-[#1A1A2E] border border-white/10 p-4 max-h-40 overflow-y-auto font-mono text-xs text-[#00F5D4]">
              {videoLogs.map((log, i) => (
                <div key={i} className="mb-1"><span className="text-[#FF006E]">&gt;</span> {log}</div>
              ))}
            </div>
          </div>
        )}

        {/* PHASE: Done */}
        {phase === "done" && videoUrl && (
          <div>
            <div className="flex items-center justify-between mb-6">
              <div>
                <span className="magazine-kicker">Complete</span>
                <h2 className="display text-3xl sm:text-4xl text-white mt-1">Your video is ready</h2>
              </div>
              <button onClick={handleDownload} disabled={isDownloading}
                className="px-6 py-3 display text-sm tracking-wider bg-[#FF006E] text-white hover:bg-[#FF006E]/80 transition-all active:scale-[0.98] flex items-center gap-2 disabled:opacity-50">
                <Download className="w-4 h-4" /> {isDownloading ? "..." : "Download"}
              </button>
            </div>
            <div className="bg-black border border-white/10 overflow-hidden">
              <video controls className="w-full aspect-video object-cover" controlsList="nodownload">
                <source src={videoUrl} type="video/mp4" />
              </video>
            </div>
            <div className="flex items-center gap-6 mt-6 font-body text-xs text-gray-600">
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-[#00F5D4]" /> Browser generated</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-[#00F5D4]" /> Zero server cost</span>
              <span className="flex items-center gap-1"><CheckCircle className="w-3 h-3 text-[#00F5D4]" /> FFmpeg.wasm</span>
            </div>

            {/* Upload another — faded divider + CTA */}
            <div className="mt-12 pt-8 border-t border-white/5">
              <p className="font-body text-xs text-white/20 mb-4 text-center tracking-widest uppercase">— Done with this? —</p>
              <button onClick={resetAll}
                className="mx-auto flex items-center gap-3 px-8 py-3 border border-white/10 text-white/40 hover:text-white hover:border-[#FF006E]/50 transition-all font-body text-sm tracking-wider">
                + Upload Another
              </button>
            </div>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="mt-6 flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 group">
            <AlertCircle className="w-5 h-5 text-red-400 flex-shrink-0" />
            <p className="font-body text-sm text-red-300 flex-1">{error}</p>
            <button onClick={() => setError(null)}
              className="text-red-400/30 hover:text-red-400 transition-colors text-sm leading-none">
              ✕
            </button>
          </div>
        )}
      </div>
    </main>
  );
};

export default UploadPage;
