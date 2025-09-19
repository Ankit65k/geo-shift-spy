import React from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';

interface RiskGaugeProps {
  riskScore: number;
  severity: string;
  urgencyLevel: string;
  confidence: number;
}

export const RiskGauge: React.FC<RiskGaugeProps> = ({ 
  riskScore, 
  severity, 
  urgencyLevel, 
  confidence 
}) => {
  const getRiskColor = (score: number) => {
    if (score >= 8) return 'bg-red-500';
    if (score >= 6) return 'bg-orange-500';
    if (score >= 4) return 'bg-yellow-500';
    return 'bg-green-500';
  };

  const getSeverityColor = (severity: string) => {
    switch (severity.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'secondary';
      case 'medium': return 'default';
      default: return 'outline';
    }
  };

  const getUrgencyColor = (urgency: string) => {
    switch (urgency.toLowerCase()) {
      case 'critical': return 'destructive';
      case 'high': return 'destructive';
      case 'medium': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <Card className="shadow-card">
      <CardHeader className="text-center">
        <CardTitle className="text-lg font-semibold text-satellite-deep">
          Risk Assessment
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Risk Score Gauge */}
        <div className="text-center">
          <div className="relative inline-flex items-center justify-center w-24 h-24 mb-3">
            <svg className="w-24 h-24 transform -rotate-90" viewBox="0 0 84 84">
              <circle
                cx="42"
                cy="42"
                r="36"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                className="text-gray-200"
              />
              <circle
                cx="42"
                cy="42"
                r="36"
                fill="transparent"
                stroke="currentColor"
                strokeWidth="8"
                strokeLinecap="round"
                strokeDasharray={`${(riskScore / 10) * 226.2} 226.2`}
                className={getRiskColor(riskScore).replace('bg-', 'text-')}
              />
            </svg>
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="text-center">
                <div className="text-2xl font-bold text-satellite-deep">
                  {riskScore}
                </div>
                <div className="text-xs text-muted-foreground">/ 10</div>
              </div>
            </div>
          </div>
        </div>

        {/* Status Badges */}
        <div className="flex flex-col gap-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Severity:</span>
            <Badge variant={getSeverityColor(severity) as any} className="uppercase">
              {severity}
            </Badge>
          </div>
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Urgency:</span>
            <Badge variant={getUrgencyColor(urgencyLevel) as any} className="uppercase">
              {urgencyLevel}
            </Badge>
          </div>
        </div>

        {/* Confidence Indicator */}
        <div className="space-y-2">
          <div className="flex justify-between items-center">
            <span className="text-sm font-medium">Confidence:</span>
            <span className="text-sm text-muted-foreground">
              {(confidence * 100).toFixed(0)}%
            </span>
          </div>
          <Progress 
            value={confidence * 100} 
            className="h-2"
          />
        </div>
      </CardContent>
    </Card>
  );
};