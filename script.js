(() => {
  'use strict';
  const menu = document.querySelector('.menu-toggle');
  const nav = document.getElementById('main-nav');
  const closeMenu = () => {
    menu?.setAttribute('aria-expanded', 'false');
    const label = menu?.querySelector('.sr-only');
    if (label) label.textContent = 'メニューを開く';
    nav?.classList.remove('is-open');
  };
  menu?.addEventListener('click', () => {
    const open = menu.getAttribute('aria-expanded') !== 'true';
    menu.setAttribute('aria-expanded', String(open));
    menu.querySelector('.sr-only').textContent = open ? 'メニューを閉じる' : 'メニューを開く';
    nav.classList.toggle('is-open', open);
  });
  nav?.querySelectorAll('a').forEach(a => a.addEventListener('click', closeMenu));
  document.addEventListener('keydown', e => {
    if (e.key === 'Escape' && menu?.getAttribute('aria-expanded') === 'true') { closeMenu(); menu.focus(); }
  });
  document.addEventListener('click', e => { if (!e.target.closest('.site-header')) closeMenu(); });
  window.matchMedia?.('(min-width: 651px)').addEventListener?.('change', closeMenu);

  // One verified HTTPS destination is shared by all four reservation CTAs.
  const config = window.CLINIC_CONFIG || {};
  const setText = (selector, value) => {
    if (typeof value === 'string' && value.trim()) document.querySelectorAll(selector).forEach(el => { el.textContent = value.trim(); });
  };
  setText('[data-clinic-name]', config.clinicName);
  setText('[data-address]', config.address);
  let reservationUrl = null;
  if (typeof config.reservationUrl === 'string' && config.reservationUrl.trim()) {
    try {
      const url = new URL(config.reservationUrl.trim());
      if (url.protocol === 'https:' && !url.username && !url.password) reservationUrl = url.href;
    } catch (_) { /* Keep the honest pending state for invalid or missing URLs. */ }
  }
  document.querySelectorAll('[data-booking-link]').forEach(link => {
    const label = link.querySelector('[data-booking-label]');
    if (reservationUrl) {
      link.href = reservationUrl;
      link.target = '_blank';
      link.rel = 'noopener noreferrer';
      link.dataset.bookingState = 'ready';
      link.setAttribute('aria-label', 'WEBで予約する（外部予約サイト・新しいタブ）');
      link.setAttribute('title', '外部の予約サイトが新しいタブで開きます');
      if (label) label.textContent = 'WEB予約';
    } else {
      link.href = '#booking-status';
      link.removeAttribute('target');
      link.removeAttribute('rel');
      link.dataset.bookingState = 'pending';
      link.setAttribute('aria-label', 'WEB予約（予約先URL未設定・現在のご案内を見る）');
      link.setAttribute('title', '予約先URLを確認中です。現在のご案内を表示します');
      if (label) label.textContent = 'WEB予約';
    }
  });
  const bookingStatus = document.getElementById('booking-status');
  if (reservationUrl && bookingStatus) bookingStatus.textContent = '外部の予約サイトが新しいタブで開きます。';
  const replaceContact = (id, value, href) => {
    const old = document.getElementById(id);
    if (!old) return;
    const link = document.createElement('a'); link.id = id; link.href = href; link.textContent = value; old.replaceWith(link);
  };
  if (typeof config.phone === 'string' && /^\+?[\d\s()-]{8,22}$/.test(config.phone)) replaceContact('phone-contact', config.phone, 'tel:' + config.phone.replace(/[^\d+]/g, ''));
  if (typeof config.email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(config.email)) replaceContact('email-contact', config.email, 'mailto:' + config.email);

  // Progressive motion: content remains visible if JavaScript or an API is unavailable.
  const reducedMotion = window.matchMedia?.('(prefers-reduced-motion: reduce)');
  const motionToggle = document.getElementById('motion-toggle');
  let paused = false;
  const shouldReduce = () => Boolean(reducedMotion?.matches || paused);
  const activeFaqAnimations = new Map();
  const finishFaqAnimations = () => {
    activeFaqAnimations.forEach((animation, details) => {
      animation.onfinish = null;
      animation.oncancel = null;
      animation.cancel();
      details.open = details.dataset.expandIntent === 'true';
      details.style.overflow = '';
      details.style.height = '';
      delete details.dataset.expandIntent;
    });
    activeFaqAnimations.clear();
  };
  const syncMotion = () => {
    document.documentElement.classList.toggle('motion-paused', shouldReduce());
    if (motionToggle) {
      motionToggle.hidden = Boolean(reducedMotion?.matches);
      motionToggle.setAttribute('aria-pressed', String(paused));
      motionToggle.textContent = paused ? '動きを再生する' : '動きを止める';
    }
    if (shouldReduce()) finishFaqAnimations();
  };
  motionToggle?.addEventListener('click', () => { paused = !paused; syncMotion(); });
  reducedMotion?.addEventListener?.('change', syncMotion);
  syncMotion();

  const revealSelectors = [
    '.about .section-label', '.about-layout .kicker', '.about-layout h2', '.about-text > p',
    '.concerns > p', '.concerns li', '.concerns-note',
    '.care .section-label', '.care .section-heading > div', '.care .section-heading > p',
    '.care-image', '.care-copy > *', '.menu-row > div', '.medical-note',
    '.first-visit .section-label', '.first-visit .section-heading > div', '.first-visit .section-heading > p',
    '.steps > li', '.first-visit-note', '.profile-photo', '.intro-layout > div:last-child > *',
    '.faq .section-label', '.faq-layout > div:first-child > *', '.faq-list > details',
    '.reservation-header > *', '.booking-area > *', '.contact-area > div',
    '.access > div > *', '.access-details > div', '.preview-notes'
  ].join(',');
  const revealItems = [...document.querySelectorAll(revealSelectors)];
  if ('IntersectionObserver' in window && !reducedMotion?.matches) {
    const revealObserver = new window.IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        entry.target.classList.add('is-visible');
        revealObserver.unobserve(entry.target);
      });
    }, { threshold: 0.08, rootMargin: '0px 0px -36px 0px' });
    ['.concerns li', '.steps > li', '.faq-list > details', '.access-details > div'].forEach(selector => {
      document.querySelectorAll(selector).forEach((el, index) => {
        el.style.setProperty('--reveal-delay', `${Math.min(index, 4) * 95}ms`);
      });
    });
    revealItems.forEach(el => { el.classList.add('reveal-item'); revealObserver.observe(el); });
  }

  // Preserve native <details> behavior when motion is reduced or WAAPI is unavailable.
  document.querySelectorAll('.faq-list > details').forEach(details => {
    const summary = details.querySelector('summary');
    if (!summary || typeof details.animate !== 'function') return;
    summary.addEventListener('click', event => {
      if (shouldReduce()) return;
      event.preventDefault();
      const targetOpen = details.dataset.expandIntent !== undefined ? details.dataset.expandIntent !== 'true' : !details.open;
      const startHeight = details.getBoundingClientRect().height;
      const previous = activeFaqAnimations.get(details);
      if (previous) { previous.onfinish = null; previous.oncancel = null; previous.cancel(); }
      details.dataset.expandIntent = String(targetOpen);
      details.open = true;
      details.style.height = '';
      const style = getComputedStyle(details);
      const border = (parseFloat(style.borderTopWidth) || 0) + (parseFloat(style.borderBottomWidth) || 0);
      const endHeight = targetOpen ? details.getBoundingClientRect().height : summary.getBoundingClientRect().height + border;
      details.style.overflow = 'hidden';
      try {
        const animation = details.animate([{ height: `${startHeight}px` }, { height: `${endHeight}px` }], {
          duration: 300, easing: 'cubic-bezier(.22,.61,.36,1)'
        });
        activeFaqAnimations.set(details, animation);
        animation.onfinish = () => {
          if (activeFaqAnimations.get(details) !== animation) return;
          details.open = targetOpen;
          details.style.height = '';
          details.style.overflow = '';
          delete details.dataset.expandIntent;
          activeFaqAnimations.delete(details);
        };
      } catch (_) {
        details.open = targetOpen;
        details.style.overflow = '';
        delete details.dataset.expandIntent;
        activeFaqAnimations.delete(details);
      }
    });
  });
})();
