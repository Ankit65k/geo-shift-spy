const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  success: boolean;
  change_percentage: number;
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
}

export interface CompareImagesRequest {
  before_image: File;
  after_image: File;
}

export const compareImages = async (
  beforeImage: File,
  afterImage: File
): Promise<CompareImagesResponse> => {
  const formData = new FormData();
  formData.append('before_image', beforeImage);
  formData.append('after_image', afterImage);

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

  return response.json();
};
