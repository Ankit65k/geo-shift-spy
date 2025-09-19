// Test proper Jimp v1.x usage
import { Jimp, intToRGBA, rgbaToInt, JimpMime } from 'jimp';

async function testJimpV1() {
    try {
        console.log('Testing Jimp v1.x proper usage...');
        
        const imagePath = 'src/assets/satellite-hero.jpg';
        
        // Test reading image
        console.log('Reading image...');
        const image = await Jimp.read(imagePath);
        
        console.log('Image type:', typeof image);
        console.log('Image prototype:', Object.getPrototypeOf(image).constructor.name);
        console.log('Available methods:', Object.getOwnPropertyNames(Object.getPrototypeOf(image)).filter(name => typeof image[name] === 'function'));
        
        // Test basic operations
        console.log('Width:', image.bitmap?.width || 'not found');
        console.log('Height:', image.bitmap?.height || 'not found');
        
        // Try different method names
        const methodsToTry = ['getWidth', 'width', 'bitmap'];
        for (const method of methodsToTry) {
            if (typeof image[method] === 'function') {
                console.log(`${method}():`, image[method]());
            } else if (image[method] !== undefined) {
                console.log(`${method}:`, image[method]);
            }
        }
        
    } catch (error) {
        console.error('Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testJimpV1();