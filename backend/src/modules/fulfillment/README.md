# Fulfillment Module

**Owner: Dev B**

## Responsibility
- Warehouse management
- Stock level tracking
- Fulfillment split algorithm
- Backorder handling
- Manual override support
- Shipping coordination

## Key Files to Implement
- `routes.ts` - Express routes (auto-registered)
- `fulfillmentService.ts` - Business logic
- `warehouseSplitAlgorithm.ts` - Split logic
- `fulfillmentController.ts` - Route handlers

## Split Algorithm
```
1. Sort warehouses by available stock (descending)
2. For each warehouse, take min(available, remaining)
3. If remaining > 0 after all warehouses, mark as backorder
4. Use transactions for stock deduction
```

## Integration Points
- **Listens**: `quotation.confirmed` → Trigger warehouse split
- **Emits**: `stock.updated`, `fulfillment.completed`, `backorder.ready` events
- **Uses**: AuditLogger for stock adjustments

## API Endpoints (to implement)
```
GET    /api/fulfillment/warehouses          - List warehouses
POST   /api/fulfillment/warehouses          - Create warehouse
GET    /api/fulfillment/warehouses/:id      - Get warehouse details
PUT    /api/fulfillment/warehouses/:id      - Update warehouse

GET    /api/fulfillment/stock               - Get stock levels
PUT    /api/fulfillment/stock/:id           - Adjust stock

GET    /api/fulfillment/splits              - List fulfillment splits
GET    /api/fulfillment/splits/quotation/:id - Get splits for quotation
POST   /api/fulfillment/splits/:id/override  - Manual override
POST   /api/fulfillment/splits/:id/ship      - Mark as shipped
POST   /api/fulfillment/splits/:id/deliver   - Mark as delivered

GET    /api/fulfillment/backorders          - List backorders
POST   /api/fulfillment/backorders/:id/consolidate - Consolidate backorder
```
