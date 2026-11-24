// The StorageLens window redrawn in HTML for this page's demos: the frame, its cards and the folder map.
// Every number here is the engine's own answer for the made-up demo library (docs/ui-ux-handoff/tools/
// make_demo_tree.py, scanned twice; queried with `storagelens library query` on 22 November 2026). Nothing is from a
// real PC. Drive space is the app's --pin-drives figure, as in the screenshots.

export const KiB = 1024, MiB = 1024 * KiB, GiB = 1024 * MiB;

/** Sizes as the app writes them: "75.0 MiB", "732.0 KiB", "240.00 GiB". */
export function fmt(bytes) {
  const a = Math.abs(bytes);
  if (a >= GiB) return (bytes / GiB).toFixed(2) + ' GiB';
  if (a >= MiB) return (bytes / MiB).toFixed(1) + ' MiB';
  if (a >= KiB) return (bytes / KiB).toFixed(1) + ' KiB';
  return bytes + ' B';
}
export const num = (n) => Math.round(n).toLocaleString('en-US');
export const esc = (s) => String(s).replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
export const icon = (name, cls = 'ic') => `<svg class="${cls}" aria-hidden="true"><use href="#i-${name}"/></svg>`;

export const DRIVE = { letter: 'D:', used: 260 * GiB, total: 500 * GiB, free: 240 * GiB };
export const TOTALS = { allocated: 388235448, logical: 383560767, files: 2297, folders: 320, lower: 7528448, onedrive: 749568, onedriveLogical: 744960 };

const f = (name, bytes, more = {}) => ({ name, bytes, ...more });
export const TREE = f('Alex', 278720696, { growth: 45780992, kids: [
  f('Videos', 78643200, { growth: 23068672, kids: [
    f('Book trailers', 78643200, { growth: 23068672, kids: [
      f('The Lighthouse Keeper - trailer.mp4', 27262976, { file: true, risk: 'backup' }),
      f('The Lighthouse Keeper - trailer (final, 4K).mp4', 23068672, { file: true, risk: 'backup' }),
      f('Book launch livestream 2025.mp4', 18874368, { file: true, risk: 'backup' }),
      f('Behind the cover - timelapse.mp4', 9437184, { file: true, risk: 'backup' }),
    ] }),
  ] }),
  f('Downloads', 54648832, { growth: 9437184, kids: [
    f('Ubuntu-26.04-desktop-amd64.iso', 22020096, { file: true }),
    f('PhotoEditor-Setup-2026.1.exe', 9437184, { file: true }),
    f('PhotoEditor-Setup-2026.2.exe', 9437184, { file: true }),
    f('node-v24.3.0-x64.msi', 6291456, { file: true }),
    f('VideoConverter_installer_v8.exe', 4194304, { file: true }),
    f('Font pack - serif collection.zip', 3145728, { file: true }),
    f('Invoice 2026-031.pdf', 122880, { file: true }),
  ] }),
  f('Projects', 53383352, { kids: [
    f('cover-tool', 23818424, { kids: [f('target', 23765176), f('src', 49152), f('Cargo.toml', 4096, { file: true })] }),
    f('bookshop-site', 23162880, { kids: [f('node_modules', 23093248), f('src', 65536), f('package.json', 4096, { file: true })] }),
    f('sales-notebooks', 6402048),
  ] }),
  f('Pictures', 45731840, { growth: 6795264, kids: [f('Photos', 34770944, { growth: 6795264 }), f('Book covers', 10960896)] }),
  f('AppData', 31461376, { growth: 6479872, kids: [
    f('Local', 29040640, { growth: 6479872, kids: [f('npm-cache', 15564800, { growth: 6479872 }), f('Temp', 7553024), f('PhotoEditor', 5922816)] }),
    f('Roaming', 2420736),
  ] }),
  f('Documents', 14102528, { kids: [f('Manuscripts', 11415552, { risk: 'backup' }), f('Taxes', 1986560), f('Contracts', 700416)] }),
  f('OneDrive', 749568),
] });

