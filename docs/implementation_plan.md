# DealFlow360 — Implementation Plan
### Sales Operations Platform (PS3) — Odoo Hackathon

---

## 0. Guiding Principles (read this before coding)

1. **Build the risk-scoring + approval engine first.** It's the one piece explicitly worked through with an example in the problem statement — it will almost certainly be tested directly.
2. **One service layer, many callers.** Discount evaluation, warehouse splitting, and proration must each be a single pure function/service called from every place that needs them (rep confirms quote, customer counters, quantity changes) — never duplicated.
3. **State machines, not status strings.** Every entity with a lifecycle (Quotation, Approval, Subscription) transitions through an enforced state machine server-side. The UI never sets status directly — it calls an action, the backend decides the resulting status.
4. **Relational DB, not document DB.** Given the volume of foreign keys (Customer↔Quotation↔OrderLine↔Product↔Warehouse↔Subscription↔Approval) and the need for transactional stock deduction, use PostgreSQL. This alone signals "production-grade" thinking to judges.
5. **Everything auditable.** One `audit_log` table, written to by every mutating action across all modules — not per-module logging.

---

## 1. Tech Stack (recommended, given your MERN background)

| Layer | Choice | Why |
|---|---|---|
| Frontend | Next.js 14+ (App Router) + TailwindCSS | Full-stack React framework with built-in API routes, SSR/SSG for fast loads, file-based routing, and excellent TypeScript support. Eliminates need for separate backend server for most use cases. |
| Backend API | Next.js API Routes + Server Actions | Co-located with frontend, type-safe end-to-end, no CORS issues. Use Route Handlers for REST endpoints, Server Actions for mutations. |
| DB | PostgreSQL | Relational integrity, transactions, window functions for dashboard aggregates |
| ORM | Prisma | Type-safe schema, easy migrations, excellent Next.js integration |
| Auth | NextAuth.js (Auth.js) with JWT strategy | Built-in session management, separate credential providers for internal users vs portal customers, middleware-based route protection |
| Styling | TailwindCSS + shadcn/ui | Rapid UI development with accessible, customizable components |
| Real-time margin/UI updates | Client-side computed state (React state + useMemo) | Recompute on every line change client-side, confirm with Server Actions on save. Simpler than websockets; satisfies "live" requirement |
| PDF export (dashboard/reports) | `@react-pdf/renderer` or `puppeteer` | React-PDF for programmatic generation, Puppeteer for HTML-to-PDF if needed |
| Background jobs (optional, if time permits) | Vercel Cron / `node-cron` for self-hosted | Schedule billing cycle advancement, stale deal notifications |

### Next.js Project Structure (Matches Excalidraw Screens 1-15)
```
/app
  /auth                        # Screen 1: Login / Signup
    /login
    /signup
  /(workspace)                 # Internal workspace (rep, manager, finance)
    /workspace
      page.tsx                 # Screen 2: Sales Dashboard / Home
      /quotations              # Screen 3: Quotation List
        /[id]                  # Screen 4: Quotation Builder / Detail
      /approvals               # Screen 5: Approval List
        /[id]                  # Screen 6: Approval Detail
      /fulfillment             # Screen 7: Fulfillment List
        /[id]                  # Screen 8: Fulfillment Detail
      /subscriptions           # Screen 9: Subscriptions List
        /[id]                  # Screen 10: Subscription Detail
      /invoices                # Screen 12: Invoices List
        /[id]                  # Screen 13: Invoice Detail
      /deal-health             # Screen 14: Deal Health Dashboard
      /reports                 # Screen 15: Reports with filters/export
      /catalog                 # Admin: Product management
      /admin                   # Admin: Users, Settings
  /portal                      # Screen 11: Customer Portal (separate layout, restricted auth)
    /login
    /dashboard
    /quotations/[id]
    /invoices
    /orders
    /account
  /api                         # REST endpoints if needed
/lib
  /services                    # Business logic (RiskScoreEngine, AuditLogger, etc.)
  /db                          # Prisma client, queries
/components                    # Shared UI components
/prisma                        # Schema + migrations
```

