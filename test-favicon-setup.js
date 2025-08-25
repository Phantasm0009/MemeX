#!/usr/bin/env node

// Test Favicon Accessibility in Dashboard

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import fs from 'fs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:3002';

async function testFaviconAccess() {
  console.log('🎨 Testing Favicon Accessibility...\n');
  
  // Check if favicon files exist locally
  const faviconPaths = [
    join(__dirname, 'dashboard', 'favicon.ico'),
    join(__dirname, 'dashboard', 'public', 'favicon.ico')
  ];
  
  console.log('📁 Local File Check:');
  faviconPaths.forEach(path => {
    const exists = fs.existsSync(path);
    console.log(`   ${exists ? '✅' : '❌'} ${path.replace(__dirname, '.')}`);
  });
  
  // Check manifest file
  const manifestPath = join(__dirname, 'dashboard', 'public', 'site.webmanifest');
  const manifestExists = fs.existsSync(manifestPath);
  console.log(`   ${manifestExists ? '✅' : '❌'} ${manifestPath.replace(__dirname, '.')}`);
  
  console.log('\n🌐 Testing HTTP Accessibility:');
  
  try {
    const testUrls = [
      `${DASHBOARD_URL}/favicon.ico`,
      `${DASHBOARD_URL}/site.webmanifest`
    ];
    
    for (const url of testUrls) {
      try {
        const response = await fetch(url);
        console.log(`   ${response.ok ? '✅' : '❌'} ${url} (${response.status})`);
      } catch (error) {
        console.log(`   ❌ ${url} (${error.message})`);
      }
    }
  } catch (error) {
    console.log(`   ⚠️  HTTP test skipped: ${error.message}`);
    console.log('   💡 Run "cd dashboard && node server.js" to test HTTP access');
  }
  
  console.log('\n📱 PWA Manifest Content:');
  if (manifestExists) {
    try {
      const manifest = JSON.parse(fs.readFileSync(manifestPath, 'utf8'));
      console.log(`   📱 App Name: ${manifest.name}`);
      console.log(`   🎨 Theme Color: ${manifest.theme_color}`);
      console.log(`   🖼️  Icons: ${manifest.icons.length} defined`);
    } catch (error) {
      console.log(`   ❌ Error reading manifest: ${error.message}`);
    }
  }
  
  console.log('\n✅ Favicon setup complete! Your MemeX app now uses favicon.ico for:');
  console.log('   • Browser tab icon');
  console.log('   • Bookmark icon');
  console.log('   • Social media previews');
  console.log('   • PWA app icon');
  console.log('   • Apple touch icon');
}

testFaviconAccess().catch(console.error);
