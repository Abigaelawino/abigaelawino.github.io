const lighthouse = require('lighthouse');
const chromeLauncher = require('chrome-launcher');
const fs = require('fs');
const path = require('path');

async function runLighthouseAudit(url, outputPath) {
  console.log(`Running Lighthouse audit for: ${url}`);
  
  const chrome = await chromeLauncher.launch({ chromeFlags: ['--headless'] });
  const options = {
    logLevel: 'info',
    output: 'json',
    onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
    port: chrome.port,
  };

  try {
    const runnerResult = await lighthouse(url, options);
    const report = runnerResult.report;
    
    fs.writeFileSync(outputPath, report);
    
    const scores = {
      performance: runnerResult.lhr.categories.performance.score * 100,
      accessibility: runnerResult.lhr.categories.accessibility.score * 100,
      bestPractices: runnerResult.lhr.categories['best-practices'].score * 100,
      seo: runnerResult.lhr.categories.seo.score * 100,
    };
    
    console.log(`Scores for ${url}:`);
    console.log(`  Performance: ${scores.performance}`);
    console.log(`  Accessibility: ${scores.accessibility}`);
    console.log(`  Best Practices: ${scores.bestPractices}`);
    console.log(`  SEO: ${scores.seo}`);
    
    return scores;
  } finally {
    await chrome.kill();
  }
}

async function auditAllPages() {
  const baseUrl = 'http://localhost:8080';
  const pages = [
    { path: '/', name: 'home' },
    { path: '/about', name: 'about' },
    { path: '/projects', name: 'projects' },
    { path: '/blog', name: 'blog' },
    { path: '/contact', name: 'contact' },
    { path: '/resume', name: 'resume' },
  ];

  console.log('Starting Lighthouse audits for all pages...');
  const results = {};

  for (const page of pages) {
    const url = `${baseUrl}${page.path}`;
    const outputPath = `./lighthouse-${page.name}.json`;
    
    try {
      const scores = await runLighthouseAudit(url, outputPath);
      results[page.name] = scores;
    } catch (error) {
      console.error(`Error auditing ${url}:`, error.message);
      results[page.name] = { error: error.message };
    }
  }

  // Generate summary report
  const summaryPath = './lighthouse-summary.json';
  fs.writeFileSync(summaryPath, JSON.stringify(results, null, 2));
  
  console.log('\n=== Lighthouse Audit Summary ===');
  for (const [page, scores] of Object.entries(results)) {
    if (scores.error) {
      console.log(`${page}: ERROR - ${scores.error}`);
    } else {
      const belowThreshold = Object.entries(scores)
        .filter(([category, score]) => score < 90)
        .map(([category]) => category);
      
      if (belowThreshold.length === 0) {
        console.log(`${page}: ✓ All scores ≥ 90`);
      } else {
        console.log(`${page}: ⚠ Below 90 in: ${belowThreshold.join(', ')}`);
      }
    }
  }
  
  console.log(`\nDetailed reports saved to lighthouse-*.json`);
  console.log(`Summary saved to ${summaryPath}`);
}

if (require.main === module) {
  auditAllPages().catch(console.error);
}

module.exports = { runLighthouseAudit, auditAllPages };