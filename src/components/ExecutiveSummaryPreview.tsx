import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { FileDown, FileText, PieChart, TrendingUp, AlertTriangle, Clock } from 'lucide-react';
import { CompareImagesResponse } from '@/services/api';
import { SummaryGenerator } from '@/utils/summaryGenerator';

interface ExecutiveSummaryPreviewProps {
  response: CompareImagesResponse;
  onDownloadPDF: () => void;
  onDownloadText: () => void;
  onDownloadInfographic: () => void;
  isDownloading?: boolean;
}

export const ExecutiveSummaryPreview = ({
  response,
  onDownloadPDF,
  onDownloadText,
  onDownloadInfographic,
  isDownloading = false,
}: ExecutiveSummaryPreviewProps) => {
  const generator = new SummaryGenerator();
  const executiveSummary = generator.generateExecutiveSummary(response);

  return (
    <Card className="shadow-card bg-gradient-to-br from-blue-50 to-indigo-50 border-blue-200">
      <div className="p-4 bg-gradient-to-r from-blue-600 to-indigo-600">
        <h4 className="font-semibold text-white flex items-center gap-2">
          <TrendingUp className="h-5 w-5" />
          {executiveSummary.title}
        </h4>
        <p className="text-blue-100 text-sm mt-1">Quick Overview • {executiveSummary.date}</p>
      </div>
      
      <div className="p-6 space-y-4">
        {/* Key Metrics */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-lg font-bold text-blue-600">{executiveSummary.metrics.totalAreaChanged}</div>
            <div className="text-xs text-gray-600">Area Changed</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-lg font-bold text-green-600">{executiveSummary.metrics.changePercentage}</div>
            <div className="text-xs text-gray-600">Change %</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <div className="text-lg font-bold text-purple-600">{executiveSummary.metrics.confidenceScore}</div>
            <div className="text-xs text-gray-600">Confidence</div>
          </div>
          <div className="text-center p-3 bg-white rounded-lg border">
            <Badge 
              variant={executiveSummary.metrics.overallSeverity === 'high' ? 'destructive' : 'default'} 
              className="text-xs capitalize"
            >
              {executiveSummary.metrics.overallSeverity}
            </Badge>
            <div className="text-xs text-gray-600 mt-1">Severity</div>
          </div>
        </div>

        {/* Key Finding */}
        <div className="bg-white p-4 rounded-lg border border-blue-200">
          <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" />
            Key Finding
          </h5>
          <p className="text-blue-800 text-sm">{executiveSummary.keyFindings}</p>
        </div>

        {/* Detected Changes Summary */}
        {executiveSummary.detectedChanges.length > 0 && (
          <div className="bg-white p-4 rounded-lg border">
            <h5 className="font-medium text-gray-900 mb-3">Detected Changes ({executiveSummary.detectedChanges.length})</h5>
            <div className="grid gap-2">
              {executiveSummary.detectedChanges.slice(0, 3).map((change, index) => (
                <div key={index} className="flex items-center justify-between text-sm">
                  <span className="capitalize">{change.type}</span>
                  <div className="flex items-center gap-2">
                    <span className="text-gray-600">{change.area}</span>
                    <Badge variant="outline" size="sm">{change.confidence}</Badge>
                  </div>
                </div>
              ))}
              {executiveSummary.detectedChanges.length > 3 && (
                <div className="text-xs text-gray-500 text-center pt-2">
                  +{executiveSummary.detectedChanges.length - 3} more changes detected
                </div>
              )}
            </div>
          </div>
        )}

        {/* Urgency & Recommendations */}
        {(executiveSummary.recommendations.length > 0 || executiveSummary.metrics.urgencyLevel !== 'standard') && (
          <div className="bg-orange-50 p-4 rounded-lg border border-orange-200">
            <div className="flex items-center justify-between mb-2">
              <h5 className="font-medium text-orange-900 flex items-center gap-2">
                <Clock className="h-4 w-4" />
                Urgency Assessment
              </h5>
              <Badge variant={executiveSummary.metrics.urgencyLevel === 'immediate' ? 'destructive' : 'default'}>
                {executiveSummary.metrics.urgencyLevel.replace('_', ' ').toUpperCase()}
              </Badge>
            </div>
            {executiveSummary.recommendations.length > 0 && (
              <div>
                <p className="text-xs text-orange-700 mb-2">Immediate Actions Required:</p>
                <ul className="text-xs text-orange-800 space-y-1">
                  {executiveSummary.recommendations.slice(0, 2).map((rec, index) => (
                    <li key={index} className="flex items-start gap-1">
                      <span className="text-orange-500 mt-0.5">•</span>
                      <span>{rec}</span>
                    </li>
                  ))}
                  {executiveSummary.recommendations.length > 2 && (
                    <li className="text-orange-600">+{executiveSummary.recommendations.length - 2} more recommendations</li>
                  )}
                </ul>
              </div>
            )}
          </div>
        )}

        {/* AI Insights Preview */}
        {executiveSummary.aiInsights.length > 0 && (
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <h5 className="font-medium text-purple-900 mb-2">AI Insights ({executiveSummary.aiInsights.length})</h5>
            <div className="text-xs text-purple-800">
              {executiveSummary.aiInsights[0].summary.slice(0, 100)}...
              <span className="text-purple-600 ml-2 font-medium">
                {executiveSummary.aiInsights[0].confidence} confidence
              </span>
            </div>
          </div>
        )}

        {/* Download Actions */}
        <div className="pt-4 border-t">
          <p className="text-sm text-gray-600 mb-4 text-center">
            Download complete analysis in your preferred format
          </p>
          <div className="grid grid-cols-3 gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadInfographic}
              disabled={isDownloading}
              className="flex flex-col gap-1 h-auto p-3 hover:bg-blue-50"
            >
              <PieChart className="h-4 w-4 text-blue-600" />
              <span className="text-xs">Infographic</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadPDF}
              disabled={isDownloading}
              className="flex flex-col gap-1 h-auto p-3 hover:bg-red-50"
            >
              <FileDown className="h-4 w-4 text-red-600" />
              <span className="text-xs">PDF Report</span>
            </Button>
            
            <Button
              variant="outline"
              size="sm"
              onClick={onDownloadText}
              disabled={isDownloading}
              className="flex flex-col gap-1 h-auto p-3 hover:bg-green-50"
            >
              <FileText className="h-4 w-4 text-green-600" />
              <span className="text-xs">Text Summary</span>
            </Button>
          </div>
          
          {isDownloading && (
            <div className="mt-3 text-center">
              <div className="inline-flex items-center gap-2 text-xs text-gray-500">
                <div className="animate-spin h-3 w-3 border-2 border-current border-t-transparent rounded-full"></div>
                Generating download...
              </div>
            </div>
          )}
        </div>
      </div>
    </Card>
  );
};