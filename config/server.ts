import type { Core } from '@strapi/strapi';

let reconciliation: Promise<void> | undefined;

async function reconcile(strapi: Core.Strapi, full = false) {
  if (process.env.CATALOG_RECONCILIATION_ENABLED !== 'true') return;
  if (reconciliation) {
    if (!full) return;
    await reconciliation.catch(() => undefined);
  }
  const run = strapi.service('api::catalog-sync.catalog-sync').reconcile(full);
  reconciliation = run;
  try {
    await run;
  } finally {
    reconciliation = undefined;
  }
}

const config = ({ env }: Core.Config.Shared.ConfigParams): Core.Config.Server => ({
  host: env('HOST', '0.0.0.0'),
  port: env.int('PORT', 1337),
  url: env('PUBLIC_URL', `http://localhost:${env.int('PORT', 1337)}`),
  proxy: env.bool('IS_BEHIND_PROXY', false),
  app: {
    keys: env.array('APP_KEYS')!,
  },
  webhooks: {
    populateRelations: env.bool('WEBHOOKS_POPULATE_RELATIONS', false),
  },
  cron: {
    enabled: true,
    tasks: {
      '* * * * *': ({ strapi }) => reconcile(strapi),
      '0 */6 * * *': ({ strapi }) => reconcile(strapi, true),
    },
  },
});

export default config;
