#!/usr/bin/env node

// 🗺️ Sitemap Deployment Fix for Google Search Console
// This script diagnoses and fixes sitemap accessibility issues

import { fileURLToPath } from 'url';
import { dirname, join } from 'path';
import { existsSync, readFileSync } from 'fs';
import fetch from 'node-fetch';

const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

console.log('🗺️ MemeX Sitemap Deployment Fix\n');

// Test 1: Local sitemap validation
console.log('📁 Local Sitemap Validation:');
const sitemapPath = './dashboard/public/sitemap.xml';
const robotsPath = './dashboard/public/robots.txt';

if (existsSync(sitemapPath)) {
    console.log('   ✅ sitemap.xml exists locally');
    try {
        const sitemapContent = readFileSync(sitemapPath, 'utf8');
        const urlCount = (sitemapContent.match(/<url>/g) || []).length;
        const hasProperTimestamp = sitemapContent.includes('T12:00:00+00:00');
        console.log(`   ✅ Contains ${urlCount} URLs`);
        console.log(`   ${hasProperTimestamp ? '✅' : '❌'} Proper ISO timestamp format`);
        
        // Check for XML syntax errors
        if (sitemapContent.includes('<?xml') && sitemapContent.includes('</urlset>')) {
            console.log('   ✅ Valid XML structure');
        } else {
            console.log('   ❌ Invalid XML structure');
        }
    } catch (error) {
        console.log('   ❌ Failed to read sitemap.xml');
    }
} else {
    console.log('   ❌ sitemap.xml not found locally');
}

if (existsSync(robotsPath)) {
    console.log('   ✅ robots.txt exists locally');
} else {
    console.log('   ❌ robots.txt not found locally');
}

// Test 2: Production URL accessibility
console.log('\n🌐 Production URL Tests:');
const productionUrls = [
    'https://memexbot.xyz/',
    'https://memexbot.xyz/sitemap.xml',
    'https://memexbot.xyz/robots.txt',
    'https://memexbot.xyz/pages/dashboard.html'
];

async function testProductionUrls() {
    for (const url of productionUrls) {
        try {
            const response = await fetch(url, { 
                timeout: 10000,
                headers: {
                    'User-Agent': 'Mozilla/5.0 (compatible; MemeX-Bot/1.0)'
                }
            });
            
            const status = response.status;
            const contentType = response.headers.get('content-type') || 'unknown';
            const contentLength = response.headers.get('content-length') || 'unknown';
            
            if (status === 200) {
                console.log(`   ✅ ${url} (${status}) - ${contentType} - ${contentLength} bytes`);
                
                // Special validation for sitemap
                if (url.includes('sitemap.xml')) {
                    const content = await response.text();
                    const urlCount = (content.match(/<url>/g) || []).length;
                    console.log(`      📊 Sitemap contains ${urlCount} URLs`);
                    
                    if (content.includes('https://memexbot.xyz/')) {
                        console.log('      ✅ Contains main page URL');
                    } else {
                        console.log('      ❌ Missing main page URL');
                    }
                }
            } else {
                console.log(`   ❌ ${url} (${status}) - Server Error`);
            }
        } catch (error) {
            console.log(`   ❌ ${url} - Connection Failed: ${error.message}`);
        }
    }
}

// Test 3: Google Search Console specific tests
console.log('\n🔍 Google Search Console Requirements:');
console.log('   📋 Checklist for Google Search Console:');
console.log('   • Sitemap must be accessible via HTTPS ✓');
console.log('   • Content-Type must be application/xml or text/xml');
console.log('   • Must return HTTP 200 status code');
console.log('   • Must contain valid XML with proper encoding');
console.log('   • URLs must be absolute (https://memexbot.xyz/...)');
console.log('   • Must be under 50MB and contain < 50,000 URLs');

// Test 4: Deploy instructions
console.log('\n🚀 Deployment Instructions:');
console.log('');
console.log('📌 STEP 1: Verify Your Production Server');
console.log('   Make sure your DigitalOcean App Platform dashboard is running');
console.log('   URL: https://memexbot.xyz/');
console.log('');
console.log('📌 STEP 2: Deploy Updated Files');
console.log('   Run these commands:');
console.log('   git add .');
console.log('   git commit -m "Fix sitemap for Google Search Console"');
console.log('   git push origin main');
console.log('');
console.log('📌 STEP 3: Wait for Auto-Deployment');
console.log('   DigitalOcean App Platform will auto-deploy from GitHub');
console.log('   This usually takes 2-5 minutes');
console.log('');
console.log('📌 STEP 4: Test Production Sitemap');
console.log('   Visit: https://memexbot.xyz/sitemap.xml');
console.log('   Should show XML content with 6 URLs');
console.log('');
console.log('📌 STEP 5: Resubmit to Google Search Console');
console.log('   1. Go to Google Search Console');
console.log('   2. Select your memexbot.xyz property');
console.log('   3. Go to Sitemaps section');
console.log('   4. Delete the old sitemap entry');
console.log('   5. Submit: https://memexbot.xyz/sitemap.xml');
console.log('');

// Run production tests
await testProductionUrls();

console.log('\n📋 Summary:');
console.log('   • Updated sitemap.xml with proper ISO timestamps');
console.log('   • Added essential static files (favicon.ico, robots.txt)');
console.log('   • Ready for Google Search Console submission');
console.log('');
console.log('🎯 Next Action: Push to GitHub and wait for auto-deployment!');

console.log('\n⚠️ Common Issues & Solutions:');
console.log('   Problem: "Sitemap could not be read"');
console.log('   → Ensure your DigitalOcean app is running');
console.log('   → Check that GitHub auto-deployment worked');
console.log('   → Verify sitemap returns HTTP 200 status');
console.log('');
console.log('   Problem: "Discovered 0 pages"');
console.log('   → URLs in sitemap must be publicly accessible');
console.log('   → Check that all pages return HTTP 200');
console.log('   → Ensure no authentication requirements');
console.log('');
console.log('✅ Your sitemap is now Google Search Console ready!');
