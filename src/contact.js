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

const DEFAULT_CONTACT_THANKS_COPY = {
  heading: 'Message sent',
  intro: 'Thanks for reaching out. I’ll reply as soon as I can.',
  followUp: 'If you don’t hear back within 2 business days, feel free to connect on LinkedIn.',
  primaryCtaLabel: 'Back to home',
  primaryCtaHref: '/',
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

  return `
    <div class="container space-y-12">
      <!-- Header -->
      <section class="text-center space-y-4">
        <h1 class="text-4xl font-bold tracking-tight">Get in Touch</h1>
        <p class="text-xl text-muted-foreground max-w-2xl mx-auto">
          I'd love to hear about your data science challenges and discuss how I can help.
        </p>
      </section>

      <div class="grid gap-8 lg:grid-cols-3">
        <!-- Contact Information -->
        <div class="space-y-6">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title flex items-center gap-2">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z"></path>
                </svg>
                Email
              </h2>
              <p class="card-description">
                For project inquiries, collaborations, or general questions
              </p>
            </div>
            <div class="card-content">
              <a class="button button-outline w-full" href="mailto:contact@example.com">
                Send Email
                <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2 class="card-title flex items-center gap-2">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M17 8h2a2 2 0 012 2v6a2 2 0 01-2 2h-2v4l-4-4H9a1.994 1.994 0 01-1.414-.586m0 0L11 14h4a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2v4l.586-.586z"></path>
                </svg>
                LinkedIn
              </h2>
              <p class="card-description">
                Professional networking and career opportunities
              </p>
            </div>
            <div class="card-content">
              <a class="button button-outline w-full" href="https://linkedin.com" target="_blank" rel="noopener noreferrer">
                Connect on LinkedIn
                <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>
          </div>

          <div class="card">
            <div class="card-header">
              <h2 class="card-title flex items-center gap-2">
                <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4"></path>
                </svg>
                GitHub
              </h2>
              <p class="card-description">
                View my open-source projects and contributions
              </p>
            </div>
            <div class="card-content">
              <a class="button button-outline w-full" href="https://github.com" target="_blank" rel="noopener noreferrer">
                Visit GitHub
                <svg class="ml-2 h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14"></path>
                </svg>
              </a>
            </div>
          </div>
        </div>

        <!-- Contact Form -->
        <div class="lg:col-span-2">
          <div class="card">
            <div class="card-header">
              <h2 class="card-title">Send a Message</h2>
              <p class="card-description">
                Fill out the form below and I'll get back to you as soon as possible.
              </p>
            </div>
            <div class="card-content">
              <form
                name="contact"
                method="POST"
                action="/contact/thanks/"
                aria-describedby="contact-privacy-note"
                data-netlify="true"
                netlify-honeypot="bot-field"
                data-contact-form
                data-analytics-event="contact_form_submit"
                class="space-y-4"
              >
                <input type="hidden" name="form-name" value="contact" />
                <input type="hidden" name="timestamp" value="" data-contact-timestamp />
                <input type="hidden" name="form-fingerprint" value="" data-contact-fingerprint />

                <div class="contact-form__honeypot" aria-hidden="true" style="position: absolute; left: -10000px; top: auto; width: 1px; height: 1px; overflow: hidden;">
                  <label>
                    Don't fill this out if you're human:
                    <input name="bot-field" tabindex="-1" autocomplete="off" />
                  </label>
                </div>
                <div class="contact-form__honeypot" aria-hidden="true" style="position: absolute; left: -10000px; top: auto; width: 1px; height: 1px; overflow: hidden;">
                  <label>
                    Website (leave blank):
                    <input name="website-field" tabindex="-1" autocomplete="off" />
                  </label>
                </div>

                <div class="space-y-2">
                  <label class="font-semibold" for="contact-name">Name</label>
                  <input
                    class="w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                    id="contact-name"
                    name="name"
                    type="text"
                    autocomplete="name"
                    required
                  />
                </div>

                <div class="space-y-2">
                  <label class="font-semibold" for="contact-email">Email</label>
                  <input
                    class="w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md"
                    id="contact-email"
                    name="email"
                    type="email"
                    autocomplete="email"
                    required
                  />
                </div>

                <div class="space-y-2">
                  <label class="font-semibold" for="contact-message">Message</label>
                  <textarea
                    class="w-full border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 rounded-md min-h-[8.5rem] resize-vertical"
                    id="contact-message"
                    name="message"
                    required
                  ></textarea>
                </div>

                <div class="flex flex-col sm:flex-row gap-2">
                  <button class="button button-primary" type="submit">Send Message</button>
                </div>

                <p class="text-sm text-muted-foreground" id="contact-privacy-note" data-contact-privacy>${escapeHtml(copy.privacyNote)}</p>
              </form>
            </div>
          </div>
        </div>
      </div>

      <!-- Availability -->
      <div class="card">
        <div class="card-header">
          <h2 class="card-title flex items-center gap-2">
            <svg class="h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            Availability
          </h2>
        </div>
        <div class="card-content">
          <p class="text-muted-foreground">
            I'm currently available for freelance projects, consulting, and full-time opportunities.
            Typical response time is 24-48 hours. For urgent matters, please mention it in your message.
          </p>
        </div>
      </div>

      <!-- Back Navigation -->
      <div class="text-center">
        <a class="button button-outline" href="/">
          ← Back to Home
        </a>
      </div>
    </div>
  `.trim();
}

function renderContactThanksPage(options = {}) {
  const copy = {
    ...DEFAULT_CONTACT_THANKS_COPY,
    ...(options.copy ?? {}),
  };

  return `
    <div class="container">
      <div class="card">
        <div class="card-content space-y-4">
          <h1 class="text-3xl font-bold tracking-tight">${escapeHtml(copy.heading)}</h1>
          <p class="text-muted-foreground">${escapeHtml(copy.intro)}</p>
          <p class="text-muted-foreground">${escapeHtml(copy.followUp)}</p>
          <a class="button button-primary" href="${escapeHtml(copy.primaryCtaHref)}" data-analytics-event="contact_thanks_primary_click">${escapeHtml(copy.primaryCtaLabel)}</a>
        </div>
      </div>
    </div>
  `.trim();
}

module.exports = {
  DEFAULT_CONTACT_COPY,
  DEFAULT_CONTACT_LINKS,
  DEFAULT_CONTACT_THANKS_COPY,
  renderContactPage,
  renderContactThanksPage,
};
