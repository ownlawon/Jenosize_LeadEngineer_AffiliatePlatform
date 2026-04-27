import { lazadaMockAdapter } from './lazada.mock';
import { shopeeMockAdapter } from './shopee.mock';
import { Marketplace, MarketplaceAdapter } from './types';

const registry: Record<Marketplace, MarketplaceAdapter> = {
  LAZADA: lazadaMockAdapter,
  SHOPEE: shopeeMockAdapter,
};

export function getAdapter(marketplace: Marketplace): MarketplaceAdapter {
  return registry[marketplace];
}

/**
 * Detect the marketplace by URL host. Returns null if unsupported.
 * Used for "smart paste" of a product URL without choosing marketplace upfront.
 */
export function detectMarketplace(input: string): Marketplace | null {
  try {
    const url = new URL(input);
    if (url.hostname.endsWith('lazada.co.th') || url.hostname.endsWith('lazada.com')) {
      return 'LAZADA';
    }
    if (url.hostname.endsWith('shopee.co.th') || url.hostname.endsWith('shopee.com')) {
      return 'SHOPEE';
    }
  } catch {
    /* fallthrough */
  }
  return null;
}

export function listMarketplaces(): Marketplace[] {
  return Object.keys(registry) as Marketplace[];
}
