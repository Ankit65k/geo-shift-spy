"""
Base Model Class for Change Detection Models
Abstract base class defining the interface for all change detection models.
"""

from abc import ABC, abstractmethod
from typing import Dict, Any, Tuple, Optional
from PIL import Image
import torch

class BaseChangeDetectionModel(ABC):
    """Abstract base class for change detection models"""
    
    def __init__(self):
        self.device = None
        self.model = None
        self.transform = None
        self.version = "1.0"
    
    @abstractmethod
    async def load_pretrained(self, weights_url: Optional[str] = None):
        """Load pretrained model weights"""
        pass
    
    @abstractmethod
    async def detect_binary_changes(self, before_img: Image.Image, after_img: Image.Image, 
                                  threshold: float = 0.5) -> Dict[str, Any]:
        """
        Detect binary changes between two images
        
        Args:
            before_img: PIL Image of the before state
            after_img: PIL Image of the after state
            threshold: Threshold for change detection
            
        Returns:
            Dictionary containing:
            - change_percentage: Percentage of pixels that changed
            - change_map_base64: Base64 encoded change visualization
            - change_map: Numpy array of change map
            - confidence_score: Confidence in the prediction
            - model_type: Name of the model used
            - analysis_type: Type of analysis performed
        """
        pass
    
    @abstractmethod
    async def detect_multiclass_changes(self, before_img: Image.Image, after_img: Image.Image,
                                      threshold: float = 0.5) -> Dict[str, Any]:
        """
        Detect multi-class changes between two images
        
        Args:
            before_img: PIL Image of the before state
            after_img: PIL Image of the after state
            threshold: Threshold for change detection
            
        Returns:
            Dictionary containing change detection results with class-specific information
        """
        pass
    
    async def perform_segmentation(self, before_img: Image.Image, after_img: Image.Image) -> Dict[str, Any]:
        """
        Perform segmentation analysis (optional, not all models support this)
        
        Args:
            before_img: PIL Image of the before state  
            after_img: PIL Image of the after state
            
        Returns:
            Dictionary containing segmentation results
        """
        # Default implementation falls back to multi-class change detection
        return await self.detect_multiclass_changes(before_img, after_img)
    
    async def assess_damage(self, before_img: Image.Image, after_img: Image.Image,
                          threshold: float = 0.5) -> Dict[str, Any]:
        """
        Assess damage (for disaster-specific models like xView2)
        
        Args:
            before_img: PIL Image before disaster
            after_img: PIL Image after disaster
            threshold: Threshold for damage assessment
            
        Returns:
            Dictionary containing damage assessment results
        """
        # Default implementation falls back to binary change detection
        result = await self.detect_binary_changes(before_img, after_img, threshold)
        result["analysis_type"] = "damage_assessment"
        return result