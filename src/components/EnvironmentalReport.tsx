import React, { useState } from 'react';
import { Card, CardHeader, CardTitle, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { 
  FileText, 
  TrendingUp, 
  AlertTriangle, 
  Target,
  Clock,
  MapPin,
  BarChart3,
  Download,
  Eye,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { EnvironmentalReport as EnvironmentalReportType } from '@/services/api';
import { RiskGauge } from '@/components/Charts/RiskGauge';
import { ZonalChart } from '@/components/Charts/ZonalChart';
import { TemporalChart } from '@/components/Charts/TemporalChart';

interface EnvironmentalReportProps {
  report: EnvironmentalReportType;
  onDownloadReport?: () => void;
}

export const EnvironmentalReport: React.FC<EnvironmentalReportProps> = ({ 
  report, 
  onDownloadReport 
}) => {
  const [expandedSections, setExpandedSections] = useState<string[]>(['summary']);

  const toggleSection = (sectionId: string) => {
    setExpandedSections(prev => 
      prev.includes(sectionId) 
        ? prev.filter(id => id !== sectionId)
        : [...prev, sectionId]
    );
  };

  const isExpanded = (sectionId: string) => expandedSections.includes(sectionId);

  // Format executive summary for better display
  const formatExecutiveSummary = (summary: string) => {
    return summary.split('\n\n').map((paragraph, index) => (
      <div key={index} className="mb-4">
        <p className="text-sm leading-relaxed text-gray-700">
          {paragraph.replace(/🌍|📊|🏷️|📍|⏱️|⚠️/g, '').trim()}
        </p>
      </div>
    ));
  };

  // Parse key insights to remove markdown and emojis
  const formatKeyInsight = (insight: string) => {
    return insight.replace(/\*\*([^*]+)\*\*/g, '$1').replace(/🔍|🏷️|⚠️|📍|🌍|💰|⏱️|🎯/g, '').trim();
  };

  return (
    <div className="space-y-6">
      {/* Header with Action Buttons */}
      <Card className="shadow-card">
        <CardHeader>
          <div className="flex justify-between items-start">
            <div>
              <CardTitle className="flex items-center gap-2 text-xl font-bold text-satellite-deep">
                <FileText className="h-5 w-5" />
                Environmental Analysis Report
              </CardTitle>
              <div className="flex items-center gap-4 mt-2 text-sm text-muted-foreground">
                <div className="flex items-center gap-1">
                  <MapPin className="h-4 w-4" />
                  {report.metadata.location}
                </div>
                <div className="flex items-center gap-1">
                  <Clock className="h-4 w-4" />
                  {new Date(report.metadata.analysisTimestamp).toLocaleString()}
                </div>
                <Badge variant="outline">v{report.metadata.analysisVersion}</Badge>
              </div>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={onDownloadReport}>
                <Download className="h-4 w-4 mr-1" />
                Download
              </Button>
            </div>
          </div>
        </CardHeader>
      </Card>

      {/* Executive Summary */}
      <Card className="shadow-card">
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('summary')}
        >
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <Eye className="h-5 w-5" />
              Executive Summary
            </div>
            {isExpanded('summary') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardTitle>
        </CardHeader>
        {isExpanded('summary') && (
          <CardContent>
            <div className="bg-blue-50 p-4 rounded-lg border-l-4 border-blue-500">
              <div className="prose prose-sm max-w-none">
                {formatExecutiveSummary(report.executiveSummary)}
              </div>
            </div>
          </CardContent>
        )}
      </Card>

      {/* Analysis Dashboard */}
      <div className="grid lg:grid-cols-3 gap-6">
        <RiskGauge
          riskScore={report.analysis.riskScore}
          severity={report.analysis.severity}
          urgencyLevel={report.analysis.urgencyLevel}
          confidence={report.metadata.confidence}
        />
        <ZonalChart
          zonalAnalysis={report.analysis.zonalAnalysis}
          totalChangePercentage={report.analysis.totalChangePercentage}
        />
        <TemporalChart
          temporalTrends={report.analysis.temporalTrends}
          trendAnalysis={report.predictions.trendAnalysis}
          changePercentage={report.analysis.totalChangePercentage}
        />
      </div>

      {/* Key Insights */}
      <Card className="shadow-card">
        <CardHeader 
          className="cursor-pointer"
          onClick={() => toggleSection('insights')}
        >
          <CardTitle className="flex items-center justify-between text-lg">
            <div className="flex items-center gap-2">
              <TrendingUp className="h-5 w-5" />
              Key Insights
            </div>
            {isExpanded('insights') ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
          </CardTitle>
        </CardHeader>
        {isExpanded('insights') && (
          <CardContent>
            <div className="grid gap-3">
              {report.keyInsights.map((insight, index) => (
                <div key={index} className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg">
                  <div className="w-6 h-6 rounded-full bg-blue-500 text-white flex items-center justify-center text-xs font-bold">
                    {index + 1}
                  </div>
                  <p className="text-sm text-gray-700 flex-1">
                    {formatKeyInsight(insight)}
                  </p>
                </div>
              ))}
            </div>
          </CardContent>
        )}
      </Card>

      {/* Detailed Analysis Tabs */}
      <Card className="shadow-card">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-lg">
            <BarChart3 className="h-5 w-5" />
            Detailed Analysis
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="predictions" className="w-full">
            <TabsList className="grid w-full grid-cols-2">
              <TabsTrigger value="predictions" className="flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Future Predictions
              </TabsTrigger>
              <TabsTrigger value="recommendations" className="flex items-center gap-2">
                <Target className="h-4 w-4" />
                Recommendations
              </TabsTrigger>
            </TabsList>

            <TabsContent value="predictions" className="space-y-4">
              <div className="grid md:grid-cols-3 gap-4">
                {/* Short Term Predictions */}
                <Card className="border border-orange-200 bg-orange-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-orange-800">
                      Short Term ({report.predictions.shortTerm.period})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-orange-900">Projected Change:</p>
                      <p className="text-sm text-orange-700">{report.predictions.shortTerm.projectedChange}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-orange-900">Scenario:</p>
                      <p className="text-sm text-orange-700">{report.predictions.shortTerm.scenario}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-orange-900">Confidence:</span>
                      <Badge variant="outline" className="bg-white">
                        {(report.predictions.shortTerm.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-orange-900">Risk Level:</span>
                      <Badge variant="secondary">
                        {report.predictions.shortTerm.riskLevel}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Medium Term Predictions */}
                <Card className="border border-yellow-200 bg-yellow-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-yellow-800">
                      Medium Term ({report.predictions.mediumTerm.period})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Projected Change:</p>
                      <p className="text-sm text-yellow-700">{report.predictions.mediumTerm.projectedChange}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-yellow-900">Scenario:</p>
                      <p className="text-sm text-yellow-700">{report.predictions.mediumTerm.scenario}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-yellow-900">Confidence:</span>
                      <Badge variant="outline" className="bg-white">
                        {(report.predictions.mediumTerm.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-yellow-900">Risk Level:</span>
                      <Badge variant="secondary">
                        {report.predictions.mediumTerm.riskLevel}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>

                {/* Long Term Predictions */}
                <Card className="border border-red-200 bg-red-50">
                  <CardHeader className="pb-3">
                    <CardTitle className="text-base font-semibold text-red-800">
                      Long Term ({report.predictions.longTerm.period})
                    </CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-3">
                    <div>
                      <p className="text-sm font-medium text-red-900">Projected Change:</p>
                      <p className="text-sm text-red-700">{report.predictions.longTerm.projectedChange}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-red-900">Scenario:</p>
                      <p className="text-sm text-red-700">{report.predictions.longTerm.scenario}</p>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-red-900">Confidence:</span>
                      <Badge variant="outline" className="bg-white">
                        {(report.predictions.longTerm.confidence * 100).toFixed(0)}%
                      </Badge>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-sm font-medium text-red-900">Risk Level:</span>
                      <Badge variant="secondary">
                        {report.predictions.longTerm.riskLevel}
                      </Badge>
                    </div>
                  </CardContent>
                </Card>
              </div>

              {/* Trend Analysis Summary */}
              <Card className="bg-gray-50">
                <CardHeader>
                  <CardTitle className="text-base">Trend Analysis Summary</CardTitle>
                </CardHeader>
                <CardContent className="grid md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-gray-900">Current Trajectory:</p>
                    <Badge 
                      variant={
                        report.predictions.trendAnalysis.currentTrajectory.toLowerCase() === 'catastrophic' ? 'destructive' :
                        report.predictions.trendAnalysis.currentTrajectory.toLowerCase() === 'severe' ? 'destructive' :
                        report.predictions.trendAnalysis.currentTrajectory.toLowerCase() === 'concerning' ? 'secondary' : 'default'
                      }
                      className="mt-1"
                    >
                      {report.predictions.trendAnalysis.currentTrajectory}
                    </Badge>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-gray-900">Acceleration Factor:</p>
                    <p className="text-sm text-gray-700 mt-1">{report.predictions.trendAnalysis.accelerationFactor}</p>
                  </div>
                </CardContent>
              </Card>
            </TabsContent>

            <TabsContent value="recommendations" className="space-y-4">
              {/* Recommendations Executive Summary */}
              <Card className="bg-blue-50 border-blue-200">
                <CardContent className="pt-4">
                  <p className="text-sm text-blue-800 font-medium">
                    {report.recommendations.executiveSummary}
                  </p>
                </CardContent>
              </Card>

              {/* Action Categories */}
              <div className="space-y-4">
                {/* Immediate Actions */}
                <Card className="border-red-200">
                  <CardHeader className="bg-red-50">
                    <CardTitle className="flex items-center gap-2 text-red-800">
                      <AlertTriangle className="h-4 w-4" />
                      {report.recommendations.immediateActions.title}
                    </CardTitle>
                    <div className="flex gap-4 text-sm text-red-600">
                      <span>⏰ {report.recommendations.immediateActions.timeframe}</span>
                      <span>💰 {report.recommendations.immediateActions.totalEstimatedCost}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {report.recommendations.immediateActions.actions.map((action, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-white">
                          <div className="font-medium text-sm text-red-900 mb-2">{action.action}</div>
                          <div className="grid md:grid-cols-3 gap-2 text-xs text-gray-600">
                            <div>
                              <span className="font-medium">Responsible:</span> {action.responsible}
                            </div>
                            <div>
                              <span className="font-medium">Timeline:</span> {action.timeline}
                            </div>
                            <div>
                              <span className="font-medium">Cost:</span> {action.cost}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            <span className="font-medium">Success Metrics:</span> {action.successMetrics}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Short Term Actions */}
                <Card className="border-orange-200">
                  <CardHeader className="bg-orange-50">
                    <CardTitle className="flex items-center gap-2 text-orange-800">
                      <Clock className="h-4 w-4" />
                      {report.recommendations.shortTermActions.title}
                    </CardTitle>
                    <div className="flex gap-4 text-sm text-orange-600">
                      <span>⏰ {report.recommendations.shortTermActions.timeframe}</span>
                      <span>💰 {report.recommendations.shortTermActions.totalEstimatedCost}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {report.recommendations.shortTermActions.actions.map((action, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-white">
                          <div className="font-medium text-sm text-orange-900 mb-2">{action.action}</div>
                          <div className="grid md:grid-cols-3 gap-2 text-xs text-gray-600">
                            <div>
                              <span className="font-medium">Responsible:</span> {action.responsible}
                            </div>
                            <div>
                              <span className="font-medium">Timeline:</span> {action.timeline}
                            </div>
                            <div>
                              <span className="font-medium">Cost:</span> {action.cost}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            <span className="font-medium">Success Metrics:</span> {action.successMetrics}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>

                {/* Long Term Actions */}
                <Card className="border-green-200">
                  <CardHeader className="bg-green-50">
                    <CardTitle className="flex items-center gap-2 text-green-800">
                      <Target className="h-4 w-4" />
                      {report.recommendations.longTermActions.title}
                    </CardTitle>
                    <div className="flex gap-4 text-sm text-green-600">
                      <span>⏰ {report.recommendations.longTermActions.timeframe}</span>
                      <span>💰 {report.recommendations.longTermActions.totalEstimatedCost}</span>
                    </div>
                  </CardHeader>
                  <CardContent>
                    <div className="grid gap-3">
                      {report.recommendations.longTermActions.actions.map((action, index) => (
                        <div key={index} className="border rounded-lg p-3 bg-white">
                          <div className="font-medium text-sm text-green-900 mb-2">{action.action}</div>
                          <div className="grid md:grid-cols-3 gap-2 text-xs text-gray-600">
                            <div>
                              <span className="font-medium">Responsible:</span> {action.responsible}
                            </div>
                            <div>
                              <span className="font-medium">Timeline:</span> {action.timeline}
                            </div>
                            <div>
                              <span className="font-medium">Cost:</span> {action.cost}
                            </div>
                          </div>
                          <div className="mt-2 text-xs text-gray-600">
                            <span className="font-medium">Success Metrics:</span> {action.successMetrics}
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              </div>
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Metadata Footer */}
      <Card className="shadow-card">
        <CardContent className="pt-4">
          <div className="flex justify-between items-center text-sm text-muted-foreground">
            <div>
              Analysis generated on {new Date(report.metadata.analysisTimestamp).toLocaleString()}
            </div>
            <div>
              Next review date: {report.metadata.nextReviewDate}
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
};