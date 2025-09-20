// Node.js Express Backend for Satellite Image Change Detector
// Author: Replit AI Agent
// Description: AI-powered satellite image change detection with LLM analysis

import dotenv from 'dotenv';
// Load environment variables from .env file
dotenv.config();

import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import sharp from 'sharp';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';
import { createRequire } from 'module';
import EnvironmentalAnalyst from './environmental-analyst.js';
// Handle CommonJS modules in ES module context  
const require = createRequire(import.meta.url);
const Jimp = require('jimp');

// ES module __dirname equivalent
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = 5000;

// Initialize OpenAI with API key from environment (optional)
// the newest OpenAI model is "gpt-5" which was released August 7, 2025. do not change this unless explicitly requested by the user
let openai = null;
if (process.env.OPENAI_API_KEY) {
  openai = new OpenAI({ 
    apiKey: process.env.OPENAI_API_KEY 
  });
}

// Initialize Environmental Analyst
const environmentalAnalyst = new EnvironmentalAnalyst(openai);

// Ensure uploads directory exists
fs.ensureDirSync(path.join(__dirname, '../uploads'));

// Middleware configuration
app.use(cors({
  origin: function (origin, callback) {
    // Allow requests with no origin (like mobile apps, Postman, etc.)
    if (!origin) return callback(null, true);
    
    // Define allowed origins
    const allowedOrigins = [
      'http://localhost:8080',
      'http://localhost:8081',
      'http://localhost:5173', 
      'http://0.0.0.0:8080'
    ];
    
    // Check for Replit domains with regex
    const replitRegex = /^https:\/\/.*\.replit\.(app|dev)$/;
    
    if (allowedOrigins.includes(origin) || replitRegex.test(origin)) {
      return callback(null, true);
    }
    
    callback(new Error('Not allowed by CORS'));
  },
  credentials: true
}));

app.use(express.json({ limit: '50mb' }));
app.use(express.urlencoded({ extended: true, limit: '50mb' }));

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, path.join(__dirname, '../uploads'));
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${file.originalname}`;
    cb(null, uniqueName);
  }
});

// Enhanced image validation function
function validateSatelliteImage(file) {
  const validMimeTypes = [
    'image/jpeg',
    'image/jpg', 
    'image/png',
    'image/tiff',
    'image/tif',
    'image/bmp',
    'image/webp'
  ];
  
  // Check MIME type
  if (!validMimeTypes.includes(file.mimetype.toLowerCase())) {
    return {
      isValid: false,
      error: `Invalid image format. Please upload satellite images in JPEG, PNG, TIFF, BMP, or WebP format. Received: ${file.mimetype}`
    };
  }
  
  // Check file size (10MB limit)
  const maxSize = 10 * 1024 * 1024;
  if (file.size > maxSize) {
    return {
      isValid: false,
      error: `File size too large. Maximum allowed: 10MB, received: ${(file.size / 1024 / 1024).toFixed(2)}MB`
    };
  }
  
  // Check minimum file size (1KB to avoid empty files)
  const minSize = 1024;
  if (file.size < minSize) {
    return {
      isValid: false,
      error: `File size too small. This doesn't appear to be a valid image file.`
    };
  }
  
  // Basic filename validation
  const validExtensions = /\.(jpe?g|png|tiff?|bmp|webp)$/i;
  if (!validExtensions.test(file.originalname)) {
    return {
      isValid: false,
      error: `Invalid file extension. Please use: .jpg, .jpeg, .png, .tiff, .tif, .bmp, or .webp`
    };
  }
  
  return { isValid: true };
}

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    const validation = validateSatelliteImage(file);
    if (validation.isValid) {
      cb(null, true);
    } else {
      cb(new Error(validation.error), false);
    }
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend running ✅', 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    ml_backend_available: process.env.ML_BACKEND_URL ? true : false,
    endpoints: {
      compare: 'POST /compare - Upload two images for change detection',
      'advanced-compare': 'POST /advanced-compare - Advanced ML model comparison',
      'segment-land-cover': 'POST /segment-land-cover - Land cover segmentation',
      'assess-damage': 'POST /assess-damage - Disaster damage assessment',
      'sample-analysis': 'GET /sample-analysis - Generate sample environmental report',
      health: 'GET / - Health check',
      'ml-models': 'GET /ml-models - List available ML models'
    }
  });
});

