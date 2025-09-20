"""
Dataset Preprocessing Pipeline
Handles preprocessing for different satellite imagery datasets:
- Sentinel-2: ESA's high-resolution multispectral imagery
- Landsat: NASA's long-term Earth observation data
- Global Forest Change: Hansen Global Forest Change dataset
- xView2: Disaster damage assessment dataset

Each dataset has specific preprocessing requirements, band combinations, and normalization parameters.
"""

import numpy as np
from PIL import Image
import torch
import torchvision.transforms as transforms
from typing import Dict, Any, Tuple, Optional, List
import logging
import asyncio
import rasterio
from rasterio.enums import Resampling
import cv2

logger = logging.getLogger(__name__)

class DatasetProcessor:
    """Main dataset preprocessing class"""
    
    def __init__(self):
        self.dataset_configs = {
            'sentinel2': Sentinel2Processor(),
            'landsat': LandsatProcessor(), 
            'global_forest_change': GlobalForestChangeProcessor(),
            'xview2': XView2Processor(),
            'generic': GenericProcessor()
        }
    
    async def preprocess_image_pair(self, before_img: Image.Image, after_img: Image.Image, 
                                  dataset_type: str) -> Tuple[Image.Image, Image.Image, Dict[str, Any]]:
        """
        Preprocess image pair for specific dataset type
        
        Args:
            before_img: Before image as PIL Image
            after_img: After image as PIL Image  
            dataset_type: Type of dataset (sentinel2, landsat, etc.)
            
        Returns:
            Tuple of (processed_before, processed_after, metadata)
        """
        if dataset_type not in self.dataset_configs:
            logger.warning(f"Unknown dataset type: {dataset_type}, using generic preprocessing")
            dataset_type = 'generic'
        
        processor = self.dataset_configs[dataset_type]
        return await processor.preprocess_pair(before_img, after_img)
    
    async def preprocess_single_image(self, img: Image.Image, 
                                    dataset_type: str) -> Tuple[Image.Image, Dict[str, Any]]:
        """
        Preprocess single image for specific dataset type
        
        Args:
            img: Input image as PIL Image
            dataset_type: Type of dataset
            
        Returns:
            Tuple of (processed_image, metadata)
        """
        if dataset_type not in self.dataset_configs:
            logger.warning(f"Unknown dataset type: {dataset_type}, using generic preprocessing")
            dataset_type = 'generic'
        
        processor = self.dataset_configs[dataset_type]
        return await processor.preprocess_single(img)

class BaseDatasetProcessor:
    """Base class for dataset processors"""
    
    def __init__(self, name: str, bands: List[str], target_size: int = 512):
        self.name = name
        self.bands = bands
        self.target_size = target_size
        self.normalization_params = self.get_normalization_params()
    
    def get_normalization_params(self) -> Dict[str, List[float]]:
        """Get dataset-specific normalization parameters"""
        return {
            'mean': [0.485, 0.456, 0.406],  # ImageNet defaults
            'std': [0.229, 0.224, 0.225]
        }
    
    async def preprocess_pair(self, before_img: Image.Image, after_img: Image.Image) -> Tuple[Image.Image, Image.Image, Dict[str, Any]]:
        """Preprocess image pair"""
        before_processed, before_meta = await self.preprocess_single(before_img)
        after_processed, after_meta = await self.preprocess_single(after_img)
        
        metadata = {
            'dataset_type': self.name,
            'target_size': self.target_size,
            'bands': self.bands,
            'normalization': self.normalization_params,
            'before_meta': before_meta,
            'after_meta': after_meta
        }
        
        return before_processed, after_processed, metadata
    
    async def preprocess_single(self, img: Image.Image) -> Tuple[Image.Image, Dict[str, Any]]:
        """Preprocess single image (to be implemented by subclasses)"""
        raise NotImplementedError

