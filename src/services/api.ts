const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

// Enhanced interfaces for comprehensive environmental analysis
export interface ZonalAnalysis {
  zone: string;
  percentage: number;
}

export interface ZonalBreakdown {
  mostAffected: ZonalAnalysis;
  leastAffected: ZonalAnalysis;
  breakdown: ZonalAnalysis[];
}

export interface TemporalAnalysis {
  trend_direction: string;
  rate_of_change: string;
  seasonality: string;
  volatility: string;
}

export interface EnvironmentalImpact {
  primary_concern: string;
  urgency_level: string;
}

export interface SocioeconomicImpact {
  economic_impact: string;
  community_impact: string;
  policy_implications: string;
}

export interface ActionItem {
  action: string;
  responsible: string;
  timeline: string;
  resources: string;
  successMetrics: string;
  cost: string;
}

export interface ActionCategory {
  title: string;
  timeframe: string;
  urgency: string;
  actions: ActionItem[];
  totalEstimatedCost: string;
}

export interface PredictionScenario {
  period: string;
  projectedChange: string;
  confidence: number;
  scenario: string;
  riskLevel: string;
  interventionPotential: string;
}

export interface TrendAnalysis {
  currentTrajectory: string;
  accelerationFactor: string;
  criticalThreshold: string;
  timeToThreshold: string;
}

export interface Predictions {
  shortTerm: PredictionScenario;
  mediumTerm: PredictionScenario;
  longTerm: PredictionScenario;
  trendAnalysis: TrendAnalysis;
}

export interface ChartSuggestion {
  type: string;
  title: string;
  data: string;
  purpose: string;
  updateFrequency: string;
}

export interface VisualizationSuggestions {
  dashboardCharts: {
    essential: ChartSuggestion[];
    supplementary: string[];
  };
  maps: {
    critical: ChartSuggestion[];
    advanced: string[];
  };
}

export interface EnvironmentalReport {
  inputData: {
    beforeImage: {
      path: string;
      link?: string;
      description: string;
    };
    afterImage: {
      path: string;
      link?: string;
      description: string;
    };
    heatmap: {
      data: string;
      link?: string;
      description: string;
    };
    totalChangePercentage: string;
    timestamps: string[];
    location: string;
  };
  executiveSummary: string;
  analysis: {
    totalChangePercentage: number;
    changeType: string;
    severity: string;
    riskScore: number;
    urgencyLevel: string;
    affectedArea: {
      value: string;
      unit: string;
    };
    zonalAnalysis: ZonalBreakdown;
    temporalTrends: TemporalAnalysis;
  };
  keyInsights: string[];
  predictions: Predictions;
  recommendations: {
    executiveSummary: string;
    immediateActions: ActionCategory;
    shortTermActions: ActionCategory;
    longTermActions: ActionCategory;
  };
  visualizationSuggestions: VisualizationSuggestions;
  metadata: {
    analysisTimestamp: string;
    location: string;
    confidence: number;
    analysisVersion: string;
    nextReviewDate: string;
  };
}

export interface ImageValidation {
  isValid: boolean;
  confidence: number;
  imageType: string;
  reason: string;
}

export interface CompareImagesResponse {
  success?: boolean;
  change_percentage?: number;
  heatmap_url?: string;
  message?: string;
  ai_analysis?: {
    summary: string;
    changeType: string;
    riskScore: number;
    details: string;
    specificObservations?: string[];
    confidence?: number;
    geographicFeatures?: string;
    changeIntensity?: string;
    possibleCauses?: string[];
  };
  environmental_report?: EnvironmentalReport;
  validation?: {
    beforeImage: ImageValidation;
    afterImage: ImageValidation;
  };
  metadata?: {
    before_image: string;
    after_image: string;
    processed_at: string;
    change_type: string;
    risk_score: number;
    severity: string;
    urgency: string;
    ai_confidence?: number;
    geographic_features?: string;
    change_intensity?: string;
  };
  // Enhanced response format
  analysis_id?: string;
  timestamp?: string;
  processing_info?: {
    model_used: string;
    dataset_integration: string;
    processing_time_seconds: number;
    resolution: string;
    confidence_enhancement?: string;
  };
  overall_assessment?: {
    total_area_analyzed_sq_km: number;
    total_area_changed_sq_km: number;
    change_percentage: number;
    overall_severity: string;
    confidence_score: number;
    urgency_level: string;
  };
  detected_changes?: Array<{
    type: string;
    severity: string;
    area_percentage: number;
    area_sq_km: number;
    confidence: number;
    coordinates?: any;
    environmental_impact?: Record<string, any>;
  }>;
  environmental_summary?: {
    primary_concerns: string[];
    ecological_zones_affected: number;
    estimated_recovery_time: string;
    monitoring_recommendations: string[];
    immediate_actions_required: string[];
  };
  geographic_context?: {
    coordinate_system: string;
    analysis_bounds: any;
    terrain_type: string;
    climate_zone: string;
    land_use_classification: any[];
  };
  data_quality?: {
    cloud_coverage_percent: number;
    atmospheric_conditions: string;
    image_quality_score: number;
    temporal_gap_days: number;
  };
  executive_summary?: {
    main_finding?: string;
    specific_observations?: string;
    geographic_features?: string;
    possible_causes?: string;
    zone_analysis?: string;
    temporal_analysis?: string;
    urgency_assessment?: string;
  };
  ai_insights?: Array<{
    type: string;
    confidence: number;
    insight: string;
    technical_details: string;
  }>;
  interactive_components?: {
    clickable_zones?: any;
    actionable_items?: any;
    data_visualization?: any;
  };
  input_files?: {
    before_image: {
      filename: string;
      size_kb: number;
      upload_time: string;
    };
    after_image: {
      filename: string;
      size_kb: number;
      upload_time: string;
    };
  };
  verification_suggestions?: Array<{
    change_type: string;
    verification_sources: string[];
    confidence_level: number;
    recommended_action: string;
  }>;
}

export interface CompareImagesRequest {
  before_image: File;
  after_image: File;
}

export const compareImages = async (
  beforeImage: File,
  afterImage: File,
  locationHint?: string
): Promise<CompareImagesResponse> => {
  const formData = new FormData();
  formData.append('beforeImage', beforeImage);
  formData.append('afterImage', afterImage);
  if (locationHint) {
    formData.append('locationHint', locationHint);
  }

  const response = await fetch(`${API_URL}/compare`, {
    method: 'POST',
    body: formData,
  });

  if (!response.ok) {
    let errorMessage = `API Error: ${response.status} ${response.statusText}`;
    
    try {
      const errorData = await response.json();
      if (errorData.message) {
        errorMessage = errorData.message;
      }
      
      if (errorData.suggestions && errorData.suggestions.length > 0) {
        errorMessage += '\n\nSuggestions:\n' + errorData.suggestions.map((s: string) => `• ${s}`).join('\n');
      }
    } catch (parseError) {
      console.error('Failed to parse error response:', parseError);
    }
    
    throw new Error(errorMessage);
  }

  const basicResponse = await response.json();
  
  // Apply intelligent analysis for enhanced results
  try {
    const { intelligentAnalysis } = await import('./intelligentAnalysisService.js');
    const enhancedResponse = await intelligentAnalysis.generateIntelligentAnalysis(basicResponse, locationHint);
    return enhancedResponse;
  } catch (intelligentError) {
    console.warn('Intelligent analysis failed, returning basic response:', intelligentError);
    return basicResponse;
  }
};
