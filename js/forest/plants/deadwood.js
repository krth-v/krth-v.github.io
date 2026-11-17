import * as THREE from 'three';
import { Mesh } from './build.js';
import { mulberry32 } from '../world/layout.js';

// Dead wood: fallen logs, stumps and standing snags. All solid, all mossy.
//
// Wood does not sway, so its vertices use the wind attribute for something else:
// y is 1 on split wood and 0 on bark, and x is how deep the vertex sits below the
// rim of a broken end, as a share of the trunk's radius there (1 and deeper: no light).
//
// Each detail level is drawn turning into the next (Mesh in build.js): the trunk settles onto the
// coarser trunk, and every ring of a broken end onto the same ring of the coarser end. For that the
// levels have to be the same thing in fewer vertices: the same stubs at the same places, the same
// splinter stumps in a snapped end.

// A small flat end of split wood, facing along `direction`: the tip of a broken limb.
// Like every vertex of split wood, its uv is where it lies across the end, in metres.
// Returns its ring of vertices, for settling onto the same end in the next level.
function capped(mesh, centre, direction, radius, radial) {
  const side = new THREE.Vector3().crossVectors(direction, new THREE.Vector3(0, 0, 1));
  if (side.lengthSq() < 0.01) side.set(1, 0, 0);
  side.normalize();
  const up = new THREE.Vector3().crossVectors(side, direction).normalize();
  const base = mesh.vertexCount;
  mesh.position.push(centre.x, centre.y, centre.z); mesh.root.push(centre.x, centre.y, centre.z);
  mesh.normal.push(direction.x, direction.y, direction.z); mesh.uv.push(0, 0); mesh.wind.push(0, 1);
  for (let i = 0; i <= radial; i += 1) {
    const th = (i / radial) * Math.PI * 2, c = Math.cos(th), s = Math.sin(th);
    const x = centre.x + (side.x * c + up.x * s) * radius, y = centre.y + (side.y * c + up.y * s) * radius, z = centre.z + (side.z * c + up.z * s) * radius;
    mesh.position.push(x, y, z); mesh.root.push(x, y, z);
    mesh.normal.push(direction.x, direction.y, direction.z); mesh.uv.push(c * radius, s * radius); mesh.wind.push(0, 1);
    if (i < radial) mesh.index.push(base, base + 2 + i, base + 1 + i);      // wound to face along `direction`: bark is drawn front-side only
  }
  return { start: base + 1, radial };
}