### Screen-to-Route Mapping
| Screen | Route | Description |
|--------|-------|-------------|
| 1 | `/auth/login`, `/auth/signup` | Entry point for all users |
| 2 | `/workspace` | Dashboard with widgets: Pending Approvals, Open Quotations, At-Risk Deals |
| 3 | `/workspace/quotations` | Quotation list view |
| 4 | `/workspace/quotations/[id]` | Quotation builder with product picker, discounts, margin |
| 5 | `/workspace/approvals` | Approval queue list |
| 6 | `/workspace/approvals/[id]` | Approval detail with approve/reject/return |
| 7 | `/workspace/fulfillment` | Fulfillment orders list |
| 8 | `/workspace/fulfillment/[id]` | Warehouse split view with accept/override |
| 9 | `/workspace/subscriptions` | Active subscriptions list |
| 10 | `/workspace/subscriptions/[id]` | Subscription detail with billing schedule, cancel/modify |
| 11 | `/portal/*` | Customer portal (separate layout, scoped auth) |
| 12 | `/workspace/invoices` | Invoices list |
| 13 | `/workspace/invoices/[id]` | Invoice detail with payment status |
| 14 | `/workspace/deal-health` | Stalled deals, anomalies, slippage alerts |
| 15 | `/workspace/reports` | Reporting with filters and PDF/XLS export |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────────┐
│                        Next.js App (App Router)                      │
│  ┌────────────────┐  ┌──────────────────┐  ┌──────────────────────┐ │
│  │ /(internal)     │  │ /(portal)        │  │ /(admin)             │ │
│  │ Rep/Manager/    │  │ Customer Portal  │  │ Backend Config       │ │
│  │ Finance Views   │  │ (separate layout,│  │ (products, discount  │ │
│  │                 │  │ restricted auth) │  │ rules, warehouses)   │ │
│  └────────────────┘  └──────────────────┘  └──────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ Server Actions + API Routes
                            │ (NextAuth.js middleware, role checks)
┌───────────────────────────▼─────────────────────────────────────────┐
│                     /lib/services (Business Logic)                   │
│  ┌──────────┐ ┌───────────────┐ ┌────────────┐ ┌──────────────────┐ │
│  │ Catalog  │ │ Quotation +   │ │ Fulfillment│ │ Billing/         │ │
│  │ Service  │ │ Approval      │ │ Service    │ │ Subscription     │ │
│  │ (M1)     │ │ Engine (M2)   │ │ (M3)       │ │ Service (M4)     │ │
│  └──────────┘ └───────┬───────┘ └────────────┘ └──────────────────┘ │
│                        │ shared core services                       │
│         ┌──────────────┴───────────────┬───────────────┐            │
│         │ RiskScoreEngine               │ AuditLogger  │            │
│         │ (pure fn, unit-testable)      │ (writes to   │            │
│         │                                │ audit_log)   │            │
│         └────────────────────────────────┴───────────────┘          │
│  ┌──────────────────┐  ┌──────────────────────────────────────────┐ │
│  │ Portal Service    │  │ Dashboard/Reporting Service (M6)         │ │
│  │ (M5, scoped auth) │  │ — read-only aggregate queries            │ │
│  └──────────────────┘  └──────────────────────────────────────────┘ │
└───────────────────────────┬─────────────────────────────────────────┘
                            │ Prisma Client
                    ┌───────▼────────┐
                    │  PostgreSQL     │
                    └─────────────────┘
```

**Key architectural decision:** `RiskScoreEngine` and `AuditLogger` are cross-cutting services imported by every module that mutates a Quotation — not embedded per-module. This is what makes the "self-governing" behavior consistent everywhere (rep action, customer portal action, subscription change all go through the same gate).

---

## 3. Data Model (core schema)

```sql
-- ===== IDENTITY & ROLES =====
users (
  id, name, email, password_hash, role ENUM('SALES_REP','SALES_MANAGER',
  'FINANCE_OPS','ADMIN'), created_at
)

customers (
  id, name, tier ENUM('BRONZE','SILVER','GOLD'), email, portal_password_hash,
  created_at
)

-- ===== CATALOG (M1) =====
products (
  id, name, category ENUM('HARDWARE','SERVICE','SUBSCRIPTION'),
  cost_price, sale_price, unit, tax_pct, description
)

