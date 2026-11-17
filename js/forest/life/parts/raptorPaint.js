import { css, vary, shift, stroke, rng } from '../../paint/brush.js';
import { CERE_U, TALON_CELL } from './raptor.js';

// A raptor's paint over what life/plumage.js has laid (the raptors', 2026-11-16): the cere over the base of the bill's
// cell, with a nostril on each side of it, and the talons' own cell. Called by life/plumage.js only for a sheet with a
// cere (`plumage.bill.cere`) or talons (`shape.leg.talons`), after the bill's cell is painted, with random numbers of
// its own: so nothing else on the sheet, of this bird or any other, is painted differently.
//   `cell(rect, paint)` is life/plumage.js's: paint(w, h) inside the rect, clipped, the rect's corner at the origin.
//   `billCell` is CELLS.bill; `look` the forest's look (its paint: `ragged`, `vary`).
export function paintRaptor({ ctx, cell, sheet, billCell, look }) {
  const P = sheet.plumage, r = rng(((sheet.seed ?? 31) * 7919 + 2111) >>> 0), ragged = look.paint.ragged, wobble = look.paint.vary;
  if (P.bill.cere) {
    // The upper mandible is the cell's upper half: its base at the left, its left cutting edge along the top, its
    // ridge a quarter of the way down and its right cutting edge at the middle. The cere is the first CERE_U of it
    // across, with the nostril low on each side near the cere's front edge, and a fold of darker skin along that edge.
    const cere = P.bill.cere;
    cell(billCell, (w, h) => {
      const wide = (0.04 + 0.92 * CERE_U) * w;
      ctx.fillStyle = css(cere); ctx.fillRect(-2, -2, wide + 2, h * 0.5 + 2);
      for (let i = 0; i < 6; i += 1) stroke(ctx, r, -w * 0.03, h * (0.05 + 0.075 * i), wide * 0.98, h * (0.06 + 0.075 * i), h * 0.07, vary(cere, r, wobble * 0.5), { ragged, taperIn: 0.05, taperOut: 0.2 });
      stroke(ctx, r, wide * 0.97, h * 0.02, wide * 0.99, h * 0.48, w * 0.025, shift(cere, 0, -10, -16), { ragged: 0.05, taperIn: 0.1, taperOut: 0.1, alpha: 0.8 });
      ctx.fillStyle = css(shift(cere, 10, -25, -42));
      for (const v of [0.13, 0.37]) { ctx.beginPath(); ctx.ellipse(wide * 0.74, h * v, w * 0.04, h * 0.032, 0, 0, Math.PI * 2); ctx.fill(); }
    });
  }
  if (sheet.shape.leg.talons) {
    // horn at the root, darker to the point (the talon's rows run down the cell)
    const claw = P.claw || [30, 10, 9];
    cell(TALON_CELL, (w, h) => {
      ctx.fillStyle = css(claw); ctx.fillRect(-2, -2, w + 4, h + 4);
      ctx.fillStyle = css(shift(claw, 0, 0, 6)); ctx.fillRect(-2, -2, w + 4, h * 0.42);
      ctx.fillStyle = css(shift(claw, 0, 0, -4)); ctx.fillRect(-2, h * 0.62, w + 4, h * 0.4);
    });
  }
}
