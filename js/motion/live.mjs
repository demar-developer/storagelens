// Live mode: spring motion on a web page with no WebGL and, wherever it can, no frame loop (the motion-studio skill,
// reference/RULES-live.md). A site vendors web/spring.mjs, web/live.mjs and a motion.mjs beside them (this one, or a
// one-line re-export of the site's own motion preference with the same API).
//
//   animate(el, keyframes, opts)   a one-shot move run by the compositor: element.animate() with a spring turned into
//   enter(el, opts) / exit(el, …)  a CSS linear() easing. Enters, exits, reveals, presses: no script per frame.
//   ticker(paint, opts)            an on-demand frame loop for motion that follows input or changes target mid-move
//                                  (a drag, a follow, a spin with inertia). It runs only while paint() says something
//                                  moves, sleeps off screen and in hidden tabs, and gives its layers will-change only
//                                  while they move.
//   scrub(el, draw, opts)          a scroll-driven scene: draw(progress) whenever the element's place in the viewport
//                                  changes, and nothing otherwise.
//
// Calm motion (motion.mjs: the visitor's choice, else the system's reduce-motion setting): "no travel, parallax or
// zooming; it doesn't mean no life". animate() drops transforms in calm and keeps opacity and colour, and stops travel
// already under way when calm is turned on; ticker() and scrub() pass { calm } so a scene can hold still.
import { motion } from './motion.mjs';
import { easing as springEasing, preset } from './spring.mjs';

const TRAVEL = ['transform', 'translate', 'scale', 'rotate', 'offsetDistance', 'offset-distance'];
const curves = new Map();
function curve(p) {
  const key = typeof p === 'string' ? p : JSON.stringify(preset(p));
  if (!curves.has(key)) curves.set(key, springEasing(p));
  return curves.get(key);
}

const hasTravel = (keyframes) => (Array.isArray(keyframes) ? keyframes : [keyframes]).some((f) => Object.keys(f).some((k) => TRAVEL.includes(k)));

/** Keyframes without travel, or null when nothing but travel was animated. */
function stillFrames(keyframes) {
  const keep = (k) => !TRAVEL.includes(k);
  if (Array.isArray(keyframes)) {
    const out = keyframes.map((f) => Object.fromEntries(Object.entries(f).filter(([k]) => keep(k))));
    return out.some((f) => Object.keys(f).some((k) => !['offset', 'easing', 'composite'].includes(k))) ? out : null;
  }
  const out = Object.fromEntries(Object.entries(keyframes).filter(([k]) => keep(k)));
  return Object.keys(out).some((k) => !['offset', 'easing', 'composite'].includes(k)) ? out : null;
}

/**
 * element.animate() with a spring. opts: { preset = 'default', delay = 0 (ms), fill = 'both', ...any Animation option }.
 * In calm motion the travel is dropped; when only travel was animated, the element takes its end state at once. A
 * move that is travelling when calm is turned on lands at its end, and a loop stops (its .finished then rejects).
 * Returns the Animation (await .finished to chain).
 */
export function animate(el, keyframes, { preset: p = 'default', delay = 0, fill = 'both', ...rest } = {}) {
  if (motion.calm) {
    const still = stillFrames(keyframes);
    if (!still) return el.animate(keyframes, { duration: 0, fill: 'forwards' });
    const { easing, duration } = curve(p);
    return el.animate(still, { duration, easing, delay, fill, ...rest });
  }
  const { easing, duration } = curve(p);
  const anim = el.animate(keyframes, { duration, easing, delay, fill, ...rest });
  if (hasTravel(keyframes)) {
    const off = motion.on((level) => {
      if (level !== 'calm') return;
      off();
      if (anim.effect.getComputedTiming().endTime === Infinity) anim.cancel(); else anim.finish();
    });
    anim.finished.then(off, off);
  }
  return anim;
}