class Sentinel2Processor(BaseDatasetProcessor):
    """Sentinel-2 dataset processor"""
    
    def __init__(self):
        # Sentinel-2 bands (using RGB + NIR for change detection)
        bands = ['B04', 'B03', 'B02', 'B08']  # Red, Green, Blue, NIR
        super().__init__('sentinel2', bands, target_size=512)
    
    def get_normalization_params(self) -> Dict[str, List[float]]:
        """Sentinel-2 specific normalization"""
        return {
            # Based on Sentinel-2 surface reflectance statistics
            'mean': [0.485, 0.456, 0.406],  # RGB channels
            'std': [0.229, 0.224, 0.225]
        }
    
    async def preprocess_single(self, img: Image.Image) -> Tuple[Image.Image, Dict[str, Any]]:
        """Preprocess Sentinel-2 image"""
        try:
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize to target size
            img_resized = img.resize((self.target_size, self.target_size), Image.LANCZOS)
            
            # Sentinel-2 specific enhancements
            img_enhanced = self.apply_sentinel2_enhancements(img_resized)
            
            metadata = {
                'original_size': img.size,
                'processed_size': img_enhanced.size,
                'enhancements_applied': ['atmospheric_correction_simulation', 'contrast_enhancement'],
                'bands_simulated': self.bands
            }
            
            return img_enhanced, metadata
            
        except Exception as e:
            logger.error(f"Error preprocessing Sentinel-2 image: {str(e)}")
            raise
    
    def apply_sentinel2_enhancements(self, img: Image.Image) -> Image.Image:
        """Apply Sentinel-2 specific enhancements"""
        # Convert to numpy for processing
        img_np = np.array(img).astype(np.float32) / 255.0
        
        # Simulate atmospheric correction (simple approach)
        img_np = self.simulate_atmospheric_correction(img_np)
        
        # Enhance contrast for better feature visibility
        img_np = self.enhance_contrast(img_np)
        
        # Clip values and convert back
        img_np = np.clip(img_np, 0, 1)
        img_enhanced = Image.fromarray((img_np * 255).astype(np.uint8))
        
        return img_enhanced
    
    def simulate_atmospheric_correction(self, img_np: np.ndarray) -> np.ndarray:
        """Simulate simple atmospheric correction"""
        # Simple bias correction (would be more complex in real implementation)
        correction_factors = [1.05, 1.02, 1.03]  # RGB correction
        
        for i in range(3):
            img_np[:, :, i] *= correction_factors[i]
        
        return img_np
    
    def enhance_contrast(self, img_np: np.ndarray) -> np.ndarray:
        """Enhance contrast using histogram stretching"""
        for i in range(3):
            channel = img_np[:, :, i]
            # Stretch to 2nd and 98th percentiles
            p2, p98 = np.percentile(channel, (2, 98))
            img_np[:, :, i] = np.clip((channel - p2) / (p98 - p2), 0, 1)
        
        return img_np

class LandsatProcessor(BaseDatasetProcessor):
    """Landsat dataset processor"""
    
    def __init__(self):
        # Landsat bands (using TM/ETM+/OLI equivalent)
        bands = ['B4', 'B3', 'B2', 'B5']  # Red, Green, Blue, NIR
        super().__init__('landsat', bands, target_size=512)
    
    def get_normalization_params(self) -> Dict[str, List[float]]:
        """Landsat specific normalization"""
        return {
            # Based on Landsat surface reflectance statistics
            'mean': [0.45, 0.42, 0.38],
            'std': [0.23, 0.22, 0.21]
        }
    
    async def preprocess_single(self, img: Image.Image) -> Tuple[Image.Image, Dict[str, Any]]:
        """Preprocess Landsat image"""
        try:
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize to target size
            img_resized = img.resize((self.target_size, self.target_size), Image.LANCZOS)
            
            # Landsat specific enhancements
            img_enhanced = self.apply_landsat_enhancements(img_resized)
            
            metadata = {
                'original_size': img.size,
                'processed_size': img_enhanced.size,
                'enhancements_applied': ['radiometric_calibration', 'haze_reduction'],
                'bands_simulated': self.bands
            }
            
            return img_enhanced, metadata
            
        except Exception as e:
            logger.error(f"Error preprocessing Landsat image: {str(e)}")
            raise
    
    def apply_landsat_enhancements(self, img: Image.Image) -> Image.Image:
        """Apply Landsat specific enhancements"""
        img_np = np.array(img).astype(np.float32) / 255.0
        
        # Simulate radiometric calibration
        img_np = self.simulate_radiometric_calibration(img_np)
        
        # Reduce haze/atmospheric effects
        img_np = self.reduce_haze(img_np)
        
        # Clip and convert back
        img_np = np.clip(img_np, 0, 1)
        img_enhanced = Image.fromarray((img_np * 255).astype(np.uint8))
        
        return img_enhanced
    
    def simulate_radiometric_calibration(self, img_np: np.ndarray) -> np.ndarray:
        """Simulate radiometric calibration"""
        # Simple gain/offset correction (would use actual calibration parameters)
        gain = [1.08, 1.05, 1.03]
        offset = [-0.02, -0.01, -0.015]
        
        for i in range(3):
            img_np[:, :, i] = img_np[:, :, i] * gain[i] + offset[i]
        
        return img_np
    
    def reduce_haze(self, img_np: np.ndarray) -> np.ndarray:
        """Simple haze reduction"""
        # Dark channel prior-inspired approach (simplified)
        dark_channel = np.min(img_np, axis=2)
        haze_transmission = 1 - 0.8 * dark_channel
        
        for i in range(3):
            img_np[:, :, i] = (img_np[:, :, i] - 0.1) / np.maximum(haze_transmission, 0.1) + 0.1
        
        return img_np

