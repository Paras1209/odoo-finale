# Quotation Module

**Owner: Dev A**

## Responsibility
- Quotation CRUD operations
- Quotation line management
- Quotation state machine (`transitionQuotation()`)
- Risk score calculation integration
- Quotation builder API endpoints

## Key Files to Implement
- `routes.ts` - Express routes (auto-registered)
- `quotationService.ts` - Business logic
- `quotationController.ts` - Route handlers

## State Machine
```
DRAFT → PENDING_MANAGER_APPROVAL → PENDING_FINANCE_APPROVAL → APPROVED → CONFIRMED → FULFILLING → BILLED
                ↓                            ↓                    ↓
             REJECTED                     REJECTED              CANCELLED
```

## Integration Points
- **Emits**: `quotation.confirmed`, `quotation.statusChanged` events
- **Calls**: Risk Score Engine for discount validation
- **Called by**: Portal module for customer counter-discount

## API Endpoints (to implement)
```
GET    /api/quotation           - List quotations
POST   /api/quotation           - Create quotation
GET    /api/quotation/:id       - Get quotation details
PUT    /api/quotation/:id       - Update quotation
DELETE /api/quotation/:id       - Delete draft quotation
POST   /api/quotation/:id/lines - Add line item
PUT    /api/quotation/:id/lines/:lineId - Update line item
DELETE /api/quotation/:id/lines/:lineId - Remove line item
POST   /api/quotation/:id/transition - Transition state (confirm, cancel)
```
