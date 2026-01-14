import { PDFDocument } from 'pdf-lib';
import { PDFParse } from 'pdf-parse';

export class PDFService {
  
  async getPageCount(pdfBuffer: Buffer): Promise<number> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      return pdfDoc.getPageCount();
    } catch (error: any) {
      throw new Error(`Failed to get page count: ${error.message}`);
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
    } catch (error: any) {
      throw new Error(`Failed to split PDF: ${error.message}`);
    }
  }

  
  async extractText(pdfBuffer: Buffer): Promise<string> {
    try {
      const parser = new PDFParse({data: pdfBuffer});
      const data = await parser.getText();
      return data.text;
    } catch (error: any) {
      throw new Error(`Failed to extract text: ${error.message}`);
    }
  }

  /**
   * Extract text from specific page
   */
  async extractTextFromPage(pdfBuffer: Buffer, pageNumber: number): Promise<string> {
    try {
      const pdfDoc = await PDFDocument.load(pdfBuffer);
      const newPdf = await PDFDocument.create();
      const [page] = await newPdf.copyPages(pdfDoc, [pageNumber - 1]);
      newPdf.addPage(page);
      
      const singlePageBytes = await newPdf.save();
      return this.extractText(Buffer.from(singlePageBytes));
    } catch (error: any) {
      throw new Error(`Failed to extract text from page ${pageNumber}: ${error.message}`);
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
}

export const pdfService = new PDFService();