# Dashboard Module

**Owner: Dev B**

## Responsibility
- Deal health metrics
- Stalled deals detection
- Discount anomaly detection
- Delivery slippage tracking
- Reporting and analytics

## Key Files to Implement
- `routes.ts` - Express routes (auto-registered)
- `dashboardService.ts` - Business logic
- `dashboardController.ts` - Route handlers

## Metrics to Track
1. **Stalled Deals** - Quotations inactive > X days
2. **Discount Anomalies** - Discount > 1.5x rep's historical average
3. **Delivery Slippage** - Actual ship date > estimated ship date
4. **Deal Health Summary** - Count and amount by status

## Integration Points
- **Listens**: Various events for real-time updates
- **Reads**: Quotations, Approvals, Fulfillment data

## API Endpoints (to implement)
```
GET    /api/dashboard/summary           - Overall deal health
GET    /api/dashboard/stalled           - Stalled deals
GET    /api/dashboard/anomalies         - Discount anomalies
GET    /api/dashboard/slippage          - Delivery slippage
GET    /api/dashboard/metrics           - Key metrics (configurable)
GET    /api/dashboard/trends            - Trend data over time
```

## Filters (apply to all endpoints)
- Period (date range)
- Sales Rep / Team
- Approval Status
- Product / Category
