import { Request, Response } from 'express';
import { prisma } from '../server';

// Sites
export const getSites = async (req: Request, res: Response) => {
    try {
        const sites = await prisma.site.findMany({ orderBy: { site_name: 'asc' } });
        res.json(sites);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const createSite = async (req: Request, res: Response) => {
    try {
        const { site_name, location, manager_id } = req.body;
        const site = await prisma.site.create({
            data: { site_name, location, manager_id }
        });
        res.status(201).json(site);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Vendors
export const getVendors = async (req: Request, res: Response) => {
    try {
        const vendors = await prisma.vendor.findMany({ orderBy: { name: 'asc' } });
        res.json(vendors);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const createVendor = async (req: Request, res: Response) => {
    try {
        const { name, contact, gst_number } = req.body;
        const vendor = await prisma.vendor.create({
            data: { name, contact, gst_number }
        });
        res.status(201).json(vendor);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Categories
export const getCategories = async (req: Request, res: Response) => {
    try {
        const categories = await prisma.category.findMany({ orderBy: { category_name: 'asc' } });
        res.json(categories);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const createCategory = async (req: Request, res: Response) => {
    try {
        const { category_name } = req.body;
        const category = await prisma.category.create({
            data: { category_name }
        });
        res.status(201).json(category);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

// Bank Accounts
export const getBankAccounts = async (req: Request, res: Response) => {
    try {
        const accounts = await prisma.bankAccount.findMany({ orderBy: { account_name: 'asc' } });
        res.json(accounts);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const createBankAccount = async (req: Request, res: Response) => {
    try {
        const { account_name, bank_name, account_number, ifsc_code, balance } = req.body;
        const account = await prisma.bankAccount.create({
            data: {
                account_name,
                bank_name,
                account_number,
                ifsc_code,
                balance: Number(balance)
            }
        });
        res.status(201).json(account);
    } catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
};

export const deleteBankAccount = async (req: Request, res: Response) => {
    try {
        const { id } = req.params;
        await prisma.bankAccount.delete({ where: { id: String(id) } });
        res.json({ message: 'Bank account deleted' });
    } catch (error) {
        // Handle FK constraint errors gracefully if needed
        res.status(500).json({ error: 'Server error or account in use' });
    }
};
