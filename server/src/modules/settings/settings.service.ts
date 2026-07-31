import { SettingsRepository } from './settings.repository';
import { ISettingsDocument } from './settings.model';

export class SettingsService {
  private settingsRepository = new SettingsRepository();

  async getSettings(): Promise<ISettingsDocument> {
    return this.settingsRepository.get();
  }

  async updateSettings(updateData: Partial<ISettingsDocument>): Promise<ISettingsDocument> {
    return this.settingsRepository.update(updateData);
  }
}

export default SettingsService;