export const REVIEW = [
  { title: 'Dependencies / build outputs', bytes: 52818104, risk: 'review', text: 'Potentially regenerable, but custom or offline dependencies may be important.' },
  { title: 'Installers / disk images', bytes: 51380224, risk: 'review', text: 'Review whether the installer or image is still needed and available elsewhere.' },
  { title: 'Older explicit temporary files', bytes: 7528448, risk: 'lower', text: 'Older than seven days in user Temp, with a temporary extension; not proof of disposability.' },
  { title: 'Logs', bytes: 2420736, risk: 'review', text: 'Confirm diagnostic and audit retention before manual cleanup.' },
];
export const GROWTH = [
  { name: 'Alex', where: 'D:/…/demo', bytes: 278720696, growth: 45780992 },
  { name: 'Videos', where: 'D:/…/demo/Alex', bytes: 78643200, growth: 23068672 },
  { name: 'Book trailers', where: 'D:/…/demo/Alex/Videos', bytes: 78643200, growth: 23068672 },
  { name: 'Studio', where: 'D:/…/demo', bytes: 109514752, growth: 9854976 },
  { name: 'Renders', where: 'D:/…/demo/Studio', bytes: 34652160, growth: 9854976 },
];
export const CANDIDATES = [
  { name: 'Ubuntu-26.04-desktop-amd64.iso', bytes: 22020096, why: 'Installer or image may still be needed; confirm replacement availability.' },
  { name: 'PhotoEditor-Setup-2026.1.exe', bytes: 9437184, why: 'Installer or image may still be needed; confirm replacement availability.' },
  { name: 'PhotoEditor-Setup-2026.2.exe', bytes: 9437184, why: 'Installer or image may still be needed; confirm replacement availability.' },
  { name: 'node-v24.3.0-x64.msi', bytes: 6291456, why: 'Installer or image may still be needed; confirm replacement availability.' },
  { name: 'cover-tool.exe', bytes: 5242880, why: 'Potentially regenerable dependencies/build outputs; custom or offline files may matter.' },
];
export const VIDEOS = TREE.kids[0].kids[0].kids;

export const RISK = { protected: ['Protected', 't-protected'], backup: ['Back up first', 't-backup'], review: ['Needs review', 't-review'], lower: ['Lower risk · review first', 't-lower'] };
export const tag = (risk, cls = 'atag') => `<span class="${cls} ${RISK[risk][1]}">${RISK[risk][0]}</span>`;

// The folder map's colours are the stylesheet's (--m1 … --m8), so a page that changes look changes them too.
const PALETTE = [1, 2, 3, 4, 5, 6, 7, 8].map((n) => `var(--m${n})`);

/**
 * A squarified treemap: rectangles for `items` (largest first) inside W x H, each { x, y, w, h } as fractions of the box.
 * Anything under 1.2 % of the total is drawn as if it were 1.2 %, so a tiny folder is still a sliver you can see.
 */
export function squarify(items, W, H) {
  const total = items.reduce((s, i) => s + i.bytes, 0);
  const areas = items.map((i) => Math.max(i.bytes, total * 0.012));
  const scale = (W * H) / areas.reduce((s, a) => s + a, 0);
  const out = [];
  let x = 0, y = 0, w = W, h = H, i = 0;
  while (i < areas.length) {
    const short = Math.min(w, h);
    let sum = 0, lo = Infinity, hi = 0, best = Infinity, j = i;
    while (j < areas.length) {
      const a = areas[j] * scale, s2 = sum + a, mn = Math.min(lo, a), mx = Math.max(hi, a);
      const worst = Math.max((short * short * mx) / (s2 * s2), (s2 * s2) / (short * short * mn));
      if (worst > best) break;
      sum = s2; lo = mn; hi = mx; best = worst; j++;
    }
    const thick = sum / short;
    let off = 0;
    for (let k = i; k < j; k++) {
      const len = (areas[k] * scale) / thick;
      out.push(w >= h ? { x: x / W, y: (y + off) / H, w: thick / W, h: len / H } : { x: (x + off) / W, y: y / H, w: len / W, h: thick / H });
      off += len;
    }
    if (w >= h) { x += thick; w -= thick; } else { y += thick; h -= thick; }
    i = j;
  }
  return out;
}

