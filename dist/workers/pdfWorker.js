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
Object.defineProperty(exports, "__esModule", { value: true });
const worker_threads_1 = require("worker_threads");
const pdfjsLib = __importStar(require("pdfjs-dist/legacy/build/pdf"));
// Disable worker in worker thread
pdfjsLib.GlobalWorkerOptions.workerSrc = '';
async function extractTextFromPDF(pdfBuffer) {
    try {
        const uint8Array = new Uint8Array(pdfBuffer);
        const loadingTask = pdfjsLib.getDocument({
            data: uint8Array,
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
        });
        const pdfDocument = await loadingTask.promise;
        const numPages = pdfDocument.numPages;
        let fullText = '';
        for (let pageNum = 1; pageNum <= numPages; pageNum++) {
            const page = await pdfDocument.getPage(pageNum);
            const textContent = await page.getTextContent();
            const pageText = textContent.items
                .map((item) => {
                if ('str' in item) {
                    return item.str;
                }
                return '';
            })
                .filter(Boolean)
                .join(' ');
            fullText += pageText + '\n';
        }
        return fullText.trim();
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`PDF text extraction failed: ${errorMessage}`);
    }
}
async function extractTextFromPage(pdfBuffer, pageNumber) {
    try {
        const uint8Array = new Uint8Array(pdfBuffer);
        const loadingTask = pdfjsLib.getDocument({
            data: uint8Array,
            useWorkerFetch: false,
            isEvalSupported: false,
            useSystemFonts: true,
        });
        const pdfDocument = await loadingTask.promise;
        if (pageNumber < 1 || pageNumber > pdfDocument.numPages) {
            throw new Error(`Invalid page number: ${pageNumber}. PDF has ${pdfDocument.numPages} pages.`);
        }
        const page = await pdfDocument.getPage(pageNumber);
        const textContent = await page.getTextContent();
        const pageText = textContent.items
            .map((item) => {
            if ('str' in item) {
                return item.str;
            }
            return '';
        })
            .filter(Boolean)
            .join(' ');
        return pageText.trim();
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        throw new Error(`PDF page text extraction failed: ${errorMessage}`);
    }
}
// Main worker execution
(async () => {
    try {
        const data = worker_threads_1.workerData;
        let text;
        if (data.taskType === 'extractText') {
            text = await extractTextFromPDF(data.pdfBuffer);
        }
        else if (data.taskType === 'extractTextFromPage' && data.pageNumber) {
            text = await extractTextFromPage(data.pdfBuffer, data.pageNumber);
        }
        else {
            throw new Error('Invalid task type or missing page number');
        }
        const result = {
            success: true,
            text,
        };
        worker_threads_1.parentPort?.postMessage(result);
    }
    catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        const result = {
            success: false,
            error: errorMessage,
        };
        worker_threads_1.parentPort?.postMessage(result);
    }
})();
//# sourceMappingURL=pdfWorker.js.map