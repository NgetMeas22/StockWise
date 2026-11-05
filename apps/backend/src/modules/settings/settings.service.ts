import { prisma } from '../../lib/prisma.js';
import { writeAuditLog } from '../../lib/audit.js';

export class SettingsService {
  public async getSettings() {
    const settings = await prisma.appSetting.findMany();
    const map: Record<string, any> = {
      currency_code: 'USD',
      public_show_prices: true,
      public_show_availability: true,
      over_receipt_tolerance_percent: 0,
      default_low_stock_threshold: 10,
    };

    for (const s of settings) {
      map[s.key] = s.value;
    }

    return map;
  }

  public async updateSettings(
    input: Record<string, any>,
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const allowedKeys = [
      'currency_code',
      'public_show_prices',
      'public_show_availability',
      'over_receipt_tolerance_percent',
      'default_low_stock_threshold',
    ];

    const updatedMap: Record<string, any> = {};

    for (const key of allowedKeys) {
      if (input[key] !== undefined) {
        await prisma.appSetting.upsert({
          where: { key },
          update: { value: input[key], updatedBy: actorUserId },
          create: { key, value: input[key], updatedBy: actorUserId },
        });
        updatedMap[key] = input[key];
      }
    }

    await writeAuditLog({
      actorUserId,
      action: 'SETTINGS_UPDATED',
      entityType: 'APP_SETTING',
      entityId: 'global',
      after: updatedMap,
      ip,
      userAgent,
      requestId,
    });

    return this.getSettings();
  }
}

export const settingsService = new SettingsService();
