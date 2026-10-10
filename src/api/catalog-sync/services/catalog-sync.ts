import { isStaleEvent, parseSyncPayload } from '../../../utils/catalog-sync';

const UID_BY_KIND = {
  product: 'api::external-product.external-product',
  shop: 'api::external-shop.external-shop',
} as const;

type Kind = keyof typeof UID_BY_KIND;

export default ({ strapi }: { strapi: any }) => ({
  async upsert(kind: Kind, payload: Record<string, unknown>) {
    const uid = UID_BY_KIND[kind];
    const repository = strapi.db.query(uid) as any;

    let current = await repository.findOne({ where: { externalId: payload.externalId } });
    if (current && isStaleEvent(current.sourceUpdatedAt, payload.sourceUpdatedAt)) {
      return { operation: 'ignored_stale', record: current };
    }
    if (current) {
      return strapi.db.transaction(async () => {
        const record = await repository.update({ where: { id: current.id }, data: payload });
        return { operation: 'updated', record };
      });
    }

    try {
      return await strapi.db.transaction(async () => {
        const record = await repository.create({ data: payload });
        return { operation: 'created', record };
      });
    } catch (error) {
      // A concurrent insert may win after the initial lookup. The failed
      // transaction is rolled back before retrying against the unique key.
      current = await repository.findOne({ where: { externalId: payload.externalId } });
      if (!current) throw error;
      if (isStaleEvent(current.sourceUpdatedAt, payload.sourceUpdatedAt)) {
        return { operation: 'ignored_stale', record: current };
      }
      return strapi.db.transaction(async () => {
        const record = await repository.update({ where: { id: current.id }, data: payload });
        return { operation: 'updated', record };
      });
    }
  },

  async reconcile() {
    if (process.env.CATALOG_RECONCILIATION_ENABLED !== 'true') return;
    const baseUrl = process.env.TECHAVEN_COMMERCE_API_URL;
    const token = process.env.TECHAVEN_COMMERCE_API_TOKEN;
    if (!baseUrl || !token) throw new Error('Reconciliation requires commerce API URL and token');

    for (const kind of ['product', 'shop'] as const) {
      await this.reconcileKind(kind, baseUrl, token);
    }
  },

  async reconcileKind(kind: Kind, baseUrl: string, token: string) {
    const store = strapi.store({ type: 'core', name: 'techaven-catalog-sync' });
    const cursorKey = `${kind}-cursor`;
    const priorCursor = (await store.get({ key: cursorKey })) as string | null;
    let cursor = priorCursor || '0';

    try {
      do {
        const resource = kind === 'product' ? 'devices' : 'shops';
        const url = new URL(`/api/v2/integrations/promotions/${resource}`, baseUrl);
        url.searchParams.set('after', cursor);
        url.searchParams.set('limit', '250');
        const response = await fetch(url, {
          headers: { Authorization: `Bearer ${token}`, Accept: 'application/json' },
          signal: AbortSignal.timeout(30_000),
        });
        if (!response.ok) throw new Error(`Commerce API returned ${response.status}`);
        const body = await response.json() as { data?: { items?: unknown[]; next_cursor?: string; has_more?: boolean } };
        if (!body.data || !Array.isArray(body.data.items) || typeof body.data.next_cursor !== 'string' || typeof body.data.has_more !== 'boolean') {
          throw new Error('Commerce API returned an invalid reconciliation payload');
        }
        for (const item of body.data.items) {
          await this.upsert(kind, parseSyncPayload(kind, item));
        }
        const next = body.data.next_cursor;
        if (body.data.has_more && next === cursor) throw new Error('Commerce API cursor did not advance');
        cursor = next;
        if (!body.data.has_more) break;
      } while (true);

      await store.set({ key: cursorKey, value: cursor });
      strapi.log.info(JSON.stringify({ event: 'catalog_reconciliation_complete', kind, cursor }));
    } catch (error) {
      strapi.log.error(JSON.stringify({ event: 'catalog_reconciliation_failed', kind, message: (error as Error).message }));
      throw error;
    }
  },

  async resetLegacyProducts() {
    const marker = strapi.store({ type: 'core', name: 'techaven-catalog-sync' });
    if (await marker.get({ key: 'v2-product-reset-complete' })) return;
    const documents = strapi.documents('api::promotion.promotion');
    const draft = await documents.findMany({ status: 'draft', fields: ['documentId'], pagination: { pageSize: 1000 } });
    const published = await documents.findMany({ status: 'published', fields: ['documentId'], pagination: { pageSize: 1000 } });
    for (const promotion of draft) {
      await documents.update({ documentId: promotion.documentId, status: 'draft', data: { products: [], anchorProduct: null, secondaryProducts: [] } });
    }
    for (const promotion of published) {
      await documents.update({ documentId: promotion.documentId, status: 'published', data: { products: [], anchorProduct: null, secondaryProducts: [] } });
    }
    await strapi.db.query('api::external-product.external-product').deleteMany({ where: {} });
    await marker.delete({ key: 'product-cursor' });
    await marker.set({ key: 'v2-product-reset-complete', value: true });
    strapi.log.info(JSON.stringify({ event: 'v2_product_reference_reset_complete', promotions: new Set([...draft, ...published].map((item) => item.documentId)).size }));
  },
});
