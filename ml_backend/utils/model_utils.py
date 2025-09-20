"""
Utility functions for model operations
Common utilities shared across different models
"""

import os
import asyncio
import aiohttp
import base64
import io
import torch
import numpy as np
from PIL import Image
from typing import Tuple, Optional
from pathlib import Path
import logging

logger = logging.getLogger(__name__)

async def download_pretrained_weights(url: str, filename: str, 
                                    cache_dir: str = "./model_cache") -> str:
    """
    Download pretrained model weights from URL
    
    Args:
        url: URL to download weights from
        filename: Name to save the file as
        cache_dir: Directory to cache downloaded weights
        
    Returns:
        Path to the downloaded weights file
    """
    cache_path = Path(cache_dir)
    cache_path.mkdir(exist_ok=True)
    
    weights_path = cache_path / filename
    
    # Check if already downloaded
    if weights_path.exists():
        logger.info(f"Using cached weights: {weights_path}")
        return str(weights_path)
    
    logger.info(f"Downloading weights from {url}")
    
    try:
        async with aiohttp.ClientSession() as session:
            async with session.get(url) as response:
                response.raise_for_status()
                
                with open(weights_path, 'wb') as f:
                    async for chunk in response.content.iter_chunked(8192):
                        f.write(chunk)
        
        logger.info(f"Weights downloaded successfully: {weights_path}")
        return str(weights_path)
        
    except Exception as e:
        logger.error(f"Error downloading weights: {str(e)}")
        raise

def load_pretrained_weights(model: torch.nn.Module, weights_path: str, 
                          device: torch.device) -> torch.nn.Module:
    """
    Load pretrained weights into a model
    
    Args:
        model: PyTorch model
        weights_path: Path to weights file
        device: Device to load weights on
        
    Returns:
        Model with loaded weights
    """
    try:
        checkpoint = torch.load(weights_path, map_location=device)
        
        # Handle different checkpoint formats
        if 'model_state_dict' in checkpoint:
            model.load_state_dict(checkpoint['model_state_dict'])
        elif 'state_dict' in checkpoint:
            model.load_state_dict(checkpoint['state_dict'])
        else:
            model.load_state_dict(checkpoint)
        
        logger.info(f"Successfully loaded weights from {weights_path}")
        return model
        
    except Exception as e:
        logger.error(f"Error loading weights: {str(e)}")
        raise

def preprocess_image_pair(before_img: Image.Image, after_img: Image.Image,
                         img_size: int = 256) -> Tuple[torch.Tensor, torch.Tensor]:
    """
    Preprocess a pair of images for model input
    
    Args:
        before_img: Before image as PIL Image
        after_img: After image as PIL Image
        img_size: Target image size
        
    Returns:
        Tuple of preprocessed tensors (before, after)
    """
    from torchvision import transforms
    
    transform = transforms.Compose([
        transforms.Resize((img_size, img_size)),
        transforms.ToTensor(),
        transforms.Normalize(mean=[0.485, 0.456, 0.406], 
                           std=[0.229, 0.224, 0.225])
    ])
    
    before_tensor = transform(before_img)
    after_tensor = transform(after_img)
    
    return before_tensor, after_tensor

def encode_image_to_base64(image: Image.Image, format: str = "PNG") -> str:
    """
    Encode PIL Image to base64 string
    
    Args:
        image: PIL Image to encode
        format: Image format (PNG, JPEG, etc.)
        
    Returns:
        Base64 encoded image string
    """
    buffer = io.BytesIO()
    image.save(buffer, format=format)
    image_bytes = buffer.getvalue()
    base64_string = base64.b64encode(image_bytes).decode('utf-8')
    return base64_string

def decode_base64_to_image(base64_string: str) -> Image.Image:
    """
    Decode base64 string to PIL Image
    
    Args:
        base64_string: Base64 encoded image string
        
    Returns:
        PIL Image
    """
    image_bytes = base64.b64decode(base64_string)
    image = Image.open(io.BytesIO(image_bytes))
    return image

