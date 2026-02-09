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
exports.deleteFundTransfer = exports.createFundTransfer = exports.getFundTransfers = void 0;
const server_1 = require("../server");
const getFundTransfers = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const transfers = yield server_1.prisma.fundTransfer.findMany({
            include: {
                fromAccount: true,
                toAccount: true
            },
            orderBy: { date: 'desc' }
        });
        res.json(transfers);
    }
    catch (error) {
        res.status(500).json({ error: 'Server error' });
    }
});
exports.getFundTransfers = getFundTransfers;
const createFundTransfer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    var _a;
    try {
        const { from_account_id, to_account_id, amount, date, description } = req.body;
        const userId = (_a = req.user) === null || _a === void 0 ? void 0 : _a.userId;
        if (!userId)
            return res.status(401).json({ error: 'Unauthorized' });
        const result = yield server_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const transfer = yield tx.fundTransfer.create({
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
            yield tx.bankAccount.update({
                where: { id: from_account_id },
                data: { balance: { decrement: Number(amount) } }
            });
            yield tx.bankAccount.update({
                where: { id: to_account_id },
                data: { balance: { increment: Number(amount) } }
            });
            return transfer;
        }));
        res.status(201).json(result);
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.createFundTransfer = createFundTransfer;
const deleteFundTransfer = (req, res) => __awaiter(void 0, void 0, void 0, function* () {
    try {
        const { id } = req.params;
        // Check if admin? Logic in controller or middleware. Use middleware in routes ideally.
        yield server_1.prisma.$transaction((tx) => __awaiter(void 0, void 0, void 0, function* () {
            const transfer = yield tx.fundTransfer.findUnique({ where: { id: String(id) } });
            if (!transfer)
                throw new Error('Transfer not found');
            yield tx.fundTransfer.delete({ where: { id: String(id) } });
            // Revert balances
            yield tx.bankAccount.update({
                where: { id: transfer.from_account_id },
                data: { balance: { increment: Number(transfer.amount) } }
            });
            yield tx.bankAccount.update({
                where: { id: transfer.to_account_id },
                data: { balance: { decrement: Number(transfer.amount) } }
            });
        }));
        res.json({ message: 'Fund transfer deleted' });
    }
    catch (error) {
        console.error(error);
        res.status(500).json({ error: 'Server error' });
    }
});
exports.deleteFundTransfer = deleteFundTransfer;
