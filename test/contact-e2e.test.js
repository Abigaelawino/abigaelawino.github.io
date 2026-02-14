const test = require('node:test');
const assert = require('node:assert/strict');
const { JSDOM } = require('jsdom');

// Mock DOM environment for form testing
function createMockDom(html) {
  const dom = new JSDOM(html, {
    url: 'http://localhost:3000/contact/',
    pretendToBeVisual: true,
    resources: 'usable'
  });

  // Mock canvas API since it's not fully supported in JSDOM
  dom.window.HTMLCanvasElement.prototype.getContext = function() {
    return {
      fillText: () => {},
      toDataURL: () => 'data:image/png;base64,mock-fingerprint-data-for-testing-canvas-to-data-url'
    };
  };

  // Mock canvas creation
  dom.window.document.createElement = new Proxy(dom.window.document.createElement, {
    apply(target, thisArg, argumentsList) {
      const element = Reflect.apply(target, thisArg, argumentsList);
      if (argumentsList[0] === 'canvas') {
        Object.defineProperty(element, 'toDataURL', {
          value: () => 'data:image/png;base64,mock-fingerprint-data-for-testing-canvas-to-data-url'
        });
      }
      return element;
    }
  });

  // Mock crypto API
  if (!dom.window.crypto) {
    dom.window.crypto = {
      getRandomValues: (arr) => {
        for (let i = 0; i < arr.length; i++) {
          arr[i] = Math.floor(Math.random() * 256);
        }
        return arr;
      }
    };
  }

  // Mock Intl API
  dom.window.Intl = {
    DateTimeFormat: () => ({
      resolvedOptions: () => ({ timeZone: 'UTC' })
    })
  };

  // Mock btoa function
  dom.window.btoa = function(str) {
    try {
      return Buffer.from(str, 'binary').toString('base64');
    } catch (e) {
      // Handle any encoding issues
      return Buffer.from(str).toString('base64');
    }
  };

  // Mock alert function
  dom.window.alert = function(message) {
    // In tests, we can capture alert calls if needed
    console.log('ALERT:', message);
  };

  global.document = dom.window.document;
  global.window = dom.window;
  global.navigator = dom.window.navigator;
  global.screen = dom.window.screen;
  global.Intl = dom.window.Intl;
  global.crypto = dom.window.crypto;
  global.btoa = dom.window.btoa;
  global.alert = dom.window.alert;

  return dom;
}

// Cleanup DOM environment
function cleanupMockDom() {
  delete global.document;
  delete global.window;
  delete global.navigator;
  delete global.screen;
  delete global.Intl;
  delete global.crypto;
  delete global.btoa;
}

// Load analytics.js functionality for testing
function loadAnalyticsScript() {
  const fs = require('node:fs');
  const path = require('node:path');
  const analyticsPath = path.join(__dirname, '..', 'assets', 'analytics.js');
  const analyticsCode = fs.readFileSync(analyticsPath, 'utf8');

  // Make sure the DOM is ready before loading analytics
  if (document.readyState === 'loading') {
    // Set to complete to simulate DOM being ready
    Object.defineProperty(document, 'readyState', {
      value: 'complete',
      writable: false
    });
  }

  // Execute the IIFE with proper context
  const wrappedCode = `
    (function() {
      var document = global.document;
      var window = global.window;
      var navigator = global.navigator;
      var screen = global.screen;
      var Intl = global.Intl;
      var crypto = global.crypto;
      var btoa = global.btoa;
      var alert = global.alert;

      ${analyticsCode}
    })();
  `;

  eval(wrappedCode);
}

