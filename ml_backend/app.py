"""
Advanced ML Backend for Geo Shift Spy
Integrates state-of-the-art change detection models:
- ChangeFormer for transformer-based change detection
- Siam-UNet for Siamese network change detection
- DeepLabV3+ for land cover segmentation
- xView2 for disaster damage classification
"""

import os
import asyncio
from pathlib import Path
from typing import List, Optional, Dict, Any
import logging
from datetime import datetime
import io

import numpy as np
from PIL import Image
import torch
import torchvision.transforms as transforms
from fastapi import FastAPI, UploadFile, File, HTTPException, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
import cv2
import rasterio
from rasterio.enums import Resampling
import uvicorn

from models.changeformer import ChangeFormerModel
from models.siam_unet import SiamUNetModel
from models.deeplabv3plus import DeepLabV3PlusModel
from models.xview2_model import XView2Model
from preprocessing.dataset_processor import DatasetProcessor
from utils.model_utils import load_pretrained_weights, preprocess_image_pair
from utils.postprocessing import generate_change_map, calculate_metrics
from routers import geospatial

# Configure logging
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="Geo Shift Spy ML Backend",
    description="Advanced ML models for satellite image change detection",
    version="2.0.0"
)

# CORS configuration
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173", "http://localhost:8080"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routers
app.include_router(geospatial.router)

# Global model instances
models = {
    "changeformer": None,
    "siam_unet": None,
    "deeplabv3plus": None,
    "xview2": None
}

# Data processor
dataset_processor = DatasetProcessor()

class ChangeDetectionRequest(BaseModel):
    model_type: str = "changeformer"  # changeformer, siam_unet, deeplabv3plus, xview2
    dataset_type: str = "generic"  # sentinel2, landsat, global_forest_change, xview2
    analysis_type: str = "binary"  # binary, multi_class, segmentation, damage_assessment
    confidence_threshold: float = 0.5
    post_processing: bool = True

class ChangeDetectionResponse(BaseModel):
    success: bool
    model_used: str
    analysis_type: str
    change_percentage: float
    change_map_base64: str
    segmentation_map_base64: Optional[str] = None
    class_predictions: Optional[Dict[str, float]] = None
    damage_assessment: Optional[Dict[str, Any]] = None
    confidence_score: float
    processing_time: float
    metadata: Dict[str, Any]

@app.on_event("startup")
async def startup_event():
    """Initialize ML models on startup"""
    logger.info("Initializing ML models...")
    
    try:
        # Initialize ChangeFormer
        logger.info("Loading ChangeFormer model...")
        models["changeformer"] = ChangeFormerModel()
        await models["changeformer"].load_pretrained()
        
        # Initialize Siam-UNet
        logger.info("Loading Siam-UNet model...")
        models["siam_unet"] = SiamUNetModel()
        await models["siam_unet"].load_pretrained()
        
        # Initialize DeepLabV3+
        logger.info("Loading DeepLabV3+ model...")
        models["deeplabv3plus"] = DeepLabV3PlusModel()
        await models["deeplabv3plus"].load_pretrained()
        
        # Initialize xView2 model
        logger.info("Loading xView2 model...")
        models["xview2"] = XView2Model()
        await models["xview2"].load_pretrained()
        
        logger.info("All models loaded successfully!")
        
    except Exception as e:
        logger.error(f"Error loading models: {str(e)}")
        # Continue with partial model loading
        logger.warning("Some models may not be available")

@app.get("/")
async def root():
    """Health check endpoint"""
    available_models = [name for name, model in models.items() if model is not None]
    return {
        "message": "Geo Shift Spy ML Backend",
        "status": "healthy",
        "available_models": available_models,
        "timestamp": datetime.now().isoformat()
    }

@app.get("/models/status")
async def get_models_status():
    """Get status of all loaded models"""
    status = {}
    for name, model in models.items():
        if model is not None:
            status[name] = {
                "loaded": True,
                "device": str(model.device) if hasattr(model, 'device') else "unknown",
                "model_type": model.__class__.__name__
            }
        else:
            status[name] = {"loaded": False}
    
    return {"models": status}

