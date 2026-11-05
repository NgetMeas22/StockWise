export const RecordStatus = {
  ACTIVE: 'ACTIVE',
  ARCHIVED: 'ARCHIVED',
} as const;
export type RecordStatus = (typeof RecordStatus)[keyof typeof RecordStatus];

export const SupplierStatus = {
  ACTIVE: 'ACTIVE',
  INACTIVE: 'INACTIVE',
} as const;
export type SupplierStatus = (typeof SupplierStatus)[keyof typeof SupplierStatus];

export const UnitOfMeasure = {
  EACH: 'EACH',
  BOX: 'BOX',
  PACK: 'PACK',
  KG: 'KG',
  G: 'G',
  L: 'L',
  ML: 'ML',
  M: 'M',
} as const;
export type UnitOfMeasure = (typeof UnitOfMeasure)[keyof typeof UnitOfMeasure];

export const MovementType = {
  RECEIPT: 'RECEIPT',
  ISSUE: 'ISSUE',
  ADJUSTMENT: 'ADJUSTMENT',
  TRANSFER_OUT: 'TRANSFER_OUT',
  TRANSFER_IN: 'TRANSFER_IN',
  REVERSAL: 'REVERSAL',
} as const;
export type MovementType = (typeof MovementType)[keyof typeof MovementType];

export const ReasonCode = {
  PURCHASE_RECEIPT: 'PURCHASE_RECEIPT',
  DIRECT_PURCHASE: 'DIRECT_PURCHASE',
  CUSTOMER_RETURN: 'CUSTOMER_RETURN',
  USAGE: 'USAGE',
  SUPPLIER_RETURN: 'SUPPLIER_RETURN',
  DAMAGED: 'DAMAGED',
  COUNT_CORRECTION: 'COUNT_CORRECTION',
  TRANSFER: 'TRANSFER',
  REVERSAL: 'REVERSAL',
  OTHER: 'OTHER',
} as const;
export type ReasonCode = (typeof ReasonCode)[keyof typeof ReasonCode];

export const ReferenceType = {
  PURCHASE_ORDER: 'PURCHASE_ORDER',
  GOODS_RECEIPT: 'GOODS_RECEIPT',
  TRANSFER: 'TRANSFER',
  MOVEMENT: 'MOVEMENT',
  MANUAL: 'MANUAL',
} as const;
export type ReferenceType = (typeof ReferenceType)[keyof typeof ReferenceType];

export const PurchaseOrderStatus = {
  DRAFT: 'DRAFT',
  ORDERED: 'ORDERED',
  PARTIALLY_RECEIVED: 'PARTIALLY_RECEIVED',
  RECEIVED: 'RECEIVED',
  CANCELLED: 'CANCELLED',
} as const;
export type PurchaseOrderStatus = (typeof PurchaseOrderStatus)[keyof typeof PurchaseOrderStatus];

