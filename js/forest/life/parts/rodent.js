import * as THREE from 'three';

// What the beast builder (life/beast.js) makes for a small mammal of the squirrel family when its sheet asks for it
// (rodents, 2026-11-16): a bushy tail on a chain of six bones, a rodent's incisors and whiskers, a conifer's cone held
// in the forepaws and the scales stripped from it; and the lengths a mammalogist takes of such an animal (head and
// body, tail, hind foot, ear), measured between vertices of the mesh. Each part is opt-in by its sheet field; a sheet
// that gives none of them (the elk) is built vertex for vertex as it was. How such an animal is posed is
// life/parts/rodentRig.js, how it is painted life/parts/rodentCoat.js.
//   shape.tail.bush       { long: mm, round: mm }: a bushy tail's hair, how far the brush stands out to either side of
//                         the tail's bone and on past its tip (long), and above and below the bone (round: less than
//                         long for a tail that is flattened, as a squirrel's is). The bone itself is shape.tail.length
//                         (m) from shape.tail.at, laid along shape.tail.hang (degrees from straight down; over 90 it
//                         runs back and up), its root shape.tail.width and .depth across (m)
//   shape.head.incisors   { long: mm, wide: mm }: how far the upper incisors show below the lip, and the pair's width
//   shape.head.whiskers   { long: mm, count: how many a side }: drawn in the close-up's level only
//   shape.cone            { long: mm, wide: mm }: a conifer's cone, which the forepaws hold to strip it (the rig shows
//                         it, and the scales that fall from it)
//   shape.ear.round       0 an ear shaped as a leaf (the elk's) .. 1 a round one
//   shape.unit            the builder's own small sizes (how far the skin is shared across a leg's joint, the caps
//                         at the trunk's ends, an ear's thickness) as a share of the elk's, for a small animal: a
//                         squirrel's are a tenth. A sheet without it has the elk's.
// The sheet's other numbers are metres, as the beast's are; these parts' own are millimetres, as the forms declared
// for them on 2026-11-16 are.

const D = Math.PI / 180;
const V = (x = 0, y = 0, z = 0) => new THREE.Vector3(x, y, z);
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));

// The bones these parts are held by, after the beast's own (life/beast.js BEAST_BONES): the tail's chain on from its
// first bone, the cone and the three scales that fall from it (posed from the root each frame). Every beast has
// them; an animal without the parts has nothing held by them.
export const TAIL = ['tail', 'tail2', 'tail3', 'tail4', 'tail5', 'tail6'];
export const RODENT_BONES = ['tail2', 'tail3', 'tail4', 'tail5', 'tail6', 'cone', 'flake1', 'flake2', 'flake3'];
export const RODENT_PARENT = { tail2: 'tail', tail3: 'tail2', tail4: 'tail3', tail5: 'tail4', tail6: 'tail5', cone: 'root', flake1: 'root', flake2: 'root', flake3: 'root' };

// Where these parts' paint is in the animal's one sheet (life/beast.js SHEET), in two places that its own cells leave
// empty: the brush of the tail (along it from the root, and round it from the belly side), and the small bits (the
// incisors, the whiskers, the cone, a cone's scale), four cells in a row.
export const BUSH = [0.710, 0.870, 1.000, 1.000];
export const BITS = [0.290, 0.750, 0.420, 0.895];
export const BIT = { teeth: 0, whiskers: 1, cone: 2, flake: 3 };
const bitCell = (k) => [BITS[0] + ((BITS[2] - BITS[0]) * k) / 4, BITS[1], BITS[0] + ((BITS[2] - BITS[0]) * (k + 1)) / 4, BITS[3]];
const inCell = (cell, u, v) => [cell[0] + (cell[2] - cell[0]) * u, 1 - (cell[1] + (cell[3] - cell[1]) * v)];

// the way the tail's bone runs in the bind pose, and the two ways square to it (its back, and across it)
function tailFrame(shape) {
  const dir = V(-Math.sin(shape.tail.hang * D), -Math.cos(shape.tail.hang * D), 0);
  return { dir, back: V(dir.y, -dir.x, 0), across: V(0, 0, 1) };
}

// Where each of these bones turns, in the bind pose: the tail's joints along its bone, a sixth of it apart; the cone
// and its scales at the poll (they are posed from the root each frame, and built where these say).
export function rodentPivots(shape, pivots) {
  const { dir } = tailFrame(shape), L = shape.tail.length;
  for (let k = 2; k <= 6; k += 1) pivots[`tail${k}`] = pivots.tail.clone().addScaledVector(dir, (L * (k - 1)) / 6);
  for (const name of ['cone', 'flake1', 'flake2', 'flake3']) pivots[name] = pivots.head.clone();
}

