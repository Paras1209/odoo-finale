# DealFlow360 — 2-Developer Work Division Plan
### Structured to minimize merge conflicts

---

## Screen Reference (from Excalidraw Diagram)

| Screen # | Name | Type | Owner |
|----------|------|------|-------|
| 1 | Login / Signup | Auth | Phase 0 (Both) |
| 2 | Sales Dashboard / Home | Dashboard | Dev B |
| 3 | Quotation List | List | Dev A |
| 4 | Quotation Builder / Detail | Detail | Dev A |
| 5 | Approval List | List | Dev A |
| 6 | Approval Detail | Detail | Dev A |
| 7 | Fulfillment List | List | Dev B |
| 8 | Fulfillment Detail | Detail | Dev B |
| 9 | Subscriptions List | List | Dev A |
| 10 | Subscription Detail | Detail | Dev A |
| 11 | Customer Portal | Portal | Dev B |
| 12 | Invoices List | List | Dev A |
| 13 | Invoice Detail | Detail | Dev A |
| 14 | Deal Health Dashboard | Dashboard | Dev B |
| 15 | Reports | Reports | Dev B |

**Navigation Tabs (from Excalidraw):**
- Dashboard → Screen 2
- Quotations → Screen 3 (list) → Screen 4 (detail)
- Approvals → Screen 5 (list) → Screen 6 (detail)
- Fulfillment → Screen 7 (list) → Screen 8 (detail)
- Subscriptions → Screen 9 (list) → Screen 10 (detail)
- Invoices → Screen 12 (list) → Screen 13 (detail)
- Deal Health → Screen 14
- Reports → Screen 15
- Customer Portal (separate app) → Screen 11

---

## 0. The Core Principle

Merge conflicts happen when two people edit **the same file** or **the same lines of a shared file** independently. The fix isn't discipline or communication alone — it's **structural**: organize the codebase so each developer's work lives in physically separate files/folders, and the few genuinely shared files are either (a) built together once and frozen, or (b) structured so additions don't collide.

This plan follows one rule throughout: **"Own a vertical slice, not a horizontal layer."** Neither developer should be "the backend person" and "the frontend person" — each owns a full slice (DB → API → UI) of specific modules, so they rarely need to touch the same file as the other.

---

## 1. Phase 0 — Build Together, First (2-3 hours, pair programming)

Do this part **together, on a call/in person, one person typing** — this is the one phase where shared files get created, so build them once, correctly, and then don't touch them individually again except by agreement.

### What gets built in Phase 0:
1. **Full Prisma schema** (`prisma/schema.prisma`) — all tables from the implementation plan, agreed and committed together. This file is the #1 source of merge conflicts if edited independently later — freeze it after Phase 0. If a module later needs a new field, whoever needs it pulls latest, adds the field, runs migration, pushes immediately (small, fast, low-conflict-risk changes only).
2. **Auth middleware & JWT setup** (`src/shared/middleware/auth.ts`) — both internal and portal auth scopes, role-checking middleware (`requireRole()`, `requirePortalAuth()`).
3. **Shared TypeScript types/DTOs** (`src/shared/types.ts`) — `Quotation`, `OrderLine`, `Approval`, `User`, `Customer` interfaces — agree on shapes upfront so neither dev redefines them differently later.
4. **AuditLogger service** (`src/shared/services/auditLogger.ts`) — the single logging function every module will call.
5. **Base Express/Nest app skeleton** with **auto-registering module routes** (see Section 4 — this avoids a shared "route index" file becoming a conflict point).
6. **Seed script skeleton** (`prisma/seed.ts`) — structure only; each dev adds their own module's seed data in Phase 2+ inside clearly separated functions (see Section 5).
7. **Git repo setup**: branch protection on `main`, agreed branch naming convention (Section 6).

Once Phase 0 is committed to `main`, both developers pull it and work independently from here on.

---

## 2. The Split: Developer A vs Developer B

### Developer A — "The Deal Spine" (Quotation, Approval, Billing)
Owns the core money/rules logic — the parts that are serially dependent on each other, so it makes sense for one person to carry the context through.

| Module | Backend folder | Frontend folder | Screens |
|---|---|---|---|
| M2 — Quotation | `src/modules/quotation/` | `frontend/src/app/(workspace)/workspace/quotations/` | 3, 4 |
| M2 — Approval Engine | `src/modules/approval/` | `frontend/src/app/(workspace)/workspace/approvals/` | 5, 6 |
| M4 — Subscriptions | `src/modules/billing/` | `frontend/src/app/(workspace)/workspace/subscriptions/` | 9, 10 |
| M4 — Invoices | `src/modules/billing/` | `frontend/src/app/(workspace)/workspace/invoices/` | 12, 13 |
| Shared: RiskScoreEngine | `src/shared/services/riskScoreEngine.ts` (owned/authored by Dev A, called by others) | — | — |

