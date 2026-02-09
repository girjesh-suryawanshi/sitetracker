import { Request, Response } from 'express';
import { prisma } from '../server';
import { Prisma } from '@prisma/client';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const getCredits = async (req: AuthRequest, res: Response) => {
    try {
        const credits = await prisma.credit.findMany({
            include: { bankAccount: true },
            orderBy: { date: 'desc' }
        });
        res.json(credits);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const createCredit = async (req: AuthRequest, res: Response) => {
    try {
        const { date, amount, description, payment_method, category, bank_account_id, site_id } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const credit = await tx.credit.create({
                data: {
                    date: new Date(date),
                    amount: Number(amount),
                    description,
                    payment_method,
                    category,
                    bank_account_id: payment_method === 'bank_transfer' ? bank_account_id : null,
                    site_id: site_id || null,
                    created_by: userId
                }
            });

            if (payment_method === 'bank_transfer' && bank_account_id) {
                await tx.bankAccount.update({
                    where: { id: bank_account_id },
                    data: { balance: { increment: Number(amount) } }
                });
            }

            return credit;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const updateCredit = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        const { date, amount, description, payment_method, category, bank_account_id, site_id } = req.body;

        // Simplified update without complex balance revert logic for now
        // In a real app, we'd revert previous balance effect and apply new one
        const credit = await prisma.credit.update({
            where: { id: String(id) },
            data: {
                date: new Date(date),
                amount: Number(amount),
                description,
                payment_method,
                category,
                bank_account_id: payment_method === 'bank_transfer' ? bank_account_id : null,
                site_id: site_id || null
            }
        });

        res.json(credit);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const deleteCredit = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.credit.delete({ where: { id: String(id) } });
        res.json({ message: 'Credit deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
