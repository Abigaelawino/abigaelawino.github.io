# Form Spam Protection Implementation

This document outlines the spam protection mechanisms implemented for the contact and newsletter forms.

## Overview

The forms now include multiple layers of spam protection:

1. **Honeypot Fields** - Hidden fields that bots typically fill
2. **Client-Side Validation** - Input validation before submission
3. **Rate Limiting** - Limits submissions per time window
4. **Content Filtering** - Detects suspicious patterns
5. **Timing Validation** - Prevents automated submissions
6. **User-Agent Verification** - Ensures consistency
7. **Optional reCAPTCHA v3** - Google's invisible CAPTCHA

## Implementation Details

### 1. Honeypot Fields

Each form includes a hidden field (`bot-field`) that is:

- Styled with `display: none` to hide from users
- Monitored for any input (bots often fill all fields)
- Results in silent rejection if filled

### 2. Rate Limiting

Rate limits are applied per form type:

- **Contact Form**: 3 submissions per 5 minutes
- **Newsletter Form**: 5 submissions per 30 minutes

The rate limiting is implemented both:

- Client-side (for immediate feedback)
- Server-side (via Netlify Functions)

### 3. Validation Rules

#### Contact Form

- Name: Required, 2-100 characters
- Email: Required, valid format, max 255 characters
- Subject: Optional, max 200 characters
- Message: Required, 10-1000 characters

#### Newsletter Form

- Email: Required, valid format, max 255 characters

### 4. Content Filtering

The following patterns are blocked:

- `<script>` tags
- `javascript:` URLs
- Suspicious BBCode (`[url=]`, `[link=]`)
- `<a href>` tags
- Event handlers (`onclick`, `onerror`, `onload`)

Allowed URLs include:

- YouTube (`youtube.com`, `youtu.be`)
- LinkedIn (`linkedin.com`)
- Twitter/X (`twitter.com`, `x.com`)

### 5. Timing Validation

Forms must be:

- Open for at least 2 seconds before submission
- Submitted within 1 hour of page load
- Match the original user agent

### 6. reCAPTCHA v3 (Optional)

To enable reCAPTCHA v3:

1. Add environment variables:

   ```bash
   RECAPTCHA_SITE_KEY=your_site_key
   RECAPTCHA_SECRET_KEY=your_secret_key
   ```

2. Add the script to your pages:

   ```html
   <script src="https://www.google.com/recaptcha/api.js?render=RECAPTCHA_SITE_KEY"></script>
   ```

3. Include the token in form submissions:
   ```javascript
   grecaptcha.ready(function () {
     grecaptcha.execute('RECAPTCHA_SITE_KEY', { action: 'contact' }).then(function (token) {
       // Add token to form
     });
   });
   ```

## File Structure

```
components/
  contact-form.tsx      # Contact form with spam protection
  newsletter-form.tsx  # Newsletter form with spam protection

netlify/
  functions/
    rate-limiter.js    # Server-side rate limiting
    form-validator.js  # Server-side validation
  edge-functions/
    recaptcha-validation.js  # Optional reCAPTCHA validation

lib/
  form-validation.ts   # Shared validation utilities

test/lib/
  form-validation.test.js  # Tests for validation utilities
```

## Testing

Run the form validation tests:

```bash
npm test -- test/lib/form-validation.test.js
```

## Monitoring

Form submissions are logged with:

- IP address (masked for privacy)
- Timestamp
- Form type
- Validation results

Failed validations include:

- Specific error reasons
- Rate limit status
- Bot detection triggers

## Security Considerations

1. **No sensitive data is logged** - Only metadata for monitoring
2. **Fail-safe approach** - If validation fails, forms remain usable
3. **Privacy-first** - IP addresses are partially masked in logs
4. **GDPR compliant** - No personal data stored without consent

## Customization

To adjust rate limits, modify `lib/form-validation.ts`:

```typescript
export const RATE_LIMITS = {
  contact: {
    window: 5 * 60 * 1000, // 5 minutes
    maxRequests: 3,
    message: 'Too many contact submissions. Please wait {minutes} minutes.',
  },
  // ... other forms
};
```

To add new validation rules, update the `validateField` function or create custom validators for specific fields.

## Troubleshooting

### Common Issues

1. **Legitimate submissions blocked**
   - Check rate limits
   - Verify content filtering rules
   - Review timing validation

2. **Bot submissions getting through**
   - Ensure honeypot fields are properly hidden
   - Check content filtering patterns
   - Consider enabling reCAPTCHA

3. **reCAPTCHA not working**
   - Verify API keys are set
   - Check domain configuration in reCAPTCHA console
   - Ensure script is loaded correctly

### Debug Mode

To enable debug logging, add to your environment:

```bash
DEBUG=form-validation
```

This will log detailed information about validation decisions.
