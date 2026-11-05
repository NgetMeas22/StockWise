import { Request, Response, NextFunction } from 'express';
import { reportsService } from './reports.service.js';
import { sendSuccess } from '../../http/response.js';
import { can } from '../../middleware/requirePermission.js';
import { formatCsv } from '../../lib/csv.js';
import { ForbiddenError } from '../../http/errors.js';
import { writeAuditLog } from '../../lib/audit.js';

export class ReportsController {
  public async getSummary(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const canViewValuation = can(req, 'reports:valuation');
      const canViewCost = can(req, 'products:view_cost');

      const summary = await reportsService.getDashboardSummary(canViewValuation, canViewCost);
      sendSuccess(res, summary);
    } catch (err) {
      next(err);
    }
  }

  public async getInventoryValuation(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const groupBy = (req.query.groupBy as 'category' | 'warehouse') || 'category';
      const data = await reportsService.getValuationReport(groupBy);

      if (req.query.format === 'csv') {
        if (!can(req, 'reports:export')) {
          throw new ForbiddenError('You do not have permission to export CSV reports (reports:export)');
        }

        const cols =
          groupBy === 'warehouse'
            ? ['warehouseCode', 'warehouseName', 'itemCount', 'totalQuantity', 'totalValuation']
            : ['categoryName', 'categorySlug', 'itemCount', 'totalQuantity', 'totalValuation'];

        const csvString = formatCsv(data as any, cols);

        await writeAuditLog({
          actorUserId: req.user?.id,
          action: 'REPORT_EXPORT_CSV',
          entityType: 'REPORT',
          entityId: 'inventory-valuation',
          after: { groupBy, rowsCount: data.length },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          requestId: req.requestId,
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', `attachment; filename="inventory-valuation-${groupBy}.csv"`);
        res.status(200).send(csvString);
        return;
      }

      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getLowStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reportsService.getLowStockReport();

      if (req.query.format === 'csv') {
        if (!can(req, 'reports:export')) {
          throw new ForbiddenError('You do not have permission to export CSV reports (reports:export)');
        }

        const cols = ['sku', 'name', 'category_name', 'unit', 'reorder_level', 'quantity_on_hand'];
        const csvString = formatCsv(data as any, cols);

        await writeAuditLog({
          actorUserId: req.user?.id,
          action: 'REPORT_EXPORT_CSV',
          entityType: 'REPORT',
          entityId: 'low-stock',
          after: { rowsCount: data.length },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          requestId: req.requestId,
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="low-stock-report.csv"');
        res.status(200).send(csvString);
        return;
      }

      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }

  public async getOutOfStock(req: Request, res: Response, next: NextFunction): Promise<void> {
    try {
      const data = await reportsService.getOutOfStockReport();

      if (req.query.format === 'csv') {
        if (!can(req, 'reports:export')) {
          throw new ForbiddenError('You do not have permission to export CSV reports (reports:export)');
        }

        const cols = ['sku', 'name', 'category_name', 'unit', 'reorder_level', 'quantity_on_hand'];
        const csvString = formatCsv(data as any, cols);

        await writeAuditLog({
          actorUserId: req.user?.id,
          action: 'REPORT_EXPORT_CSV',
          entityType: 'REPORT',
          entityId: 'out-of-stock',
          after: { rowsCount: data.length },
          ip: req.ip,
          userAgent: req.headers['user-agent'],
          requestId: req.requestId,
        });

        res.setHeader('Content-Type', 'text/csv');
        res.setHeader('Content-Disposition', 'attachment; filename="out-of-stock-report.csv"');
        res.status(200).send(csvString);
        return;
      }

      sendSuccess(res, data);
    } catch (err) {
      next(err);
    }
  }
}

export const reportsController = new ReportsController();
