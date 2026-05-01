import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import path from 'path';
import jobsRouter from './routes/jobs';
import uploadsRouter from './routes/uploads';

dotenv.config();

const app = express();
app.use(cors());
app.use(express.json());

// Serve local images statically
app.use('/uploads', express.static(path.join(__dirname, '../../uploads')));

app.use('/api/jobs', jobsRouter);
app.use('/api/uploads', uploadsRouter);

app.get('/health', (req, res) => {
  res.json({ status: 'ok' });
});

const PORT = process.env.PORT || 3001;
app.listen(PORT, () => {
  console.log(`API server running on port ${PORT}`);
});