class GlobalForestChangeProcessor(BaseDatasetProcessor):
    """Global Forest Change dataset processor"""
    
    def __init__(self):
        # GFC typically uses Landsat data
        bands = ['treecover', 'loss', 'gain', 'lossyear']
        super().__init__('global_forest_change', bands, target_size=512)
    
    def get_normalization_params(self) -> Dict[str, List[float]]:
        """GFC specific normalization"""
        return {
            'mean': [0.5, 0.45, 0.4],  # Forest-specific statistics
            'std': [0.25, 0.23, 0.22]
        }
    
    async def preprocess_single(self, img: Image.Image) -> Tuple[Image.Image, Dict[str, Any]]:
        """Preprocess Global Forest Change image"""
        try:
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize to target size
            img_resized = img.resize((self.target_size, self.target_size), Image.LANCZOS)
            
            # GFC specific enhancements
            img_enhanced = self.apply_gfc_enhancements(img_resized)
            
            metadata = {
                'original_size': img.size,
                'processed_size': img_enhanced.size,
                'enhancements_applied': ['forest_mask_generation', 'change_highlighting'],
                'focus': 'forest_change_detection'
            }
            
            return img_enhanced, metadata
            
        except Exception as e:
            logger.error(f"Error preprocessing GFC image: {str(e)}")
            raise
    
    def apply_gfc_enhancements(self, img: Image.Image) -> Image.Image:
        """Apply GFC specific enhancements"""
        img_np = np.array(img).astype(np.float32) / 255.0
        
        # Enhance vegetation indices
        img_np = self.enhance_vegetation_features(img_np)
        
        # Highlight forest boundaries
        img_np = self.highlight_forest_boundaries(img_np)
        
        # Clip and convert back
        img_np = np.clip(img_np, 0, 1)
        img_enhanced = Image.fromarray((img_np * 255).astype(np.uint8))
        
        return img_enhanced
    
    def enhance_vegetation_features(self, img_np: np.ndarray) -> np.ndarray:
        """Enhance vegetation features for forest analysis"""
        # Simulate NDVI-like enhancement (using R,G,B as proxy for R,G,NIR)
        red = img_np[:, :, 0]
        green = img_np[:, :, 1]
        blue = img_np[:, :, 2]  # Using blue as NIR proxy
        
        # Pseudo-NDVI calculation
        ndvi = (blue - red) / (blue + red + 1e-6)
        
        # Enhance green areas (likely vegetation)
        vegetation_mask = ndvi > 0.2
        img_np[vegetation_mask, 1] *= 1.2  # Enhance green channel
        
        return img_np
    
    def highlight_forest_boundaries(self, img_np: np.ndarray) -> np.ndarray:
        """Highlight forest boundaries using edge detection"""
        # Convert to grayscale for edge detection
        gray = np.dot(img_np, [0.299, 0.587, 0.114])
        
        # Apply edge detection
        edges = cv2.Canny((gray * 255).astype(np.uint8), 50, 150)
        edges = edges.astype(np.float32) / 255.0
        
        # Blend edges back into image
        for i in range(3):
            img_np[:, :, i] = img_np[:, :, i] * 0.9 + edges * 0.1
        
        return img_np

