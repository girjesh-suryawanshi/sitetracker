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
exports.getReportSummary = void 0;
const server_1 = require("../server");
const getReportSummary = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { start_date, end_date, site_id, vendor_id, category_id, bank_account_id } = req.query;
        const where = {};
        if (start_date || end_date) {
            where.date = {};
            if (start_date)
                where.date.gte = new Date(String(start_date));
            if (end_date)
                where.date.lte = new Date(String(end_date));
        }
        if (site_id && site_id !== 'all')
            where.site_id = String(site_id);
        if (vendor_id && vendor_id !== 'all')
            where.vendor_id = String(vendor_id);
        if (category_id && category_id !== 'all')
            where.category_id = String(category_id);
        if (bank_account_id && bank_account_id !== 'all')
            where.bank_account_id = String(bank_account_id);
        // Fetch Expenses
        const expenses = yield server_1.prisma.expense.findMany({
            where,
            include: { site: true, vendor: true, category: true, bankAccount: true },
            orderBy: { date: 'desc' }
        });
        // Fetch Credits (if no site/vendor/category filters or adjusted logic)
        // Credits don't have site/vendor/category foreign keys in the same way, but have 'category' text string
        const creditWhere = {};
        if (start_date || end_date) {
            creditWhere.date = {};
            if (start_date)
                creditWhere.date.gte = new Date(String(start_date));
            if (end_date)
                creditWhere.date.lte = new Date(String(end_date));
        }
        if (bank_account_id && bank_account_id !== 'all')
            creditWhere.bank_account_id = String(bank_account_id);
        const credits = yield server_1.prisma.credit.findMany({
            where: creditWhere,
            include: { bankAccount: true },
            orderBy: { date: 'desc' }
        });
        // Fetch Transfers
        const transferWhere = {};
        if (start_date || end_date) {
            transferWhere.date = {};
            if (start_date)
                transferWhere.date.gte = new Date(String(start_date));
            if (end_date)
                transferWhere.date.lte = new Date(String(end_date));
        }
        // Filter transfers if bank account is selected (either from or to)
        if (bank_account_id && bank_account_id !== 'all') {
            transferWhere.OR = [
                { from_account_id: String(bank_account_id) },
                { to_account_id: String(bank_account_id) }
            ];
        }
        const transfers = yield server_1.prisma.fundTransfer.findMany({
            where: transferWhere,
            include: { fromAccount: true, toAccount: true },
            orderBy: { date: 'desc' }
        });
        res.json({ expenses, credits, transfers });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.getReportSummary = getReportSummary;
