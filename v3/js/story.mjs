// How it works, in whichever layout is on: one window, four scenes, driven by how far the pinned section has been
// scrolled. Every frame is a pure function of that progress (u runs 0..4, one unit per scene), so scrolling back plays
// it backwards exactly, and a change of look redraws the same moment in the new layout. In calm motion each scene
// simply shows its finished state, and changes by fading.
//
// The window is drawn by js/layouts.mjs. This file knows only the hooks every layout provides: the totals that count
// up, the folders that arrive, three levels to go into (by zooming a map, by sliding in a column, or by swapping a
// dial, a list or a city), the details panel, and the plan.
import { scrub } from '../../js/motion/live.mjs';
import { clamp, span, lerp, ease } from '../../js/motion/spring.mjs';
import * as K from '../../js/app-kit.mjs';
import { layout, heading, setNav, fillMaps, OPEN, LAST_SCAN } from '../../js/layouts.mjs';
import { current, onLook } from '../../js/looks.mjs';

const PATHS = ['D:/…/Alex/Documents/Manuscripts', 'D:/…/Alex/Downloads', 'D:/…/Alex/Pictures/Photos/2026', 'D:/…/Alex/Projects/bookshop-site/node_modules',
  'D:/…/Alex/Projects/cover-tool/target/release/deps', 'D:/…/Alex/Videos/Book trailers', 'D:/…/Alex/AppData/Local/npm-cache', 'D:/…/Studio/Renders/Print'];
const VIEWS = ['overview', 'folders', 'review'];
const WHERE = [['Alex'], ['Alex', 'Projects'], ['Alex', 'Projects', 'bookshop-site']];
const DECISION = 'Review cleanup (not approved to delete)';
const PICTURE = 'A scripted walk through StorageLens: a scan fills in the Overview, the folders open into Projects and then bookshop-site, the details panel explains node_modules, and a review decision is saved without changing any file.';
const io = ease.inOut, eo = ease.out;
const whenIdle = window.requestIdleCallback ? (f) => requestIdleCallback(f, { timeout: 1500 }) : (f) => setTimeout(f, 200);

