import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { prisma } from '../server';

const JWT_SECRET = process.env.JWT_SECRET || 'super_secret_jwt_key_change_this_in_production';

export const register = async (req: Request, res: Response) => {
    try {
        const { name, email, password, role } = req.body;

        if (!email || !password || !name) {
            return res.status(400).json({ error: 'Name, email and password are required' });
        }

        const existingUser = await prisma.profile.findUnique({ where: { email } });
        if (existingUser) {
            return res.status(400).json({ error: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await prisma.profile.create({
            data: {
                name,
                email,
                password: hashedPassword,
                role: role || 'viewer',
            },
        });

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.status(201).json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};

export const login = async (req: Request, res: Response) => {
    try {
        const { email, password } = req.body;

        // Check user in DB
        const user = await prisma.profile.findUnique({ where: { email } });

        if (!user) {
            return res.status(400).json({ error: 'Invalid credentials' });
        }

        // Verify password
        const validPassword = await bcrypt.compare(password, user.password);
        if (!validPassword) return res.status(400).json({ error: 'Invalid credentials' });

        // Generate JWT
        const token = jwt.sign(
            { userId: user.id, role: user.role },
            JWT_SECRET,
            { expiresIn: '24h' }
        );

        res.json({ token, user: { id: user.id, name: user.name, role: user.role, email: user.email } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
};
