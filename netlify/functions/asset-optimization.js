const fs = require('fs');
const path = require('path');
const { createGzip, createDeflate } = require('zlib');
const { pipeline } = require('stream');
const { promisify } = require('util');

const pipelineAsync = promisify(pipeline);

// Build optimization for static assets
exports.handler = async function(event, context) {
  const { httpMethod } = event;

  try {
    switch (httpMethod) {
      case 'POST':
        return await optimizeAssets(event);
      case 'GET':
        return await getOptimizationStatus(event);
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' })
        };
    }
  } catch (error) {
    console.error('Asset optimization error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Optimize assets during build
async function optimizeAssets(event) {
  const { body } = event;
  
  if (!body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing request body' })
    };
  }

  try {
    const config = JSON.parse(body);
    const { assetPath, outputPath = 'dist' } = config;

    if (!assetPath) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: 'assetPath is required' })
      };
    }

    const results = await performOptimization(assetPath, outputPath);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Asset optimization completed',
        results
      })
    };
  } catch (parseError) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' })
    };
  }
}

// Get optimization status
async function getOptimizationStatus(event) {
  const { queryStringParameters } = event;
  const { assetPath } = queryStringParameters || {};

  if (assetPath) {
    const stats = await getAssetStats(assetPath);
    return {
      statusCode: 200,
      body: JSON.stringify({ stats })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Asset optimization service is running',
      timestamp: new Date().toISOString()
    })
  };
}

// Perform asset optimization
async function performOptimization(assetPath, outputPath) {
  const results = {
    originalSize: 0,
    optimizedSize: 0,
    compressionRatio: 0,
    filesProcessed: 0,
    optimizations: []
  };

  try {
    const fullPath = path.resolve(assetPath);
    const outputFullPath = path.resolve(outputPath);

    if (!fs.existsSync(fullPath)) {
      throw new Error(`Asset path does not exist: ${fullPath}`);
    }

    // Process different file types
    if (fs.statSync(fullPath).isDirectory()) {
      await processDirectory(fullPath, outputFullPath, results);
    } else {
      await processFile(fullPath, outputFullPath, results);
    }

    // Calculate compression ratio
    if (results.originalSize > 0) {
      results.compressionRatio = ((results.originalSize - results.optimizedSize) / results.originalSize * 100).toFixed(2);
    }

    return results;
  } catch (error) {
    console.error('Optimization failed:', error);
    throw error;
  }
}

// Process directory recursively
async function processDirectory(inputPath, outputPath, results) {
  const items = fs.readdirSync(inputPath);

  for (const item of items) {
    const inputItemPath = path.join(inputPath, item);
    const outputItemPath = path.join(outputPath, item);

    if (fs.statSync(inputItemPath).isDirectory()) {
      fs.mkdirSync(outputItemPath, { recursive: true });
      await processDirectory(inputItemPath, outputItemPath, results);
    } else {
      await processFile(inputItemPath, outputItemPath, results);
    }
  }
}

// Process individual file
async function processFile(inputPath, outputPath, results) {
  const ext = path.extname(inputPath).toLowerCase();
  const stats = fs.statSync(inputPath);
  const originalSize = stats.size;

  results.originalSize += originalSize;
  results.filesProcessed++;

  let optimizedSize = originalSize;
  const optimization = {
    file: path.basename(inputPath),
    originalSize,
    optimizedSize,
    techniques: []
  };

  try {
    // Ensure output directory exists
    fs.mkdirSync(path.dirname(outputPath), { recursive: true });

    switch (ext) {
      case '.css':
        optimizedSize = await optimizeCSS(inputPath, outputPath, optimization);
        break;
      case '.js':
        optimizedSize = await optimizeJS(inputPath, outputPath, optimization);
        break;
      case '.html':
        optimizedSize = await optimizeHTML(inputPath, outputPath, optimization);
        break;
      case '.png':
      case '.jpg':
      case '.jpeg':
      case '.svg':
        optimizedSize = await optimizeImage(inputPath, outputPath, optimization);
        break;
      default:
        // Copy file as-is
        fs.copyFileSync(inputPath, outputPath);
        optimization.techniques.push('copied');
    }

    results.optimizedSize += optimizedSize;
    results.optimizations.push(optimization);
  } catch (error) {
    console.error(`Failed to optimize ${inputPath}:`, error);
    // Copy original file if optimization fails
    fs.copyFileSync(inputPath, outputPath);
    optimizedSize = originalSize;
    optimization.techniques.push('fallback');
    results.optimizedSize += optimizedSize;
  }
}

