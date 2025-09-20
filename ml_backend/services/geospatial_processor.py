"""
Geospatial Processing Service
Handles conversion of change detection results to geospatial formats:
- Export to GeoJSON and KML formats
- Coordinate transformations
- Integration with mapping services (Mapbox, Leaflet)
- Spatial analysis and clustering
"""

import numpy as np
from PIL import Image
import json
import xml.etree.ElementTree as ET
from typing import Dict, Any, List, Tuple, Optional, Union
import logging
from dataclasses import dataclass, asdict
from datetime import datetime
import base64
import io
import cv2
from shapely.geometry import Polygon, Point, MultiPolygon
from shapely.ops import unary_union
import pyproj
from pyproj import Transformer

logger = logging.getLogger(__name__)

@dataclass
class GeoCoordinate:
    """Geographic coordinate"""
    latitude: float
    longitude: float
    altitude: Optional[float] = None

@dataclass
class GeoBounds:
    """Geographic bounding box"""
    north: float
    south: float
    east: float
    west: float

@dataclass
class ChangeFeature:
    """Geospatial change feature"""
    id: str
    geometry: Dict[str, Any]  # GeoJSON geometry
    properties: Dict[str, Any]
    change_type: str
    confidence: float
    area_hectares: float
    severity: str

class GeospatialProcessor:
    """Process change detection results into geospatial formats"""
    
    def __init__(self, default_epsg: int = 4326):
        """
        Initialize geospatial processor
        
        Args:
            default_epsg: Default coordinate system (4326 = WGS84)
        """
        self.default_epsg = default_epsg
        
        # Default bounds (can be updated based on actual image location)
        self.default_bounds = GeoBounds(
            north=40.0,
            south=39.0,
            east=-73.0,
            west=-74.0
        )
    
    async def convert_to_geojson(
        self,
        change_detections: List,
        image_shape: Tuple[int, int],
        geo_bounds: Optional[GeoBounds] = None,
        coordinate_system: str = "WGS84"
    ) -> Dict[str, Any]:
        """
        Convert change detections to GeoJSON format
        
        Args:
            change_detections: List of change detection results
            image_shape: Shape of the analyzed image (height, width)
            geo_bounds: Geographic bounds of the image
            coordinate_system: Target coordinate system
            
        Returns:
            GeoJSON FeatureCollection
        """
        if geo_bounds is None:
            geo_bounds = self.default_bounds
        
        # Create coordinate transformer
        pixel_to_geo = self._create_pixel_to_geo_transformer(image_shape, geo_bounds)
        
        features = []
        
        for i, detection in enumerate(change_detections):
            try:
                # Convert pixel coordinates to geographic coordinates
                if hasattr(detection, 'polygon_coords') and detection.polygon_coords:
                    # Convert polygon coordinates
                    geo_coords = []
                    for pixel_x, pixel_y in detection.polygon_coords:
                        lat, lon = pixel_to_geo(pixel_x, pixel_y)
                        geo_coords.append([lon, lat])  # GeoJSON uses [lon, lat] order
                    
                    # Close polygon if not already closed
                    if geo_coords[0] != geo_coords[-1]:
                        geo_coords.append(geo_coords[0])
                    
                    geometry = {
                        "type": "Polygon",
                        "coordinates": [geo_coords]
                    }
                else:
                    # Convert bounding box to polygon
                    x, y, w, h = detection.bbox
                    corners = [
                        (x, y),           # Top-left
                        (x + w, y),       # Top-right
                        (x + w, y + h),   # Bottom-right
                        (x, y + h),       # Bottom-left
                        (x, y)            # Close polygon
                    ]
                    
                    geo_coords = []
                    for pixel_x, pixel_y in corners:
                        lat, lon = pixel_to_geo(pixel_x, pixel_y)
                        geo_coords.append([lon, lat])
                    
                    geometry = {
                        "type": "Polygon",
                        "coordinates": [geo_coords]
                    }
                
                # Create feature properties
                properties = {
                    "id": f"change_{i}",
                    "change_type": detection.change_type.value if hasattr(detection.change_type, 'value') else str(detection.change_type),
                    "confidence": float(detection.confidence),
                    "severity": detection.severity,
                    "area_hectares": float(detection.area_hectares),
                    "detection_timestamp": datetime.now().isoformat(),
                    "bbox": detection.bbox
                }
                
                # Add additional properties if available
                if hasattr(detection, 'affected_structures'):
                    properties["affected_structures"] = detection.affected_structures
                
                feature = {
                    "type": "Feature",
                    "id": f"change_{i}",
                    "geometry": geometry,
                    "properties": properties
                }
                
                features.append(feature)
                
            except Exception as e:
                logger.warning(f"Error converting detection {i} to GeoJSON: {str(e)}")
                continue
        
        geojson = {
            "type": "FeatureCollection",
            "metadata": {
                "generated": datetime.now().isoformat(),
                "coordinate_system": coordinate_system,
                "image_shape": image_shape,
                "bounds": asdict(geo_bounds),
                "feature_count": len(features)
            },
            "features": features
        }
        
        return geojson
    
    async def convert_to_kml(
        self,
        change_detections: List,
        image_shape: Tuple[int, int],
        geo_bounds: Optional[GeoBounds] = None,
        document_name: str = "Change Detection Results"
    ) -> str:
        """
        Convert change detections to KML format
        
        Args:
            change_detections: List of change detection results
            image_shape: Shape of the analyzed image
            geo_bounds: Geographic bounds of the image
            document_name: Name for the KML document
            
        Returns:
            KML string
        """
        if geo_bounds is None:
            geo_bounds = self.default_bounds
        
        pixel_to_geo = self._create_pixel_to_geo_transformer(image_shape, geo_bounds)
        
        # Create KML root element
        kml = ET.Element("kml", xmlns="http://www.opengis.net/kml/2.2")
        document = ET.SubElement(kml, "Document")
        
        # Document metadata
        name = ET.SubElement(document, "name")
        name.text = document_name
        
        description = ET.SubElement(document, "description")
        description.text = f"Change detection results generated on {datetime.now().isoformat()}"
        
        # Add styles for different change types
        self._add_kml_styles(document)
        
        # Add placemarks for each detection
        for i, detection in enumerate(change_detections):
            try:
                placemark = ET.SubElement(document, "Placemark")
                
                # Placemark name and description
                placemark_name = ET.SubElement(placemark, "name")
                change_type = detection.change_type.value if hasattr(detection.change_type, 'value') else str(detection.change_type)
                placemark_name.text = f"{change_type.replace('_', ' ').title()} #{i+1}"
                
                placemark_desc = ET.SubElement(placemark, "description")
                desc_html = f"""
                <![CDATA[
                <h3>Change Detection</h3>
                <table>
                    <tr><td><b>Type:</b></td><td>{change_type.replace('_', ' ').title()}</td></tr>
                    <tr><td><b>Confidence:</b></td><td>{detection.confidence:.2%}</td></tr>
                    <tr><td><b>Severity:</b></td><td>{detection.severity.title()}</td></tr>
                    <tr><td><b>Area:</b></td><td>{detection.area_hectares:.2f} hectares</td></tr>
                    <tr><td><b>Detected:</b></td><td>{datetime.now().strftime('%Y-%m-%d %H:%M')}</td></tr>
                </table>
                ]]>
                """
                placemark_desc.text = desc_html
                
                # Style reference
                style_url = ET.SubElement(placemark, "styleUrl")
                style_url.text = f"#{self._get_style_id_for_change_type(change_type)}"
                
                # Geometry
                if hasattr(detection, 'polygon_coords') and detection.polygon_coords:
                    # Polygon geometry
                    polygon = ET.SubElement(placemark, "Polygon")
                    outer_ring = ET.SubElement(polygon, "outerBoundaryIs")
                    linear_ring = ET.SubElement(outer_ring, "LinearRing")
                    coordinates = ET.SubElement(linear_ring, "coordinates")
                    
                    coord_list = []
                    for pixel_x, pixel_y in detection.polygon_coords:
                        lat, lon = pixel_to_geo(pixel_x, pixel_y)
                        coord_list.append(f"{lon},{lat},0")
                    
                    # Close polygon
                    if detection.polygon_coords[0] != detection.polygon_coords[-1]:
                        lat, lon = pixel_to_geo(detection.polygon_coords[0][0], detection.polygon_coords[0][1])
                        coord_list.append(f"{lon},{lat},0")
                    
                    coordinates.text = " ".join(coord_list)
                else:
                    # Polygon from bounding box
                    x, y, w, h = detection.bbox
                    corners = [(x, y), (x + w, y), (x + w, y + h), (x, y + h), (x, y)]
                    
                    polygon = ET.SubElement(placemark, "Polygon")
                    outer_ring = ET.SubElement(polygon, "outerBoundaryIs")
                    linear_ring = ET.SubElement(outer_ring, "LinearRing")
                    coordinates = ET.SubElement(linear_ring, "coordinates")
                    
                    coord_list = []
                    for pixel_x, pixel_y in corners:
                        lat, lon = pixel_to_geo(pixel_x, pixel_y)
                        coord_list.append(f"{lon},{lat},0")
                    
                    coordinates.text = " ".join(coord_list)
                
            except Exception as e:
                logger.warning(f"Error converting detection {i} to KML: {str(e)}")
                continue
        
        # Convert to string
        ET.indent(kml, space="  ")
        kml_string = ET.tostring(kml, encoding='unicode')
        
        # Add XML declaration
        return f'<?xml version="1.0" encoding="UTF-8"?>\n{kml_string}'
    
    def _create_pixel_to_geo_transformer(self, image_shape: Tuple[int, int], geo_bounds: GeoBounds):
        """Create function to transform pixel coordinates to geographic coordinates"""
        height, width = image_shape
        
        def pixel_to_geo(pixel_x: float, pixel_y: float) -> Tuple[float, float]:
            # Convert pixel coordinates to geographic coordinates
            # Pixel (0,0) is top-left, but geo coordinates have (0,0) at bottom-left
            
            # Normalize pixel coordinates to 0-1
            norm_x = pixel_x / width
            norm_y = 1.0 - (pixel_y / height)  # Flip Y axis
            
            # Map to geographic bounds
            longitude = geo_bounds.west + norm_x * (geo_bounds.east - geo_bounds.west)
            latitude = geo_bounds.south + norm_y * (geo_bounds.north - geo_bounds.south)
            
            return latitude, longitude
        
        return pixel_to_geo
    
    def _add_kml_styles(self, document):
        """Add KML styles for different change types"""
        styles = {
            "deforestation": {"color": "ff0000ff", "outline": "ff000000"},  # Red
            "urbanization": {"color": "ff808080", "outline": "ff000000"},   # Gray
            "water_increase": {"color": "ffff0000", "outline": "ff000000"}, # Blue
            "water_decrease": {"color": "ff00ffff", "outline": "ff000000"}, # Yellow
            "disaster_damage": {"color": "ff0000ff", "outline": "ff000000"}, # Red
            "burned": {"color": "ff0080ff", "outline": "ff000000"},         # Orange
            "flooded": {"color": "ffff0000", "outline": "ff000000"},        # Blue
            "collapsed": {"color": "ff8000ff", "outline": "ff000000"},      # Purple
            "default": {"color": "ff00ff00", "outline": "ff000000"}         # Green
        }
        
        for style_name, colors in styles.items():
            style = ET.SubElement(document, "Style", id=style_name)
            
            # Polygon style
            poly_style = ET.SubElement(style, "PolyStyle")
            color = ET.SubElement(poly_style, "color")
            color.text = colors["color"]
            fill = ET.SubElement(poly_style, "fill")
            fill.text = "1"
            
            # Line style for outline
            line_style = ET.SubElement(style, "LineStyle")
            outline_color = ET.SubElement(line_style, "color")
            outline_color.text = colors["outline"]
            width = ET.SubElement(line_style, "width")
            width.text = "2"
    
    def _get_style_id_for_change_type(self, change_type: str) -> str:
        """Get KML style ID for a change type"""
        style_mapping = {
            "deforestation": "deforestation",
            "urbanization": "urbanization",
            "water_increase": "water_increase",
            "water_decrease": "water_decrease",
            "disaster_damage": "disaster_damage",
            "burned": "burned",
            "flooded": "flooded",
            "collapsed": "collapsed"
        }
        
        return style_mapping.get(change_type, "default")
    
    async def create_mapbox_configuration(
        self,
        geojson_data: Dict[str, Any],
        map_style: str = "mapbox://styles/mapbox/satellite-v9",
        center_coordinate: Optional[GeoCoordinate] = None
    ) -> Dict[str, Any]:
        """
        Create Mapbox configuration for displaying change detection results
        
        Args:
            geojson_data: GeoJSON data from convert_to_geojson
            map_style: Mapbox style URL
            center_coordinate: Center coordinate for the map
            
        Returns:
            Mapbox configuration object
        """
        # Calculate bounds and center from GeoJSON if not provided
        if center_coordinate is None:
            bounds = geojson_data.get("metadata", {}).get("bounds")
            if bounds:
                center_lat = (bounds["north"] + bounds["south"]) / 2
                center_lon = (bounds["east"] + bounds["west"]) / 2
                center_coordinate = GeoCoordinate(center_lat, center_lon)
            else:
                center_coordinate = GeoCoordinate(39.5, -73.5)  # Default
        
        # Create layer styles for different change types
        layer_styles = self._create_mapbox_layer_styles()
        
        config = {
            "mapboxgl": {
                "accessToken": "{{MAPBOX_ACCESS_TOKEN}}",  # To be replaced by frontend
                "style": map_style,
                "center": [center_coordinate.longitude, center_coordinate.latitude],
                "zoom": 12,
                "pitch": 0,
                "bearing": 0
            },
            "layers": [
                {
                    "id": "change-detections",
                    "type": "fill",
                    "source": {
                        "type": "geojson",
                        "data": geojson_data
                    },
                    "paint": {
                        "fill-color": [
                            "case",
                            ["==", ["get", "change_type"], "deforestation"], "#ff4444",
                            ["==", ["get", "change_type"], "urbanization"], "#888888",
                            ["==", ["get", "change_type"], "water_increase"], "#4444ff",
                            ["==", ["get", "change_type"], "water_decrease"], "#ffff44",
                            ["==", ["get", "change_type"], "disaster_damage"], "#ff0000",
                            ["==", ["get", "change_type"], "burned"], "#ff8800",
                            ["==", ["get", "change_type"], "flooded"], "#0088ff",
                            ["==", ["get", "change_type"], "collapsed"], "#8800ff",
                            "#00ff00"  # Default color
                        ],
                        "fill-opacity": [
                            "case",
                            ["==", ["get", "severity"], "critical"], 0.8,
                            ["==", ["get", "severity"], "high"], 0.6,
                            ["==", ["get", "severity"], "medium"], 0.4,
                            0.2
                        ]
                    }
                },
                {
                    "id": "change-detections-outline",
                    "type": "line", 
                    "source": {
                        "type": "geojson",
                        "data": geojson_data
                    },
                    "paint": {
                        "line-color": "#000000",
                        "line-width": 2,
                        "line-opacity": 0.8
                    }
                }
            ],
            "popup": {
                "properties": [
                    {"field": "change_type", "label": "Change Type"},
                    {"field": "confidence", "label": "Confidence", "format": "percentage"},
                    {"field": "severity", "label": "Severity"},
                    {"field": "area_hectares", "label": "Area (hectares)", "format": "number"},
                    {"field": "detection_timestamp", "label": "Detected", "format": "datetime"}
                ]
            },
            "controls": {
                "navigation": True,
                "fullscreen": True,
                "scale": True,
                "attribution": True
            },
            "legend": {
                "title": "Change Detection Results",
                "items": [
                    {"color": "#ff4444", "label": "Deforestation"},
                    {"color": "#888888", "label": "Urbanization"},
                    {"color": "#4444ff", "label": "Water Increase"},
                    {"color": "#ffff44", "label": "Water Decrease"},
                    {"color": "#ff0000", "label": "Disaster Damage"},
                    {"color": "#ff8800", "label": "Burned Areas"},
                    {"color": "#0088ff", "label": "Flooded Areas"},
                    {"color": "#8800ff", "label": "Collapsed Structures"}
                ]
            }
        }
        
        return config
    
    async def create_leaflet_configuration(
        self,
        geojson_data: Dict[str, Any],
        tile_layer: str = "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
        center_coordinate: Optional[GeoCoordinate] = None
    ) -> Dict[str, Any]:
        """
        Create Leaflet configuration for displaying change detection results
        
        Args:
            geojson_data: GeoJSON data from convert_to_geojson
            tile_layer: Tile layer URL template
            center_coordinate: Center coordinate for the map
            
        Returns:
            Leaflet configuration object
        """
        # Calculate bounds and center from GeoJSON if not provided
        if center_coordinate is None:
            bounds = geojson_data.get("metadata", {}).get("bounds")
            if bounds:
                center_lat = (bounds["north"] + bounds["south"]) / 2
                center_lon = (bounds["east"] + bounds["west"]) / 2
                center_coordinate = GeoCoordinate(center_lat, center_lon)
            else:
                center_coordinate = GeoCoordinate(39.5, -73.5)  # Default
        
        config = {
            "map": {
                "center": [center_coordinate.latitude, center_coordinate.longitude],
                "zoom": 12,
                "maxZoom": 18,
                "minZoom": 1
            },
            "tileLayers": [
                {
                    "name": "OpenStreetMap",
                    "url": "https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png",
                    "attribution": "&copy; OpenStreetMap contributors",
                    "default": True
                },
                {
                    "name": "Satellite",
                    "url": "https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}",
                    "attribution": "Tiles &copy; Esri"
                }
            ],
            "geoJsonLayer": {
                "data": geojson_data,
                "style": {
                    "weight": 2,
                    "opacity": 0.8,
                    "fillOpacity": 0.4
                },
                "styleFunction": """
                function(feature) {
                    const changeType = feature.properties.change_type;
                    const severity = feature.properties.severity;
                    
                    const colors = {
                        'deforestation': '#ff4444',
                        'urbanization': '#888888',
                        'water_increase': '#4444ff',
                        'water_decrease': '#ffff44',
                        'disaster_damage': '#ff0000',
                        'burned': '#ff8800',
                        'flooded': '#0088ff',
                        'collapsed': '#8800ff'
                    };
                    
                    const opacityMap = {
                        'critical': 0.8,
                        'high': 0.6,
                        'medium': 0.4,
                        'low': 0.2
                    };
                    
                    return {
                        color: '#000000',
                        weight: 2,
                        opacity: 0.8,
                        fillColor: colors[changeType] || '#00ff00',
                        fillOpacity: opacityMap[severity] || 0.3
                    };
                }
                """,
                "onEachFeature": """
                function(feature, layer) {
                    const props = feature.properties;
                    const popupContent = `
                        <div class="change-popup">
                            <h3>${props.change_type.replace('_', ' ').replace(/\\b\\w/g, l => l.toUpperCase())}</h3>
                            <table>
                                <tr><td><strong>Confidence:</strong></td><td>${(props.confidence * 100).toFixed(1)}%</td></tr>
                                <tr><td><strong>Severity:</strong></td><td>${props.severity}</td></tr>
                                <tr><td><strong>Area:</strong></td><td>${props.area_hectares.toFixed(2)} hectares</td></tr>
                                <tr><td><strong>Detected:</strong></td><td>${new Date(props.detection_timestamp).toLocaleString()}</td></tr>
                            </table>
                        </div>
                    `;
                    layer.bindPopup(popupContent);
                }
                """
            },
            "legend": {
                "position": "bottomright",
                "title": "Change Detection Results",
                "items": [
                    {"color": "#ff4444", "label": "Deforestation"},
                    {"color": "#888888", "label": "Urbanization"},
                    {"color": "#4444ff", "label": "Water Increase"},
                    {"color": "#ffff44", "label": "Water Decrease"},
                    {"color": "#ff0000", "label": "Disaster Damage"},
                    {"color": "#ff8800", "label": "Burned Areas"},
                    {"color": "#0088ff", "label": "Flooded Areas"},
                    {"color": "#8800ff", "label": "Collapsed Structures"}
                ]
            },
            "controls": {
                "zoom": True,
                "scale": True,
                "fullscreen": True,
                "layerControl": True
            }
        }
        
        return config
    
    def _create_mapbox_layer_styles(self) -> Dict[str, Any]:
        """Create Mapbox layer styles for different change types"""
        return {
            "change_fills": {
                "type": "fill",
                "paint": {
                    "fill-color": {
                        "property": "change_type",
                        "type": "categorical",
                        "stops": [
                            ["deforestation", "#ff4444"],
                            ["urbanization", "#888888"],
                            ["water_increase", "#4444ff"],
                            ["water_decrease", "#ffff44"],
                            ["disaster_damage", "#ff0000"],
                            ["burned", "#ff8800"],
                            ["flooded", "#0088ff"],
                            ["collapsed", "#8800ff"]
                        ],
                        "default": "#00ff00"
                    },
                    "fill-opacity": {
                        "property": "severity",
                        "type": "categorical",
                        "stops": [
                            ["critical", 0.8],
                            ["high", 0.6],
                            ["medium", 0.4],
                            ["low", 0.2]
                        ],
                        "default": 0.3
                    }
                }
            },
            "change_outlines": {
                "type": "line",
                "paint": {
                    "line-color": "#000000",
                    "line-width": 2,
                    "line-opacity": 0.8
                }
            }
        }
    
    async def cluster_nearby_changes(
        self,
        change_detections: List,
        max_distance_meters: float = 1000
    ) -> List[Dict[str, Any]]:
        """
        Cluster nearby change detections for better visualization
        
        Args:
            change_detections: List of change detection results
            max_distance_meters: Maximum distance for clustering
            
        Returns:
            List of clustered change groups
        """
        from sklearn.cluster import DBSCAN
        import numpy as np
        
        if not change_detections:
            return []
        
        # Extract center points from detections
        points = []
        for detection in change_detections:
            x, y, w, h = detection.bbox
            center_x = x + w / 2
            center_y = y + h / 2
            points.append([center_x, center_y])
        
        points = np.array(points)
        
        # Perform DBSCAN clustering
        # Convert max_distance_meters to pixels (rough approximation)
        max_distance_pixels = max_distance_meters / 10  # Assuming ~10m per pixel
        
        clustering = DBSCAN(eps=max_distance_pixels, min_samples=1).fit(points)
        labels = clustering.labels_
        
        # Group detections by cluster
        clusters = {}
        for i, label in enumerate(labels):
            if label not in clusters:
                clusters[label] = []
            clusters[label].append(change_detections[i])
        
        # Create cluster summaries
        clustered_changes = []
        for cluster_id, detections in clusters.items():
            if cluster_id == -1:  # Noise points (unclustered)
                # Add individual detections
                for detection in detections:
                    clustered_changes.append({
                        "type": "individual",
                        "detections": [detection],
                        "count": 1,
                        "dominant_change_type": detection.change_type.value if hasattr(detection.change_type, 'value') else str(detection.change_type),
                        "total_area_hectares": detection.area_hectares,
                        "max_severity": detection.severity,
                        "avg_confidence": detection.confidence
                    })
            else:
                # Create cluster summary
                change_types = [d.change_type.value if hasattr(d.change_type, 'value') else str(d.change_type) for d in detections]
                dominant_type = max(set(change_types), key=change_types.count)
                
                severities = [d.severity for d in detections]
                severity_order = ["low", "medium", "high", "critical"]
                max_severity = max(severities, key=lambda x: severity_order.index(x) if x in severity_order else 0)
                
                total_area = sum(d.area_hectares for d in detections)
                avg_confidence = sum(d.confidence for d in detections) / len(detections)
                
                clustered_changes.append({
                    "type": "cluster",
                    "detections": detections,
                    "count": len(detections),
                    "dominant_change_type": dominant_type,
                    "total_area_hectares": total_area,
                    "max_severity": max_severity,
                    "avg_confidence": avg_confidence
                })
        
        return clustered_changes