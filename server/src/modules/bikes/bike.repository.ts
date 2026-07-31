import { BikeModel, IBikeDocument } from './bike.model';

export class BikeRepository {
  async findById(id: string): Promise<IBikeDocument | null> {
    return BikeModel.findOne({ _id: id, isDeleted: false });
  }

  async findByBikeId(bikeId: string): Promise<IBikeDocument | null> {
    return BikeModel.findOne({ bikeId, isDeleted: false });
  }

  async create(bikeData: Partial<IBikeDocument>): Promise<IBikeDocument> {
    const bike = new BikeModel(bikeData);
    return bike.save();
  }

  async update(id: string, bikeData: Partial<IBikeDocument>): Promise<IBikeDocument | null> {
    return BikeModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: bikeData },
      { new: true }
    );
  }

  async softDelete(id: string): Promise<IBikeDocument | null> {
    return BikeModel.findOneAndUpdate(
      { _id: id, isDeleted: false },
      { $set: { isDeleted: true, deletedAt: new Date() } },
      { new: true }
    );
  }

  async findAll(
    filter: any = {},
    page: number = 1,
    limit: number = 10
  ): Promise<{ bikes: IBikeDocument[]; total: number }> {
    const queryFilter = { ...filter, isDeleted: false };
    const skip = (page - 1) * limit;

    const [bikes, total] = await Promise.all([
      BikeModel.find(queryFilter)
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      BikeModel.countDocuments(queryFilter),
    ]);

    return { bikes, total };
  }
}

export default BikeRepository;