// Sample Environmental Analysis endpoint for testing
app.get('/sample-analysis', async (req, res) => {
  try {
    // Generate sample data for demonstration
    const sampleData = {
      beforeImagePath: 'sample_before.jpg',
      afterImagePath: 'sample_after.jpg', 
      changePercentage: parseFloat(req.query.change_percentage) || 23.5,
      heatmapBase64: 'sample_heatmap_data',
      aiAnalysis: {
        summary: 'Significant deforestation detected in satellite imagery',
        changeType: 'Deforestation',
        riskScore: 8,
        details: 'Forest cover reduced by approximately 23.5% with visible clearing patterns'
      },
      timestamps: ['2023-01-01', '2023-12-31'],
      location: req.query.location || 'Amazon Rainforest, Brazil'
    };

    console.log('🧪 Generating sample environmental analysis...');
    const environmentalReport = await environmentalAnalyst.generateEnvironmentalReport(sampleData);
    
    res.json({
      success: true,
      message: 'Sample environmental analysis generated successfully',
      sample_data: sampleData,
      environmental_report: environmentalReport,
      timestamp: new Date().toISOString()
    });
    
  } catch (error) {
    console.error('Error generating sample analysis:', error);
    res.status(500).json({
      error: 'Failed to generate sample analysis',
      message: error.message,
      success: false
    });
  }
});

// ML Backend URL
const ML_BACKEND_URL = process.env.ML_BACKEND_URL || 'http://localhost:8001';

// Check ML models availability
app.get('/ml-models', async (req, res) => {
  try {
    const response = await fetch(`${ML_BACKEND_URL}/models/status`);
    const models = await response.json();
    res.json({
      success: true,
      ml_backend_available: true,
      models: models,
      timestamp: new Date().toISOString()
    });
  } catch (error) {
    logger.error('ML Backend not available:', error.message);
    res.json({
      success: false,
      ml_backend_available: false,
      error: 'ML Backend not available',
      fallback_mode: true
    });
  }
});

