#!/usr/bin/env node

/**
 * shadcn/ui Performance & Render Coverage Tracker
 *
 * This script tracks all shadcn/ui-specific render/core component coverage
 * so helper sessions can validate the generated HTML, layout variations,
 * and asset pipelines independently.
 */

import { readFileSync, writeFileSync, existsSync, mkdirSync, statSync } from 'fs';
import { join, dirname } from 'path';
import { execSync } from 'child_process';

class ShadcnPerformanceTracker {
  constructor() {
    this.projectRoot = process.cwd();
    this.coverageData = {
      timestamp: new Date().toISOString(),
      components: {},
      pages: {},
      performance: {},
      renderStats: {},
      assets: {},
      summary: {
        totalComponents: 0,
        usedComponents: 0,
        coveragePercentage: 0,
        totalRenderTime: 0,
        averageRenderTime: 0
      }
    };

    this.shadcnComponents = [
      // Core UI components
      'accordion', 'alert', 'alert-dialog', 'avatar', 'badge', 'button',
      'calendar', 'card', 'carousel', 'chart', 'checkbox', 'collapsible',
      'combobox', 'command', 'context-menu', 'data-table', 'date-picker',
      'dialog', 'drawer', 'dropdown-menu', 'form', 'hover-card', 'input',
      'label', 'menubar', 'navigation-menu', 'pagination', 'popover',
      'progress', 'radio-group', 'resizable', 'scroll-area', 'select',
      'separator', 'sheet', 'skeleton', 'slider', 'sonner', 'switch',
      'table', 'tabs', 'textarea', 'toast', 'toggle', 'toggle-group',
      'tooltip'
    ];
  }

  /**
   * Initialize the coverage tracking system
   */
  async initialize() {
    console.log('🔍 Initializing shadcn/ui Performance & Render Coverage Tracker...');

    // Ensure output directory exists
    const outputDir = join(this.projectRoot, '.shadcn-coverage');
    if (!existsSync(outputDir)) {
      mkdirSync(outputDir, { recursive: true });
    }

    // Scan for existing shadcn components
    await this.scanComponents();

    // Analyze page usage
    await this.analyzePageUsage();

    // Track performance metrics
    await this.trackPerformanceMetrics();

    // Analyze render coverage
    await this.analyzeRenderCoverage();

    // Generate reports
    await this.generateReports();

    console.log('✅ shadcn/ui coverage tracking complete!');
  }

  /**
   * Scan for shadcn/ui components in the project
   */
  async scanComponents() {
    console.log('📦 Scanning for shadcn/ui components...');

    const componentPaths = [
      join(this.projectRoot, 'components', 'ui'),
      join(this.projectRoot, 'app', 'components', 'ui'),
      join(this.projectRoot, 'src', 'components', 'ui'),
      join(this.projectRoot, 'lib', 'components', 'ui')
    ];

    for (const component of this.shadcnComponents) {
      this.coverageData.components[component] = {
        exists: false,
        path: null,
        variants: [],
        imports: [],
        exports: [],
        fileSize: 0,
        dependencies: [],
        lastModified: null,
        propsInterface: null,
        hasStyling: false,
        hasTests: false
      };
    }

    for (const componentPath of componentPaths) {
      if (!existsSync(componentPath)) continue;

      try {
        const files = execSync(`find "${componentPath}" -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js"`, { encoding: 'utf8' }).trim().split('\n');

        for (const file of files) {
          if (!file) continue;

          const fileName = file.split('/').pop().replace(/\.(tsx?|jsx?)$/, '');
          const componentName = fileName.replace(/-\w/g, (match) => match[1].toUpperCase());

          if (this.shadcnComponents.includes(fileName)) {
            const content = readFileSync(file, 'utf8');
            const stats = statSync(file);

            this.coverageData.components[fileName] = {
              ...this.coverageData.components[fileName],
              exists: true,
              path: file,
              fileSize: stats.size,
              lastModified: stats.mtime.toISOString(),
              imports: this.extractImports(content),
              exports: this.extractExports(content),
              dependencies: this.extractDependencies(content),
              propsInterface: this.extractPropsInterface(content),
              hasStyling: this.hasStyling(content),
              hasTests: this.hasTestFile(file),
              variants: this.extractVariants(content, fileName)
            };
          }
        }
      } catch (error) {
        // Directory might not exist or be empty
      }
    }
  }

