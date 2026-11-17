import { css, vary, shift, stroke, dab, rng } from '../../paint/brush.js';
import { combLayout, ruffLayout } from './display.js';

// The paint of a grouse's display (the grouse's, 2026-11-16; life/parts/display.js builds the parts), laid after
// everything else of the sheet and with random numbers of its own, so that nothing else is painted otherwise for it.
// Only for a sheet that asks (life/plumage.js calls it).
//   plumage.comb   the comb's bare skin, laid into the skin's own cell where the comb lies: a crescent over the eye,
//                  warty, a little darker at its rim. So the comb's own vertices take it, and further off, where the
//                  bird has no comb of its own, the skin shows it.
//   plumage.ruff   the ruff's feathers, likewise where the ruff lies on the side of the neck: broad and square-ended,
//                  their ends glossed blue-black (Ridgway's "slight bluish purplish sheen"; how it is laid is the agent's)
//   plumage.tail.band   [[from, to, colour], ...]: bands right across every tail feather, from `from` to `to` of its
//                  length from the root, on the upper side and, more faintly, the under: a grouse's terminal and
//                  subterminal bands, and the ruffed grouse's paired bars, which the tail's own `bars` (evenly
//                  spaced, all alike) and `tip` (the inner web only) cannot lay.
export function paintDisplay({ ctx, cell, cells, body, sheet, look, edge: SKIN_EDGE }) {
  const r = rng((sheet.seed ?? 31) * 7 + 421), P = sheet.plumage, shape = sheet.shape, ragged = look.paint.ragged, wobble = look.paint.vary;
  if (P.comb || P.ruff) cell(cells.skin, (w, h) => {
    const span = body.front - body.rear, edge = SKIN_EDGE * h, lap = h - 2 * edge, along = w / span;
    const px = (x) => ((body.front - x) / span) * w;
    const rows = (a) => [edge + (1 - a / 2) * lap, edge + (a / 2) * lap];
    const round = (x) => { const deep = (body.top(x) - body.bottom(x)) / 2, wide = body.half(x); return lap / (2 * Math.PI * Math.sqrt((deep * deep + wide * wide) / 2)); };

    // ---- the comb: its footprint filled, then warts, lighter and darker, inside a rim of the darker skin
    if (shape.comb && P.comb) {
      const L = combLayout(shape), N = 24;
      for (const side of [0, 1]) {
        const lower = [], upper = [];
        for (let k = 0; k <= N; k += 1) {
          const u = k / N, x = L.from + L.long * u, y0 = L.low(x), y1 = y0 + L.across(u);
          lower.push([px(x), rows(body.around(x, y0))[side]]); upper.push([px(x), rows(body.around(x, y1))[side]]);
        }
        const outline = () => { ctx.beginPath(); lower.forEach(([x, y], i) => (i ? ctx.lineTo(x, y) : ctx.moveTo(x, y))); for (const [x, y] of upper.slice().reverse()) ctx.lineTo(x, y); ctx.closePath(); };
        ctx.save();
        outline(); ctx.fillStyle = css(shift(P.comb, 0, -6, -9)); ctx.fill();
        outline(); ctx.clip();
        for (let k = 0; k <= N; k += 1) {
          const u = k / N, [x0, y0] = lower[k], [, y1] = upper[k], m = (y0 + y1) / 2, half = Math.abs(y1 - y0) / 2;
          if (half > 0.5) { ctx.fillStyle = css(P.comb); ctx.fillRect(x0 - (along * L.long) / N, m - half * 0.72, ((along * L.long) / N) * 2.2, half * 1.44); }
          if (u > 0.04 && u < 0.96) for (let d = 0; d < 3; d += 1) dab(ctx, x0 + (r() - 0.5) * along * 1.4, m + (r() - 0.5) * half * 1.4, 0.4 + r() * 0.9 * Math.max(1, half * 0.25), r() < 0.5 ? shift(P.comb, 4, 4, 9) : shift(P.comb, -3, 0, -8), 0.7);
        }
        ctx.restore();
      }
    }

    // ---- the ruff: each blade's feathers where it lies, back along the side of the neck, its end glossed
    if (shape.ruff && P.ruff) {
      const L = ruffLayout(shape, 0), mid = (L.a0 + L.a1) / 2, gloss = [232, Math.min(100, P.ruff[1] + 10), Math.min(100, P.ruff[2] + 6)];
      for (const side of [0, 1]) {
        // from the uppermost blade down, so that each lower one lies over the one above it, as a ruff's are seen
        for (let k = L.blades - 1; k >= 0; k -= 1) {
          const ak = L.a0 + ((L.a1 - L.a0) * (k + 0.5)) / L.blades, fan = (ak - mid) * L.fan;
          const x0 = L.at, x1 = L.at - L.long * 0.92, a1 = Math.min(0.98, Math.max(0.02, ak + fan));
          const X0 = px(x0), Y0 = rows(ak)[side], X1 = px(x1), Y1 = rows(a1)[side], wide = L.wide * round((x0 + x1) / 2);
          // the whole feather, then its glossed end; several strokes each, so it is no flat ribbon
          for (let s = 0; s < 3; s += 1) stroke(ctx, r, X0, Y0 + (r() - 0.5) * wide * 0.2, X1, Y1 + (r() - 0.5) * wide * 0.2, wide * (0.75 - 0.15 * s), vary(P.ruff, r, wobble * 0.5), { ragged, taperIn: 0.4, taperOut: 0.06 });
          const e0 = 0.66 + 0.06 * r();
          stroke(ctx, r, X0 + (X1 - X0) * e0, Y0 + (Y1 - Y0) * e0, X1, Y1, wide * 0.7, vary(gloss, r, wobble * 0.4), { ragged, taperIn: 0.25, taperOut: 0.05, alpha: 0.7 });
          for (let s = 0; s < 4; s += 1) { const f = (r() - 0.5) * 0.5; stroke(ctx, r, X0, Y0 + f * wide, X1, Y1 + f * wide * 1.2, wide * 0.05, shift(P.ruff, 0, 0, 6 + r() * 6), { ragged, taperIn: 0.3, taperOut: 0.2, alpha: 0.6 }); }
        }
      }
    }
  });

  // ---- the tail's bands: across all six strips of each side of the tail's cells (life/plumage.js lays the six
  // feathers side by side, roots at the top, from 0.02 of the cell above it to 0.985 down it), only where a feather is
  if (P.tail.band) {
    for (const [name, under] of [['tailUp', false], ['tailUnder', true]]) {
      cell(cells[name], (w, h) => {
        ctx.globalCompositeOperation = 'source-atop';
        const y = (t) => h * (-0.02 + 1.005 * t);
        for (let k = 0; k < 6; k += 1) {
          const x = (k + 0.5) * (w / 6), wide = (w / 6) * 0.86;
          for (const [from, to, colour] of P.tail.band) {
            const y0 = y(from), y1 = y(to), mid = (y0 + y1) / 2, wave = (r() - 0.5) * (y1 - y0) * 0.5;
            stroke(ctx, r, x - wide * 0.56, mid - wave, x + wide * 0.56, mid + wave, Math.max(1.5, y1 - y0), vary(colour, r, wobble * 0.3), { ragged: ragged * 1.4, taperIn: 0.08, taperOut: 0.08, lumpy: 0.25, alpha: under ? 0.6 : 1 });
          }
        }
        ctx.globalCompositeOperation = 'source-over';
      });
    }
  }
}
