// The StorageLens window redrawn in HTML in each of its seven layouts, for the page's demos:
// Standard's sidebar and cards, Telemetry's dial and readouts, Atlas's map, Strata's columns, Mosaic's board,
// Ledger's report and Skyline's city. A layout decides where things sit; the colours, corners and type come from the
// theme (the stylesheet's variables), so any layout can be drawn in any theme.
//
// Each layout was drawn from pictures of the released app (24 November 2026). The data is app-kit.mjs's made-up
// library and the engine's answers for it; shares ("28%") are worked out from those sizes, as the apps do.
//
// What a demo may rely on, in every layout:
//   shell()     .app with [data-app-page], [data-app-title], [data-app-sub], [data-app-meta], [data-nav] and, when
//               asked for, the Assistant's panel (.app-chat)
//   overview()  [data-m-alloc|files|logical|lower|od] totals, [data-drive-fill], the folders as .tile or [data-sp]
//               (how each arrives: scale, rise, grow or fade), review rows [data-rev]; with `live`, [data-scan] and
//               [data-notice]
//   drill()     three levels [data-level="0|1|2"] (Alex, Projects, bookshop-site), what to click in each [data-pt],
//               what stays selected [data-sel], things that take turns in any layout [data-swap], and [data-crumbs]
//   plan()      the Review plan with one saved decision, .alist-r
import * as K from './app-kit.mjs';

const { fmt, num, esc, icon, TREE, TOTALS, DRIVE, REVIEW } = K;
const PROJECTS = TREE.kids[2], SITE = PROJECTS.kids[1];
const NODES = { root: TREE, projects: PROJECTS, site: SITE };
/** Which child is opened at each level of the walkthrough, and what the pointer's target is called. */
const OPEN = [[TREE, 2, 'projects'], [PROJECTS, 1, 'site'], [SITE, 0, 'nm']];
const ROOT_PATH = 'D:/…/Alex';
const LAST_SCAN = 'Last scan today 9:10 AM · 2,617 items';

const kids = (n) => n.kids || [];
const C = (i) => `var(--m${(i % 8) + 1})`;
const split = (bytes) => fmt(bytes).split(' ');
const pct = (part, whole) => { const p = (part / whole) * 100; return p < 0.5 ? '<1%' : `${Math.round(p)}%`; };
const counts = (n) => `${kids(n).length} items · ${kids(n).filter((k) => !k.file).length} folders`;
const caption = '<span class="app-caption"><i></i><i></i><i></i></span>';
const search = '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true"><circle cx="11" cy="11" r="6.5"/><path d="m16 16 4.5 4.5"/></svg>';
const unit = (hook, bytes) => { const [v, u] = split(bytes); return `<span class="fig-u" ${hook} data-unit><b>${v}</b><i>${u}</i></span>`; };
const pick = (...opts) => `<span class="lpick">${opts.map((o, i) => `<i${i === 0 ? ' class="is-on"' : ''}>${o}</i>`).join('')}</span>`;

export const HEADS = {
  overview: ['Overview', 'Make room for what matters. See where space goes. Review before removing anything.'],
  folders: ['Folder map', 'Follow the space. Drill into folders, compare size on disk, and inspect what they contain.'],
  files: ['Largest files', 'The files that add up. Largest measured allocations first. Dates and file sizes are clues, not verdicts.'],
  growth: ['What’s growing', 'Catch what’s accumulating. Folder snapshots reveal growth after your second comparable scan.'],
  review: ['Review plan', 'A plan before any action. Your saved decisions, backup notes, and cloud-only review list. Nothing is executed.'],
};
const VIEWS = [
  ['overview', 'home', 'Overview'], ['folders', 'folder', 'Folder map'], ['files', 'file', 'Largest files'], ['candidates', 'broom', 'Cleanup review'],
  ['onedrive', 'cloud', 'OneDrive'], ['growth', 'growth', 'What’s growing'], ['review', 'list', 'Review plan'], ['signals', 'shield', 'Worth a look'],
];
const MORE = [['coverage', 'pulse', 'Scan coverage'], ['settings', 'gear', 'Settings'], ['about', 'info', 'About']];
const METRICS = [
  ['Measured local files', 'data-m-alloc', TOTALS.allocated, `<small data-m-files>${num(TOTALS.files)} files · 0 unknown</small>`],
  ['Logical file size', 'data-m-logical', TOTALS.logical, '<small>Not the same as disk use</small>'],
  ['Lower-risk candidates', 'data-m-lower', TOTALS.lower, '<small>Not guaranteed savings</small>'],
  ['OneDrive on this PC', 'data-m-od', TOTALS.onedrive, '<small>727.5 KiB logical · not account quota</small>'],
];
const NOTICE = 'Read-only metadata inventory. Categories, inferred owners and cleanup suggestions are heuristics, not proof.';
const scanCard = (cls = 'acard ascan') => `<div class="${cls}" data-scan><b>Scanning D:</b><code data-scan-path></code><span data-scan-n></span><div class="ascan-bar"><i data-scan-light></i></div></div>`;
const noticeCard = (text = NOTICE) => `<div class="acard anotice" data-notice>${icon('warn')}<span>${text}</span></div>`;
/** The strip where a scan reports while it runs, and the standing caution takes its place when it is done. */
const band = (live, text) => (live ? `<div class="aband">${scanCard()}${noticeCard(text)}</div>` : noticeCard(text));
const rail = (list = [...VIEWS, null, ...MORE]) => list.map((v) => (v ? `<span class="rail-i" data-nav="${v[0]}">${icon(v[1])}</span>` : '<span class="rail-gap"></span>')).join('');
const side = (list, more) => `${list.map((v) => `<span class="side-i" data-nav="${v[0]}">${icon(v[1])}<b>${v[2]}</b></span>`).join('')}<span class="side-gap"></span>${more.map((v) => `<span class="side-i" data-nav="${v[0]}">${icon(v[1])}<b>${v[2]}</b></span>`).join('')}`;
const frame = (id, o, inner) => `<div class="app lay-${id}${o.chat ? ' has-chat' : ''}" data-layout="${id}" data-view="overview"${o.picture ? ` role="img" aria-label="${esc(o.picture)}"` : ''}><div class="app-root">${inner}</div></div>`;
const head = () => '<div><h4 class="app-title" data-app-title></h4><p class="app-sub" data-app-sub></p></div>';
const chat = (o, title) => (o.chat ? K.chatPanel().replace('<b>Assistant</b>', `<b data-chat-title>${title}</b>`) : '');
const mapBox = (nodes, extra = '') => `<div class="amap" data-map>${nodes.map((n, i) => `<div class="amap-l" data-map-layer="${i}" data-level="${i}" data-node="${n}"></div>`).join('')}${extra}</div>`;
const planBody = (kicker) => `${kicker ? `<p class="lkick">${kicker}</p>` : ''}
  <div class="acard anote">${icon('info')}<div><b>Decisions are saved. Files are untouched.</b><p>Inspect an item to mark Keep, Review cleanup, Archive after backup, or Consider cloud-only. Backup confirmation is your own attestation, not an automated check.</p></div></div>
  <div class="acard alist" data-plan>
    <div class="alist-h"><span>Name / location</span><span>On disk</span><span>Decision</span></div>
    <div class="alist-r"><div><b>node_modules</b><code>${ROOT_PATH}/Projects/bookshop-site</code></div><strong>${fmt(SITE.kids[0].bytes)}</strong><span class="atag t-review">Review cleanup</span></div>
  </div>`;
