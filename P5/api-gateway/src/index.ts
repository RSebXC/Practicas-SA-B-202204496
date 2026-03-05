import express, { Request, Response } from 'express';
import { createProxyMiddleware } from 'http-proxy-middleware';
import cors from 'cors';
import morgan from 'morgan';
import rateLimit from 'express-rate-limit';

const app = express();
const PORT = process.env.PORT || 3000;

const SERVICES = {
  auth:         process.env.AUTH_SERVICE_URL         || 'http://localhost:4000',
  payroll:      process.env.PAYROLL_SERVICE_URL      || 'http://localhost:4001',
  approval:     process.env.APPROVAL_SERVICE_URL     || 'http://localhost:4002',
  notification: process.env.NOTIFICATION_SERVICE_URL || 'http://localhost:4003',
};

app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('combined'));
app.use(rateLimit({ windowMs: 15 * 60 * 1000, max: 200 }));

app.get('/health', (_req: Request, res: Response) => {
  res.json({ status: 'UP', service: 'API Gateway', services: SERVICES });
});

app.get('/', (_req: Request, res: Response) => {
  res.json({
    name: 'P4 - API Gateway',
    student: 'Rodrigo Sebastian Castro Aguilar - 202204496',
    endpoints: {
      auth:         '/api/auth/*',
      payroll:      '/api/payroll/*',
      approval:     '/api/approval/*',
      notification: '/api/notifications/*',
    },
  });
});

const proxyError = (name: string) => ({
  on: {
    error: (_err: Error, _req: Request, res: Response) => {
      res.status(503).json({ error: `${name} no disponible` });
    },
  },
});

app.use('/api/auth', createProxyMiddleware({ target: SERVICES.auth, changeOrigin: true, ...proxyError('Auth Service') }));
app.use('/api/payroll', createProxyMiddleware({ target: SERVICES.payroll, changeOrigin: true, pathRewrite: { '^/api/payroll': '' }, ...proxyError('Payroll Service') }));
app.use('/api/approval', createProxyMiddleware({ target: SERVICES.approval, changeOrigin: true, pathRewrite: { '^/api/approval': '' }, ...proxyError('Approval Service') }));
app.use('/api/notifications', createProxyMiddleware({ target: SERVICES.notification, changeOrigin: true, pathRewrite: { '^/api/notifications': '/api/notifications' }, ...proxyError('Notification Service') }));

app.use((_req: Request, res: Response) => res.status(404).json({ error: 'Ruta no encontrada' }));

app.listen(PORT, () => console.log(`[API Gateway] http://localhost:${PORT}`));
