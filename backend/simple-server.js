// Minimal Working Backend for Geo Shift Spy
import express from 'express';
import cors from 'cors';
import multer from 'multer';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Enable CORS for all origins (development only)
app.use(cors({
  origin: true,
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Simple file upload handling
const storage = multer.memoryStorage();
const upload = multer({ 
  storage: storage,
  limits: { fileSize: 10 * 1024 * 1024 } // 10MB
});

// Health check
app.get('/', (req, res) => {
  res.json({ 
    success: true,
    message: 'Geo Shift Spy Backend - Minimal Version',
    status: 'healthy',
    version: '1.0.0-minimal',
    timestamp: new Date().toISOString(),
    endpoints: {
      'GET /': 'Health check',
      'POST /compare': 'Simple image comparison',
      'GET /test': 'Test endpoint'
    }
  });
});

// Test endpoint
app.get('/test', (req, res) => {
  res.json({
    success: true,
    message: 'Test endpoint working!',
    timestamp: new Date().toISOString()
  });
});

// Simple comparison endpoint
app.post('/compare', upload.fields([
  { name: 'before_image', maxCount: 1 },
  { name: 'after_image', maxCount: 1 }
]), async (req, res) => {
  try {
    console.log('📁 Files received:', req.files ? Object.keys(req.files) : 'No files');
    console.log('📝 Body:', req.body);

    // Check if files were uploaded
    if (!req.files || !req.files.before_image || !req.files.after_image) {
      return res.status(400).json({
        success: false,
        error: 'Missing images',
        message: 'Please upload both before and after images',
        received: req.files ? Object.keys(req.files) : []
      });
    }

    const beforeImage = req.files.before_image[0];
    const afterImage = req.files.after_image[0];

    console.log('🖼️  Before image:', beforeImage.originalname, `(${beforeImage.size} bytes)`);
    console.log('🖼️  After image:', afterImage.originalname, `(${afterImage.size} bytes)`);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 1000));

    // Generate mock analysis results
    const mockChangePercentage = Math.random() * 25 + 5; // 5-30% change
    const mockAnalysis = {
      summary: `Detected ${mockChangePercentage.toFixed(1)}% change between the satellite images`,
      changeType: mockChangePercentage > 20 ? 'Major Change' : mockChangePercentage > 15 ? 'Moderate Change' : 'Minor Change',
      riskScore: Math.min(10, Math.ceil(mockChangePercentage / 3)),
      confidence: 0.85,
      details: `Analysis shows ${mockChangePercentage > 15 ? 'significant' : 'moderate'} changes in land use patterns.`,
      specificObservations: [
        'Vegetation density changes detected',
        'Land cover pattern modifications observed',
        'Possible infrastructure development'
      ]
    };

    // Generate simple mock heatmap (red square pattern)
    const mockHeatmap = generateMockHeatmap();

    const response = {
      success: true,
      change_percentage: parseFloat(mockChangePercentage.toFixed(2)),
      heatmap_url: `data:image/png;base64,${mockHeatmap}`,
      ai_analysis: mockAnalysis,
      message: `Analysis complete: ${mockChangePercentage.toFixed(1)}% change detected`,
      metadata: {
        before_image: beforeImage.originalname,
        after_image: afterImage.originalname,
        processed_at: new Date().toISOString(),
        change_type: mockAnalysis.changeType,
        risk_score: mockAnalysis.riskScore,
        processing_time: '1.0s',
        backend_version: 'minimal-1.0.0'
      },
      // Mock environmental report
      environmental_report: {
        executiveSummary: `Environmental analysis reveals ${mockChangePercentage.toFixed(1)}% land use change. The observed modifications suggest ${mockAnalysis.changeType.toLowerCase()} in the monitored area.`,
        analysis: {
          severity: mockChangePercentage > 20 ? 'HIGH' : mockChangePercentage > 15 ? 'MEDIUM' : 'LOW',
          urgencyLevel: mockChangePercentage > 20 ? 'HIGH' : 'MEDIUM',
          environmentalImpact: mockChangePercentage > 15 ? 'Significant environmental changes detected' : 'Moderate environmental changes observed'
        },
        recommendations: [
          'Continue monitoring the area for further changes',
          'Consider ground-truth verification of detected changes',
          'Implement conservation measures if needed'
        ]
      }
    };

    console.log(`✅ Analysis complete: ${mockChangePercentage.toFixed(2)}% change`);
    res.json(response);

  } catch (error) {
    console.error('❌ Error in comparison:', error);
    res.status(500).json({
      success: false,
      error: 'Processing failed',
      message: error.message,
      timestamp: new Date().toISOString()
    });
  }
});

// Generate a simple mock heatmap (small PNG)
function generateMockHeatmap() {
  // This is a 10x10 red square PNG encoded in base64
  // In a real implementation, this would be generated from actual image analysis
  return 'iVBORw0KGgoAAAANSUhEUgAAAAoAAAAKCAYAAACNMs+9AAAABHNCSVQICAgIfAhkiAAAAAlwSFlzAAAAdgAAAHYBTnsmCAAAABl0RVh0U29mdHdhcmUAd3d3Lmlua3NjYXBlLm9yZ5vuPBoAAAFYSURBVBiVY/z//z8DAwMDg/8/DPx3/9/7fwf/rf+3/F/xf/H/6f8n/5/4f/T/of8H/u/6v/3/lv+b/m/8v/7/uv9r/q/+v+r/yv/L/y/7v/T/kv+L/y/6v/D/gv8L/s//P/f/3P9z/s/5P/v/7P+z/s/6P+v/rP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP8z/s/4P+P/jP';
}

// Error handling
app.use((error, req, res, next) => {
  console.error('❌ Server Error:', error);
  res.status(500).json({
    success: false,
    error: 'Internal server error',
    message: error.message,
    timestamp: new Date().toISOString()
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    success: false,
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} is not available`,
    available_endpoints: {
      'GET /': 'Health check',
      'GET /test': 'Test endpoint',
      'POST /compare': 'Image comparison'
    }
  });
});

// Start server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Minimal Geo Shift Spy Backend`);
  console.log(`📡 Server: http://localhost:${PORT}`);
  console.log(`✅ CORS: Enabled for all origins`);
  console.log(`📁 Upload: In-memory (10MB limit)`);
  console.log(`🔍 Ready for connections!`);
  console.log('');
  console.log('Available endpoints:');
  console.log('  GET  / - Health check');
  console.log('  GET  /test - Test endpoint');
  console.log('  POST /compare - Image comparison');
});

export default app;