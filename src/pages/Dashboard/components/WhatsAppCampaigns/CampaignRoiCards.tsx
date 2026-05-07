import { MousePointerClick, ReceiptText, TrendingUp } from "lucide-react";

import { Card, CardContent } from "../../../../components/ui/card";
import { formatCurrency } from "../../../../utils/formatters";
import { WhatsAppCampaignFunnelMetrics, WhatsAppCampaignRoiMetricOverrides, WhatsAppProviderDataMode } from "./performanceTypes";

export interface CampaignRoiCardsProps {
  metrics: WhatsAppCampaignFunnelMetrics;
  overrides?: WhatsAppCampaignRoiMetricOverrides;
  providerMode?: WhatsAppProviderDataMode;
}

const safeDivide = (numerator: number, denominator: number) => (denominator > 0 ? numerator / denominator : 0);

export const CampaignRoiCards = ({
  metrics,
  overrides,
  providerMode = "provisional",
}: CampaignRoiCardsProps): JSX.Element => {
  const recipientBase = metrics.sent || metrics.sendable || metrics.audience;
  const conversionRate = overrides?.conversionRate ?? safeDivide(metrics.orders, recipientBase) * 100;
  const revenuePerRecipient = overrides?.revenuePerRecipient ?? safeDivide(metrics.revenue, recipientBase);
  const revenuePerClick = overrides?.revenuePerClick ?? safeDivide(metrics.revenue, metrics.clicked);
  const isProvisional = providerMode !== "live";

  const cards = [
    {
      label: "Conversion rate",
      value: `${conversionRate.toFixed(2)}%`,
      helper: "Orders divided by sent recipients",
      icon: <TrendingUp className="h-5 w-5" />,
      tone: "bg-blue-50 text-blue-700",
    },
    {
      label: "Revenue per recipient",
      value: formatCurrency(revenuePerRecipient, "PKR", revenuePerRecipient >= 1000 ? 1 : 0),
      helper: "Attributed revenue per sent recipient",
      icon: <ReceiptText className="h-5 w-5" />,
      tone: "bg-emerald-50 text-emerald-700",
    },
    {
      label: "Revenue per click",
      value: formatCurrency(revenuePerClick, "PKR", revenuePerClick >= 1000 ? 1 : 0),
      helper: "Attributed revenue divided by tracked clicks",
      icon: <MousePointerClick className="h-5 w-5" />,
      tone: "bg-amber-50 text-amber-700",
    },
  ];

  return (
    <div className="grid gap-4 md:grid-cols-3">
      {cards.map((card) => (
        <Card key={card.label} className="border-0 bg-white shadow-sm">
          <CardContent className="p-5">
            <div className="flex items-start justify-between gap-3">
              <div>
                <p className="text-sm font-semibold text-slate-600">{card.label}</p>
                <p className="mt-2 text-2xl font-bold text-slate-950">{card.value}</p>
              </div>
              <div className={`flex h-11 w-11 items-center justify-center rounded-2xl ${card.tone}`}>{card.icon}</div>
            </div>
            <p className="mt-3 text-xs leading-5 text-slate-500">{card.helper}</p>
            {isProvisional ? <p className="mt-2 text-xs font-semibold text-amber-700">Provisional until provider/order webhooks are connected.</p> : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
};
