import { z } from 'zod';
import {
  MovementType,
  PurchaseOrderStatus,
  ReasonCode,
  RecordStatus,
  SupplierStatus,
  UnitOfMeasure,
} from './enums.js';
import { PERMISSION_KEYS, ROLE_KEYS } from './permissions.js';

// Common pagination and query params
export const paginationQuerySchema = z.object({
  page: z.coerce.number().int().min(1).default(1),
  pageSize: z.coerce.number().int().min(1).max(100).default(25),
  q: z.string().trim().optional(),
  sort: z.string().trim().optional(),
});

// Auth Schemas
export const loginSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  password: z.string().min(1, 'Password is required'),
});

export const forgotPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
});

export const resetPasswordSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  code: z.string().trim().min(6, 'Verification code must be 6 digits').max(6, 'Verification code must be 6 digits'),
  newPassword: z
    .string()
    .min(10, 'Password must be at least 10 characters long')
    .regex(/[A-Za-z]/, 'Password must contain letters')
    .regex(/[0-9]/, 'Password must contain numbers'),
});

export const changePasswordSchema = z.object({
  currentPassword: z.string().min(1, 'Current password is required'),
  newPassword: z
    .string()
    .min(12, 'Password must be at least 12 characters long')
    .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
    .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
    .regex(/[0-9]/, 'Password must contain at least one number')
    .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character'),
});

// Users
export const createUserSchema = z.object({
  email: z.string().trim().toLowerCase().email('Invalid email address'),
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters'),
  roleKey: z.enum(ROLE_KEYS),
});

export const updateUserSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').optional(),
  roleKey: z.enum(ROLE_KEYS).optional(),
});

export const updateProfileSchema = z.object({
  fullName: z.string().trim().min(2, 'Full name must be at least 2 characters').max(100).optional(),
  email: z.string().trim().toLowerCase().email('Invalid email address').optional(),
  phone: z.string().trim().max(30).nullable().optional(),
});

export type UpdateProfileInput = z.infer<typeof updateProfileSchema>;

// Roles
export const updateRolePermissionsSchema = z.object({
  permissions: z.array(z.enum(PERMISSION_KEYS)),
});

// Categories
export const createCategorySchema = z.object({
  parentId: z.string().uuid().nullable().optional().or(z.literal('')).transform((v) => v || null),
  name: z.string().trim().min(1, 'Category name is required').max(100),
  slug: z
    .string()
    .trim()
    .min(1, 'Slug is required')
    .max(100)
    .transform((val) =>
      val
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '')
    )
    .refine((val) => val.length >= 1, {
      message: 'Slug must consist of lowercase letters, numbers, and hyphens',
    }),
  description: z.string().trim().max(1000).nullable().optional().or(z.literal('')).transform((v) => v || null),
  sortOrder: z.coerce.number().int().default(0),
  status: z.enum([RecordStatus.ACTIVE, RecordStatus.ARCHIVED]).default(RecordStatus.ACTIVE),
});

export const updateCategorySchema = createCategorySchema.partial();

// Warehouses
export const createWarehouseSchema = z.object({
  code: z
    .string()
    .trim()
    .min(2)
    .max(20)
    .toUpperCase(),
  name: z.string().trim().min(2).max(100),
  address: z.string().trim().max(500).nullable().optional(),
  isDefault: z.boolean().default(false),
  status: z.enum([RecordStatus.ACTIVE, RecordStatus.ARCHIVED]).default(RecordStatus.ACTIVE),
});

export const updateWarehouseSchema = createWarehouseSchema.partial();

// Products
export const createProductSchema = z.object({
  sku: z
    .string()
    .trim()
    .min(2, 'SKU must be at least 2 characters')
    .max(50)
    .transform((val) => val.toUpperCase().replace(/\s+/g, '-')),
  barcode: z.string().trim().max(50).nullable().optional().or(z.literal('')).transform((v) => v || null),
  name: z.string().trim().min(2, 'Product name must be at least 2 characters').max(200),
  slug: z
    .string()
    .trim()
    .min(2, 'Slug must be at least 2 characters')
    .max(200)
    .transform((val) =>
      val
        .toLowerCase()
        .replace(/[^a-z0-9-]+/g, '-')
        .replace(/--+/g, '-')
        .replace(/^-+|-+$/g, '')
    )
    .refine((val) => val.length >= 2, {
      message: 'Slug must contain only lowercase letters, numbers, and hyphens',
    }),
  description: z.string().trim().max(5000).nullable().optional().or(z.literal('')).transform((v) => v || null),
  brand: z.string().trim().max(100).nullable().optional().or(z.literal('')).transform((v) => v || null),
  unit: z.enum([
    UnitOfMeasure.EACH,
    UnitOfMeasure.BOX,
    UnitOfMeasure.PACK,
    UnitOfMeasure.KG,
    UnitOfMeasure.G,
    UnitOfMeasure.L,
    UnitOfMeasure.ML,
    UnitOfMeasure.M,
  ]),
  costPrice: z.coerce.number().min(0, 'Cost price cannot be negative').default(0),
  sellingPrice: z.coerce.number().min(0, 'Selling price cannot be negative').default(0),
  categoryId: z.string().uuid('Invalid category ID'),
  reorderLevel: z.coerce.number().min(0, 'Reorder level cannot be negative').default(0),
  status: z.enum([RecordStatus.ACTIVE, RecordStatus.ARCHIVED]).default(RecordStatus.ACTIVE),
  isPublished: z.boolean().default(false),
  imageUrl: z.string().url().nullable().optional().or(z.literal('')).transform((v) => v || null),
});

