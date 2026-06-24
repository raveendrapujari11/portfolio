/* ===========================================================
   Raveendra Pujari — Portfolio main.js
   Section-themed interactions:
   - Mobile menu, scroll-spy, active section detection
   - Animated background blobs (swap colors per section)
   - Scroll progress bar
   - Theme switcher (light / dark / system)
   - Typing effect with cursor
   - Stats counter (intersection observer)
   - Skill bar fill on scroll
   - Gallery lightbox + arrows
   - Contact form (Formspree)
   - Toast notifications
   =========================================================== */

(function () {
  'use strict';

  /* ===== Helpers ===== */
  const $ = (sel, ctx = document) => ctx.querySelector(sel);
  const $$ = (sel, ctx = document) => Array.from(ctx.querySelectorAll(sel));
  const root = document.documentElement;
  const body = document.body;

  /* ===== Mobile menu ===== */
  const navToggle = $('#nav-toggle');
  const navMenu = $('#nav-menu');
  if (navToggle && navMenu) {
    navToggle.addEventListener('click', () => navMenu.classList.toggle('show'));
    navToggle.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); navToggle.click(); }
    });
  }

  /* ===== Nav active on click + close mobile menu ===== */
  const navLinks = $$('.nav__link');
  navLinks.forEach(link => {
    link.addEventListener('click', function () {
      navLinks.forEach(n => n.classList.remove('active'));
      this.classList.add('active');
      if (navMenu) navMenu.classList.remove('show');
    });
  });

  /* ===== Sections, scroll-spy, active section for label + bg ===== */
  const sections = $$('main section[data-section]');
  const stickyLabel = $('#sticky-label');
  const headerH = () => parseInt(getComputedStyle(root).getPropertyValue('--header-height')) || 64;

  const setActiveByScroll = () => {
    const scrollY = window.pageYOffset;
    const offset = headerH() + 30;
    let current = sections[0] ? sections[0].id : '';
    sections.forEach(s => {
      const top = s.offsetTop - offset;
      const h = s.offsetHeight;
      if (scrollY >= top && scrollY < top + h) current = s.id;
    });
    navLinks.forEach(n => n.classList.remove('active'));
    const link = $('.nav__link[href="#' + current + '"]');
    if (link) link.classList.add('active');

    // Update sticky label
    if (stickyLabel) {
      const active = sections.find(s => s.id === current);
      if (active) {
        const name = active.getAttribute('data-section');
        stickyLabel.textContent = name;
        body.setAttribute('data-section-active', name);
        // sync background blob colors
        const grad1 = getComputedStyle(active).getPropertyValue('--section-grad-1').trim();
        const grad2 = getComputedStyle(active).getPropertyValue('--section-grad-2').trim();
        const grad3 = getComputedStyle(active).getPropertyValue('--section-grad-3').trim();
        if (grad1) root.style.setProperty('--grad-1', grad1);
        if (grad2) root.style.setProperty('--grad-2', grad2);
        if (grad3) root.style.setProperty('--grad-3', grad3);
      }
    }
  };
  window.addEventListener('scroll', setActiveByScroll, { passive: true });

  /* ===== Scroll progress bar ===== */
  const progress = $('.scroll-progress');
  if (progress) {
    const updateProgress = () => {
      const h = document.documentElement;
      const scrolled = h.scrollTop || body.scrollTop;
      const height = h.scrollHeight - h.clientHeight;
      const pct = height > 0 ? (scrolled / height) * 100 : 0;
      progress.style.width = pct + '%';
    };
    window.addEventListener('scroll', updateProgress, { passive: true });
    window.addEventListener('resize', updateProgress);
    updateProgress();
  }

  /* ===== Theme switcher (light / dark / system) ===== */
  const themeBtn = $('#theme-toggle');
  const themeIcon = $('#theme-icon');
  const mq = window.matchMedia ? window.matchMedia('(prefers-color-scheme: dark)') : null;

  const getSystemTheme = () => (mq && mq.matches ? 'dark' : 'light');
  const applyTheme = (mode) => {
    let actual = mode;
    if (mode === 'system') actual = getSystemTheme();
    root.setAttribute('data-theme', actual);
    try { localStorage.setItem('themeMode', mode); } catch (_) {}
    if (themeIcon) {
      const next = mode === 'system' ? 'system' : (actual === 'dark' ? 'light' : 'dark');
      themeIcon.className = next === 'system' ? 'bx bx-desktop' : (actual === 'dark' ? 'bx bx-sun' : 'bx bx-moon');
      themeBtn.setAttribute('title', `Theme: ${mode} (click for ${next})`);
    }
  };
  // Init theme
  let savedMode = 'system';
  try { savedMode = localStorage.getItem('themeMode') || 'system'; } catch (_) {}
  applyTheme(savedMode);
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      const cycle = ['light', 'dark', 'system'];
      const cur = localStorage.getItem('themeMode') || 'system';
      const next = cycle[(cycle.indexOf(cur) + 1) % cycle.length];
      applyTheme(next);
    });
  }
  if (mq && mq.addEventListener) mq.addEventListener('change', () => {
    if ((localStorage.getItem('themeMode') || 'system') === 'system') applyTheme('system');
  });

  /* ===== Audio opt-in (no autoplay) ===== */
  const audioBtn = $('#audio-toggle');
  const audioIcon = $('#audio-icon');
  const audio = $('#welcome-audio');
  if (audioBtn && audio) {
    audioBtn.addEventListener('click', () => {
      if (audio.paused) {
        audio.currentTime = 0;
        audio.play().catch(err => console.warn('Audio play failed:', err));
        if (audioIcon) audioIcon.className = 'bx bx-volume-full';
      } else {
        audio.pause();
        if (audioIcon) audioIcon.className = 'bx bx-volume-mute';
      }
    });
  }

  /* ===== Typing effect for hero ===== */
  const typingEl = $('#typing-text');
  if (typingEl) {
    const phrases = (typingEl.getAttribute('data-words') || '').split('|').filter(Boolean);
    if (phrases.length) {
      let pi = 0, ci = 0, deleting = false;
      const tick = () => {
        const word = phrases[pi];
        ci += deleting ? -1 : 1;
        typingEl.textContent = word.slice(0, ci);
        let delay = deleting ? 40 : 90;
        if (!deleting && ci === word.length) { delay = 1500; deleting = true; }
        else if (deleting && ci === 0) { deleting = false; pi = (pi + 1) % phrases.length; delay = 350; }
        setTimeout(tick, delay);
      };
      tick();
    }
  }

  /* ===== IntersectionObserver: reveal on scroll ===== */
  const revealTargets = $$('.reveal, .bento__card, .cert-card, .project-card, .exp-card, .stat, .timeline__item');
  revealTargets.forEach(t => t.classList.add('reveal'));

  const ioReveal = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        el.classList.add('is-visible');
        // Stat counters
        if (el.classList.contains('stat')) {
          const numEl = el.querySelector('.stat__value');
          if (numEl && !numEl.dataset.counted) {
            numEl.dataset.counted = '1';
            const target = parseFloat(numEl.getAttribute('data-target') || '0');
            const suffix = numEl.getAttribute('data-suffix') || '';
            const dur = 1400;
            const start = performance.now();
            const step = (now) => {
              const t = Math.min(1, (now - start) / dur);
              const eased = 1 - Math.pow(1 - t, 3);
              numEl.textContent = Math.floor(eased * target) + (t === 1 ? suffix : '');
              if (t < 1) requestAnimationFrame(step);
            };
            requestAnimationFrame(step);
          }
        }
        ioReveal.unobserve(el);
      }
    });
  }, { threshold: 0.15 });
  revealTargets.forEach(t => ioReveal.observe(t));

  /* ===== Gallery: lightbox + filter tabs ===== */
  const galleryEl = $('#gallery');
  const galleryItems = galleryEl ? $$('.gallery__item', galleryEl) : [];
  const lightbox = $('#lightbox');
  const lightboxImg = $('#lightbox-img');
  const lightboxCap = $('#lightbox-caption');
  const closeBtn = $('.lightbox__close');
  const prevBtn = $('.lightbox__prev');
  const nextBtn = $('.lightbox__next');
  const tabs = $$('.photo-tab');
  let currentIndex = 0;

  /* Filter tabs */
  tabs.forEach(tab => {
    tab.addEventListener('click', () => {
      const filter = tab.getAttribute('data-filter') || 'all';
      tabs.forEach(t => {
        const active = t === tab;
        t.classList.toggle('is-active', active);
        t.setAttribute('aria-selected', active ? 'true' : 'false');
      });
      galleryItems.forEach(item => {
        const cat = item.getAttribute('data-cat');
        const match = filter === 'all' || cat === filter;
        if (match) {
          item.classList.remove('is-hidden');
          // Re-trigger pop animation
          item.classList.remove('is-shown');
          // Force reflow
          void item.offsetWidth;
          item.classList.add('is-shown');
        } else {
          item.classList.add('is-hidden');
          item.classList.remove('is-shown');
        }
      });
    });
  });

  if (lightbox && lightboxImg && galleryItems.length) {
    const open = (i) => {
      // Walk through only visible items
      const visible = galleryItems.filter(it => !it.classList.contains('is-hidden'));
      if (!visible.length) return;
      const idxInVisible = visible.indexOf(galleryItems[i]);
      // If the requested i is hidden, jump to first/last visible neighbor
      const target = idxInVisible >= 0 ? visible[(idxInVisible + (i - idxInVisible < 0 ? -1 : 0) + visible.length) % visible.length] : visible[0];
      currentIndex = galleryItems.indexOf(target);
      const img = target.querySelector('img');
      lightboxImg.src = img.src;
      lightboxImg.alt = img.alt || '';
      if (lightboxCap) lightboxCap.textContent = `Image ${currentIndex + 1} of ${galleryItems.length}`;
      lightbox.classList.add('is-open');
      body.style.overflow = 'hidden';
    };
    const close = () => {
      lightbox.classList.remove('is-open');
      body.style.overflow = '';
    };
    galleryItems.forEach((item, i) => item.addEventListener('click', () => open(i)));
    if (closeBtn) closeBtn.addEventListener('click', close);
    if (prevBtn) prevBtn.addEventListener('click', () => {
      // Step back to previous visible item
      let i = currentIndex - 1;
      while (i >= 0 && galleryItems[i].classList.contains('is-hidden')) i--;
      if (i < 0) {
        // wrap to last visible
        for (let j = galleryItems.length - 1; j >= 0; j--) {
          if (!galleryItems[j].classList.contains('is-hidden')) { i = j; break; }
        }
      }
      if (i >= 0) open(i);
    });
    if (nextBtn) nextBtn.addEventListener('click', () => {
      let i = currentIndex + 1;
      while (i < galleryItems.length && galleryItems[i].classList.contains('is-hidden')) i++;
      if (i >= galleryItems.length) {
        for (let j = 0; j < galleryItems.length; j++) {
          if (!galleryItems[j].classList.contains('is-hidden')) { i = j; break; }
        }
      }
      if (i < galleryItems.length) open(i);
    });
    lightbox.addEventListener('click', (e) => { if (e.target === lightbox) close(); });
    document.addEventListener('keydown', (e) => {
      if (!lightbox.classList.contains('is-open')) return;
      if (e.key === 'Escape') close();
      if (e.key === 'ArrowLeft' && prevBtn) prevBtn.click();
      if (e.key === 'ArrowRight' && nextBtn) nextBtn.click();
    });
  }

  /* ===== Toast helper ===== */
  const toast = (msg, opts = {}) => {
    let t = $('#toast');
    if (!t) {
      t = document.createElement('div');
      t.id = 'toast';
      t.className = 'toast';
      t.innerHTML = `<i class='bx bx-check-circle ico'></i><span class="msg"></span>`;
      body.appendChild(t);
    }
    t.querySelector('.msg').textContent = msg;
    t.classList.add('is-visible');
    clearTimeout(t._timer);
    t._timer = setTimeout(() => t.classList.remove('is-visible'), opts.duration || 2400);
  };

  /* ===== Contact form (Formspree) ===== */
  const form = $('#contact-form');
  const status = $('#form-status');
  if (form) {
    const btn = $('#submit-btn');
    const icon = $('#submit-icon');
    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      if (!btn) return;
      btn.disabled = true;
      if (status) { status.textContent = 'Sending…'; status.classList.remove('error', 'success'); }

      try {
        const data = new FormData(form);
        const res = await fetch(form.action, {
          method: 'POST',
          body: data,
          headers: { 'Accept': 'application/json' }
        });
        if (res.ok) {
          form.reset();
          if (status) { status.textContent = 'Message sent — thank you!'; status.classList.add('success'); }
          if (icon) { icon.classList.remove('bx-send'); icon.classList.add('bx-check'); }
          if (btn) btn.classList.add('success');
          toast('Message sent successfully');
          setTimeout(() => {
            if (icon) { icon.classList.remove('bx-check'); icon.classList.add('bx-send'); }
            if (btn) btn.classList.remove('success');
            if (btn) btn.disabled = false;
            if (status) status.textContent = '';
          }, 2500);
        } else { throw new Error('Request failed'); }
      } catch (err) {
        if (status) { status.textContent = 'Something went wrong. Please try again.'; status.classList.add('error'); }
        btn.disabled = false;
        toast('Failed to send — please retry', { duration: 3000 });
      }
    });
  }

  /* ===== Initial setup ===== */
  setActiveByScroll();

  /* ===== Close mobile menu on outside click ===== */
  document.addEventListener('click', (e) => {
    if (!navMenu || !navMenu.classList.contains('show')) return;
    if (!navMenu.contains(e.target) && !navToggle.contains(e.target)) {
      navMenu.classList.remove('show');
    }
  });
})();
