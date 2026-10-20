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
  if (form) {
    const fields = ['name', 'company', 'email', 'subject', 'goal'].map(key => doc.querySelector('#brief-' + key));
    const submit = doc.querySelector('#brief-submit');
    const status = doc.querySelector('#brief-status');
    let busy = false;
    let attempt = null;
    fields.forEach(field => field.addEventListener('input', () => field.setCustomValidity('')));
    form.addEventListener('submit', async event => {
      event.preventDefault();
      if (busy) return;
      fields.forEach(field => field.setCustomValidity(field.getAttribute('required') === null || field.value.trim() ? '' : 'Please complete this field.'));
      if (!form.reportValidity()) return;
      if (!form.dataset.endpoint) {
        status.textContent = 'Online enquiries are not available yet. Please email thisisfurqanahmad@gmail.com.';
        status.focus();
        return;
      }
      const values = Object.fromEntries(fields.map(field => [field.name || field.getAttribute('name'), field.value.trim()]));
      const fingerprint = JSON.stringify(values);
      if (!attempt || attempt.fingerprint !== fingerprint) attempt = { fingerprint, id: crypto.randomUUID() };
      const payload = new URLSearchParams({ ...values, action: 'save', submissionId: attempt.id, website: doc.querySelector('#brief-website').value });
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 60000);
      busy = true;
      submit.disabled = true;
      submit.textContent = 'Sending…';
      status.textContent = 'Saving your enquiry…';
      try {
        const response = await fetch(form.dataset.endpoint, { method: 'POST', body: payload, signal: controller.signal, credentials: 'omit', redirect: 'follow' });
        if (!response.ok) throw new Error('Request failed');
        const result = await response.json();
        if (result.ok !== true || result.submissionId !== attempt.id) throw new Error('Receipt not confirmed');
        status.textContent = 'Thank you — your enquiry has been received. I’ll review your requirements and follow up to discuss a suitable scope.';
        // The receipt confirms storage. Email delivery proceeds separately, owner first.
        const delivery = new URLSearchParams(payload);
        delivery.set('action', 'deliver');
        fetch(form.dataset.endpoint, { method: 'POST', body: delivery, credentials: 'omit', redirect: 'follow', keepalive: true }).catch(() => {});
        form.reset();
        attempt = null;
      } catch (_) {
        status.textContent = 'I couldn’t confirm receipt. Your details are still here. Please retry, or email thisisfurqanahmad@gmail.com.';
      } finally {
        clearTimeout(timeout);
        busy = false;
        submit.disabled = false;
        submit.textContent = 'Send enquiry ↗';
        status.focus();
      }
    });
  }
  doc.querySelectorAll('[data-enhanced]').forEach(el => { el.hidden = false; });
})();
