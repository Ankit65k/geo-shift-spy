import React, { useEffect, useRef, useState } from 'react';
import mapboxgl from 'mapbox-gl';
import 'mapbox-gl/dist/mapbox-gl.css';

const InteractiveMapOverlay = ({ 
  geojsonData, 
  mapboxAccessToken, 
  mapStyle = 'mapbox://styles/mapbox/satellite-v9',
  onFeatureClick,
  onFeatureHover,
  className = '',
  height = '500px'
}) => {
  const mapContainer = useRef(null);
  const map = useRef(null);
  const [mapLoaded, setMapLoaded] = useState(false);
  const [selectedFeature, setSelectedFeature] = useState(null);
  const [hoveredFeature, setHoveredFeature] = useState(null);

  // Initialize map
  useEffect(() => {
    if (map.current || !mapboxAccessToken) return;

    mapboxgl.accessToken = mapboxAccessToken;

    // Calculate center from GeoJSON bounds
    let center = [-73.5, 39.5]; // Default center
    let zoom = 12;

    if (geojsonData?.metadata?.bounds) {
      const bounds = geojsonData.metadata.bounds;
      center = [
        (bounds.west + bounds.east) / 2,
        (bounds.south + bounds.north) / 2
      ];
    }

    map.current = new mapboxgl.Map({
      container: mapContainer.current,
      style: mapStyle,
      center: center,
      zoom: zoom,
      pitch: 0,
      bearing: 0
    });

    // Add navigation controls
    map.current.addControl(new mapboxgl.NavigationControl(), 'top-right');
    map.current.addControl(new mapboxgl.FullscreenControl(), 'top-right');
    map.current.addControl(new mapboxgl.ScaleControl(), 'bottom-left');

    map.current.on('load', () => {
      setMapLoaded(true);
      if (geojsonData) {
        addGeoJSONLayer(geojsonData);
      }
    });

    return () => {
      if (map.current) {
        map.current.remove();
      }
    };
  }, [mapboxAccessToken, mapStyle]);

  // Update GeoJSON data
  useEffect(() => {
    if (mapLoaded && geojsonData) {
      addGeoJSONLayer(geojsonData);
    }
  }, [mapLoaded, geojsonData]);

  const addGeoJSONLayer = (data) => {
    if (!map.current || !data) return;

    // Remove existing layers
    const existingLayers = ['change-detections-fill', 'change-detections-line', 'change-detections-label'];
    existingLayers.forEach(layerId => {
      if (map.current.getLayer(layerId)) {
        map.current.removeLayer(layerId);
      }
    });

    if (map.current.getSource('change-detections')) {
      map.current.removeSource('change-detections');
    }

    // Add source
    map.current.addSource('change-detections', {
      type: 'geojson',
      data: data
    });

    // Add fill layer
    map.current.addLayer({
      id: 'change-detections-fill',
      type: 'fill',
      source: 'change-detections',
      paint: {
        'fill-color': [
          'case',
          ['==', ['get', 'change_type'], 'deforestation'], '#ff4444',
          ['==', ['get', 'change_type'], 'urbanization'], '#888888',
          ['==', ['get', 'change_type'], 'water_increase'], '#4444ff',
          ['==', ['get', 'change_type'], 'water_decrease'], '#ffff44',
          ['==', ['get', 'change_type'], 'disaster_damage'], '#ff0000',
          ['==', ['get', 'change_type'], 'burned'], '#ff8800',
          ['==', ['get', 'change_type'], 'flooded'], '#0088ff',
          ['==', ['get', 'change_type'], 'collapsed'], '#8800ff',
          '#00ff00'  // Default color
        ],
        'fill-opacity': [
          'case',
          ['==', ['get', 'severity'], 'critical'], 0.8,
          ['==', ['get', 'severity'], 'high'], 0.6,
          ['==', ['get', 'severity'], 'medium'], 0.4,
          ['==', ['get', 'severity'], 'low'], 0.2,
          0.3
        ]
      }
    });

    // Add outline layer
    map.current.addLayer({
      id: 'change-detections-line',
      type: 'line',
      source: 'change-detections',
      paint: {
        'line-color': [
          'case',
          ['==', ['get', 'id'], selectedFeature?.id], '#ffffff',
          '#000000'
        ],
        'line-width': [
          'case',
          ['==', ['get', 'id'], selectedFeature?.id], 4,
          2
        ],
        'line-opacity': 0.8
      }
    });

    // Add label layer for important changes
    map.current.addLayer({
      id: 'change-detections-label',
      type: 'symbol',
      source: 'change-detections',
      filter: [
        'any',
        ['==', ['get', 'severity'], 'critical'],
        ['==', ['get', 'severity'], 'high']
      ],
      layout: {
        'text-field': [
          'case',
          ['==', ['get', 'change_type'], 'deforestation'], '🌳',
          ['==', ['get', 'change_type'], 'urbanization'], '🏙️',
          ['==', ['get', 'change_type'], 'water_increase'], '🌊',
          ['==', ['get', 'change_type'], 'water_decrease'], '🏜️',
          ['==', ['get', 'change_type'], 'disaster_damage'], '⚠️',
          ['==', ['get', 'change_type'], 'burned'], '🔥',
          ['==', ['get', 'change_type'], 'flooded'], '🌊',
          ['==', ['get', 'change_type'], 'collapsed'], '💥',
          '📍'
        ],
        'text-font': ['Open Sans Bold', 'Arial Unicode MS Bold'],
        'text-size': 16,
        'text-offset': [0, -1],
        'text-anchor': 'bottom'
      },
      paint: {
        'text-color': '#ffffff',
        'text-halo-color': '#000000',
        'text-halo-width': 2
      }
    });

    // Add click handlers
    map.current.on('click', 'change-detections-fill', (e) => {
      const feature = e.features[0];
      setSelectedFeature(feature);
      
      if (onFeatureClick) {
        onFeatureClick(feature);
      }

      // Create popup
      new mapboxgl.Popup()
        .setLngLat(e.lngLat)
        .setHTML(createPopupContent(feature.properties))
        .addTo(map.current);
    });

    // Add hover handlers
    map.current.on('mouseenter', 'change-detections-fill', (e) => {
      map.current.getCanvas().style.cursor = 'pointer';
      const feature = e.features[0];
      setHoveredFeature(feature);
      
      if (onFeatureHover) {
        onFeatureHover(feature);
      }
    });

    map.current.on('mouseleave', 'change-detections-fill', () => {
      map.current.getCanvas().style.cursor = '';
      setHoveredFeature(null);
    });

    // Fit bounds to data
    if (data.features && data.features.length > 0) {
      const bounds = new mapboxgl.LngLatBounds();
      data.features.forEach(feature => {
        if (feature.geometry.type === 'Polygon') {
          feature.geometry.coordinates[0].forEach(coord => {
            bounds.extend(coord);
          });
        }
      });
      
      map.current.fitBounds(bounds, {
        padding: 50,
        maxZoom: 15
      });
    }
  };

  const createPopupContent = (properties) => {
    const changeType = properties.change_type?.replace('_', ' ').replace(/\b\w/g, l => l.toUpperCase()) || 'Unknown';
    const confidence = (properties.confidence * 100).toFixed(1);
    const severity = properties.severity?.charAt(0).toUpperCase() + properties.severity?.slice(1) || 'Unknown';
    const area = properties.area_hectares?.toFixed(2) || '0';
    const timestamp = properties.detection_timestamp ? new Date(properties.detection_timestamp).toLocaleString() : 'Unknown';

    return `
      <div class="bg-white p-4 rounded-lg shadow-lg max-w-sm">
        <h3 class="text-lg font-bold text-gray-800 mb-2">${changeType}</h3>
        <div class="space-y-1 text-sm">
          <div class="flex justify-between">
            <span class="font-medium">Confidence:</span>
            <span class="text-blue-600">${confidence}%</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Severity:</span>
            <span class="px-2 py-1 rounded text-xs font-medium ${getSeverityClasses(properties.severity)}">${severity}</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Area:</span>
            <span>${area} hectares</span>
          </div>
          <div class="flex justify-between">
            <span class="font-medium">Detected:</span>
            <span class="text-gray-600">${timestamp}</span>
          </div>
        </div>
      </div>
    `;
  };

  const getSeverityClasses = (severity) => {
    switch (severity) {
      case 'critical':
        return 'bg-red-100 text-red-800';
      case 'high':
        return 'bg-orange-100 text-orange-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const exportMap = (format) => {
    if (!map.current) return;

    if (format === 'png') {
      const canvas = map.current.getCanvas();
      const link = document.createElement('a');
      link.download = 'change-detection-map.png';
      link.href = canvas.toDataURL();
      link.click();
    }
  };

  return (
    <div className={`relative ${className}`} style={{ height }}>
      <div ref={mapContainer} className="w-full h-full rounded-lg" />
      
      {/* Map Controls */}
      <div className="absolute top-4 left-4 bg-white rounded-lg shadow-lg p-2">
        <div className="space-y-2">
          <button
            onClick={() => exportMap('png')}
            className="block w-full text-left px-3 py-1 text-sm hover:bg-gray-100 rounded"
            title="Export as PNG"
          >
            📷 Export Map
          </button>
        </div>
      </div>

      {/* Legend */}
      <div className="absolute bottom-4 right-4 bg-white bg-opacity-90 rounded-lg shadow-lg p-4 max-w-xs">
        <h4 className="font-bold text-gray-800 mb-2">Change Detection Results</h4>
        <div className="space-y-1 text-sm">
          <LegendItem color="#ff4444" label="Deforestation" />
          <LegendItem color="#888888" label="Urbanization" />
          <LegendItem color="#4444ff" label="Water Increase" />
          <LegendItem color="#ffff44" label="Water Decrease" />
          <LegendItem color="#ff0000" label="Disaster Damage" />
          <LegendItem color="#ff8800" label="Burned Areas" />
          <LegendItem color="#0088ff" label="Flooded Areas" />
          <LegendItem color="#8800ff" label="Collapsed Structures" />
        </div>
      </div>

      {/* Feature Info Panel */}
      {selectedFeature && (
        <div className="absolute top-4 right-4 bg-white rounded-lg shadow-lg p-4 max-w-sm">
          <div className="flex justify-between items-start mb-2">
            <h3 className="font-bold text-gray-800">Selected Feature</h3>
            <button
              onClick={() => setSelectedFeature(null)}
              className="text-gray-500 hover:text-gray-700"
            >
              ✕
            </button>
          </div>
          <FeatureDetails feature={selectedFeature} />
        </div>
      )}

      {/* Loading State */}
      {!mapLoaded && (
        <div className="absolute inset-0 bg-gray-100 flex items-center justify-center rounded-lg">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto mb-2"></div>
            <p className="text-gray-600">Loading map...</p>
          </div>
        </div>
      )}
    </div>
  );
};

const LegendItem = ({ color, label }) => (
  <div className="flex items-center space-x-2">
    <div 
      className="w-4 h-4 rounded" 
      style={{ backgroundColor: color }}
    ></div>
    <span className="text-gray-700">{label}</span>
  </div>
);

const FeatureDetails = ({ feature }) => {
  const props = feature.properties;
  
  return (
    <div className="space-y-2 text-sm">
      <div>
        <span className="font-medium">Type: </span>
        <span className="capitalize">{props.change_type?.replace('_', ' ')}</span>
      </div>
      <div>
        <span className="font-medium">Confidence: </span>
        <span>{(props.confidence * 100).toFixed(1)}%</span>
      </div>
      <div>
        <span className="font-medium">Severity: </span>
        <span className={`px-2 py-1 rounded text-xs font-medium ${getSeverityClasses(props.severity)}`}>
          {props.severity?.charAt(0).toUpperCase() + props.severity?.slice(1)}
        </span>
      </div>
      <div>
        <span className="font-medium">Area: </span>
        <span>{props.area_hectares?.toFixed(2)} hectares</span>
      </div>
      {props.affected_structures && (
        <div>
          <span className="font-medium">Affected Structures: </span>
          <span>{props.affected_structures}</span>
        </div>
      )}
      <div>
        <span className="font-medium">Detected: </span>
        <span className="text-gray-600">
          {props.detection_timestamp ? new Date(props.detection_timestamp).toLocaleDateString() : 'Unknown'}
        </span>
      </div>
    </div>
  );
};

const getSeverityClasses = (severity) => {
  switch (severity) {
    case 'critical':
      return 'bg-red-100 text-red-800';
    case 'high':
      return 'bg-orange-100 text-orange-800';
    case 'medium':
      return 'bg-yellow-100 text-yellow-800';
    case 'low':
      return 'bg-green-100 text-green-800';
    default:
      return 'bg-gray-100 text-gray-800';
  }
};

export default InteractiveMapOverlay;