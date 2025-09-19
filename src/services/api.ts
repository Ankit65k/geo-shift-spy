const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:5000';

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
  };
  metadata?: {
    before_image: string;
    after_image: string;
    processed_at: string;
    change_type: string;
    risk_score: number;
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
    throw new Error(`API Error: ${response.status} ${response.statusText}`);
  }

  return response.json();
};