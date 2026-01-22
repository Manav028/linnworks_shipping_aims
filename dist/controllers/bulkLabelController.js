"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.bulkLabelController = exports.BulkLabelController = void 0;
const repositories_1 = require("../database/repositories");
const pdfService_1 = require("../services/pdfService");
const s3Service_1 = require("../services/s3Service");
const labelExtractionService_1 = require("../services/labelExtractionService");
class BulkLabelController {
    async uploadBulkLabels(req, res) {
        try {
            const user = req.user;
            const file = req.file;
            if (!file) {
                res.json({
                    isError: true,
                    errorMessage: 'No file uploaded'
                });
                return;
            }
            const courierServiceId = req.body.courierServiceId || req.body.CourierServiceId;
            if (!courierServiceId) {
                res.json({
                    isError: true,
                    errorMessage: 'CourierServiceId is required'
                });
                return;
            }
            console.log(`Processing upload: ${file.originalname} (${file.size} bytes)`);
            const isValid = await pdfService_1.pdfService.validatePDF(file.buffer);
            if (!isValid) {
                res.json({
                    isError: true,
                    errorMessage: 'Invalid PDF file'
                });
                return;
            }
            const pageCount = await pdfService_1.pdfService.getPageCount(file.buffer);
            console.log(`PDF has ${pageCount} pages`);
            const s3Path = await s3Service_1.s3Service.uploadBulkPDF(file.buffer, user.user_id, file.originalname);
            const bulkUpload = await repositories_1.bulkLabelRepository.create({
                userId: user.user_id,
                courierServiceId: courierServiceId,
                originalFileName: file.originalname,
                originalFilePath: s3Path,
                originalFileSize: file.size,
                totalPagesInPdf: pageCount
            });
            console.log(`Bulk upload created: ${bulkUpload.bulk_upload_id}`);
            // Start background processing (don't wait)
            this.processLabelsAsync(bulkUpload.bulk_upload_id, file.buffer, user.user_id, courierServiceId)
                .catch(error => {
                console.error('Background processing failed:', error);
            });
            res.json({
                isError: false,
                bulkUploadId: bulkUpload.bulk_upload_id,
                status: 'PROCESSING',
                totalPages: pageCount,
                estimatedProcessingTime: pageCount * 2, // 2 seconds per page estimate
                statusCheckUrl: `/api/PrepaidLabel/ProcessingStatus/${bulkUpload.bulk_upload_id}`
            });
        }
        catch (error) {
            console.error('Upload error:', error);
            res.json({
                isError: true,
                errorMessage: `Upload failed: ${error.message}`
            });
        }
    }
    // Background processing of labels
    async processLabelsAsync(bulkUploadId, pdfBuffer, userId, courierServiceId) {
        try {
            console.log(`Starting background processing for ${bulkUploadId}`);
            await repositories_1.bulkLabelRepository.setProcessingStart(bulkUploadId);
            const splitPDFs = await pdfService_1.pdfService.splitPDF(pdfBuffer);
            console.log(`Split into ${splitPDFs.length} pages`);
            let successCount = 0;
            let failCount = 0;
            for (let i = 0; i < splitPDFs.length; i++) {
                const pageNumber = i + 1;
                const pagePDF = splitPDFs[i];
                try {
                    console.log(`Processing page ${pageNumber}/${splitPDFs.length}...`);
                    // Extract text and get label information
                    const extractedInfo = await labelExtractionService_1.labelExtractionService.processLabel(pagePDF, pageNumber);
                    // Upload PDF to S3
                    const labelS3Path = await s3Service_1.s3Service.uploadSplitLabel(pagePDF, bulkUploadId, pageNumber);
                    // Convert to PNG and upload
                    let pngS3Path;
                    let pngFileSize;
                    try {
                        const pngBuffer = await pdfService_1.pdfService.convertPageToPNG(pagePDF, 1);
                        pngS3Path = await s3Service_1.s3Service.uploadLabelPNG(pngBuffer, bulkUploadId, pageNumber, {
                            trackingNumber: extractedInfo.trackingNumber || '',
                            orderReference: extractedInfo.orderReference || '',
                            confidence: extractedInfo.confidence.toString(),
                        });
                        pngFileSize = pngBuffer.length;
                        console.log(`✓ Page ${pageNumber}: PNG created (${(pngFileSize / 1024).toFixed(2)} KB)`);
                    }
                    catch (pngError) {
                        const pngErrorMessage = pngError instanceof Error ? pngError.message : 'Unknown error';
                        console.error(`⚠ Page ${pageNumber}: PNG conversion failed:`, pngErrorMessage);
                        // Continue without PNG - we still have the PDF
                    }
                    // Create split page record
                    const splitPage = await repositories_1.splitLabelPageRepository.create({
                        bulkUploadId: bulkUploadId,
                        filePath: labelS3Path,
                        pngFilePath: pngS3Path,
                        pageNumber: pageNumber,
                        trackingNumber: extractedInfo.trackingNumber,
                        orderReference: extractedInfo.orderReference,
                    });
                    // Add to pool if we have required information
                    if (extractedInfo.trackingNumber && extractedInfo.orderReference) {
                        await repositories_1.prepaidLabelPoolRepository.create({
                            bulkUploadId: bulkUploadId,
                            splitPageId: splitPage.split_page_id,
                            orderReference: extractedInfo.orderReference,
                            trackingNumber: extractedInfo.trackingNumber,
                            courierServiceId: courierServiceId,
                            userId: userId,
                        });
                        successCount++;
                        console.log(`✓ Page ${pageNumber}: Added to pool - ${extractedInfo.orderReference} → ${extractedInfo.trackingNumber} (${extractedInfo.confidence}% confidence)`);
                    }
                    else {
                        failCount++;
                        console.log(`⚠ Page ${pageNumber}: Missing required data (Tracking: ${!!extractedInfo.trackingNumber}, Ref: ${!!extractedInfo.orderReference}, Confidence: ${extractedInfo.confidence}%)`);
                    }
                }
                catch (error) {
                    failCount++;
                    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                    console.error(`✗ Page ${pageNumber}: Processing failed:`, errorMessage);
                }
            }
            await repositories_1.bulkLabelRepository.setProcessingEnd(bulkUploadId, 'COMPLETED');
            console.log(`✓ Processing completed for ${bulkUploadId}: ${successCount} successful, ${failCount} failed`);
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            console.error(`✗ Processing failed for ${bulkUploadId}:`, errorMessage);
            await repositories_1.bulkLabelRepository.setProcessingEnd(bulkUploadId, 'FAILED');
        }
    }
    /**
     * Get Processing Status
     * GET /api/PrepaidLabel/ProcessingStatus/:bulkUploadId
     */
    async getProcessingStatus(req, res) {
        try {
            const { bulkUploadId } = req.params;
            const bulkUpload = await repositories_1.bulkLabelRepository.findById(bulkUploadId);
            if (!bulkUpload) {
                res.json({
                    isError: true,
                    errorMessage: 'Bulk upload not found'
                });
                return;
            }
            // Get split pages count
            const splitPages = await repositories_1.splitLabelPageRepository.findByBulkUploadId(bulkUploadId);
            // Get pool labels count
            const poolLabels = await repositories_1.prepaidLabelPoolRepository.getAvailableLabels(bulkUpload.user_id);
            const poolLabelsForThisUpload = poolLabels.filter(l => l.bulk_upload_id === bulkUploadId);
            const totalLabels = bulkUpload.total_pages_in_pdf;
            const processedLabels = splitPages.length;
            const successfulLabels = poolLabelsForThisUpload.length;
            const progressPercentage = Math.round((processedLabels / totalLabels) * 100);
            res.json({
                isError: false,
                bulkUploadId: bulkUpload.bulk_upload_id,
                status: bulkUpload.upload_status,
                totalLabels: totalLabels,
                processedLabels: processedLabels,
                successfulLabels: successfulLabels,
                failedLabels: processedLabels - successfulLabels,
                progressPercentage: progressPercentage,
                currentPhase: bulkUpload.upload_status
            });
        }
        catch (error) {
            console.error('❌ Status check error:', error);
            res.json({
                isError: true,
                errorMessage: `Status check failed: ${error.message}`
            });
        }
    }
    /**
     * Get Pool Status
     * GET /api/PrepaidLabel/PoolStatus
     */
    async getPoolStatus(req, res) {
        try {
            const user = req.user;
            const stats = await repositories_1.prepaidLabelPoolRepository.getPoolStats(user.user_id);
            const labels = await repositories_1.prepaidLabelPoolRepository.getAvailableLabels(user.user_id);
            res.json({
                isError: false,
                totalLabelsInPool: stats.total,
                availableLabels: stats.available,
                claimedLabels: stats.claimed,
                expiredLabels: stats.expired,
                labels: labels.map(label => ({
                    poolLabelId: label.pool_label_id,
                    orderReference: label.order_reference,
                    trackingNumber: label.tracking_number,
                    status: label.label_status,
                    uploadDate: label.created_date.toISOString(),
                    expiryDate: label.expiry_date?.toISOString()
                }))
            });
        }
        catch (error) {
            console.error('Pool status error:', error);
            res.json({
                isError: true,
                errorMessage: `Pool status failed: ${error.message}`
            });
        }
    }
}
exports.BulkLabelController = BulkLabelController;
exports.bulkLabelController = new BulkLabelController();
//# sourceMappingURL=bulkLabelController.js.map