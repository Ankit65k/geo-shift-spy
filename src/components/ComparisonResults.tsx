import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { TrendingUp, TrendingDown, Minus, FileDown, Eye, Download, FileText, PieChart } from 'lucide-react';
import { EnvironmentalReport } from '@/components/EnvironmentalReport';
import { CompareImagesResponse } from '@/services/api';
import { downloadEnvironmentalReport } from '@/utils/reportGenerator';
import { SummaryGenerator } from '@/utils/summaryGenerator';
import { InfographicGenerator } from '@/utils/infographicGenerator';
import { ExecutiveSummaryPreview } from '@/components/ExecutiveSummaryPreview';
import { VerificationPanel } from '@/components/VerificationPanel';
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
  const [isDownloading, setIsDownloading] = useState(false);
  
  // Handle both old and new response formats
  const change_percentage = response.change_percentage || response.overall_assessment?.change_percentage || 0;
  const heatmap_url = response.heatmap_url;
  const environmental_report = response.environmental_report;
  const ai_analysis = response.ai_analysis;
  const metadata = response.metadata;
  
  // Handle enhanced response format
  const enhanced_response = response.overall_assessment ? response : null;
  const executive_summary = response.executive_summary;
  const detected_changes = response.detected_changes || [];
  const overall_assessment = response.overall_assessment;
  
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

  // New download handlers for enhanced features
  const handleDownloadTextSummary = async () => {
    if (!enhanced_response) return;
    
    setIsDownloading(true);
    try {
      const generator = new SummaryGenerator();
      generator.downloadTextSummary(enhanced_response);
    } catch (error) {
      console.error('Error generating text summary:', error);
      alert('Failed to generate text summary. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadPDFSummary = async () => {
    if (!enhanced_response) return;
    
    setIsDownloading(true);
    try {
      const generator = new SummaryGenerator();
      await generator.downloadPDFSummary(enhanced_response, beforeImage, afterImage);
    } catch (error) {
      console.error('Error generating PDF summary:', error);
      alert('Failed to generate PDF summary. Please try again.');
    } finally {
      setIsDownloading(false);
    }
  };

  const handleDownloadInfographic = async () => {
    if (!enhanced_response) return;
    
    setIsDownloading(true);
    try {
      const generator = new InfographicGenerator();
      
      // Create image objects from file data
      const beforeImageObj = new Image();
      const afterImageObj = new Image();
      
      beforeImageObj.src = URL.createObjectURL(beforeImage);
      afterImageObj.src = URL.createObjectURL(afterImage);
      
      await new Promise((resolve) => {
        let loadedImages = 0;
        const checkLoaded = () => {
          loadedImages++;
          if (loadedImages === 2) resolve(true);
        };
        beforeImageObj.onload = checkLoaded;
        afterImageObj.onload = checkLoaded;
      });
      
      await generator.generateAndDownload(enhanced_response, beforeImageObj, afterImageObj);
    } catch (error) {
      console.error('Error generating infographic:', error);
      alert('Failed to generate infographic. Please try again.');
    } finally {
      setIsDownloading(false);
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
      {/* Enhanced Change Summary */}
      <Card className="p-6 bg-gradient-subtle shadow-card">
        <div className="text-center">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Badge variant={getChangeColor() as any} className="flex items-center gap-1 px-3 py-1">
              {getChangeIcon()}
              {getChangeDescription()}
            </Badge>
            {(metadata?.severity || overall_assessment?.overall_severity) && (
              <Badge variant="outline" className="uppercase">
                {metadata?.severity || overall_assessment?.overall_severity} Severity
              </Badge>
            )}
            {overall_assessment?.urgency_level && (
              <Badge variant="destructive" className="uppercase">
                {overall_assessment.urgency_level.replace('_', ' ')}
              </Badge>
            )}
          </div>
          <div className="space-y-2">
            <h3 className="text-2xl font-bold text-satellite-deep">
              {(overall_assessment?.total_area_changed_sq_km || change_percentage)?.toFixed(2)}
              {overall_assessment ? ' km² Changed' : '% Change Detected'}
            </h3>
            <Progress 
              value={Math.min(overall_assessment?.confidence_score * 100 || change_percentage, 100)} 
              className="w-full max-w-md mx-auto h-3"
            />
            <p className="text-sm text-muted-foreground">
              Analysis complete • 
              {overall_assessment ? 
                `${(overall_assessment.confidence_score * 100).toFixed(1)}% confidence` : 
                `${change_percentage < 1 ? 'Low' : change_percentage < 10 ? 'Medium' : 'High'} confidence`
              }
              {ai_analysis?.changeType && ` • Type: ${ai_analysis.changeType}`}
            </p>
          </div>
        </div>
      </Card>
      
      {/* Enhanced Executive Summary */}
      {executive_summary && (
        <Card className="shadow-card">
          <div className="p-4 bg-gradient-space">
            <h4 className="font-semibold text-white flex items-center gap-2">
              🧠 AI Executive Summary
            </h4>
          </div>
          <div className="p-6 space-y-4">
            {executive_summary.main_finding && (
              <div className="bg-blue-50 border-l-4 border-blue-400 p-4 rounded">
                <h5 className="font-medium text-blue-900 mb-2">Key Finding</h5>
                <p className="text-blue-800">{executive_summary.main_finding}</p>
              </div>
            )}
            
            {executive_summary.specific_observations && (
              <div>
                <h5 className="font-medium text-satellite-deep mb-2">Detailed Observations</h5>
                <p className="text-gray-700">{executive_summary.specific_observations}</p>
              </div>
            )}
            
            {executive_summary.geographic_features && (
              <div>
                <h5 className="font-medium text-satellite-deep mb-2">Geographic Analysis</h5>
                <p className="text-gray-700">{executive_summary.geographic_features}</p>
              </div>
            )}
            
            {executive_summary.zone_analysis && (
              <div>
                <h5 className="font-medium text-satellite-deep mb-2">Zone-wise Analysis</h5>
                <p className="text-gray-700">{executive_summary.zone_analysis}</p>
              </div>
            )}
            
            {executive_summary.temporal_analysis && (
              <div>
                <h5 className="font-medium text-satellite-deep mb-2">Temporal Trends</h5>
                <p className="text-gray-700">{executive_summary.temporal_analysis}</p>
              </div>
            )}
            
            {executive_summary.possible_causes && (
              <div>
                <h5 className="font-medium text-satellite-deep mb-2">Possible Causes</h5>
                <p className="text-gray-700">{executive_summary.possible_causes}</p>
              </div>
            )}
            
            {executive_summary.urgency_assessment && (
              <div className="bg-orange-50 border-l-4 border-orange-400 p-4 rounded">
                <h5 className="font-medium text-orange-900 mb-2">Urgency Assessment</h5>
                <p className="text-orange-800">{executive_summary.urgency_assessment}</p>
              </div>
            )}
          </div>
        </Card>
      )}
      
      {/* Executive Summary Preview with Download Options */}
      {enhanced_response && (
        <ExecutiveSummaryPreview
          response={enhanced_response}
          onDownloadPDF={handleDownloadPDFSummary}
          onDownloadText={handleDownloadTextSummary}
          onDownloadInfographic={handleDownloadInfographic}
          isDownloading={isDownloading}
        />
      )}
      
      {/* Detected Changes */}
      {detected_changes.length > 0 && (
        <Card className="shadow-card">
          <div className="p-4 bg-gradient-earth">
            <h4 className="font-semibold text-white">
              🔍 Detected Changes ({detected_changes.length})
            </h4>
          </div>
          <div className="p-6">
            <div className="grid gap-4">
              {detected_changes.map((change, index) => (
                <div key={index} className="border rounded-lg p-4 bg-white">
                  <div className="flex items-center justify-between mb-2">
                    <Badge variant="outline" className="capitalize">
                      {change.type?.replace('_', ' ')}
                    </Badge>
                    <Badge variant={change.severity === 'high' ? 'destructive' : 'default'}>
                      {change.severity} Severity
                    </Badge>
                  </div>
                  <div className="grid md:grid-cols-3 gap-2 text-sm">
                    <div>
                      <strong>Area:</strong> {change.area_sq_km?.toFixed(1)} km²
                    </div>
                    <div>
                      <strong>Percentage:</strong> {change.area_percentage?.toFixed(1)}%
                    </div>
                    <div>
                      <strong>Confidence:</strong> {(change.confidence * 100)?.toFixed(1)}%
                    </div>
                  </div>
                  {change.environmental_impact && (
                    <div className="mt-2 pt-2 border-t">
                      <strong className="text-xs uppercase tracking-wide text-gray-500">Environmental Impact:</strong>
                      <div className="text-xs text-gray-600 mt-1">
                        {Object.entries(change.environmental_impact).map(([key, value]) => (
                          <div key={key} className="inline-block mr-4">
                            <strong>{key.replace('_', ' ')}:</strong> {value}
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </Card>
      )}

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

      {/* Enhanced Download Options */}
      {(environmental_report || enhanced_response) && (
        <Card className="shadow-card">
          <div className="p-6">
            <h4 className="font-semibold text-satellite-deep mb-3 text-center">Export Analysis Results</h4>
            <p className="text-sm text-muted-foreground mb-6 text-center">
              Choose from multiple formats to download your satellite analysis results
            </p>
            
            {/* Enhanced Analysis Exports */}
            {enhanced_response && (
              <div className="mb-6">
                <h5 className="font-medium text-satellite-deep mb-3 flex items-center gap-2">
                  <PieChart className="h-4 w-4" />
                  Professional Analysis Exports
                </h5>
                <div className="grid md:grid-cols-3 gap-3">
                  <Button 
                    variant="outline"
                    onClick={handleDownloadInfographic}
                    disabled={isDownloading}
                    className="flex flex-col items-center gap-2 h-auto p-4 hover:bg-blue-50"
                  >
                    <PieChart className="h-6 w-6 text-blue-600" />
                    <div className="text-center">
                      <div className="font-medium">Infographic</div>
                      <div className="text-xs text-muted-foreground">Visual Summary PNG</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleDownloadPDFSummary}
                    disabled={isDownloading}
                    className="flex flex-col items-center gap-2 h-auto p-4 hover:bg-red-50"
                  >
                    <FileDown className="h-6 w-6 text-red-600" />
                    <div className="text-center">
                      <div className="font-medium">PDF Report</div>
                      <div className="text-xs text-muted-foreground">Professional Format</div>
                    </div>
                  </Button>
                  
                  <Button 
                    variant="outline"
                    onClick={handleDownloadTextSummary}
                    disabled={isDownloading}
                    className="flex flex-col items-center gap-2 h-auto p-4 hover:bg-green-50"
                  >
                    <FileText className="h-6 w-6 text-green-600" />
                    <div className="text-center">
                      <div className="font-medium">Text Summary</div>
                      <div className="text-xs text-muted-foreground">Plain Text File</div>
                    </div>
                  </Button>
                </div>
              </div>
            )}
            
            {/* Traditional Environmental Report */}
            {environmental_report && (
              <div>
                <h5 className="font-medium text-satellite-deep mb-3 flex items-center gap-2">
                  <Eye className="h-4 w-4" />
                  Comprehensive Environmental Analysis
                </h5>
                <p className="text-sm text-muted-foreground mb-3">
                  Detailed insights including predictions, recommendations, and actionable data for authorities.
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
            )}
            
            {isDownloading && (
              <div className="mt-4 text-center">
                <div className="inline-flex items-center gap-2 text-sm text-muted-foreground">
                  <div className="animate-spin h-4 w-4 border-2 border-current border-t-transparent rounded-full"></div>
                  Generating download...
                </div>
              </div>
            )}
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
