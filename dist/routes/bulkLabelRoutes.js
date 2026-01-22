"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const bulkLabelController_1 = require("../controllers/bulkLabelController");
const auth_1 = require("../middleware/auth");
const upload_1 = require("../middleware/upload");
const errorHandler_1 = require("../middleware/errorHandler");
const router = (0, express_1.Router)();
router.post('/UploadBulkLabels', auth_1.authenticate, upload_1.upload.single('file'), (0, errorHandler_1.asyncHandler)(bulkLabelController_1.bulkLabelController.uploadBulkLabels.bind(bulkLabelController_1.bulkLabelController)));
router.get('/ProcessingStatus/:bulkUploadId', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(bulkLabelController_1.bulkLabelController.getProcessingStatus.bind(bulkLabelController_1.bulkLabelController)));
router.get('/PoolStatus', auth_1.authenticate, (0, errorHandler_1.asyncHandler)(bulkLabelController_1.bulkLabelController.getPoolStatus.bind(bulkLabelController_1.bulkLabelController)));
exports.default = router;
//# sourceMappingURL=bulkLabelRoutes.js.map