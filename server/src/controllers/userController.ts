import { Request, Response } from 'express';
import { prisma } from '../server';

interface AuthRequest extends Request {
    user?: {
        userId: string;
        role: string;
    };
}

export const getUsers = async (req: AuthRequest, res: Response) => {
    try {
        const users = await prisma.profile.findMany({
            orderBy: { createdAt: 'desc' },
            select: {
                id: true,
                email: true,
                name: true,
                role: true,
                createdAt: true,
                // Exclude password
            }
        });
        res.json(users);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const deleteUser = async (req: AuthRequest, res: Response) => {
    try {
        const { id } = req.params;

        // Prevent deleting self?
        if (req.user?.userId === id) {
            return res.status(400).json({ error: 'Cannot delete yourself' });
        }

        await prisma.profile.delete({ where: { id: String(id) } });
        res.json({ message: 'User deleted' });
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};
