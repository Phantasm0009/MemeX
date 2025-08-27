#!/usr/bin/env node

// Fetch and print production sitemap contents for verification

const URL = 'https://memexbot.xyz/sitemap.xml';

(async () => {
  try {
    const res = await fetch(URL, { headers: { 'Accept': 'application/xml' } });
    console.log('Status:', res.status, res.statusText);
    console.log('Content-Type:', res.headers.get('content-type'));
    const text = await res.text();
    const urlCount = (text.match(/<url>/g) || []).length;
    console.log('URL entries found:', urlCount);
    console.log('--- Preview (first 500 chars) ---');
    console.log(text.slice(0, 500));
  } catch (e) {
    console.error('Failed to fetch production sitemap:', e.message);
  }
})();
