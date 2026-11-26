/* NEW WINE'26 — enhancements. Everything works without this file. */
(() => {
  'use strict';

  const doc = document;
  const root = doc.documentElement;
  const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  const wide = window.matchMedia('(min-width: 992px)');
  const pad = (n) => String(n).padStart(2, '0');

  /* ---------- Preloader: fades out once the page is ready ---------- */

  const preloader = doc.querySelector('[data-preloader]');
  const started = performance.now();
  let revealed = false;
  const onReady = [];
  function finishLoading() {
    if (revealed) return;
    revealed = true;
    preloader?.classList.add('is-done');
    onReady.forEach((fn) => fn());
  }
  if (reduceMotion || !preloader) {
    finishLoading();
  } else {
    const done = () => window.setTimeout(finishLoading, Math.max(0, 450 - (performance.now() - started)));
    if (doc.readyState === 'complete') done();
    else window.addEventListener('load', done, { once: true });
    window.setTimeout(finishLoading, 1600); // never wait long for slow images
  }
  const whenReady = (fn) => (revealed ? fn() : onReady.push(fn));

  /* ---------- Header: transparent at the top, then a bar that slides in ---------- */

  const header = doc.querySelector('[data-header]');
  const bar = doc.querySelector('[data-header-bar]');
  let ticking = false;
  function onScroll() {
    ticking = false;
    const y = window.scrollY;
    if (header && bar && !header.classList.contains('header--solid')) {
      const h = bar.offsetHeight;
      header.classList.toggle('is-fixed', y > h + 100);
      header.classList.toggle('is-shown', y > 600);
    }
    parallax();
  }
  window.addEventListener(
    'scroll',
    () => {
      if (!ticking) {
        ticking = true;
        requestAnimationFrame(onScroll);
      }
    },
    { passive: true },
  );

  /* ---------- Mobile menu ---------- */

  const toggle = doc.querySelector('[data-menu-toggle]');
  const menu = doc.querySelector('[data-menu]');
  if (toggle && menu) {
    const label = toggle.querySelector('[data-menu-label]');
    const setOpen = (open) => {
      menu.hidden = !open;
      menu.classList.toggle('is-open', open);
      toggle.setAttribute('aria-expanded', String(open));
      if (label) label.textContent = open ? 'Close menu' : 'Menu';
    };
    toggle.addEventListener('click', (e) => {
      e.preventDefault();
      setOpen(menu.hidden);
    });
    toggle.addEventListener('keydown', (e) => {
      if (e.key === ' ') {
        e.preventDefault();
        toggle.click();
      }
    });
    menu.addEventListener('click', (e) => {
      if (e.target.closest('[data-menu-link]')) setOpen(false);
    });
    doc.addEventListener('keydown', (e) => {
      if (e.key === 'Escape' && !menu.hidden) {
        setOpen(false);
        toggle.focus();
      }
    });
    window.matchMedia('(min-width: 1100px)').addEventListener('change', (e) => {
      if (e.matches) setOpen(false);
    });
  }

  /* ---------- Split headings into letters (words for long lines) ---------- */

  const segmenter = 'Segmenter' in Intl ? new Intl.Segmenter(undefined, { granularity: 'grapheme' }) : null;
  const graphemes = (s) => (segmenter ? [...segmenter.segment(s)].map((g) => g.segment) : Array.from(s));

  function split(el) {
    if (el.dataset.splitDone) return;
    el.dataset.splitDone = '1';
    const text = el.textContent.replace(/\s+/g, ' ').trim();
    const byWord = text.length > 60;
    let index = 0;
    const walk = (node) => {
      [...node.childNodes].forEach((child) => {
        if (child.nodeType === Node.TEXT_NODE) {
          const frag = doc.createDocumentFragment();
          child.textContent.split(/(\s+)/).forEach((part) => {
            if (!part) return;
            if (/^\s+$/.test(part)) {
              frag.appendChild(doc.createTextNode(' '));
              return;
            }
            const word = doc.createElement('span');
            word.className = 'split-word';
            word.setAttribute('aria-hidden', 'true');
            if (byWord) {
              word.classList.add('split-char');
              word.style.setProperty('--ci', String(index++));
              word.textContent = part;
            } else {
              graphemes(part).forEach((g) => {
                const ch = doc.createElement('span');
                ch.className = 'split-char';
                ch.style.setProperty('--ci', String(index++));
                ch.textContent = g;
                word.appendChild(ch);
              });
            }
            frag.appendChild(word);
          });
          child.replaceWith(frag);
        } else if (child.nodeType === Node.ELEMENT_NODE && !child.matches('svg, .tbc, .sr-only')) {
          walk(child);
        }
      });
    };
    walk(el);
    const label = doc.createElement('span');
    label.className = 'sr-only';
    label.textContent = text;
    el.appendChild(label);
  }

  const animated = [...doc.querySelectorAll('[data-split], [data-fade], [data-curtain]')];
  if (!reduceMotion) doc.querySelectorAll('[data-split]').forEach(split);

  /* ---------- Scroll-triggered entrances (at 85% of the viewport) ---------- */

  const inHero = (el) => el.closest('[data-slide]');
  if (reduceMotion || !('IntersectionObserver' in window)) {
    animated.forEach((el) => el.classList.add('is-in'));
  } else {
    const io = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add('is-in');
          io.unobserve(entry.target);
        });
      },
      { rootMargin: '0px 0px -15% 0px', threshold: 0 },
    );
    whenReady(() => animated.filter((el) => !inHero(el)).forEach((el) => io.observe(el)));
  }

  /* ---------- Hero slider ---------- */

  const slider = doc.querySelector('[data-slider]');
  if (slider) {
    const slides = [...slider.querySelectorAll('[data-slide]')];
    const panels = [...slider.querySelectorAll('[data-panel]')];
    const dots = [...slider.querySelectorAll('[data-dot]')];
    let current = 0;
    let timer = 0;

    const animateIn = (slide) => {
      slide.querySelectorAll('[data-split], [data-fade]').forEach((el) => {
        el.classList.remove('is-in');
        void el.offsetWidth;
        el.classList.add('is-in');
      });
    };
    const setState = (slide, active) => {
      slide.setAttribute('aria-hidden', String(!active));
      if ('inert' in slide) slide.inert = !active;
    };
    slides.forEach((s, i) => setState(s, i === 0));
    whenReady(() => animateIn(slides[0]));

    const go = (next, dir = 1) => {
      if (next === current || slides.length < 2) return;
      const from = slides[current];
      const to = slides[next];
      // Place the incoming slide on the side it enters from, without animating.
      to.classList.add('no-anim');
      to.classList.toggle('is-prev', dir < 0);
      void to.offsetWidth;
      to.classList.remove('no-anim');
      from.classList.remove('is-active');
      from.classList.toggle('is-prev', dir > 0);
      to.classList.remove('is-prev');
      to.classList.add('is-active');
      setState(from, false);
      setState(to, true);
      from.querySelectorAll('[data-split], [data-fade]').forEach((el) => el.classList.remove('is-in'));
      animateIn(to);
      panels.forEach((p, i) => p.classList.toggle('is-active', i === next));
      dots.forEach((d, i) => {
        d.classList.toggle('is-active', i === next);
        if (i === next) d.setAttribute('aria-current', 'true');
        else d.removeAttribute('aria-current');
      });
      current = next;
    };
    const nextSlide = () => go((current + 1) % slides.length, 1);
    const stop = () => window.clearInterval(timer);
    const start = () => {
      stop();
      if (!reduceMotion && slides.length > 1) timer = window.setInterval(nextSlide, 5000);
    };
    dots.forEach((d) =>
      d.addEventListener('click', () => {
        const n = Number(d.dataset.dot);
        go(n, n > current ? 1 : -1);
        start();
      }),
    );
    slider.addEventListener('mouseenter', stop);
    slider.addEventListener('mouseleave', start);
    slider.addEventListener('focusin', stop);
    slider.addEventListener('focusout', start);
    doc.addEventListener('visibilitychange', () => (doc.hidden ? stop() : start()));
    let startX = null;
    slider.addEventListener('touchstart', (e) => {
      startX = e.touches[0].clientX;
    }, { passive: true });
    slider.addEventListener('touchend', (e) => {
      if (startX === null) return;
      const dx = e.changedTouches[0].clientX - startX;
      startX = null;
      if (Math.abs(dx) > 50) {
        go((current + (dx < 0 ? 1 : slides.length - 1)) % slides.length, dx < 0 ? 1 : -1);
        start();
      }
    });
    whenReady(start);
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
        if (!reduceMotion) {
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

  /* ---------- Parallax backgrounds ---------- */

  const layers = [...doc.querySelectorAll('[data-parallax]')];
  function parallax() {
    if (!layers.length) return;
    const vh = window.innerHeight;
    layers.forEach((layer) => {
      if (reduceMotion || !wide.matches) {
        layer.style.transform = '';
        return;
      }
      const rect = layer.parentElement.getBoundingClientRect();
      if (rect.bottom < 0 || rect.top > vh) return;
      const progress = (rect.top + rect.height / 2 - vh / 2) / vh;
      layer.style.transform = `translate3d(0, ${(progress * -12).toFixed(2)}%, 0)`;
    });
  }
  onScroll();

  /* ---------- Cursor: a dot and a trailing ring, on mouse-driven screens ---------- */

  if (!reduceMotion && window.matchMedia('(hover: hover) and (pointer: fine)').matches) {
    const dot = doc.createElement('div');
    const ring = doc.createElement('div');
    dot.className = 'cursor';
    ring.className = 'cursor-ring';
    dot.setAttribute('aria-hidden', 'true');
    ring.setAttribute('aria-hidden', 'true');
    doc.body.append(dot, ring);
    let x = -100;
    let y = -100;
    let rx = x;
    let ry = y;
    const dark = '.hero, .ticker, .cta-band, .closing, .footer, .page-header, .header, .lightbox';
    doc.addEventListener('mousemove', (e) => {
      x = e.clientX;
      y = e.clientY;
      dot.style.transform = `translate3d(${x}px, ${y}px, 0)`;
      const onDark = Boolean(e.target.closest?.(dark));
      dot.classList.toggle('on-dark', onDark);
      ring.classList.toggle('on-dark', onDark);
      ring.classList.toggle('is-active', Boolean(e.target.closest?.('a, button, summary, label, input, textarea, select')));
    });
    doc.addEventListener('mouseleave', () => {
      x = -100;
      y = -100;
    });
    const follow = () => {
      rx += (x - rx) * 0.18;
      ry += (y - ry) * 0.18;
      ring.style.transform = `translate3d(${rx.toFixed(1)}px, ${ry.toFixed(1)}px, 0)`;
      requestAnimationFrame(follow);
    };
    follow();
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
      layout();
    });

    /* Balanced rows: each photo keeps its proportions; every row spans the full width. */
    function layout() {
      const visible = items.filter((li) => !li.hidden);
      const width = gallery.getBoundingClientRect().width - 1;
      if (!visible.length || width <= 0) return;
      const gap = parseFloat(getComputedStyle(gallery).columnGap) || 0;
      const ideal = width < 600 ? 200 : width < 1000 ? 270 : 330;
      const ratios = visible.map((li) => parseFloat(li.style.getPropertyValue('--ar')) || 1);
      const total = ratios.reduce((a, b) => a + b, 0);
      let best = null;
      for (let n = 1; n <= Math.min(visible.length, 60); n++) {
        const rows = [];
        let row = [];
        let acc = 0;
        ratios.forEach((r, i) => {
          if (row.length && rows.length < n - 1 && acc + r / 2 > (total * (rows.length + 1)) / n) {
            rows.push(row);
            row = [];
          }
          row.push(i);
          acc += r;
        });
        rows.push(row);
        const heights = rows.map((rw) => (width - gap * (rw.length - 1)) / rw.reduce((s, i) => s + ratios[i], 0));
        const score = heights.reduce((s, h) => s + Math.abs(Math.log(h / ideal)), 0) / heights.length;
        if (!best || score < best.score) best = { rows, heights, score };
      }
      best.rows.forEach((rw, k) =>
        rw.forEach((i) => {
          visible[i].style.flex = '0 0 auto';
          visible[i].style.width = `${Math.floor(ratios[i] * best.heights[k] * 100) / 100}px`;
        }),
      );
    }
    layout();
    if ('ResizeObserver' in window) {
      let lastWidth = gallery.clientWidth;
      new ResizeObserver(() => {
        if (gallery.clientWidth === lastWidth) return;
        lastWidth = gallery.clientWidth;
        requestAnimationFrame(layout);
      }).observe(gallery);
    }

    const box = doc.querySelector('[data-lightbox]');
    if (box && typeof box.showModal === 'function') {
      const img = box.querySelector('[data-lightbox-img]');
      const caption = box.querySelector('[data-lightbox-caption]');
      const count = box.querySelector('[data-lightbox-count]');
      const stage = box.querySelector('.lightbox__stage');
      let film = null;
      let list = [];
      let index = 0;

      const stopFilm = () => {
        if (!film) return;
        film.pause();
        film.hidden = true;
        film.removeAttribute('src');
        film.load();
      };

      const show = (i) => {
        index = (i + list.length) % list.length;
        const b = list[index];
        count.textContent = `${pad(index + 1)} / ${pad(list.length)}`;
        caption.textContent = b.dataset.caption || '';
        if (b.dataset.video) {
          if (!film) {
            film = doc.createElement('video');
            film.className = 'lightbox__video';
            film.controls = true;
            film.playsInline = true;
            film.preload = 'auto';
            stage.appendChild(film);
          }
          img.hidden = true;
          film.hidden = false;
          film.poster = b.dataset.src;
          film.src = b.dataset.video;
          film.setAttribute('aria-label', b.dataset.alt || 'Film');
          film.play().catch(() => {});
          return;
        }
        stopFilm();
        img.hidden = false;
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
          requestAnimationFrame(() => img.classList.remove('is-loading'));
        };
        (next.decode ? next.decode() : Promise.resolve()).then(apply, apply);
      };

      gallery.addEventListener('click', (e) => {
        const link = e.target.closest('.gallery__open');
        if (!link || e.metaKey || e.ctrlKey || e.shiftKey) return;
        e.preventDefault();
        list = items.filter((li) => !li.hidden).map((li) => li.querySelector('.gallery__open'));
        box.showModal();
        show(list.indexOf(link));
      });
      box.querySelector('[data-lightbox-prev]').addEventListener('click', () => show(index - 1));
      box.querySelector('[data-lightbox-next]').addEventListener('click', () => show(index + 1));
      box.querySelector('[data-lightbox-close]').addEventListener('click', () => box.close());
      box.addEventListener('close', stopFilm);
      box.addEventListener('keydown', (e) => {
        if (e.target === film) return;
        if (e.key === 'ArrowLeft') show(index - 1);
        if (e.key === 'ArrowRight') show(index + 1);
      });
      stage.addEventListener('click', (e) => {
        if (e.target === stage) box.close();
      });
      let swipeX = null;
      stage.addEventListener('pointerdown', (e) => {
        swipeX = e.target.closest('video') ? null : e.clientX;
      });
      stage.addEventListener('pointerup', (e) => {
        if (swipeX === null) return;
        const dx = e.clientX - swipeX;
        swipeX = null;
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

  root.classList.add('is-ready');
})();
