import { Router } from 'express';
import { Queue } from 'bullmq';
import Redis from 'ioredis';
// import { PrismaClient } from '@prisma/client';

// const prisma = new PrismaClient();
const connection = new Redis(process.env.REDIS_URL || 'redis://127.0.0.1:6379');
const imageQueue = new Queue('image-generation', { connection });
const router = Router();

router.post('/', async (req, res) => {
  const { prompt, settings } = req.body;
  // TODO: Add Clerk Auth check, credit deduction, Prisma job creation
  
  const jobId = `job_${Date.now()}`;
  
  // Enqueue job to BullMQ
  await imageQueue.add('generate-image', {
    jobId,
    request: {
      prompt,
      negativePrompt: settings?.negativePrompt,
      style: settings?.style || 'general',
      resolution: settings?.resolution || '512x512',
      upscale: settings?.upscale || false,
      seed: settings?.seed
    }
  });

  res.json({
    id: jobId,
    status: "queued",
    creditsCharged: settings?.upscale ? 2 : 1,
    estimatedTime: settings?.upscale ? 25 : 20,
    message: "Job enqueued successfully"
  });
});


import fs from 'fs';
import path from 'path';

router.get('/:id', async (req, res) => {
  const { id } = req.params;
  
  // Quick file-system check since DB isn't hooked up yet for status polling
  const filePath = path.join(__dirname, '../../../../uploads', `${id}.png`);
  
  if (fs.existsSync(filePath)) {
    return res.json({
      id,
      status: "completed",
      imageUrl: `http://localhost:3001/uploads/${id}.png`
    });
  }
  
  res.json({
    id,
    status: "processing",
    message: "Image is being generated..."
  });
});

export default router;
