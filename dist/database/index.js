"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.initDatabase = void 0;
const connection_1 = __importDefault(require("./connection"));
const initDatabase = async () => {
    try {
        await connection_1.default.query('SELECT 1');
        console.log('Database initialized and ready');
    }
    catch (error) {
        console.error('Database initialization failed:', error);
        process.exit(1);
    }
};
exports.initDatabase = initDatabase;
exports.default = connection_1.default;
//# sourceMappingURL=index.js.map