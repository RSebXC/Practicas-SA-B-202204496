import express from 'express';
import cors from 'cors';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/authRoutes';
import { initTable } from './services/authService';

const app  = express();
const PORT = process.env.PORT || 4000;

app.use(cors({ origin: '*', credentials: true }));
app.use(morgan('dev'));
app.use(express.json());
app.use(cookieParser());

app.use('/api/auth', authRoutes);
app.get('/health', (_req, res) =>
  res.json({ status: 'UP', service: 'Auth Service', port: PORT })
);

(async () => {
  await initTable();
  app.listen(PORT, () => console.log(`[Auth Service] http://localhost:${PORT}`));
})();
