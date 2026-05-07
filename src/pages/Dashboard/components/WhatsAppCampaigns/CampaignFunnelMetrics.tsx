import { MousePointerClick, PackageCheck, Send, ShoppingBag, Smartphone, Users } from "lucide-react";

import { Card, CardContent } from "../../../../components/ui/card";
import { formatCurrency } from "../../../../utils/formatters";
import { PerformanceEmptyState } from "./PerformanceEmptyState";
import {
  WhatsAppCampaignFunnelMetrics,
  WhatsAppFunnelMetricKey,
  WhatsAppProviderDataMode,
} from "./performanceTypes";

export interface CampaignFunnelMetricsProps {
  metrics: WhatsAppCampaignFunnelMetrics;
  providerMode?: WhatsAppProviderDataMode;
  selectedMetric?: WhatsAppFunnelMetricKey;
  onMetricSelect?: (metric: WhatsAppFunnelMetricKey) => void;
}

const iconByMetric: Record<WhatsAppFunnelMetricKey, JSX.Element> = {
  audience: <Users className="h-4 w-4" />,
  sendable: <Smartphone className="h-4 w-4" />,
  sent: <Send className="h-4 w-4" />,
  delivered: <PackageCheck className="h-4 w-4" />,
  read: <Smartphone className="h-4 w-4" />,
  clicked: <MousePointerClick className="h-4 w-4" />,
  orders: <ShoppingBag className="h-4 w-4" />,
  revenue: <ShoppingBag className="h-4 w-4" />,
};

const metricLabels: Record<WhatsAppFunnelMetricKey, string> = {
  audience: "Audience",
  sendable: "Sendable",
  sent: "Sent",
  delivered: "Delivered",
  read: "Read",
  clicked: "Clicked",
  orders: "Orders",
  revenue: "Revenue",
};

const funnelOrder: WhatsAppFunnelMetricKey[] = ["audience", "sendable", "sent", "delivered", "read", "clicked", "orders", "revenue"];

const formatMetricValue = (key: WhatsAppFunnelMetricKey, value: number) =>
  key === "revenue" ? formatCurrency(value, "PKR", value >= 100000 ? 1 : 0) : value.toLocaleString("en-US");

const getRateLabel = (current: number, previous: number, key: WhatsAppFunnelMetricKey) => {
  if (key === "audience" || previous <= 0) return "Baseline";
  return `${((current / previous) * 100).toFixed(1)}% from previous step`;
};

export const CampaignFunnelMetrics = ({
  metrics,
  providerMode = "provisional",
  selectedMetric,
  onMetricSelect,
}: CampaignFunnelMetricsProps): JSX.Element => {
  const hasData = funnelOrder.some((key) => metrics[key] > 0);
  const maxCount = Math.max(metrics.audience, metrics.sendable, metrics.sent, metrics.delivered, metrics.read, metrics.clicked, metrics.orders, 1);

  if (!hasData) {
    return (
      <PerformanceEmptyState
        title={providerMode === "mock" ? "Provider webhooks are mocked" : "No performance events yet"}
        description="Funnel metrics will populate from queued, sent, delivered, read, clicked, order, and revenue attribution events once this campaign has activity."
      />
    );
  }

  return (
    <Card className="border-0 bg-white shadow-sm">
      <CardContent className="p-5">
        <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
          <div>
            <h3 className="text-lg font-bold text-slate-950">Campaign funnel</h3>
            <p className="mt-1 text-sm text-slate-500">Audience through revenue attribution, shown as step-down performance.</p>
          </div>
          {providerMode !== "live" ? (
            <span className="rounded-full bg-amber-50 px-3 py-1 text-xs font-semibold text-amber-700">
              {providerMode === "mock" ? "Mock provider mode" : "Provisional tracking"}
            </span>
          ) : null}
        </div>

        <div className="mt-5 grid gap-3">
          {funnelOrder.map((key, index) => {
            const value = metrics[key];
            const previousKey = funnelOrder[index - 1];
            const previousValue = previousKey ? metrics[previousKey] : value;
            const widthPercent = key === "revenue" ? Math.min((metrics.orders / maxCount) * 100, 100) : Math.min((value / maxCount) * 100, 100);
            const isSelected = selectedMetric === key;

            return (
              <button
                key={key}
                type="button"
                onClick={() => onMetricSelect?.(key)}
                className={`group rounded-2xl border p-4 text-left transition ${
                  isSelected ? "border-blue-500 bg-blue-50 shadow-sm" : "border-slate-100 bg-slate-50 hover:border-blue-200 hover:bg-white"
                } ${onMetricSelect ? "cursor-pointer" : "cursor-default"}`}
              >
                <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
                  <div className={`flex h-10 w-10 items-center justify-center rounded-xl ${isSelected ? "bg-blue-600 text-white" : "bg-white text-slate-500 shadow-sm"}`}>
                    {iconByMetric[key]}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center justify-between gap-2">
                      <p className="text-sm font-semibold text-slate-900">{metricLabels[key]}</p>
                      <p className="text-base font-bold text-slate-950">{formatMetricValue(key, value)}</p>
                    </div>
                    <div className="mt-2 h-2 overflow-hidden rounded-full bg-white">
                      <div className="h-full rounded-full bg-gradient-to-r from-blue-500 to-emerald-400" style={{ width: `${Math.max(widthPercent, value > 0 ? 5 : 0)}%` }} />
                    </div>
                    <p className="mt-2 text-xs text-slate-500">{getRateLabel(value, previousValue, key)}</p>
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </CardContent>
    </Card>
  );
};
