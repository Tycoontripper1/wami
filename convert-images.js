const sharp = require('sharp');
const fs = require('fs');
const path = require('path');

const assetsDir = path.join(__dirname, 'assets', 'images');

// Images to convert to WebP
const imagesToConvert = [
  'onboarding_bg_creative.png',
  'onboarding_bg_seller.png',
  'onboarding_bg_service.png',
  'food.png',
  'makeup.png',
  'photography.png',
  'sneakers.png'
];

async function convertToWebP() {
  console.log('Starting image conversion to WebP...\n');
  
  for (const image of imagesToConvert) {
    const inputPath = path.join(assetsDir, image);
    const outputPath = path.join(assetsDir, image.replace('.png', '.webp'));
    
    if (!fs.existsSync(inputPath)) {
      console.log(`⚠️  Skipping ${image} - file not found`);
      continue;
    }
    
    try {
      const inputStats = fs.statSync(inputPath);
      const inputSizeMB = (inputStats.size / 1024 / 1024).toFixed(2);
      
      // Convert to WebP with 85% quality
      await sharp(inputPath)
        .webp({ quality: 85 })
        .toFile(outputPath);
      
      const outputStats = fs.statSync(outputPath);
      const outputSizeMB = (outputStats.size / 1024 / 1024).toFixed(2);
      const savings = ((1 - outputStats.size / inputStats.size) * 100).toFixed(1);
      
      console.log(`✓ ${image}`);
      console.log(`  Before: ${inputSizeMB} MB → After: ${outputSizeMB} MB (${savings}% reduction)\n`);
      
    } catch (error) {
      console.error(`✗ Error converting ${image}:`, error.message);
    }
  }
  
  console.log('Image conversion complete!');
  console.log('\nNext steps:');
  console.log('1. Update image imports in your code to use .webp extensions');
  console.log('2. Test the app to ensure images display correctly');
  console.log('3. If satisfied, you can delete the original .png files');
}

convertToWebP().catch(console.error);