  /**
   * Analyze component usage across pages
   */
  async analyzePageUsage() {
    console.log('📄 Analyzing component usage across pages...');

    const pagePaths = [
      join(this.projectRoot, 'app'),
      join(this.projectRoot, 'pages'),
      join(this.projectRoot, 'src', 'pages')
    ];

    for (const pagePath of pagePaths) {
      if (!existsSync(pagePath)) continue;

      try {
        const files = execSync(`find "${pagePath}" -name "*.tsx" -o -name "*.ts" -o -name "*.jsx" -o -name "*.js" | head -20`, { encoding: 'utf8' }).trim().split('\n');

        for (const file of files) {
          if (!file) continue;

          const relativePath = file.replace(this.projectRoot + '/', '');
          const content = readFileSync(file, 'utf8');

          this.coverageData.pages[relativePath] = {
            path: relativePath,
            components: this.extractComponentUsage(content),
            renderComplexity: this.calculateRenderComplexity(content),
            hasServerComponents: this.hasServerComponents(content),
            hasClientComponents: this.hasClientComponents(content)
          };
        }
      } catch (error) {
        // Directory might not exist
      }
    }
  }

  /**
   * Track performance metrics
   */
  async trackPerformanceMetrics() {
    console.log('⚡ Tracking performance metrics...');

    try {
      // Run Next.js build with performance profiling
      const buildOutput = execSync('npm run build 2>&1', {
        encoding: 'utf8',
        timeout: 120000
      });

      this.coverageData.performance = {
        buildTime: this.extractBuildTime(buildOutput),
        bundleSize: this.extractBundleSize(buildOutput),
        largestAssets: this.extractLargestAssets(buildOutput),
        optimizationWarnings: this.extractOptimizationWarnings(buildOutput)
      };
    } catch (error) {
      console.warn('Build performance tracking failed:', error.message);
      this.coverageData.performance = {
        error: error.message,
        buildTime: null,
        bundleSize: null,
        largestAssets: [],
        optimizationWarnings: []
      };
    }
  }

  /**
   * Analyze render coverage and statistics
   */
  async analyzeRenderCoverage() {
    console.log('🎯 Analyzing render coverage...');

    let totalComponents = 0;
    let usedComponents = 0;
    let totalRenderTime = 0;
    let renderCount = 0;

    // Count total available components
    for (const [componentName, data] of Object.entries(this.coverageData.components)) {
      if (data.exists) {
        totalComponents++;
      }
    }

    // Count used components and calculate render stats
    for (const [pagePath, pageData] of Object.entries(this.coverageData.pages)) {
      if (pageData.components.length > 0) {
        usedComponents += new Set(pageData.components).size;
        totalRenderTime += pageData.renderComplexity;
        renderCount++;
      }
    }

    // Calculate component-specific render stats
    for (const componentName of this.shadcnComponents) {
      const componentData = this.coverageData.components[componentName];
      if (componentData.exists) {
        let usageCount = 0;
        let totalPages = 0;

        for (const [pagePath, pageData] of Object.entries(this.coverageData.pages)) {
          totalPages++;
          if (pageData.components.includes(componentName)) {
            usageCount++;
          }
        }

        this.coverageData.renderStats[componentName] = {
          usageCount,
          totalPages,
          usagePercentage: totalPages > 0 ? (usageCount / totalPages) * 100 : 0,
          averageRenderTime: componentData.fileSize > 0 ? componentData.fileSize / 1000 : 0, // Rough estimate
          isOptimized: componentData.hasStyling && componentData.hasTests,
          needsOptimization: componentData.fileSize > 10000 || !componentData.hasTests
        };
      }
    }

    // Update summary
    this.coverageData.summary = {
      totalComponents,
      usedComponents,
      coveragePercentage: totalComponents > 0 ? (usedComponents / totalComponents) * 100 : 0,
      totalRenderTime,
      averageRenderTime: renderCount > 0 ? totalRenderTime / renderCount : 0
    };
  }

  /**
   * Generate coverage reports
   */
  async generateReports() {
    console.log('📊 Generating coverage reports...');

    const outputDir = join(this.projectRoot, '.shadcn-coverage');

    // Generate JSON report
    writeFileSync(
      join(outputDir, 'coverage-report.json'),
      JSON.stringify(this.coverageData, null, 2)
    );

    // Generate markdown report
    const markdownReport = this.generateMarkdownReport();
    writeFileSync(
      join(outputDir, 'coverage-report.md'),
      markdownReport
    );

    // Generate CSV for spreadsheet analysis
    const csvReport = this.generateCSVReport();
    writeFileSync(
      join(outputDir, 'coverage-report.csv'),
      csvReport
    );

    // Print summary to console
    this.printSummary();
  }

