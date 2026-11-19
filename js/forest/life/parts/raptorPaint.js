import { css, vary, shift, stroke, rng } from '../../paint/brush.js';
import { CERE_U, TALON_CELL, SHADE_CELL, FISH_CELL, FIN_U } from './raptor.js';

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

const smooth = (t) => { const k = Math.min(1, Math.max(0, t)); return k * k * (3 - 2 * k); };

// The ten primaries of a soaring eagle's spread wing, from the innermost (P1) to the outermost (P10): how long each
// is (a share of the hand's span, wrist to tip), the way it points (degrees back from straight out along the wing),
// where along it its slot begins (2: it has none) and how slim its finger is beside the whole feather. Friedmann has
// the six outer primaries notched and the fourth from the outside the longest, then the third, fifth and second; the
// rest (every angle, how deep each slot is cut, a seventh feather a little notched) is the agent's drawing of a
// soaring eagle's hand: the outermost straight along the leading edge, the rest fanned back to the trailing edge.
const PRIMARIES = [[0.665, 84, 2, 1], [0.69, 75, 2, 1], [0.715, 64, 2, 1], [0.74, 52, 0.8, 0.84], [0.775, 40, 0.64, 0.68],
  [0.798, 29, 0.54, 0.62], [0.79, 19, 0.5, 0.6], [0.75, 10, 0.48, 0.6], [0.685, 2, 0.47, 0.6], [0.55, -6, 0.47, 0.64]];

