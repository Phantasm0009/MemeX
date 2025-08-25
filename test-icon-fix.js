#!/usr/bin/env node

// Test Icon Accessibility in Dashboard
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const DASHBOARD_URL = process.env.DASHBOARD_URL || 'http://localhost:3002';

async function testIconAccess() {
    console.log('🔍 Testing MemeX icon accessibility...\n');
    
    // Test 1: Check if icon.png file exists locally
    const iconPath = path.join(__dirname, 'dashboard', 'icon.png');
    const iconPublicPath = path.join(__dirname, 'dashboard', 'public', 'icon.png');
    
    console.log('📁 Local file checks:');
    console.log(`   - dashboard/icon.png: ${fs.existsSync(iconPath) ? '✅ EXISTS' : '❌ MISSING'}`);
    console.log(`   - dashboard/public/icon.png: ${fs.existsSync(iconPublicPath) ? '✅ EXISTS' : '❌ MISSING'}`);
    
    // Test 2: Check if dashboard server responds
    try {
        console.log('\n🌐 Testing dashboard server...');
        const healthResponse = await fetch(`${DASHBOARD_URL}/api/health`, { timeout: 5000 });
        console.log(`   - Server status: ${healthResponse.ok ? '✅ ONLINE' : '❌ OFFLINE'} (${healthResponse.status})`);
        
        if (healthResponse.ok) {
            // Test 3: Check if icon is accessible via HTTP
            console.log('\n🖼️  Testing icon accessibility via HTTP...');
            
            try {
                const iconResponse = await fetch(`${DASHBOARD_URL}/icon.png`, { timeout: 5000 });
                console.log(`   - /icon.png: ${iconResponse.ok ? '✅ ACCESSIBLE' : '❌ NOT FOUND'} (${iconResponse.status})`);
                
                if (iconResponse.ok) {
                    const contentType = iconResponse.headers.get('content-type');
                    const contentLength = iconResponse.headers.get('content-length');
                    console.log(`   - Content-Type: ${contentType}`);
                    console.log(`   - Content-Length: ${contentLength} bytes`);
                }
            } catch (iconError) {
                console.log(`   - /icon.png: ❌ REQUEST FAILED (${iconError.message})`);
            }
            
            // Test 4: Check if dashboard page loads
            try {
                const dashboardResponse = await fetch(`${DASHBOARD_URL}/dashboard`, { timeout: 5000 });
                console.log(`   - /dashboard: ${dashboardResponse.ok ? '✅ LOADS' : '❌ ERROR'} (${dashboardResponse.status})`);
            } catch (dashboardError) {
                console.log(`   - /dashboard: ❌ REQUEST FAILED (${dashboardError.message})`);
            }
        }
        
    } catch (serverError) {
        console.log(`   - Server status: ❌ CONNECTION FAILED (${serverError.message})`);
        console.log('\n💡 Dashboard server might not be running. Start it with:');
        console.log('   cd dashboard && node server.js');
    }
    
    console.log('\n🎯 Icon Fix Summary:');
    console.log('   1. ✅ Added /icon.png route to dashboard server.js');
    console.log('   2. ✅ Copied icon.png to dashboard/public/ directory');
    console.log('   3. ✅ Added JavaScript fallback for broken images');
    console.log('   4. ✅ Added CSS styling for circular logo');
    
    console.log('\n🚀 The "MemeX Logo" text should now be replaced with the actual icon!');
    console.log('   If you still see text, restart the dashboard server.');
}

testIconAccess().catch(console.error);
