const fs = require('fs');
const path = require('path');

// Mock Lighthouse scores for testing the analysis functionality
// In a real environment, these would come from actual Lighthouse audits

const mockLighthouseResults = {
  home: {
    performance: 95,
    accessibility: 92,
    bestPractices: 94,
    seo: 96
  },
  about: {
    performance: 88,  // Below 90
    accessibility: 90,
    bestPractices: 89,  // Below 90
    seo: 91
  },
  projects: {
    performance: 92,
    accessibility: 85,  // Below 90
    bestPractices: 90,
    seo: 88  // Below 90
  },
  blog: {
    performance: 90,
    accessibility: 91,
    bestPractices: 92,
    seo: 90
  },
  contact: {
    performance: 93,
    accessibility: 89,  // Below 90
    bestPractices: 90,
    seo: 92
  },
  resume: {
    performance: 91,
    accessibility: 90,
    bestPractices: 88,  // Below 90
    seo: 90
  }
};

function analyzeLighthouseScores(results) {
  console.log('=== Lighthouse Score Analysis ===');
  
  const allPages = Object.keys(results);
  const allCategories = ['performance', 'accessibility', 'bestPractices', 'seo'];
  
  let pagesNeedingFixes = [];
  let categoriesNeedingFixes = new Set();
  
  for (const page of allPages) {
    const scores = results[page];
    const belowThreshold = [];
    
    for (const category of allCategories) {
      const score = scores[category];
      if (score < 90) {
        belowThreshold.push({ category, score });
        categoriesNeedingFixes.add(category);
      }
    }
    
    if (belowThreshold.length > 0) {
      pagesNeedingFixes.push({
        page,
        issues: belowThreshold
      });
      
      console.log(`\n🔍 ${page.charAt(0).toUpperCase() + page.slice(1)} Page:`);
      belowThreshold.forEach(({ category, score }) => {
        console.log(`  ⚠️  ${category.charAt(0).toUpperCase() + category.slice(1)}: ${score} (needs ≥ 90)`);
      });
    } else {
      console.log(`\n✅ ${page.charAt(0).toUpperCase() + page.slice(1)} Page: All scores ≥ 90`);
    }
  }
  
  console.log('\n=== Summary ===');
  console.log(`Total pages audited: ${allPages.length}`);
  console.log(`Pages needing fixes: ${pagesNeedingFixes.length}`);
  console.log(`Categories below threshold: ${Array.from(categoriesNeedingFixes).join(', ')}`);
  
  // Generate recommendations
  if (pagesNeedingFixes.length > 0) {
    console.log('\n=== Recommendations ===');
    
    const categoryCounts = {};
    pagesNeedingFixes.forEach(({ issues }) => {
      issues.forEach(({ category }) => {
        categoryCounts[category] = (categoryCounts[category] || 0) + 1;
      });
    });
    
    // Sort categories by frequency of issues
    const sortedCategories = Object.entries(categoryCounts)
      .sort(([,a], [,b]) => b - a)
      .map(([category]) => category);
    
    console.log('\nPriority order for fixes (most common issues first):');
    sortedCategories.forEach((category, index) => {
      const pagesWithIssue = pagesNeedingFixes
        .filter(({ issues }) => issues.some(issue => issue.category === category))
        .map(({ page }) => page);
      
      console.log(`${index + 1}. ${category.charAt(0).toUpperCase() + category.slice(1)} - affects: ${pagesWithIssue.join(', ')}`);
      
      // Provide specific recommendations per category
      switch(category) {
        case 'performance':
          console.log('   💡 Recommendations: Optimize images, reduce bundle size, improve loading performance');
          break;
        case 'accessibility':
          console.log('   💡 Recommendations: Improve color contrast, add ARIA labels, ensure keyboard navigation');
          break;
        case 'bestPractices':
          console.log('   💡 Recommendations: Update dependencies, fix security issues, improve code standards');
          break;
        case 'seo':
          console.log('   💡 Recommendations: Add meta descriptions, improve heading structure, add structured data');
          break;
      }
    });
  }
  
  return {
    totalAudited: allPages.length,
    pagesNeedingFixes,
    categoriesNeedingFixes: Array.from(categoriesNeedingFixes)
  };
}

// Create lighthouse-results directory if it doesn't exist
if (!fs.existsSync('lighthouse-results')) {
  fs.mkdirSync('lighthouse-results');
}

// Save mock results to simulate actual Lighthouse output
fs.writeFileSync(
  'lighthouse-results/summary.json',
  JSON.stringify(mockLighthouseResults, null, 2)
);

// Analyze the results
const analysis = analyzeLighthouseScores(mockLighthouseResults);

// Save analysis results
fs.writeFileSync(
  'lighthouse-results/analysis.json',
  JSON.stringify(analysis, null, 2)
);

console.log('\nDetailed results saved to lighthouse-results/ directory');

module.exports = { analyzeLighthouseScores, mockLighthouseResults };