product_variants ( id, product_id FK, attribute, value, extra_price )

price_lists ( id, name, customer_tier, currency )
price_list_items ( id, price_list_id FK, product_id FK, price )

-- ===== DISCOUNT GOVERNANCE (M2) =====
discount_tiers (
  id, customer_tier, category, max_discount_pct
  -- e.g. (GOLD, HARDWARE, 15), (GOLD, SERVICE, 10)
)

approval_chains (
  id, min_risk_score, max_risk_score, requires_manager BOOL,
  requires_finance BOOL
)

-- ===== QUOTATION (M2 core) =====
quotations (
  id, customer_id FK, rep_id FK, status ENUM(
    'DRAFT','PENDING_MANAGER_APPROVAL','PENDING_FINANCE_APPROVAL',
    'APPROVED','REJECTED','CONFIRMED','FULFILLING','BILLED','CANCELLED'
  ),
  blended_risk_score DECIMAL, total_amount, total_margin,
  created_at, updated_at, last_activity_at
)

quotation_lines (
  id, quotation_id FK, product_id FK, quantity, unit_price,
  discount_pct, line_type ENUM('ONE_TIME','RECURRING'),
  billing_frequency ENUM('MONTHLY','QUARTERLY','YEARLY') NULL,
  margin_amount
)

approvals (
  id, quotation_id FK, level ENUM('MANAGER','FINANCE'),
  approver_id FK NULL, status ENUM('PENDING','APPROVED','REJECTED','RETURNED'),
  reason TEXT, acted_at
)

-- ===== FULFILLMENT (M3) =====
warehouses ( id, name, shipping_cost_weight )
stock_levels ( id, warehouse_id FK, product_id FK, quantity_available )

fulfillment_splits (
  id, quotation_line_id FK, warehouse_id FK, quantity_fulfilled,
  is_backorder BOOL, is_manual_override BOOL,
  estimated_ship_date DATE,      -- For delivery slippage tracking
  actual_ship_date DATE NULL     -- NULL until shipped; compare with estimated for slippage alerts
)

-- ===== BILLING & SUBSCRIPTIONS (M4) =====
subscription_plans ( id, product_id FK, frequency, proration_rule )

billing_schedules (
  id, quotation_line_id FK, cycle_number, due_date, amount,
  status ENUM('UPCOMING','INVOICED','PAID','REFUNDED')
)

invoices (
  id, quotation_id FK, invoice_type ENUM('ONE_TIME','RECURRING'),
  amount, status ENUM('DRAFT','SENT','PAID','OVERDUE'), issued_at
)

credit_notes ( id, invoice_id FK, amount, reason, created_at )

-- ===== UPSELL (M2 supporting, optional depth) =====
product_pairings ( id, product_id FK, suggested_product_id FK, weight )

-- ===== CROSS-CUTTING =====
audit_log (
  id, entity_type, entity_id, actor_id, actor_type ENUM('INTERNAL','CUSTOMER'),
  action, reason, before_state JSONB, after_state JSONB, created_at
)

quotation_comments (
  id, quotation_line_id FK, author_type ENUM('REP','CUSTOMER'),
  comment_text, created_at
)
```

---

## 4. Module-by-Module Implementation

### M1 — Catalog & Pricing
**Build:** CRUD for products, variants, price lists. Nothing exotic — but store `cost_price` alongside `sale_price` from day one, since margin calculations (M2's upsell panel) depend on it.

**API surface:**
```
GET/POST/PUT /products
GET/POST/PUT /price-lists
GET /products/:id/variants
```

---

### M2 — Quotation & Discount Governance (the core engine)

**This is the module to get exactly right. Build and unit-test this before anything else.**

#### 4.2.1 Risk Score Algorithm (pseudocode)

```python
def evaluate_quotation(quotation, discount_tiers):
    line_violations = []
    total_violation_points = 0

    for line in quotation.lines:
        ceiling = discount_tiers.get(
            customer_tier=quotation.customer.tier,
            category=line.product.category
        )
        if line.discount_pct > ceiling.max_discount_pct:
            overage = line.discount_pct - ceiling.max_discount_pct
            line_violations.append({line, overage})
            total_violation_points += overage * (line.line_total_weight)

    # Blended score = sum of weighted overages across ALL lines,
    # not just the worst single line — catches "many small violations"
    blended_score = total_violation_points

    if blended_score == 0:
        return {"status": "APPROVED", "requires": None}
    elif blended_score <= FINANCE_THRESHOLD:
        return {"status": "PENDING_MANAGER_APPROVAL", "requires": "MANAGER"}
    else:
        return {"status": "PENDING_FINANCE_APPROVAL", "requires": "MANAGER_THEN_FINANCE"}
