import { Request, Response, NextFunction } from 'express';
import { settingsService } from './settings.service.js';
import { sendSuccess } from '../../http/response.js';

export class SettingsController {
  public async getSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsService.getSettings();
      sendSuccess(res, settings);
    } catch (err) {
      next(err);
    }
  }

  public async updateSettings(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const settings = await settingsService.updateSettings(
        req.body,
        req.user!.id,
        req.ip,
        req.headers['user-agent'],
        req.requestId
      );
      sendSuccess(res, settings);
    } catch (err) {
      next(err);
    }
  }
}

export const settingsController = new SettingsController();
