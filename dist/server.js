"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const helmet_1 = __importDefault(require("helmet"));
const dotenv_1 = __importDefault(require("dotenv"));
const index_1 = __importDefault(require("./routes/index"));
const errorHandler_1 = require("./middleware/errorHandler");
const connection_1 = require("./database/connection");
dotenv_1.default.config();
const app = (0, express_1.default)();
const PORT = process.env.PORT || 3000;
app.use((0, helmet_1.default)());
app.use((0, cors_1.default)());
app.use(express_1.default.json({ limit: '10mb' }));
app.use(express_1.default.urlencoded({ extended: true }));
app.use((req, res, next) => {
    console.log(`📨 ${req.method} ${req.path}`);
    next();
});
app.use('/api', index_1.default);
app.use(errorHandler_1.errorHandler);
const startServer = async () => {
    try {
        const connected = await (0, connection_1.testConnection)();
        if (!connected) {
            throw new Error('Database connection failed');
        }
        app.listen(PORT, () => {
            console.log('═══════════════════════════════════════');
            console.log(`Server running on http://localhost:${PORT}`);
            console.log(`Environment: ${process.env.NODE_ENV || 'development'}`);
            console.log(`Database connected`);
            console.log('═══════════════════════════════════════\n');
            console.log('Available endpoints:');
            console.log(`  POST /api/Setup/AddNewUser`);
            console.log(`  POST /api/Setup/UserConfig`);
            console.log(`  POST /api/Setup/UpdateConfig`);
            console.log(`  POST /api/Setup/ConfigDelete`);
            console.log(`  GET  /api/Setup/UserAvailableServices`);
            console.log(`  POST  /api/PrepaidLabel/UploadBulkLabels`);
            console.log(`  GET  /api/PrepaidLabel/ProcessingStatus/:bulkUploadId`);
            console.log(`  GET  /api/PrepaidLabel/PoolStatus`);
        });
    }
    catch (error) {
        console.error('Failed to start server:', error);
        process.exit(1);
    }
};
startServer();
//# sourceMappingURL=server.js.map