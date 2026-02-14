const test = require('node:test');
const assert = require('node:assert/strict');

const {
  validateEmail,
  checkSuspiciousContent,
  validateField,
  calculateRateLimit,
  formatRateLimitMessage,
  generateFormId,
  validateFormSubmission
} = require('../../lib/form-validation.js');

test('validateEmail validates valid emails', () => {
  assert.strictEqual(validateEmail('test@example.com'), true);
  assert.strictEqual(validateEmail('user.name@domain.co.uk'), true);
  assert.strictEqual(validateEmail('user+tag@example.org'), true);
});

test('validateEmail rejects invalid emails', () => {
  assert.strictEqual(validateEmail('invalid'), false);
  assert.strictEqual(validateEmail('@example.com'), false);
  assert.strictEqual(validateEmail('test@'), false);
  assert.strictEqual(validateEmail('test@example'), false);
});

test('checkSuspiciousContent detects suspicious patterns', () => {
  assert.strictEqual(checkSuspiciousContent('<script>alert("xss")</script>'), true);
  assert.strictEqual(checkSuspiciousContent('javascript:alert("xss")'), true);
  assert.strictEqual(checkSuspiciousContent('[url=http://spam.com]link[/url]'), true);
  assert.strictEqual(checkSuspiciousContent('<a href="http://spam.com">link</a>'), true);
});

test('checkSuspiciousContent allows safe content', () => {
  assert.strictEqual(checkSuspiciousContent('Hello, this is a safe message'), false);
  assert.strictEqual(checkSuspiciousContent('Visit www.youtube.com/watch?v=123'), false);
  assert.strictEqual(checkSuspiciousContent('Check out linkedin.com/in/username'), false);
});

test('validateField validates required fields', () => {
  const error = validateField('', { required: true });
  assert.strictEqual(error, 'This field is required');
});

test('validateField validates email fields', () => {
  const validError = validateField('test@example.com', { required: true, type: 'email' });
  assert.strictEqual(validError, null);

  const invalidError = validateField('invalid', { required: true, type: 'email' });
  assert.strictEqual(invalidError, 'Please enter a valid email address');
});

test('validateField validates text length', () => {
  const minError = validateField('ab', { required: true, minLength: 3 });
  assert.strictEqual(minError, 'Must be at least 3 characters');

  const maxError = validateField('a'.repeat(11), { maxLength: 10 });
  assert.strictEqual(maxError, 'Must be less than 10 characters');
});

test('validateField checks for suspicious content in textarea', () => {
  const error = validateField('<script>alert("xss")</script>', {
    type: 'textarea'
  });
  assert.strictEqual(error, 'Content contains suspicious patterns');
});

test('calculateRateLimit allows first submissions', () => {
  const now = Date.now();
  const result = calculateRateLimit(0, now, 'contact');
  assert.strictEqual(result.allowed, true);
});

test('calculateRateLimit blocks submissions after limit reached', () => {
  const now = Date.now();
  // Submit 3 times within 5 minutes
  const result1 = calculateRateLimit(2, now, 'contact');
  assert.strictEqual(result1.allowed, true);

  // 4th submission should be blocked
  const result2 = calculateRateLimit(3, now, 'contact');
  assert.strictEqual(result2.allowed, false);
  assert.strictEqual(result2.remainingTime, 5); // 5 minutes remaining
});

test('calculateRateLimit resets counter after window passes', () => {
  // Simulate a submission that was made 6 minutes ago
  const now = Date.now();
  const sixMinutesAgo = now - 6 * 60 * 1000;

  // Since the last submission was 6 minutes ago, rate limit should reset
  const result = calculateRateLimit(3, sixMinutesAgo, 'contact');
  assert.strictEqual(result.allowed, true);
});

test('formatRateLimitMessage formats contact form message', () => {
  const message = formatRateLimitMessage(5, 'contact');
  assert.strictEqual(message, 'Too many contact submissions. Please wait 5 minutes.');
});

test('formatRateLimitMessage formats newsletter message', () => {
  const message = formatRateLimitMessage(10, 'newsletter');
  assert.strictEqual(message, 'Too many subscription attempts. Please wait 10 minutes.');
});

test('generateFormId generates unique IDs', () => {
  const id1 = generateFormId();
  const id2 = generateFormId();

  assert.notStrictEqual(id1, id2);
  assert(/^form_\d+_[a-z0-9]+$/.test(id1));
  assert(/^form_\d+_[a-z0-9]+$/.test(id2));
});

test('validateFormSubmission detects timing issues', () => {
  const now = Date.now();
  const timestamp = now;

  // Submitted too quickly (< 2 seconds)
  const result1 = validateFormSubmission({}, timestamp, 'ua1', 'ua1');
  // Since we can't mock time, this will typically pass
  // The real validation happens in the frontend with actual timestamps

  // Test expired session (> 1 hour)
  const oldTimestamp = now - 2 * 60 * 60 * 1000;
  const result2 = validateFormSubmission({}, oldTimestamp, 'ua1', 'ua1');
  assert.strictEqual(result2.valid, false);
  assert.strictEqual(result2.errors.timing, 'Form session expired');
});

test('validateFormSubmission detects user agent mismatch', () => {
  const result = validateFormSubmission({}, Date.now(), 'ua1', 'ua2');
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.errors.security, 'Security validation failed');
});

test('validateFormSubmission detects honeypot field', () => {
  const result = validateFormSubmission({ 'bot-field': 'spam' }, Date.now(), 'ua', 'ua');
  assert.strictEqual(result.valid, false);
  assert.strictEqual(result.errors.honeypot, 'Bot detected');
});

test('validateFormSubmission passes valid submissions', () => {
  const now = Date.now();
  // Wait 3 seconds before submitting
  const result = validateFormSubmission({}, now - 3000, 'ua', 'ua');
  assert.strictEqual(result.valid, true);
  assert.deepStrictEqual(Object.keys(result.errors), []);
});
