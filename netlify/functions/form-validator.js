import { validateEnvironment, printValidation } from './validate-env.mjs';

// Simple email validation
function isValidEmail(email) {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Check for suspicious content patterns
function containsSuspiciousContent(content) {
  const suspiciousPatterns = [
    /<script.*?>/gi,
    /javascript:/gi,
    /http[s]?:\/\/(?!www\.(youtube|youtu\.be|linkedin|twitter|x)\.com)/gi, // Allow certain domains
    /\[url\=/gi,
    /\[link\=/gi,
    /\[a href=/gi,
    /<a\s+href/gi,
    /onclick\s*=/gi,
    /onerror\s*=/gi,
    /onload\s*=/gi,
  ];

  return suspiciousPatterns.some(pattern => pattern.test(content));
}

// Form-specific validation rules
const FORM_VALIDATION = {
  contact: {
    required: ['name', 'email', 'message'],
    minLength: {
      name: 2,
      message: 10,
    },
    maxLength: {
      name: 100,
      subject: 200,
      message: 1000,
      email: 255,
    },
  },
  newsletter: {
    required: ['email'],
    maxLength: {
      email: 255,
    },
  },
};

export async function handler(event, context) {
  // Only allow POST requests
  if (event.httpMethod !== 'POST') {
    return {
      statusCode: 405,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ error: 'Method not allowed' }),
    };
  }

  try {
    // Parse form data
    const formData = new URLSearchParams(event.body);
    const formName = formData.get('form-name');

    if (!formName || !FORM_VALIDATION[formName]) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ error: 'Invalid form name' }),
      };
    }

    const validation = FORM_VALIDATION[formName];
    const errors = {};

    // Check honeypot field
    const botField = formData.get('bot-field');
    if (botField && botField.trim() !== '') {
      // Bot detected - return success silently
      console.log(`Bot submission blocked for ${formName} form:`, {
        ip: event.headers['x-forwarded-for']?.split(',')[0] || 'unknown',
        userAgent: event.headers['user-agent'],
        timestamp: new Date().toISOString(),
      });

      return {
        statusCode: 200,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ message: 'Form submitted successfully' }),
      };
    }

    // Validate required fields
    validation.required.forEach(field => {
      const value = formData.get(field);
      if (!value || value.trim() === '') {
        errors[field] = `${field.charAt(0).toUpperCase() + field.slice(1)} is required`;
      }
    });

    // Validate email if present
    const email = formData.get('email');
    if (email && !isValidEmail(email)) {
      errors.email = 'Please enter a valid email address';
    }

    // Validate minimum lengths
    if (validation.minLength) {
      Object.entries(validation.minLength).forEach(([field, minLength]) => {
        const value = formData.get(field);
        if (value && value.length < minLength) {
          errors[field] =
            `${field.charAt(0).toUpperCase() + field.slice(1)} must be at least ${minLength} characters`;
        }
      });
    }

    // Validate maximum lengths
    if (validation.maxLength) {
      Object.entries(validation.maxLength).forEach(([field, maxLength]) => {
        const value = formData.get(field);
        if (value && value.length > maxLength) {
          errors[field] =
            `${field.charAt(0).toUpperCase() + field.slice(1)} must be less than ${maxLength} characters`;
        }
      });
    }

    // Check for suspicious content in message fields
    const message = formData.get('message');
    if (message && containsSuspiciousContent(message)) {
      errors.message = 'Message contains suspicious content';
    }

    // Additional security checks
    const timestamp = formData.get('timestamp');
    if (timestamp) {
      const now = Date.now();
      const formTime = parseInt(timestamp);

      // Check if form was submitted too quickly (less than 2 seconds)
      if (now - formTime < 2000) {
        errors.timing = 'Form submitted too quickly';
      }

      // Check if form is too old (more than 1 hour)
      if (now - formTime > 60 * 60 * 1000) {
        errors.timing = 'Form session expired';
      }
    }

    // Check for duplicate submissions (prevent double-submit)
    const userAgent = formData.get('user_agent');
    if (userAgent && userAgent !== event.headers['user-agent']) {
      errors.security = 'Security validation failed';
    }

    // If there are errors, return them
    if (Object.keys(errors).length > 0) {
      return {
        statusCode: 400,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          error: 'Validation failed',
          errors,
          message: 'Please fix the errors and try again',
        }),
      };
    }

    // Log successful validation for monitoring
    console.log(`Form validation passed for ${formName}:`, {
      ip: event.headers['x-forwarded-for']?.split(',')[0] || 'unknown',
      timestamp: new Date().toISOString(),
    });

    // Validation passed - continue to Netlify form processing
    return {
      statusCode: 200,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        message: 'Form validation passed',
        form: formName,
      }),
    };
  } catch (error) {
    console.error('Form validation error:', error);
    return {
      statusCode: 500,
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        error: 'Internal server error',
        message: 'An error occurred during validation',
      }),
    };
  }
}
