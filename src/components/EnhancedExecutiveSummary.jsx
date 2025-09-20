import React, { useState, useEffect } from 'react';
import { 
  ChevronDownIcon, 
  ChevronUpIcon,
  ExclamationTriangleIcon,
  MapPinIcon,
  ClockIcon,
  ChartBarIcon,
  DocumentDownloadIcon,
  EyeIcon,
  FireIcon,
  ShieldCheckIcon
} from '@heroicons/react/24/outline';

const EnhancedExecutiveSummary = ({ analysisData }) => {
  const [expandedSection, setExpandedSection] = useState(null);
  const [selectedZone, setSelectedZone] = useState(null);
  const [showInsights, setShowInsights] = useState(false);

  if (!analysisData || !analysisData.executive_summary) {
    return (
      <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
        <div className="animate-pulse">
          <div className="h-4 bg-gray-300 rounded w-3/4 mb-3"></div>
          <div className="h-4 bg-gray-300 rounded w-1/2 mb-3"></div>
          <div className="h-4 bg-gray-300 rounded w-5/6"></div>
        </div>
      </div>
    );
  }

  const { 
    executive_summary, 
    ai_insights, 
    interactive_components, 
    overall_assessment,
    processing_info,
    detected_changes
  } = analysisData;

  const getSeverityColor = (severity) => {
    switch (severity) {
      case 'critical': return 'text-red-600 bg-red-50 border-red-200';
      case 'high': return 'text-orange-600 bg-orange-50 border-orange-200';
      case 'moderate': return 'text-yellow-600 bg-yellow-50 border-yellow-200';
      case 'low': return 'text-green-600 bg-green-50 border-green-200';
      default: return 'text-gray-600 bg-gray-50 border-gray-200';
    }
  };

  const getUrgencyIcon = (urgencyLevel) => {
    if (urgencyLevel && urgencyLevel.includes('critical') || urgencyLevel.includes('immediate')) {
      return <FireIcon className="h-5 w-5 text-red-500" />;
    }
    if (urgencyLevel && urgencyLevel.includes('priority')) {
      return <ExclamationTriangleIcon className="h-5 w-5 text-orange-500" />;
    }
    return <ShieldCheckIcon className="h-5 w-5 text-blue-500" />;
  };

  const formatChangeType = (type) => {
    return type.replace('_', ' ').split(' ')
      .map(word => word.charAt(0).toUpperCase() + word.slice(1))
      .join(' ');
  };

  const toggleSection = (section) => {
    setExpandedSection(expandedSection === section ? null : section);
  };

  const handleZoneClick = (zone) => {
    setSelectedZone(zone);
  };

  return (
    <div className="bg-white border border-gray-200 rounded-lg shadow-sm">
      {/* Header */}
      <div className="px-6 py-4 border-b border-gray-200">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <div className={`px-3 py-1 rounded-full text-sm font-medium ${getSeverityColor(overall_assessment?.overall_severity)}`}>
              {overall_assessment?.overall_severity?.toUpperCase() || 'ANALYSIS'} PRIORITY
            </div>
            <div className="flex items-center text-sm text-gray-500">
              {getUrgencyIcon(executive_summary?.urgency_assessment)}
              <span className="ml-1">
                {processing_info?.model_used || 'AI Analysis'} • 
                {new Date(analysisData.timestamp).toLocaleDateString()}
              </span>
            </div>
          </div>
          <div className="flex items-center space-x-2">
            <button
              onClick={() => setShowInsights(!showInsights)}
              className="flex items-center px-3 py-1 text-sm text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
            >
              <EyeIcon className="h-4 w-4 mr-1" />
              AI Insights
            </button>
            <button className="flex items-center px-3 py-1 text-sm text-gray-600 hover:bg-gray-50 rounded-lg transition-colors">
              <DocumentDownloadIcon className="h-4 w-4 mr-1" />
              Export
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="p-6 space-y-6">
        {/* Primary Finding */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <h3 className="text-lg font-semibold text-blue-900 mb-2 flex items-center">
            <ChartBarIcon className="h-5 w-5 mr-2" />
            Key Environmental Finding
          </h3>
          <p className="text-blue-800 leading-relaxed">
            {executive_summary?.main_finding || 'Comprehensive satellite imagery analysis reveals significant environmental changes requiring attention.'}
          </p>
        </div>

        {/* Metrics Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">
              {overall_assessment?.total_area_changed_sq_km?.toFixed(1) || '0.0'} km²
            </div>
            <div className="text-sm text-gray-600">Total Area Changed</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">
              {((overall_assessment?.confidence_score || 0) * 100).toFixed(1)}%
            </div>
            <div className="text-sm text-gray-600">Confidence Level</div>
          </div>
          <div className="bg-gray-50 rounded-lg p-4">
            <div className="text-2xl font-bold text-gray-900">
              {detected_changes?.length || 0}
            </div>
            <div className="text-sm text-gray-600">Change Types Detected</div>
          </div>
        </div>

        {/* Specific Observations */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('observations')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <EyeIcon className="h-5 w-5 mr-2" />
              Detailed Observations
            </h3>
            {expandedSection === 'observations' ? 
              <ChevronUpIcon className="h-5 w-5 text-gray-500" /> : 
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            }
          </button>
          {expandedSection === 'observations' && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <p className="text-gray-700 leading-relaxed mt-3">
                {executive_summary?.specific_observations || 
                 'Advanced satellite analysis algorithms processed imagery data to identify environmental changes with high precision detection capabilities.'}
              </p>
            </div>
          )}
        </div>

        {/* Geographic Analysis */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('geographic')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <MapPinIcon className="h-5 w-5 mr-2" />
              Geographic Features
            </h3>
            {expandedSection === 'geographic' ? 
              <ChevronUpIcon className="h-5 w-5 text-gray-500" /> : 
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            }
          </button>
          {expandedSection === 'geographic' && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <p className="text-gray-700 leading-relaxed mt-3">
                {executive_summary?.geographic_features || 
                 'Geographic features analysis indicates complex terrain interactions influencing environmental change patterns.'}
              </p>
            </div>
          )}
        </div>

        {/* Zone Analysis */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('zones')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              Zone-wise Impact Distribution
            </h3>
            {expandedSection === 'zones' ? 
              <ChevronUpIcon className="h-5 w-5 text-gray-500" /> : 
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            }
          </button>
          {expandedSection === 'zones' && (
            <div className="px-4 pb-4 border-t border-gray-100 space-y-3">
              <p className="text-gray-700 leading-relaxed mt-3">
                {executive_summary?.zone_analysis || 
                 'Multi-zone spatial analysis reveals varying impact intensities across different geographic regions.'}
              </p>
              
              {/* Interactive Zone Cards */}
              {interactive_components?.clickable_zones?.high_impact_areas && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mt-4">
                  {interactive_components.clickable_zones.high_impact_areas.map((zone, index) => (
                    <div
                      key={zone.zone_id}
                      onClick={() => handleZoneClick(zone)}
                      className={`p-3 border rounded-lg cursor-pointer transition-all hover:shadow-md ${
                        selectedZone?.zone_id === zone.zone_id 
                          ? 'border-blue-500 bg-blue-50' 
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      <div className="flex items-center justify-between">
                        <div>
                          <div className="font-medium text-gray-900">{zone.zone_id.replace('_', ' ').toUpperCase()}</div>
                          <div className="text-sm text-gray-600">
                            {formatChangeType(zone.change_type)} • {zone.area_sq_km.toFixed(1)} km²
                          </div>
                        </div>
                        <div className={`px-2 py-1 rounded text-xs font-medium ${getSeverityColor(zone.severity)}`}>
                          {zone.severity.toUpperCase()}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Temporal Analysis */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('temporal')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ClockIcon className="h-5 w-5 mr-2" />
              Temporal Change Analysis
            </h3>
            {expandedSection === 'temporal' ? 
              <ChevronUpIcon className="h-5 w-5 text-gray-500" /> : 
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            }
          </button>
          {expandedSection === 'temporal' && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <p className="text-gray-700 leading-relaxed mt-3">
                {executive_summary?.temporal_analysis || 
                 'Time-series analysis indicates environmental change patterns with measurable transformation rates over the monitoring period.'}
              </p>
            </div>
          )}
        </div>

        {/* Cause Analysis */}
        <div className="bg-white border border-gray-200 rounded-lg">
          <button
            onClick={() => toggleSection('causes')}
            className="w-full flex items-center justify-between p-4 text-left hover:bg-gray-50 transition-colors"
          >
            <h3 className="text-lg font-semibold text-gray-900 flex items-center">
              <ExclamationTriangleIcon className="h-5 w-5 mr-2" />
              Possible Causes
            </h3>
            {expandedSection === 'causes' ? 
              <ChevronUpIcon className="h-5 w-5 text-gray-500" /> : 
              <ChevronDownIcon className="h-5 w-5 text-gray-500" />
            }
          </button>
          {expandedSection === 'causes' && (
            <div className="px-4 pb-4 border-t border-gray-100">
              <p className="text-gray-700 leading-relaxed mt-3">
                {executive_summary?.possible_causes || 
                 'Pattern analysis suggests multiple potential factors contributing to observed environmental changes.'}
              </p>
            </div>
          )}
        </div>

        {/* Urgency Assessment */}
        <div className={`border rounded-lg p-4 ${getSeverityColor(overall_assessment?.overall_severity)}`}>
          <h3 className="text-lg font-semibold mb-2 flex items-center">
            {getUrgencyIcon(executive_summary?.urgency_assessment)}
            <span className="ml-2">Urgency Assessment</span>
          </h3>
          <p className="leading-relaxed">
            {executive_summary?.urgency_assessment || 
             'Environmental monitoring protocols recommend continued surveillance and appropriate response measures based on analysis findings.'}
          </p>
        </div>

        {/* AI Insights Panel */}
        {showInsights && ai_insights && (
          <div className="bg-gradient-to-r from-purple-50 to-blue-50 border border-purple-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-purple-900 mb-4 flex items-center">
              <ChartBarIcon className="h-5 w-5 mr-2" />
              AI-Generated Insights
            </h3>
            <div className="space-y-4">
              {ai_insights.map((insight, index) => (
                <div key={index} className="bg-white border border-purple-100 rounded-lg p-4">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-sm font-medium text-purple-700 uppercase tracking-wide">
                      {insight.type.replace('_', ' ')}
                    </span>
                    <span className="text-sm text-gray-500">
                      {(insight.confidence * 100).toFixed(0)}% confidence
                    </span>
                  </div>
                  <p className="text-gray-800 text-sm leading-relaxed mb-2">
                    {insight.insight}
                  </p>
                  <p className="text-xs text-gray-600 italic">
                    {insight.technical_details}
                  </p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Interactive Actions */}
        {interactive_components?.actionable_items && (
          <div className="bg-gray-50 border border-gray-200 rounded-lg p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Recommended Actions
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {interactive_components.actionable_items.immediate_actions?.map((action, index) => (
                <div
                  key={index}
                  className="bg-white border border-gray-200 rounded-lg p-4 cursor-pointer hover:shadow-md transition-shadow"
                  onClick={() => console.log('Action clicked:', action)}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-medium text-gray-900">
                      {formatChangeType(action.action_type)}
                    </span>
                    <span className={`px-2 py-1 rounded text-xs font-medium ${
                      action.priority === 'high' ? 'bg-red-100 text-red-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {action.priority.toUpperCase()}
                    </span>
                  </div>
                  <div className="text-sm text-gray-600">
                    <div>Cost: {action.estimated_cost}</div>
                    <div>Timeline: {action.timeline}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default EnhancedExecutiveSummary;