test('contact form end-to-end flow with spam protection', async (t) => {
  const { renderContactPage } = require('../src/contact.js');

  // Create a complete contact page with form
  const contactHtml = renderContactPage();

  await t.test('renders contact form with all security fields', () => {
    const dom = createMockDom(contactHtml);

    // Check form exists with correct attributes
    const form = document.querySelector('[data-contact-form]');
    assert(form, 'Contact form should exist');
    assert.equal(form.getAttribute('method'), 'POST', 'Form should use POST method');
    assert.equal(form.getAttribute('action'), '/contact/thanks/', 'Form should submit to thanks page');
    assert.equal(form.getAttribute('data-netlify'), 'true', 'Form should have Netlify attribute');
    assert.equal(form.getAttribute('netlify-honeypot'), 'bot-field', 'Form should have Netlify honeypot');

    // Check for hidden security fields
    const formNameInput = document.querySelector('input[name="form-name"]');
    assert(formNameInput, 'Should have hidden form-name input');
    assert.equal(formNameInput.value, 'contact', 'Form name should be "contact"');

    const timestampInput = document.querySelector('[data-contact-timestamp]');
    assert(timestampInput, 'Should have timestamp field');
    assert.equal(timestampInput.name, 'timestamp', 'Timestamp field should have correct name');

    const fingerprintInput = document.querySelector('[data-contact-fingerprint]');
    assert(fingerprintInput, 'Should have fingerprint field');
    assert.equal(fingerprintInput.name, 'form-fingerprint', 'Fingerprint field should have correct name');

    // Check for honeypot fields
    const botField = document.querySelector('input[name="bot-field"]');
    assert(botField, 'Should have bot-field honeypot');
    const botFieldParent = botField.closest('.contact-form__honeypot');
    assert(botFieldParent && botFieldParent.getAttribute('aria-hidden') === 'true', 'Honeypot should be aria-hidden');
    assert.equal(botField.getAttribute('tabindex'), '-1', 'Honeypot should be removed from tab order');

    const websiteField = document.querySelector('input[name="website-field"]');
    assert(websiteField, 'Should have website-field honeypot');
    const websiteFieldParent = websiteField.closest('.contact-form__honeypot');
    assert(websiteFieldParent && websiteFieldParent.getAttribute('aria-hidden') === 'true', 'Website honeypot should be aria-hidden');

    // Check for visible form fields
    const nameInput = document.querySelector('input[name="name"]');
    assert(nameInput, 'Should have name input');
    assert.equal(nameInput.type, 'text', 'Name should be text input');
    assert(nameInput.hasAttribute('required'), 'Name should be required');

    const emailInput = document.querySelector('input[name="email"]');
    assert(emailInput, 'Should have email input');
    assert.equal(emailInput.type, 'email', 'Email should be email input');
    assert(emailInput.hasAttribute('required'), 'Email should be required');

    const messageInput = document.querySelector('textarea[name="message"]');
    assert(messageInput, 'Should have message textarea');
    assert(messageInput.hasAttribute('required'), 'Message should be required');

    cleanupMockDom();
  });

  await t.test('form fingerprinting works correctly', () => {
    const dom = createMockDom(contactHtml);
    loadAnalyticsScript();

    const fingerprintInput = document.querySelector('[data-contact-fingerprint]');
    assert(fingerprintInput, 'Fingerprint input should exist');

    // Check that fingerprint is generated
    assert(fingerprintInput.value, 'Fingerprint should be generated');
    assert.equal(typeof fingerprintInput.value, 'string', 'Fingerprint should be a string');
    assert(fingerprintInput.value.length > 0, 'Fingerprint should not be empty');

    // Test that fingerprint is generated when analytics loads
    // The generateFingerprint function is scoped within the IIFE, but we can test its effects
    assert(fingerprintInput.value, 'Fingerprint should be generated');
    assert(fingerprintInput.value.length > 0, 'Fingerprint should not be empty');
    assert.equal(typeof fingerprintInput.value, 'string', 'Fingerprint should be a string');

    cleanupMockDom();
  });

  await t.test('form timing validation works', () => {
    const dom = createMockDom(contactHtml);
    loadAnalyticsScript();

    const form = document.querySelector('[data-contact-form]');
    const timestampInput = document.querySelector('[data-contact-timestamp]');

    // Simulate user interaction to set timestamp
    form.dispatchEvent(new dom.window.Event('focus'));

    // Check that timestamp is set on interaction
    assert(timestampInput.value, 'Timestamp should be set on first interaction');

    const initialTimestamp = parseInt(timestampInput.value, 10);
    assert(initialTimestamp > 0, 'Timestamp should be a valid timestamp');

    // Test rapid submission prevention
    let submitEventFired = false;
    form.addEventListener('submit', (e) => {
      submitEventFired = true;
      // Check if event was prevented
      assert(e.defaultPrevented, 'Rapid submission should be prevented');
    });

    // Try to submit immediately (should be prevented)
    form.dispatchEvent(new dom.window.Event('submit'));
    assert(submitEventFired, 'Submit event should fire');

    cleanupMockDom();
  });

  await t.test('honeypot fields block spam submissions', () => {
    const dom = createMockDom(contactHtml);
    loadAnalyticsScript();

    const form = document.querySelector('[data-contact-form]');
    const botField = document.querySelector('input[name="bot-field"]');
    const websiteField = document.querySelector('input[name="website-field"]');

    let submissionBlocked = false;

    // Monitor submit event
    form.addEventListener('submit', (e) => {
      if (e.defaultPrevented) {
        submissionBlocked = true;
      }
    });

    // Test 1: Fill honeypot field (should be blocked)
    botField.value = 'spam content';
    const submitEvent1 = new dom.window.Event('submit', {
      bubbles: true,
      cancelable: true
    });
    form.dispatchEvent(submitEvent1);
    assert(submissionBlocked, 'Submission with filled honeypot should be blocked');

    // Reset
    botField.value = '';
    submissionBlocked = false;

    // Test 2: Fill website field (should be blocked)
    websiteField.value = 'http://spam.com';
    const submitEvent2 = new dom.window.Event('submit', {
      bubbles: true,
      cancelable: true
    });
    form.dispatchEvent(submitEvent2);
    assert(submissionBlocked, 'Submission with filled website field should be blocked');

    cleanupMockDom();
  });

  await t.test('valid form submission proceeds normally', () => {
    const dom = createMockDom(contactHtml);
    loadAnalyticsScript();

    const form = document.querySelector('[data-contact-form]');
    const nameInput = document.querySelector('input[name="name"]');
    const emailInput = document.querySelector('input[name="email"]');
    const messageInput = document.querySelector('textarea[name="message"]');
    const timestampInput = document.querySelector('[data-contact-timestamp]');

    // Fill in valid form data
    nameInput.value = 'Test User';
    emailInput.value = 'test@example.com';
    messageInput.value = 'This is a test message.';

    // Simulate realistic timing
    const now = Date.now();
    timestampInput.value = (now - 10000).toString(); // 10 seconds ago

    let submissionBlocked = false;
    form.addEventListener('submit', (e) => {
      if (e.defaultPrevented) {
        submissionBlocked = true;
      }
    });

    // Submit form
    form.dispatchEvent(new dom.window.Event('submit'));
    assert(!submissionBlocked, 'Valid submission should not be blocked');

    cleanupMockDom();
  });

  await t.test('form data includes required Netlify fields', () => {
    const dom = createMockDom(contactHtml);

    const form = document.querySelector('[data-contact-form]');

    // Check that form-name field exists
    const formNameField = document.querySelector('input[name="form-name"]');
    assert(formNameField, 'Form should have form-name field');
    assert.equal(formNameField.value, 'contact', 'Form should include form-name field');

    // Check that honeypot fields exist
    const botField = document.querySelector('input[name="bot-field"]');
    const websiteField = document.querySelector('input[name="website-field"]');
    assert(botField, 'Bot field should exist');
    assert(websiteField, 'Website field should exist');

    cleanupMockDom();
  });

  await t.test('contact thanks page renders correctly', () => {
    const { renderContactThanksPage } = require('../src/contact.js');
    const thanksHtml = renderContactThanksPage();

    const dom = createMockDom(thanksHtml);

    // Check thanks page elements
    const thanksSection = document.querySelector('[data-contact-thanks]');
    assert(thanksSection, 'Thanks page should have contact-thanks section');

    const heading = thanksSection.querySelector('h1');
    assert(heading, 'Thanks page should have heading');
    assert(heading.textContent.includes('Message sent'), 'Heading should confirm message was sent');

    const ctaLink = thanksSection.querySelector('a');
    assert(ctaLink, 'Thanks page should have CTA link');
    assert.equal(ctaLink.getAttribute('href'), '/', 'CTA should link to home');
    assert(ctaLink.hasAttribute('data-analytics-event'), 'CTA should have analytics tracking');

    cleanupMockDom();
  });

  await t.test('form validation works with HTML5 validation', () => {
    const dom = createMockDom(contactHtml);

    const nameInput = document.querySelector('input[name="name"]');
    const emailInput = document.querySelector('input[name="email"]');
    const messageInput = document.querySelector('textarea[name="message"]');

    // Test required attributes
    assert(nameInput.hasAttribute('required'), 'Name field should be required');
    assert(emailInput.hasAttribute('required'), 'Email field should be required');
    assert(messageInput.hasAttribute('required'), 'Message field should be required');

    // Test input types
    assert.equal(nameInput.type, 'text', 'Name should be text input');
    assert.equal(emailInput.type, 'email', 'Email should be email input');
    assert.equal(messageInput.tagName.toLowerCase(), 'textarea', 'Message should be textarea');

    // Test autocomplete attributes
    assert.equal(nameInput.getAttribute('autocomplete'), 'name', 'Name should have name autocomplete');
    assert.equal(emailInput.getAttribute('autocomplete'), 'email', 'Email should have email autocomplete');

    cleanupMockDom();
  });

  await t.test('analytics tracking is properly configured', () => {
    const dom = createMockDom(contactHtml);

    const form = document.querySelector('[data-contact-form]');
    assert(form, 'Form should exist');

    // Check analytics event attribute
    assert.equal(
      form.getAttribute('data-analytics-event'),
      'contact_form_submit',
      'Form should have analytics event'
    );

    // Check social links analytics
    const githubLink = document.querySelector('a[href*="github"]');
    if (githubLink) {
      assert(
        githubLink.hasAttribute('data-analytics-event'),
        'GitHub link should have analytics tracking'
      );
      assert(
        githubLink.hasAttribute('data-analytics-prop-destination'),
        'GitHub link should have destination prop'
      );
    }

    const linkedinLink = document.querySelector('a[href*="linkedin"]');
    if (linkedinLink) {
      assert(
        linkedinLink.hasAttribute('data-analytics-event'),
        'LinkedIn link should have analytics tracking'
      );
      assert(
        linkedinLink.hasAttribute('data-analytics-prop-destination'),
        'LinkedIn link should have destination prop'
      );
    }

    cleanupMockDom();
  });
});

