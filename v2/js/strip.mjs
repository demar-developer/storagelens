// One view, in all seven layouts. The section is pinned and scrolling carries the strip sideways (the frame is a
// function of scroll progress alone). The tabs change which view all seven show. In calm motion, and on a phone, the
// strip is an ordinary sideways scroller instead.
import { animate, scrub } from '../../js/motion/live.mjs';
import { clamp } from '../../js/motion/spring.mjs';
import { motion } from '../../js/motion/motion.mjs';
import { once } from '../../js/core.mjs';
import { LOOKS, current, onLook, setLook, picture } from '../../js/looks.mjs';

const VIEWS = [
  ['overview', 'Overview', 'Find Projects in each: 6.74 GiB, whatever draws it.'],
  ['folders', 'Folder map', 'The same folders, as tiles, rings, columns, boards, rules and towers.'],
  ['files', 'Largest files', 'The same files in the same order.'],
  ['inspect', 'Details', 'One file’s details: 2.00 GiB on disk, and “back up first”.'],
  ['cleanup', 'Cleanup review', 'The same candidates, and no delete button in any of them.'],
  ['growth', 'What’s growing', 'The same growth since the previous scan.'],
  ['onedrive', 'OneDrive', 'What is on this PC and what is online only.'],
  ['plan', 'Review plan', 'Your saved decisions. Nothing is executed, in any layout.'],
  ['assistant', 'Assistant’s page', 'The same page from the Assistant, and each layout’s way of saying who is driving.'],
  ['chat', 'Assistant', 'Where each layout keeps the conversation.'],
];

export default function strip(el) {
  const track = el.querySelector('[data-strip-track]'), tabs = el.querySelector('[data-strip-tabs]'), foot = el.querySelector('[data-strip-foot]');
  const small = matchMedia('(max-width: 760px)');
  let view = 'overview';

  tabs.innerHTML = VIEWS.map(([id, label], i) => `<button type="button" class="tab" role="tab" aria-selected="${i === 0}" tabindex="${i === 0 ? 0 : -1}" data-view="${id}">${label}</button>`).join('');
  track.innerHTML = LOOKS.map((l) => `<figure class="strip-card" data-look="${l.id}"><button type="button" aria-label="${l.name}: put this look on">
    <img src="${picture(l.id, view)}" width="1360" height="880" loading="lazy" decoding="async" alt="${l.name}: Overview."></button>
    <figcaption><b>${l.name}</b><span>${l.line}</span></figcaption></figure>`).join('');
  const cards = [...track.children], imgs = cards.map((c) => c.querySelector('img')), buttons = [...tabs.children];

  function mark(id) { for (const c of cards) c.classList.toggle('is-on', c.dataset.look === id); }
  mark(current());
  onLook(mark);
  track.addEventListener('click', (ev) => { const c = ev.target.closest('.strip-card'); if (c) setLook(c.dataset.look, c); });

  function show(id) {
    if (id === view) return;
    view = id;
    const [, label, fact] = VIEWS.find((v) => v[0] === id);
    buttons.forEach((b) => { const on = b.dataset.view === id; b.setAttribute('aria-selected', String(on)); b.tabIndex = on ? 0 : -1; });
    foot.textContent = fact;
    once(animate(foot, [{ opacity: 0 }, { opacity: 1 }], { preset: 'default' }));
    imgs.forEach((img, i) => {
      img.style.opacity = '0';
      img.onload = () => { once(animate(img, [{ opacity: 0, transform: 'scale(1.02)' }, { opacity: 1, transform: 'none' }], { preset: 'default', delay: i * 40 })); img.style.opacity = ''; };
      img.loading = 'eager';
      img.src = picture(LOOKS[i].id, id); img.alt = `${LOOKS[i].name}: ${label}.`;
    });
  }
  tabs.addEventListener('click', (ev) => { const b = ev.target.closest('.tab'); if (b) show(b.dataset.view); });
  tabs.addEventListener('keydown', (ev) => {
    const d = { ArrowRight: 1, ArrowLeft: -1 }[ev.key];
    if (!d) return;
    ev.preventDefault();
    const next = buttons[(buttons.findIndex((b) => b.dataset.view === view) + d + buttons.length) % buttons.length];
    show(next.dataset.view); next.focus();
  });

  // Pinned travel: the strip's left edge runs from its start to where its last card has come fully into the window.
  let span = 0;
  const measure = () => { span = Math.max(0, track.scrollWidth - innerWidth); };
  const plain = () => motion.calm || small.matches;
  function mode() { el.classList.toggle('is-plain', small.matches); if (plain()) { track.style.transform = ''; for (const c of cards) c.style.transform = ''; } }
  const run = scrub(el, (p) => {
    if (plain()) return;
    const x = p * span, mid = x + innerWidth / 2;
    track.style.transform = `translate3d(${(-x).toFixed(1)}px, 0, 0)`;
    for (const c of cards) {
      const d = clamp(Math.abs(c.offsetLeft + c.offsetWidth / 2 - mid) / innerWidth);
      c.style.transform = `scale(${(1 - d * 0.08).toFixed(4)})`;
    }
  }, { mode: 'pinned', layers: [track] });
  new ResizeObserver(() => { measure(); run.wake(); }).observe(track);
  small.addEventListener('change', () => { mode(); measure(); run.wake(); });
  motion.on(() => { mode(); run.wake(); });
  mode(); measure();
}