export default function story(section) {
  const slot = section.querySelector('[data-story-app]');
  const steps = [...section.querySelectorAll('[data-step]')], railLine = section.querySelector('[data-story-rail]');
  const nm = OPEN[2][0].kids[0];
  slot.classList.add('is-live');

  /** Build the window in one layout; returns what takes it down again. */
  function build(id) {
    const L = layout(id);
    slot.insertAdjacentHTML('beforeend', L.shell({ live: true, picture: PICTURE }));
    const app = slot.querySelector('.app'), page = app.querySelector('[data-app-page]'), body = app.querySelector('.app-body');
    const q = (s, el = app) => el.querySelector(s), qa = (s, el = app) => [...el.querySelectorAll(s)];

    page.innerHTML = `<div class="app-layer" data-l="ov">${L.overview({ live: true })}</div><div class="app-layer" data-l="fo">${L.drill()}</div><div class="app-layer" data-l="pl">${L.plan()}</div>`;
    body.insertAdjacentHTML('beforeend', `
    <div class="app-scrim" data-scrim></div>
    <div class="app-insp" data-insp><div class="insp-in" data-insp-in>
      <span class="insp-k" data-il>${L.inspect}</span>
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

    // The folder maps keep one shape at every size (the whole window scales as one), so their percentages hold.
    const maps = fillMaps(page);
    const layers = { ov: q('[data-l="ov"]'), fo: q('[data-l="fo"]'), pl: q('[data-l="pl"]') };
    const levels = [0, 1, 2].map((i) => qa(`[data-level="${i}"]`, layers.fo));
    const drillMaps = maps.filter((m) => layers.fo.contains(m.layer)).sort((a, b) => a.layer.dataset.level - b.layer.dataset.level);
    const rOpen = drillMaps.length === 3 ? OPEN.slice(0, 2).map(([, open], i) => drillMaps[i].rects[open]) : null;
    const pt = Object.fromEntries(OPEN.map(([, , name]) => [name, q(`[data-pt="${name}"]`, layers.fo)]));
    const el = {
      title: q('[data-app-title]'), sub: q('[data-app-sub]'), meta: qa('[data-app-meta]'), crumbs: qa('[data-crumbs]'),
      scan: qa('[data-scan]'), notice: qa('[data-notice]'), scanPath: qa('[data-scan-path]'), scanN: qa('[data-scan-n]'), light: qa('[data-scan-light]'),
      fills: qa('[data-drive-fill]'), sp: qa('.tile, [data-sp]', layers.ov), revs: qa('[data-rev]', layers.ov),
      m: { alloc: qa('[data-m-alloc]'), files: qa('[data-m-files]'), logical: qa('[data-m-logical]'), lower: qa('[data-m-lower]'), od: qa('[data-m-od]') },
      items: levels.map((ls) => ls.flatMap((l) => qa('[data-it]', l))), sel: [0, 1, 2].map((i) => qa(`[data-sel="${i}"]`, layers.fo)),
      swap: [0, 1, 2].map((i) => qa(`[data-swap="${i}"]`, layers.fo)),
      rings: OPEN.map(([, , name]) => pt[name]?.querySelector('.tile-ring')),
      scrim: q('[data-scrim]'), insp: q('[data-insp]'), inspIn: q('[data-insp-in]'), lines: qa('[data-il]'),
      select: q('[data-select]'), selA: q('[data-select-a]'), selB: q('[data-select-b]'), save: q('[data-save]'),
      toast: q('[data-toast]'), planRow: q('.alist-r', layers.pl), cursor: q('[data-cursor]'), click: q('[data-click]'),
    };
    const spStep = Math.min(0.075, 0.5 / Math.max(1, el.sp.length - 1));

    // Where the pointer goes, as fractions of the window, measured with everything standing where it ends up.
    let pts = null, scrollEm = L.inspScroll ?? 0;
    function measure() {
      const a = app.getBoundingClientRect();
      if (!a.width) return;
      app.classList.add('is-measuring');
      const em = parseFloat(getComputedStyle(app).fontSize);
      const mid = (node, fx = 0.5, fy = 0.6) => { const r = node.getBoundingClientRect(); return [(r.left - a.left + r.width * fx) / a.width, (r.top - a.top + r.height * fy) / a.height]; };
      // How far the panel's contents move up to bring "Record a decision" and its button into view.
      if (L.inspScroll == null) scrollEm = Math.max(0, (el.save.getBoundingClientRect().bottom - el.insp.getBoundingClientRect().bottom) / em + 1.6);
      const inPanel = (node) => { const [x, y] = mid(node, 0.6, 0.5); return [x, y - (scrollEm * em) / a.height]; };
      const target = (node) => (node ? mid(node, 0.5, node instanceof SVGElement ? 0.16 : 0.6) : [0.5, 0.5]);
      pts = { start: [0.58, 0.9], projects: target(pt.projects), site: target(pt.site), nm: target(pt.nm), select: inPanel(el.select), save: inPanel(el.save) };
      app.classList.remove('is-measuring');
    }
    measure();
    const sized = new ResizeObserver(() => { measure(); scene.wake(); });
    sized.observe(app);

    // Text is written only when it changes. A figure with its unit beside it ("370.3" "MiB") is two pieces.
    const shown = new Map();
    const text = (node, s) => {
      if (!node || shown.get(node) === s) return;
      shown.set(node, s);
      if (node.dataset.unit === undefined) { node.textContent = s; return; }
      const [v, u] = s.split(' ');
      node.children[0].textContent = v; node.children[1].textContent = u;
    };
    const all = (nodes, s) => { for (const n of nodes) text(n, s); };
    const along = (u, keys) => {
      if (u <= keys[0][0]) return keys[0][1];
      for (let i = 1; i < keys.length; i++) if (u <= keys[i][0]) { const k = io(span(u, keys[i - 1][0], keys[i][0])); return [lerp(keys[i - 1][1][0], keys[i][1][0], k), lerp(keys[i - 1][1][1], keys[i][1][1], k)]; }
      return keys[keys.length - 1][1];
    };
    const ring = (u, at) => { const k = span(u, at, at + 0.09); return k > 0 && k < 1 ? [lerp(0.35, 1, eo(k)), 1 - k] : [1, 0]; };
    const arrive = { scale: (k) => `scale(${lerp(0.7, 1, k).toFixed(4)})`, rise: (k) => `translateY(${((1 - k) * 0.9).toFixed(3)}em)`, grow: (k) => `scaleY(${Math.max(k, 0.001).toFixed(4)})`, fade: () => '' };

    function draw(p, { calm }) {
      let u = p * 4;
      const act = Math.min(3, Math.floor(u));
      if (calm) u = act + 1;                                   // each scene's finished state
      const s1 = clamp(u), s2 = clamp(u - 1), s3 = clamp(u - 2), s4 = clamp(u - 3);
      const move = (node, t) => { node.style.transform = calm ? '' : t; };

      // The steps beside the window.
      steps.forEach((s, i) => s.classList.toggle('is-on', i === act));
      railLine.style.transform = `scaleY(${clamp(p * 1.02).toFixed(4)})`;

      // 2 · How far in we are, used by the header as well as the levels.
      const z1 = io(span(s2, 0.3, 0.52)), z2 = io(span(s2, 0.7, 0.92));
      const where = WHERE[z2 > 0.5 ? 2 : z1 > 0.5 ? 1 : 0];

      // Which page is up, and its header.
      const toFo = span(s2, 0, 0.1), toPl = span(s4, 0.78, 0.9);
      layers.ov.style.opacity = 1 - toFo;
      layers.fo.style.opacity = toFo * (1 - toPl);
      layers.pl.style.opacity = toPl;
      const view = VIEWS[toPl > 0.5 ? 2 : toFo > 0.5 ? 1 : 0];
      if (shown.get(app) !== view) { shown.set(app, view); setNav(app, view); }
      const [title, sub] = heading(id, view);
      text(el.title, L.pathTitle && view === 'folders' ? `D:/…/${where.join('/')}` : title); text(el.sub, sub);
      all(el.crumbs, L.crumbs ? L.crumbs(where) : `D: / … / ${where.join(' / ')}`);

      // 1 · Scan: the counters run, the drive bar fills, the folders and the review rows arrive as they are counted.
      const e = Math.round(eo(span(s1, 0.04, 0.86)) * 60) / 60;   // the counters step 60 times, not once a frame
      for (const n of el.scan) n.style.opacity = 1 - span(s1, 0.88, 0.97);
      for (const n of el.notice) n.style.opacity = span(s1, 0.9, 1);
      for (const n of el.light) move(n, `translateX(${lerp(-100, 360, (s1 * 5) % 1).toFixed(1)}%)`);
      all(el.scanPath, PATHS[Math.min(PATHS.length - 1, Math.floor(e * PATHS.length))]);
      all(el.scanN, `${K.num(K.TOTALS.files * e)} files · ${K.num(K.TOTALS.folders * e)} folders`);
      all(el.meta, s1 < 0.9 ? 'Scanning…' : LAST_SCAN);
      for (const fill of el.fills) move(fill, `scaleX(${eo(span(s1, 0, 0.16)).toFixed(4)})`);
      all(el.m.alloc, K.fmt(K.TOTALS.allocated * e)); all(el.m.files, `${K.num(K.TOTALS.files * e)} files · 0 unknown`);
      all(el.m.logical, K.fmt(K.TOTALS.logical * e)); all(el.m.lower, K.fmt(K.TOTALS.lower * e)); all(el.m.od, K.fmt(K.TOTALS.onedrive * e));
      el.sp.forEach((t, i) => { const k = eo(span(s1, 0.16 + i * spStep, 0.36 + i * spStep)); t.style.opacity = k; move(t, arrive[t.dataset.sp || 'scale'](k)); });
      el.revs.forEach((r, i) => { const k = eo(span(s1, 0.58 + i * 0.07, 0.72 + i * 0.07)); r.style.opacity = k; move(r, `translateY(${((1 - k) * 0.9).toFixed(3)}em)`); });

      // 2 · Going in: into Projects, then into bookshop-site, each layout in its own way.
      const turn = [1 - span(z1, 0.1, 0.5), span(z1, 0.3, 0.7) * (1 - span(z2, 0.1, 0.5)), span(z2, 0.3, 0.7)];
      el.swap.forEach((nodes, i) => { for (const n of nodes) n.style.opacity = turn[i]; });
      if (L.mech === 'zoom' && rOpen) {
        // A folder's children grow out of its own tile.
        const zoom = (parent, child, r, k) => {
          move(parent, `translate(${(-r.x / r.w * 100 * k).toFixed(3)}%, ${(-r.y / r.h * 100 * k).toFixed(3)}%) scale(${(1 + (1 / r.w - 1) * k).toFixed(4)}, ${(1 + (1 / r.h - 1) * k).toFixed(4)})`);
          move(child, `translate(${(r.x * 100 * (1 - k)).toFixed(3)}%, ${(r.y * 100 * (1 - k)).toFixed(3)}%) scale(${lerp(r.w, 1, k).toFixed(4)}, ${lerp(r.h, 1, k).toFixed(4)})`);
        };
        const [l0, l1, l2] = levels.map((l) => l[0]);
        zoom(l0, l1, rOpen[0], z1);
        l0.style.opacity = 1 - span(z1, 0.2, 0.6);
        if (z2 > 0) zoom(l1, l2, rOpen[1], z2); else move(l2, 'scale(0)');
        l1.style.opacity = span(z1, 0.12, 0.5) * (1 - span(z2, 0.2, 0.6));
        l2.style.opacity = span(z2, 0.12, 0.5);
        if (el.rings[0]) el.rings[0].style.opacity = span(s2, 0.22, 0.28) * (1 - z1);
        if (el.rings[1]) el.rings[1].style.opacity = span(s2, 0.62, 0.68) * (1 - z2);
        if (el.rings[2]) el.rings[2].style.opacity = span(s3, 0.1, 0.16) * (1 - toPl);
      } else {
        // Columns slide in beside the one before; a dial, a list or a city gives way to the next.
        const on = L.mech === 'cascade' ? [1, z1, z2] : turn;
        levels.forEach((ls, i) => { for (const l of ls) { l.style.opacity = on[i]; if (L.mech === 'cascade' && i) move(l, `translateX(${((1 - on[i]) * -2.4).toFixed(3)}em)`); } });
        [z1, z2].forEach((z, n) => el.items[n + 1].forEach((it, j, list) => {
          const d = Math.min(0.06, 0.3 / list.length), k = eo(span(z, 0.36 + j * d, 0.62 + j * d));
          it.style.opacity = k; move(it, arrive[it.dataset.it](k));
        }));
      }
      // What was clicked stays marked, where a layout marks it.
      const picked = [span(s2, 0.265, 0.3), span(s2, 0.665, 0.7), span(s3, 0.13, 0.17)];
      el.sel.forEach((marks, i) => { for (const m of marks) m.style.opacity = picked[i]; });

      // 3 · Understand: the details panel slides in and its lines arrive from the top down.
      const inK = eo(span(s3, 0.18, 0.44)), outK = ease.in(span(s4, 0.68, 0.84)), up = inK * (1 - outK);
      el.scrim.style.opacity = up;
      if (calm) { el.insp.style.transform = 'none'; el.insp.style.opacity = up; }
      else { el.insp.style.opacity = ''; el.insp.style.transform = `translateX(${(103 * (1 - inK) + 103 * outK).toFixed(3)}%)`; }
      el.lines.forEach((l, i) => { const k = eo(span(s3, 0.34 + i * 0.034, 0.46 + i * 0.034)); l.style.opacity = k; move(l, `translateY(${((1 - k) * 0.8).toFixed(3)}em)`); });

      // 4 · Decide: down to "Record a decision", choose, save. A notice confirms nothing changed, and the plan has a row.
      el.inspIn.style.transform = `translateY(${(-scrollEm * io(span(s4, 0.02, 0.2))).toFixed(3)}em)`;
      const chose = span(s4, 0.38, 0.44);
      el.selA.style.opacity = 1 - chose; el.selB.style.opacity = chose;
      move(el.save, `scale(${(1 - 0.04 * (span(s4, 0.55, 0.58) - span(s4, 0.6, 0.64))).toFixed(4)})`);
      el.toast.style.opacity = eo(span(s4, 0.6, 0.68)) * (1 - span(s4, 0.93, 0.99));
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

    const scene = scrub(section, draw, { mode: 'pinned', layers: [...levels.flat(), el.insp, el.cursor] });
    return () => { scene.destroy(); sized.disconnect(); app.remove(); };
  }

  // The look that is on. A change of look redraws the window at once when it is on or near the screen, and in an
  // idle moment otherwise (the first layout of a redrawn window is the heavy part).
  let down = build(current()), wanted = current(), drawn = current();
  const catchUp = () => { if (drawn === wanted) return; down(); drawn = wanted; down = build(wanted); };
  const isNear = () => { const r = section.getBoundingClientRect(); return r.top < innerHeight * 1.5 && r.bottom > -innerHeight * 0.5; };
  onLook((id) => { wanted = id; if (isNear()) catchUp(); else whenIdle(catchUp); });
  new IntersectionObserver((entries) => { if (entries.some((e) => e.isIntersecting)) catchUp(); }, { rootMargin: '60% 0px' }).observe(section);
}
