import { lazadaMockAdapter } from './lazada.mock';

describe('lazadaMockAdapter', () => {
  describe('parseUrl', () => {
    it('parses a canonical product URL', () => {
      expect(lazadaMockAdapter.parseUrl('https://www.lazada.co.th/products/matcha-001.html')).toEqual({
        externalId: 'matcha-001',
      });
    });

    it('parses a URL with -iXXXXX suffix', () => {
      expect(
        lazadaMockAdapter.parseUrl('https://www.lazada.co.th/products/matcha-001-i123456.html'),
      ).toEqual({ externalId: 'matcha-001' });
    });

    it('accepts a raw SKU/externalId', () => {
      expect(lazadaMockAdapter.parseUrl('matcha-001')).toEqual({ externalId: 'matcha-001' });
    });

    it('rejects a non-Lazada host', () => {
      expect(lazadaMockAdapter.parseUrl('https://shopee.co.th/product/123/abc')).toBeNull();
    });

    it('rejects an invalid URL string', () => {
      expect(lazadaMockAdapter.parseUrl('not a url')).toEqual({ externalId: 'not a url' });
      expect(lazadaMockAdapter.parseUrl('')).toBeNull();
    });
  });

  describe('fetchProduct', () => {
    it('returns a product from fixtures', async () => {
      const product = await lazadaMockAdapter.fetchProduct('matcha-001');
      expect(product.externalId).toBe('matcha-001');
      expect(product.title).toContain('Matcha');
      expect(product.price).toBeGreaterThan(0);
      expect(product.url).toContain('lazada.co.th');
    });

    it('throws for unknown externalId', async () => {
      await expect(lazadaMockAdapter.fetchProduct('does-not-exist')).rejects.toThrow(
        /not found in fixtures/i,
      );
    });
  });
});
