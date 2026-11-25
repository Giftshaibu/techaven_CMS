import { describe, expect, it } from 'vitest';
import { normalizePromotion, validatePromotion } from '../../src/utils/promotion';
describe('participating shop promotion mode', () => {
  const rail = { headline: 'Participating shops', placement: 'home_promo_rails', layout: 'banner_with_rail', desktopBackground: { url: '/uploads/rail.jpg' }, useParticipatingOffers: true };
  it('publishes participation rails without unrelated catalogue product references', () => {
    expect(validatePromotion(rail)).toEqual([]);
    expect(validatePromotion({ ...rail, useParticipatingOffers: false }).map(item => item.path)).toContain('railProducts');
  });
  it('exposes an opt-in flag without changing existing promotions', () => {
    expect(normalizePromotion(rail, 'https://cms.example').useParticipatingOffers).toBe(true);
    expect(normalizePromotion({ headline: 'Existing' }, 'https://cms.example').useParticipatingOffers).toBe(false);
  });
});
