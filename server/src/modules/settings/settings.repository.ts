import { SettingsModel, ISettingsDocument } from './settings.model';

export class SettingsRepository {
  // Retrieve settings or seed defaults if none exist
  async get(): Promise<ISettingsDocument> {
    let settings = await SettingsModel.findOne({});
    if (!settings) {
      settings = new SettingsModel({});
      await settings.save();
    }
    return settings;
  }

  // Update configuration parameters
  async update(updateData: Partial<ISettingsDocument>): Promise<ISettingsDocument> {
    let settings = await SettingsModel.findOne({});
    if (!settings) {
      settings = new SettingsModel(updateData);
    } else {
      Object.assign(settings, updateData);
    }
    await settings.save();
    return settings;
  }
}

export default SettingsRepository;
