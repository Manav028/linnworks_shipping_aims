// src/services/pdfService.ts - HIGH QUALITY FOR SCANNABLE BARCODES
import { PDFDocument } from 'pdf-lib';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import { Canvas, createCanvas } from 'canvas';
import { Worker } from 'worker_threads';
import path from 'path';

// Disable worker in main thread
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

const WORKER_PATH = path.resolve(
  process.cwd(),
  'dist/workers/pdfWorker.js'
);

console.log('🔧 [PDF Service] Worker path:', WORKER_PATH);
console.log('🔧 [PDF Service] __dirname:', __dirname);

interface WorkerResult {
  success: boolean;
  text?: string;
  error?: string;
}

export class PDFService {
  private readonly workerTimeoutMs: number;
  private readonly renderScale: number;

  constructor() {
    this.workerTimeoutMs = process.env.PDF_WORKER_TIMEOUT_MS
      ? parseInt(process.env.PDF_WORKER_TIMEOUT_MS, 10)
      : 90000;
    this.renderScale = process.env.PDF_RENDER_SCALE
      ? parseFloat(process.env.PDF_RENDER_SCALE)
      : 4.0;
    console.log(`📁 [PDF Service] Initialized with scale: ${this.renderScale}x`);
  }

  async getPageCount(pdfBuffer: Buffer): Promise<number> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      return pdfDoc.getPageCount();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get page count: ${errorMessage}`);
    }
  }

  async splitPDF(pdfBuffer: Buffer): Promise<Buffer[]> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const pageCount = pdfDoc.getPageCount();
      const splitPDFs: Buffer[] = [];

      console.log(`Splitting PDF into ${pageCount} pages...`);

      for (let i = 0; i < pageCount; i++) {
        const newPdf = await PDFDocument.create();
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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to split PDF: ${errorMessage}`);
    }
  }

  async extractText(pdfBuffer: Buffer): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let worker: Worker;
      
      try {
        console.log(`🔧 Creating worker from: ${WORKER_PATH}`);
        worker = new Worker(WORKER_PATH, {
          workerData: {
            pdfBuffer,
            taskType: 'extractText',
          },
        });
      } catch (error) {
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

      worker.on('message', (result: WorkerResult) => {
        clearTimeout(timeout);
        if (result.success && result.text) {
          resolve(result.text);
        } else {
          reject(new Error(result.error || 'Text extraction failed'));
        }
      });

      worker.on('error', (error: Error) => {
        clearTimeout(timeout);
        console.error(`❌ Worker error:`, error.message);
        reject(new Error(`Worker error: ${error.message}`));
      });

      worker.on('exit', (code: number) => {
        clearTimeout(timeout);
        if (code !== 0) {
          reject(new Error(`Worker stopped with exit code ${code}`));
        }
      });
    });
  }

  async extractTextFromPage(pdfBuffer: Buffer, pageNumber: number): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let worker: Worker;
      
      try {
        worker = new Worker(WORKER_PATH, {
          workerData: {
            pdfBuffer,
            taskType: 'extractTextFromPage',
            pageNumber,
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        reject(new Error(`Failed to create worker: ${errorMessage}`));
        return;
      }

      const timeout = setTimeout(() => {
        worker.terminate();
        reject(new Error(`PDF page text extraction timeout (${this.workerTimeoutMs}ms)`));
      }, this.workerTimeoutMs);

      worker.on('message', (result: WorkerResult) => {
        clearTimeout(timeout);
        if (result.success && result.text) {
          resolve(result.text);
        } else {
          reject(new Error(result.error || 'Text extraction failed'));
        }
      });

      worker.on('error', (error: Error) => {
        clearTimeout(timeout);
        reject(new Error(`Worker error: ${error.message}`));
      });

      worker.on('exit', (code: number) => {
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
  async convertPageToPNG(
    pdfBuffer: Buffer,
    pageNumber: number,
    scale?: number
  ): Promise<Buffer> {
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
        throw new Error(
          `Invalid page number: ${pageNumber}. PDF has ${pdfDocument.numPages} pages.`
        );
      }

      const page = await pdfDocument.getPage(pageNumber);
      
      // Get original dimensions and apply scale
      const viewport = page.getViewport({ scale: renderScale });

      // Create canvas with exact dimensions (no rounding to prevent distortion)
      const canvas = createCanvas(
        Math.ceil(viewport.width),
        Math.ceil(viewport.height)
      );
      const context = canvas.getContext('2d');

      // CRITICAL: Disable image smoothing for sharp barcodes
      context.imageSmoothingEnabled = false;
      
      // Fill white background (important for transparent PDFs)
      context.fillStyle = 'white';
      context.fillRect(0, 0, canvas.width, canvas.height);

      // Render PDF page with maximum quality settings
      const renderContext = {
        canvasContext: context as any,
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
        filters: Canvas.PNG_FILTER_NONE, // No filters
        resolution: Math.round(renderScale * 72), // DPI metadata
      });

      const sizeKB = (pngBuffer.length / 1024).toFixed(2);
      const dpi = Math.round(renderScale * 72);
      console.log(
        `✅ Converted page ${pageNumber} to PNG: ${sizeKB} KB, ${canvas.width}x${canvas.height}px, ${dpi} DPI`
      );

      return pngBuffer;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to convert PDF to PNG: ${errorMessage}`);
    }
  }

  /**
   * Convert entire PDF to PNG images (one per page)
   */
  async convertToPNG(pdfBuffer: Buffer, scale?: number): Promise<Buffer[]> {
    try {
      const pageCount = await this.getPageCount(pdfBuffer);
      const pngBuffers: Buffer[] = [];

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
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to convert PDF to PNG: ${errorMessage}`);
    }
  }

  async validatePDF(pdfBuffer: Buffer): Promise<boolean> {
    try {
      await PDFDocument.load(pdfBuffer);
      return true;
    } catch (error) {
      return false;
    }
  }

  async getMetadata(pdfBuffer: Buffer): Promise<{
    pageCount: number;
    fileSize: number;
    isValid: boolean;
  }> {
    try {
      const isValid = await this.validatePDF(pdfBuffer);
      const pageCount = isValid ? await this.getPageCount(pdfBuffer) : 0;

      return {
        pageCount,
        fileSize: pdfBuffer.length,
        isValid,
      };
    } catch (error) {
      return {
        pageCount: 0,
        fileSize: pdfBuffer.length,
        isValid: false,
      };
    }
  }
}

export const pdfService = new PDFService();