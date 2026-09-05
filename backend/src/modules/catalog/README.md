# Catalog Module

**Owner: Dev B**

## Responsibility
- Product CRUD operations
- Product variant management
- Price list management
- Category configuration

## Key Files to Implement
- `routes.ts` - Express routes (auto-registered)
- `catalogService.ts` - Business logic
- `catalogController.ts` - Route handlers

## Data Model
```
Product
  ├── ProductVariant (size, color, etc.)
  └── PriceListItem (tier-based pricing)

PriceList
  └── PriceListItem
```

## Integration Points
- **Called by**: Quotation module for product lookup
- **Called by**: Upsell module for suggestions
- **Uses**: AuditLogger for product changes

## API Endpoints (to implement)
```
GET    /api/catalog/products          - List products
POST   /api/catalog/products          - Create product
GET    /api/catalog/products/:id      - Get product details
PUT    /api/catalog/products/:id      - Update product
DELETE /api/catalog/products/:id      - Deactivate product

GET    /api/catalog/products/:id/variants - List variants
POST   /api/catalog/products/:id/variants - Add variant
PUT    /api/catalog/products/:id/variants/:variantId - Update variant
DELETE /api/catalog/products/:id/variants/:variantId - Remove variant

GET    /api/catalog/price-lists       - List price lists
POST   /api/catalog/price-lists       - Create price list
GET    /api/catalog/price-lists/:id   - Get price list details
PUT    /api/catalog/price-lists/:id   - Update price list
POST   /api/catalog/price-lists/:id/items - Add items to price list
```
