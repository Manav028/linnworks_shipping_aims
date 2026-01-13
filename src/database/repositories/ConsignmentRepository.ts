import { BaseRepository } from './BaseRepository';
import { Consignment } from '../../types/database.types';

export class ConsignmentRepository extends BaseRepository<Consignment> {
  constructor() {
    super('consignments');
  }

  async create(data: {
    userId: string;
    courierServiceId: string;
    poolLabelId: string | null;
    orderReference: string;
    linnworksOrderId: number;
    leadTrackingNumber: string;
    recipientDetails: {
      name: string;
      companyName?: string;
      addressLine1: string;
      addressLine2?: string;
      addressLine3?: string;
      town: string;
      region: string;
      countryCode: string;
      postalcode: string;
      email?: string;
      phone?: string;
    };
  }): Promise<Consignment> {
    const result = await this.executeQuery<Consignment>(
      `INSERT INTO consignments (
        user_id,
        courier_service_id,
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
      ) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13, $14, $15, $16, $17, 'LABEL_ASSIGNED')
      RETURNING *`,
      [
        data.userId,
        data.courierServiceId,
        data.poolLabelId,
        data.orderReference,
        data.linnworksOrderId,
        data.leadTrackingNumber,
        data.recipientDetails.name,
        data.recipientDetails.companyName || null,
        data.recipientDetails.addressLine1,
        data.recipientDetails.addressLine2 || null,
        data.recipientDetails.addressLine3 || null,
        data.recipientDetails.town,
        data.recipientDetails.region,
        data.recipientDetails.countryCode,
        data.recipientDetails.postalcode,
        data.recipientDetails.email || null,
        data.recipientDetails.phone || null
      ]
    );
    return result.rows[0];
  }

  async findByOrderReference(
    orderReference: string,
    userId: string
  ): Promise<Consignment | null> {
    const result = await this.executeQuery<Consignment>(
      `SELECT * FROM consignments 
       WHERE order_reference = $1 
       AND user_id = $2
       ORDER BY created_date DESC
       LIMIT 1`,
      [orderReference, userId]
    );
    return result.rows[0] || null;
  }

  async findByLinnworksOrderId(
    linnworksOrderId: number,
    userId: string
  ): Promise<Consignment | null> {
    const result = await this.executeQuery<Consignment>(
      `SELECT * FROM consignments 
       WHERE linnworks_order_id = $1 
       AND user_id = $2`,
      [linnworksOrderId, userId]
    );
    return result.rows[0] || null;
  }

  async updateStatus(
    consignmentId: string,
    status: string
  ): Promise<Consignment | null> {
    const result = await this.executeQuery<Consignment>(
      `UPDATE consignments 
       SET consignment_status = $1,
           last_modified_date = CURRENT_TIMESTAMP
       WHERE consignment_id = $2
       RETURNING *`,
      [status, consignmentId]
    );
    return result.rows[0] || null;
  }

  async findUnmanifested(userId: string): Promise<Consignment[]> {
    const result = await this.executeQuery<Consignment>(
      `SELECT * FROM consignments 
       WHERE user_id = $1 
       AND consignment_status = 'LABEL_ASSIGNED'
       AND manifest_date IS NULL
       ORDER BY created_date ASC`,
      [userId]
    );
    return result.rows;
  }

  async markAsManifested(
    consignmentId: string,
    manifestDate: Date
  ): Promise<Consignment | null> {
    const result = await this.executeQuery<Consignment>(
      `UPDATE consignments 
       SET consignment_status = 'MANIFESTED',
           manifest_date = $1,
           last_modified_date = CURRENT_TIMESTAMP
       WHERE consignment_id = $2
       RETURNING *`,
      [manifestDate, consignmentId]
    );
    return result.rows[0] || null;
  }
}