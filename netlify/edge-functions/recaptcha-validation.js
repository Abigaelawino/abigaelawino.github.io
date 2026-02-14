// Optional reCAPTCHA v3 integration
// To use this:
// 1. Add your reCAPTCHA site key to environment variables: RECAPTCHA_SITE_KEY
// 2. Add your reCAPTCHA secret key to Netlify build environment: RECAPTCHA_SECRET_KEY
// 3. Enable reCAPTCHA in your forms by adding the netlify-recaptcha attribute

export default async (request, context) => {
  const RECAPTCHA_SECRET_KEY = process.env.RECAPTCHA_SECRET_KEY;
  
  // If reCAPTCHA is not configured, skip validation
  if (!RECAPTCHA_SECRET_KEY) {
    return;
  }

  // Only validate POST requests to forms
  if (request.method !== 'POST' || !request.url.includes('/__forms.html')) {
    return;
  }

  try {
    const formData = await request.formData();
    const recaptchaToken = formData.get('g-recaptcha-response');
    
    if (!recaptchaToken) {
      return new Response(JSON.stringify({
        error: 'reCAPTCHA verification failed',
        message: 'Please complete the reCAPTCHA verification'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Verify token with reCAPTCHA API
    const recaptchaResponse = await fetch(
      'https://www.google.com/recaptcha/api/siteverify',
      {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: `secret=${RECAPTCHA_SECRET_KEY}&response=${recaptchaToken}&remoteip=${request.ip}`
      }
    );

    const result = await recaptchaResponse.json();
    
    if (!result.success) {
      console.error('reCAPTCHA verification failed:', result['error-codes']);
      return new Response(JSON.stringify({
        error: 'reCAPTCHA verification failed',
        message: 'reCAPTCHA verification failed. Please try again.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // Check score threshold (adjust based on your needs)
    const SCORE_THRESHOLD = 0.5;
    if (result.score < SCORE_THRESHOLD) {
      return new Response(JSON.stringify({
        error: 'reCAPTCHA score too low',
        message: 'Suspicious activity detected. Please try again.'
      }), {
        status: 400,
        headers: { 'Content-Type': 'application/json' }
      });
    }

    // reCAPTCHA verification passed
    console.log(`reCAPTCHA verification passed with score: ${result.score}`);
    
  } catch (error) {
    console.error('reCAPTCHA validation error:', error);
    // If reCAPTCHA validation fails, don't block the form submission
    // This ensures the form remains usable even if reCAPTCHA service is down
  }
};