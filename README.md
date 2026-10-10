# Techaven Promotions CMS

Standalone Strapi 5 service for Techaven campaigns, artwork, copy, schedules, placements, and curated product/shop references. It is a merchandising layer only: the commerce backend remains authoritative for products, shops, prices, inventory, orders, payments, and discounts.

## Local setup

Requirements: Node 22, npm, Docker, and Docker Compose.

```bash
cp .env.example .env
node -e "const crypto=require('crypto'); for (const name of ['APP_KEYS','API_TOKEN_SALT','ADMIN_JWT_SECRET','TRANSFER_TOKEN_SALT','JWT_SECRET','ENCRYPTION_KEY','STRAPI_SYNC_TOKEN']) console.log(name+'='+crypto.randomBytes(32).toString('base64url'))"
```

Copy the generated values into `.env`. `APP_KEYS` should contain at least two comma-separated generated values. Set a strong `DATABASE_PASSWORD`, then start everything:

Build the compiled Strapi project on the host, then package and start it with Docker. The host build avoids exhausting low-memory Docker Desktop VMs while Docker still runs the immutable production output:

```bash
npm ci
npm run build
docker compose up --build
```

Run `npm run build` again before rebuilding the image whenever application or configuration source changes.

Open `http://localhost:1337/admin` and create the first administrator. Health is available at `GET /api/health`.

For local development with PostgreSQL already running:

```bash
npm ci
npm run develop
```

## Content workflow

For the editor-facing training handbook, including image dimensions, placement maps, field guidance, campaign examples, and publishing checklists, see [docs/CONTENT_MANAGER_GUIDE.md](docs/CONTENT_MANAGER_GUIDE.md).

1. Synchronize products and shops through the internal endpoints.
2. In Content Manager, create a Promotion and upload desktop/mobile artwork.
3. Choose a controlled placement, layout, theme, optional CTA, products/shops, and schedule.
4. Save the draft, use the configured frontend preview when available, and publish.
5. The storefront reads only `/api/promotions/active` or `/api/promotions/:slug` and resolves product/shop references through the commerce API.

Numbered placements map directly to storefront locations. Home uses `home_hero`, `home_banner_1`, `home_product_rail_1`, `home_banner_2`, `home_shop_rail`, and `home_inline_1`; category and campaign pages use their numbered hero/inline placements. Every marketing page hero has a dedicated placement: `categories_hero`, `category_hero`, `products_hero`, `shops_hero`, `shop_hero`, `catalogs_hero`, `deals_hero`, `compare_hero`, `trade_in_hero`, `help_hero`, and `search_hero`. The storefront retains its existing page header as a fallback whenever the CMS record is missing or unavailable.

Campaign landing pages are fixed templates at `/promotions/<slug>`. Publish the campaign document with its hero copy/media and SEO fields, then target `promotion_page_inline_1/2/3` records with the same campaign slug. Use the `promotion_page` CTA target to link to it. Empty targeting fields make a promotion globally eligible for its placement. Product/shop rails and product grids require at least two active references. See `docs/commerce-contracts.md` for the commerce batch-lookup handoff.

The Content Manager Preview action opens a short-lived, signed draft preview in the storefront. Set `PREVIEW_FRONTEND_URL` to one reachable frontend origin, such as `http://localhost:3001`; `FRONTEND_URL` may continue to contain the full comma-separated CORS allowlist. Preview links expire after ten minutes and are never cached. `PREVIEW_SECRET` is optional but recommended in production; when omitted it falls back to `ADMIN_JWT_SECRET`. The frontend must be running and configured with the reachable `VITE_PROMOTIONS_API_URL`.

### Layout authoring guide

