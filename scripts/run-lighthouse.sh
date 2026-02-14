#!/bin/bash

# Simple Lighthouse audit script using static HTML files
echo "Running Lighthouse audits on static files..."

# Pages to audit
PAGES=("index" "about" "projects" "blog" "contact" "resume")

# Create results directory
mkdir -p lighthouse-results

# Function to run audit on a single page
audit_page() {
    local page=$1
    local html_file="dist/${page}/index.html"
    
    if [[ $page == "index" ]]; then
        html_file="dist/index.html"
    fi
    
    if [[ ! -f "$html_file" ]]; then
        echo "Warning: $html_file not found, skipping audit for $page"
        return
    fi
    
    echo "Auditing $page page..."
    
    # Start a temporary server for this page
    python3 -m http.server 8080 --directory dist > /dev/null 2>&1 &
    local server_pid=$!
    
    # Wait for server to start
    sleep 2
    
    # Run Lighthouse audit
    if npx lighthouse "http://localhost:8080/${page}/" \
        --output=json \
        --output-path="lighthouse-results/lighthouse-${page}.json" \
        --chrome-flags="--headless --no-sandbox --disable-gpu" \
        --quiet; then
        
        echo "✓ Audit completed for $page"
    else
        echo "✗ Audit failed for $page"
    fi
    
    # Kill the server
    kill $server_pid 2>/dev/null || true
    wait $server_pid 2>/dev/null || true
}

# Run audits for each page
for page in "${PAGES[@]}"; do
    audit_page "$page"
    sleep 1  # Brief pause between audits
done

# Generate summary
echo "Generating summary report..."
node -e "
const fs = require('fs');
const path = require('path');

const pages = ['index', 'about', 'projects', 'blog', 'contact', 'resume'];
const results = {};

pages.forEach(page => {
    const reportPath = \`lighthouse-results/lighthouse-\${page}.json\`;
    try {
        if (fs.existsSync(reportPath)) {
            const report = JSON.parse(fs.readFileSync(reportPath, 'utf8'));
            const scores = {
                performance: Math.round(report.lhr.categories.performance.score * 100),
                accessibility: Math.round(report.lhr.categories.accessibility.score * 100),
                bestPractices: Math.round(report.lhr.categories['best-practices'].score * 100),
                seo: Math.round(report.lhr.categories.seo.score * 100),
            };
            
            const belowThreshold = Object.entries(scores)
                .filter(([cat, score]) => score < 90)
                .map(([cat]) => cat);
            
            results[page] = { scores, belowThreshold };
            
            console.log(\`\${page}: Performance=\${scores.performance}, Accessibility=\${scores.accessibility}, Best Practices=\${scores.bestPractices}, SEO=\${scores.seo}\`);
            
            if (belowThreshold.length > 0) {
                console.log(\`  ⚠️  Below 90: \${belowThreshold.join(', ')}\`);
            } else {
                console.log(\`  ✅ All scores ≥ 90\`);
            }
        }
    } catch (error) {
        console.error(\`Error processing \${page}:\`, error.message);
        results[page] = { error: error.message };
    }
});

// Save summary
fs.writeFileSync('lighthouse-results/summary.json', JSON.stringify(results, null, 2));
console.log('\\nSummary saved to lighthouse-results/summary.json');
"

echo "Lighthouse audit complete. Check lighthouse-results/ for detailed reports."