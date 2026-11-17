import * as THREE from 'three';

// A mammal's paw, for the beast builder (life/beast.js): plantigrade (a bear, a skunk, a fisher, a squirrel's hind
// foot: the whole sole on the ground, the leg's last joint low over its back third) or digitigrade (the toes and
// the pad under them on the ground, the leg's last joint over the back of the pad). One part for every mammal on
// the plan, from a chipmunk's paw of a few millimetres to a bear's of twenty centimetres: every length in here is a
// share of the foot's own sizes, and nothing is in metres but what the sheet gives.
//
// What a sheet gives (the declared form, and the bear's additions, which are optional):
//   shape.paw    { kind: 'plantigrade' | 'digitigrade', claw: mm, the longest claw of the forefoot along its curve,
//                  hind: mm (the hind claws; 0.6 of `claw` if not given), curve: radians the fore claws bend through
//                  (1.0; the hind ones 0.6 of it), in: degrees the forefeet's toes turn in (0), hindIn: the hind
//                  feet's (0), thick: a claw's depth at its root as a share of its length (0.22) }
//   shape.fore.foot, shape.hind.foot (optional; each field optional): { long: m, from the back of the heel or of the
//                  palm to the tip of the longest toe, claws not counted; wide: m, across the toes; high: m, how thick
//                  the paw is behind the toes; heel: the share of `long` that lies behind the leg's last joint
//                  (plantigrade 0.3, digitigrade 0.12); toes: how many (5); digits: the share of `long` that is free
//                  toe (plantigrade 0.26, digitigrade 0.42); round: how round the toes' row is, 0 a straight row ..
//                  1 an arc (0.5); thumb: the share of the innermost toe's length (0.8) }. With no `foot`, its sizes
//                  come from the leg's girth at its last joint (wide 1.15 times as wide as the leg there; long 1.6
//                  times as wide for a plantigrade foot, 1.1 for a digitigrade one), so that the declared form alone
//                  builds a paw.
//   shape.fore.web, shape.hind.web   0..1: how far along the toes the skin between them reaches (0 none, an
//                  otter's about 0.85)
//   coat.claw    the claws' colour; coat.pad (optional) the bare soles' and the toe pads' ([20, 8, 16], a dark
//                  leathery grey-brown, if not given)
// The leg's `pastern` is, for a paw, [ahead, down] from the leg's last joint to the point on the ground the paw
// is built round (usually [0, the joint's height above the ground]); `hoof` is not given. For a plantigrade foot
// the leg's third bone is short and nearly upright (the carpus or the tarsus over the heel), and the whole foot
// is the leg's last bone (`past`), which the rig folds back in the swing and rolls onto the toe at the end of a
// stance (life/beastRig.js), as it does a hoof.
//
// Where the paw is painted: the hoof's cell of the sheet (life/beast.js BCELLS.hoof), four columns as the legs;
// down each column the fur of the paw's top (v 0 .. 0.55), the pads (0.6 .. 0.8) and the claws (0.85 .. 1).
//
// The hooks, pasted as they are (they are the whole of what the paw asks of the shared files):
//   life/beast.js, the imports:        import { footLayout, buildPaw } from './parts/paw.js';
//   life/beast.js legLayout(spec, side, paw), its first line:
//                                      const drop = l1 * Math.cos(a1) + l2 * Math.cos(a2) + l3 * Math.cos(a3) + spec.pastern[1] + (spec.hoof ? spec.hoof[1] : 0);
//   life/beast.js legLayout, before `const [long] = spec.hoof`:
//                                      if (!spec.hoof) return { joints: [P0, P1, P2, P3], lengths: [l1, l2, l3], coronet, ...footLayout(spec, side, paw, coronet) };
//   life/beast.js buildBeast, the call: const lay = legLayout(leg.fore ? shape.fore : shape.hind, leg.side, shape.paw);
//   life/beast.js buildBeast, the leg loop, after `marks[`${key}joints`] = ...`:
//                                      if (shape.paw) { buildPaw(skin, { key, fore: leg.fore, side: leg.side, col: leg.col, lay, spec, paw: shape.paw, level, depth: depth(ds[3]), width: width(ds[3]), bone: chainB[3], above: chainB[2], marks, cell: BCELLS.hoof }); continue; }
//   life/coat.js, the imports:         import { pawCoat } from './parts/paw.js';
//   life/coat.js, for the hoof's cell: if (sheet.shape.paw) pawCoat(fill, C, BCELLS.hoof); else fill(BCELLS.hoof, () => C.hoof);
// And two guards the paw needs for a sheet with no antler and no hoof (life/beast.js): the antler's pivot is the
// head's when there is no antler (`shape.antler ? onHead(...) : pivots.head.clone()`), and the antler's block is
// built only `if (shape.antler)`; life/coat.js paints the antler's cell only `if (C.antler)`.

