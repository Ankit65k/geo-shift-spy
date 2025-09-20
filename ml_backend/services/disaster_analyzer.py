"""
Disaster Analysis Service
Specialized system for pre/post disaster comparison with damage zone highlighting.
Supports analysis of:
- Flood damage (water intrusion, standing water)
- Fire damage (burned areas, vegetation loss)
- Building collapse and structural damage
- Infrastructure damage
"""

import numpy as np
from PIL import Image
import torch
import cv2
from typing import Dict, Any, List, Tuple, Optional
import logging
from dataclasses import dataclass
from enum import Enum
import json
from datetime import datetime
import asyncio

logger = logging.getLogger(__name__)

class DisasterType(Enum):
    """Types of disasters that can be analyzed"""
    FLOOD = "flood"
    FIRE = "fire"
    EARTHQUAKE = "earthquake"
    HURRICANE = "hurricane"
    LANDSLIDE = "landslide"
    TORNADO = "tornado"
    UNKNOWN = "unknown"

class DamageZoneType(Enum):
    """Types of damage zones"""
    FLOODED = "flooded"
    BURNED = "burned"
    COLLAPSED = "collapsed"
    DEBRIS = "debris"
    ERODED = "eroded"
    DAMAGED_INFRASTRUCTURE = "damaged_infrastructure"
    DISPLACED_VEGETATION = "displaced_vegetation"

@dataclass
class DamageZone:
    """Individual damage zone detection"""
    zone_type: DamageZoneType
    severity: str  # "minor", "moderate", "severe", "catastrophic"
    bbox: Tuple[int, int, int, int]  # x, y, width, height
    area_sq_meters: float
    confidence: float
    affected_structures: int
    polygon_coords: Optional[List[Tuple[int, int]]] = None

@dataclass
class DisasterAnalysisResult:
    """Complete disaster analysis result"""
    disaster_type: DisasterType
    damage_zones: List[DamageZone]
    overall_damage_assessment: Dict[str, Any]
    evacuation_priority_map: np.ndarray
    relief_access_map: np.ndarray
    damage_visualization: np.ndarray
    processing_time: float
    metadata: Dict[str, Any]

