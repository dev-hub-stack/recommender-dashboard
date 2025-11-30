import { CheckCircle2Icon, InfoIcon, RefreshCwIcon } from "lucide-react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";
import { DateRangeDisplay } from "../../../../components/DateRangeDisplay";

// Note: This would connect to an activity log API in production
// Currently showing recent system events
const activityData = [
  {
    icon: CheckCircle2Icon,
    iconColor: "text-foundation-greengreen-500",
    title: "ML Models Trained Successfully",
    description: "Collaborative filtering and matrix factorization models are active",
    status: "Active",
    statusBg: "bg-foundation-greengreen-50",
    statusText: "text-foundation-greengreen-500",
    timestamp: "Today",
  },
  {
    icon: InfoIcon,
    iconColor: "text-foundation-blueblue-500",
    title: "Redis Cache Enabled",
    description: "Analytics endpoints now cached for faster response times",
    status: "Online",
    statusBg: "bg-foundation-blueblue-50",
    statusText: "text-foundation-blueblue-500",
    timestamp: "Today",
  },
  {
    icon: RefreshCwIcon,
    iconColor: "text-foundation-orangeorange-600",
    title: "Database Indexes Optimized",
    description: "Query performance improved with new indexes on orders table",
    status: "Complete",
    statusBg: "bg-foundation-orangeorange-50",
    statusText: "text-foundation-orangeorange-600",
    timestamp: "Today",
  },
];

interface RecentActivitySectionProps {
  timeFilter?: string;
}

export const RecentActivitySection = ({ timeFilter = '7days' }: RecentActivitySectionProps): JSX.Element => {
  return (
    <section className="flex flex-col gap-4 p-5 bg-foundation-whitewhite-50 rounded-xl overflow-hidden">
      <div className="flex items-center justify-between">
        <h2 className="font-semibold text-lg">Recent Activity</h2>
        <div className="flex items-center gap-4">
          <DateRangeDisplay timeFilter={timeFilter as any} />
          <Button
            variant="outline"
            className="h-auto px-3 py-1 rounded-[5px] border-[#cacbce] hover:bg-foundation-whitewhite-100"
          >
            <span className="[font-family:'Poppins',Helvetica] font-normal text-foundation-greygrey-800 text-xs tracking-[0] leading-[normal]">
              View All
            </span>
          </Button>
        </div>
      </div>
      <div className="flex flex-col items-start gap-3.5 flex-1">
        <div className="flex flex-col items-start w-full">
          {activityData.map((activity, index) => {
            const IconComponent = activity.icon;
            return (
              <article
                key={index}
                className="flex items-center gap-3 py-3 w-full bg-foundation-whitewhite-50 border-b-[0.5px] border-solid border-[#cacbce] first:pt-0 last:border-b-0"
              >
                <IconComponent className={`w-6 h-6 ${activity.iconColor}`} />

                <div className="flex flex-col items-start justify-center flex-1">
                  <h3 className="[font-family:'Poppins',Helvetica] font-medium text-black text-base tracking-[0] leading-[normal]">
                    {activity.title}
                  </h3>
                  <p className="[font-family:'Poppins',Helvetica] font-normal text-foundation-greygrey-400 text-sm tracking-[0] leading-[normal]">
                    {activity.description}
                  </p>
                </div>

                <div className="flex flex-col items-center gap-2.5 min-w-fit">
                  <Badge
                    variant="secondary"
                    className={`h-auto px-2 py-1 ${activity.statusBg} rounded-[5px] hover:${activity.statusBg}`}
                  >
                    <span
                      className={`[font-family:'Poppins',Helvetica] font-normal ${activity.statusText} text-sm tracking-[0] leading-[normal]`}
                    >
                      {activity.status}
                    </span>
                  </Badge>
                </div>

                <Badge
                  variant="secondary"
                  className="h-auto px-2 py-1 bg-foundation-whitewhite-300 rounded-[5px] overflow-hidden hover:bg-foundation-whitewhite-300"
                >
                  <span className="[font-family:'Poppins',Helvetica] font-normal text-foundation-greygrey-800 text-sm tracking-[0] leading-[normal]">
                    {activity.timestamp}
                  </span>
                </Badge>
              </article>
            );
          })}
        </div>
      </div>

      <div className="inline-flex items-center gap-2.5 px-0 py-[50px]">
        <img className="w-[6.93px] h-[91px]" alt="Line" src="/line-2.svg" />
      </div>
    </section>
  );
};
