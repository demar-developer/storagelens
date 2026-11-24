// Springs as pure functions of time: the one motion vocabulary shared by web pages (Live mode) and the films the
// motion-studio skill renders (Reel mode), so a film and the page it plays on move alike.
//
// A spring is a damped harmonic oscillator released from rest toward a new target. Its unit step response goes
// 0 → 1, worked out in closed form from the time since release, never integrated frame by frame. So any frame can
// be computed in any order (a film renders frame 812 without playing 0–811), two renders are identical, and the site
// can hand a spring to the compositor as a CSS easing (easing()) instead of running a frame loop.
//
// A preset is { response, damping }: response is the period in seconds the spring would ring at without damping,
// damping is the ratio ζ (1 = critical: no overshoot; below 1 overshoots by exp(-πζ/√(1-ζ²))).
// No DOM here: it runs in the browser, in films and under node --test.

export const PRESETS = Object.freeze({
  snappy: Object.freeze({ response: 0.22, damping: 0.80 }),   // buttons, toggles, indicators, leading edges (≈1.5 % overshoot)
  default: Object.freeze({ response: 0.40, damping: 0.86 }),  // cards, panels, containers, the camera (≈0.5 %)
  heavy: Object.freeze({ response: 0.50, damping: 1.00 }),    // display type, titles, logo lockups (none)
  paper: Object.freeze({ response: 0.62, damping: 0.72 }),    // pop-up cards and paper settling: a soft float (≈3.8 %)
  page: Object.freeze({ response: 0.80, damping: 1.00 }),     // page turns, a cover opening, big slow moves (none)
  playful: Object.freeze({ response: 0.50, damping: 0.45 }),  // the sparrow and other characters only, never UI or type (≈20 %)
});

/** A preset name, a { response, damping } object, or nothing (the default preset). */
export function preset(p) {
  if (p == null) return PRESETS.default;
  if (typeof p === 'string') {
    const r = PRESETS[p];
    if (!r) throw new Error(`spring: unknown preset "${p}" (have ${Object.keys(PRESETS).join(', ')})`);
    return r;
  }
  if (!(p.response > 0) || !(p.damping > 0)) throw new Error('spring: a preset needs response > 0 and damping > 0');
  return p;
}

/** Unit step response of a spring released `tau` seconds ago: 0 before release, settling at 1. */
export function step(tau, p) {
  if (!(tau > 0)) return 0;
  const { response, damping: z } = preset(p);
  const w = (2 * Math.PI) / response;
  if (z < 1) {
    const a = z * w, wd = w * Math.sqrt(1 - z * z);
    return 1 - Math.exp(-a * tau) * (Math.cos(wd * tau) + (a / wd) * Math.sin(wd * tau));
  }
  if (z === 1) return 1 - Math.exp(-w * tau) * (1 + w * tau);
  const s = w * Math.sqrt(z * z - 1), r1 = -z * w + s, r2 = -z * w - s;   // overdamped: two real decays
  return 1 + (r2 * Math.exp(r1 * tau) - r1 * Math.exp(r2 * tau)) / (r1 - r2);
}

/** Rate of change of step() in units per second: how fast the value is moving `tau` seconds after release. */
export function slope(tau, p) {
  if (!(tau > 0)) return 0;
  const { response, damping: z } = preset(p);
  const w = (2 * Math.PI) / response;
  if (z < 1) {
    const a = z * w, wd = w * Math.sqrt(1 - z * z);
    return Math.exp(-a * tau) * Math.sin(wd * tau) * (w * w) / wd;
  }
  if (z === 1) return w * w * tau * Math.exp(-w * tau);
  const s = w * Math.sqrt(z * z - 1), r1 = -z * w + s, r2 = -z * w - s;
  return (r1 * r2 * (Math.exp(r1 * tau) - Math.exp(r2 * tau))) / (r1 - r2);
}

const settleCache = new Map();
/** Seconds after release from which the response stays within `eps` of 1 for good. */
export function settle(p, eps = 0.01) {
  const q = preset(p), key = `${q.response}|${q.damping}|${eps}`;
  let s = settleCache.get(key);
  if (s !== undefined) return s;
  // scan at 0.5 ms; the envelope of an underdamped spring bounds the search, a long ceiling covers the rest
  const z = q.damping, w = (2 * Math.PI) / q.response;
  const ceiling = z < 1 ? Math.log(1 / (Math.sqrt(1 - z * z) * eps)) / (z * w) + q.response : 40 * q.response;
  s = 0;
  for (let tau = 0; tau <= ceiling; tau += 0.0005) if (Math.abs(1 - step(tau, q)) >= eps) s = tau;
  settleCache.set(key, s);
  return s;
}

/** One spring from `from` to `to`, released at time `t0` (seconds). */
export function spring(t, t0, from, to, p) {
  return from + (to - from) * step(t - t0, p);
}

/**
 * A value that moves through several targets. keys = [[t, value, preset?], ...] sorted by t; the first key is the
 * starting value (its time is ignored). Each change is its own spring released at its own time and the springs add
 * up, so a new target mid-move keeps the momentum of the moves still settling: nothing ever restarts or jumps.
 * Values may be numbers or arrays of numbers (x/y pairs, colours) of one length.
 */
export function follow(t, keys, p) {
  const first = keys[0][1];
  if (Array.isArray(first)) {
    const out = first.slice();
    for (let i = 1; i < keys.length && t > keys[i][0]; i++) {
      const k = step(t - keys[i][0], keys[i][2] || p), prev = keys[i - 1][1], next = keys[i][1];
      for (let j = 0; j < out.length; j++) out[j] += (next[j] - prev[j]) * k;
    }
    return out;
  }
  let v = first;
  for (let i = 1; i < keys.length && t > keys[i][0]; i++) v += (keys[i][1] - keys[i - 1][1]) * step(t - keys[i][0], keys[i][2] || p);
  return v;
}

