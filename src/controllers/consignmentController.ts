import { Request, Response } from 'express';
import { v4 as uuidv4 } from 'uuid';
import {
  consignmentRepository,
  prepaidLabelPoolRepository,
  userRepository
} from '../database/repositories';
import { query, transaction } from '../database/connection';
import { s3Service } from '../services/s3Service';
import {
  GenerateLabelRequest,
  GenerateLabelResponse,
  PackageResponse
} from '../types/consignment.types';

export class ConsignmentController {

  async generateLabel(req: Request, res: Response): Promise<void> {
    try {
      const request = req.body as GenerateLabelRequest;
      const user = req.user;

      console.log(`GenerateLabel request for order: ${request.OrderId}`);

      //Check if prepaid label exists
      const prepaidLabel = await prepaidLabelPoolRepository.findAvailableByOrderRef(
        request.OrderId + '',
        user.user_id
      );

      console.log(`Prepaid label lookup complete for order: ${request.OrderId}`);
      console.log(`Prepaid label found: ${request.ServiceId}`);
      console.log(`User ID: ${user.user_id}`);

      // 3a. IF NO LABEL FOUND - Return error
      if (!prepaidLabel) {
        console.log(`No prepaid label found for: ${request.OrderId}`);

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
          ErrorMessage: `No pre-paid label found for order reference '${request.OrderId}'. ` +
            `Available labels: ${availableRefs || 'None'}. ` +
            `Please upload labels first or change the order reference.`,
          LeadTrackingNumber: '',
          Cost: 0,
          Currency: 'GBP',
          Package: []
        } as GenerateLabelResponse);
        return;
      }

      //IF LABEL FOUND - Process in transaction
      console.log(`Found prepaid label: ${prepaidLabel.tracking_number}`);

      const result = await transaction(async (client) => {

        const claimResult = await client.query(
          `UPDATE prepaid_label_pool 
            SET label_status = 'CLAIMED',
                claimed_date = CURRENT_TIMESTAMP,
                claimed_by_order_id = $1
            WHERE pool_label_id = $2
            AND label_status = 'AVAILABLE'
            RETURNING *`,
          [request.OrderId, prepaidLabel.pool_label_id]
        );

        if (claimResult.rowCount === 0) {
          throw new Error(`Label for ${request.OrderId} could not be claimed (already used?)`);
        }

        console.log(`Label claimed for order ${request.OrderId}`);

        const consignmentResult = await client.query(
          `INSERT INTO consignments (
              consignment_id,
              user_id,
              service_unique_id,
              pool_label_id,
              order_reference,
              linnworks_order_id,
              lead_tracking_number,
              recipient_name,
              recipient_company_name,
              address_line1,
              address_line2,
              address_line3,
              town,
              region,
              country_code,
              postalcode,
              recipient_email,
              recipient_phone,
              consignment_status
            ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, $18, 'LABEL_ASSIGNED')
            RETURNING *`,
          [
            uuidv4(),
            user.user_id,
            request.ServiceId,
            prepaidLabel.pool_label_id,
            request.OrderId + '',
            request.OrderId,
            prepaidLabel.tracking_number,
            request.Name,
            request.CompanyName || null,
            request.AddressLine1,
            request.AddressLine2 || null,
            request.AddressLine3 || null,
            request.Town,
            request.Region,
            request.CountryCode,
            request.Postalcode,
            request.Email || null,
            request.Phone || null
          ]
        );

        const consignment = consignmentResult.rows[0];
        console.log(`Consignment created: ${consignment.consignment_id}`);

        if (request.OrderExtendedProperties && request.OrderExtendedProperties.length > 0) {
          for (const prop of request.OrderExtendedProperties) {
            await client.query(
              `INSERT INTO order_extended_properties (
                  consignment_id,
                  property_name,
                  property_value
                ) VALUES ($1, $2, $3)`,
              [consignment.consignment_id, prop.Name, prop.Value]
            );
          }
          console.log(`Stored ${request.OrderExtendedProperties.length} order extended properties`);
        }

        //Get split page for label file path
        const splitPageResult = await client.query(
          `SELECT * FROM split_label_pages WHERE split_page_id = $1`,
          [prepaidLabel.split_page_id]
        );

        const splitPage = splitPageResult.rows[0];

        if (!splitPage?.png_file_path) {
          throw new Error('Label file not found in storage');
        }

        //Process each package
        const packageResponses: PackageResponse[] = [];

        for (const pkg of request.Packages) {
          //Create Package Recordfile_path
          const packageResult = await client.query(
            `INSERT INTO consignment_packages (
                package_id,
                consignment_id,
                sequence_number,
                tracking_number,
                label_width,
                label_height,
                png_label_s3_path,
                package_width,
                package_height,
                package_depth,
                package_weight,
                package_format
              ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12)
              RETURNING *`,
            [
              uuidv4(),
              consignment.consignment_id,
              pkg.SequenceNumber,
              prepaidLabel.tracking_number,
              4,
              6,
              splitPage.png_file_path,
              pkg.PackageWidth,
              pkg.PackageHeight,
              pkg.PackageDepth,
              pkg.PackageWeight,
              pkg.PackageFormat || null
            ]
          );

          const packageRecord = packageResult.rows[0];
          console.log(`Package ${pkg.SequenceNumber} created: ${packageRecord.package_id}`);

          // 5b. Store Package Documentation (the label PDF)
          await client.query(
            `INSERT INTO package_documentation (
                package_id,
                document_type,
                document_name,
                pdf_s3_path
              ) VALUES ($1, $2, $3, $4)`,
            [
              packageRecord.package_id,
              'SHIPPING_LABEL',
              `Label_${prepaidLabel.tracking_number}.pdf`,
              splitPage.file_path
            ]
          );

          console.log(`Package documentation stored`);

          if (pkg.Items && pkg.Items.length > 0) {
            for (const item of pkg.Items) {
              const itemResult = await client.query(
                `INSERT INTO package_items (
                    item_id,
                    package_id,
                    item_name,
                    product_code,
                    quantity,
                    unit_value,
                    total_value,
                    unit_weight,
                    height,
                    width,
                    length
                  ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11)
                  RETURNING *`,
                [
                  uuidv4(),
                  packageRecord.package_id,
                  item.ItemName,
                  item.ProductCode,
                  item.Quantity,
                  item.UnitValue,
                  item.UnitValue * item.Quantity,
                  item.UnitWeight,
                  item.Height || null,
                  item.Width || null,
                  item.Length || null
                ]
              );

              const itemRecord = itemResult.rows[0];
              console.log(`📦 Item created: ${item.ProductCode}`);

              // Store Item Extended Properties
              if (item.ExtendedProperties && item.ExtendedProperties.length > 0) {
                for (const prop of item.ExtendedProperties) {
                  await client.query(
                    `INSERT INTO item_extended_properties (
                        item_id,
                        property_name,
                        property_value
                      ) VALUES ($1, $2, $3)`,
                    [itemRecord.item_id, prop.Name, prop.Value]
                  );
                }
                console.log(`📝 Stored ${item.ExtendedProperties.length} item extended properties`);
              }
            }
          }

          // Download label from S3 for response
          const labelStream = await s3Service.getFileStream(splitPage.png_file_path);
          const labelBuffer = await this.streamToBuffer(labelStream);
          const labelBase64 = labelBuffer.toString('base64');

          // Add to response
          packageResponses.push({
            SequenceNumber: pkg.SequenceNumber,
            TrackingNumber: prepaidLabel.tracking_number,
            PNGLabelDataBase64: labelBase64,
            PDFBytesDocumentationBase64: [], // Additional docs can be added here
            LabelWidth: 4,
            LabelHeight: 6
          });
        }

        return {
          consignment,
          packages: packageResponses
        };
      });

