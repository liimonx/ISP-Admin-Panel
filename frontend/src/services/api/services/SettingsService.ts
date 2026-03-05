import { BaseApiService } from "../base/BaseApiService";
import { ENDPOINTS } from "../base/constants";

export class SettingsService extends BaseApiService {
  /**
   * Get system settings
   */
  async getSettings(): Promise<any> {
    return this.get<any>(ENDPOINTS.CORE.SETTINGS + '/');
  }

  /**
   * Update system settings (full update)
   */
  async updateSettings(settings: Record<string, any>): Promise<any> {
    return this.put<any>(ENDPOINTS.CORE.SETTINGS + '/', settings);
  }

  /**
   * Partially update system settings
   */
  async updateSettingsPartial(settings: Record<string, any>): Promise<any> {
    return this.patch<any>(ENDPOINTS.CORE.SETTINGS_UPDATE + '/', settings);
  }
}