// The spread wing of a soaring raptor (the eagle's, 2026-11-18), for a sheet with `plumage.wing.spread.fingers`, in
// place of the fan life/plumage.js lays for every other bird (primaries fanned evenly from the wrist, which reads as
// a round wing). Here the wing is laid out in millimetres on the wing as built (life/bird.js "spread wings": `z` out
// from the shoulder, `back` behind the arm's leading edge) and each feather is a shape of its own: secondaries
// straight back from the arm, all of a length, so the arm is a plank; primaries rooted along the hand, the inner ones
// carrying the plank on and the outer ones cut away to fingers with air between them; and over their roots the
// coverts, row over row, each feather with a pale fringe, so that from above or below the wing reads as coverts and
// flight feathers. Seen from above, a feather lies over the one outside it; from below, the other way.
//   fingers: { count, wide, slim, bone, quill, spread }   how many of the outer primaries are slotted; a flight
//   feather's width (a share of the wing's `root` chord, 0.15); the fingers' slimness, as a multiple of the table's
//   (1); how much of the hand's span its bones take (0.36: the primaries are rooted along it); how far behind the
//   leading edge their roots lie (a share of `root`, 0.11); and the fan's angles as a multiple of the table's (1).
// `w`, `h`: the cell (the shoulder at the left, the tip at the right, the leading edge at the top).
export function paintRaptorWing({ ctx, w, h, under, sheet, look }) {
  const W = sheet.plumage.wing, S = W.spread, F = S.fingers, G = sheet.shape.wing;
  const r = rng((((sheet.seed ?? 31) * 104729) + (under ? 977 : 131)) >>> 0), ragged = look.paint.ragged, wobble = look.paint.vary;
  const reach = G.span / 2 - G.shoulder[2], arm = G.arm, hand = reach - arm, mm = w / reach;
  const kOf = (z) => Math.max(0, z - arm) / hand, chordAt = (z) => G.root + (G.tipChord - G.root) * Math.pow(kOf(z), 1.6), edgeAt = (z) => G.sweep * kOf(z) ** 2;
  const X = (z) => z * mm, Y = (z, back) => ((back - edgeAt(z)) / chordAt(z)) * h;
  // One feather as a shape, from its root to its tip (each [z, back] in mm), `wide` mm across where it is whole; from
  // `notch` of the way along it is cut away to `slim` of that, mostly from its inner web. Its shaft lies nearer its
  // leading web, which is the side towards the wing's leading edge and its tip.
  const plume = (z0, b0, z1, b1, wide, colours, { notch = 2, slim = 1, round = 0.08, plain = false, parted = 0.85 } = {}) => {
    const x0 = X(z0), y0 = Y(z0, b0), x1 = X(z1), y1 = Y(z1, b1), dx = x1 - x0, dy = y1 - y0, len = Math.hypot(dx, dy) || 1;
    const nx = dy / len, ny = -dx / len, half = (wide * mm) / 2, N = 14, L = [], R = [];
    for (let i = 0; i <= N; i += 1) {
      const t = i / N, e = notch < 1 ? smooth((t - notch + 0.1) / 0.16) : 0;
      const full = Math.min(1, 0.4 + t / 0.14) * Math.sqrt(Math.min(1, (1 - t) / round + 0.02));
      const lead = half * (0.62 + (0.8 * slim - 0.62) * e) * full, trail = half * (1.38 + (1.2 * slim - 1.38) * e) * full;
      const j = 1 + (r() - 0.5) * ragged * 0.5, cx = x0 + dx * t, cy = y0 + dy * t;
      L.push(cx + nx * lead * j, cy + ny * lead * j); R.push(cx - nx * trail * j, cy - ny * trail * j);
    }
    const web = vary(colours.web, r, wobble * 0.45);
    ctx.beginPath(); ctx.moveTo(L[0], L[1]);
    for (let i = 1; i <= N; i += 1) ctx.lineTo(L[i * 2], L[i * 2 + 1]);
    for (let i = N; i >= 0; i -= 1) ctx.lineTo(R[i * 2], R[i * 2 + 1]);
    ctx.closePath(); ctx.fillStyle = css(web); ctx.fill();
    if (plain) return;
    // the inner web's edge, darker, which is what parts a feather from the one it lies on; the leading web's, paler
    const line = (P, from, to, colour, width, alpha) => {
      ctx.beginPath();
      for (let i = from; i <= to; i += 1) { if (i === from) ctx.moveTo(P[i * 2], P[i * 2 + 1]); else ctx.lineTo(P[i * 2], P[i * 2 + 1]); }
      ctx.strokeStyle = css(colour, alpha); ctx.lineWidth = width; ctx.stroke();
    };
    line(R, 1, N - 1, shift(web, 0, 2, -5), Math.max(1, half * 0.16), parted);
    if (colours.edge) line(L, 3, N - 1, colours.edge, Math.max(0.8, half * 0.1), 0.7);
    if (colours.shaft) stroke(ctx, r, x0 + dx * 0.06, y0 + dy * 0.06, x0 + dx * 0.94, y0 + dy * 0.94, Math.max(1, half * 0.12), colours.shaft, { ragged: 0.08, taperIn: 0.05, taperOut: 0.35 });
  };
  // a covert: a short broad feather with a pale fringe round its tip
  const scale = (z0, b0, z1, b1, wide, web, edge) => {
    plume(z0, b0, z1, b1, wide, { web: edge }, { round: 0.3, plain: true });
    plume(z0, b0, z0 + (z1 - z0) * 0.87, b0 + (b1 - b0) * 0.87, wide * 0.84, { web }, { round: 0.32, plain: true });
  };
  const root = G.root, wide = (F.wide ?? 0.16) * root, bone = (F.bone ?? 0.36) * hand, quill = (F.quill ?? 0.11) * root, fan = F.spread ?? 1;
  const flight = under ? { web: W.under, shaft: shift(W.under, 8, -4, 16), edge: null } : { web: W.web, shaft: shift(W.web, 2, -6, 7), edge: W.edge };
  const covert = under ? W.underCovert : (W.covert ?? W.web), fringe = under ? shift(W.underCovert, 3, 2, 6) : W.lesserEdge, lesser = under ? W.underCovert : W.lesser;
  const greater = under ? shift(W.under, 0, 2, 4) : covert, greaterFringe = under ? shift(W.under, 4, 2, 10) : fringe;

  // ---- where the flight feathers lie
  const primaries = PRIMARIES.map(([long, degrees, notch, slim], i) => {
    const z0 = arm + bone * (i / 9), b0 = edgeAt(z0) + quill * (1 - 0.4 * (i / 9)), a = (degrees * fan * Math.PI) / 180, len = long * hand;
    const z1 = Math.min(z0 + len * Math.cos(a), reach * 0.998), lo = edgeAt(z1) + chordAt(z1) * 0.03, hi = edgeAt(z1) + chordAt(z1) * 0.985;
    const slot = i >= 10 - F.count;
    return { z0, b0, z1, b1: Math.min(hi, Math.max(lo, b0 + len * Math.sin(a))), notch: slot ? notch : 2, slim: slot ? Math.min(1, slim * (F.slim ?? 1)) : 1 };
  });
  const count = S.secondaries, step = arm / (count + 0.5), secondaries = [];
  for (let j = 0; j < count; j += 1) {
    // (the innermost three are the tertials: shorter, and leaning in towards the body)
    const z = arm - step * (j + 0.5), inner = Math.max(0, j - (count - 4)) / 3;
    secondaries.push({ z0: z + step * 0.2, b0: 0.2 * root, z1: z - step * (0.25 + 1.2 * inner), b1: root * (0.975 - 0.2 * inner * inner - 0.012 * r()) });
  }

  // ---- a ground under the coverts, so that no gap between two of them is a hole in the wing
  ctx.fillStyle = css(shift(covert, 0, 0, -3));
  ctx.fillRect(X(0) - 2, -2, X(arm) + 2, h * 0.47);
  ctx.beginPath(); ctx.moveTo(X(arm) - 1, -2); ctx.lineTo(X(arm + bone * 1.06), Y(arm + bone * 1.06, edgeAt(arm + bone * 1.06)));
  ctx.lineTo(X(arm + bone * 1.02), Y(arm + bone * 1.02, edgeAt(arm + bone) + quill * 1.5)); ctx.lineTo(X(arm) - 1, h * 0.47); ctx.closePath(); ctx.fill();

  // ---- flight feathers
  const order = (list) => (under ? [...list].reverse() : list);
  for (const p of order([...primaries].reverse())) plume(p.z0, p.b0, p.z1, p.b1, wide, flight, { notch: p.notch, slim: p.slim, round: p.notch < 1 ? 0.06 : 0.04, parted: p.notch < 1 ? 0.85 : 0.6 });
  // (broad, square-ended and well lapped, so that their tips are one edge and not a comb's teeth)
  for (const s of order(secondaries)) plume(s.z0, s.b0, s.z1, s.b1, step * 2.7, flight, { round: 0.03, parted: 0.55 });

  // ---- coverts, row over row: the greater ones over the flight feathers' roots, then the median, then the lesser
  const far = under ? 0.52 : 0.47;
  for (const p of order([...primaries].reverse())) {
    const t = 0.33 + 0.1 * ((p.z0 - arm) / bone);
    scale(p.z0, p.b0 - quill * 0.3, p.z0 + (p.z1 - p.z0) * t, p.b0 + (p.b1 - p.b0) * t, wide * 0.78, greater, greaterFringe);
  }
  for (let j = 0; j <= count; j += 1) {
    const jj = under ? count - j : j, z = arm - step * jj;
    if (z > 0) scale(z + step * 0.25, 0.1 * root, z - step * 0.2, far * root * (1 - 0.03 * r()), step * 2.1, greater, greaterFringe);
  }
  const medians = Math.round(count * 1.15);
  for (let j = 0; j <= medians; j += 1) {
    const z = arm * (1 - j / medians);
    scale(z + step * 0.3, 0.045 * root, z - step * 0.1, (far - 0.16) * root * (1 - 0.04 * r()), step * 1.9, covert, fringe);
  }
  for (const p of order([...primaries].reverse())) {
    const t = 0.17 + 0.05 * ((p.z0 - arm) / bone);
    scale(p.z0, p.b0 - quill * 0.45, p.z0 + (p.z1 - p.z0) * t, p.b0 + (p.b1 - p.b0) * t, wide * 0.7, covert, fringe);
  }
  // the lesser coverts: small feathers in rows from the leading edge back, along the arm and on along the hand's bones
  ctx.fillStyle = css(lesser); ctx.fillRect(X(0) - 2, -2, X(arm + bone) + 2, h * 0.04);
  const rows = [0.19, 0.135, 0.08, 0.03, -0.012], each = 0.05 * root;
  for (const at of rows) {
    for (let z = arm + bone * 1.04 - r() * each; z > -each; z -= each * (0.85 + 0.3 * r())) {
      const k = Math.max(0, z - arm) / bone, b = edgeAt(z) + at * root * (1 - 0.72 * k);
      if (b > edgeAt(z) + quill * 1.5 * (1 - 0.3 * k) + (z > arm ? 0 : root)) continue;                 // (on the hand, only as far back as its bones are wide)
      scale(z + each * 0.5, b, z - each * 0.1, b + 0.085 * root * (1 - 0.5 * k), each * 1.5, lesser, fringe);
    }
  }
  // the alula: three stiff dark feathers from the wrist out along the hand's leading edge (seen from above)
  if (!under) for (let a = 2; a >= 0; a -= 1) { const z1 = arm + bone * (0.3 + 0.11 * a); plume(arm - 2, edgeAt(arm) + 0.012 * root, z1, edgeAt(z1) + 0.018 * root * (1 + 0.5 * a), 0.045 * root, { web: shift(covert, 0, 0, -2), shaft: shift(covert, 0, -4, -6), edge: fringe }, { round: 0.14, parted: 0.4 }); }
}

