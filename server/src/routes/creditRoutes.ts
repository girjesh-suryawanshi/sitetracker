import express from 'express';
import { getCredits, createCredit, updateCredit, deleteCredit } from '../controllers/creditController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getCredits);
router.post('/', createCredit);
router.put('/:id', updateCredit);
router.delete('/:id', deleteCredit);

export default router;
