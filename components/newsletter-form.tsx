'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import {
  FORM_CONSTANTS,
  validateField,
  calculateRateLimit,
  formatRateLimitMessage,
  generateFormId,
  validateFormSubmission,
} from '../lib/form-validation';

interface NewsletterFormData {
  email: string;
}

type FormStatus = 'idle' | 'pending' | 'success' | 'error' | 'rate_limited';

export function NewsletterForm() {
  const [formData, setFormData] = useState<NewsletterFormData>({
    email: '',
  });
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Partial<NewsletterFormData>>({});
  const [submitCount, setSubmitCount] = useState(0);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  // Client-side validation
  const validateForm = useCallback((data: NewsletterFormData): Partial<NewsletterFormData> => {
    const errors: Partial<NewsletterFormData> = {};

    const emailError = validateField(data.email, {
      required: true,
      maxLength: FORM_CONSTANTS.MAX_EMAIL_LENGTH,
      type: 'email',
    });
    if (emailError) errors.email = emailError;

    return errors;
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { value } = e.target;
    setFormData({ email: value });

    // Clear error when user starts typing
    if (formErrors.email) {
      setFormErrors({});
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limit using shared utility
    const rateLimitResult = calculateRateLimit(submitCount, lastSubmitTime, 'newsletter');
    if (!rateLimitResult.allowed) {
      setFormStatus('rate_limited');
      setErrorMessage(formatRateLimitMessage(rateLimitResult.remainingTime!, 'newsletter'));
      return;
    }

    // Validate form
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setErrorMessage('Please fix the error below');
      return;
    }

    // Check honeypot field and validate submission
    const botField = (e.target as HTMLFormElement).querySelector(
      'input[name="bot-field"]'
    ) as HTMLInputElement;
    const formId = generateFormId();
    const timestamp = Date.now();

    const validation = validateFormSubmission(
      { 'bot-field': botField?.value || '' },
      timestamp,
      navigator.userAgent,
      navigator.userAgent
    );

    if (!validation.valid) {
      if (validation.errors.honeypot) {
        // Bot filled the honeypot - silently fail
        setFormStatus('success');
        setFormData({ email: '' });
        return;
      }
      setErrorMessage(Object.values(validation.errors)[0]);
      return;
    }

    setFormStatus('pending');
    setErrorMessage('');

    try {
      const formElement = e.target as HTMLFormElement;
      const formDataToSend = new FormData(formElement);

      // Add timestamp and metadata for additional spam protection
      formDataToSend.append('timestamp', timestamp.toString());
      formDataToSend.append('user_agent', navigator.userAgent);
      formDataToSend.append('form_id', formId);

      const response = await fetch('/__forms.html', {
        method: 'POST',
        headers: { 'Content-Type': 'application/x-www-form-urlencoded' },
        body: new URLSearchParams(formDataToSend as any).toString(),
      });

      if (response.ok) {
        setFormStatus('success');
        setFormData({ email: '' });
        setSubmitCount(prev => prev + 1);
        setLastSubmitTime(Date.now());
      } else {
        throw new Error('Newsletter subscription failed');
      }
    } catch (error) {
      setFormStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  return (
    <div className="max-w-sm mx-auto">
      <form
        name="newsletter"
        method="POST"
        data-netlify="true"
        netlify-honeypot="bot-field"
        onSubmit={handleSubmit}
        className="space-y-3"
      >
        <input type="hidden" name="form-name" value="newsletter" />
        <p className="hidden" style={{ display: 'none' }}>
          <label>
            Don't fill this out: <input name="bot-field" onChange={handleInputChange} />
          </label>
        </p>

        <div>
          <label htmlFor="email" className="block text-sm font-medium mb-1">
            Email *
          </label>
          <input
            type="email"
            id="email"
            name="email"
            value={formData.email}
            onChange={handleInputChange}
            required
            placeholder="your@email.com"
            autoComplete="email"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formErrors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
        </div>

        <Button
          type="submit"
          disabled={formStatus === 'pending'}
          className="w-full"
          variant="outline"
        >
          {formStatus === 'pending' ? 'Subscribing...' : 'Subscribe'}
        </Button>
      </form>

      {formStatus === 'success' && (
        <div className="mt-3 p-3 bg-green-100 border border-green-400 text-green-700 rounded text-sm">
          Thanks for subscribing! You'll receive updates at {formData.email || 'your email address'}
          .
        </div>
      )}

      {formStatus === 'error' && (
        <div className="mt-3 p-3 bg-red-100 border border-red-400 text-red-700 rounded text-sm">
          {errorMessage || 'Something went wrong. Please try again.'}
        </div>
      )}

      {formStatus === 'rate_limited' && (
        <div className="mt-3 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded text-sm">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
