// How it works: one window, four scenes, driven by how far the pinned section has been scrolled. Every frame is a
// pure function of that progress (u runs 0..4, one unit per scene), so scrolling back plays it backwards exactly and
// any moment can be reproduced. In calm motion each scene simply shows its finished state, and changes by fading.
import { scrub } from './motion/live.mjs';
import { clamp, span, lerp, ease } from './motion/spring.mjs';
import * as K from './app-kit.mjs';

const PATHS = ['D:/…/Alex/Documents/Manuscripts', 'D:/…/Alex/Downloads', 'D:/…/Alex/Pictures/Photos/2026', 'D:/…/Alex/Projects/bookshop-site/node_modules',
  'D:/…/Alex/Projects/cover-tool/target/release/deps', 'D:/…/Alex/Videos/Book trailers', 'D:/…/Alex/AppData/Local/npm-cache', 'D:/…/Studio/Renders/Print'];
const VIEWS = [
  ['overview', 'Overview', 'Make room for what matters. See where space goes. Review before removing anything.'],
  ['folders', 'Folder map', 'Follow the space. Drill into folders, compare size on disk, and inspect what they contain.'],
  ['review', 'Review plan', 'A plan before any action. Your saved decisions, backup notes, and cloud-only review list. Nothing is executed.'],
];
const DECISION = 'Review cleanup (not approved to delete)';
const io = ease.inOut, eo = ease.out;