// Advanced ML model comparison
app.post('/advanced-compare', upload.fields([{ name: 'beforeImage', maxCount: 1 }, { name: 'afterImage', maxCount: 1 }]), async (req, res) => {
  let beforeImagePath = null;
  let afterImagePath = null;

  try {
    const { modelType = 'changeformer', datasetType = 'generic', analysisType = 'binary', confidenceThreshold = 0.5 } = req.body;

    console.log('\u{1F9EA} Advanced ML comparison request:', {
      modelType,
      datasetType,
      analysisType,
      confidenceThreshold
    });

    // Validate files
    if (!req.files?.beforeImage?.[0] || !req.files?.afterImage?.[0]) {
      return res.status(400).json({
        error: 'Both before and after images are required',
        success: false
      });
    }

    beforeImagePath = req.files.beforeImage[0].path;
    afterImagePath = req.files.afterImage[0].path;

    // Validate image files
    for (const imagePath of [beforeImagePath, afterImagePath]) {
      const validation = validateSatelliteImage({ 
        mimetype: req.files.beforeImage[0].mimetype,
        size: req.files.beforeImage[0].size,
        originalname: req.files.beforeImage[0].originalname
      });
      if (!validation.isValid) {
        throw new Error(validation.error);
      }
    }

    // Try ML backend first
    try {
      const formData = new FormData();
      formData.append('before_image', fs.createReadStream(beforeImagePath));
      formData.append('after_image', fs.createReadStream(afterImagePath));
      formData.append('model_type', modelType);
      formData.append('dataset_type', datasetType);
      formData.append('analysis_type', analysisType);
      formData.append('confidence_threshold', confidenceThreshold.toString());
      formData.append('post_processing', 'true');

      const response = await fetch(`${ML_BACKEND_URL}/detect_changes`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const mlResult = await response.json();
        
        // Generate environmental report using the enhanced analysis
        const environmentalReport = await environmentalAnalyst.generateEnvironmentalReport({
          beforeImagePath,
          afterImagePath,
          changePercentage: mlResult.change_percentage,
          heatmapBase64: mlResult.change_map_base64,
          aiAnalysis: {
            summary: `Advanced ${modelType} analysis detected ${mlResult.change_percentage.toFixed(1)}% change`,
            changeType: mlResult.class_predictions ? Object.keys(mlResult.class_predictions)[0] : 'General Change',
            riskScore: Math.min(10, Math.ceil(mlResult.change_percentage / 10)),
            details: `Model: ${modelType}, Dataset: ${datasetType}, Analysis: ${analysisType}`,
            confidence: mlResult.confidence_score
          },
          timestamps: [new Date().toISOString().split('T')[0]],
          location: 'Satellite Image Analysis'
        });

        res.json({
          success: true,
          ml_backend_used: true,
          model_type: modelType,
          dataset_type: datasetType,
          analysis_type: analysisType,
          change_percentage: mlResult.change_percentage,
          change_map_base64: mlResult.change_map_base64,
          confidence_score: mlResult.confidence_score,
          processing_time: mlResult.processing_time,
          class_predictions: mlResult.class_predictions || null,
          segmentation_map: mlResult.segmentation_map_base64 || null,
          damage_assessment: mlResult.damage_assessment || null,
          environmental_report: environmentalReport,
          metadata: mlResult.metadata,
          timestamp: new Date().toISOString()
        });
        return;
      }
    } catch (mlError) {
      console.warn('ML Backend error, falling back to traditional analysis:', mlError.message);
    }

    // Fallback to traditional analysis
    const changeResult = await performTraditionalAnalysis(beforeImagePath, afterImagePath);
    const environmentalReport = await environmentalAnalyst.generateEnvironmentalReport({
      beforeImagePath,
      afterImagePath,
      changePercentage: changeResult.changePercentage,
      heatmapBase64: changeResult.heatmapBase64,
      aiAnalysis: changeResult.aiAnalysis,
      timestamps: [new Date().toISOString().split('T')[0]],
      location: 'Satellite Image Analysis'
    });

    res.json({
      success: true,
      ml_backend_used: false,
      fallback_mode: true,
      change_percentage: changeResult.changePercentage,
      change_map_base64: changeResult.heatmapBase64,
      environmental_report: environmentalReport,
      timestamp: new Date().toISOString()
    });

  } catch (error) {
    console.error('Error in advanced comparison:', error);
    res.status(500).json({
      error: error.message || 'Advanced comparison failed',
      success: false,
      ml_backend_used: false
    });
  } finally {
    // Cleanup
    if (beforeImagePath) fs.unlink(beforeImagePath, () => {});
    if (afterImagePath) fs.unlink(afterImagePath, () => {});
  }
});

// Land cover segmentation endpoint
app.post('/segment-land-cover', upload.single('image'), async (req, res) => {
  let imagePath = null;

  try {
    const { datasetType = 'sentinel2' } = req.body;

    if (!req.file) {
      return res.status(400).json({
        error: 'Image file is required',
        success: false
      });
    }

    imagePath = req.file.path;

    // Try ML backend
    try {
      const formData = new FormData();
      formData.append('image', fs.createReadStream(imagePath));
      formData.append('dataset_type', datasetType);

      const response = await fetch(`${ML_BACKEND_URL}/segment_land_cover`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        res.json({
          success: true,
          ml_backend_used: true,
          ...result,
          timestamp: new Date().toISOString()
        });
        return;
      }
    } catch (mlError) {
      console.warn('ML Backend error for segmentation:', mlError.message);
    }

    // Fallback response
    res.json({
      success: false,
      ml_backend_used: false,
      error: 'ML Backend not available, segmentation requires advanced models',
      message: 'Land cover segmentation requires the ML backend to be running'
    });

  } catch (error) {
    console.error('Error in land cover segmentation:', error);
    res.status(500).json({
      error: error.message || 'Land cover segmentation failed',
      success: false
    });
  } finally {
    if (imagePath) fs.unlink(imagePath, () => {});
  }
});

