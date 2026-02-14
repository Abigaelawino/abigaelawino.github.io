import { validateEnvironment, printValidation } from './validate-env.mjs';

export async function handler(event, context) {
  // Rate limiting variables
  const RATE_LIMIT_WINDOW = 60000; // 1 minute
  const RATE_LIMIT_MAX_REQUESTS = 10;
  
  // Get client IP from various headers
  const getClientIP = (headers) => {
    return headers['x-forwarded-for']?.split(',')[0] ||
           headers['x-real-ip'] ||
           headers['client-ip'] ||
           event.requestContext.identity?.sourceIp ||
           'unknown';
  };
  
  // Simple in-memory rate limiting (in production, use Redis or similar)
  const rateLimitStore = new Map();
  
  const clientIP = getClientIP(event.headers);
  const currentTime = Date.now();
  
  // Clean old entries
  for (const [ip, requests] of rateLimitStore.entries()) {
    const validRequests = requests.filter(time => currentTime - time < RATE_LIMIT_WINDOW);
    if (validRequests.length === 0) {
      rateLimitStore.delete(ip);
    } else {
      rateLimitStore.set(ip, validRequests);
    }
  }
  
  // Check current IP
  const ipRequests = rateLimitStore.get(clientIP) || [];
  
  if (ipRequests.length >= RATE_LIMIT_MAX_REQUESTS) {
    return {
      statusCode: 429,
      headers: {
        'Content-Type': 'application/json',
        'Retry-After': '60'
      },
      body: JSON.stringify({
        error: 'Too many requests',
        message: 'Rate limit exceeded. Please try again later.'
      })
    };
  }
  
  // Add current request to tracking
  ipRequests.push(currentTime);
  rateLimitStore.set(clientIP, ipRequests);
  
  // Continue with original function logic
  return {
    statusCode: 200,
    headers: {
      'Content-Type': 'application/json',
      'X-RateLimit-Limit': RATE_LIMIT_MAX_REQUESTS.toString(),
      'X-RateLimit-Remaining': Math.max(0, RATE_LIMIT_MAX_REQUESTS - ipRequests.length).toString(),
      'X-RateLimit-Reset': new Date(currentTime + RATE_LIMIT_WINDOW).toISOString()
    },
    body: JSON.stringify({
      message: 'Rate limit check passed',
      ip: clientIP.replace(/\d+\.\d+\.\d+\./, 'xxx.xxx.xxx.'), // Partially mask IP
      requestsRemaining: Math.max(0, RATE_LIMIT_MAX_REQUESTS - ipRequests.length)
    })
  };
}