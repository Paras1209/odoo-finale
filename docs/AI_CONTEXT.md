# DealFlow360 - AI Context Document

## Project Status

**Phase 0 Complete** ✅

Last Updated: September 2026

---

## Project Overview

DealFlow360 is an intelligent sales operations platform built with:
- **Backend**: Express.js + Prisma + PostgreSQL
- **Frontend**: Next.js 14 + TailwindCSS + React
- **Architecture**: Monorepo with separate `backend/` and `frontend/` folders

---

## Directory Structure

```
odoo-finale/
├── backend/
│   ├── prisma/
│   │   ├── schema.prisma          # Database schema (21 models)
│   │   ├── seed.ts                # Seed orchestrator (FROZEN)
│   │   └── seeds/
│   │       ├── userSeed.ts        # Users & customers
│   │       ├── catalogSeed.ts     # Products, warehouses (Dev B)
│   │       └── quotationSeed.ts   # Discount tiers, approval chains (Dev A)
│   └── src/
│       ├── index.ts               # Server entry point (FROZEN)
│       ├── app.ts                 # Route registration (FROZEN)
│       ├── routes/
│       │   └── auth.ts            # Auth endpoints
│       ├── modules/
│       │   ├── quotation/         # Dev A
│       │   ├── approval/          # Dev A
│       │   ├── billing/           # Dev A
│       │   ├── catalog/           # Dev B
│       │   ├── fulfillment/       # Dev B
│       │   ├── portal/            # Dev B
│       │   ├── dashboard/         # Dev B
│       │   └── upsell/            # Dev B
│       └── shared/
│           ├── config/env.ts      # Environment config
│           ├── db/
│           │   ├── prisma.ts      # Prisma client
│           │   └── utils.ts       # DB utilities
│           ├── middleware/
│           │   ├── auth.ts        # JWT auth middleware
│           │   ├── errorHandler.ts
│           │   └── requestLogger.ts
│           ├── services/
│           │   ├── authService.ts
│           │   ├── auditLogger.ts
│           │   ├── eventBus.ts
│           │   └── riskScoreEngine.ts
│           ├── types/
│           │   ├── enums.ts
│           │   ├── models.ts
│           │   └── dto.ts
│           └── validators/
│               └── index.ts
└── frontend/
    └── src/
        ├── app/
        │   ├── layout.tsx         # Root layout
        │   ├── page.tsx           # Landing page
        │   ├── auth/login/        # Internal login
        │   ├── portal/            # Customer portal
        │   │   ├── layout.tsx
        │   │   ├── login/
        │   │   ├── dashboard/
        │   │   ├── quotations/
        │   │   ├── orders/
        │   │   ├── invoices/
        │   │   └── account/
        │   └── (workspace)/       # Internal workspace
        │       ├── layout.tsx
        │       └── workspace/
        │           ├── page.tsx   # Dashboard
        │           ├── quotations/
        │           ├── approvals/
        │           ├── billing/
        │           ├── catalog/
        │           ├── fulfillment/
        │           └── admin/
        ├── components/ui/         # Reusable components
        └── lib/
            ├── api.ts             # API client
            └── utils.ts           # Utilities
```

---

## Module Ownership

### Dev A (Quotation, Approval, Billing)
- `backend/src/modules/quotation/`
- `backend/src/modules/approval/`
- `backend/src/modules/billing/`
- `backend/prisma/seeds/quotationSeed.ts`

### Dev B (Catalog, Fulfillment, Portal, Dashboard, Upsell)
- `backend/src/modules/catalog/`
- `backend/src/modules/fulfillment/`
- `backend/src/modules/portal/`
- `backend/src/modules/dashboard/`
- `backend/src/modules/upsell/`
- `backend/prisma/seeds/catalogSeed.ts`

### Shared (FROZEN - Do not modify without coordination)
- `backend/src/shared/*`
- `backend/src/index.ts`
- `backend/src/app.ts`
- `backend/prisma/schema.prisma`
- `backend/prisma/seed.ts`

---

## Key Intersection Points

### 1. Quotation State Transition
**File**: `backend/src/modules/quotation/quotationService.ts`
**Function**: `transitionQuotation(quotationId, action, actorId, actorType, reason?)`

This is the ONLY function that changes quotation status. Both Dev A (internal) and Dev B (portal) use this.

### 2. Fulfillment Trigger
**File**: `backend/src/shared/services/eventBus.ts`
**Event**: `quotation.confirmed`

When a quotation is confirmed, this event triggers fulfillment processing in Dev B's module.

