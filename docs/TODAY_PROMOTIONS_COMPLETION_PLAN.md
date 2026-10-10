# Techaven Promotions: Complete Implementation Plan

Date: 26 September 2026
Implementation scope: `/home/giftshaibu/Documents/techaven_promotion` and `/home/giftshaibu/Documents/techaven/techaven_version1`
Read-only dependency: `/home/giftshaibu/Documents/techaven_backend`

## Implementation result — 26 September 2026

The CMS contract, layout-specific validation, grouped records, dedicated storefront renderers, header placements, campaign template, fallback hero, analytics hooks, image-backed starter content, tests, documentation, and Docker deployment described below are now implemented. Thirteen published starter records and their artwork are stored in PostgreSQL/Strapi; automatic reseeding is disabled after the successful import.

Verified today: Strapi type-check, 13 Strapi tests, Strapi production build, healthy Docker/PostgreSQL services, public API and permission smoke tests, 6 frontend promotion tests, changed-file lint, frontend production build, Impeccable detector, and desktop/mobile browser renders. Repository-wide frontend lint still contains pre-existing formatting failures outside this promotion scope.

The only external dependency intentionally left unimplemented is the commerce-backend work in `docs/commerce-contracts.md`. Promotion product/shop sections already use the documented batch API when available and the bounded existing individual-endpoint fallback until the backend developer ships it. Starter campaign product/shop relationships must be assigned after matching catalog mirrors have been synchronized; Strapi never invents commerce records, prices, inventory, or ratings.

## Source of truth

The finished implementation must satisfy all requirements in:

- `TECHAVEN_PROMOTION_VISUAL_DIRECTION.md`
- `TECHAVEN_PROMOTION_FRONTEND_SLOTS.md`
- `backmarket.md`
- `TECHAVEN_STRAPI_PROMOTIONS_BACKEND.md`

The commerce backend will not be edited. Required commerce changes remain documented in `docs/commerce-contracts.md`. The frontend must work with the current individual product and shop endpoints and switch automatically to batch endpoints when the backend team implements them.

## Required outcome

Techaven must have a controlled, image-led promotion system that marketing manages from Strapi. The storefront owns the component designs, responsive behavior, accessibility, commerce-data resolution, and failure handling. Strapi supplies copy, artwork, schedules, targeting, CTAs, and product or shop references.

The promotion system is complete when marketing can create the approved campaign formats without changing frontend code, the storefront still works when Strapi is unavailable, and every major promotion looks like part of a curated electronics marketplace rather than a generic text banner.

## Current implementation status

### Implemented and reusable

- Strapi 5 service backed by PostgreSQL and Docker.
- Draft and Publish for promotions.
- Public active-placement and campaign-slug endpoints.
- UTC start and end scheduling.
- Priority sorting.
- Desktop background, mobile background, foreground, and SEO media fields.
- Primary and secondary CTAs.
- Targeting by category, shop, brand, and campaign.
- Product and shop mirror content types.
- Authenticated catalog-sync endpoints.
- Sync-token policy and payload validation.
- Public response normalization and metadata filtering.
- Frontend Zod validation and CMS request timeout.
- Central CTA target resolver.
- Batch-first product and shop lookup with bounded individual-request fallback.
- Route slots on home, category, search, deals, shops, shop detail, product detail, products, catalogs, and campaign pages.
- Campaign route at `/promotions/$slug`.
- Header announcement and mega-menu CMS requests.
- CORS support for localhost, loopback, and the current LAN development origin.
- Seven starter promotion records stored in PostgreSQL.
- Strapi tests, type-check, production build, and frontend production build.

### Partially implemented

- `PromotionSlot` selects eligible records but treats most layouts as the same generic copy block.
- Product and shop rails resolve live commerce records but lack the finished promotion-specific section design.
- Campaign pages render a hero and three optional slots but do not contain the complete campaign shopping structure.
- Header promotions use CMS content but the mega-menu treatment is a basic text panel.
- Media fields work, but the starter promotions have no Strapi-managed artwork.
- Placement targeting works, but multi-record pair and collection semantics are undefined.
- Analytics emits a basic click event without the required promotion metadata or impression event.
- The frontend suppresses CMS errors, but the default homepage hero was removed and must be restored.

### Missing