def calculate_change_metrics(before_map: np.ndarray, after_map: np.ndarray) -> dict:
    """
    Calculate various change detection metrics
    
    Args:
        before_map: Before state map (numpy array)
        after_map: After state map (numpy array)
        
    Returns:
        Dictionary of metrics
    """
    # Binary change map
    change_map = (before_map != after_map).astype(np.float32)
    
    total_pixels = change_map.size
    changed_pixels = np.sum(change_map)
    
    change_percentage = (changed_pixels / total_pixels) * 100
    
    # Calculate additional metrics
    metrics = {
        "change_percentage": float(change_percentage),
        "changed_pixels": int(changed_pixels),
        "total_pixels": int(total_pixels),
        "unchanged_percentage": float(100 - change_percentage)
    }
    
    # Class-specific changes if multi-class
    if len(np.unique(before_map)) > 2 or len(np.unique(after_map)) > 2:
        unique_before = np.unique(before_map)
        unique_after = np.unique(after_map)
        
        class_changes = {}
        for class_id in np.union1d(unique_before, unique_after):
            before_pixels = np.sum(before_map == class_id)
            after_pixels = np.sum(after_map == class_id)
            
            class_changes[f"class_{class_id}"] = {
                "before_pixels": int(before_pixels),
                "after_pixels": int(after_pixels),
                "change": int(after_pixels - before_pixels)
            }
        
        metrics["class_changes"] = class_changes
    
    return metrics

def apply_morphological_operations(change_map: np.ndarray, 
                                 operation: str = "both",
                                 kernel_size: int = 3) -> np.ndarray:
    """
    Apply morphological operations to clean up change maps
    
    Args:
        change_map: Binary change map
        operation: Type of operation ("opening", "closing", "both")
        kernel_size: Size of morphological kernel
        
    Returns:
        Cleaned change map
    """
    import cv2
    
    kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, 
                                     (kernel_size, kernel_size))
    
    change_map_uint8 = (change_map * 255).astype(np.uint8)
    
    if operation in ["opening", "both"]:
        # Remove small isolated pixels
        change_map_uint8 = cv2.morphologyEx(change_map_uint8, 
                                          cv2.MORPH_OPEN, kernel)
    
    if operation in ["closing", "both"]:
        # Fill small holes
        change_map_uint8 = cv2.morphologyEx(change_map_uint8, 
                                          cv2.MORPH_CLOSE, kernel)
    
    return (change_map_uint8 / 255.0).astype(np.float32)

def resize_tensor(tensor: torch.Tensor, target_size: Tuple[int, int]) -> torch.Tensor:
    """
    Resize tensor to target size
    
    Args:
        tensor: Input tensor (B, C, H, W)
        target_size: Target (height, width)
        
    Returns:
        Resized tensor
    """
    return torch.nn.functional.interpolate(
        tensor, size=target_size, mode='bilinear', align_corners=True
    )

def ensure_same_size(img1: Image.Image, img2: Image.Image) -> Tuple[Image.Image, Image.Image]:
    """
    Ensure two images have the same size
    
    Args:
        img1: First image
        img2: Second image
        
    Returns:
        Tuple of resized images with same dimensions
    """
    # Get the maximum dimensions
    max_width = max(img1.width, img2.width)
    max_height = max(img1.height, img2.height)
    
    # Resize both images to max dimensions
    img1_resized = img1.resize((max_width, max_height), Image.LANCZOS)
    img2_resized = img2.resize((max_width, max_height), Image.LANCZOS)
    
    return img1_resized, img2_resized

class ModelProfiler:
    """Simple profiler for model inference time"""
    
    def __init__(self):
        self.times = {}
    
    def __enter__(self):
        import time
        self.start_time = time.time()
        return self
    
    def __exit__(self, exc_type, exc_val, exc_tb):
        import time
        self.end_time = time.time()
        self.inference_time = self.end_time - self.start_time
    
    def get_time(self) -> float:
        return getattr(self, 'inference_time', 0.0)