```

**Weighting note:** weight each line's overage by its `line_total` (quantity × price) so a small overage on a big-ticket line matters more than the same overage on a trivial line — this is a reasonable, defensible interpretation of "blended."

**Validation checkpoint (use their exact example as a unit test):**
- Gold customer, Hardware line 12%/15% allowed (no violation), Service line 18%/10% allowed (8pt overage) → must return `PENDING_MANAGER_APPROVAL` (or finance, depending on your threshold), **even though the overall order average might look fine.**

#### 4.2.2 Quotation State Machine

```
DRAFT
  → (rep confirms) → evaluate_quotation()
     → no violation → APPROVED
     → manager-level → PENDING_MANAGER_APPROVAL
     → finance-level → PENDING_MANAGER_APPROVAL (then auto-advances to
                        PENDING_FINANCE_APPROVAL after manager approves)
PENDING_MANAGER_APPROVAL
  → manager approves → (if finance required) PENDING_FINANCE_APPROVAL
                     → (else) APPROVED
  → manager rejects  → REJECTED
  → manager returns  → DRAFT (with reason attached)
PENDING_FINANCE_APPROVAL
  → finance approves → APPROVED
  → finance rejects  → REJECTED
APPROVED
  → rep/customer confirms → CONFIRMED → triggers M3 (fulfillment) + M4 (billing)
CONFIRMED (or later)
  → customer counters via portal → re-runs evaluate_quotation() →
    routes back into PENDING_*_APPROVAL if new terms breach thresholds
```

**Implementation rule:** write ONE function `transitionQuotation(quotation, action, actor)` that all callers (rep endpoint, manager approval endpoint, customer portal endpoint) invoke. Never let any endpoint set `status` directly via a generic update call.

#### 4.2.3 Upsell/Cross-Sell (keep simple)
```sql
-- seed manually for demo, weight = co-purchase frequency (fake but plausible)
SELECT suggested_product_id, weight FROM product_pairings
WHERE product_id IN (current_cart_product_ids)
  AND suggested_product_id NOT IN (current_cart_product_ids)
ORDER BY weight DESC LIMIT 5
```
For each suggestion, compute `margin_delta = (sale_price - cost_price) * qty` — display this and let the frontend just add it to the running margin total on "Add to Quote" (no full page reload).

---

### M3 — Fulfillment & Warehouse Split

**Algorithm (greedy, good enough — don't over-engineer to true bin-packing):**

```python
def split_fulfillment(product_id, quantity_needed, warehouses):
    # Sort warehouses by available stock descending (fewer shipments = fewer, larger fulfillments)
    sorted_wh = sorted(warehouses, key=lambda w: -w.stock[product_id])
    splits = []
    remaining = quantity_needed

    for wh in sorted_wh:
        if remaining <= 0:
            break
        available = wh.stock[product_id]
        take = min(available, remaining)
        if take > 0:
            splits.append({"warehouse": wh, "quantity": take})
            remaining -= take

    is_backorder = remaining > 0
    return splits, is_backorder
