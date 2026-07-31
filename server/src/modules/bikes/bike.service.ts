import { BikeRepository } from './bike.repository';
import { BikeModel, IBikeDocument } from './bike.model';
import { QRCodeService } from './qrcode.service';
import AppError from '../../shared/utils/appError';

export class BikeService {
  private bikeRepository = new BikeRepository();
  private qrCodeService = new QRCodeService();

  // Generate unique incremental BikeId BK0001, BK0002
  private async generateNextBikeId(): Promise<string> {
    const lastBike = await BikeModel.findOne({}).sort({ createdAt: -1 });
    if (!lastBike) return 'BK0001';

    const match = lastBike.bikeId.match(/\d+/);
    if (!match) return 'BK0001';

    const nextNum = parseInt(match[0]) + 1;
    return `BK${nextNum.toString().padStart(4, '0')}`;
  }

  // Create a new motorbike and attach its dynamic QR code link
  async createBike(bikeData: Partial<IBikeDocument>): Promise<IBikeDocument> {
    // Validate registration number uniqueness
    if (bikeData.registrationNumber) {
      const existing = await BikeModel.findOne({
        registrationNumber: bikeData.registrationNumber,
        isDeleted: false,
      });
      if (existing) {
        throw new AppError('A motorbike with this registration number already exists', 409);
      }
    }

    // Generate fields
    const bikeId = await this.generateNextBikeId();
    bikeData.bikeId = bikeId;

    // Generate dynamic QR code data URL pointing to the customer page
    const qrCode = await this.qrCodeService.generateForBike(bikeId);
    bikeData.qrCode = qrCode;

    return this.bikeRepository.create(bikeData);
  }

  // Retrieve list of all non-deleted bikes with optional filters and pagination
  async getBikesList(
    filter: any = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ bikes: IBikeDocument[]; total: number }> {
    const queryFilter: any = {};

    if (filter.search) {
      queryFilter.$or = [
        { name: { $regex: filter.search, $options: 'i' } },
        { brand: { $regex: filter.search, $options: 'i' } },
        { registrationNumber: { $regex: filter.search, $options: 'i' } },
      ];
    }

    if (filter.brand) {
      queryFilter.brand = filter.brand;
    }

    if (filter.status) {
      queryFilter.status = filter.status;
    }

    return this.bikeRepository.findAll(queryFilter, page, limit);
  }

  // Fetch single bike details by MongoDB _id
  async getBikeById(id: string): Promise<IBikeDocument> {
    const bike = await this.bikeRepository.findById(id);
    if (!bike) {
      throw new AppError('Motorbike not found', 404);
    }
    return bike;
  }

  // Fetch single bike details by business bikeId
  async getBikeByBikeId(bikeId: string): Promise<IBikeDocument> {
    const bike = await this.bikeRepository.findByBikeId(bikeId);
    if (!bike) {
      throw new AppError('Motorbike code not found', 404);
    }
    return bike;
  }

  // Update motorbike fields
  async updateBike(id: string, updateData: Partial<IBikeDocument>): Promise<IBikeDocument> {
    const bike = await this.bikeRepository.findById(id);
    if (!bike) {
      throw new AppError('Motorbike not found', 404);
    }

    // Validate registration uniqueness if updated
    if (updateData.registrationNumber && updateData.registrationNumber !== bike.registrationNumber) {
      const existing = await BikeModel.findOne({
        registrationNumber: updateData.registrationNumber,
        isDeleted: false,
      });
      if (existing) {
        throw new AppError('A motorbike with this registration number already exists', 409);
      }
    }

    const updated = await this.bikeRepository.update(id, updateData);
    if (!updated) {
      throw new AppError('Failed to update motorbike details', 500);
    }
    return updated;
  }

  // Soft delete a bike
  async deleteBike(id: string): Promise<void> {
    const deleted = await this.bikeRepository.softDelete(id);
    if (!deleted) {
      throw new AppError('Motorbike not found', 404);
    }
  }

  // Regenerate QR code for a bike (in case client URLs are modified)
  async regenerateQR(id: string): Promise<string> {
    const bike = await this.bikeRepository.findById(id);
    if (!bike) {
      throw new AppError('Motorbike not found', 404);
    }

    const qrCode = await this.qrCodeService.generateForBike(bike.bikeId);
    await this.bikeRepository.update(id, { qrCode } as any);
    return qrCode;
  }

  // Bulk create motorbikes
  async bulkCreateBikes(bikesData: Partial<IBikeDocument>[]): Promise<IBikeDocument[]> {
    const createdBikes: IBikeDocument[] = [];
    for (const data of bikesData) {
      if (data.registrationNumber) {
        const existing = await BikeModel.findOne({
          registrationNumber: data.registrationNumber,
          isDeleted: false,
        });
        if (existing) {
          throw new AppError(`A motorbike with registration number ${data.registrationNumber} already exists`, 409);
        }
      }

      const bikeId = await this.generateNextBikeId();
      data.bikeId = bikeId;

      const qrCode = await this.qrCodeService.generateForBike(bikeId);
      data.qrCode = qrCode;

      if (!data.rentPrice) data.rentPrice = 500;
      if (!data.securityDeposit) data.securityDeposit = 1000;
      if (!data.status) data.status = 'Available';

      const bike = await this.bikeRepository.create(data);
      createdBikes.push(bike);
    }
    return createdBikes;
  }
}

export default BikeService;
