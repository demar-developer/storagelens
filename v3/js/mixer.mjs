// Layout and theme, mixed. A layout is the app you download; a theme is the picker in its header, and any of the
// seven themes can dress any of the seven layouts. The window here is drawn live (js/layouts.mjs) in the chosen
// layout, with the chosen theme's colours, corners and type, so all 49 pairs can be shown. "Surprise me" picks one.
import { animate } from '../../js/motion/live.mjs';
import { once } from '../../js/core.mjs';
import { LOOKS, ids, look, current, onLook } from '../../js/looks.mjs';
import { layout as layoutOf, heading, setNav, fillMaps } from '../../js/layouts.mjs';

const whenIdle = window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 1500 }) : (f) => setTimeout(f, 200);

export default function mixer(el) {
  const q = (s) => el.querySelector(s);
  const lay = q('[data-mix-layout]'), the = q('[data-mix-theme]'), frame = q('[data-mix-frame]'), cap = q('[data-mix-cap]'), dice = q('[data-mix-shuffle]');
  const pick = (l, kind) => `<button type="button" class="pick" role="radio" aria-checked="false" tabindex="-1" data-${kind}="${l.id}">${kind === 'theme' ? `<span class="swatch" style="--s1:${l.swatch[0]};--s2:${l.swatch[1]}"></span>` : ''}${l.name}</button>`;
  lay.innerHTML = LOOKS.map((l) => pick(l, 'layout')).join('');
  the.innerHTML = LOOKS.map((l) => pick(l, 'theme')).join('');
  let layout = current(), theme = current(), drawn = '';

  function draw(moved) {
    const key = `${layout} ${theme}`;
    if (key === drawn) return;
    drawn = key;
    const L = layoutOf(layout), old = [...frame.querySelectorAll('.mixer-win')];
    const win = document.createElement('div');
    win.className = 'mixer-win';
    win.dataset.theme = theme;
    win.innerHTML = L.shell({ picture: `StorageLens ${look(layout).name}'s Overview with the ${look(theme).name} theme.` });
    frame.append(win);
    frame.classList.add('is-live');
    const app = win.querySelector('.app');
    app.querySelector('[data-app-page]').innerHTML = `<div class="app-layer">${L.overview()}</div>`;
    setNav(app, 'overview');
    const [title, sub] = heading(layout, 'overview');
    app.querySelector('[data-app-title]').textContent = title;
    app.querySelector('[data-app-sub]').textContent = sub;
    fillMaps(app);
    if (!moved || !old.length) { old.forEach((o) => o.remove()); return; }
    animate(win, [{ opacity: 0, transform: 'scale(1.03)' }, { opacity: 1, transform: 'none' }], { preset: 'default' })
      .finished.then((a) => { a.cancel(); old.forEach((o) => o.remove()); }, () => old.forEach((o) => o.remove()));
  }
  // The window is drawn when the piece is on or near the screen; otherwise in an idle moment.
  const isNear = () => { const r = el.getBoundingClientRect(); return r.top < innerHeight * 1.5 && r.bottom > -innerHeight * 0.5; };
  function show(moved = true) {
    for (const [box, key, value] of [[lay, 'layout', layout], [the, 'theme', theme]]) {
      for (const b of box.children) { const on = b.dataset[key] === value; b.setAttribute('aria-checked', String(on)); b.tabIndex = on ? 0 : -1; }
    }
    cap.innerHTML = layout === theme ? `<b>StorageLens ${look(layout).name}</b>, in its own theme.` : `<b>StorageLens ${look(layout).name}</b>, with <b>${look(theme).name}</b>’s theme chosen in its header.`;
    if (isNear()) draw(moved); else whenIdle(() => draw(false));
  }
  new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) draw(false); }, { rootMargin: '60% 0px' }).observe(el);

  function choose(kind, id) { if (kind === 'layout') layout = id; else theme = id; show(); }
  for (const [box, key] of [[lay, 'layout'], [the, 'theme']]) {
    box.addEventListener('click', (ev) => { const b = ev.target.closest('.pick'); if (b) choose(key, b.dataset[key]); });
    box.addEventListener('keydown', (ev) => {
      const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
      if (!d) return;
      ev.preventDefault();
      const now = key === 'layout' ? layout : theme, next = ids[(ids.indexOf(now) + d + ids.length) % ids.length];
      choose(key, next);
      box.querySelector(`[data-${key}="${next}"]`).focus();
    });
  }
  // "Surprise me": a pair that is not the one showing, and not a layout in its own theme.
  dice.addEventListener('click', () => {
    let l, t;
    do { l = ids[Math.floor(Math.random() * ids.length)]; t = ids[Math.floor(Math.random() * ids.length)]; } while (l === t || (l === layout && t === theme));
    layout = l; theme = t;
    show();
    once(animate(dice.querySelector('.ic'), [{ transform: 'rotate(0deg)' }, { transform: 'rotate(360deg)' }], { preset: 'paper' }));
  });
  // The page's own look sets the layout here, so the window starts from what you are wearing.
  onLook((id) => { layout = id; if (theme === id) theme = id === 'ledger' ? 'telemetry' : 'ledger'; show(false); });

  // It opens on a pair that shows the idea: the look you are wearing, in a theme that is clearly another's.
  theme = layout === 'ledger' ? 'telemetry' : 'ledger';
  show(false);
}
