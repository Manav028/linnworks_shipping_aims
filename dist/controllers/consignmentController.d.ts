import { Request, Response } from 'express';
export declare class ConsignmentController {
    generateLabel(req: Request, res: Response): Promise<void>;
    /**
     * Cancel Label
     * POST /api/Consignment/CancelLabel
     */
    cancelLabel(req: Request, res: Response): Promise<void>;
    private streamToBuffer;
}
export declare const consignmentController: ConsignmentController;
//# sourceMappingURL=consignmentController.d.ts.map