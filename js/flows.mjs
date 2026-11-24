// Three small pieces: where the Assistant's thinking happens (privacy), Pro's planned round trip, and the four
// things StorageLens never does. The moving dots are CSS animations that run only while their piece is on screen,
// and not at all in calm motion; the page's motion button covers them.
import { animate } from './motion/live.mjs';
import { motion } from './motion/motion.mjs';

const onScreen = (el, f) => new IntersectionObserver(([e]) => f(e.isIntersecting), { rootMargin: '80px' }).observe(el);

const MODES = {
  off: {
    leaves: 'Nothing.',
    detail: 'No model runs and no agent can connect. The Assistant still answers its fixed questions from the scan, and "What is this?" still works, because the folder notes are not AI.',
    wires: ['scan'], nodes: [],
  },
  local: {
    leaves: 'Nothing.',
    detail: 'The model runs on this PC and is reached over loopback only, so names and sizes never leave it. It can be StorageLens’ own, or one that llama.cpp, Ollama or LM Studio already runs for you.',
    wires: ['scan', 'local'], nodes: ['local'],
  },
  cloud: {
    leaves: 'Your question, and the folder names, sizes and dates it needs.',
    detail: 'Only if you choose it in Settings, with your own key. The key stays in Windows Credential Manager and goes only to the service it was saved for. What is in your files is never sent, because StorageLens never reads it.',
    wires: ['scan', 'cloud'], nodes: ['cloud'],
  },
};

export function privacy(el) {
  const seg = el.querySelector('[data-seg]'), thumb = el.querySelector('[data-seg-thumb]');
  const buttons = [...seg.querySelectorAll('button')];
  const leaves = el.querySelector('[data-flow-leaves]'), detail = el.querySelector('[data-flow-detail]');
  const stacked = matchMedia('(max-width: 800px)');
  let at = 0;

  function set(mode, moved = true) {
    const m = MODES[mode], i = buttons.findIndex((b) => b.dataset.mode === mode);
    el.dataset.mode = mode;
    buttons.forEach((b, n) => { b.setAttribute('aria-checked', String(n === i)); b.tabIndex = n === i ? 0 : -1; });
    for (const w of el.querySelectorAll('[data-wire]')) w.classList.toggle('is-live', m.wires.includes(w.dataset.wire));
    for (const n of el.querySelectorAll('[data-node]')) { n.classList.toggle('is-live', m.nodes.includes(n.dataset.node)); n.classList.toggle('is-dim', !m.nodes.includes(n.dataset.node)); }
    // The thumb slides to the choice on the snappy spring (down the list when the choices are stacked).
    const axis = stacked.matches ? 'Y' : 'X';
    const to = `translate${axis}(${i * 100}%)`;
    if (moved) animate(thumb, [{ transform: `translate${axis}(${at * 100}%)` }, { transform: to }], { preset: 'snappy' }).finished.then((a) => { thumb.style.transform = to; a.cancel(); }, () => { thumb.style.transform = to; });
    else thumb.style.transform = to;
    at = i;
    if (leaves.textContent !== m.leaves || detail.textContent !== m.detail) {
      leaves.textContent = m.leaves; detail.textContent = m.detail;
      if (moved) for (const node of [leaves, detail]) animate(node, [{ opacity: 0, transform: 'translateY(8px)' }, { opacity: 1, transform: 'none' }], { preset: 'default' }).finished.then((a) => a.cancel(), () => {});
    }
  }
  for (const b of buttons) b.addEventListener('click', () => set(b.dataset.mode));
  seg.addEventListener('keydown', (ev) => {
    const d = { ArrowRight: 1, ArrowDown: 1, ArrowLeft: -1, ArrowUp: -1 }[ev.key];
    if (!d) return;
    ev.preventDefault();
    const next = buttons[(at + d + buttons.length) % buttons.length];
    set(next.dataset.mode);
    next.focus();
  });
  stacked.addEventListener('change', () => set(el.dataset.mode, false));
  onScreen(el, (on) => el.classList.toggle('is-run', on));
  set('off', false);

  // The first time it is seen, it steps once to "A model on this PC": the picture explains itself, then waits.
  let shown = false;
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting || shown) return;
    shown = true; io.disconnect();
    if (!motion.calm) setTimeout(() => { if (el.dataset.mode === 'off') set('local'); }, 1400);
  }, { threshold: 0.6 }).observe(el);
}

export function pro(el) {
  onScreen(el, (on) => el.classList.toggle('is-run', on));
}

export function nevers(el) {
  const items = [...el.querySelectorAll('[data-never]')];
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    items.forEach((li, i) => {
      const line = li.querySelector('i');
      const a = animate(line, [{ transform: 'scaleX(0)' }, { transform: 'none' }], { preset: 'snappy', delay: 250 + i * 170 });
      setTimeout(() => li.classList.add('is-struck'), motion.calm ? 0 : 250 + i * 170);
      a.finished.then(() => { line.style.transform = 'none'; a.cancel(); }, () => { line.style.transform = 'none'; });
    });
  }, { threshold: 0.5 }).observe(el);
}
