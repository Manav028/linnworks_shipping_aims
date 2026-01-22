"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.pdfService = exports.PDFService = void 0;
// src/services/pdfService.ts - HIGH QUALITY FOR SCANNABLE BARCODES
const pdf_lib_1 = require("pdf-lib");
const pdfjsLib = __importStar(require("pdfjs-dist/legacy/build/pdf"));
const canvas_1 = require("canvas");
const worker_threads_1 = require("worker_threads");
const path_1 = __importDefault(require("path"));
// Disable worker in main thread
pdfjsLib.GlobalWorkerOptions.workerSrc = '';
const WORKER_PATH = path_1.default.join(__dirname, '../workers/pdfWorker.js');
console.log('🔧 [PDF Service] Worker path:', WORKER_PATH);
console.log('🔧 [PDF Service] __dirname:', __dirname);
class PDFService {
    constructor() {
        this.workerTimeoutMs = process.env.PDF_WORKER_TIMEOUT_MS
            ? parseInt(process.env.PDF_WORKER_TIMEOUT_MS, 10)
            : 90000;
        this.renderScale = process.env.PDF_RENDER_SCALE
            ? parseFloat(process.env.PDF_RENDER_SCALE)
            : 4.0;
        console.log(`📁 [PDF Service] Initialized with scale: ${this.renderScale}x`);
    }
    async getPageCount(pdfBuffer) {
        try {
            const pdfDoc = await pdf_lib_1.PDFDocument.load(pdfBuffer);
            return pdfDoc.getPageCount();
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to get page count: ${errorMessage}`);
        }
    }
    async splitPDF(pdfBuffer) {
        try {
            const pdfDoc = await pdf_lib_1.PDFDocument.load(pdfBuffer);
            const pageCount = pdfDoc.getPageCount();
            const splitPDFs = [];
            console.log(`Splitting PDF into ${pageCount} pages...`);
            for (let i = 0; i < pageCount; i++) {
                const newPdf = await pdf_lib_1.PDFDocument.create();
                const [copiedPage] = await newPdf.copyPages(pdfDoc, [i]);
                newPdf.addPage(copiedPage);
                const pdfBytes = await newPdf.save();
                splitPDFs.push(Buffer.from(pdfBytes));
                if ((i + 1) % 10 === 0) {
                    console.log(`Processed ${i + 1}/${pageCount} pages`);
                }
            }
            console.log(`Successfully split ${pageCount} pages`);
            return splitPDFs;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to split PDF: ${errorMessage}`);
        }
    }
    async extractText(pdfBuffer) {
        return new Promise((resolve, reject) => {
            let worker;
            try {
                console.log(`🔧 Creating worker from: ${WORKER_PATH}`);
                worker = new worker_threads_1.Worker(WORKER_PATH, {
                    workerData: {
                        pdfBuffer,
                        taskType: 'extractText',
                    },
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                console.error(`❌ Worker creation failed:`, errorMessage);
                console.error(`❌ Attempted path: ${WORKER_PATH}`);
                reject(new Error(`Failed to create worker: ${errorMessage}`));
                return;
            }
            const timeout = setTimeout(() => {
                worker.terminate();
                reject(new Error(`PDF text extraction timeout (${this.workerTimeoutMs}ms)`));
            }, this.workerTimeoutMs);
            worker.on('message', (result) => {
                clearTimeout(timeout);
                if (result.success && result.text) {
                    resolve(result.text);
                }
                else {
                    reject(new Error(result.error || 'Text extraction failed'));
                }
            });
            worker.on('error', (error) => {
                clearTimeout(timeout);
                console.error(`❌ Worker error:`, error.message);
                reject(new Error(`Worker error: ${error.message}`));
            });
            worker.on('exit', (code) => {
                clearTimeout(timeout);
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });
        });
    }
    async extractTextFromPage(pdfBuffer, pageNumber) {
        return new Promise((resolve, reject) => {
            let worker;
            try {
                worker = new worker_threads_1.Worker(WORKER_PATH, {
                    workerData: {
                        pdfBuffer,
                        taskType: 'extractTextFromPage',
                        pageNumber,
                    },
                });
            }
            catch (error) {
                const errorMessage = error instanceof Error ? error.message : 'Unknown error';
                reject(new Error(`Failed to create worker: ${errorMessage}`));
                return;
            }
            const timeout = setTimeout(() => {
                worker.terminate();
                reject(new Error(`PDF page text extraction timeout (${this.workerTimeoutMs}ms)`));
            }, this.workerTimeoutMs);
            worker.on('message', (result) => {
                clearTimeout(timeout);
                if (result.success && result.text) {
                    resolve(result.text);
                }
                else {
                    reject(new Error(result.error || 'Text extraction failed'));
                }
            });
            worker.on('error', (error) => {
                clearTimeout(timeout);
                reject(new Error(`Worker error: ${error.message}`));
            });
            worker.on('exit', (code) => {
                clearTimeout(timeout);
                if (code !== 0) {
                    reject(new Error(`Worker stopped with exit code ${code}`));
                }
            });
        });
    }
    /**
     * Convert PDF page to PNG with MAXIMUM QUALITY for scannable barcodes
     * Optimized for FedEx shipping labels
     */
    async convertPageToPNG(pdfBuffer, pageNumber, scale) {
        try {
            const renderScale = scale || this.renderScale;
            const uint8Array = new Uint8Array(pdfBuffer);
            // Load PDF with optimal settings for barcode/label rendering
            const loadingTask = pdfjsLib.getDocument({
                data: uint8Array,
                useWorkerFetch: false,
                isEvalSupported: false,
                useSystemFonts: true,
                disableFontFace: false, // Enable embedded fonts
                verbosity: 0, // Suppress warnings
                cMapUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/cmaps/',
                cMapPacked: true,
                standardFontDataUrl: 'https://cdn.jsdelivr.net/npm/pdfjs-dist@3.11.174/standard_fonts/',
            });
            const pdfDocument = await loadingTask.promise;
            if (pageNumber < 1 || pageNumber > pdfDocument.numPages) {
                throw new Error(`Invalid page number: ${pageNumber}. PDF has ${pdfDocument.numPages} pages.`);
            }
            const page = await pdfDocument.getPage(pageNumber);
            // Get original dimensions and apply scale
            const viewport = page.getViewport({ scale: renderScale });
            // Create canvas with exact dimensions (no rounding to prevent distortion)
            const canvas = (0, canvas_1.createCanvas)(Math.ceil(viewport.width), Math.ceil(viewport.height));
            const context = canvas.getContext('2d');
            // CRITICAL: Disable image smoothing for sharp barcodes
            context.imageSmoothingEnabled = false;
            // Fill white background (important for transparent PDFs)
            context.fillStyle = 'white';
            context.fillRect(0, 0, canvas.width, canvas.height);
            // Render PDF page with maximum quality settings
            const renderContext = {
                canvasContext: context,
                viewport: viewport,
                intent: 'print', // Use print quality for best results
                renderInteractiveForms: false,
                annotationMode: 0, // Disable annotations
                enableWebGL: false,
            };
            await page.render(renderContext).promise;
            // Convert to PNG with NO compression for maximum quality
            const pngBuffer = canvas.toBuffer('image/png', {
                compressionLevel: 0, // NO compression = maximum quality
                filters: canvas_1.Canvas.PNG_FILTER_NONE, // No filters
                resolution: Math.round(renderScale * 72), // DPI metadata
            });
            const sizeKB = (pngBuffer.length / 1024).toFixed(2);
            const dpi = Math.round(renderScale * 72);
            console.log(`✅ Converted page ${pageNumber} to PNG: ${sizeKB} KB, ${canvas.width}x${canvas.height}px, ${dpi} DPI`);
            return pngBuffer;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to convert PDF to PNG: ${errorMessage}`);
        }
    }
    /**
     * Convert entire PDF to PNG images (one per page)
     */
    async convertToPNG(pdfBuffer, scale) {
        try {
            const pageCount = await this.getPageCount(pdfBuffer);
            const pngBuffers = [];
            console.log(`Converting ${pageCount} pages to PNG...`);
            for (let i = 1; i <= pageCount; i++) {
                const pngBuffer = await this.convertPageToPNG(pdfBuffer, i, scale);
                pngBuffers.push(pngBuffer);
                if (i % 10 === 0) {
                    console.log(`Converted ${i}/${pageCount} pages to PNG`);
                }
            }
            console.log(`Successfully converted ${pageCount} pages to PNG`);
            return pngBuffers;
        }
        catch (error) {
            const errorMessage = error instanceof Error ? error.message : 'Unknown error';
            throw new Error(`Failed to convert PDF to PNG: ${errorMessage}`);
        }
    }
    async validatePDF(pdfBuffer) {
        try {
            await pdf_lib_1.PDFDocument.load(pdfBuffer);
            return true;
        }
        catch (error) {
            return false;
        }
    }
    async getMetadata(pdfBuffer) {
        try {
            const isValid = await this.validatePDF(pdfBuffer);
            const pageCount = isValid ? await this.getPageCount(pdfBuffer) : 0;
            return {
                pageCount,
                fileSize: pdfBuffer.length,
                isValid,
            };
        }
        catch (error) {
            return {
                pageCount: 0,
                fileSize: pdfBuffer.length,
                isValid: false,
            };
        }
    }
}
exports.PDFService = PDFService;
exports.pdfService = new PDFService();
//# sourceMappingURL=pdfService.js.map