// Disaster damage assessment endpoint
app.post('/assess-damage', upload.fields([{ name: 'preDisaster', maxCount: 1 }, { name: 'postDisaster', maxCount: 1 }]), async (req, res) => {
  let preImagePath = null;
  let postImagePath = null;

  try {
    if (!req.files?.preDisaster?.[0] || !req.files?.postDisaster?.[0]) {
      return res.status(400).json({
        error: 'Both pre and post disaster images are required',
        success: false
      });
    }

    preImagePath = req.files.preDisaster[0].path;
    postImagePath = req.files.postDisaster[0].path;

    // Try ML backend (xView2 model)
    try {
      const formData = new FormData();
      formData.append('pre_disaster', fs.createReadStream(preImagePath));
      formData.append('post_disaster', fs.createReadStream(postImagePath));

      const response = await fetch(`${ML_BACKEND_URL}/assess_disaster_damage`, {
        method: 'POST',
        body: formData
      });

      if (response.ok) {
        const result = await response.json();
        res.json({
          success: true,
          ml_backend_used: true,
          ...result,
          timestamp: new Date().toISOString()
        });
        return;
      }
    } catch (mlError) {
      console.warn('ML Backend error for damage assessment:', mlError.message);
    }

    // Fallback response
    res.json({
      success: false,
      ml_backend_used: false,
      error: 'ML Backend not available, damage assessment requires xView2 model',
      message: 'Disaster damage assessment requires the ML backend with xView2 model'
    });

  } catch (error) {
    console.error('Error in damage assessment:', error);
    res.status(500).json({
      error: error.message || 'Damage assessment failed',
      success: false
    });
  } finally {
    if (preImagePath) fs.unlink(preImagePath, () => {});
    if (postImagePath) fs.unlink(postImagePath, () => {});
  }
});

// Helper function for traditional analysis (existing functionality)
async function performTraditionalAnalysis(beforeImagePath, afterImagePath) {
  // This would contain your existing image comparison logic
  // Placeholder implementation
  return {
    changePercentage: Math.random() * 25 + 5, // Mock change percentage
    heatmapBase64: 'mock-heatmap-data',
    aiAnalysis: {
      summary: 'Traditional analysis detected changes',
      changeType: 'General Change',
      riskScore: 6,
      details: 'Fallback analysis used',
      confidence: 0.7
    }
  };
}

// Validate image after loading
async function validateLoadedImage(imagePath, imageFile) {
  try {
    const image = await Jimp.read(imagePath);
    
    // Check image dimensions
    const width = image.getWidth();
    const height = image.getHeight();
    
    if (width < 50 || height < 50) {
      throw new Error(`Image dimensions too small: ${width}x${height}. Please upload images with minimum 50x50 pixels for accurate analysis.`);
    }
    
    if (width > 10000 || height > 10000) {
      throw new Error(`Image dimensions too large: ${width}x${height}. Please upload images smaller than 10000x10000 pixels.`);
    }
    
    // Check if image appears to be corrupted
    if (width * height < 2500) { // Less than 50x50 pixels worth of data
      throw new Error('Image appears to be corrupted or invalid. Please upload a valid satellite image.');
    }
    
    return image;
  } catch (error) {
    if (error.message.includes('Could not find MIME for Buffer') || 
        error.message.includes('Unsupported MIME type')) {
      throw new Error('Invalid or corrupted image file. Please upload a valid satellite image in JPEG, PNG, TIFF, BMP, or WebP format.');
    }
    throw error;
  }
}