| Storefront slot                                                                              | Intended content           | Supported examples                                        |
| -------------------------------------------------------------------------------------------- | -------------------------- | --------------------------------------------------------- |
| `home_hero`                                                                                  | One lead story             | `hero`, `hero_product`, `lifestyle_banner`                |
| `categories_hero`, `products_hero`, `catalogs_hero`                                          | Marketplace discovery      | `hero`, `hero_product`, `lifestyle_banner`                |
| `shops_hero`, `shop_hero`, `trade_in_hero`, `help_hero`, `search_hero`                       | Contextual page heroes     | `hero`, `lifestyle_banner`                                |
| `compare_hero`, `deals_hero`, `category_hero`                                                | Shopping-tool heroes       | controlled hero layouts registered by the storefront      |
| `home_banner_1`                                                                              | Two related image cards    | `split` records sharing a `slotGroup`                     |
| `home_product_rail_1`                                                                        | Live commerce products     | `product_rail`, `product_grid`, `flash_deals`             |
| `home_inline_1`                                                                              | Up to four service stories | grouped `service_grid` records                            |
| `home_banner_2`                                                                              | Other Ways to Save         | three or four grouped `card_rail` records                 |
| `category_hero`, `category_inline_1/2`                                                       | Category-aware stories     | hero, banner, lifestyle, product, or card layouts         |
| `deals_hero`, `deals_inline_1`                                                               | Deal-led content           | lifestyle hero, scheduled flash deals, or product content |
| `search_inline_1`, `shops_inline_1`, `shop_inline_1`, `product_inline_1`, `catalog_inline_1` | One contextual insert      | use the layout choices shown by Strapi                    |
| `promotion_page_hero`, `promotion_page_inline_1/2/3`                                         | Fixed campaign page        | hero plus campaign-targeted shopping/editorial sections   |
| `site_announcement`, `header_mega_menu`                                                      | Header content             | compact announcement or image-led mega-menu card          |

For paired and collection sections, give every member exactly the same `slotGroup`; set `groupOrder` to `1`, `2`, and so on. A split pair can use `image_top` or `image_side`. Service and card rails should normally contain three records. A flash deal needs start and end times, countdown enabled, and at least two product references. A coupon needs a code or at least two instruction fields. A product hero needs an anchor product. Commerce values such as prices and ratings always come from the commerce API.

Use a 16:9 landscape crop of at least 1600×900 for heroes and lifestyle banners, a 4:3 or 1:1 crop of at least 1000px for promotional cards, and a separate portrait-friendly mobile image where the subject would otherwise be cropped. Keep important subjects away from image edges. Write useful media-library alternative text; an explicit promotion override takes precedence, followed by library alt text and then the headline.

### Starter content import

The repository includes a balanced image-backed starter set covering marketplace discovery, shops, seasonal/category merchandising, delivery, protection, help, comparison, trade-in, and the connected page heroes. Build Strapi, then run the explicit importer:

```bash
npm run build
node scripts/import-starter-promotions.js
```

For Docker, rebuild first and run the same importer inside the container:

```bash
docker compose up -d --build strapi
docker compose exec strapi node scripts/import-starter-promotions.js
```

The importer upserts only records with an empty ownership marker or the private `starter-owned:v2` marker. Clear or replace that marker when marketing takes ownership; later imports will skip that record. Automatic startup seeding remains disabled.

The storefront owns a polished homepage hero fallback. If Strapi is unavailable, slow, malformed, or has no active homepage hero, commerce browsing continues and that fallback appears instead.

Create an admin-panel role named **Promotion Editor** under Settings → Administration panel → Roles. Grant Promotion create/read/update/delete/publish, Media Library read/upload/update, and read-only access to External Product and External Shop. Do not grant settings, token, user, or integration-secret permissions.

## API

