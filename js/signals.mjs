// Worth a look: six examples of what StorageLens notices from names and places alone (engine/README.md, "Worth a
// look"). A beam passes down the list once and each row's label lands as it goes by. One example can be taken apart:
// the name that a hidden right-to-left character rearranges, whose letters travel back to the order they are stored in.
import { animate, enter } from './motion/live.mjs';
import { motion } from './motion/motion.mjs';

const ic = (n, c = 'ic') => `<svg class="${c}" aria-hidden="true"><use href="#i-${n}"/></svg>`;
const fact = (t) => `<li>${ic('check')}<span>${t}</span></li>`;
const VISIBLE = 'exe.pdf', STORED = 'fdp.exe';   // the same seven characters, as drawn and as stored

const ITEMS = [
  {
    name: 'invoice.pdf.exe', where: 'Downloads', icon: 'file', label: 'Worth a look',
    k: 'A program named like a document',
    h: 'The part you were meant to read is in the middle.',
    p: 'It ends in .exe, so it runs. The .pdf is only there to be seen. Windows hides known endings unless you turn them on, which leaves “invoice.pdf” on screen.',
    show: '<span class="dim">Downloads\\</span>invoice.pdf<span class="hot">.exe</span>',
    facts: ['Found from the name alone. The file was not opened.', 'Files that are new since your previous scan are marked new.'],
  },
  {
    name: 'Annual report_exe.pdf', where: 'Downloads', icon: 'file', label: 'Worth a look', flip: true,
    k: 'A hidden character that turns the name around',
    h: 'It looks like a PDF. It is a program.',
    p: 'One invisible character tells Windows to draw the rest of the name from right to left. StorageLens spells that character out, so its own page cannot be fooled by the trick it reports.',
    facts: ['Found from the name alone. The file was not opened.'],
  },
  {
    name: 'svchost.exe', where: 'AppData\\Roaming', icon: 'file', label: 'Worth a look',
    k: 'A Windows program name outside the Windows folder',
    h: 'The right name in the wrong place.',
    p: 'Windows’ own svchost.exe lives in the Windows folder. A program borrowing that name somewhere else is worth a second look.',
    show: '<span class="hot">AppData\\Roaming\\</span>svchost.exe',
    facts: ['Found from the name and the place. The file was not opened.'],
  },
  {
    name: 'updater.exe', where: 'Startup folder', icon: 'refresh', label: 'For information', info: true,
    k: 'What starts when you sign in',
    h: 'Whatever sits in a Startup folder runs every time.',
    p: 'StorageLens lists what is there, along with programs lying loose in AppData, Temp and Downloads. Common things, like an installer in Downloads, are listed for information and folded away.',
    show: '<span class="hot">Start Menu\\Programs\\Startup\\</span>updater.exe',
    facts: ['A list to read, not an alarm: most of it is ordinary.'],
  },
  {
    name: 'Microsoft Defender', where: 'Its own history on this PC', icon: 'shield', label: 'From Defender', info: true,
    k: 'What Windows’ antivirus already found',
    h: 'Defender’s history, next to your scan.',
    p: 'Each thing Defender detected, what it did about it, and whether those files are still in your latest scan. To act on any of it, StorageLens sends you to Windows Security.',
    show: '<span class="dim">Detected · Quarantined ·</span> none of its files in your latest scan',
    facts: ['Read from Windows without admin rights.', 'Download links are cut to their host, because they can carry signed tokens.'],
  },
  {
    name: 'Known-files check', where: 'Optional, and off until you turn it on', icon: 'check', label: 'Optional', info: true,
    k: 'A second opinion that stays on your PC',
    h: 'Is this program one the world already knows?',
    p: 'Turn it on and StorageLens fingerprints only the programs on this list and looks each one up in CIRCL’s published list of known software, a file you download yourself. Nothing is sent anywhere.',
    show: 'In CIRCL’s list of known files',
    facts: ['It reads those programs to fingerprint them; nothing else, and nothing OneDrive keeps online.', 'Agents cannot start it.'],
  },
];

