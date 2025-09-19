import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { ZonalBreakdown } from '@/services/api';

interface ZonalChartProps {
  zonalAnalysis: ZonalBreakdown;
  totalChangePercentage: number;
}

export const ZonalChart: React.FC<ZonalChartProps> = ({ 
  zonalAnalysis, 
  totalChangePercentage 
}) => {
  const { breakdown, mostAffected, leastAffected } = zonalAnalysis;
  
  // Generate colors for each zone
  const colors = [
    'text-red-500',
    'text-orange-500', 
    'text-yellow-500',
    'text-blue-500',
    'text-green-500'
  ];

  // Calculate angles for donut chart
  const total = breakdown.reduce((sum, zone) => sum + zone.percentage, 0);
  let currentAngle = 0;
  
  const segments = breakdown.map((zone, index) => {
    const percentage = zone.percentage;
    const angle = (percentage / total) * 360;
    const startAngle = currentAngle;
    const endAngle = currentAngle + angle;
    currentAngle = endAngle;
    
    const largeArcFlag = angle > 180 ? 1 : 0;
    const startX = 50 + 35 * Math.cos((startAngle * Math.PI) / 180);
    const startY = 50 + 35 * Math.sin((startAngle * Math.PI) / 180);
    const endX = 50 + 35 * Math.cos((endAngle * Math.PI) / 180);
    const endY = 50 + 35 * Math.sin((endAngle * Math.PI) / 180);
    
    const pathData = [
      `M 50 50`,
      `L ${startX} ${startY}`,
      `A 35 35 0 ${largeArcFlag} 1 ${endX} ${endY}`,
      'Z'
    ].join(' ');

    return {
      ...zone,
      pathData,
      color: colors[index % colors.length],
      percentage: percentage
    };
  });

  const getImpactLevel = (percentage: number) => {
    if (percentage > totalChangePercentage * 0.8) return 'Critical';
    if (percentage > totalChangePercentage * 0.6) return 'High';
    if (percentage > totalChangePercentage * 0.3) return 'Medium';
    return 'Low';
  };

  const getImpactColor = (level: string) => {
    switch (level) {
      case 'Critical': return 'destructive';
      case 'High': return 'secondary';
      case 'Medium': return 'default';
      default: return 'outline';
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="text-center">
        <CardTitle className="text-lg font-semibold text-satellite-deep">
          Zone-wise Impact Distribution
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Donut Chart */}
        <div className="flex justify-center mb-4">
          <div className="relative">
            <svg width="200" height="200" viewBox="0 0 100 100">
              {segments.map((segment, index) => (
                <path
                  key={segment.zone}
                  d={segment.pathData}
                  fill="currentColor"
                  className={`${segment.color} hover:opacity-80 transition-opacity`}
                  stroke="white"
                  strokeWidth="0.5"
                />
              ))}
              <circle
                cx="50"
                cy="50"
                r="20"
                fill="white"
                stroke="#e5e7eb"
                strokeWidth="1"
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-sm font-bold text-satellite-deep">
                  {breakdown.length}
                </div>
                <div className="text-xs text-muted-foreground">Zones</div>
              </div>
            </div>
          </div>
        </div>

        {/* Legend and Details */}
        <div className="space-y-2">
          {segments.map((segment, index) => (
            <div key={segment.zone} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className={`w-3 h-3 rounded-full ${segment.color.replace('text-', 'bg-')}`} />
                <span className="text-sm font-medium">{segment.zone}</span>
              </div>
              <div className="flex items-center gap-2">
                <span className="text-sm text-muted-foreground">
                  {segment.percentage.toFixed(1)}%
                </span>
                <Badge 
                  variant={getImpactColor(getImpactLevel(segment.percentage)) as any}
                  className="text-xs"
                >
                  {getImpactLevel(segment.percentage)}
                </Badge>
              </div>
            </div>
          ))}
        </div>

        {/* Summary Stats */}
        <div className="border-t pt-3 space-y-2">
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Most Affected:</span>
            <span className="text-satellite-deep font-semibold">
              {mostAffected.zone} ({mostAffected.percentage.toFixed(1)}%)
            </span>
          </div>
          <div className="flex justify-between items-center text-sm">
            <span className="font-medium">Least Affected:</span>
            <span className="text-muted-foreground">
              {leastAffected.zone} ({leastAffected.percentage.toFixed(1)}%)
            </span>
          </div>
        </div>
      </CardContent>
    </Card>
  );
};