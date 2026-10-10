import { afterEach, describe, expect, it, vi } from 'vitest';
import createService from '../../src/api/catalog-sync/services/catalog-sync';

describe('catalog reconciliation feed', () => {
  afterEach(() => vi.unstubAllGlobals());

  it('consumes pages and persists the final cursor', async () => {
    const set = vi.fn();
    const upsert = vi.fn();
    const strapi = {
      store: () => ({ get: vi.fn().mockResolvedValue(null), set }),
      log: { info: vi.fn(), error: vi.fn() },
    } as any;
    const service = createService({ strapi }) as any;
    service.upsert = upsert;
    vi.stubGlobal('fetch', vi.fn()
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { items: [{ externalId: 'device:1', slug: 'one', name: 'One', active: true }], next_cursor: '4', has_more: true } }) })
      .mockResolvedValueOnce({ ok: true, json: async () => ({ data: { items: [], next_cursor: '4', has_more: false } }) }));

    await service.reconcileKind('product', 'http://commerce.test', 'secret');

    expect(upsert).toHaveBeenCalledTimes(1);
    expect(set).toHaveBeenCalledWith({ key: 'product-cursor', value: '4' });
    expect(fetch).toHaveBeenNthCalledWith(1, expect.objectContaining({ pathname: '/api/v2/integrations/promotions/devices' }), expect.objectContaining({ headers: expect.objectContaining({ Authorization: 'Bearer secret' }) }));
  });

  it('does not persist a cursor when a page fails', async () => {
    const set = vi.fn();
    const strapi = { store: () => ({ get: vi.fn().mockResolvedValue('7'), set }), log: { info: vi.fn(), error: vi.fn() } } as any;
    const service = createService({ strapi }) as any;
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: false, status: 503 }));
    await expect(service.reconcileKind('shop', 'http://commerce.test', 'secret')).rejects.toThrow('503');
    expect(set).not.toHaveBeenCalled();
  });
});
