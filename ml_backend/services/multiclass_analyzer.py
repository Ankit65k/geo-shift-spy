"""
Multi-Class Change Detection Service
Provides comprehensive classification of changes into specific categories:
- Deforestation
- Urbanization 
- Water level changes
- Barren land changes
- Disaster damage
"""

import numpy as np
from PIL import Image
import torch
import torch.nn.functional as F
from typing import Dict, Any, List, Tuple, Optional
import cv2
import logging
from dataclasses import dataclass
from enum import Enum
import json

logger = logging.getLogger(__name__)

class ChangeType(Enum):
    """Enumeration of change types"""
    DEFORESTATION = "deforestation"
    REFORESTATION = "reforestation" 
    URBANIZATION = "urbanization"
    URBAN_DECLINE = "urban_decline"
    WATER_INCREASE = "water_increase"
    WATER_DECREASE = "water_decrease"
    BARREN_TO_VEGETATION = "barren_to_vegetation"
    VEGETATION_TO_BARREN = "vegetation_to_barren"
    DISASTER_DAMAGE = "disaster_damage"
    RECOVERY = "recovery"
    NO_CHANGE = "no_change"

@dataclass
class ChangeDetection:
    """Individual change detection result"""
    change_type: ChangeType
    confidence: float
    bbox: Tuple[int, int, int, int]  # x, y, width, height
    area_hectares: float
    severity: str  # "low", "medium", "high", "critical"

@dataclass
class MultiClassAnalysisResult:
    """Complete multi-class analysis result"""
    change_detections: List[ChangeDetection]
    change_map: np.ndarray
    class_map: np.ndarray
    statistics: Dict[str, Any]
    confidence_map: np.ndarray
    processing_time: float