const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const lerp = (a, b, t) => a + (b - a) * t;
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
const D = Math.PI / 180;

// Each detail level: the foot round [sides, rows along it]; a toe's [sides, rows]; a claw's [sides, rows]; the web's
// rows. Counts, not lengths: a chipmunk's paw has the vertices a bear's has.
const RES = [
  { foot: [12, 7], toe: [6, 3], claw: [4, 3], web: 3 },
  { foot: [7, 3], toe: [4, 1], claw: null, web: 1 },
  { foot: [4, 2], toe: null, claw: null, web: 0 },
];

// The foot's sizes, from the sheet or from the leg's girth at its last joint (its last row: [d, half front to back,
// half across, ahead]).
export function footOf(spec, paw) {
  const f = spec.foot || {}, plant = (paw && paw.kind) !== 'digitigrade', last = spec.girth[spec.girth.length - 1];
  const legWide = 2 * Math.max(last[1], last[2]);
  const wide = f.wide ?? legWide * 1.15, long = f.long ?? wide * (plant ? 1.6 : 1.1);
  return {
    plant, long, wide, high: f.high ?? Math.max(spec.pastern[1] * 1.15, wide * (plant ? 0.42 : 0.5)),
    heel: f.heel ?? (plant ? 0.3 : 0.12), toes: Math.max(1, Math.round(f.toes ?? 5)), digits: f.digits ?? (plant ? 0.26 : 0.42),
    round: f.round ?? 0.5, thumb: f.thumb ?? 0.8,
  };
}

// The paw's frame: its middle on the ground under the leg's last joint, its length along `x` turned in by the toe-in
// (the toes of the left feet towards +z, of the right towards -z, both towards the middle).
function frameOf(coronet, side, turn) {
  const x = V(Math.cos(turn), 0, -side * Math.sin(turn)), z = V(side * Math.sin(turn), 0, Math.cos(turn));
  return { o: V(coronet.x, 0, coronet.z), x, y: V(0, 1, 0), z, at: (fx, fy, fz, out = V()) => out.copy(coronet).setY(0).addScaledVector(x, fx).addScaledVector(z, fz).setY(fy) };
}
const turnOf = (paw, fore) => (fore ? paw.in ?? 0 : paw.hindIn ?? 0) * D;

// What life/beast.js legLayout returns for a paw: where its heel and its toe are (x, as for a hoof) and the middle
// of its sole on the ground. (Which leg it is: a fore leg's spec is `shape.fore`; `fore` is worked out by the
// caller's spec having a `scapula`.)
export function footLayout(spec, side, paw, coronet) {
  const foot = footOf(spec, paw), fr = frameOf(coronet, side, turnOf(paw || {}, !!spec.scapula));
  const back = -foot.heel * foot.long, front = (1 - foot.heel) * foot.long;
  return { heel: fr.at(back, 0, 0).x, toe: fr.at(front, 0, 0).x, sole: fr.at((back + front) / 2, 0, 0) };
}

// A ring round a line, as a superellipse: `a` 0 at the bottom, up the right side (+side) to 1 at the top and down the
// other side to 2. The bottom half is squarer than the top (a paw stands on a flat sole). Returns [up, side].
function ring(a, up, down, half, squareTop, squareBottom, out) {
  const th = a * Math.PI, c = -Math.cos(th), s = Math.sin(th), e = 2 / (c > 0 ? squareTop : squareBottom);
  out[0] = Math.sign(c) * Math.abs(c) ** e * (c > 0 ? up : down);
  out[1] = Math.sign(s) * Math.abs(s) ** e * half;
  return out;
}

