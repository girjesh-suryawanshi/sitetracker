"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.deleteBankAccount = exports.createBankAccount = exports.getBankAccounts = exports.createCategory = exports.getCategories = exports.createVendor = exports.getVendors = exports.createSite = exports.getSites = void 0;
const server_1 = require("../server");
// Sites
const getSites = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const sites = yield server_1.prisma.site.findMany({ orderBy: { site_name: 'asc' } });
        res.json(sites);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.getSites = getSites;
const createSite = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { site_name, location, manager_id } = req.body;
        const site = yield server_1.prisma.site.create({
            data: { site_name, location, manager_id }
        });
        res.status(201).json(site);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.createSite = createSite;
// Vendors
const getVendors = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const vendors = yield server_1.prisma.vendor.findMany({ orderBy: { name: 'asc' } });
        res.json(vendors);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.getVendors = getVendors;
const createVendor = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { name, contact, gst_number } = req.body;
        const vendor = yield server_1.prisma.vendor.create({
            data: { name, contact, gst_number }
        });
        res.status(201).json(vendor);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.createVendor = createVendor;
// Categories
const getCategories = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const categories = yield server_1.prisma.category.findMany({ orderBy: { category_name: 'asc' } });
        res.json(categories);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.getCategories = getCategories;
const createCategory = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { category_name } = req.body;
        const category = yield server_1.prisma.category.create({
            data: { category_name }
        });
        res.status(201).json(category);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.createCategory = createCategory;
// Bank Accounts
const getBankAccounts = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const accounts = yield server_1.prisma.bankAccount.findMany({ orderBy: { account_name: 'asc' } });
        res.json(accounts);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.getBankAccounts = getBankAccounts;
const createBankAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { account_name, bank_name, account_number, ifsc_code, balance } = req.body;
        const account = yield server_1.prisma.bankAccount.create({
            data: {
                account_name,
                bank_name,
                account_number,
                ifsc_code,
                balance: Number(balance)
            }
        });
        res.status(201).json(account);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.createBankAccount = createBankAccount;
const deleteBankAccount = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield server_1.prisma.bankAccount.delete({ where: { id } });
        res.json({ message: 'Bank account deleted' });
    }
    catch (error) {
        // Handle FK constraint errors gracefully if needed
        res.status(500).json({ error: 'Server error or account in use' });
    }
});
exports.deleteBankAccount = deleteBankAccount;
