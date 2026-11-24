import { API_URL, api, getToken } from '@/lib/api';

export type MarketMode = 'products' | 'services' | 'both';
export type MarketKind = 'product' | 'service';
export type MarketListing = {
  id: string; shopId: string; shopTitle?: string; kind: MarketKind; title: string; description: string;
  category: string; images: string[]; pricingMode: 'fixed' | 'from' | 'quote'; price?: number | null;
  compareAtPrice?: number | null; currency: string; unitLabel?: string; stockMode: 'tracked' | 'unlimited' | 'unavailable';
  stockQuantity?: number | null; available: boolean; status: string; rating?: number; reviewsCount?: number;
};
export type MarketShop = {
  id: string; ownerId: string; title: string; slug?: string; description: string; businessType: string;
  mode: MarketMode; phone?: string; whatsapp?: string; email?: string; city?: string; country?: string;
  logoUrl?: string; coverUrl?: string; rating?: number; reviewsCount?: number; status: string; verifiedAt?: string | null;
};
export type MarketJob = {
  id: string; shopId?: string; companyName?: string; companyLogoUrl?: string; companyVerified?: boolean;
  offerType: string; title: string; description: string; category?: string; location?: string; workMode?: string;
  employmentType?: string; salaryMin?: number | null; salaryMax?: number | null; currency?: string;
  skills?: string[]; requirements?: string[]; contactMode?: string; available?: boolean; deadlineAt?: string | null;
  status?: string;
};
export type MarketOrder = {
  id: string; publicId?: string; shopId: string; shopTitle?: string; status: string;
  lines: { listingId: string; title: string; imageUrl?: string; quantity: number; unitPrice: number; currency: string }[];
  subtotal: number; deliveryFee: number; total: number; currency: string; deliveryMethod?: string;
  deliveryAddress?: string; buyerPhone?: string; paymentStatus?: string; createdAt?: string;
};
export type MarketCartItem = { listing: MarketListing; quantity: number };
export type MarketFeed = { shops: MarketShop[]; listings: MarketListing[]; featured: MarketListing[]; jobs: MarketJob[]; nextCursor?: string | null };

const base = '/v1/marketplace';
const rows = <T,>(value: unknown): T[] => {
  if (Array.isArray(value)) return value as T[];
  if (value && typeof value === 'object') {
    const item = value as Record<string, unknown>;
    for (const key of ['data', 'items', 'listings', 'shops', 'orders', 'jobs']) if (Array.isArray(item[key])) return item[key] as T[];
  }
  return [];
};
const data = <T,>(value: unknown): T => {
  if (value && typeof value === 'object' && 'data' in value) return (value as { data: T }).data;
  return value as T;
};
const query = (values: Record<string, string | undefined>) => {
  const params = new URLSearchParams();
  Object.entries(values).forEach(([key, value]) => value && params.set(key, value));
  const encoded = params.toString();
  return encoded ? `?${encoded}` : '';
};

