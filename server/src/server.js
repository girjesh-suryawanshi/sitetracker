"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.prisma = void 0;
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const dotenv_1 = __importDefault(require("dotenv"));
const client_1 = require("@prisma/client");
const authRoutes_1 = __importDefault(require("./routes/authRoutes"));
const expenseRoutes_1 = __importDefault(require("./routes/expenseRoutes"));
const masterDataRoutes_1 = __importDefault(require("./routes/masterDataRoutes"));
const reportRoutes_1 = __importDefault(require("./routes/reportRoutes"));
const creditRoutes_1 = __importDefault(require("./routes/creditRoutes"));
const fundTransferRoutes_1 = __importDefault(require("./routes/fundTransferRoutes"));
const userRoutes_1 = __importDefault(require("./routes/userRoutes"));
dotenv_1.default.config();
const app = (0, express_1.default)();
exports.prisma = new client_1.PrismaClient();
const PORT = process.env.PORT || 3000;
app.use((0, cors_1.default)());
app.use(express_1.default.json());
// Routes
app.use('/auth', authRoutes_1.default);
app.use('/expenses', expenseRoutes_1.default);
app.use('/api', masterDataRoutes_1.default); // Mounting masters under /api
app.use('/reports', reportRoutes_1.default);
app.use('/credits', creditRoutes_1.default);
app.use('/fund-transfers', fundTransferRoutes_1.default);
app.use('/api/users', userRoutes_1.default); // Mounting users under /api/users
app.get('/health', (req, res) => {
    res.json({ status: 'ok', timestamp: new Date().toISOString() });
});
app.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
