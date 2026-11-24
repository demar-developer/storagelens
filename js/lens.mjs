// Then and now. Two lists sit exactly on top of each other: the folders as File Explorer names them, and the same
// folders as StorageLens explains them. The lens is a round window onto the second list: it moves with one transform
// and its contents move with the opposite one, so nothing is repainted while it travels.
// The explanations are the app's own folder notes (engine/crates/sl-app/data/folder-notes.json) and inspector text,
// shortened to fit two lines; the importance levels follow the classifier's rules (sl-core/src/classify.rs).
import { animate, ticker } from './motion/live.mjs';
import { Spring, clamp } from './motion/spring.mjs';
import { motion } from './motion/motion.mjs';

const ROWS = [
  ['pagefile.sys', 'C:\\pagefile.sys', 'file', 'Windows paging file', 'Windows uses it as extra memory and to save crash information. It grows and shrinks with what the PC needs.', 'protected'],
  ['WinSxS', 'C:\\Windows\\WinSxS', 'folder', 'Windows component store', 'Holds the parts of Windows and its updates. Never delete anything in it by hand.', 'protected'],
  ['node_modules', '…\\bookshop-site\\node_modules', 'folder', 'A project’s npm packages', 'A project’s installed packages. npm can install them again from the project’s package files.', 'review'],
  ['Temp', '…\\AppData\\Local\\Temp', 'folder', 'Temporary files', 'Working files that Windows and programs make while they run.', 'lower'],
  ['hiberfil.sys', 'C:\\hiberfil.sys', 'file', 'Hibernation file', 'Holds what is in memory when the PC hibernates, and makes Fast Startup possible.', 'protected'],
  ['ext4.vhdx', '…\\Packages\\…\\LocalState\\ext4.vhdx', 'file', 'WSL Linux disk', 'A Linux distribution’s whole disk, with its files and programs.', 'protected'],
  ['target', '…\\cover-tool\\target', 'folder', 'Rust build output', 'Everything Cargo built for this Rust project. The next build makes it again.', 'review'],
  ['models', '…\\.ollama\\models', 'folder', 'Ollama models', 'Language models downloaded with Ollama.', 'review'],
  ['Book trailers', '…\\Videos\\Book trailers', 'folder', 'Your own videos', 'Potential original media; confirm an independent backup.', 'backup'],
  ['Installer', 'C:\\Windows\\Installer', 'folder', 'Windows Installer cache', 'Keeps the installer files that installed programs need to update, repair or uninstall themselves.', 'protected'],
  ['hub', '…\\.cache\\huggingface\\hub', 'folder', 'Hugging Face model cache', 'Models and datasets downloaded from Hugging Face.', 'review'],
  ['Ubuntu-26.04-desktop-amd64.iso', '…\\Downloads', 'file', 'An installer or disk image', 'It may still be needed; confirm you can get it again.', 'review'],
];
const LEVEL = { protected: ['Protected', 't-protected'], backup: ['Back up first', 't-backup'], review: ['Needs review', 't-review'], lower: ['Lower risk', 't-lower'] };
const FOLLOW = { response: 0.3, damping: 0.86 };
const ic = (n) => `<svg class="ic" aria-hidden="true"><use href="#i-${n}"/></svg>`;