// An eagle's face, its trousers and its fish (the eagle's, 2026-11-18), over what life/plumage.js has laid, each
// only for a sheet that asks and with random numbers of their own:
//   plumage.eye.rim, .small    the eye's own cell again: a dark rim round the iris and a pupil `small` of the cell
//                              across (0.3 is every other bird's), under the shadow of the brow
//   plumage.face: { shade, lore, gape }   `shade` fills SHADE_CELL (the brow's under side: life/parts/raptor.js) and
//                              is laid thin on the skin just over the eye; `lore` the bare skin between the eye and
//                              the cere; `gape` the corner of the mouth, from the bill's base back to under the eye
//   plumage.trousers: { edge } the shin's cell again, as long feathers that point down the leg, each fringed `edge`
//   plumage.prey: { back, side, belly, fin, spot, band }   the fish, in FISH_CELL: its back along the top, its belly
//                              along the foot, its snout at the right and its tail fin in the first FIN_U from the left
// `cell` and `cells` are life/plumage.js's (CELLS); `body` the outline; `edge` SKIN_EDGE.
export function paintRaptorLate({ ctx, cell, cells, sheet, body, look, edge: skinEdge }) {
  const P = sheet.plumage, shape = sheet.shape, r = rng(((sheet.seed ?? 31) * 15485863 + 3571) >>> 0), ragged = look.paint.ragged, wobble = look.paint.vary;
  if (P.eye.rim || P.eye.small) {
    cell(cells.eye, (w, h) => {
      ctx.fillStyle = css(P.eye.iris); ctx.fillRect(-2, -2, w + 4, h + 4);
      // the iris: a little darker towards its rim, and rayed
      for (let i = 0; i < 26; i += 1) { const a = r() * Math.PI * 2; stroke(ctx, r, w / 2 + Math.cos(a) * w * 0.16, h / 2 + Math.sin(a) * h * 0.16, w / 2 + Math.cos(a) * w * 0.44, h / 2 + Math.sin(a) * h * 0.44, w * 0.035, shift(P.eye.iris, -4, 6, -9), { ragged: 0.1, alpha: 0.5, taperIn: 0.3, taperOut: 0.2 }); }
      if (P.eye.rim) { ctx.strokeStyle = css(P.eye.rim); ctx.lineWidth = w * 0.11; ctx.beginPath(); ctx.ellipse(w / 2, h / 2, w * 0.455, h * 0.455, 0, 0, Math.PI * 2); ctx.stroke(); }
      ctx.fillStyle = css(P.eye.pupil); ctx.beginPath(); ctx.arc(w / 2, h / 2, w * (P.eye.small ?? 0.3), 0, Math.PI * 2); ctx.fill();
      // the brow's shadow lies across the top of the eye, deepest towards the bill (the cell's right)
      if (P.face) { ctx.fillStyle = css(P.face.shade, 0.6); ctx.beginPath(); ctx.moveTo(-2, -2); ctx.lineTo(w + 2, -2); ctx.lineTo(w + 2, h * 0.4); ctx.quadraticCurveTo(w * 0.5, h * 0.3, -2, h * 0.2); ctx.closePath(); ctx.fill(); }
      ctx.fillStyle = css([210, 30, 94]); ctx.beginPath(); ctx.ellipse(w * 0.4, h * 0.42, w * 0.06, w * 0.04, -0.5, 0, Math.PI * 2); ctx.fill();          // the light of the sky in it
    });
  }
  if (P.face) {
    cell(SHADE_CELL, (w, h) => { ctx.fillStyle = css(P.face.shade); ctx.fillRect(-2, -2, w + 4, h + 4); });
    cell(cells.skin, (w, h) => {
      const span = body.front - body.rear, pad = skinEdge * h, lap = h - 2 * pad, e = shape.eye;
      const px = (x) => ((body.front - x) / span) * w, rows = (x, y) => { const a = body.around(x, y); return [pad + (1 - a / 2) * lap, pad + (a / 2) * lap]; };
      const along = w / span, round = (x) => { const deep = (body.top(x) - body.bottom(x)) / 2, half = body.half(x); return lap / (2 * Math.PI * Math.sqrt((deep * deep + half * half) / 2)); };
      // a line on the head's side from (x0, y0) to (x1, y1), mm in the level pose, `wide` mm across: on both sides
      const mark = (x0, y0, x1, y1, wide, colour, alpha = 1) => {
        const a = rows(x0, y0), b = rows(x1, y1);
        for (const side of [0, 1]) stroke(ctx, r, px(x0), a[side], px(x1), b[side], wide * (along + round((x0 + x1) / 2)) / 2, colour, { ragged: 0.12, taperIn: 0.2, taperOut: 0.3, alpha });
      };
      const front = body.front, gapeY = body.top(front) - (body.top(front) - body.bottom(front)) * 0.56;
      // the bare lore, from before the eye to the cere; and the gape's flange, back from the corner of the mouth to
      // under the front of the eye (longer and higher, the two were a yellow V on the face seen from ahead)
      if (P.face.lore) mark(e.x + e.r * 1.05, e.y - e.r * 0.2, front + 1, gapeY + (body.top(front) - gapeY) * 0.5, e.r * 0.8, P.face.lore, 0.7);
      if (P.face.gape) mark(front + 2, gapeY, e.x + e.r * 1.5, gapeY - e.r * 0.1, e.r * 0.4, P.face.gape);
      // the brow's shadow on the feathers just over the eye
      mark(e.x - e.r * 1.2, e.y + e.r * 0.95, e.x + e.r * 1.5, e.y + e.r * 0.8, e.r * 0.5, P.face.shade, 0.55);
    });
  }
  if (P.trousers) {
    cell(cells.shin, (w, h) => {
      ctx.fillStyle = css(P.shin); ctx.fillRect(-2, -2, w + 4, h + 4);
      // long feathers that point down the leg, the lower rows laid first so that each row lies over the one below
      for (let row = 6; row >= 0; row -= 1) {
        const y = h * (-0.06 + 0.15 * row), long = h * 0.3, n = 9;
        for (let i = 0; i <= n; i += 1) {
          const x = (w / n) * (i + (row % 2 ? 0.5 : 0) + (r() - 0.5) * 0.2), lean = (r() - 0.5) * w * 0.02, wide = (w / n) * 1.35;
          stroke(ctx, r, x, y, x + lean, y + long, wide, vary(P.trousers.edge, r, wobble * 0.5), { ragged, taperIn: 0.12, taperOut: 0.5 });
          stroke(ctx, r, x, y, x + lean * 0.85, y + long * 0.85, wide * 0.8, vary(P.shin, r, wobble * 0.6), { ragged, taperIn: 0.12, taperOut: 0.5 });
          stroke(ctx, r, x, y + long * 0.2, x + lean * 0.8, y + long * 0.8, wide * 0.07, shift(P.shin, 0, -4, -5), { ragged: 0.1, taperIn: 0.2, taperOut: 0.4 });
        }
      }
    });
  }
  if (P.prey) {
    const C = P.prey;
    cell(FISH_CELL, (w, h) => {
      ctx.fillStyle = css(C.side); ctx.fillRect(-2, -2, w + 4, h + 4);
      const x0 = FIN_U * w, long = w - x0;
      // its back along the top, its belly along the foot, the side between them
      for (let i = 0; i < 5; i += 1) stroke(ctx, r, x0, h * (0.06 + 0.05 * i), w, h * (0.06 + 0.05 * i), h * 0.2, vary(C.back, r, wobble * 0.5), { ragged: 0.1, taperIn: 0.02, taperOut: 0.05, alpha: 0.85 });
      for (let i = 0; i < 4; i += 1) stroke(ctx, r, x0, h * (0.8 + 0.05 * i), w, h * (0.8 + 0.05 * i), h * 0.2, vary(C.belly, r, wobble * 0.3), { ragged: 0.1, taperIn: 0.02, taperOut: 0.05, alpha: 0.9 });
      if (C.band) stroke(ctx, r, x0 + long * 0.12, h * 0.5, x0 + long * 0.9, h * 0.5, h * 0.2, C.band, { ragged: 0.15, taperIn: 0.3, taperOut: 0.3, alpha: 0.55 });
      if (C.spot) { ctx.fillStyle = css(C.spot, 0.8); for (let i = 0; i < 70; i += 1) { ctx.beginPath(); ctx.ellipse(x0 + long * (0.04 + 0.86 * r()), h * (0.08 + 0.4 * r() * r()), w * 0.004, h * 0.035, 0, 0, Math.PI * 2); ctx.fill(); } }
      // the gill's edge, and the eye
      ctx.strokeStyle = css(shift(C.side, 0, 0, -22), 0.7); ctx.lineWidth = w * 0.004; ctx.beginPath(); ctx.moveTo(x0 + long * 0.84, h * 0.2); ctx.quadraticCurveTo(x0 + long * 0.8, h * 0.5, x0 + long * 0.845, h * 0.82); ctx.stroke();
      ctx.fillStyle = css([45, 30, 62]); ctx.beginPath(); ctx.ellipse(x0 + long * 0.925, h * 0.4, w * 0.008, h * 0.13, 0, 0, Math.PI * 2); ctx.fill();
      ctx.fillStyle = css([240, 15, 6]); ctx.beginPath(); ctx.ellipse(x0 + long * 0.925, h * 0.4, w * 0.0045, h * 0.075, 0, 0, Math.PI * 2); ctx.fill();
      // the tail fin, rayed
      ctx.fillStyle = css(C.fin); ctx.fillRect(-2, -2, x0 + 2, h + 4);
      for (let i = 0; i < 9; i += 1) stroke(ctx, r, 0, h * (0.08 + 0.105 * i), x0, h * (0.3 + 0.05 * i), h * 0.045, shift(C.fin, 0, 0, -9), { ragged: 0.1, taperIn: 0.05, taperOut: 0.1, alpha: 0.7 });
    });
  }
}