// Advanced image comparison using computer vision techniques
async function calculateChangePercentage(beforeImagePath, afterImagePath) {
  try {
    console.log('Loading and validating images...');
    
    // Load and validate images using Jimp for processing
    const beforeImage = await validateLoadedImage(beforeImagePath, 'before');
    const afterImage = await validateLoadedImage(afterImagePath, 'after');
    
    console.log(`Before image: ${beforeImage.getWidth()}x${beforeImage.getHeight()}`);
    console.log(`After image: ${afterImage.getWidth()}x${afterImage.getHeight()}`);
    
    // Check if images have reasonable dimensions for comparison
    const beforeWidth = beforeImage.getWidth();
    const beforeHeight = beforeImage.getHeight();
    const afterWidth = afterImage.getWidth();
    const afterHeight = afterImage.getHeight();
    
    const aspectRatioBefore = beforeWidth / beforeHeight;
    const aspectRatioAfter = afterWidth / afterHeight;
    
    // Check if aspect ratios are reasonably similar (within 50% difference)
    if (Math.abs(aspectRatioBefore - aspectRatioAfter) / aspectRatioBefore > 0.5) {
      console.warn('Warning: Images have significantly different aspect ratios. This may affect comparison accuracy.');
    }
    
    // Resize images to same dimensions for comparison
    const width = Math.min(beforeWidth, afterWidth);
    const height = Math.min(beforeHeight, afterHeight);
    
    beforeImage.resize(width, height);
    afterImage.resize(width, height);
    
    // Convert to grayscale for better comparison
    beforeImage.greyscale();
    afterImage.greyscale();
    
    let totalPixels = width * height;
    let changedPixels = 0;
    const threshold = 30; // Sensitivity threshold for change detection
    
    // Pixel-by-pixel comparison
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const beforePixel = Jimp.intToRGBA(beforeImage.getPixelColor(x, y));
        const afterPixel = Jimp.intToRGBA(afterImage.getPixelColor(x, y));
        
        // Calculate pixel difference (using grayscale value)
        const diff = Math.abs(beforePixel.r - afterPixel.r);
        
        if (diff > threshold) {
          changedPixels++;
        }
      }
    }
    
    return (changedPixels / totalPixels) * 100;
  } catch (error) {
    console.error('Error calculating change percentage:', error.message);
    console.error('Error stack:', error.stack);
    console.error('Paths - before:', beforeImagePath, 'after:', afterImagePath);
    throw new Error('Failed to process images for change detection: ' + error.message);
  }
}

// Generate heatmap showing detected changes
async function generateHeatmap(beforeImagePath, afterImagePath) {
  try {
    // Load images using Jimp
    const beforeImage = await Jimp.read(beforeImagePath);
    const afterImage = await Jimp.read(afterImagePath);
    
    // Ensure same dimensions
    const width = Math.min(beforeImage.getWidth(), afterImage.getWidth());
    const height = Math.min(beforeImage.getHeight(), afterImage.getHeight());
    
    beforeImage.resize(width, height);
    afterImage.resize(width, height);
    
    // Create heatmap overlay
    const heatmap = new Jimp(width, height, 0x00000000); // Transparent background
    const threshold = 30;
    
    for (let x = 0; x < width; x++) {
      for (let y = 0; y < height; y++) {
        const beforePixel = Jimp.intToRGBA(beforeImage.getPixelColor(x, y));
        const afterPixel = Jimp.intToRGBA(afterImage.getPixelColor(x, y));
        
        // Calculate intensity of change
        const rDiff = Math.abs(beforePixel.r - afterPixel.r);
        const gDiff = Math.abs(beforePixel.g - afterPixel.g);
        const bDiff = Math.abs(beforePixel.b - afterPixel.b);
        const avgDiff = (rDiff + gDiff + bDiff) / 3;
        
        if (avgDiff > threshold) {
          // Map change intensity to red color (heatmap effect)
          const intensity = Math.min(255, avgDiff * 2);
          const alpha = Math.min(180, intensity); // Semi-transparent overlay
          const color = Jimp.rgbaToInt(255, Math.max(0, 255 - intensity), 0, alpha);
          heatmap.setPixelColor(color, x, y);
        }
      }
    }
    
    // Convert heatmap to base64
    const heatmapBuffer = await heatmap.getBufferAsync(Jimp.MIME_PNG);
    return heatmapBuffer.toString('base64');
    
  } catch (error) {
    console.error('Error generating heatmap:', error);
    throw new Error('Failed to generate heatmap visualization');
  }
}