export default function lens(stage) {
  const wrap = stage.closest('.lens-wrap');
  const raw = stage.querySelector('[data-lens-raw]'), known = stage.querySelector('[data-lens-known]');
  const glass = stage.querySelector('[data-lens]'), view = stage.querySelector('[data-lens-view]');
  const button = wrap.querySelector('[data-lens-toggle]'), hint = wrap.querySelector('[data-lens-hint]');

  raw.innerHTML = ROWS.map(([name, path, i]) => `<li class="lrow lrow-raw"><span class="lrow-ic">${ic(i)}</span><div><b>${name}</b><span>${path}</span></div><span class="lrow-q">?</span></li>`).join('');
  known.innerHTML = ROWS.map(([name, , i, title, what, level]) => `<li class="lrow lrow-known ${LEVEL[level][1]}"><span class="lrow-ic">${ic(i)}</span><div><b>${title}</b><span>${what}</span></div><span class="tag ${LEVEL[level][1]}">${LEVEL[level][0]}</span></li>`).join('');
  const copy = known.cloneNode(true);
  copy.removeAttribute('data-lens-known');
  view.append(copy);

  let W = 0, H = 0, R = 150, centers = [], open = false, touched = false, over = -1;
  const sx = new Spring(0, FOLLOW), sy = new Spring(0, FOLLOW);
  function measure() {
    W = stage.clientWidth; H = stage.clientHeight;
    R = glass.offsetWidth / 2;
    glass.style.setProperty('--sw', `${W}px`);
    glass.style.setProperty('--sh', `${H}px`);
    centers = [...raw.children].filter((li) => li.offsetParent).map((li) => [li.offsetLeft + li.offsetWidth / 2, li.offsetTop + li.offsetHeight / 2, li.offsetWidth, li.offsetHeight]);
  }
  const now = () => performance.now() / 1000;
  function aim(x, y, jump = false) {
    x = clamp(x, 0, W); y = clamp(y, 0, H);
    if (jump || motion.calm) { sx.set(x); sy.set(y); } else { sx.to(x, now()); sy.to(y, now()); }
    loop.wake();
  }
  let drawn = '';
  const loop = ticker((t) => {
    const x = sx.value(t), y = sy.value(t);
    const key = `${x.toFixed(1)},${y.toFixed(1)}`;
    if (key !== drawn) {
      drawn = key;
      glass.style.transform = `translate3d(${(x - R).toFixed(1)}px, ${(y - R).toFixed(1)}px, 0)`;
      view.style.transform = `translate3d(${(R - x).toFixed(1)}px, ${(R - y).toFixed(1)}px, 0)`;
      // Which folder is under the middle of the lens: the line above the stage names it.
      let hit = -1;
      for (let i = 0; i < centers.length; i++) if (Math.abs(x - centers[i][0]) < centers[i][2] / 2 && Math.abs(y - centers[i][1]) < centers[i][3] / 2) { hit = i; break; }
      if (hit !== over && hit >= 0) { over = hit; hint.textContent = `${ROWS[hit][0]}: ${ROWS[hit][3]}`; }
    }
    return sx.settled(t) && sy.settled(t) ? false : undefined;
  }, { watch: stage, layers: [glass, view] });

  // A first pass by itself, so the idea lands before anyone touches it; any input ends it.
  let tour = [];
  function showOff() {
    const stops = [2, 3, 0, 5].filter((i) => centers[i]);
    if (!stops.length) return;
    aim(centers[stops[0]][0], centers[stops[0]][1], true);
    if (motion.calm) return;
    stops.slice(1).forEach((i, n) => tour.push(setTimeout(() => { if (!touched) aim(centers[i][0], centers[i][1]); }, 1300 * (n + 1))));
  }
  function mine() { touched = true; tour.forEach(clearTimeout); tour = []; }

  stage.addEventListener('pointermove', (ev) => {
    if (open) return;
    mine();
    const b = stage.getBoundingClientRect();
    aim(ev.clientX - b.left, ev.clientY - b.top);
  });
  stage.addEventListener('pointerdown', (ev) => {
    if (open) return;
    mine();
    const b = stage.getBoundingClientRect();
    aim(ev.clientX - b.left, ev.clientY - b.top);
  });
  stage.addEventListener('keydown', (ev) => {
    const step = { ArrowLeft: [-1, 0], ArrowRight: [1, 0], ArrowUp: [0, -1], ArrowDown: [0, 1] }[ev.key];
    if (!step || open || !centers.length) return;
    ev.preventDefault();
    mine();
    aim(sx.target + step[0] * (centers[0][2] + 14), sy.target + step[1] * (centers[0][3] + 10));
  });

  // "Explain them all": the second list simply fades in over the first, and the lens steps aside.
  function setOpen(on) {
    open = on;
    mine();
    stage.classList.toggle('is-open', on);
    button.setAttribute('aria-pressed', String(on));
    button.textContent = on ? 'Back to the mystery' : 'Explain them all';
    hint.textContent = on ? 'Every folder, explained' : 'Move the lens over a folder';
    over = -1;
    const a = animate(known, [{ opacity: on ? 0 : 1 }, { opacity: on ? 1 : 0 }], { preset: 'default' });
    a.finished.then(() => { known.style.opacity = on ? '1' : ''; a.cancel(); }, () => {});
    const g = animate(glass, [{ opacity: on ? 1 : 0 }, { opacity: on ? 0 : 1 }], { preset: 'snappy' });
    g.finished.then(() => { glass.style.opacity = on ? '0' : '1'; g.cancel(); }, () => {});
  }
  button.addEventListener('click', () => setOpen(!open));

  new ResizeObserver(() => { measure(); aim(Math.min(sx.target, W), Math.min(sy.target, H), true); }).observe(stage);
  motion.on(() => { drawn = ''; loop.wake(); });
  measure();
  // The lens arrives, and makes its first pass, when the stage is first on screen (the piece may be built before that).
  new IntersectionObserver(([e], io) => {
    if (!e.isIntersecting) return;
    io.disconnect();
    measure();
    showOff();
    const g = animate(glass, [{ opacity: 0, scale: 0.6 }, { opacity: 1, scale: 1 }], { preset: 'paper', delay: 200 });
    g.finished.then(() => { glass.style.opacity = '1'; g.cancel(); }, () => { glass.style.opacity = '1'; });
  }, { threshold: 0.3 }).observe(stage);
}