  /**
   * Generate markdown report
   */
  generateMarkdownReport() {
    const { summary, components, renderStats, performance } = this.coverageData;

    let markdown = `# shadcn/ui Performance & Render Coverage Report

Generated: ${this.coverageData.timestamp}

## Summary

- **Total Components**: ${summary.totalComponents}
- **Used Components**: ${summary.usedComponents}
- **Coverage Percentage**: ${summary.coveragePercentage.toFixed(1)}%
- **Average Render Time**: ${summary.averageRenderTime.toFixed(2)}ms

## Component Coverage

| Component | Exists | Used | File Size | Has Tests | Usage % | Status |
|-----------|--------|------|-----------|-----------|---------|--------|
`;

    for (const [componentName, data] of Object.entries(components)) {
      if (data.exists) {
        const stats = renderStats[componentName] || {};
        const status = stats.isOptimized ? '✅ Optimized' : stats.needsOptimization ? '⚠️ Needs Work' : '📝 Basic';

        markdown += `| ${componentName} | ✅ | ${stats.usageCount || 0} | ${(data.fileSize / 1024).toFixed(1)}KB | ${data.hasTests ? '✅' : '❌'} | ${(stats.usagePercentage || 0).toFixed(1)}% | ${status} |\n`;
      } else {
        markdown += `| ${componentName} | ❌ | 0 | - | - | - | 🚫 Not Implemented |\n`;
      }
    }

    markdown += `

## Performance Metrics

- **Build Time**: ${performance.buildTime || 'N/A'}
- **Bundle Size**: ${performance.bundleSize || 'N/A'}
- **Largest Assets**: ${performance.largestAssets?.join(', ') || 'N/A'}

## Recommendations

`;

    // Add recommendations based on coverage data
    if (summary.coveragePercentage < 50) {
      markdown += "- 🎯 **Low Coverage**: Consider implementing more shadcn/ui components for consistency\n";
    }

    const componentsNeedingTests = Object.values(components).filter(c => c.exists && !c.hasTests).length;
    if (componentsNeedingTests > 0) {
      markdown += `- 🧪 **Missing Tests**: ${componentsNeedingTests} components lack test coverage\n`;
    }

    const componentsNeedingOptimization = Object.entries(renderStats)
      .filter(([_, stats]) => stats.needsOptimization).length;
    if (componentsNeedingOptimization > 0) {
      markdown += `- ⚡ **Performance**: ${componentsNeedingOptimization} components need optimization\n`;
    }

    return markdown;
  }

  /**
   * Generate CSV report
   */
  generateCSVReport() {
    let csv = 'Component,Exists,Used,FileSizeKB,HasTests,UsagePercentage,Status,NeedsOptimization\n';

    for (const [componentName, data] of Object.entries(this.coverageData.components)) {
      const stats = this.coverageData.renderStats[componentName] || {};
      const status = data.exists ? (stats.isOptimized ? 'Optimized' : stats.needsOptimization ? 'Needs Work' : 'Basic') : 'Not Implemented';

      csv += `${componentName},${data.exists},${stats.usageCount || 0},${data.exists ? (data.fileSize / 1024).toFixed(1) : 0},${data.hasTests},${(stats.usagePercentage || 0).toFixed(1)},${status},${stats.needsOptimization || false}\n`;
    }

    return csv;
  }

  /**
   * Print summary to console
   */
  printSummary() {
    const { summary } = this.coverageData;

    console.log('\n📋 shadcn/ui Coverage Summary:');
    console.log(`   Total Components: ${summary.totalComponents}`);
    console.log(`   Used Components: ${summary.usedComponents}`);
    console.log(`   Coverage: ${summary.coveragePercentage.toFixed(1)}%`);
    console.log(`   Avg Render Time: ${summary.averageRenderTime.toFixed(2)}ms`);
    console.log('\n📁 Reports generated in: .shadcn-coverage/');
    console.log('   - coverage-report.json');
    console.log('   - coverage-report.md');
    console.log('   - coverage-report.csv');
  }

  // Helper methods for extraction and analysis
  extractImports(content) {
    const importRegex = /import\s+.*?from\s+['"]([^'"]+)['"]/g;
    const imports = [];
    let match;
    while ((match = importRegex.exec(content)) !== null) {
      imports.push(match[1]);
    }
    return imports;
  }

