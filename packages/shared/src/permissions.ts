export const PERMISSION_KEYS = [
  // Products
  'products:read',
  'products:create',
  'products:update',
  'products:archive',
  'products:view_cost',

  // Categories
  'categories:read',
  'categories:manage',

  // Inventory
  'inventory:read',
  'inventory:receive',
  'inventory:issue',
  'inventory:adjust',
  'inventory:transfer',

  // Suppliers
  'suppliers:read',
  'suppliers:manage',

  // Purchases
  'purchases:read',
  'purchases:manage',
  'purchases:receive',
  'purchases:cancel',

  // Reports
  'reports:read',
  'reports:export',
  'reports:valuation',

  // Administration
  'users:read',
  'users:manage',
  'roles:manage',
  'audit_logs:read',
  'settings:manage',
] as const;

export type PermissionKey = (typeof PERMISSION_KEYS)[number];

export interface PermissionDefinition {
  key: PermissionKey;
  group: string;
  name: string;
  description: string;
}

export const PERMISSION_REGISTRY: Record<PermissionKey, PermissionDefinition> = {
  'products:read': {
    key: 'products:read',
    group: 'Products',
    name: 'View Products',
    description: 'View products and their details',
  },
  'products:create': {
    key: 'products:create',
    group: 'Products',
    name: 'Create Products',
    description: 'Create new products',
  },
  'products:update': {
    key: 'products:update',
    group: 'Products',
    name: 'Update Products',
    description: 'Edit product details and upload product images',
  },
  'products:archive': {
    key: 'products:archive',
    group: 'Products',
    name: 'Archive Products',
    description: 'Archive and restore products',
  },
  'products:view_cost': {
    key: 'products:view_cost',
    group: 'Products',
    name: 'View Cost Details',
    description: 'View cost prices, average costs, unit costs, and cost-derived totals',
  },
  'categories:read': {
    key: 'categories:read',
    group: 'Categories',
    name: 'View Categories',
    description: 'View product category hierarchy',
  },
  'categories:manage': {
    key: 'categories:manage',
    group: 'Categories',
    name: 'Manage Categories',
    description: 'Create, update, and archive categories',
  },
  'inventory:read': {
    key: 'inventory:read',
    group: 'Inventory',
    name: 'View Inventory',
    description: 'View inventory balances, stock movements, and warehouses',
  },
  'inventory:receive': {
    key: 'inventory:receive',
    group: 'Inventory',
    name: 'Receive Stock',
    description: 'Direct stock receipts outside purchase orders',
  },
  'inventory:issue': {
    key: 'inventory:issue',
    group: 'Inventory',
    name: 'Issue Stock',
    description: 'Issue or deduct stock for usage or supplier returns',
  },
  'inventory:adjust': {
    key: 'inventory:adjust',
    group: 'Inventory',
    name: 'Adjust Stock',
    description: 'Perform stock adjustments and reverse previous movements',
  },
  'inventory:transfer': {
    key: 'inventory:transfer',
    group: 'Inventory',
    name: 'Transfer Stock',
    description: 'Transfer stock between warehouses',
  },
  'suppliers:read': {
    key: 'suppliers:read',
    group: 'Suppliers',
    name: 'View Suppliers',
    description: 'View supplier list and details',
  },
  'suppliers:manage': {
    key: 'suppliers:manage',
    group: 'Suppliers',
    name: 'Manage Suppliers',
    description: 'Create, update, and deactivate suppliers',
  },
  'purchases:read': {
    key: 'purchases:read',
    group: 'Purchases',
    name: 'View Purchases',
    description: 'View purchase orders and goods receipt notes',
  },
  'purchases:manage': {
    key: 'purchases:manage',
    group: 'Purchases',
    name: 'Manage Purchases',
    description: 'Create, edit, and submit draft purchase orders',
  },
  'purchases:receive': {
    key: 'purchases:receive',
    group: 'Purchases',
    name: 'Receive Goods',
    description: 'Process goods receipts against purchase orders',
  },
  'purchases:cancel': {
    key: 'purchases:cancel',
    group: 'Purchases',
    name: 'Cancel Purchases',
    description: 'Cancel draft, ordered, or partially received purchase orders',
  },
  'reports:read': {
    key: 'reports:read',
    group: 'Reports',
    name: 'View Reports',
    description: 'View dashboard metrics and operational inventory reports',
  },
  'reports:export': {
    key: 'reports:export',
    group: 'Reports',
    name: 'Export CSV',
    description: 'Export reports to CSV files',
  },
  'reports:valuation': {
    key: 'reports:valuation',
    group: 'Reports',
    name: 'View Valuation',
    description: 'View inventory valuation report and monetary figures',
  },
  'users:read': {
    key: 'users:read',
    group: 'Administration',
    name: 'View Users & Roles',
    description: 'View users, roles, and the permission matrix',
  },
  'users:manage': {
    key: 'users:manage',
    group: 'Administration',
    name: 'Manage Users',
    description: 'Create, edit, activate, deactivate users and reset passwords',
  },
  'roles:manage': {
    key: 'roles:manage',
    group: 'Administration',
    name: 'Manage Roles',
    description: 'Edit role permissions for non-admin roles',
  },
  'audit_logs:read': {
    key: 'audit_logs:read',
    group: 'Administration',
    name: 'View Audit Logs',
    description: 'Inspect system and inventory audit trails',
  },
  'settings:manage': {
    key: 'settings:manage',
    group: 'Administration',
    name: 'Manage Settings',
    description: 'Update application settings and warehouse master data',
  },
};

export const ROLE_KEYS = ['ADMIN', 'MANAGER', 'INVENTORY_STAFF', 'VIEWER'] as const;
export type RoleKey = (typeof ROLE_KEYS)[number];

export const DEFAULT_ROLE_PERMISSIONS: Record<RoleKey, PermissionKey[]> = {
  ADMIN: [...PERMISSION_KEYS],
  MANAGER: [
    'products:read',
    'products:create',
    'products:update',
    'products:archive',
    'products:view_cost',
    'categories:read',
    'categories:manage',
    'inventory:read',
    'inventory:receive',
    'inventory:issue',
    'inventory:adjust',
    'inventory:transfer',
    'suppliers:read',
    'suppliers:manage',
    'purchases:read',
    'purchases:manage',
    'purchases:receive',
    'purchases:cancel',
    'reports:read',
    'reports:export',
    'reports:valuation',
  ],
  INVENTORY_STAFF: [
    'products:read',
    'categories:read',
    'inventory:read',
    'inventory:receive',
    'inventory:issue',
    'inventory:transfer',
    'purchases:read',
    'purchases:receive',
    'reports:read',
  ],
  VIEWER: [
    'products:read',
    'categories:read',
    'inventory:read',
    'reports:read',
  ],
};

export function hasPermission(userPermissions: PermissionKey[], required: PermissionKey | PermissionKey[]): boolean {
  if (Array.isArray(required)) {
    return required.every((key) => userPermissions.includes(key));
  }
  return userPermissions.includes(required);
}

