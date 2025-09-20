# Interactive Map Overlay System 🗺️

The Interactive Map Overlay System enables users to visualize and interact with change detection results on geographic maps. This system converts ML analysis results into standardized geospatial formats and provides interactive mapping components.

## Features

### 🌍 **Geospatial Data Export**
- **GeoJSON Export**: Web-friendly format for JavaScript mapping libraries
- **KML Export**: Compatible with Google Earth and GIS applications
- **Coordinate Transformation**: Convert pixel coordinates to geographic coordinates (WGS84)
- **Geographic Bounds**: Support for custom coordinate system definitions

### 🗺️ **Interactive Map Components**
- **Mapbox Integration**: High-performance WebGL mapping with satellite imagery
- **Leaflet Support**: Open-source mapping alternative
- **Real-time Interactions**: Click, hover, and selection events
- **Dynamic Styling**: Color-coded features based on change type and severity

### 📊 **Visualization Features**
- **Multi-layer Display**: Change overlays with base map layers
- **Interactive Popups**: Detailed information on click/hover
- **Legend & Controls**: Map navigation, layer controls, and export tools
- **Feature Clustering**: Group nearby detections for better visualization

## System Architecture

```
┌─────────────────────────────────────────────────────────────┐
│                    FRONTEND (React)                         │
├─────────────────────────────────────────────────────────────┤
│ InteractiveMapOverlay.jsx  │ GeospatialExport.jsx          │
│ - Mapbox/Leaflet rendering │ - Export UI controls          │
│ - User interactions        │ - Progress tracking           │
│ - Feature selection        │ - Configuration generation    │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                 GEOSPATIAL SERVICE                          │
├─────────────────────────────────────────────────────────────┤
│ GeospatialService.js                                        │
│ - API communication        │ - Data validation             │
│ - Format conversions       │ - Error handling              │
│ - Utility functions        │ - Statistics calculation      │
└─────────────────────────────────────────────────────────────┘
                              │
                              ▼
┌─────────────────────────────────────────────────────────────┐
│                  BACKEND API (FastAPI)                     │
├─────────────────────────────────────────────────────────────┤
│ geospatial.py (Router)     │ geospatial_processor.py       │
│ - /export-change-detections│ - Coordinate transformations  │
│ - /create-map-configuration│ - GeoJSON/KML generation      │
│ - /cluster-detections      │ - Spatial analysis            │
└─────────────────────────────────────────────────────────────┘
```

## API Endpoints

### **POST** `/ml_backend/geospatial/export-change-detections`
Export change detection results to GeoJSON or KML format.

**Request Body:**
```json
{
  "change_detections_base64": "data:application/json;base64,eyJ0eXBlIjoi...",
  "image_height": 1024,
  "image_width": 1024,
  "geo_bounds": {
    "north": 40.0,
    "south": 39.0,
    "east": -73.0,
    "west": -74.0
  },
  "export_format": "geojson"
}
```

**Response:**
```json
{
  "filename": "change_detections.geojson",
  "content_type": "application/geo+json",
  "data": "data:application/geo+json;base64,eyJ0eXBlIjoi...",
  "export_format": "geojson"
}
```

### **POST** `/ml_backend/geospatial/create-map-configuration`
Generate map configuration for Mapbox or Leaflet.

**Request Body:**
```json
{
  "geojson_data": "data:application/geo+json;base64,eyJ0eXBlIjoi...",
  "map_provider": "mapbox",
  "map_style": "mapbox://styles/mapbox/satellite-v9",
  "center_lat": 39.5,
  "center_lon": -73.5
}
```

### **POST** `/ml_backend/geospatial/cluster-detections`
Cluster nearby change detections for improved visualization.

**Request Body:**
```json
{
  "change_detections_base64": "data:application/json;base64,eyJ0eXBlIjoi...",
  "max_distance_meters": 1000
}
```

## Frontend Integration

### Using InteractiveMapOverlay Component

