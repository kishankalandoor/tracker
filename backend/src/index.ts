import express, { Request, Response } from 'express';
import dotenv from 'dotenv';
import cors from 'cors';
import { connectDB } from './config/db';
import { errorHandler } from './middleware/errorMiddleware';
import { metricsMiddleware, register } from './middleware/metrics';
import authRoutes from './routes/authRoutes';
import trackerRoutes from './routes/trackerRoutes';
import aiRoutes from './routes/aiRoutes';
import routineRoutes from './routes/routineRoutes';
import chatRoutes from './routes/chatRoutes';
import plannerRoutes from './routes/plannerRoutes';
import reminderRoutes from './routes/reminderRoutes';

dotenv.config();

const app = express();

// Connect to Database
connectDB();

// Middleware
app.use(cors());
app.use(express.json());

// ── Prometheus HTTP instrumentation (before routes) ──────────────────────────
app.use(metricsMiddleware);

// ── Prometheus scrape endpoint (Prometheus pulls this) ───────────────────────
app.get('/metrics', async (req: Request, res: Response) => {
  try {
    res.set('Content-Type', register.contentType);
    res.end(await register.metrics());
  } catch (err) {
    res.status(500).end(err);
  }
});

// Routes
app.use('/api/auth', authRoutes);
app.use('/api/trackers', trackerRoutes);
app.use('/api/ai', aiRoutes);
app.use('/api/routines', routineRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/planners', plannerRoutes);
app.use('/api/reminders', reminderRoutes);

app.get('/health', (req: Request, res: Response) => {
  res.status(200).json({ status: 'ok' });
});

// Error Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`Server running in ${process.env.NODE_ENV} mode on port ${PORT}`);
});
