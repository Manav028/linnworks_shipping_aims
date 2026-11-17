import { Request, Response } from "express";
import { v4 as uuidv4 } from "uuid";
import { configurationRepository, courierServiceRepository } from "../database/repositories/";

export class CourierServiceController {

  async create(req: Request, res: Response): Promise<void> {
    console.log("body:", JSON.stringify(req.body));
    try {
      const { name, serviceCode, servicetag, servicegroup } = req.body;
      console.log(`name: ${name}`)

      if (!name || !serviceCode || !servicetag || !servicegroup) {
        res.json({
          isError: true,
          errorMessage: 'name, serviceCode, servicetag and servicegroup are all required',
        });
        return;
      }

      const existing = await courierServiceRepository.findByServiceCode(serviceCode)
      if (existing) {
        res.json({
          isError: true,
          errorMessage: `A courier service with code "${serviceCode}" already exists`,
        });
        return;
      }

      const row = await courierServiceRepository.create({
        name,
        serviceCode,
        servicetag,
        servicegroup,   
      });

      res.json({
        isError: false,
        courierService: row,
      });

    } catch (error: any) {
      console.error('Create courier service error:', error);
      res.json({
        isError: true,
        errorMessage: `Failed to create courier service: ${error.message}`,
      });
    }
  }
}

export const courierServiceController = new CourierServiceController();