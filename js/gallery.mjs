// The screens: a strip the browser scrolls natively (touch, wheel, keys, snap), so its feel is the device's own.
// On top of that: a mouse can drag it and let go with a throw, the two round buttons step one screen, and each
// screen swells to full size as it reaches the middle (a transform read from the scroll position, nothing else).
import { ticker } from './motion/live.mjs';
import { Spring, clamp } from './motion/spring.mjs';
import { motion } from './motion/motion.mjs';

export default function gallery(el) {
  const track = el.querySelector('[data-gallery-track]');
  const shots = [...track.querySelectorAll('.shot')];
  const figs = shots.map((s) => s.querySelector('figure'));
  const prev = document.querySelector('[data-gallery-prev]'), next = document.querySelector('[data-gallery-next]');
  let mids = [], half = 1, lastX = -1;

  function measure() {
    half = track.clientWidth / 2;
    mids = shots.map((s) => s.offsetLeft + s.offsetWidth / 2);
    lastX = -1;
    grow.wake();
  }
  const grow = ticker((now, { calm }) => {
    // A throw in progress moves the strip; otherwise we only follow where the browser has scrolled it.
    if (throwing) {
      track.scrollLeft = glide.value(now);
      if (glide.settled(now)) { throwing = false; track.classList.remove('is-drag'); }
    }
    const x = track.scrollLeft;
    if (x === lastX && !throwing) return false;
    lastX = x;
    for (let i = 0; i < figs.length; i++) {
      const d = clamp(Math.abs(mids[i] - (x + half)) / (half * 1.6));
      figs[i].style.transform = calm ? '' : `scale(${(1 - d * 0.07).toFixed(4)})`;
      figs[i].style.opacity = (1 - d * 0.55).toFixed(3);
    }
    prev.disabled = x < 8;
    next.disabled = x > track.scrollWidth - track.clientWidth - 8;
  }, { watch: el, layers: figs });
  track.addEventListener('scroll', grow.wake, { passive: true });
  new ResizeObserver(measure).observe(track);

  const nearest = (x) => mids.reduce((best, m, i) => (Math.abs(m - (x + half)) < Math.abs(mids[best] - (x + half)) ? i : best), 0);
  const go = (i) => track.scrollTo({ left: mids[clamp(i, 0, mids.length - 1)] - half, behavior: motion.calm ? 'auto' : 'smooth' });
  prev.addEventListener('click', () => go(nearest(track.scrollLeft) - 1));
  next.addEventListener('click', () => go(nearest(track.scrollLeft) + 1));

  // Dragging with a mouse. Letting go throws the strip: where it lands is read from the hand's speed, and a spring
  // with no overshoot carries it to that screen.
  const glide = new Spring(0, { response: 0.55, damping: 1 });
  let throwing = false, drag = null;
  track.addEventListener('pointerdown', (ev) => {
    if (ev.pointerType !== 'mouse' || ev.button !== 0) return;
    throwing = false;
    drag = { x: ev.clientX, left: track.scrollLeft, v: 0, t: performance.now(), lastX: ev.clientX, moved: false };
  });
  addEventListener('pointermove', (ev) => {
    if (!drag) return;
    const dx = ev.clientX - drag.x;
    if (!drag.moved && Math.abs(dx) < 5) return;
    if (!drag.moved) { drag.moved = true; track.classList.add('is-drag'); }
    const t = performance.now();
    if (t > drag.t) drag.v = 0.7 * drag.v + 0.3 * ((drag.lastX - ev.clientX) / (t - drag.t));   // px per ms, smoothed
    drag.t = t; drag.lastX = ev.clientX;
    track.scrollLeft = drag.left - dx;
  });
  addEventListener('pointerup', () => {
    if (!drag) return;
    const d = drag;
    drag = null;
    if (!d.moved) return;
    const from = track.scrollLeft, aim = mids[nearest(from + d.v * 260)] - half;
    glide.set(from).to(clamp(aim, 0, track.scrollWidth - track.clientWidth), performance.now() / 1000);
    throwing = true;
    grow.wake();
  });
  track.addEventListener('click', (ev) => { if (track.classList.contains('is-drag')) ev.preventDefault(); }, true);
  track.addEventListener('dragstart', (ev) => ev.preventDefault());
  track.addEventListener('wheel', () => { if (throwing) { throwing = false; track.classList.remove('is-drag'); } }, { passive: true });

  measure();
}