class MultiClassAnalyzer:
    """Advanced multi-class change detection analyzer"""
    
    # Land cover class mappings
    LAND_COVER_CLASSES = {
        0: "water",
        1: "forest", 
        2: "urban",
        3: "agriculture",
        4: "barren",
        5: "grassland",
        6: "wetland",
        7: "ice_snow"
    }
    
    # Change transition rules
    CHANGE_RULES = {
        ("forest", "urban"): ChangeType.URBANIZATION,
        ("forest", "barren"): ChangeType.DEFORESTATION,
        ("forest", "agriculture"): ChangeType.DEFORESTATION,
        ("urban", "barren"): ChangeType.DISASTER_DAMAGE,
        ("urban", "water"): ChangeType.DISASTER_DAMAGE,
        ("barren", "forest"): ChangeType.REFORESTATION,
        ("barren", "urban"): ChangeType.URBANIZATION,
        ("barren", "water"): ChangeType.WATER_INCREASE,
        ("water", "barren"): ChangeType.WATER_DECREASE,
        ("water", "urban"): ChangeType.URBANIZATION,
        ("agriculture", "urban"): ChangeType.URBANIZATION,
        ("agriculture", "barren"): ChangeType.VEGETATION_TO_BARREN,
        ("barren", "agriculture"): ChangeType.BARREN_TO_VEGETATION,
        ("grassland", "urban"): ChangeType.URBANIZATION,
        ("grassland", "barren"): ChangeType.VEGETATION_TO_BARREN,
    }
    
    def __init__(self, pixel_to_hectare_ratio: float = 0.01):
        """
        Initialize multi-class analyzer
        
        Args:
            pixel_to_hectare_ratio: Conversion factor from pixels to hectares
        """
        self.pixel_to_hectare_ratio = pixel_to_hectare_ratio
        
    async def analyze_multiclass_changes(
        self, 
        before_segmentation: np.ndarray,
        after_segmentation: np.ndarray,
        confidence_scores: Optional[np.ndarray] = None,
        image_metadata: Optional[Dict] = None
    ) -> MultiClassAnalysisResult:
        """
        Perform comprehensive multi-class change analysis
        
        Args:
            before_segmentation: Segmentation map of before image
            after_segmentation: Segmentation map of after image  
            confidence_scores: Confidence scores for each pixel
            image_metadata: Metadata about the images
            
        Returns:
            Complete multi-class analysis result
        """
        import time
        start_time = time.time()
        
        try:
            # Generate change map
            change_map = self._generate_change_map(before_segmentation, after_segmentation)
            
            # Generate class transition map
            class_map = self._generate_class_transition_map(
                before_segmentation, after_segmentation
            )
            
            # Detect individual change regions
            change_detections = await self._detect_change_regions(
                before_segmentation, after_segmentation, change_map, confidence_scores
            )
            
            # Calculate statistics
            statistics = self._calculate_change_statistics(
                change_detections, before_segmentation.shape
            )
            
            # Generate confidence map
            if confidence_scores is None:
                confidence_map = np.ones_like(change_map) * 0.8
            else:
                confidence_map = confidence_scores
                
            processing_time = time.time() - start_time
            
            return MultiClassAnalysisResult(
                change_detections=change_detections,
                change_map=change_map,
                class_map=class_map,
                statistics=statistics,
                confidence_map=confidence_map,
                processing_time=processing_time
            )
            
        except Exception as e:
            logger.error(f"Error in multi-class analysis: {str(e)}")
            raise
    
    def _generate_change_map(self, before: np.ndarray, after: np.ndarray) -> np.ndarray:
        """Generate binary change map"""
        return (before != after).astype(np.uint8)
    
    def _generate_class_transition_map(self, before: np.ndarray, after: np.ndarray) -> np.ndarray:
        """Generate map showing class transitions"""
        # Combine before and after classes into transition codes
        # Transition code = before_class * 100 + after_class
        transition_map = before.astype(np.uint16) * 100 + after.astype(np.uint16)
        return transition_map
    
    async def _detect_change_regions(
        self,
        before_seg: np.ndarray,
        after_seg: np.ndarray, 
        change_map: np.ndarray,
        confidence_scores: Optional[np.ndarray] = None
    ) -> List[ChangeDetection]:
        """Detect individual change regions"""
        
        detections = []
        
        # Find connected components of changes
        num_labels, labels, stats, centroids = cv2.connectedComponentsWithStats(
            change_map, connectivity=8
        )
        
        for label_id in range(1, num_labels):  # Skip background (0)
            # Get region mask
            region_mask = labels == label_id
            
            # Calculate bounding box
            bbox = self._get_bounding_box(stats[label_id])
            area_pixels = stats[label_id, cv2.CC_STAT_AREA]
            area_hectares = area_pixels * self.pixel_to_hectare_ratio
            
            # Skip very small regions
            if area_hectares < 0.1:  # Less than 0.1 hectare
                continue
            
            # Determine change type
            change_type = self._classify_region_change(
                before_seg, after_seg, region_mask
            )
            
            # Calculate confidence
            if confidence_scores is not None:
                region_confidence = np.mean(confidence_scores[region_mask])
            else:
                region_confidence = self._estimate_confidence(
                    before_seg, after_seg, region_mask
                )
            
            # Determine severity
            severity = self._calculate_severity(change_type, area_hectares, region_confidence)
            
            detection = ChangeDetection(
                change_type=change_type,
                confidence=float(region_confidence),
                bbox=bbox,
                area_hectares=area_hectares,
                severity=severity
            )
            
            detections.append(detection)
        
        return detections
    
    def _get_bounding_box(self, stats: np.ndarray) -> Tuple[int, int, int, int]:
        """Extract bounding box from connected component stats"""
        x = int(stats[cv2.CC_STAT_LEFT])
        y = int(stats[cv2.CC_STAT_TOP])
        w = int(stats[cv2.CC_STAT_WIDTH])
        h = int(stats[cv2.CC_STAT_HEIGHT])
        return (x, y, w, h)
    
    def _classify_region_change(
        self, 
        before_seg: np.ndarray,
        after_seg: np.ndarray,
        region_mask: np.ndarray
    ) -> ChangeType:
        """Classify the type of change in a region"""
        
        # Get most common classes in the region
        before_classes = before_seg[region_mask]
        after_classes = after_seg[region_mask]
        
        # Find dominant classes
        before_dominant = np.bincount(before_classes).argmax()
        after_dominant = np.bincount(after_classes).argmax()
        
        # Map class IDs to names
        before_class_name = self.LAND_COVER_CLASSES.get(before_dominant, "unknown")
        after_class_name = self.LAND_COVER_CLASSES.get(after_dominant, "unknown")
        
        # Apply change rules
        transition = (before_class_name, after_class_name)
        
        if transition in self.CHANGE_RULES:
            return self.CHANGE_RULES[transition]
        else:
            # Check for disaster patterns
            if self._is_disaster_pattern(before_classes, after_classes):
                return ChangeType.DISASTER_DAMAGE
            else:
                return ChangeType.NO_CHANGE
    
    def _is_disaster_pattern(self, before_classes: np.ndarray, after_classes: np.ndarray) -> bool:
        """Detect disaster damage patterns"""
        # Look for sudden large changes in class distribution
        before_counts = np.bincount(before_classes, minlength=8)
        after_counts = np.bincount(after_classes, minlength=8)
        
        # Normalize to percentages
        before_pct = before_counts / len(before_classes)
        after_pct = after_counts / len(after_classes)
        
        # Check for dramatic increases in barren land or water
        barren_increase = after_pct[4] - before_pct[4]  # barren land
        water_increase = after_pct[0] - before_pct[0]   # water
        
        # Disaster if barren or water increased by >30%
        return barren_increase > 0.3 or water_increase > 0.3
    
    def _estimate_confidence(
        self,
        before_seg: np.ndarray,
        after_seg: np.ndarray,
        region_mask: np.ndarray
    ) -> float:
        """Estimate confidence for a change region"""
        
        # Calculate based on change magnitude and consistency
        before_region = before_seg[region_mask]
        after_region = after_seg[region_mask]
        
        # Consistency - how uniform is the change?
        before_mode = np.bincount(before_region).argmax()
        after_mode = np.bincount(after_region).argmax()
        
        before_consistency = np.sum(before_region == before_mode) / len(before_region)
        after_consistency = np.sum(after_region == after_mode) / len(after_region)
        
        # Average consistency as confidence
        confidence = (before_consistency + after_consistency) / 2
        
        return min(0.95, max(0.3, confidence))
    
    def _calculate_severity(self, change_type: ChangeType, area_hectares: float, confidence: float) -> str:
        """Calculate severity level for a change"""
        
        # Base severity on area and change type
        severity_score = 0
        
        # Area factor
        if area_hectares > 1000:  # > 1000 hectares
            severity_score += 3
        elif area_hectares > 100:  # > 100 hectares  
            severity_score += 2
        elif area_hectares > 10:   # > 10 hectares
            severity_score += 1
        
        # Change type factor
        critical_changes = [
            ChangeType.DEFORESTATION, 
            ChangeType.DISASTER_DAMAGE,
            ChangeType.WATER_DECREASE
        ]
        high_changes = [
            ChangeType.URBANIZATION,
            ChangeType.VEGETATION_TO_BARREN
        ]
        
        if change_type in critical_changes:
            severity_score += 2
        elif change_type in high_changes:
            severity_score += 1
        
        # Confidence factor
        if confidence > 0.8:
            severity_score += 1
        
        # Map to severity levels
        if severity_score >= 5:
            return "critical"
        elif severity_score >= 3:
            return "high"
        elif severity_score >= 2:
            return "medium"
        else:
            return "low"
    
    def _calculate_change_statistics(
        self, 
        detections: List[ChangeDetection],
        image_shape: Tuple[int, int]
    ) -> Dict[str, Any]:
        """Calculate comprehensive change statistics"""
        
        total_area_hectares = (image_shape[0] * image_shape[1]) * self.pixel_to_hectare_ratio
        
        # Group by change type
        type_stats = {}
        for detection in detections:
            change_type = detection.change_type.value
            if change_type not in type_stats:
                type_stats[change_type] = {
                    "count": 0,
                    "total_area_hectares": 0,
                    "avg_confidence": 0,
                    "severity_breakdown": {"low": 0, "medium": 0, "high": 0, "critical": 0}
                }
            
            stats = type_stats[change_type]
            stats["count"] += 1
            stats["total_area_hectares"] += detection.area_hectares
            stats["avg_confidence"] += detection.confidence
            stats["severity_breakdown"][detection.severity] += 1
        
        # Calculate averages
        for stats in type_stats.values():
            if stats["count"] > 0:
                stats["avg_confidence"] /= stats["count"]
                stats["percentage_of_image"] = (stats["total_area_hectares"] / total_area_hectares) * 100
        
        # Overall statistics
        total_changed_area = sum(d.area_hectares for d in detections)
        overall_change_percentage = (total_changed_area / total_area_hectares) * 100
        
        return {
            "total_detections": len(detections),
            "total_changed_area_hectares": total_changed_area,
            "overall_change_percentage": overall_change_percentage,
            "change_type_breakdown": type_stats,
            "severity_summary": self._get_severity_summary(detections),
            "confidence_summary": self._get_confidence_summary(detections)
        }
    
    def _get_severity_summary(self, detections: List[ChangeDetection]) -> Dict[str, int]:
        """Get summary of severity levels"""
        severity_counts = {"low": 0, "medium": 0, "high": 0, "critical": 0}
        for detection in detections:
            severity_counts[detection.severity] += 1
        return severity_counts
    
    def _get_confidence_summary(self, detections: List[ChangeDetection]) -> Dict[str, float]:
        """Get summary of confidence scores"""
        if not detections:
            return {"mean": 0, "min": 0, "max": 0, "std": 0}
        
        confidences = [d.confidence for d in detections]
        return {
            "mean": float(np.mean(confidences)),
            "min": float(np.min(confidences)),
            "max": float(np.max(confidences)),
            "std": float(np.std(confidences))
        }
    
    def generate_change_summary_report(self, result: MultiClassAnalysisResult) -> Dict[str, Any]:
        """Generate a comprehensive summary report"""
        
        # Priority changes (high impact)
        priority_changes = [
            d for d in result.change_detections 
            if d.severity in ["high", "critical"]
        ]
        
        # Environmental impact
        deforestation_area = sum(
            d.area_hectares for d in result.change_detections
            if d.change_type == ChangeType.DEFORESTATION
        )
        
        urbanization_area = sum(
            d.area_hectares for d in result.change_detections
            if d.change_type == ChangeType.URBANIZATION
        )
        
        return {
            "executive_summary": {
                "total_changes_detected": len(result.change_detections),
                "priority_changes": len(priority_changes),
                "processing_time_seconds": result.processing_time,
                "overall_confidence": float(np.mean(result.confidence_map))
            },
            "environmental_impact": {
                "deforestation_hectares": deforestation_area,
                "urbanization_hectares": urbanization_area,
                "net_forest_loss": deforestation_area  # Simplified calculation
            },
            "priority_alerts": [
                {
                    "change_type": d.change_type.value,
                    "severity": d.severity,
                    "area_hectares": d.area_hectares,
                    "location": {"bbox": d.bbox},
                    "confidence": d.confidence
                }
                for d in priority_changes[:10]  # Top 10 priority changes
            ],
            "detailed_statistics": result.statistics
        }