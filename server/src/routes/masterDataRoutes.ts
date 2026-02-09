import express from 'express';
import {
    getSites, createSite,
    getVendors, createVendor,
    getCategories, createCategory,
    getBankAccounts, createBankAccount, deleteBankAccount
} from '../controllers/masterDataController';
import { authenticateToken } from '../middleware/authMiddleware';

const router = express.Router();

router.use(authenticateToken);

router.get('/sites', getSites);
router.post('/sites', createSite);

router.get('/vendors', getVendors);
router.post('/vendors', createVendor);

router.get('/categories', getCategories);
router.post('/categories', createCategory);

router.get('/bank-accounts', getBankAccounts);
router.post('/bank-accounts', createBankAccount);
router.delete('/bank-accounts/:id', deleteBankAccount);

export default router;
