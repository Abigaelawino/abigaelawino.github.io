#!/usr/bin/env node

import fs from 'fs';
import path from 'path';

// Pages to analyze
const pages = ['index', 'about', 'projects', 'blog', 'contact', 'resume'];

// Scoring weights for different issues
const issueWeights = {
  // SEO Issues
  missing_title: 30,
  short_title: 15,
  missing_description: 25,
  short_description: 10,
  missing_canonical: 20,
  missing_h1: 15,
  missing_viewport: 25,
  missing_charset: 15,
  missing_doctype: 20,
  missing_og_tags: 10,
  missing_twitter_card: 10,
  missing_og_image: 10,

  // Accessibility Issues
  missing_skip_link: 25,
  missing_alt_text: 20,
  poor_contrast: 15,
  missing_form_labels: 20,
  missing_lang_attr: 15,

  // Performance Issues
  missing_preload: 15,
  no_compression: 20,
  large_images: 25,
  render_blocking: 20,

  // Best Practices Issues
  missing_csp: 15,
  insecure_content: 30,
  no_https: 40,
  missing_favicon: 10,
};

function analyzeSEO(html, content) {
  const issues = [];
  let score = 100;

  // Title analysis
  const titleMatch = html.match(/<title[^>]*>(.*?)<\/title>/i);
  if (!titleMatch) {
    issues.push('missing_title');
    score -= issueWeights.missing_title;
  } else {
    const title = titleMatch[1].trim();
    if (title.length < 30) {
      issues.push('short_title');
      score -= issueWeights.short_title;
    }
    if (title.length > 60) {
      issues.push('long_title');
      score -= 5;
    }
  }

  // Description analysis
  const descMatch = html.match(
    /<meta[^>]*name=["']description["'][^>]*content=["']([^"']+)["'][^>]*>/i
  );
  if (!descMatch) {
    issues.push('missing_description');
    score -= issueWeights.missing_description;
  } else {
    const description = descMatch[1].trim();
    if (description.length < 120) {
      issues.push('short_description');
      score -= issueWeights.short_description;
    }
    if (description.length > 160) {
      issues.push('long_description');
      score -= 5;
    }
  }

  // Canonical URL
  if (!html.includes('rel="canonical"')) {
    issues.push('missing_canonical');
    score -= issueWeights.missing_canonical;
  }

  // H1 heading
  const h1Match = html.match(/<h1[^>]*>([\s\S]*?)<\/h1>/i);
  if (!h1Match) {
    issues.push('missing_h1');
    score -= issueWeights.missing_h1;
  }

  // Viewport meta
  if (!html.includes('name="viewport"')) {
    issues.push('missing_viewport');
    score -= issueWeights.missing_viewport;
  }

  // Charset
  if (!html.includes('charset=')) {
    issues.push('missing_charset');
    score -= issueWeights.missing_charset;
  }

  // DOCTYPE
  if (!html.startsWith('<!doctype html>')) {
    issues.push('missing_doctype');
    score -= issueWeights.missing_doctype;
  }

  // Open Graph tags
  const ogTags = ['og:title', 'og:description', 'og:image', 'og:url', 'og:type'];
  const missingOG = ogTags.filter(tag => !html.includes(`property="${tag}"`));
  if (missingOG.length > 0) {
    issues.push('missing_og_tags');
    score -= issueWeights.missing_og_tags * (missingOG.length / ogTags.length);
  }

  // Twitter Card
  if (!html.includes('name="twitter:card"')) {
    issues.push('missing_twitter_card');
    score -= issueWeights.missing_twitter_card;
  }

  return { score: Math.max(0, Math.min(100, score)), issues };
}

function analyzeAccessibility(html, content) {
  const issues = [];
  let score = 100;

  // Skip link
  if (!html.includes('Skip to content')) {
    issues.push('missing_skip_link');
    score -= issueWeights.missing_skip_link;
  }

  // Lang attribute
  if (!html.includes('<html lang=')) {
    issues.push('missing_lang_attr');
    score -= issueWeights.missing_lang_attr;
  }

  // Alt text for images
  const imgTags = content.match(/<img[^>]*>/g) || [];
  const imgsWithoutAlt = imgTags.filter(img => !img.includes('alt='));
  if (imgsWithoutAlt.length > 0) {
    issues.push('missing_alt_text');
    score -= Math.min(30, imgsWithoutAlt.length * 10);
  }

  // Form labels
  const inputs = content.match(/<input[^>]*>/g) || [];
  const inputsWithoutLabels = inputs.filter(input => {
    const id = input.match(/id=["']([^"']+)["']/);
    return id && !content.includes(`for="${id[1]}"`);
  });
  if (inputsWithoutLabels.length > 0) {
    issues.push('missing_form_labels');
    score -= Math.min(25, inputsWithoutLabels.length * 8);
  }

  // Heading structure
  const headings = content.match(/<h[1-6][^>]*>/g) || [];
  if (headings.length === 0) {
    issues.push('no_headings');
    score -= 20;
  }

  return { score: Math.max(0, Math.min(100, score)), issues };
}

function analyzePerformance(html, content) {
  const issues = [];
  let score = 100;

  // Render blocking scripts
  const scripts = html.match(/<script[^>]*>/g) || [];
  const blockingScripts = scripts.filter(
    script => !script.includes('defer') && !script.includes('async')
  );
  if (blockingScripts.length > 0) {
    issues.push('render_blocking');
    score -= Math.min(25, blockingScripts.length * 8);
  }

  // Preload for critical resources
  if (!html.includes('rel="preload"')) {
    issues.push('missing_preload');
    score -= issueWeights.missing_preload;
  }

  // Image optimization
  const largeImages = (content.match(/<img[^>]*>/g) || []).filter(
    img => img.includes('width=') && parseInt(img.match(/width=["']?(\d+)/)?.[1] || 0) > 1000
  );
  if (largeImages.length > 0) {
    issues.push('large_images');
    score -= Math.min(20, largeImages.length * 5);
  }

  return { score: Math.max(0, Math.min(100, score)), issues };
}

function analyzeBestPractices(html, content) {
  const issues = [];
  let score = 100;

  // CSP header
  if (!html.includes('Content-Security-Policy')) {
    issues.push('missing_csp');
    score -= issueWeights.missing_csp;
  }

  // HTTPS usage
  if (html.includes('http://') && !html.includes('https://')) {
    issues.push('no_https');
    score -= issueWeights.no_https;
  }

  // Favicon
  if (!html.includes('rel="icon"')) {
    issues.push('missing_favicon');
    score -= issueWeights.missing_favicon;
  }

  return { score: Math.max(0, Math.min(100, score)), issues };
}

function analyzePage(page) {
  const filePath = page === 'index' ? 'dist/index.html' : `dist/${page}/index.html`;

  try {
    if (!fs.existsSync(filePath)) {
      return { error: `File not found: ${filePath}` };
    }

    const html = fs.readFileSync(filePath, 'utf8');
    const contentMatch = html.match(/<body[^>]*>([\s\S]*)<\/body>/i);
    const content = contentMatch ? contentMatch[1] : html;

    const seo = analyzeSEO(html, content);
    const accessibility = analyzeAccessibility(html, content);
    const performance = analyzePerformance(html, content);
    const bestPractices = analyzeBestPractices(html, content);

    return {
      scores: {
        performance: Math.round(performance.score),
        accessibility: Math.round(accessibility.score),
        bestPractices: Math.round(bestPractices.score),
        seo: Math.round(seo.score),
      },
      issues: {
        seo: seo.issues,
        accessibility: accessibility.issues,
        performance: performance.issues,
        bestPractices: bestPractices.issues,
      },
      allIssues: [
        ...seo.issues,
        ...accessibility.issues,
        ...performance.issues,
        ...bestPractices.issues,
      ],
    };
  } catch (error) {
    return { error: error.message };
  }
}

// Main execution
const results = {};

console.log('🔍 Running comprehensive Lighthouse analysis on static files...\n');

pages.forEach(page => {
  console.log(`Analyzing ${page} page...`);
  const result = analyzePage(page);
  results[page] = result;

  if (result.error) {
    console.log(`❌ ${page}: ${result.error}`);
  } else {
    const { scores } = result;
    console.log(
      `✅ ${page}: Performance=${scores.performance}, Accessibility=${scores.accessibility}, Best Practices=${scores.bestPractices}, SEO=${scores.seo}`
    );

    const belowThreshold = Object.entries(scores)
      .filter(([cat, score]) => score < 90)
      .map(([cat]) => cat);

    if (belowThreshold.length > 0) {
      console.log(`⚠️  Below 90: ${belowThreshold.join(', ')}`);
    } else {
      console.log(`🎉 All scores ≥ 90`);
    }
  }
  console.log();
});

// Calculate overall summary
const summary = {
  total: pages.length,
  above90: 0,
  below90: 0,
  averageScores: { performance: 0, accessibility: 0, bestPractices: 0, seo: 0 },
};

Object.values(results).forEach(result => {
  if (result.scores) {
    const allAbove90 = Object.values(result.scores).every(score => score >= 90);
    if (allAbove90) {
      summary.above90++;
    } else {
      summary.below90++;
    }

    Object.keys(summary.averageScores).forEach(category => {
      summary.averageScores[category] += result.scores[category];
    });
  }
});

// Calculate averages
Object.keys(summary.averageScores).forEach(category => {
  summary.averageScores[category] = Math.round(summary.averageScores[category] / summary.total);
});

console.log('📊 Summary:');
console.log(`Total pages: ${summary.total}`);
console.log(`Pages with all scores ≥ 90: ${summary.above90}`);
console.log(`Pages with scores < 90: ${summary.below90}`);
console.log(`Average scores:`);
Object.entries(summary.averageScores).forEach(([cat, score]) => {
  console.log(`  ${cat}: ${score}`);
});

// Save detailed results
const reportsDir = path.join(process.cwd(), 'reports', 'lighthouse');
fs.mkdirSync(reportsDir, { recursive: true });
const analysisPath = path.join(reportsDir, 'lighthouse-static-analysis.json');
const summaryPath = path.join(reportsDir, 'lighthouse-summary.json');
fs.writeFileSync(analysisPath, JSON.stringify(results, null, 2));
fs.writeFileSync(summaryPath, JSON.stringify(summary, null, 2));

console.log(`\n📄 Detailed results saved to ${analysisPath}`);
console.log(`📋 Summary saved to ${summaryPath}`);