class DisasterAnalyzer:
    """Advanced disaster analysis system"""
    
    def __init__(self, pixel_to_meter_ratio: float = 1.0):
        """
        Initialize disaster analyzer
        
        Args:
            pixel_to_meter_ratio: Conversion factor from pixels to square meters
        """
        self.pixel_to_meter_ratio = pixel_to_meter_ratio
        
        # Damage detection thresholds
        self.damage_thresholds = {
            "water_detection": 0.3,  # NDWI threshold for water
            "burn_detection": 0.4,   # NBR threshold for burned areas  
            "structural_change": 0.5, # Threshold for structural changes
            "vegetation_loss": 0.6    # NDVI threshold for vegetation loss
        }
    
    async def analyze_disaster_impact(
        self,
        pre_disaster_img: Image.Image,
        post_disaster_img: Image.Image,
        disaster_type: Optional[DisasterType] = None,
        analysis_metadata: Optional[Dict] = None
    ) -> DisasterAnalysisResult:
        """
        Perform comprehensive disaster impact analysis
        
        Args:
            pre_disaster_img: Image before disaster
            post_disaster_img: Image after disaster
            disaster_type: Known disaster type (if available)
            analysis_metadata: Additional metadata for analysis
            
        Returns:
            Complete disaster analysis result
        """
        import time
        start_time = time.time()
        
        try:
            # Convert images to numpy arrays
            pre_array = np.array(pre_disaster_img)
            post_array = np.array(post_disaster_img)
            
            # Auto-detect disaster type if not provided
            if disaster_type is None:
                disaster_type = await self._detect_disaster_type(pre_array, post_array)
            
            # Detect damage zones based on disaster type
            damage_zones = await self._detect_damage_zones(
                pre_array, post_array, disaster_type
            )
            
            # Generate overall damage assessment
            overall_assessment = await self._assess_overall_damage(damage_zones, pre_array.shape)
            
            # Generate priority maps for emergency response
            evacuation_map = self._generate_evacuation_priority_map(damage_zones, pre_array.shape)
            access_map = self._generate_relief_access_map(damage_zones, pre_array.shape)
            
            # Create damage visualization
            damage_viz = self._create_damage_visualization(
                pre_array, post_array, damage_zones
            )
            
            processing_time = time.time() - start_time
            
            return DisasterAnalysisResult(
                disaster_type=disaster_type,
                damage_zones=damage_zones,
                overall_damage_assessment=overall_assessment,
                evacuation_priority_map=evacuation_map,
                relief_access_map=access_map,
                damage_visualization=damage_viz,
                processing_time=processing_time,
                metadata=analysis_metadata or {}
            )
            
        except Exception as e:
            logger.error(f"Error in disaster analysis: {str(e)}")
            raise
    
    async def _detect_disaster_type(self, pre_img: np.ndarray, post_img: np.ndarray) -> DisasterType:
        """Auto-detect disaster type based on change patterns"""
        
        # Calculate various indices
        water_increase = self._calculate_water_change(pre_img, post_img)
        burn_signature = self._calculate_burn_signature(pre_img, post_img) 
        structural_damage = self._calculate_structural_damage(pre_img, post_img)
        
        # Decision tree for disaster type
        if water_increase > 0.2:  # Significant water increase
            return DisasterType.FLOOD
        elif burn_signature > 0.3:  # Strong burn signature
            return DisasterType.FIRE
        elif structural_damage > 0.4:  # High structural damage
            return DisasterType.EARTHQUAKE
        else:
            return DisasterType.UNKNOWN
    
    def _calculate_water_change(self, pre_img: np.ndarray, post_img: np.ndarray) -> float:
        """Calculate change in water coverage"""
        # Simple NDWI-like calculation using RGB channels
        # In real implementation, would use proper spectral bands
        
        def water_index(img):
            # Using green and NIR (approximated by red channel)
            green = img[:, :, 1].astype(np.float32)
            red = img[:, :, 0].astype(np.float32)
            return (green - red) / (green + red + 1e-6)
        
        pre_water = water_index(pre_img) > self.damage_thresholds["water_detection"]
        post_water = water_index(post_img) > self.damage_thresholds["water_detection"]
        
        water_increase = np.sum(post_water) - np.sum(pre_water)
        return water_increase / (pre_img.shape[0] * pre_img.shape[1])
    
    def _calculate_burn_signature(self, pre_img: np.ndarray, post_img: np.ndarray) -> float:
        """Calculate burn signature strength"""
        # Simplified burn ratio using RGB channels
        
        def burn_ratio(img):
            red = img[:, :, 0].astype(np.float32)
            blue = img[:, :, 2].astype(np.float32)
            return (red - blue) / (red + blue + 1e-6)
        
        pre_burn = burn_ratio(pre_img)
        post_burn = burn_ratio(post_img)
        
        burn_change = post_burn - pre_burn
        burned_pixels = np.sum(burn_change > self.damage_thresholds["burn_detection"])
        
        return burned_pixels / (pre_img.shape[0] * pre_img.shape[1])
    
    def _calculate_structural_damage(self, pre_img: np.ndarray, post_img: np.ndarray) -> float:
        """Calculate structural damage indicator"""
        # Edge detection to identify structural changes
        
        def edge_density(img):
            gray = cv2.cvtColor(img, cv2.COLOR_RGB2GRAY)
            edges = cv2.Canny(gray, 50, 150)
            return np.sum(edges > 0) / (img.shape[0] * img.shape[1])
        
        pre_edges = edge_density(pre_img)
        post_edges = edge_density(post_img)
        
        # Structural damage often reduces edge density
        return max(0, pre_edges - post_edges)
    
    async def _detect_damage_zones(
        self,
        pre_img: np.ndarray,
        post_img: np.ndarray,
        disaster_type: DisasterType
    ) -> List[DamageZone]:
        """Detect specific damage zones based on disaster type"""
        
        damage_zones = []
        
        if disaster_type == DisasterType.FLOOD:
            damage_zones.extend(await self._detect_flood_zones(pre_img, post_img))
        elif disaster_type == DisasterType.FIRE:
            damage_zones.extend(await self._detect_burn_zones(pre_img, post_img))
        elif disaster_type == DisasterType.EARTHQUAKE:
            damage_zones.extend(await self._detect_collapse_zones(pre_img, post_img))
        else:
            # Generic damage detection
            damage_zones.extend(await self._detect_generic_damage_zones(pre_img, post_img))
        
        return damage_zones
    
    async def _detect_flood_zones(self, pre_img: np.ndarray, post_img: np.ndarray) -> List[DamageZone]:
        """Detect flooded areas"""
        zones = []
        
        # Water detection using color analysis
        def detect_water(img):
            # Water typically has high blue, low red in RGB
            blue = img[:, :, 2].astype(np.float32)
            red = img[:, :, 0].astype(np.float32)
            water_mask = (blue > red + 20) & (blue > 100)  # Basic water detection
            return water_mask.astype(np.uint8)
        
        pre_water = detect_water(pre_img)
        post_water = detect_water(post_img)
        
        # New water areas = post_water - pre_water
        flood_mask = (post_water > pre_water).astype(np.uint8)
        
        # Find connected components of flooded areas
        contours, _ = cv2.findContours(flood_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area_pixels = cv2.contourArea(contour)
            area_sq_meters = area_pixels * self.pixel_to_meter_ratio
            
            # Skip very small areas
            if area_sq_meters < 100:  # Less than 100 sq meters
                continue
            
            # Get bounding box
            x, y, w, h = cv2.boundingRect(contour)
            
            # Estimate severity based on area and depth
            severity = self._estimate_flood_severity(area_sq_meters, flood_mask[y:y+h, x:x+w])
            
            # Estimate affected structures (simplified)
            affected_structures = self._count_affected_structures(
                pre_img[y:y+h, x:x+w], flood_mask[y:y+h, x:x+w]
            )
            
            zone = DamageZone(
                zone_type=DamageZoneType.FLOODED,
                severity=severity,
                bbox=(x, y, w, h),
                area_sq_meters=area_sq_meters,
                confidence=0.8,  # Would be calculated from model confidence
                affected_structures=affected_structures,
                polygon_coords=[(int(pt[0][0]), int(pt[0][1])) for pt in contour]
            )
            
            zones.append(zone)
        
        return zones
    
    async def _detect_burn_zones(self, pre_img: np.ndarray, post_img: np.ndarray) -> List[DamageZone]:
        """Detect burned areas"""
        zones = []
        
        # Burn detection using color changes
        def detect_burns(pre, post):
            # Burned areas typically become darker and more brown/red
            pre_brightness = np.mean(pre, axis=2)
            post_brightness = np.mean(post, axis=2)
            
            # Look for significant darkening
            darkness_increase = pre_brightness - post_brightness
            
            # Look for red/brown coloration in post image
            post_red_ratio = post[:, :, 0] / (np.sum(post, axis=2) + 1e-6)
            
            burn_mask = (darkness_increase > 30) & (post_red_ratio > 0.4)
            return burn_mask.astype(np.uint8)
        
        burn_mask = detect_burns(pre_img, post_img)
        
        # Find connected components
        contours, _ = cv2.findContours(burn_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area_pixels = cv2.contourArea(contour)
            area_sq_meters = area_pixels * self.pixel_to_meter_ratio
            
            if area_sq_meters < 500:  # Skip small areas
                continue
            
            x, y, w, h = cv2.boundingRect(contour)
            
            # Estimate burn severity
            severity = self._estimate_burn_severity(
                pre_img[y:y+h, x:x+w], 
                post_img[y:y+h, x:x+w]
            )
            
            zone = DamageZone(
                zone_type=DamageZoneType.BURNED,
                severity=severity,
                bbox=(x, y, w, h),
                area_sq_meters=area_sq_meters,
                confidence=0.75,
                affected_structures=0,  # Would need structure detection
                polygon_coords=[(int(pt[0][0]), int(pt[0][1])) for pt in contour]
            )
            
            zones.append(zone)
        
        return zones
    
    async def _detect_collapse_zones(self, pre_img: np.ndarray, post_img: np.ndarray) -> List[DamageZone]:
        """Detect collapsed/damaged structures"""
        zones = []
        
        # Structure detection using edge analysis
        def detect_structural_changes(pre, post):
            pre_gray = cv2.cvtColor(pre, cv2.COLOR_RGB2GRAY)
            post_gray = cv2.cvtColor(post, cv2.COLOR_RGB2GRAY)
            
            # Detect edges in both images
            pre_edges = cv2.Canny(pre_gray, 50, 150)
            post_edges = cv2.Canny(post_gray, 50, 150)
            
            # Look for areas where edges disappeared (collapsed structures)
            edge_loss = (pre_edges > post_edges).astype(np.uint8) * 255
            
            # Morphological operations to clean up
            kernel = cv2.getStructuringElement(cv2.MORPH_RECT, (3, 3))
            edge_loss = cv2.morphologyEx(edge_loss, cv2.MORPH_CLOSE, kernel)
            
            return edge_loss
        
        damage_mask = detect_structural_changes(pre_img, post_img)
        
        # Find contours
        contours, _ = cv2.findContours(damage_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area_pixels = cv2.contourArea(contour)
            area_sq_meters = area_pixels * self.pixel_to_meter_ratio
            
            if area_sq_meters < 50:  # Skip very small areas
                continue
            
            x, y, w, h = cv2.boundingRect(contour)
            
            # Estimate damage severity
            severity = self._estimate_collapse_severity(area_sq_meters)
            
            zone = DamageZone(
                zone_type=DamageZoneType.COLLAPSED,
                severity=severity,
                bbox=(x, y, w, h),
                area_sq_meters=area_sq_meters,
                confidence=0.7,
                affected_structures=1,  # Assume at least one structure
                polygon_coords=[(int(pt[0][0]), int(pt[0][1])) for pt in contour]
            )
            
            zones.append(zone)
        
        return zones
    
    async def _detect_generic_damage_zones(self, pre_img: np.ndarray, post_img: np.ndarray) -> List[DamageZone]:
        """Generic damage detection for unknown disaster types"""
        zones = []
        
        # Simple difference-based damage detection
        diff = cv2.absdiff(pre_img, post_img)
        gray_diff = cv2.cvtColor(diff, cv2.COLOR_RGB2GRAY)
        
        # Threshold for significant changes
        _, damage_mask = cv2.threshold(gray_diff, 50, 255, cv2.THRESH_BINARY)
        
        # Find contours
        contours, _ = cv2.findContours(damage_mask, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        for contour in contours:
            area_pixels = cv2.contourArea(contour)
            area_sq_meters = area_pixels * self.pixel_to_meter_ratio
            
            if area_sq_meters < 100:
                continue
            
            x, y, w, h = cv2.boundingRect(contour)
            
            zone = DamageZone(
                zone_type=DamageZoneType.DEBRIS,  # Generic damage type
                severity="moderate",
                bbox=(x, y, w, h),
                area_sq_meters=area_sq_meters,
                confidence=0.6,
                affected_structures=0,
                polygon_coords=[(int(pt[0][0]), int(pt[0][1])) for pt in contour]
            )
            
            zones.append(zone)
        
        return zones
    
    def _estimate_flood_severity(self, area_sq_meters: float, flood_region: np.ndarray) -> str:
        """Estimate flood severity based on area and characteristics"""
        # Combine area and depth indicators
        score = 0
        
        if area_sq_meters > 10000:  # > 1 hectare
            score += 2
        elif area_sq_meters > 1000:
            score += 1
        
        # Could add water depth estimation here
        
        if score >= 3:
            return "catastrophic"
        elif score >= 2:
            return "severe"
        elif score >= 1:
            return "moderate"
        else:
            return "minor"
    
    def _estimate_burn_severity(self, pre_region: np.ndarray, post_region: np.ndarray) -> str:
        """Estimate burn severity"""
        # Calculate vegetation loss and color change
        pre_green = np.mean(pre_region[:, :, 1])
        post_green = np.mean(post_region[:, :, 1])
        
        vegetation_loss = (pre_green - post_green) / pre_green
        
        if vegetation_loss > 0.8:
            return "catastrophic"
        elif vegetation_loss > 0.6:
            return "severe"
        elif vegetation_loss > 0.4:
            return "moderate"
        else:
            return "minor"
    
    def _estimate_collapse_severity(self, area_sq_meters: float) -> str:
        """Estimate structural collapse severity"""
        if area_sq_meters > 5000:
            return "catastrophic"
        elif area_sq_meters > 1000:
            return "severe"
        elif area_sq_meters > 200:
            return "moderate"
        else:
            return "minor"
    
    def _count_affected_structures(self, pre_region: np.ndarray, damage_mask: np.ndarray) -> int:
        """Estimate number of affected structures"""
        # Simplified structure counting using edge density
        gray = cv2.cvtColor(pre_region, cv2.COLOR_RGB2GRAY)
        edges = cv2.Canny(gray, 50, 150)
        
        # Count edge clusters as potential structures
        contours, _ = cv2.findContours(edges, cv2.RETR_EXTERNAL, cv2.CHAIN_APPROX_SIMPLE)
        
        # Filter contours that overlap with damage
        affected_count = 0
        for contour in contours:
            if cv2.contourArea(contour) > 100:  # Minimum structure size
                mask = np.zeros_like(damage_mask)
                cv2.fillPoly(mask, [contour], 255)
                
                # Check overlap with damage
                overlap = np.sum((mask > 0) & (damage_mask > 0))
                if overlap > 0:
                    affected_count += 1
        
        return affected_count
    
    async def _assess_overall_damage(self, damage_zones: List[DamageZone], image_shape: Tuple[int, int]) -> Dict[str, Any]:
        """Generate overall damage assessment"""
        
        total_area = image_shape[0] * image_shape[1] * self.pixel_to_meter_ratio
        
        # Calculate damage by type and severity
        damage_by_type = {}
        damage_by_severity = {"minor": 0, "moderate": 0, "severe": 0, "catastrophic": 0}
        total_damaged_area = 0
        
        for zone in damage_zones:
            zone_type = zone.zone_type.value
            
            if zone_type not in damage_by_type:
                damage_by_type[zone_type] = {
                    "count": 0,
                    "total_area_sq_meters": 0,
                    "avg_confidence": 0
                }
            
            damage_by_type[zone_type]["count"] += 1
            damage_by_type[zone_type]["total_area_sq_meters"] += zone.area_sq_meters
            damage_by_type[zone_type]["avg_confidence"] += zone.confidence
            
            damage_by_severity[zone.severity] += zone.area_sq_meters
            total_damaged_area += zone.area_sq_meters
        
        # Calculate averages
        for stats in damage_by_type.values():
            if stats["count"] > 0:
                stats["avg_confidence"] /= stats["count"]
        
        damage_percentage = (total_damaged_area / total_area) * 100
        
        return {
            "total_damage_zones": len(damage_zones),
            "total_damaged_area_sq_meters": total_damaged_area,
            "damage_percentage": damage_percentage,
            "damage_by_type": damage_by_type,
            "damage_by_severity": damage_by_severity,
            "structures_affected": sum(zone.affected_structures for zone in damage_zones),
            "emergency_priority": self._calculate_emergency_priority(damage_zones)
        }
    
    def _calculate_emergency_priority(self, damage_zones: List[DamageZone]) -> str:
        """Calculate overall emergency priority level"""
        priority_score = 0
        
        for zone in damage_zones:
            if zone.severity == "catastrophic":
                priority_score += 4
            elif zone.severity == "severe":
                priority_score += 3
            elif zone.severity == "moderate":
                priority_score += 2
            else:
                priority_score += 1
        
        if priority_score >= 10:
            return "critical"
        elif priority_score >= 6:
            return "high"
        elif priority_score >= 3:
            return "medium"
        else:
            return "low"
    
    def _generate_evacuation_priority_map(self, damage_zones: List[DamageZone], shape: Tuple[int, int]) -> np.ndarray:
        """Generate evacuation priority map"""
        priority_map = np.zeros(shape[:2], dtype=np.uint8)
        
        for zone in damage_zones:
            x, y, w, h = zone.bbox
            
            # Assign priority values
            if zone.severity == "catastrophic":
                priority_value = 255
            elif zone.severity == "severe":
                priority_value = 200
            elif zone.severity == "moderate":
                priority_value = 150
            else:
                priority_value = 100
            
            # Fill zone with priority value
            if zone.polygon_coords:
                points = np.array(zone.polygon_coords, dtype=np.int32)
                cv2.fillPoly(priority_map, [points], priority_value)
            else:
                priority_map[y:y+h, x:x+w] = np.maximum(priority_map[y:y+h, x:x+w], priority_value)
        
        return priority_map
    
    def _generate_relief_access_map(self, damage_zones: List[DamageZone], shape: Tuple[int, int]) -> np.ndarray:
        """Generate relief access difficulty map"""
        access_map = np.ones(shape[:2], dtype=np.uint8) * 100  # Default accessible
        
        for zone in damage_zones:
            x, y, w, h = zone.bbox
            
            # Higher difficulty for certain damage types
            if zone.zone_type in [DamageZoneType.FLOODED, DamageZoneType.COLLAPSED]:
                difficulty = 255  # Very difficult
            elif zone.zone_type == DamageZoneType.DEBRIS:
                difficulty = 200  # Difficult
            else:
                difficulty = 150  # Moderate difficulty
            
            # Fill zone with difficulty value
            if zone.polygon_coords:
                points = np.array(zone.polygon_coords, dtype=np.int32)
                cv2.fillPoly(access_map, [points], difficulty)
            else:
                access_map[y:y+h, x:x+w] = np.maximum(access_map[y:y+h, x:x+w], difficulty)
        
        return access_map
    
    def _create_damage_visualization(
        self, 
        pre_img: np.ndarray, 
        post_img: np.ndarray, 
        damage_zones: List[DamageZone]
    ) -> np.ndarray:
        """Create comprehensive damage visualization"""
        
        # Start with post-disaster image
        viz = post_img.copy()
        
        # Color coding for different damage types
        colors = {
            DamageZoneType.FLOODED: (0, 100, 255),      # Blue
            DamageZoneType.BURNED: (255, 100, 0),       # Orange/Red
            DamageZoneType.COLLAPSED: (255, 0, 100),    # Magenta
            DamageZoneType.DEBRIS: (150, 150, 0),       # Yellow-brown
            DamageZoneType.ERODED: (100, 50, 0),        # Brown
            DamageZoneType.DAMAGED_INFRASTRUCTURE: (255, 0, 255)  # Purple
        }
        
        # Draw damage zones
        for zone in damage_zones:
            color = colors.get(zone.zone_type, (255, 255, 255))
            
            # Draw polygon if available
            if zone.polygon_coords:
                points = np.array(zone.polygon_coords, dtype=np.int32)
                cv2.polylines(viz, [points], isClosed=True, color=color, thickness=2)
                
                # Fill with semi-transparent color based on severity
                overlay = viz.copy()
                cv2.fillPoly(overlay, [points], color)
                
                alpha = 0.3 if zone.severity in ["minor", "moderate"] else 0.5
                viz = cv2.addWeighted(viz, 1-alpha, overlay, alpha, 0)
            else:
                # Draw bounding box
                x, y, w, h = zone.bbox
                cv2.rectangle(viz, (x, y), (x+w, y+h), color, 2)
        
        return viz