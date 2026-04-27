export type Marketplace = 'LAZADA' | 'SHOPEE';

export interface MarketplaceProduct {
  externalId: string;
  title: string;
  imageUrl: string;
  storeName: string;
  price: number;
  currency: string;
  url: string;
}

export interface MarketplaceAdapter {
  readonly marketplace: Marketplace;

  /** Parse a Lazada/Shopee product URL or raw SKU into an externalId. */
  parseUrl(input: string): { externalId: string } | null;

  /** Fetch product details for a given externalId. */
  fetchProduct(externalId: string): Promise<MarketplaceProduct>;
}

export class AdapterError extends Error {
  constructor(message: string, public readonly cause?: unknown) {
    super(message);
    this.name = 'AdapterError';
  }
}
