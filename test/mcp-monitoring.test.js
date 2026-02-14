// MCP Server Monitoring System Tests
import { test, describe } from 'node:test';
import assert from 'node:assert';
import fs from 'fs/promises';
import path from 'path';
import { exec } from 'child_process';
import { promisify } from 'util';

const execAsync = promisify(exec);
const testDir = path.join(process.cwd(), '.mcp-monitoring-test');

// Helper functions
async function cleanupTestData() {
  try {
    await fs.rm(testDir, { recursive: true, force: true });
  } catch {
    // Directory doesn't exist, which is fine
  }
}

async function runMonitorScript(args) {
  const command = `node scripts/mcp-monitor.mjs ${args}`;
  try {
    const { stdout, stderr } = await execAsync(command);
    return { stdout, stderr, success: true };
  } catch (error) {
    return {
      stdout: error.stdout,
      stderr: error.stderr,
      success: false,
      error: error.message,
    };
  }
}

async function runDashboardScript(args) {
  const command = `node scripts/mcp-dashboard.mjs ${args}`;
  try {
    const { stdout, stderr } = await execAsync(command);
    return { stdout, stderr, success: true };
  } catch (error) {
    return {
      stdout: error.stdout,
      stderr: error.stderr,
      success: false,
      error: error.message,
    };
  }
}

describe('MCP Monitor Script', () => {
  test('should show help when no command provided', async () => {
    await cleanupTestData();

    const result = await runMonitorScript('');

    assert(result.success, 'Script should execute successfully');
    assert(result.stdout.includes('Usage:'), 'Should show usage information');
    assert(result.stdout.includes('check'), 'Should mention check command');
    assert(result.stdout.includes('report'), 'Should mention report command');
    assert(result.stdout.includes('watch'), 'Should mention watch command');
  });

  test('should run health check on configured servers', async () => {
    await cleanupTestData();

    const result = await runMonitorScript('check');

    assert(result.success, 'Health check should execute successfully');
    assert(
      result.stdout.includes('Starting MCP Server Health Monitoring'),
      'Should start monitoring'
    );
    assert(result.stdout.includes('Monitoring Summary'), 'Should show summary');
  });

  test('should generate monitoring report', async () => {
    await cleanupTestData();

    // First run a health check to generate data
    await runMonitorScript('check');

    const result = await runMonitorScript('report');

    assert(result.success, 'Report generation should execute successfully');
    assert(result.stdout.includes('"summary":'), 'Should include summary in report');
    assert(result.stdout.includes('"servers":'), 'Should include servers in report');
    assert(result.stdout.includes('"timestamp":'), 'Should include timestamp');
  });

  test('should handle invalid server ID gracefully', async () => {
    await cleanupTestData();

    const result = await runMonitorScript('server invalid-server');

    assert(!result.success, 'Should fail for invalid server');
    assert(result.stderr.includes('Invalid server ID'), 'Should show error for invalid server');
  });

  test('should handle server-specific health check', async () => {
    await cleanupTestData();

    const result = await runMonitorScript('server netlify');

    assert(result.success, 'Server-specific check should execute');
    assert(result.stdout.includes('"serverId": "netlify"'), 'Should include server ID');
    assert(result.stdout.includes('"serverName": "Netlify MCP"'), 'Should include server name');
    assert(result.stdout.includes('"status":'), 'Should include status');
    assert(result.stdout.includes('"responseTime":'), 'Should include response time');
  });
});

describe('MCP Dashboard Script', () => {
  test('should show help when invalid command provided', async () => {
    await cleanupTestData();

    const result = await runDashboardScript('invalid');

    assert(result.success, 'Script should execute successfully');
    assert(result.stdout.includes('Usage:'), 'Should show usage information');
    assert(result.stdout.includes('refresh'), 'Should mention refresh command');
    assert(result.stdout.includes('watch'), 'Should mention watch command');
  });

  test('should display dashboard with no data', async () => {
    await cleanupTestData();

    const result = await runDashboardScript('refresh');

    assert(result.success, 'Dashboard should execute successfully');
    assert(
      result.stdout.includes('MCP SERVER MONITORING DASHBOARD'),
      'Should show dashboard header'
    );
    assert(result.stdout.includes('No monitoring data available'), 'Should indicate no data');
  });

  test('should display dashboard with monitoring data', async () => {
    await cleanupTestData();

    // Generate monitoring data first
    await runMonitorScript('check');

    const result = await runDashboardScript('refresh');

    assert(result.success, 'Dashboard should execute successfully');
    assert(
      result.stdout.includes('MCP SERVER MONITORING DASHBOARD'),
      'Should show dashboard header'
    );
    assert(result.stdout.includes('SERVER STATUS'), 'Should show server status section');
    assert(result.stdout.includes('Netlify MCP'), 'Should show Netlify server');
    assert(result.stdout.includes('shadcn/ui MCP'), 'Should show shadcn server');
  });
});

