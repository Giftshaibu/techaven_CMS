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

  it('reconciles a full snapshot without changing the event cursor', async () => {
    const set = vi.fn();
    const updateMany = vi.fn();
    const findMany = vi.fn().mockResolvedValue([
      { id: 1, externalId: 'device:1' },
      { id: 2, externalId: 'device:2' },
    ]);
    const strapi = {
      store: () => ({ get: vi.fn().mockResolvedValue('20'), set }),
      db: { query: () => ({ findMany, updateMany }) },
      log: { info: vi.fn(), error: vi.fn() },
    } as any;
    const service = createService({ strapi }) as any;
    service.upsert = vi.fn();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({
      ok: true,
      json: async () => ({ data: {
        items: [{ externalId: 'device:1', slug: 'one', name: 'One', active: true, shopIds: ['7'], shopNames: 'Shop' }],
        next_cursor: '1',
        has_more: false,
      } }),
    }));

    await service.reconcileKind('product', 'http://commerce.test', 'secret', true);

    expect(vi.mocked(fetch).mock.calls[0][0].toString()).toContain('after=0&limit=25&snapshot=true');
    expect(service.upsert).toHaveBeenCalledWith('product', expect.objectContaining({ shopIds: ['7'] }));
    expect(updateMany).toHaveBeenCalledTimes(1);
    expect(updateMany).toHaveBeenCalledWith({
      where: expect.objectContaining({ id: 2 }),
      data: expect.objectContaining({ active: false }),
    });
    expect(set).not.toHaveBeenCalled();
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
