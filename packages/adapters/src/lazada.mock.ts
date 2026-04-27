import { AdapterError, MarketplaceAdapter, MarketplaceProduct } from './types';
import fixtures from './fixtures/products.json';

const LAZADA_HOSTS = ['lazada.co.th', 'www.lazada.co.th', 'lazada.com'];

const products = fixtures.LAZADA as Record<string, MarketplaceProduct>;

export const lazadaMockAdapter: MarketplaceAdapter = {
  marketplace: 'LAZADA',

  parseUrl(input: string) {
    const trimmed = input.trim();
    if (!trimmed) return null;

    // Allow raw SKU/externalId
    if (!trimmed.includes('://') && !trimmed.includes('/')) {
      return { externalId: trimmed };
    }

    let url: URL;
    try {
      url = new URL(trimmed);
    } catch {
      return null;
    }

    if (!LAZADA_HOSTS.some((h) => url.hostname === h || url.hostname.endsWith(`.${h}`))) {
      return null;
    }

    // Examples:
    //   /products/matcha-001.html
    //   /products/matcha-001-i12345.html
    const match = url.pathname.match(/\/products\/([a-z0-9-]+?)(?:-i\d+)?\.html/i);
    if (match) return { externalId: match[1] };

    // Fallback: last non-empty path segment
    const segments = url.pathname.split('/').filter(Boolean);
    if (segments.length === 0) return null;
    const last = segments[segments.length - 1].replace(/\.html$/, '');
    return last ? { externalId: last } : null;
  },

  async fetchProduct(externalId: string): Promise<MarketplaceProduct> {
    const base = products[externalId];
    if (!base) {
      throw new AdapterError(`LAZADA product not found in fixtures: ${externalId}`);
    }
    // Simulate small price drift so cron refresh is observable
    const drift = 1 + (Math.random() - 0.5) * 0.05;
    const price = Math.round(base.price * drift);
    return { ...base, price };
  },
};
