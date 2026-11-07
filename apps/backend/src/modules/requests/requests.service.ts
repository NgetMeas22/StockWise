import { prisma } from '../../lib/prisma.js';
import { stockService } from '../inventory/stockService.js';
import { MovementType, ReasonCode, ReferenceType } from '@prisma/client';
import { NotFoundError, ValidationError } from '../../http/errors.js';
import { writeAuditLog } from '../../lib/audit.js';

export interface CreateRoomRequestInput {
  room: string;
  productId: string;
  quantity: number;
  urgency?: 'NORMAL' | 'HIGH' | 'URGENT';
  notes?: string | null;
}

export class RequestsService {
  private initialized = false;

  public async ensureTable(): Promise<void> {
    if (this.initialized) return;
    try {
      await prisma.$executeRawUnsafe(`
        CREATE TABLE IF NOT EXISTS room_requests (
          id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
          request_number VARCHAR(50) UNIQUE NOT NULL,
          room VARCHAR(100) NOT NULL,
          product_id UUID NOT NULL REFERENCES products(id) ON DELETE RESTRICT,
          quantity NUMERIC(14, 3) NOT NULL,
          urgency VARCHAR(20) NOT NULL DEFAULT 'NORMAL',
          status VARCHAR(20) NOT NULL DEFAULT 'PENDING',
          notes TEXT,
          requested_by UUID NOT NULL REFERENCES users(id) ON DELETE RESTRICT,
          dispatched_by UUID REFERENCES users(id) ON DELETE SET NULL,
          dispatched_at TIMESTAMPTZ,
          created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
          updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
        );
        CREATE INDEX IF NOT EXISTS idx_room_requests_status ON room_requests(status);
        CREATE INDEX IF NOT EXISTS idx_room_requests_room ON room_requests(room);
        CREATE INDEX IF NOT EXISTS idx_room_requests_created_at ON room_requests(created_at DESC);
      `);
      this.initialized = true;
    } catch (err) {
      console.error('Failed to ensure room_requests table:', err);
    }
  }

  public async listRequests(filters?: { status?: string; room?: string; urgency?: string }) {
    await this.ensureTable();
    let whereClauses = '1=1';
    const params: any[] = [];

    if (filters?.status) {
      params.push(filters.status.toUpperCase());
      whereClauses += ` AND r.status = $${params.length}`;
    }
    if (filters?.room) {
      params.push(`%${filters.room}%`);
      whereClauses += ` AND r.room ILIKE $${params.length}`;
    }
    if (filters?.urgency) {
      params.push(filters.urgency.toUpperCase());
      whereClauses += ` AND r.urgency = $${params.length}`;
    }

    const query = `
      SELECT 
        r.id,
        r.request_number as "requestNumber",
        r.room,
        r.product_id as "productId",
        r.quantity::float as quantity,
        r.urgency,
        r.status,
        r.notes,
        r.created_at as "createdAt",
        r.updated_at as "updatedAt",
        r.dispatched_at as "dispatchedAt",
        p.name as "productName",
        p.sku as "productSku",
        p.unit as "productUnit",
        u.full_name as "requestedByName",
        u.email as "requestedByEmail",
        du.full_name as "dispatchedByName"
      FROM room_requests r
      JOIN products p ON r.product_id = p.id
      JOIN users u ON r.requested_by = u.id
      LEFT JOIN users du ON r.dispatched_by = du.id
      WHERE ${whereClauses}
      ORDER BY 
        CASE r.urgency 
          WHEN 'URGENT' THEN 1 
          WHEN 'HIGH' THEN 2 
          ELSE 3 
        END ASC,
        r.created_at DESC
      LIMIT 100;
    `;

    return prisma.$queryRawUnsafe<any[]>(query, ...params);
  }

