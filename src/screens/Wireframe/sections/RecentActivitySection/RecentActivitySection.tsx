import { CheckCircle2Icon, InfoIcon, RefreshCwIcon } from "lucide-react";
import React from "react";
import { Badge } from "../../../../components/ui/badge";
import { Button } from "../../../../components/ui/button";

const activityData = [
  {
    icon: CheckCircle2Icon,
    iconColor: "text-foundation-greengreen-500",
    title: "New recommendation algorithm deployed",
    description: "Deep learning model v2.1 is now live",
    status: "Success",
    statusBg: "bg-foundation-greengreen-50",
    statusText: "text-foundation-greengreen-500",
    timestamp: "2 days ago",
  },
  {
    icon: InfoIcon,
    iconColor: "text-foundation-blueblue-500",
    title: 'A/B test "Product Page Layout" completed',
    description: "Deep learning model v2.1 is now live",
    status: "Info",
    statusBg: "bg-foundation-blueblue-50",
    statusText: "text-foundation-blueblue-500",
    timestamp: "2 days ago",
  },
  {
    icon: RefreshCwIcon,
    iconColor: "text-foundation-orangeorange-600",
    title: 'A/B test "Product Page Layout" completed',
    description: "Deep learning model v2.1 is now live",
    status: "Neutral",
    statusBg: "bg-foundation-orangeorange-50",
    statusText: "text-foundation-orangeorange-600",
    timestamp: "2 days ago",
  },
];

export const RecentActivitySection = (): JSX.Element => {
  return (
    <section className="flex items-start gap-4 p-5 bg-foundation-whitewhite-50 rounded-xl overflow-hidden">
      <div className="flex flex-col items-start gap-3.5 flex-1">
        <header className="flex items-center gap-2.5 w-full">
          <h2 className="flex-1 [font-family:'Poppins',Helvetica] font-semibold text-black text-base tracking-[0] leading-[normal]">
            Recent Activity
          </h2>

          <Button
            variant="outline"
            className="h-auto px-3 py-1 rounded-[5px] border-[#cacbce] hover:bg-foundation-whitewhite-100"
          >
            <span className="[font-family:'Poppins',Helvetica] font-normal text-foundation-greygrey-800 text-xs tracking-[0] leading-[normal]">
              View All
            </span>
          </Button>
        </header>

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

                <div className="flex flex-col w-[173px] items-center gap-2.5">
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