const mapCard = () => `<div class="acard amapc"><div class="acard-h"><div><b data-map-title>Where the space goes</b><span data-map-sub>Immediate children · measured disk allocation</span></div></div>${mapBox(['root'])}</div>`;
const crumbsRow = (extra = '') => `<div class="acrumbs"><em>Location</em><span data-crumbs></span>${extra}</div>`;
const reviewRows = (row) => REVIEW.map((r, i) => row(r, i)).join('');

// ── Standard: a sidebar (a rail of icons at this size), one page of cards, details from the right. ──
const standard = {
  name: 'Standard', mech: 'zoom', inspect: 'FILE &amp; FOLDER INSPECTOR', chatTitle: 'Assistant', inspScroll: 9.5,
  shell: (o = {}) => frame('standard', o, `
    <div class="app-bar"><svg class="brand-mark" aria-hidden="true"><use href="#logo"/></svg><b>StorageLens</b><em>Local storage inspector</em>${caption}</div>
    <div class="app-body">
      <div class="app-rail">${rail()}</div>
      <div class="app-main">
        <div class="app-head">${head()}
          <div class="app-acts"><span class="app-meta" data-app-meta>${LAST_SCAN}</span><span class="abtn${o.chat ? ' abtn-on' : ''}">${icon('chat')}Assistant</span><span class="abtn abtn-primary">${icon('refresh')}Scan now</span></div>
        </div>
        <div class="app-page" data-app-page></div>
      </div>
      ${chat(o, 'Assistant')}
    </div>`),
  overview: ({ live = false, compact = false } = {}) => `${K.driveCard()}${band(live)}${K.overviewMetrics()}
    <div class="agrid${compact ? ' agrid-1' : ''}">${mapCard()}${compact ? '' : K.reviewCard()}</div>`,
  drill: () => `${K.driveCard()}${crumbsRow()}
    <div class="agrid agrid-1"><div class="acard amapc"><div class="acard-h"><div><b>Inside this folder</b><span>Immediate children · choose Browse to continue</span></div></div>${mapBox(['root', 'projects', 'site'])}</div></div>`,
  plan: () => `${K.driveCard()}${planBody('')}`,
  banner: (who, said) => K.banner(who, said),
  page: ({ who, said, blocks }) => `${K.driveCard()}${K.banner(who, said)}${blocks}`,
};

// ── Telemetry: an instrument console. The drive on a dial, readouts beside it, a status strip, a command line. ──
function dial(node, centre) {
  const R = 35, CIRC = 2 * Math.PI * R, OUT = 2 * Math.PI * 44;
  let at = 0;
  const segs = kids(node).map((k, i) => {
    const len = (k.bytes / node.bytes) * CIRC, s = `<circle data-sp="fade" r="${R}" cx="50" cy="50" style="stroke:${C(i)}" stroke-dasharray="${Math.max(len - 0.7, 0.5).toFixed(2)} ${CIRC.toFixed(2)}" stroke-dashoffset="${(-at).toFixed(2)}"/>`;
    at += len;
    return s;
  }).join('');
  return `<div class="tl-dial"><svg viewBox="0 0 100 100" aria-hidden="true"><g transform="rotate(-90 50 50)">
    <circle class="tl-ticks" r="48.4" cx="50" cy="50"/><circle class="tl-track" r="44" cx="50" cy="50"/>
    <circle class="tl-used" r="44" cx="50" cy="50" stroke-dasharray="${((DRIVE.used / DRIVE.total) * OUT).toFixed(2)} ${OUT.toFixed(2)}"/>
    <g class="tl-segs">${segs}</g></g><circle class="tl-hub" r="26.5" cx="50" cy="50"/></svg><div class="tl-dial-c">${centre}</div></div>`;
}
const tlTable = (node, hooks = {}) => `<div class="tl-table"><div class="tl-th"><span>Folder</span><span>On disk</span><span>Share</span></div>
  ${kids(node).map((k, i) => `<div class="tl-tr" data-sp="rise" data-it="rise"${hooks[i] ? ` data-pt="${hooks[i]}"` : ''}><i style="background:${C(i)}"></i><b>${esc(k.name)}</b><strong>${fmt(k.bytes)}</strong><span>${pct(k.bytes, node.bytes)}</span>${hooks[i] ? `<u class="lsel" data-sel="${hooks.level}"></u>` : ''}</div>`).join('')}</div>`;