/** The tiles of one folder, as HTML for an .amap-l layer. `as` is 'div' or 'button' (a tile you can click). */
export function tiles(node, W, H, { as = 'div', hint = false } = {}) {
  const kids = node.kids || [];
  const rects = squarify(kids, W, H);
  return kids.map((k, i) => {
    const r = rects[i];
    const cls = r.w < 0.07 || r.h < 0.1 ? ' is-tiny' : r.w < 0.17 || r.h < 0.2 ? ' is-small' : '';
    const can = as === 'button' && k.kids;
    const el = can ? 'button' : 'div';
    const attrs = can ? ` type="button" data-go="${i}" aria-label="${esc(k.name)}, ${fmt(k.bytes)}. Open it."` : '';
    return `<${el} class="tile${cls}" data-tile="${i}"${attrs} style="left:${(r.x * 100).toFixed(3)}%;top:${(r.y * 100).toFixed(3)}%;width:${(r.w * 100).toFixed(3)}%;height:${(r.h * 100).toFixed(3)}%;--c:${PALETTE[i % PALETTE.length]}">`
      + `<b>${esc(k.name)}</b><span>${fmt(k.bytes)}</span>${hint && k.kids ? '<small>Click to explore →</small>' : ''}<i class="tile-ring"></i></${el}>`;
  }).join('');
}
export const rectsOf = (node, W, H) => squarify(node.kids || [], W, H);

const RAIL = ['home', 'folder', 'file', 'broom', 'cloud', 'growth', 'list', 'shield', null, 'pulse', 'gear', 'info'];
const RAIL_KEY = { overview: 0, folders: 1, files: 2, candidates: 3, onedrive: 4, growth: 5, review: 6, signals: 7 };

/** The window: title bar, icon rail, page header and an empty page. `chat` adds the Assistant's panel. */
export function shell({ view = 'overview', title = 'Overview', sub = '', chat = false, agentButton = false, picture = '' } = {}) {
  const on = RAIL_KEY[view];
  // `picture`: a scripted scene nobody operates is one image to a screen reader, described by this text.
  return `<div class="app${chat ? ' has-chat' : ''}"${picture ? ` role="img" aria-label="${esc(picture)}"` : ''}>
  <div class="app-root">
    <div class="app-bar"><svg class="brand-mark" aria-hidden="true"><use href="#logo"/></svg><b>StorageLens</b><em>Local storage inspector</em><span class="app-caption"><i></i><i></i><i></i></span></div>
    <div class="app-body">
      <div class="app-rail">${RAIL.map((n, i) => (n ? `<span class="rail-i${i === on ? ' is-on' : ''}" data-rail="${i}">${icon(n)}</span>` : '<span class="rail-gap"></span>')).join('')}</div>
      <div class="app-main">
        <div class="app-head">
          <div><h4 class="app-title" data-app-title>${esc(title)}</h4><p class="app-sub" data-app-sub>${esc(sub)}</p></div>
          <div class="app-acts"><span class="app-meta" data-app-meta>Last scan today 9:10 AM · 2,617 items</span><span class="abtn${agentButton ? ' abtn-on' : ''}">${icon('chat')}Assistant</span><span class="abtn abtn-primary">${icon('refresh')}Scan now</span></div>
        </div>
        <div class="app-page" data-app-page></div>
      </div>
      ${chat ? chatPanel() : ''}
    </div>
  </div>
</div>`;
}

