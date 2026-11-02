# Dokploy CMS image

## CMS media behind the storefront proxy

For the storefront's `/cms/*` proxy, set `PUBLIC_URL=https://app.techavenmw.com/cms` and `IS_BEHIND_PROXY=true`. Uploaded promotion images preserve this path prefix; `/uploads/...` must become `/cms/uploads/...`, because the storefront reserves its root `/uploads/*` route for commerce images. This corrects missing desktop and mobile hero artwork after migration. Existing absolute external image URLs remain unchanged. Prepared before validation; publish as `gshaibu/techaven-cms:20261103-media` after checks.

Validation completed 3 November 2026: all 20 CMS tests pass; the production Docker build succeeds, and the compiled media helper inside the production image resolves uploads through `/cms/uploads/`. Deploy the `20261103-media` tag in Dokploy after publication. The runtime setting alone does not fix older images because their URL resolver discards the mount prefix. Live desktop/mobile confirmation remains a post-deployment check.

Implementation prepared 31 October 2026 before validation. The Dockerfile builds Strapi from source in a builder stage and copies compiled server/admin output into a non-root runtime. No .env, local database or uploaded artwork is baked into the image. Image: `gshaibu/techaven-cms:20261031`, with `latest` as a convenience alias. Port: 1337. Health: `/api/health`.

Set PostgreSQL credentials, Strapi encryption/signing keys and `PUBLIC_URL` at runtime. For migration, reuse the current Strapi keys securely so encrypted records remain readable. Mount a persistent volume at `/opt/app/public/uploads`; restore local artwork separately from the PostgreSQL dump. Configure the CMS HTTPS domain against port 1337 and set `IS_BEHIND_PROXY=true`. Set `FRONTEND_URL` and `PREVIEW_FRONTEND_URL` to the production storefront origin.

Keep `RESET_LEGACY_CATALOG_ON_BOOT`, `SEED_DEFAULT_PROMOTIONS` and `CATALOG_RECONCILIATION_ENABLED` false during migration. Set the internal commerce URL and matching feed token before later enabling reconciliation. The complete three-app Compose template, secret names, private export helper and database/media restore order are in the backend repository at `docs/DOKPLOY_DEPLOYMENT.md` and `deploy/dokploy.compose.yml`. No remote migration is performed by building or publishing the image.


Validation on 2 November 2026: all 19 CMS tests pass. The production CMS image starts with runtime PostgreSQL configuration; its health endpoint and admin page return HTTP 200, and the container health check passes. Registry publication status is maintained in the backend release receipt.
