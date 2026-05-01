export interface ImageRequest {
  prompt: string;
  negativePrompt?: string;
  style: 'general' | 'realistic' | 'anime' | 'cinematic';
  resolution: '512x512' | '512x768' | '768x512';
  upscale: boolean;
  seed?: number;
}

const STYLE_MAP: Record<string, { checkpoint: string, lora: string | null }> = {
  general:   { checkpoint: 'dreamshaper_8.safetensors', lora: null },
  realistic: { checkpoint: 'realisticVisionV51.safetensors', lora: null },
  anime:     { checkpoint: 'revAnimated_v122.safetensors', lora: null },
  cinematic: { checkpoint: 'dreamshaper_8.safetensors', lora: 'cinematic_v1.safetensors' }, // Example LoRA
};

export function generateWorkflow(request: ImageRequest): any {
  const style = STYLE_MAP[request.style] || STYLE_MAP.general;
  const [width, height] = request.resolution.split('x').map(Number);
  
  const seed = request.seed && request.seed !== -1 
    ? request.seed 
    : Math.floor(Math.random() * 2**32);

  const workflow: any = {
    "1": {
      "class_type": "CheckpointLoaderSimple",
      "inputs": { "ckpt_name": style.checkpoint }
    },
    "2": {
      "class_type": "CLIPTextEncode",
      "inputs": { "text": request.prompt, "clip": ["1", 1] }
    },
    "3": {
      "class_type": "CLIPTextEncode",
      "inputs": {
        "text": request.negativePrompt || "blurry, low quality, distorted, watermark, text",
        "clip": ["1", 1]
      }
    },
    "4": {
      "class_type": "EmptyLatentImage",
      "inputs": { "width": width, "height": height, "batch_size": 1 }
    },
    "5": {
      "class_type": "KSampler",
      "inputs": {
        "model": ["1", 0], 
        "positive": ["2", 0], 
        "negative": ["3", 0],
        "latent_image": ["4", 0],
        "seed": seed,
        "steps": 20, 
        "cfg": 7.0,
        "sampler_name": "euler_ancestral", 
        "scheduler": "normal", 
        "denoise": 1.0
      }
    },
    "6": {
      "class_type": "VAEDecode",
      "inputs": { "samples": ["5", 0], "vae": ["1", 2] }
    },
    "7": {
      "class_type": "SaveImage",
      "inputs": { "images": ["6", 0], "filename_prefix": "output" }
    }
  };

  if (request.upscale) {
    workflow["8"] = {
      "class_type": "UpscaleModelLoader",
      "inputs": { "model_name": "RealESRGAN_x2plus.pth" }
    };
    workflow["9"] = {
      "class_type": "ImageUpscaleWithModel",
      "inputs": { "upscale_model": ["8", 0], "image": ["6", 0] }
    };
    workflow["7"]["inputs"]["images"] = ["9", 0];
  }

  return workflow;
}
