import { Request, Response } from 'express';
import { prisma } from '../server';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const getReportSummary = async (req: AuthRequest, res: Response) => {
    try {
        const { start_date, end_date, site_id, vendor_id, category_id, bank_account_id } = req.query;

        const where: any = {};
        if (start_date || end_date) {
            where.date = {};
            if (start_date) where.date.gte = new Date(String(start_date));
            if (end_date) where.date.lte = new Date(String(end_date));
        }
        if (site_id && site_id !== 'all') where.site_id = String(site_id);
        if (vendor_id && vendor_id !== 'all') where.vendor_id = String(vendor_id);
        if (category_id && category_id !== 'all') where.category_id = String(category_id);
        if (bank_account_id && bank_account_id !== 'all') where.bank_account_id = String(bank_account_id);

        // Fetch Expenses
        const expenses = await prisma.expense.findMany({
            where,
            include: { site: true, vendor: true, category: true, bankAccount: true },
            orderBy: { date: 'desc' }
        });

        // Fetch Credits (if no site/vendor/category filters or adjusted logic)
        // Credits don't have site/vendor/category foreign keys in the same way, but have 'category' text string
        const creditWhere: any = {};
        if (start_date || end_date) {
            creditWhere.date = {};
            if (start_date) creditWhere.date.gte = new Date(String(start_date));
            if (end_date) creditWhere.date.lte = new Date(String(end_date));
        }
        if (bank_account_id && bank_account_id !== 'all') creditWhere.bank_account_id = String(bank_account_id);

        const credits = await prisma.credit.findMany({
            where: creditWhere,
            include: { bankAccount: true },
            orderBy: { date: 'desc' }
        });

        // Fetch Transfers
        const transferWhere: any = {};
        if (start_date || end_date) {
            transferWhere.date = {};
            if (start_date) transferWhere.date.gte = new Date(String(start_date));
            if (end_date) transferWhere.date.lte = new Date(String(end_date));
        }
        // Filter transfers if bank account is selected (either from or to)
        if (bank_account_id && bank_account_id !== 'all') {
            transferWhere.OR = [
                { from_account_id: String(bank_account_id) },
                { to_account_id: String(bank_account_id) }
            ];
        }

        const transfers = await prisma.fundTransfer.findMany({
            where: transferWhere,
            include: { fromAccount: true, toAccount: true },
            orderBy: { date: 'desc' }
        });

        res.json({ expenses, credits, transfers });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
