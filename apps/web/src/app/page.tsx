"use client";

import { useState, useEffect } from "react";
import { Sparkles, Image as ImageIcon, Loader2, Download, Wand2, Settings2, SlidersHorizontal, Zap } from "lucide-react";

export default function Home() {
  const [prompt, setPrompt] = useState("");
  const [style, setStyle] = useState("cinematic");
  const [resolution, setResolution] = useState("512x512");
  
  const [status, setStatus] = useState<"idle" | "generating" | "completed" | "error">("idle");
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState("");
  const [progressText, setProgressText] = useState("");
  const [mousePos, setMousePos] = useState({ x: 0, y: 0 });

  // Subtle mouse tracking for the glow effect
  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      setMousePos({ x: e.clientX, y: e.clientY });
    };
    window.addEventListener("mousemove", handleMouseMove);
    return () => window.removeEventListener("mousemove", handleMouseMove);
  }, []);

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!prompt) return;

    setStatus("generating");
    setImageUrl(null);
    setErrorMsg("");
    setProgressText("Initializing local GPU worker...");

    try {
      const res = await fetch("http://localhost:3001/api/jobs", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ prompt, settings: { style, resolution, upscale: false } })
      });

      if (!res.ok) throw new Error("Failed to enqueue job");
      const data = await res.json();
      const jobId = data.id;

      let attempts = 0;
      const pollInterval = setInterval(async () => {
        attempts++;
        if (attempts > 60) {
          clearInterval(pollInterval);
          setStatus("error");
          setErrorMsg("Generation timed out. Is ComfyUI running?");
          return;
        }

        try {
          const pollRes = await fetch(`http://localhost:3001/api/jobs/${jobId}`);
          const pollData = await pollRes.json();

          if (pollData.status === "completed" && pollData.imageUrl) {
            clearInterval(pollInterval);
            setImageUrl(pollData.imageUrl);
            setStatus("completed");
          } else {
            const texts = [
              "Warming up neural network...",
              "Calculating latent noise vectors...",
              "Applying style conditioning...",
              "Running Euler Ancestral steps...",
              "Decoding VAE output...",
              "Finalizing pixel data..."
            ];
            setProgressText(texts[Math.min(Math.floor(attempts / 3), texts.length - 1)]);
          }
        } catch (pollErr) {
          console.error(pollErr);
        }
      }, 2000);

    } catch (err: any) {
      setStatus("error");
      setErrorMsg(err.message);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white font-sans overflow-x-hidden selection:bg-purple-500/30">
      
      {/* Interactive Background Glow */}
      <div 
        className="pointer-events-none fixed inset-0 z-0 transition-opacity duration-300"
        style={{
          background: `radial-gradient(600px circle at ${mousePos.x}px ${mousePos.y}px, rgba(139, 92, 246, 0.07), transparent 40%)`
        }}
      />
      
      {/* Fixed Ambient Meshes */}
      <div className="fixed top-0 left-0 w-full h-full overflow-hidden pointer-events-none z-0">
        <div className="absolute top-[-20%] left-[-10%] w-[50%] h-[50%] bg-indigo-600/10 blur-[150px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '8s' }} />
        <div className="absolute bottom-[-20%] right-[-10%] w-[60%] h-[60%] bg-purple-600/10 blur-[150px] rounded-full mix-blend-screen animate-pulse" style={{ animationDuration: '12s' }} />
      </div>

      <nav className="relative z-10 w-full px-8 py-6 flex items-center justify-between border-b border-white/[0.05] bg-black/20 backdrop-blur-xl">
        <div className="flex items-center space-x-3">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-tr from-indigo-500 to-purple-500 flex items-center justify-center shadow-[0_0_20px_rgba(139,92,246,0.3)]">
            <Sparkles className="w-5 h-5 text-white" />
          </div>
          <span className="text-xl font-bold tracking-tight bg-clip-text text-transparent bg-gradient-to-r from-white to-white/60">
            PixelForge
          </span>
        </div>
        <div className="flex items-center space-x-4">
          <div className="px-3 py-1.5 rounded-full bg-white/5 border border-white/10 text-xs font-medium text-white/70 flex items-center space-x-2">
            <Zap className="w-3.5 h-3.5 text-yellow-500" />
            <span>GTX 1650 Engine Active</span>
          </div>
        </div>
      </nav>

      <main className="relative z-10 max-w-7xl mx-auto px-6 py-12 grid lg:grid-cols-[400px_1fr] gap-8 items-start h-[calc(100vh-85px)]">
        
        {/* Left Column: Premium Control Panel */}
        <div className="flex flex-col h-full space-y-6">
          <div className="space-y-2">
            <h1 className="text-3xl font-bold tracking-tight">Create</h1>
            <p className="text-sm text-white/50 leading-relaxed">
              Describe your vision in detail. Our local SD 1.5 pipeline will forge it into reality in seconds.
            </p>
          </div>

          <form onSubmit={handleGenerate} className="flex-1 flex flex-col space-y-6">
            
            {/* Prompt Editor */}
            <div className="relative group flex-1 min-h-[200px]">
              <div className="absolute -inset-0.5 bg-gradient-to-r from-indigo-500 to-purple-500 rounded-2xl blur opacity-20 group-hover:opacity-40 transition duration-500" />
              <div className="relative h-full bg-[#0a0a0a] border border-white/10 rounded-2xl p-5 flex flex-col transition-all duration-300">
                <textarea 
                  value={prompt}
                  onChange={(e) => setPrompt(e.target.value)}
                  placeholder="A cinematic macro shot of a bioluminescent jellyfish floating through a neon-lit cyberpunk city street, 8k resolution, photorealistic..."
                  className="w-full flex-1 bg-transparent text-white/90 placeholder:text-white/20 focus:outline-none resize-none text-base leading-relaxed"
                  required
                />
                <div className="flex items-center justify-between pt-4 border-t border-white/5 mt-4">
                  <span className="text-xs text-white/30 font-mono">{prompt.length} / 500</span>
                  <Wand2 className="w-4 h-4 text-white/30" />
                </div>
              </div>
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-4">
              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center space-x-2">
                  <Settings2 className="w-3.5 h-3.5" />
                  <span>Aesthetic</span>
                </label>
                <div className="relative">
                  <select 
                    value={style}
                    onChange={(e) => setStyle(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none hover:bg-white/10 transition-colors"
                  >
                    <option value="cinematic" className="bg-[#0a0a0a]">Cinematic Light</option>
                    <option value="realistic" className="bg-[#0a0a0a]">Photorealism</option>
                    <option value="anime" className="bg-[#0a0a0a]">Studio Anime</option>
                    <option value="general" className="bg-[#0a0a0a]">DreamShaper Default</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <SlidersHorizontal className="w-4 h-4 text-white/40" />
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-semibold text-white/50 uppercase tracking-wider flex items-center space-x-2">
                  <ImageIcon className="w-3.5 h-3.5" />
                  <span>Dimensions</span>
                </label>
                <div className="relative">
                  <select 
                    value={resolution}
                    onChange={(e) => setResolution(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-3.5 text-sm text-white focus:outline-none focus:ring-2 focus:ring-purple-500/50 appearance-none hover:bg-white/10 transition-colors"
                  >
                    <option value="512x512" className="bg-[#0a0a0a]">Square (512²)</option>
                    <option value="512x768" className="bg-[#0a0a0a]">Portrait (3:4)</option>
                    <option value="768x512" className="bg-[#0a0a0a]">Landscape (4:3)</option>
                  </select>
                  <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none">
                    <SlidersHorizontal className="w-4 h-4 text-white/40" />
                  </div>
                </div>
              </div>
            </div>

            <button 
              type="submit"
              disabled={status === "generating" || !prompt}
              className="group relative w-full h-14 overflow-hidden rounded-xl disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="absolute inset-0 bg-gradient-to-r from-indigo-500 via-purple-500 to-indigo-500 bg-[length:200%_auto] hover:bg-[position:right_center] transition-all duration-500" />
              <div className="absolute inset-[1px] bg-black/40 rounded-xl backdrop-blur-sm group-hover:bg-black/20 transition-all duration-300" />
              
              <div className="relative h-full flex items-center justify-center space-x-2 font-medium tracking-wide">
                {status === "generating" ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-white" />
                    <span className="text-white">Forging Pixels...</span>
                  </>
                ) : (
                  <>
                    <span className="text-white">Forge Image</span>
                    <Sparkles className="w-4 h-4 text-white/70 group-hover:text-white transition-colors" />
                  </>
                )}
              </div>
            </button>
          </form>
        </div>

        {/* Right Column: The Canvas */}
        <div className="relative w-full h-full min-h-[500px] bg-[#080808] border border-white/5 rounded-3xl overflow-hidden shadow-[0_0_40px_rgba(0,0,0,0.5)] flex items-center justify-center group/canvas">
          
          {/* Subtle grid background */}
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAiIGhlaWdodD0iMjAiIHhtbG5zPSJodHRwOi8vd3d3LnczLm9yZy8yMDAwL3N2ZyI+PGNpcmNsZSBjeD0iMSIgY3k9IjEiIHI9IjEiIGZpbGw9InJnYmEoMjU1LDI1NSwyNTUsMC4wNSkiLz48L3N2Zz4=')] opacity-50" />

          {status === "idle" && (
            <div className="relative z-10 flex flex-col items-center justify-center space-y-4 text-center px-6">
              <div className="w-20 h-20 rounded-2xl bg-white/5 border border-white/10 flex items-center justify-center shadow-2xl backdrop-blur-xl">
                <ImageIcon className="w-8 h-8 text-white/20" />
              </div>
              <div>
                <p className="text-lg font-medium text-white/70">Awaiting your prompt</p>
                <p className="text-sm text-white/30 mt-1 max-w-sm">
                  The GPU is standing by. Enter a description on the left to begin the generation process.
                </p>
              </div>
            </div>
          )}

          {status === "generating" && (
            <div className="relative z-10 w-full h-full flex flex-col items-center justify-center bg-black/60 backdrop-blur-xl">
              {/* Premium Scanning Animation */}
              <div className="relative w-64 h-64 border border-white/10 rounded-2xl overflow-hidden bg-white/5 shadow-2xl">
                <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-b from-transparent via-purple-500/20 to-transparent animate-[scan_2s_ease-in-out_infinite]" />
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="w-16 h-16 border-2 border-t-purple-500 border-r-indigo-500 border-b-transparent border-l-transparent rounded-full animate-spin" />
                </div>
              </div>
              <div className="mt-8 flex flex-col items-center">
                <p className="text-white/90 font-medium tracking-wide">{progressText}</p>
                <div className="mt-4 w-48 h-1 bg-white/10 rounded-full overflow-hidden">
                  <div className="h-full bg-gradient-to-r from-indigo-500 to-purple-500 w-1/2 animate-[progress_1.5s_ease-in-out_infinite]" />
                </div>
              </div>
            </div>
          )}

          {status === "error" && (
            <div className="relative z-10 flex flex-col items-center justify-center p-8 text-center max-w-md">
              <div className="w-16 h-16 rounded-2xl bg-red-500/10 border border-red-500/20 flex items-center justify-center mb-6">
                <span className="text-3xl">⚠️</span>
              </div>
              <h3 className="text-xl font-semibold text-white mb-2">Generation Interrupted</h3>
              <p className="text-white/60 text-sm leading-relaxed">{errorMsg}</p>
            </div>
          )}

          {status === "completed" && imageUrl && (
            <div className="absolute inset-0 w-full h-full">
              {/* eslint-disable-next-line @next/next/no-img-element */}
              <img 
                src={imageUrl} 
                alt="Generated Art" 
                className="w-full h-full object-contain bg-black/50"
              />
              
              {/* Premium Overlay */}
              <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-black/20 to-transparent opacity-0 group-hover/canvas:opacity-100 transition-opacity duration-500 flex flex-col justify-end p-8">
                <div className="transform translate-y-4 group-hover/canvas:translate-y-0 transition-transform duration-500 flex items-end justify-between">
                  <div className="backdrop-blur-md bg-black/40 border border-white/10 p-4 rounded-2xl max-w-sm">
                    <p className="text-white/90 text-sm font-medium line-clamp-3 leading-relaxed">
                      "{prompt}"
                    </p>
                    <div className="flex items-center space-x-3 mt-3">
                      <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-mono text-white/70 uppercase tracking-wider">{style}</span>
                      <span className="px-2 py-1 bg-white/10 rounded text-[10px] font-mono text-white/70 uppercase tracking-wider">{resolution}</span>
                    </div>
                  </div>
                  
                  <a 
                    href={imageUrl} 
                    download={`pixelforge-${Date.now()}.png`}
                    target="_blank"
                    className="flex items-center justify-center w-14 h-14 bg-white hover:bg-zinc-200 text-black rounded-full shadow-[0_0_30px_rgba(255,255,255,0.3)] hover:scale-105 active:scale-95 transition-all"
                  >
                    <Download className="w-6 h-6" />
                  </a>
                </div>
              </div>
            </div>
          )}
          
        </div>
      </main>
      
      {/* Required for the scanning and progress animations */}
      <style dangerouslySetInnerHTML={{__html: `
        @keyframes scan {
          0% { transform: translateY(-100%); }
          100% { transform: translateY(100%); }
        }
        @keyframes progress {
          0% { transform: translateX(-100%); }
          100% { transform: translateX(200%); }
        }
      `}} />
    </div>
  );
}