/** Rise into place: from `y` px below (and `scale`), arriving on the `paper` spring unless told otherwise. */
export function enter(el, { y = 24, x = 0, scale = 0.98, fade = true, preset: p = 'paper', delay = 0 } = {}) {
  const from = { transform: `translate(${x}px, ${y}px) scale(${scale})` };
  if (fade) from.opacity = 0;
  return animate(el, [from, { transform: 'none', ...(fade ? { opacity: 1 } : {}) }], { preset: p, delay });
}

/** Leave the way it came (lift out by `y` px); fill keeps the end state, so hide or remove the element after. */
export function exit(el, { y = -16, x = 0, scale = 1, fade = true, preset: p = 'snappy', delay = 0 } = {}) {
  const to = { transform: `translate(${x}px, ${y}px) scale(${scale})` };
  if (fade) to.opacity = 0;
  return animate(el, [{ transform: 'none', ...(fade ? { opacity: 1 } : {}) }, to], { preset: p, delay, fill: 'forwards' });
}

/**
 * An on-demand frame loop. paint(now, { dt, calm }) runs once per frame with now in seconds; return false when
 * everything has settled and the loop sleeps until wake() is called again (wire wake() to the input that moves it).
 * opts: { watch: element whose visibility gates the loop, layers: elements that get will-change while it runs }.
 */
export function ticker(paint, { watch = null, layers = [] } = {}) {
  let raf = 0, running = false, onScreen = true, last = 0;
  const promote = (on) => { for (const l of layers) l.style.willChange = on ? 'transform' : ''; };
  function frame(ms) {
    const now = ms / 1000, dt = last ? now - last : 0;
    last = now;
    if (paint(now, { dt, calm: motion.calm }) === false) { sleep(); return; }
    raf = requestAnimationFrame(frame);
  }
  function wake() {
    if (running || !onScreen || document.hidden) return;
    running = true; last = 0; promote(true);
    raf = requestAnimationFrame(frame);
  }
  function sleep() {
    if (!running) return;
    running = false; cancelAnimationFrame(raf); promote(false);
  }
  const io = watch && new IntersectionObserver(([e]) => { onScreen = e.isIntersecting; if (onScreen) wake(); else sleep(); }, { rootMargin: '120px' });
  if (io) io.observe(watch);
  const onVisibility = () => (document.hidden ? sleep() : wake());
  document.addEventListener('visibilitychange', onVisibility);
  return {
    wake, sleep,
    get running() { return running; },
    destroy() { sleep(); if (io) io.disconnect(); document.removeEventListener('visibilitychange', onVisibility); },
  };
}

/**
 * How far `el` has travelled through the viewport, 0..1. 'through': 0 as its top enters at the bottom, 1 as its
 * bottom leaves at the top. 'pinned': progress through a tall container whose child is position: sticky.
 * Reads layout: call it before writing any styles in the same frame.
 */
export function progress(el, mode = 'through') {
  const r = el.getBoundingClientRect(), vh = innerHeight;
  const p = mode === 'pinned' ? -r.top / Math.max(1, r.height - vh) : (vh - r.top) / (vh + r.height);
  return Math.min(1, Math.max(0, p));
}

/**
 * A scroll-driven scene: draw(p, { calm }) whenever the element's progress changes, nothing in between. The loop
 * wakes on scroll (Lenis moves the real scroll position, so this follows its smoothing) and sleeps when still.
 */
export function scrub(el, draw, { mode = 'through', layers = [] } = {}) {
  let shown = -1;
  const t = ticker((now, { calm }) => {
    const p = progress(el, mode);
    if (p === shown) return false;
    shown = p;
    draw(p, { calm });
  }, { watch: el, layers });
  addEventListener('scroll', t.wake, { passive: true });
  addEventListener('resize', t.wake, { passive: true });
  const stopCalm = motion.on(() => { shown = -1; t.wake(); });
  t.wake();
  return {
    wake: t.wake, sleep: t.sleep,
    get running() { return t.running; },
    destroy() { t.destroy(); removeEventListener('scroll', t.wake); removeEventListener('resize', t.wake); stopCalm(); },
  };
}

export const calm = () => motion.calm;
