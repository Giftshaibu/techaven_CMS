import { describe, expect, it } from 'vitest';
import { isStaleEvent, parseSyncPayload, SyncPayloadError } from '../../src/utils/catalog-sync';

describe('catalog sync payloads', () => {
  it('coerces numeric IDs and accepts the product contract', () => {
    expect(parseSyncPayload('product', {
      externalId: 123, slug: 'phone', name: 'Phone', active: true,
      thumbnailUrl: 'https://cdn.example/phone.webp', sourceUpdatedAt: '2026-09-25T08:20:00Z',
    })).toMatchObject({ externalId: '123', slug: 'phone', active: true });
  });

  it('rejects commerce-authoritative and unknown fields', () => {
    expect(() => parseSyncPayload('product', {
      externalId: '1', slug: 'phone', name: 'Phone', active: true, price: 100,
    })).toThrow(SyncPayloadError);
  });

  it('accepts namespaced marketplace device IDs', () => {
    expect(parseSyncPayload('product', {
      externalId: 'device:123', slug: 'galaxy-a26', name: 'Galaxy A26', active: false,
      brand: 'Samsung', category: 'Smartphones', sourceUpdatedAt: '2026-10-10T08:20:00Z',
    })).toMatchObject({ externalId: 'device:123', slug: 'galaxy-a26', active: false });
  });

  it('identifies only older events as stale', () => {
    expect(isStaleEvent('2026-09-25T10:00:00Z', '2026-09-25T09:00:00Z')).toBe(true);
    expect(isStaleEvent('2026-09-25T10:00:00Z', '2026-09-25T10:00:00Z')).toBe(false);
  });
});
