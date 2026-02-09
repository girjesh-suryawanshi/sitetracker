import express from 'express';
import { getUsers, deleteUser } from '../controllers/userController';
import { authenticateToken, requireRole } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

router.get('/', getUsers);
router.delete('/:id', requireRole(['admin']), deleteUser);

export default router;
