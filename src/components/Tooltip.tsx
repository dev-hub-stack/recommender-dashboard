// Tooltip Component for explaining metrics
import { useState } from 'react';
import { InfoIcon } from 'lucide-react';

interface TooltipProps {
  content: string | React.ReactNode;
  children?: React.ReactNode;
  className?: string;
}

export const Tooltip = ({ content, children, className = "" }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help"
      >
        {children || <InfoIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />}
      </div>
      
      {isVisible && (
        <div className={`absolute z-50 bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg w-64 ${className}`}>
          <div className="relative">
            {content}
          </div>
          {/* Arrow */}
          <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
            <div className="border-4 border-transparent border-t-gray-900"></div>
          </div>
        </div>
      )}
    </div>
  );
};

// Specific RFM Score Tooltip
export const RFMScoreTooltip = () => {
  return (
    <Tooltip
      content={
        <div className="space-y-2">
          <p className="font-semibold">RFM Score Calculation:</p>
          <div className="space-y-1">
            <p><strong>R (Recency):</strong> Days since last purchase</p>
            <p className="text-xs">• ≤30 days = 5, ≤60 = 4, ≤90 = 3, ≤180 = 2, else = 1</p>
            
            <p className="mt-2"><strong>F (Frequency):</strong> Total orders</p>
            <p className="text-xs">• ≥20 = 5, ≥10 = 4, ≥5 = 3, ≥2 = 2, else = 1</p>
            
            <p className="mt-2"><strong>M (Monetary):</strong> Total spent (PKR)</p>
            <p className="text-xs">• ≥500K = 5, ≥200K = 4, ≥100K = 3, ≥50K = 2, else = 1</p>
          </div>
        </div>
      }
    />
  );
};

// Geographic Score Tooltip
export const GeographicScoreTooltip = () => {
  return (
    <Tooltip
      content={
        <div className="space-y-2">
          <p className="font-semibold">Geographic Metrics:</p>
          <div className="space-y-1">
            <p><strong>Revenue:</strong> Total sales in PKR</p>
            <p><strong>Orders:</strong> Number of completed orders</p>
            <p><strong>Customers:</strong> Unique customer count</p>
            <p><strong>Avg Order Value:</strong> Revenue ÷ Orders</p>
          </div>
          <p className="text-xs mt-2 text-gray-300">
            Data mapped from 61 Pakistani cities to provinces and regions
          </p>
        </div>
      }
    />
  );
};

// Collaborative Score Tooltip  
export const CollaborativeScoreTooltip = () => {
  return (
    <Tooltip
      content={
        <div className="space-y-2">
          <p className="font-semibold">Collaborative Filtering Score:</p>
          <div className="space-y-1">
            <p><strong>Algorithm:</strong> User-based collaborative filtering</p>
            <p className="text-xs">• Find customers with similar purchase patterns</p>
            <p className="text-xs">• Recommend products they bought but you haven't</p>
            <p className="text-xs">• Score = (Co-purchases × Confidence) / 100</p>
          </div>
          <p className="text-xs mt-2 text-gray-300">
            Higher scores indicate stronger recommendation confidence
          </p>
        </div>
      }
    />
  );
};

// Cross-Sell Score Tooltip
export const CrossSellScoreTooltip = () => {
  return (
    <Tooltip
      content={
        <div className="space-y-2">
          <p className="font-semibold">Cross-Sell Score Calculation:</p>
          <div className="space-y-1">
            <p><strong>Co-Purchase Frequency:</strong> How often items bought together</p>
            <p><strong>Confidence:</strong> % of orders with Product A that also have Product B</p>
            <p><strong>Lift:</strong> How much more likely B is purchased with A vs alone</p>
          </div>
          <p className="text-xs mt-2 text-gray-300">
            Confidence × Lift = Cross-Sell Score
          </p>
        </div>
      }
    />
  );
};