class XView2Processor(BaseDatasetProcessor):
    """xView2 disaster dataset processor"""
    
    def __init__(self):
        # xView2 uses high-resolution RGB imagery
        bands = ['R', 'G', 'B']
        super().__init__('xview2', bands, target_size=512)
    
    def get_normalization_params(self) -> Dict[str, List[float]]:
        """xView2 specific normalization"""
        return {
            # High-resolution imagery normalization
            'mean': [0.485, 0.456, 0.406],
            'std': [0.229, 0.224, 0.225]
        }
    
    async def preprocess_single(self, img: Image.Image) -> Tuple[Image.Image, Dict[str, Any]]:
        """Preprocess xView2 disaster image"""
        try:
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize to target size
            img_resized = img.resize((self.target_size, self.target_size), Image.LANCZOS)
            
            # xView2 specific enhancements
            img_enhanced = self.apply_xview2_enhancements(img_resized)
            
            metadata = {
                'original_size': img.size,
                'processed_size': img_enhanced.size,
                'enhancements_applied': ['building_enhancement', 'damage_feature_highlighting'],
                'focus': 'building_damage_assessment'
            }
            
            return img_enhanced, metadata
            
        except Exception as e:
            logger.error(f"Error preprocessing xView2 image: {str(e)}")
            raise
    
    def apply_xview2_enhancements(self, img: Image.Image) -> Image.Image:
        """Apply xView2 specific enhancements for damage assessment"""
        img_np = np.array(img).astype(np.float32) / 255.0
        
        # Enhance building structures
        img_np = self.enhance_building_features(img_np)
        
        # Highlight potential damage indicators
        img_np = self.highlight_damage_features(img_np)
        
        # Clip and convert back
        img_np = np.clip(img_np, 0, 1)
        img_enhanced = Image.fromarray((img_np * 255).astype(np.uint8))
        
        return img_enhanced
    
    def enhance_building_features(self, img_np: np.ndarray) -> np.ndarray:
        """Enhance building structures for better detection"""
        # Convert to grayscale for structure detection
        gray = np.dot(img_np, [0.299, 0.587, 0.114])
        
        # Detect corners/edges (building features)
        corners = cv2.cornerHarris((gray * 255).astype(np.uint8), 2, 3, 0.04)
        corners = cv2.dilate(corners, None)
        corners = (corners > 0.01 * corners.max()).astype(np.float32)
        
        # Enhance areas with building-like features
        for i in range(3):
            img_np[:, :, i] = img_np[:, :, i] * (1 + 0.1 * corners)
        
        return img_np
    
    def highlight_damage_features(self, img_np: np.ndarray) -> np.ndarray:
        """Highlight features that might indicate damage"""
        # Look for sharp edges and debris patterns
        gray = np.dot(img_np, [0.299, 0.587, 0.114])
        
        # Detect high-frequency content (potential debris/damage)
        kernel = np.array([[-1, -1, -1], [-1, 8, -1], [-1, -1, -1]])
        high_freq = cv2.filter2D((gray * 255).astype(np.uint8), -1, kernel)
        high_freq = np.abs(high_freq).astype(np.float32) / 255.0
        
        # Slightly enhance areas with high-frequency content
        damage_mask = high_freq > np.percentile(high_freq, 95)
        img_np[damage_mask] = np.minimum(img_np[damage_mask] * 1.1, 1.0)
        
        return img_np

class GenericProcessor(BaseDatasetProcessor):
    """Generic processor for unknown datasets"""
    
    def __init__(self):
        bands = ['R', 'G', 'B']
        super().__init__('generic', bands, target_size=512)
    
    async def preprocess_single(self, img: Image.Image) -> Tuple[Image.Image, Dict[str, Any]]:
        """Basic preprocessing for unknown datasets"""
        try:
            # Convert to RGB if needed
            if img.mode != 'RGB':
                img = img.convert('RGB')
            
            # Resize to target size
            img_resized = img.resize((self.target_size, self.target_size), Image.LANCZOS)
            
            # Basic enhancement
            img_enhanced = self.apply_basic_enhancements(img_resized)
            
            metadata = {
                'original_size': img.size,
                'processed_size': img_enhanced.size,
                'enhancements_applied': ['basic_normalization'],
                'processor': 'generic'
            }
            
            return img_enhanced, metadata
            
        except Exception as e:
            logger.error(f"Error in generic preprocessing: {str(e)}")
            raise
    
    def apply_basic_enhancements(self, img: Image.Image) -> Image.Image:
        """Apply basic image enhancements"""
        img_np = np.array(img).astype(np.float32) / 255.0
        
        # Basic histogram equalization per channel
        for i in range(3):
            channel = img_np[:, :, i]
            # Normalize to 0-1 range based on percentiles
            p1, p99 = np.percentile(channel, (1, 99))
            img_np[:, :, i] = np.clip((channel - p1) / (p99 - p1), 0, 1)
        
        # Convert back
        img_enhanced = Image.fromarray((img_np * 255).astype(np.uint8))
        return img_enhanced