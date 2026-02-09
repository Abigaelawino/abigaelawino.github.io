const { escapeHtml } = require('./utils/escape-html.js');

const DEFAULT_CONTACT_LINKS = {
  github: 'https://github.com/abigaelawino',
  linkedin: 'https://www.linkedin.com/in/abigaelawino/',
};

const DEFAULT_CONTACT_COPY = {
  heading: 'Contact',
  intro: 'Send a message using the form below. I typically respond within 1–2 business days.',
  privacyNote:
    'Privacy: This form collects your name, email address, and message so I can reply. Submissions are stored in Netlify Forms for delivery and spam filtering. I will not share or sell your information, and I can delete it on request.',
  elsewhereHeading: 'Elsewhere',
};

function renderElsewhereLinks(links) {
  const entries = [
    { label: 'GitHub', href: links.github },
    { label: 'LinkedIn', href: links.linkedin },
  ].filter((entry) => typeof entry.href === 'string' && entry.href.trim().length > 0);

  if (entries.length === 0) {
    return '';
  }

  const items = entries
    .map(
      (entry) => `
        <li class="contact-links__item">
          <a class="contact-links__link" href="${escapeHtml(entry.href)}" target="_blank" rel="noopener noreferrer" data-analytics-event="contact_social_click" data-analytics-prop-destination="${escapeHtml(entry.label.toLowerCase())}">${escapeHtml(entry.label)}</a>
        </li>
      `.trim(),
    )
    .join('\n');

  return `
    <nav aria-label="Social links">
      <ul class="contact-links">
        ${items}
      </ul>
    </nav>
  `.trim();
}

function renderContactPage(options = {}) {
  const resolvedLinks = {
    ...DEFAULT_CONTACT_LINKS,
    ...(options.links ?? {}),
  };

  const copy = {
    ...DEFAULT_CONTACT_COPY,
    ...(options.copy ?? {}),
  };

  const elsewhereLinks = renderElsewhereLinks(resolvedLinks);

  return `
    <section class="contact-page" data-contact-page>
      <style>
        .contact-page { display: grid; gap: 1rem; }
        .contact-page__header { display: grid; gap: 0.5rem; }
        .contact-page__header h1 { margin: 0; font-size: clamp(1.6rem, 4.8vw, 2.3rem); line-height: 1.2; }
        .contact-page__header p { margin: 0; line-height: 1.55; }
        .contact-layout { display: grid; gap: 1rem; }
        .contact-card { border: 1px solid #d1d5db; border-radius: 0.75rem; padding: 0.95rem; display: grid; gap: 0.85rem; }
        .contact-card h2 { margin: 0; font-size: 1.1rem; line-height: 1.3; }
        .contact-form { border: 1px solid #d1d5db; border-radius: 0.75rem; padding: 0.95rem; display: grid; gap: 0.85rem; }
        .contact-form__field { display: grid; gap: 0.35rem; }
        .contact-form__label { font-weight: 600; }
        .contact-form__input,
        .contact-form__textarea {
          border: 1px solid #9ca3af;
          border-radius: 0.6rem;
          padding: 0.65rem 0.8rem;
          font: inherit;
        }
        .contact-form__textarea { resize: vertical; min-height: 8.5rem; }
        .contact-form__actions { display: flex; flex-direction: column; gap: 0.5rem; }
        .contact-form__submit {
          border: 1px solid #1f2937;
          border-radius: 0.6rem;
          padding: 0.7rem 1rem;
          background: #0f172a;
          color: #f9fafb;
          font-weight: 700;
          cursor: pointer;
        }
        .contact-form__note { margin: 0; font-size: 0.92rem; line-height: 1.55; color: #4b5563; }
        .contact-form__honeypot {
          position: absolute;
          left: -10000px;
          top: auto;
          width: 1px;
          height: 1px;
          overflow: hidden;
        }
        .contact-links { margin: 0; padding: 0; list-style: none; display: grid; gap: 0.5rem; }
        .contact-links__link { text-decoration: none; font-weight: 600; }
        @media (min-width: 48rem) {
          .contact-page { gap: 1.25rem; }
          .contact-layout { grid-template-columns: minmax(0, 1.6fr) minmax(0, 0.9fr); align-items: start; }
          .contact-form__actions { flex-direction: row; justify-content: flex-start; }
        }
      </style>
      <header class="contact-page__header">
        <h1>${escapeHtml(copy.heading)}</h1>
        <p>${escapeHtml(copy.intro)}</p>
      </header>
      <div class="contact-layout" data-contact-layout>
        <form
          class="contact-form"
          name="contact"
          method="POST"
          aria-describedby="contact-privacy-note"
          data-netlify="true"
          netlify-honeypot="bot-field"
          data-contact-form
          data-analytics-event="contact_form_submit"
        >
          <input type="hidden" name="form-name" value="contact" />
          <div class="contact-form__honeypot" aria-hidden="true">
            <label>
              Don’t fill this out if you’re human:
              <input name="bot-field" tabindex="-1" autocomplete="off" />
            </label>
          </div>
          <div class="contact-form__field">
            <label class="contact-form__label" for="contact-name">Name</label>
            <input class="contact-form__input" id="contact-name" name="name" type="text" autocomplete="name" required />
          </div>
          <div class="contact-form__field">
            <label class="contact-form__label" for="contact-email">Email</label>
            <input class="contact-form__input" id="contact-email" name="email" type="email" autocomplete="email" required />
          </div>
          <div class="contact-form__field">
            <label class="contact-form__label" for="contact-message">Message</label>
            <textarea class="contact-form__textarea" id="contact-message" name="message" required></textarea>
          </div>
          <div class="contact-form__actions">
            <button class="contact-form__submit" type="submit">Send message</button>
          </div>
          <p class="contact-form__note" id="contact-privacy-note" data-contact-privacy>${escapeHtml(copy.privacyNote)}</p>
        </form>
        <aside class="contact-card" data-contact-aside>
          <h2>${escapeHtml(copy.elsewhereHeading)}</h2>
          ${elsewhereLinks}
        </aside>
      </div>
    </section>
  `.trim();
}

module.exports = {
  DEFAULT_CONTACT_COPY,
  DEFAULT_CONTACT_LINKS,
  renderContactPage,
};
