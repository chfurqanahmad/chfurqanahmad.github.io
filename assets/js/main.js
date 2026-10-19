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

  const audienceButtons = [...doc.querySelectorAll('[data-audience]')];
  const audiencePanels = [...doc.querySelectorAll('[data-audience-panel]')];
  const showAudience = key => {
    if (!audiencePanels.some(panel => panel.dataset.audiencePanel === key)) return;
    audienceButtons.forEach(button => button.setAttribute('aria-pressed', String(button.dataset.audience === key)));
    audiencePanels.forEach(panel => { panel.hidden = panel.dataset.audiencePanel !== key; });
  };
  audienceButtons.forEach(button => button.addEventListener('click', () => showAudience(button.dataset.audience)));
  if (audienceButtons.length) showAudience(audienceButtons[0].dataset.audience);

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
