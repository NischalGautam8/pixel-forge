import { Router } from 'express';
// import { getUploadUrl } from 'shared';

const router = Router();

router.post('/presign', async (req, res) => {
  // const { filename, contentType } = req.body;
  // TODO: Add Clerk Auth check
  
  try {
    // const url = await getUploadUrl('image-factory', `inputs/mock_user/${filename}`, contentType);
    res.json({
      url: "https://mock-presigned-url.com",
      message: "Presigned URL (mock)"
    });
  } catch (error) {
    res.status(500).json({ error: "Failed to generate presigned URL" });
  }
});

export default router;
