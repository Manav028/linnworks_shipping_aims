"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = require("express");
const setupController_1 = require("../controllers/setupController");
const auth_1 = require("../middleware/auth");
const validation_1 = require("../middleware/validation");
const errorHandler_1 = require("../middleware/errorHandler");
const validation_2 = require("../middleware/validation");
const router = (0, express_1.Router)();
router.post('/AddNewUser', (0, validation_1.validateRequest)(validation_2.addNewUserSchema), (0, errorHandler_1.asyncHandler)(setupController_1.setupController.addNewUser.bind(setupController_1.setupController)));
router.post('/UserConfig', (0, validation_1.validateRequest)(validation_2.userConfigSchema), auth_1.authenticate, (0, errorHandler_1.asyncHandler)(setupController_1.setupController.userConfig.bind(setupController_1.setupController)));
router.post('/UpdateConfig', (0, validation_1.validateRequest)(validation_2.updateConfigSchema), auth_1.authenticate, (0, errorHandler_1.asyncHandler)(setupController_1.setupController.updateConfig.bind(setupController_1.setupController)));
router.post('/ConfigDelete', (0, validation_1.validateRequest)(validation_2.configDeleteSchema), auth_1.authenticate, (0, errorHandler_1.asyncHandler)(setupController_1.setupController.configDelete.bind(setupController_1.setupController)));
router.post('/UserAvailableServices', (0, validation_1.validateRequest)(validation_1.userAvailableServicesSchema), auth_1.authenticate, (0, errorHandler_1.asyncHandler)(setupController_1.setupController.userAvailableServices.bind(setupController_1.setupController)));
exports.default = router;
//# sourceMappingURL=setupRoutes.js.map