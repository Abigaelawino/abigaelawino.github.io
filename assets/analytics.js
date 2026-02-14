(() => {
  const isDoNotTrackEnabled = () => {
    const dntValues = [
      navigator.doNotTrack,
      window.doNotTrack,
      navigator.msDoNotTrack,
      document.doNotTrack,
    ]
      .map(value => (value == null ? '' : String(value)))
      .map(value => value.trim());

    return dntValues.includes('1') || dntValues.includes('yes');
  };

  const isLocalHost = hostname => {
    const resolved = String(hostname || '')
      .trim()
      .toLowerCase();
    return (
      resolved === '' ||
      resolved === 'localhost' ||
      resolved === '127.0.0.1' ||
      resolved === '0.0.0.0' ||
      resolved.endsWith('.local')
    );
  };

  const analyticsEnabled = () => {
    if (isDoNotTrackEnabled()) {
      return false;
    }

    if (isLocalHost(window.location && window.location.hostname)) {
      return false;
    }

    return typeof window.plausible === 'function';
  };

  const getPropsFromElement = element => {
    if (!element || !element.attributes) {
      return {};
    }

    const props = {};
    for (const attribute of Array.from(element.attributes)) {
      if (!attribute.name.startsWith('data-analytics-prop-')) {
        continue;
      }

      const key = attribute.name.slice('data-analytics-prop-'.length).trim();
      if (!key) {
        continue;
      }

      props[key] = attribute.value;
    }

    return props;
  };

  const trackEvent = (name, element, options = {}) => {
    const hasCompletionCallback = typeof options.onComplete === 'function';
    const MAX_NAVIGATION_DELAY_MS = 500;
    let completionTimeout = null;
    let completionCalled = false;

    const completeOnce = () => {
      if (!hasCompletionCallback || completionCalled) {
        return;
      }

      completionCalled = true;
      if (completionTimeout) {
        clearTimeout(completionTimeout);
      }

      options.onComplete();
    };

    if (!analyticsEnabled()) {
      completeOnce();
      return;
    }

    if (hasCompletionCallback) {
      completionTimeout = window.setTimeout(completeOnce, MAX_NAVIGATION_DELAY_MS);
    }

    const props = {
      page: window.location && window.location.pathname ? window.location.pathname : '',
      ...getPropsFromElement(element),
    };

    window.plausible(name, {
      props,
      callback: hasCompletionCallback ? completeOnce : undefined,
    });
  };

  const shouldDelayNavigation = (event, anchor) => {
    if (!anchor || typeof anchor.getAttribute !== 'function') {
      return false;
    }

    if (event.defaultPrevented) {
      return false;
    }

    if (event.button !== 0) {
      return false;
    }

    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) {
      return false;
    }

    const target = anchor.getAttribute('target');
    if (target && target !== '_self') {
      return false;
    }

    const href = anchor.getAttribute('href');
    if (!href || href.startsWith('#')) {
      return false;
    }

    return true;
  };

  document.addEventListener('click', event => {
    const target = event.target;
    if (!target || typeof target.closest !== 'function') {
      return;
    }

    const element = target.closest('[data-analytics-event]');
    if (!element) {
      return;
    }

    const eventName = element.getAttribute('data-analytics-event');
    if (!eventName) {
      return;
    }

    const anchor = element.closest('a[href]');
    if (anchor && shouldDelayNavigation(event, anchor) && analyticsEnabled()) {
      const href = anchor.href;
      if (!href) {
        return;
      }

      event.preventDefault();
      trackEvent(eventName, element, { onComplete: () => window.location.assign(href) });
      return;
    }

    trackEvent(eventName, element);
  });

  document.addEventListener('submit', event => {
    const target = event.target;
    if (!target || typeof target.closest !== 'function') {
      return;
    }

    const element = target.closest('[data-analytics-event]');
    if (!element) {
      return;
    }

    const eventName = element.getAttribute('data-analytics-event');
    if (!eventName) {
      return;
    }

    trackEvent(eventName, element);
  });

  // Form security enhancements
  const generateFingerprint = () => {
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    ctx.textBaseline = 'top';
    ctx.font = '14px Arial';
    ctx.fillText('Security fingerprint', 2, 2);
    const canvasFingerprint = canvas.toDataURL().slice(-50);

    const screenFingerprint = `${screen.width}x${screen.height}x${screen.colorDepth}`;
    const timezone = Intl.DateTimeFormat().resolvedOptions().timeZone;
    const language = navigator.language;

    return btoa(`${canvasFingerprint}|${screenFingerprint}|${timezone}|${language}`).slice(0, 32);
  };

  const enhanceContactForm = () => {
    const timestampField = document.querySelector('[data-contact-timestamp]');
    const fingerprintField = document.querySelector('[data-contact-fingerprint]');
    const contactForm = document.querySelector('[data-contact-form]');

    if (timestampField && fingerprintField && contactForm) {
      // Set timestamp when form is interacted with
      const setTimestamp = () => {
        if (!timestampField.value) {
          timestampField.value = Date.now().toString();
        }
      };

      // Generate fingerprint
      fingerprintField.value = generateFingerprint();

      // Set timestamp on first interaction
      contactForm.addEventListener('focus', setTimestamp, { once: true });
      contactForm.addEventListener('input', setTimestamp, { once: true });

      // Validate form timing before submit
      contactForm.addEventListener('submit', event => {
        const submitTime = Date.now();
        const formTime = parseInt(timestampField.value, 10) || 0;
        const timeDiff = submitTime - formTime;

        // Prevent submissions made too quickly (< 3 seconds) or too slowly (> 1 hour)
        if (timeDiff < 3000 || timeDiff > 3600000) {
          event.preventDefault();
          alert(
            'Please take your time filling out the form. If you believe this is an error, please refresh the page and try again.'
          );
          return;
        }

        // Check for honeypot fields
        const botField = contactForm.querySelector('input[name="bot-field"]');
        const websiteField = contactForm.querySelector('input[name="website-field"]');

        if ((botField && botField.value.trim()) || (websiteField && websiteField.value.trim())) {
          event.preventDefault();
          return; // Silently block suspected bots
        }
      });
    }
  };

  // Track page views
  const trackPageView = () => {
    if (analyticsEnabled()) {
      const path = window.location.pathname;
      const title = document.title;

      window.plausible('pageview', {
        props: {
          path,
          title,
          referrer: document.referrer || 'direct',
          user_agent: navigator.userAgent,
          screen: `${screen.width}x${screen.height}`,
          locale: navigator.language || 'en-US',
        },
      });
    }
  };

  // Track scroll depth
  let maxScrollDepth = 0;
  const trackScrollDepth = () => {
    const scrollHeight = document.documentElement.scrollHeight - window.innerHeight;
    const currentScroll = window.scrollY;
    const scrollPercent = Math.round((currentScroll / scrollHeight) * 100);

    if (scrollPercent > maxScrollDepth && scrollPercent % 25 === 0) {
      maxScrollDepth = scrollPercent;
      if (analyticsEnabled()) {
        window.plausible('scroll_depth', {
          props: {
            depth: scrollPercent,
            page: window.location.pathname,
          },
        });
      }
    }
  };

  // Track time on page
  let timeOnPage = 0;
  const trackTimeOnPage = () => {
    if (analyticsEnabled()) {
      window.plausible('time_on_page', {
        props: {
          seconds: Math.round(timeOnPage / 1000),
          page: window.location.pathname,
        },
      });
    }
  };

  // Initialize analytics tracking
  const initializeAnalytics = () => {
    // Track initial page view
    trackPageView();

    // Track page visibility changes (time on page)
    let hiddenTime = 0;
    let visibilityStart = Date.now();

    document.addEventListener('visibilitychange', () => {
      if (document.hidden) {
        hiddenTime = Date.now();
      } else {
        timeOnPage += Date.now() - hiddenTime;
        visibilityStart = Date.now();
      }
    });

    // Track scroll depth
    window.addEventListener('scroll', trackScrollDepth, { passive: true });

    // Track time on page before unload
    window.addEventListener('beforeunload', () => {
      timeOnPage += Date.now() - visibilityStart;
      trackTimeOnPage();
    });

    // Track outbound links
    document.addEventListener('click', event => {
      const target = event.target;
      if (!target || typeof target.closest !== 'function') {
        return;
      }

      const link = target.closest('a[href]');
      if (link && link.hostname !== window.location.hostname) {
        if (analyticsEnabled()) {
          window.plausible('outbound_link', {
            props: {
              url: link.href,
              page: window.location.pathname,
            },
          });
        }
      }
    });

    // Track file downloads
    document.addEventListener('click', event => {
      const target = event.target;
      if (!target || typeof target.closest !== 'function') {
        return;
      }

      const link = target.closest('a[href]');
      if (link) {
        const href = link.getAttribute('href');
        if (href && (href.endsWith('.pdf') || href.endsWith('.doc') || href.endsWith('.zip'))) {
          if (analyticsEnabled()) {
            window.plausible('file_download', {
              props: {
                file: href.split('/').pop(),
                page: window.location.pathname,
              },
            });
          }
        }
      }
    });
  };

  // Initialize form security when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', () => {
      enhanceContactForm();
      initializeAnalytics();
    });
  } else {
    enhanceContactForm();
    initializeAnalytics();
  }
})();
