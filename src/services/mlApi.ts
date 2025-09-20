/**
 * Enhanced ML API Service
 * Provides access to advanced ML models for change detection, land cover segmentation,
 * and disaster damage assessment
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://localhost:3001';

export interface MLModelStatus {
  changeformer: { loaded: boolean; device?: string; model_type: string };
  siam_unet: { loaded: boolean; device?: string; model_type: string };
  deeplabv3plus: { loaded: boolean; device?: string; model_type: string };
  xview2: { loaded: boolean; device?: string; model_type: string };
}

export interface AdvancedCompareRequest {
  beforeImage: File;
  afterImage: File;
  modelType?: 'changeformer' | 'siam_unet' | 'deeplabv3plus' | 'xview2';
  datasetType?: 'sentinel2' | 'landsat' | 'global_forest_change' | 'xview2' | 'generic';
  analysisType?: 'binary' | 'multi_class' | 'segmentation' | 'damage_assessment';
  confidenceThreshold?: number;
}

export interface AdvancedCompareResponse {
  success: boolean;
  ml_backend_used: boolean;
  model_type: string;
  dataset_type: string;
  analysis_type: string;
  change_percentage: number;
  change_map_base64: string;
  confidence_score: number;
  processing_time: number;
  class_predictions?: Record<string, number>;
  segmentation_map?: string;
  damage_assessment?: any;
  environmental_report: any;
  metadata?: any;
  fallback_mode?: boolean;
  timestamp: string;
}

export interface LandCoverSegmentationRequest {
  image: File;
  datasetType?: 'sentinel2' | 'landsat' | 'generic';
}

export interface LandCoverSegmentationResponse {
  success: boolean;
  ml_backend_used: boolean;
  segmentation_map_base64: string;
  land_cover_classes: string[];
  class_percentages: Record<string, number>;
  confidence_score: number;
  metadata?: any;
  timestamp: string;
}

export interface DamageAssessmentRequest {
  preDisaster: File;
  postDisaster: File;
}

export interface DamageAssessmentResponse {
  success: boolean;
  ml_backend_used: boolean;
  damage_map_base64: string;
  building_count: number;
  damage_statistics: Record<string, { pixels: number; percentage: number }>;
  severity_map_base64: string;
  metadata?: any;
  timestamp: string;
}

class MLApiService {
  private baseUrl: string;

  constructor(baseUrl: string = API_BASE_URL) {
    this.baseUrl = baseUrl;
  }

  /**
   * Check ML model availability and status
   */
  async getModelStatus(): Promise<{ success: boolean; models?: MLModelStatus; ml_backend_available: boolean }> {
    try {
      const response = await fetch(`${this.baseUrl}/ml-models`);
      const data = await response.json();
      
      return {
        success: data.success,
        models: data.models?.models || null,
        ml_backend_available: data.ml_backend_available
      };
    } catch (error) {
      console.error('Error checking ML model status:', error);
      return {
        success: false,
        ml_backend_available: false
      };
    }
  }

  /**
   * Advanced change detection using ML models
   */
  async advancedCompare(request: AdvancedCompareRequest): Promise<AdvancedCompareResponse> {
    const formData = new FormData();
    
    formData.append('beforeImage', request.beforeImage);
    formData.append('afterImage', request.afterImage);
    formData.append('modelType', request.modelType || 'changeformer');
    formData.append('datasetType', request.datasetType || 'generic');
    formData.append('analysisType', request.analysisType || 'binary');
    formData.append('confidenceThreshold', (request.confidenceThreshold || 0.5).toString());

    try {
      const response = await fetch(`${this.baseUrl}/advanced-compare`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Advanced comparison failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in advanced comparison:', error);
      throw error;
    }
  }

  /**
   * Land cover segmentation
   */
  async segmentLandCover(request: LandCoverSegmentationRequest): Promise<LandCoverSegmentationResponse> {
    const formData = new FormData();
    
    formData.append('image', request.image);
    formData.append('datasetType', request.datasetType || 'sentinel2');

    try {
      const response = await fetch(`${this.baseUrl}/segment-land-cover`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Land cover segmentation failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in land cover segmentation:', error);
      throw error;
    }
  }

  /**
   * Disaster damage assessment
   */
  async assessDamage(request: DamageAssessmentRequest): Promise<DamageAssessmentResponse> {
    const formData = new FormData();
    
    formData.append('preDisaster', request.preDisaster);
    formData.append('postDisaster', request.postDisaster);

    try {
      const response = await fetch(`${this.baseUrl}/assess-damage`, {
        method: 'POST',
        body: formData,
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Damage assessment failed');
      }

      const data = await response.json();
      return data;
    } catch (error) {
      console.error('Error in damage assessment:', error);
      throw error;
    }
  }

  /**
   * Get supported model types
   */
  getSupportedModels(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: 'changeformer',
        label: 'ChangeFormer',
        description: 'Transformer-based change detection with multi-scale analysis'
      },
      {
        value: 'siam_unet',
        label: 'Siam-UNet',
        description: 'Siamese U-Net for precise change detection with skip connections'
      },
      {
        value: 'deeplabv3plus',
        label: 'DeepLabV3+',
        description: 'Advanced segmentation for land cover classification'
      },
      {
        value: 'xview2',
        label: 'xView2',
        description: 'Specialized model for disaster damage assessment'
      }
    ];
  }

  /**
   * Get supported dataset types
   */
  getSupportedDatasets(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: 'sentinel2',
        label: 'Sentinel-2',
        description: 'ESA high-resolution multispectral imagery'
      },
      {
        value: 'landsat',
        label: 'Landsat',
        description: 'NASA long-term Earth observation data'
      },
      {
        value: 'global_forest_change',
        label: 'Global Forest Change',
        description: 'Hansen Global Forest Change dataset'
      },
      {
        value: 'xview2',
        label: 'xView2',
        description: 'High-resolution disaster imagery'
      },
      {
        value: 'generic',
        label: 'Generic',
        description: 'Standard satellite/aerial imagery'
      }
    ];
  }

  /**
   * Get supported analysis types
   */
  getSupportedAnalysisTypes(): Array<{ value: string; label: string; description: string }> {
    return [
      {
        value: 'binary',
        label: 'Binary Change Detection',
        description: 'Simple changed/unchanged classification'
      },
      {
        value: 'multi_class',
        label: 'Multi-Class Change Detection',
        description: 'Identify specific types of changes'
      },
      {
        value: 'segmentation',
        label: 'Land Cover Segmentation',
        description: 'Detailed pixel-wise land cover classification'
      },
      {
        value: 'damage_assessment',
        label: 'Damage Assessment',
        description: 'Building damage evaluation (requires xView2 model)'
      }
    ];
  }
}

// Export singleton instance
export const mlApiService = new MLApiService();
export default mlApiService;