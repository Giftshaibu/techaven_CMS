import { parseSyncPayload, SyncPayloadError } from '../../../utils/catalog-sync';

async function sync(ctx: any, kind: 'product' | 'shop') {
  try {
    const payload = parseSyncPayload(kind, ctx.request.body);
    const result = await strapi.service('api::catalog-sync.catalog-sync').upsert(kind, payload);
    strapi.log.info(JSON.stringify({ event: 'catalog_sync_upsert', kind, externalId: payload.externalId, operation: result.operation }));
    ctx.status = result.operation === 'created' ? 201 : 200;
    ctx.body = {
      data: {
        operation: result.operation,
        externalId: result.record.externalId,
        documentId: result.record.documentId,
      },
    };
  } catch (error) {
    if (error instanceof SyncPayloadError) return ctx.badRequest(error.message, { fields: error.fields });
    strapi.log.error(JSON.stringify({ event: 'catalog_sync_upsert_failure', kind, message: (error as Error).message }));
    throw error;
  }
}

export default {
  product(ctx: any) { return sync(ctx, 'product'); },
  shop(ctx: any) { return sync(ctx, 'shop'); },
};
