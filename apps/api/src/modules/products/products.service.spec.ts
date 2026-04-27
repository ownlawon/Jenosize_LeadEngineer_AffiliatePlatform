import { ProductsService } from './products.service';
import { OfferDto } from '@jenosize/shared';

const offer = (overrides: Partial<OfferDto>): OfferDto => ({
  id: 'o1',
  marketplace: 'LAZADA',
  storeName: 'Store',
  price: 100,
  currency: 'THB',
  externalUrl: 'https://lazada.co.th/x',
  externalId: 'x',
  lastCheckedAt: new Date().toISOString(),
  ...overrides,
});

describe('ProductsService.markBestPrice', () => {
  it('returns empty array when no offers', () => {
    expect(ProductsService.markBestPrice([])).toEqual([]);
  });

  it('marks the only offer as bestPrice', () => {
    const result = ProductsService.markBestPrice([offer({ price: 100 })]);
    expect(result[0].bestPrice).toBe(true);
  });

  it('marks the cheapest offer when prices differ', () => {
    const result = ProductsService.markBestPrice([
      offer({ id: 'a', price: 459, marketplace: 'LAZADA' }),
      offer({ id: 'b', price: 425, marketplace: 'SHOPEE' }),
    ]);
    expect(result.find((o) => o.id === 'b')?.bestPrice).toBe(true);
    expect(result.find((o) => o.id === 'a')?.bestPrice).toBe(false);
  });

  it('marks all offers tied at the lowest price', () => {
    const result = ProductsService.markBestPrice([
      offer({ id: 'a', price: 100 }),
      offer({ id: 'b', price: 100 }),
      offer({ id: 'c', price: 200 }),
    ]);
    expect(result.find((o) => o.id === 'a')?.bestPrice).toBe(true);
    expect(result.find((o) => o.id === 'b')?.bestPrice).toBe(true);
    expect(result.find((o) => o.id === 'c')?.bestPrice).toBe(false);
  });

  it('does not mutate the input', () => {
    const input = [offer({ price: 100 })];
    const before = JSON.stringify(input);
    ProductsService.markBestPrice(input);
    expect(JSON.stringify(input)).toBe(before);
  });
});