// ---- the bushy tail: one skin round the bone and its hair, from inside the rump to past the bone's tip, held by
// the tail's six bones, each ring shared with the next across a joint; near the root a share goes with the hips.
// `skin` is the builder's (life/beast.js Hide), B its bones' indices.
export function bushTail(skin, { shape, level, B, pivots, marks }) {
  const t = shape.tail, bush = t.bush, { dir, back, across } = tailFrame(shape), root = pivots.tail;
  const L = t.length, hair = bush.long / 1000, deep = bush.round / 1000, r0 = t.width / 2, d0 = t.depth / 2;
  const past = hair * 0.85;                                   // how far the brush runs on past the bone's tip
  const [sides, along, end] = [[12, 16, 5], [6, 6, 2], [4, 2, 1]][level];
  // rows: one inside the rump, one at the root, along the bone to its tip exactly, and round the brush's end
  const start = -Math.min(r0 * 1.2, L / 12), xs = [start];
  for (let j = 0; j <= along; j += 1) xs.push((L * j) / along);
  for (let j = 1; j <= end; j += 1) xs.push(L + past * Math.sin(((j / end) * Math.PI) / 2) * 0.98);
  const rootRow = 1, tipRow = 1 + along;
  // the brush's half width and half depth along the bone: the bone's own at the root, the hair grown out by a
  // quarter of the way along, and rounded off past the tip
  const grow = (x) => smooth(-0.02 * L, 0.3 * L, x);
  const size = (x, bone, hairs) => {
    if (x <= L) return bone * (1 - 0.55 * clamp(x / L, 0, 1)) + hairs * grow(x);
    const tip = bone * 0.45 + hairs, f = clamp((x - L) / past, 0, 1);
    return tip * Math.sqrt(Math.max(0, 1 - f * f)) + 0.0004;
  };
  // which bones hold a place along it: the segment's own, and the next across a joint (a twelfth of the bone either side)
  const seg = L / 6, blend = L / 12;
  const held = (x, out) => {
    const k = clamp(Math.floor(x / seg), 0, 5);
    out.b0 = B[TAIL[k]];
    const lo = k * seg, hi = (k + 1) * seg;
    if (k > 0 && x - lo < blend) { out.b1 = B[TAIL[k - 1]]; out.w1 = 0.5 * (1 - smooth(0, blend, x - lo)); }
    else if (k < 5 && hi - x < blend && x <= L) { out.b1 = B[TAIL[k + 1]]; out.w1 = 0.5 * (1 - smooth(0, blend, hi - x)); }
    // (near the root a share goes with the hips, so that the skin does not tear from the rump as the tail lifts)
    const hips = 0.7 * (1 - smooth(-0.02 * L, 0.07 * L, x));
    if (hips > 0) { out.b2 = B.hips; out.w2 = hips; out.w1 *= 1 - hips; }
  };
  const o = { y: 0, z: 0 };
  const base = skin.sheet(sides, xs.length - 1, (i, j, out) => {
    const x = xs[j], a = (i / sides) * 2, half = a <= 1 ? a : 2 - a;
    const w = size(x, r0, hair), d = size(x, d0, deep), th = half * Math.PI, c = -Math.cos(th), s = Math.sin(th);
    // the section: an oval, a little flattened on its back and belly
    o.y = Math.sign(c) * Math.abs(c) ** 0.9 * d; o.z = Math.abs(s) ** 0.9 * w;
    out.p.copy(root).addScaledVector(dir, x).addScaledVector(back, o.y).addScaledVector(across, a <= 1 ? o.z : -o.z);
    [out.u, out.v] = inCell(BUSH, clamp((x - start) / (L + past - start), 0, 1), 1 - a / 2);
    held(x, out);
  }, { wrap: true });
  const tip = root.clone().addScaledVector(dir, L + past);
  const c = skin.vertex3(tip.x, tip.y, tip.z, ...inCell(BUSH, 0.999, 0.5), B.tail6, B.tail6, 0, B.tail6, 0);
  skin.cap(c, base + (xs.length - 1) * (sides + 1), sides, false);
  marks.tailRoot = Array.from({ length: sides }, (_, i) => base + rootRow * (sides + 1) + i);
  marks.tailTip = Array.from({ length: sides }, (_, i) => base + tipRow * (sides + 1) + i);
  marks.bushTip = marks.tailTip.slice();          // (a bushy tail's own mark, so that what is measured below is measured for a rodent only)
}

