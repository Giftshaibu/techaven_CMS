import { createRequire } from 'node:module';
import { describe, expect, it } from 'vitest';

const { rewriteUrl, rewriteFormats } = createRequire(import.meta.url)('../../scripts/migrate-r2-media.cjs');
const base = 'https://images.techavenmw.com';

describe('imported R2 media URLs', () => {
  it('maps local uploads to the bucket root and preserves remote media', () => {
    expect(rewriteUrl('/uploads/hero.jpg', base)).toBe(`${base}/hero.jpg`);
    expect(rewriteUrl('uploads/nested/hero.jpg', `${base}/`)).toBe(`${base}/nested/hero.jpg`);
    expect(rewriteUrl('https://other.example/uploads/hero.jpg', base)).toBe('https://other.example/uploads/hero.jpg');
    expect(rewriteUrl(`${base}/hero.jpg`, base)).toBe(`${base}/hero.jpg`);
    expect(rewriteUrl(null, base)).toBe(null);
  });
  it('maps thumbnails without changing dimensions or mutating source metadata', () => {
    const formats = { thumbnail: { url: '/uploads/thumbnail_hero.jpg', width: 100, height: 80 }, small: null };
    const result = rewriteFormats(formats, base);
    expect(result.thumbnail).toEqual({ url: `${base}/thumbnail_hero.jpg`, width: 100, height: 80 });
    expect(result.small).toBe(null);
    expect(formats.thumbnail.url).toBe('/uploads/thumbnail_hero.jpg');
    expect(rewriteFormats(result, base)).toEqual(result);
  });
});
