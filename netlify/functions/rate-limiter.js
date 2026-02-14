import { validateEnvironment, printValidation } from './validate-env.mjs';

export async function handler(event, context) {
  // Get form name from request or default to general rate limiting
  const formName = event.queryStringParameters?.form || 'general';

  // Rate limiting variables - different limits for different forms
  const RATE_LIMITS = {
    contact: {
      window: 5 * 60 * 1000, // 5 minutes
      maxRequests: 3, // 3 contact submissions per 5 minutes
    },
    newsletter: {
      window: 30 * 60 * 1000, // 30 minutes
      maxRequests: 5, // 5 newsletter subscriptions per 30 minutes
    },
    general: {
      window: 60 * 1000, // 1 minute
      maxRequests: 10, // 10 general requests per minute
    },
  };

  const { window: RATE_LIMIT_WINDOW, maxRequests: RATE_LIMIT_MAX_REQUESTS } =
    RATE_LIMITS[formName] || RATE_LIMITS.general;

  // Get client IP from various headers
  const getClientIP = headers => {
    return (
      headers['x-forwarded-for']?.split(',')[0] ||
      headers['x-real-ip'] ||
      headers['client-ip'] ||
      event.requestContext.identity?.sourceIp ||
      'unknown'
    );
  };

  // Simple in-memory rate limiting (in production, use Redis or similar)
  const rateLimitStore = new Map();

  const clientIP = getClientIP(event.headers);
  const currentTime = Date.now();

  // Clean old entries for current form type
  const formKey = `${formName}_${clientIP}`;
  let ipRequests = rateLimitStore.get(formKey) || [];

  // Clean old entries based on form-specific window
  const validRequests = ipRequests.filter(time => currentTime - time < RATE_LIMIT_WINDOW);
  if (validRequests.length === 0) {
    rateLimitStore.delete(formKey);
    ipRequests = [];
  } else {
    rateLimitStore.set(formKey, validRequests);
    ipRequests = validRequests;
  }

  // Check current IP for this form
  if (ipRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60',
      },
      body: JSON.stringify({
        error: 'Too many requests',
        message: `Rate limit exceeded for ${formName} form. Please try again later.`,
        form: formName,
        retryAfter: Math.round(RATE_LIMIT_WINDOW / 1000), // seconds
      }),
    };
  }

  // Add current request to tracking
  ipRequests.push(currentTime);
  rateLimitStore.set(formKey, ipRequests);

  // Continue with original function logic
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
      'X-RateLimit-Remaining': Math.max(0, RATE_LIMIT_MAX_REQUESTS - ipRequests.length).toString(),
      'X-RateLimit-Reset': new Date(currentTime + RATE_LIMIT_WINDOW).toISOString(),
      'X-Form-Type': formName,
    },
    body: JSON.stringify({
      message: 'Rate limit check passed',
      form: formName,
      ip: clientIP.replace(/\d+\.\d+\.\d+\./, 'xxx.xxx.xxx.'), // Partially mask IP
      requestsRemaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - ipRequests.length),
      windowMinutes: Math.round(RATE_LIMIT_WINDOW / 60000),
    }),
  };
}
