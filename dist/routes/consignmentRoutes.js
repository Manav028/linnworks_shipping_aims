"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const consignmentController_1 = require("../controllers/consignmentController");
const auth_1 = require("../middleware/auth");
const router = (0, express_1.Router)();
router.post('/GenerateLabel', auth_1.authenticate, consignmentController_1.consignmentController.generateLabel.bind(consignmentController_1.consignmentController));
router.post('/CancelLabel', auth_1.authenticate, consignmentController_1.consignmentController.cancelLabel.bind(consignmentController_1.consignmentController));
exports.default = router;
//# sourceMappingURL=consignmentRoutes.js.map