// The broken end of a trunk. The tube's own end ring is torn into splinters along the grain, and
// inside that rim split wood falls away. There are two kinds of end:
//   a shell (`rough` 0), where the end has rotted hollow: with `ledge` 1 the shell's broken top is
//   a ring of wood riding just under the rim, and inside it the wall drops to a deep bowl;
//   a snapped end (`rough` above 0), where the break is a rough field of splinter stumps: six
//   points and a low one, each at its own place and height, joined to a ring just inside the rim.
//   The faces round each point make a stump of their own, and nothing runs from the rim to one middle.
//
// `ring` is the index of the end ring's first vertex, `axis` points out of the end, and `start`
// says the ring is the tube's first (its faces are then wound the other way).
//   tear    how far the rim is torn along the grain, as a share of the radius
//   lean    how much of that height is one tongue, on the side that held on longest
//   spiky   how long the longest single splinters are
//   sliver  one splinter beside the tongue that stands this much longer still
//   taper   how far the splinters lean in towards their tips: 1 where a trunk snapped, little
//           where an end has rotted to a shell, which stands at the log's own girth
//   chunk   how deep the bites are where pieces of the rim came away: seen end-on, the outline
//   hollow  how deep the wood falls away, as a share of the radius
//   wall    how far out the first ring of the break lies, as a share of the rim's own radius
//   ledge   how far up towards the rim that first ring rides: 1 on a shell, whose wood has thickness;
//           0 lets it fall straight away from the rim
//   bore    a shell's second ring, likewise: the hollow's own width (half of `wall` unless given)
//   rough   how unevenly a snapped end broke; 0 makes the end a shell
//   tile    the tube's own: its bark runs on along a splinter instead of being stretched over it
// Returns the end's rings of vertices and its single ones, for settling each onto the same one of the next level's end.
// What was tried before: a flat lid with its own outline stood proud of the bark and read as a rock
// set on the end; one smooth dish read as a sawn disc with the sun in it and as a pipe's mouth
// without; rings of vertices round one middle vertex made a pinwheel of wedges, however the rings
// were set, and so did paint laid in stripes from the rim to the middle.
function broken(mesh, ring, radial, centre, axis, radius, { start = false, tear = 0.6, hollow = 0.7, lean = 0.5, spiky = 0.3, sliver = 0, taper = 1, chunk = 0, wall = 0.55, ledge = 0, bore = 0, rough = 0, tile = 0, seed = 1 } = {}) {
  const r = mulberry32(seed), held = r() * Math.PI * 2, phase = r() * Math.PI * 2, teeth = [];
  // What is random about the rim is drawn once, at a resolution no detail level exceeds. A level takes the
  // mean of what falls to each of its vertices for what should stay smooth, and the one value nearest its
  // vertex for what should stay ragged (a splinter's length, a bite out of the rim): the mean of a ragged
  // rim is a smooth one, and a coarse level's butt was a pipe's mouth. Drawn per vertex instead, the coarse
  // level of a log had a different break from the fine one.
  const FINE = 30, long = [], deep = [], thin = [], jag = [], chip = [];
  for (let k = 0; k < FINE; k += 1) { long.push(r() * r()); deep.push(r()); thin.push(r()); }
  for (let k = 0; k < FINE; k += 1) { jag.push(r()); chip.push(r()); }
  const wrap = (k) => ((k % FINE) + FINE) % FINE;
  const share = (table, i) => {
    const from = Math.ceil(((i - 0.5) / radial) * FINE), to = ((i + 0.5) / radial) * FINE;
    let sum = 0, n = 0;
    for (let k = from; k < to; k += 1) { sum += table[wrap(k)]; n += 1; }
    return n ? sum / n : table[wrap(Math.round((i / radial) * FINE))];
  };
  const pick = (table, i) => table[wrap(Math.round((i / radial) * FINE))];
  // The side that held on longest stands highest, and beside it one splinter longer still; round the rest of
  // the rim the break rises and falls in a few broad tongues, and every splinter has its own length.
  const tongueAt = (th) => Math.pow(0.5 + 0.5 * Math.cos(th - held), 1.5);
  const pinch = [];
  for (let i = 0; i < radial; i += 1) {
    const th = (i / radial) * Math.PI * 2, broad = 0.5 + 0.5 * Math.sin(th * 3 + phase);
    teeth.push(radius * tear * (0.08 + 0.9 * lean * tongueAt(th) + 0.55 * (1 - lean) * broad + spiky * pick(long, i))
      + radius * sliver * Math.pow(0.5 + 0.5 * Math.cos(th - held - 0.45), 24));
    // a splinter narrows towards its tip, the long ones most, and here and there a piece of the rim is gone
    pinch.push(taper * Math.min(0.42, 0.04 + 0.34 * (teeth[i] / (radius * tear * (1 + spiky))) * (0.5 + share(thin, i)))
      + chunk * 0.5 * Math.pow(pick(chip, i), 2.5));
  }

  // Split wood is painted by where it lies across the end, in metres: mottled across a face, and drawn out
  // into streaks down a wall, where that place hardly changes (BARK_FRAG in light/materials.js).
  const e1 = new THREE.Vector3().crossVectors(axis, Math.abs(axis.y) > 0.9 ? new THREE.Vector3(1, 0, 0) : new THREE.Vector3(0, 1, 0)).normalize();
  const e2 = new THREE.Vector3().crossVectors(axis, e1);
  // A vertex of the break: `v` from the axis, `h` along it from the end's own plane (below it is negative).
  // Its depth, as a share of the radius, is what shades it.
  const put = (v, h) => {
    const x = centre.x + v.x + axis.x * h, y = centre.y + v.y + axis.y * h, z = centre.z + v.z + axis.z * h;
    mesh.position.push(x, y, z); mesh.root.push(x, y, z);
    mesh.normal.push(axis.x, axis.y, axis.z); mesh.uv.push(v.dot(e1), v.dot(e2));
    mesh.wind.push(Math.min(1, Math.max(0, (-1.1 * h) / radius)), 1);
    return mesh.vertexCount - 1;
  };

  // Tear the tube's own ring, out along the grain and in towards the axis, and start the split wood from a
  // copy of it: the same place as the bark's edge.
  const p = new THREE.Vector3(), out = new THREE.Vector3(), outs = [];
  const rim = mesh.vertexCount;
  for (let i = 0; i <= radial; i += 1) {
    const o = (ring + i) * 3, k = i % radial, tooth = teeth[k];
    p.set(mesh.position[o], mesh.position[o + 1], mesh.position[o + 2]);
    out.subVectors(p, centre);
    out.addScaledVector(axis, -out.dot(axis));               // from the axis straight out to the rim
    p.addScaledVector(axis, tooth).addScaledVector(out, -pinch[k]);
    mesh.position[o] = p.x; mesh.position[o + 1] = p.y; mesh.position[o + 2] = p.z;
    mesh.root[o] = p.x; mesh.root[o + 1] = p.y; mesh.root[o + 2] = p.z;
    if (tile) mesh.uv[(ring + i) * 2 + 1] += (start ? -tooth : tooth) / tile;
    outs.push(out.clone().multiplyScalar(1 - pinch[k]));
    put(outs[i], tooth);
    mesh.wind[mesh.wind.length - 2] = 0;                     // the rim itself is not deep, however long its tooth
  }
  // from the axis towards the rim at any angle, as a share of the rim's own radius there
  const towards = (angle, rho, target) => {
    const u = ((((angle / (Math.PI * 2)) % 1) + 1) % 1) * radial, k = Math.floor(u) % radial;
    return target.copy(outs[k]).lerp(outs[k + 1], u - Math.floor(u)).multiplyScalar(rho);
  };
  // bark is drawn front-side only: three vertices given anticlockwise round the ring's own turn are wound to be seen from outside the end
  const face = (a, b, c) => (start ? mesh.index.push(a, b, c) : mesh.index.push(a, c, b));

  // The first ring of the break, between the rim's vertices. On a shell it rides just under the rim; where
  // the trunk snapped it lies lower, so the rim's splinters stand clear of the break.
  const first = mesh.vertexCount;
  for (let i = 0; i <= radial; i += 1) {
    const k = i % radial, next = (i + 1) % radial, tooth = 0.5 * (teeth[k] + teeth[next]);
    out.addVectors(outs[k], outs[next]).multiplyScalar(0.5).multiplyScalar(wall * (rough ? 0.9 + 0.2 * share(thin, k + 0.5) : 1));
    const riding = tooth - radius * 0.05 * (1 + 2 * share(jag, k + 0.5));
    const dropped = rough ? tooth * 0.45 - radius * (0.06 + 0.12 * share(jag, k + 0.5)) : tooth * 0.1 - hollow * radius * (0.35 + 0.3 * share(deep, k + 0.5));
    put(out, dropped + (riding - dropped) * ledge);
  }
  for (let i = 0; i < radial; i += 1) { face(rim + i, rim + i + 1, first + i); face(first + i, rim + i + 1, first + i + 1); }

  if (!rough) {
    // A shell: the wall drops from the ledge to a second ring, in line with the rim's vertices again, and on to the bottom.
    const second = mesh.vertexCount;
    for (let i = 0; i <= radial; i += 1) {
      const k = i % radial;
      put(out.copy(outs[k]).multiplyScalar(bore || 0.5 * wall), teeth[k] * 0.05 - hollow * radius * (0.7 + 0.2 * share(deep, k)));
    }
    const middle = put(out.set(0, 0, 0), -hollow * radius);
    for (let i = 0; i < radial; i += 1) {
      face(first + i, first + i + 1, second + i + 1);
      face(first + i, second + i + 1, second + i);
      face(second + i, second + i + 1, middle);
    }
    return { rings: [{ start: rim, radial }, { start: first, radial, shift: 0.5 }, { start: second, radial }], single: [middle] };
  }

  // A snapped end: six stumps of splinters and one low place, the same at every detail level. Each stands
  // at its own height; towards the tongue that held, the whole break climbs.
  const q = mulberry32(seed + 77), K = 6, turn = q() * Math.PI * 2, stumps = [], angles = [];
  for (let j = 0; j < K; j += 1) {
    const angle = turn + ((j + 0.5 + (q() - 0.5) * 0.4) / K) * Math.PI * 2, rho = 0.3 + 0.28 * q();
    const h = radius * tear * 0.9 * lean * tongueAt(angle) * 0.45 - hollow * radius * (0.2 + 0.5 * q()) + rough * radius * 1.6 * (q() - 0.35);
    angles.push(angle);
    stumps.push(put(towards(angle, rho, out), h));
  }
  const low = put(towards(q() * Math.PI * 2, 0.18 * q(), out), -hollow * radius * (0.55 + 0.35 * q()));
  // every vertex of the first ring is joined to the stump nearest it by angle; where two neighbours take different stumps, a face joins those
  const nearest = (angle) => {
    let best = 0, least = Infinity;
    for (let j = 0; j < K; j += 1) { const d = Math.abs(Math.atan2(Math.sin(angle - angles[j]), Math.cos(angle - angles[j]))); if (d < least) { least = d; best = j; } }
    return best;
  };
  let own = nearest((0.5 / radial) * Math.PI * 2);
  for (let i = 0; i < radial; i += 1) {
    face(first + i, first + i + 1, stumps[own]);
    const next = nearest(((i + 1.5) / radial) * Math.PI * 2);
    for (let steps = (next - own + K) % K; steps > 0; steps -= 1) {
      const after = (own + 1) % K;
      face(first + i + 1, stumps[after], stumps[own]);
      own = after;
    }
  }
  for (let j = 0; j < K; j += 1) face(stumps[j], stumps[(j + 1) % K], low);
  // The stumps and the low place are the same vertices at every level, but not quite at the same places:
  // each is set by the rim round it, and a coarser rim has fewer bites out of it.
  return { rings: [{ start: rim, radial }, { start: first, radial, shift: 0.5 }], single: [...stumps, low] };
}