**Specifically builds:**
- Quotation CRUD + line items (Screens 3-4)
- `evaluate_quotation()` risk score function + unit tests (including the worked example from the requirements doc)
- Quotation state machine (`transitionQuotation()`)
- Approval screen + approve/reject/return actions (Screens 5-6)
- Subscriptions list + detail screens (Screens 9-10)
- Billing schedule generation + proration logic
- Invoices list + detail screens (Screens 12-13)
- Invoice + credit note generation
- Quotation builder UI (product picker, discount input, live margin display — margin calc itself is client-side math, no dependency on Dev B)

### Developer B — "Operations & Customer-Facing" (Catalog, Fulfillment, Portal, Dashboard)
Owns the modules that are more independent of each other and of Dev A's core spine, plus everything customer-facing.

| Module | Backend folder | Frontend folder | Screens |
|---|---|---|---|
| M1 — Catalog & Pricing | `src/modules/catalog/` | `frontend/src/app/(workspace)/workspace/catalog/` | Admin |
| M3 — Fulfillment & Warehouse | `src/modules/fulfillment/` | `frontend/src/app/(workspace)/workspace/fulfillment/` | 7, 8 |
| M5 — Customer Portal | `src/modules/portal/` | `frontend/src/app/portal/` | 11 |
| M6 — Dashboard | `src/modules/dashboard/` | `frontend/src/app/(workspace)/workspace/` (page.tsx) | 2 |
| M6 — Deal Health | `src/modules/dashboard/` | `frontend/src/app/(workspace)/workspace/deal-health/` | 14 |
| M6 — Reports | `src/modules/dashboard/` | `frontend/src/app/(workspace)/workspace/reports/` | 15 |
| Upsell/Cross-sell (optional depth) | `src/modules/upsell/` | plugs into Dev A's quotation builder UI as a component | — |

