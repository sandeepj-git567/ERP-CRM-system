import './config'; // Load dotenv first
import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import rateLimit from 'express-rate-limit';
import { config } from './config';
import { errorHandler } from './middleware/errorHandler';

// Routes
import authRoutes from './routes/auth.routes';
import customerRoutes from './routes/customer.routes';
import productRoutes from './routes/product.routes';
import challanRoutes from './routes/challan.routes';
import dashboardRoutes from './routes/dashboard.routes';

import http from 'http';
import { initSocketServer } from './lib/socket';

const app = express();
const httpServer = http.createServer(app);

// Initialize Socket.IO server (skipped in Vercel serverless environment)
if (process.env.VERCEL !== '1') {
  initSocketServer(httpServer);
}

// ─── Security Middleware ──────────────────────────────────────────────────────
app.set('trust proxy', 1);
app.use(helmet());

app.use(
  cors({
    origin: true,
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Rate limiting on login endpoint
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  message: { success: false, message: 'Too many login attempts. Please try again in 15 minutes.', code: 'RATE_LIMITED' },
  standardHeaders: true,
  legacyHeaders: false,
});

// General API rate limiting
const apiLimiter = rateLimit({
  windowMs: 60 * 1000, // 1 minute
  max: 300,
  standardHeaders: true,
  legacyHeaders: false,
});

app.use('/api', apiLimiter);

// ─── Body Parsing ─────────────────────────────────────────────────────────────
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true }));

// ─── Health Check & Root ──────────────────────────────────────────────────────
app.get('/', (_req, res) => {
  res.json({
    status: 'ok',
    name: 'DistribuERP API Server',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
    env: config.nodeEnv,
    endpoints: {
      health: '/health',
      auth: '/api/auth',
      customers: '/api/customers',
      products: '/api/products',
      challans: '/api/challans',
      dashboard: '/api/dashboard',
    },
  });
});

app.get('/health', (_req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString(), env: config.nodeEnv });
});

// ─── API Routes (Dual mounted for standalone Express & Vercel Serverless) ─────
const apiRouter = express.Router();
apiRouter.use('/auth', loginLimiter, authRoutes);
apiRouter.use('/customers', customerRoutes);
apiRouter.use('/products', productRoutes);
apiRouter.use('/challans', challanRoutes);
apiRouter.use('/dashboard', dashboardRoutes);

app.use('/api', apiRouter);
app.use(apiRouter);

// ─── 404 Handler ─────────────────────────────────────────────────────────────
app.use((_req, res) => {
  res.status(404).json({ success: false, message: 'Route not found.', code: 'NOT_FOUND' });
});

// ─── Error Handler ────────────────────────────────────────────────────────────
app.use(errorHandler);

// ─── Start Server ─────────────────────────────────────────────────────────────
if (require.main === module) {
  httpServer.listen(config.port, () => {
    console.log(`🚀 Server running on http://localhost:${config.port}`);
    console.log(`📡 Real-Time WebSockets active on ws://localhost:${config.port}`);
    console.log(`   Environment: ${config.nodeEnv}`);
  });
}

export { app, httpServer };
export default app;