const telemetry = {
  name: 'Telemetry', mech: 'swap', inspect: 'READOUT · ITEM', chatTitle: 'Co-pilot',
  shell: (o = {}) => frame('telemetry', o, `
    <div class="app-body">
      <div class="app-rail"><i class="mk mk-telemetry"></i>${rail()}</div>
      <div class="app-main">
        <div class="tl-top"><h4 class="app-title" data-app-title></h4><span class="tl-path">/ ${ROOT_PATH}</span><p class="app-sub" data-app-sub></p>
          <span class="app-meta" data-app-meta>${LAST_SCAN}</span><span class="abtn">Export CSV</span><span class="abtn abtn-primary">${icon('refresh')}Scan now</span>${caption}</div>
        <div class="tl-ann"><span class="ok">Read-only</span><span class="ok">Metadata only</span><span class="warn">Heuristics, not proof</span><em class="ok">Control · <b data-control>You</b></em></div>
        <div class="app-page" data-app-page></div>
        <div class="tl-cmd"><b>›</b><span>Ask about your storage, or type a command</span><em>Assistant · answers from your latest scan</em><kbd>Ctrl K</kbd></div>
      </div>
      ${chat(o, 'Co-pilot')}
    </div>`),
  overview: ({ live = false, compact = false } = {}) => `${band(live)}
    <div class="tl-grid${compact ? ' is-compact' : ''}">
      <div class="acard tl-space"><div class="tl-h"><b>Where the space goes</b><span>Immediate children · measured disk allocation</span>${pick('On disk', 'Logical')}</div>
        <div class="tl-space-b">${dial(TREE, `${unit('data-m-alloc', TOTALS.allocated)}<em>on disk</em><small data-m-files>${num(TOTALS.files)} files · 0 unknown</small>`)}${tlTable(TREE)}</div></div>
      <div class="tl-reads">${METRICS.map((m, i) => `<div class="acard tl-read tl-read-${i}"><span>${m[0]}</span>${unit(m[1], m[2])}${m[3]}</div>`).join('')}</div>
      ${compact ? '' : `<div class="acard tl-rev"><div class="tl-h"><b>Start with a careful review</b><span>Inferred from location and type · not a deletion verdict</span></div>
        ${reviewRows((r, i) => `<div class="tl-rev-r" data-rev><em>${i + 1}</em><div><b>${r.title}</b><p>${r.text}</p></div><u><i style="width:${Math.max(6, (r.bytes / REVIEW[0].bytes) * 100).toFixed(0)}%"></i></u><strong>${fmt(r.bytes)}</strong>${K.tag(r.risk)}</div>`)}</div>
      <div class="acard tl-drive"><div class="tl-h"><b>Drive ${DRIVE.letter}</b></div><div class="lsegbar"><i data-drive-fill></i></div>
        <div class="tl-drive-n"><div><span>Used</span><b>${fmt(DRIVE.used)}</b></div><div class="is-free"><span>Free</span><b>${fmt(DRIVE.free)}</b></div></div><small>of ${fmt(DRIVE.total)}</small></div>`}
    </div>`,
  drill: () => `${crumbsRow('<span class="abtn abtn-sm">Inspect folder</span>')}
    <div class="acard tl-space tl-inside"><div class="tl-h"><b>Inside</b><span>Two levels · measured allocation</span>${pick('On disk', 'Logical')}</div>
      <div class="ldeck">${OPEN.map(([node, open, name], i) => `<div class="tl-space-b" data-level="${i}">${dial(node, `${unit('', node.bytes)}<em>on disk</em><small>${esc(node.name)}</small>`)}${tlTable(node, { [open]: name, level: i })}</div>`).join('')}</div></div>`,
  plan: () => planBody('Decision telemetry'),
  banner: (who, said) => `<div class="acard abanner"><span class="abanner-ic">${icon('bot')}</span><div class="abanner-b"><em>Driven by ${esc(who)}</em><span>“${esc(said)}”</span></div><button type="button" class="abtn abtn-sm" data-back>← Back to my view</button></div>`,
  pageHead: 'Query rack',
};

// ── Atlas: the map fills the window; a dock, a search bar, one card and a bottom row float around it. ──
const atlasStrip = () => `<div class="at-strip"><span class="at-chip at-drive">${icon('drive')}<b>${DRIVE.letter}</b><u><i data-drive-fill></i></u><span>${fmt(DRIVE.free)} free of ${fmt(DRIVE.total)}</span></span>
  ${METRICS.map((m) => `<span class="at-chip"><span>${m[0]}</span><b ${m[1]}>${fmt(m[2])}</b></span>`).join('')}</div>`;
