#!/usr/bin/env node

// 🔍 Quick Sitemap Validator for MemeX
// Validates sitemap XML structure and URLs

import { readFileSync } from 'fs';

console.log('🔍 Validating MemeX Sitemap...\n');

try {
    const sitemap = readFileSync('./dashboard/public/sitemap.xml', 'utf8');
    
    // Basic XML structure validation
    console.log('📋 XML Structure Validation:');
    const hasXMLDeclaration = sitemap.includes('<?xml version="1.0" encoding="UTF-8"?>');
    const hasNamespace = sitemap.includes('xmlns="http://www.sitemaps.org/schemas/sitemap/0.9"');
    const hasClosingTag = sitemap.includes('</urlset>');
    
    console.log(`   ${hasXMLDeclaration ? '✅' : '❌'} XML declaration`);
    console.log(`   ${hasNamespace ? '✅' : '❌'} Sitemap namespace`);
    console.log(`   ${hasClosingTag ? '✅' : '❌'} Closing urlset tag`);
    
    // URL extraction and validation
    console.log('\n📊 URL Analysis:');
    const urlMatches = sitemap.match(/<loc>(.*?)<\/loc>/g);
    if (urlMatches) {
        const urls = urlMatches.map(match => match.replace(/<\/?loc>/g, ''));
        console.log(`   ✅ Found ${urls.length} URLs`);
        
        urls.forEach((url, index) => {
            const isHTTPS = url.startsWith('https://');
            const isAbsolute = url.includes('memexbot.xyz');
            console.log(`   ${index + 1}. ${isHTTPS && isAbsolute ? '✅' : '❌'} ${url}`);
        });
    } else {
        console.log('   ❌ No URLs found');
    }
    
    // Timestamp validation
    console.log('\n⏰ Timestamp Validation:');
    const timestampMatches = sitemap.match(/<lastmod>(.*?)<\/lastmod>/g);
    if (timestampMatches) {
        const timestamps = timestampMatches.map(match => match.replace(/<\/?lastmod>/g, ''));
        const hasISOFormat = timestamps.every(ts => ts.includes('T') && ts.includes('+00:00'));
        console.log(`   ${hasISOFormat ? '✅' : '❌'} All timestamps in ISO format`);
        console.log(`   📅 Sample: ${timestamps[0]}`);
    }
    
    // Priority validation
    console.log('\n⭐ Priority Validation:');
    const priorityMatches = sitemap.match(/<priority>(.*?)<\/priority>/g);
    if (priorityMatches) {
        const priorities = priorityMatches.map(match => match.replace(/<\/?priority>/g, ''));
        const validPriorities = priorities.every(p => parseFloat(p) >= 0 && parseFloat(p) <= 1);
        console.log(`   ${validPriorities ? '✅' : '❌'} All priorities between 0.0 and 1.0`);
    }
    
    console.log('\n✅ Sitemap validation complete!');
    console.log('🚀 Ready for Google Search Console submission');
    
} catch (error) {
    console.log('❌ Error reading sitemap:', error.message);
}

console.log('\n📋 Quick Fix Commands:');
console.log('   git add .');
console.log('   git commit -m "Fix sitemap timestamps and structure"');
console.log('   git push origin main');
console.log('\n⏰ Wait 2-5 minutes for DigitalOcean auto-deployment');
console.log('🔗 Then test: https://memexbot.xyz/sitemap.xml');