  extractExports(content) {
    const exportRegex = /export\s+(?:default\s+)?(?:function|const|class)\s+(\w+)/g;
    const exports = [];
    let match;
    while ((match = exportRegex.exec(content)) !== null) {
      exports.push(match[1]);
    }
    return exports;
  }

  extractDependencies(content) {
    const deps = this.extractImports(content).filter(imp =>
      imp.startsWith('@/lib/') ||
      imp.startsWith('@/components/') ||
      imp.includes('radix-ui') ||
      imp.includes('class-variance-authority') ||
      imp.includes('lucide-react')
    );
    return deps;
  }

  extractPropsInterface(content) {
    const interfaceRegex = /interface\s+(\w*Props)\s*{([^}]+)}/s;
    const match = interfaceRegex.exec(content);
    return match ? match[1] : null;
  }

  hasStyling(content) {
    return /cn\(|className|class-variance-authority|tailwind/.test(content);
  }

  hasTestFile(filePath) {
    const testPath = filePath.replace(/\.(tsx?|jsx?)$/, '.test.$1') ||
                    filePath.replace(/\.(tsx?|jsx?)$/, '.spec.$1');
    return existsSync(testPath);
  }

  extractVariants(content, componentName) {
    const variants = [];

    // Look for variant patterns
    if (content.includes('variants')) {
      const variantRegex = /(\w+):\s*{([^}]+)}/g;
      let match;
      while ((match = variantRegex.exec(content)) !== null) {
        variants.push(match[1]);
      }
    }

    // Look for size variants
    if (content.includes('size') || content.includes('variant')) {
      variants.push('size');
      variants.push('variant');
    }

    return variants;
  }

  extractComponentUsage(content) {
    const usedComponents = [];

    for (const component of this.shadcnComponents) {
      // Check for direct imports
      if (content.includes(`import.*${component}`) ||
          content.includes(`from ['"].*${component}['"]`) ||
          // Check for JSX usage
          content.includes(`<${component}`) ||
          content.includes(`<${component.replace(/-(\w)/g, (m, c) => c.toUpperCase())}`)) {
        usedComponents.push(component);
      }
    }

    return usedComponents;
  }

  calculateRenderComplexity(content) {
    // Simple heuristic: count components, hooks, and conditional rendering
    let complexity = 0;

    // Count component instances
    complexity += (content.match(/<[A-Z][a-zA-Z]*/g) || []).length * 2;

    // Count hooks
    complexity += (content.match(/use[A-Z]/g) || []).length * 3;

    // Count conditional rendering
    complexity += (content.match(/{.*\?.*:/g) || []).length * 1;

    // Count map operations
    complexity += (content.match(/\.map\(/g) || []).length * 2;

    return complexity;
  }

  hasServerComponents(content) {
    return content.includes('use server') || !content.includes('use client');
  }

  hasClientComponents(content) {
    return content.includes('use client') || content.includes('useState') || content.includes('useEffect');
  }

  extractBuildTime(buildOutput) {
    const match = buildOutput.match(/(?:Build completed in|took)(\s+\d+\.\d+\s+\w+)/i);
    return match ? match[1].trim() : null;
  }

  extractBundleSize(buildOutput) {
    const match = buildOutput.match(/Total size:\s+(\d+\.\d+\s+\w+)/i);
    return match ? match[1].trim() : null;
  }

  extractLargestAssets(buildOutput) {
    const assets = [];
    const lines = buildOutput.split('\n');

    for (const line of lines) {
      if (line.includes('KB') || line.includes('MB')) {
        const match = line.match(/(\d+\.\d+\s+[KM]B)\s+(\S+)/);
        if (match) {
          assets.push(`${match[2]} (${match[1]})`);
        }
      }
    }

    return assets.slice(0, 5); // Top 5 largest assets
  }

  extractOptimizationWarnings(buildOutput) {
    const warnings = [];
    const lines = buildOutput.split('\n');

    for (const line of lines) {
      if (line.toLowerCase().includes('warning') &&
          (line.includes('large') || line.includes('unused') || line.includes('optimization'))) {
        warnings.push(line.trim());
      }
    }

    return warnings;
  }
}

// Run the tracker if this script is executed directly
if (import.meta.url === `file://${process.argv[1]}`) {
  const tracker = new ShadcnPerformanceTracker();
  tracker.initialize().catch(console.error);
}

export default ShadcnPerformanceTracker;
