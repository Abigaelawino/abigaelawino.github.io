const test = require('node:test');
const assert = require('node:assert/strict');

const { DEFAULT_CONTACT_COPY, DEFAULT_CONTACT_LINKS, renderContactPage } = require('../src/contact.js');

test('contact page renders form with Netlify honeypot spam protection', () => {
  const page = renderContactPage();

  assert.match(page, /data-contact-page/);
  assert.match(page, /data-netlify="true"/);
  assert.match(page, /netlify-honeypot="bot-field"/);
  assert.match(page, /name="form-name" value="contact"/);
  assert.match(page, /name="bot-field"/);
  assert.match(page, /name="email" type="email"/);
  assert.match(page, /name="message"/);
  assert.match(page, /data-analytics-event="contact_form_submit"/);
});

test('contact page includes privacy/data collection note', () => {
  const page = renderContactPage();

  assert.match(page, /data-contact-privacy/);
  assert.match(page, new RegExp(DEFAULT_CONTACT_COPY.privacyNote.split(' ').slice(0, 4).join(' ')));
});

test('contact page renders default social links and allows overrides', () => {
  const page = renderContactPage();

  assert.match(page, new RegExp(DEFAULT_CONTACT_LINKS.github.replaceAll('/', '\\/')));
  assert.match(page, new RegExp(DEFAULT_CONTACT_LINKS.linkedin.replaceAll('/', '\\/')));

  const customized = renderContactPage({ links: { github: 'https://example.com' } });
  assert.match(customized, /https:\/\/example\.com/);
});
