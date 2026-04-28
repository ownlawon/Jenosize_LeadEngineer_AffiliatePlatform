import { z } from 'zod';

export const MarketplaceSchema = z.enum(['LAZADA', 'SHOPEE']);
export type Marketplace = z.infer<typeof MarketplaceSchema>;

// --- Pagination ---
export interface Paginated<T> {
  items: T[];
  total: number;
  page: number;
  pageSize: number;
  pageCount: number;
}

// --- Auth ---
export const LoginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8).max(128),
});
export type LoginInput = z.infer<typeof LoginSchema>;

// --- Product ---
export const CreateProductSchema = z.object({
  url: z.string().min(1).max(2048),
  marketplace: MarketplaceSchema.optional(),
});
export type CreateProductInput = z.infer<typeof CreateProductSchema>;

export interface OfferDto {
  id: string;
  marketplace: Marketplace;
  storeName: string;
  price: number;
  currency: string;
  externalUrl: string;
  externalId: string;
  lastCheckedAt: string;
  bestPrice?: boolean;
}

export interface ProductDto {
  id: string;
  title: string;
  imageUrl: string;
  createdAt: string;
  offers: OfferDto[];
}

// --- Campaign ---
export const CreateCampaignSchema = z
  .object({
    name: z.string().min(1).max(100),
    utmCampaign: z
      .string()
      .min(1)
      .max(80)
      .regex(/^[a-zA-Z0-9_\-]+$/, 'UTM campaign must be alphanumeric, underscore, or dash'),
    utmSource: z.string().max(80).optional(),
    utmMedium: z.string().max(80).optional(),
    startAt: z.string().datetime(),
    endAt: z.string().datetime(),
  })
  .refine((d) => new Date(d.endAt) > new Date(d.startAt), {
    message: 'endAt must be after startAt',
    path: ['endAt'],
  });
export type CreateCampaignInput = z.infer<typeof CreateCampaignSchema>;

export interface CampaignDto {
  id: string;
  name: string;
  utmSource: string;
  utmMedium: string;
  utmCampaign: string;
  startAt: string;
  endAt: string;
  active: boolean;
}

// --- Link ---
export const CreateLinkSchema = z.object({
  productId: z.string().min(1),
  campaignId: z.string().min(1),
  marketplace: MarketplaceSchema,
});
export type CreateLinkInput = z.infer<typeof CreateLinkSchema>;

export interface LinkDto {
  id: string;
  shortCode: string;
  shortUrl: string;
  productId: string;
  campaignId: string;
  marketplace: Marketplace;
  targetUrl: string;
  createdAt: string;
  clickCount?: number;
}

// --- Dashboard ---
export interface DashboardSummary {
  totalClicks: number;
  totalLinks: number;
  totalProducts: number;
  totalCampaigns: number;
  byMarketplace: Array<{ marketplace: Marketplace; clicks: number }>;
  byCampaign: Array<{ campaignId: string; name: string; clicks: number }>;
  clicksLast7Days: Array<{ date: string; clicks: number }>;
}

export interface TopProduct {
  productId: string;
  title: string;
  imageUrl: string;
  clicks: number;
}
