import { BarChart3 } from "lucide-react";

import { Button } from "../../../../components/ui/button";

interface PerformanceEmptyStateProps {
  title: string;
  description: string;
  actionLabel?: string;
  onAction?: () => void;
}

export const PerformanceEmptyState = ({
  title,
  description,
  actionLabel,
  onAction,
}: PerformanceEmptyStateProps): JSX.Element => (
  <div className="flex min-h-48 flex-col items-center justify-center rounded-2xl border border-dashed border-slate-300 bg-slate-50/80 p-8 text-center">
    <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-white text-slate-500 shadow-sm">
      <BarChart3 className="h-5 w-5" />
    </div>
    <h4 className="mt-4 text-base font-semibold text-slate-950">{title}</h4>
    <p className="mt-2 max-w-md text-sm leading-6 text-slate-500">{description}</p>
    {actionLabel && onAction ? (
      <Button type="button" variant="outline" size="sm" className="mt-5" onClick={onAction}>
        {actionLabel}
      </Button>
    ) : null}
  </div>
);
