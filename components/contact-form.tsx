'use client';

import { useState, useEffect, useCallback } from 'react';
import { Button } from './ui/button';
import {
  FORM_CONSTANTS,
  validateEmail,
  checkSuspiciousContent,
  validateField,
  calculateRateLimit,
  formatRateLimitMessage,
  generateFormId,
  validateFormSubmission,
} from '../lib/form-validation';

interface FormData {
  name: string;
  email: string;
  subject: string;
  message: string;
}

type FormStatus = 'idle' | 'pending' | 'success' | 'error' | 'rate_limited';

export function ContactForm() {
  const [formData, setFormData] = useState<FormData>({
    name: '',
    email: '',
    subject: '',
    message: '',
  });
  const [formStatus, setFormStatus] = useState<FormStatus>('idle');
  const [errorMessage, setErrorMessage] = useState<string>('');
  const [formErrors, setFormErrors] = useState<Partial<FormData>>({});
  const [submitCount, setSubmitCount] = useState(0);
  const [lastSubmitTime, setLastSubmitTime] = useState(0);

  // Rate limiting: max 3 submissions per 5 minutes
  const checkRateLimit = useCallback(() => {
    const now = Date.now();
    const timeSinceLastSubmit = now - lastSubmitTime;
    const fiveMinutes = 5 * 60 * 1000;

    if (submitCount >= 3 && timeSinceLastSubmit < fiveMinutes) {
      const remainingTime = Math.ceil((fiveMinutes - timeSinceLastSubmit) / 1000 / 60);
      return { allowed: false, remainingTime };
    }

    // Reset counter if 5 minutes have passed
    if (timeSinceLastSubmit >= fiveMinutes) {
      setSubmitCount(0);
    }

    return { allowed: true };
  }, [submitCount, lastSubmitTime]);

  // Client-side validation
  const validateForm = useCallback((data: FormData): Partial<FormData> => {
    const errors: Partial<FormData> = {};

    const nameError = validateField(data.name, {
      required: true,
      minLength: 2,
      maxLength: FORM_CONSTANTS.MAX_NAME_LENGTH,
      type: 'text',
    });
    if (nameError) errors.name = nameError;

    const emailError = validateField(data.email, {
      required: true,
      maxLength: FORM_CONSTANTS.MAX_EMAIL_LENGTH,
      type: 'email',
    });
    if (emailError) errors.email = emailError;

    const subjectError = validateField(data.subject, {
      maxLength: FORM_CONSTANTS.MAX_SUBJECT_LENGTH,
      type: 'text',
    });
    if (subjectError) errors.subject = subjectError;

    const messageError = validateField(data.message, {
      required: true,
      minLength: FORM_CONSTANTS.MIN_MESSAGE_LENGTH,
      maxLength: FORM_CONSTANTS.MAX_MESSAGE_LENGTH,
      type: 'textarea',
    });
    if (messageError) errors.message = messageError;

    return errors;
  }, []);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value,
    }));

    // Clear error for this field when user starts typing
    if (formErrors[name as keyof FormData]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined,
      }));
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    // Check rate limit using shared utility
    const rateLimitResult = calculateRateLimit(submitCount, lastSubmitTime, 'contact');
    if (!rateLimitResult.allowed) {
      setFormStatus('rate_limited');
      setErrorMessage(formatRateLimitMessage(rateLimitResult.remainingTime!, 'contact'));
      return;
    }

    // Validate form
    const errors = validateForm(formData);
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      setErrorMessage('Please fix the errors below');
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
        setFormData({ name: '', email: '', subject: '', message: '' });
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
        setFormData({ name: '', email: '', subject: '', message: '' });
        setSubmitCount(prev => prev + 1);
        setLastSubmitTime(Date.now());
      } else {
        throw new Error('Form submission failed');
      }
    } catch (error) {
      setFormStatus('error');
      setErrorMessage(error instanceof Error ? error.message : 'An unknown error occurred');
    }
  };

  return (
    <div className="max-w-md mx-auto">
      <form
        name="contact"
        method="POST"
        data-netlify="true"
        netlify-honeypot="bot-field"
        onSubmit={handleSubmit}
        className="space-y-4"
        data-analytics-event="form_submit"
        data-analytics-prop-form-type="contact"
      >
        <input type="hidden" name="form-name" value="contact" />
        <p className="hidden" style={{ display: 'none' }}>
          <label>
            Don't fill this out: <input name="bot-field" onChange={handleInputChange} />
          </label>
        </p>

        <div>
          <label htmlFor="name" className="block text-sm font-medium mb-1">
            Name *
          </label>
          <input
            type="text"
            id="name"
            name="name"
            value={formData.name}
            onChange={handleInputChange}
            required
            autoComplete="name"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formErrors.name ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {formErrors.name && <p className="mt-1 text-sm text-red-600">{formErrors.name}</p>}
        </div>

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
            autoComplete="email"
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formErrors.email ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          {formErrors.email && <p className="mt-1 text-sm text-red-600">{formErrors.email}</p>}
        </div>

        <div>
          <label htmlFor="subject" className="block text-sm font-medium mb-1">
            Subject
          </label>
          <input
            type="text"
            id="subject"
            name="subject"
            value={formData.subject}
            onChange={handleInputChange}
            autoComplete="off"
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        <div>
          <label htmlFor="message" className="block text-sm font-medium mb-1">
            Message *
          </label>
          <textarea
            id="message"
            name="message"
            value={formData.message}
            onChange={handleInputChange}
            required
            rows={5}
            minLength={FORM_CONSTANTS.MIN_MESSAGE_LENGTH}
            maxLength={FORM_CONSTANTS.MAX_MESSAGE_LENGTH}
            className={`w-full px-3 py-2 border rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 ${
              formErrors.message ? 'border-red-500' : 'border-gray-300'
            }`}
          />
          <div className="flex justify-between mt-1">
            {formErrors.message && <p className="text-sm text-red-600">{formErrors.message}</p>}
            <p className="text-sm text-gray-500 text-right">
              {formData.message.length}/{FORM_CONSTANTS.MAX_MESSAGE_LENGTH} characters
            </p>
          </div>
        </div>

        <Button type="submit" disabled={formStatus === 'pending'} className="w-full">
          {formStatus === 'pending' ? 'Sending...' : 'Send Message'}
        </Button>
      </form>

      {formStatus === 'success' && (
        <div className="mt-4 p-3 bg-green-100 border border-green-400 text-green-700 rounded">
          Thank you for your message! I'll get back to you soon.
        </div>
      )}

      {formStatus === 'error' && (
        <div className="mt-4 p-3 bg-red-100 border border-red-400 text-red-700 rounded">
          {errorMessage || 'Something went wrong. Please try again.'}
        </div>
      )}

      {formStatus === 'rate_limited' && (
        <div className="mt-4 p-3 bg-yellow-100 border border-yellow-400 text-yellow-700 rounded">
          {errorMessage}
        </div>
      )}
    </div>
  );
}
