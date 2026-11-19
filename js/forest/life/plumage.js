import * as THREE from 'three';
import { paintDisplay } from './parts/displayPaint.js';
import { makeCanvas, css, vary, shift, stroke, rng, cutoutTexture } from '../paint/brush.js';
import { curve } from './skin.js';
import { CELLS, SKIN_EDGE, outline } from './bird.js';
import { paintRaptor } from './parts/raptorPaint.js';
import { paintDuckBill, paintWeb } from './parts/duck.js';
import { extraRows, paintOwl, shineOf } from './parts/owl.js';

// A bird's paint: one sheet for the whole animal, painted feather by feather when the page loads, from the
// plumage table of its species sheet (life/species). Colours are [hue, saturation, lightness].
//
//   plumage.body        rules for the feathers of head and body, in order: the last rule whose `where` holds
//                       for a feather paints it. A rule is { colour, edge, shaft, bars, size, where }; `bars` is
//                       [colour, how many, how thick as a share of the feather's length]: bars across it; `where` is
//                       given { x, y, a }: millimetres in the level pose seen from the side (x = 0 where the
//                       tail is rooted), and how far round from the belly's midline (0) to the back's (1).
//   plumage.wing        the flight feathers and coverts, folded and spread; `primaryBars`, `secondaryBars`, and
//                       for a bird that has them `tertialBars` and `greaterBars` (the folded wing's tertials and
//                       greater coverts), are paint over stretches of a feather: see `quill` below
//   plumage.tail        { web, edge, under, tip: [[strip, colour, share], ...], point, middle, bars }
//   plumage.bill, .eye, .leg, .mouth
//
// Nothing here knows a species: the same strokes lay a thrush and a creeper.

const ACROSS = 1024, DOWN = 1536;               // the sheet, in pixels (see CELLS in life/bird.js)