// A trunk that has stopped growing: uneven in girth, swollen at the butt
// (`swell`), carrying the stubs of broken limbs. `lying` lays it along x,
// resting on the ground with its butt at -x; otherwise it stands on y.
// `ends` is how each broken end is torn: [butt, top] for a log, [top] for what stands.
// For driftwood (buildDrift), which the old terrace's dead wood does not ask for and is not changed by: `roots`
// is how many roots stand out round the butt, a root wad; `bare` marks the whole of it as wood without bark
// (0.75: BARK_FRAG under BARE paints it all as weathered wood, and lights only its broken ends face by face);
// `bed` is how high its middle line lies, as a share of its radius (a log rests on the ground, a drift log has
// settled into the stones); `tile` is how far along it one turn of the paint runs.
function trunkLike({ length, radius, top, lying, flare, levels, bend = 0.4, seed, stubs = 0, swell = 0, rough = 1, ends, roots = 0, bare = 0, bed = 0.72, tile = 2.4, hangFrom = 0 }) {
  const finest = levels[0][1];
  const built = levels.map(([radial, rings], li) => {
    const mesh = new Mesh(), r = mulberry32(seed);
    const wobble = [r() - 0.5, r() - 0.5];
    // the centre line and the girth, a share t of the way along
    const centre = (t) => { const d = length * t, sway = bend * Math.sin(Math.PI * t);
      return lying ? new THREE.Vector3(d - length / 2, radius * bed + sway * wobble[0] * 0.4, sway * wobble[1]) : new THREE.Vector3(sway * wobble[0], d, sway * wobble[1]); };
    const girth = (t) => (radius + (top - radius) * t) * (1 + 0.06 * Math.sin(t * 17 + seed)) * (1 + swell * Math.exp(-(length * t) / (radius * 1.4)));
    const at = [], points = [], radii = [];
    for (let j = 0; j <= rings; j += 1) { at.push(j / rings); points.push(centre(j / rings)); radii.push(girth(j / rings)); }
    const first = mesh.tube(points, radii, radial, { around: Math.max(1, Math.round((2 * Math.PI * radius) / 1.2)), tile, lobes: 5,
      flare: flare ? (t) => flare * Math.exp(-(t * length) / (radius * 1.6)) : null,
      shape: (t, th) => 1 + rough * (0.06 * Math.sin(th * 3 + t * 9 + seed) + 0.035 * Math.sin(th * 5 - t * 23)) });
    const butt = new THREE.Vector3().subVectors(points[0], points[1]).normalize();
    const tip = new THREE.Vector3().subVectors(points[rings], points[rings - 1]).normalize();
    const rings_ = [], single = [];                           // every ring of vertices outside the trunk's own tube, and every vertex that has a twin in the next level
    const end = (made) => { rings_.push(...made.rings); single.push(...made.single); };
    if (lying) end(broken(mesh, first, radial, points[0], butt, radii[0], { start: true, tile, seed: seed + 11, ...ends[0] }));
    end(broken(mesh, first + rings * (radial + 1), radial, points[rings], tip, radii[rings], { tile, seed: seed + 12, ...ends[ends.length - 1] }));

    // Broken limb stubs: up and outwards from a log, out and a little up from a snag. Each stands where it
    // does on the finest level, at one of that level's rings. Placed at a ring of its own level, a stub
    // jumped more than a metre along the trunk as the levels swapped.
    const sr = mulberry32(seed + 50), sides = li === 0 ? 6 : 4, tubes = [];
    for (let i = 0; i < stubs; i += 1) {
      const t = Math.min(finest - 1, Math.max(1, Math.round((0.28 + 0.64 * (i + sr() * 0.7) / stubs) * finest))) / finest;
      const a = lying ? (sr() - 0.5) * 2.2 : sr() * 6.283;
      const dir = (lying ? new THREE.Vector3((sr() - 0.5) * 0.6, Math.cos(a), Math.sin(a)) : new THREE.Vector3(Math.cos(a), 0.25 + sr() * 0.4, Math.sin(a))).normalize();
      const reach = 0.35 + sr() * 0.9, thick = (0.05 + sr() * 0.05) * (radius / 0.6);
      const pts = [0, 0.55, 1].map((u) => centre(t).addScaledVector(dir, girth(t) * 0.8 + reach * u));
      tubes.push({ base: mesh.tube(pts, [thick, thick * 0.8, thick * 0.5], sides, { around: 1, tile: 1.5 }), radial: sides, at: [0, 1, 2] });
      const cap = capped(mesh, pts[2], dir, thick * 0.5, sides);
      rings_.push(cap);
      single.push(cap.start - 1);                             // the cap's middle
    }
    // A root wad: the roots a flood left on a trunk it tore out, standing out all round the butt and back from
    // it a little, each crooked, thick where it leaves the trunk and broken off short. From random numbers of
    // their own, the same at every level.
    if (roots) {
      const rr = mulberry32(seed + 90);
      for (let i = 0; i < roots; i += 1) {
        const a = ((i + 0.2 + 0.6 * rr()) / roots) * Math.PI * 2, back = 0.05 + 0.45 * rr();
        const dir = new THREE.Vector3(-back, Math.cos(a), Math.sin(a)).normalize(), across = new THREE.Vector3(0, -Math.sin(a), Math.cos(a));
        // (thick, short and blunt: drawn thin and to a point, a wad was a ring of thorns)
        const reach = (0.4 + 0.65 * rr()) * Math.sqrt(radius / 0.4), thick = (0.42 + 0.2 * rr()) * radius, crook = (rr() - 0.5) * 0.9;
        const pts = [0, 0.5, 1].map((u) => centre(0.03).addScaledVector(dir, girth(0.03) * 0.35 + reach * u).addScaledVector(across, crook * reach * u * u));
        tubes.push({ base: mesh.tube(pts, [thick, thick * 0.78, thick * 0.55], sides, { around: 1, tile: 1.5 }), radial: sides, at: [0, 1, 2] });
        const cap = capped(mesh, pts[2], new THREE.Vector3().subVectors(pts[2], pts[1]).normalize(), thick * 0.55, sides);
        rings_.push(cap);
        single.push(cap.start - 1);
      }
    }
    if (bare) for (let v = 0; v < mesh.vertexCount; v += 1) if (mesh.wind[v * 2 + 1] === 0) mesh.wind[v * 2 + 1] = bare;
    return { mesh, trunk: { base: first, radial, at }, tubes, rings: rings_, single };
  });
  // each level's wood settles onto the next level's
  built.forEach((level, li) => {
    const next = built[li + 1];
    if (!next) return;
    level.mesh.settle(level.trunk, next.mesh, next.trunk);
    level.tubes.forEach((tube, i) => level.mesh.settle(tube, next.mesh, next.tubes[i]));
    level.rings.forEach((ring, i) => level.mesh.ring(ring, next.mesh, next.rings[i]));
    level.single.forEach((vertex, i) => { for (let k = 0; k < 3; k += 1) level.mesh.root[vertex * 3 + k] = next.mesh.position[next.single[i] * 3 + k]; });
  });
  // the finest level's trunk and stubs as built, for what stands on them (life/perch.js)
  const out = built.map((level) => level.mesh.geometry()), near = built[0];
  out.perch = { position: near.mesh.position, trunk: { base: near.trunk.base, radial: near.trunk.radial, rings: near.trunk.at.length },
    stubs: near.tubes.map((tube) => ({ base: tube.base, radial: tube.radial, rings: tube.at.length })) };
  // hanging points: two on each stub's underside, along its middle line (own positions read after the meshes are built)
  out.hang = hangUnder(near.mesh, near.tubes, hangFrom);
  return out;
}
// the middle line of a stub's tube at 0.5 and 0.8 of the way along its last two rings (ring 1 and ring 2 of three)
function hangUnder(mesh, tubes, take) {
  const p = mesh.position, out = [];
  if (!take) return out;
  const ring = (tube, k) => { const c = [0, 0, 0], n = tube.radial; for (let v = 0; v < n; v += 1) for (let a = 0; a < 3; a += 1) c[a] += p[(tube.base + k * (n + 1) + v) * 3 + a] / n; return c; };
  tubes.slice(0, take).forEach((tube) => { const m = ring(tube, 1), e = ring(tube, 2);
    out.push(m, m.map((x, a) => x + (e[a] - x) * 0.6)); });
  return out;
}
// what every builder hands back at its top level, besides the meshes: the same perch as solid.perch, hanging points, no crown
const common = (made, form) => { made.solid.perch.form = form; return { ...made, perch: made.solid.perch, hang: made.solid.hang, crown: null }; };

