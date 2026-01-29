import { Request, Response } from 'express';
import { manifestRepository } from '../database/repositories/ManifestRepository';
import {
    consignmentRepository,
    userRepository
  } from '../database/repositories';
import { 
  CreateManifestRequest, 
  CreateManifestResponse,
  PrintManifestRequest,
  PrintManifestResponse 
} from '../types/manifest.types';
import { ManifestStatus } from '../types/database.types';
import { v4 as uuidv4 } from 'uuid';

export class ManifestController {
  
  async createManifest(req: Request, res: Response): Promise<void> {
    try {
      const request: CreateManifestRequest = req.body;
      const user = req.user;

      const manifestReference = this.generateManifestReference();

      const manifest = await manifestRepository.create({
        userId: user.user_id,
        manifestReference
      });

      const consignmentIds: string[] = [];
      const notFound: string[] = [];

      console.log(`No prepaid label found for: ${request.OrderId}`);
      for (const orderRef of request.OrderId) {
        const consignment = await consignmentRepository.findByOrderReference(
          orderRef,
          user.user_id
        );

        if (consignment && consignment.consignment_status === 'LABEL_ASSIGNED') {
          const isManifested = await manifestRepository.isConsignmentManifested(
            consignment.consignment_id
          );
          
          if (!isManifested) {
            consignmentIds.push(consignment.consignment_id);
          }
        } else {
          notFound.push(orderRef);
        }
      }

      if (consignmentIds.length === 0) {
        const response: CreateManifestResponse = {
          IsError: true,
          ErrorMessage: `No valid consignments found for manifesting. Orders not found or already manifested: ${notFound.join(', ')}`,
          ManifestReference: ''
        };
        res.status(400).json(response);
        return;
      }

      await manifestRepository.addConsignments(manifest.manifest_id, consignmentIds);

      const response: CreateManifestResponse = {
        IsError: false,
        ManifestReference: manifestReference
      };

      res.status(200).json(response);

    } catch (error: any) {
      console.error('Error creating manifest:', error);
      const response: CreateManifestResponse = {
        IsError: true,
        ErrorMessage: 'Unhandled error: ' + error.message,
        ManifestReference: ''
      };
      res.status(500).json(response);
    }
  }

  async printManifest(req: Request, res: Response): Promise<void> {
    try {
      const request: PrintManifestRequest = req.body;
      const user = req.user;

      const manifest = await manifestRepository.findByReference(request.ManifestReference);
      if (!manifest || manifest.user_id !== user.user_id) {
        const response: PrintManifestResponse = {
          IsError: true,
          ErrorMessage: `Manifest not found: ${request.ManifestReference}`
        };
        res.status(404).json(response);
        return;
      }

      if (!manifest.pdf_s3_path) {
        const pdfBase64 = await this.generateManifestPDF(manifest.manifest_id);
        
        const response: PrintManifestResponse = {
          IsError: false,
          PDFbase64: pdfBase64
        };
        
        await manifestRepository.markAsPrinted(manifest.manifest_id);
        
        res.status(200).json(response);
        return;
      }

      const response: PrintManifestResponse = {
        IsError: false,
        PDFbase64: 'placeholder_base64_pdf_data' // TODO: Implement S3 download
      };

      await manifestRepository.markAsPrinted(manifest.manifest_id);
      res.status(200).json(response);

    } catch (error: any) {
      console.error('Error printing manifest:', error);
      const response: PrintManifestResponse = {
        IsError: true,
        ErrorMessage: 'Unhandled error: ' + error.message
      };
      res.status(500).json(response);
    }
  }

  async getManifests(req: Request, res: Response): Promise<void> {
    try {
      const user = req.user;
      const status = req.query.status as ManifestStatus | undefined;
      const limit = parseInt(req.query.limit as string) || 50;
      const offset = parseInt(req.query.offset as string) || 0;

      if (!user) {
        res.status(400).json({ error: 'userId is required' });
        return;
      }

      const manifests = await manifestRepository.findByUser(user.user_id, {
        status,
        limit,
        offset
      });

      res.status(200).json({
        success: true,
        count: manifests.length,
        manifests
      });

    } catch (error: any) {
      console.error('Error getting manifests:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getManifestDetails(req: Request, res: Response): Promise<void> {
    try {
      const { manifestId } = req.params;

      const manifestDetails = await manifestRepository.getManifestWithConsignments(manifestId);

      if (!manifestDetails) {
        res.status(404).json({ error: 'Manifest not found' });
        return;
      }

      res.status(200).json({
        success: true,
        manifest: manifestDetails
      });

    } catch (error: any) {
      console.error('Error getting manifest details:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async getManifestStats(req: Request, res: Response): Promise<void> {
    try {
      const { userId } = req.params;

      const stats = await manifestRepository.getStats(userId);

      res.status(200).json({
        success: true,
        stats
      });

    } catch (error: any) {
      console.error('Error getting manifest stats:', error);
      res.status(500).json({ error: error.message });
    }
  }

  async PrintManifest(req: Request, res: Response): Promise<void> {
    try {
      res.json({ IsError: false, PDFbase64: 'placeholder_base64_pdf_data',ErrorMessage: '' });
    }catch (error: any) {
      res.json({ IsError: true, ErrorMessage: error.message });
    }
  }

  private generateManifestReference(): string {
    const timestamp = Date.now().toString(36).toUpperCase();
    const random = Math.random().toString(36).substring(2, 7).toUpperCase();
    return `MAN-${timestamp}-${random}`;
  }


  private async generateManifestPDF(manifestId: string): Promise<string> {
    const placeholderPDF = Buffer.from('Placeholder PDF content').toString('base64');
    return placeholderPDF;
  }
}

export const manifestController = new ManifestController();