@app.post("/detect_changes", response_model=ChangeDetectionResponse)
async def detect_changes(
    before_image: UploadFile = File(...),
    after_image: UploadFile = File(...),
    request_params: ChangeDetectionRequest = ChangeDetectionRequest()
):
    """
    Advanced change detection using specified model and dataset preprocessing
    """
    start_time = datetime.now()
    
    try:
        # Validate model availability
        if models[request_params.model_type] is None:
            raise HTTPException(
                status_code=503, 
                detail=f"Model {request_params.model_type} is not available"
            )
        
        # Read and validate images
        before_img_data = await before_image.read()
        after_img_data = await after_image.read()
        
        # Convert to PIL Images
        before_pil = Image.open(io.BytesIO(before_img_data))
        after_pil = Image.open(io.BytesIO(after_img_data))
        
        # Dataset-specific preprocessing
        before_processed, after_processed, metadata = await dataset_processor.preprocess_image_pair(
            before_pil, after_pil, request_params.dataset_type
        )
        
        # Select and run model
        model = models[request_params.model_type]
        
        if request_params.analysis_type == "binary":
            result = await model.detect_binary_changes(
                before_processed, after_processed, request_params.confidence_threshold
            )
        elif request_params.analysis_type == "multi_class":
            result = await model.detect_multiclass_changes(
                before_processed, after_processed, request_params.confidence_threshold
            )
        elif request_params.analysis_type == "segmentation":
            result = await model.perform_segmentation(
                before_processed, after_processed
            )
        elif request_params.analysis_type == "damage_assessment":
            if request_params.model_type != "xview2":
                raise HTTPException(
                    status_code=400,
                    detail="Damage assessment requires xView2 model"
                )
            result = await model.assess_damage(
                before_processed, after_processed, request_params.confidence_threshold
            )
        
        # Post-processing
        if request_params.post_processing:
            result = await apply_post_processing(result, request_params)
        
        # Calculate metrics
        processing_time = (datetime.now() - start_time).total_seconds()
        
        # Prepare response
        response = ChangeDetectionResponse(
            success=True,
            model_used=request_params.model_type,
            analysis_type=request_params.analysis_type,
            change_percentage=result["change_percentage"],
            change_map_base64=result["change_map_base64"],
            segmentation_map_base64=result.get("segmentation_map_base64"),
            class_predictions=result.get("class_predictions"),
            damage_assessment=result.get("damage_assessment"),
            confidence_score=result["confidence_score"],
            processing_time=processing_time,
            metadata={
                **metadata,
                "model_version": model.version if hasattr(model, 'version') else "1.0",
                "preprocessing_applied": request_params.dataset_type,
                "post_processing_applied": request_params.post_processing
            }
        )
        
        return response
        
    except Exception as e:
        logger.error(f"Error in change detection: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/segment_land_cover")
async def segment_land_cover(
    image: UploadFile = File(...),
    dataset_type: str = "sentinel2"
):
    """
    Land cover segmentation using DeepLabV3+
    """
    try:
        if models["deeplabv3plus"] is None:
            raise HTTPException(status_code=503, detail="DeepLabV3+ model not available")
        
        # Process image
        img_data = await image.read()
        pil_image = Image.open(io.BytesIO(img_data))
        
        # Dataset-specific preprocessing
        processed_image, metadata = await dataset_processor.preprocess_single_image(
            pil_image, dataset_type
        )
        
        # Run segmentation
        result = await models["deeplabv3plus"].segment_land_cover(processed_image)
        
        return {
            "success": True,
            "segmentation_map_base64": result["segmentation_map_base64"],
            "land_cover_classes": result["land_cover_classes"],
            "class_percentages": result["class_percentages"],
            "metadata": metadata
        }
        
    except Exception as e:
        logger.error(f"Error in land cover segmentation: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

@app.post("/assess_disaster_damage")
async def assess_disaster_damage(
    pre_disaster: UploadFile = File(...),
    post_disaster: UploadFile = File(...)
):
    """
    Disaster damage assessment using xView2 model
    """
    try:
        if models["xview2"] is None:
            raise HTTPException(status_code=503, detail="xView2 model not available")
        
        # Process images
        pre_data = await pre_disaster.read()
        post_data = await post_disaster.read()
        
        pre_pil = Image.open(io.BytesIO(pre_data))
        post_pil = Image.open(io.BytesIO(post_data))
        
        # xView2 specific preprocessing
        pre_processed, post_processed, metadata = await dataset_processor.preprocess_image_pair(
            pre_pil, post_pil, "xview2"
        )
        
        # Run damage assessment
        result = await models["xview2"].assess_building_damage(pre_processed, post_processed)
        
        return {
            "success": True,
            "damage_map_base64": result["damage_map_base64"],
            "building_count": result["building_count"],
            "damage_statistics": result["damage_statistics"],
            "severity_map_base64": result["severity_map_base64"],
            "metadata": metadata
        }
        
    except Exception as e:
        logger.error(f"Error in disaster damage assessment: {str(e)}")
        raise HTTPException(status_code=500, detail=str(e))

async def apply_post_processing(result: Dict[str, Any], params: ChangeDetectionRequest) -> Dict[str, Any]:
    """Apply post-processing to model results"""
    # Morphological operations to clean up change maps
    if "change_map" in result:
        change_map = result["change_map"]
        
        # Remove small isolated pixels
        kernel = cv2.getStructuringElement(cv2.MORPH_ELLIPSE, (3, 3))
        change_map = cv2.morphologyEx(change_map.astype(np.uint8), cv2.MORPH_OPEN, kernel)
        
        # Fill small holes
        change_map = cv2.morphologyEx(change_map, cv2.MORPH_CLOSE, kernel)
        
        result["change_map"] = change_map
        
        # Recalculate change percentage
        total_pixels = change_map.shape[0] * change_map.shape[1]
        changed_pixels = np.sum(change_map > 0)
        result["change_percentage"] = (changed_pixels / total_pixels) * 100
    
    return result

if __name__ == "__main__":
    uvicorn.run(
        "app:app",
        host="0.0.0.0",
        port=8001,
        reload=True,
        log_level="info"
    )