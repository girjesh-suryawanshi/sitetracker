"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const expenseController_1 = require("../controllers/expenseController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateToken);
router.get('/', expenseController_1.getExpenses);
router.post('/', expenseController_1.createExpense);
router.put('/:id', expenseController_1.updateExpense);
router.delete('/:id', expenseController_1.deleteExpense);
exports.default = router;
