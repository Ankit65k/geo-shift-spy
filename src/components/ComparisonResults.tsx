import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, FileDown, Eye } from 'lucide-react';
import { EnvironmentalReport } from '@/components/EnvironmentalReport';
import { CompareImagesResponse } from '@/services/api';
import { downloadEnvironmentalReport } from '@/utils/reportGenerator';
import { useState } from 'react';

interface ComparisonResultsProps {
  beforeImage: File;
  afterImage: File;
  response: CompareImagesResponse;
}

export const ComparisonResults = ({ 
  beforeImage, 
  afterImage, 
  response 
}: ComparisonResultsProps) => {
  const [showFullReport, setShowFullReport] = useState(false);
  const { change_percentage, heatmap_url, environmental_report, ai_analysis, metadata } = response;
  
  const getChangeIcon = () => {
    if (change_percentage > 10) return <TrendingUp className="h-4 w-4" />;
    if (change_percentage > 1) return <TrendingDown className="h-4 w-4" />;
    return <Minus className="h-4 w-4" />;
  };

  const getChangeColor = () => {
    if (change_percentage > 10) return 'destructive';
    if (change_percentage > 1) return 'default';
    return 'secondary';
  };

  const getChangeDescription = () => {
    if (change_percentage > 10) return 'Significant Change';
    if (change_percentage > 1) return 'Moderate Change';
    return 'Minimal Change';
  };

  const handleDownloadReport = async () => {
    if (environmental_report) {
      try {
        await downloadEnvironmentalReport(environmental_report, environmental_report.metadata.location);
      } catch (error) {
        console.error('Error generating PDF report:', error);
        alert('Failed to generate PDF report. Please try again.');
      }
    }
  };

  if (showFullReport && environmental_report) {
    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <Button 
            variant="outline" 
            onClick={() => setShowFullReport(false)}
            className="mb-4"
          >
            ← Back to Summary
          </Button>
        </div>
        <EnvironmentalReport 
          report={environmental_report} 
          onDownloadReport={handleDownloadReport}
        />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Change Summary */}
      <Card className="p-6 bg-gradient-subtle shadow-card">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant={getChangeColor() as any} className="flex items-center gap-1 px-3 py-1">
              {getChangeIcon()}
              {getChangeDescription()}
            </Badge>
            {metadata?.severity && (
              <Badge variant="outline" className="uppercase">
                {metadata.severity} Severity
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-satellite-deep">
              {change_percentage.toFixed(2)}% Change Detected
            </h3>
            <Progress 
              value={Math.min(change_percentage, 100)} 
              className="w-full max-w-md mx-auto h-3"
            />
            <p className="text-sm text-muted-foreground">
              Analysis complete • {change_percentage < 1 ? 'Low' : change_percentage < 10 ? 'Medium' : 'High'} confidence
              {ai_analysis?.changeType && ` • Type: ${ai_analysis.changeType}`}
            </p>
          </div>
        </div>
      </Card>

      {/* Enhanced AI Analysis */}
      {ai_analysis && (
        <Card className="shadow-card">
          <div className="p-4 bg-gradient-space">
            <div className="flex items-center justify-between">
              <h4 className="font-semibold text-white flex items-center gap-2">
                AI Analysis Results
              </h4>
              <div className="flex gap-2">
                {ai_analysis.confidence && (
                  <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                    Confidence: {(ai_analysis.confidence * 100).toFixed(0)}%
                  </Badge>
                )}
                {metadata?.risk_score && (
                  <Badge variant="outline" className="bg-white/20 text-white border-white/30">
                    Risk: {metadata.risk_score}/10
                  </Badge>
                )}
              </div>
            </div>
          </div>
          <div className="p-4 space-y-4">
            <div className="grid md:grid-cols-2 gap-4">
              <div>
                <h5 className="font-medium text-satellite-deep mb-2">Analysis Summary</h5>
                <p className="text-sm text-gray-700">{ai_analysis.summary}</p>
              </div>
              <div>
                <h5 className="font-medium text-satellite-deep mb-2">Detailed Findings</h5>
                <p className="text-sm text-gray-700">{ai_analysis.details}</p>
              </div>
            </div>
            
            {ai_analysis.geographicFeatures && (
              <div>
                <h5 className="font-medium text-satellite-deep mb-2">Geographic Features</h5>
                <p className="text-sm text-gray-700">{ai_analysis.geographicFeatures}</p>
              </div>
            )}
            
            {ai_analysis.changeIntensity && (
              <div>
                <h5 className="font-medium text-satellite-deep mb-2">Change Intensity</h5>
                <p className="text-sm text-gray-700">{ai_analysis.changeIntensity}</p>
              </div>
            )}
            
            {ai_analysis.specificObservations && ai_analysis.specificObservations.length > 0 && (
              <div>
                <h5 className="font-medium text-satellite-deep mb-2">Specific Observations</h5>
                <ul className="text-sm text-gray-700 space-y-1">
                  {ai_analysis.specificObservations.map((observation, index) => (
                    <li key={index} className="flex items-start gap-2">
                      <span className="text-blue-500 mt-1">•</span>
                      {observation}
                    </li>
                  ))}
                </ul>
              </div>
            )}
            
            {ai_analysis.possibleCauses && ai_analysis.possibleCauses.length > 0 && (
              <div>
                <h5 className="font-medium text-satellite-deep mb-2">Possible Causes</h5>
                <div className="flex flex-wrap gap-2">
                  {ai_analysis.possibleCauses.map((cause, index) => (
                    <Badge key={index} variant="secondary" className="text-xs">
                      {cause}
                    </Badge>
                  ))}
                </div>
              </div>
            )}
          </div>
        </Card>
      )}

      {/* Action Buttons */}
      {environmental_report && (
        <Card className="shadow-card">
          <div className="p-4 text-center">
            <h4 className="font-semibold text-satellite-deep mb-3">Comprehensive Environmental Analysis Available</h4>
            <p className="text-sm text-muted-foreground mb-4">
              Get detailed insights including predictions, recommendations, and actionable data for authorities.
            </p>
            <div className="flex gap-3 justify-center">
              <Button 
                onClick={() => setShowFullReport(true)}
                className="bg-gradient-earth hover:shadow-glow"
              >
                <Eye className="h-4 w-4 mr-2" />
                View Full Report
              </Button>
              <Button 
                variant="outline"
                onClick={handleDownloadReport}
              >
                <FileDown className="h-4 w-4 mr-2" />
                Download Report
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Image Comparison */}
      <div className="grid md:grid-cols-2 gap-6">
        <Card className="overflow-hidden shadow-card">
          <div className="p-4 bg-gradient-earth">
            <h4 className="font-semibold text-white flex items-center gap-2">
              Before Image
            </h4>
          </div>
          <div className="p-4">
            <img
              src={URL.createObjectURL(beforeImage)}
              alt="Before satellite image"
              className="w-full h-64 object-cover rounded-lg border border-border"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {beforeImage.name} • {(beforeImage.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </Card>

        <Card className="overflow-hidden shadow-card">
          <div className="p-4 bg-gradient-earth">
            <h4 className="font-semibold text-white flex items-center gap-2">
              After Image
            </h4>
          </div>
          <div className="p-4">
            <img
              src={URL.createObjectURL(afterImage)}
              alt="After satellite image"
              className="w-full h-64 object-cover rounded-lg border border-border"
            />
            <p className="mt-2 text-xs text-muted-foreground">
              {afterImage.name} • {(afterImage.size / 1024 / 1024).toFixed(2)} MB
            </p>
          </div>
        </Card>
      </div>

      {/* Heatmap Preview */}
      {heatmap_url && (
        <Card className="overflow-hidden shadow-card">
          <div className="p-4 bg-gradient-space">
            <h4 className="font-semibold text-white">Change Detection Heatmap</h4>
            <p className="text-sm text-white/80">Areas of detected change highlighted in red/orange</p>
          </div>
          <div className="p-4">
            <img
              src={heatmap_url}
              alt="Change detection heatmap"
              className="w-full h-64 object-cover rounded-lg border border-border"
            />
          </div>
        </Card>
      )}
    </div>
  );
};
