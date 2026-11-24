// The Assistant, as a demo you operate: ask, and the window answers by changing what it shows. Replies are scripted
// (no model runs on a web page); their wording, pages and numbers are the app's own for the demo library. Another
// agent, "Hermes", asks first with a card, as every outside agent does.
import { animate, enter, exit } from './motion/live.mjs';
import { motion } from './motion/motion.mjs';
import * as K from './app-kit.mjs';

const MODEL = 'granite-4.2-3b';
const NOTE = `A guess by ${MODEL} on this PC (1.1 s): it picked this page, which StorageLens built. The numbers come from your scan.`;
const BUILT = (n) => `Put together by Assistant from ${n} live queries of your latest scan. The numbers come from StorageLens, not from the agent.`;
const QUESTIONS = {
  projects: 'What is taking up space in my Projects folder?',
  plan: 'Make me a plan to free up space without touching anything important',
  growth: "What's growing?",
};
const wait = (ms) => new Promise((r) => setTimeout(r, motion.calm ? Math.min(ms, 120) : ms));
const done = (a) => a.finished.then(() => a.cancel(), () => {});

export default function assistant(stage) {
  const slot = stage.querySelector('[data-ask-app]');
  slot.insertAdjacentHTML('beforeend', K.shell({ chat: true, agentButton: true }));
  slot.classList.add('is-live');
  const app = slot.querySelector('.app'), page = app.querySelector('[data-app-page]');
  const log = app.querySelector('[data-chat-log]'), form = app.querySelector('[data-chat-form]'), input = app.querySelector('[data-chat-input]');
  const title = app.querySelector('[data-app-title]'), sub = app.querySelector('[data-app-sub]');
  const chips = [...stage.querySelectorAll('[data-ask]')];
  const projects = K.TREE.kids[2];
  let busy = false, trail = [K.TREE];

  // ── The pages ──
  const notice = `<div class="acard anotice is-on">${K.icon('warn')}<span>Read-only metadata inventory. Categories, inferred owners and cleanup suggestions are heuristics, not proof.</span></div>`;
  const pages = {
    overview: () => ({
      view: 'overview', title: 'Overview', sub: 'Make room for what matters. See where space goes. Review before removing anything.',
      html: `${K.driveCard()}${notice}${K.overviewMetrics()}<div class="agrid agrid-1">${K.mapCard()}</div>`,
    }),
    projects: () => ({
      view: '', title: "What's using Projects", sub: BUILT(2),
      html: `${K.driveCard()}${K.banner('Assistant', 'Here is what is using Projects.')}
        ${K.metrics([['Projects on disk', K.fmt(projects.bytes), '1,332 files']], 'ametrics-1')}
        <div class="acard abars"><div class="acard-h"><div><b>Largest in Projects</b></div></div>
        ${projects.kids.map((k) => `<div class="abar"><span>${k.name}</span><u><i style="--w:${(k.bytes / projects.kids[0].bytes * 100).toFixed(1)}%"></i></u><b>${K.fmt(k.bytes)}</b></div>`).join('')}</div>`,
    }),
    plan: () => ({
      view: '', title: 'Freeing space on D:', sub: BUILT(7),
      html: `${K.driveCard()}${K.banner('Assistant', 'Here is a plan to free space on D:.')}
        ${K.metrics([['Free on D:', K.fmt(K.DRIVE.free), `of ${K.fmt(K.DRIVE.total)} · right now`], ['Used on D:', K.fmt(K.DRIVE.used), `of ${K.fmt(K.DRIVE.total)} · right now`]], 'ametrics-2')}
        <div class="acard aplan"><div class="aplan-h"><b>Worth a review on D:, largest first</b><span>A proposal: nothing changes until you confirm each step.</span></div>
        ${K.CANDIDATES.map((c) => `<div class="aplan-r"><span class="atag t-backup">Review</span><div><b>${c.name}</b><p>${c.why}</p></div><strong>${K.fmt(c.bytes)}</strong></div>`).join('')}</div>`,
    }),
    growth: () => ({
      view: 'growth', title: "What's growing", sub: 'Catch what’s accumulating. Folder snapshots reveal growth after your second comparable scan.',
      html: `${K.driveCard()}
        <div class="acard anote">${K.icon('info')}<div><b>What changed between scans</b><p>Folder disk-allocation changes, compared with the previous completed scan of the same roots. Parent and child rows overlap; do not add them together.</p></div></div>
        <div class="acard alist"><div class="alist-h"><span>Name / location</span><span>On disk</span><span>Change</span></div>
        ${K.GROWTH.map((g) => `<div class="alist-r"><div><b>${g.name}</b><code>${g.where}</code></div><strong>${K.fmt(g.bytes)}</strong><span class="up">+${K.fmt(g.growth)}</span></div>`).join('')}</div>`,
    }),
    videos: () => ({
      view: 'files', title: 'Largest files', sub: 'The files that add up. Largest measured allocations first. Dates and file sizes are clues, not verdicts.',
      html: `${K.driveCard()}${K.banner('Hermes', 'Here are the biggest video files.')}
        <div class="acard alist"><div class="alist-h"><span>Name / location</span><span>On disk</span><span>Importance</span></div>
        ${K.VIDEOS.map((v) => `<div class="alist-r"><div><b>${v.name}</b><code>D:/…/Alex/Videos/Book trailers</code></div><strong>${K.fmt(v.bytes)}</strong><span>${K.tag('backup')}</span></div>`).join('')}</div>`,
    }),
  };

  // ── Changing the page: the old one lifts away, the new one's cards rise in turn, bars grow from their left. ──
  let current = '';
  function show(key) {
    const p = pages[key]();
    current = key;
    const old = page.firstElementChild;
    if (old) { old.style.pointerEvents = 'none'; exit(old, { y: -10, scale: 1 }).finished.then(() => old.remove(), () => old.remove()); }
    const next = document.createElement('div');
    next.className = 'app-layer';
    next.innerHTML = p.html;
    page.append(next);
    K.setRail(app, p.view);
    for (const [node, s] of [[title, p.title], [sub, p.sub]]) {
      if (node.textContent === s) continue;
      node.textContent = s;
      done(animate(node, [{ opacity: 0, transform: 'translateY(6px)' }, { opacity: 1, transform: 'none' }], { preset: 'default' }));
    }
    [...next.children].forEach((c, i) => done(enter(c, { y: 16, scale: 1, delay: 110 + i * 65 })));
    next.querySelectorAll('.abar u i, [data-drive-fill]').forEach((b, i) => done(animate(b, [{ transform: 'scaleX(0)' }, { transform: 'none' }], { preset: 'default', delay: 260 + i * 70 })));
    if (key === 'overview') { trail = [K.TREE]; drawMap(next); }
  }

  // ── The overview's map goes inside a folder when you click its tile, and back out from its title. ──
  function drawMap(layer, from = null) {
    const card = layer.querySelector('.amapc'), map = card.querySelector('[data-map]');
    const node = trail[trail.length - 1];
    const W = map.clientWidth, H = map.clientHeight;
    card.querySelector('[data-map-title]').innerHTML = trail.length > 1
      ? `<button type="button" class="chat-pill" data-up aria-label="Back to ${K.esc(trail[trail.length - 2].name)}">← ${K.esc(trail[trail.length - 2].name)}</button> ${K.esc(node.name)}`
      : 'Where the space goes';
    card.querySelector('[data-map-sub]').textContent = trail.length > 1 ? `Inside ${trail.map((t) => t.name).join(' / ')} · measured disk allocation` : 'Immediate children · measured disk allocation';
    const fresh = document.createElement('div');
    fresh.className = 'amap-l';
    fresh.innerHTML = K.tiles(node, W, H, { as: 'button', hint: true });
    const old = map.querySelector('.amap-l');
    map.append(fresh);
    if (!old || !old.children.length) { old?.remove(); fresh.querySelectorAll('.tile').forEach((t, i) => done(animate(t, [{ opacity: 0, transform: 'scale(.8)' }, { opacity: 1, transform: 'none' }], { preset: 'paper', delay: 200 + i * 45 }))); return; }
    // `from`: the tile that was opened (going in) or that we come back out of. The two layers trade places through it.
    const r = from?.rect;
    if (!r) { done(animate(fresh, [{ opacity: 0 }, { opacity: 1 }], { preset: 'default' })); old.remove(); return; }
    const into = `translate(${-r.x / r.w * 100}%, ${-r.y / r.h * 100}%) scale(${1 / r.w}, ${1 / r.h})`, outOf = `translate(${r.x * 100}%, ${r.y * 100}%) scale(${r.w}, ${r.h})`;
    old.style.pointerEvents = 'none';
    if (from.dir > 0) {
      animate(old, [{ transform: 'none', opacity: 1 }, { transform: into, opacity: 0 }], { preset: 'default' }).finished.then(() => old.remove(), () => old.remove());
      done(animate(fresh, [{ transform: outOf, opacity: 0 }, { transform: 'none', opacity: 1 }], { preset: 'default' }));
    } else {
      animate(old, [{ transform: 'none', opacity: 1 }, { transform: outOf, opacity: 0 }], { preset: 'default' }).finished.then(() => old.remove(), () => old.remove());
      done(animate(fresh, [{ transform: into, opacity: 0 }, { transform: 'none', opacity: 1 }], { preset: 'default' }));
    }
  }
  page.addEventListener('click', (ev) => {
    const layer = page.lastElementChild;
    const go = ev.target.closest('[data-go]'), up = ev.target.closest('[data-up]');
    if (go && current === 'overview') {
      const map = layer.querySelector('[data-map]'), node = trail[trail.length - 1], i = +go.dataset.go;
      const rect = K.rectsOf(node, map.clientWidth, map.clientHeight)[i];
      trail.push(node.kids[i]);
      drawMap(layer, { rect, dir: 1 });
    } else if (up && current === 'overview') {
      const map = layer.querySelector('[data-map]'), child = trail.pop(), node = trail[trail.length - 1];
      const rect = K.rectsOf(node, map.clientWidth, map.clientHeight)[node.kids.indexOf(child)];
      drawMap(layer, { rect, dir: -1 });
    } else if (ev.target.closest('[data-back]')) {
      say({ act: 'You went back to your own view.' });
      show('overview');
    }
  });

  // ── The conversation ──
  const clock = () => { const d = new Date(); return `${String(d.getHours()).padStart(2, '0')}:${String(d.getMinutes()).padStart(2, '0')}`; };
  function put(html) {
    const d = document.createElement('div');
    d.innerHTML = html;
    const node = d.firstElementChild;
    log.append(node);
    while (log.children.length > 9) log.firstElementChild.remove();
    done(enter(node, { y: 14, scale: 1, preset: 'snappy' }));
    return node;
  }
  const me = (text) => put(`<div class="chat-me">${K.esc(text)}</div>`);
  function say({ text = '', note = '', act = '', back = false, extra = '' }) {
    return put(`<div class="chat-a">
      ${text ? `<div class="chat-a-h"><i>${K.icon('bot')}</i>Assistant <small>${clock()}</small></div><div>${text}</div>` : ''}
      ${note ? `<p class="chat-note">${note}</p>` : ''}${extra}
      ${act ? `<div class="chat-act">${K.icon('open')}<span>${act}</span>${back ? '<button type="button" class="chat-pill" data-chat-back>Back</button>' : ''}</div>` : ''}
    </div>`);
  }
  const offer = () => `<div class="chat-card-b">${Object.entries(QUESTIONS).map(([k, v]) => `<button type="button" class="chat-pill" data-chat-ask="${k}">${K.esc(v.length > 34 ? v.slice(0, 31) + '…' : v)}</button>`).join('')}</div>`;

  async function ask(key, text) {
    busy = true;
    chips.forEach((c) => c.classList.toggle('is-busy', c.dataset.ask === key));
    me(text);
    if (key === 'growth') {
      // One of the Assistant's fixed questions: answered from the scan, with no model.
      await wait(350);
      say({
        text: 'These grew the most since the previous scan. Growth needs two scans of the same place, so the list stays empty until then.',
        extra: `<div class="chat-card" style="border-color:var(--border);background:color-mix(in srgb, var(--surface) 70%, transparent)"><b>What grew</b>${K.GROWTH.slice(0, 4).map((g) => `<div class="chat-act"><span>${g.name}</span><b class="up" style="color:var(--red)">+${K.fmt(g.growth)}</b></div>`).join('')}
          <div class="chat-card-b"><button type="button" class="chat-pill" data-chat-view="growth">Open What's growing</button></div></div>`,
      });
    } else if (key) {
      const working = put(`<div class="chat-work">${K.icon('bot')}<span>${MODEL} is working on it…</span><i><u></u><u></u><u></u></i></div>`);
      await wait(1100);
      working.remove();
      const p = pages[key]();
      say({ text: key === 'projects' ? 'Here is what is using Projects.' : 'Here is a plan to free space on D:.', note: NOTE, act: `Assistant put together “${p.title}”`, back: true });
      show(key);
    } else {
      await wait(350);
      say({ text: 'This demo knows three questions. In the app, a model on your PC answers what you type, in your own words.', extra: offer() });
    }
    chips.forEach((c) => c.classList.remove('is-busy'));
    busy = false;
  }

  // Another agent: it may not move your screen until you say so.
  async function hermes() {
    if (busy) return;
    put(`<div class="chat-card" data-card>
      <div class="chat-card-h">${K.icon('bot')}Hermes wants to show you something</div>
      <div>“Here are the biggest video files.”</div>
      <div class="chat-card-b"><button type="button" class="chat-pill" data-card-yes>Show me</button><button type="button" class="chat-pill" data-card-no>Not now</button><button type="button" class="chat-pill" data-card-always>Always allow Hermes</button></div>
    </div>`);
  }

  log.addEventListener('click', (ev) => {
    const t = ev.target;
    const card = t.closest('[data-card]');
    if (t.closest('[data-chat-back]')) { say({ act: 'You went back to your own view.' }); show('overview'); }
    else if (t.closest('[data-chat-view]')) show(t.closest('[data-chat-view]').dataset.chatView);
    else if (t.closest('[data-chat-ask]')) { const k = t.closest('[data-chat-ask]').dataset.chatAsk; type(k); }
    else if (card && t.closest('[data-card-no]')) { card.remove(); say({ act: 'You answered Not now. Nothing moved.' }); }
    else if (card && (t.closest('[data-card-yes]') || t.closest('[data-card-always]'))) {
      const always = !!t.closest('[data-card-always]');
      card.remove();
      say({ act: 'Hermes showed “Largest files”', back: true, note: always ? 'Hermes is now an agent you trust. Remove it in Settings whenever you like.' : '' });
      show('videos');
    }
  });

  // A chip types its question into the box first, so you see the same thing you would do yourself.
  async function type(key) {
    if (busy) return;
    busy = true;
    const text = QUESTIONS[key];
    if (motion.calm) input.value = text;
    else for (let i = 1; i <= text.length; i++) { input.value = text.slice(0, i); await new Promise((r) => setTimeout(r, 13)); }
    await wait(160);
    input.value = '';
    ask(key, text);
  }
  for (const c of chips) c.addEventListener('click', () => (c.dataset.ask === 'hermes' ? hermes() : type(c.dataset.ask)));
  form.addEventListener('submit', (ev) => {
    ev.preventDefault();
    const text = input.value.trim();
    if (!text || busy) return;
    input.value = '';
    const q = text.toLowerCase();
    const key = /grow|grew|bigger|accumulat|changed/.test(q) ? 'growth' : /plan|free|room|clean|delete|remove/.test(q) ? 'plan' : /project|folder|taking|using|space/.test(q) ? 'projects' : '';
    ask(key, text);
  });

  show('overview');
  say({ text: 'Ask about this demo library, or pick a question above.' });
}
