import { RecordStatus } from '@prisma/client';
import { prisma } from '../../lib/prisma.js';
import { NotFoundError } from '../../http/errors.js';
import { serializePublicProduct, serializePublicCategory } from './public.serializers.js';
import { settingsService } from '../settings/settings.service.js';

export class PublicService {
  public async getCategoriesTree() {
    const categories = await prisma.category.findMany({
      where: {
        status: RecordStatus.ACTIVE,
        parentId: null,
      },
      include: {
        children: {
          where: { status: RecordStatus.ACTIVE },
          include: {
            _count: {
              select: {
                products: {
                  where: {
                    status: RecordStatus.ACTIVE,
                    isPublished: true,
                  },
                },
              },
            },
          },
        },
        _count: {
          select: {
            products: {
              where: {
                status: RecordStatus.ACTIVE,
                isPublished: true,
              },
            },
          },
        },
      },
      orderBy: { sortOrder: 'asc' },
    });

    return categories.map(serializePublicCategory);
  }

  public async getProducts(params: {
    page: number;
    pageSize: number;
    categorySlug?: string;
    brand?: string;
    q?: string;
    sort?: string;
    minPrice?: number;
    maxPrice?: number;
  }) {
    const { page, pageSize, categorySlug, brand, q, sort, minPrice, maxPrice } = params;
    const skip = (page - 1) * pageSize;

    const settings = await settingsService.getSettings();
    const showPrices = Boolean(settings.public_show_prices);
    const showAvailability = Boolean(settings.public_show_availability);
    const currency = String(settings.currency_code || 'USD');

    const where: any = {
      status: RecordStatus.ACTIVE,
      isPublished: true,
    };

    if (categorySlug) {
      const category = await prisma.category.findUnique({
        where: { slug: categorySlug },
        include: { children: { select: { id: true } } },
      });

      if (category) {
        const catIds = [category.id, ...category.children.map((c) => c.id)];
        where.categoryId = { in: catIds };
      }
    }

    if (brand) {
      where.brand = { equals: brand, mode: 'insensitive' };
    }

    if (q) {
      where.OR = [
        { name: { contains: q, mode: 'insensitive' } },
        { description: { contains: q, mode: 'insensitive' } },
        { brand: { contains: q, mode: 'insensitive' } },
        { sku: { contains: q.toUpperCase(), mode: 'insensitive' } },
      ];
    }

    if (showPrices && (minPrice !== undefined || maxPrice !== undefined)) {
      where.sellingPrice = {};
      if (minPrice !== undefined) where.sellingPrice.gte = minPrice;
      if (maxPrice !== undefined) where.sellingPrice.lte = maxPrice;
    }

    let orderBy: any = { createdAt: 'desc' };
    if (sort) {
      if (sort === 'name:asc') orderBy = { name: 'asc' };
      else if (sort === 'name:desc') orderBy = { name: 'desc' };
      else if (sort === 'price:asc' && showPrices) orderBy = { sellingPrice: 'asc' };
      else if (sort === 'price:desc' && showPrices) orderBy = { sellingPrice: 'desc' };
      else if (sort === 'newest') orderBy = { createdAt: 'desc' };
    }

    const [total, products] = await Promise.all([
      prisma.product.count({ where }),
      prisma.product.findMany({
        where,
        skip,
        take: pageSize,
        orderBy,
        include: {
          category: {
            include: { parent: true },
          },
          inventoryBalances: showAvailability
            ? { select: { quantityOnHand: true } }
            : false,
        },
      }),
    ]);

    const serialized = products.map((p) =>
      serializePublicProduct(p, { showPrices, showAvailability, currency })
    );

    return { total, products: serialized };
  }

  public async getProductBySlug(slug: string) {
    const settings = await settingsService.getSettings();
    const showPrices = Boolean(settings.public_show_prices);
    const showAvailability = Boolean(settings.public_show_availability);
    const currency = String(settings.currency_code || 'USD');

    const product = await prisma.product.findFirst({
      where: {
        slug: slug.toLowerCase().trim(),
        status: RecordStatus.ACTIVE,
        isPublished: true,
      },
      include: {
        category: {
          include: { parent: true },
        },
        inventoryBalances: showAvailability
          ? { select: { quantityOnHand: true } }
          : false,
      },
    });

    if (!product) {
      throw new NotFoundError('Product not found in public catalog');
    }

    return serializePublicProduct(product, { showPrices, showAvailability, currency });
  }

  public async getBrands() {
    const brands = await prisma.product.findMany({
      where: {
        status: RecordStatus.ACTIVE,
        isPublished: true,
        brand: { not: null },
      },
      select: { brand: true },
      distinct: ['brand'],
    });

    return brands.map((b) => b.brand).filter(Boolean) as string[];
  }
}

export const publicService = new PublicService();

