import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

import { connectDB } from './config/db.js';
import { errorHandler } from './middleware/errorMiddleware.js';

import authRoutes from './routes/authRoutes.js';
import serviceRoutes from './routes/serviceRoutes.js';
import requestRoutes from './routes/requestRoutes.js';
import quoteRoutes from './routes/quoteRoutes.js';
import bookingRoutes from './routes/bookingRoutes.js';
import disputeRoutes from './routes/disputeRoutes.js';
import invoiceRoutes from './routes/invoiceRoutes.js';
import reviewRoutes from './routes/reviewRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import notificationRoutes from './routes/notificationRoutes.js';
import availabilityRoutes from './routes/availabilityRoutes.js';
import providerRoutes from './routes/providerRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import operationsRoutes from './routes/operationsRoutes.js';
import fileRoutes from './routes/fileRoutes.js';
import aiRoutes from './routes/aiRoutes.js';
import customerRoutes from './routes/customerRoutes.js';
import reassignmentRoutes from './routes/reassignmentRoutes.js';
import { authRateLimiter } from './middleware/rateLimitMiddleware.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Ensure uploads folder exists
const uploadsDir = path.join(__dirname, 'uploads');
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const app = express();
app.disable('x-powered-by');

if (!process.env.JWT_SECRET) {
  console.warn('[Security] JWT_SECRET is not configured. Authentication endpoints will not issue tokens.');
}

const allowedOrigins = (process.env.CLIENT_ORIGINS || 'http://localhost:5173,http://localhost:3000,http://127.0.0.1:3000')
  .split(',').map((origin) => origin.trim()).filter(Boolean);

// Middlewares
app.use(cors({ origin: allowedOrigins, credentials: true }));
app.use(cookieParser());
app.use(express.json({ limit: '1mb' }));
app.use(express.urlencoded({ extended: true, limit: '1mb' }));
app.use((req, res, next) => {
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('X-Frame-Options', 'DENY');
  res.setHeader('Referrer-Policy', 'no-referrer');
  if (process.env.NODE_ENV === 'production') res.setHeader('Strict-Transport-Security', 'max-age=31536000; includeSubDomains');
  next();
});

// Evidence files are served through an authenticated ownership-checking route.
app.use('/api/v1/files', fileRoutes);

// API Endpoint Routes
app.use('/api/v1/auth', authRateLimiter, authRoutes);
app.use('/api/v1/services', serviceRoutes);
app.use('/api/v1/requests', requestRoutes);
app.use('/api/v1/quotes', quoteRoutes);
app.use('/api/v1/bookings', bookingRoutes);
app.use('/api/v1/disputes', disputeRoutes);
app.use('/api/v1/invoices', invoiceRoutes);
app.use('/api/v1/reviews', reviewRoutes);
app.use('/api/v1/analytics', analyticsRoutes);
app.use('/api/v1/notifications', notificationRoutes);
app.use('/api/v1/availability', availabilityRoutes);
app.use('/api/v1/providers', providerRoutes);
app.use('/api/v1/admin', adminRoutes);
app.use('/api/v1/operations', operationsRoutes);
app.use('/api/v1/ai', aiRoutes);
app.use('/api/v1/customers', customerRoutes);
app.use('/api/v1/reassign', reassignmentRoutes);

app.get('/api/health', (req, res) => {
  res.json({ status: 'ok', service: 'CareConnect API', timestamp: new Date() });
});

const frontendDistPath = path.resolve(__dirname, '../frontend/dist');
if (process.env.NODE_ENV === 'production' && fs.existsSync(frontendDistPath)) {
  app.use(express.static(frontendDistPath));
  app.get(/^(?!\/api).*/, (req, res) => {
    res.sendFile(path.join(frontendDistPath, 'index.html'));
  });
}

// Error Handler Middleware
app.use(errorHandler);

const PORT = process.env.PORT || 5000;

// Connect DB & Start Server
connectDB().then(() => {
  app.listen(PORT, () => {
    console.log(`🚀 CareConnect API Server running in ${process.env.NODE_ENV || 'development'} mode on port ${PORT}`);
  });
});
