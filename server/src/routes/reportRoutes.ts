import express from 'express';
import { getReportSummary } from '../controllers/reportsController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

router.get('/summary', getReportSummary);

export default router;