const atlasCard = () => `<div class="acard at-card"><b>Select a tile to see it here</b><p>A click selects a folder or file; double-click, or Zoom into, goes inside it. Lenses recolour the map; nothing on disk changes.</p></div>`;
const atlasSafe = (live) => `<div class="acard at-safe">${live ? scanCard('at-scan') : ''}<div class="at-safe-b" data-notice>${icon('shield')}<div><b>Read-only · nothing on disk changes</b><span data-app-meta>${LAST_SCAN}</span></div></div></div>`;
const atlasLens = () => `<div class="acard at-lens"><em>Lens</em>${pick('Size', 'Risk', 'Growth', 'OneDrive')}<span>Measured<br>on disk</span></div>`;
const atlas = {
  name: 'Atlas', mech: 'zoom', inspect: 'Item', chatTitle: 'Map companion', crumbs: (where) => where[where.length - 1],
  shell: (o = {}) => frame('atlas', o, `
    <div class="app-body">
      <div class="app-rail"><i class="mk mk-atlas"></i>${rail()}</div>
      <div class="app-main">
        <div class="at-top"><span class="at-omni"><b>${DRIVE.letter}</b>${search}<span>Search, or ask the Assistant</span><kbd>Ctrl K</kbd></span>
          <span class="abtn">${icon('download')}Export</span><span class="abtn abtn-primary">${icon('refresh')}Scan now</span><span class="abtn at-round${o.chat ? ' abtn-on' : ''}">${icon('chat')}</span>${caption}</div>
        <div class="at-head">${head()}</div>
        <div class="app-page" data-app-page></div>
      </div>
      ${chat(o, 'Map companion')}
    </div>`),
  overview: ({ live = false, compact = false } = {}) => `${atlasStrip()}
    <div class="at-stage${compact ? ' is-compact' : ''}">${mapBox(['root'])}${compact ? '' : atlasCard()}${atlasLens()}${compact ? '' : atlasSafe(live)}</div>`,
  drill: () => `<div class="at-where"><span class="abtn abtn-sm">Up</span><b data-crumbs></b><span>Mapped siblings · measured on disk</span>${pick('Size', 'Risk', 'Growth', 'OneDrive')}</div>
    <div class="at-stage">${mapBox(['root', 'projects', 'site'])}${atlasCard()}${atlasLens()}${atlasSafe(false)}</div>`,
  plan: () => `<div class="at-sheet">${planBody('Plan atlas')}</div>`,
  banner: (who, said) => `<div class="acard abanner"><span class="abanner-ic">${icon('bot')}</span><div class="abanner-b"><em>Driven by ${esc(who)}</em><span>“${esc(said)}”</span></div><button type="button" class="abtn abtn-sm" data-back>← Back</button></div>`,
  pageHead: 'Survey sheet',
};

// ── Strata: one column per folder level, each with a stacked bar of its children. Made for the keyboard. ──
function column(node, { sel = -1, pt = '', level = -1 } = {}) {
  const [, open] = level >= 0 ? OPEN[level] : [null, sel];
  const strata = kids(node).map((k, i) => `<i style="flex:${Math.max(k.bytes / node.bytes, 0.014).toFixed(4)}"${i === sel ? ' class="is-on"' : ''}>${i === open && level >= 0 ? `<b data-sel="${level}"></b>` : ''}</i>`).join('');
  const rows = kids(node).map((k, i) => `<div class="st-row${i === sel ? ' is-on' : ''}" data-sp="rise"${i === open && pt ? ` data-pt="${pt}"` : ''}>${i === open && level >= 0 ? `<u class="lsel" data-sel="${level}"></u>` : ''}
    ${icon(k.file ? 'file' : 'folder')}<div><b>${esc(k.name)}</b><u><i style="width:${Math.max(2, (k.bytes / node.bytes) * 100).toFixed(1)}%"></i></u></div><strong>${fmt(k.bytes)}</strong><span>${pct(k.bytes, node.bytes)}</span><em>${k.kids ? '›' : ''}</em></div>`).join('');
  return `<div class="st-col-h"><b>${esc(node.name)}</b><span>${fmt(node.bytes)}</span></div><div class="st-col-b"><div class="st-strata">${strata}</div><div class="st-rows">${rows}</div></div><div class="st-col-f">${counts(node)}</div>`;
}
const strataPane = (node, parent) => `<div class="st-pane"><p class="lkick">Selected · Space to inspect</p><b class="st-pane-n">${esc(node.name)}</b><code>In ${ROOT_PATH}${parent === TREE ? '' : `/${parent.name}`}</code>
  <div class="st-pane-s"><div><span>On disk</span><b>${fmt(node.bytes)}</b></div><div><span>Of ${esc(parent.name)}</span><b class="is-accent">${pct(node.bytes, parent.bytes)}</b></div></div>
  <div class="st-pane-r"><span>Kind</span><b>${node.file ? 'File' : 'Folder'}</b></div><span class="abtn abtn-primary abtn-sm"><kbd>Space</kbd>Inspect</span>
  <p>Space, or a double click, opens its record: dates, owner, category, why it is listed, and a place to note a decision. A folder opens in the next column.</p></div>`;
