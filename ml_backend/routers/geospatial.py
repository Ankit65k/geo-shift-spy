"""
Geospatial API Router
Provides endpoints for geospatial data conversion and visualization
"""

import os
import base64
import json
from fastapi import APIRouter, HTTPException, Body, UploadFile, File, Form, Query, BackgroundTasks, Depends
from fastapi.responses import JSONResponse, FileResponse
from typing import Dict, Any, List, Optional
from pydantic import BaseModel, Field, validator
import numpy as np
import cv2
from datetime import datetime
from enum import Enum

from ..services.geospatial_processor import GeospatialProcessor, GeoBounds, GeoCoordinate
from ..models.change_detection import ChangeDetectionProcessor, ChangeDetectionResult, ChangeType
from ..utils.image_utils import decode_image, encode_base64_image

router = APIRouter(
    prefix="/geospatial",
    tags=["geospatial"],
    responses={404: {"description": "Not found"}},
)

# Initialize services
geospatial_processor = GeospatialProcessor()

# Pydantic models for requests/responses
class GeoBoundsModel(BaseModel):
    north: float
    south: float
    east: float
    west: float

class ExportFormat(str, Enum):
    GEOJSON = "geojson"
    KML = "kml"

class MapProvider(str, Enum):
    MAPBOX = "mapbox"
    LEAFLET = "leaflet"

class GeospatialExportRequest(BaseModel):
    change_detections_base64: str = Field(..., description="Base64 encoded change detection results")
    image_height: int = Field(..., description="Height of the source image")
    image_width: int = Field(..., description="Width of the source image")
    geo_bounds: Optional[GeoBoundsModel] = Field(None, description="Geographic bounds of the image")
    export_format: ExportFormat = Field(ExportFormat.GEOJSON, description="Export format")
    
    @validator('change_detections_base64')
    def validate_base64(cls, v):
        if not v.startswith('data:application/json;base64,'):
            raise ValueError("Invalid base64 JSON format")
        return v

class MapConfigurationRequest(BaseModel):
    geojson_data: Optional[str] = Field(None, description="Base64 encoded GeoJSON data")
    map_provider: MapProvider = Field(MapProvider.MAPBOX, description="Map provider")
    map_style: Optional[str] = Field(None, description="Map style URL")
    center_lat: Optional[float] = Field(None, description="Center latitude")
    center_lon: Optional[float] = Field(None, description="Center longitude")

class OverlayExportResponse(BaseModel):
    filename: str
    content_type: str
    data: str  # Base64 encoded file data
    export_format: ExportFormat

@router.post("/export-change-detections", response_model=OverlayExportResponse)
async def export_change_detections(request: GeospatialExportRequest):
    """
    Convert change detection results to GeoJSON or KML format
    """
    try:
        # Decode base64 change detection results
        base64_data = request.change_detections_base64.split(',')[1]
        json_data = base64.b64decode(base64_data).decode('utf-8')
        change_detections = json.loads(json_data)
        
        # Create GeoBounds object from request
        geo_bounds = None
        if request.geo_bounds:
            geo_bounds = GeoBounds(
                north=request.geo_bounds.north,
                south=request.geo_bounds.south,
                east=request.geo_bounds.east,
                west=request.geo_bounds.west
            )
        
        # Convert change detections to requested format
        image_shape = (request.image_height, request.image_width)
        
        if request.export_format == ExportFormat.GEOJSON:
            # Convert to GeoJSON
            geojson_data = await geospatial_processor.convert_to_geojson(
                change_detections=change_detections,
                image_shape=image_shape,
                geo_bounds=geo_bounds
            )
            
            # Encode result as base64
            result_data = json.dumps(geojson_data, indent=2)
            encoded_data = base64.b64encode(result_data.encode('utf-8')).decode('utf-8')
            
            return OverlayExportResponse(
                filename="change_detections.geojson",
                content_type="application/geo+json",
                data=f"data:application/geo+json;base64,{encoded_data}",
                export_format=ExportFormat.GEOJSON
            )
            
        elif request.export_format == ExportFormat.KML:
            # Convert to KML
            kml_data = await geospatial_processor.convert_to_kml(
                change_detections=change_detections,
                image_shape=image_shape,
                geo_bounds=geo_bounds
            )
            
            # Encode result as base64
            encoded_data = base64.b64encode(kml_data.encode('utf-8')).decode('utf-8')
            
            return OverlayExportResponse(
                filename="change_detections.kml",
                content_type="application/vnd.google-earth.kml+xml",
                data=f"data:application/vnd.google-earth.kml+xml;base64,{encoded_data}",
                export_format=ExportFormat.KML
            )
            
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported export format: {request.export_format}"
            )
            
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error exporting change detections: {str(e)}"
        )

@router.post("/create-map-configuration")
async def create_map_configuration(request: MapConfigurationRequest):
    """
    Create map configuration for the specified map provider
    """
    try:
        # Decode GeoJSON data if provided
        geojson_data = None
        if request.geojson_data:
            if request.geojson_data.startswith('data:application/geo+json;base64,'):
                base64_data = request.geojson_data.split(',')[1]
                json_str = base64.b64decode(base64_data).decode('utf-8')
                geojson_data = json.loads(json_str)
            else:
                # Assume it's a raw JSON string
                geojson_data = json.loads(request.geojson_data)
        
        if not geojson_data:
            raise HTTPException(status_code=400, detail="GeoJSON data is required")
        
        # Create center coordinate if provided
        center_coordinate = None
        if request.center_lat is not None and request.center_lon is not None:
            center_coordinate = GeoCoordinate(
                latitude=request.center_lat,
                longitude=request.center_lon
            )
        
        # Generate configuration for the requested map provider
        if request.map_provider == MapProvider.MAPBOX:
            map_style = request.map_style or "mapbox://styles/mapbox/satellite-v9"
            config = await geospatial_processor.create_mapbox_configuration(
                geojson_data=geojson_data,
                map_style=map_style,
                center_coordinate=center_coordinate
            )
        
        elif request.map_provider == MapProvider.LEAFLET:
            config = await geospatial_processor.create_leaflet_configuration(
                geojson_data=geojson_data,
                center_coordinate=center_coordinate
            )
        
        else:
            raise HTTPException(
                status_code=400, 
                detail=f"Unsupported map provider: {request.map_provider}"
            )
        
        return JSONResponse(content=config)
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error creating map configuration: {str(e)}"
        )

@router.post("/cluster-detections")
async def cluster_detections(
    change_detections_base64: str = Body(...),
    max_distance_meters: float = Body(1000)
):
    """
    Cluster nearby change detections for better visualization
    """
    try:
        # Decode base64 change detection results
        base64_data = change_detections_base64.split(',')[1]
        json_data = base64.b64decode(base64_data).decode('utf-8')
        change_detections = json.loads(json_data)
        
        # Cluster change detections
        clustered_changes = await geospatial_processor.cluster_nearby_changes(
            change_detections=change_detections,
            max_distance_meters=max_distance_meters
        )
        
        return JSONResponse(content={"clusters": clustered_changes})
        
    except Exception as e:
        raise HTTPException(
            status_code=500, 
            detail=f"Error clustering detections: {str(e)}"
        )