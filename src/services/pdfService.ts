import { PDFDocument } from 'pdf-lib';
import { Worker } from 'worker_threads';
import { exec } from 'child_process';
import { promisify } from 'util';
import path from 'path';
import fs from 'fs/promises';
import os from 'os';
import crypto from 'crypto';

const execAsync = promisify(exec);

const WORKER_PATH = path.resolve(
  process.cwd(),
  'dist/workers/pdfWorker.js'
);

console.log('[PDF Service] Worker path:', WORKER_PATH);
console.log('[PDF Service] Using Direct Poppler (pdftoppm) - MAXIMUM QUALITY');

interface WorkerResult {
  success: boolean;
  text?: string;
  error?: string;
}

export class PDFService {
  private readonly workerTimeoutMs: number;
  private readonly renderScale: number;
  private readonly tempDir: string;
  private readonly popplerPath: string;

  constructor() {
    this.workerTimeoutMs = process.env.PDF_WORKER_TIMEOUT_MS
      ? parseInt(process.env.PDF_WORKER_TIMEOUT_MS, 10)
      : 90000;
    this.renderScale = process.env.PDF_RENDER_SCALE
      ? parseFloat(process.env.PDF_RENDER_SCALE)
      : 4.0;
    this.tempDir = os.tmpdir();

    // Auto-detect Poppler path based on OS
    this.popplerPath = this.detectPopplerPath();

    const dpi = Math.round(this.renderScale * 72);
    console.log(`[PDF Service] Initialized with ${dpi} DPI`);
    console.log(`[PDF Service] Poppler path: ${this.popplerPath}`);
  }

  /**
   * Detect Poppler installation path
   */
  private detectPopplerPath(): string {
    // Windows: Check common installation paths
    if (process.platform === 'win32') {
      const possiblePaths = [
        'C:\\Users\\manav\\Downloads\\Release-25.11.0-0\\poppler-25.11.0\\Library\\bin\\pdftoppm.exe',
        'C:\\Program Files\\poppler\\Library\\bin\\pdftoppm.exe',
        'C:\\Program Files (x86)\\poppler\\Library\\bin\\pdftoppm.exe',
        'C:\\poppler\\Library\\bin\\pdftoppm.exe',
        path.join(process.env.ProgramFiles || 'C:\\Program Files', 'poppler', 'Library', 'bin', 'pdftoppm.exe'),
      ];

      return possiblePaths[0];
    }

    return 'pdftoppm';
  }

  /**
   * Verify Poppler is installed
   */
  async verifyPopplerInstalled(): Promise<boolean> {
    try {
      const { stdout } = await execAsync(`${this.popplerPath} -v`);
      console.log(`Poppler version: ${stdout.trim()}`);
      return true;
    } catch (error) {
      console.error('Poppler not found! Install with: choco install poppler');
      return false;
    }
  }

  /**
   * Get page count from PDF
   */
  async getPageCount(pdfBuffer: Buffer): Promise<number> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      return pdfDoc.getPageCount();
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to get page count: ${errorMessage}`);
    }
  }

  /**
   * Split PDF into individual pages
   */
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

  /**
   * Extract text using worker thread (pdfjs-dist)
   */
  async extractText(pdfBuffer: Buffer): Promise<string> {
    return new Promise<string>((resolve, reject) => {
      let worker: Worker;

      try {
        worker = new Worker(WORKER_PATH, {
          workerData: {
            pdfBuffer,
            taskType: 'extractText',
          },
        });
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : 'Unknown error';
        console.error(`Worker creation failed:`, errorMessage);
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
   * Convert PDF page to PNG using Direct Poppler (pdftoppm)
   * MAXIMUM QUALITY - Pixel-perfect reproduction
   */
  async convertPageToPNG(
    pdfBuffer: Buffer,
    pageNumber: number,
    scale?: number
  ): Promise<Buffer> {
    const renderScale = scale || this.renderScale;
    const dpi = Math.round(renderScale * 72);

    const tempId = crypto.randomUUID();
    const tempPdfPath = path.join(this.tempDir, `${tempId}.pdf`);
    const tempPngPrefix = path.join(this.tempDir, tempId);

    try {
      // Write PDF to temp file
      await fs.writeFile(tempPdfPath, pdfBuffer);

      if (process.platform === 'win32') {
        await new Promise(res => setTimeout(res, 50));
      }

      console.log(`Converting page ${pageNumber} with pdftoppm at ${dpi} DPI...`);

      // Build pdftoppm command
      // -png: Output format PNG
      // -f: First page to convert
      // -l: Last page to convert
      // -r: Resolution (DPI)
      // -singlefile: Don't add page number to output filename
      const command = `${this.popplerPath} -png -f ${pageNumber} -l ${pageNumber} -r ${dpi} -singlefile "${tempPdfPath}" "${tempPngPrefix}"`;

      // Execute pdftoppm
      const { stdout, stderr } = await execAsync(command, {
        maxBuffer: 50 * 1024 * 1024, // 50MB buffer for large PNGs
      });

      if (stderr && !stderr.includes('Syntax Warning')) {
        console.warn(`pdftoppm warning: ${stderr}`);
      }

      // Read the generated PNG file
      const pngPath = `${tempPngPrefix}.png`;

      // Verify file exists
      try {
        await fs.access(pngPath);
      } catch {
        throw new Error(`PNG file not created: ${pngPath}`);
      }

      const pngBuffer = await fs.readFile(pngPath);
      const sizeKB = (pngBuffer.length / 1024).toFixed(2);

      console.log(
        `Converted page ${pageNumber} to PNG: ${sizeKB} KB, ${dpi} DPI (pdftoppm)`
      );

      // Cleanup temp files
      await this.cleanupTempFiles([tempPdfPath, pngPath]);

      return pngBuffer;
    } catch (error) {
      // Cleanup on error
      await this.cleanupTempFiles([tempPdfPath, `${tempPngPrefix}.png`]);

      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      throw new Error(`Failed to convert PDF to PNG: ${errorMessage}`);
    }
  }

  /**
   * Convert entire PDF to PNG images (one per page)
   */
  async convertToPNG(pdfBuffer: Buffer, scale?: number): Promise<Buffer[]> {
    try {
      // Verify Poppler is installed
      const isInstalled = await this.verifyPopplerInstalled();
      if (!isInstalled) {
        throw new Error('Poppler (pdftoppm) is not installed. Please install: choco install poppler');
      }

      const pageCount = await this.getPageCount(pdfBuffer);
      const pngBuffers: Buffer[] = [];

      console.log(`Converting ${pageCount} pages to PNG using pdftoppm...`);

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

  /**
   * Cleanup temporary files
   */
  private async cleanupTempFiles(files: string[]): Promise<void> {
    for (const file of files) {
      try {
        await fs.unlink(file);
      } catch {
        // Ignore errors - file might not exist
      }
    }
  }

  /**
   * Validate PDF file
   */
  async validatePDF(pdfBuffer: Buffer): Promise<boolean> {
    try {
      await PDFDocument.load(pdfBuffer);
      return true;
    } catch (error) {
      return false;
    }
  }

  /**
   * Get PDF metadata
   */
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