export function setRail(app, view) {
  app.querySelectorAll('.rail-i').forEach((r) => r.classList.toggle('is-on', +r.dataset.rail === RAIL_KEY[view]));
}

export const driveCard = () => `<div class="acard adrive">
  <span class="adrive-ic">${icon('drive')}</span>
  <div class="adrive-b"><div class="adrive-t"><b>${DRIVE.letter}&nbsp; Data</b><span>${fmt(DRIVE.free)} free</span></div>
  <div class="adrive-bar"><i data-drive-fill></i></div><div class="adrive-u">${fmt(DRIVE.used)} used of ${fmt(DRIVE.total)}</div></div>
</div>`;

export const metrics = (cells, cls = '') => `<div class="acard ametrics ${cls}">${cells.map((c) => `<div class="ametric"><span>${c[0]}</span><b${c[3] ? ` ${c[3]}` : ''}>${c[1]}</b><small${c[4] ? ` ${c[4]}` : ''}>${c[2]}</small></div>`).join('')}</div>`;

export const overviewMetrics = () => metrics([
  ['Measured local files', fmt(TOTALS.allocated), `${num(TOTALS.files)} files · 0 unknown`, 'data-m-alloc', 'data-m-files'],
  ['Logical file size', fmt(TOTALS.logical), 'Not the same as disk use', 'data-m-logical'],
  ['Lower-risk candidates', fmt(TOTALS.lower), 'Not guaranteed savings', 'data-m-lower'],
  ['OneDrive on this PC', fmt(TOTALS.onedrive), '727.5 KiB logical · not account quota', 'data-m-od'],
]);

export const reviewCard = () => `<div class="acard arev">
  <div class="acard-h"><div><b>Start with a careful review</b><span>Inferred from location and file type, not a deletion verdict.</span></div></div>
  ${REVIEW.map((r) => `<div class="arev-row" data-rev><b>${r.title}</b><strong>${fmt(r.bytes)}</strong><p>${r.text}</p>${tag(r.risk)}</div>`).join('')}
</div>`;

export const mapCard = ({ title = 'Where the space goes', sub = 'Immediate children · measured disk allocation', layers = 1 } = {}) => `<div class="acard amapc">
  <div class="acard-h"><div><b data-map-title>${title}</b><span data-map-sub>${sub}</span></div></div>
  <div class="amap" data-map>${Array.from({ length: layers }, (_, i) => `<div class="amap-l" data-map-layer="${i}"></div>`).join('')}</div>
</div>`;

export const banner = (who, said) => `<div class="acard abanner">
  <span class="abanner-ic">${icon('bot')}</span>
  <div class="abanner-b"><em>Driven by ${esc(who)}</em><span>“${esc(said)}”</span></div>
  <button type="button" class="abtn abtn-sm" data-back>← Back to my view</button>
</div>`;

export const chatPanel = () => `<div class="app-chat">
  <div class="chat-h">${icon('chat')}<div><b>Assistant</b><span>granite-4.2-3b on this PC · numbers come from your scan</span></div></div>
  <div class="chat-log" data-chat-log aria-live="polite"></div>
  <form class="chat-in" data-chat-form><input type="text" data-chat-input placeholder="Ask about your storage..." aria-label="Ask the demo Assistant about the demo library" autocomplete="off" maxlength="120"><button type="submit" aria-label="Send">${icon('send')}</button></form>
  <p class="chat-foot">Answers use your latest scan. Nothing on your disk changes unless you confirm it.</p>
</div>`;

/** The mouse pointer the scripted scenes move, and the ring of its click. */
export const cursor = () => `<span class="app-click" data-click></span><span class="app-cursor" data-cursor><svg viewBox="0 0 24 24" aria-hidden="true"><path d="M5 3l14 8.2-6.2 1.6L9.6 19z" fill="#fff" stroke="#0b1322" stroke-width="1.4" stroke-linejoin="round"/></svg></span>`;