// A tube along a list of points, its radius at each (a ring at each point, square to the way it runs), each vertex
// held by `bone`: for the teeth, the whiskers and the cone. Closed at its far end with a fan if `cap`.
function tube(skin, pts, radii, sides, bone, cell, { cap = true, squash = 1, twist = null } = {}) {
  const n = pts.length, dirAt = (j) => pts[Math.min(n - 1, j + 1)].clone().sub(pts[Math.max(0, j - 1)]).normalize();
  const ref = twist || V(0, 1, 0);
  const base = skin.sheet(sides, n - 1, (i, j, out) => {
    const d = dirAt(j), side = (Math.abs(d.dot(ref)) < 0.95 ? ref : V(1, 0, 0)).clone().cross(d).normalize(), up = d.clone().cross(side).normalize();
    const th = (i / sides) * Math.PI * 2, r = radii[j];
    out.p.copy(pts[j]).addScaledVector(side, Math.cos(th) * r).addScaledVector(up, Math.sin(th) * r * squash);
    [out.u, out.v] = inCell(cell, j / (n - 1), i / sides);
    out.b0 = bone;
  }, { wrap: true });
  if (cap) {
    const e = pts[n - 1].clone().addScaledVector(dirAt(n - 1), radii[n - 1] * 0.6);
    const c = skin.vertex3(e.x, e.y, e.z, ...inCell(cell, 0.99, 0.5), bone, bone, 0, bone, 0);
    skin.cap(c, base + (n - 1) * (sides + 1), sides, false);
  }
  return base;
}

// ---- the head's small parts: the incisors (the upper pair on the head, the lower on the jaw) and the whiskers
// (the close-up's level only). `onHead(s, up, side)` is the builder's: a place by the head's own line.
export function rodentHead(skin, { shape, level, B, onHead, hd, hn, hup, hdown, hhalf, hsS }) {
  const head = shape.head, end = hsS[hsS.length - 1], first = hsS[0], long = end - first;
  if (head.incisors && level === 0) {
    const tooth = head.incisors.long / 1000, wide = head.incisors.wide / 1000, cell = bitCell(BIT.teeth);
    // the upper pair from under the nose, down and a little back; the lower from the lip of the jaw, up and forward
    for (const z of [-1, 1]) {
      const at = onHead(end - 0.12 * long, -hdown(end - 0.12 * long) * 0.55, z * wide * 0.27);
      const down = hn.clone().multiplyScalar(-1).addScaledVector(hd, -0.25).normalize();
      tube(skin, [at, at.clone().addScaledVector(down, tooth * 0.5), at.clone().addScaledVector(down, tooth)], [wide * 0.22, wide * 0.22, wide * 0.2], 4, B.head, cell, { squash: 0.7, twist: hd });
      const low = onHead(end - 0.2 * long, -hdown(end - 0.2 * long) * 0.85, z * wide * 0.24);
      const up = hn.clone().addScaledVector(hd, 0.45).normalize();
      tube(skin, [low, low.clone().addScaledVector(up, tooth * 0.4), low.clone().addScaledVector(up, tooth * 0.75)], [wide * 0.18, wide * 0.18, wide * 0.16], 4, B.jaw, cell, { squash: 0.7, twist: hd });
    }
  }
  if (head.whiskers && level === 0) {
    const w = head.whiskers, len = w.long / 1000, cell = bitCell(BIT.whiskers), r = Math.max(0.00025, len * 0.008);
    let seed = 7;
    const rand = () => { seed = (seed * 16807) % 2147483647; return seed / 2147483647; };
    for (const z of [-1, 1]) for (let k = 0; k < w.count; k += 1) {
      // from the pad on the side of the muzzle, out, back and fanned up and down
      const s = end - long * (0.1 + 0.16 * rand()), u = (rand() - 0.4) * 0.6, at = onHead(s, hup(s) * u - hdown(s) * 0.25, z * hhalf(s) * 0.9);
      const fan = (k / Math.max(1, w.count - 1) - 0.5) * 1.1, l = len * (0.55 + 0.45 * rand());
      const way = V(0, 0, z).addScaledVector(hd, -0.9).addScaledVector(hn, fan).normalize();
      const pts = [], radii = [];
      for (let j = 0; j <= 4; j += 1) {
        const f = j / 4;
        pts.push(at.clone().addScaledVector(way, l * f).addScaledVector(hn, -l * 0.18 * f * f));
        radii.push(r * (1 - 0.85 * f));
      }
      tube(skin, pts, radii, 3, B.head, cell, { cap: false, twist: hn });
    }
  }
}

