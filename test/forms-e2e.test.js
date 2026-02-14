const test = require('node:test');
const assert = require('node:assert/strict');

// Test form behavior
test('Contact form exists', () => {
  const fs = require('fs');
  const exists = fs.existsSync('./components/contact-form.tsx');
  assert(exists, 'Contact form component should exist');
  
  const content = fs.readFileSync('./components/contact-form.tsx', 'utf8');
  assert(content.includes('honeypot'), 'Contact form should have honeypot field');
  assert(content.includes('rateLimit'), 'Contact form should have rate limiting');
  assert(content.includes('validateForm'), 'Contact form should have validation');
});

test('Newsletter form exists', () => {
  const fs = require('fs');
  const exists = fs.existsSync('./components/newsletter-form.tsx');
  assert(exists, 'Newsletter form component should exist');
  
  const content = fs.readFileSync('./components/newsletter-form.tsx', 'utf8');
  assert(content.includes('honeypot'), 'Newsletter form should have honeypot field');
  assert(content.includes('rateLimit'), 'Newsletter form should have rate limiting');
  assert(content.includes('validateForm'), 'Newsletter form should have validation');
});

test('Forms have honeypot fields', () => {
  const fs = require('fs');
  const publicHtml = fs.readFileSync('./public/__forms.html', 'utf8');
  
  assert(publicHtml.includes('netlify-honeypot="bot-field"'), 'Forms should have honeypot attribute');
  assert(publicHtml.includes('<input name="bot-field"'), 'Forms should have bot field input');
});

test('Rate limiter function exists', () => {
  // Verify the rate limiter file exists
  const fs = require('fs');
  const exists = fs.existsSync('./netlify/functions/rate-limiter.js');
  assert(exists, 'Rate limiter function should exist');
});

test('Form validator function exists', () => {
  const fs = require('fs');
  const exists = fs.existsSync('./netlify/functions/form-validator.js');
  assert(exists, 'Form validator function should exist');
});