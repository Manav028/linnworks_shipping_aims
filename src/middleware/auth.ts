import { Request, Response, NextFunction } from "express";
import { userRepository } from "../database/repositories";

declare global {
    namespace Express {
        interface Request {
            user?: any;
            userId?: string;
        }
    }
}

export const authenticate = async (req: Request, res: Response, next: NextFunction): Promise<void> => {
    try {
        const authHeader = req.headers.authorization;
        const authToken = authHeader?.startsWith('Bearer ') ? authHeader.slice(7) : undefined;
        
        console.log(`Authenticating request with token: ${authToken}`);

        if (!authToken) {
            res.status(401).json({
                isError: true,
                errorMessage: 'Authorization token is required'
            });
            return;
        }

        const user = await userRepository.findByAuthToken(authToken);


        if (!user || user.is_deleted) {
            res.status(401).json({
                isError: true,
                errorMessage: `Authorization failed for token ${authToken}`
            });
        return;
        }

        req.user = user;
        req.userId = user.user_id;
        next();

    } catch (error: any) {
        res.status(500).json({
            isError: true,
            errorMessage: `Authentication error: ${error.message}`
        });
    }
}