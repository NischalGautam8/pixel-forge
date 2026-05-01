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


router.get('/:id', async (req, res) => {
  const { id } = req.params;
  // TODO: Fetch job from DB
  
  res.json({
    id,
    status: "processing",
    message: "Job status (mock)"
  });
});

export default router;
