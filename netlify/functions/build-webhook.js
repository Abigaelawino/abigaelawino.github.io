const crypto = require('crypto');
const { validateEnvironment } = require('../../scripts/validate-env.mjs');

// Verify GitHub webhook signature
function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(payload).digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Main handler function
exports.handler = async function(event, context) {
  // Validate environment variables
  const { errors } = validateEnvironment('webhook');
  if (errors.length > 0) {
    console.error('Environment validation failed:', errors);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Server configuration error' })
    };
  }
  
  const signature = event.headers['x-hub-signature-256'];
  const githubEvent = event.headers['x-github-event'];
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook secret not configured' })
    };
  }

  if (!signature) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing signature' })
    };
  }

  try {
    // Verify webhook signature
    if (!verifySignature(event.body, signature, webhookSecret)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' })
      };
    }

    const payload = JSON.parse(event.body);

    // Handle different event types
    switch (githubEvent) {
      case 'push':
        return await handlePushEvent(payload);
      case 'pull_request':
        return await handlePullRequestEvent(payload);
      case 'issues':
        return await handleIssuesEvent(payload);
      default:
        return {
          statusCode: 200,
          body: JSON.stringify({ message: `Event ${githubEvent} received but not processed` })
        };
    }
  } catch (error) {
    console.error('Webhook processing error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' })
    };
  }
};

// Handle push events to trigger builds
async function handlePushEvent(payload) {
  const { ref, repository, commits } = payload;
  
  // Only process pushes to main/master branch
  if (!ref.includes('main') && !ref.includes('master')) {
    return {
      statusCode: 200,
      body: JSON.stringify({ message: 'Ignoring non-main branch push' })
    };
  }

  console.log(`Push to ${repository.full_name}:${ref} with ${commits.length} commits`);

  // Trigger Netlify build webhook if configured
  if (process.env.NETLIFY_BUILD_HOOK) {
    try {
      const response = await fetch(process.env.NETLIFY_BUILD_HOOK, {
        method: 'POST'
      });
      
      if (!response.ok) {
        throw new Error(`Build webhook failed: ${response.statusText}`);
      }

      return {
        statusCode: 200,
        body: JSON.stringify({ 
          message: 'Build triggered successfully',
          buildUrl: response.headers.get('location') || 'Build initiated'
        })
      };
    } catch (error) {
      console.error('Failed to trigger build:', error);
      return {
        statusCode: 500,
        body: JSON.stringify({ error: 'Failed to trigger build' })
      };
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: 'Push event processed' })
  };
}

// Handle pull request events
async function handlePullRequestEvent(payload) {
  const { action, pull_request, repository } = payload;
  
  console.log(`PR ${action}: ${pull_request.title} in ${repository.full_name}`);

  // Only process opened and synchronized PRs
  if (['opened', 'synchronize'].includes(action)) {
    // Here you could trigger preview builds or other PR-specific actions
    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: `PR ${action} processed`,
        pullRequest: pull_request.html_url
      })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: `PR ${action} received but not processed` })
  };
}

// Handle issues events for issue verification
async function handleIssuesEvent(payload) {
  const { action, issue, repository } = payload;
  
  console.log(`Issue ${action}: ${issue.title} in ${repository.full_name}`);

  // Process issue events for verification workflow
  if (['opened', 'closed', 'labeled'].includes(action)) {
    // Store issue information for verification workflow
    const issueData = {
      id: issue.id,
      number: issue.number,
      title: issue.title,
      state: issue.state,
      action: action,
      repository: repository.full_name,
      timestamp: new Date().toISOString()
    };

    // Here you could store this information in a database or trigger other workflows
    console.log('Issue verification data:', issueData);

    return {
      statusCode: 200,
      body: JSON.stringify({ 
        message: `Issue ${action} processed for verification`,
        issueData
      })
    };
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: `Issue ${action} received but not processed` })
  };
}