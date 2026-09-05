# Upsell Module

**Owner: Dev B**

## Responsibility
- Product pairing suggestions
- Margin-based recommendations
- Promoted product handling
- Cross-sell logic

## Key Files to Implement
- `routes.ts` - Express routes (auto-registered)
- `upsellService.ts` - Business logic
- `upsellController.ts` - Route handlers

## Suggestion Algorithm
```
1. Get current cart product IDs
2. Find product pairings where product_id IN (cart)
3. Exclude products already in cart
4. Calculate margin delta for each suggestion
5. Sort by weight (promoted first, then by margin)
6. Return top 5 suggestions
```

## Integration Points
- **Called by**: Quotation builder UI (as a component)
- **Uses**: Product catalog for margin calculation

## API Endpoints (to implement)
```
GET    /api/upsell/suggestions?productIds=...  - Get suggestions for cart
GET    /api/upsell/pairings                    - List all pairings (admin)
POST   /api/upsell/pairings                    - Create pairing
PUT    /api/upsell/pairings/:id                - Update pairing
DELETE /api/upsell/pairings/:id                - Remove pairing
```

## INTERSECTION POINT 3
Dev B builds this as a standalone component with clear props:
```tsx
<UpsellPanel 
  cartProductIds={['prod1', 'prod2']} 
  customerTier="GOLD"
  onAdd={(productId) => addToQuote(productId)} 
/>
```
Dev A imports and renders this in the Quotation Builder page.
