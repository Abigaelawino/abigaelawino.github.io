// Shared form validation utilities
export const FORM_CONSTANTS = {
  EMAIL_REGEX: /^[^\s@]+@[^\s@]+\.[^\s@]+$/,
  MIN_MESSAGE_LENGTH: 10,
  MAX_MESSAGE_LENGTH: 1000,
  MAX_NAME_LENGTH: 100,
  MAX_SUBJECT_LENGTH: 200,
  MAX_EMAIL_LENGTH: 255,
  SUSPICIOUS_PATTERNS: [
    /<script.*?>/gi,
    /javascript:/gi,
    /http[s]?:\/\/(?!www\.(youtube|youtu\.be|linkedin|twitter|x)\.com)/gi,
    /\[url\=/gi,
    /\[link\=/gi,
    /\[a href=/gi,
    /<a\s+href/gi,
    /onclick\s*=/gi,
    /onerror\s*=/gi,
    /onload\s*=/gi
  ]
};

export const RATE_LIMITS = {
  contact: {
    window: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3, // 3 contact submissions per 5 minutes
    message: 'Too many contact submissions. Please wait {minutes} minutes.'
  },
  newsletter: {
    window: 30 * 60 * 1000, // 30 minutes
    maxRequests: 5, // 5 newsletter subscriptions per 30 minutes
    message: 'Too many subscription attempts. Please wait {minutes} minutes.'
  }
};

export function validateEmail(email: string): boolean {
  return FORM_CONSTANTS.EMAIL_REGEX.test(email);
}

export function checkSuspiciousContent(content: string): boolean {
  return FORM_CONSTANTS.SUSPICIOUS_PATTERNS.some(pattern => pattern.test(content));
}

export function validateField(value: string, rules: {
  required?: boolean;
  minLength?: number;
  maxLength?: number;
  type?: 'email' | 'text' | 'textarea';
}): string | null {
  if (rules.required && (!value || value.trim() === '')) {
    return 'This field is required';
  }

  if (value) {
    const trimmedValue = value.trim();
    
    if (rules.minLength && trimmedValue.length < rules.minLength) {
      return `Must be at least ${rules.minLength} characters`;
    }
    
    if (rules.maxLength && value.length > rules.maxLength) {
      return `Must be less than ${rules.maxLength} characters`;
    }
    
    if (rules.type === 'email' && !validateEmail(trimmedValue)) {
      return 'Please enter a valid email address';
    }
    
    if (rules.type === 'textarea' && checkSuspiciousContent(value)) {
      return 'Content contains suspicious patterns';
    }
  }
  
  return null;
}

export function calculateRateLimit(
  submitCount: number,
  lastSubmitTime: number,
  formType: 'contact' | 'newsletter'
): { allowed: boolean; remainingTime?: number } {
  const rateLimit = RATE_LIMITS[formType];
  const now = Date.now();
  const timeSinceLastSubmit = now - lastSubmitTime;
  
  if (submitCount >= rateLimit.maxRequests && timeSinceLastSubmit < rateLimit.window) {
    const remainingTime = Math.ceil((rateLimit.window - timeSinceLastSubmit) / 1000 / 60);
    return { allowed: false, remainingTime };
  }
  
  return { allowed: true };
}

export function formatRateLimitMessage(remainingTime: number, formType: 'contact' | 'newsletter'): string {
  return RATE_LIMITS[formType].message.replace('{minutes}', remainingTime.toString());
}

// Generate random ID for tracking form submissions
export function generateFormId(): string {
  return `form_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
}

// Check if form submission is legitimate
export function validateFormSubmission(
  formData: Record<string, string>,
  timestamp: number,
  userAgent: string,
  currentUserAgent: string
): { valid: boolean; errors: Record<string, string> } {
  const errors: Record<string, string> = {};
  const now = Date.now();
  
  // Check timing
  if (now - timestamp < 2000) {
    errors.timing = 'Form submitted too quickly';
  }
  
  if (now - timestamp > 60 * 60 * 1000) {
    errors.timing = 'Form session expired';
  }
  
  // Check user agent
  if (userAgent && userAgent !== currentUserAgent) {
    errors.security = 'Security validation failed';
  }
  
  // Check honeypot
  if (formData['bot-field'] && formData['bot-field'].trim() !== '') {
    errors.honeypot = 'Bot detected';
  }
  
  return {
    valid: Object.keys(errors).length === 0,
    errors
  };
}