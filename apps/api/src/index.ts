import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import rateLimit from 'express-rate-limit';

import chatRouter from './routes/chat.js';
import authRouter from './routes/auth.js';
import webhooksRouter from './routes/webhooks.js';
import ebitdaRouter from './routes/tools/ebitda.js';
import digitalMaturityRouter from './routes/tools/digital-maturity.js';
import propertyRoiRouter from './routes/tools/property-roi.js';

const app = express();
const PORT = process.env.PORT ?? 3001;

// ── CORS ─────────────────────────────────────────────────────────────────────
const allowedOrigins = [
  process.env.FRONTEND_ORIGIN ?? 'https://belysiumgroup.com',
  'https://www.belysiumgroup.com',
  // Vercel tool previews
  /https:\/\/.*\.vercel\.app$/,
];
app.use(
  cors({
    origin: (origin, callback) => {
      if (!origin) return callback(null, true); // same-origin / server-to-server
      const allowed = allowedOrigins.some((o) =>
        typeof o === 'string' ? o === origin : o.test(origin)
      );
      callback(allowed ? null : new Error('CORS not allowed'), allowed);
    },
    credentials: true,
  })
);

// ── Body parsing ──────────────────────────────────────────────────────────────
// Raw body needed for webhook signature verification
app.use('/webhooks', express.raw({ type: 'application/json' }), (req, _res, next) => {
  if (Buffer.isBuffer(req.body)) {
    (req as any).rawBody = req.body.toString();
    req.body = JSON.parse((req as any).rawBody);
  }
  next();
});
app.use(express.json({ limit: '1mb' }));

// ── Rate limiting ─────────────────────────────────────────────────────────────
const chatLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 20,
  message: { error: 'Too many requests, please wait a moment.' },
});
const toolLimiter = rateLimit({
  windowMs: 60 * 1000,
  max: 10,
  message: { error: 'Too many requests, please wait a moment.' },
});

// ── Routes ────────────────────────────────────────────────────────────────────
app.get('/health', (_req, res) => res.json({ ok: true, ts: new Date().toISOString() }));

app.use('/chat', chatLimiter, chatRouter);
app.use('/auth', authRouter);
app.use('/webhooks', webhooksRouter);

app.use('/tools/ebitda', toolLimiter, ebitdaRouter);
app.use('/tools/digital-maturity', toolLimiter, digitalMaturityRouter);
app.use('/tools/property-roi', toolLimiter, propertyRoiRouter);

// ── Start ─────────────────────────────────────────────────────────────────────
app.listen(PORT, () => {
  console.log(`Belysium API running on port ${PORT} [${process.env.NODE_ENV ?? 'development'}]`);
});

export default app;
