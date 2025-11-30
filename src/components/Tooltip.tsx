// Tooltip Component for explaining metrics
import { useState } from 'react';
import { InfoIcon, HelpCircle } from 'lucide-react';

// Simple inline info tooltip for metric labels
export const InfoTooltip = ({ text }: { text: string }) => {
  const [show, setShow] = useState(false);
  
  // Convert markdown-style formatting to HTML
  const formatText = (text: string) => {
    return text
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')  // Bold text
      .replace(/\*(.*?)\*/g, '<em>$1</em>')              // Italic text
      .replace(/`(.*?)`/g, '<code>$1</code>')             // Code
      .replace(/\n\n/g, '<br/><br/>')                    // Paragraph breaks
      .replace(/\n/g, '<br/>');                          // Line breaks
  };
  
  return (
    <span className="relative inline-block ml-1">
      <HelpCircle 
        className="w-3.5 h-3.5 text-gray-400 hover:text-blue-500 cursor-help inline"
        onMouseEnter={() => setShow(true)}
        onMouseLeave={() => setShow(false)}
        onClick={() => setShow(!show)}
      />
      {show && (
        <>
          <span 
            className="absolute z-[9999] left-1/2 transform -translate-x-1/2 bottom-full mb-2 w-64 p-3 bg-gray-900 text-white text-xs rounded-lg shadow-xl border border-gray-700"
            dangerouslySetInnerHTML={{ __html: formatText(text) }}
          />
          <span className="absolute left-1/2 transform -translate-x-1/2 top-full border-4 border-transparent border-t-gray-900"></span>
        </>
      )}
    </span>
  );
};

interface TooltipProps {
  content: string | React.ReactNode;
  children?: React.ReactNode;
  className?: string;
  position?: 'top' | 'bottom';
}

export const Tooltip = ({ content, children, className = "", position = 'top' }: TooltipProps) => {
  const [isVisible, setIsVisible] = useState(false);
  const [coords, setCoords] = useState({ x: 0, y: 0 });

  const handleMouseEnter = (e: React.MouseEvent) => {
    const rect = e.currentTarget.getBoundingClientRect();
    setCoords({ 
      x: rect.left + rect.width / 2, 
      y: position === 'top' ? rect.top : rect.bottom 
    });
    setIsVisible(true);
  };

  return (
    <>
      <div
        onMouseEnter={handleMouseEnter}
        onMouseLeave={() => setIsVisible(false)}
        className="cursor-help inline-block"
      >
        {children || <InfoIcon className="w-4 h-4 text-gray-400 hover:text-gray-600" />}
      </div>
      
      {isVisible && (
        <div 
          className={`fixed z-[9999] transform -translate-x-1/2 ${
            position === 'top' ? '-translate-y-full mb-2' : 'mt-2'
          } px-3 py-2 bg-gray-900 text-white text-xs rounded-lg shadow-lg w-64 ${className}`}
          style={{ 
            left: coords.x, 
            top: coords.y + (position === 'top' ? -8 : 8)
          }}
        >
          {position === 'bottom' && (
             <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 -mb-px">
               <div className="border-4 border-transparent border-b-gray-900"></div>
             </div>
          )}
          
          <div className="relative">
            {content}
          </div>
          
          {position === 'top' && (
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 -mt-px">
              <div className="border-4 border-transparent border-t-gray-900"></div>
            </div>
          )}
        </div>
      )}
    </>
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

// RFM Score Column Tooltip - For table headers
export const RFMColumnTooltip = () => {
  return (
    <Tooltip
      position="bottom"
      content={
        <div className="space-y-3 text-left">
          <p className="font-semibold text-sm border-b border-gray-600 pb-1">RFM Score Explained (1-5 scale)</p>
          
          <div className="space-y-2">
            <div>
              <p className="font-medium text-blue-300">R = Recency</p>
              <p className="text-xs">How recently did they purchase?</p>
              <p className="text-xs text-gray-400">5: ≤30 days | 4: ≤60 | 3: ≤90 | 2: ≤180 | 1: 180+</p>
            </div>
            
            <div>
              <p className="font-medium text-green-300">F = Frequency</p>
              <p className="text-xs">How often do they purchase?</p>
              <p className="text-xs text-gray-400">5: 10+ orders | 4: 5+ | 3: 3+ | 2: 2+ | 1: 1</p>
            </div>
            
            <div>
              <p className="font-medium text-yellow-300">M = Monetary</p>
              <p className="text-xs">How much do they spend?</p>
              <p className="text-xs text-gray-400">5: 100K+ | 4: 50K+ | 3: 20K+ | 2: 5K+ | 1: &lt;5K</p>
            </div>
          </div>
          
          <p className="text-xs text-gray-300 border-t border-gray-600 pt-2">
            Higher scores = Better customers
          </p>
        </div>
      }
    />
  );
};
