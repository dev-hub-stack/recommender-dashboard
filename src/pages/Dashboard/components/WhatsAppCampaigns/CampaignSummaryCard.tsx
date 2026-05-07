import { CalendarDays, Download, RefreshCcw, SlidersHorizontal } from "lucide-react";

import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { Card, CardContent } from "../../../../components/ui/card";
import { cn } from "../../../../lib/utils";
import { WhatsAppCampaignSummary } from "./performanceTypes";

export interface CampaignSummaryCardProps {
  campaign: WhatsAppCampaignSummary;
  className?: string;
  onRefresh?: () => void;
  onExportCsv?: () => void;
}

const providerModeLabel: Record<NonNullable<WhatsAppCampaignSummary["providerMode"]>, string> = {
  live: "Live provider data",
  mock: "Mock provider mode",
  provisional: "Provisional metrics",
};

export const CampaignSummaryCard = ({
  campaign,
  className,
  onRefresh,
  onExportCsv,
}: CampaignSummaryCardProps): JSX.Element => {
  const providerMode = campaign.providerMode ?? "provisional";

  return (
    <Card className={cn("overflow-hidden border-0 bg-white shadow-sm", className)}>
      <CardContent className="p-0">
        <div className="bg-gradient-to-br from-slate-950 via-slate-900 to-blue-950 p-6 text-white">
          <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-[0.22em] text-blue-200">WhatsApp Campaign Performance</p>
              <h3 className="mt-2 text-2xl font-bold">{campaign.name}</h3>
              <div className="mt-3 flex flex-wrap gap-2">
                <Badge className="border-white/10 bg-white/10 text-white hover:bg-white/10">
                  {campaign.segmentName || "Segment pending"}
                </Badge>
                <Badge className="border-white/10 bg-emerald-400/15 text-emerald-100 hover:bg-emerald-400/15">
                  {campaign.status || "Draft"}
                </Badge>
                <Badge className="border-white/10 bg-amber-300/15 text-amber-100 hover:bg-amber-300/15">
                  {providerModeLabel[providerMode]}
                </Badge>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              {onRefresh ? (
                <Button type="button" variant="outline" size="sm" className="border-white/20 bg-white/10 text-white hover:bg-white/20" onClick={onRefresh}>
                  <RefreshCcw className="h-4 w-4" />
                  Refresh
                </Button>
              ) : null}
              {onExportCsv ? (
                <Button type="button" size="sm" className="bg-white text-slate-950 hover:bg-blue-50" onClick={onExportCsv}>
                  <Download className="h-4 w-4" />
                  Export CSV
                </Button>
              ) : null}
            </div>
          </div>
        </div>

        <div className="grid gap-4 border border-t-0 border-slate-100 p-5 md:grid-cols-3">
          <div className="rounded-2xl bg-slate-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-slate-500">
              <CalendarDays className="h-4 w-4" />
              Date range
            </div>
            <p className="mt-2 text-sm font-semibold text-slate-950">{campaign.dateRangeLabel || "Not sent yet"}</p>
          </div>
          <div className="rounded-2xl bg-blue-50 p-4">
            <div className="flex items-center gap-2 text-xs font-semibold uppercase tracking-wide text-blue-700">
              <SlidersHorizontal className="h-4 w-4" />
              Source filters
            </div>
            <p className="mt-2 text-sm font-semibold text-blue-950">
              {campaign.sourceFilters?.length ? campaign.sourceFilters.join(", ") : "All WhatsApp campaign sources"}
            </p>
          </div>
          <div className="rounded-2xl bg-emerald-50 p-4">
            <p className="text-xs font-semibold uppercase tracking-wide text-emerald-700">Attribution window</p>
            <p className="mt-2 text-sm font-semibold text-emerald-950">{campaign.attributionWindowDays ?? 7} days click-through</p>
            {campaign.lastUpdatedLabel ? <p className="mt-1 text-xs text-emerald-700">Updated {campaign.lastUpdatedLabel}</p> : null}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