const VIDEOS = TREE.kids[0];
const strata = {
  name: 'Strata', mech: 'cascade', inspect: 'INSPECTING · SPACE TO CLOSE', chatTitle: 'Command palette', crumbs: (where) => where.join('  ›  '),
  shell: (o = {}) => frame('strata', o, `
    <div class="st-top"><i class="mk mk-strata"></i><b>StorageLens</b>
      <span class="st-modes">${[['overview folders', 'Size'], ['files', 'Largest'], ['candidates', 'Candidates'], ['growth', 'Growth'], ['onedrive', 'OneDrive'], ['review', 'Plan'], ['signals', 'Signals'], ['coverage', 'Coverage']].map((m, i) => `<span class="st-mode" data-nav="${m[0]}"><i>${i + 1}</i>${m[1]}</span>`).join('')}</span>
      <span class="st-find"><kbd>/</kbd>Find</span><span class="st-find${o.chat ? ' is-on' : ''}"><kbd>Ctrl K</kbd>Ask</span><span class="abtn abtn-primary abtn-sm">Scan now</span>${caption}</div>
    <div class="st-path"><span class="st-crumbs" data-crumbs>Alex</span>${head()}<span class="st-status">${DRIVE.letter} ${fmt(DRIVE.free)} free of ${fmt(DRIVE.total)} · <span data-app-meta>${LAST_SCAN}</span></span></div>
    <div class="app-body"><div class="app-main"><div class="app-page" data-app-page></div></div>${chat(o, 'Command palette')}</div>
    <div class="st-foot"><span class="ok">Read-only · metadata only</span>${o.live ? scanCard('st-scan') : ''}<span class="warn" data-notice>Categories are heuristics, not proof</span>
      <em>↑↓ Move</em><em>→ Open</em><em>← Back</em><em>Space Inspect</em><em>/ Find</em><em>Ctrl K Ask</em></div>`),
  overview: ({ compact = false } = {}) => `<div class="st-cols${compact ? ' is-compact' : ''}">
    <div class="st-col">${column(TREE, { sel: 0 })}</div><div class="st-col" data-sp="fade">${column(VIDEOS, { sel: 0 })}</div>
    ${compact ? '' : `<div class="st-col" data-sp="fade">${column(VIDEOS.kids[0])}</div>`}<div data-sp="fade" class="st-pane-w">${strataPane(VIDEOS, TREE)}</div></div>`,
  drill: () => `<div class="st-cols">
    <div class="st-col" data-level="0">${column(TREE, { level: 0, pt: 'projects' })}</div>
    <div class="st-col" data-level="1">${column(PROJECTS, { level: 1, pt: 'site' })}</div>
    <div class="st-col" data-level="2">${column(SITE, { level: 2, pt: 'nm' })}</div>
    <div class="st-pane-w"><div class="ldeck"><div data-swap="1">${strataPane(PROJECTS, TREE)}</div><div data-swap="2">${strataPane(SITE, PROJECTS)}</div></div></div></div>`,
  plan: () => `<div class="lpad">${planBody('Decision columns')}</div>`, pad: true,
  banner: (who, said) => `<div class="acard abanner"><span class="abanner-ic">${icon('bot')}</span><div class="abanner-b"><em>${esc(who)} is showing</em><span>“${esc(said)}”</span></div><button type="button" class="abtn abtn-sm" data-back>Back · Esc</button></div>`,
  pageHead: 'Block index',
};

// ── Mosaic: every view is a board of tiles, each tile one figure, map or list. ──
const DOTS = ['var(--blue)', 'var(--green)', 'var(--ink)', 'var(--warm)', 'var(--green)', 'var(--warm)', 'var(--accent)', 'var(--red)'];
const before = (n) => n.bytes - (n.growth || 0);
const mosaic = {
  name: 'Mosaic', mech: 'zoom', inspect: 'Inspecting', chatTitle: 'Board conversation', crumbs: (where) => where[where.length - 1],
  heads: { overview: ['Overview', 'Board by StorageLens · 9 tiles'], folders: ['Folder map', 'Board by StorageLens · 2 tiles'] },
  shell: (o = {}) => frame('mosaic', o, `
    <div class="app-body">
      <div class="mo-side"><div class="mo-brand"><i class="mk mk-mosaic"></i><b>StorageLens</b></div><em>Boards</em>
        ${['Overview', 'Folders', 'Files', 'Cleanup', 'OneDrive', 'Growth', 'Plan', 'Signals'].map((n, i) => `<span class="side-i" data-nav="${VIEWS[i][0]}"><i style="background:${DOTS[i]}"></i><b>${n}</b></span>`).join('')}
        <span class="side-gap"></span>${MORE.map((v) => `<span class="side-i">${icon(v[1])}<b>${v[2]}</b></span>`).join('')}<span class="mo-safe">Read-only · How to read this scan</span></div>
      <div class="app-main">
        <div class="app-head">${head()}<div class="app-acts"><span class="abtn">${icon('gear')}Arrange</span><span class="abtn${o.chat ? ' abtn-on' : ''}">${icon('chat')}Ask</span><span class="abtn abtn-primary">Scan now</span>${caption}</div></div>
        <div class="app-page" data-app-page></div>
      </div>
      ${chat(o, 'Board conversation')}
    </div>`),
  overview: ({ live = false, compact = false } = {}) => `<div class="mo-board${compact ? ' is-compact' : ''}">
      <div class="mo-tile mo-drive"><span>${DRIVE.letter}</span><b>${split(DRIVE.free)[0]}</b><em>GiB free</em><div class="adrive-bar"><i data-drive-fill></i></div><small>${fmt(DRIVE.used)} used of ${fmt(DRIVE.total)}</small></div>
      <div class="mo-tile mo-space"><div class="mo-h"><span>Where the space goes</span>${pick('On disk', 'Logical')}</div>${mapBox(['root'])}</div>
      ${METRICS.map((m, i) => `<div class="mo-tile mo-metric mo-metric-${i}"><span>${m[0]}</span>${unit(m[1], m[2])}${m[3]}</div>`).join('')}
      ${compact ? '' : `<div class="mo-tile mo-rev"><div class="mo-h"><span>Start with a careful review <i>· not a deletion verdict</i></span></div>
        ${reviewRows((r) => `<div class="mo-rev-r" data-rev><div><b>${r.title}</b><p>${r.text}</p></div>${K.tag(r.risk)}<strong>${fmt(r.bytes)}</strong></div>`)}</div>
      <div class="mo-tile mo-grow"><span>What’s growing</span><b>+${split(TREE.growth)[0]}</b><em>${split(TREE.growth)[1]} in Alex since the previous scan</em>
        <div class="mo-grow-b"><i style="height:${((before(TREE) / TREE.bytes) * 100).toFixed(0)}%"><small>Before · ${fmt(before(TREE))}</small></i><i class="is-now"><small>Now · ${fmt(TREE.bytes)}</small></i></div></div>
      <div class="mo-tile mo-cover"><span>Scan coverage</span><b>Latest scan</b><small data-app-meta>${LAST_SCAN}</small><small class="is-accent">Heuristics, not proof · limits</small></div>`}
    </div>
    <div class="mo-foot">${live ? scanCard('mo-scan') : ''}<span data-notice>Categories and owners are heuristics, not proof.</span></div>`,
  drill: () => `<div class="mo-where"><em>Location</em><span>${DRIVE.letter}</span><b data-crumbs></b><span>Up</span></div>
    <div class="mo-board mo-board-2">
      <div class="mo-tile mo-space"><div class="mo-h"><span>Inside this folder · immediate children</span>${pick('On disk', 'Logical')}</div>${mapBox(['root', 'projects', 'site'])}</div>
      <div class="mo-tile mo-this"><span>This folder</span><b data-crumbs>Alex</b><p>The map shows its immediate children, each sized by what it takes on disk. A click opens one.</p><span class="abtn abtn-sm">Inspect folder</span></div>
    </div>`,
  plan: () => `<div class="mo-tile mo-plan">${planBody('Decision tiles')}</div>`,
  banner: (who, said) => `<div class="acard abanner"><span class="abanner-ic">${icon('bot')}</span><div class="abanner-b"><em>${esc(who)} is showing</em><span>“${esc(said)}”</span></div><button type="button" class="abtn abtn-sm" data-back>Back</button></div>`,
  pageHead: 'Board tiles',
};

