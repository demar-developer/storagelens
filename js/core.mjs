// What the whole landing page runs on: springs handed to CSS, the calm-motion button, reveals, split headlines, counters,
// the nav, the light on cards, the download buttons, and loading each interactive piece. Rules: site/README.md.
import { motion } from './motion/motion.mjs';
import { animate, enter, ticker } from './motion/live.mjs';
import { easing, ease } from './motion/spring.mjs';

const root = document.documentElement;
export const $$ = (sel, el = document) => [...el.querySelectorAll(sel)];

/** Play an animation once, then hand the element back to its stylesheet. */
export const once = (a) => a.finished.then(() => a.cancel(), () => {});

// A headline's words rise out of their own line, one after another, on the heavy spring (no overshoot on type).
export function splitIn(el) {
  const text = el.textContent.trim().replace(/\s+/g, ' ');
  el.setAttribute('aria-label', text);
  el.innerHTML = text.split(' ').map((w) => `<span class="w" aria-hidden="true"><span>${w}</span></span>`).join(' ');
  el.classList.add('is-split');
  $$('.w > span', el).forEach((w, i) => once(animate(w, [{ transform: 'translateY(110%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { preset: 'heavy', delay: Math.min(i, 9) * 45 })));
}

/**
 * Start the page. `pieces` maps a data-module name to a function that imports its module (default export: f(element)).
 */
export function boot(pieces) {
  window.__slReady = true;

  // The same springs as every scripted move, as CSS easings for hover and press transitions.
  for (const p of ['snappy', 'default', 'paper']) {
    const e = easing(p);
    root.style.setProperty(`--spring-${p}`, e.easing);
    root.style.setProperty(`--dur-${p}`, `${e.duration}ms`);
  }

  // ── Calm motion: the visitor's switch (it also follows the system's reduce-motion setting until pressed). ──
  function showMotion(level) {
    for (const b of $$('[data-motion-toggle]')) {
      const calm = level === 'calm';
      b.setAttribute('aria-pressed', String(calm));
      b.querySelector('[data-motion-icon]')?.setAttribute('href', calm ? '#i-play' : '#i-pause');
      b.title = calm ? 'Motion is calm. Press for full motion.' : 'Motion is full. Press for calm motion.';
    }
  }
  for (const b of $$('[data-motion-toggle]')) b.addEventListener('click', () => motion.toggle());
  motion.on(showMotion);
  showMotion(motion.level);

  // ── Reveals: things rise into place once, on the paper spring; a group staggers its members. ──
  function settle(el, anim) {
    const done = () => { el.classList.add('is-in'); anim.cancel(); };
    anim.finished.then(done, () => el.classList.add('is-in'));
  }
  function reveal(el) {
    if (el.hasAttribute('data-split')) return splitIn(el);
    let delay = +el.dataset.revealDelay || 0;
    const group = el.closest('[data-reveal-group]');
    if (group) delay += Math.min($$('[data-reveal]', group).indexOf(el), 8) * 55;
    settle(el, enter(el, { y: 26, scale: 1, delay }));
  }
  const seen = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { seen.unobserve(e.target); reveal(e.target); }
  }, { rootMargin: '0px 0px -10% 0px', threshold: 0.06 });
  for (const el of $$('[data-reveal], [data-split]')) seen.observe(el);

  // ── Counters: a number runs up to its value once. In calm motion it is simply there. ──
  const counted = new IntersectionObserver((entries) => {
    for (const e of entries) {
      if (!e.isIntersecting) continue;
      counted.unobserve(e.target);
      const el = e.target, to = +el.dataset.count, dec = +el.dataset.decimals || 0;
      if (motion.calm || !to) continue;
      let t0 = 0;
      const t = ticker((now) => {
        t0 ||= now;
        const k = Math.min(1, (now - t0) / 1.3);
        el.textContent = (to * ease.expoOut(k)).toFixed(dec);
        if (k >= 1) { el.textContent = to.toFixed(dec); t.destroy(); return false; }
      });
      t.wake();
    }
  }, { threshold: 0.6 });
  for (const el of $$('[data-count]')) counted.observe(el);

  // ── Nav: a solid bar once the page has moved, a thin line for how far down you are, and where you are. ──
  const nav = document.querySelector('[data-nav]');
  const bar = document.querySelector('[data-scroll-progress]');
  let lastY = -1;
  const scrollLine = ticker(() => {
    const y = scrollY;
    if (y === lastY) return false;
    lastY = y;
    const max = root.scrollHeight - innerHeight;
    if (bar) bar.style.transform = `scaleX(${max > 0 ? Math.min(1, y / max) : 0})`;
    nav?.classList.toggle('is-stuck', y > 24);
  });
  addEventListener('scroll', scrollLine.wake, { passive: true });
  addEventListener('resize', scrollLine.wake, { passive: true });
  scrollLine.wake();

  const links = new Map($$('.nav-links a[href^="#"]').map((a) => [a.getAttribute('href').slice(1), a]));
  const here = new IntersectionObserver((entries) => {
    for (const e of entries) links.get(e.target.id)?.classList.toggle('is-here', e.isIntersecting);
  }, { rootMargin: '-45% 0px -50% 0px' });
  for (const id of links.keys()) { const s = document.getElementById(id); if (s) here.observe(s); }

  // ── A light that follows the pointer across a card: one pre-drawn glow, moved with a transform. ──
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    for (const card of $$('[data-spot]')) {
      const spot = document.createElement('i');
      spot.className = 'spot';
      spot.setAttribute('aria-hidden', 'true');
      card.prepend(spot);
      let raf = 0, x = 0, y = 0;
      card.addEventListener('pointermove', (ev) => {
        const r = card.getBoundingClientRect();
        x = ev.clientX - r.left; y = ev.clientY - r.top;
        raf ||= requestAnimationFrame(() => { raf = 0; spot.style.transform = `translate3d(${x}px, ${y}px, 0)`; });
      });
    }
  }

  // ── Download buttons. The one in the last section is an ordinary link to the app's file, written in the page. The
  //    same button elsewhere leads to that section until this runs; from then on it downloads too and brings the
  //    section into view, because that is where the page says what Windows will ask next. Nothing is fetched by
  //    script: the browser asks for the file and saves it. (js/looks.mjs keeps every one
  //    of these links on the app of the look that is on.) ──
  const mainLink = document.querySelector('a[data-download-main]');
  const getSection = document.getElementById('get');
  if (mainLink && getSection) {
    for (const a of $$('a[data-download]')) {
      if (a === mainLink) continue;
      a.href = mainLink.href;
      a.addEventListener('click', () => getSection.scrollIntoView({ behavior: motion.calm ? 'auto' : 'smooth' }));
    }
  }

  // ── Each interactive piece is its own module. Coming near one starts it at once. Otherwise they are built ahead of
  //    need, one per idle moment and in page order, so the work (the first layout of a redrawn window is the heavy
  //    part) is not done in the middle of a scroll. ──
  const hosts = $$('[data-module]');
  const started = new WeakMap();
  function start(el) {
    if (started.has(el)) return started.get(el);
    const name = el.dataset.module;
    const p = pieces[name]().then((m) => {
      const t0 = performance.now();
      m.default(el);
      performance.measure(`piece:${name}`, { start: t0, end: performance.now() });
    }).catch((err) => console.error(`StorageLens page: ${name} did not start`, err));
    started.set(el, p);
    return p;
  }
  const near = new IntersectionObserver((entries) => {
    for (const e of entries) if (e.isIntersecting) { near.unobserve(e.target); start(e.target); }
  }, { rootMargin: '600px 0px' });
  for (const el of hosts) near.observe(el);

  const whenIdle = window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 3000 }) : (f) => setTimeout(f, 300);
  function ahead() {
    const el = hosts.find((h) => !started.has(h));
    if (el) start(el).then(() => whenIdle(ahead));
  }
  if (document.readyState === 'complete') whenIdle(ahead); else addEventListener('load', () => whenIdle(ahead), { once: true });
}
