# Billing Module

**Owner: Dev A**

## Responsibility
- Billing schedule generation
- Invoice creation and management
- Proration calculations
- Credit note generation
- Payment recording
- Subscription lifecycle

## Key Files to Implement
- `routes.ts` - Express routes (auto-registered)
- `billingService.ts` - Business logic
- `billingController.ts` - Route handlers
- `prorationService.ts` - Proration calculations

## Billing Flow
```
Order Confirmed
    ↓
Generate Billing Schedule
    ↓
One-time lines → Immediate invoice
Recurring lines → Scheduled invoices
    ↓
Invoice Generated → SENT → PAID
                      ↓
                   OVERDUE
```

## Proration Rules
- NONE: No proration
- DAILY: Prorate by days remaining in cycle
- WEEKLY: Prorate by weeks remaining

## Integration Points
- **Listens**: `quotation.confirmed` → Generate billing schedule
- **Emits**: `invoice.generated`, `payment.received` events
- **Uses**: AuditLogger for all billing actions

## API Endpoints (to implement)
```
GET    /api/billing/schedules        - List billing schedules
GET    /api/billing/invoices         - List invoices
GET    /api/billing/invoices/:id     - Get invoice details
POST   /api/billing/invoices/:id/send - Send invoice
POST   /api/billing/invoices/:id/pay  - Record payment
POST   /api/billing/invoices/:id/refund - Process refund
GET    /api/billing/credit-notes     - List credit notes
```
