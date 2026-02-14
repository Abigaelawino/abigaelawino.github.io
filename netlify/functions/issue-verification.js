const crypto = require('crypto');

// Verify GitHub webhook signature
function verifySignature(payload, signature, secret) {
  const hmac = crypto.createHmac('sha256', secret);
  const digest = `sha256=${hmac.update(payload).digest('hex')}`;
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(digest));
}

// Store verification data (in production, use a proper database)
const verificationStore = new Map();

// Main handler function
exports.handler = async function (event, context) {
  const signature = event.headers['x-hub-signature-256'];
  const githubEvent = event.headers['x-github-event'];
  const webhookSecret = process.env.GITHUB_WEBHOOK_SECRET;

  if (!webhookSecret) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Webhook secret not configured' }),
    };
  }

  if (!signature) {
    return {
      statusCode: 400,
      body: JSON.stringify({ error: 'Missing signature' }),
    };
  }

  try {
    // Verify webhook signature
    if (!verifySignature(event.body, signature, webhookSecret)) {
      return {
        statusCode: 401,
        body: JSON.stringify({ error: 'Invalid signature' }),
      };
    }

    const payload = JSON.parse(event.body);

    // Only process issues events
    if (githubEvent !== 'issues') {
      return {
        statusCode: 200,
        body: JSON.stringify({ message: `Event ${githubEvent} not processed by issue verifier` }),
      };
    }

    return await handleIssueVerification(payload);
  } catch (error) {
    console.error('Issue verification error:', error);
    return {
      statusCode: 500,
      body: JSON.stringify({ error: 'Internal server error' }),
    };
  }
};

// Handle issue verification workflow
async function handleIssueVerification(payload) {
  const { action, issue, repository, sender } = payload;

  const verificationData = {
    issueId: issue.id,
    issueNumber: issue.number,
    title: issue.title,
    state: issue.state,
    action: action,
    repository: repository.full_name,
    sender: sender.login,
    timestamp: new Date().toISOString(),
    labels: issue.labels?.map(label => label.name) || [],
  };

  // Store verification data
  verificationStore.set(issue.id, verificationData);

  console.log('Issue verification processed:', verificationData);

  // Perform verification checks
  const verificationResults = await performVerificationChecks(issue, repository);

  // Update verification data with results
  verificationData.verificationResults = verificationResults;
  verificationStore.set(issue.id, verificationData);

  // Send notification if verification fails
  if (!verificationResults.allPassed) {
    await sendVerificationNotification(verificationData, verificationResults);
  }

  return {
    statusCode: 200,
    body: JSON.stringify({
      message: 'Issue verification completed',
      verificationData,
      verificationResults,
    }),
  };
}

// Perform verification checks on the issue
async function performVerificationChecks(issue, repository) {
  const results = {
    allPassed: true,
    checks: [],
  };

  // Check 1: Issue title format
  const titleCheck = {
    name: 'title_format',
    passed: issue.title.length >= 10 && issue.title.length <= 100,
    message: 'Title should be between 10-100 characters',
  };
  results.checks.push(titleCheck);

  // Check 2: Issue body presence
  const bodyCheck = {
    name: 'body_present',
    passed: issue.body && issue.body.trim().length > 0,
    message: 'Issue should have a description',
  };
  results.checks.push(bodyCheck);

  // Check 3: Labels present
  const labelsCheck = {
    name: 'labels_present',
    passed: issue.labels && issue.labels.length > 0,
    message: 'Issue should have at least one label',
  };
  results.checks.push(labelsCheck);

  // Check 4: Assignee present
  const assigneeCheck = {
    name: 'assignee_present',
    passed: issue.assignees && issue.assignees.length > 0,
    message: 'Issue should have at least one assignee',
  };
  results.checks.push(assigneeCheck);

  // Check 5: Milestone present (optional)
  const milestoneCheck = {
    name: 'milestone_present',
    passed: issue.milestone !== null,
    message: 'Issue should be assigned to a milestone',
  };
  results.checks.push(milestoneCheck);

  results.allPassed = results.checks.filter(check => check.passed).length >= 3; // Require at least 3 checks to pass

  return results;
}

// Send verification notification
async function sendVerificationNotification(verificationData, verificationResults) {
  // In production, you would send this to Slack, email, or other notification systems
  console.log('Verification failed for issue:', {
    issueNumber: verificationData.issueNumber,
    title: verificationData.title,
    failedChecks: verificationResults.checks.filter(check => !check.passed),
  });

  // Example: Send to Slack webhook if configured
  if (process.env.SLACK_WEBHOOK_URL) {
    try {
      const slackMessage = {
        text: `Issue verification failed for ${verificationData.repository}#${verificationData.issueNumber}`,
        attachments: [
          {
            color: 'warning',
            fields: [
              { title: 'Issue', value: verificationData.title, short: true },
              { title: 'State', value: verificationData.state, short: true },
              {
                title: 'Failed Checks',
                value: verificationResults.checks
                  .filter(check => !check.passed)
                  .map(check => check.message)
                  .join(', '),
                short: false,
              },
            ],
            actions: [
              {
                type: 'button',
                text: 'View Issue',
                url: `https://github.com/${verificationData.repository}/issues/${verificationData.issueNumber}`,
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
      console.error('Failed to send Slack notification:', error);
    }
  }
}

// Helper function to get verification status
exports.getVerificationStatus = function (issueId) {
  return verificationStore.get(issueId) || null;
};

// Helper function to get all verifications
exports.getAllVerifications = function () {
  return Array.from(verificationStore.values());
};
