// Geospatial Service
// Handles API calls for geospatial processing and map overlays

const API_BASE_URL = '/ml_backend';

export class GeospatialService {
  /**
   * Export change detections to GeoJSON or KML format
   * @param {Object} params Export parameters
   * @param {Array} params.changeDetections Array of change detection results
   * @param {Object} params.imageShape Image dimensions {height, width}
   * @param {Object} params.geoBounds Geographic bounds {north, south, east, west}
   * @param {string} params.exportFormat Format: 'geojson' or 'kml'
   * @returns {Promise<Object>} Export result with download data
   */
  static async exportChangeDetections(params) {
    const {
      changeDetections,
      imageShape,
      geoBounds,
      exportFormat = 'geojson'
    } = params;

    // Prepare change detections data
    const detectionData = JSON.stringify(changeDetections);
    const base64Data = btoa(detectionData);

    const requestBody = {
      change_detections_base64: `data:application/json;base64,${base64Data}`,
      image_height: imageShape.height,
      image_width: imageShape.width,
      geo_bounds: geoBounds,
      export_format: exportFormat
    };

    const response = await fetch(`${API_BASE_URL}/geospatial/export-change-detections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Export failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Create map configuration for a specific provider
   * @param {Object} params Configuration parameters
   * @param {string} params.geojsonData Base64 encoded GeoJSON data
   * @param {string} params.mapProvider Provider: 'mapbox' or 'leaflet'
   * @param {string} params.mapStyle Optional map style URL
   * @param {number} params.centerLat Optional center latitude
   * @param {number} params.centerLon Optional center longitude
   * @returns {Promise<Object>} Map configuration object
   */
  static async createMapConfiguration(params) {
    const {
      geojsonData,
      mapProvider = 'mapbox',
      mapStyle,
      centerLat,
      centerLon
    } = params;

    const requestBody = {
      geojson_data: geojsonData,
      map_provider: mapProvider,
      map_style: mapStyle,
      center_lat: centerLat,
      center_lon: centerLon
    };

    const response = await fetch(`${API_BASE_URL}/geospatial/create-map-configuration`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Configuration creation failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Cluster nearby change detections for better visualization
   * @param {Array} changeDetections Array of change detection results
   * @param {number} maxDistanceMeters Maximum distance for clustering (default: 1000)
   * @returns {Promise<Object>} Clustered change groups
   */
  static async clusterDetections(changeDetections, maxDistanceMeters = 1000) {
    const detectionData = JSON.stringify(changeDetections);
    const base64Data = btoa(detectionData);

    const requestBody = {
      change_detections_base64: `data:application/json;base64,${base64Data}`,
      max_distance_meters: maxDistanceMeters
    };

    const response = await fetch(`${API_BASE_URL}/geospatial/cluster-detections`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(requestBody),
    });

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.detail || `Clustering failed: ${response.statusText}`);
    }

    return await response.json();
  }

  /**
   * Download file from base64 data URL
   * @param {string} dataUrl Base64 data URL
   * @param {string} filename Filename for download
   */
  static downloadFile(dataUrl, filename) {
    const link = document.createElement('a');
    link.href = dataUrl;
    link.download = filename;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  /**
   * Convert GeoJSON data to downloadable file
   * @param {Object} geojsonData GeoJSON object
   * @param {string} filename Optional filename
   * @returns {string} Data URL for download
   */
  static geojsonToDataUrl(geojsonData, filename = 'change_detections.geojson') {
    const jsonString = JSON.stringify(geojsonData, null, 2);
    const blob = new Blob([jsonString], { type: 'application/geo+json' });
    return URL.createObjectURL(blob);
  }

  /**
   * Convert KML data to downloadable file
   * @param {string} kmlData KML XML string
   * @param {string} filename Optional filename
   * @returns {string} Data URL for download
   */
  static kmlToDataUrl(kmlData, filename = 'change_detections.kml') {
    const blob = new Blob([kmlData], { type: 'application/vnd.google-earth.kml+xml' });
    return URL.createObjectURL(blob);
  }

  /**
   * Parse base64 data URL to get the raw data
   * @param {string} dataUrl Base64 data URL
   * @returns {string} Decoded data
   */
  static parseDataUrl(dataUrl) {
    if (dataUrl.includes('base64,')) {
      const base64Data = dataUrl.split('base64,')[1];
      return atob(base64Data);
    }
    return dataUrl;
  }

  /**
   * Calculate geographic bounds from GeoJSON features
   * @param {Object} geojsonData GeoJSON object
   * @returns {Object} Bounds object {north, south, east, west}
   */
  static calculateBounds(geojsonData) {
    if (!geojsonData.features || geojsonData.features.length === 0) {
      return null;
    }

    let minLat = Infinity;
    let maxLat = -Infinity;
    let minLon = Infinity;
    let maxLon = -Infinity;

    geojsonData.features.forEach(feature => {
      if (feature.geometry && feature.geometry.coordinates) {
        const coords = feature.geometry.coordinates;
        
        if (feature.geometry.type === 'Polygon') {
          coords[0].forEach(coord => {
            const [lon, lat] = coord;
            minLat = Math.min(minLat, lat);
            maxLat = Math.max(maxLat, lat);
            minLon = Math.min(minLon, lon);
            maxLon = Math.max(maxLon, lon);
          });
        } else if (feature.geometry.type === 'Point') {
          const [lon, lat] = coords;
          minLat = Math.min(minLat, lat);
          maxLat = Math.max(maxLat, lat);
          minLon = Math.min(minLon, lon);
          maxLon = Math.max(maxLon, lon);
        }
      }
    });

    return {
      north: maxLat,
      south: minLat,
      east: maxLon,
      west: minLon
    };
  }

  /**
   * Validate geographic bounds
   * @param {Object} bounds Bounds object {north, south, east, west}
   * @returns {boolean} Whether bounds are valid
   */
  static validateBounds(bounds) {
    if (!bounds || typeof bounds !== 'object') return false;
    
    const { north, south, east, west } = bounds;
    
    return (
      typeof north === 'number' && north >= -90 && north <= 90 &&
      typeof south === 'number' && south >= -90 && south <= 90 &&
      typeof east === 'number' && east >= -180 && east <= 180 &&
      typeof west === 'number' && west >= -180 && west <= 180 &&
      north > south &&
      east > west
    );
  }

  /**
   * Generate default bounds based on common locations
   * @param {string} region Region identifier
   * @returns {Object} Default bounds for the region
   */
  static getDefaultBounds(region = 'default') {
    const defaultBounds = {
      'default': { north: 40.0, south: 39.0, east: -73.0, west: -74.0 }, // NYC area
      'california': { north: 42.0, south: 32.5, east: -114.1, west: -124.4 },
      'europe': { north: 71.2, south: 34.8, east: 69.1, west: -31.3 },
      'amazon': { north: 5.3, south: -20.0, east: -44.0, west: -81.4 },
      'sahara': { north: 23.5, south: 15.0, east: 25.0, west: -17.0 },
      'himalayas': { north: 36.0, south: 26.3, east: 104.1, west: 67.0 }
    };

    return defaultBounds[region] || defaultBounds['default'];
  }

  /**
   * Format area from square meters to appropriate units
   * @param {number} areaMeters Area in square meters
   * @returns {Object} Formatted area with value and unit
   */
  static formatArea(areaMeters) {
    if (areaMeters < 10000) { // Less than 1 hectare
      return { value: Math.round(areaMeters), unit: 'm²' };
    } else if (areaMeters < 1000000) { // Less than 1 km²
      return { value: (areaMeters / 10000).toFixed(2), unit: 'hectares' };
    } else {
      return { value: (areaMeters / 1000000).toFixed(2), unit: 'km²' };
    }
  }

  /**
   * Get color for change type
   * @param {string} changeType Type of change
   * @returns {string} Hex color code
   */
  static getChangeTypeColor(changeType) {
    const colorMap = {
      'deforestation': '#ff4444',
      'urbanization': '#888888',
      'water_increase': '#4444ff',
      'water_decrease': '#ffff44',
      'disaster_damage': '#ff0000',
      'burned': '#ff8800',
      'flooded': '#0088ff',
      'collapsed': '#8800ff',
      'default': '#00ff00'
    };

    return colorMap[changeType] || colorMap['default'];
  }

  /**
   * Get severity level styling
   * @param {string} severity Severity level
   * @returns {Object} Style properties
   */
  static getSeverityStyle(severity) {
    const styles = {
      'critical': { opacity: 0.8, className: 'bg-red-100 text-red-800', priority: 4 },
      'high': { opacity: 0.6, className: 'bg-orange-100 text-orange-800', priority: 3 },
      'medium': { opacity: 0.4, className: 'bg-yellow-100 text-yellow-800', priority: 2 },
      'low': { opacity: 0.2, className: 'bg-green-100 text-green-800', priority: 1 },
      'default': { opacity: 0.3, className: 'bg-gray-100 text-gray-800', priority: 0 }
    };

    return styles[severity] || styles['default'];
  }

  /**
   * Create a simple statistics summary from change detections
   * @param {Array} changeDetections Array of change detection results
   * @returns {Object} Statistics summary
   */
  static createStatsSummary(changeDetections) {
    if (!changeDetections || changeDetections.length === 0) {
      return { total: 0, byType: {}, bySeverity: {}, totalArea: 0 };
    }

    const stats = {
      total: changeDetections.length,
      byType: {},
      bySeverity: {},
      totalArea: 0,
      avgConfidence: 0
    };

    let totalConfidence = 0;

    changeDetections.forEach(detection => {
      // Count by type
      const type = detection.change_type?.value || detection.change_type || 'unknown';
      stats.byType[type] = (stats.byType[type] || 0) + 1;

      // Count by severity
      const severity = detection.severity || 'unknown';
      stats.bySeverity[severity] = (stats.bySeverity[severity] || 0) + 1;

      // Sum area and confidence
      stats.totalArea += detection.area_hectares || 0;
      totalConfidence += detection.confidence || 0;
    });

    stats.avgConfidence = totalConfidence / changeDetections.length;

    return stats;
  }
}

export default GeospatialService;