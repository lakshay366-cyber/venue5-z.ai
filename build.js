const fs = require('fs');
const path = require('path');
require('dotenv').config();

// Read the template HTML
const inputPath = path.join(__dirname, 'index.html');
const outputPath = path.join(__dirname, 'dist', 'index.html');

// Ensure dist directory exists
if (!fs.existsSync(path.join(__dirname, 'dist'))) {
    fs.mkdirSync(path.join(__dirname, 'dist'), { recursive: true });
}

let html = fs.readFileSync(inputPath, 'utf-8');

// Replace placeholders with environment variables
const adminPin = process.env.ADMIN_PIN || '1234';
html = html.replace('__ADMIN_PIN_PLACEHOLDER__', adminPin);

// Write to dist folder
fs.writeFileSync(outputPath, html, 'utf-8');

console.log('✓ Build complete');
console.log(`✓ Admin PIN injected from environment`);
console.log(`✓ Output: ${outputPath}`);