export function paintBird(sheet, look) {
  // (an owl's sheet is taller: its face is painted below every cell every bird has, life/parts/owl.js)
  const canvas = makeCanvas(ACROSS, DOWN + extraRows(sheet)), ctx = canvas.getContext('2d'), r = rng(sheet.seed ?? 31), P = sheet.plumage, shape = sheet.shape;
  const ragged = look.paint.ragged, wobble = look.paint.vary, chance = r;
  const cell = (c, paint) => {
    const x = c[0] * ACROSS, y = c[1] * DOWN, w = (c[2] - c[0]) * ACROSS, h = (c[3] - c[1]) * DOWN;
    ctx.save(); ctx.beginPath(); ctx.rect(x, y, w, h); ctx.clip(); ctx.translate(x, y);
    paint(w, h);
    ctx.restore();
  };
  const fill = (w, h, colour) => { ctx.fillStyle = css(colour); ctx.fillRect(-2, -2, w + 4, h + 4); };
  // One feather: a stroke from its root to its tip. With an edge colour the whole feather is laid in that
  // first and the web over it, a little short, so the edge shows as a fringe round the tip.
  // `r` is the chance it is drawn with: the same seed lays the same feather twice.
  const feather = (x0, y0, x1, y1, width, f, r = chance) => {
    const opts = { ragged, taperIn: 0.12, taperOut: f.blunt ?? 0.42, bend: (r() - 0.5) * 0.06 };
    const web = vary(f.colour, r, wobble * (f.vary ?? 0.7));
    if (f.edge) {
      stroke(ctx, r, x0, y0, x1, y1, width, vary(f.edge, r, wobble * 0.5), opts);
      const k = 1 - (f.fringe ?? 0.2);
      stroke(ctx, r, x0, y0, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, width * (0.62 + 0.2 * k), web, opts);
    } else stroke(ctx, r, x0, y0, x1, y1, width, web, opts);
    if (f.shaft) stroke(ctx, r, x0 + (x1 - x0) * 0.15, y0 + (y1 - y0) * 0.15, x0 + (x1 - x0) * 0.92, y0 + (y1 - y0) * 0.92, width * (f.shaftWidth ?? 0.3), vary(f.shaft, r, wobble * 0.4), { ragged, taperIn: 0.3, taperOut: 0.5 });
    if (f.bars) {
      // bars across the feather, over the part of it that shows
      const [colour, count, share] = f.bars, dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, nx = -dy / len, ny = dx / len;
      for (let k = 0; k < count; k += 1) {
        const t = 0.3 + 0.62 * (k + 0.5) / count, cx = x0 + dx * t, cy = y0 + dy * t, half = width * 0.4 * (1 - 0.35 * t);
        stroke(ctx, r, cx - nx * half, cy - ny * half, cx + nx * half, cy + ny * half, len * share, vary(colour, r, wobble * 0.4), { ragged, taperIn: 0.25, taperOut: 0.25 });
      }
    }
  };

  // ---- head and body: the skin is laid out with the bill at the left, and goes right round the body: the
  // left side's belly at the top, the back along the middle, the right side's belly at the bottom
  const body = outline(shape), span = body.front - body.rear;
  cell(CELLS.skin, (w, h) => {
    const rules = P.body, pick = (p) => { let hit = rules[0]; for (const rule of rules) if (!rule.where || rule.where(p)) hit = rule; return hit; };
    // the way round takes up the cell less a margin at top and bottom, into which the paint repeats
    const edge = SKIN_EDGE * h, lap = h - 2 * edge;
    // The paint is laid column by column. One section of the loft supplies every
    // feather in that column, including the field marks on either side of the head.
    const point = { x: 0, y: 0, a: 0 };
    let columnX = NaN, top, bottom, middle;
    const probe = (cx, cy) => {
      if (cx !== columnX) {
        columnX = cx;
        point.x = body.front - (Math.min(w, Math.max(0, cx)) / w) * span;
        top = body.top(point.x); bottom = body.bottom(point.x);
        middle = bottom + (top - bottom) * shape.widest;
      }
      const t = ((((cy - edge) / lap) % 1) + 1) % 1;
      point.a = 1 - Math.abs(1 - 2 * t);
      const c = Math.cos(Math.PI * point.a);
      point.y = middle - c * (c > 0 ? middle - bottom : top - middle);
      return point;
    };
    // where on the sheet a place `a` of the way from belly to back is, on the right side and on the left
    const rows = (a) => [edge + (1 - a / 2) * lap, edge + (a / 2) * lap];
    // how many pixels a millimetre round the body is, at x
    const round = (x) => { const deep = (body.top(x) - body.bottom(x)) / 2, wide = body.half(x); return lap / (2 * Math.PI * Math.sqrt((deep * deep + wide * wide) / 2)); };
    const along = w / span;
    // a ground coat, so no bare canvas shows between feathers
    for (let cx = 0; cx < w; cx += 8) {
      let start = 0, colour = pick(probe(cx + 4, 4)).colour;
      for (let cy = 8; cy < h; cy += 8) {
        const next = pick(probe(cx + 4, cy + 4)).colour;
        if (next === colour) continue;
        ctx.fillStyle = css(colour);
        ctx.fillRect(cx, start, 9, cy - start + 1);
        start = cy; colour = next;
      }
      ctx.fillStyle = css(colour);
      ctx.fillRect(cx, start, 9, h - start + 1);
    }
    // feathers from the tail end forwards, so that each lies over the root of the one behind it
    for (let cx = w + 20; cx > -30;) {
      const x = body.front - (Math.min(w, Math.max(0, cx)) / w) * span;
      const pixelsAround = round(x);
      let step = 3;
      for (let cy = edge; cy < h - edge;) {
        const where = probe(cx + 3 * along, cy), rule = pick(where), size = (typeof rule.size === 'function' ? rule.size(where) : rule.size) ?? 8, long = size * along, wide = size * 0.62 * pixelsAround;
        const jx = (r() - 0.5) * long * 0.3, jy = (r() - 0.5) * wide * 0.35, slant = wide * ((r() - 0.5) * 0.3 - 0.62 * Math.sin(2 * Math.PI * (cy - edge) / lap)), seed = Math.floor(r() * 1e9);
        // The sheet's top and bottom edges meet under the belly. A feather that reaches over one is laid at the
        // other too, the same feather, so that no seam runs down the breast.
        for (const turn of [0, -lap, lap]) {
          if (turn && (cy + jy + turn < -wide * 1.5 || cy + jy + turn > h + wide * 1.5)) continue;
          feather(cx + jx, cy + jy + turn, cx + jx + long, cy + jy + turn + slant, wide, rule, rng(seed));
        }
        cy += wide * 0.46;
        step = Math.max(step, long * 0.36);
      }
      cx -= step;
    }
    // the eye, painted on the skin too: further off the bird has no eye of its own
    const e = shape.eye, ex = ((body.front - e.x) / span) * w;
    ctx.fillStyle = css(P.eye.pupil);
    // (an owl's eyes are painted in its face instead: life/parts/owl.js)
    if (!shape.disc) for (const ey of rows(body.around(e.x, e.y))) { ctx.beginPath(); ctx.ellipse(ex, ey, e.r * along, e.r * round(e.x), 0, 0, Math.PI * 2); ctx.fill(); }
    // under the folded wing the skin takes the wing's own colour, for the level that has no folded wing
    const up = curve(shape.wing.up), down = curve(shape.wing.down), aim = new THREE.Vector2(shape.wing.aim[0], shape.wing.aim[1]).normalize();
    const across = new THREE.Vector2(-aim.y, aim.x); if (across.y < 0) across.negate();
    ctx.fillStyle = css(P.wing.web);
    for (const side of [0, 1]) {
      ctx.beginPath();
      let begun = false;
      for (let k = 0; k <= 40; k += 1) {
        const t = k <= 20 ? k / 20 : (40 - k) / 20, off = k <= 20 ? up(t) * 0.8 : -down(t) * 0.8;
        const x = shape.wing.wrist[0] + aim.x * shape.wing.chord * t + across.x * off, y = shape.wing.wrist[1] + aim.y * shape.wing.chord * t + across.y * off;
        if (x < body.rear || body.out(x, y) <= 0) continue;
        const px = ((body.front - x) / span) * w, py = rows(body.around(x, y))[side];
        if (!begun) { ctx.moveTo(px, py); begun = true; } else ctx.lineTo(px, py);
      }
      ctx.closePath(); ctx.fill();
    }
  });

  // ---- wings
  const W = P.wing;
  // A flight feather or covert from (x0, y0) to (x1, y1), `width` across. `bars` are [from, to, colour, web]:
  // paint over a stretch of the feather (shares of its length), on its outer web, its inner, or both.
  const quill = (x0, y0, x1, y1, width, colours, bars = [], outer = 1) => {
    feather(x0, y0, x1, y1, width, { colour: colours.web, blunt: colours.blunt ?? 0.3, vary: 0.5 });
    const dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1, nx = (-dy / len) * outer, ny = (dx / len) * outer;
    // A loaded brush leaves a broad shadow on the inner vane and a narrow flash along the
    // shaft. Both follow the quill; the species' bars and coloured tips go over them.
    const inner = shift(colours.web, -2, 2, -6);
    const shaft = shift(colours.web, 2, -8, 9);
    stroke(ctx, r, x0 + dx * 0.12, y0 + dy * 0.12,
      x0 + dx * 0.90 - nx * width * 0.14, y0 + dy * 0.90 - ny * width * 0.14,
      width * 0.36, inner, { ragged: 0.1, taperIn: 0.18, taperOut: 0.55 });
    stroke(ctx, r, x0 + dx * 0.28, y0 + dy * 0.28, x0 + dx * 0.87, y0 + dy * 0.87,
      width * 0.085, shaft, { ragged: 0.12, taperIn: 0.16, taperOut: 0.45 });
    if (colours.edge) stroke(ctx, r, x0 + dx * 0.2 + nx * width * 0.36, y0 + dy * 0.2 + ny * width * 0.36, x0 + dx * 0.93 + nx * width * 0.2, y0 + dy * 0.93 + ny * width * 0.2, width * 0.2, vary(colours.edge, r, wobble * 0.4), { ragged, taperIn: 0.2, taperOut: 0.3 });
    for (const [from, to, colour, web = 'outer'] of bars) {
      // 'edge' is the narrow margin of the outer web; 'outer' and 'inner' a whole web; 'both' the feather across
      const off = web === 'both' ? 0 : (web === 'edge' ? 0.36 : web === 'outer' ? 0.24 : -0.24), wide = web === 'both' ? 0.95 : (web === 'edge' ? 0.24 : 0.5);
      stroke(ctx, r, x0 + dx * from + nx * width * off, y0 + dy * from + ny * width * off, x0 + dx * to + nx * width * off, y0 + dy * to + ny * width * off, width * wide, vary(colour, r, wobble * 0.5), { ragged, taperIn: 0.15, taperOut: 0.2 });
    }
  };
  const tipped = (x0, y0, x1, y1, width, colours, tip, bars) => {
    quill(x0, y0, x1, y1, width, colours, bars);
    if (tip) { const k = 1 - tip[1]; stroke(ctx, r, x0 + (x1 - x0) * k, y0 + (y1 - y0) * k, x1, y1, width * 0.9, vary(tip[0], r, wobble * 0.5), { ragged, taperIn: 0.25, taperOut: 0.35 }); }
  };

  // folded: the wrist is at the left and the tip at the right, the edge along the back at the top
  {
    const up = curve(shape.wing.up), down = curve(shape.wing.down), chord = shape.wing.chord;
    cell(CELLS.fold, (w, h) => {
      // (share of the chord, mm above the line from wrist to tip) to the cell
      // (`fold.feather`: the feathers' widths, which are millimetres set for a songbird, as a multiple of those: for a
      // big bird, whose folded wing is a hand deep, they were hairlines. The raptors', 2026-11-16; 1 if not given)
      const X = (t) => t * w, Y = (t, off) => (1 - (off + down(t)) / (up(t) + down(t))) * h, mm = (t) => (h / (up(t) + down(t))) * (W.fold.feather ?? 1);
      const lay = (t0, o0, t1, o1, wide, colours, bars) => quill(X(t0), Y(t0, o0), X(t1), Y(t1, o1), wide * mm((t0 + t1) / 2), colours, bars, 1);
      fill(w, h, shift(W.web, -2, 3, -5));
      const F = W.fold, flight = { web: W.web, edge: W.edge }, n = F.primaries;
      // Space the tips around the trailing edge; on a closed wing their bases disappear
      // under the coverts and the long, narrow primaries remain individually legible.
      // primaries: the outermost lies lowest and reaches furthest; each inner one stops a little shorter and higher
      for (let k = 0; k < n; k += 1) {
        const t1 = 1 - (1 - F.secondaryEnd) * (k / n) * 0.96, o1 = -down(t1) * (0.2 + 0.72 * k / n);
        lay(0.24, -down(0.24) * (0.45 + 0.45 * k / n), t1, o1, 8.5, flight, k >= W.patchSkip ? W.primaryBars : []);
      }
      // secondaries: stacked above the primaries, ending together
      for (let j = 0; j < F.secondaries; j += 1) {
        const f = j / Math.max(1, F.secondaries - 1), t1 = F.secondaryEnd - 0.02 * f, o1 = -down(t1) * 0.8 + (up(t1) + down(t1)) * 0.55 * f;
        lay(0.2, -down(0.2) * 0.5 + (up(0.2) + down(0.2)) * 0.5 * f, t1, o1, 9, flight, W.secondaryBars);
      }
      // tertials: three broad feathers over them, the innermost shortest and uppermost
      for (let j = 0; j < 3; j += 1) {
        const t1 = F.secondaryEnd - 0.03 - 0.06 * j, o1 = up(t1) * (0.25 + 0.3 * j);
        tipped(X(0.16), Y(0.16, up(0.16) * (0.3 + 0.25 * j)), X(t1), Y(t1, o1), 11 * mm(t1), { web: W.tertial ?? W.web, edge: W.edge }, W.tertialTip, W.tertialBars);
      }
      // coverts, row over row: primary coverts and alula along the lower edge, then greater, median and lesser
      for (let k = 0; k < 5; k += 1) lay(0.04 + 0.03 * k, -down(0.1) * (0.9 - 0.08 * k), 0.3 - 0.02 * k, -down(0.3) * (0.92 - 0.1 * k), 6.5, { web: W.web, edge: W.edge });
      const rowOf = (count, t0, t1, lo, hi, wide, tip, bars) => {
        for (let k = count - 1; k >= 0; k -= 1) {
          const f = k / (count - 1), o0 = lo(t0) + (hi(t0) - lo(t0)) * f, o1 = lo(t1) + (hi(t1) - lo(t1)) * f;
          tipped(X(t0 + 0.012 * f), Y(t0, o0), X(t1 - 0.02 * f), Y(t1, o1), wide * mm(t1), { web: W.covert ?? W.web, edge: W.edge }, tip, bars);
        }
      };
      rowOf(F.greater, 0.17, F.greaterEnd, (t) => -down(t) * 0.62, (t) => up(t) * 0.8, 7.5, W.greaterTip, W.greaterBars);
      rowOf(F.median, 0.09, F.medianEnd, (t) => -down(t) * 0.35, (t) => up(t) * 0.85, 6.5, W.medianTip);
      for (let i = 0; i < 46; i += 1) {
        const t = 0.005 + r() * (F.medianEnd - 0.07), off = -down(t) * 0.9 + (up(t) + down(t)) * r();
        feather(X(t), Y(t, off), X(t + 0.05), Y(t + 0.05, off * 0.95), 4.5 * mm(t), { colour: W.lesser, edge: W.lesserEdge, fringe: 0.25 });
      }
    });
    cell(CELLS.foldUnder, (w, h) => { fill(w, h, W.under); for (let i = 0; i < 9; i += 1) stroke(ctx, r, 0, h * (0.1 + 0.1 * i), w, h * (0.12 + 0.1 * i), h * 0.09, vary(W.under, r, wobble), { ragged }); });
  }

  // spread: the shoulder is at the left and the tip at the right, the leading edge at the top
  for (const [name, under] of [['wingUp', false], ['wingUnder', true]]) {
    cell(CELLS[name], (w, h) => {
      ctx.clearRect(-2, -2, w + 4, h + 4);
      const S = W.spread, armShare = shape.wing.arm / (shape.wing.span / 2 - shape.wing.shoulder[2]);
      const flight = under ? { web: W.under, edge: null, blunt: 0.3 } : { web: W.web, edge: W.edge, blunt: 0.3 };
      const wx = armShare * w, wy = h * 0.16;                                   // the wrist, where the primaries are rooted
      // primaries fan from the wrist: the outermost along the leading edge, the innermost straight back
      for (let k = 0; k < S.primaries; k += 1) {
        const f = k / (S.primaries - 1), reach = S.shape[Math.min(S.shape.length - 1, k)];
        const tx = w * (1 - 0.012) - (w - wx) * 0.93 * Math.pow(f, 1.15), ty = h * (0.2 + 0.78 * Math.pow(f, 0.7)) * reach + h * 0.02;
        quill(wx - w * 0.01 + (tx - wx) * 0.06, wy, tx, Math.min(h * 0.985, ty), h * 0.2, flight, under ? W.underBars : (k >= W.patchSkip ? W.primaryBars : []), -1);
      }
      // secondaries run straight back from the arm, then the tertials against the body
      const count = S.secondaries + 3;
      for (let j = 0; j < count; j += 1) {
        const x = wx - (wx - w * 0.02) * ((j + 0.5) / count);
        quill(x + w * 0.012, h * 0.2, x - w * 0.012, h * (j < S.secondaries ? 0.985 : 0.93 - 0.05 * (j - S.secondaries)), h * 0.19, j < S.secondaries ? flight : { ...flight, web: under ? W.under : (W.tertial ?? W.web) }, under ? W.underBars : W.secondaryBars, -1);
      }
      // coverts: greater, median, then the small feathers of the leading edge
      const rows = under ? [[0.5, 0.2, W.underCovert, W.underCovertTip, 15], [0.33, 0.1, W.underCovert, W.underCovertTip, 17], [0.2, 0.02, W.underCovert, W.underCovertTip, 20]]
        : [[0.43, 0.2, W.covert ?? W.web, W.greaterTip, 15], [0.29, 0.12, W.covert ?? W.web, W.medianTip, 17], [0.17, 0.02, W.lesser, null, 22]];
      for (const [tipAt, rootAt, web, tip, n] of rows) {
        for (let k = 0; k < n; k += 1) {
          const f = (k + 0.5) / n, x = w * (0.01 + 0.9 * f), shrink = f > armShare ? 1 - 0.75 * (f - armShare) / (1 - armShare) : 1;
          tipped(x, h * rootAt * shrink, x + w * 0.006, h * (rootAt + (tipAt - rootAt) * shrink), (w / n) * 1.25, { web, edge: under ? null : W.edge }, tip);
        }
      }
    });
  }

  // ---- tail: six feathers side by side, the middle pair at the left, roots at the top
  for (const [name, under] of [['tailUp', false], ['tailUnder', true]]) {
    cell(CELLS[name], (w, h) => {
      ctx.clearRect(-2, -2, w + 4, h + 4);
      const T = P.tail;
      for (let k = 0; k < 6; k += 1) {
        const x = (k + 0.5) * (w / 6), wide = (w / 6) * 0.86;
        // (`middle`: the middle pair in a colour of its own, seen from above)
        quill(x, -h * 0.02, x, h * 0.985, wide, { web: under ? T.under : (k === 0 && T.middle ? T.middle : T.web), edge: under ? null : T.edge, blunt: T.point ?? 0.16 }, [], 1);
        // the inner web is the left half of each strip
        for (const [strip, colour, share] of T.tip || []) if (strip === k) stroke(ctx, r, x - wide * 0.2, h * (0.985 - share), x - wide * 0.17, h * 0.975, wide * 0.5, vary(colour, r, wobble * 0.3), { ragged, taperIn: 0.3, taperOut: 0.25 });
        if (T.shaft && !under) stroke(ctx, r, x, h * 0.03, x, h * 0.97, wide * 0.1, T.shaft, { ragged: 0.05, taperIn: 0.05, taperOut: 0.3 });
        // bars across each feather: [colour, how many, how thick as a share of its length]
        // (laid only where the feather is: a bar that ran past a feather's edge stood out of the tail as a thorn)
        if (T.bars) {
          ctx.globalCompositeOperation = 'source-atop';
          for (let b = 0; b < T.bars[1]; b += 1) { const y = h * (0.14 + 0.8 * (b + 0.5) / T.bars[1]); stroke(ctx, r, x - wide * 0.44, y, x + wide * 0.44, y + (r() - 0.5) * 2, h * T.bars[2], vary(T.bars[0], r, wobble * 0.3), { ragged, taperIn: 0.2, taperOut: 0.2, alpha: under ? 0.5 : 1 }); }
          ctx.globalCompositeOperation = 'source-over';
        }
      }
    });
  }

  // ---- bill, mouth, eye, legs
  cell(CELLS.bill, (w, h) => {
    fill(w, h, P.bill.upper);
    for (let i = 0; i < 7; i += 1) stroke(ctx, r, 0, h * (0.06 + 0.06 * i), w, h * (0.08 + 0.06 * i), h * 0.08, vary(P.bill.upper, r, wobble * 0.6), { ragged });
    // the lower mandible is the lower half of the cell; its base is at the left
    ctx.fillStyle = css(P.bill.lower); ctx.fillRect(0, h * 0.5, w, h * 0.5);
    if (P.bill.lowerBase) for (let i = 0; i < 6; i += 1) stroke(ctx, r, -w * 0.05, h * (0.56 + 0.07 * i), w * P.bill.lowerBase[1], h * (0.57 + 0.07 * i), h * 0.1, vary(P.bill.lowerBase[0], r, wobble * 0.5), { ragged, taperIn: 0.05, taperOut: 0.5 });
    if (!shape.bill.duck && !shape.bill.cere) {
      // A brush along the culmen and a small recessed nostril on either side of its base.
      stroke(ctx, r, w * 0.06, h * 0.25, w * 0.86, h * 0.25, h * 0.07,
        shift(P.bill.upper, 1, -5, 9), { taperOut: 0.65, ragged: 0.08 });
      for (const side of [0.15, 0.35]) {
        ctx.fillStyle = css(shift(P.bill.upper, 0, 0, -12));
        ctx.beginPath(); ctx.ellipse(w * 0.23, h * side, w * 0.058, h * 0.025, 0, 0, Math.PI * 2); ctx.fill();
      }
    }
    // (a duck's bill: its ridge, its nail and its nostrils, life/parts/duck.js)
    if (shape.bill.duck) paintDuckBill({ ctx, r, w, h, P: P.bill, D: shape.bill.duck, culmen: shape.bill.culmen, stroke, vary, css, shift, ragged, wobble });
  });
  // (a raptor's cere and talons, with random numbers of their own: life/parts/raptorPaint.js)
  if (P.bill.cere || shape.leg.talons) paintRaptor({ ctx, cell, sheet, billCell: CELLS.bill, look });
  cell(CELLS.mouth, (w, h) => fill(w, h, P.mouth));
  cell(CELLS.eye, (w, h) => {
    fill(w, h, P.eye.iris);
    // The brow shades the top of the iris. A broken warm rim describes its lower curve.
    ctx.strokeStyle = css(shift(P.eye.iris, 3, 8, 14)); ctx.lineWidth = w * 0.064;
    ctx.beginPath(); ctx.ellipse(w * 0.5, h * 0.5, w * 0.37, h * 0.36, 0, 0.18, 2.35); ctx.stroke();
    ctx.fillStyle = css(P.eye.pupil); ctx.beginPath(); ctx.arc(w / 2, h / 2, w * 0.3, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = css([210, 30, 92]); ctx.beginPath(); ctx.ellipse(w * 0.4, h * 0.36, w * 0.075, w * 0.05, -0.5, 0, Math.PI * 2); ctx.fill();      // the light of the sky in it
  });
  // (a grouse's comb and ruff, laid on the skin where they lie, and the bands across its tail, over the paint that is
  // there and with random numbers of their own: life/parts/displayPaint.js)
  if (P.comb || P.ruff || P.tail.band) paintDisplay({ ctx, cell, cells: CELLS, body, sheet, look, edge: SKIN_EDGE });
  cell(CELLS.leg, (w, h) => {
    fill(w, h, P.leg);
    // the scales of the tarsus: fine rings
    for (let i = 0; i < 14; i += 1) stroke(ctx, r, -4, h * (i + 0.5) / 14, w + 4, h * (i + 0.5) / 14 + (r() - 0.5) * 2, h * 0.012, shift(P.leg, 0, -8, -11), { ragged: 0.1, alpha: 0.7 });
    // (the webs between the toes, for a bird that has them: life/parts/duck.js)
    if (P.web) paintWeb({ ctx, w, h, colour: P.web, css });
  });
  cell(CELLS.shin, (w, h) => {
    fill(w, h, P.shin);
    for (let i = 0; i < 40; i += 1) { const x = r() * w, y = r() * h * 0.85; feather(x, y, x + (r() - 0.5) * 6, y + h * 0.2, w * 0.1, { colour: P.shin }); }
  });

  // an owl's face, its lids and its own eye, and where its pupils are for the eye's shine (life/parts/owl.js)
  const pupils = paintOwl(sheet, { ctx, ACROSS, DOWN, body, look });

  const texture = cutoutTexture(canvas, { anisotropy: 4 });
  const shine = shineOf(sheet, pupils);
  if (shine) texture.userData.shine = shine;
  return { texture, canvas };
}
