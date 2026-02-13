const test = require('node:test');
const assert = require('node:assert/strict');

const {
  DEFAULT_CONTACT_COPY,
  DEFAULT_CONTACT_LINKS,
  DEFAULT_CONTACT_THANKS_COPY,
  renderContactPage,
  renderContactThanksPage,
} = require('../src/contact.js');

test('contact page renders form with Netlify honeypot spam protection', () => {
  const page = renderContactPage();

  assert.match(page, /data-contact-page/);
  assert.match(page, /data-netlify="true"/);
  assert.match(page, /netlify-honeypot="bot-field"/);
  assert.match(page, /name="form-name" value="contact"/);
  assert.match(page, /name="bot-field"/);
  assert.match(page, /name="email" type="email"/);
  assert.match(page, /name="message"/);
  assert.match(page, /action="\/contact\/thanks\/"/);
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

test('contact thanks page renders confirmation copy and CTA', () => {
  const thanks = renderContactThanksPage();

  assert.match(thanks, /data-contact-thanks/);
  assert.match(thanks, new RegExp(DEFAULT_CONTACT_THANKS_COPY.heading));
  assert.match(thanks, /data-analytics-event="contact_thanks_primary_click"/);

  const customized = renderContactThanksPage({ copy: { heading: 'Custom thanks!' } });
  assert.match(customized, /Custom thanks!/);
});

test('contact page renders nothing when all links are empty', () => {
  const page = renderContactPage({ links: { github: '', linkedin: '' } });
  assert.doesNotMatch(page, /<a class="contact-links__link"/);
  assert.doesNotMatch(page, /aria-label="Social links"/);
  assert.match(page, /contact-page/);
});