export const marketplaceApi = {
  async feed(params: { query?: string; category?: string; kind?: string; cursor?: string } = {}) {
    const payload = data<Partial<MarketFeed>>(await api.get<unknown>(`${base}/feed${query(params)}`)) || {};
    return { shops: payload.shops ?? [], listings: payload.listings ?? [], featured: payload.featured ?? [], jobs: payload.jobs ?? [], nextCursor: payload.nextCursor ?? null };
  },
  shop: async (id: string) => data<MarketShop>(await api.get(`${base}/shops/${encodeURIComponent(id)}`)),
  shopListings: async (id: string) => rows<MarketListing>(await api.get(`${base}/shops/${encodeURIComponent(id)}/listings`)),
  listing: async (id: string) => data<MarketListing>(await api.get(`${base}/listings/${encodeURIComponent(id)}`)),
  myShop: async () => data<MarketShop | null>(await api.get(`${base}/me/shop`)),
  createShop: async (payload: Record<string, unknown>) => data<MarketShop>(await api.post(`${base}/shops`, payload)),
  updateShop: async (id: string, payload: Record<string, unknown>) => data<MarketShop>(await api.patch(`${base}/shops/${encodeURIComponent(id)}`, payload)),
  submitShop: async (id: string) => data<MarketShop>(await api.post(`${base}/shops/${encodeURIComponent(id)}/submit`, {})),
  myListings: async () => rows<MarketListing>(await api.get(`${base}/me/listings`)),
  createListing: async (shopId: string, payload: Record<string, unknown>) => data<MarketListing>(await api.post(`${base}/shops/${encodeURIComponent(shopId)}/listings`, payload)),
  updateListing: async (id: string, payload: Record<string, unknown>) => data<MarketListing>(await api.patch(`${base}/listings/${encodeURIComponent(id)}`, payload)),
  submitListing: async (id: string) => data<MarketListing>(await api.post(`${base}/listings/${encodeURIComponent(id)}/submit`, {})),
  createOrder: async (payload: Record<string, unknown>) => data<MarketOrder>(await api.post(`${base}/orders`, payload)),
  createCheckout: async (id: string) => data<{ id: string; url: string }>(await api.post(`${base}/orders/${encodeURIComponent(id)}/checkout`, { provider: 'fedapay' })),
  confirmCheckout: async (id: string) => data<{ paid: boolean }>(await api.post(`${base}/payments/${encodeURIComponent(id)}/confirm`, {})),
  myOrders: async (scope: 'buyer' | 'seller' = 'buyer') => rows<MarketOrder>(await api.get(`${base}/me/orders?scope=${scope}`)),
  order: async (id: string) => data<MarketOrder>(await api.get(`${base}/orders/${encodeURIComponent(id)}`)),
  sellerStatus: async (id: string, status: string) => data<MarketOrder>(await api.post(`${base}/orders/${encodeURIComponent(id)}/seller-status`, { status })),
  markReceived: async (id: string) => data<MarketOrder>(await api.post(`${base}/orders/${encodeURIComponent(id)}/received`, {})),
  dispute: async (id: string, reason: string) => data<MarketOrder>(await api.post(`${base}/orders/${encodeURIComponent(id)}/disputes`, { reason })),
  requestQuote: async (id: string, payload: Record<string, unknown>) => api.post(`${base}/listings/${encodeURIComponent(id)}/quote-requests`, payload),
  jobs: async (params: Record<string, string | undefined> = {}) => rows<MarketJob>(await api.get(`${base}/jobs${query(params)}`)),
  job: async (id: string) => data<MarketJob>(await api.get(`${base}/jobs/${encodeURIComponent(id)}`)),
  applyToJob: async (id: string, payload: Record<string, unknown>) => api.post(`${base}/jobs/${encodeURIComponent(id)}/apply`, payload),
  myApplications: async () => rows<Record<string, unknown>>(await api.get(`${base}/me/job-applications`)),
  myJobs: async () => rows<MarketJob>(await api.get(`${base}/me/jobs`)),
  createJob: async (payload: Record<string, unknown>) => data<MarketJob>(await api.post(`${base}/jobs`, payload)),
  updateJob: async (id: string, payload: Record<string, unknown>) => data<MarketJob>(await api.patch(`${base}/jobs/${encodeURIComponent(id)}`, payload)),
  submitJob: async (id: string) => data<MarketJob>(await api.post(`${base}/jobs/${encodeURIComponent(id)}/submit`, {})),
  myProfessionalProfile: async () => data<Record<string, unknown> | null>(await api.get(`${base}/me/professional-profile`)),
  saveProfessionalProfile: async (payload: Record<string, unknown>) => data<Record<string, unknown>>(await api.put(`${base}/me/professional-profile`, payload)),
  submitProfessionalProfile: async () => data<Record<string, unknown>>(await api.post(`${base}/me/professional-profile/submit`, {})),
  myCompany: async () => data<Record<string, unknown> | null>(await api.get(`${base}/me/company`)),
  updateCompanyCapabilities: async (payload: Record<string, unknown>) => data<Record<string, unknown>>(await api.patch(`${base}/me/company/capabilities`, payload)),
  candidateDirectory: async (params: Record<string, string | undefined> = {}) => rows<Record<string, unknown>>(await api.get(`${base}/company/candidates${query(params)}`)),
  candidates: async (jobId: string) => rows<Record<string, unknown>>(await api.get(`${base}/jobs/${encodeURIComponent(jobId)}/candidates`)),
  sellerDashboard: async () => data<Record<string, unknown>>(await api.get(`${base}/me/dashboard`)),
  revenue: async () => data<Record<string, unknown>>(await api.get(`${base}/me/revenue`)),
};

