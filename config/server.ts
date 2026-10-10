import type { Core } from '@strapi/strapi';

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
      '0 */6 * * *': async ({ strapi }) => {
        if (process.env.CATALOG_RECONCILIATION_ENABLED === 'true') {
          await strapi.service('api::catalog-sync.catalog-sync').reconcile();
        }
      },
    },
  },
});

export default config;