export default function story(section) {
  const slot = section.querySelector('[data-story-app]');
  const projects = K.TREE.kids[2], site = projects.kids[1], nm = site.kids[0];
  slot.insertAdjacentHTML('beforeend', K.shell({
    picture: 'A scripted walk through StorageLens: a scan fills in the Overview, the folder map opens Projects and then bookshop-site, the details panel explains node_modules, and a review decision is saved without changing any file.',
  }));
  slot.classList.add('is-live');
  const app = slot.querySelector('.app'), page = app.querySelector('[data-app-page]'), body = app.querySelector('.app-body');
  const q = (s, el = app) => el.querySelector(s), qa = (s, el = app) => [...el.querySelectorAll(s)];

  page.innerHTML = `
  <div class="app-layer" data-l="ov">
    ${K.driveCard()}
    <div class="aband">
      <div class="acard ascan" data-scan><b>Scanning D:</b><code data-scan-path></code><span data-scan-n></span><div class="ascan-bar"><i data-scan-light></i></div></div>
      <div class="acard anotice" data-notice>${K.icon('warn')}<span>Read-only metadata inventory. Categories, inferred owners and cleanup suggestions are heuristics, not proof.</span></div>
    </div>
    ${K.overviewMetrics()}
    <div class="agrid">${K.mapCard()}${K.reviewCard()}</div>
  </div>
  <div class="app-layer" data-l="fo">
    ${K.driveCard()}
    <div class="acrumbs"><em>Location</em><span data-crumbs></span></div>
    <div class="agrid agrid-1">${K.mapCard({ title: 'Inside this folder', sub: 'Immediate children · choose Browse to continue', layers: 3 })}</div>
  </div>
  <div class="app-layer" data-l="pl">
    ${K.driveCard()}
    <div class="acard anote">${K.icon('info')}<div><b>Decisions are saved. Files are untouched.</b><p>Inspect an item to mark Keep, Review cleanup, Archive after backup, or Consider cloud-only. Backup confirmation is your own attestation, not an automated check.</p></div></div>
    <div class="acard alist" data-plan>
      <div class="alist-h"><span>Name / location</span><span>On disk</span><span>Decision</span></div>
      <div class="alist-r"><div><b>node_modules</b><code>D:/…/Alex/Projects/bookshop-site</code></div><strong>${K.fmt(nm.bytes)}</strong><span class="atag t-review">Review cleanup</span></div>
    </div>
  </div>`;
  body.insertAdjacentHTML('beforeend', `
  <div class="app-scrim" data-scrim></div>
  <div class="app-insp" data-insp><div class="insp-in" data-insp-in>
    <span class="insp-k" data-il>FILE &amp; FOLDER INSPECTOR</span>
    <span data-il>${K.tag('review')}</span>
    <b class="insp-name" data-il>node_modules</b>
    <code class="insp-path" data-il>D:/…/Alex/Projects/bookshop-site/node_modules</code>
    <div class="insp-size" data-il><div><span>Measured on disk</span><b>${K.fmt(nm.bytes)}</b></div><div><span>Logical file size</span><b>20.2 MiB</b></div></div>
    <b class="insp-h" data-il>What is this?</b>
    <span class="insp-note" data-il>A project’s npm packages (node_modules)</span>
    <p class="insp-p" data-il>A project’s installed packages. npm can install them again from the project’s package files.</p>
    <p class="insp-p ink" data-il>To free space: Remove node_modules from a project you’re not working on; npm ci or npm install puts it back.</p>
    <p class="insp-p warm" data-il>Keep package.json and the lockfile, and check for local edits inside node_modules first.</p>
    <span class="insp-src" data-il>Source: npm Docs</span>
    <i class="insp-div" data-il></i>
    <b class="insp-h" data-il>Record a decision</b>
    <p class="insp-p" data-il>These are planning notes only. No deletion, move, or cloud change.</p>
    <div class="insp-select" data-il data-select><span data-select-a>No decision</span><span data-select-b>${DECISION}</span></div>
    <span class="abtn abtn-primary insp-save" data-il data-save>Save review decision</span>
  </div></div>
  <div class="app-toast" data-toast>Review decision saved. No files changed.</div>
  ${K.cursor()}`);

  // The maps. Their boxes keep one shape at every size (the whole window scales as one), so percentages hold.
  const ovMap = q('[data-l="ov"] [data-map]'), foMap = q('[data-l="fo"] [data-map]');
  const ovLayer = q('[data-map-layer="0"]', ovMap);
  const levels = qa('[data-map-layer]', foMap);
  ovLayer.innerHTML = K.tiles(K.TREE, ovMap.clientWidth, ovMap.clientHeight, { hint: true });
  const FW = foMap.clientWidth, FH = foMap.clientHeight;
  levels[0].innerHTML = K.tiles(K.TREE, FW, FH, { hint: true });
  levels[1].innerHTML = K.tiles(projects, FW, FH, { hint: true });
  levels[2].innerHTML = K.tiles(site, FW, FH);
  const rProjects = K.rectsOf(K.TREE, FW, FH)[2], rSite = K.rectsOf(projects, FW, FH)[1], rNm = K.rectsOf(site, FW, FH)[0];

  const el = {
    layers: { ov: q('[data-l="ov"]'), fo: q('[data-l="fo"]'), pl: q('[data-l="pl"]') },
    title: q('[data-app-title]'), sub: q('[data-app-sub]'), meta: q('[data-app-meta]'),
    scan: q('[data-scan]'), notice: q('[data-notice]'), scanPath: q('[data-scan-path]'), scanN: q('[data-scan-n]'), light: q('[data-scan-light]'),
    fills: qa('[data-drive-fill]'), ovTiles: qa('.tile', ovLayer), revs: qa('[data-rev]'),
    mAlloc: q('[data-m-alloc]'), mFiles: q('[data-m-files]'), mLogical: q('[data-m-logical]'), mLower: q('[data-m-lower]'), mOd: q('[data-m-od]'),
    crumbs: q('[data-crumbs]'), ringProjects: q('[data-tile="2"] .tile-ring', levels[0]), ringSite: q('[data-tile="1"] .tile-ring', levels[1]), ringNm: q('[data-tile="0"] .tile-ring', levels[2]),
    scrim: q('[data-scrim]'), insp: q('[data-insp]'), inspIn: q('[data-insp-in]'), lines: qa('[data-il]'),
    select: q('[data-select]'), selA: q('[data-select-a]'), selB: q('[data-select-b]'), save: q('[data-save]'),
    toast: q('[data-toast]'), planRow: q('.alist-r'), cursor: q('[data-cursor]'), click: q('[data-click]'),
    steps: [...section.querySelectorAll('[data-step]')], rail: section.querySelector('[data-story-rail]'),
  };

  // Where the pointer goes, as fractions of the window, measured with the panel standing where it ends up.
  const INSP_SCROLL = 9.5;   // em the panel's contents move up to bring "Record a decision" into view
  let pts = null;
  function measure() {
    const a = app.getBoundingClientRect(), m = foMap.getBoundingClientRect();
    if (!a.width) return;
    const inMap = (r) => [(m.left - a.left + (r.x + r.w / 2) * m.width) / a.width, (m.top - a.top + (r.y + r.h * 0.6) * m.height) / a.height];
    const keepI = el.insp.style.transform, keepIn = el.inspIn.style.transform;
    el.insp.style.transform = 'none'; el.inspIn.style.transform = 'none';
    const em = parseFloat(getComputedStyle(app).fontSize);
    const at = (node) => { const r = node.getBoundingClientRect(); return [(r.left - a.left + r.width * 0.6) / a.width, (r.top - a.top + r.height / 2 - INSP_SCROLL * em) / a.height]; };
    pts = { start: [0.58, 0.9], projects: inMap(rProjects), site: inMap(rSite), nm: inMap(rNm), select: at(el.select), save: at(el.save) };
    el.insp.style.transform = keepI; el.inspIn.style.transform = keepIn;
  }
  measure();
  new ResizeObserver(() => { measure(); scene.wake(); }).observe(app);

  // Text is written only when it changes.
  const shown = new Map();
  const text = (node, s) => { if (shown.get(node) !== s) { shown.set(node, s); node.textContent = s; } };
  const along = (u, keys) => {
    if (u <= keys[0][0]) return keys[0][1];
    for (let i = 1; i < keys.length; i++) if (u <= keys[i][0]) { const k = io(span(u, keys[i - 1][0], keys[i][0])); return [lerp(keys[i - 1][1][0], keys[i][1][0], k), lerp(keys[i - 1][1][1], keys[i][1][1], k)]; }
    return keys[keys.length - 1][1];
  };
  const ring = (u, at) => { const k = span(u, at, at + 0.09); return k > 0 && k < 1 ? [lerp(0.35, 1, eo(k)), 1 - k] : [1, 0]; };

  function draw(p, { calm }) {
    let u = p * 4;
    const act = Math.min(3, Math.floor(u));
    if (calm) u = act + 1;                                   // each scene's finished state
    const s1 = clamp(u), s2 = clamp(u - 1), s3 = clamp(u - 2), s4 = clamp(u - 3);
    const move = (node, t) => { node.style.transform = calm ? '' : t; };

    // The steps beside the window.
    el.steps.forEach((s, i) => s.classList.toggle('is-on', i === act));
    el.rail.style.transform = `scaleY(${clamp(p * 1.02).toFixed(4)})`;

    // Which page is up, and its header.
    const toFo = span(s2, 0, 0.1), toPl = span(s4, 0.78, 0.9);
    el.layers.ov.style.opacity = 1 - toFo;
    el.layers.fo.style.opacity = toFo * (1 - toPl);
    el.layers.pl.style.opacity = toPl;
    const v = VIEWS[toPl > 0.5 ? 2 : toFo > 0.5 ? 1 : 0];
    if (shown.get(app) !== v[0]) { shown.set(app, v[0]); K.setRail(app, v[0]); }
    text(el.title, v[1]); text(el.sub, v[2]);

    // 1 · Scan: the counters run, the drive bar fills, tiles and review rows arrive as their folders are counted.
    const e = Math.round(eo(span(s1, 0.04, 0.86)) * 60) / 60;   // the counters step 60 times, not once a frame
    el.scan.style.opacity = 1 - span(s1, 0.88, 0.97);
    el.notice.style.opacity = span(s1, 0.9, 1);
    move(el.light, `translateX(${lerp(-100, 360, (s1 * 5) % 1).toFixed(1)}%)`);
    text(el.scanPath, PATHS[Math.min(PATHS.length - 1, Math.floor(e * PATHS.length))]);
    text(el.scanN, `${K.num(K.TOTALS.files * e)} files · ${K.num(K.TOTALS.folders * e)} folders`);
    text(el.meta, s1 < 0.9 ? 'Scanning…' : 'Last scan today 9:10 AM · 2,617 items');
    for (const fill of el.fills) move(fill, `scaleX(${eo(span(s1, 0, 0.16)).toFixed(4)})`);
    text(el.mAlloc, K.fmt(K.TOTALS.allocated * e)); text(el.mFiles, `${K.num(K.TOTALS.files * e)} files · 0 unknown`);
    text(el.mLogical, K.fmt(K.TOTALS.logical * e)); text(el.mLower, K.fmt(K.TOTALS.lower * e)); text(el.mOd, K.fmt(K.TOTALS.onedrive * e));
    el.ovTiles.forEach((t, i) => { const k = eo(span(s1, 0.16 + i * 0.075, 0.36 + i * 0.075)); t.style.opacity = k; move(t, `scale(${lerp(0.7, 1, k).toFixed(4)})`); });
    el.revs.forEach((r, i) => { const k = eo(span(s1, 0.58 + i * 0.07, 0.72 + i * 0.07)); r.style.opacity = k; move(r, `translateY(${((1 - k) * 0.9).toFixed(3)}em)`); });

    // 2 · Map: into Projects, then into bookshop-site. A folder's children grow out of its own tile.
    const z1 = io(span(s2, 0.3, 0.52)), z2 = io(span(s2, 0.7, 0.92));
    const zoom = (parent, child, r, k) => {
      move(parent, `translate(${(-r.x / r.w * 100 * k).toFixed(3)}%, ${(-r.y / r.h * 100 * k).toFixed(3)}%) scale(${(1 + (1 / r.w - 1) * k).toFixed(4)}, ${(1 + (1 / r.h - 1) * k).toFixed(4)})`);
      move(child, `translate(${(r.x * 100 * (1 - k)).toFixed(3)}%, ${(r.y * 100 * (1 - k)).toFixed(3)}%) scale(${lerp(r.w, 1, k).toFixed(4)}, ${lerp(r.h, 1, k).toFixed(4)})`);
    };
    zoom(levels[0], levels[1], rProjects, z1);
    levels[0].style.opacity = 1 - span(z1, 0.2, 0.6);
    if (z2 > 0) zoom(levels[1], levels[2], rSite, z2); else move(levels[2], 'scale(0)');
    levels[1].style.opacity = span(z1, 0.12, 0.5) * (1 - span(z2, 0.2, 0.6));
    levels[2].style.opacity = span(z2, 0.12, 0.5);
    el.ringProjects.style.opacity = span(s2, 0.22, 0.28) * (1 - z1);
    el.ringSite.style.opacity = span(s2, 0.62, 0.68) * (1 - z2);
    text(el.crumbs, z2 > 0.5 ? 'D: / … / Alex / Projects / bookshop-site' : z1 > 0.5 ? 'D: / … / Alex / Projects' : 'D: / … / Alex');

    // 3 · Understand: the details panel slides in over the dimmed page and its lines arrive from the top down.
    const inK = eo(span(s3, 0.18, 0.44)), outK = ease.in(span(s4, 0.68, 0.84)), up = inK * (1 - outK);
    el.ringNm.style.opacity = span(s3, 0.1, 0.16) * (1 - toPl);
    el.scrim.style.opacity = up;
    if (calm) { el.insp.style.transform = 'none'; el.insp.style.opacity = up; }
    else { el.insp.style.opacity = ''; el.insp.style.transform = `translateX(${(103 * (1 - inK) + 103 * outK).toFixed(3)}%)`; }
    el.lines.forEach((l, i) => { const k = eo(span(s3, 0.34 + i * 0.034, 0.46 + i * 0.034)); l.style.opacity = k; move(l, `translateY(${((1 - k) * 0.8).toFixed(3)}em)`); });

    // 4 · Decide: down to "Record a decision", choose, save. A notice confirms nothing changed, and the plan has a row.
    el.inspIn.style.transform = `translateY(${(-INSP_SCROLL * io(span(s4, 0.02, 0.2))).toFixed(3)}em)`;
    const chose = span(s4, 0.38, 0.44);
    el.selA.style.opacity = 1 - chose; el.selB.style.opacity = chose;
    move(el.save, `scale(${(1 - 0.04 * (span(s4, 0.55, 0.58) - span(s4, 0.6, 0.64))).toFixed(4)})`);
    const toast = eo(span(s4, 0.6, 0.68)) * (1 - span(s4, 0.93, 0.99));
    el.toast.style.opacity = toast;
    move(el.toast, `translateY(${((1 - eo(span(s4, 0.6, 0.68))) * 1.6).toFixed(3)}em)`);
    const row = eo(span(s4, 0.86, 0.98));
    el.planRow.style.opacity = row; move(el.planRow, `translateY(${((1 - row) * 0.9).toFixed(3)}em)`);

    // The pointer: one path through all four scenes, and the ring of each click.
    if (pts && !calm) {
      const c = along(u, [[1.1, pts.start], [1.26, pts.projects], [1.52, pts.projects], [1.66, pts.site], [2.0, pts.site], [2.13, pts.nm], [3.2, pts.nm], [3.34, pts.select], [3.44, pts.select], [3.54, pts.save], [4, pts.save]]);
      const t = `translate(${(c[0] * 100).toFixed(3)}%, ${(c[1] * 100).toFixed(3)}%)`;
      el.cursor.style.transform = t;
      el.cursor.style.opacity = span(u, 1.08, 1.14) * (1 - span(u, 2.2, 2.3)) + span(u, 3.12, 3.2) * (1 - span(u, 3.62, 3.7));
      let rs = 1, ro = 0;
      for (const at of [1.28, 1.68, 2.15, 3.36, 3.555]) { const [a, b] = ring(u, at); if (b > 0) { rs = a; ro = b; } }
      el.click.style.transform = `${t} scale(${rs.toFixed(3)})`;
      el.click.style.opacity = ro;
    } else { el.cursor.style.opacity = 0; el.click.style.opacity = 0; }
  }

  const scene = scrub(section, draw, { mode: 'pinned', layers: [levels[0], levels[1], levels[2], el.insp, el.cursor] });
}
