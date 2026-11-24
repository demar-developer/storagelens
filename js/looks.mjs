// The seven looks: StorageLens comes as seven apps, one per layout, and each layout has a theme of its own. This is
// what each is called, how it is described, where its app downloads from, and the switch that puts a look on the page.
// `about` is the apps' own one-line description (the release's downloads.json). `line`, `text` and the four points
// began as the layouts' design sheets and were checked against pictures of the released apps (24 November 2026): a
// sentence stays only if the released app shows it.
import { motion } from './motion/motion.mjs';

/** The release the sizes below belong to. Copied here, not fetched: this page loads nothing from another site. */
export const RELEASE = { version: '0.4.0 preview', date: '24 November 2026', windows: 'Windows 11, 64-bit' };
const FILES = 'https://github.com/demar-developer/storagelens/releases/latest/download/';

export const LOOKS = [
  {
    id: 'standard', name: 'Standard', swatch: ['#0b1322', '#3b8cf5'], mb: 38,
    about: 'The original layout: a sidebar, an overview and plain lists.',
    line: 'A sidebar, a page, a details panel.',
    text: 'The original layout, and the one the other six are checked against. Not sure which to pick? Start here.',
    points: [
      ['A sidebar of views', 'Eleven views in two groups, one click each. It folds to a rail of icons when the window is narrow.'],
      ['One page at a time', 'A header, the drive, then the answer: a map, a list or a plan.'],
      ['Details slide in', 'Inspect any file or folder in a panel from the right: what it is, and why it is flagged.'],
      ['The Assistant docks beside it', 'Ask in your own words. The answer is a page, and a banner says who is driving.'],
    ],
  },
  {
    id: 'telemetry', name: 'Telemetry', swatch: ['#06080c', '#35e0c8'], mb: 60,
    about: 'An instrument console: your drive on a dial, with readouts beside it.',
    line: 'The drive as an instrument.',
    text: 'A calm glass cockpit: every number reads like a gauge, safety is a standing annunciator, and the Assistant sits beside you as a co-pilot.',
    points: [
      ['Every number is a reading', 'Big Bahnschrift numerals with small units, right-aligned and steady. Rings, ticks and segmented bars instead of decoration.'],
      ['Status is an annunciator', 'One strip under the top bar says read-only, metadata only, what is a heuristic, and who has control.'],
      ['Colour is a signal', 'Near-black by default. Cyan is data and you; amber asks for attention.'],
      ['The Assistant is a co-pilot', 'A command line is always there, and the co-pilot’s console opens upward from it.'],
    ],
  },
  {
    id: 'atlas', name: 'Atlas', swatch: ['#0d1015', '#6457e6'], mb: 63,
    about: 'A map of your drive on every page, with lenses for size, risk, growth and OneDrive.',
    line: 'One map, many lenses.',
    text: 'The whole scan is a place you move through. Every view is a lens on the map or a sheet over it.',
    points: [
      ['Navigate by place', 'The bar at the top says where you are; double-click a tile to go in. “Where did my space go” is answered by looking.'],
      ['Views become lenses', 'Size, risk, growth and OneDrive recolour the same tiles. The lists live in one sheet that slides up over the map.'],
      ['Panels float around the map', 'A dock, the search bar, one card and the bottom row. The map keeps the middle of the window.'],
      ['You see who is driving', 'A “Driven by” pill sits above the map while the Assistant or an agent is showing you something, with Back one click away.'],
    ],
  },
  {
    id: 'strata', name: 'Strata', swatch: ['#0a0b0d', '#ff5fcf'], mb: 58,
    about: 'Your folders as columns to step through, made for the keyboard.',
    line: 'Drill through your drive the way you think about it.',
    text: 'One column per folder level, each measuring itself, and the keyboard reaches everything.',
    points: [
      ['Place is a path', 'Columns cascade left to right, one per level, so you always see where a folder sits and what its parents weigh.'],
      ['Views are modes', 'Size, Largest, Candidates, Growth, OneDrive, Plan, Signals and Coverage are modes on keys 1 to 8.'],
      ['Strata show share', 'Each column carries a stacked bar of its children. The selected layer is magenta, so the path reads at a glance.'],
      ['The keyboard reaches all', 'Arrows move, Space inspects, Ctrl K asks. Every key is written along the bottom edge.'],
    ],
  },
  {
    id: 'mosaic', name: 'Mosaic', swatch: ['#0f1012', '#c9a8ff'], mb: 60,
    about: 'A board of tiles, each one a view of your storage.',
    line: 'Every screen is a board of tiles.',
    text: 'Each view is a board, and each tile on it answers one question about your storage. Ask the Assistant and the answer comes back as a board too.',
    points: [
      ['Boards, not pages', 'Overview, Folders, Files, Cleanup, OneDrive, Growth, Plan and Signals are boards of tiles, each tile one figure, map or list.'],
      ['Colour says what a tile is', 'Free space in blue, lower-risk candidates in green, growth in amber: the tint is part of the reading.'],
      ['Ask, and get a board', 'The Assistant’s answers arrive as a board, with a button to keep it.'],
      ['Safety stays in the frame', 'The read-only note sits in the frame around the boards, and each board carries its own caveat.'],
    ],
  },
  {
    id: 'ledger', name: 'Ledger', swatch: ['#f1f0ec', '#d9441c'], mb: 59,
    about: 'Your storage as a printed report: plain figures on paper.',
    line: 'A precise report, in light.',
    text: 'Black ink on warm paper, rules instead of boxes, readings in dot matrix, and one vermilion signal for what needs a look. The Assistant writes in the margin.',
    points: [
      ['Rules, not boxes', 'Ink rules open each section and hairlines divide rows. No cards, no corners, no shadows: the page reads like a well-set report.'],
      ['Readings in dot matrix', 'Doto shows the scan’s numbers and nothing else, so a reading always looks like a reading.'],
      ['One signal colour', 'Vermilion numbers the items to review. Importance keeps its own colours, always with words.'],
      ['The Assistant writes in the margin', 'The conversation is a margin column beside the report, and a Night switch turns the paper dark.'],
    ],
  },
  {
    id: 'skyline', name: 'Skyline', swatch: ['#070912', '#8fa8ff'], mb: 61,
    about: 'Your folders as a city, the biggest standing tallest.',
    line: 'Your storage as a city.',
    text: 'Folders stand as towers whose height is their size on disk. The previous scan is a ghost line on each tower, and what grew shows in orange.',
    points: [
      ['Size you can see', 'Every tower has the same footprint, so only height carries meaning: size on disk, or logical size when you switch.'],
      ['The past is a ghost line', 'A line marks where each roof stood at the previous scan. What was added since then is drawn in orange.'],
      ['Roofs are lenses', 'Colour the roofs by folder, by importance, or by OneDrive state. The towers never move.'],
      ['A companion beside the city', 'The Assistant opens beside the towers, and a “Driven by” bar keeps Back one click away.'],
    ],
  },
];
export const ids = LOOKS.map((l) => l.id);
export const look = (id) => LOOKS.find((l) => l.id === id);
/** Where a look's app downloads from: an address that always serves the newest release. */
export const download = (id) => `${FILES}StorageLens-${look(id).name}-Setup.exe`;
/** Where a layout's picture of a view lives (an address that works from any page of the site). */
const asset = (path) => new URL(`../assets/${path}`, import.meta.url).href;
export const picture = (layout, view = 'overview') => asset(`looks/${layout}/${view}.webp`);
export const setupPicture = (layout) => asset(`setup/${layout}.webp`);

