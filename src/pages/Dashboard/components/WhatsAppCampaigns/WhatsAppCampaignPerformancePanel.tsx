import { CampaignFunnelMetrics } from "./CampaignFunnelMetrics";
import { CampaignRoiCards } from "./CampaignRoiCards";
import { CampaignSummaryCard } from "./CampaignSummaryCard";
import { AttributedOrdersTable, TopClickedProductsTable } from "./PerformanceTables";
import {
  WhatsAppAttributedOrder,
  WhatsAppCampaignFunnelMetrics,
  WhatsAppCampaignRoiMetricOverrides,
  WhatsAppCampaignSummary,
  WhatsAppClickedProduct,
  WhatsAppFunnelMetricKey,
} from "./performanceTypes";

export interface WhatsAppCampaignPerformancePanelProps {
  campaign: WhatsAppCampaignSummary;
  metrics: WhatsAppCampaignFunnelMetrics;
  roiOverrides?: WhatsAppCampaignRoiMetricOverrides;
  clickedProducts?: WhatsAppClickedProduct[];
  attributedOrders?: WhatsAppAttributedOrder[];
  selectedMetric?: WhatsAppFunnelMetricKey;
  onMetricSelect?: (metric: WhatsAppFunnelMetricKey) => void;
  onProductSelect?: (product: WhatsAppClickedProduct) => void;
  onOrderSelect?: (order: WhatsAppAttributedOrder) => void;
  onRefresh?: () => void;
  onExportCsv?: () => void;
}

export const WhatsAppCampaignPerformancePanel = ({
  campaign,
  metrics,
  roiOverrides,
  clickedProducts = [],
  attributedOrders = [],
  selectedMetric,
  onMetricSelect,
  onProductSelect,
  onOrderSelect,
  onRefresh,
  onExportCsv,
}: WhatsAppCampaignPerformancePanelProps): JSX.Element => {
  const providerMode = campaign.providerMode ?? "provisional";

  return (
    <div className="space-y-5">
      <CampaignSummaryCard campaign={campaign} onRefresh={onRefresh} onExportCsv={onExportCsv} />
      <CampaignRoiCards metrics={metrics} overrides={roiOverrides} providerMode={providerMode} />
      <CampaignFunnelMetrics metrics={metrics} providerMode={providerMode} selectedMetric={selectedMetric} onMetricSelect={onMetricSelect} />
      <div className="grid gap-5 xl:grid-cols-2">
        <TopClickedProductsTable products={clickedProducts} providerMode={providerMode} onProductSelect={onProductSelect} />
        <AttributedOrdersTable orders={attributedOrders} providerMode={providerMode} onOrderSelect={onOrderSelect} />
      </div>
    </div>
  );
};