// Optimize CSS files
async function optimizeCSS(inputPath, outputPath, optimization) {
  let content = fs.readFileSync(inputPath, 'utf8');
  
  // Minify CSS
  content = content
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
    .replace(/\s*{\s*/g, '{') // Remove spaces around braces
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*;\s*/g, ';') // Remove spaces around semicolons
    .replace(/\s*:\s*/g, ':') // Remove spaces around colons
    .replace(/\s*,\s*/g, ',') // Remove spaces around commas
    .trim();

  fs.writeFileSync(outputPath, content, 'utf8');
  optimization.techniques.push('css-minify');
  
  return Buffer.byteLength(content, 'utf8');
}

// Optimize JavaScript files
async function optimizeJS(inputPath, outputPath, optimization) {
  let content = fs.readFileSync(inputPath, 'utf8');
  
  // Basic minification
  content = content
    .replace(/\/\*[\s\S]*?\*\//g, '') // Remove block comments
    .replace(/\/\/.*$/gm, '') // Remove line comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/;\s*}/g, '}') // Remove unnecessary semicolons
    .replace(/\s*{\s*/g, '{')
    .replace(/\s*}\s*/g, '}')
    .replace(/\s*;\s*/g, ';')
    .replace(/\s*,\s*/g, ',')
    .trim();

  fs.writeFileSync(outputPath, content, 'utf8');
  optimization.techniques.push('js-minify');
  
  return Buffer.byteLength(content, 'utf8');
}

// Optimize HTML files
async function optimizeHTML(inputPath, outputPath, optimization) {
  let content = fs.readFileSync(inputPath, 'utf8');
  
  // Basic minification
  content = content
    .replace(/<!--[\s\S]*?-->/g, '') // Remove HTML comments
    .replace(/\s+/g, ' ') // Collapse whitespace
    .replace(/>\s+</g, '><') // Remove whitespace between tags
    .trim();

  fs.writeFileSync(outputPath, content, 'utf8');
  optimization.techniques.push('html-minify');
  
  return Buffer.byteLength(content, 'utf8');
}

// Optimize images
async function optimizeImage(inputPath, outputPath, optimization) {
  // For now, just copy the file
  // In production, you'd use sharp or similar for image optimization
  fs.copyFileSync(inputPath, outputPath);
  optimization.techniques.push('image-copied');
  
  const stats = fs.statSync(outputPath);
  return stats.size;
}

// Get asset statistics
async function getAssetStats(assetPath) {
  try {
    const fullPath = path.resolve(assetPath);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      return await getDirectoryStats(fullPath);
    } else {
      return {
        type: 'file',
        size: stats.size,
        modified: stats.mtime.toISOString(),
        path: fullPath
      };
    }
  } catch (error) {
    throw new Error(`Failed to get stats for ${assetPath}: ${error.message}`);
  }
}

// Get directory statistics
async function getDirectoryStats(dirPath) {
  let totalSize = 0;
  let fileCount = 0;
  const files = [];

  const items = fs.readdirSync(dirPath);
  
  for (const item of items) {
    const itemPath = path.join(dirPath, item);
    const itemStats = fs.statSync(itemPath);
    
    if (itemStats.isDirectory()) {
      const subStats = await getDirectoryStats(itemPath);
      totalSize += subStats.totalSize;
      fileCount += subStats.fileCount;
    } else {
      totalSize += itemStats.size;
      fileCount++;
      files.push({
        name: item,
        size: itemStats.size,
        modified: itemStats.mtime.toISOString()
      });
    }
  }

  return {
    type: 'directory',
    totalSize,
    fileCount,
    path: dirPath,
    files: files.sort((a, b) => b.size - a.size).slice(0, 20) // Top 20 largest files
  };
}