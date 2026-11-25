// The hero: one window grown into a fan of seven, one per look. The Overview arrives like a page being
// laid down, leans a little toward the pointer and flattens as the page scrolls; three notes float in front of it at
// their own depths; a faint folder map twinkles behind. The other six looks stand behind the front window in real
// depth, and a click on one puts that look on (the fan turns on CSS transitions that use the default spring, so a
// second choice mid-turn carries on from where the windows are).
import { animate, enter, ticker } from './motion/live.mjs';
import { Spring, rng, clamp, lerp, ease } from './motion/spring.mjs';
import { motion } from './motion/motion.mjs';
import { once } from './core.mjs';
import { LOOKS, ids, look, current, onLook, setLook, step, picture } from './looks.mjs';

const SOFT = { response: 0.7, damping: 0.95 };

export default function hero(el) {
  // The background: a grid of faint tiles, a seeded few of them lit, in the look's own map colours.
  const grid = el.querySelector('[data-hero-tiles]');
  const r = rng(20261122);
  let html = '';
  for (let i = 0; i < 14 * 9; i++) {
    html += r() < 0.2
      ? `<i class="lit" style="--c:var(--m${1 + Math.floor(r() * 6)});--d:${(5 + r() * 6).toFixed(1)}s;--t:${(-r() * 9).toFixed(1)}s"></i>`
      : '<i></i>';
  }
  grid.innerHTML = html;
  new IntersectionObserver(([e]) => el.classList.toggle('is-off', !e.isIntersecting)).observe(el);

  const stage = el.querySelector('[data-hero-stage]'), tilt = el.querySelector('[data-hero-tilt]');
  const name = el.querySelector('[data-deck-name]'), line = el.querySelector('[data-deck-line]');
  const notes = [...el.querySelectorAll('.callout')].map((n) => ({ el: n, depth: +n.dataset.depth || 40 }));

  // The page arrives with Standard's window in it; the other six are added behind it, before the notes.
  const first = tilt.querySelector('.deck-card');
  first.insertAdjacentHTML('afterend', LOOKS.slice(1).map((l) => `<button type="button" class="deck-card" data-look="${l.id}" aria-label="${l.name}: put this look on">
    <img src="${picture(l.id)}" width="1360" height="880" alt="" decoding="async"></button>`).join(''));
  const cards = [...tilt.querySelectorAll('.deck-card')];
  const n = cards.length;

  function place(id) {
    const at = ids.indexOf(id);
    cards.forEach((c, i) => {
      let d = i - at;
      if (d > n / 2) d -= n; else if (d < -n / 2) d += n;          // the shorter way round: -3 … 3
      const a = Math.abs(d);
      c.style.transform = `translate3d(${d * 13}%, ${a * 1.4}%, ${-a * 170}px) rotateY(${-d * 6.5}deg) scale(${1 - a * 0.045})`;
      c.style.opacity = a === 3 ? 0.55 : 1;
      c.classList.toggle('is-front', d === 0);
      c.tabIndex = d === 0 ? -1 : 0;
      c.setAttribute('aria-current', String(d === 0));
    });
    const l = look(id);
    name.textContent = l.name; line.textContent = l.line;
  }
  place(current());
  onLook((id) => {
    place(id);
    for (const node of [name, line]) once(animate(node, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { preset: 'default' }));
  });
  for (const c of cards) c.addEventListener('click', () => setLook(c.dataset.look, c));
  stage.addEventListener('keydown', (ev) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[ev.key];
    if (d) { ev.preventDefault(); step(d, cards[ids.indexOf(current())]); }
  });

  // Arrival: the fan on the slow page spring, then the notes pop up one by one on paper.
  animate(el.querySelector('[data-hero-enter]'), [
    { transform: 'translateY(80px) rotateX(18deg) scale(.93)', opacity: 0 },
    { transform: 'none', opacity: 1 },
  ], { preset: 'page', delay: 420 });
  notes.forEach((nt, i) => {
    const a = enter(nt.el, { y: 26, scale: 0.9, delay: 1250 + i * 150 });
    a.finished.then(() => { nt.el.style.opacity = '1'; a.cancel(); }, () => { nt.el.style.opacity = '1'; });
  });
  el.querySelectorAll('.callout-bars i').forEach((b, i) => animate(b, [{ transform: 'scaleX(0)' }, { transform: 'none' }], { preset: 'default', delay: 1750 + i * 90 }));

  // The lean: two springs follow the pointer; scroll adds its own part. One loop writes one transform per layer.
  // The notes sit 70 px in front of the windows, so under the lean they drift across them as real things would.
  const nx = new Spring(0, SOFT), ny = new Spring(0, SOFT);
  let shownY = -1, box = null;
  const measure = () => { const b = stage.getBoundingClientRect(); box = { left: b.left + scrollX, top: b.top + scrollY, w: b.width, h: b.height }; };
  const loop = ticker((now, { calm }) => {
    if (calm) {
      tilt.style.transform = '';
      for (const nt of notes) nt.el.style.transform = '';
      return false;
    }
    const y = scrollY;
    const s = ease.out(clamp(y / (innerHeight * 0.8)));
    const px = nx.value(now), py = ny.value(now);
    tilt.style.transform = `translate3d(0, ${lerp(0, -24, s).toFixed(2)}px, 0) rotateX(${(lerp(9, 0, s) - py * 2.2).toFixed(3)}deg) rotateY(${(px * 3.4).toFixed(3)}deg) scale(${lerp(0.965, 1, s).toFixed(4)})`;
    for (const nt of notes) nt.el.style.transform = `translate3d(${(px * nt.depth * 0.34).toFixed(2)}px, ${(py * nt.depth * 0.3 - s * nt.depth * 0.9).toFixed(2)}px, 70px)`;
    const still = nx.settled(now) && ny.settled(now) && y === shownY;
    shownY = y;
    return still ? false : undefined;
  }, { watch: stage, layers: [tilt, ...notes.map((nt) => nt.el)] });

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
