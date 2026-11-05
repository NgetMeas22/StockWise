import { PublicProductDTO, PublicCategoryDTO } from '@stockwise/shared';

export function serializePublicProduct(
  product: any,
  options: {
    showPrices: boolean;
    showAvailability: boolean;
    currency: string;
  }
): PublicProductDTO {
  // Breadcrumb
  const breadcrumb: Array<{ name: string; slug: string }> = [];
  if (product.category?.parent) {
    breadcrumb.push({
      name: product.category.parent.name,
      slug: product.category.parent.slug,
    });
  }
  if (product.category) {
    breadcrumb.push({
      name: product.category.name,
      slug: product.category.slug,
    });
  }

  // Availability
  let availability: 'IN_STOCK' | 'OUT_OF_STOCK' | null = null;
  if (options.showAvailability && product.inventoryBalances) {
    const totalQty = product.inventoryBalances.reduce(
      (sum: number, b: any) => sum + Number(b.quantityOnHand),
      0
    );
    availability = totalQty > 0 ? 'IN_STOCK' : 'OUT_OF_STOCK';
  }

  // Strict allow-list
  return {
    slug: product.slug,
    name: product.name,
    description: product.description,
    brand: product.brand,
    imageKey: product.imageKey,
    imageUrl: product.imageKey ? `/api/v1/public/images/${product.imageKey}` : null,
    category: {
      name: product.category?.name || 'General',
      slug: product.category?.slug || 'general',
      breadcrumb,
    },
    sku: product.sku,
    price: options.showPrices ? Number(product.sellingPrice).toFixed(2) : null,
    currency: options.showPrices ? options.currency : null,
    availability: options.showAvailability ? availability : null,
  };
}

export function serializePublicCategory(cat: any): PublicCategoryDTO {
  return {
    id: cat.id,
    name: cat.name,
    slug: cat.slug,
    description: cat.description,
    imageKey: cat.imageKey,
    productCount: cat._count?.products || 0,
    children: cat.children?.map(serializePublicCategory),
  };
}

