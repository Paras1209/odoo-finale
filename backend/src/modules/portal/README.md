# Portal Module

**Owner: Dev B**

## Responsibility
- Customer-facing portal authentication
- Quotation viewing for customers
- Counter-discount requests
- Comment/negotiation functionality
- Order confirmation

## Key Files to Implement
- `routes.ts` - Express routes (auto-registered)
- `portalService.ts` - Business logic
- `portalController.ts` - Route handlers

## Security Notes
- Uses separate JWT (portal token)
- NEVER expose cost_price or margin data
- All queries must filter by customer_id

## Integration Points
- **Emits**: `portal.counterDiscount` event
- **Calls**: Quotation module's `transitionQuotation()` for counter-discounts
- **Uses**: Risk Score Engine for re-evaluation

## API Endpoints (to implement)
```
POST   /api/portal/auth/login          - Customer login
POST   /api/portal/auth/logout         - Customer logout
GET    /api/portal/profile             - Get customer profile

GET    /api/portal/quotations          - List customer's quotations
GET    /api/portal/quotations/:id      - Get quotation details (no margins!)
POST   /api/portal/quotations/:id/comment - Add comment
POST   /api/portal/quotations/:id/counter - Request counter-discount
POST   /api/portal/quotations/:id/confirm - Confirm quotation
```
