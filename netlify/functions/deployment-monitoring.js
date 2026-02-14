// Deployment monitoring and status tracking
const deploymentStore = new Map();

// Main handler function for deployment status updates
exports.handler = async function (event, context) {
  try {
    const { httpMethod } = event;

    switch (httpMethod) {
      case 'GET':
        return await getDeploymentStatus(event);
      case 'POST':
        return await updateDeploymentStatus(event);
      case 'DELETE':
        return await clearDeploymentHistory(event);
      default:
        return {
          statusCode: 405,
          body: JSON.stringify({ error: 'Method not allowed' }),
        };
    }
  } catch (error) {
    console.error('Deployment monitoring error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

// Get deployment status
async function getDeploymentStatus(event) {
  const { queryStringParameters } = event;
  const { deploymentId, repository, branch } = queryStringParameters || {};

  if (deploymentId) {
    const deployment = deploymentStore.get(deploymentId);
    return {
      statusCode: deployment ? 200 : 404,
      body: JSON.stringify(deployment || { error: 'Deployment not found' }),
    };
  }

  // Filter deployments by repository and/or branch
  let deployments = Array.from(deploymentStore.values());

  if (repository) {
    deployments = deployments.filter(d => d.repository === repository);
  }

  if (branch) {
    deployments = deployments.filter(d => d.branch === branch);
  }

  // Sort by timestamp (most recent first)
  deployments.sort((a, b) => new Date(b.timestamp) - new Date(a.timestamp));

  // Return last 20 deployments if no specific filter
  if (!deploymentId && !repository && !branch) {
    deployments = deployments.slice(0, 20);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      deployments,
      total: deployments.length,
      timestamp: new Date().toISOString(),
    }),
  };
}

// Update deployment status
async function updateDeploymentStatus(event) {
  const { body } = event;

  if (!body) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing request body' }),
    };
  }

  try {
    const deploymentData = JSON.parse(body);

    // Validate required fields
    const requiredFields = ['deploymentId', 'repository', 'branch', 'status'];
    const missingFields = requiredFields.filter(field => !deploymentData[field]);

    if (missingFields.length > 0) {
      return {
        statusCode: 400,
        body: JSON.stringify({ error: `Missing required fields: ${missingFields.join(', ')}` }),
      };
    }

    // Create or update deployment record
    const deployment = {
      deploymentId: deploymentData.deploymentId,
      repository: deploymentData.repository,
      branch: deploymentData.branch,
      status: deploymentData.status, // pending, building, success, failed, cancelled
      timestamp: new Date().toISOString(),
      buildUrl: deploymentData.buildUrl,
      commitSha: deploymentData.commitSha,
      commitMessage: deploymentData.commitMessage,
      author: deploymentData.author,
      deployUrl: deploymentData.deployUrl,
      buildTime: deploymentData.buildTime,
      error: deploymentData.error,
      environment: deploymentData.environment || 'production',
    };

    // Store deployment
    deploymentStore.set(deployment.deploymentId, deployment);

    // Trigger notifications for deployment status changes
    await handleDeploymentNotifications(deployment);

    // Update deployment metrics
    updateDeploymentMetrics(deployment);

    console.log('Deployment status updated:', deployment);

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: 'Deployment status updated successfully',
        deployment,
      }),
    };
  } catch (parseError) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Invalid JSON body' }),
    };
  }
}

// Clear deployment history
async function clearDeploymentHistory(event) {
  const { queryStringParameters } = event;
  const { olderThan } = queryStringParameters || {};

  if (olderThan) {
    // Clear deployments older than specified date
    const cutoffDate = new Date(olderThan);
    let clearedCount = 0;

    for (const [id, deployment] of deploymentStore.entries()) {
      if (new Date(deployment.timestamp) < cutoffDate) {
        deploymentStore.delete(id);
        clearedCount++;
      }
    }

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Cleared ${clearedCount} deployments older than ${olderThan}`,
        clearedCount,
      }),
    };
  } else {
    // Clear all deployments (with confirmation)
    const count = deploymentStore.size;
    deploymentStore.clear();

    return {
      statusCode: 200,
      body: JSON.stringify({
        message: `Cleared all ${count} deployments`,
        clearedCount: count,
      }),
    };
  }
}

// Handle deployment notifications
async function handleDeploymentNotifications(deployment) {
  // Send notification for failed deployments
  if (deployment.status === 'failed') {
    await sendFailureNotification(deployment);
  }

  // Send notification for successful deployments
  if (deployment.status === 'success') {
    await sendSuccessNotification(deployment);
  }
}

// Send failure notification
async function sendFailureNotification(deployment) {
  console.log('Deployment failed:', deployment);

  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      const slackMessage = {
        text: `Deployment Failed: ${deployment.repository}:${deployment.branch}`,
        attachments: [
          {
            color: 'danger',
            fields: [
              { title: 'Repository', value: deployment.repository, short: true },
              { title: 'Branch', value: deployment.branch, short: true },
              {
                title: 'Commit',
                value: deployment.commitSha?.substring(0, 7) || 'Unknown',
                short: true,
              },
              { title: 'Author', value: deployment.author || 'Unknown', short: true },
              { title: 'Error', value: deployment.error || 'Unknown error', short: false },
            ],
            actions: [
              {
                type: 'button',
                text: 'View Build',
                url: deployment.buildUrl || '#',
              },
            ],
          },
        ],
      };

      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage),
      });
    } catch (error) {
      console.error('Failed to send failure notification:', error);
    }
  }
}

// Send success notification
async function sendSuccessNotification(deployment) {
  console.log('Deployment succeeded:', deployment);

  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      const slackMessage = {
        text: `Deployment Success: ${deployment.repository}:${deployment.branch}`,
        attachments: [
          {
            color: 'good',
            fields: [
              { title: 'Repository', value: deployment.repository, short: true },
              { title: 'Branch', value: deployment.branch, short: true },
              {
                title: 'Commit',
                value: deployment.commitSha?.substring(0, 7) || 'Unknown',
                short: true,
              },
              { title: 'Author', value: deployment.author || 'Unknown', short: true },
              { title: 'Build Time', value: `${deployment.buildTime || 'Unknown'}s`, short: true },
            ],
            actions: [
              {
                type: 'button',
                text: 'View Deploy',
                url: deployment.deployUrl || '#',
              },
            ],
          },
        ],
      };

      await fetch(process.env.SLACK_WEBHOOK_URL, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(slackMessage),
      });
    } catch (error) {
      console.error('Failed to send success notification:', error);
    }
  }
}

// Update deployment metrics
function updateDeploymentMetrics(deployment) {
  // In production, you would store these in a database or metrics system
  const metrics = {
    timestamp: new Date().toISOString(),
    deploymentId: deployment.deploymentId,
    repository: deployment.repository,
    branch: deployment.branch,
    status: deployment.status,
    buildTime: deployment.buildTime,
    environment: deployment.environment,
  };

  console.log('Deployment metrics:', metrics);
}

// Helper functions for external access
exports.getDeploymentStore = function () {
  return deploymentStore;
};

exports.getDeploymentById = function (deploymentId) {
  return deploymentStore.get(deploymentId);
};
