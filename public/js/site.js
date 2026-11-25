/* Victor & Adaeze — quiet enhancements. Everything works without this file. */
(() => {
  'use strict';

  const doc = document;
  const root = doc.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');
  const wide = window.matchMedia('(min-width: 960px)');
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- Navigation: settles onto paper, steps aside while reading ---------- */

  const nav = doc.querySelector('[data-nav]');
  const frame = doc.querySelector('[data-parallax]');
  let lastY = window.scrollY;
  let queued = false;

  function onScroll() {
    const y = window.scrollY;
    if (nav && !nav.classList.contains('nav--solid')) nav.classList.toggle('is-solid', y > 24);
    if (nav && !root.classList.contains('menu-open')) {
      if (y > lastY + 6 && y > 560) nav.classList.add('is-hidden');
      else if (y < lastY - 6 || y <= 560) nav.classList.remove('is-hidden');
    }
    if (frame) {
      if (reduceMotion.matches || !wide.matches) frame.style.transform = '';
      else if (y < window.innerHeight * 1.25) frame.style.transform = `translate3d(0, ${(y * 0.05).toFixed(1)}px, 0)`;
    }
    lastY = y;
    queued = false;
  }
  window.addEventListener(
    'scroll',
    () => {
      if (!queued) {
        queued = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );
  onScroll();
  nav?.addEventListener('focusin', () => nav.classList.remove('is-hidden'));

  /* ---------- Menu (small screens) ---------- */

  const toggle = doc.querySelector('[data-menu-toggle]');
  const menu = doc.querySelector('[data-menu]');
  if (toggle && menu) {
    const label = toggle.querySelector('[data-menu-label]');
    const focusables = () => [toggle, ...menu.querySelectorAll('a, button')];

    const open = () => {
      menu.hidden = false;
      requestAnimationFrame(() => requestAnimationFrame(() => menu.classList.add('is-open')));
      root.classList.add('menu-open');
      toggle.setAttribute('aria-expanded', 'true');
      if (label) label.textContent = 'Close';
    };
    const close = (returnFocus = true) => {
      menu.classList.remove('is-open');
      root.classList.remove('menu-open');
      toggle.setAttribute('aria-expanded', 'false');
      if (label) label.textContent = 'Menu';
      window.setTimeout(() => {
        if (!menu.classList.contains('is-open')) menu.hidden = true;
      }, 500);
      if (returnFocus) toggle.focus();
    };

    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      if (menu.hidden) open();
      else close();
    });
    toggle.addEventListener('keydown', (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        toggle.click();
      }
    });
    menu.addEventListener('click', (e) => {
      if (e.target.closest('[data-menu-link]')) close(false);
    });
    doc.addEventListener('keydown', (e) => {
      if (menu.hidden) return;
      if (e.key === 'Escape') close();
      if (e.key === 'Tab') {
        const items = focusables();
        const first = items[0];
        const last = items[items.length - 1];
        if (e.shiftKey && doc.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!e.shiftKey && doc.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    });
    window.matchMedia('(min-width: 1080px)').addEventListener('change', (e) => {
      if (e.matches && !menu.hidden) close(false);
    });
  }

  /* ---------- Reveal on scroll ---------- */

  const revealables = doc.querySelectorAll('[data-reveal]');
  if ('IntersectionObserver' in window && !reduceMotion.matches) {
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        }
      },
      { rootMargin: '0px 0px -8% 0px', threshold: 0 },
    );
    revealables.forEach((el) => io.observe(el));
  } else {
    revealables.forEach((el) => el.classList.add('is-in'));
  }

  /* ---------- Countdown ---------- */

  const countdown = doc.querySelector('[data-countdown]');
  if (countdown) {
    const target = Date.parse(countdown.dataset.countdown);
    const cells = {};
    countdown.querySelectorAll('[data-unit]').forEach((el) => {
      cells[el.dataset.unit] = el;
    });
    let timer = 0;
    const tick = () => {
      const diff = Math.max(0, target - Date.now());
      const values = {
        days: Math.floor(diff / 864e5),
        hours: Math.floor(diff / 36e5) % 24,
        minutes: Math.floor(diff / 6e4) % 60,
        seconds: Math.floor(diff / 1e3) % 60,
      };
      for (const [unit, value] of Object.entries(values)) {
        const el = cells[unit];
        const text = pad(value);
        if (!el || el.textContent === text) continue;
        el.textContent = text;
        // Larger units change rarely; let them settle in softly. Seconds simply turn over.
        if (unit !== 'seconds' && !reduceMotion.matches) {
          el.classList.remove('is-tick');
          void el.offsetWidth;
          el.classList.add('is-tick');
        }
      }
      if (diff === 0) window.clearInterval(timer);
    };
    tick();
    window.setTimeout(() => {
      tick();
      timer = window.setInterval(tick, 1000);
    }, 1000 - (Date.now() % 1000));
  }

  /* ---------- Maps load only when a guest opens the venue details ---------- */

  doc.querySelectorAll('[data-event-more]').forEach((details) => {
    details.addEventListener('toggle', () => {
      if (!details.open) return;
      const holder = details.querySelector('[data-map]');
      if (!holder || holder.querySelector('iframe')) return;
      const iframe = doc.createElement('iframe');
      iframe.src = holder.dataset.map;
      iframe.title = holder.dataset.mapTitle || 'Map';
      iframe.loading = 'lazy';
      iframe.referrerPolicy = 'no-referrer-when-downgrade';
      iframe.allowFullscreen = true;
      holder.appendChild(iframe);
    });
  });

  /* ---------- Gallery ---------- */

  const gallery = doc.querySelector('[data-gallery]');
  if (gallery) {
    const items = [...gallery.querySelectorAll('.gallery__item')];
    const filters = doc.querySelector('[data-gallery-filters]');
    filters?.addEventListener('click', (e) => {
      const button = e.target.closest('button[data-album]');
      if (!button) return;
      const album = button.dataset.album;
      filters.querySelectorAll('button').forEach((b) => b.setAttribute('aria-pressed', String(b === button)));
      items.forEach((li) => {
        li.hidden = album !== 'all' && li.dataset.album !== album;
      });
    });

    const box = doc.querySelector('[data-lightbox]');
    if (box && typeof box.showModal === 'function') {
      const img = box.querySelector('[data-lightbox-img]');
      const caption = box.querySelector('[data-lightbox-caption]');
      const count = box.querySelector('[data-lightbox-count]');
      let list = [];
      let index = 0;

      const show = (i) => {
        index = (i + list.length) % list.length;
        const b = list[index];
        img.classList.add('is-loading');
        const next = new Image();
        next.sizes = '100vw';
        next.srcset = b.dataset.srcset;
        next.src = b.dataset.src;
        const apply = () => {
          img.sizes = '100vw';
          img.srcset = b.dataset.srcset;
          img.src = b.dataset.src;
          img.alt = b.dataset.alt || '';
          caption.textContent = b.dataset.caption || '';
          count.textContent = `${pad(index + 1)} / ${pad(list.length)}`;
          requestAnimationFrame(() => img.classList.remove('is-loading'));
        };
        (next.decode ? next.decode() : Promise.resolve()).then(apply, apply);
      };

      gallery.addEventListener('click', (e) => {
        const button = e.target.closest('.gallery__open');
        if (!button) return;
        list = items.filter((li) => !li.hidden).map((li) => li.querySelector('.gallery__open'));
        show(list.indexOf(button));
        box.showModal();
      });
      box.querySelector('[data-lightbox-prev]').addEventListener('click', () => show(index - 1));
      box.querySelector('[data-lightbox-next]').addEventListener('click', () => show(index + 1));
      box.querySelector('[data-lightbox-close]').addEventListener('click', () => box.close());
      box.addEventListener('keydown', (e) => {
        if (e.key === 'ArrowLeft') show(index - 1);
        if (e.key === 'ArrowRight') show(index + 1);
      });
      const stage = box.querySelector('.lightbox__stage');
      stage.addEventListener('click', (e) => {
        if (e.target === stage) box.close();
      });
      let startX = null;
      stage.addEventListener('pointerdown', (e) => {
        startX = e.clientX;
      });
      stage.addEventListener('pointerup', (e) => {
        if (startX === null) return;
        const dx = e.clientX - startX;
        startX = null;
        if (Math.abs(dx) > 50) show(index + (dx < 0 ? 1 : -1));
      });
    }
  }

  /* ---------- Copy buttons ---------- */

  doc.addEventListener('click', async (e) => {
    const button = e.target.closest('[data-copy]');
    if (!button) return;
    const text = button.dataset.copy;
    try {
      await navigator.clipboard.writeText(text);
      const before = button.textContent;
      button.textContent = 'Copied';
      window.setTimeout(() => {
        button.textContent = before;
      }, 1800);
    } catch {
      window.prompt('Copy:', text);
    }
  });
})();
