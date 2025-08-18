#!/usr/bin/env node

// 🧪 Pre-deployment test script
// Tests local setup before DigitalOcean deployment

import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Load environment variables
dotenv.config();

console.log('🧪 Italian Meme Stock Exchange - Pre-Deployment Test');
console.log('=====================================================\n');

let allTestsPassed = true;

// Test 1: Check required files
console.log('📁 Checking required files...');
const requiredFiles = [
  'index.js',
  'backend/server.js', 
  'dashboard/server.js',
  'package.json',
  'dashboard/package.json',
  '.env.example'
];

requiredFiles.forEach(file => {
  if (fs.existsSync(path.join(__dirname, file))) {
    console.log(`   ✅ ${file}`);
  } else {
    console.log(`   ❌ ${file} - MISSING`);
    allTestsPassed = false;
  }
});

// Test 2: Check environment variables
console.log('\n🔐 Checking environment variables...');
const requiredEnvVars = {
  'BOT_TOKEN': 'Discord Bot Token (Required for bot to work)',
  'CLIENT_ID': 'Discord Client ID (Required for commands)',
};

const optionalEnvVars = {
  'SUPABASE_URL': 'Database URL (Recommended for production)',
  'SUPABASE_ANON_KEY': 'Database Key (Recommended for production)',
  'YOUTUBE_API_KEY': 'YouTube API (Optional for trend data)',
  'TWITTER_BEARER_TOKEN': 'Twitter API (Optional for trend data)'
};

Object.entries(requiredEnvVars).forEach(([varName, description]) => {
  if (process.env[varName]) {
    console.log(`   ✅ ${varName} - ${description}`);
  } else {
    console.log(`   ❌ ${varName} - ${description} - MISSING`);
    allTestsPassed = false;
  }
});

Object.entries(optionalEnvVars).forEach(([varName, description]) => {
  if (process.env[varName]) {
    console.log(`   ✅ ${varName} - ${description}`);
  } else {
    console.log(`   ⚠️  ${varName} - ${description} - Optional`);
  }
});

// Test 3: Check Discord token format
console.log('\n🤖 Validating Discord configuration...');
if (process.env.BOT_TOKEN) {
  // Basic token format validation
  if (process.env.BOT_TOKEN.includes('.')) {
    console.log('   ✅ BOT_TOKEN format appears valid');
  } else {
    console.log('   ⚠️  BOT_TOKEN format may be invalid');
  }
}

if (process.env.CLIENT_ID) {
  // Basic client ID validation (should be numeric)
  if (/^\d+$/.test(process.env.CLIENT_ID)) {
    console.log('   ✅ CLIENT_ID format appears valid');
  } else {
    console.log('   ⚠️  CLIENT_ID should be numeric');
  }
}

// Test 4: Check package.json dependencies
console.log('\n📦 Checking dependencies...');
try {
  const packageJson = JSON.parse(fs.readFileSync('package.json', 'utf8'));
  const requiredDeps = ['discord.js', 'express', 'dotenv', 'cors'];
  
  requiredDeps.forEach(dep => {
    if (packageJson.dependencies[dep]) {
      console.log(`   ✅ ${dep}`);
    } else {
      console.log(`   ❌ ${dep} - Missing dependency`);
      allTestsPassed = false;
    }
  });
} catch (error) {
  console.log('   ❌ Error reading package.json');
  allTestsPassed = false;
}

// Test 5: Check dashboard configuration
console.log('\n📊 Checking dashboard configuration...');
try {
  const dashboardPackage = JSON.parse(fs.readFileSync('dashboard/package.json', 'utf8'));
  if (dashboardPackage.main === 'server.js') {
    console.log('   ✅ Dashboard entry point configured');
  } else {
    console.log('   ⚠️  Dashboard entry point may be incorrect');
  }
} catch (error) {
  console.log('   ⚠️  Dashboard package.json missing or invalid');
}

// Test 6: Deployment readiness
console.log('\n🚀 Deployment readiness...');

if (fs.existsSync('deploy-digitalocean-optimized.sh')) {
  console.log('   ✅ Deployment script ready');
} else {
  console.log('   ❌ Deployment script missing');
  allTestsPassed = false;
}

if (fs.existsSync('dashboard-app-spec.yaml')) {
  console.log('   ✅ App Platform spec ready');
} else {
  console.log('   ❌ App Platform spec missing');
  allTestsPassed = false;
}

// Final results
console.log('\n' + '='.repeat(50));
if (allTestsPassed) {
  console.log('🎉 All tests passed! Ready for DigitalOcean deployment.');
  console.log('\n📋 Next steps:');
  console.log('   1. Create DigitalOcean Droplet (Ubuntu 22.04, $6/month)');
  console.log('   2. SSH into droplet and run deployment script');
  console.log('   3. Copy your .env values to droplet');
  console.log('   4. Deploy dashboard on App Platform');
  console.log('\n📖 See DEPLOYMENT_GUIDE.md for detailed instructions');
} else {
  console.log('❌ Some tests failed. Please fix the issues above before deployment.');
  console.log('\n🔧 Common fixes:');
  console.log('   - Run: npm install');
  console.log('   - Configure .env with your Discord bot tokens');
  console.log('   - Ensure all required files are present');
}

console.log('\n💰 Estimated monthly cost: $11 ($6 Droplet + $5 App Platform)');
console.log('🎁 $200 DigitalOcean credits = 18+ months free!');

process.exit(allTestsPassed ? 0 : 1);
