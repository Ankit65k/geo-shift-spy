import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ExternalLink, CheckCircle, AlertCircle, Globe, Search } from 'lucide-react';
import { useState } from 'react';

interface VerificationSuggestion {
  change_type: string;
  verification_sources: string[];
  confidence_level: number;
  recommended_action: string;
}

interface VerificationPanelProps {
  suggestions: VerificationSuggestion[];
  analysisData: any;
}

export const VerificationPanel = ({ suggestions, analysisData }: VerificationPanelProps) => {
  const [expandedSuggestion, setExpandedSuggestion] = useState<number | null>(null);

  const getVerificationLinks = (changeType: string, sources: string[]) => {
    const links = [];
    
    sources.forEach(source => {
      if (source.includes('Google Earth')) {
        links.push({
          name: 'Google Earth',
          url: 'https://earth.google.com/web/',
          description: 'Compare historical satellite imagery',
          icon: <Globe className="h-4 w-4" />
        });
      }
      if (source.includes('Forest monitoring') || source.includes('Environmental reports')) {
        links.push({
          name: 'Global Forest Watch',
          url: 'https://www.globalforestwatch.org/',
          description: 'Real-time forest monitoring data',
          icon: <Search className="h-4 w-4" />
        });
      }
      if (source.includes('Urban planning') || source.includes('Population growth')) {
        links.push({
          name: 'World Bank Open Data',
          url: 'https://data.worldbank.org/',
          description: 'Urban development and population statistics',
          icon: <ExternalLink className="h-4 w-4" />
        });
      }
      if (source.includes('Weather data') || source.includes('Hydrological')) {
        links.push({
          name: 'NASA Earth Data',
          url: 'https://earthdata.nasa.gov/',
          description: 'Climate and hydrological data',
          icon: <Globe className="h-4 w-4" />
        });
      }
    });

    // Add general verification sources
    if (links.length === 0) {
      links.push({
        name: 'Copernicus Open Access Hub',
        url: 'https://scihub.copernicus.eu/',
        description: 'Free satellite imagery access',
        icon: <Search className="h-4 w-4" />
      });
    }
    
    return links;
  };

  const getConfidenceColor = (confidence: number) => {
    if (confidence >= 0.85) return 'bg-green-100 text-green-800 border-green-200';
    if (confidence >= 0.75) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  const getConfidenceIcon = (confidence: number) => {
    if (confidence >= 0.85) return <CheckCircle className="h-4 w-4 text-green-600" />;
    return <AlertCircle className="h-4 w-4 text-yellow-600" />;
  };

  return (
    <Card className="shadow-card">
      <div className="p-4 bg-gradient-to-r from-purple-600 to-blue-600">
        <h4 className="font-semibold text-white flex items-center gap-2">
          <CheckCircle className="h-5 w-5" />
          AI Analysis Verification
        </h4>
        <p className="text-purple-100 text-sm mt-1">
          Cross-verify our findings with external data sources for validation
        </p>
      </div>
      
      <div className="p-6 space-y-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h5 className="font-medium text-blue-900 mb-2 flex items-center gap-2">
            <AlertCircle className="h-4 w-4" />
            Why Verify AI Results?
          </h5>
          <p className="text-blue-800 text-sm">
            While our AI provides {((analysisData.overall_assessment?.confidence_score || 0.8) * 100).toFixed(0)}% confidence analysis, 
            cross-referencing with established data sources enhances reliability and provides additional context for decision-making.
          </p>
        </div>

        {/* Overall Data Quality */}
        {analysisData.data_quality && (
          <div className="bg-gray-50 rounded-lg p-4">
            <h5 className="font-medium text-gray-900 mb-3">Analysis Conditions</h5>
            <div className="grid md:grid-cols-2 gap-3 text-sm">
              <div className="flex justify-between">
                <span>Cloud Coverage:</span>
                <Badge variant="outline">{analysisData.data_quality.cloud_coverage_percent}%</Badge>
              </div>
              <div className="flex justify-between">
                <span>Image Quality:</span>
                <Badge variant="outline">{analysisData.data_quality.image_quality_score}/1.5</Badge>
              </div>
              <div className="flex justify-between">
                <span>Atmospheric Conditions:</span>
                <Badge variant="outline">{analysisData.data_quality.atmospheric_conditions}</Badge>
              </div>
              <div className="flex justify-between">
                <span>Temporal Gap:</span>
                <Badge variant="outline">{analysisData.data_quality.temporal_gap_days} days</Badge>
              </div>
            </div>
          </div>
        )}

        {/* Verification Suggestions */}
        <div className="space-y-3">
          <h5 className="font-medium text-gray-900">Verification Suggestions by Change Type</h5>
          
          {suggestions.map((suggestion, index) => (
            <div key={index} className="border rounded-lg">
              <div 
                className="p-4 cursor-pointer hover:bg-gray-50"
                onClick={() => setExpandedSuggestion(expandedSuggestion === index ? null : index)}
              >
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    {getConfidenceIcon(suggestion.confidence_level)}
                    <div>
                      <h6 className="font-medium capitalize">
                        {suggestion.change_type.replace('_', ' ')} Verification
                      </h6>
                      <p className="text-sm text-gray-600">{suggestion.recommended_action}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Badge className={`text-xs ${getConfidenceColor(suggestion.confidence_level)}`}>
                      {(suggestion.confidence_level * 100).toFixed(0)}% Confidence
                    </Badge>
                    <span className="text-gray-400">
                      {expandedSuggestion === index ? '▼' : '▶'}
                    </span>
                  </div>
                </div>
              </div>
              
              {expandedSuggestion === index && (
                <div className="px-4 pb-4 border-t bg-gray-50">
                  <div className="pt-3 space-y-3">
                    <div>
                      <h6 className="font-medium text-sm text-gray-700 mb-2">Recommended Data Sources:</h6>
                      <div className="space-y-2">
                        {suggestion.verification_sources.map((source, sourceIndex) => (
                          <div key={sourceIndex} className="flex items-center gap-2 text-sm">
                            <span className="w-2 h-2 bg-blue-400 rounded-full"></span>
                            <span className="text-gray-700">{source}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                    
                    <div>
                      <h6 className="font-medium text-sm text-gray-700 mb-2">Quick Access Links:</h6>
                      <div className="grid gap-2">
                        {getVerificationLinks(suggestion.change_type, suggestion.verification_sources).map((link, linkIndex) => (
                          <Button
                            key={linkIndex}
                            variant="outline"
                            size="sm"
                            onClick={() => window.open(link.url, '_blank')}
                            className="justify-start text-left h-auto p-2"
                          >
                            <div className="flex items-center gap-2">
                              {link.icon}
                              <div>
                                <div className="font-medium text-sm">{link.name}</div>
                                <div className="text-xs text-gray-600">{link.description}</div>
                              </div>
                              <ExternalLink className="h-3 w-3 ml-auto" />
                            </div>
                          </Button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>

        {/* General Verification Tips */}
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <h5 className="font-medium text-green-900 mb-2">General Verification Tips</h5>
          <ul className="text-green-800 text-sm space-y-1">
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span>Compare our analysis timeframe with multiple satellite image dates</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span>Check local news sources for events during the analysis period</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span>Cross-reference with government land use or environmental databases</span>
            </li>
            <li className="flex items-start gap-2">
              <span className="text-green-600 mt-1">•</span>
              <span>Validate coordinates using mapping services like Google Maps or OpenStreetMap</span>
            </li>
          </ul>
        </div>

        {/* Analysis ID for Reference */}
        <div className="text-center text-sm text-gray-500 border-t pt-4">
          <div>Analysis ID: <code className="bg-gray-100 px-2 py-1 rounded text-xs">{analysisData.analysis_id}</code></div>
          <div className="mt-1">Generated: {new Date(analysisData.timestamp).toLocaleString()}</div>
        </div>
      </div>
    </Card>
  );
};