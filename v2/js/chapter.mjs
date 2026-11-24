// The chosen look, explained: its line, its four ideas, and two more of its screens. When the look changes
// the words leave and arrive in turn, and the pictures cross-fade. The two pictures drift at different speeds as the
// section scrolls past.
import { animate, enter, scrub } from '../../js/motion/live.mjs';
import { lerp } from '../../js/motion/spring.mjs';
import { once } from '../../js/core.mjs';
import { ids, look, current, onLook, picture } from '../../js/looks.mjs';

// The first picture is the layout's most telling screen; the second is a page the Assistant put together in it.
const FIRST = {
  strata: ['folders', 'Three levels deep: Demo Studio, Projects, Lantern Reef'],
  atlas: ['growth', 'The Growth lens: what changed since the previous scan'],
};
const fallback = ['inspect', 'Largest files, with the details of one file'];

export default function chapter(el) {
  const q = (s) => el.querySelector(s);
  const n = q('[data-ch-n]'), name = q('[data-ch-name]'), line = q('[data-ch-line]'), text = q('[data-ch-text]'), points = q('[data-ch-points]');
  const a = q('[data-ch-a]'), b = q('[data-ch-b]'), capA = q('[data-ch-cap-a]');
  const shots = [q('.shot-a'), q('.shot-b')];

  function fill(id) {
    const l = look(id), [view, cap] = FIRST[id] || fallback;
    n.textContent = `App ${ids.indexOf(id) + 1} of ${ids.length}`; name.textContent = l.name; line.textContent = l.line; text.textContent = l.text;
    points.innerHTML = l.points.map((p, i) => `<li data-n="0${i + 1}"><b>${p[0]}</b><p>${p[1]}</p></li>`).join('');
    capA.textContent = cap;
    for (const [img, src, alt] of [[a, picture(id, view), `${l.name}: ${cap}.`], [b, picture(id, 'assistant'), `${l.name}: a page the Assistant put together, and its way of saying who is driving.`]]) {
      if (img.getAttribute('src') === src) continue;
      img.style.opacity = '0';
      img.onload = () => { once(animate(img, [{ opacity: 0 }, { opacity: 1 }], { preset: 'default' })); img.style.opacity = ''; };
      img.src = src; img.alt = alt;
    }
  }
  fill(current());
  onLook((id) => {
    fill(id);
    [n, name, line, text, ...points.children].forEach((node, i) => once(enter(node, { y: 18, scale: 1, delay: 60 + i * 45 })));
  });

  scrub(el, (p, { calm }) => {
    shots[0].style.transform = calm ? '' : `translate3d(0, ${lerp(46, -46, p).toFixed(1)}px, 0)`;
    shots[1].style.transform = calm ? '' : `translate3d(0, ${lerp(110, -90, p).toFixed(1)}px, 0)`;
  }, { layers: shots });
}
