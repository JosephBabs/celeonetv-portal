export type PortalEnv = {
  CHARIOW_API_BASE_URL?: string;
  CHARIOW_API_KEY?: string;
  CHARIOW_API_KEY_DEV?: string;
  CHARIOW_API_KEY_PROD?: string;
  CHARIOW_FOUNDERS_PRODUCT_ID?: string;
  CHARIOW_FOUNDERS_PRODUCT_URL?: string;
  CHARIOW_STORE_ID?: string;
  CHARIOW_PULSE_TOKEN?: string;
  CELEONE_PUBLIC_URL?: string;
  FIREBASE_PROJECT_ID?: string;
  FIREBASE_STORAGE_BUCKET?: string;
  FIREBASE_WEB_API_KEY?: string;
  FIREBASE_SERVICE_ACCOUNT_EMAIL?: string;
  FIREBASE_SERVICE_ACCOUNT_PRIVATE_KEY?: string;
  ENVIRONMENT?: string;
};

export type ChariowMoney = {
  value: number;
  formatted?: string;
  short?: string;
  currency: string;
};

export type ChariowSaleStatus =
  | "awaiting_payment"
  | "completed"
  | "failed"
  | "abandoned"
  | "settled"
  | "initiated"
  | "pending"
  | "cancelled";

export type ChariowPaymentStatus = "initiated" | "pending" | "success" | "failed" | "cancelled";
export type ChariowPulseEvent = "successful.sale" | "abandoned.sale" | "failed.sale";

export interface ChariowCustomer {
  id?: string;
  name?: string;
  first_name?: string;
  last_name?: string;
  email: string;
  phone?: string;
  country?: string;
}

export interface ChariowProduct {
  id: string;
  name?: string;
  url?: string;
}

export interface ChariowSale {
  id: string;
  status: ChariowSaleStatus;
  amount: ChariowMoney;
  original_amount?: ChariowMoney;
  completed_at?: string | null;
  created_at?: string;
  product: ChariowProduct;
  customer: ChariowCustomer;
  payment?: {
    status: ChariowPaymentStatus;
    transaction_id?: string;
    gateway?: string;
    amount?: ChariowMoney;
    method?: { name?: string; icon_url?: string };
  };
  store?: { id: string; name?: string; url?: string };
}

export type VerifiedFounderSale = {
  eligible: true;
  sale: ChariowSale;
} | {
  eligible: false;
  sale?: ChariowSale;
  reason: string;
};
