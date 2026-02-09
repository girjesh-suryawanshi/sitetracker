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
exports.deleteCredit = exports.updateCredit = exports.createCredit = exports.getCredits = void 0;
const server_1 = require("../server");
const getCredits = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const credits = yield server_1.prisma.credit.findMany({
            include: { bankAccount: true },
            orderBy: { date: 'desc' }
        });
        res.json(credits);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.getCredits = getCredits;
const createCredit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { date, amount, description, payment_method, category, bank_account_id, site_id } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const result = yield server_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const credit = yield tx.credit.create({
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
                yield tx.bankAccount.update({
                    where: { id: bank_account_id },
                    data: { balance: { increment: Number(amount) } }
                });
            }
            return credit;
        }));
        res.status(201).json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.createCredit = createCredit;
const updateCredit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        const { date, amount, description, payment_method, category, bank_account_id, site_id } = req.body;
        // Simplified update without complex balance revert logic for now
        // In a real app, we'd revert previous balance effect and apply new one
        const credit = yield server_1.prisma.credit.update({
            where: { id },
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
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.updateCredit = updateCredit;
const deleteCredit = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        yield server_1.prisma.credit.delete({ where: { id } });
        res.json({ message: 'Credit deleted' });
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.deleteCredit = deleteCredit;