/**
 * A bar between two edges (an underline, a tab marker, a selection) moving through stops = [[t, start, end], ...].
 * On each move the edge in front rides the stiffer `lead` spring and the edge behind the softer `trail` one, so the
 * bar stretches as it travels and settles back. A pure resize moves both edges on `lead`.
 * Returns { start, end, size, mid }.
 */
export function bar(t, stops, { lead = 'snappy', trail = 'default' } = {}) {
  let start = stops[0][1], end = stops[0][2];
  for (let i = 1; i < stops.length && t > stops[i][0]; i++) {
    const [ti, s1, e1] = stops[i], s0 = stops[i - 1][1], e0 = stops[i - 1][2];
    const travel = (s1 - s0) + (e1 - e0);   // sign of the centre's movement
    start += (s1 - s0) * step(t - ti, travel < 0 || travel === 0 ? lead : trail);
    end += (e1 - e0) * step(t - ti, travel > 0 || travel === 0 ? lead : trail);
  }
  return { start, end, size: end - start, mid: (start + end) / 2 };
}

/**
 * Opacity for content inside a container that changes shape: it arrives `delay` after the change at `tIn` and is
 * fully gone by `tOut`, when the next change starts, so words are never seen while their box is still moving.
 */
export function inside(t, tIn, tOut = Infinity, { preset: p = 'snappy', delay = 0.06, lead } = {}) {
  const early = lead ?? settle(p, 0.005);
  return clamp(step(t - (tIn + delay), p) - step(t - (tOut - early), p), 0, 1);
}

/** Time inside a loop of `dur` seconds; the last frame of a looping render (within half a frame) is frame 0. */
export function loop(t, dur, fps) {
  let u = t % dur;
  if (u < 0) u += dur;
  if (dur - u <= (fps ? 0.5 / fps : 1e-9)) u = 0;
  return u;
}

/**
 * A spring as a CSS easing: { easing: 'linear(…)', duration } in milliseconds, for element.animate() or a CSS
 * transition. The compositor then runs the whole move with no script per frame. Use it for enters and exits; a value
 * that must change target mid-move (a drag, a follow) needs Spring below instead, because CSS restarts.
 */
export function easing(p, { samples = 40, eps = 0.002 } = {}) {
  const q = preset(p), dur = Math.max(settle(q, eps), 0.05);
  const stops = [];
  for (let i = 0; i <= samples; i++) stops.push(i === samples ? '1' : String(+step((dur * i) / samples, q).toFixed(4)));
  return { easing: `linear(${stops.join(', ')})`, duration: Math.round(dur * 1000) };
}

/**
 * A live spring for the site: retarget it whenever the input changes and read it each frame. Same superposition as
 * follow(), with moves that have settled folded away so it stays cheap however long the page is open.
 * Times are in seconds (performance.now() / 1000).
 */
export class Spring {
  constructor(value = 0, p = 'default') { this.base = value; this.goal = value; this.p = preset(p); this.moves = []; }
  /** Head for `target` from now on; any move still underway keeps its momentum. */
  to(target, now, p = this.p) {
    if (target !== this.goal) { this.moves.push({ t: now, d: target - this.goal, p: preset(p) }); this.goal = target; }
    return this;
  }
  /** Jump to `value` with no motion. */
  set(value) { this.base = this.goal = value; this.moves.length = 0; return this; }
  value(now) { let v = this.base; for (const m of this.moves) v += m.d * step(now - m.t, m.p); return v; }
  speed(now) { let s = 0; for (const m of this.moves) s += m.d * slope(now - m.t, m.p); return s; }
  /** True once every move has settled (within 0.1 % of its own distance); settled moves are folded into the base. */
  settled(now) {
    this.moves = this.moves.filter((m) => {
      if (now - m.t < settle(m.p, 0.001)) return true;
      this.base += m.d;
      return false;
    });
    return this.moves.length === 0;
  }
  get target() { return this.goal; }
}

/** Seeded random numbers in [0, 1) (mulberry32). Never Math.random in anything that renders. */
export function rng(seed) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let x = Math.imul(a ^ (a >>> 15), a | 1);
    x ^= x + Math.imul(x ^ (x >>> 7), x | 61);
    return ((x ^ (x >>> 14)) >>> 0) / 4294967296;
  };
}

/** Smooth seeded 1D noise in [-1, 1]: drift, breathing, a hand-held camera. noise(seed)(x), one unit ≈ one wobble. */
export function noise(seed) {
  const r = rng(seed), table = Float64Array.from({ length: 256 }, () => r() * 2 - 1);
  return (x) => {
    const i = Math.floor(x), f = x - i, u = f * f * (3 - 2 * f);
    return lerp(table[i & 255], table[(i + 1) & 255], u);
  };
}

export const clamp = (x, lo = 0, hi = 1) => Math.min(hi, Math.max(lo, x));
export const lerp = (a, b, k) => a + (b - a) * k;
/** Where x sits between a and b, clamped to 0..1. */
export const span = (x, a, b) => clamp((x - a) / (b - a));

/** Curves for linear progress only (typing, scrolls, slow pushes); anything that enters, exits or retargets is a spring. */
export const ease = Object.freeze({
  in: (x) => x * x * x,
  out: (x) => 1 - (1 - x) ** 3,
  inOut: (x) => (x < 0.5 ? 4 * x * x * x : 1 - (-2 * x + 2) ** 3 / 2),
  expoIn: (x) => (x <= 0 ? 0 : 2 ** (10 * x - 10)),
  expoOut: (x) => (x >= 1 ? 1 : 1 - 2 ** (-10 * x)),
});