  public async createRequest(
    input: CreateRoomRequestInput,
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    await this.ensureTable();

    if (!input.room || !input.room.trim()) {
      throw new ValidationError('Department or Room name is required');
    }
    if (!input.productId) {
      throw new ValidationError('Product is required');
    }
    if (!input.quantity || input.quantity <= 0) {
      throw new ValidationError('Quantity must be greater than zero');
    }

    const product = await prisma.product.findUnique({ where: { id: input.productId } });
    if (!product || product.status !== 'ACTIVE') {
      throw new NotFoundError('Selected product is not available');
    }

    const reqNum = `REQ-${Date.now().toString().slice(-6)}`;
    const urgency = input.urgency || 'NORMAL';

    const inserted: any[] = await prisma.$queryRawUnsafe(
      `
        INSERT INTO room_requests (
          request_number,
          room,
          product_id,
          quantity,
          urgency,
          status,
          notes,
          requested_by
        ) VALUES ($1, $2, $3, $4, $5, 'PENDING', $6, $7)
        RETURNING 
          id,
          request_number as "requestNumber",
          room,
          product_id as "productId",
          quantity::float as quantity,
          urgency,
          status,
          notes,
          created_at as "createdAt";
      `,
      reqNum,
      input.room.trim(),
      input.productId,
      input.quantity,
      urgency,
      input.notes?.trim() || null,
      actorUserId
    );

    const record = inserted[0];

    await writeAuditLog({
      actorUserId,
      action: 'ROOM_REQUEST_CREATED',
      entityType: 'ROOM_REQUEST',
      entityId: record.id,
      after: record,
      ip,
      userAgent,
      requestId,
    });

    return record;
  }

  public async fulfillRequest(
    requestIdVal: string,
    warehouseId: string,
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    await this.ensureTable();

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM room_requests WHERE id = $1`,
      requestIdVal
    );

    if (!rows || rows.length === 0) {
      throw new NotFoundError('Room request not found');
    }

    const req = rows[0];
    if (req.status !== 'PENDING') {
      throw new ValidationError(`Cannot fulfill request with status ${req.status}`);
    }

    // Apply inventory stock movement: deduction for usage
    await stockService.apply({
      productId: req.product_id,
      warehouseId,
      movementType: MovementType.ISSUE,
      quantityDelta: -Number(req.quantity),
      reasonCode: ReasonCode.USAGE,
      reason: `Fulfill Room Request ${req.request_number} to ${req.room}`,
      referenceType: ReferenceType.MANUAL,
      referenceId: req.id,
      performedBy: actorUserId,
      ip,
      userAgent,
      requestId,
    });

    // Mark as FULFILLED
    const updated: any[] = await prisma.$queryRawUnsafe(
      `
        UPDATE room_requests
        SET status = 'FULFILLED',
            dispatched_by = $1,
            dispatched_at = NOW(),
            updated_at = NOW()
        WHERE id = $2
        RETURNING 
          id,
          request_number as "requestNumber",
          status,
          dispatched_at as "dispatchedAt";
      `,
      actorUserId,
      requestIdVal
    );

    await writeAuditLog({
      actorUserId,
      action: 'ROOM_REQUEST_FULFILLED',
      entityType: 'ROOM_REQUEST',
      entityId: requestIdVal,
      before: { status: req.status },
      after: { status: 'FULFILLED', warehouseId },
      ip,
      userAgent,
      requestId,
    });

    return updated[0];
  }

  public async rejectRequest(
    requestIdVal: string,
    reason: string,
    actorUserId: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    await this.ensureTable();

    const rows: any[] = await prisma.$queryRawUnsafe(
      `SELECT * FROM room_requests WHERE id = $1`,
      requestIdVal
    );

    if (!rows || rows.length === 0) {
      throw new NotFoundError('Room request not found');
    }

    const req = rows[0];
    if (req.status !== 'PENDING') {
      throw new ValidationError(`Cannot reject request with status ${req.status}`);
    }

    const updated: any[] = await prisma.$queryRawUnsafe(
      `
        UPDATE room_requests
        SET status = 'REJECTED',
            notes = COALESCE(notes, '') || ' [Rejected: ' || $1 || ']',
            updated_at = NOW()
        WHERE id = $2
        RETURNING id, request_number as "requestNumber", status;
      `,
      reason.trim(),
      requestIdVal
    );

    await writeAuditLog({
      actorUserId,
      action: 'ROOM_REQUEST_REJECTED',
      entityType: 'ROOM_REQUEST',
      entityId: requestIdVal,
      before: { status: req.status },
      after: { status: 'REJECTED', reason },
      ip,
      userAgent,
      requestId,
    });

    return updated[0];
  }
}

export const requestsService = new RequestsService();

