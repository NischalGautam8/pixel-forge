import { Queue, Worker } from 'bullmq';
import Redis from 'ioredis';
import fs from 'fs';
import path from 'path';
import { generateWorkflow, ImageRequest } from '../workflows/generator';
import { submitToComfyUI, pollComfyUI } from '../dispatchers/local';
// import { uploadBuffer, getDownloadUrl } from 'shared'; // Assuming built

const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');

export const imageQueue = new Queue('image-generation', {
  connection,
  defaultJobOptions: {
    attempts: 3,
    backoff: { type: 'exponential', delay: 5000 },
    removeOnComplete: { count: 1000 },
    removeOnFail: { count: 500 },
  },
});

const imageWorker = new Worker('image-generation', async (job) => {
  const { jobId, request } = job.data as { jobId: string, request: ImageRequest };
  
  console.log(`[Job ${jobId}] Started processing`);
  
  // 1. Generate Workflow JSON
  const workflow = generateWorkflow(request);
  console.log(`[Job ${jobId}] Workflow generated`);
  
  // 2. Submit to local ComfyUI
  const promptId = await submitToComfyUI(workflow);
  console.log(`[Job ${jobId}] Submitted to ComfyUI, Prompt ID: ${promptId}`);
  
  // 3. Poll for completion (up to 2 minutes)
  const result = await pollComfyUI(promptId, 120_000);
  console.log(`[Job ${jobId}] Generation complete. Image size: ${result.imageBytes.length} bytes`);
  
  // 4. Save to Local API Uploads Directory
  const filename = `${jobId}.png`;
  // Construct path to: apps/api/uploads/
  const uploadDir = path.join(__dirname, '../../../../api/uploads');
  const filePath = path.join(uploadDir, filename);
  
  console.log(`[Job ${jobId}] Saving to local file system...`);
  
  if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
  }
  
  fs.writeFileSync(filePath, result.imageBytes);
  
  // URL format matches the express.static route in the API
  const imageUrl = `http://localhost:3001/uploads/${filename}`;
  console.log(`[Job ${jobId}] Saved successfully`);
  
  // 5. TODO: Update database status using Prisma
  
  return { imageUrl, promptId };
}, {
  connection,
  concurrency: 1, // GTX 1650 constraint: process 1 job at a time
});

imageWorker.on('completed', (job, result) => {
  console.log(`[Job ${job?.data.jobId}] Completed successfully! URL: ${result.imageUrl}`);
});

imageWorker.on('failed', async (job, err) => {
  console.error(`[Job ${job?.data.jobId}] Failed: ${err.message}`);
  
  if (err.message.includes('OOM') && job && job.attemptsMade < 3) {
    console.log(`[Job ${job.data.jobId}] OOM detected, downgrading resolution for retry...`);
    job.data.request.resolution = '512x512';
    job.data.request.upscale = false;
    await job.updateData(job.data);
  }
});
