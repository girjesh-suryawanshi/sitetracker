import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import { PrismaClient } from '@prisma/client';

import authRoutes from './routes/authRoutes';
import expenseRoutes from './routes/expenseRoutes';
import masterDataRoutes from './routes/masterDataRoutes';
import reportRoutes from './routes/reportRoutes';
import creditRoutes from './routes/creditRoutes';
import fundTransferRoutes from './routes/fundTransferRoutes';
import userRoutes from './routes/userRoutes';

dotenv.config();

const app = express();
export const prisma = new PrismaClient();
const PORT = process.env.PORT || 3000;

import helmet from 'helmet';
import rateLimit from 'express-rate-limit';

// ... imports

app.use(helmet());
app.use(cors());
app.use(express.json());

// Trust proxy for rate limiting behind Nginx
app.set('trust proxy', 1);

// Rate limiting
const limiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 100, // Limit each IP to 100 requests per windowMs
  standardHeaders: true,
  legacyHeaders: false,
});
app.use('/auth', limiter); // Apply stricter limits to auth routes


// Routes
app.use('/auth', authRoutes);
app.use('/expenses', expenseRoutes);
app.use('/api', masterDataRoutes); // Mounting masters under /api
app.use('/reports', reportRoutes);
app.use('/credits', creditRoutes);
app.use('/fund-transfers', fundTransferRoutes);
app.use('/api/users', userRoutes); // Mounting users under /api/users

app.get('/health', (req, res) => {
  res.json({ status: 'ok', timestamp: new Date().toISOString() });
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