```

**Important:** wrap stock deduction in a **DB transaction** — read stock, compute split, deduct, commit — to avoid race conditions if two orders are processed close together. This is a concrete, easy-to-explain "production-grade" detail for judges.

**Manual override:** just allow the rep/ops user to submit a different `fulfillment_splits` array overriding the suggested one — validate it still sums to `quantity_needed` and doesn't exceed stock.

**Backorder consolidation prompt:** a simple polling/refresh check — when stock for a backordered product increases (e.g., after an admin restocks), surface a banner "Stock now available — consolidate backorder?" Doesn't need to be real-time/websocket; a refresh-on-load check is enough for a hackathon.

---

### M4 — Billing & Subscriptions (Screens 9-10, 12-13)

**Frontend Screens:**
- **Screen 9 - Subscriptions List** (`/workspace/subscriptions`): Table of all active/pending subscriptions with filters by status, customer, product
- **Screen 10 - Subscription Detail** (`/workspace/subscriptions/[id]`): Shows billing schedule, allows modify/cancel with proration preview
- **Screen 12 - Invoices List** (`/workspace/invoices`): Table of all invoices with filters by status (Draft, Sent, Paid, Overdue), customer, date range
- **Screen 13 - Invoice Detail** (`/workspace/invoices/[id]`): Invoice specifics, payment recording, credit note generation

**API surface:**
```
# Subscriptions
GET    /subscriptions                    # List with filters
GET    /subscriptions/:id                # Detail with billing schedule
POST   /subscriptions/:id/modify         # Modify quantity/plan (triggers proration)
POST   /subscriptions/:id/cancel         # Cancel with refund calculation

# Invoices
GET    /invoices                         # List with filters
GET    /invoices/:id                     # Detail
POST   /invoices/:id/send                # Mark as sent
POST   /invoices/:id/record-payment      # Record payment, update status
POST   /invoices/:id/credit-note         # Generate credit note
```

**Billing schedule generation (on order confirmation):**
```python
def generate_billing_schedule(line):
    if line.line_type == 'ONE_TIME':
        return [{"due_date": today(), "amount": line.total}]

    # RECURRING
    schedule = []
    cycles = get_cycle_count(line.billing_frequency)  # e.g. 12 for yearly-monthly
    for i in range(cycles):
        due = add_interval(line.start_date, i, line.billing_frequency)
        schedule.append({"due_date": due, "amount": line.recurring_amount})
    return schedule
```

**Proration formula (mid-cycle change):**
```python
def prorate(old_amount, new_amount, cycle_start, cycle_end, change_date):
    total_days = (cycle_end - cycle_start).days
    remaining_days = (cycle_end - change_date).days
    fraction_remaining = remaining_days / total_days
    return (new_amount - old_amount) * fraction_remaining
```
This produces a single adjustment line item (positive = extra charge, negative = credit) applied to the next invoice — don't try to retroactively rewrite past invoices.

**Cancellation with Partial Refund:**
```python
def handle_cancellation(subscription_line, cancel_date):
    """
    Calculate prorated refund for mid-cycle cancellation and generate credit note.
    """
    current_cycle = get_current_billing_cycle(subscription_line)
    
    if not current_cycle:
        return None  # No active cycle to refund
    
    total_days = (current_cycle.end_date - current_cycle.start_date).days
    remaining_days = (current_cycle.end_date - cancel_date).days
    
    if remaining_days <= 0:
        return None  # Cycle already ended, no refund needed
    
    fraction_unused = remaining_days / total_days
    refund_amount = subscription_line.recurring_amount * fraction_unused
    
    # Create credit note for the unused portion
    credit_note = create_credit_note(
        invoice_id=current_cycle.invoice_id,
        amount=refund_amount,
        reason=f"Subscription cancellation - {remaining_days} days unused of {total_days} day cycle"
    )
    
    # Cancel all future billing schedules
    cancel_future_billing_schedules(subscription_line.id, cancel_date)
    
    # Update subscription status
    subscription_line.status = 'CANCELLED'
    subscription_line.cancelled_at = cancel_date
    
    return credit_note