export default function signals(el) {
  const list = el.querySelector('[data-signals-list]'), beam = el.querySelector('[data-signals-beam]'), detail = el.querySelector('[data-signals-detail]');
  list.insertAdjacentHTML('beforeend', ITEMS.map((it, i) => `<button type="button" class="sig" role="tab" id="sig-${i}" aria-selected="${i === 0}" aria-controls="sig-panel" tabindex="${i === 0 ? 0 : -1}" data-i="${i}">
    <span class="sig-ic">${ic(it.icon)}</span><span><b>${it.name}</b><span>${it.where}</span></span><span class="tag${it.info ? ' t-info' : ''}">${it.label}</span></button>`).join(''));
  detail.id = 'sig-panel';
  const rows = [...list.querySelectorAll('.sig')];
  let at = -1, real = false;

  function nameDemo() {
    const head = 'Annual report_';
    const chars = [...VISIBLE].map((c, i) => `<span class="ch hot" data-ch="${i}">${c}</span>`).join('');
    return `<div class="sd-name" data-flip-name aria-live="polite"><span>${head}</span><span class="mark" data-mark hidden title="A hidden right-to-left override character">U+202E</span>${chars}</div>
      <div class="sd-row"><button type="button" class="btn btn-sm" data-flip aria-pressed="false">Show what the name hides</button><span class="fine" data-flip-say>As Windows draws it.</span></div>`;
  }
  function pick(i, focus = false) {
    if (i === at) return;
    at = i; real = false;
    rows.forEach((r, n) => { r.setAttribute('aria-selected', String(n === i)); r.tabIndex = n === i ? 0 : -1; });
    if (focus) rows[i].focus();
    const it = ITEMS[i];
    detail.setAttribute('aria-labelledby', `sig-${i}`);
    detail.innerHTML = `<p class="sd-k${it.info ? ' t-info' : ''}">${it.k}</p><h3 class="sd-h">${it.h}</h3>
      ${it.flip ? nameDemo() : `<div class="sd-name">${it.show}</div>`}
      <p class="sd-p">${it.p}</p><ul class="sd-facts">${it.facts.map(fact).join('')}</ul>`;
    [...detail.children].forEach((c, n) => enter(c, { y: 14, scale: 1, delay: n * 45 }).finished.then((a) => a.cancel(), () => {}));
  }
  list.addEventListener('click', (ev) => { const r = ev.target.closest('.sig'); if (r) pick(+r.dataset.i); });
  list.addEventListener('keydown', (ev) => {
    const d = { ArrowDown: 1, ArrowUp: -1 }[ev.key];
    if (!d) return;
    ev.preventDefault();
    pick((at + d + rows.length) % rows.length, true);
  });

  // The seven letters after the hidden character sit in mirror order. Each one travels to where it is stored.
  detail.addEventListener('click', (ev) => {
    const b = ev.target.closest('[data-flip]');
    if (!b) return;
    real = !real;
    b.setAttribute('aria-pressed', String(real));
    b.textContent = real ? 'Show it as Windows draws it' : 'Show what the name hides';
    detail.querySelector('[data-flip-say]').textContent = real ? 'As it is stored: a hidden right-to-left mark (U+202E), then fdp.exe. A program.' : 'As Windows draws it.';
    const mark = detail.querySelector('[data-mark]');
    const chars = [...detail.querySelectorAll('[data-ch]')];
    const n = chars.length;
    chars.forEach((c, i) => {
      // Going to stored order, the letter at seat i moves to seat n-1-i, and takes the letter that belongs there.
      const from = `translateX(${(n - 1 - 2 * i)}ch)`;
      c.textContent = (real ? STORED : VISIBLE)[i];
      animate(c, [{ transform: from }, { transform: 'none' }], { preset: 'paper', delay: Math.abs(n - 1 - 2 * i) * 28 }).finished.then((a) => a.cancel(), () => {});
    });
    mark.hidden = !real;
    if (real) animate(mark, [{ opacity: 0, transform: 'scale(.7)' }, { opacity: 1, transform: 'none' }], { preset: 'snappy', delay: 120 }).finished.then((a) => a.cancel(), () => {});
  });

  // The pass of the beam, once, when the list is first seen.
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    const tags = rows.map((r) => r.querySelector('.tag'));
    if (motion.calm) { el.classList.add('is-swept'); return; }
    const total = 1500;
    animate(beam, [{ transform: 'translateY(0)', opacity: 1 }, { transform: 'translateY(100%)', opacity: 1, offset: 0.92 }, { transform: 'translateY(100%)', opacity: 0 }], { preset: 'default', duration: total, easing: 'linear', fill: 'none' });
    tags.forEach((t, i) => {
      const a = animate(t, [{ opacity: 0, transform: 'scale(.6)' }, { opacity: 1, transform: 'none' }], { preset: 'snappy', delay: (total * (i + 0.6)) / rows.length });
      a.finished.then(() => { t.style.opacity = '1'; a.cancel(); }, () => { t.style.opacity = '1'; });
    });
    setTimeout(() => el.classList.add('is-swept'), total + 600);
  }, { threshold: 0.35 }).observe(el);

  pick(0);
}
