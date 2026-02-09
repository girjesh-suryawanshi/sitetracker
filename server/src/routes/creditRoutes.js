"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const creditController_1 = require("../controllers/creditController");
const authMiddleware_1 = require("../middleware/authMiddleware");
const router = express_1.default.Router();
router.use(authMiddleware_1.authenticateToken);
router.get('/', creditController_1.getCredits);
router.post('/', creditController_1.createCredit);
router.put('/:id', creditController_1.updateCredit);
router.delete('/:id', creditController_1.deleteCredit);
exports.default = router;
