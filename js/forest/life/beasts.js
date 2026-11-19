import * as THREE from 'three';
import { mulberry32 } from '../world/layout.js';
import { bodyOf, headingOf } from './bodies.js';

// What the big animals that walk do: the Roosevelt elk first. A herd grazes, rests, watches the walker, moves off
// from them and runs from them; it walks in from out of the walker's sight and off out of it. A behaviour moves an
// animal's frame (`at`: the ground under its middle; `q`: +x the way it faces, pitched to the ground's slope along
// it), says how it holds itself (`want`, a pose for life/beast.js) and what it is doing (`doing`, for the card).
//
// From the sources read (kept in .local-assets/forest/research/elk-2026-11-16.json and animals-2-2026-11-16.json):
// cows go about in herds of about twenty in the Olympic valleys, bulls alone or in small groups (NPS Olympic); in
// the middle of May no calf is on foot yet (calving is late May to early June: FEIS, WTA); elk are active by day
// and by night, most at dawn and dusk (FEIS); a herd is led by a mature cow, the young at its rear (Mammals of
// Texas; Altmann 1956); a cow unsure of an intruder gives a short snort or an explosive bark, which brings the
// whole herd to attention (Altmann 1956; Mammals of Texas); a herd of cows that scented a person: "the leading cow
// turned and approached the observer slowly in a high-stepping gait", while the rest left the other way "in
// rapidly moving single file" (Altmann 1956, as read); elk in a national park can be conditioned to people (FEIS),
// and the park asks walkers to keep thirty metres off (NPS Olympic); a startled elk may gallop at top speed for
// about a kilometre (Mammals of Texas).
// The agent's own, found in nothing read: every distance at which a herd watches, moves off or runs; every pace
// and stride (no gait speed was found); how long a herd grazes and rests; how it lies down and gets up.

const UP = new THREE.Vector3(0, 1, 0);
// what a herd says it is doing as it walks in file to somewhere else (life/beasts.js `startTrek`)
const TREKS = { drink: 'walking in file down to the creek to drink', grass: 'walking in file out to the open grass', hill: 'walking in file up the hill', wood: 'walking in file into the deep wood' };
// Is there water (the creek) within 14 m of a place a herd can be: eight ways, every two metres; asked once a place
// and kept (the places are the habitat's own, read once a visit's valley: habitat.grazing)
const _wet = new WeakMap();
function wet(p, world) {
  let got = _wet.get(p);
  if (got !== undefined) return got;
  got = false;
  for (let k = 0; k < 8 && !got; k += 1) for (let d = 2; d <= 14; d += 2) if (world.ground(p.x + Math.cos(k * 0.785) * d, p.z + Math.sin(k * 0.785) * d) === 'water') { got = true; break; }
  _wet.set(p, got);
  return got;
}
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const _v = new THREE.Vector3(), _q = new THREE.Quaternion();
const wrap = (a) => Math.atan2(Math.sin(a), Math.cos(a));

// How far apart two bodies are, seen from above, each a line from rump to head (`long` each way of its middle, a
// share of it) with its width round it: the same measure the count of walks keeps (life/visit.js). Below nothing
// they are in one another.
function bodyGap(ax, az, ah, a, bx, bz, bh, b) {
  const la = a.long * 0.85, lb = b.long * 0.85;
  const A = [ax - Math.cos(ah) * la, az - Math.sin(ah) * la, ax + Math.cos(ah) * la, az + Math.sin(ah) * la];
  const B = [bx - Math.cos(bh) * lb, bz - Math.sin(bh) * lb, bx + Math.cos(bh) * lb, bz + Math.sin(bh) * lb];
  const toSeg = (px, pz, S) => { const dx = S[2] - S[0], dz = S[3] - S[1], l2 = dx * dx + dz * dz, t = l2 > 1e-9 ? clamp(((px - S[0]) * dx + (pz - S[1]) * dz) / l2, 0, 1) : 0; return Math.hypot(px - S[0] - dx * t, pz - S[1] - dz * t); };
  const side = (S, x, z) => Math.sign((S[2] - S[0]) * (z - S[1]) - (S[3] - S[1]) * (x - S[0]));
  if (side(A, B[0], B[1]) !== side(A, B[2], B[3]) && side(B, A[0], A[1]) !== side(B, A[2], A[3])) return -a.wide - b.wide;
  return Math.min(toSeg(A[0], A[1], B), toSeg(A[2], A[3], B), toSeg(B[0], B[1], A), toSeg(B[2], B[3], A)) - a.wide - b.wide;
}

// How fast each gait goes (m/s) and how far one stride of it carries the animal (m): the agent's own. What was read
// (elk-body-2026-11-16.json): "The normal gait of elk is a saunter, but they can trot or gallop, depending on the
// mood of the individual or herd", a startled elk gallops "at top speed for a kilometer or so, then stop[s] and
// reconnoiter[s]" and a herd flees on "at a dogtrot, often in single file" (Mammals of Texas); "large animals such
// as moose, elk, caribou, eland and waterbuck tend to trot at speed" (Dagg 1973, through a summary); no gait's speed
// or stride was found for any deer, and the trot gives way to the gallop at about 6 m/s for an animal of 300 kg only
// by the reader's extrapolation of Heglund and Taylor's 1988 scaling (no deer among its animals).
export const GAITS = { walk: { pace: 1.3, stride: 1.45 }, trot: { pace: 4.2, stride: 2.8 }, gallop: { pace: 10.5, stride: 4.6 } };
const gaitFor = (speed) => (speed < 0.05 ? 'stand' : speed < 2.4 ? 'walk' : speed < 6.5 ? 'trot' : 'gallop');
const PACES = { walk: GAITS.walk.pace, trot: GAITS.trot.pace, gallop: GAITS.gallop.pace };

