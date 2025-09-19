const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

export interface CompareImagesResponse {
  change_percentage: number;
  heatmap_url?: string;
  message?: string;
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