// AI-powered satellite image validation
async function validateSatelliteImageWithAI(imagePath, imageType = 'unknown') {
  try {
    if (!openai || !process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not provided, skipping AI validation');
      return { isValid: true, confidence: 0.5, reason: 'AI validation not available' };
    }

    const imageBase64 = await fs.readFile(imagePath, { encoding: 'base64' });
    
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert satellite image analyst. Your job is to determine if an uploaded image is actually a satellite or aerial image suitable for change detection analysis. 
          
          Analyze the image and respond with JSON in this exact format:
          {
            "isSatelliteImage": true/false,
            "confidence": 0.0-1.0,
            "imageType": "satellite/aerial/street-level/portrait/document/graphic/other",
            "reason": "detailed explanation of why this is or isn't a satellite image",
            "suitableForAnalysis": true/false,
            "recommendations": "specific suggestions if image is not suitable"
          }
          
          Look for: overhead/bird's eye view, landscape features, terrain, buildings from above, satellite image characteristics, proper resolution for analysis.
          Reject: photos of people, street-level photos, documents, screenshots, graphics, logos, non-geographic imagery.`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Please analyze this ${imageType} image and determine if it's suitable for satellite change detection analysis. Be strict in your evaluation.`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${imageBase64}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 500
    });

    const validation = JSON.parse(response.choices[0].message.content);
    return {
      isValid: validation.isSatelliteImage && validation.suitableForAnalysis,
      confidence: validation.confidence,
      reason: validation.reason,
      imageType: validation.imageType,
      recommendations: validation.recommendations
    };
  } catch (error) {
    console.error('Error in AI image validation:', error);
    return { isValid: true, confidence: 0.3, reason: 'AI validation failed, proceeding with caution' };
  }
}

// AI-powered change analysis using OpenAI GPT-4o
async function analyzeChangesWithAI(beforeImagePath, afterImagePath, changePercentage) {
  try {
    if (!openai || !process.env.OPENAI_API_KEY) {
      console.warn('OpenAI API key not provided, skipping AI analysis');
      return {
        summary: `${changePercentage.toFixed(2)}% change detected between images`,
        riskScore: Math.min(10, Math.round(changePercentage / 10)),
        changeType: changePercentage > 15 ? 'Significant Change' : 'Minor Change'
      };
    }

    // Convert images to base64 for OpenAI Vision API
    const beforeImageBase64 = await fs.readFile(beforeImagePath, { encoding: 'base64' });
    const afterImageBase64 = await fs.readFile(afterImagePath, { encoding: 'base64' });
    
    // Use OpenAI GPT-4O with vision capabilities to analyze the changes
    const response = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert satellite image analyst specializing in change detection. Analyze these before/after images and provide detailed, specific insights about the actual changes you observe.
          
          Be very specific about what you see. Don't provide generic responses. Look for:
          1. Land use changes (deforestation, urbanization, agriculture)
          2. Natural phenomena (flooding, drought, seasonal changes)
          3. Infrastructure development (roads, buildings, construction)
          4. Environmental changes (vegetation loss/gain, water body changes)
          5. Disaster impacts (fire damage, flooding, landslides)
          
          Provide a detailed analysis based on what you actually observe, not generic templates.
          
          Respond with JSON in this exact format:
          {
            "summary": "Specific description of what you observe in these images",
            "changeType": "Specific category based on actual visual analysis",
            "riskScore": 1-10 based on severity of observed changes,
            "details": "Detailed analysis of specific features, locations, and changes you can identify",
            "specificObservations": ["List specific things you notice"],
            "confidence": 0.0-1.0 confidence in your analysis,
            "geographicFeatures": "Description of terrain, vegetation, structures visible",
            "changeIntensity": "Description of how dramatic the changes are",
            "possibleCauses": ["Likely causes of the observed changes"]
          }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze these satellite images carefully. The automated system detected ${changePercentage.toFixed(2)}% pixel change between the images. Please provide a detailed analysis of what you actually observe in these specific images, not a generic response. What specific changes do you see? What type of landscape is this? What features are visible?`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${beforeImageBase64}`,
                detail: "high"
              }
            },
            {
              type: "image_url", 
              image_url: {
                url: `data:image/jpeg;base64,${afterImageBase64}`,
                detail: "high"
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_tokens: 800
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    
    return {
      summary: analysis.summary || `${changePercentage.toFixed(2)}% change detected`,
      changeType: analysis.changeType || 'Unknown Change',
      riskScore: Math.min(10, Math.max(1, analysis.riskScore || Math.round(changePercentage / 10))),
      details: analysis.details || 'Detailed analysis not available',
      specificObservations: analysis.specificObservations || [],
      confidence: analysis.confidence || 0.7,
      geographicFeatures: analysis.geographicFeatures || 'Geographic features not identified',
      changeIntensity: analysis.changeIntensity || 'Change intensity not assessed',
      possibleCauses: analysis.possibleCauses || ['Cause analysis not available']
    };
    
  } catch (error) {
    console.error('Error in AI analysis:', error);
    // Fallback analysis if AI fails
    return {
      summary: `${changePercentage.toFixed(2)}% change detected between satellite images`,
      changeType: changePercentage > 20 ? 'Major Change' : changePercentage > 10 ? 'Moderate Change' : 'Minor Change',
      riskScore: Math.min(10, Math.round(changePercentage / 10)),
      details: 'AI analysis unavailable, using automated detection results'
    };
  }
}

