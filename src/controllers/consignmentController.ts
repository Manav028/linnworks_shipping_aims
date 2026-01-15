import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  consignmentRepository,
  prepaidLabelPoolRepository,
  userRepository
} from '../database/repositories';
import { s3Service } from '../services/s3Service';
import {
  GenerateLabelRequest,
  GenerateLabelResponse,
  PackageResponse
} from '../types/consignment.types';

export class ConsignmentController {
  
  /**
   * Generate Label (Linnworks Endpoint)
   * POST /api/Consignment/GenerateLabel
   */
  async generateLabel(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body as GenerateLabelRequest;
      const user = req.user;
      
      const prepaidLabel = await prepaidLabelPoolRepository.findAvailableByOrderRef(
        request.OrderReference,
        request.ServiceId,
        user.user_id
      );

      // 3a. IF LABEL FOUND - Use prepaid label
      if (prepaidLabel) {
        console.log(`Found prepaid label: ${prepaidLabel.tracking_number}`);

        // Claim the label
        const claimedLabel = await prepaidLabelPoolRepository.claimLabel(
          prepaidLabel.pool_label_id,
          request.OrderId
        );

        if (!claimedLabel) {
          res.json({
            IsError: true,
            ErrorMessage: `Label for ${request.OrderReference} could not be claimed (already used?)`
          } as GenerateLabelResponse);
          return;
        }

        const consignment = await consignmentRepository.create({
          userId: user.user_id,
          courierServiceId: request.ServiceId,
          poolLabelId: prepaidLabel.pool_label_id,
          orderReference: request.OrderReference,
          linnworksOrderId: request.OrderId,
          leadTrackingNumber: prepaidLabel.tracking_number,
          recipientDetails: {
            name: request.Name,
            companyName: request.CompanyName,
            addressLine1: request.AddressLine1,
            addressLine2: request.AddressLine2,
            addressLine3: request.AddressLine3,
            town: request.Town,
            region: request.Region,
            countryCode: request.CountryCode,
            postalcode: request.Postalcode,
            email: request.Email,
            phone: request.Phone
          }
        });

        console.log(`Consignment created: ${consignment.consignment_id}`);

        const splitPage = await prepaidLabelPoolRepository.getSplitPage(
          prepaidLabel.split_page_id
        );

        if (!splitPage?.file_path) {
          res.json({
            IsError: true,
            ErrorMessage: 'Label file not found in storage'
          } as GenerateLabelResponse);
          return;
        }

        // Download label from S3
        const labelStream = await s3Service.getFileStream(splitPage.file_path);
        const labelBuffer = await this.streamToBuffer(labelStream);
        const labelBase64 = labelBuffer.toString('base64');

        res.json({
          IsError: false,
          ErrorMessage: '',
          LeadTrackingNumber: prepaidLabel.tracking_number,
          Cost: 0, 
          Currency: 'GBP',
          Package: [
            {
              SequenceNumber: 1,
              TrackingNumber: prepaidLabel.tracking_number,
              PNGLabelDataBase64: labelBase64,
              PDFBytesDocumentationBase64: [],
              LabelWidth: 4,
              LabelHeight: 6
            }
          ]
        } as GenerateLabelResponse);

        console.log(`Label returned for order ${request.OrderReference}`);
        return;
      }

      // 3b. IF NO LABEL FOUND - Return error
      console.log(`No prepaid label found for: ${request.OrderReference}`);

      // Get available labels for helpful error message
      const availableLabels = await prepaidLabelPoolRepository.getAvailableLabels(
        user.user_id,
        request.ServiceId
      );

      const availableRefs = availableLabels
        .slice(0, 5)
        .map(l => l.order_reference)
        .join(', ');

      res.json({
        IsError: true,
        ErrorMessage: `No pre-paid label found for order reference '${request.OrderReference}'. ` +
          `Available labels: ${availableRefs || 'None'}. ` +
          `Please upload labels first or change the order reference.`,
        LeadTrackingNumber: '',
        Cost: 0,
        Currency: 'GBP',
        Package: []
      } as GenerateLabelResponse);

    } catch (error: any) {
      console.error('GenerateLabel error:', error);
      res.json({
        IsError: true,
        ErrorMessage: `Unhandled error: ${error.message}`,
        LeadTrackingNumber: '',
        Cost: 0,
        Currency: 'GBP',
        Package: []
      } as GenerateLabelResponse);
    }
  }

  async cancelLabel(req: Request, res: Response): Promise<void> {
    try {
      const { AuthorizationToken, OrderReference } = req.body;

      const user = await userRepository.findByAuthToken(AuthorizationToken);
      
      if (!user) {
        res.json({
          IsError: true,
          ErrorMessage: 'Authorization failed'
        });
        return;
      }

      // Find consignment
      const consignment = await consignmentRepository.findByOrderReference(
        OrderReference,
        user.user_id
      );

      if (!consignment) {
        res.json({
          IsError: true,
          ErrorMessage: `Consignment not found for order ${OrderReference}`
        });
        return;
      }

      // Update consignment status
      await consignmentRepository.updateStatus(
        consignment.consignment_id,
        'CANCELLED'
      );

      // If it was a prepaid label, release it back to pool
      if (consignment.pool_label_id) {
        await prepaidLabelPoolRepository.releaseLabel(consignment.pool_label_id);
        console.log(`Released label ${consignment.pool_label_id} back to pool`);
      }

      res.json({
        IsError: false,
        ErrorMessage: ''
      });

    } catch (error: any) {
      console.error('Cancel label error:', error);
      res.json({
        IsError: true,
        ErrorMessage: `Cancel failed: ${error.message}`
      });
    }
  }

  // Helper: Convert stream to buffer
  private async streamToBuffer(stream: NodeJS.ReadableStream): Promise<Buffer> {
    return new Promise((resolve, reject) => {
      const chunks: Buffer[] = [];
      stream.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
      stream.on('end', () => resolve(Buffer.concat(chunks)));
      stream.on('error', reject);
    });
  }
}

export const consignmentController = new ConsignmentController();