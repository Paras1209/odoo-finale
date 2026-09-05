// ===========================================
// DealFlow360 - Catalog Service
// ===========================================
// DEV B's MODULE: Product and pricing business logic
// Follows implementation plan: M1 — Catalog & Pricing
// ===========================================

import { Prisma } from '@prisma/client';
import { prisma } from '@/lib/db';
import { ProductCategory, CustomerTier } from '@/lib/types';

// ===========================================
// TYPES
// ===========================================

export interface ProductFilters {
  category?: ProductCategory;
  isActive?: boolean;
  search?: string;
}

export interface PaginationOptions {
  page?: number;
  pageSize?: number;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface CreateProductInput {
  name: string;
  sku?: string;
  category: ProductCategory;
  costPrice: number;
  salePrice: number;
  unit?: string;
  taxPct?: number;
  description?: string;
}

export interface UpdateProductInput {
  name?: string;
  sku?: string;
  category?: ProductCategory;
  costPrice?: number;
  salePrice?: number;
  unit?: string;
  taxPct?: number;
  description?: string;
  isActive?: boolean;
}

export interface CreateVariantInput {
  attribute: string;
  value: string;
  extraPrice?: number;
}

export interface UpdateVariantInput {
  attribute?: string;
  value?: string;
  extraPrice?: number;
}

export interface PriceListFilters {
  customerTier?: CustomerTier;
  isActive?: boolean;
}

export interface CreatePriceListInput {
  name: string;
  customerTier?: CustomerTier;
  currency?: string;
  isDefault?: boolean;
  validFrom?: Date;
  validTo?: Date;
}

export interface UpdatePriceListInput {
  name?: string;
  customerTier?: CustomerTier | null;
  currency?: string;
  isDefault?: boolean;
  validFrom?: Date | null;
  validTo?: Date | null;
  isActive?: boolean;
}

export interface PriceListItemInput {
  productId: string;
  price: number;
}

// ===========================================
// PAGINATION HELPERS
// ===========================================

function getPaginationParams(page: number = 1, pageSize: number = 20) {
  const skip = (page - 1) * pageSize;
  const take = pageSize;
  return { skip, take };
}

function getPaginationMeta(totalItems: number, page: number, pageSize: number) {
  return {
    page,
    pageSize,
    totalItems,
    totalPages: Math.ceil(totalItems / pageSize),
  };
}

// ===========================================
// PRODUCT FUNCTIONS
// ===========================================

/**
 * Get paginated list of products with filtering
 * Supports search by name/SKU, category filter, active status filter
 */
export async function getProducts(
  filters: ProductFilters = {},
  pagination: PaginationOptions = {}
) {
  const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
  const { skip, take } = getPaginationParams(page, pageSize);

  // Build where clause
  const where: Prisma.ProductWhereInput = {};

  if (filters.category) {
    where.category = filters.category;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  if (filters.search) {
    where.OR = [
      { name: { contains: filters.search, mode: 'insensitive' } },
      { sku: { contains: filters.search, mode: 'insensitive' } },
    ];
  }

  // Build orderBy - allowed fields for sorting
  const allowedSortFields = ['name', 'salePrice', 'createdAt', 'updatedAt', 'category'];
  const orderByField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const orderBy = { [orderByField]: sortOrder };

  // Execute queries in parallel for performance
  const [products, totalItems] = await Promise.all([
    prisma.product.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        _count: {
          select: { variants: true, stockLevels: true },
        },
      },
    }),
    prisma.product.count({ where }),
  ]);

  return {
    data: products,
    pagination: getPaginationMeta(totalItems, page, pageSize),
  };
}

/**
 * Get a single product by ID with all related data
 * Includes variants, stock levels, and subscription plan if exists
 */
export async function getProductById(id: string) {
  return prisma.product.findUnique({
    where: { id },
    include: {
      variants: {
        orderBy: { attribute: 'asc' },
      },
      stockLevels: {
        include: {
          warehouse: {
            select: { id: true, name: true, code: true, isActive: true },
          },
        },
        where: {
          warehouse: { isActive: true },
        },
      },
      subscriptionPlan: true,
      priceListItems: {
        include: {
          priceList: {
            select: { id: true, name: true, customerTier: true, isDefault: true },
          },
        },
      },
    },
  });
}

/**
 * Create a new product
 * Important: Store costPrice alongside salePrice for margin calculations (M2)
 */
export async function createProduct(input: CreateProductInput) {
  // Check SKU uniqueness if provided
  if (input.sku) {
    const existing = await prisma.product.findUnique({ where: { sku: input.sku } });
    if (existing) {
      throw new Error(`SKU "${input.sku}" already exists`);
    }
  }

  return prisma.product.create({
    data: {
      name: input.name,
      sku: input.sku || null,
      category: input.category,
      costPrice: input.costPrice,
      salePrice: input.salePrice,
      unit: input.unit || 'unit',
      taxPct: input.taxPct ?? 0,
      description: input.description || null,
      isActive: true,
    },
  });
}

