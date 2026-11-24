// How much a page moves, one answer for every part of it: 'full' (everything as designed) or 'calm'. Calm keeps the page
// alive without travel: no parallax, glide or slide-in, and things change place by fading. The visitor's own choice (a
// motion button calling motion.set or motion.toggle) wins and is remembered; without one, the system's reduce-motion
// setting picks calm (on Windows: Settings > Accessibility > Visual effects > Animation effects off).
// The choice is remembered in localStorage under html[data-motion-key] (default "motion"), and html[data-motion] always
// holds the current level, so CSS can follow it. A site with its own preference module re-exports it under this name
// instead, with the same API: level, calm, systemCalm, set(level), toggle(), on(f).
const KEY = document.documentElement.dataset.motionKey || 'motion';
const mq = matchMedia('(prefers-reduced-motion: reduce)');
let chosen = null;
try { const v = localStorage.getItem(KEY); if (v === 'full' || v === 'calm') chosen = v; } catch { }
const subs = new Set();
const level = () => chosen || (mq.matches ? 'calm' : 'full');
function apply() {
  const l = level();
  if (document.documentElement.dataset.motion !== l) document.documentElement.dataset.motion = l;
  subs.forEach((f) => f(l));
}
const onSystem = () => { if (!chosen) apply(); };
if (mq.addEventListener) mq.addEventListener('change', onSystem); else if (mq.addListener) mq.addListener(onSystem);

export const motion = {
  get level() { return level(); },
  get calm() { return level() === 'calm'; },
  // true when the system asks for reduced motion (whatever the visitor chose here)
  get systemCalm() { return mq.matches; },
  set(l) {
    chosen = l === 'calm' ? 'calm' : 'full';
    try { localStorage.setItem(KEY, chosen); } catch { }
    apply();
  },
  toggle() { motion.set(motion.calm ? 'full' : 'calm'); return motion.level; },
  // f(level) on every change; returns a function that stops listening
  on(f) { subs.add(f); return () => subs.delete(f); },
};
apply();