// ── Ledger: a printed report. Ink rules instead of boxes, figures in dot matrix, the Assistant in the margin. ──
const lgBar = (node) => `<div class="lg-bar">${kids(node).map((k, i) => `<i data-sp="fade" style="flex:${Math.max(k.bytes / node.bytes, 0.01).toFixed(4)};background:${C(i)}"></i>`).join('')}</div>`;
const lgRows = (node, hooks = {}) => kids(node).map((k, i) => `<div class="lg-row" data-sp="rise" data-it="rise"${hooks[i] ? ` data-pt="${hooks[i]}"` : ''}>${hooks[i] ? `<u class="lsel" data-sel="${hooks.level}"></u>` : ''}<i style="background:${C(i)}"></i><b>${esc(k.name)}</b><strong class="fig">${fmt(k.bytes)}</strong><span>${pct(k.bytes, node.bytes)}</span></div>`).join('');
const ledger = {
  name: 'Ledger', mech: 'swap', inspect: 'MARGIN · INSPECTING', chatTitle: 'Assistant margin',
  shell: (o = {}) => frame('ledger', o, `
    <div class="lg-top"><b>StorageLens</b><em>Local storage inspector</em>
      <span class="lg-nav">${['Overview', 'Folders', 'Files', 'Cleanup', 'OneDrive', 'Growth', 'Plan', 'Signals'].map((n, i) => `<span data-nav="${VIEWS[i][0]}">${n}</span>`).join('')}<span class="is-dim">Coverage</span><span class="is-dim">Settings</span><span class="is-dim">About</span></span>
      <span class="abtn">Export</span><span class="abtn abtn-primary">Scan now</span>${caption}</div>
    <div class="lg-status"><span class="ok">Read-only</span><span>Metadata only</span><span data-app-meta>${LAST_SCAN}</span><span>Categories are heuristics, not proof</span><em>Coverage →</em></div>
    <div class="app-body">
      <div class="app-main"><div class="lg-head">${head()}</div><div class="app-page" data-app-page></div></div>
      ${o.chat ? chat(o, 'Assistant margin') : `<div class="lg-margin"><p class="lkick">Margin · Assistant</p><blockquote>Videos is the largest item shown on the folder map for ${ROOT_PATH}.<small>Written from your scan; no model is asked for this note.</small></blockquote>
        <span>What’s growing?<i>→</i></span><span>Make room on ${DRIVE.letter}<i>→</i></span><span>Files worth a review<i>→</i></span><div class="lg-ask"><p class="lkick">Ask in the margin · Ctrl K</p><u>Ask about your storage…</u><small>Nothing on your disk changes unless you confirm it.</small></div></div>`}
    </div>`),
  overview: ({ live = false, compact = false } = {}) => `${band(live)}
    <div class="lg-drive"><p class="lkick">Drive ${DRIVE.letter} <span>Measured by Windows</span></p>
      <div class="lg-drive-n"><b class="fig">${split(DRIVE.used)[0]}</b><div><em>GiB used</em><small>of ${fmt(DRIVE.total)}</small></div><span><b class="fig">${split(DRIVE.free)[0]}</b><small>GiB free</small></span></div>
      <div class="lsegbar"><i data-drive-fill></i></div></div>
    <div class="lg-metrics">${METRICS.map((m) => `<div><span>${m[0]}</span>${unit(m[1], m[2])}${m[3]}</div>`).join('')}</div>
    <div class="lg-cols${compact ? ' is-compact' : ''}">
      <div><div class="lg-h"><b>Where the space goes</b><span>Immediate children of ${ROOT_PATH} · on disk</span></div>${lgBar(TREE)}<div class="lg-list">${lgRows(TREE)}</div></div>
      ${compact ? '' : `<div><div class="lg-h"><b>Start with a careful review</b><span>Inferred from location and file type, not a deletion verdict.</span></div>
        ${reviewRows((r, i) => `<div class="lg-rev" data-rev><em class="fig">0${i + 1}</em><div><b>${r.title}</b>${K.tag(r.risk)}</div><strong><b class="fig">${split(r.bytes)[0]}</b> ${split(r.bytes)[1]}</strong></div>`)}</div>`}
    </div>`,
  drill: () => `${crumbsRow('<span class="abtn abtn-sm">Inspect folder</span>')}
    <p class="lkick">Sibling distribution ${pick('On disk', 'Logical')}</p>
    <div class="ldeck lg-deck">${OPEN.map(([node, open, name], i) => `<div data-level="${i}">${lgBar(node)}<div class="lg-list-h"><span>Name</span><span>On disk</span><span>Share</span></div><div class="lg-list">${lgRows(node, { [open]: name, level: i })}</div></div>`).join('')}</div>`,
  plan: () => planBody('Decision register'),
  banner: (who, said) => `<div class="acard abanner"><div class="abanner-b"><em>Driven by ${esc(who)}</em><span>“${esc(said)}”</span></div><button type="button" class="abtn abtn-sm" data-back>Back to my view</button></div>`,
  pageHead: 'Filter record',
};

