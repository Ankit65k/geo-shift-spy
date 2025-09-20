import React, { useState, useCallback } from 'react';
import { Download, Map, Globe, Settings, FileText, AlertCircle } from 'lucide-react';

const GeospatialExport = ({ 
  changeDetections, 
  imageShape, 
  geoBounds,
  onExportComplete,
  className = ''
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [exportFormat, setExportFormat] = useState('geojson');
  const [mapProvider, setMapProvider] = useState('mapbox');
  const [exportProgress, setExportProgress] = useState(0);
  const [lastExportedFile, setLastExportedFile] = useState(null);
  const [showAdvanced, setShowAdvanced] = useState(false);
  const [customBounds, setCustomBounds] = useState({
    north: geoBounds?.north || 40.0,
    south: geoBounds?.south || 39.0,
    east: geoBounds?.east || -73.0,
    west: geoBounds?.west || -74.0
  });

  const handleExport = useCallback(async () => {
    if (!changeDetections || changeDetections.length === 0) {
      alert('No change detections available for export');
      return;
    }

    setIsExporting(true);
    setExportProgress(0);

    try {
      // Prepare change detections data
      const detectionData = JSON.stringify(changeDetections);
      const base64Data = btoa(detectionData);

      setExportProgress(25);

      // Prepare export request
      const exportRequest = {
        change_detections_base64: `data:application/json;base64,${base64Data}`,
        image_height: imageShape.height,
        image_width: imageShape.width,
        geo_bounds: showAdvanced ? customBounds : geoBounds,
        export_format: exportFormat
      };

      setExportProgress(50);

      // Call backend API for conversion
      const response = await fetch('/ml_backend/geospatial/export-change-detections', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(exportRequest),
      });

      if (!response.ok) {
        throw new Error(`Export failed: ${response.statusText}`);
      }

      const exportResult = await response.json();
      setExportProgress(75);

      // Trigger download
      const link = document.createElement('a');
      link.href = exportResult.data;
      link.download = exportResult.filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);

      setExportProgress(100);
      setLastExportedFile(exportResult);

      if (onExportComplete) {
        onExportComplete(exportResult);
      }

      // Show success message
      setTimeout(() => {
        setExportProgress(0);
      }, 2000);

    } catch (error) {
      console.error('Export error:', error);
      alert(`Export failed: ${error.message}`);
    } finally {
      setIsExporting(false);
    }
  }, [changeDetections, imageShape, geoBounds, exportFormat, customBounds, showAdvanced, onExportComplete]);

  const handleCreateMapConfiguration = useCallback(async () => {
    if (!lastExportedFile || exportFormat !== 'geojson') {
      alert('Please export GeoJSON data first to create map configuration');
      return;
    }

    try {
      const configRequest = {
        geojson_data: lastExportedFile.data,
        map_provider: mapProvider,
        map_style: mapProvider === 'mapbox' ? 'mapbox://styles/mapbox/satellite-v9' : null,
      };

      const response = await fetch('/ml_backend/geospatial/create-map-configuration', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(configRequest),
      });

      if (!response.ok) {
        throw new Error(`Configuration creation failed: ${response.statusText}`);
      }

      const config = await response.json();
      
      // Download configuration as JSON file
      const configBlob = new Blob([JSON.stringify(config, null, 2)], { type: 'application/json' });
      const configUrl = URL.createObjectURL(configBlob);
      
      const link = document.createElement('a');
      link.href = configUrl;
      link.download = `map-config-${mapProvider}.json`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      URL.revokeObjectURL(configUrl);
      
    } catch (error) {
      console.error('Map configuration error:', error);
      alert(`Failed to create map configuration: ${error.message}`);
    }
  }, [lastExportedFile, mapProvider, exportFormat]);

  const formatCount = changeDetections ? changeDetections.length : 0;
  const hasDetections = formatCount > 0;

  return (
    <div className={`bg-white rounded-lg shadow-lg p-6 ${className}`}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
            <Globe className="w-5 h-5" />
            Geospatial Export
          </h3>
          <p className="text-sm text-gray-600 mt-1">
            Export change detections as GeoJSON or KML for mapping applications
          </p>
        </div>
        
        {formatCount > 0 && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg px-3 py-2">
            <span className="text-sm font-medium text-blue-800">
              {formatCount} detection{formatCount !== 1 ? 's' : ''} available
            </span>
          </div>
        )}
      </div>

      {!hasDetections ? (
        <div className="text-center py-8">
          <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-3" />
          <p className="text-gray-600">No change detections available for export</p>
          <p className="text-sm text-gray-500 mt-1">
            Run change detection analysis first to generate exportable data
          </p>
        </div>
      ) : (
        <div className="space-y-6">
          {/* Export Format Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-3">
              Export Format
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  exportFormat === 'geojson'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setExportFormat('geojson')}
              >
                <div className="flex items-center gap-3">
                  <FileText className="w-5 h-5 text-blue-600" />
                  <div>
                    <div className="font-medium">GeoJSON</div>
                    <div className="text-xs text-gray-500">
                      For web mapping and JavaScript applications
                    </div>
                  </div>
                </div>
              </div>
              
              <div
                className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                  exportFormat === 'kml'
                    ? 'border-blue-500 bg-blue-50'
                    : 'border-gray-200 hover:border-gray-300'
                }`}
                onClick={() => setExportFormat('kml')}
              >
                <div className="flex items-center gap-3">
                  <Globe className="w-5 h-5 text-green-600" />
                  <div>
                    <div className="font-medium">KML</div>
                    <div className="text-xs text-gray-500">
                      For Google Earth and GIS applications
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Map Provider Selection (for configuration) */}
          {exportFormat === 'geojson' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-3">
                Map Provider (for configuration)
              </label>
              <div className="grid grid-cols-2 gap-3">
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    mapProvider === 'mapbox'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setMapProvider('mapbox')}
                >
                  <div className="flex items-center gap-3">
                    <Map className="w-5 h-5 text-blue-600" />
                    <div>
                      <div className="font-medium">Mapbox GL</div>
                      <div className="text-xs text-gray-500">Modern WebGL mapping</div>
                    </div>
                  </div>
                </div>
                
                <div
                  className={`border-2 rounded-lg p-4 cursor-pointer transition-colors ${
                    mapProvider === 'leaflet'
                      ? 'border-blue-500 bg-blue-50'
                      : 'border-gray-200 hover:border-gray-300'
                  }`}
                  onClick={() => setMapProvider('leaflet')}
                >
                  <div className="flex items-center gap-3">
                    <Map className="w-5 h-5 text-green-600" />
                    <div>
                      <div className="font-medium">Leaflet</div>
                      <div className="text-xs text-gray-500">Open source mapping</div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Advanced Settings */}
          <div>
            <button
              type="button"
              onClick={() => setShowAdvanced(!showAdvanced)}
              className="flex items-center gap-2 text-sm font-medium text-gray-700 hover:text-gray-900"
            >
              <Settings className="w-4 h-4" />
              Advanced Settings
              <span className="ml-auto text-xs">
                {showAdvanced ? '▲' : '▼'}
              </span>
            </button>
            
            {showAdvanced && (
              <div className="mt-4 p-4 bg-gray-50 rounded-lg space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Geographic Bounds (WGS84)
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">North</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={customBounds.north}
                        onChange={(e) => setCustomBounds(prev => ({ ...prev, north: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">South</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={customBounds.south}
                        onChange={(e) => setCustomBounds(prev => ({ ...prev, south: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">East</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={customBounds.east}
                        onChange={(e) => setCustomBounds(prev => ({ ...prev, east: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs text-gray-500 mb-1">West</label>
                      <input
                        type="number"
                        step="0.000001"
                        value={customBounds.west}
                        onChange={(e) => setCustomBounds(prev => ({ ...prev, west: parseFloat(e.target.value) }))}
                        className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm"
                      />
                    </div>
                  </div>
                </div>
              </div>
            )}
          </div>

          {/* Export Progress */}
          {isExporting && exportProgress > 0 && (
            <div className="space-y-2">
              <div className="flex justify-between text-sm">
                <span>Exporting...</span>
                <span>{exportProgress}%</span>
              </div>
              <div className="w-full bg-gray-200 rounded-full h-2">
                <div 
                  className="bg-blue-600 h-2 rounded-full transition-all duration-300"
                  style={{ width: `${exportProgress}%` }}
                ></div>
              </div>
            </div>
          )}

          {/* Export Actions */}
          <div className="flex gap-3">
            <button
              onClick={handleExport}
              disabled={isExporting || !hasDetections}
              className="flex-1 flex items-center justify-center gap-2 bg-blue-600 text-white px-4 py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors font-medium"
            >
              <Download className="w-4 h-4" />
              {isExporting ? 'Exporting...' : `Export ${exportFormat.toUpperCase()}`}
            </button>

            {lastExportedFile && exportFormat === 'geojson' && (
              <button
                onClick={handleCreateMapConfiguration}
                className="flex items-center gap-2 bg-green-600 text-white px-4 py-3 rounded-lg hover:bg-green-700 transition-colors font-medium"
              >
                <Map className="w-4 h-4" />
                Config
              </button>
            )}
          </div>

          {/* Last Export Info */}
          {lastExportedFile && (
            <div className="bg-green-50 border border-green-200 rounded-lg p-4">
              <div className="flex items-start gap-3">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                    <Download className="w-4 h-4 text-green-600" />
                  </div>
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-green-800">
                    Successfully exported: {lastExportedFile.filename}
                  </p>
                  <p className="text-xs text-green-600 mt-1">
                    Format: {lastExportedFile.export_format.toUpperCase()} • 
                    {formatCount} feature{formatCount !== 1 ? 's' : ''}
                  </p>
                </div>
              </div>
            </div>
          )}

          {/* Usage Instructions */}
          <div className="bg-gray-50 rounded-lg p-4">
            <h4 className="text-sm font-medium text-gray-900 mb-2">Usage Instructions</h4>
            <div className="text-xs text-gray-600 space-y-1">
              {exportFormat === 'geojson' ? (
                <>
                  <p>• Load GeoJSON files in web mapping libraries (Mapbox, Leaflet, OpenLayers)</p>
                  <p>• Use with JavaScript applications for interactive visualizations</p>
                  <p>• Import into QGIS, ArcGIS, or other GIS software</p>
                  <p>• Generate map configuration files for easy integration</p>
                </>
              ) : (
                <>
                  <p>• Open KML files directly in Google Earth</p>
                  <p>• Import into GIS applications like QGIS or ArcGIS</p>
                  <p>• Share with Google My Maps or other KML-compatible platforms</p>
                  <p>• Includes styled polygons and detailed metadata</p>
                </>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default GeospatialExport;