/**
 * Update an existing product
 * Returns null if product not found
 */
export async function updateProduct(id: string, input: UpdateProductInput) {
  // First check if product exists
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  // Check SKU uniqueness if changing
  if (input.sku && input.sku !== existing.sku) {
    const skuExists = await prisma.product.findFirst({
      where: { sku: input.sku, id: { not: id } },
    });
    if (skuExists) {
      throw new Error(`SKU "${input.sku}" already exists`);
    }
  }

  // Build update data only for provided fields
  const updateData: Prisma.ProductUpdateInput = {};
  
  if (input.name !== undefined) updateData.name = input.name;
  if (input.sku !== undefined) updateData.sku = input.sku || null;
  if (input.category !== undefined) updateData.category = input.category;
  if (input.costPrice !== undefined) updateData.costPrice = input.costPrice;
  if (input.salePrice !== undefined) updateData.salePrice = input.salePrice;
  if (input.unit !== undefined) updateData.unit = input.unit;
  if (input.taxPct !== undefined) updateData.taxPct = input.taxPct;
  if (input.description !== undefined) updateData.description = input.description || null;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  return prisma.product.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Soft delete a product (sets isActive = false)
 * Per implementation plan: Products cannot be hard-deleted to preserve referential integrity
 */
export async function deleteProduct(id: string) {
  const existing = await prisma.product.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  return prisma.product.update({
    where: { id },
    data: { isActive: false },
  });
}

// ===========================================
// VARIANT FUNCTIONS
// ===========================================

/**
 * Get all variants for a product
 */
export async function getProductVariants(productId: string) {
  // First verify product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return null;
  }

  return prisma.productVariant.findMany({
    where: { productId },
    orderBy: [{ attribute: 'asc' }, { value: 'asc' }],
  });
}

/**
 * Create a new variant for a product
 * Returns null if product doesn't exist
 */
export async function createVariant(productId: string, input: CreateVariantInput) {
  // Verify product exists
  const product = await prisma.product.findUnique({ where: { id: productId } });
  if (!product) {
    return null;
  }

  return prisma.productVariant.create({
    data: {
      productId,
      attribute: input.attribute,
      value: input.value,
      extraPrice: input.extraPrice ?? 0,
    },
  });
}

/**
 * Update a variant
 * Returns null if variant doesn't exist or doesn't belong to product
 */
export async function updateVariant(
  productId: string,
  variantId: string,
  input: UpdateVariantInput
) {
  // Verify variant exists and belongs to product
  const existing = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
  });
  if (!existing) {
    return null;
  }

  const updateData: Prisma.ProductVariantUpdateInput = {};
  
  if (input.attribute !== undefined) updateData.attribute = input.attribute;
  if (input.value !== undefined) updateData.value = input.value;
  if (input.extraPrice !== undefined) updateData.extraPrice = input.extraPrice;

  return prisma.productVariant.update({
    where: { id: variantId },
    data: updateData,
  });
}

/**
 * Delete a variant (hard delete - cascade is enabled in schema)
 * Returns null if variant doesn't exist or doesn't belong to product
 */
export async function deleteVariant(productId: string, variantId: string) {
  // Verify variant exists and belongs to product
  const existing = await prisma.productVariant.findFirst({
    where: { id: variantId, productId },
  });
  if (!existing) {
    return null;
  }

  return prisma.productVariant.delete({
    where: { id: variantId },
  });
}

// ===========================================
// PRICE LIST FUNCTIONS
// ===========================================

/**
 * Get paginated list of price lists with filtering
 */
export async function getPriceLists(
  filters: PriceListFilters = {},
  pagination: PaginationOptions = {}
) {
  const { page = 1, pageSize = 20, sortBy = 'createdAt', sortOrder = 'desc' } = pagination;
  const { skip, take } = getPaginationParams(page, pageSize);

  const where: Prisma.PriceListWhereInput = {};

  if (filters.customerTier) {
    where.customerTier = filters.customerTier;
  }

  if (filters.isActive !== undefined) {
    where.isActive = filters.isActive;
  }

  const allowedSortFields = ['name', 'createdAt', 'customerTier'];
  const orderByField = allowedSortFields.includes(sortBy) ? sortBy : 'createdAt';
  const orderBy = { [orderByField]: sortOrder };

  const [priceLists, totalItems] = await Promise.all([
    prisma.priceList.findMany({
      where,
      skip,
      take,
      orderBy,
      include: {
        _count: { select: { items: true } },
      },
    }),
    prisma.priceList.count({ where }),
  ]);

  return {
    data: priceLists,
    pagination: getPaginationMeta(totalItems, page, pageSize),
  };
}