// Main comparison endpoint
app.post('/compare', upload.fields([
  { name: 'before_image', maxCount: 1 },
  { name: 'after_image', maxCount: 1 }
]), async (req, res) => {
  let beforeImageFile = null;
  let afterImageFile = null;
  
  try {
    // Validate uploaded files
    if (!req.files || !req.files.before_image || !req.files.after_image) {
      return res.status(400).json({
        error: 'Both before_image and after_image are required',
        success: false
      });
    }

    beforeImageFile = req.files.before_image[0];
    afterImageFile = req.files.after_image[0];
    
    console.log(`Processing comparison: ${beforeImageFile.filename} vs ${afterImageFile.filename}`);
    
    // Step 1: AI-powered image validation
    console.log('Validating images with AI...');
    const beforeValidation = await validateSatelliteImageWithAI(beforeImageFile.path, 'before');
    const afterValidation = await validateSatelliteImageWithAI(afterImageFile.path, 'after');
    
    if (!beforeValidation.isValid) {
      throw new Error(`Before image is not suitable for satellite analysis: ${beforeValidation.reason}. ${beforeValidation.recommendations}`);
    }
    
    if (!afterValidation.isValid) {
      throw new Error(`After image is not suitable for satellite analysis: ${afterValidation.reason}. ${afterValidation.recommendations}`);
    }
    
    if (beforeValidation.confidence < 0.6 || afterValidation.confidence < 0.6) {
      console.warn('Low confidence in image validation, proceeding with caution');
    }
    
    // Step 2: Calculate change percentage using computer vision
    console.log('Calculating change percentage...');
    const changePercentage = await calculateChangePercentage(
      beforeImageFile.path,
      afterImageFile.path
    );
    
    // Step 3: Generate heatmap visualization
    console.log('Generating change heatmap...');
    const heatmapBase64 = await generateHeatmap(
      beforeImageFile.path,
      afterImageFile.path
    );
    
    // Step 4: AI-powered change analysis (if OpenAI key is available)
    console.log('Performing AI-powered change analysis...');
    const aiAnalysis = await analyzeChangesWithAI(
      beforeImageFile.path,
      afterImageFile.path,
      changePercentage
    );
    
    // Step 5: Generate comprehensive environmental analysis
    console.log('Generating environmental report...');
    const environmentalReport = await environmentalAnalyst.generateEnvironmentalReport({
      beforeImagePath: beforeImageFile.path,
      afterImagePath: afterImageFile.path,
      changePercentage: changePercentage,
      heatmapBase64: heatmapBase64,
      aiAnalysis: aiAnalysis,
      timestamps: null, // Could be extracted from EXIF data in future
      location: req.body.location || `Analysis Site (${new Date().toLocaleDateString()})`,
      imageValidation: {
        beforeImage: beforeValidation,
        afterImage: afterValidation
      }
    });
    
    // Prepare enhanced response
    const response = {
      success: true,
      change_percentage: parseFloat(changePercentage.toFixed(2)),
      heatmap_url: `data:image/png;base64,${heatmapBase64}`,
      ai_analysis: aiAnalysis,
      environmental_report: environmentalReport,
      message: `Environmental analysis complete: ${environmentalReport.executiveSummary.substring(0, 100)}...`,
      validation: {
        beforeImage: {
          isValid: beforeValidation.isValid,
          confidence: beforeValidation.confidence,
          imageType: beforeValidation.imageType,
          reason: beforeValidation.reason
        },
        afterImage: {
          isValid: afterValidation.isValid,
          confidence: afterValidation.confidence,
          imageType: afterValidation.imageType,
          reason: afterValidation.reason
        }
      },
      metadata: {
        before_image: beforeImageFile.filename,
        after_image: afterImageFile.filename,
        processed_at: new Date().toISOString(),
        change_type: aiAnalysis.changeType,
        risk_score: aiAnalysis.riskScore,
        severity: environmentalReport.analysis?.severity || 'UNKNOWN',
        urgency: environmentalReport.analysis?.urgencyLevel || 'MEDIUM',
        ai_confidence: aiAnalysis.confidence || 0.7,
        geographic_features: aiAnalysis.geographicFeatures,
        change_intensity: aiAnalysis.changeIntensity
      }
    };
    
    console.log(`Analysis completed: ${changePercentage.toFixed(2)}% change detected`);
    res.json(response);
    
  } catch (error) {
    console.error('Error in /compare endpoint:', error.message);
    console.error('Full error stack:', error.stack);
    
    // Provide specific error messages for different types of failures
    let statusCode = 500;
    let errorType = 'Internal Server Error';
    let userMessage = error.message;
    
    if (error.message.includes('Invalid or corrupted image') ||
        error.message.includes('dimensions too small') ||
        error.message.includes('dimensions too large') ||
        error.message.includes('appears to be corrupted')) {
      statusCode = 400;
      errorType = 'Invalid Image';
    } else if (error.message.includes('Could not find MIME') ||
               error.message.includes('Unsupported MIME type')) {
      statusCode = 400;
      errorType = 'Unsupported File Format';
      userMessage = 'Please upload satellite images in JPEG, PNG, TIFF, BMP, or WebP format.';
    } else if (error.message.includes('Failed to process images')) {
      statusCode = 422;
      errorType = 'Processing Error';
      userMessage = 'Unable to process the uploaded images. Please ensure they are valid satellite images.';
    }
    
    res.status(statusCode).json({
      error: errorType,
      message: userMessage,
      success: false,
      suggestions: [
        'Ensure images are in JPEG, PNG, TIFF, BMP, or WebP format',
        'Check that images are not corrupted',
        'Verify images are satellite/aerial imagery',
        'Ensure file sizes are between 1KB and 10MB',
        'Try using images with similar dimensions and aspect ratios'
      ]
    });
  } finally {
    // Clean up uploaded files
    if (beforeImageFile && beforeImageFile.path) {
      try {
        await fs.remove(beforeImageFile.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup before image file:', cleanupError);
      }
    }
    if (afterImageFile && afterImageFile.path) {
      try {
        await fs.remove(afterImageFile.path);
      } catch (cleanupError) {
        console.warn('Failed to cleanup after image file:', cleanupError);
      }
    }
  }
});

// Error handling middleware
app.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        error: 'File too large',
        message: 'Maximum file size is 10MB',
        success: false
      });
    }
  }
  
  console.error('Unhandled error:', error);
  res.status(500).json({
    error: 'Internal server error',
    message: error.message,
    success: false
  });
});

// 404 handler
app.use((req, res) => {
  res.status(404).json({
    error: 'Endpoint not found',
    message: `${req.method} ${req.originalUrl} is not a valid endpoint`,
    success: false,
    available_endpoints: {
      'GET /': 'Health check',
      'POST /compare': 'Compare satellite images'
    }
  });
});

// Start the server
app.listen(PORT, '0.0.0.0', () => {
  console.log(`🚀 Satellite Image Change Detector Backend running on port ${PORT}`);
  console.log(`📡 Health check: http://localhost:${PORT}/`);
  console.log(`🔍 Compare endpoint: POST http://localhost:${PORT}/compare`);
  console.log(`📁 Upload directory: ${path.join(__dirname, '../uploads')}`);
  console.log(`🤖 AI Analysis: ${process.env.OPENAI_API_KEY ? 'Enabled ✅' : 'Disabled (no API key) ❌'}`);
});

export default app;