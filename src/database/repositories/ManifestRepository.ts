import { BaseRepository } from './BaseRepository';
import { Manifest, ManifestConsignment, ManifestStatus } from '../../types/database.types';
import { PoolClient } from 'pg';

export class ManifestRepository extends BaseRepository<Manifest> {
  constructor() {
    super('manifests');
  }

  protected getIdColumn(): string {
    return 'manifest_id';
  }

  async create(data: {
    userId: string;
    manifestReference: string;
  }): Promise<Manifest> {
    const result = await this.executeQuery<Manifest>(
      `INSERT INTO manifests (
        user_id,
        manifest_reference,
        manifest_status
      ) VALUES ($1, $2, 'CREATED')
      RETURNING *`,
      [data.userId, data.manifestReference]
    );
    return result.rows[0];
  }

  /**
   * Add consignments to manifest
   */
  async addConsignments(
    manifestId: string,
    consignmentIds: string[]
  ): Promise<ManifestConsignment[]> {
    return await this.transaction(async (client: PoolClient) => {
      const addedConsignments: ManifestConsignment[] = [];

      for (const consignmentId of consignmentIds) {
        
        const consignmentResult = await client.query(
          'SELECT order_reference FROM consignments WHERE consignment_id = $1',
          [consignmentId]
        );

        const orderReference = consignmentResult.rows[0]?.order_reference || null;

        // Add to manifest_consignments
        const result = await client.query<ManifestConsignment>(
          `INSERT INTO manifest_consignments (
            manifest_id,
            consignment_id,
            order_reference
          ) VALUES ($1, $2, $3)
          RETURNING *`,
          [manifestId, consignmentId, orderReference]
        );

        addedConsignments.push(result.rows[0]);

        // Update consignment status
        await client.query(
          `UPDATE consignments 
           SET consignment_status = 'MANIFESTED',
               manifest_date = CURRENT_TIMESTAMP,
               last_modified_date = CURRENT_TIMESTAMP
           WHERE consignment_id = $1`,
          [consignmentId]
        );
      }

      // Update manifest total count
      await client.query(
        `UPDATE manifests 
         SET total_consignments = $1,
             last_modified_date = CURRENT_TIMESTAMP
         WHERE manifest_id = $2`,
        [addedConsignments.length, manifestId]
      );

      return addedConsignments;
    });
  }

  async findByReference(manifestReference: string): Promise<Manifest | null> {
    const result = await this.executeQuery<Manifest>(
      'SELECT * FROM manifests WHERE manifest_reference = $1',
      [manifestReference]
    );
    return result.rows[0] || null;
  }

  async getManifestWithConsignments(manifestId: string) {
    const result = await this.executeQuery(
      `SELECT 
        m.*,
        json_agg(
          json_build_object(
            'consignment_id', c.consignment_id,
            'order_reference', c.order_reference,
            'tracking_number', c.lead_tracking_number,
            'recipient_name', c.recipient_name,
            'town', c.town,
            'country_code', c.country_code
          )
        ) as consignments
      FROM manifests m
      LEFT JOIN manifest_consignments mc ON m.manifest_id = mc.manifest_id
      LEFT JOIN consignments c ON mc.consignment_id = c.consignment_id
      WHERE m.manifest_id = $1
      GROUP BY m.manifest_id`,
      [manifestId]
    );
    return result.rows[0] || null;
  }

  async findByUser(
    userId: string,
    options?: {
      status?: ManifestStatus;
      limit?: number;
      offset?: number;
    }
  ): Promise<Manifest[]> {
    const { status, limit = 50, offset = 0 } = options || {};

    let query = 'SELECT * FROM manifests WHERE user_id = $1';
    const params: any[] = [userId];

    if (status) {
      query += ' AND manifest_status = $2';
      params.push(status);
    }

    query += ' ORDER BY manifest_date DESC LIMIT $' + (params.length + 1);
    params.push(limit);

    query += ' OFFSET $' + (params.length + 1);
    params.push(offset);

    const result = await this.executeQuery<Manifest>(query, params);
    return result.rows;
  }

  async updateStatus(
    manifestId: string,
    status: ManifestStatus
  ): Promise<Manifest | null> {
    const result = await this.executeQuery<Manifest>(
      `UPDATE manifests 
       SET manifest_status = $1,
           last_modified_date = CURRENT_TIMESTAMP
       WHERE manifest_id = $2
       RETURNING *`,
      [status, manifestId]
    );
    return result.rows[0] || null;
  }

  async setPdfPath(
    manifestId: string,
    pdfS3Path: string
  ): Promise<Manifest | null> {
    const result = await this.executeQuery<Manifest>(
      `UPDATE manifests 
       SET pdf_s3_path = $1,
           last_modified_date = CURRENT_TIMESTAMP
       WHERE manifest_id = $2
       RETURNING *`,
      [pdfS3Path, manifestId]
    );
    return result.rows[0] || null;
  }

  async markAsPrinted(manifestId: string): Promise<Manifest | null> {
    const result = await this.executeQuery<Manifest>(
      `UPDATE manifests 
       SET manifest_status = 'PRINTED',
           printed_date = CURRENT_TIMESTAMP,
           last_modified_date = CURRENT_TIMESTAMP
       WHERE manifest_id = $1
       RETURNING *`,
      [manifestId]
    );
    return result.rows[0] || null;
  }

  async getStats(userId: string): Promise<{
    totalManifests: number;
    created: number;
    submitted: number;
    printed: number;
    totalConsignments: number;
  }> {
    const result = await this.executeQuery<any>(
      `SELECT 
         COUNT(*) as total_manifests,
         SUM(CASE WHEN manifest_status = 'CREATED' THEN 1 ELSE 0 END) as created,
         SUM(CASE WHEN manifest_status = 'SUBMITTED' THEN 1 ELSE 0 END) as submitted,
         SUM(CASE WHEN manifest_status = 'PRINTED' THEN 1 ELSE 0 END) as printed,
         COALESCE(SUM(total_consignments), 0) as total_consignments
       FROM manifests
       WHERE user_id = $1`,
      [userId]
    );

    const row = result.rows[0];
    return {
      totalManifests: parseInt(row.total_manifests) || 0,
      created: parseInt(row.created) || 0,
      submitted: parseInt(row.submitted) || 0,
      printed: parseInt(row.printed) || 0,
      totalConsignments: parseInt(row.total_consignments) || 0
    };
  }

  async getConsignments(manifestId: string): Promise<ManifestConsignment[]> {
    const result = await this.executeQuery<ManifestConsignment>(
      'SELECT * FROM manifest_consignments WHERE manifest_id = $1 ORDER BY added_date',
      [manifestId]
    );
    return result.rows;
  }

  async isConsignmentManifested(consignmentId: string): Promise<boolean> {
    const result = await this.executeQuery(
      'SELECT 1 FROM manifest_consignments WHERE consignment_id = $1 LIMIT 1',
      [consignmentId]
    );
    return result.rowCount !== null && result.rowCount > 0;
  }
}

export const manifestRepository = new ManifestRepository();