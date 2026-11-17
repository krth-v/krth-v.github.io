import { css, shift, mix, stroke, rng } from '../../paint/brush.js';
import { SHEET } from '../beast.js';
import { BUSH, BITS } from './rodent.js';

// The paint of a small mammal's own parts (rodents, 2026-11-16), laid by life/coat.js into the animal's one sheet
// before its hair is: the brush of a bushy tail (`coat.bush`: { top, band, fringe, under }, each [hue, saturation,
// lightness]: like the back on top, a dark band either side, the hairs' pale tips along its edges, and its underside)
// and the small bits (`coat.bits`: { teeth, whiskers, cone, flake }). Where each is on the body is life/parts/rodent.js.
//   coat.fur      how many times longer than the elk's the body's hair strokes are laid (life/coat.js lays them so
//                 many texels long whatever the animal's size: on a squirrel the elk's are a millimetre or two of fur,
//                 where a squirrel's is a centimetre or more). The elk's is 1, and it gives none.

const [W, H] = SHEET;
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const box = (cell) => [Math.floor(cell[0] * W), Math.floor(cell[1] * H), Math.ceil(cell[2] * W), Math.ceil(cell[3] * H)];

export function paintRodent(ctx, sheet, look) {
  const C = sheet.coat, r = rng((sheet.seed ?? 211) + 29), ragged = look.paint.ragged;
  if (C.bush) {
    // ---- the brush, along the tail (u, from its root) and round it (v: 0.5 its back, 0.25 and 0.75 its edges, 0
    // and 1 its belly side)
    const B = C.bush, [x0, y0, x1, y1] = box(BUSH), w = x1 - x0, h = y1 - y0;
    const colour = (u, v) => {
      const off = Math.abs(v - 0.5) * 4;                  // 0 on its back, 1 at its edges, 2 underneath
      let c = B.top;
      c = mix(c, B.band, smooth(0.5, 0.68, off) * smooth(0.04, 0.16, u));
      c = mix(c, B.fringe, smooth(0.8, 0.96, off) * (1 - smooth(1.15, 1.35, off)) * smooth(0.05, 0.2, u));
      c = mix(c, B.under, smooth(1.2, 1.45, off));
      // the end, past the bone's tip, is band and tips all round
      c = mix(c, mix(B.band, B.fringe, smooth(0.94, 0.99, u)), smooth(0.78, 0.9, u) * 0.85);
      return c;
    };
    const STEP = 4;
    ctx.save(); ctx.beginPath(); ctx.rect(x0 - 6, y0 - 6, w + 12, h + 12); ctx.clip();
    for (let y = y0 - 6; y < y1 + 6; y += STEP) for (let x = x0 - 6; x < x1 + 6; x += STEP) {
      const u = Math.min(1, Math.max(0, (x + STEP / 2 - x0) / w)), v = Math.min(1, Math.max(0, (y + STEP / 2 - y0) / h));
      ctx.fillStyle = css(colour(u, v)); ctx.fillRect(x, y, STEP, STEP);
    }
    // long hairs, lying out along the tail and a little to its edges, each the colour of where it ends
    for (let i = 0; i < 2600; i += 1) {
      const u = r(), v = r(), x = x0 + u * w, y = y0 + v * h, len = 14 + r() * 26, out = (v < 0.5 ? -1 : 1) * (0.12 + 0.2 * r());
      const c = shift(colour(Math.min(1, u + len / w), v + out * len / h * 0.6), (r() - 0.5) * 6, (r() - 0.5) * 8, (r() - 0.5) * 10);
      stroke(ctx, r, x, y, x + len, y + out * len * 0.6, 1.8, c, { ragged, taperIn: 0.1, taperOut: 0.75, bend: (r() - 0.5) * 0.3, alpha: 0.85 });
    }
    ctx.restore();
  }
  if (C.bits) {
    const K = C.bits, [x0, y0, x1, y1] = box(BITS), w = (x1 - x0) / 4, h = y1 - y0;
    // (each of the four within its own width, with a margin only at the outer edges: painted 4 px over its neighbour,
    // the teeth's tips took the whiskers' colour)
    const cell = (k) => { if (k) ctx.restore(); ctx.save(); ctx.beginPath(); ctx.rect(x0 + k * w - (k === 0 ? 4 : 0), y0 - 4, w + (k === 0 ? 4 : 0) + (k === 3 ? 4 : 0), h + 8); ctx.clip(); return [x0 + k * w, y0, w, h]; };
    // the incisors: orange enamel, paler at their edges
    { const [x, y, cw, ch] = cell(0); ctx.fillStyle = css(K.teeth); ctx.fillRect(x - 4, y - 4, cw + 8, ch + 8); ctx.fillStyle = css(shift(K.teeth, 0, -30, 22)); ctx.fillRect(x - 4, y + ch * 0.75, cw + 8, ch * 0.25 + 4); }
    // the whiskers: dark, paling to their tips
    { const [x, y, cw, ch] = cell(1); for (let k = 0; k < 8; k += 1) { ctx.fillStyle = css(mix(K.whiskers, shift(K.whiskers, 0, -5, 35), k / 8)); ctx.fillRect(x - 4 + (k * (cw + 8)) / 8, y - 4, (cw + 8) / 8 + 1, ch + 8); } }
    // the cone: its scales in rows, each a lip of lighter brown over a dark gap
    { const [x, y, cw, ch] = cell(2); ctx.fillStyle = css(shift(K.cone, 0, -6, -10)); ctx.fillRect(x - 4, y - 4, cw + 8, ch + 8);
      for (let row = 0; row < 14; row += 1) for (let k = 0; k < 6; k += 1) {
        const cx = x + ((k + (row % 2) * 0.5) / 6) * cw, cy = y + (row / 13) * ch;
        ctx.fillStyle = css(shift(K.cone, (r() - 0.5) * 6, 0, (r() - 0.5) * 8)); ctx.beginPath(); ctx.ellipse(cx, cy, cw / 13, ch / 30, 0, 0, Math.PI * 2); ctx.fill();
        ctx.fillStyle = css(shift(K.cone, 0, 6, 12), 0.8); ctx.beginPath(); ctx.ellipse(cx, cy + ch / 70, cw / 16, ch / 80, 0, 0, Math.PI * 2); ctx.fill();
      } }
    // a scale torn from it: brown, with a darker base
    { const [x, y, cw, ch] = cell(3); ctx.fillStyle = css(K.flake); ctx.fillRect(x - 4, y - 4, cw + 8, ch + 8); ctx.fillStyle = css(shift(K.flake, 0, 0, -12)); ctx.fillRect(x - 4, y + ch * 0.7, cw + 8, ch * 0.3 + 4); }
    ctx.restore();
  }
}
