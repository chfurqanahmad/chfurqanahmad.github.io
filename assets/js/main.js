/* Progressive enhancement: core content and email contact work without JavaScript. */
(() => {
  'use strict';
  const doc = document;
  const email = 'thisisfurqanahmad@gmail.com';
  doc.querySelectorAll('[data-current-year]').forEach(el => { el.textContent = new Date().getFullYear(); });

  const toggle = doc.querySelector('.nav-toggle');
  const menu = doc.querySelector('#primary-navigation');
  if (toggle && menu) {
    const close = () => {
      menu.classList.remove('is-open');
      toggle.setAttribute('aria-expanded', 'false');
      toggle.setAttribute('aria-label', 'Open navigation');
    };
    toggle.addEventListener('click', () => {
      const open = toggle.getAttribute('aria-expanded') !== 'true';
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      toggle.setAttribute('aria-label', open ? 'Close navigation' : 'Open navigation');
    });
    menu.addEventListener('click', event => {
      const link = event.target.closest('a');
      if (link && toggle.getAttribute('aria-expanded') === 'true') {
        close();
        const destination = doc.getElementById(link.getAttribute('href').slice(1));
        if (destination) {
          destination.setAttribute('tabindex', '-1');
          destination.focus({ preventScroll: true });
        }
      }
    });
    doc.addEventListener('click', event => {
      if (!menu.contains(event.target) && !toggle.contains(event.target)) close();
    });
    doc.addEventListener('keydown', event => {
      if (event.key === 'Escape' && toggle.getAttribute('aria-expanded') === 'true') {
        close();
        toggle.focus();
      }
    });
    doc.addEventListener('focusin', event => {
      if (!menu.contains(event.target) && !toggle.contains(event.target)) close();
    });
    window.addEventListener('resize', () => { if (window.innerWidth > 960) close(); });
    doc.documentElement.classList.add('nav-ready');
  }

  const filters = [...doc.querySelectorAll('[data-filter]')];
  const cards = [...doc.querySelectorAll('.work-card[data-category]')];
  filters.forEach(button => button.addEventListener('click', () => {
    const category = button.dataset.filter;
    filters.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    let count = 0;
    cards.forEach(card => {
      card.hidden = category !== 'all' && card.dataset.category !== category;
      if (!card.hidden) count++;
    });
    const output = doc.querySelector('[data-filter-count]');
    if (output) output.textContent = `${count} case ${count === 1 ? 'study' : 'studies'}`;
  }));

  const audiences = {
    "technology": [
        "SaaS & technology",
        "Find relevant business buyers and decision-makers for SaaS products, IT services, software development and automation."
    ],
    "products": [
        "Product businesses",
        "Research potential business buyers, retailers, distributors and partners for physical products and brands."
    ],
    "services": [
        "Agencies & professional services",
        "Identify prospective clients for marketing, design, photography, consulting, recruitment, training and other professional services."
    ],
    "finance": [
        "Financial services & investment",
        "Research relevant businesses, decision-makers and potential clients or partners for financing, lending and investment firms, then support outreach, follow-ups and meeting coordination."
    ],
    "healthcare": [
        "Healthcare & healthtech",
        "Research relevant healthcare organizations, business buyers and decision-makers for healthtech, medical products and healthcare services. Support targeted outreach, meeting coordination and product-demo bookings with your team."
    ],
    "property": [
        "Real estate & other sectors",
        "Identify relevant prospects, businesses and partners for property services and other sectors, with research and outreach shaped around your offer and target audience."
    ]
};
  const audienceButtons = [...doc.querySelectorAll('[data-audience]')];
  const audienceDetail = doc.querySelector('#audience-detail');
  audienceButtons.forEach(button => button.addEventListener('click', () => {
    const entry = audiences[button.dataset.audience];
    if (!entry || !audienceDetail) return;
    audienceButtons.forEach(item => item.setAttribute('aria-pressed', String(item === button)));
    audienceDetail.querySelector('h4').textContent = entry[0];
    const paragraphs = audienceDetail.querySelectorAll('p');
    paragraphs[0].textContent = entry[1];
  }));

  const copy = doc.querySelector('[data-copy-email]');
  const copyStatus = doc.querySelector('[data-copy-status]');
  if (copy) copy.addEventListener('click', async () => {
    try {
      if (!navigator.clipboard || !navigator.clipboard.writeText) throw new Error('Clipboard unavailable');
      await navigator.clipboard.writeText(email);
      if (copyStatus) copyStatus.textContent = 'Email address copied.';
    } catch (_) {
      if (copyStatus) copyStatus.textContent = `Select and copy the address above: ${email}`;
    }
  });

  const form = doc.querySelector('#project-brief');
  if (form) form.addEventListener('submit', event => {
    event.preventDefault();
    if (!form.reportValidity()) return;
    const service = doc.querySelector('#brief-service').value;
    const company = doc.querySelector('#brief-company').value.trim();
    const goal = doc.querySelector('#brief-goal');
    if (!goal.value.trim()) {
      goal.setCustomValidity('Please describe your project goal.');
      goal.reportValidity();
      goal.addEventListener('input', () => goal.setCustomValidity(''), { once: true });
      return;
    }
    const subject = `Project enquiry: ${service}`;
    const body = `Hi Furqan,\n\nI’m interested in: ${service}\n${company ? `Name or company: ${company}\n` : ''}\nMy goal:\n${goal.value.trim()}\n\nPlease let me know what you need to scope this project.\n\nThank you${company ? `,\n${company}` : '.'}`;
    doc.querySelector('#brief-mail').href = `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    doc.querySelector('#brief-gmail').href = `https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(email)}&su=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
    doc.querySelector('#brief-preview').textContent = `Subject: ${subject}\n\n${body}`;
    const result = doc.querySelector('#brief-result');
    result.hidden = false;
    const status = result.querySelector('.brief-status');
    status.setAttribute('tabindex', '-1');
    status.focus();
  });
  doc.querySelectorAll('[data-enhanced]').forEach(el => { el.hidden = false; });
})();