```jsx
import React, { useState, useEffect } from 'react';
import InteractiveMapOverlay from './components/InteractiveMapOverlay';
import GeospatialExport from './components/GeospatialExport';

const AnalysisResults = ({ changeDetections, imageShape }) => {
  const [geojsonData, setGeojsonData] = useState(null);
  const [mapboxToken] = useState(process.env.REACT_APP_MAPBOX_ACCESS_TOKEN);
  
  const handleExportComplete = (exportResult) => {
    if (exportResult.export_format === 'geojson') {
      // Parse GeoJSON data for map display
      const base64Data = exportResult.data.split(',')[1];
      const jsonData = JSON.parse(atob(base64Data));
      setGeojsonData(jsonData);
    }
  };
  
  const handleFeatureClick = (feature) => {
    console.log('Feature clicked:', feature.properties);
  };

  return (
    <div className="space-y-6">
      {/* Export Controls */}
      <GeospatialExport
        changeDetections={changeDetections}
        imageShape={imageShape}
        geoBounds={{ north: 40.0, south: 39.0, east: -73.0, west: -74.0 }}
        onExportComplete={handleExportComplete}
      />
      
      {/* Interactive Map */}
      {geojsonData && (
        <InteractiveMapOverlay
          geojsonData={geojsonData}
          mapboxAccessToken={mapboxToken}
          mapStyle="mapbox://styles/mapbox/satellite-v9"
          onFeatureClick={handleFeatureClick}
          height="600px"
        />
      )}
    </div>
  );
};
```

### Using GeospatialService

```javascript
import GeospatialService from '../services/geospatialService';

// Export change detections
const exportData = async () => {
  try {
    const result = await GeospatialService.exportChangeDetections({
      changeDetections: detectionResults,
      imageShape: { height: 1024, width: 1024 },
      geoBounds: { north: 40.0, south: 39.0, east: -73.0, west: -74.0 },
      exportFormat: 'geojson'
    });
    
    // Download file
    GeospatialService.downloadFile(result.data, result.filename);
  } catch (error) {
    console.error('Export failed:', error);
  }
};

// Create map configuration
const createMapConfig = async (geojsonData) => {
  try {
    const config = await GeospatialService.createMapConfiguration({
      geojsonData: geojsonData,
      mapProvider: 'mapbox',
      mapStyle: 'mapbox://styles/mapbox/satellite-v9'
    });
    
    // Use configuration for map initialization
    return config;
  } catch (error) {
    console.error('Config creation failed:', error);
  }
};
```

## Change Type Visualization

The system provides color-coded visualization for different change types:

