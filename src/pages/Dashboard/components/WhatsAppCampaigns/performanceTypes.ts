export type WhatsAppProviderDataMode = "live" | "mock" | "provisional";

export type WhatsAppFunnelMetricKey =
  | "audience"
  | "sendable"
  | "sent"
  | "delivered"
  | "read"
  | "clicked"
  | "orders"
  | "revenue";

export interface WhatsAppCampaignSummary {
  id: string;
  name: string;
  segmentName?: string;
  status?: string;
  dateRangeLabel?: string;
  sourceFilters?: string[];
  providerMode?: WhatsAppProviderDataMode;
  attributionWindowDays?: number;
  lastUpdatedLabel?: string;
}

export interface WhatsAppCampaignFunnelMetrics {
  audience: number;
  sendable: number;
  sent: number;
  delivered: number;
  read: number;
  clicked: number;
  orders: number;
  revenue: number;
}

export interface WhatsAppCampaignRoiMetricOverrides {
  conversionRate?: number;
  revenuePerRecipient?: number;
  revenuePerClick?: number;
}

export interface WhatsAppClickedProduct {
  id: string;
  productName: string;
  category?: string;
  clicks: number;
  uniqueClickers?: number;
  orders?: number;
  revenue?: number;
  clickThroughRate?: number;
}

export interface WhatsAppAttributedOrder {
  id: string;
  orderNumber?: string;
  customerName?: string;
  productName?: string;
  orderDate?: string;
  revenue: number;
  attributionType?: "click-through" | "view-through" | "provisional";
  status?: string;
}
