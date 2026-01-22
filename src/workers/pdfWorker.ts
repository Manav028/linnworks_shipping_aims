import { parentPort, workerData } from 'worker_threads';
import * as pdfjsLib from 'pdfjs-dist/legacy/build/pdf';
import type { TextItem, TextMarkedContent } from 'pdfjs-dist/types/src/display/api';

// Disable worker in worker thread
pdfjsLib.GlobalWorkerOptions.workerSrc = '';

interface WorkerData {
  pdfBuffer: Buffer;
  taskType: 'extractText' | 'extractTextFromPage';
  pageNumber?: number;
}

interface WorkerResult {
  success: boolean;
  text?: string;
  error?: string;
}

async function extractTextFromPDF(pdfBuffer: Buffer): Promise<string> {
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
            return (item as TextItem).str;
          }
          return '';
        })
        .filter(Boolean)
        .join(' ');

      fullText += pageText + '\n';
    }

    return fullText.trim();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`PDF text extraction failed: ${errorMessage}`);
  }
}

async function extractTextFromPage(pdfBuffer: Buffer, pageNumber: number): Promise<string> {
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
      throw new Error(
        `Invalid page number: ${pageNumber}. PDF has ${pdfDocument.numPages} pages.`
      );
    }

    const page = await pdfDocument.getPage(pageNumber);
    const textContent = await page.getTextContent();

    const pageText = textContent.items
      .map((item) => {
        if ('str' in item) {
          return (item as TextItem).str;
        }
        return '';
      })
      .filter(Boolean)
      .join(' ');

    return pageText.trim();
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    throw new Error(`PDF page text extraction failed: ${errorMessage}`);
  }
}

// Main worker execution
(async (): Promise<void> => {
  try {
    const data = workerData as WorkerData;
    let text: string;

    if (data.taskType === 'extractText') {
      text = await extractTextFromPDF(data.pdfBuffer);
    } else if (data.taskType === 'extractTextFromPage' && data.pageNumber) {
      text = await extractTextFromPage(data.pdfBuffer, data.pageNumber);
    } else {
      throw new Error('Invalid task type or missing page number');
    }

    const result: WorkerResult = {
      success: true,
      text,
    };

    parentPort?.postMessage(result);
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    const result: WorkerResult = {
      success: false,
      error: errorMessage,
    };

    parentPort?.postMessage(result);
  }
})();