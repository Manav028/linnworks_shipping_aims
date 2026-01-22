"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.userAvailableServicesSchema = exports.configDeleteSchema = exports.updateConfigSchema = exports.userConfigSchema = exports.addNewUserSchema = exports.validateRequest = void 0;
const joi_1 = __importDefault(require("joi"));
const validateRequest = (schema) => {
    return (req, res, next) => {
        const { error } = schema.validate(req.body, { abortEarly: false });
        if (error) {
            const errorMessage = error.details
                .map(detail => detail.message)
                .join(', ');
            res.status(400).json({
                isError: true,
                errorMessage: `Validation error: ${errorMessage}`
            });
            return;
        }
        next();
    };
};
exports.validateRequest = validateRequest;
exports.addNewUserSchema = joi_1.default.object({
    Email: joi_1.default.string().email().required(),
    LinnworksUniqueIdentifier: joi_1.default.string().uuid().required(),
    AccountName: joi_1.default.string().required()
});
exports.userConfigSchema = joi_1.default.object({
    AuthorizationToken: joi_1.default.string().uuid().required()
});
exports.updateConfigSchema = joi_1.default.object({
    AuthorizationToken: joi_1.default.string().uuid().required(),
    ConfigStatus: joi_1.default.string().required(),
    ConfigItems: joi_1.default.array().items(joi_1.default.object({
        ConfigItemId: joi_1.default.string().required(),
        SelectedValue: joi_1.default.string().allow('').required()
    })).required()
});
exports.configDeleteSchema = joi_1.default.object({
    AuthorizationToken: joi_1.default.string().uuid().required()
});
exports.userAvailableServicesSchema = joi_1.default.object({
    AuthorizationToken: joi_1.default.string().uuid().required()
});
//# sourceMappingURL=validation.js.map