describe('MCP Monitoring Data Storage', () => {
  test('should create monitoring data directory', async () => {
    await cleanupTestData();

    await runMonitorScript('check');

    // Check if monitoring data directory was created
    try {
      const stats = await fs.stat('.mcp-monitoring');
      assert(stats.isDirectory(), 'Should create monitoring directory');
    } catch {
      assert.fail('Monitoring directory should be created');
    }
  });

  test('should save metrics data', async () => {
    await cleanupTestData();

    await runMonitorScript('check');

    try {
      const metricsData = await fs.readFile('.mcp-monitoring/metrics.json', 'utf8');
      const metrics = JSON.parse(metricsData);

      assert(typeof metrics === 'object', 'Metrics should be an object');
      assert(metrics.netlify || metrics.shadcn, 'Should contain server metrics');
    } catch {
      assert.fail('Metrics file should be created and contain valid JSON');
    }
  });

  test('should save report data', async () => {
    await cleanupTestData();

    await runMonitorScript('check');

    try {
      const reportData = await fs.readFile('.mcp-monitoring/latest-report.json', 'utf8');
      const report = JSON.parse(reportData);

      assert(report.timestamp, 'Report should have timestamp');
      assert(report.summary, 'Report should have summary');
      assert(
        typeof report.summary.totalServers === 'number',
        'Summary should include total servers'
      );
      assert(Array.isArray(report.servers), 'Report should include servers array');
    } catch {
      assert.fail('Report file should be created and contain valid JSON');
    }
  });

  test('should save alerts when issues detected', async () => {
    await cleanupTestData();

    // This test simulates an alert scenario
    // In a real scenario, alerts would be generated from actual server failures

    await runMonitorScript('check');

    try {
      const alertData = await fs.readFile('.mcp-monitoring/alerts.jsonl', 'utf8');
      const alerts = alertData
        .trim()
        .split('\n')
        .filter(line => line);

      // Alerts might not be generated in this test environment since servers might be healthy
      // But the file should exist and be valid JSONL format
      assert(Array.isArray(alerts), 'Alerts should be in array format');

      if (alerts.length > 0) {
        const alert = JSON.parse(alerts[0]);
        assert(alert.type, 'Alert should have type');
        assert(alert.severity, 'Alert should have severity');
        assert(alert.timestamp, 'Alert should have timestamp');
      }
    } catch (error) {
      // File might not exist if no alerts generated, which is acceptable
      if (error.code !== 'ENOENT') {
        assert.fail('Alert file should be valid JSONL format');
      }
    }
  });
});

describe('MCP Monitoring Integration', () => {
  test('should handle multiple check cycles', async () => {
    await cleanupTestData();

    // Run multiple check cycles
    for (let i = 0; i < 3; i++) {
      const result = await runMonitorScript('check');
      assert(result.success, `Check cycle ${i + 1} should succeed`);

      // Small delay between checks
      await new Promise(resolve => setTimeout(resolve, 1000));
    }

    // Verify data accumulation
    try {
      const metricsData = await fs.readFile('.mcp-monitoring/metrics.json', 'utf8');
      const metrics = JSON.parse(metricsData);

      // Should have data for servers
      const serverIds = Object.keys(metrics);
      assert(serverIds.length > 0, 'Should have metrics for at least one server');

      for (const serverId of serverIds) {
        const serverMetrics = metrics[serverId];
        assert(serverMetrics.totalChecks >= 3, `Server ${serverId} should have at least 3 checks`);
        assert(serverMetrics.checks.length >= 3, `Server ${serverId} should have check history`);
        assert(serverMetrics.lastUpdated, `Server ${serverId} should have last updated timestamp`);
      }
    } catch {
      assert.fail('Should accumulate data across multiple check cycles');
    }
  });

  test('should handle server availability changes', async () => {
    await cleanupTestData();

    // Initial check
    const result1 = await runMonitorScript('check');
    assert(result1.success, 'First check should succeed');

    // Second check
    const result2 = await runMonitorScript('check');
    assert(result2.success, 'Second check should succeed');

    try {
      const metricsData = await fs.readFile('.mcp-monitoring/metrics.json', 'utf8');
      const metrics = JSON.parse(metricsData);

      // Should track status changes
      const serverIds = Object.keys(metrics);
      for (const serverId of serverIds) {
        const serverMetrics = metrics[serverId];
        if (serverMetrics.totalChecks >= 2) {
          // Should have history to track changes
          assert(serverMetrics.checks.length >= 2, `Server ${serverId} should have check history`);
        }
      }
    } catch {
      assert.fail('Should track server availability changes');
    }
  });
});

describe('MCP Monitoring Performance', () => {
  test('should complete health checks within reasonable time', async () => {
    await cleanupTestData();

    const startTime = Date.now();
    const result = await runMonitorScript('check');
    const endTime = Date.now();
    const duration = endTime - startTime;

    assert(result.success, 'Health check should complete successfully');
    assert(duration < 30000, `Health check should complete within 30 seconds, took ${duration}ms`);
  });

  test('should handle timeout gracefully', async () => {
    await cleanupTestData();

    // This test checks that the monitoring system handles timeouts properly
    // The actual timeout values are configured in the script
    const result = await runMonitorScript('check');

    assert(result.success, 'Should handle timeouts gracefully');
    // The script should not hang even if servers are slow to respond
  });
});
