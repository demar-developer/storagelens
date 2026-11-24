// The first landing page: its interactive pieces. Everything the two pages share is in core.mjs.
import { boot } from './core.mjs';

boot({
  hero: () => import('./hero.mjs'),
  lens: () => import('./lens.mjs'),
  story: () => import('./story.mjs'),
  assistant: () => import('./assistant.mjs'),
  privacy: () => import('./flows.mjs').then((m) => ({ default: m.privacy })),
  pro: () => import('./flows.mjs').then((m) => ({ default: m.pro })),
  signals: () => import('./signals.mjs'),
  nevers: () => import('./flows.mjs').then((m) => ({ default: m.nevers })),
  gallery: () => import('./gallery.mjs'),
});