- Distinct visual components for every approved promotion family.
- Back Market-style two-card image promotion.
- Hero with an embedded live product card.
- Service and utility promotion grid.
- Other Ways to Save promotion-card rail.
- Flash-deal module and real countdown.
- Full-width lifestyle banner.
- Coupon and instruction block.
- Complete promotion landing-page composition.
- Related-campaign discovery.
- Current-campaign exclusion.
- Strapi-managed starter artwork.
- Layout-specific CMS validation.
- Multi-record group behavior.
- Complete automated frontend coverage.
- Desktop and mobile visual acceptance review.

## 1. Finalize the Strapi content contract

Keep `Promotion` as the single editor-facing collection type. Do not introduce a generic page builder.

### Add controlled layouts

Extend the layout enum to:

```text
hero
hero_product
split
banner
lifestyle_banner
product_rail
product_grid
shop_rail
service_grid
card_rail
flash_deals
coupon
editorial
announcement
```

Each layout maps to one frontend component. Unknown layouts return `null`.

### Add controlled presentation variants

Add one optional `presentation` enum:

```text
standard
product_led
lifestyle
dark_editorial
image_top
image_side
image_right
background_image
compact
```

The frontend validates which presentations are legal for each layout. Marketing cannot specify CSS, colors, typefaces, dimensions, or grid rules.

### Add multi-record grouping

Add optional `slotGroup` and integer `groupOrder` fields.

- A single slot renders its highest-priority eligible record.
- A pair slot selects the highest-priority eligible record, then includes the next valid record with the same `slotGroup`.
- A collection slot selects up to the registry limit from the same `slotGroup`, ordered by `groupOrder`, priority, then creation time.
- Records without a group remain valid for single-content layouts.

Use this for split pairs, service grids, and promotional card rails.

### Add layout-specific fields

- `imagePosition`: `left`, `right`, `top`, or `background`.
- `showCountdown`: boolean, default `false`.
- `couponCode`: short string.
- `instructionOne`, `instructionTwo`, `instructionThree`: optional short strings.
- `campaignIntro`: long text for campaign landing pages.
- `anchorProduct`: optional one-to-one reference to External Product.
- `secondaryProducts`: optional many-to-many relation to External Product.

The existing `products` relation supplies the primary product rail or grid. The existing `shops` relation supplies featured shops. `secondaryProducts` supplies the second product section on a campaign page.

### Extend validation

- `hero_product` requires one active anchor product.
- `split`, `service_grid`, and `card_rail` require a non-empty `slotGroup`.
- `flash_deals` requires at least two active products, `startsAt`, `endsAt`, and `showCountdown=true`.
- `coupon` requires a coupon code or at least two instruction fields.
- Product rail and grid require at least two active products.
- Shop rail requires at least two active shops.
- Background-image presentation requires desktop artwork.
- CTA, HTTPS, schedule, targeting, and enum validation remains centralized in Document Service middleware.
- Validation errors must name the affected admin field.

### Normalize the public response

Add the new controlled fields, anchor-product reference, and secondary-product references. Continue excluding notes, internal names, publication metadata, and unused Strapi fields.

### Preserve existing records

Add an idempotent data migration:

- Existing layouts remain valid.
- Existing split records receive `presentation=image_top` unless already set.
- Existing starter pair records receive the same `slotGroup` and explicit order.
- The migration records completion so it does not rewrite editor changes on later starts.

## 2. Replace the generic frontend renderer

Create this component structure:

```text
src/components/promotions/
  PromotionSlot.tsx
  PromotionRenderer.tsx
  PromotionErrorBoundary.tsx
  PromotionMedia.tsx
  PromotionAction.tsx
  PromotionHero.tsx
  PromotionHeroProduct.tsx
  PromotionBanner.tsx
  PromotionSplit.tsx
  PromotionProductRail.tsx
  PromotionProductGrid.tsx
  PromotionShopRail.tsx
  PromotionServiceGrid.tsx
  PromotionCardRail.tsx
  PromotionFlashDeals.tsx
  PromotionLifestyleBanner.tsx
  PromotionCouponExplainer.tsx
  PromotionEditorialBlock.tsx
  PromotionAnnouncement.tsx
  promotion-placements.ts
```

### Promotion placement registry

The registry defines:

- Placement string
- Allowed layouts
- Cardinality: single, pair, or collection
- Maximum record count
- Minimum valid commerce-reference count
- Whether a fallback is permitted
- Allowed page contexts