// ---- the cone, and three of its scales: built at the cone's bone (the rig puts it in the forepaws, turned across
// the mouth, and lets the scales fall from it). The cone's axis is +z in the bind pose.
export function rodentCone(skin, { shape, level, B, pivots }) {
  if (!shape.cone || level > 0) return;
  const long = shape.cone.long / 1000, wide = shape.cone.wide / 1000, at = pivots.cone, cell = bitCell(BIT.cone);
  const rows = 9, sides = 8, pts = [], radii = [];
  for (let j = 0; j <= rows; j += 1) {
    const f = j / rows, x = (f - 0.5) * long;
    pts.push(at.clone().add(V(0, 0, x)));
    // fattest a little below the middle, round at the base and drawn to a point at the tip
    radii.push(Math.max(0.0005, (wide / 2) * Math.sin(Math.PI * (0.06 + 0.92 * f)) ** 0.7 * (1 - 0.25 * f)));
  }
  tube(skin, pts, radii, sides, B.cone, cell, { twist: V(0, 1, 0) });
  // the scales: each a flat, rounded flake, both of its faces drawn
  const scale = bitCell(BIT.flake);
  for (const name of ['flake1', 'flake2', 'flake3']) {
    const p = pivots[name], w = wide * 0.32, h = wide * 0.3, bone = B[name];
    const corners = [[-w / 2, 0], [w / 2, 0], [w * 0.4, h * 0.8], [0, h], [-w * 0.4, h * 0.8]];
    for (const face of [1, -1]) {
      const c = skin.vertex3(p.x, p.y + h * 0.45, p.z + face * 0.0002, ...inCell(scale, 0.5, 0.5), bone, bone, 0, bone, 0);
      const ring = corners.map(([x, y]) => skin.vertex3(p.x + x, p.y + y, p.z + face * 0.0002, ...inCell(scale, 0.5 + x / w, 1 - y / h), bone, bone, 0, bone, 0));
      const from = skin.index.length;
      for (let k = 0; k < ring.length; k += 1) { const a = ring[k], b = ring[(k + 1) % ring.length]; if (face > 0) skin.index.push(c, a, b); else skin.index.push(c, b, a); }
      skin.shade(from, skin.index.length);
    }
  }
}

// The ear's half width a share `v` of the way up it: the elk's leaf (`leaf`, as life/beast.js has it), or, as far
// as `round` says, a round ear: broad at its base and rounded over the top.
export function earWidth(ear, v, leaf) {
  const round = ear.round || 0;
  if (!round) return leaf;
  const disc = Math.sqrt(Math.max(0, 1 - ((v - 0.42) / 0.6) ** 2)) * (1 - 0.15 * v) * ear.width * 0.5;
  return leaf + (disc - leaf) * round;
}

// ---- the lengths taken of a small mammal, on the built mesh (metres): the tail from its root to its bone's tip
// (the hair past it not counted, as a tail is measured), the hind foot from the back of the heel to the end of its
// longest toe and claw, and the ear from its base (where the notch is) to its tip. Each is there only for a body
// built with the parts it needs. (Head and body is the beast's own `length`, nose to poll to withers to rump.)
export function measureRodent(built, mark) {
  const m = built.marks, out = {}, a = V(), b = V();
  // (only for a beast with a bushy tail: other parts mark a tail's root and tip too, and measure it their own way)
  if (!m.bushTip) return out;
  if (m.tailRoot && m.tailTip) out.tail = mark(m.tailRoot, a).distanceTo(mark(m.tailTip, b));
  if (m.earBase && m.earTip) out.ear = mark(m.earBase, a).distanceTo(mark(m.earTip, b));
  // (along the sole: the heel is the back of the ring round the hind leg's ankle, and the foot is flat in the bind pose)
  if (m.tailRoot && m.RHjoints && m.RHtoe) { mark([m.RHjoints[2][0]], a).setY(0); mark(m.RHtoe, b).setY(0); out.hindFoot = a.distanceTo(b); }
  return out;
}
