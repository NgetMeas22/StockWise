import {
  MovementType,
  PurchaseOrderStatus,
  ReasonCode,
  RecordStatus,
  ReferenceType,
  SupplierStatus,
  UnitOfMeasure,
} from './enums.js';
import { PermissionKey, RoleKey } from './permissions.js';

export interface UserDTO {
  id: string;
  email: string;
  fullName: string;
  roleKey: RoleKey;
  isActive: boolean;
  mustChangePassword: boolean;
  failedLoginCount: number;
  lockedUntil: string | null;
  lastLoginAt: string | null;
  passwordChangedAt: string | null;
  avatarKey?: string | null;
  avatarUrl?: string | null;
  phone?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface AuthMeResponse {
  user: UserDTO;
  role: RoleKey;
  permissions: PermissionKey[];
  csrfToken: string;
}

export interface LoginResponse {
  user: UserDTO;
  role: RoleKey;
  permissions: PermissionKey[];
  csrfToken: string;
}

export interface CategoryDTO {
  id: string;
  parentId: string | null;
  name: string;
  slug: string;
  description: string | null;
  imageKey: string | null;
  sortOrder: number;
  status: RecordStatus;
  productCount?: number;
  children?: CategoryDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface ProductDTO {
  id: string;
  sku: string;
  barcode: string | null;
  barcodeNormalized: string | null;
  name: string;
  slug: string;
  description: string | null;
  brand: string | null;
  imageKey: string | null;
  imageUrl?: string | null;
  unit: UnitOfMeasure;
  costPrice?: string | null; // Omitted if no products:view_cost
  averageCost?: string | null; // Omitted if no products:view_cost
  sellingPrice: string;
  categoryId: string;
  categoryName?: string;
  reorderLevel: string;
  status: RecordStatus;
  isPublished: boolean;
  archivedAt: string | null;
  version: number;
  totalQuantityOnHand?: string;
  balances?: Array<{
    warehouseId: string;
    warehouseName: string;
    quantityOnHand: string;
  }>;
  createdAt: string;
  updatedAt: string;
}

export interface WarehouseDTO {
  id: string;
  code: string;
  name: string;
  address: string | null;
  isDefault: boolean;
  status: RecordStatus;
  createdAt: string;
  updatedAt: string;
}

export interface SupplierDTO {
  id: string;
  name: string;
  contactPerson: string | null;
  email: string | null;
  phone: string | null;
  address: string | null;
  notes: string | null;
  status: SupplierStatus;
  createdAt: string;
  updatedAt: string;
}

export interface InventoryBalanceDTO {
  productId: string;
  productSku: string;
  productName: string;
  warehouseId: string;
  warehouseName: string;
  quantityOnHand: string;
  reorderLevel: string;
  unit: UnitOfMeasure;
  updatedAt: string;
}

export interface StockMovementDTO {
  id: string;
  seq: number;
  productId: string;
  productSku?: string;
  productName?: string;
  warehouseId: string;
  warehouseName?: string;
  movementType: MovementType;
  quantityDelta: string;
  quantityAfter: string;
  unitCost?: string | null; // Omitted if no products:view_cost
  reasonCode: ReasonCode;
  reason: string;
  referenceType: ReferenceType;
  referenceId: string | null;
  transferGroupId: string | null;
  reversesMovementId: string | null;
  performedBy: string;
  performerName?: string;
  createdAt: string;
}

export interface PurchaseOrderItemDTO {
  id: string;
  purchaseOrderId: string;
  productId: string;
  productSku?: string;
  productName?: string;
  lineNumber: number;
  quantityOrdered: string;
  quantityReceived: string;
  unitCost?: string | null; // Omitted if no products:view_cost
  lineTotal?: string | null; // Omitted if no products:view_cost
}

export interface PurchaseOrderDTO {
  id: string;
  poNumber: string;
  supplierId: string;
  supplierName?: string;
  warehouseId: string;
  warehouseName?: string;
  status: PurchaseOrderStatus;
  orderDate: string;
  expectedDate: string | null;
  notes: string | null;
  createdBy: string;
  creatorName?: string;
  orderedBy: string | null;
  orderedAt: string | null;
  cancelledBy: string | null;
  cancelledAt: string | null;
  cancelReason: string | null;
  version: number;
  totalCost?: string | null; // Omitted if no products:view_cost
  items?: PurchaseOrderItemDTO[];
  createdAt: string;
  updatedAt: string;
}

export interface GoodsReceiptDTO {
  id: string;
  receiptNumber: string;
  purchaseOrderId: string;
  poNumber?: string;
  warehouseId: string;
  warehouseName?: string;
  receivedBy: string;
  receiverName?: string;
  receivedAt: string;
  deliveryNoteRef: string | null;
  notes: string | null;
  items: Array<{
    id: string;
    purchaseOrderItemId: string;
    productId: string;
    productSku?: string;
    productName?: string;
    quantityReceived: string;
    unitCost?: string | null;
  }>;
  createdAt: string;
}

export interface AuditLogDTO {
  id: string;
  seq: number;
  actorUserId: string | null;
  actorName?: string | null;
  action: string;
  entityType: string;
  entityId: string | null;
  before: Record<string, unknown> | null;
  after: Record<string, unknown> | null;
  ip: string | null;
  userAgent: string | null;
  requestId: string | null;
  createdAt: string;
}

export interface AppSettingsDTO {
  currency_code: string;
  public_show_prices: boolean;
  public_show_availability: boolean;
  over_receipt_tolerance_percent: number;
  default_low_stock_threshold: number;
}

export interface DashboardSummaryDTO {
  metrics: {
    activeProductsCount: number;
    totalStockQuantity: string;
    inventoryValuation: string | null; // Omitted if no reports:valuation
    lowStockCount: number;
    outOfStockCount: number;
  };
  recentMovements: StockMovementDTO[];
  recentPurchases: PurchaseOrderDTO[];
  lowStockItems: Array<{
    productId: string;
    sku: string;
    name: string;
    quantityOnHand: string;
    reorderLevel: string;
    unit: string;
  }>;
  stockByCategory: Array<{
    categoryId: string;
    categoryName: string;
    itemCount: number;
    totalQuantity: string;
  }>;
  movementsPerDay: Array<{
    date: string;
    receipts: number;
    issues: number;
    adjustments: number;
  }>;
}

// Public catalog types (STRICT ALLOW-LIST)
export interface PublicCategoryDTO {
  id: string;
  name: string;
  slug: string;
  description: string | null;
  imageKey: string | null;
  productCount: number;
  children?: PublicCategoryDTO[];
}

export interface PublicProductDTO {
  slug: string;
  name: string;
  description: string | null;
  brand: string | null;
  imageKey: string | null;
  imageUrl: string | null;
  category: {
    name: string;
    slug: string;
    breadcrumb: Array<{ name: string; slug: string }>;
  };
  sku?: string;
  price?: string | null;
  currency?: string | null;
  availability?: 'IN_STOCK' | 'OUT_OF_STOCK' | null;
}