Components and routes must import registry constants rather than duplicate placement strings.

### Shared rendering rules

- Use Techaven colors, Public Sans, and Source Serif 4 for selected editorial headlines.
- Use modest 12 to 16px radii.
- Use hairline borders or flat surfaces, not heavy shadows.
- Do not use gradients, glass effects, wide-tracked uppercase labels, or dashboard-style cards.
- Use `PromotionMedia` for every CMS image.
- Hide failed images without leaving an empty visual column.
- Stack naturally on mobile with the CTA kept visible.
- Use an `h1` for page and campaign heroes; lower slots use the correct heading level supplied by page context.
- Provide visible keyboard focus and at least 44px interactive targets.
- Respect reduced motion.

## 3. Implement every approved promotion family

### Large campaign hero

- Desktop copy width: 40 to 55 percent.
- Desktop media width: 45 to 60 percent.
- Variants: product-led, lifestyle, and dark editorial.
- One primary CTA; secondary CTA only where the record explicitly contains it.
- Use the mobile artwork below 768px.
- Collapse to text-first when artwork fails.

### Hero with live product card

- Resolve the anchor product through the commerce compatibility layer.
- Show live image, name, condition, rating, current price, previous price, and CTA.
- Never read price, rating, inventory, or condition from Strapi.
- Integrate the existing product-card language into the hero rather than create a floating dashboard card.
- Fall back to the normal campaign hero if the anchor product cannot resolve.

### Back Market-style split promotion pair

- Render two records from the same `slotGroup`.
- Each card has prominent artwork, headline, short copy, and CTA.
- Support image-top and image-side variants.
- Use pale neutral or Techaven-soft backgrounds.
- Render side by side on desktop and stacked on mobile.
- If one card fails validation or media loading, render the surviving card as a full-width banner.
- If both fail, return `null`.

### Product promotion rail and grid

- Reuse `ProductRail` and `ProductGrid`.
- Resolve references in CMS order.
- Skip missing or inactive products.
- Require two valid products.
- Keep the section heading and supporting copy separate from the product cards.

### Shop promotion rail

- Reuse `ShopCard` and the existing horizontal rail.
- Require two valid shops.
- Keep shop data owned by commerce.

### Service and utility grid

- Render up to three grouped records.
- Use for trade-in, repair, protection, delivery, warranty, buyer protection, business purchasing, or student services.
- Each card includes concise copy, a CTA, and substantial product or service artwork.
- Do not replace artwork with a generic icon-card grid.

### Other Ways to Save card rail

- Render three to four cards on desktop.
- Show approximately 1.3 cards on mobile with horizontal scrolling and snap behavior.
- Use for related campaigns and cross-links.
- Preserve concise copy and compact CTAs.

### Flash deals

- Use real CMS start and end timestamps.
- Calculate the countdown from the end time.
- Stop rendering at expiry.
- Reuse the product rail.
- Do not show fake urgency or a countdown without a real active offer.

### Full-width lifestyle banner

- Use a large CMS-managed lifestyle image.
- Position the text block according to the controlled image position.
- Add an accessible foreground scrim only when needed for contrast.
- Fall back to a themed text banner if the artwork fails.

### Coupon and instruction block

- Show the real coupon code and two or three CMS-managed steps.
- Provide a copy-code control with accessible status feedback.
- Do not show the layout when the record lacks meaningful instructions.

### Editorial block and announcement

- Editorial blocks may use Source Serif 4 for the headline.
- Announcements stay compact and dismissible.
- Announcement dismissal lasts for the browser session and is keyed by promotion ID so a new announcement can appear.

## 4. Finish the header promotions

### Announcement bar

- Fetch `site_announcement` without blocking the header.
- Render headline and optional CTA.
- Preserve dismissal state per promotion ID.
- Avoid layout shift after hydration by server-loading it or reserving only its exact active height.

### Mega-menu promotion

- Replace the text panel with a compact image-led promotion card.
- Use foreground or background artwork from Strapi.
- Allow category targeting so different menu categories can show different records.
- Preserve the category navigation, brand links, and featured-shop links.
- Hide the promotional column cleanly when no valid record exists and redistribute the grid columns.

## 5. Correct storefront placement and density

### Homepage

Use this order:

```text
Header and announcement
CMS campaign hero or default Techaven hero
Category shortcuts
Hot products
Back Market-style split promotion pair
Browse by category
Featured shops
CMS product promotion rail
Service promotion grid
Recommended products
Other Ways to Save rail
Footer
```

Show no more than five promotional sections. Do not count the header announcement as a page section.

### Category page

- Keep the category heading and filters ahead of promotions.
- Insert the first promotion between product groups.
- Insert the second promotion later in the product flow.
- Do not place both promotions before the catalog.
- Apply category and brand targeting centrally.

### Deals page

```text
Deals hero
Flash deals
Product grid
Inline lifestyle or campaign banner
More deals
Other Ways to Save rail
```

Only render the flash module when it has a valid schedule and products.

### Search, shops, shop detail, product detail, and catalogs

- Render no more than one contextual promotion per route.
- Do not interrupt empty, error, or loading states with a promotion.
- Do not replace core commerce content.
- Apply route context through the central targeting matcher.

## 6. Complete the promotion landing page

Build `/promotions/$slug` as a fixed template:

```text
Header
Campaign breadcrumb
Campaign hero
Campaign introduction
Primary curated product rail
promotion_page_inline_1
Featured shops
promotion_page_inline_2
Secondary curated product grid
Editorial campaign section
promotion_page_inline_3
Other Ways to Save
Related active campaigns
Footer
```

### Campaign behavior

- Fetch the campaign and optional sections in parallel.
- Redirect missing, draft, future, expired, or unreachable campaigns to `/deals`.
- Use the campaign record's `products`, `secondaryProducts`, and `shops` relations.
- Exclude the current campaign ID and slug from every inline and related section.
- Wrap hero, product, shop, inline, and related sections in independent error boundaries.
- Render all surviving sections when another section fails.
- Use CMS SEO title, description, and image with safe fallbacks.
- Keep the standard Techaven header, search, cart, account, and footer.

## 7. Restore reliability requirements

### Homepage fallback

Restore a polished `DefaultHomeHero` owned by the frontend. It is functional brand content, not an editor-managed promotion.

Render it when:

- Strapi times out.
- Strapi is offline.
- The CMS response is invalid.
- No active `home_hero` record exists.
- The active hero fails during rendering.

### Parallel loading

- Load commerce and CMS requests independently.
- Use `Promise.allSettled` in route loaders that combine multiple external services.
- A rejected CMS request must resolve to an empty promotion result.
- Core commerce output must remain available.

### Failure behavior

- Missing promotion: return `null`.
- Unknown layout or presentation: return `null` and log a sanitized development event.
- Invalid CTA: omit the CTA and keep usable content.
- Missing image: use text-first composition.
- Missing product or shop: skip the record.
- Rail below minimum: return `null`.
- Optional section error: remove only that section.

### Analytics hooks

Emit non-blocking events:

```text
promotion_impression
promotion_click
promotion_product_click
promotion_shop_click
```

Include promotion ID, slug, placement, layout, presentation, and target. Analytics failure must never affect rendering or navigation.

## 8. Import starter promotions and artwork

Create an idempotent import command, separate from normal application bootstrap.

### Import behavior

- Download the approved existing Unsplash starter assets.
- Save local source copies in a documented seed-assets directory.
- Upload them through the Strapi upload service.
- Reuse an existing media-library asset when its checksum matches.
- Create or update starter promotions by slug without duplicating records.
- Connect uploaded desktop and mobile artwork.
- Publish the records.
- Print a created, updated, skipped, and failed summary.
- Never run automatically in production startup.

### Starter content

- Homepage product-led hero.
- Deals hero.
- Compare-device split card.
- Trade-in split card.
- Category trade-in banner.
- Three service cards.
- Three Other Ways to Save cards.
- Header announcement.
- Category-targeted mega-menu promotion.
- One complete demonstration campaign page with products and shops only when matching synced references exist.

After import, editors own these records. Restarting Strapi must not recreate deleted content.

## 9. Remove obsolete frontend promotion code

- Remove the old generic promotion copy renderer after every layout has a dedicated component.
- Remove hard-coded promotion objects and artwork constants that have migrated to Strapi.
- Remove `PromoTile` and its `ProductGrid` insertion API if no non-CMS consumer remains.
- Keep normal page headers, empty states, commerce labels, and the default homepage fallback.
- Do not classify ordinary commerce copy as a promotion.

