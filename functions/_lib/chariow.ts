import type { ChariowPaymentStatus, ChariowSale, PortalEnv, VerifiedFounderSale } from "./types";

type ChariowEnvelope<T> = { message?: string; data?: T; errors?: unknown[] };

export class ChariowError extends Error {
  constructor(public status: number, public code: string, message: string) {
    super(message);
  }
}

const temporaryStatuses = new Set([429, 500, 502, 503, 504]);

function apiKey(env: PortalEnv) {
  const environment = (env.ENVIRONMENT || "production").toLowerCase();
  return environment === "development"
    ? env.CHARIOW_API_KEY_DEV || env.CHARIOW_API_KEY
    : env.CHARIOW_API_KEY_PROD || env.CHARIOW_API_KEY;
}

function normalizeMoney(value: unknown): ChariowSale["amount"] {
  const item = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  return {
    value: Number(item.value ?? item.amount ?? 0),
    currency: String(item.currency || "").toUpperCase(),
    formatted: typeof item.formatted === "string" ? item.formatted : undefined,
    short: typeof item.short === "string" ? item.short : undefined,
  };
}

function normalizeSale(value: unknown): ChariowSale {
  const sale = (value && typeof value === "object" ? value : {}) as Record<string, unknown>;
  const product = (sale.product && typeof sale.product === "object" ? sale.product : {}) as Record<string, unknown>;
  const customer = (sale.customer && typeof sale.customer === "object" ? sale.customer : {}) as Record<string, unknown>;
  const payment = (sale.payment && typeof sale.payment === "object" ? sale.payment : {}) as Record<string, unknown>;
  const method = (payment.method && typeof payment.method === "object" ? payment.method : {}) as Record<string, unknown>;
  const store = (sale.store && typeof sale.store === "object" ? sale.store : {}) as Record<string, unknown>;
  return {
    id: String(sale.id || ""),
    status: String(sale.status || "pending") as ChariowSale["status"],
    amount: normalizeMoney(sale.amount),
    original_amount: sale.original_amount ? normalizeMoney(sale.original_amount) : undefined,
    completed_at: typeof sale.completed_at === "string" ? sale.completed_at : null,
    created_at: typeof sale.created_at === "string" ? sale.created_at : undefined,
    product: { id: String(product.id || sale.product_id || ""), name: String(product.name || ""), url: String(product.url || "") },
    customer: {
      id: String(customer.id || ""),
      name: String(customer.name || ""),
      first_name: String(customer.first_name || ""),
      last_name: String(customer.last_name || ""),
      email: String(customer.email || "").trim().toLowerCase(),
      phone: String(customer.phone || ""),
      country: String(customer.country || ""),
    },
    payment: {
      status: String(payment.status || "pending") as ChariowPaymentStatus,
      transaction_id: String(payment.transaction_id || payment.id || ""),
      gateway: String(payment.gateway || payment.channel || ""),
      amount: payment.amount ? normalizeMoney(payment.amount) : undefined,
      method: { name: String(method.name || payment.method_name || ""), icon_url: String(method.icon_url || "") },
    },
    store: { id: String(store.id || sale.store_id || ""), name: String(store.name || ""), url: String(store.url || "") },
    custom_fields_values: sale.custom_fields_values ?? sale.customFieldsValues ?? sale.custom_fields ?? null,
  };
}

export class ChariowService {
  private baseUrl: string;
  private key: string;

  constructor(private env: PortalEnv) {
    this.baseUrl = (env.CHARIOW_API_BASE_URL || "https://api.chariow.com/v1").replace(/\/$/, "");
    this.key = apiKey(env) || "";
    if (!this.key) throw new ChariowError(503, "CHARIOW_NOT_CONFIGURED", "Chariow API key is not configured");
  }

  private async request<T>(path: string, init: RequestInit = {}, retries = 2): Promise<T> {
    for (let attempt = 0; attempt <= retries; attempt += 1) {
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), 10_000);
      try {
        const response = await fetch(`${this.baseUrl}${path}`, {
          ...init,
          headers: { Authorization: `Bearer ${this.key}`, Accept: "application/json", "Content-Type": "application/json", ...init.headers },
          signal: controller.signal,
        });
        const body = await response.json().catch(() => ({})) as ChariowEnvelope<T>;
        if (response.ok) {
          if (body.data === undefined) throw new ChariowError(502, "CHARIOW_MISSING_DATA", "Chariow response did not contain data");
          return body.data;
        }
        const code = response.status === 401 ? "CHARIOW_UNAUTHORIZED" : response.status === 404 ? "CHARIOW_NOT_FOUND" : response.status === 422 ? "CHARIOW_VALIDATION_ERROR" : response.status === 429 ? "CHARIOW_RATE_LIMITED" : "CHARIOW_API_ERROR";
        if (attempt < retries && temporaryStatuses.has(response.status)) {
          await new Promise((resolve) => setTimeout(resolve, 250 * (attempt + 1)));
          continue;
        }
        throw new ChariowError(response.status, code, String(body.message || code));
      } catch (error) {
        if (error instanceof ChariowError) throw error;
        if (attempt >= retries) throw new ChariowError(503, "CHARIOW_NETWORK_ERROR", error instanceof Error ? error.message : "Network failure");
      } finally {
        clearTimeout(timer);
      }
    }
    throw new ChariowError(503, "CHARIOW_NETWORK_ERROR", "Chariow request failed");
  }

  getStore() { return this.request<Record<string, unknown>>("/store"); }
  async getSale(saleId: string) { return normalizeSale(await this.request<unknown>(`/sales/${encodeURIComponent(saleId)}`)); }
  listSales(filters: Record<string, string | number | undefined> = {}) {
    const query = new URLSearchParams();
    Object.entries(filters).forEach(([key, value]) => { if (value !== undefined && value !== "") query.set(key, String(value)); });
    return this.request<unknown[]>(`/sales${query.size ? `?${query}` : ""}`);
  }
  searchSales(search: string) { return this.listSales({ search, per_page: 25 }); }

  async verifyFounderSale(saleId: string): Promise<VerifiedFounderSale> {
    const sale = await this.getSale(saleId);
    if (!sale.id) return { eligible: false, sale, reason: "SALE_ID_MISSING" };
    if (!new Set(["completed", "settled"]).has(sale.status)) return { eligible: false, sale, reason: "SALE_NOT_COMPLETED" };
    if (sale.payment?.status !== "success") return { eligible: false, sale, reason: "PAYMENT_NOT_SUCCESSFUL" };
    if (!this.env.CHARIOW_FOUNDERS_PRODUCT_ID || sale.product.id !== this.env.CHARIOW_FOUNDERS_PRODUCT_ID) return { eligible: false, sale, reason: "PRODUCT_MISMATCH" };
    if (this.env.CHARIOW_STORE_ID && sale.store?.id !== this.env.CHARIOW_STORE_ID) return { eligible: false, sale, reason: "STORE_MISMATCH" };
    if (!sale.customer.email) return { eligible: false, sale, reason: "CUSTOMER_EMAIL_MISSING" };
    if (!(sale.amount.value > 0) || !sale.amount.currency) return { eligible: false, sale, reason: "INVALID_AMOUNT" };
    if (!sale.completed_at) return { eligible: false, sale, reason: "COMPLETION_DATE_MISSING" };
    return { eligible: true, sale };
  }
}