      // Return success response
      res.json({
        IsError: false,
        ErrorMessage: '',
        LeadTrackingNumber: prepaidLabel.tracking_number,
        Cost: 0,
        Currency: 'GBP',
        Package: result.packages
      } as GenerateLabelResponse);

      console.log(`Label generated successfully for order ${request.OrderId}`);
      console.log(`Summary: 
          - Consignment: ${result.consignment.consignment_id}
          - Packages: ${result.packages.length}
          - Order Properties: ${request.OrderExtendedProperties?.length || 0}
          - Items: ${request.Packages.reduce((sum, p) => sum + (p.Items?.length || 0), 0)}
        `);

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

  /**
   * Cancel Label
   * POST /api/Consignment/CancelLabel
   */
  async cancelLabel(req: Request, res: Response): Promise<void> {
    try {
      const { AuthorizationToken, OrderReference } = req.body;
      const user = req.user;

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

      await transaction(async (client) => {
        // Update consignment status
        await client.query(
          `UPDATE consignments 
            SET consignment_status = 'CANCELLED',
                cancelled_date = CURRENT_TIMESTAMP,
                last_modified_date = CURRENT_TIMESTAMP
            WHERE consignment_id = $1`,
          [consignment.consignment_id]
        );

        // If it was a prepaid label, release it back to pool
        if (consignment.pool_label_id) {
          await client.query(
            `UPDATE prepaid_label_pool 
              SET label_status = 'AVAILABLE',
                  claimed_date = NULL,
                  claimed_by_order_id = NULL
              WHERE pool_label_id = $1`,
            [consignment.pool_label_id]
          );
          console.log(`Released label ${consignment.pool_label_id} back to pool`);
        }
      });

      res.json({
        IsError: false,
        ErrorMessage: ''
      });

      console.log(`Cancelled order ${OrderReference}`);

    }
     catch (error: any) {
      console.error('Cancel label error:', error);
      res.json({
        IsError: true,
        ErrorMessage: `Cancel failed: ${error.message}`
      });
    }
  }

  async getQuote(req: Request, res: Response): Promise<void> {
    try {
      res.json({
        "QuoteItems": [
          {
            "ServiceName": "FedEx Ground",
            "ServiceCode": "FEDEX_GROUND",
            "ServiceId": "0936e692-9543-442f-b3ce-7766e1ad83ef",
            "ServiceTag": "Ground",
            "CollectionDate": "/Date(1565283600000)/",
            "EstimatedDeliveryDate": "/Date(1565370000000)/",
            "Cost": 0,
            "Tax": 0,
            "TotalCost": 0,
            "Currency": "GBP",
            "PropertyItem": [
              {
                "Title": "PropertyName",
                "Value": "PropertyValue123"
              }
            ],
            "Options": [
              {
                "OptionName": "OptionName",
                "OptionValue": "OptionValue123"
              }
            ]
          }
        ],
        "IsError": false,
        "ErrorMessage": null
      });
    }
    catch (error: any) { 
      res.json({
        IsError: true,
        ErrorMessage: `GetQuote failed: ${error.message}`
      })
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