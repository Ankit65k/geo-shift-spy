// Test Jimp v0.x methods
import pkg from 'jimp';
const Jimp = pkg;

async function testJimpMethods() {
    try {
        const imagePath = 'src/assets/satellite-hero.jpg';
        const image = await Jimp.read(imagePath);
        
        console.log('Testing resize...');
        const resized = image.clone();
        // Try different resize approaches
        if (typeof resized.resize === 'function') {
            console.log('resize method exists');
            resized.resize(100, 100);
            console.log('Resize successful');
        } else {
            console.log('resize method not found');
        }
        
        console.log('Testing greyscale...');
        const gray = image.clone();
        if (typeof gray.greyscale === 'function') {
            console.log('greyscale method exists');
            gray.greyscale();
            console.log('Greyscale successful');
        } else if (typeof gray.grayscale === 'function') {
            console.log('grayscale (US spelling) method exists');
            gray.grayscale();
            console.log('Grayscale successful');
        } else {
            console.log('No grayscale method found');
        }
        
        console.log('Testing pixel operations...');
        const pixel = image.getPixelColor(10, 10);
        console.log('Got pixel color:', pixel);
        
        console.log('Testing new Jimp construction...');
        const newImage = new Jimp(100, 100, 0x000000ff);
        console.log('New Jimp created');
        
    } catch (error) {
        console.error('Error:', error.message);
    }
}

testJimpMethods();