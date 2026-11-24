// The hero: the real Overview screen arrives like a page being laid down, leans a little toward the pointer, and
// flattens as the page scrolls. Three notes float over it at their own depths. Behind, a faint folder map twinkles.
import { animate, enter, ticker } from './motion/live.mjs';
import { Spring, rng, clamp, lerp, ease } from './motion/spring.mjs';
import { motion } from './motion/motion.mjs';

const TILE_COLORS = ['#2f6fd8', '#17807a', '#6a55d4', '#3d62a8', '#2678a6', '#7d4fc0'];
const SOFT = { response: 0.7, damping: 0.95 };

export default function hero(el) {
  // The background: a grid of faint tiles, a seeded few of them lit and breathing on their own clocks.
  const grid = el.querySelector('[data-hero-tiles]');
  const r = rng(20261122);
  let html = '';
  for (let i = 0; i < 14 * 9; i++) {
    html += r() < 0.2
      ? `<i class="lit" style="--c:${TILE_COLORS[Math.floor(r() * TILE_COLORS.length)]};--d:${(5 + r() * 6).toFixed(1)}s;--t:${(-r() * 9).toFixed(1)}s"></i>`
      : '<i></i>';
  }
  grid.innerHTML = html;
  new IntersectionObserver(([e]) => el.classList.toggle('is-off', !e.isIntersecting)).observe(el);

  const stage = el.querySelector('[data-hero-stage]');
  const tilt = el.querySelector('[data-hero-tilt]');
  const notes = [...el.querySelectorAll('.callout')].map((n) => ({ el: n, depth: +n.dataset.depth || 40 }));

  // Arrival: the window on the slow page spring, then the notes pop up one by one on paper.
  animate(el.querySelector('[data-hero-enter]'), [
    { transform: 'translateY(80px) rotateX(18deg) scale(.93)', opacity: 0 },
    { transform: 'none', opacity: 1 },
  ], { preset: 'page', delay: 420 });
  notes.forEach((n, i) => {
    const a = enter(n.el, { y: 26, scale: 0.9, delay: 1250 + i * 150 });
    a.finished.then(() => { n.el.style.opacity = '1'; a.cancel(); }, () => { n.el.style.opacity = '1'; });
  });
  el.querySelectorAll('.callout-bars i').forEach((b, i) => animate(b, [{ transform: 'scaleX(0)' }, { transform: 'none' }], { preset: 'default', delay: 1750 + i * 90 }));

  // The lean: two springs follow the pointer; scroll adds its own part. One loop writes one transform per layer.
  const nx = new Spring(0, SOFT), ny = new Spring(0, SOFT);
  let shownY = -1, box = null;
  const measure = () => { box = stage.getBoundingClientRect(); box = { left: box.left + scrollX, top: box.top + scrollY, w: box.width, h: box.height }; };
  const loop = ticker((now, { calm }) => {
    if (calm) {
      tilt.style.transform = '';
      for (const n of notes) n.el.style.transform = '';
      return false;
    }
    const y = scrollY;
    const s = ease.out(clamp(y / (innerHeight * 0.8)));
    const px = nx.value(now), py = ny.value(now);
    tilt.style.transform = `translate3d(0, ${lerp(0, -24, s).toFixed(2)}px, 0) rotateX(${(lerp(9, 0, s) - py * 2.2).toFixed(3)}deg) rotateY(${(px * 3.4).toFixed(3)}deg) scale(${lerp(0.965, 1, s).toFixed(4)})`;
    for (const n of notes) n.el.style.transform = `translate3d(${(px * n.depth * 0.34).toFixed(2)}px, ${(py * n.depth * 0.3 - s * n.depth * 0.9).toFixed(2)}px, 0)`;
    const still = nx.settled(now) && ny.settled(now) && y === shownY;
    shownY = y;
    return still ? false : undefined;
  }, { watch: stage, layers: [tilt, ...notes.map((n) => n.el)] });

  measure();
  addEventListener('resize', () => { measure(); loop.wake(); }, { passive: true });
  addEventListener('scroll', loop.wake, { passive: true });
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    el.addEventListener('pointermove', (ev) => {
      const now = performance.now() / 1000;
      nx.to(clamp((ev.pageX - box.left) / box.w * 2 - 1, -1, 1), now);
      ny.to(clamp((ev.pageY - box.top) / box.h * 2 - 1, -1, 1), now);
      loop.wake();
    });
    el.addEventListener('pointerleave', () => { const now = performance.now() / 1000; nx.to(0, now); ny.to(0, now); loop.wake(); });
  }
  motion.on(() => { shownY = -1; loop.wake(); });
  loop.wake();
}