// `reach` is how far the largest of a kind extends sideways from its root, for culling (the instancer does not
// scale it): half a lying log's length, 8 m, at the largest scale the layout gives a log, 1.2, and its torn ends
// beyond that, which is 11 m.
// A detail level is chosen by the distance to a plant's root, and a log's root is its middle: its near end can
// be nine metres closer. So a log keeps its near level to 40 m, which leaves that end at least 30 m away.
// A log that came down long ago: the butt has rotted to a hollow shell, the far end snapped where it hit.
// The shell's rim is ragged by a third of the log's girth and more, one side of it stands on, and its broken
// top is a ring of wood round the dark of the hollow. With a rim torn only a hand's breadth and leaning in,
// the butt was a chamfered pipe from the side; with a wall sloping in from the rim, a trumpet's bell; with
// no thickness to the shell, a dark disc when seen end-on in the shade.
const buildLog0 = () => ({ solid: trunkLike({ length: 16, radius: 0.6, top: 0.4, lying: true, levels: [[26, 18], [16, 6]], bend: 0.15, seed: 3, stubs: 4, swell: 0.3,
  ends: [{ tear: 0.85, hollow: 0.95, lean: 0.5, spiky: 0.75, taper: 0.2, wall: 0.76, ledge: 1, bore: 0.66 }, { tear: 0.9, hollow: 0.5, lean: 0.55, spiky: 0.8, sliver: 0.7, chunk: 0.6, wall: 0.8, rough: 0.5 }] }), height: 2, reach: 11, lod: [40], handWood: [0.5], max: 140, gone: 190 });