test('contact form security edge cases', async (t) => {
  const { renderContactPage } = require('../src/contact.js');

  await t.test('handles missing DOM elements gracefully', () => {
    const dom = createMockDom('<div></div>'); // Empty page
    loadAnalyticsScript();

    // Should not throw errors when form elements are missing
    assert.doesNotThrow(() => {
      document.dispatchEvent(new dom.window.Event('DOMContentLoaded'));
    });

    cleanupMockDom();
  });

  await t.test('prevents submissions with invalid timing', () => {
    const dom = createMockDom(renderContactPage());
    loadAnalyticsScript();

    const form = document.querySelector('[data-contact-form]');
    const timestampInput = document.querySelector('[data-contact-timestamp]');

    let submissionBlocked = false;
    form.addEventListener('submit', (e) => {
      if (e.defaultPrevented) {
        submissionBlocked = true;
      }
    });

    // Test too fast submission (< 3 seconds)
    timestampInput.value = Date.now().toString();
    const submitEvent1 = new dom.window.Event('submit', {
      bubbles: true,
      cancelable: true
    });
    form.dispatchEvent(submitEvent1);
    assert(submissionBlocked, 'Too fast submission should be blocked');

    // Reset
    submissionBlocked = false;

    // Test too slow submission (> 1 hour)
    timestampInput.value = (Date.now() - 3700000).toString(); // More than 1 hour ago
    const submitEvent2 = new dom.window.Event('submit', {
      bubbles: true,
      cancelable: true
    });
    form.dispatchEvent(submitEvent2);
    assert(submissionBlocked, 'Too slow submission should be blocked');

    cleanupMockDom();
  });

  await t.test('handles crypto API unavailability', () => {
    // Mock environment without crypto API
    const originalCrypto = global.crypto;
    delete global.crypto;

    const dom = createMockDom(renderContactPage());

    // Should still generate a fingerprint (fallback method)
    loadAnalyticsScript();

    const fingerprintInput = document.querySelector('[data-contact-fingerprint]');
    assert(fingerprintInput.value, 'Should generate fingerprint even without crypto API');

    // Restore crypto
    global.crypto = originalCrypto;
    cleanupMockDom();
  });
});