// ── Skyline: folders as towers on a ground grid, height by size on disk; the previous scan is a line on each. ──
const SPOTS = [[0, 0], [1, 0], [0, 1], [2, 0], [1, 1], [0, 2], [2, 1], [1, 2]];
function city(node, hooks = {}) {
  const ks = kids(node), max = Math.max(...ks.map((k) => k.bytes)), A = 22, B = 12.5, a = 13, b = 7.4, OX = 110, OY = 80, TOP = 62;
  const place = ks.map((k, i) => { const [gx, gy] = SPOTS[i % SPOTS.length]; return { k, i, x: OX + (gx - gy) * A, y: OY + (gx + gy) * B, h: k.bytes / max < 0.03 ? 1.2 : Math.max(4, (k.bytes / max) * TOP), z: gx + gy }; });
  const grid = [];
  for (let n = -0.5; n <= 3.5; n++) {
    grid.push(`<path d="M${OX + (n - -0.5) * A} ${OY + (n + -0.5) * B}L${OX + (n - 3.5) * A} ${OY + (n + 3.5) * B}"/>`, `<path d="M${OX + (-0.5 - n) * A} ${OY + (-0.5 + n) * B}L${OX + (3.5 - n) * A} ${OY + (3.5 + n) * B}"/>`);
  }
  const towers = [...place].sort((p, q) => p.z - q.z || p.i - q.i).map(({ k, i, x, y, h }) => {
    const hp = k.growth ? (before(k) / max) * TOP : 0;
    return `<g class="sk-tower" data-sp="grow" data-it="grow" style="--c:${C(i)}"${hooks[i] ? ` data-pt="${hooks[i]}"` : ''}>
      <path class="sk-l" d="M${x - a} ${y - h}L${x} ${y - h + b}L${x} ${y + b}L${x - a} ${y}Z"/><path class="sk-r" d="M${x} ${y - h + b}L${x + a} ${y - h}L${x + a} ${y}L${x} ${y + b}Z"/>
      <path class="sk-t" d="M${x} ${y - h - b}L${x + a} ${y - h}L${x} ${y - h + b}L${x - a} ${y - h}Z"/>${hp ? `<path class="sk-ghost" d="M${x - a} ${(y - hp).toFixed(1)}L${x} ${(y - hp + b).toFixed(1)}L${x + a} ${(y - hp).toFixed(1)}"/>` : ''}
      ${hooks[i] ? `<path class="sk-pick" data-sel="${hooks.level}" d="M${x} ${y - h - b}L${x + a} ${y - h}L${x} ${y - h + b}L${x - a} ${y - h}Z"/>` : ''}</g>`;
  }).join('');
  const labels = place.map(({ k, i, x, y, h }) => `<span class="sk-label" data-sp="fade" data-it="rise" style="left:${(x / 220 * 100).toFixed(2)}%;top:${((y - h - b) / 150 * 100).toFixed(2)}%"><b>${esc(k.name)}${h < 2 ? ' · plaza' : ''}</b><i>${fmt(k.bytes)}</i></span>`).join('');
  return `<svg viewBox="0 0 220 150" aria-hidden="true"><g class="sk-grid">${grid.join('')}</g>${towers}</svg>${labels}`;
}
const skRows = (node) => kids(node).map((k, i) => `<div class="sk-row" data-sp="rise" data-it="rise"><i class="sk-cube" style="--c:${C(i)}"></i><b>${esc(k.name)}</b><strong>${fmt(k.bytes)}</strong><span${k.growth ? ' class="up"' : ''}>${k.growth ? `+${fmt(k.growth)}` : '–'}</span></div>`).join('');
const skToggles = () => `<div class="sk-toggles"><span><em>Height</em>${pick('On disk', 'Logical')}</span><span><em>Roofs</em>${pick('Folder', 'Risk', 'OneDrive')}</span><span><em>Ghost</em>${pick('Before', 'Off')}</span><small><i></i>Roof at the previous scan</small></div>`;
const skyline = {
  name: 'Skyline', mech: 'swap', inspect: 'Selected tower', chatTitle: 'City companion', pathTitle: true,
  heads: {
    overview: [ROOT_PATH, `6 folders as towers (1 more in the list) · height is size on disk · ${fmt(TREE.bytes)}`],
    folders: [ROOT_PATH, 'Towers are this folder’s children · height is size on disk'],
  },
  shell: (o = {}) => frame('skyline', o, `
    <div class="sk-top"><i class="mk mk-skyline"></i><b>StorageLens</b><span class="sk-find">${search}Find a folder or file</span><span class="abtn${o.chat ? ' abtn-on' : ''}">${icon('bot')}Ask</span><span class="abtn abtn-primary">Scan now</span>${caption}</div>
    <div class="app-body">
      <div class="sk-side">${side([['overview folders', 'home', 'City'], ...VIEWS.slice(2)], MORE)}<div class="sk-safe">${icon('shield')}<b>Read-only</b><p>Nothing on disk changes. Heights are measured from your last scan.</p></div></div>
      <div class="app-rail">${rail([['overview folders', 'home'], ...VIEWS.slice(2), null, ...MORE])}</div>
      <div class="app-main"><div class="app-head">${head()}<div class="app-acts">${o.live ? scanCard('sk-scan') : ''}<span class="app-meta" data-app-meta>${LAST_SCAN}</span></div></div><div class="app-page" data-app-page></div></div>
      ${chat(o, 'City companion')}
    </div>`),
  overview: ({ compact = false } = {}) => `<div class="sk-stage${compact ? ' is-compact' : ''}">
      <div class="sk-city-w"><div class="ldeck"><div class="sk-city">${city(TREE)}</div></div>${skToggles()}</div>
      ${compact ? '' : `<div class="sk-panel"><span>${DRIVE.letter}</span><p class="sk-free"><b>${fmt(DRIVE.free)}</b> free</p><div class="adrive-bar"><i data-drive-fill></i></div><small>${fmt(DRIVE.used)} used of ${fmt(DRIVE.total)}</small>
        <div class="sk-metrics">${METRICS.map((m) => `<div class="acard"><span>${m[0]}</span><b ${m[1]}>${fmt(m[2])}</b>${m[3]}</div>`).join('')}</div>
        <b class="sk-h">Tallest towers</b>${skRows(TREE)}</div>`}
    </div>`,
  drill: () => `<div class="sk-stage">
      <div class="sk-city-w"><div class="ldeck">${OPEN.map(([node, open, name], i) => `<div class="sk-city" data-level="${i}">${city(node, { [open]: name, level: i })}</div>`).join('')}</div>${skToggles()}</div>
      <div class="sk-panel"><div class="ldeck">${OPEN.map(([node], i) => `<div data-level="${i}"><b class="sk-h">Inside ${esc(node.name)}</b><small>Immediate siblings · measured allocation</small>${skRows(node)}</div>`).join('')}</div></div>
    </div>`,
  plan: () => planBody('Decision skyline'),
  banner: (who, said) => `<div class="acard abanner"><span class="abanner-ic">${icon('bot')}</span><div class="abanner-b"><em>Driven by ${esc(who)}</em><span>“${esc(said)}”</span></div><button type="button" class="abtn abtn-primary abtn-sm" data-back>Back to my view</button></div>`,
  pageHead: 'Tower index',
};