## 10. Testing requirements

### Strapi unit tests

- Every placement, layout, and presentation enum.
- Layout-specific required fields.
- Multi-record grouping and ordering.
- Primary and secondary CTA normalization.
- Campaign SEO and media normalization.
- Product, shop, anchor-product, and secondary-product references.
- Schedule boundaries and flash-deal requirements.
- Migration and idempotent import behavior.

### Strapi integration tests

- Published/current records are returned.
- Draft, future, and expired records are excluded.
- Priority and creation-time ordering are deterministic.
- Pair and collection records remain in API order.
- Private notes and Strapi metadata never leak.
- Unknown placements return HTTP 400.
- Raw CRUD routes remain unavailable publicly.

### Frontend unit and component tests

- Zod validation for the complete response.
- Placement registry rules.
- Single, pair, and collection selection.
- Pair degradation from two cards to one.
- Target matching and campaign exclusion.
- Safe CTA resolution.
- Media error collapse.
- Homepage fallback selection.
- Live-product hero fallback.
- Product and shop minimum thresholds.
- Flash-deal countdown and expiry.
- Coupon-code interaction.
- Analytics event payloads.

### Route and failure tests

- Every documented storefront slot.
- Complete campaign page.
- Strapi offline.
- Strapi timeout.
- Invalid CMS response.
- Commerce batch endpoint available.
- Batch endpoint unsupported with individual fallback.
- Partial product and shop failures.
- Campaign redirect to `/deals`.

### Accessibility and responsive tests

- WCAG 2.2 AA contrast.
- Keyboard navigation and focus order.
- Visible focus styling.
- 44px pointer targets.
- Semantic heading order.
- Meaningful image alternative text.
- Dismissible announcement behavior.
- Reduced-motion support.
- 200% zoom and narrow-mobile wrapping.
- Horizontal rails remain operable by keyboard and touch.

## 11. Verification sequence

1. Run Strapi unit and integration tests.
2. Run Strapi type-check.
3. Build the Strapi admin panel with the configured Node heap.
4. Rebuild the Docker image and start PostgreSQL and Strapi.
5. Run public API smoke tests for every placement and a campaign slug.
6. Run frontend unit and route tests.
7. Run changed-file lint and the production build.
8. Verify the storefront with Strapi running.
9. Verify the storefront with Strapi stopped.
10. Capture desktop and mobile screenshots of the homepage, mega menu, category, deals, and campaign page.
11. Run the Impeccable detector once over changed UI files.
12. Complete one consolidated visual correction pass.
13. Repeat the production builds and smoke tests after corrections.

## 12. Documentation and handoff

Update the README and editor guide with:

- A placement map showing where every slot appears.
- Layout and presentation compatibility.
- How to build a paired split section with `slotGroup` and `groupOrder`.
- How to build service and card-rail collections.
- Required fields for flash deals and coupons.
- How to create a complete campaign landing page.
- Image dimensions, crops, focal-position guidance, and alt-text rules.
- Preview, scheduling, publishing, unpublishing, and expiry workflow.
- How to run the starter-content import command.
- How the homepage behaves when Strapi is offline.
- The unresolved commerce batch and incremental-sync contracts.

## Definition of done

The work is complete only when all of the following are true:

- The Back Market-style paired cards render side by side with Strapi-managed artwork.
- A surviving card expands correctly when its partner fails.
- Homepage and deals heroes are image-led and CMS-controlled.
- The homepage has a polished frontend-owned fallback hero for CMS failure.
- A hero can embed a live commerce product card.
- Product rails, product grids, and shop rails use live commerce data.
- Service grids and Other Ways to Save rails are fully implemented.
- Flash deals use real schedules and stop at expiry.
- Lifestyle and coupon layouts are implemented.
- The mega-menu promotion is image-led and supports category targeting.
- The campaign landing page contains the complete fixed shopping structure.
- Current campaigns cannot promote themselves recursively.
- Starter artwork is stored in Strapi's media library.
- Promotional copy and artwork no longer live in frontend constants.
- Empty and invalid slots leave no blank wrappers.
- All commerce routes function with Strapi offline.
- No commerce-backend files were changed.
- Automated tests, type-checks, production builds, Docker health checks, accessibility checks, and desktop/mobile visual review pass.
