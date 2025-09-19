// Test script to check if image processing functions work
import { createRequire } from 'module';
import fs from 'fs';

const require = createRequire(import.meta.url);

// Fix for Jimp v1.x - use default import
let Jimp;
try {
  Jimp = (await import('jimp')).default;
} catch (e) {
  Jimp = require('jimp');
}

async function testImageProcessing() {
    try {
        console.log('📸 Testing Jimp image processing...');
        
        const imagePath = 'src/assets/satellite-hero.jpg';
        
        if (!fs.existsSync(imagePath)) {
            console.log('❌ Image file not found');
            return;
        }

        // Test loading the image
        console.log('📂 Loading image...');
        const image = await Jimp.read(imagePath);
        
        console.log(`✅ Image loaded successfully! Dimensions: ${image.getWidth()}x${image.getHeight()}`);
        
        // Test basic operations
        console.log('🔧 Testing image operations...');
        const resized = image.clone().resize(100, 100);
        const grayscale = image.clone().greyscale();
        
        console.log('✅ Image operations successful!');
        
        // Test pixel access
        console.log('🎨 Testing pixel access...');
        const pixel = Jimp.intToRGBA(image.getPixelColor(10, 10));
        console.log('✅ Pixel access works:', pixel);
        
        console.log('🎉 All image processing tests passed!');
        
    } catch (error) {
        console.error('❌ Image processing test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testImageProcessing();