| Change Type | Color | Description |
|------------|-------|-------------|
| 🌳 Deforestation | ![#ff4444](https://via.placeholder.com/15/ff4444/000000?text=+) `#ff4444` | Forest loss areas |
| 🏙️ Urbanization | ![#888888](https://via.placeholder.com/15/888888/000000?text=+) `#888888` | New urban development |
| 🌊 Water Increase | ![#4444ff](https://via.placeholder.com/15/4444ff/000000?text=+) `#4444ff` | Flooding or new water bodies |
| 🏜️ Water Decrease | ![#ffff44](https://via.placeholder.com/15/ffff44/000000?text=+) `#ffff44` | Drought or dried areas |
| ⚠️ Disaster Damage | ![#ff0000](https://via.placeholder.com/15/ff0000/000000?text=+) `#ff0000` | General disaster impact |
| 🔥 Burned Areas | ![#ff8800](https://via.placeholder.com/15/ff8800/000000?text=+) `#ff8800` | Fire-affected regions |
| 🌊 Flooded Areas | ![#0088ff](https://via.placeholder.com/15/0088ff/000000?text=+) `#0088ff` | Flood zones |
| 💥 Collapsed Structures | ![#8800ff](https://via.placeholder.com/15/8800ff/000000?text=+) `#8800ff` | Building collapse |

## Severity Levels

Features are styled with different opacity levels based on severity:

- **Critical** (0.8 opacity): Immediate attention required
- **High** (0.6 opacity): Significant impact
- **Medium** (0.4 opacity): Moderate impact  
- **Low** (0.2 opacity): Minor changes

## Configuration Requirements

### Environment Variables

```bash
# Frontend (.env)
REACT_APP_MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token_here
REACT_APP_ML_BACKEND_URL=http://localhost:8001

# Backend
ML_MODELS_PATH=/path/to/model/weights
MAPBOX_ACCESS_TOKEN=pk.your_mapbox_token_here  # Optional for server-side operations
```

### Required Dependencies

**Frontend:**
```json
{
  "dependencies": {
    "mapbox-gl": "^2.15.0",
    "react": "^18.0.0",
    "lucide-react": "^0.263.1"
  }
}
```

**Backend:**
```txt
fastapi>=0.100.0
shapely>=2.0.0
pyproj>=3.4.0
scikit-learn>=1.3.0
```

## Usage Examples

### 1. Basic GeoJSON Export

```javascript
// Export change detections as GeoJSON
const exportGeoJSON = async (changeDetections, imageInfo) => {
  const exportResult = await GeospatialService.exportChangeDetections({
    changeDetections,
    imageShape: { height: imageInfo.height, width: imageInfo.width },
    geoBounds: imageInfo.geoBounds,
    exportFormat: 'geojson'
  });
  
  // Download the file
  GeospatialService.downloadFile(exportResult.data, exportResult.filename);
};
```

### 2. Interactive Map with Custom Styling

```jsx
<InteractiveMapOverlay
  geojsonData={geojsonData}
  mapboxAccessToken={mapboxToken}
  mapStyle="mapbox://styles/mapbox/satellite-streets-v11"
  onFeatureClick={(feature) => {
    setSelectedFeature(feature);
    openDetailPanel();
  }}
  onFeatureHover={(feature) => {
    showTooltip(feature.properties);
  }}
  height="800px"
  className="rounded-lg shadow-lg"
/>
```

### 3. Clustering for Large Datasets

```javascript
// Cluster nearby detections for better performance
const clusterDetections = async (changeDetections) => {
  const clusteredResult = await GeospatialService.clusterDetections(
    changeDetections,
    1500  // 1.5km clustering distance
  );
  
  return clusteredResult.clusters;
};
```

## Performance Considerations

- **Large Datasets**: Use clustering for 100+ features
- **Map Tiles**: Choose appropriate zoom levels for data density
- **Memory Usage**: Limit concurrent overlay features to 1000
- **Network**: Compress base64 data for large exports

## Browser Compatibility

- **Chrome/Edge**: Full support with WebGL
- **Firefox**: Full support with WebGL
- **Safari**: Supported with some WebGL limitations
- **Mobile**: Responsive design with touch interactions

## Troubleshooting

### Common Issues

**1. Map Not Loading**
- Check Mapbox access token validity
- Verify CORS settings for map tile requests
- Ensure WebGL support in browser

**2. Export Failures**
- Validate change detection data format
- Check geographic bounds validity
- Monitor backend logs for processing errors

**3. Performance Issues**
- Enable feature clustering for large datasets
- Reduce map rendering complexity
- Optimize GeoJSON file sizes

### Debug Tools

```javascript
// Enable debug logging
window.GEOSPATIAL_DEBUG = true;

// Check bounds validity
const isValid = GeospatialService.validateBounds(bounds);
console.log('Bounds valid:', isValid);

// Calculate statistics
const stats = GeospatialService.createStatsSummary(changeDetections);
console.log('Detection statistics:', stats);
```

## Future Enhancements

- **Time-series Animation**: Animate changes over multiple time periods
- **3D Visualization**: Elevation-aware change detection
- **Real-time Updates**: WebSocket-based live change monitoring
- **Advanced Filtering**: Multi-criteria feature filtering
- **Export to More Formats**: Shapefile, GeoTIFF, and other GIS formats

---

This Interactive Map Overlay System provides a comprehensive solution for visualizing satellite image change detection results in an interactive, web-based mapping environment. The modular architecture ensures easy integration with existing applications while maintaining high performance and usability.

For detailed implementation examples and API documentation, refer to the individual component files and service documentation.