```

**Cancellation rules to implement:**
1. **Immediate cancellation**: Prorated refund for unused days in current cycle
2. **End-of-cycle cancellation**: No refund, but stop future renewals
3. **Grace period**: Optional configurable window before refund is issued (e.g., 24-48 hours to reverse cancellation)

**Cancellation:** on cancel, if `remaining_days > 0`, auto-generate a `credit_notes` row for the prorated unused amount.

---

### M5 — Customer Portal (Screen 11)

**Frontend Screen:**
- **Screen 11 - Customer Portal** (`/portal/*`): Separate layout with restricted auth, includes:
  - `/portal/dashboard` - Overview of customer's quotations and orders
  - `/portal/quotations/[id]` - View quotation, submit comments, counter-discount proposals
  - `/portal/invoices` - View and download invoices
  - `/portal/orders` - Track order fulfillment status
  - `/portal/account` - Profile management

**Key features:**
- **Separate JWT scope**: `actor_type: 'CUSTOMER'` tokens, issued via a distinct `/portal/login` endpoint (magic link or email+password). Middleware rejects any customer token on internal-only routes and vice versa.
- **Restricted queries**: portal endpoints must always filter `WHERE customer_id = req.user.customer_id` — never return another customer's data, and never expose `cost_price`/margin fields in the portal API response (strip them at the serializer level, not just hide in UI).
- **Negotiation actions**: `POST /portal/quotations/:id/comment`, `POST /portal/quotations/:id/counter-discount` — the counter-discount endpoint calls the **same** `transitionQuotation` + `evaluate_quotation` functions M2 uses internally, just invoked with `actor_type: CUSTOMER`.

---

### M6 — Dashboard & Reporting (Screens 2, 14, 15)

**Frontend Screens:**
- **Screen 2 - Sales Dashboard / Home** (`/workspace`): Central hub with summary widgets:
  - Pending Approvals card (count + link to Screen 5)
  - Open Quotations card (count + link to Screen 3)
  - At-Risk Deals card (count + link to Screen 14)
  - "+ New Quotation" button
  - "View Approvals" button
  - Recent Activity feed (last 10 actions across the system)
  
- **Screen 14 - Deal Health Dashboard** (`/workspace/deal-health`): Detailed health monitoring:
  - Stalled deals table (quotations inactive > N days)
  - Discount anomaly alerts (discounts well above rep's historical average)
  - Delivery promise slippage indicators
  - Click any alert to open the related quotation directly
  - Automated nudge/escalation action buttons
  
- **Screen 15 - Reports** (`/workspace/reports`): Comprehensive reporting:
  - **Filters**: Period (today, week, custom range), Sales Team/Rep, Approval Status, Product/Category
  - **Metrics**: Sales performance, discount analysis, fulfillment metrics, billing summary
  - **Export**: PDF and XLS download options

**API surface:**
```
# Dashboard (Screen 2)
GET /dashboard/summary              # Widget counts and recent activity

# Deal Health (Screen 14)
GET /dashboard/deal-health          # Stalled deals, anomalies, slippage
POST /dashboard/deal-health/:id/nudge  # Send nudge notification

# Reports (Screen 15)
GET /reports                        # Report data with filters
GET /reports/export?format=pdf|xls  # Export report
```

Pick **4 real, live metrics** to cover all dashboard requirements:

```sql
-- 1. Stalled deals (quotations inactive for more than configured days)
SELECT * FROM quotations
WHERE status IN ('DRAFT','PENDING_MANAGER_APPROVAL')
  AND last_activity_at < NOW() - INTERVAL '3 days';

-- 2. Discount anomaly (vs rep's own historical average)
WITH rep_avg AS (
  SELECT rep_id, AVG(discount_pct) as avg_discount
  FROM quotation_lines ql JOIN quotations q ON ql.quotation_id = q.id
  GROUP BY rep_id
)
SELECT ql.* FROM quotation_lines ql
JOIN quotations q ON ql.quotation_id = q.id
JOIN rep_avg ON rep_avg.rep_id = q.rep_id
WHERE ql.discount_pct > rep_avg.avg_discount * 1.5;

-- 3. Delivery promise slippage (late or at-risk shipments)
SELECT fs.*, ql.product_id, q.customer_id
FROM fulfillment_splits fs
JOIN quotation_lines ql ON fs.quotation_line_id = ql.id
JOIN quotations q ON ql.quotation_id = q.id
WHERE 
  -- Already late: shipped after estimated date
  (fs.actual_ship_date IS NOT NULL AND fs.actual_ship_date > fs.estimated_ship_date)
  OR
  -- At risk: not shipped yet and estimated date is past or within 1 day
  (fs.actual_ship_date IS NULL AND fs.estimated_ship_date <= NOW() + INTERVAL '1 day');

-- 4. Deal health summary
SELECT status, COUNT(*), SUM(total_amount) FROM quotations GROUP BY status;
```

Filters (Period, Sales Team, Approval Status, Product) = just `WHERE` clauses added dynamically based on query params — don't overbuild a generic filter framework.

---

## 5. Cross-Cutting Concerns

### Audit Logging
Every mutating action (discount applied, approval acted on, split overridden, subscription changed) calls:
```js
auditLog.record({
  entity_type, entity_id, actor_id, actor_type,
  action, reason, before_state, after_state
});
```
Wire this as **middleware or a decorator** around service methods, not manually copy-pasted in every controller.

### RBAC Middleware
```js
requireRole(['SALES_MANAGER', 'ADMIN'])  // on approval endpoints
requirePortalAuth()                       // on /portal/* routes
```
Enforce at the route/middleware level — never rely on frontend hiding buttons alone.

### Validation
Use a schema validation library (Zod/Joi) on every mutating endpoint — reject malformed discount %, negative quantities, etc. before they hit business logic.

---

## 6. Scalability & Production-Readiness Notes (for your architecture diagram / judge Q&A)

- **Stateless API servers** — JWT auth means no server-side session store, so the API layer can horizontally scale behind a load balancer.
- **DB transactions for stock deduction** — prevents overselling under concurrent orders.
- **Indexes**: on `quotations(status, last_activity_at)` for dashboard queries, `stock_levels(product_id, warehouse_id)` for fulfillment lookups.
- **Separation of read-heavy (dashboard) vs write-heavy (quotation builder) paths** — mention that in production you'd consider a read replica for dashboard aggregation queries.
- **Idempotency**: approval actions and billing schedule generation should be idempotent (check current state before applying) so retried requests don't double-process.
- **Background jobs**: billing schedule advancement (marking cycles as due) would run as a scheduled job in production — even a stub `cron` function shows you've thought about it.

---

## 7. Phased Build Plan (sequencing + 2-person split)

| Phase | Focus | Owner | Screens |
|---|---|---|---|
| 0 | Auth, Shared types, Event bus, Navigation layout, Seed skeleton | Both (pair) | 1 (partial) |
| 1 | Auth complete, Product/Price CRUD, basic Quotation builder (no approval logic) | Both | 1, 3-4 (partial) |
| 2 | Risk score engine + approval state machine — **validate against the worked example before moving on** | Person A | 5-6 |
| 2 (parallel) | Warehouse split algorithm + stock model + Fulfillment UI | Person B | 7-8 |
| 3 | Subscriptions list/detail + Billing/subscription schedule + proration | Person A | 9-10 |
| 3 (parallel) | Customer portal (auth + negotiation, reuses Person A's M2 functions) | Person B | 11 |
| 4 | Invoices list/detail + Invoice generation | Person A | 12-13 |
| 4 (parallel) | Dashboard home + Deal Health + Reports + Upsell panel | Person B | 2, 14, 15 |
| 5 | Seed realistic demo data, rehearse the 8-step test flow, prep architecture diagram | Both | All |

---

## 8. Deliverables Checklist (map directly to what's graded)

- [ ] Working app (backend + frontend) with seed data
- [ ] 5-minute demo covering **two full flows** end-to-end
- [ ] One-page architecture diagram (use the Section 2 diagram as a base, redraw in Excalidraw)
- [ ] Short "what we'd build next" note (multi-currency, real ML-based upsell, websocket-based live dashboard, etc.)
- [ ] Pass all 8 steps of the problem statement's own "Quick Test Flow" — treat this as your acceptance test suite

---

## 9. Your Own Pre-Demo Test Script (mirrors their Quick Test Flow — rehearse this exactly)

1. Log in as rep, set up a discount tier, a warehouse, a subscription plan (as admin)
2. Create a quotation, add a line with a discount above its category ceiling
3. Confirm → verify it auto-routes to Pending Manager Approval without manual request
4. While building, accept an upsell suggestion → verify margin updates instantly
5. Get it approved → verify stock is pulled correctly, split across 2 warehouses if needed
6. Add one one-time + one recurring line on the same order → verify separate billing
7. Open customer portal → request a bigger discount → verify it re-enters approval automatically
8. Confirm order, record payment → verify invoice status updates correctly

If all 8 pass cleanly, your core flow is demo-ready.