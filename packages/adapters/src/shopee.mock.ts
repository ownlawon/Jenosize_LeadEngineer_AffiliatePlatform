import { AdapterError, MarketplaceAdapter, MarketplaceProduct } from './types';
import fixtures from './fixtures/products.json';

const SHOPEE_HOSTS = ['shopee.co.th', 'shopee.com', 'www.shopee.co.th'];

const products = fixtures.SHOPEE as Record<string, MarketplaceProduct>;

export const shopeeMockAdapter: MarketplaceAdapter = {
  marketplace: 'SHOPEE',

  parseUrl(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return null;

    if (!trimmed.includes('://') && !trimmed.includes('/')) {
      return { externalId: trimmed };
    }

    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      return null;
    }

    if (!SHOPEE_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))) {
      return null;
    }

    // Examples:
    //   /product/123456/matcha-001
    //   /matcha-i.123456.789
    const productPath = url.pathname.match(/\/product\/\d+\/([a-z0-9-]+)/i);
    if (productPath) return { externalId: productPath[1] };

    const itemPath = url.pathname.match(/\/([a-z0-9-]+?)-i\.\d+\.\d+/i);
    if (itemPath) return { externalId: itemPath[1] };

    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return null;
    return { externalId: segments[segments.length - 1] };
  },

  async fetchProduct(externalId: string): Promise<MarketplaceProduct> {
    const base = products[externalId];
    if (!base) {
      throw new AdapterError(`SHOPEE product not found in fixtures: ${externalId}`);
    }
    const drift = 1 + (Math.random() - 0.5) * 0.05;
    const price = Math.round(base.price * drift);
    return { ...base, price };
  },
};