// One paw onto the skin (life/beast.js Hide), on the leg's last bone. `ctx`: { key ('LF'...), fore, side, col (the
// leg's column), lay (legLayout's), spec (the leg's), paw (shape.paw), level, depth and width (the leg's half girth
// at its last joint), bone (the last bone's index), above (the bone above it), marks, cell (the hoof's cell) }.
export function buildPaw(skin, ctx) {
  const { key, fore, side, col, lay, spec, paw, level, bone, above, marks, cell } = ctx, res = RES[level];
  const foot = footOf(spec, paw), L = foot.long, W = foot.wide, J3 = lay.joints[3];
  const fr = frameOf(lay.coronet, side, turnOf(paw, fore));
  const uv = (u, v) => [cell[0] + (cell[2] - cell[0]) * ((col + 0.06 + 0.88 * clamp(u, 0, 1)) / 4), 1 - (cell[1] + (cell[3] - cell[1]) * clamp(v, 0, 1))];
  // the leg's last joint in the paw's own frame
  const jx = (J3.x - fr.o.x) * fr.x.x + (J3.z - fr.o.z) * fr.x.z, jy = J3.y, jr = Math.max(ctx.depth, ctx.width);
  // A vertex near the joint goes partly with the bone above, so that the skin bends there and the leg's last ring
  // stays inside the paw as it folds; the sole never does.
  const weigh = (p, fy, out) => {
    out.b0 = bone;
    const d = Math.hypot(p.x - J3.x, p.y - J3.y, p.z - J3.z), w = 0.5 * (1 - smooth(0.5 * jr, 1.8 * jr, d)) * smooth(0.35, 0.8, fy / Math.max(jy, foot.high * 0.5));
    if (w > 0) { out.b1 = above; out.w1 = w; }
  };
  const P = V(), tmp = [0, 0];

  // ---- the foot: a body along the paw from the heel to where the toes leave it, its sole flat on the ground. Its
  // top is highest over the leg's joint (high enough to take the leg's last ring inside it), lower at the heel, and
  // lowest where the toes leave it.
  const back = -foot.heel * L, toeLong = foot.digits * L, front = (1 - foot.heel) * L - toeLong * 0.62;
  const topJoint = Math.max(foot.high, jy + 1.2 * ctx.depth), topBack = foot.plant ? topJoint * 0.55 : topJoint * 0.85, topFront = foot.high * 0.5;
  const jk = clamp((jx - back) / (front - back), 0.05, 0.95);
  const topAt = (k) => (k < jk ? lerp(topBack, topJoint, smooth(0, jk, k) ** 0.7) : lerp(topJoint, topFront, smooth(jk, 1, k) ** 0.75));
  const halfAt = (k) => 0.5 * W * (foot.plant ? lerp(0.7, 1, smooth(0, 0.6, k)) : lerp(0.82, 1, smooth(0, 0.5, k)));
  // the ends are rounded: the rings close in over the last share of the length at either end
  const [fs, fn] = res.foot, endIn = (k) => Math.sqrt(Math.max(0.0001, 1 - ((k < 0.16 ? (0.16 - k) / 0.16 : k > 0.88 ? (k - 0.88) / 0.12 : 0) ** 2)));
  const ks = Array.from({ length: fn + 1 }, (_, j) => j / fn);
  const footBase = skin.sheet(fs, fn, (i, j, out) => {
    const k = ks[j], a = (i / fs) * 2, top = topAt(k), mid = Math.min(top * 0.4, foot.high * 0.45), shrink = endIn(k);
    ring(a, (top - mid) * shrink, mid * (0.4 + 0.6 * shrink), halfAt(k) * shrink, 2.0, 3.2, tmp);
    // (the bottom of every ring on the ground, its middle at `mid`: the sole is flat)
    const fy = Math.max(0, mid + tmp[0]), fz = tmp[1];
    fr.at(lerp(back, front, k), fy, fz, out.p);
    const bottom = Math.min(1, Math.abs(1 - a)), sole = smooth(0.78, 0.92, bottom);           // (0 at the top, 1 at the bottom of the ring)
    [out.u, out.v] = uv(k, lerp(0.05 + 0.45 * bottom, 0.7, sole));
    weigh(out.p, fy, out);
  }, { flip: true, wrap: true });
  {
    // the heel's end and the front's, closed (the toes cover the front)
    const c0 = skin.vertex3(...fr.at(back - 0.002 * L, topAt(0) * 0.32, 0).toArray(), ...uv(0, 0.7), bone, bone, 0, bone, 0);
    skin.cap(c0, footBase, fs, false);
    const c1 = skin.vertex3(...fr.at(front + 0.002 * L, topAt(1) * 0.4, 0).toArray(), ...uv(1, 0.3), bone, bone, 0, bone, 0);
    skin.cap(c1, footBase + fn * (fs + 1), fs, true);
    marks[`${key}heel`] = [c0];
  }

  // ---- the toes: in a row across the front, the outer ones set back (`round`) and the inner one shorter (`thumb`);
  // each a capsule lying on the ground, its pad under it, and a claw from its tip
  const n = foot.toes, gap = W / n, toes = [];
  const clawLong = ((fore ? paw.claw : paw.hind ?? paw.claw * 0.6) || 0) / 1000;
  const curve = (paw.curve ?? 1.0) * (fore ? 1 : 0.6), thick = paw.thick ?? 0.22;
  let tipMark = null, tipX = -Infinity;
  for (let t = 0; t < n; t += 1) {
    const across = n === 1 ? 0 : (t / (n - 1)) * 2 - 1;                    // -1 the toe on the paw's left .. 1 its right
    const inner = side < 0 ? across > 0.99 : across < -0.99;                 // the innermost (towards the body's middle)
    const share = (inner && n >= 5 ? foot.thumb : 1) * (1 - 0.1 * Math.abs(across));
    const tl = toeLong * share, setBack = foot.round * 0.45 * toeLong * across * across;
    const tz = across * (W / 2 - gap * 0.46), tw = gap * 0.46, th = Math.min(foot.high * 0.4, tw * 1.25);
    const x0 = front - tl * 0.4 - setBack, x1 = x0 + tl;
    toes.push({ x0, x1, z: tz, half: tw, high: th, tl });
    if (res.toe) {
      const [ts, tn] = res.toe, splay = across * 0.12;
      // its line, from inside the foot to its tip, splayed a little
      const lineAt = (s, out) => fr.at(lerp(x0, x1, s), th * (1.0 - 0.15 * s), tz + splay * tl * s, out);
      const base = skin.sheet(ts, tn, (i, j, out) => {
        const s = j / tn, a = (i / ts) * 2, round = Math.sqrt(Math.max(0.0001, 1 - (s > 0.6 ? (s - 0.6) / 0.4 : 0) ** 2));
        ring(a, th * round, th * (0.55 + 0.45 * round), tw * round, 2.1, 2.8, tmp);
        lineAt(s, P);
        const fy = Math.max(0, P.y + tmp[0]);
        out.p.copy(fr.at(lerp(x0, x1, s), fy, tz + splay * tl * s + tmp[1]));
        const bottom = Math.min(1, Math.abs(1 - a));
        [out.u, out.v] = uv((t + 0.5) / n, lerp(0.15 + 0.3 * bottom, 0.7, smooth(0.7, 0.88, bottom)));
        out.b0 = bone;
      }, { flip: true, wrap: true });
      const tip = lineAt(1, V()).addScaledVector(fr.x, th * 0.25);
      const c = skin.vertex3(tip.x, tip.y, tip.z, ...uv((t + 0.5) / n, 0.4), bone, bone, 0, bone, 0);
      skin.cap(c, base + tn * (ts + 1), ts, true);
      const longest = tip.dot(fr.x) > tipX;
      if (longest) { tipX = tip.dot(fr.x); tipMark = c; }
      // its claw: from inside the toe's tip, forward and down in a curve, flattened from side to side; it is turned
      // up at its root only as far as keeps its point off the ground
      if (res.claw && clawLong > 0) {
        const [cs, cn] = res.claw, cr = Math.min(thick * clawLong, th * 0.8);
        const root = lineAt(0.8, V()).addScaledVector(fr.y, th * 0.05);
        let lift = -0.3, pts = null;
        const dirAt = (s) => lift - curve * s;
        for (let tries = 0; tries < 12; tries += 1) {
          pts = [root.clone()];
          for (let k = 1; k <= cn; k += 1) {
            const ang = dirAt((k - 0.5) / cn), step = clawLong / cn;
            pts.push(pts[k - 1].clone().addScaledVector(fr.x, Math.cos(ang) * step).addScaledVector(fr.y, Math.sin(ang) * step).addScaledVector(fr.z, splay * step));
          }
          if (Math.min(...pts.map((p) => p.y)) >= cr * 0.2) break;
          lift += 0.1;
        }
        const cb = skin.sheet(cs, cn - 1, (i, j, out) => {
          const s = j / (cn - 1), th2 = (i / cs) * Math.PI * 2, r = cr * (1 - s * 0.85), ang = dirAt(s);
          const up = fr.y.clone().multiplyScalar(Math.cos(ang)).addScaledVector(fr.x, -Math.sin(ang));        // square to the claw, in its plane
          out.p.copy(pts[j]).addScaledVector(up, -Math.cos(th2) * r).addScaledVector(fr.z, -Math.sin(th2) * r * 0.55);
          [out.u, out.v] = uv((t + 0.5) / n, 0.86 + 0.12 * s);
          out.b0 = bone;
        }, { wrap: true });
        const end = pts[cn];
        const ce = skin.vertex3(end.x, end.y, end.z, ...uv((t + 0.5) / n, 0.99), bone, bone, 0, bone, 0);
        skin.cap(ce, cb + (cn - 1) * (cs + 1), cs, false);
        // (the longest toe's claw, for measuring: the middle of its root's ring, and its tip)
        if (longest) { marks[`${key}clawRoot`] = Array.from({ length: cs }, (_, i) => cb + i); marks[`${key}clawTip`] = [ce]; }
      }
    }
  }
  // (no toes at this level: the toe's mark is a vertex of no face at the front of the foot, for measuring)
  marks[`${key}toe`] = [tipMark ?? skin.vertex3(...fr.at((1 - foot.heel) * L, foot.high * 0.3, 0).toArray(), ...uv(0.5, 0.4), bone, bone, 0, bone, 0)];

  // ---- the web between the toes: a sheet on either face, from where they leave the foot to `web` of the way along
  const web = clamp(spec.web ?? 0, 0, 1);
  if (web > 0 && res.web && res.toe && n > 1) {
    const rows = res.web;
    for (let t = 0; t + 1 < n; t += 1) {
      const A = toes[t], B = toes[t + 1];
      for (const face of [1, -1]) {
        skin.sheet(1, rows, (i, j, out) => {
          // along both toes to `web` of the way, the free edge drawn back between them
          const s = (j / rows) * web, T = i === 0 ? A : B, x = lerp(T.x0 + T.tl * 0.2, T.x1, s) - (j === rows ? 0.18 * T.tl * web : 0);
          const z = T.z + (i === 0 ? 1 : -1) * T.half * 0.35, y = T.high * (0.95 + 0.06 * face);
          out.p.copy(fr.at(x, y, z));
          [out.u, out.v] = uv((t + 1) / n, face > 0 ? 0.4 : 0.66);
          out.b0 = bone;
        }, { flip: face < 0 });
      }
    }
  }
}

// The hoof's cell painted for a paw (life/coat.js): down each leg's column the fur of the paw's top (the colour of
// the leg's lowest hair), the bare pads and the claws.
export function pawCoat(fill, C, cell) {
  const pad = C.pad || [20, 8, 16], claw = C.claw || [28, 10, 24];
  const mixc = (a, b, t) => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, a[2] + (b[2] - a[2]) * t];
  fill(cell, (u, v) => {
    const col = Math.min(3, Math.floor(u * 4)), hind = col >= 2;
    const fur = C.leg({ d: 1, out: 0, front: 1, hind, pastern: true });
    if (v < 0.55) return fur;
    if (v < 0.6) return mixc(fur, pad, smooth(0.55, 0.6, v));
    if (v < 0.82) return pad;
    return mixc(pad, claw, smooth(0.82, 0.86, v));
  });
}