const CART_KEY = 'celeone.marketplace.cart.v1';
const WISHLIST_KEY = 'celeone.marketplace.wishlist.v1';
export function readMarketCart(): MarketCartItem[] {
  try { const value = JSON.parse(localStorage.getItem(CART_KEY) || '[]'); return Array.isArray(value) ? value : []; } catch { return []; }
}
export function writeMarketCart(items: MarketCartItem[]) { localStorage.setItem(CART_KEY, JSON.stringify(items)); }
export function readMarketWishlist(): string[] {
  try { const value = JSON.parse(localStorage.getItem(WISHLIST_KEY) || '[]'); return Array.isArray(value) ? value.map(String) : []; } catch { return []; }
}
export function toggleMarketWishlist(id: string) {
  const current = readMarketWishlist();
  const next = current.includes(id) ? current.filter((value) => value !== id) : [...current, id];
  localStorage.setItem(WISHLIST_KEY, JSON.stringify(next));
  return next;
}
export function addMarketCart(listing: MarketListing, quantity = 1) {
  const items = readMarketCart();
  if (items.some((item) => item.listing.shopId !== listing.shopId)) return false;
  const current = items.find((item) => item.listing.id === listing.id);
  const max = listing.stockMode === 'tracked' ? Math.max(1, Number(listing.stockQuantity || 1)) : 99;
  if (current) current.quantity = Math.min(max, current.quantity + quantity);
  else items.push({ listing, quantity: Math.min(max, Math.max(1, quantity)) });
  writeMarketCart(items);
  return true;
}

export async function uploadMarketplaceImage(file: File) {
  if (file.size > 10 * 1024 * 1024) throw new Error('Chaque image doit faire 10 Mo maximum.');
  const form = new FormData();
  form.append('file', file, file.name);
  form.append('storage_folder', 'marketplace/images');
  form.append('purpose', '/api/v1/marketplace/uploads/image');
  const token = getToken();
  const response = await fetch(`${API_URL}/v1/uploads/presign`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' }, body: form });
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) throw new Error(String(payload?.message || 'Échec de l’envoi de l’image.'));
  const result = data<Record<string, unknown>>(payload);
  const url = String(result?.url || (result?.asset as Record<string, unknown> | undefined)?.url || '');
  if (!/^https?:\/\//.test(url)) throw new Error('Le serveur n’a pas renvoyé de lien pour cette image.');
  return url;
}

export async function uploadMarketplaceDocument(file: File, kind: 'cv' | 'certificate' | 'portfolio_document' = 'cv') {
  if (file.size > 3 * 1024 * 1024) throw new Error('Le document doit faire 3 Mo maximum.');
  const form = new FormData(); form.append('file', file, file.name); form.append('kind', kind);
  const token = getToken();
  const response = await fetch(`${API_URL}/v1/marketplace/uploads/document`, { method: 'POST', headers: token ? { Authorization: `Bearer ${token}`, Accept: 'application/json' } : { Accept: 'application/json' }, body: form });
  const payload = await response.json().catch(() => null) as Record<string, unknown> | null;
  if (!response.ok) throw new Error(String(payload?.message || 'Échec de l’envoi du document.'));
  return data<Record<string, unknown>>(payload);
}
