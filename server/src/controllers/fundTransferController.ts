import { Request, Response } from 'express';
import { prisma } from '../server';
import { Prisma } from '@prisma/client';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const getFundTransfers = async (req: AuthRequest, res: Response) => {
    try {
        const transfers = await prisma.fundTransfer.findMany({
            include: {
                fromAccount: true,
                toAccount: true
            },
            orderBy: { date: 'desc' }
        });
        res.json(transfers);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const createFundTransfer = async (req: AuthRequest, res: Response) => {
    try {
        const { from_account_id, to_account_id, amount, date, description } = req.body;
        const userId = req.user?.userId;

        if (!userId) return res.status(401).json({ error: 'Unauthorized' });

        const result = await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const transfer = await tx.fundTransfer.create({
                data: {
                    from_account_id,
                    to_account_id,
                    amount: Number(amount),
                    date: new Date(date),
                    description,
                    created_by: userId
                }
            });

            // Update balances
            await tx.bankAccount.update({
                where: { id: from_account_id },
                data: { balance: { decrement: Number(amount) } }
            });

            await tx.bankAccount.update({
                where: { id: to_account_id },
                data: { balance: { increment: Number(amount) } }
            });

            return transfer;
        });

        res.status(201).json(result);
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const deleteFundTransfer = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Check if admin? Logic in controller or middleware. Use middleware in routes ideally.

        await prisma.$transaction(async (tx: Prisma.TransactionClient) => {
            const transfer = await tx.fundTransfer.findUnique({ where: { id } });
            if (!transfer) throw new Error('Transfer not found');

            await tx.fundTransfer.delete({ where: { id } });

            // Revert balances
            await tx.bankAccount.update({
                where: { id: transfer.from_account_id },
                data: { balance: { increment: Number(transfer.amount) } }
            });

            await tx.bankAccount.update({
                where: { id: transfer.to_account_id },
                data: { balance: { decrement: Number(transfer.amount) } }
            });
        });

        res.json({ message: 'Fund transfer deleted' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
