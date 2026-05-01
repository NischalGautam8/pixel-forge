# PixelForge AI 🎨

PixelForge is a local-first, scalable AI Image Generation SaaS designed specifically to run on consumer hardware with low VRAM (like the **NVIDIA GTX 1650 4GB**) using heavily optimized SD 1.5 pipelines, before eventually scaling to cloud GPU providers.

## Architecture 🏗️

This is a full-stack **Turborepo** monorepo featuring a decoupled architecture:

- **`apps/api`**: Node.js + Express backend handling authentication, credits, and incoming generation requests.
- **`apps/orchestrator`**: Node.js + BullMQ worker service that pulls jobs from Redis, generates ComfyUI workflows, and dispatches them to the local GPU worker sequentially to prevent OOM errors.
- **`apps/web`**: Next.js 14 frontend (App Router) for the user dashboard and prompt interface.
- **`packages/shared`**: Shared TypeScript types and utility functions (e.g., Cloudflare R2 / AWS S3 uploads).
- **`worker/`**: The local Python-based ComfyUI environment executing the actual Stable Diffusion inference.

---

## Hardware Requirements (Local MVP) 💻
- **GPU**: NVIDIA GTX 1650 (4GB VRAM) or better.
- **RAM**: 16GB System RAM recommended (ComfyUI `--lowvram` flag heavily relies on offloading weights to system RAM).
- **Storage**: ~10GB for ComfyUI, PyTorch, and base Checkpoint/LoRA models.

---

## Quick Start Setup 🚀

### 1. Monorepo Setup (Node.js)
Ensure you have Node.js (v18+) and Redis installed.
```bash
# Install dependencies across all workspaces
npm install

# Setup Prisma Database (Requires PostgreSQL)
cd apps/api
npx prisma generate
npx prisma db push
```

### 2. Local GPU Worker Setup (Python)
You need to clone ComfyUI and download the necessary AI models.

```bash
cd worker
git clone https://github.com/comfyanonymous/ComfyUI.git comfyui
cd comfyui

# Create virtual environment and install dependencies
python -m venv venv
.\venv\Scripts\activate
pip install torch torchvision torchaudio --index-url https://download.pytorch.org/whl/cu121
pip install -r requirements.txt
```

#### Download Models
Place the following models in your `worker/models` directory:
- **Base Model**: [DreamShaper v8 (.safetensors)](https://civitai.com/models/4384/dreamshaper) -> Place in `worker/models/checkpoints/`
- **Upscaler**: [RealESRGAN_x2plus.pth](https://github.com/xinntao/Real-ESRGAN/releases) -> Place in `worker/models/upscale_models/`

### 3. Running the Stack ⚡

You need to run 4 separate processes:

**Terminal 1: Redis**
Ensure your local Redis server is running on `127.0.0.1:6379`.

**Terminal 2: Local GPU Worker (ComfyUI)**
```bash
cd worker
.\start.bat
# This launches ComfyUI on port 8188 with --lowvram optimizations
```

**Terminal 3: Orchestrator**
```bash
cd apps/orchestrator
npm run dev
# Listens to BullMQ and dispatches jobs to localhost:8188
```

**Terminal 4: API**
```bash
cd apps/api
npm run dev
# Starts Express server on port 3001
```

---

## Making a Request

Once everything is running, you can test the pipeline by POSTing to the API:

```json
POST http://localhost:3001/api/jobs
{
  "prompt": "A futuristic cyberpunk city at night, neon lights, highly detailed",
  "settings": {
    "style": "cinematic",
    "resolution": "512x512",
    "upscale": true
  }
}
```

The image will be generated and saved directly to `apps/api/uploads/` and served statically!

---

## Future Roadmap 🗺️
- **Phase 3**: Connect the Next.js frontend to the API.
- **Phase 4**: Stripe billing and Credit top-ups.
- **Phase 5**: Cloud scaling (RunPod) for Video Generation pipelines (Wan2.1) once local Image Generation is stable.
