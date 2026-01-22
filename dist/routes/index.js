"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const setupRoutes_1 = __importDefault(require("./setupRoutes"));
const bulkLabelRoutes_1 = __importDefault(require("./bulkLabelRoutes"));
const consignmentRoutes_1 = __importDefault(require("./consignmentRoutes"));
const router = (0, express_1.Router)();
router.use('/Setup', setupRoutes_1.default);
router.use('/PrepaidLabel', bulkLabelRoutes_1.default);
router.use('/Consignment', consignmentRoutes_1.default);
router.get('/health', (req, res) => {
    res.json({
        status: 'healthy',
        timestamp: new Date().toISOString()
    });
});
exports.default = router;
//# sourceMappingURL=index.js.map