const root = document.documentElement;
const subs = new Set();
let now = ids.includes(root.dataset.look) ? root.dataset.look : 'standard';
root.dataset.look = now;

export const current = () => now;
/** f(id, previous) after every change of look; returns a function that stops listening. */
export function onLook(f) { subs.add(f); return () => subs.delete(f); }

/**
 * Put a look on. The whole page changes at once, so it is done as a view transition: the new page is drawn over the
 * old one through a circle that grows from `origin` (the button that was pressed). In calm motion, and in browsers
 * without view transitions, the page simply changes.
 */
export function setLook(id, origin = null) {
  if (id === now || !ids.includes(id)) return;
  const before = now;
  const apply = () => { now = id; root.dataset.look = id; for (const f of subs) f(id, before); };
  if (!document.startViewTransition || motion.calm) { apply(); return; }
  const r = origin?.getBoundingClientRect();
  const x = r ? r.left + r.width / 2 : innerWidth / 2, y = r ? r.top + r.height / 2 : innerHeight / 2;
  const far = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y));
  const t = document.startViewTransition(apply);
  t.ready.then(() => {
    root.animate({ clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${far}px at ${x}px ${y}px)`] },
      { duration: 640, easing: 'cubic-bezier(.3, .7, .2, 1)', pseudoElement: '::view-transition-new(root)' });
  }).catch(() => {});
}
export const step = (by, origin) => setLook(ids[(ids.indexOf(now) + by + ids.length) % ids.length], origin);

/**
 * The download section follows the look: every [data-download] link leads to the app of the look that is on, with
 * [data-download-name] reading "StorageLens Atlas" and [data-download-size] "63 MB"; the picture of the Setup window
 * ([data-setup]) is that app's, and its row in the list of seven ([data-app]) is marked. The links are ordinary
 * links, and the page's own HTML already points the main one at StorageLens Standard, so they work without scripts.
 */
export function followDownloads(el = document) {
  const show = (id) => {
    const l = look(id);
    for (const a of el.querySelectorAll('a[data-download]')) a.href = download(id);
    for (const n of el.querySelectorAll('[data-download-name]')) n.textContent = `StorageLens ${l.name}`;
    for (const n of el.querySelectorAll('[data-download-size]')) n.textContent = `${l.mb} MB`;
    for (const r of el.querySelectorAll('[data-app]')) r.classList.toggle('is-on', r.dataset.app === id);
    for (const img of el.querySelectorAll('img[data-setup]')) {
      const src = setupPicture(id);
      if (img.src !== src) img.src = src;
      img.alt = `The Setup window of StorageLens ${l.name}: a picture of the app on the left; on the right the two folders it will use, a choice to add a desktop shortcut, and the buttons Cancel and Install.`;
    }
  };
  show(now);
  return onLook(show);
}
