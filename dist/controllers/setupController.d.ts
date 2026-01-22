import { Request, Response } from "express";
export declare class SetupController {
    addNewUser(req: Request, res: Response): Promise<void>;
    userConfig(req: Request, res: Response): Promise<void>;
    updateConfig(req: Request, res: Response): Promise<void>;
    configDelete(req: Request, res: Response): Promise<void>;
    userAvailableServices(req: Request, res: Response): Promise<void>;
}
export declare const setupController: SetupController;
//# sourceMappingURL=setupController.d.ts.map