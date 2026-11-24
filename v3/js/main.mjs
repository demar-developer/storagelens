// The home page (version 3 of the landing page; its page is ../../index.html): the first page's story and pieces,
// wearing whichever look is chosen. This file adds the
// appearance bar and makes the pictures and the download buttons follow the look. The pieces are the first page's
// (../../js/), which take their colours from the stylesheet; the walkthrough and the Assistant are this page's own
// versions, which redraw the app's window in the layout of the look that is on.
import { boot, $$, once } from '../../js/core.mjs';
import { animate } from '../../js/motion/live.mjs';
import { LOOKS, ids, current, onLook, setLook, step, picture, followDownloads } from '../../js/looks.mjs';

// ── The appearance bar: the seven apps. Click, arrow keys inside it, or 1 to 7 anywhere. ──
const set = document.querySelector('[data-dock-set]');
if (set) {
  set.insertAdjacentHTML('beforeend', LOOKS.map((l, i) => `<button type="button" role="radio" aria-checked="false" tabindex="-1" data-look-pick="${l.id}" title="${l.name} (${i + 1})">
    <span class="swatch" style="--s1:${l.swatch[0]};--s2:${l.swatch[1]}"></span><span>${l.name}</span></button>`).join(''));
  const thumb = set.querySelector('[data-dock-thumb]');
  const buttons = $$('[data-look-pick]', set);
  const show = (id, before) => {
    const i = ids.indexOf(id), from = ids.indexOf(before ?? id);
    buttons.forEach((b, n) => { b.setAttribute('aria-checked', String(n === i)); b.tabIndex = n === i ? 0 : -1; });
    thumb.style.transform = `translateX(${i * 100}%)`;
    if (before && before !== id) once(animate(thumb, [{ transform: `translateX(${from * 100}%)` }, { transform: `translateX(${i * 100}%)` }], { preset: 'snappy' }));
  };
  for (const b of buttons) b.addEventListener('click', () => setLook(b.dataset.lookPick, b));
  set.addEventListener('keydown', (ev) => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
    if (!d) return;
    ev.preventDefault();
    step(d, buttons[(ids.indexOf(current()) + d + ids.length) % ids.length]);
    buttons[ids.indexOf(current())].focus();
  });
  addEventListener('keydown', (ev) => {
    if (ev.ctrlKey || ev.metaKey || ev.altKey || /^(INPUT|TEXTAREA|SELECT)$/.test(ev.target.tagName)) return;
    const n = +ev.key;
    if (n >= 1 && n <= ids.length) setLook(ids[n - 1], buttons[n - 1]);
  });
  onLook(show);
  show(current());
}

// ── The screens strip shows the look that is on: each picture is swapped for that look's render of the same view. ──
const shots = $$('img[data-shot]');
onLook((id) => {
  for (const img of shots) {
    const src = picture(id, img.dataset.shot);
    if (img.src === src) continue;
    img.onload = () => once(animate(img, [{ opacity: 0 }, { opacity: 1 }], { preset: 'default' }));
    img.src = src;
  }
  document.querySelector('meta[name="theme-color"]')?.setAttribute('content', getComputedStyle(document.documentElement).getPropertyValue('--bg').trim());
});

// A look named in the address (…/#look=atlas) is put on at once, so a link can show one.
const named = /look=([a-z]+)/.exec(location.hash)?.[1];
if (named) setLook(named);

// Each look is an app: the download buttons, the Setup picture and the list of seven follow the look that is on.
followDownloads();

boot({
  hero: () => import('./hero.mjs'),
  lens: () => import('../../js/lens.mjs'),
  story: () => import('./story.mjs'),
  assistant: () => import('./assistant.mjs'),
  privacy: () => import('../../js/flows.mjs').then((m) => ({ default: m.privacy })),
  pro: () => import('../../js/flows.mjs').then((m) => ({ default: m.pro })),
  signals: () => import('../../js/signals.mjs'),
  nevers: () => import('../../js/flows.mjs').then((m) => ({ default: m.nevers })),
  gallery: () => import('../../js/gallery.mjs'),
  appearance: () => import('./appearance.mjs'),
  mixer: () => import('./mixer.mjs'),
});
