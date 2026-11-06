import { RecordStatus, UnitOfMeasure } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { ConflictError, NotFoundError, ForbiddenError } from '../../http/errors.js';
import { writeAuditLog } from '../../lib/audit.js';

export interface ListProductsParams {
  page: number;
  pageSize: number;
  q?: string;
  categoryId?: string;
  status?: RecordStatus;
  brand?: string;
  stockState?: 'in' | 'low' | 'out';
  isPublished?: boolean;
  sort?: string;
  canViewCost: boolean;
}

export class ProductsService {
  public async listProducts(params: ListProductsParams) {
    const {
      page,
      pageSize,
      q,
      categoryId,
      status,
      brand,
      stockState,
      isPublished,
      sort,
      canViewCost,
    } = params;
    const skip = (page - 1) * pageSize;

    const where: any = {};

    if (status) {
      where.status = status;
    }

    if (isPublished !== undefined) {
      where.isPublished = isPublished;
    }

    if (brand) {
      where.brand = { equals: brand, mode: 'insensitive' };
    }

    if (categoryId) {
      // Find category and its descendants
      const allDescendants: string[] = [categoryId];
      const children = await prisma.category.findMany({
        where: { parentId: categoryId },
        select: { id: true },
      });
      for (const ch of children) {
        allDescendants.push(ch.id);
      }
      where.categoryId = { in: allDescendants };
    }

    if (q) {
      where.OR = [
        { sku: { contains: q.toUpperCase(), mode: 'insensitive' } },
        { name: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { barcode: { contains: q, mode: 'insensitive' } },
      ];
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort) {
      const [field, direction] = sort.split(':');
      const dir = direction?.toLowerCase() === 'asc' ? 'asc' : 'desc';
      if (['name', 'sku', 'sellingPrice', 'createdAt'].includes(field)) {
        orderBy = { [field]: dir };
      }
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          category: { select: { id: true, name: true, slug: true } },
          inventoryBalances: {
            include: { warehouse: { select: { id: true, code: true, name: true } } },
          },
        },
      }),
    ]);

    // Format output and handle cost masking + stockState filtering
    const formatted = products.map((p) => {
      const totalOnHand = p.inventoryBalances.reduce(
        (sum, b) => sum + Number(b.quantityOnHand),
        0
      );

      const balances = p.inventoryBalances.map((b) => ({
        warehouseId: b.warehouseId,
        warehouseCode: b.warehouse.code,
        warehouseName: b.warehouse.name,
        quantityOnHand: Number(b.quantityOnHand).toFixed(3),
      }));

      return {
        id: p.id,
        sku: p.sku,
        barcode: p.barcode,
        barcodeNormalized: p.barcodeNormalized,
        name: p.name,
        slug: p.slug,
        description: p.description,
        brand: p.brand,
        imageKey: p.imageKey,
        imageUrl: p.imageKey ? `/api/v1/public/images/${p.imageKey}` : null,
        unit: p.unit,
        costPrice: canViewCost ? Number(p.costPrice).toFixed(4) : undefined,
        averageCost: canViewCost ? Number(p.averageCost).toFixed(4) : undefined,
        sellingPrice: Number(p.sellingPrice).toFixed(2),
        categoryId: p.categoryId,
        categoryName: p.category.name,
        categorySlug: p.category.slug,
        reorderLevel: Number(p.reorderLevel).toFixed(3),
        status: p.status,
        isPublished: p.isPublished,
        archivedAt: p.archivedAt ? p.archivedAt.toISOString() : null,
        version: p.version,
        totalQuantityOnHand: totalOnHand.toFixed(3),
        balances,
        createdAt: p.createdAt.toISOString(),
        updatedAt: p.updatedAt.toISOString(),
      };
    });

    let filtered = formatted;
    if (stockState) {
      if (stockState === 'out') {
        filtered = filtered.filter((p) => Number(p.totalQuantityOnHand) <= 0);
      } else if (stockState === 'low') {
        filtered = filtered.filter(
          (p) =>
            Number(p.totalQuantityOnHand) > 0 &&
            Number(p.totalQuantityOnHand) <= Number(p.reorderLevel)
        );
      } else if (stockState === 'in') {
        filtered = filtered.filter(
          (p) => Number(p.totalQuantityOnHand) > Number(p.reorderLevel)
        );
      }
    }

    return { total, products: filtered };
  }

  public async getProductById(id: string, canViewCost: boolean, canViewBalances: boolean = true) {
    const p = await prisma.product.findUnique({
      where: { id },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        inventoryBalances: {
          include: { warehouse: { select: { id: true, code: true, name: true } } },
        },
      },
    });

    if (!p) {
      throw new NotFoundError('Product not found');
    }

    const totalOnHand = p.inventoryBalances.reduce(
      (sum, b) => sum + Number(b.quantityOnHand),
      0
    );

    return {
      id: p.id,
      sku: p.sku,
      barcode: p.barcode,
      barcodeNormalized: p.barcodeNormalized,
      name: p.name,
      slug: p.slug,
      description: p.description,
      brand: p.brand,
      imageKey: p.imageKey,
      imageUrl: p.imageKey ? `/api/v1/public/images/${p.imageKey}` : null,
      unit: p.unit,
      costPrice: canViewCost ? Number(p.costPrice).toFixed(4) : undefined,
      averageCost: canViewCost ? Number(p.averageCost).toFixed(4) : undefined,
      sellingPrice: Number(p.sellingPrice).toFixed(2),
      categoryId: p.categoryId,
      categoryName: p.category.name,
      categorySlug: p.category.slug,
      reorderLevel: Number(p.reorderLevel).toFixed(3),
      status: p.status,
      isPublished: p.isPublished,
      archivedAt: p.archivedAt ? p.archivedAt.toISOString() : null,
      version: p.version,
      totalQuantityOnHand: totalOnHand.toFixed(3),
      balances: canViewBalances
        ? p.inventoryBalances.map((b) => ({
            warehouseId: b.warehouseId,
            warehouseCode: b.warehouse.code,
            warehouseName: b.warehouse.name,
            quantityOnHand: Number(b.quantityOnHand).toFixed(3),
          }))
        : undefined,
      createdAt: p.createdAt.toISOString(),
      updatedAt: p.updatedAt.toISOString(),
    };
  }

  public async lookupProduct(code: string, canViewCost: boolean) {
    const trimmed = code.trim();
    const upperSku = trimmed.toUpperCase();

    const p = await prisma.product.findFirst({
      where: {
        OR: [{ sku: upperSku }, { barcode: trimmed }, { barcodeNormalized: trimmed }],
      },
      include: {
        category: { select: { id: true, name: true, slug: true } },
        inventoryBalances: {
          include: { warehouse: { select: { id: true, code: true, name: true } } },
        },
      },
    });

    if (!p) {
      throw new NotFoundError(`No product found with SKU or barcode '${code}'`);
    }

    const totalOnHand = p.inventoryBalances.reduce(
      (sum, b) => sum + Number(b.quantityOnHand),
      0
    );

    return {
      id: p.id,
      sku: p.sku,
      barcode: p.barcode,
      name: p.name,
      slug: p.slug,
      brand: p.brand,
      imageKey: p.imageKey,
      imageUrl: p.imageKey ? `/api/v1/public/images/${p.imageKey}` : null,
      unit: p.unit,
      costPrice: canViewCost ? Number(p.costPrice).toFixed(4) : undefined,
      sellingPrice: Number(p.sellingPrice).toFixed(2),
      categoryId: p.categoryId,
      categoryName: p.category.name,
      totalQuantityOnHand: totalOnHand.toFixed(3),
    };
  }

  public async createProduct(
    input: {
      sku: string;
      barcode?: string | null;
      name: string;
      slug: string;
      description?: string | null;
      brand?: string | null;
      unit: UnitOfMeasure;
      costPrice?: number;
      sellingPrice: number;
      categoryId: string;
      reorderLevel?: number;
      status?: RecordStatus;
      isPublished?: boolean;
    },
    actorUserId: string,
    canViewCost: boolean,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const sku = input.sku.trim().toUpperCase();
    const slug = input.slug.trim().toLowerCase();
    const barcodeNormalized = input.barcode ? input.barcode.trim() : null;

    // Check duplicate SKU
    const existingSku = await prisma.product.findUnique({ where: { sku } });
    if (existingSku) {
      throw new ConflictError(`Product with SKU '${sku}' already exists`, 'DUPLICATE_SKU');
    }

    // Check duplicate slug
    const existingSlug = await prisma.product.findUnique({ where: { slug } });
    if (existingSlug) {
      throw new ConflictError(`Product with slug '${slug}' already exists`, 'DUPLICATE_SLUG');
    }

    // Check duplicate barcode
    if (barcodeNormalized) {
      const existingBarcode = await prisma.product.findFirst({
        where: { barcodeNormalized },
      });
      if (existingBarcode) {
        throw new ConflictError(
          `Product with barcode '${barcodeNormalized}' already exists`,
          'DUPLICATE_BARCODE'
        );
      }
    }

    const costPrice = canViewCost ? input.costPrice || 0 : 0;

    const product = await prisma.product.create({
      data: {
        sku,
        barcode: input.barcode?.trim() || null,
        barcodeNormalized,
        name: input.name.trim(),
        slug,
        description: input.description?.trim() || null,
        brand: input.brand?.trim() || null,
        unit: input.unit,
        costPrice,
        averageCost: costPrice,
        sellingPrice: input.sellingPrice,
        categoryId: input.categoryId,
        reorderLevel: input.reorderLevel || 0,
        status: input.status || RecordStatus.ACTIVE,
        isPublished: input.isPublished || false,
        createdBy: actorUserId,
        updatedBy: actorUserId,
      },
    });

    await writeAuditLog({
      actorUserId,
      action: 'PRODUCT_CREATED',
      entityType: 'PRODUCT',
      entityId: product.id,
      after: product,
      ip,
      userAgent,
      requestId,
    });

    return product;
  }

  public async updateProduct(
    id: string,
    input: {
      sku?: string;
      barcode?: string | null;
      name?: string;
      slug?: string;
      description?: string | null;
      brand?: string | null;
      unit?: UnitOfMeasure;
      costPrice?: number;
      sellingPrice?: number;
      categoryId?: string;
      reorderLevel?: number;
      status?: RecordStatus;
      isPublished?: boolean;
      version?: number;
    },
    actorUserId: string,
    canViewCost: boolean,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Product not found');
    }

    // PRD-5: Optimistic locking
    if (input.version !== undefined && input.version !== existing.version) {
      throw new ConflictError(
        'Product has been modified by another request. Please refresh and try again.',
        'STALE_VERSION'
      );
    }

    // Cost fields editable only with products:view_cost
    if (input.costPrice !== undefined && !canViewCost) {
      throw new ForbiddenError('You do not have permission to view or edit product cost prices');
    }

    const sku = input.sku ? input.sku.trim().toUpperCase() : undefined;
    if (sku && sku !== existing.sku) {
      const duplicateSku = await prisma.product.findUnique({ where: { sku } });
      if (duplicateSku) {
        throw new ConflictError(`SKU '${sku}' is already in use`, 'DUPLICATE_SKU');
      }
    }

    const slug = input.slug ? input.slug.trim().toLowerCase() : undefined;
    if (slug && slug !== existing.slug) {
      const duplicateSlug = await prisma.product.findUnique({ where: { slug } });
      if (duplicateSlug) {
        throw new ConflictError(`Slug '${slug}' is already in use`, 'DUPLICATE_SLUG');
      }
    }

    const barcodeNormalized = input.barcode !== undefined ? (input.barcode ? input.barcode.trim() : null) : undefined;
    if (barcodeNormalized && barcodeNormalized !== existing.barcodeNormalized) {
      const duplicateBarcode = await prisma.product.findFirst({
        where: { barcodeNormalized },
      });
      if (duplicateBarcode) {
        throw new ConflictError(`Barcode '${barcodeNormalized}' is already in use`, 'DUPLICATE_BARCODE');
      }
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        sku,
        barcode: input.barcode !== undefined ? (input.barcode ? input.barcode.trim() : null) : undefined,
        barcodeNormalized,
        name: input.name ? input.name.trim() : undefined,
        slug,
        description: input.description !== undefined ? (input.description ? input.description.trim() : null) : undefined,
        brand: input.brand !== undefined ? (input.brand ? input.brand.trim() : null) : undefined,
        unit: input.unit !== undefined ? input.unit : undefined,
        costPrice: canViewCost && input.costPrice !== undefined ? input.costPrice : undefined,
        sellingPrice: input.sellingPrice !== undefined ? input.sellingPrice : undefined,
        categoryId: input.categoryId !== undefined ? input.categoryId : undefined,
        reorderLevel: input.reorderLevel !== undefined ? input.reorderLevel : undefined,
        status: input.status !== undefined ? input.status : undefined,
        isPublished: input.isPublished !== undefined ? input.isPublished : undefined,
        version: { increment: 1 },
        updatedBy: actorUserId,
      },
    });

    await writeAuditLog({
      actorUserId,
      action: 'PRODUCT_UPDATED',
      entityType: 'PRODUCT',
      entityId: id,
      before: existing,
      after: updated,
      ip,
      userAgent,
      requestId,
    });

    return updated;
  }

  public async archiveProduct(
    id: string,
    actorUserId?: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const existing = await prisma.product.findUnique({ where: { id } });
    if (!existing) {
      throw new NotFoundError('Product not found');
    }

    const updated = await prisma.product.update({
      where: { id },
      data: {
        status: RecordStatus.ARCHIVED,
        archivedAt: new Date(),
        updatedBy: actorUserId,
      },
    });

    await writeAuditLog({
      actorUserId,
      action: 'PRODUCT_ARCHIVED',
      entityType: 'PRODUCT',
      entityId: id,
      ip,
      userAgent,
      requestId,
    });

    return updated;
  }

  public async restoreProduct(
    id: string,
    actorUserId?: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const updated = await prisma.product.update({
      where: { id },
      data: {
        status: RecordStatus.ACTIVE,
        archivedAt: null,
        updatedBy: actorUserId,
      },
    });

    await writeAuditLog({
      actorUserId,
      action: 'PRODUCT_RESTORED',
      entityType: 'PRODUCT',
      entityId: id,
      ip,
      userAgent,
      requestId,
    });

    return updated;
  }

  public async updateProductImage(
    id: string,
    imageKey: string | null,
    actorUserId?: string,
    ip?: string,
    userAgent?: string,
    requestId?: string | number | null
  ) {
    const updated = await prisma.product.update({
      where: { id },
      data: { imageKey, updatedBy: actorUserId },
    });

    await writeAuditLog({
      actorUserId,
      action: 'PRODUCT_IMAGE_UPDATED',
      entityType: 'PRODUCT',
      entityId: id,
      after: { imageKey },
      ip,
      userAgent,
      requestId,
    });

    return updated;
  }
}

export const productsService = new ProductsService();
