// Node.js Express Backend for Satellite Image Change Detector
// Author: Replit AI Agent
// Description: AI-powered satellite image change detection with LLM analysis

import express from 'express';
import multer from 'multer';
import cors from 'cors';
import path from 'path';
import fs from 'fs-extra';
import { v4 as uuidv4 } from 'uuid';
import { createRequire } from 'module';
import sharp from 'sharp';
import OpenAI from 'openai';
import { fileURLToPath } from 'url';

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

// Ensure uploads directory exists
fs.ensureDirSync(path.join(__dirname, '../uploads'));

// Middleware configuration
app.use(cors({
  origin: ['http://localhost:8080', 'http://localhost:5173', 'http://0.0.0.0:8080', 'https://*.replit.app', 'https://*.replit.dev'],
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

const upload = multer({
  storage: storage,
  limits: {
    fileSize: 10 * 1024 * 1024, // 10MB limit
  },
  fileFilter: (req, file, cb) => {
    // Accept only image files
    if (file.mimetype.startsWith('image/')) {
      cb(null, true);
    } else {
      cb(new Error('Only image files are allowed!'), false);
    }
  }
});

// Health check endpoint
app.get('/', (req, res) => {
  res.json({ 
    message: 'Backend running ✅', 
    status: 'healthy',
    timestamp: new Date().toISOString(),
    endpoints: {
      compare: 'POST /compare - Upload two images for change detection',
      health: 'GET / - Health check'
    }
  });
});

// Advanced image comparison using computer vision techniques
async function calculateChangePercentage(beforeImagePath, afterImagePath) {
  try {
    // Load images using Jimp for processing
    const beforeImage = await Jimp.read(beforeImagePath);
    const afterImage = await Jimp.read(afterImagePath);
    
    // Resize images to same dimensions for comparison
    const width = Math.min(beforeImage.getWidth(), afterImage.getWidth());
    const height = Math.min(beforeImage.getHeight(), afterImage.getHeight());
    
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
    console.error('Error calculating change percentage:', error);
    throw new Error('Failed to process images for change detection');
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

// AI-powered change analysis using OpenAI GPT-5
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
    
    // Use OpenAI GPT-5 with vision capabilities to analyze the changes
    const response = await openai.chat.completions.create({
      model: "gpt-5", // the newest OpenAI model is "gpt-5" which was released August 7, 2025
      messages: [
        {
          role: "system",
          content: `You are an expert satellite image analyst. Analyze these before/after satellite images and provide insights about the changes detected. Focus on identifying:
          1. Type of changes (deforestation, construction, natural disasters, etc.)
          2. Environmental or urban impact
          3. Risk assessment (1-10 scale)
          
          Respond with JSON in this format: { "summary": "brief description", "changeType": "category", "riskScore": number, "details": "detailed analysis" }`
        },
        {
          role: "user",
          content: [
            {
              type: "text",
              text: `Analyze these satellite images. The automated system detected ${changePercentage.toFixed(2)}% change between the images. What kind of changes do you see?`
            },
            {
              type: "image_url",
              image_url: {
                url: `data:image/jpeg;base64,${beforeImageBase64}`
              }
            },
            {
              type: "image_url", 
              image_url: {
                url: `data:image/jpeg;base64,${afterImageBase64}`
              }
            }
          ]
        }
      ],
      response_format: { type: "json_object" },
      max_completion_tokens: 500
    });

    const analysis = JSON.parse(response.choices[0].message.content);
    
    return {
      summary: analysis.summary || `${changePercentage.toFixed(2)}% change detected`,
      changeType: analysis.changeType || 'Unknown Change',
      riskScore: Math.min(10, Math.max(1, analysis.riskScore || Math.round(changePercentage / 10))),
      details: analysis.details || 'Detailed analysis not available'
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
  try {
    // Validate uploaded files
    if (!req.files || !req.files.before_image || !req.files.after_image) {
      return res.status(400).json({
        error: 'Both before_image and after_image are required',
        success: false
      });
    }

    const beforeImageFile = req.files.before_image[0];
    const afterImageFile = req.files.after_image[0];
    
    console.log(`Processing comparison: ${beforeImageFile.filename} vs ${afterImageFile.filename}`);
    
    // Step 1: Calculate change percentage using computer vision
    const changePercentage = await calculateChangePercentage(
      beforeImageFile.path,
      afterImageFile.path
    );
    
    // Step 2: Generate heatmap visualization
    const heatmapBase64 = await generateHeatmap(
      beforeImageFile.path,
      afterImageFile.path
    );
    
    // Step 3: AI-powered analysis (if OpenAI key is available)
    const aiAnalysis = await analyzeChangesWithAI(
      beforeImageFile.path,
      afterImageFile.path,
      changePercentage
    );
    
    // Prepare response
    const response = {
      success: true,
      change_percentage: parseFloat(changePercentage.toFixed(2)),
      heatmap_url: `data:image/png;base64,${heatmapBase64}`,
      ai_analysis: aiAnalysis,
      message: `Analysis complete: ${aiAnalysis.summary}`,
      metadata: {
        before_image: beforeImageFile.filename,
        after_image: afterImageFile.filename,
        processed_at: new Date().toISOString(),
        change_type: aiAnalysis.changeType,
        risk_score: aiAnalysis.riskScore
      }
    };
    
    console.log(`Analysis completed: ${changePercentage.toFixed(2)}% change detected`);
    res.json(response);
    
  } catch (error) {
    console.error('Error in /compare endpoint:', error);
    
    res.status(500).json({
      error: 'Internal server error during image comparison',
      message: error.message,
      success: false
    });
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