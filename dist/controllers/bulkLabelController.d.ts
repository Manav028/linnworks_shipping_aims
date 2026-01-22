import { Request, Response } from 'express';
export declare class BulkLabelController {
    uploadBulkLabels(req: Request, res: Response): Promise<void>;
    private processLabelsAsync;
    /**
     * Get Processing Status
     * GET /api/PrepaidLabel/ProcessingStatus/:bulkUploadId
     */
    getProcessingStatus(req: Request, res: Response): Promise<void>;
    /**
     * Get Pool Status
     * GET /api/PrepaidLabel/PoolStatus
     */
    getPoolStatus(req: Request, res: Response): Promise<void>;
}
export declare const bulkLabelController: BulkLabelController;
//# sourceMappingURL=bulkLabelController.d.ts.map