/**
 * Get a single price list with all items and product info
 */
export async function getPriceListById(id: string) {
  return prisma.priceList.findUnique({
    where: { id },
    include: {
      items: {
        include: {
          product: {
            select: {
              id: true,
              name: true,
              sku: true,
              category: true,
              salePrice: true,
              isActive: true,
            },
          },
        },
        orderBy: {
          product: { name: 'asc' },
        },
      },
    },
  });
}

/**
 * Create a new price list
 * If setting as default, automatically unsets any existing default
 */
export async function createPriceList(input: CreatePriceListInput) {
  // If setting as default, unset any existing default first
  if (input.isDefault) {
    await prisma.priceList.updateMany({
      where: { isDefault: true },
      data: { isDefault: false },
    });
  }

  return prisma.priceList.create({
    data: {
      name: input.name,
      customerTier: input.customerTier || null,
      currency: input.currency || 'USD',
      isDefault: input.isDefault ?? false,
      validFrom: input.validFrom || null,
      validTo: input.validTo || null,
      isActive: true,
    },
  });
}

/**
 * Update a price list
 * If setting as default, automatically unsets any existing default
 */
export async function updatePriceList(id: string, input: UpdatePriceListInput) {
  const existing = await prisma.priceList.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  // If setting as default, unset any existing default first (except this one)
  if (input.isDefault === true && !existing.isDefault) {
    await prisma.priceList.updateMany({
      where: { isDefault: true, id: { not: id } },
      data: { isDefault: false },
    });
  }

  const updateData: Prisma.PriceListUpdateInput = {};
  
  if (input.name !== undefined) updateData.name = input.name;
  if (input.customerTier !== undefined) updateData.customerTier = input.customerTier;
  if (input.currency !== undefined) updateData.currency = input.currency;
  if (input.isDefault !== undefined) updateData.isDefault = input.isDefault;
  if (input.validFrom !== undefined) updateData.validFrom = input.validFrom;
  if (input.validTo !== undefined) updateData.validTo = input.validTo;
  if (input.isActive !== undefined) updateData.isActive = input.isActive;

  return prisma.priceList.update({
    where: { id },
    data: updateData,
  });
}

/**
 * Soft delete a price list
 */
export async function deletePriceList(id: string) {
  const existing = await prisma.priceList.findUnique({ where: { id } });
  if (!existing) {
    return null;
  }

  return prisma.priceList.update({
    where: { id },
    data: { isActive: false },
  });
}

/**
 * Upsert price list items (create or update)
 * Uses upsert for idempotent operations
 */
export async function upsertPriceListItems(priceListId: string, items: PriceListItemInput[]) {
  // Verify price list exists
  const priceList = await prisma.priceList.findUnique({ where: { id: priceListId } });
  if (!priceList) {
    return null;
  }

  // Verify all products exist
  const productIds = items.map(item => item.productId);
  const existingProducts = await prisma.product.findMany({
    where: { id: { in: productIds } },
    select: { id: true },
  });
  
  const existingProductIds = new Set(existingProducts.map(p => p.id));
  const invalidProductIds = productIds.filter(id => !existingProductIds.has(id));
  
  if (invalidProductIds.length > 0) {
    throw new Error(`Products not found: ${invalidProductIds.join(', ')}`);
  }

  // Upsert each item
  const results = await Promise.all(
    items.map((item) =>
      prisma.priceListItem.upsert({
        where: {
          priceListId_productId: {
            priceListId,
            productId: item.productId,
          },
        },
        create: {
          priceListId,
          productId: item.productId,
          price: item.price,
        },
        update: {
          price: item.price,
        },
        include: {
          product: {
            select: { id: true, name: true, sku: true, category: true },
          },
        },
      })
    )
  );

  return results;
}

/**
 * Delete a price list item
 */
export async function deletePriceListItem(priceListId: string, productId: string) {
  const existing = await prisma.priceListItem.findUnique({
    where: {
      priceListId_productId: { priceListId, productId },
    },
  });
  if (!existing) {
    return null;
  }

  return prisma.priceListItem.delete({
    where: { id: existing.id },
  });
}

// ===========================================
// PRICE RESOLUTION (Used by Quotation module - M2)
// ===========================================

/**
 * Get the effective price for a product based on customer tier
 * 
 * Priority (per implementation plan):
 * 1. Tier-specific price list (if customer tier provided and valid)
 * 2. Default price list
 * 3. Product base sale price
 * 
 * This function is called by Dev A's quotation module to determine line prices
 */
