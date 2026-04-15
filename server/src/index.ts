import './config/env.js';
import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import { ensureTempDir, cleanStaleTempDirs } from './utils/temp.js';
import { healthRouter } from './routes/health.js';
import { generateRouter } from './routes/generate.js';
import { statusRouter } from './routes/status.js';

const PORT = Number(process.env.PORT ?? 4000);
const FRONTEND_URL = process.env.NEXT_PUBLIC_APP_URL ?? 'http://localhost:3000';

const app = express();

app.use(cors({ origin: FRONTEND_URL, credentials: true }));
app.use(morgan(process.env.NODE_ENV === 'production' ? 'combined' : 'dev'));
app.use(express.json({ limit: '1mb' }));

app.use('/health', healthRouter);
app.use('/api', generateRouter);
app.use('/api', statusRouter);

await ensureTempDir();

// purge stale temp dirs every 2 hours
setInterval(() => void cleanStaleTempDirs(), 2 * 60 * 60 * 1000);

app.listen(PORT, () => {
  console.log(`[server] running on port ${PORT} — env=${process.env.NODE_ENV ?? 'development'}`);
});
