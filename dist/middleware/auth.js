"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.authenticate = void 0;
const repositories_1 = require("../database/repositories");
const authenticate = async (req, res, next) => {
    try {
        let authToken = req.body?.AuthorizationToken;
        if (!authToken) {
            const authHeader = req.headers.authorization;
            if (authHeader?.startsWith("Bearer ")) {
                authToken = authHeader.slice(7);
            }
        }
        console.log(`Authenticating request with token: ${authToken}`);
        if (!authToken) {
            res.status(401).json({
                isError: true,
                errorMessage: "Authorization token is required",
            });
            return;
        }
        const user = await repositories_1.userRepository.findByAuthToken(authToken);
        if (!user || user.is_deleted) {
            res.status(401).json({
                isError: true,
                errorMessage: "Authorization failed",
            });
            return;
        }
        req.user = user;
        req.userId = user.user_id;
        next();
    }
    catch (error) {
        res.status(500).json({
            isError: true,
            errorMessage: `Authentication error: ${error.message}`,
        });
    }
};
exports.authenticate = authenticate;
//# sourceMappingURL=auth.js.map