export async function getProductPrice(
  productId: string,
  customerTier?: CustomerTier
): Promise<number | null> {
  const product = await prisma.product.findUnique({
    where: { id: productId },
    select: { salePrice: true, isActive: true },
  });

  if (!product || !product.isActive) {
    return null;
  }

  const now = new Date();

  // Try tier-specific price list first
  if (customerTier) {
    const tierPriceItem = await prisma.priceListItem.findFirst({
      where: {
        productId,
        priceList: {
          customerTier,
          isActive: true,
          OR: [
            // No validity period set
            { validFrom: null, validTo: null },
            // Only validFrom set and it's in the past
            { validFrom: { lte: now }, validTo: null },
            // Only validTo set and it's in the future
            { validFrom: null, validTo: { gte: now } },
            // Both set and we're within range
            { validFrom: { lte: now }, validTo: { gte: now } },
          ],
        },
      },
      select: { price: true },
      orderBy: {
        priceList: { createdAt: 'desc' }, // Prefer newer price lists
      },
    });

    if (tierPriceItem) {
      return tierPriceItem.price.toNumber();
    }
  }

  // Try default price list
  const defaultPriceItem = await prisma.priceListItem.findFirst({
    where: {
      productId,
      priceList: {
        isDefault: true,
        isActive: true,
      },
    },
    select: { price: true },
  });

  if (defaultPriceItem) {
    return defaultPriceItem.price.toNumber();
  }

  // Fall back to product base sale price
  return product.salePrice.toNumber();
}

/**
 * Get prices for multiple products at once (batch operation for quotation builder)
 * More efficient than calling getProductPrice multiple times
 */
export async function getProductPrices(
  productIds: string[],
  customerTier?: CustomerTier
): Promise<Map<string, number>> {
  const result = new Map<string, number>();
  
  if (productIds.length === 0) {
    return result;
  }

  // Get all products
  const products = await prisma.product.findMany({
    where: { 
      id: { in: productIds },
      isActive: true,
    },
    select: { id: true, salePrice: true },
  });

  // Set base prices
  for (const product of products) {
    result.set(product.id, product.salePrice.toNumber());
  }

  const now = new Date();

  // Try to get tier-specific prices
  if (customerTier) {
    const tierPrices = await prisma.priceListItem.findMany({
      where: {
        productId: { in: productIds },
        priceList: {
          customerTier,
          isActive: true,
          OR: [
            { validFrom: null, validTo: null },
            { validFrom: { lte: now }, validTo: null },
            { validFrom: null, validTo: { gte: now } },
            { validFrom: { lte: now }, validTo: { gte: now } },
          ],
        },
      },
      select: { productId: true, price: true },
    });

    for (const item of tierPrices) {
      result.set(item.productId, item.price.toNumber());
    }
  }

  // Get default price list prices for products without tier prices
  const productsWithTierPrices = new Set(
    customerTier 
      ? (await prisma.priceListItem.findMany({
          where: {
            productId: { in: productIds },
            priceList: { customerTier, isActive: true },
          },
          select: { productId: true },
        })).map(p => p.productId)
      : []
  );

  const productsNeedingDefault = productIds.filter(id => !productsWithTierPrices.has(id));

  if (productsNeedingDefault.length > 0) {
    const defaultPrices = await prisma.priceListItem.findMany({
      where: {
        productId: { in: productsNeedingDefault },
        priceList: {
          isDefault: true,
          isActive: true,
        },
      },
      select: { productId: true, price: true },
    });

    for (const item of defaultPrices) {
      result.set(item.productId, item.price.toNumber());
    }
  }

  return result;
}

// ===========================================
// UTILITY FUNCTIONS
// ===========================================

/**
 * Get all active products for dropdown/select components
 * Lightweight query returning only essential fields
 */
export async function getActiveProductsForSelect() {
  return prisma.product.findMany({
    where: { isActive: true },
    select: {
      id: true,
      name: true,
      sku: true,
      category: true,
      salePrice: true,
      costPrice: true,
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Get products by category
 * Useful for quotation builder filtering
 */
export async function getProductsByCategory(category: ProductCategory) {
  return prisma.product.findMany({
    where: {
      category,
      isActive: true,
    },
    select: {
      id: true,
      name: true,
      sku: true,
      salePrice: true,
      costPrice: true,
      unit: true,
      taxPct: true,
    },
    orderBy: { name: 'asc' },
  });
}

/**
 * Check if a SKU already exists (for validation)
 */
export async function isSkuUnique(sku: string, excludeProductId?: string): Promise<boolean> {
  const existing = await prisma.product.findFirst({
    where: {
      sku,
      ...(excludeProductId && { id: { not: excludeProductId } }),
    },
  });
  return !existing;
}
