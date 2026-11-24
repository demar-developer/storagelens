// The hero's deck: the seven Overviews, drawn by the seven released apps from one sample, standing as a fan of windows
// in real depth. The chosen look faces you. Choosing another turns the whole fan (CSS transitions on the default
// spring, so a second choice mid-turn simply carries on from where the cards are). Until someone touches the page it
// walks through the looks by itself.
import { animate, ticker } from '../../js/motion/live.mjs';
import { Spring, clamp, lerp, ease } from '../../js/motion/spring.mjs';
import { motion } from '../../js/motion/motion.mjs';
import { once } from '../../js/core.mjs';
import { LOOKS, ids, look, current, onLook, setLook, step, picture } from '../../js/looks.mjs';

const SOFT = { response: 0.7, damping: 0.95 };

export default function deck(el) {
  const stage = el.querySelector('[data-deck-stage]'), name = el.querySelector('[data-deck-name]'), line = el.querySelector('[data-deck-line]');
  const first = stage.querySelector('.deck-card');
  // The page arrives with Standard's picture already in it; the other six windows are added around it.
  stage.insertAdjacentHTML('beforeend', LOOKS.slice(1).map((l) => `<button type="button" class="deck-card" data-look="${l.id}" aria-label="${l.name}: put this look on">
    <img src="${picture(l.id)}" width="1360" height="880" alt="" decoding="async"></button>`).join(''));
  const cards = [first, ...stage.querySelectorAll('.deck-card:not(:first-child)')];
  const n = cards.length;

  function place(id) {
    const at = ids.indexOf(id);
    cards.forEach((c, i) => {
      let d = i - at;
      if (d > n / 2) d -= n; else if (d < -n / 2) d += n;          // the shorter way round: -3 … 3
      const a = Math.abs(d);
      c.style.transform = `translate3d(${d * 14}%, ${a * 1.4}%, ${-a * 170}px) rotateY(${-d * 6.5}deg) scale(${1 - a * 0.045})`;
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
  for (const c of cards) c.addEventListener('click', () => { mine(); setLook(c.dataset.look, c); });
  el.addEventListener('keydown', (ev) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[ev.key];
    if (d) { ev.preventDefault(); mine(); step(d, cards[ids.indexOf(current())]); }
  });

  // It rises into place once, as one object.
  once(animate(el, [{ transform: 'translateY(70px) scale(.95)', opacity: 0 }, { transform: 'none', opacity: 1 }], { preset: 'page', delay: 380 }));

  // The fan leans a little toward the pointer, and lies flatter as the page scrolls.
  const nx = new Spring(0, SOFT), ny = new Spring(0, SOFT);
  let shownY = -1, box = null;
  const measure = () => { const r = el.getBoundingClientRect(); box = { left: r.left + scrollX, top: r.top + scrollY, w: r.width, h: r.height }; };
  const lean = ticker((t, { calm }) => {
    if (calm) { stage.style.transform = ''; return false; }
    const y = scrollY, s = ease.out(clamp(y / (innerHeight * 0.8)));
    stage.style.transform = `rotateX(${(lerp(7, 0, s) - ny.value(t) * 2).toFixed(3)}deg) rotateY(${(nx.value(t) * 3).toFixed(3)}deg)`;
    const still = nx.settled(t) && ny.settled(t) && y === shownY;
    shownY = y;
    return still ? false : undefined;
  }, { watch: el, layers: [stage] });
  measure();
  addEventListener('resize', () => { measure(); lean.wake(); }, { passive: true });
  addEventListener('scroll', lean.wake, { passive: true });
  if (matchMedia('(hover: hover) and (pointer: fine)').matches) {
    el.addEventListener('pointermove', (ev) => {
      const t = performance.now() / 1000;
      nx.to(clamp((ev.pageX - box.left) / box.w * 2 - 1, -1, 1), t); ny.to(clamp((ev.pageY - box.top) / box.h * 2 - 1, -1, 1), t);
      lean.wake();
    });
    el.addEventListener('pointerleave', () => { const t = performance.now() / 1000; nx.to(0, t); ny.to(0, t); lean.wake(); });
  }
  motion.on(() => { shownY = -1; lean.wake(); });
  lean.wake();

  // Its own life: the next look every few seconds, while the hero is on screen and nobody has taken over.
  let auto = true, seen = true, timer = 0;
  function mine() { auto = false; clearTimeout(timer); }
  const tick = () => {
    clearTimeout(timer);
    if (!auto) return;
    timer = setTimeout(() => {
      if (auto && seen && !document.hidden && !motion.calm && scrollY < 140) step(1, cards[(ids.indexOf(current()) + 1) % n]);
      tick();
    }, 4600);
  };
  new IntersectionObserver(([e]) => { seen = e.isIntersecting; }, { threshold: 0.5 }).observe(el);
  for (const type of ['pointerdown', 'keydown', 'wheel', 'touchstart']) addEventListener(type, mine, { once: true, passive: true });
  tick();
}
