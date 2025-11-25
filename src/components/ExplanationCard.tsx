// Explanation Card Component - Shows methodology and insights
import { Card, CardContent } from './ui/card';
import { InfoIcon } from 'lucide-react';
import { useState } from 'react';

interface ExplanationCardProps {
  title: string;
  description: string;
  methodology: string[];
  insights: string[];
  icon?: string;
}

export const ExplanationCard = ({ 
  title, 
  description, 
  methodology, 
  insights,
  icon = "📊"
}: ExplanationCardProps) => {
  const [isExpanded, setIsExpanded] = useState(false);

  return (
    <Card className="border-blue-200 bg-blue-50">
      <CardContent className="p-4">
        <div className="flex items-start gap-3">
          <div className="text-2xl flex-shrink-0">{icon}</div>
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <h3 className="font-semibold text-blue-900 flex items-center gap-2">
                <InfoIcon className="w-4 h-4" />
                {title}
              </h3>
              <button
                onClick={() => setIsExpanded(!isExpanded)}
                className="text-blue-600 hover:text-blue-800 text-sm font-medium"
              >
                {isExpanded ? 'Show Less' : 'Learn More'}
              </button>
            </div>
            <p className="text-sm text-blue-800 mt-1">{description}</p>
            
            {isExpanded && (
              <div className="mt-4 space-y-3 text-sm">
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">How We Calculate This:</h4>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    {methodology.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
                
                <div>
                  <h4 className="font-semibold text-blue-900 mb-2">Key Insights:</h4>
                  <ul className="list-disc list-inside space-y-1 text-blue-800">
                    {insights.map((item, idx) => (
                      <li key={idx}>{item}</li>
                    ))}
                  </ul>
                </div>
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};
