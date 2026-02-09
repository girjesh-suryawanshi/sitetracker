"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const fundTransferController_1 = require("../controllers/fundTransferController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateToken);
router.get('/', fundTransferController_1.getFundTransfers);
router.post('/', fundTransferController_1.createFundTransfer);
router.delete('/:id', (0, authMiddleware_1.requireRole)(['admin']), fundTransferController_1.deleteFundTransfer);
exports.default = router;
