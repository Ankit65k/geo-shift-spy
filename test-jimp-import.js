// Test different ways to import Jimp
import { createRequire } from 'module';

const require = createRequire(import.meta.url);

async function testJimpImports() {
    try {
        console.log('Testing different Jimp import methods...');
        
        // Method 1: CommonJS require
        try {
            const Jimp1 = require('jimp');
            console.log('Method 1 (require):', typeof Jimp1, Object.keys(Jimp1));
        } catch (e) {
            console.log('Method 1 failed:', e.message);
        }
        
        // Method 2: ES module import
        try {
            const jimp2 = await import('jimp');
            console.log('Method 2 (import):', typeof jimp2.default, Object.keys(jimp2));
        } catch (e) {
            console.log('Method 2 failed:', e.message);
        }
        
        // Method 3: Named import
        try {
            const { Jimp: Jimp3 } = await import('jimp');
            console.log('Method 3 (named):', typeof Jimp3);
        } catch (e) {
            console.log('Method 3 failed:', e.message);
        }
        
    } catch (error) {
        console.error('Overall test failed:', error);
    }
}

testJimpImports();