export const updateProductSchema = createProductSchema.partial().extend({
  version: z.number().int().optional(),
});

// Suppliers
export const createSupplierSchema = z.object({
  name: z.string().trim().min(2, 'Supplier name is required').max(150),
  contactPerson: z.string().trim().max(100).nullable().optional(),
  email: z.string().trim().toLowerCase().email().nullable().optional().or(z.literal('')),
  phone: z.string().trim().max(50).nullable().optional(),
  address: z.string().trim().max(500).nullable().optional(),
  notes: z.string().trim().max(2000).nullable().optional(),
  status: z.enum([SupplierStatus.ACTIVE, SupplierStatus.INACTIVE]).default(SupplierStatus.ACTIVE),
});

export const updateSupplierSchema = createSupplierSchema.partial();

// Inventory operations
export const stockReceiptSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  unitCost: z.coerce.number().min(0).optional(),
  reasonCode: z.enum([
    ReasonCode.DIRECT_PURCHASE,
    ReasonCode.CUSTOMER_RETURN,
    ReasonCode.OTHER,
  ]),
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters'),
  notes: z.string().trim().max(1000).optional(),
});

export const stockIssueSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  reasonCode: z.enum([
    ReasonCode.USAGE,
    ReasonCode.SUPPLIER_RETURN,
    ReasonCode.DAMAGED,
    ReasonCode.OTHER,
  ]),
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters'),
  notes: z.string().trim().max(1000).optional(),
});

export const stockAdjustmentSchema = z.object({
  productId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  newQuantity: z.coerce.number().min(0).optional(),
  delta: z.coerce.number().optional(),
  reason: z.string().trim().min(3, 'Reason must be at least 3 characters'),
  notes: z.string().trim().max(1000).optional(),
}).refine(
  (data) => (data.newQuantity !== undefined && data.delta === undefined) || (data.newQuantity === undefined && data.delta !== undefined && data.delta !== 0),
  { message: 'Provide either newQuantity or non-zero delta, but not both' }
);

export const stockTransferSchema = z.object({
  productId: z.string().uuid(),
  fromWarehouseId: z.string().uuid(),
  toWarehouseId: z.string().uuid(),
  quantity: z.coerce.number().positive('Quantity must be greater than 0'),
  notes: z.string().trim().max(1000).optional(),
}).refine((data) => data.fromWarehouseId !== data.toWarehouseId, {
  message: 'Source and destination warehouses must be different',
});

export const stockReversalSchema = z.object({
  reason: z.string().trim().min(3, 'Reversal reason must be at least 3 characters'),
});

// Purchasing
export const purchaseOrderItemSchema = z.object({
  productId: z.string().uuid(),
  quantityOrdered: z.coerce.number().positive('Ordered quantity must be greater than 0'),
  unitCost: z.coerce.number().min(0, 'Unit cost must not be negative'),
});

export const createPurchaseOrderSchema = z.object({
  supplierId: z.string().uuid(),
  warehouseId: z.string().uuid(),
  orderDate: z.string().datetime().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/)),
  expectedDate: z.string().datetime().nullable().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).nullable()),
  notes: z.string().trim().max(2000).nullable().optional(),
  items: z.array(purchaseOrderItemSchema).min(1, 'Purchase order must have at least one line item'),
});

export const updatePurchaseOrderSchema = z.object({
  supplierId: z.string().uuid().optional(),
  warehouseId: z.string().uuid().optional(),
  expectedDate: z.string().datetime().nullable().optional().or(z.string().regex(/^\d{4}-\d{2}-\d{2}/).nullable()),
  notes: z.string().trim().max(2000).nullable().optional(),
  items: z.array(purchaseOrderItemSchema).min(1).optional(),
  version: z.number().int().optional(),
});

export const cancelPurchaseOrderSchema = z.object({
  reason: z.string().trim().min(3, 'Cancellation reason must be at least 3 characters'),
});

export const goodsReceiptLineSchema = z.object({
  purchaseOrderItemId: z.string().uuid(),
  quantityReceived: z.coerce.number().positive('Received quantity must be greater than 0'),
  unitCost: z.coerce.number().min(0).optional(),
});

export const receivePurchaseOrderSchema = z.object({
  warehouseId: z.string().uuid().optional(),
  deliveryNoteRef: z.string().trim().max(100).nullable().optional(),
  notes: z.string().trim().max(1000).nullable().optional(),
  lines: z.array(goodsReceiptLineSchema).min(1, 'At least one line item must be received'),
});

// App Settings
export const updateSettingsSchema = z.object({
  currency_code: z.string().trim().length(3).toUpperCase().optional(),
  public_show_prices: z.boolean().optional(),
  public_show_availability: z.boolean().optional(),
  over_receipt_tolerance_percent: z.coerce.number().min(0).max(100).optional(),
  default_low_stock_threshold: z.coerce.number().min(0).optional(),
});

