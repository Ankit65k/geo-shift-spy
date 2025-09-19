// Test script to verify the /compare endpoint works
import fetch from 'node-fetch';
import FormData from 'form-data';
import fs from 'fs';
import path from 'path';

async function testCompareEndpoint() {
    try {
        const imagePath = 'src/assets/satellite-hero.jpg';
        
        // Check if image file exists
        if (!fs.existsSync(imagePath)) {
            console.log('❌ Test image not found');
            return;
        }

        const formData = new FormData();
        const imageBuffer = fs.readFileSync(imagePath);
        
        // Use the same image for both before and after (just for testing)
        formData.append('before_image', imageBuffer, 'before.jpg');
        formData.append('after_image', imageBuffer, 'after.jpg');

        console.log('🧪 Testing /compare endpoint...');
        
        const response = await fetch('http://localhost:5000/compare', {
            method: 'POST',
            body: formData,
            headers: formData.getHeaders()
        });

        console.log('📊 Response status:', response.status);
        console.log('📊 Response headers:', Object.fromEntries(response.headers));

        if (!response.ok) {
            const errorText = await response.text();
            console.log('❌ Error response:', errorText);
            return;
        }

        const result = await response.json();
        console.log('✅ Success! Response:', JSON.stringify(result, null, 2));

    } catch (error) {
        console.error('❌ Test failed:', error.message);
        console.error('Stack:', error.stack);
    }
}

testCompareEndpoint();