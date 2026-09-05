# Approval Module

**Owner: Dev A**

## Responsibility
- Approval workflow management
- Manager approval handling
- Finance approval handling
- Return for revision functionality
- Approval audit trail

## Key Files to Implement
- `routes.ts` - Express routes (auto-registered)
- `approvalService.ts` - Business logic
- `approvalController.ts` - Route handlers

## Approval Flow
```
Manager Review:
  PENDING_MANAGER_APPROVAL
    → APPROVE (if finance required) → PENDING_FINANCE_APPROVAL
    → APPROVE (if no finance) → APPROVED
    → REJECT → REJECTED
    → RETURN → DRAFT

Finance Review:
  PENDING_FINANCE_APPROVAL
    → APPROVE → APPROVED
    → REJECT → REJECTED
```

## Integration Points
- **Emits**: `quotation.approved`, `quotation.rejected` events
- **Calls**: Quotation module for status updates
- **Uses**: AuditLogger for all approval actions

## API Endpoints (to implement)
```
GET    /api/approval/pending     - List pending approvals for current user
GET    /api/approval/:id         - Get approval details
POST   /api/approval/:id/approve - Approve quotation
POST   /api/approval/:id/reject  - Reject quotation
POST   /api/approval/:id/return  - Return for revision
```