**Specifically builds:**
- Product/price list CRUD + admin config screens (Warehouses, Discount Tiers config UI, Subscription Plans config UI)
- Warehouse split algorithm + fulfillment screens (Screens 7-8: list + accept/override UI)
- Backorder detection + consolidation prompt
- Customer portal: separate auth, quotation view, comment/counter-discount UI (Screen 11)
- Dashboard home with widgets: Pending Approvals, Open Quotations, At-Risk Deals, Recent Activity (Screen 2)
- Deal Health dashboard: stalled deals, discount anomalies, delivery slippage (Screen 14)
- Reports with filters and export (Screen 15)
- Upsell suggestion panel (calls Dev A's quotation to know current cart, but is its own component/service)

---

## 3. Where the Two Intersect (and how to handle it without conflict)

There are exactly **three integration points** where B's work depends on A's work (or vice versa). Handle each like this:

### Intersection 1: Portal counter-discount → must call A's `transitionQuotation()` + `evaluate_quotation()`
**Fix:** Dev A exposes these as **exported functions from a shared service file** (`src/shared/services/riskScoreEngine.ts` and `src/modules/quotation/quotationService.ts`, specifically exporting `transitionQuotation()`). Dev B **imports and calls** them from the portal module — Dev B never edits Dev A's files, only imports from them. Agree on the function signature in Phase 0 so Dev B can build against a stub/mock before Dev A's implementation is even done.

### Intersection 2: Warehouse split triggers after Quotation reaches APPROVED/CONFIRMED status
**Fix:** Dev A's quotation state machine emits an event/calls a hook (`onQuotationConfirmed(quotation)`) rather than directly importing Dev B's fulfillment module. Dev B's fulfillment module registers itself as a listener. This is a simple **event-emitter pattern** — Dev A's file doesn't need to know Dev B's module exists, avoiding any shared edit.
```js
// src/shared/events.ts (built in Phase 0)
export const dealEvents = new EventEmitter();

// Dev A's quotation service, calls only this:
dealEvents.emit('quotation.confirmed', quotation);

// Dev B's fulfillment module, in his own file:
dealEvents.on('quotation.confirmed', handleFulfillmentSplit);
```

### Intersection 3: Upsell panel needs current cart state from A's Quotation Builder UI
**Fix:** Dev B builds the Upsell Panel as a **standalone React component** (`<UpsellPanel cartProductIds={} onAdd={} />`) with clearly defined props. Dev A simply imports and renders it inside the Quotation Builder page, passing in the current cart state. Dev B never touches Dev A's page file beyond this one line; Dev A never touches Dev B's component internals.

**General rule for all three:** whenever one module needs to "call into" the other, expose a function/component/event with an **agreed interface decided in Phase 0**, and each dev builds their side of that interface independently, even mocking the other side temporarily if needed.

---

## 4. Avoiding Route-Registration Conflicts (backend)

A common hidden conflict: both devs need to add their module's routes to the main Express/Nest app, and if that's one shared `app.ts` file, every route addition is a merge conflict waiting to happen.

**Fix — auto-registration pattern:**
```js
// src/app.ts (built once in Phase 0, never touched again)
import fs from 'fs';
const modulesPath = path.join(__dirname, 'modules');
fs.readdirSync(modulesPath).forEach(moduleName => {
  const routes = require(`./modules/${moduleName}/routes`);
  app.use(`/api/${moduleName}`, routes.default);
});
```
Each dev just creates a `routes.ts` file inside their own module folder — `app.ts` never needs editing again after Phase 0.

Same pattern on the frontend with React Router — use a routes config array per module folder, and a Phase-0-built loader that combines them, rather than both devs editing one big `<Routes>` block in `App.tsx`.

---

## 5. Avoiding Seed Data Conflicts

**Fix:** `prisma/seed.ts` (skeleton built in Phase 0) just calls separate functions from separate files:
```js
// prisma/seed.ts (Phase 0, frozen)
import { seedCatalogAndWarehouses } from './seeds/catalogSeed';   // Dev B's file
import { seedQuotationsAndDiscounts } from './seeds/quotationSeed'; // Dev A's file

async function main() {
  await seedCatalogAndWarehouses();
  await seedQuotationsAndDiscounts();
}
main();
```
Each dev only edits their own seed file, never the main `seed.ts` orchestrator (unless adding a new one-line import — small, low-risk, quick to merge).

---

## 6. Git Workflow

- **`main`** — protected, always demo-able. Only merge via PR, even solo.
- **Branch naming**: `feature/<module-name>` — e.g., `feature/quotation-engine`, `feature/warehouse-split`, `feature/customer-portal`.
- **Merge frequently, in small chunks** — don't let a branch live more than a few hours before merging back to `main`. Long-lived branches are what cause painful conflicts; frequent small merges of module-scoped work (which by this plan touches almost no shared files) merge cleanly almost every time.
- **Rebase, don't merge-commit**, for your own feature branches before opening a PR — keeps history clean, and since your changes are isolated to your own folders, rebase conflicts should be rare-to-none.
- **Integration checkpoints**: after each phase (see timeline below), both devs pull `main`, run the app together, and manually verify the Section-3 intersection points actually work end-to-end before moving to the next phase.

---

## 7. Timeline With Ownership

| Phase | Dev A | Dev B | Shared? |
|---|---|---|---|
| **Phase 0** (2-3 hrs) | — | — | ✅ Pair together: schema, auth, shared types, event bus, route auto-registration, seed skeleton, navigation layout |
| **Phase 1** | Quotation CRUD + builder UI (Screens 3-4, no approval logic yet) | Catalog/Product CRUD + admin config UI | Independent — no shared files touched |
| **Phase 2** | Risk score engine + approval state machine + approval UI (Screens 5-6). **Validate against worked example.** | Warehouse split algorithm + stock model + fulfillment UI (Screens 7-8) | Independent, but agree on `dealEvents` event names before starting |
| **Phase 3** | Subscriptions list/detail (Screens 9-10) + billing schedule + proration logic | Customer Portal (Screen 11: auth, negotiation UI) — calls Dev A's exported `transitionQuotation()` | One import dependency (Intersection 1) — mock it if Dev A isn't done yet |
| **Phase 4** | Invoices list/detail (Screens 12-13) + helps wire upsell panel into Quotation Builder | Dashboard home (Screen 2), Deal Health (Screen 14), Reports (Screen 15) + Upsell suggestion logic | Dev B delivers `<UpsellPanel />` as standalone component (Intersection 3) |
| **Phase 5** | Both: seed realistic demo data (own seed files), rehearse the 8-step test flow together, prep architecture diagram | | ✅ Together |

---

## 8. Daily Sync Checklist (quick, prevents drift)

At the start of each work session:
1. Both pull `main`.
2. Quick 5-minute check: "did either of our modules change an agreed shared interface (event name, function signature, type shape)?" If yes, fix it together immediately — don't let it drift for hours.
3. Confirm which phase/intersection you're both working toward next.

At the end of each work session:
1. Merge your module's branch back to `main` (small, frequent merges — don't wait until a module is "fully polished").
2. Quick smoke test: does `main` still run end-to-end?

---

## 9. Summary — Why This Avoids Merge Conflicts

- **Separate folders per module** → each dev's files are physically distinct; git rarely sees overlapping diffs.
- **Frozen shared files after Phase 0** (schema, types, auth, event bus, app skeleton) → the few genuinely shared files are built once, together, and not touched individually afterward except via small, quick, one-line additions.
- **Auto-registration patterns** (routes, seed orchestration) → eliminates the classic "everyone edits the same index file" conflict source.
- **Event-emitter + exported-function + component-prop interfaces** for the 3 genuine intersection points → each dev builds against an agreed contract independently, without needing to edit the other's files.
- **Small, frequent merges** → conflicts are easier to resolve (if they ever occur) because branches never drift far from `main`.