export const LAYOUT = { standard, telemetry, atlas, strata, mosaic, ledger, skyline };
export const layout = (id) => LAYOUT[id] || standard;

/** A page the Assistant or an agent put together, in a layout's own arrangement: who is driving, then the blocks. */
export function agentPage(id, { who, said, note, blocks }) {
  const L = layout(id);
  if (L.page) return L.page({ who, said, blocks });
  const html = `${L.banner(who, said)}<div class="apage"><p class="apage-n">${note}</p><div class="apage-h"><b>${L.pageHead}</b><span class="abtn abtn-sm">Pin page</span></div>${blocks}</div>`;
  return L.pad ? `<div class="lpad">${html}</div>` : html;
}

/** One of the app's own list pages (What's growing), framed as a layout frames its pages. */
export function plainPage(id, html) {
  const L = layout(id);
  return id === 'standard' ? `${K.driveCard()}${html}` : L.pad ? `<div class="lpad">${html}</div>` : html;
}

/** The title and the line under it that a layout gives a view. */
export const heading = (id, view) => layout(id).heads?.[view] || HEADS[view] || ['', ''];

/** Mark which view is up: the nav item, and data-view on the window (some layouts show their header by view). */
export function setNav(app, view) {
  app.dataset.view = view || 'page';
  for (const n of app.querySelectorAll('[data-nav]')) n.classList.toggle('is-on', !!view && n.dataset.nav.split(' ').includes(view));
}

/**
 * Fill the folder maps of a freshly inserted piece of a window (a map needs its box's size, so it is drawn once it
 * is in the page). `as: 'button'` makes tiles you can click. Returns the tile rectangles of each map, by layer.
 */
export function fillMaps(root, { as = 'div', hint = true } = {}) {
  const out = [];
  for (const map of root.querySelectorAll('[data-map]')) {
    const W = map.clientWidth, H = map.clientHeight;
    for (const layer of map.querySelectorAll('.amap-l[data-node]')) {
      const node = NODES[layer.dataset.node], level = +layer.dataset.level;
      layer.innerHTML = K.tiles(node, W, H, { as, hint: hint && level < 2 });
      out.push({ map, layer, node, rects: K.rectsOf(node, W, H) });
    }
    // In a drill, the tile to click at each level is the walkthrough's.
    if (map.querySelectorAll('.amap-l').length === 3) OPEN.forEach(([, open, name], i) => map.querySelector(`[data-level="${i}"] [data-tile="${open}"]`)?.setAttribute('data-pt', name));
  }
  return out;
}
export { OPEN, NODES, ROOT_PATH, LAST_SCAN };