// Nothing was ever felled here: a stump is what is left of a trunk that snapped. It stands about as
// tall as the walker, nearly as wide at the top as at the foot, and ends in a crown of splinters, the
// side that held on longest a little higher. Tapered to one tall point it read as a standing stone.
const buildStump0 = () => ({ solid: trunkLike({ length: 2.2, radius: 0.72, top: 0.64, flare: 0.42, levels: [[28, 8], [16, 4]], bend: 0.1, seed: 5, rough: 1.2,
  ends: [{ tear: 0.95, hollow: 0.55, lean: 0.4, spiky: 0.8, sliver: 0.5, chunk: 0.4, wall: 0.8, rough: 0.4 }] }), height: 3.2, lod: [26], handWood: [0.5], max: 90, gone: 130 });
// Driftwood on the river's bars: a trunk the river tore out and carried, its bark gone and its wood weathered
// pale, its limbs worn down to stubs, its root wad still on it; settled a little into the stones. It lies as the
// ground under it slopes (`lies`: the instancer shears it), as the stones do. Its ends are worn more than torn.
// (The sources an agent read give drift on these rivers as whole conifer trunks with their root wads, weathered
// to ivory, lying with the wad upstream; its sizes here are the agent's.)
// Neither end is a hollow: a `hollow` below nothing stands the break's middle out past its rim, a worn knob.
// (Its far end was first a dish, and looked at from that end in the shade the log was a pipe.)
const buildDrift0 = () => ({ solid: trunkLike({ length: 12, radius: 0.4, top: 0.2, lying: true, levels: [[16, 12], [8, 5]], bend: 0.3, seed: 21, stubs: 3, swell: 0.8, rough: 0.7,
  roots: 9, bare: 0.75, bed: 0.5, tile: 9,
  ends: [{ tear: 0.25, hollow: -0.3, lean: 0.3, spiky: 0.2, taper: 0.5, wall: 0.7, rough: 0.2 }, { tear: 0.7, hollow: -0.45, lean: 0.6, spiky: 0.5, taper: 1, chunk: 0.3, wall: 0.7, rough: 0.25 }] }),
  height: 2.4, reach: 9.5, lod: [34], handWood: [0.5], max: 170, gone: 220, lies: true });
const buildSnag0 = () => ({ solid: trunkLike({ length: 19, radius: 0.6, top: 0.3, flare: 0.45, levels: [[30, 22], [14, 8], [6, 3]], bend: 0.5, seed: 9, stubs: 5, hangFrom: 5,
  ends: [{ tear: 3.0, hollow: 0.6, lean: 0.85, chunk: 0.3, wall: 0.8, rough: 0.4 }] }), height: 20, lod: [36, 80], handWood: [0.5, 0.5], max: 260, gone: 330 });

export const buildLog = () => common(buildLog0(), 'lying');
export const buildStump = () => common(buildStump0(), 'stump');
export const buildDrift = () => common(buildDrift0(), 'lying');
export const buildSnag = () => common(buildSnag0(), 'standing');
