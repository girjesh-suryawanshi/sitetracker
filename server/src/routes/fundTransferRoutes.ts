import express from 'express';
import { getFundTransfers, createFundTransfer, deleteFundTransfer } from '../controllers/fundTransferController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getFundTransfers);
router.post('/', createFundTransfer);
router.delete('/:id', requireRole(['admin']), deleteFundTransfer);

export default router;