// ---- for any beast (life/beastRig.js, and the families of the beasts: they may import these)
// One stride of each gait, in metres at the sheet's own size: what the rig sweeps the feet by, and what a family
// advances its animal's `cycle` by (a stride a turn of it, at the animal's `scale`). The sheet's own (`strides`), or
// the elk's scaled by how long the animal's foreleg is against the elk's, from the shoulder to the fetlock.
const ELK_LEG = 0.3 + 0.34 + 0.3;
const _strides = new WeakMap();
export function stridesOf(sheet) {
  let got = _strides.get(sheet);
  if (got) return got;
  const own = sheet.strides || {}, bones = sheet.shape && sheet.shape.fore && sheet.shape.fore.bones;
  const k = bones ? (bones[0] + bones[1] + bones[2]) / ELK_LEG : 1;
  got = { walk: own.walk ?? GAITS.walk.stride * k, trot: own.trot ?? GAITS.trot.stride * k, gallop: own.gallop ?? GAITS.gallop.stride * k };
  _strides.set(sheet, got);
  return got;
}
// The shares of each gait the beast's rig reads (`walk`, `trot`, `gallop`, 0 to 1) at a pace of `speed` m/s, for
// gaits that go at `paces` m/s: none standing still, a walk coming in by half the walk's pace, a walk giving way to
// a trot round the pace between the two (their geometric mean, 2.3 m/s for the elk) and a trot to a gallop round
// the pace between those (6.6 m/s), each over a fifth of it either side. Into `out`, which is returned.
const step01 = (a, b, x) => { const t = clamp((x - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };
export function gaitShares(speed, paces = PACES, out = {}) {
  const v = Math.abs(speed), w2t = Math.sqrt(paces.walk * paces.trot), t2g = Math.sqrt(paces.trot * paces.gallop);
  const moving = step01(0.03, paces.walk * 0.5, v), trot = step01(w2t * 0.8, w2t * 1.2, v), gallop = step01(t2g * 0.8, t2g * 1.2, v);
  out.walk = moving * (1 - trot); out.trot = moving * trot * (1 - gallop); out.gallop = moving * trot * gallop;
  return out;
}
// How far one cycle of the blend of gaits in `shares` carries the animal (m, at the sheet's size): as far as the rig
// sweeps its feet, which is each gait's stride by its share (life/beastRig.js), so that a foot on the ground stays
// where it is. The shares are not made to sum to one: easing to a stop they are less, the steps are short, and the
// cycle runs as fast as short steps do (divided by their sum, an elk's feet slid as it slowed: a reviewer's reading,
// 2026-11-16). Never less than a sixth of a walking stride, so that a cycle is never run through in an instant.
export const strideFor = (shares, strides) => Math.max(strides.walk / 6, shares.walk * strides.walk + shares.trot * strides.trot + shares.gallop * strides.gallop);

// How much further off than at a stroll a walker is felt: 1 for one who stands or strolls, nearly twice as far
// for one who runs (the walk is 3.2 m/s and the run 7), as for the birds.
const pace = (world) => 1 + 0.9 * clamp(((world.walker ? world.walker.speed : 0) - 1.5) / 5.5, 0, 1);

// The herd's distances, at a stroll (m): within `see` it stops and watches the walker; within `shy`, if they come
// on, it moves off; within `flush` it runs. A runner is felt from nearly twice as far.
const WARY = { see: 46, shy: 24, flush: 5, patience: 7 };
// An elk comes and goes no nearer the walker than this (m), and out of their sight: a big animal that vanished
// a few strides off as soon as the walker looked away would be missed when they looked back.
const OFFSTAGE = 45;

// ---- who is who in a herd of `size`, decided once for the party: an old cow that leads it (the first, so that a cow
// leads), cows, a calf or two each just behind its mother in the file, perhaps a yearling or a spike, and at the rear
// most often an antlered bull or two in velvet, who may spar. The owner's choice of a living world over May's
// accuracy (2026-11-18: in May the bulls keep apart and the calves are not yet born). One time in four a party of no
// more than four is a few bulls together. Every share is the agent's own.
//   roles   per member: 'lead', 'cow', 'yearling', 'calf', 'spike', 'bull'      mother   per member: its mother's index, or -1
function castOf(size, r) {
  const roles = new Array(size).fill('cow'), mother = new Array(size).fill(-1);
  roles[0] = 'lead';
  if (size <= 4 && r() < 0.25) {
    for (let i = 0; i < size; i += 1) roles[i] = i > 0 && i === size - 1 && r() < 0.5 ? 'spike' : 'bull';
    return { roles, mother, bachelors: true };
  }
  let end = size - 1;
  const bulls = r() < 0.86 ? (size >= 5 && r() < 0.62 ? 2 : 1) : 0;
  for (let k = 0; k < bulls && end > 1; k += 1) roles[end--] = 'bull';
  if (size >= 6 && end > 2 && r() < 0.55) roles[end--] = 'spike';
  const calves = size >= 5 ? 1 + (size >= 7 && r() < 0.45 ? 1 : 0) : 0;
  for (let c = 0; c < calves; c += 1) { const i = 2 + 2 * c; if (i <= end && roles[i] === 'cow') { roles[i] = 'calf'; mother[i] = i - 1; } }
  for (let i = 1; i <= end; i += 1) if (roles[i] === 'cow' && !mother.includes(i) && r() < 0.3) { roles[i] = 'yearling'; break; }
  return { roles, mother, bachelors: false };
}

// ---- one elk: the herd it belongs to is its home (life/visit.js gives every member of a party the same one)
export function elk(bird, world) {
  const r = mulberry32(bird.seed), herd = bird.home, life = bird.life;
  bird.big = true;
  // Who this one is, decided once for the visit for the whole party (it keeps it from one coming to the next): a herd
  // of mixed company (`castOf`), or now and then a few bulls together. (The rig reads its size and its antlers from
  // the pose: `scale`, `antler`; the sheet's `who` gives what each is at its own size.)
  const one = bird.who || { party: { members: [] } }, party = one.party;
  if (!party.roles) Object.assign(party, castOf(Math.max(1, party.members.length), mulberry32(((party.members[0] ? party.members[0].seed : bird.seed) ^ 0x5eed1) >>> 0)));
  const n = Math.max(0, party.members.indexOf(one));
  if (!one.make) {
    const role = party.roles[n] || 'cow', WHO = bird.sheet.who || {};
    one.make = { role, sex: role === 'bull' || role === 'spike' ? 'bull' : role === 'calf' ? 'calf' : role === 'yearling' ? 'yearling' : 'cow', age: role === 'lead' ? 'old' : 'grown' };
    const own = (WHO[role === 'lead' ? 'cow' : role] || {});
    one.scale = (own.scale ?? 1) * (role === 'calf' ? 0.96 + r() * 0.1 : role === 'bull' ? 0.96 + r() * 0.07 : 0.98 + r() * 0.05);
    one.antler = (own.antler ?? 0) * (role === 'bull' ? 0.88 + r() * 0.12 : 1);
  }
  bird.make = one.make; bird.scale = one.scale;
  const role = one.make.role, male = role === 'bull' || role === 'spike', young = role === 'calf';
  // (what the card says of this one, under its kind's name: life/card.js)
  bird.note = { bull: 'A bull, his antlers in velvet', spike: 'A young bull, a spike: his first antlers, in velvet', calf: 'A calf, a few days old', yearling: 'A yearling', lead: 'An old cow, who leads the herd', cow: 'A cow' }[role];
  // its body and its length at its own size (what can be seen of it, and whether two bodies are in one another)
  const sheetBody = bird.body || { high: 1.2, long: 1.1, wide: 0.42 };
  const body = (bird.body = { high: sheetBody.high * bird.scale, long: sheetBody.long * bird.scale, wide: sheetBody.wide * bird.scale });
  bird.size *= bird.scale;
  const RADIUS = 0.55 * bird.scale;
  // (the herd's list keeps only those that are about: one gone, or one the visit turned away, is left out)
  herd.birds = (herd.birds || []).filter((b) => b.left == null && b.state !== 'gone');
  // (a member that comes when every other member is away, or the first ever: the herd is arriving afresh)
  const others = herd.birds.filter((b) => b !== bird && b.left == null && b.state !== 'gone');
  // (`nerve`: whether a runner coming at it sends it off at a gallop, or at a trot; drawn afresh whenever it settles)
  if (!others.length) Object.assign(herd, { mode: null, entry: null, exit: null, since: world.clock, leader: null, quota: 360 + r() * 540, alarm: 0, watched: 0, easy: 0, last: Infinity, scout: null, centre: null, rested: 0, nerve: r() });
  if (!herd.birds.includes(bird)) herd.birds.push(bird);

  // its own state
  let heading = r() * Math.PI * 2, speed = 0, want = 0, mood = 'graze', until = 0, look = 0, chew = 0, lie = 0, bout = 0, bark = 0, spot = null;
  // what it does on its own while the herd is at ease (`bit`, entered by `begin` and left by `endBit`); the counts
  // that only grow, which the rig's beats and strokes go by; whether its steps go backwards (giving ground in a spar)
  let bit = null, bitUntil = 0, nextBit = 4 + r() * 10, side = 1, beat = 0, rake = 0, backing = false, loop = null;
  let drinkAt = null, drinkFor = -1, restFor = -1, lazy = false, uneasy = 0, sipping = 0;
  const at = bird.at;
  // its own paces for the shares of each gait: a calf's short legs change gait at lower speeds (by the square root
  // of its size, as animals of one build do)
  const OWN = { walk: PACES.walk * Math.sqrt(bird.scale), trot: PACES.trot * Math.sqrt(bird.scale), gallop: PACES.gallop * Math.sqrt(bird.scale) };
  bird.state = 'stand';

  // ---- the ground under it: where it can step (cached by half metres: a herd keeps to a small patch)
  const cache = new Map();
  const can = (x, z) => {
    const k = Math.round(x * 2) * 65536 + Math.round(z * 2);
    let ok = cache.get(k);
    if (ok === undefined) { ok = world.walkable(x, z, RADIUS); if (cache.size > 6000) cache.clear(); cache.set(k, ok); }
    return ok;
  };
  const face = () => {
    // pitched to the ground's slope along the way it faces, never rolled: it stands upright on a side slope
    const c = Math.cos(heading), s = Math.sin(heading), half = body.long * 0.8;
    const ahead = world.height(at.x + c * half, at.z + s * half), behind = world.height(at.x - c * half, at.z - s * half);
    const pitch = clamp(Math.atan2(ahead - behind, 2 * half), -0.35, 0.35);
    // (+x of its frame is (cos, 0, sin) of the heading: a turn of -heading about +y, then the nose lifted by the slope about +z)
    bird.q.setFromAxisAngle(UP, -heading).multiply(_q.setFromAxisAngle(_v.set(0, 0, 1), pitch));
    bird.heading = heading; bird.pitch = pitch;
  };
  const ground = () => { at.y = world.height(at.x, at.z); };

  // ---- walking: towards a point at a pace, round what is in the way, apart from the rest of the herd
  // (is the way from a spot open: the ground every quarter metre of it as far as `far`, so that no half-metre square
  // of `can` is stepped over: a way tested a stride ahead, and then at its first step, was open where the square
  // between was not, every step into that square was refused, and three of a herd put to flight stood a minute there)
  // (One on ground it cannot stand on, a bank's edge it has come onto, has a way out where the ground it can stand on
  // begins within the stride and goes on: stood on such ground, one tested every way from its first quarter metre,
  // found none, and stood a minute "running off at a gallop".)
  const openFrom = (x, z, a, far = 1.2) => {
    const c = Math.cos(a), s = Math.sin(a);
    let out = can(x, z);
    for (let d = 0.25; d < far; d += 0.25) { if (can(x + c * d, z + s * d)) out = true; else if (out) return false; }
    return can(x + c * far, z + s * far);
  };
  const TURN = { walk: 1.6, trot: 2.4, gallop: 1.9, stand: 1.6 };
  // `shun`: in flight from the walker; it then never bears off round something towards them
  function move(dt, tx, tz, pace0, shun = false) {
    const dx = tx - at.x, dz = tz - at.z, dist = Math.hypot(dx, dz);
    want = dist < 0.3 ? 0 : pace0 * clamp(dist / 1.5, 0.25, 1);
    let aim = Math.atan2(dz, dx);
    // the herd keeps its distances: within 2.6 m of another member it bears away from it, and it does not walk up
    // the back of one in front of it (within 4.2 m ahead it goes no faster than that one, and stops at 3: room
    // enough for either to turn round)
    for (const other of herd.birds) {
      if (other === bird || other.left != null || other.state === 'gone') continue;
      const ox = at.x - other.at.x, oz = at.z - other.at.z, od = Math.hypot(ox, oz);
      if (od < 2.6 && od > 1e-3) { const push = (2.6 - od) / 2.6; aim = Math.atan2(Math.sin(aim) * (1 - push) + (oz / od) * push * 1.4, Math.cos(aim) * (1 - push) + (ox / od) * push * 1.4); }
      const ahead = -(ox * Math.cos(aim) + oz * Math.sin(aim));
      if (od < 4.2 && ahead > od * 0.5) want = Math.min(want, od < 3 ? 0 : (other.speed ?? 0) + (od - 3) * 0.8);
    }
    // a stride or two ahead: if that is no ground for it (a trunk, a log, the river, the ravine's side) it bears off, the nearest way that is
    const look = 1.2 + speed * 0.35, toWalker = Math.atan2(world.eye.z - at.z, world.eye.x - at.x);
    // (in flight, its own way is never towards the walker, whatever lies beyond them: within 83 degrees of straight
    // away from where they are now. The way out was found from the leader, and an elk on the herd's far side ran at
    // the walker to reach it.)
    if (shun) { const rel = wrap(aim - toWalker - Math.PI); if (Math.abs(rel) > 1.45) aim = toWalker + Math.PI + Math.sign(rel) * 1.45; }
    const open = (a) => openFrom(at.x, at.z, a, look);
    if (want > 0 && !open(aim)) {
      let found = null;
      for (const turn of [0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.4, -1.4, 1.9, -1.9, 2.5, -2.5]) {
        const a = aim + turn;
        if (shun && Math.cos(a - toWalker) > -0.05) continue;          // (nothing with any way towards the walker in it)
        if (open(a)) { found = a; break; }
      }
      // (in flight and shut in on the side away from the walker, by a log or the ravine's edge: along it, across the
      // walker's way, rather than standing where it is. One put to flight against a fallen trunk stood "running off at a
      // gallop" for as long as it was watched.)
      if (found == null && shun) {
        for (const turn of [0.35, -0.35, 0.7, -0.7, 1.05, -1.05, 1.4, -1.4, 1.9, -1.9, 2.5, -2.5]) {
          const a = aim + turn;
          if (Math.cos(a - toWalker) > 0.5) continue;                   // (never within sixty degrees of straight at them)
          if (open(a)) { found = a; break; }
        }
      }
      // (and shut in on every side but the walker's, by a steep bank behind it and the walker before it: past them,
      // the open way least towards them, never within thirty degrees of straight at them. Three of a herd that fled
      // towards the foot of the terrace's bank stood there for a minute.)
      if (found == null && shun) {
        let least = 0.85;
        for (let k = 0; k < 16; k += 1) {
          const a = (k / 16) * Math.PI * 2, towards = Math.cos(a - toWalker);
          if (towards < least && open(a)) { least = towards; found = a; }
        }
      }
      if (found == null) want = 0; else aim = found;
    }
    const gait = gaitFor(Math.max(speed, want)), turn = wrap(aim - heading), most = TURN[gait] * dt;
    if (!turnTo(heading + clamp(turn, -most, most)) && Math.abs(turn) > 0.4) {
      // no room to turn this way round: the other way, if it is nearly behind it; else a step away from whatever
      // is in the way, and the turn is made from there (two that had to reverse in single file stood locked)
      if (!(Math.abs(turn) > 2.4 && turnTo(heading - Math.sign(turn) * most)) && crowd) {
        const ax = at.x - crowd.x, az = at.z - crowd.z, al = Math.hypot(ax, az) || 1;
        stepTo(at.x + (ax / al) * 0.7 * dt, at.z + (az / al) * 0.7 * dt);
      }
    }
    // (it does not turn on the spot at a run: the faster it goes, the harder it eases off to turn)
    const off = Math.abs(wrap(aim - heading)), slow = off > 0.6 ? 1 - Math.min(0.75, (off - 0.6) * 0.6) : 1;
    const accel = want > speed ? (gait === 'gallop' ? 5 : 2.2) : 3.5;
    speed += clamp(want * slow - speed, -accel * dt, accel * dt);
    if (speed > 0.01 && !stepTo(at.x + Math.cos(heading) * speed * dt, at.z + Math.sin(heading) * speed * dt)) speed *= 0.3;
    bird.speed = speed;
    ground(); face();
    // Progress to where it is going: `stuck` once it has come no nearer for five seconds (another has its spot, or
    // the way is shut), and whoever sent it there sends it elsewhere.
    if (!goal || Math.hypot(goal.x - tx, goal.z - tz) > 1) goal = { x: tx, z: tz, best: dist, since: world.clock };
    else if (dist < goal.best - 0.25) { goal.best = dist; goal.since = world.clock; }
    bird.stuck = world.clock - goal.since > 5;
    return dist;
  }
  let goal = null;
  // How much room a body here, facing so, has: the least gap to any other animal's body (another elk's, of this
  // herd or another), or to a bird on the ground or low beside it (a hand and a little more from its own body).
  // (`crowd`: the one nearest, for a step away from it)
  const _near = [];
  let crowd = null;
  // (`ignore`: one it is meant to be close to, a bull it spars with)
  function room(x, z, h, ignore = null) {
    let least = Infinity;
    crowd = null;
    const near = world.others ? world.others(x, z, 4.5, bird, _near) : herd.birds;
    for (const other of near) {
      if (other === bird || other === ignore || other.left != null || other.state === 'gone' || other.state === 'fly') continue;
      let gap;
      if (other.body) gap = bodyGap(x, z, h, body, other.at.x, other.at.z, headingOf(other), other.body);
      else if (other.at.y > world.height(x, z) + body.high + 0.3) continue;            // (a bird above its back)
      else gap = pointGap(other.at.x, other.at.z, x, z, h) - 0.12;
      if (gap < least) { least = gap; crowd = other.at; }
    }
    return least;
  }
  // how far a point is from its body, seen from above (less its width)
  function pointGap(px, pz, x, z, h) {
    const l = body.long * 0.85, ax = x - Math.cos(h) * l, az = z - Math.sin(h) * l, dx = 2 * Math.cos(h) * l, dz = 2 * Math.sin(h) * l;
    const t = clamp(((px - ax) * dx + (pz - az) * dz) / (dx * dx + dz * dz), 0, 1);
    return Math.hypot(px - ax - dx * t, pz - az - dz * t) - body.wide;
  }
  // A step or a turn is taken only into room: never to within a hand of another body, and never nearer one it is
  // already too near (so two that are too near only draw apart, and none walks through another).
  const ROOM = 0.08;
  function stepTo(x, z) {
    // (no step onto ground it cannot stand on, unless it is on such ground already: then any step that takes it out.
    // `can` is kept by half-metre squares, each as the first spot asked of it found it, so a square it says no to is
    // asked again at the step itself: a way tested open every quarter metre crossed the corner of a square that `can`
    // had from a spot by a bank, and every step into it was refused. Whether it stands on such ground is asked of the
    // spot itself, not of its square: one stood on such ground in a square `can` had found good, every step towards the
    // good ground a stride off was a step onto bad ground from good, and it stood a minute "running off at a gallop".)
    if (!can(x, z) && !world.walkable(x, z, RADIUS) && world.walkable(at.x, at.z, RADIUS)) return false;
    const now = room(at.x, at.z, heading), next = room(x, z, heading);
    if (next < ROOM && next < now) return false;
    at.x = x; at.z = z;
    return true;
  }
  function turnTo(h) {
    const now = room(at.x, at.z, heading), held = crowd, next = room(at.x, at.z, h);
    if (next < ROOM && next < now) { crowd = held || crowd; return false; }
    heading = h;
    return true;
  }
  // (for the bull it spars with, who sets both of them where the shove takes them: can this one stand there, facing
  // so, with room from every animal but that one)
  bird.fits = (x, z, h, ignore) => can(x, z) && world.walkable(x, z, RADIUS) && room(x, z, h, ignore) >= ROOM;
  // stands still where it is, easing to a stop
  const stop = (dt) => { want = 0; speed = Math.max(0, speed - 3 * dt); if (speed > 0.01 && !stepTo(at.x + Math.cos(heading) * speed * dt, at.z + Math.sin(heading) * speed * dt)) speed = 0; bird.speed = speed; ground(); face(); };

  // ---- how it holds itself: the beast's own pose (life/beastRig.js says what each field is), laid whole each step on
  // the plan's neutral one (life/bodies.js `rest`), so that nothing an earlier moment asked for is left in it (the
  // high steps a scout took were kept for the rest of the visit, and a forefoot once raised to stamp stayed raised).
  // `extra` is what this moment asks for besides its gait: `neck`, `head`, `ears`, `tail`, `high`. A stamp, a flick of
  // the tail and a turn of the ears each last a moment (`pulse`): a single frame of one was eased away to nothing.
  //   its gait   the shares its pace makes (`gaitShares`); a turn on the spot is stepped round, not slid round
  //   cycle      where in a stride it is, run on and never wrapped: the rig takes it round, and the page eases it (a
  //              phase wrapped from 0.98 to 0.02 was eased back through the stride)
  //   scale, antler   who it is: a bull's antlers in velvet, a yearling's smaller body
  //   ground     how far the ground under each foot is from the plane its body is pitched to, which a side slope tilts
  //   jaw        working as it crops (`mouth` 'crop') and as it chews the cud ('chew')
  const REST = bodyOf(bird.sheet).rest(bird.sheet), STRIDES = stridesOf(bird.sheet), shares = {}, feet = [0, 0, 0, 0];
  const sheetShape = bird.sheet.shape;
  const FOOT = [[sheetShape.fore.at[0], -sheetShape.fore.at[1]], [sheetShape.fore.at[0], sheetShape.fore.at[1]], [sheetShape.hind.at[0], -sheetShape.hind.at[1]], [sheetShape.hind.at[0], sheetShape.hind.at[1]]];
  const ANTLER = one.antler || 0;
  const pulses = { stamp: 0, tail: 0, ears: 0, earsTo: 0 }, drawn = { walk: 0, trot: 0, gallop: 0 };
  const pulse = (name, seconds, to) => { pulses[name] = seconds; if (to != null) pulses.earsTo = to; };
  let turnedFrom = null, mouth = null;
  const hold = (extra) => {
    // (how fast it is turning, radians a second: no more than it can, so that one set down facing a new way, as it
    // comes, does not take a dozen strides in a frame)
    const turned = turnedFrom == null || !(dt0 > 0) ? 0 : Math.min(2.5, Math.abs(wrap(heading - turnedFrom)) / dt0);
    turnedFrom = heading;
    gaitShares(speed, OWN, shares);
    const stepping = speed < 0.4 && lie < 0.1 ? clamp(turned * 0.6, 0, 0.6) : 0;
    if (stepping > shares.walk) shares.walk = stepping;
    const going = Math.max(speed, stepping > 0 ? turned * 0.9 * bird.scale : 0);
    // (the stride is run on by the shares the rig will draw, which the page eases towards these a share of the way each
    // frame, `dt * 14` (life/index.js); run on by these, the feet slid as it started and stopped: a fifth to two fifths
    // of the way the body went, as it shoved in a spar, by a scratch tool that read the hooves)
    const ek = Math.min(1, dt0 * 14);
    drawn.walk += (shares.walk - drawn.walk) * ek; drawn.trot += (shares.trot - drawn.trot) * ek; drawn.gallop += (shares.gallop - drawn.gallop) * ek;
    // (going backwards, the stride is run backwards: a foot on the ground then stays where it is as the body goes back)
    bird.cycle = (bird.cycle || 0) + ((backing ? -1 : 1) * going * dt0) / (strideFor(drawn, STRIDES) * bird.scale);
    const c = Math.cos(heading), s = Math.sin(heading), up = Math.sin(bird.pitch || 0), k = bird.scale;
    for (let i = 0; i < 4; i += 1) {
      const x = FOOT[i][0] * k, z = FOOT[i][1] * k;
      feet[i] = lie > 0.95 ? 0 : clamp(world.height(at.x + c * x - s * z, at.z + s * x + c * z) - (at.y + x * up), -0.3, 0.3) / k;
    }
    const w = bird.want;
    Object.assign(w, REST, { walk: shares.walk, trot: shares.trot, gallop: shares.gallop, cycle: bird.cycle, lie, scale: k, antler: ANTLER, ground: feet, beat, rake }, extra);
    backing = false;
    w.jaw = mouth === 'chew' ? 0.5 + 0.5 * Math.sin(world.clock * 7.5 + n) : mouth === 'crop' ? 0.45 + 0.45 * Math.sin(world.clock * 12 + n * 2) : mouth === 'lap' ? 0.2 + 0.2 * Math.sin(world.clock * 9 + n) : 0;
    if (pulses.stamp > 0) w.stamp = 1;
    if (pulses.tail > 0) w.tail = 1;
    if (pulses.ears > 0) w.ears = pulses.earsTo;
    mouth = null;
    const gait = gaitFor(speed);
    bird.state = lie > 0.5 ? 'lie' : gait === 'stand' ? 'stand' : gait;
  };
  let dt0 = 0;
  const towardsWalker = () => wrap(Math.atan2(world.eye.z - at.z, world.eye.x - at.x) - heading);
  const watch = () => {
    const off = towardsWalker();
    // the head turns to the walker as far as a neck goes; past that it is the elk that turns, a little at a time
    if (Math.abs(off) > 1.4 && lie < 0.1 && speed < 0.3) { turnTo(heading + Math.sign(off) * Math.min(Math.abs(off) - 1.2, 1.2 * dt0)); face(); }
    const d = Math.hypot(world.eye.x - at.x, world.eye.z - at.z);
    return { yaw: clamp(off, -1.5, 1.5), pitch: clamp(Math.atan2(world.eye.y - (at.y + body.high + 0.5), d), -0.4, 0.4) };
  };

  // ---- where it stands in the herd while it grazes: a spot of its own about the herd's middle
  const pick = () => {
    // (a calf keeps by its mother: a spot a few metres from her, any way round)
    const m = young ? motherOf() : null;
    if (m) for (let tries = 0; tries < 10; tries += 1) {
      const a = r() * Math.PI * 2, d = 3.1 + r() * 1.2, x = m.at.x + Math.cos(a) * d, z = m.at.z + Math.sin(a) * d;
      if (can(x, z) && world.trail.distance(x, z) > 6) return { x, z };
    }
    const c = herd.centre || herd;
    for (let tries = 0; tries < 12; tries += 1) {
      const a = r() * Math.PI * 2, d = 2 + r() * (herd.radius || 9);
      const x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d;
      if (!can(x, z) || world.trail.distance(x, z) < 9) continue;        // (and not on the trail: it grazes beside it)
      if (herd.birds.some((o) => o !== bird && o.left == null && o.spot && Math.hypot(o.spot.x - x, o.spot.z - z) < 3.2)) continue;
      return { x, z };
    }
    // (none found: further out from the herd's middle, still clear of the others' spots and bodies; never the world's
    // origin, where an elk not yet placed stands)
    for (let tries = 0; tries < 24; tries += 1) {
      const a = r() * Math.PI * 2, d = (herd.radius || 9) + 2 + tries * 0.6, x = c.x + Math.cos(a) * d, z = c.z + Math.sin(a) * d;
      if (!can(x, z)) continue;
      if (herd.birds.some((o) => o !== bird && o.left == null && ((o.spot && Math.hypot(o.spot.x - x, o.spot.z - z) < 3.2) || Math.hypot(o.at.x - x, o.at.z - z) < 3.2))) continue;
      return { x, z };
    }
    return { x: c.x + (r() - 0.5) * 8, z: c.z + (r() - 0.5) * 8 };
  };

  // ---- coming: there when the visit began, or walking in from somewhere the walker cannot see
  const leaderOf = () => {
    if (!herd.leader || herd.leader.left != null || herd.leader.state === 'gone') herd.leader = herd.birds.find((b) => b.left == null && b.state !== 'gone') || bird;
    return herd.leader;
  };
  if (!herd.centre) herd.centre = { x: herd.x, z: herd.z };
  if (life && life.first) {
    // there from the first: grazing, or bedded at midday and in the night's small hours; never in another animal
    for (let tries = 0; tries < 10; tries += 1) {
      spot = pick(); heading = r() * Math.PI * 2;
      if (room(spot.x, spot.z, heading) > 0.3) break;
    }
    at.set(spot.x, 0, spot.z); ground(); face();
    if (room(at.x, at.z, heading) < 0.3) bird.left = 2 + r() * 4;
    if (!herd.mode) { herd.mode = restful() && r() < 0.35 ? 'rest' : 'graze'; herd.since = world.clock; herd.span = 20 + r() * 50; herd.restAt = world.clock; }
    if (herd.mode === 'rest' && lies()) { lie = 1; mood = 'bedded'; until = 30 + r() * 100; } else { mood = 'graze'; until = 5 + r() * 30; }
  } else {
    // in from out of sight, along the herd's way in: the first of it finds the way
    if (!herd.entry || world.clock - herd.since > 90) {
      herd.entry = world.offstage(herd.centre, bird, r, { least: 30, most: 90, clear: OFFSTAGE });
      herd.since = world.clock; herd.mode = 'arrive';
    }
    const place = () => { at.set(herd.entry.x + (r() - 0.5) * 1.5, 0, herd.entry.z + (r() - 0.5) * 1.5); ground(); heading = Math.atan2(herd.centre.z - at.z, herd.centre.x - at.x); face(); };
    if (herd.entry) {
      place();
      // The walker has moved since the herd's way in was found, and may see it now: then another, or a moment's
      // wait. (Members come seconds apart, and the count of walks found later ones walking in in plain view.)
      if (world.plainly(bird) || Math.hypot(at.x - world.eye.x, at.z - world.eye.z) < OFFSTAGE) { herd.entry = world.offstage(herd.centre, bird, r, { least: 30, most: 90, clear: OFFSTAGE }); herd.since = world.clock; if (herd.entry) place(); }
    }
    if (!herd.entry || world.plainly(bird) || Math.hypot(at.x - world.eye.x, at.z - world.eye.z) < OFFSTAGE) bird.left = 3 + r() * 6;
    // (and not on top of one that came before it, still close by, nor in any other animal: it comes a moment later)
    else if (herd.birds.some((o) => o !== bird && o.left == null && o.state !== 'gone' && Math.hypot(o.at.x - at.x, o.at.z - at.z) < 3.4) || room(at.x, at.z, heading) < 0.3) bird.left = 1.5 + r() * 2;
    else mood = 'arrive';
  }
  spot = spot || pick();
  bird.spot = spot;

  // Is it a time to lie up? At midday, and in the middle of the night; at dawn and dusk it feeds.
  function restful() {
    const h = world.hour ?? 12;
    return (h > 10 && h < 16.5) || h > 23.5 || h < 4;
  }

  // ---- the herd's mind, thought by its leader once a step
  function think(dt) {
    const k = pace(world);
    let nearest = Infinity;
    for (const b of herd.birds) if (b.left == null && b.state !== 'gone') nearest = Math.min(nearest, Math.hypot(b.at.x - world.eye.x, b.at.z - world.eye.z));
    const moved = herd.last - nearest; herd.last = nearest;
    const coming = dt > 0 && world.walker.speed > 0.4 && Math.abs(moved) < 2 && moved / dt > 0.4;
    const running = world.walker.speed > 4.5;
    const was = herd.mode;
    herd.coming = coming;
    if (was === 'leave' || was === 'flee') return;
    // (a walker who comes on to within reach, or anyone right up to it, puts it to flight; a runner coming at it
    // from further off sends it off at a gallop three times in four)
    if ((coming && nearest < WARY.flush * k) || nearest < WARY.flush * 0.6 || (running && coming && nearest < WARY.shy * k && herd.nerve < 0.75)) {
      // up and away at a gallop, from the walker, to somewhere out of their sight (whatever it was about is over)
      herd.mode = 'flee'; herd.since = world.clock; herd.runs = 0; herd.spar = null; herd.trek = null;
      // (the furthest from the walker go first, a moment apart: all at once, a file that had to turn round locked)
      const order = herd.birds.filter((b) => b.left == null && b.state !== 'gone').sort((a, b) => Math.hypot(b.at.x - world.eye.x, b.at.z - world.eye.z) - Math.hypot(a.at.x - world.eye.x, a.at.z - world.eye.z));
      order.forEach((b, i) => { b.delay = i * 0.22; });
      herd.exit = world.offstage(leaderOf().at, bird, r, { least: 70, most: 140, away: true, clear: OFFSTAGE, spread: 2.6 }) || runAway(90);
      herd.alarm = 1; bark = 0.6;
      met();
      if (!herd.fled) { herd.fled = true; event(running ? 'ran from a runner' : 'ran from a walker'); }
      return;
    }
    if (was === 'arrive') { if (herd.birds.every((b) => b.left != null || b.state === 'gone' || b.arrived)) toMode(restful() && r() < 0.3 ? 'rest' : 'graze', 30 + r() * 40); return; }
    if (nearest < WARY.shy * k && coming) {
      if (was !== 'off') {
        // (the leading cow may first come a few slow steps towards the walker, if they are not near yet)
        // (and where it moves off to is found afresh: the place it moved off to the last time was kept, and for the
        // first six seconds of every later time the herd walked to that, wherever the walker now was)
        herd.mode = 'off'; herd.since = world.clock; herd.exit = null; herd.goal = null; herd.scout = r() < 0.45 && nearest > 18 ? leaderOf() : null; bark = 0.4 + r() * 0.8;
        herd.spar = null; herd.trek = null;
        met();
        if (!herd.wentOff) { herd.wentOff = true; event(running ? 'moved off from a runner' : 'moved off from a walker'); }
      }
      // where to: off to the side of the trail the walker is on, and away from them, twenty to forty-five metres
      // (straight away from a walker who keeps to the trail is along it, ahead of them, and they soon come on again).
      // Found as it sets off and again every six seconds while the walker comes on, by a clock of its own: by the
      // clock of when it set off, it was found again in every frame from the sixth second on.
      if (!herd.goal || world.clock - herd.aimed > 6) { herd.goal = aside(25 + r() * 20); herd.aimed = world.clock; }
      herd.easy = 0;
      return;
    }
    if (was === 'off') {
      // it goes on until the walker has not come on for a while, and then feeds where it has got to
      if (!coming) herd.easy += dt; else herd.easy = 0;
      if (herd.easy > 8 || nearest > WARY.shy * k * 1.8) { toMode('graze', 25 + r() * 40); herd.nerve = r(); herd.centre = { x: leaderOf().at.x, z: leaderOf().at.z }; for (const b of herd.birds) b.spot = null; }
      return;
    }
    if (nearest < WARY.see * k) {
      // (bulls locked in a spar go on with it unless the walker is near: `herd.spar` is let go within 26 m)
      if (herd.spar && nearest < 26 * k) herd.spar = null;
      if (coming) herd.watched = 0;
      if (herd.easy > 0) { herd.easy -= dt; if (was !== 'alert') return; }
      herd.watched += dt;
      if (herd.watched > (herd.patience || WARY.patience + 2)) { herd.watched = 0; herd.easy = 25 + r() * 35; herd.mode = herd.calm || 'graze'; return; }
      if (was !== 'alert') {
        // (what it was about, to go back to once it has watched enough: a walk to somewhere else is taken up again)
        herd.calm = was === 'rest' || was === 'drink' || (was === 'trek' && herd.trek) ? was : 'graze'; herd.mode = 'alert'; herd.since = world.clock; herd.patience = WARY.patience + r() * 4;
        if (nearest < WARY.see * 0.6 * k && r() < 0.5) bark = 0.3; met();
      }
      return;
    }
    if (was === 'alert') { herd.mode = herd.calm || 'graze'; herd.since = world.clock; herd.span = 30 + r() * 40; return; }
    // Left alone, the herd's own day, a thing at a time: feeding as it drifts over its patch, lying up to chew, and
    // walking in file to somewhere else (water, open grass, the hill, the deep wood), and from there the same again.
    // How long each lasts and which comes next are the agent's own, set so that a herd met on a walk is seldom
    // doing nothing but feed or lie (the owner, 2026-11-18: "they are never doing interesting things").
    // When it has been here long enough it moves on.
    herd.quota -= dt;
    if (herd.quota < 0) { herd.mode = 'leave'; herd.since = world.clock; herd.runs = 0; herd.spar = null; herd.trek = null; herd.exit = world.offstage(leaderOf().at, bird, r, { least: 50, most: 120, away: true, clear: OFFSTAGE, spread: 3.0 }) || runAway(70); return; }
    if (!(herd.span > 0)) herd.span = 30 + r() * 50;
    const span = world.clock - herd.since;
    if (was === 'graze' && span > herd.span) {
      if (r() < (restful() ? 0.4 : 0.2)) toMode('rest', (restful() ? 60 : 40) + r() * 50);
      else if (!startTrek()) toMode('graze', 25 + r() * 35);
    } else if (was === 'rest' && span > herd.span) toMode('graze', 35 + r() * 50);
    else if (was === 'drink' && span > herd.span) toMode('graze', 25 + r() * 40);
    else if (was === 'trek' && !herd.trek) toMode('graze', 30 + r() * 40);
    // the patch it feeds on drifts: a few metres at a time, one way and then a little another
    if (herd.mode === 'graze' && r() < dt / 14) {
      herd.drift = (herd.drift ?? r() * 6.283) + (r() - 0.5) * 1.2;
      const c = herd.centre, nx = c.x + Math.cos(herd.drift) * 4, nz = c.z + Math.sin(herd.drift) * 4;
      if (can(nx, nz) && world.trail.distance(nx, nz) > 12) herd.centre = { x: nx, z: nz }; else herd.drift += Math.PI * (0.5 + r());
    }
  }
  // (a walk in file to somewhere else ends any spar: the bulls go with the herd)
  function toMode(mode, span) { herd.mode = mode; herd.since = world.clock; herd.span = span; if (mode === 'trek') herd.spar = null; if (mode === 'rest') herd.restAt = world.clock; }
  // Somewhere else to go, 35 to 170 m off: water (a gravel bar by the river), open grass, the hill or the deep wood,
  // with nothing on the straight way there that a herd does not cross (the river, steep ground: read every two metres,
  // once, when it is chosen). Never towards the walker. False if nowhere was found.
  function startTrek() {
    const all = world.grazing(), c = herd.centre;
    if (!all.length) return false;
    // (water: a herd cannot reach the river's bars, which lie beyond the ground it stands on, so it drinks at the
    // creek: a place with the creek within 14 m, `wet`)
    const pull = r(), wish = pull < 0.35 ? 'water' : pull < 0.7 ? 'grass' : 'floor';
    let drinks = 0;
    for (let tries = 0; tries < 40; tries += 1) {
      const p = all[Math.floor(r() * all.length)], d = Math.hypot(p.x - c.x, p.z - c.z);
      if (d < 35 || d > 170) continue;
      if (Math.hypot(p.x - world.eye.x, p.z - world.eye.z) < 45) continue;
      const water = tries < 28 && wish === 'water' && drinks < 10 ? (drinks++, wet(p, world)) : false;
      if (tries < 28 && (wish === 'water' ? !water : p.ground !== wish)) continue;
      let ok = true;
      for (let s = 2; s < d && ok; s += 2) { const g = world.ground(c.x + ((p.x - c.x) * s) / d, c.z + ((p.z - c.z) * s) / d); if (g === 'water' || g === 'steep') ok = false; }
      if (!ok) continue;
      const why = water ? 'drink' : p.ground === 'grass' || p.ground === 'wet' || p.ground === 'stones' ? 'grass' : world.height(p.x, p.z) > world.height(c.x, c.z) + 2.5 ? 'hill' : 'wood';
      herd.trek = { x: p.x, z: p.z, why, since: world.clock, label: TREKS[why] };
      toMode('trek', 200);
      return true;
    }
    return false;
  }
  // further from the walker than the herd is, by `far` metres, on ground it can stand on
  function farther(far) {
    const L = leaderOf(), dx = L.at.x - world.eye.x, dz = L.at.z - world.eye.z, d = Math.hypot(dx, dz) || 1;
    for (const turn of [0, 0.4, -0.4, 0.8, -0.8, 1.2, -1.2]) {
      const c = Math.cos(turn), s = Math.sin(turn), x = L.at.x + ((dx * c - dz * s) / d) * far, z = L.at.z + ((dx * s + dz * c) / d) * far;
      if (can(x, z)) return { x, z };
    }
    return { x: L.at.x + (dx / d) * far, z: L.at.z + (dz / d) * far };
  }
  // with nowhere found out of sight: away from the walker (within 70 degrees of straight away), on ground it can
  // stand on, as far as it can be had
  // (`here`: stuck where it is, it takes only a way that is open from where it stands, and looks wider for one: the
  // way it had led on into a bank it could not climb)
  function runAway(far, here = false) {
    const L = leaderOf(), dx = L.at.x - world.eye.x, dz = L.at.z - world.eye.z, d = Math.hypot(dx, dz) || 1, base = Math.atan2(dz, dx);
    for (const k of [1, 0.7, 0.45]) for (const turn of here ? [0, 0.4, -0.4, 0.8, -0.8, 1.2, -1.2, 1.6, -1.6, 2.0, -2.0] : [0, 0.4, -0.4, 0.8, -0.8, 1.2, -1.2]) {
      const x = L.at.x + Math.cos(base + turn) * far * k, z = L.at.z + Math.sin(base + turn) * far * k;
      if (can(x, z) && (!here || openFrom(L.at.x, L.at.z, base + turn, 4))) return new THREE.Vector3(x, 0, z);
    }
    return new THREE.Vector3(L.at.x + (dx / d) * far, 0, L.at.z + (dz / d) * far);
  }
  // Off to the side: square to the trail's line from where the herd is, on the side it is on (or, standing on the
  // trail, the side the walker is not), leaning away from the walker; on ground it can stand on.
  const _p = new THREE.Vector3(), _t = new THREE.Vector3();
  function aside(far) {
    const L = leaderOf(), [, s] = world.trail.locate(L.at.x, L.at.z);
    world.trail.sample(s, _p, _t);
    let nx = L.at.x - _p.x, nz = L.at.z - _p.z, n = Math.hypot(nx, nz);
    if (n < 2.5) { nx = -_t.z; nz = _t.x; n = Math.hypot(nx, nz) || 1; if ((L.at.x - world.eye.x) * nx + (L.at.z - world.eye.z) * nz < 0) { nx = -nx; nz = -nz; } }
    const wx = L.at.x - world.eye.x, wz = L.at.z - world.eye.z, w = Math.hypot(wx, wz) || 1;
    const base = Math.atan2(nz / n + (0.5 * wz) / w, nx / n + (0.5 * wx) / w);
    for (const turn of [0, 0.35, -0.35, 0.7, -0.7, 1.05, -1.05]) {
      const x = L.at.x + Math.cos(base + turn) * far, z = L.at.z + Math.sin(base + turn) * far;
      if (can(x, z)) return { x, z };
    }
    return farther(far);
  }
  // (what the count of walks hears of: a herd met, one that moved off, one that ran; each once a herd)
  const event = (what) => { if (world.event) world.event(bird.key, what); };
  function met() { if (!herd.met) { herd.met = true; event('met'); } }

  // (one there from the first has arrived; one walking in has not, until it reaches its spot, or has been given
  // three spots it could not reach: `repicks`)
  bird.arrived = !!(life && life.first);
  let repicks = 0;

  // What it does on its own while it feeds (`chooseBit`, below): the weights, and how long each lasts (s). The agent's own.
  const BITS = male ? [['spar', 6], ['thrash', 2.2], ['paw', 1.6], ['scratch', 1], ['shake', 0.8], ['browse', 1]]
    : young ? [['loop', 5], ['shake', 0.7], ['scratch', 0.5]]
    : [['browse', 2.2], ['scratch', 1.2], ['shake', 0.9], ['box', 0.4]];
  const LONG = { thrash: [6, 12], paw: [4, 7], scratch: [3.5, 6], shake: [1.6, 2.4], browse: [7, 15], box: [2.5, 3.5], loop: [30, 30] };
  // (whether the other bull of a spar can be had: an antlered male on his feet, not sparring, while the herd is at ease)
  bird.sparrable = () => male && lie < 0.05 && bit !== 'spar' && (herd.mode === 'graze' || herd.mode === 'drink' || herd.mode === 'rest');

  // ---- one step
  return (dt) => {
    dt0 = dt;
    if (bird.state === 'gone') return;
    if (leaderOf() === bird) think(dt);
    until -= dt; look -= dt; chew -= dt; bout -= dt;
    pulses.stamp -= dt; pulses.tail -= dt; pulses.ears -= dt;
    const mode = herd.mode;

    // an alarm: the bark (heard), and every head comes up
    if (bark > 0) { bark -= dt; if (bark <= 0 && leaderOf() === bird && world.say) world.say(bird, 'bark', 450, 0.5); }
    // A cow's mew, the call that keeps a herd together (the recording is a cow's: life/species/rooseveltElk.js): now
    // and then from one of a herd of cows, more often while it moves off or walks in one behind another than while
    // it feeds, seldom while it lies up, never while it runs. A few bulls together are silent in May. How often is the
    // agent's own: once in about twelve seconds from a moving herd, a minute and a half from a feeding one.
    if (!party.bachelors && !male && world.say && mode !== 'flee' && lie < 0.5) {
      const every = mode === 'off' || mode === 'leave' || mood === 'arrive' ? 12 : mode === 'alert' ? 40 : 90;
      if (r() < dt / (every * Math.max(1, herd.birds.length))) world.say(bird, 'mew', 220);
    }

    // (the one place where what it was about on its own is let go: whenever the herd's mind turns to the walker, to
    // leaving or to walking in, a bit ends, and a spar too once the herd has let it go)
    const calmNow = mode === 'graze' || mode === 'rest' || mode === 'trek' || mode === 'drink' || mode === 'arrive';
    let inSpar = !!herd.spar && (herd.spar.a === bird || herd.spar.b === bird);
    if (inSpar && !calmNow && mode !== 'alert') { herd.spar = null; inSpar = false; }
    if (bit && (bit === 'spar' ? !inSpar : !calmNow)) endBit();
    if (mode !== 'alert') uneasy = 0;

    if (mode === 'flee' || mode === 'leave') {
      // off to the herd's way out, the leader first and the rest after; gone from there once out of the walker's sight
      const fleeing = mode === 'flee', exit = herd.exit;
      // (one still walking in when the herd was put to flight runs with it, and is one of the herd from then on: it went
      // back afterwards, at a trot, to the spot it had been making for, where the walker had put them up)
      if (mood === 'arrive') { mood = 'graze'; bird.arrived = true; }
      if (lie > 0) { lie = Math.max(0, lie - dt / (fleeing ? 1.1 : 2.2)); stop(dt); hold({ neck: 0.8, head: watch() }); bird.doing = 'getting up'; return; }
      // (startled, it waits its turn: a moment, the furthest from the walker first)
      if (fleeing && world.clock - herd.since < (bird.delay || 0)) { stop(dt); hold({ neck: 0.9, head: watch(), ears: 1 }); bird.doing = 'startled'; return; }
      const gallop = fleeing && world.clock - herd.since < 18;
      const p = gallop ? GAITS.gallop.pace * (0.92 + 0.12 * ((n * 7) % 3) / 2) : fleeing ? GAITS.trot.pace : GAITS.walk.pace;
      const before = Math.hypot(at.x - world.eye.x, at.z - world.eye.z);
      // (the walker has moved on since the way out was found, and it now lies their side of the herd: another)
      if (leaderOf() === bird && (exit.x - at.x) * (world.eye.x - at.x) + (exit.z - at.z) * (world.eye.z - at.z) > 0) {
        herd.exit = world.offstage(at, bird, r, { least: 50, most: 120, away: true, clear: OFFSTAGE, spread: 2.6 }) || runAway(70);
      }
      const dist = move(dt, herd.exit.x + ((n % 3) - 1) * 2.5, herd.exit.z + (((n + 1) % 3) - 1) * 2.5, p, true);
      hold({ neck: gallop ? 0.7 : 0.6, head: { yaw: 0, pitch: gallop ? 0.15 : 0.05 }, tail: fleeing ? 1 : 0, ears: gallop ? -0.3 : 0.2 });
      bird.doing = gallop ? 'running off at a gallop' : fleeing ? 'trotting away' : 'walking off into the trees';
      // (how far its own steps have carried it towards the walker since it began to run, whatever the walker did:
      // the count keeps the most)
      const off = Math.hypot(at.x - world.eye.x, at.z - world.eye.z);
      if (bird.ran !== herd.since) { bird.ran = herd.since; bird.towards = 0; }
      if (fleeing) { bird.towards += Math.max(0, before - off); bird.closer = Math.max(bird.closer || 0, bird.towards); }
      // (not the one a close-up is held on: in a long lens a trunk crosses a running elk every second or two, and the
      // close-up itself lets go of one hidden for long. Held, it was gone at the first trunk.)
      if (off > OFFSTAGE && !bird.held && !world.plainly(bird)) { bird.left = Infinity; bird.state = 'gone'; return; }
      // there, and still in the walker's sight: a herd put to flight stops there, looks back and in a while feeds
      // again, far off; one leaving goes on further (and if it is still seen after three goes, it stays a while)
      if (bird.stuck && leaderOf() === bird) herd.exit = runAway(60 + r() * 40, true);
      if (dist < 3 && leaderOf() === bird) {
        herd.runs = (herd.runs || 0) + 1;
        if ((fleeing && off > 60) || herd.runs > 3) {
          herd.mode = 'alert'; herd.calm = 'graze'; herd.since = world.clock; herd.watched = 0; herd.nerve = r();
          herd.centre = { x: at.x, z: at.z }; herd.quota = Math.min(herd.quota, 90 + r() * 200);
          for (const b of herd.birds) b.spot = null;
        } else herd.exit = world.offstage(at, bird, r, { least: 40, most: 110, away: true, clear: OFFSTAGE, spread: 2.6 }) || runAway(60);
      }
      return;
    }

    // (still running from a flight that is over, the herd stopped where it got to: it pulls up first, its head up. One
    // went on at a trot for three seconds with its muzzle in the grass, "grazing", as soon as the leader stopped.)
    if (speed > GAITS.walk.pace * 1.3 && mode !== 'off') {
      stop(dt); hold({ neck: 0.8, head: { yaw: 0, pitch: 0.05 }, ears: 1, tail: 0.5 });
      bird.doing = 'pulling up from a run';
      return;
    }

    if (mood === 'arrive') {
      // in along the herd's way to its spot in the herd (they come a few seconds apart, one behind another)
      const dist = move(dt, spot.x, spot.z, GAITS.walk.pace);
      hold({ neck: 0.55, head: { yaw: 0, pitch: -0.05 } });
      bird.doing = 'walking in, one behind another';
      // (there, or as near as it will get: it feeds where it is)
      // (or it has no way there: the herd's way in is found by where an elk can stand, not by the way from there, and
      // the ravine or the river may lie between. Each spot it is given is then as far out of reach as the last, and it
      // walked in for as long as it was watched, ten minutes, the herd never done arriving. After three spots it feeds
      // where it has got to; if it leads, the herd's middle is there from then on, and the others' next spots are
      // about it. How many spots it tries is the agent's own.)
      if (dist < 1 || (bird.stuck && (dist < 12 || repicks >= 3))) {
        if (dist >= 12 && leaderOf() === bird) herd.centre = { x: at.x, z: at.z };
        bird.arrived = true; mood = 'graze'; until = 2 + r() * 6; spot = { x: at.x, z: at.z }; bird.spot = spot;
      } else if (bird.stuck) { spot = pick(); bird.spot = spot; repicks += 1; }
      return;
    }

    if (mode === 'off') {
      // moving off from the walker in single file, each behind the one before; the leading cow may first come a
      // few slow, high steps towards them
      if (lie > 0) { lie = Math.max(0, lie - dt / 1.6); stop(dt); hold({ neck: 0.85, head: watch() }); bird.doing = 'getting up, watching you'; return; }
      if (herd.scout === bird && world.clock - herd.since < 5) {
        const off = towardsWalker();
        move(dt, at.x + Math.cos(heading + off) * 3, at.z + Math.sin(heading + off) * 3, 0.5);
        hold({ neck: 0.95, head: watch(), high: 1, ears: 1 });
        bird.doing = 'stepping towards you, high and slow';
        return;
      }
      const order = herd.birds.filter((b) => b.left == null && b.state !== 'gone');
      const i = order.indexOf(bird), before = i > 0 ? order[i - 1] : null;
      const goal = before ? { x: before.at.x - Math.cos(before.heading ?? 0) * 3.4, z: before.at.z - Math.sin(before.heading ?? 0) * 3.4 } : herd.goal || farther(30);
      // at a walk it walks off; it trots only from a runner, or from a walker who keeps coming on and is near
      const quick = world.walker.speed > 4.5 || (herd.coming && herd.last < WARY.shy * pace(world) * 0.6);
      move(dt, goal.x, goal.z, quick ? GAITS.trot.pace * 0.75 : GAITS.walk.pace * 1.1);
      if (speed < 0.2 && r() < dt * 0.4) look = 1.2;
      hold({ neck: 0.75, head: look > 0 ? watch() : { yaw: 0, pitch: 0 }, tail: 0.5 });
      bird.doing = quick ? 'trotting off, the herd behind the leading cow' : 'moving off from you, one behind another';
      bird.heading = heading;
      return;
    }

    if (mode === 'alert') {
      // (bulls locked in a spar go on with it while the walker keeps off: the herd lets the spar go within 26 m)
      if (inSpar) { spar(dt); return; }
      // every head up, ears forward, chewing stopped; a cow stamps a forefoot now and then
      if (lie > 0 && herd.last < WARY.see * 0.7 * pace(world)) { lie = Math.max(0, lie - dt / 2); stop(dt); hold({ neck: 0.85, head: watch(), ears: 1 }); bird.doing = 'getting up to watch you'; return; }
      // (a calf keeps close by its mother)
      const m = young && lie < 0.1 ? motherOf() : null;
      if (m && Math.hypot(m.at.x - at.x, m.at.z - at.z) > 4.6) { move(dt, m.at.x, m.at.z, GAITS.walk.pace * 1.3); hold({ neck: 0.9, head: watch(), ears: 1 }); bird.doing = 'keeping close to its mother'; return; }
      // (and now and then a cow walks a few stiff, high steps across the walker's line, watching them: an uneasy elk)
      if (uneasy > 0) {
        uneasy -= dt;
        const d = move(dt, bird.uneasyTo.x, bird.uneasyTo.z, 0.6);
        hold({ neck: 1, head: watch(), ears: 1, high: 1, tail: 0.6 });
        bird.doing = 'stepping high and stiff, uneasy, watching you';
        if (d < 0.4 || bird.stuck) uneasy = 0;
        return;
      }
      if (!male && !young && lie < 0.1 && herd.last > 12 && r() < dt * 0.07) {
        const a = Math.atan2(world.eye.z - at.z, world.eye.x - at.x) + (r() < 0.5 ? 1.57 : -1.57), d = 2.5 + r() * 2.5;
        const x = at.x + Math.cos(a) * d, z = at.z + Math.sin(a) * d;
        if (can(x, z)) { bird.uneasyTo = { x, z }; uneasy = 4 + r() * 3; }
      }
      stop(dt);
      if (lie < 0.5 && r() < dt * 0.15) pulse('stamp', 0.45);
      hold({ neck: lie > 0.5 ? 0.6 : 0.95, head: watch(), ears: 1 });
      bird.doing = lie > 0.5 ? 'lying with its head up, watching you' : 'standing still, head up, watching you';
      return;
    }

    // ---- at ease: the herd's own day, and what each member does in it on its own
    calm(dt, mode, inSpar);
  };

  // At ease. A spar it is in comes first; then the herd's walk in file, its drink, its lying up; and while it feeds,
  // now and then something of its own (`bit`).
  function calm(dt, mode, inSpar) {
    if (inSpar) { if (bit !== 'spar') begin('spar', 200); spar(dt); return; }
    if (mode === 'trek' && herd.trek) { trek(dt); return; }
    if (mode === 'drink' && drink(dt)) return;
    if (mode === 'rest' && lies()) { rest(dt); return; }
    if (lie > 0) { lie = Math.max(0, lie - dt / 2.4); stop(dt); hold({ neck: 0.6 }); bird.doing = 'getting up'; return; }
    if (bit) { doBit(dt); return; }
    nextBit -= dt;
    if (nextBit <= 0 && mood === 'graze' && chooseBit()) { if (bit === 'spar') spar(dt); else doBit(dt); return; }
    graze(dt);
  }

  // Lying up, chewing the cud (the cows, the calves, and a bull now and then: `lies`); now and then one gets up,
  // crops a little and lies down again.
  // (one that stood up to watch the walker, and was bedded when it did, lies down again as one settles: it dropped
  // from standing to lying in a fifth of a second)
  function lies() { if (restFor !== herd.restAt) { restFor = herd.restAt; lazy = !male || r() < 0.35; } return lazy; }
  function rest(dt) {
    if (bit) endBit();
    if ((mood !== 'bedded' && mood !== 'up' && mood !== 'settle') || (mood === 'bedded' && lie < 1)) { mood = 'settle'; spot = young ? pick() : spot || { x: at.x, z: at.z }; bird.spot = spot; }
    if (mood === 'settle') {
      if (Math.hypot(spot.x - at.x, spot.z - at.z) > 0.8 && !bird.stuck) { move(dt, spot.x, spot.z, GAITS.walk.pace * 0.7); hold({ neck: 0.5 }); bird.doing = 'walking to lie down'; return; }
      stop(dt); lie = Math.min(1, lie + dt / 3.2); hold({ neck: 0.5, head: { yaw: 0, pitch: -0.1 } });
      bird.doing = 'lying down';
      if (lie >= 1) { mood = 'bedded'; until = 30 + r() * 80; }
      return;
    }
    if (mood === 'bedded') {
      stop(dt); lie = 1;
      if (chew <= 0 && r() < dt * 0.5) chew = 3 + r() * 10;
      if (look <= 0) { look = 2 + r() * 8; bird.restHead = { yaw: (r() - 0.5) * 1.8, pitch: (r() - 0.5) * 0.3 }; }
      if (r() < dt * 0.3) pulse('ears', 0.5, (r() - 0.5) * 2);
      if (r() < dt * 0.4) pulse('tail', 0.6);
      if (chew > 0) mouth = 'chew';
      hold({ neck: 0.5, head: bird.restHead || { yaw: 0, pitch: 0 } });
      bird.doing = chew > 0 ? 'lying down, chewing the cud' : 'lying down, resting';
      // (now and then it gets up, crops a little and lies down again; more often it stays down)
      if (until < 0) { if (r() < 0.45) { mood = 'up'; until = 20 + r() * 30; } else until = 40 + r() * 80; }
      return;
    }
    // up for a while: rises, crops, then down again
    if (lie > 0) { lie = Math.max(0, lie - dt / 2.4); stop(dt); hold({ neck: 0.6 }); bird.doing = 'getting up'; return; }
    graze(dt);
    if (until < 0) { mood = 'settle'; spot = { x: at.x, z: at.z }; }
  }

  // A calf's mother, if she is about; and who one walks behind in file: a calf its mother, the rest the one before.
  function motherOf() {
    const i = party.mother ? party.mother[n] : -1, m = i >= 0 && party.members[i] ? party.members[i].bird : null;
    return m && m.left == null && m.state !== 'gone' ? m : null;
  }
  function ahead() {
    if (young) { const m = motherOf(); if (m) return m; }
    let prev = null;
    for (const b of herd.birds) { if (b === bird) break; if (b.left == null && b.state !== 'gone') prev = b; }
    return prev || leaderOf();
  }

  // ---- in file to somewhere else: the leader makes for the place; each of the rest walks behind the one before it,
  // a calf behind its mother. There, it feeds; at a bar by the river it goes down to drink first.
  function trek(dt) {
    const T = herd.trek;
    if (bit) endBit();
    if (lie > 0) { lie = Math.max(0, lie - dt / 2.2); stop(dt); hold({ neck: 0.6 }); bird.doing = 'getting up'; return; }
    mood = 'graze';
    const L = leaderOf();
    if (L === bird) {
      const d = move(dt, T.x, T.z, GAITS.walk.pace * 0.9);
      hold({ neck: 0.62, head: { yaw: 0, pitch: -0.05 }, tail: 0.15 });
      bird.doing = T.label;
      if (d < 4 || (bird.stuck && world.clock - T.since > 10) || world.clock - T.since > 160) {
        herd.centre = { x: at.x, z: at.z }; herd.trek = null;
        toMode(T.why === 'drink' ? 'drink' : 'graze', T.why === 'drink' ? 25 + r() * 25 : 40 + r() * 50);
        for (const b of herd.birds) b.spot = null;
      }
      return;
    }
    const A = ahead(), back = 3.3 * Math.max(0.7, bird.scale), h = A.heading ?? 0;
    const gx = A.at.x - Math.cos(h) * back, gz = A.at.z - Math.sin(h) * back, far = Math.hypot(gx - at.x, gz - at.z);
    move(dt, gx, gz, GAITS.walk.pace * (far > 8 ? 1.5 : 1.05));
    hold({ neck: 0.58, head: { yaw: 0, pitch: -0.05 }, tail: 0.15 });
    bird.doing = T.label;
  }

  // ---- drinking: each down to a spot of its own at the water's edge, facing the water, its muzzle in it; the head
  // comes up now and then, dripping, to look round. False if it found no spot (it feeds instead).
  function drink(dt) {
    if (drinkFor !== herd.since) { drinkFor = herd.since; drinkAt = waterSpot(); bird.drinkAt = drinkAt; sipping = 4 + r() * 6; }
    if (!drinkAt) return false;
    if (bit) endBit();
    if (lie > 0) { lie = Math.max(0, lie - dt / 2.4); stop(dt); hold({ neck: 0.6 }); bird.doing = 'getting up'; return true; }
    const d = Math.hypot(drinkAt.x - at.x, drinkAt.z - at.z);
    if (d > 0.5 && !bird.stuck) { move(dt, drinkAt.x, drinkAt.z, GAITS.walk.pace * 0.8); hold({ neck: 0.5 }); bird.doing = 'walking down to the water'; return true; }
    if (d > 3) { drinkAt = null; bird.drinkAt = null; return false; }
    stop(dt);
    const off = wrap(drinkAt.a - heading);
    if (Math.abs(off) > 0.08) { turnTo(heading + clamp(off, -1.1 * dt, 1.1 * dt)); face(); }
    sipping -= dt;
    if (sipping < -(1.5 + (n % 3) * 0.6)) sipping = 4 + r() * 6;
    if (sipping > 0) { mouth = 'lap'; hold({ neck: 0, head: { yaw: 0, pitch: -0.15 }, ears: 0 }); bird.doing = 'drinking at the creek'; }
    else { mouth = 'chew'; hold({ neck: 0.85, head: { yaw: (n % 2 ? 0.5 : -0.5), pitch: 0 }, ears: 0.8 }); bird.doing = 'lifting its head from the water, dripping, to look round'; }
    return true;
  }
  // (a spot a body's length back from the water, the nearest found looking sixteen ways, no nearer another's than 3 m;
  // found once, when the herd comes to drink)
  function waterSpot() {
    let best = null;
    for (let k = 0; k < 16; k += 1) {
      const a = (k / 16) * Math.PI * 2, c = Math.cos(a), s = Math.sin(a);
      for (let d = 1; d <= 16; d += 1) {
        const x = at.x + c * d, z = at.z + s * d, g = world.ground(x, z);
        if (g === 'steep') break;
        if (g !== 'water') continue;
        const back = 1.45 * bird.scale + 0.3, sx = x - c * back, sz = z - s * back;
        if (d > back && can(sx, sz) && !herd.birds.some((o) => o !== bird && o.drinkAt && Math.hypot(o.drinkAt.x - sx, o.drinkAt.z - sz) < 3)) {
          if (!best || d < best.d) best = { x: sx, z: sz, a, d };
        }
        break;
      }
    }
    return best;
  }

  // ---- what one does on its own while it feeds: a scratch, a shake, a reach into a shrub, a cow's quarrel; a bull's
  // spar, his antlers in the bushes, a forefoot pawing; a calf's run round its mother. Each entered by `begin` and left
  // by `endBit`, which clears what it was in the middle of. How often, and the weights, are the agent's own.
  // (its weights and how long each lasts: `BITS` and `LONG`, set before its first step)
  function begin(name, seconds) {
    bit = name; bitUntil = world.clock + seconds; loop = null; bird.nudge = null; mouth = null; side = r() < 0.5 ? -1 : 1;
    pulses.stamp = 0; pulses.tail = 0; pulses.ears = 0;
  }
  function endBit() {
    if (herd.spar && (herd.spar.a === bird || herd.spar.b === bird)) herd.spar = null;
    bit = null; loop = null; bird.foe = null;
    nextBit = male || young ? 5 + r() * 10 : 9 + r() * 16;
  }
  function chooseBit() {
    let sum = 0;
    for (const [, w] of BITS) sum += w;
    let pick0 = r() * sum, name = BITS[0][0];
    for (const [k, w] of BITS) { pick0 -= w; if (pick0 <= 0) { name = k; break; } }
    if (name === 'spar') {
      // a partner: another antlered male of the herd, on his feet and not sparring, within 30 m
      let other = null, best = 30;
      for (const b of herd.birds) {
        if (b === bird || b.left != null || b.state === 'gone' || !b.sparrable || !b.sparrable()) continue;
        const d = Math.hypot(b.at.x - at.x, b.at.z - at.z);
        if (d < best) { best = d; other = b; }
      }
      if (!other || herd.spar) name = 'thrash';
      else {
        herd.spar = { a: bird, b: other, stage: 'meet', since: world.clock, clashes: 2 + Math.floor(r() * 3), D: 1.3785 * (bird.scale + other.scale) + 0.02, t: 0, shoves: 0, v: 0, aim: 0, sep: 0, w: 0 };
        begin('spar', 200);
        return true;
      }
    }
    if (name === 'box') {
      // a cow's quarrel: up on her hind legs, striking out at another cow that stands near
      let foe = null;
      for (const b of herd.birds) if (b !== bird && b.left == null && b.state === 'stand' && b.make && b.make.sex === 'cow' && Math.hypot(b.at.x - at.x, b.at.z - at.z) < 6.5) { foe = b; break; }
      if (!foe) name = 'browse'; else bird.foe = foe;
    }
    const [a, b] = LONG[name];
    const foe = bird.foe;
    begin(name, a + r() * (b - a));
    bird.foe = foe;
    return true;
  }
  function doBit(dt) {
    switch (bit) {
      case 'scratch':
        stop(dt); beat += dt * 2.2;
        hold({ scratch: side, neck: 0.5, head: { yaw: side * 0.45, pitch: -0.1, tilt: side * 0.35 }, ears: -0.3 });
        bird.doing = 'scratching an ear with a hind hoof';
        break;
      case 'shake':
        stop(dt); beat += dt;
        hold({ shake: 1, neck: 0.62, ears: -0.4, tail: 0.5 });
        bird.doing = 'shaking itself';
        break;
      case 'browse':
        stop(dt); mouth = 'crop';
        hold({ neck: 0.95, head: { yaw: Math.sin(world.clock * 0.9 + n) * 0.3, pitch: 0.32 }, ears: 0.1 });
        bird.doing = 'browsing the leaves of a shrub';
        break;
      case 'box': {
        const foe = bird.foe;
        if (!foe || foe.left != null || foe.state === 'gone') { endBit(); graze(dt); return; }
        stop(dt);
        const off = wrap(Math.atan2(foe.at.z - at.z, foe.at.x - at.x) - heading);
        if (Math.abs(off) > 0.15) { turnTo(heading + clamp(off, -1.6 * dt, 1.6 * dt)); face(); }
        const up = Math.abs(off) < 0.5 && world.clock < bitUntil - 0.4;
        if (up) beat += dt * 1.7;
        hold({ rear: up ? 1 : 0, box: up ? 1 : 0, neck: 0.9, ears: -0.9, tail: 0.5 });
        bird.doing = 'rearing up to strike out at another cow';
        break;
      }
      case 'thrash':
        stop(dt);
        hold({ neck: 0.28, head: { yaw: Math.sin(world.clock * 5.2 + n) * 0.55, pitch: -0.35, tilt: Math.sin(world.clock * 5.2 + n + 1.1) * 0.4 }, ears: -0.5, tail: 0.3 });
        bird.doing = 'thrashing the bushes with his antlers';
        break;
      case 'paw':
        stop(dt); rake += dt * 1.5;
        hold({ dig: 1, rake, reach: 0.35, at: 0, neck: 0.35, head: { yaw: 0, pitch: -0.25 }, ears: -0.2 });
        bird.doing = 'pawing the ground';
        break;
      case 'loop': { if (calfLoop(dt)) return; break; }
      default: endBit(); graze(dt); return;
    }
    if (world.clock > bitUntil) endBit();
  }
  // A calf's run: once or twice round its mother at a canter, its tail up, then back to her at a trot. True when it
  // has ended (it has stepped already).
  function calfLoop(dt) {
    const m = motherOf() || leaderOf();
    if (m === bird) { endBit(); graze(dt); return true; }
    if (!loop) loop = { a: Math.atan2(at.z - m.at.z, at.x - m.at.x), dir: side, r: 4 + r() * 2.5, left: Math.PI * 2 * (1 + r() * 0.7), v: 3 + r() * 1.2, home: false };
    if (!loop.home) {
      loop.a += (loop.dir * loop.v * dt) / loop.r; loop.left -= (loop.v * dt) / loop.r;
      const lead = loop.a + loop.dir * 0.55;
      move(dt, m.at.x + Math.cos(lead) * loop.r, m.at.z + Math.sin(lead) * loop.r, loop.v);
      hold({ neck: 0.8, head: { yaw: loop.dir * 0.2, pitch: 0.1 }, tail: 1, ears: 0.4 });
      bird.doing = 'running a loop round its mother, kicking up its heels';
      if (bird.stuck || loop.left <= 0 || world.clock > bitUntil) loop.home = true;
      return false;
    }
    const a = Math.atan2(at.z - m.at.z, at.x - m.at.x), d = move(dt, m.at.x + Math.cos(a) * 3.2, m.at.z + Math.sin(a) * 3.2, 2.2);
    hold({ neck: 0.75, tail: 0.6 });
    bird.doing = 'trotting back to its mother';
    if (d < 0.8 || bird.stuck || world.clock > bitUntil + 10) { endBit(); spot = null; bird.spot = null; return true; }
    return true;
  }

  // ---- two bulls sparring: one bout, kept on the herd (`herd.spar`), for the two of them. The one who began it (`a`)
  // walks up to the other, who turns to meet him with his antlers low; then they come together, lock antlers and shove,
  // a few steps one way and then the other, back off a stride with their heads up, stand, and meet again, two to
  // four times. From the moment they lock, `a` moves both of them, by the bout's own numbers: the middle between them
  // (`mx`, `mz`) goes along the line from `a` to `b` (`ux`, `uz`) at `v`, and the two stand `D` + `sep` apart, `sep`
  // growing at `w`; each bull's place, its facing, its pace and whether its steps go backwards follow from those, so
  // the two never part and no foot slides. `D` is where the heads meet: 2.95 m at a prime bull's size (the plates'
  // studio, `pair=spar`), as the two sizes are, and 2 cm more, which keeps the bodies 5 cm and more apart as the
  // count of walks measures them. Every time and pace is the agent's own.
  function spar(dt) {
    const S = herd.spar, mine = S.a === bird, other = mine ? S.b : S.a;
    if (other.left != null || other.state === 'gone' || world.clock - S.since > 150) { herd.spar = null; endBit(); graze(dt); return; }
    if (lie > 0) { lie = Math.max(0, lie - dt / 2); stop(dt); hold({ neck: 0.6 }); bird.doing = 'getting up'; return; }
    mood = 'graze';
    if (S.stage === 'meet') {
      const dx = at.x - other.at.x, dz = at.z - other.at.z, d = Math.hypot(dx, dz) || 1, near = d < 7;
      if (mine) {
        move(dt, other.at.x + (dx / d) * S.D, other.at.z + (dz / d) * S.D, d > 9 ? GAITS.walk.pace : 0.6);
        hold({ neck: near ? 0.3 : 0.85, head: { yaw: 0, pitch: near ? -0.3 : 0 }, ears: -0.4, high: !near && d < 14 ? 0.8 : 0 });
        bird.doing = near ? 'lowering his antlers to spar' : 'walking up to spar, stiff and high';
        const facing = Math.abs(wrap(Math.atan2(-dz, -dx) - heading)) < 0.3 && Math.abs(wrap(Math.atan2(dz, dx) - (other.heading ?? 0))) < 0.35;
        if (d < S.D + 0.35 && facing) lock(S, other, d);
        else if (bird.stuck || world.clock - S.since > 25) { herd.spar = null; endBit(); }
      } else {
        stop(dt);
        const off = wrap(Math.atan2(-dz, -dx) - heading);
        if (Math.abs(off) > 0.04) { turnTo(heading + clamp(off, -1.3 * dt, 1.3 * dt)); face(); }
        hold({ neck: near ? 0.3 : 0.85, head: { yaw: 0, pitch: near ? -0.3 : 0 }, ears: -0.4 });
        bird.doing = 'turning to meet him, his antlers low';
      }
      return;
    }
    if (mine) shove(S, other, dt);
    if (herd.spar !== S) { stop(dt); hold({ neck: 0.9, ears: 0.6 }); bird.doing = 'breaking off, his head up'; return; }
    // its own share of the bout: facing the other; going forwards or back along the line between them
    const along = mine ? S.v - S.w / 2 : -(S.v + S.w / 2);         // (along the way it faces, m/s)
    heading = mine ? Math.atan2(S.uz, S.ux) : Math.atan2(-S.uz, -S.ux);
    ground(); face();
    speed = Math.abs(along); want = speed; bird.speed = speed; backing = along < 0;
    const locked = S.stage === 'lock', low = locked || S.stage === 'close';
    const push = locked ? (mine ? S.push : -S.push) : 0, tw = Math.sin(world.clock * 2.1 + (mine ? 0 : 1.7));
    hold({ spar: low ? 1 : 0, push, neck: low ? 0.6 : 0.95, head: { yaw: low ? 0 : (mine ? 0.15 : -0.15), pitch: 0, tilt: low ? tw * 0.16 : 0 }, ears: low ? -0.7 : 0.6, tail: locked ? 0.5 : 0.2 });
    bird.doing = !locked ? (S.stage === 'close' ? 'coming together again, antlers low' : S.stage === 'back' ? 'backing off from the other bull' : 'breaking off, heads up, to spar again')
      : S.v * (mine ? 1 : -1) > 0.05 ? 'sparring: antlers locked, shoving the other bull back'
      : S.v * (mine ? 1 : -1) < -0.05 ? 'sparring: antlers locked, giving ground'
      : 'sparring: antlers locked, braced and pushing';
    if (locked && !S.seen && world.event && world.plainly(bird)) { S.seen = true; event('sparred in plain sight'); }
  }
  // (they meet: the bout's line and middle are where they are, and they come together the last few centimetres)
  function lock(S, other, d) {
    S.ux = (other.at.x - at.x) / d; S.uz = (other.at.z - at.z) / d;
    S.mx = (at.x + other.at.x) / 2; S.mz = (at.z + other.at.z) / 2;
    S.sep = Math.max(0, d - S.D); S.v = 0; S.w = 0; S.aim = 0; S.stage = 'close'; S.t = 4;
  }
  // The bout, stepped by the one who began it: where it is, and both bulls set where it puts them, if both can stand
  // there with room from every other animal; if not, that shove goes no further.
  function shove(S, b, dt) {
    S.t -= dt;
    let wAim = 0;
    if (S.stage === 'lock') {
      if (S.t <= 0) {
        if (S.shoves <= 0) { S.stage = 'back'; S.t = 3; S.aim = 0; }
        else {
          S.shoves -= 1;
          const k = r();
          S.aim = k < 0.3 ? 0 : (k < 0.65 ? 1 : -1) * (0.3 + r() * 0.3);
          S.push = S.aim > 0 ? 1 : S.aim < 0 ? -1 : (r() - 0.5) * 0.6;
          S.t = S.aim ? 1 + r() * 1.4 : 1 + r() * 1.5;
        }
      }
    } else if (S.stage === 'back') { S.aim = 0; wAim = S.sep < 1.2 ? 0.7 : 0; if (S.sep >= 1.2 || S.t <= 0) { S.stage = 'apart'; S.t = 1.5 + r() * 1.8; } }
    else if (S.stage === 'apart') {
      S.aim = 0;
      if (S.t <= 0) { if (S.clashes > 0) { S.stage = 'close'; S.t = 4; } else { herd.spar = null; endBit(); return; } }
    } else if (S.stage === 'close') {
      S.aim = 0; wAim = -0.6;
      if (S.sep <= 0.005 || S.t <= 0) { S.sep = Math.max(0, S.sep); S.stage = 'lock'; S.clashes -= 1; S.shoves = 2 + Math.floor(r() * 3); S.t = 0.6 + r() * 0.6; S.push = 0; S.w = 0; }
    }
    // (the paces come up and go down over a fraction of a second: the shares of the stride follow them, and the feet stay)
    S.v += clamp(S.aim - S.v, -1.4 * dt, 1.4 * dt);
    S.w += clamp(wAim - S.w, -1.6 * dt, 1.6 * dt);
    if (S.stage === 'close' && S.sep + S.w * dt < 0) S.w = -S.sep / Math.max(dt, 1e-3);
    if (Math.abs(S.v) < 1e-4 && Math.abs(S.w) < 1e-4) { S.v = 0; S.w = 0; }
    const mx = S.mx + S.ux * S.v * dt, mz = S.mz + S.uz * S.v * dt, sep = Math.max(0, S.sep + S.w * dt), half = (S.D + sep) / 2;
    // (each stands 2 cm to its own left of the line between them: on one line, the two bodies' middle lines, end to end,
    // were taken for lines that cross, as often as not, by the count of walks' test of two bodies, life/visit.js `apart`)
    const ax = mx - S.ux * half + S.uz * 0.02, az = mz - S.uz * half - S.ux * 0.02, bx = mx + S.ux * half - S.uz * 0.02, bz = mz + S.uz * half + S.ux * 0.02;
    const moved = S.v !== 0 || S.w !== 0;
    if (moved && !(bird.fits(ax, az, Math.atan2(S.uz, S.ux), b) && b.fits(bx, bz, Math.atan2(-S.uz, -S.ux), bird))) {
      // (no room that way: the shove stops where it is, and backing off is done)
      S.v = 0; S.w = 0; S.aim = 0; if (S.stage === 'back') S.t = 0;
      if (S.stage === 'close') { herd.spar = null; endBit(); }
      return;
    }
    S.mx = mx; S.mz = mz; S.sep = sep;
    at.x = ax; at.z = az; b.at.x = bx; b.at.z = bz;
    at.y = world.height(ax, az); b.at.y = world.height(bx, bz);
  }

  // Grazing: head down, cropping, a step or two at a time; the head comes up now and then to look about while it
  // chews; now and then it walks a few metres to a new patch near the rest of the herd.
  function graze(dt) {
    if (!bird.spot || !spot) { spot = pick(); bird.spot = spot; }
    if (mood === 'shift') {
      const d = move(dt, spot.x, spot.z, GAITS.walk.pace * 0.75);
      hold({ neck: 0.45, head: { yaw: 0, pitch: -0.25 } });
      bird.doing = 'walking on to fresh grass';
      if (d < 0.6 || bird.stuck) { mood = 'graze'; bout = 4 + r() * 10; if (bird.stuck) { spot = { x: at.x, z: at.z }; bird.spot = spot; } }
      return;
    }
    if (mood === 'look') {
      stop(dt);
      if (look <= 0) { look = 0.8 + r() * 2; bird.lookAt = { yaw: (r() - 0.5) * 2.4, pitch: (r() - 0.5) * 0.2 }; }
      if (r() < dt * 0.6) pulse('ears', 0.4, (r() - 0.5) * 2);
      mouth = 'chew';
      hold({ neck: 0.85, head: bird.lookAt || { yaw: 0, pitch: 0 } });
      bird.doing = 'looking about, chewing';
      if (until < 0) { mood = 'graze'; until = 12 + r() * 30; }
      return;
    }
    // cropping
    mood = 'graze';
    if (bout <= 0) {
      // a step or two forward, still cropping
      bout = 3 + r() * 9;
      const a = heading + (r() - 0.5) * 1.2, step = 0.4 + r() * 0.6;
      bird.nudge = { x: at.x + Math.cos(a) * step, z: at.z + Math.sin(a) * step };
    }
    if (bird.nudge && Math.hypot(bird.nudge.x - at.x, bird.nudge.z - at.z) > 0.15) move(dt, bird.nudge.x, bird.nudge.z, 0.6);
    else { bird.nudge = null; stop(dt); }
    if (r() < dt * 0.3) pulse('tail', 0.6);
    mouth = 'crop';
    hold({ neck: 0, head: { yaw: Math.sin(world.clock * 0.7 + n) * 0.25, pitch: 0 }, ears: -0.2 });
    bird.doing = 'grazing';
    if (until < 0) {
      if (r() < 0.65) { mood = 'look'; until = 2 + r() * 5; }
      else { mood = 'shift'; spot = pick(); bird.spot = spot; until = 15 + r() * 25; }
    }
  }
}

// ---- where a herd is on a visit: an open place near the walk (habitat.grazing), chosen by the hour: at dawn,
// dusk and by night the meadow, the banks' grass and the bars; at midday the open floor under the trees, where it
// lies up. Not within sixty metres of another herd. A party of the census is a herd of cows and yearlings, or (one
// time in four) a few bulls together.
export function elkHome(habitat, r, taken = [], hour = 12) {
  // (an arriving herd is placed by its members as they come: life/visit.js gives them all this one object)
  const all = habitat.grazing();
  if (!all.length) return null;
  const midday = hour > 10 && hour < 16.5;
  const weight = (p) => {
    const w = { grass: midday ? 1 : 4, stones: midday ? 0.4 : 2, wet: 1.5, floor: midday ? 3 : 1 }[p.ground] || 0.5;
    return taken.some((h) => Math.hypot(h.x - p.x, h.z - p.z) < 60) ? 0 : w;
  };
  const sum = all.reduce((a, p) => a + weight(p), 0);
  if (!(sum > 0)) return null;
  let pick = r() * sum, at = all[0];
  for (const p of all) { pick -= weight(p); if (pick <= 0) { at = p; break; } }
  return { x: at.x, z: at.z, ground: at.ground, radius: at.ground === 'floor' ? 7 : 10 };
}
