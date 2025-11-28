import React from "react";
import { Button } from "../../../../components/ui/button";

interface RevenueTrendSectionProps {
  activeView: string;
  onNavigate: (view: string) => void;
}

const insightsAnalysisItems = [
  {
    icon: "/vuesax-linear-home-2.svg",
    label: "Dashboard",
  },
  {
    icon: "/vuesax-linear-user-edit.svg",
    label: "Customer Profiling",
  },
];

const growthToolsItems = [
  {
    icon: "/vuesax-linear-lamp-charge.svg",
    label: "Collaborative Filtering",
  },
  {
    icon: "/vuesax-linear-maximize.svg",
    label: "Cross-Selling",
  },
];

const phase1AnalyticsItems = [
  {
    icon: "/vuesax-linear-global.svg",
    label: "Geographic Intelligence",
  },
  {
    icon: "/vuesax-linear-profile-2user.svg",
    label: "RFM Segmentation",
  },
  {
    icon: "/vuesax-linear-cloud.svg",
    label: "ML Recommendations",
  },
];

export const RevenueTrendSection: React.FC<RevenueTrendSectionProps> = ({ 
  activeView, 
  onNavigate 
}) => {
  return (
    <aside className="flex flex-col items-start gap-6 p-6 w-full bg-foundation-whitewhite-50">
      <img
        className="w-9 h-9"
        alt="Vuesax bold colors"
        src="/vuesax-bold-colors-square.svg"
      />

      <nav className="flex flex-col items-start gap-2 w-full">
        <h2 className="[font-family:'Poppins',Helvetica] font-normal text-foundation-greygrey-500 text-xs tracking-[0] leading-[normal]">
          Insights &amp; Analysis
        </h2>

        <div className="flex flex-col items-start gap-3 w-full">
          {insightsAnalysisItems.map((item, index) => {
            const isActive = activeView === item.label;
            return (
              <Button
                key={index}
                variant={isActive ? "default" : "ghost"}
                onClick={() => onNavigate(item.label)}
                className={`flex items-center justify-start gap-2.5 px-2.5 py-2 w-full h-auto rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-foundation-blueblue-900 hover:bg-foundation-blueblue-900 shadow-md"
                    : "bg-transparent hover:bg-foundation-greygrey-50"
                }`}
              >
                <img className="w-5 h-5" alt={item.label} src={item.icon} />
                <span
                  className={`flex-1 text-left [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-[normal] ${
                    isActive ? "text-white font-medium" : "text-grey-900"
                  }`}
                >
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </Button>
            );
          })}
        </div>
      </nav>

      <nav className="flex flex-col items-start gap-2 w-full">
        <h2 className="[font-family:'Poppins',Helvetica] font-normal text-foundation-greygrey-500 text-xs tracking-[0] leading-[normal]">
          Growth Tools
        </h2>

        <div className="flex flex-col items-start gap-3 w-full">
          {growthToolsItems.map((item, index) => {
            const isActive = 
              (activeView === "Cross-Selling" && item.label === "Cross-Selling") ||
              (activeView === "Collaborative Recommendation" && item.label === "Collaborative Filtering");
            
            return (
              <Button
                key={index}
                onClick={() => {
                  // Handle Cross-Selling and Collaborative Filtering navigation, show coming soon for others
                  if (item.label === "Cross-Selling") {
                    onNavigate("Cross-Selling");
                  } else if (item.label === "Collaborative Filtering") {
                    onNavigate("Collaborative Recommendation");
                  } else {
                    alert(`${item.label} - Coming Soon! This feature is under development.`);
                  }
                }}
                variant={isActive ? "default" : "ghost"}
                className={`flex items-center justify-start gap-2.5 px-2.5 py-2 w-full h-auto rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-foundation-blueblue-900 hover:bg-foundation-blueblue-900 shadow-md"
                    : "bg-transparent hover:bg-foundation-greygrey-50"
                }`}
              >
                <img className="w-5 h-5" alt={item.label} src={item.icon} />
                <span className={`flex-1 text-left [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-[normal] ${
                  isActive ? "text-white font-medium" : "text-grey-900"
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </Button>
            );
          })}
        </div>
      </nav>

      <nav className="flex flex-col items-start gap-2 w-full">
        <h2 className="[font-family:'Poppins',Helvetica] font-normal text-foundation-greygrey-500 text-xs tracking-[0] leading-[normal]">
          Phase 1 Analytics
        </h2>

        <div className="flex flex-col items-start gap-3 w-full">
          {phase1AnalyticsItems.map((item, index) => {
            const isActive = activeView === item.label;
            
            return (
              <Button
                key={index}
                onClick={() => onNavigate(item.label)}
                variant={isActive ? "default" : "ghost"}
                className={`flex items-center justify-start gap-2.5 px-2.5 py-2 w-full h-auto rounded-lg transition-all duration-200 ${
                  isActive
                    ? "bg-foundation-blueblue-900 hover:bg-foundation-blueblue-900 shadow-md"
                    : "bg-transparent hover:bg-foundation-greygrey-50"
                }`}
              >
                <img className="w-5 h-5" alt={item.label} src={item.icon} />
                <span className={`flex-1 text-left [font-family:'Poppins',Helvetica] font-normal text-sm tracking-[0] leading-[normal] ${
                  isActive ? "text-white font-medium" : "text-grey-900"
                }`}>
                  {item.label}
                </span>
                {isActive && (
                  <div className="w-2 h-2 bg-white rounded-full"></div>
                )}
              </Button>
            );
          })}
        </div>
      </nav>
    </aside>
  );
};