---

## API Endpoints

| Endpoint | Module | Owner |
|----------|--------|-------|
| `/api/auth/*` | Auth | Shared |
| `/api/quotation/*` | Quotation | Dev A |
| `/api/approval/*` | Approval | Dev A |
| `/api/billing/*` | Billing | Dev A |
| `/api/catalog/*` | Catalog | Dev B |
| `/api/fulfillment/*` | Fulfillment | Dev B |
| `/api/portal/*` | Portal | Dev B |
| `/api/dashboard/*` | Dashboard | Dev B |
| `/api/upsell/*` | Upsell | Dev B |

---

## Database Schema Summary

### Enums
- UserRole: ADMIN, SALES_REP, SALES_MANAGER, FINANCE_OPS
- CustomerTier: BRONZE, SILVER, GOLD
- ProductCategory: HARDWARE, SERVICE, SUBSCRIPTION
- QuotationStatus: DRAFT, PENDING_MANAGER_APPROVAL, PENDING_FINANCE_APPROVAL, APPROVED, REJECTED, RETURNED, CONFIRMED, CANCELLED, EXPIRED
- ApprovalDecision: APPROVED, REJECTED, RETURNED
- InvoiceStatus: PENDING, SENT, PAID, PARTIALLY_PAID, OVERDUE, CANCELLED
- ActorType: INTERNAL, CUSTOMER

### Key Models (21 total)
- User, Customer
- Product, ProductVariant, PriceList, PriceListItem
- DiscountTier, ApprovalChain
- Quotation, QuotationLine, QuotationComment
- Approval
- Warehouse, StockLevel, FulfillmentSplit
- SubscriptionPlan, BillingSchedule
- Invoice, CreditNote
- ProductPairing, AuditLog

---

## Configuration

### Environment Variables

**Backend** (`backend/.env.local`):
```
NODE_ENV=development
PORT=3001
DATABASE_URL=postgresql://postgres:postgres@localhost:5432/dealflow360
JWT_SECRET=<your-secret>
PORTAL_JWT_SECRET=<your-portal-secret>
JWT_EXPIRES_IN=24h
PORTAL_JWT_EXPIRES_IN=7d
CORS_ORIGINS=http://localhost:3000,http://localhost:3001
```

**Frontend** (`frontend/.env.local`):
```
NEXT_PUBLIC_API_URL=http://localhost:3001/api
NODE_ENV=development
```

---

## Seeded Test Data

### Internal Users
| Email | Role | Password |
|-------|------|----------|
| admin@dealflow360.com | ADMIN | password123 |
| rep1@dealflow360.com | SALES_REP | password123 |
| rep2@dealflow360.com | SALES_REP | password123 |
| manager@dealflow360.com | SALES_MANAGER | password123 |
| finance@dealflow360.com | FINANCE_OPS | password123 |

### Portal Customers
| Email | Company | Tier | Password |
|-------|---------|------|----------|
| acme@example.com | Acme Corporation | GOLD | portal123 |
| globex@example.com | Globex Inc | SILVER | portal123 |
| initech@example.com | Initech Ltd | BRONZE | portal123 |

### Discount Tiers (Approval Threshold = 1)
| Tier | Hardware | Service | Subscription |
|------|----------|---------|--------------|
| GOLD | 15% | 10% | 12% |
| SILVER | 10% | 7% | 8% |
| BRONZE | 5% | 3% | 4% |

---

## Setup Commands

```bash
# Install dependencies
npm install

# Generate Prisma client
cd backend && npx prisma generate

# Run database migration (requires PostgreSQL)
cd backend && npx prisma migrate dev --name init

# Seed database
cd backend && npx prisma db seed

# Start backend (port 3001)
cd backend && npm run dev

# Start frontend (port 3000)
cd frontend && npm run dev
```

---

## Phase 1+ Development Notes

1. All stub routes return `501 Not Implemented` - implement business logic
2. Frontend pages are stubbed - implement actual UI components
3. Risk score engine has stub implementation - implement actual algorithms
4. Event handlers are wired but have TODO implementations
5. Auth flow is complete - tokens work for both internal and portal

---

## Key Decisions

1. **Separate backend/frontend folders** (not Next.js API routes)
2. **Dual JWT authentication** (separate secrets for internal vs portal)
3. **Approval thresholds via database** (configurable, default = 1)
4. **Event-driven fulfillment** (quotation.confirmed triggers warehouse split)
5. **Frozen shared files** to prevent merge conflicts during parallel development
