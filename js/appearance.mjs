// Appearance: the look that is on, in words (its line, its text and its four ideas) with its own download button.
// When the look changes, the words arrive in turn.
import { enter } from './motion/live.mjs';
import { once } from './core.mjs';
import { ids, look, current, onLook } from './looks.mjs';

export default function appearance(el) {
  const q = (s) => el.querySelector(s);
  const n = q('[data-look-n]'), name = q('[data-look-name]'), line = q('[data-look-line]'), text = q('[data-look-text]'), points = q('[data-look-points]');
  function fill(id) {
    const l = look(id);
    n.textContent = `App ${ids.indexOf(id) + 1} of ${ids.length}`; name.textContent = l.name; line.textContent = l.line; text.textContent = l.text;
    points.innerHTML = l.points.map((p, i) => `<li data-n="0${i + 1}"><b>${p[0]}</b><p>${p[1]}</p></li>`).join('');
  }
  fill(current());
  onLook((id) => {
    fill(id);
    [n, name, line, text, ...points.children].forEach((node, i) => once(enter(node, { y: 18, scale: 1, delay: 60 + i * 45 })));
  });
}