```bash
curl 'http://localhost:1337/api/promotions/active?placement=home_hero'
curl 'http://localhost:1337/api/promotions/samsung-week'

curl -X POST 'http://localhost:1337/api/internal/catalog-sync/product' \
  -H "Authorization: Bearer $STRAPI_SYNC_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"externalId":19382,"slug":"apple-iphone-15-128gb","name":"Apple iPhone 15 128GB","brand":"Apple","category":"smartphones","thumbnailUrl":"https://cdn.example/image.jpg","active":true,"sourceUpdatedAt":"2026-09-25T08:20:00Z"}'

curl -X POST 'http://localhost:1337/api/internal/catalog-sync/shop' \
  -H "Authorization: Bearer $STRAPI_SYNC_TOKEN" \
  -H 'Content-Type: application/json' \
  --data '{"externalId":221,"slug":"digital-world","name":"Digital World","logoUrl":"https://cdn.example/shop.png","locationLabel":"Lilongwe","verified":true,"active":true,"sourceUpdatedAt":"2026-09-25T08:20:00Z"}'
```

The sync API rejects undeclared fields such as price, stock, customer, seller-private, order, or payment data. Older events are ignored using `sourceUpdatedAt`; deactivation sets `active=false` and never deletes historical references.

Raw generated CRUD routes are not registered. The public surface consists only of health and normalized promotion reads. Sync writes require `STRAPI_SYNC_TOKEN`.

## Reconciliation

Reconciliation runs every six hours only when `CATALOG_RECONCILIATION_ENABLED=true`. It consumes the protected Marketplace v2 device/shop cursor feeds and requires `TECHAVEN_COMMERCE_API_URL` plus `TECHAVEN_COMMERCE_API_TOKEN`. Successful cursors are persisted in Strapi's database store; failed runs retain the prior cursor.

Before enabling it, apply backend migrations, run `npm run catalog:backfill-promotions`, and verify both feeds. Set `RESET_LEGACY_CATALOG_ON_BOOT=true` for one successful CMS boot to clear legacy v1 product relations, then immediately return it to `false`. Keep reconciliation disabled if backfill or connectivity verification fails.

## Validation and verification

```bash
npm run typecheck
npm test
npm run build
docker compose config
```

The unit and contract suites cover promotion schedules, CTA/layout rules, normalization, forbidden sync fields, stale events, route authentication, and private fields. Runtime API behavior should also be smoke-tested against the Docker PostgreSQL service before deployment.

## Production operations

- Terminate HTTPS at a trusted load balancer/reverse proxy, set `PUBLIC_URL`, and set `IS_BEHIND_PROXY=true`.
- Restrict `FRONTEND_URL` to the required origin(s), protect `/admin`, and audit the Promotion Editor role and all public permissions.
- Rotate `STRAPI_SYNC_TOKEN` and Strapi secrets through the deployment secret manager; never commit `.env`.
- Replace local upload storage with a supported object-storage provider before running multiple replicas. Local Docker uploads are persisted but are not shared across hosts.
- Back up both PostgreSQL and uploads. Test restoration into a separate environment. A database backup without matching media is incomplete.
- Monitor `/api/health`, promotion API failures, sync authentication/upsert failures, and reconciliation failures. Logs intentionally omit credentials and authorization headers.
- Test that storefront browsing and checkout remain usable while Strapi is unavailable.

Example database backup and restore:

```bash
docker compose exec -T postgres pg_dump -U techaven -d techaven_cms -Fc > techaven-cms.dump
docker compose exec -T postgres pg_restore -U techaven -d techaven_cms --clean --if-exists < techaven-cms.dump
```

Treat dumps as secrets. Use dated, encrypted, access-controlled storage and practice restores.

## Troubleshooting

- Startup rejects non-PostgreSQL clients by design.
- Production startup fails without `STRAPI_SYNC_TOKEN`.
- Enabling reconciliation without its commerce URL/token fails fast.
- A `400` from sync includes field errors; remove any non-contract fields.
- A promotion missing from the public API is normally a draft, outside its UTC schedule, or assigned to another placement.
- A blank or unavailable preview normally means the frontend at `PREVIEW_FRONTEND_URL` is not running, the signed link expired, or Strapi was rebuilt without the matching frontend preview route. Reopen Preview after restarting the frontend.
- If uploaded files disappear after redeployment, verify the `techaven_cms_uploads` volume mount. Move production media to object storage before horizontal scaling.
