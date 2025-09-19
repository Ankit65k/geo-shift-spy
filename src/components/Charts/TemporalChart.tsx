import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { TrendingUp, TrendingDown, Minus } from 'lucide-react';
import { TemporalAnalysis, TrendAnalysis } from '@/services/api';

interface TemporalChartProps {
  temporalTrends: TemporalAnalysis;
  trendAnalysis?: TrendAnalysis;
  changePercentage: number;
}

export const TemporalChart: React.FC<TemporalChartProps> = ({ 
  temporalTrends, 
  trendAnalysis,
  changePercentage 
}) => {
  const getTrendIcon = (direction: string) => {
    if (direction.toLowerCase().includes('accelerating')) {
      return <TrendingUp className="h-4 w-4 text-red-500" />;
    }
    if (direction.toLowerCase().includes('gradual')) {
      return <TrendingDown className="h-4 w-4 text-yellow-500" />;
    }
    return <Minus className="h-4 w-4 text-green-500" />;
  };

  const getVolatilityColor = (volatility: string) => {
    switch (volatility.toLowerCase()) {
      case 'high': return 'destructive';
      case 'moderate': return 'secondary';
      default: return 'outline';
    }
  };

  const getTrajectoryColor = (trajectory: string) => {
    switch (trajectory?.toLowerCase()) {
      case 'catastrophic': return 'destructive';
      case 'severe': return 'destructive';
      case 'concerning': return 'secondary';
      default: return 'default';
    }
  };

  // Simulate time series data for visualization
  const generateTimeSeriesData = () => {
    const monthlyRate = parseFloat(temporalTrends.rate_of_change.split('%')[0]);
    const points = [];
    const months = 12;
    
    for (let i = 0; i < months; i++) {
      const value = (monthlyRate * (i + 1)) + (Math.random() - 0.5) * (monthlyRate * 0.2);
      points.push({
        month: i + 1,
        value: Math.max(0, value),
        x: (i / (months - 1)) * 300,
        y: 100 - (Math.max(0, value) / changePercentage) * 80
      });
    }
    return points;
  };

  const timeSeriesData = generateTimeSeriesData();
  
  // Create SVG path from data points
  const pathData = timeSeriesData.reduce((path, point, index) => {
    const command = index === 0 ? 'M' : 'L';
    return `${path} ${command} ${point.x} ${point.y}`;
  }, '');

  return (
    <Card className="shadow-card">
      <CardHeader className="text-center">
        <CardTitle className="text-lg font-semibold text-satellite-deep">
          Temporal Change Analysis
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Trend Visualization */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="mb-2 text-sm font-medium text-center">Change Progression (12 Months)</div>
          <svg width="100%" height="120" viewBox="0 0 300 120" className="mb-2">
            {/* Grid lines */}
            {[0, 25, 50, 75, 100].map(y => (
              <line
                key={y}
                x1="0"
                y1={y}
                x2="300"
                y2={y}
                stroke="#e5e7eb"
                strokeWidth="1"
                strokeDasharray="2,2"
              />
            ))}
            
            {/* Area under curve */}
            <path
              d={`${pathData} L 300 100 L 0 100 Z`}
              fill="currentColor"
              className="text-blue-500 opacity-10"
            />
            
            {/* Trend line */}
            <path
              d={pathData}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              className="text-blue-500"
            />
            
            {/* Data points */}
            {timeSeriesData.map((point, index) => (
              <circle
                key={index}
                cx={point.x}
                cy={point.y}
                r="3"
                fill="currentColor"
                className="text-blue-600"
              />
            ))}
          </svg>
          <div className="flex justify-between text-xs text-muted-foreground">
            <span>Jan</span>
            <span>Jun</span>
            <span>Dec</span>
          </div>
        </div>

        {/* Trend Metrics */}
        <div className="grid grid-cols-2 gap-3">
          <div className="space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium">Direction:</span>
              {getTrendIcon(temporalTrends.trend_direction)}
            </div>
            <div className="text-xs text-muted-foreground">
              {temporalTrends.trend_direction}
            </div>
          </div>
          
          <div className="space-y-2">
            <div className="flex items-center justify-between">
              <span className="text-sm font-medium">Rate:</span>
              <Badge variant="outline" className="text-xs">
                {temporalTrends.rate_of_change}
              </Badge>
            </div>
          </div>
        </div>

        {/* Additional Metrics */}
        <div className="space-y-2 border-t pt-3">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Volatility:</span>
            <Badge variant={getVolatilityColor(temporalTrends.volatility) as any} className="uppercase">
              {temporalTrends.volatility}
            </Badge>
          </div>
          
          {trendAnalysis && (
            <>
              <div className="flex justify-between items-center">
                <span className="text-sm font-medium">Trajectory:</span>
                <Badge variant={getTrajectoryColor(trendAnalysis.currentTrajectory) as any}>
                  {trendAnalysis.currentTrajectory}
                </Badge>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Critical Threshold:</div>
                <div className="text-xs">{trendAnalysis.criticalThreshold}</div>
              </div>
              
              <div className="space-y-1">
                <div className="text-xs font-medium text-muted-foreground">Time to Threshold:</div>
                <div className="text-xs">{trendAnalysis.timeToThreshold}</div>
              </div>
            </>
          )}
        </div>

        {/* Seasonality Note */}
        <div className="text-xs text-muted-foreground bg-blue-50 p-2 rounded">
          <strong>Note:</strong> {temporalTrends.seasonality}
        </div>
      </CardContent>
    </Card>
  );
};