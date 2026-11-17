import * as THREE from 'three';
import { onLimb } from '../perch.js';
import { frame, UP, spot, flying } from '../agents.js';
import * as behave from '../behave.js';
import { optional, nums, list, test } from '../bodies.js';

// Owls: the Barred Owl, the Spotted Owl, the Northern Saw-whet Owl, the Western Screech-Owl and the Northern
// Pygmy-Owl. Each is one of a visit's own, alone, and keeps to its own part of the valley.
//
// What it does. By day an owl of the night roosts on a limb close against the trunk of a tree, upright and still,
// its eyes half shut, now and then opening them and turning its head; it is seldom seen. From dusk it hunts: it sits
// on a perch a few metres up (a limb, the stub of a broken one, the top of a stump), watching the floor and turning
// its head in jerks, bobbing it to fix on something; it drops onto what it has heard or seen, mantles over it on the
// ground with its wings half spread, and either has it or has missed; it moves on in a long gliding flight to
// another perch; and it calls its own song. At first light it goes back to a roost. The Pygmy-Owl is the other way
// about: it hunts by day from the end of a limb or the top of a snag, its tail cocked and flicking, and dashes at
// the small birds of the boughs; by night it roosts.
//
// It sits tight. It lives on life/behave.js, and its numbers (`flush`, `startle`: each kind's file) make a roosting
// owl let the walker pass beneath it: it flushes only when they come within a few metres, which under a roost
// higher than a walker's head they cannot, and a sudden movement puts it up only within a metre or two more. Flushed,
// it goes to another perch near by (another roost by day), seldom off out of sight. At roost it does not take a
// hunting hawk's alarm (the raptors' hook in life/behave.js, where there is one): it keeps still.
//
// The Barred and the Spotted Owl. The Barred Owl came west through the last century and has taken the Spotted
// Owl's territories: it "hybridizes with and loses nest sites to barred owls", and the Spotted Owl on the north of
// the Olympic Peninsula is falling about four in a hundred a year, from competition with it (the repository's own
// reading of BirdWeb and of the state's account, .local-assets/forest/research/animals-2026-11-16.json). The
// agent's call from that: the two are never about on one visit. A Spotted Owl is given no home on a visit on which a
// Barred Owl has one (`ousts`, `ousted`; the Barred Owl comes first in the roll, so its home is given first).
//
// Small birds and the Pygmy-Owl. When it dashes at a small bird, the alarm of a hunting hawk is raised for it, if
// the shared skeleton has one (life/behave.js `raise`, the raptors' hook: the small birds near it flush, as from a
// hawk); with none, it dashes all the same and the small bird stays. Small birds mobbing a Pygmy-Owl (coming in to
// scold it) needs their own families to answer an owl that is about by day: not built here. What is built here is
// the owl's side of it: with small birds about it for a while, it moves off (`mobbed`).
//
// What was read (each kind's file says where): where each roosts (dense shade, thick evergreens, broad-leaved wood
// by streams) and when, that each waits on a perch and drops onto what it finds, the songs, the Pygmy-Owl's hunting
// by day, its head bobbed and its tail flicked up and down and held to one side, that it is fast enough to chase
// small birds, and that an owl flies without a sound (the Pygmy-Owl's wings whirr) and glides between beats. The
// agent's own: a roost close against the trunk on a limb (the brief's picture), every distance, time, height and
// chance here, the head's movements and the mantling.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _axis = new THREE.Vector3(), _q = new THREE.Quaternion();

// The trunk's middle at a height above its foot (into `out`, in the world), and its radius there (-1: no trunk).
function axisAt(place, height, out) {
  const a = place.axis, h = place.heights;
  if (!a || a.length < 2) return -1;
  let k = 0;
  while (k < h.length - 2 && h[k + 1] < height) k += 1;
  const f = clamp((height - h[k]) / Math.max(h[k + 1] - h[k], 1e-6), 0, 1);
  out.set(a[k].x + (a[k + 1].x - a[k].x) * f, a[k].y + (a[k + 1].y - a[k].y) * f, a[k].z + (a[k + 1].z - a[k].z) * f).applyMatrix4(place.matrix);
  return (a[k].reach + (a[k + 1].reach - a[k].reach) * f) * place.scale;
}

// Can a bird sit on a limb where it runs this way (`along`, a unit vector) and is this thick (`radius`, m)? A perch
// on a limb is 0.96 of the limb's radius straight above its middle line (life/perch.js `onLimb`), which is its upper
// side only where it lies level: where it climbs, its upper side is the radius over the cosine of its slope above the
// middle line, and the bird's feet are in the wood by the difference. Measured on the habitat as built, 2026-11-16:
// up to 0.88 m on a bigleaf maple's great limbs, 0.56 m on the old cedar, 0.3 m on the apple and the vine maples,
// and under a centimetre on every hemlock and spruce. And an owl sits across its limb: one that climbs steeply
// goes up through the side of the bird. So: no steeper than the kingfisher's posts (life/places/kingfisher.js LEVEL:
// 0.8 up in a metre along the level), and the feet no more than a centimetre in the wood. Both bounds are the
// agent's. (life/families/raptor.js has the same rule for the hawks.)
const STEEP = 0.8 / Math.hypot(1, 0.8), SUNK = 0.01;
const sits = (along, radius) => Math.abs(along.y) <= STEEP && radius * (1 / Math.sqrt(1 - along.y * along.y) - 0.96) <= SUNK;

// The places on a tree an owl can roost: on each limb at a height it roosts at, as near the trunk as its side
// clears the bark (`room`, m from the bark to the bird's middle) and the limb can be sat on (`sits`: a limb that
// leaves the trunk climbing may level further out). Each { point, along, radius, tree }.
function roostsOn(tree, perchesOf, roost, room) {
  const out = spot(), found = [];
  for (const p of perchesOf(tree)) {
    if (p.share !== 0.3 || p.above < roost.low || p.above > roost.high || p.radius < roost.thin) continue;
    for (let share = 0.03; share <= 0.6; share += 0.015) {
      const radius = onLimb(tree.place, tree.limbs, p.tube, share, out);
      const bark = axisAt(tree.place, out.point.y - tree.place.foot.y, _axis);
      if (bark < 0) break;
      if (Math.hypot(out.point.x - _axis.x, out.point.z - _axis.z) - bark >= room && sits(out.along, radius)) { found.push({ point: out.point.clone(), along: out.along.clone(), radius, tree }); break; }
    }
  }
  return found;
}

// (the visits on which a Barred Owl has a home: by the visit's own stream of random numbers, which is one to a visit)
const OUSTING = new WeakSet();

function owl(a) {
  const { bird, world, way, r } = a, home = bird.home, rest = bird.sheet.poses.perched;
  const night = !way.day;                                         // an owl of the night (all but the Pygmy-Owl)
  const room = bird.size * 0.22;
  const tailRest = rest.tail && rest.tail.pitch != null ? rest.tail.pitch : 0;
  const at = { point: new THREE.Vector3(), face: new THREE.Vector3(1, 0, 0), radius: 0.03, grip: true, roost: false };
  let calls = way.song.every[0] * (0.2 + 0.8 * r()), flick = 1 + r() * 3, mob = 0, again = 0;
  const awake = () => (night ? world.day < 0.5 : world.day > 0.5);
  const height = (p) => p.y - world.height(p.x, p.z);

  // where it sits, facing `face` along the level; and how it sits (feet gripping a limb, or flat on a top)
  const settle = () => { bird.at.copy(at.point); frame(_v.copy(at.face).setY(0).lengthSq() > 1e-6 ? _v : _v.set(1, 0, 0), UP, bird.q); };
  const feet = () => (at.grip ? { ...(rest.feet || {}), mode: 'grip', round: Math.max(0.004, at.radius) } : { mode: 'flat' });
  const sit = (extra = {}) => Object.assign(bird.want, { pitch: rest.pitch, lift: rest.lift, lean: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0, feet: feet() }, extra);
  const tail = (extra) => ({ pitch: tailRest + (way.cock || 0), fan: 0, yaw: 0, prop: null, ...extra });

  // ---- places
  // across a limb, one way or the other
  const across = (along) => _w.crossVectors(along, UP).setY(0).normalize().multiplyScalar(r() < 0.5 ? 1 : -1).clone();
  // the hunting perches within `reach` of a point: limbs (their outer ends, for a kind that keeps to them), stubs,
  // the tops of stumps (and, for a kind that takes them, of snags), as high as it hunts from; a limb only where it
  // can be sat on (`sits`, above; no stub of the habitat's is steep, or thick enough to matter); free, clear of the
  // walker, and `least` metres from where it is. Each is weighted by how open it is (`w`): a stub standing out from a
  // big trunk, or a snag's top, is taken three or four times as often as a limb among a young hemlock's boughs,
  // where the boughs' own foliage hid the owl from the walk (the agent's numbers).
  const perches = (x, z, reach, least = 0) => {
    const found = [], H = way.hunt;
    const ok = (p) => { const up = height(p); return up >= H.low && up <= H.high && p.distanceTo(bird.at) >= least && world.free(p, bird, 0.5) && a.clear(p); };
    for (const s of world.stubsNear(x, z, reach, [])) if (s.radius >= 0.015 && ok(s.point)) found.push({ point: s.point, face: s.along, radius: s.radius, grip: true, w: 3 });
    for (const b of world.boughsNear(x, z, reach, [])) if (b.radius >= H.thin && (b.share > 0.5 || !way.ends) && sits(b.along, b.radius) && ok(b.point)) found.push({ point: b.point, face: across(b.along), radius: b.radius, grip: true, w: b.tree && b.tree.kind === 'pole' ? 0.4 : 1 });
    for (const s of world.stumps) if (Math.hypot(s.x - x, s.z - z) <= reach && ok(s.point)) found.push({ point: s.point, face: null, radius: 0.1, grip: false, w: 1 });
    if (way.snags) for (const t of world.trunksNear(x, z, reach, [])) {
      if (t.kind !== 'snag' || t.top > H.high + 2) continue;
      if (axisAt(t, t.top - 0.04, _axis) >= 0 && ok(_axis)) found.push({ point: _axis.clone(), face: null, radius: 0.1, grip: false, w: 4 });
    }
    return found;
  };
  // one of a list: by its weight where it has one, otherwise as likely as any other
  const pickOf = (choices) => {
    if (!choices.length) return null;
    let total = 0;
    for (const c of choices) total += c.w ?? 1;
    let left = r() * total;
    for (const c of choices) { left -= c.w ?? 1; if (left < 0) return c; }
    return choices[choices.length - 1];
  };
  // a roost: on a tree of the kinds it roosts in, within `reach` of a point
  const roostNear = (x, z, reach, least = 0) => {
    const trees = world.leafyNear(x, z, reach, []).filter((t) => way.roost.trees.includes(t.kind));
    for (let tries = 0; trees.length && tries < 6; tries += 1) {
      const tree = trees[Math.floor(r() * trees.length)];
      const spots = roostsOn(tree, world.perchesOf, way.roost, room).filter((s) => s.point.distanceTo(bird.at) >= least && world.free(s.point, bird, 0.5) && a.clear(s.point));
      const one = pickOf(spots);
      if (one) return { point: one.point, face: across(one.along), radius: one.radius, grip: true, roost: true };
    }
    return null;
  };

  // off to a place, landing into `landing`
  const go = (place, landing, doing, speed) => {
    const to = place.point.clone(), face = place.face || _v.subVectors(to, bird.at).setY(0).normalize().clone();
    a.fly({ at: to, q: frame(face.lengthSq() > 1e-6 ? face : _w.set(1, 0, 0), UP, _q).clone(), rise: 0.3, floor: world.height, speed }, landing, { ...place, face });
    if (doing) bird.doing = doing;
    return true;
  };
  const sitAt = (place) => { at.point.copy(place.point); at.face.copy(place.face || _v.set(Math.cos(r() * 6.283), 0, Math.sin(r() * 6.283))); at.radius = place.radius; at.grip = place.grip; at.roost = !!place.roost; settle(); };

  // its song, now and then while it is abroad (by day, an owl of the night only seldom: `song.day`); true as it begins
  const singing = (dt) => {
    calls -= dt;
    if (calls > 0) return false;
    calls = way.song.every[0] + r() * (way.song.every[1] - way.song.every[0]);
    if (!awake() && r() >= (way.song.day || 0)) return false;
    world.say(bird, 'song', way.song.reach, way.song.time);
    a.now.song = way.song.time;
    return true;
  };

  // ---- at roost: upright and still, its eyes half shut, now and then open and looking about
  const roost = {
    pose: () => ({ pitch: rest.pitch + 0.04, lift: rest.lift - 0.04, head: { yaw: 0, pitch: -0.05, roll: 0 }, gape: way.doze }),
    // (not put up by a hunting hawk's alarm at roost: it keeps still. The skeleton passes over alarms for an activity
    // that says so, and the walker's rule stands as it does for any bird. It was `wary`, false while an alarm it had
    // not answered was near: and for those seconds, up to twenty, a walker could come right up to it.)
    alarm: false,
    enter(a, place) { sitAt(place); bird.want.feet = feet(); Object.assign(a.now, { open: 0, until: 6 + r() * 20, look: { yaw: 0, pitch: -0.05, roll: 0 }, wake: 2 + r() * 8, song: 0 }); },
    step(a, dt) {
      const now = a.now;
      // abroad again: off to hunt, a few seconds after the light has gone (or come, for the Pygmy-Owl)
      if (awake()) {
        now.wake -= dt;
        if (now.wake <= 0) { const p = pickOf(perches(home.x, home.z, way.hunt.reach[1])); if (p && go(p, 'watch', night ? 'off from its roost to hunt' : 'off from its roost')) return; now.wake = 3 + r() * 5; }
      }
      // a song from the roost (seldom, by day)
      if (now.song > 0) { now.song -= dt; sit({ head: { yaw: now.look.yaw * 0.3, pitch: 0.1, roll: 0 }, gape: 0 }); bird.doing = way.song.doing; return; }
      if (singing(dt)) return;
      now.until -= dt;
      if (now.open > 0) {
        now.open -= dt;
        if (now.until < 0) { now.until = 0.8 + r() * 2.2; now.look = { yaw: (r() - 0.5) * 2.2, pitch: (r() - 0.5) * 0.5, roll: (r() - 0.5) * 0.2 }; bird.snap = true; }
        sit({ pitch: rest.pitch + 0.02, head: now.look, gape: 0 });
        bird.doing = 'at roost, its eyes open, looking about';
        if (now.open <= 0) now.until = 10 + r() * 35;
        return;
      }
      if (now.until < 0) { now.open = 2 + r() * 5; now.until = 0; return; }
      sit({ pitch: rest.pitch + 0.04, lift: rest.lift - 0.04, head: { yaw: now.look.yaw * 0.3, pitch: -0.05, roll: 0 }, gape: way.doze });
      bird.doing = 'roosting close against the trunk, its eyes half shut';
    },
  };

  // ---- on a hunting perch: watching the floor
  const watch = {
    pose: () => ({ pitch: rest.pitch - 0.08, head: { yaw: 0, pitch: -0.4, roll: 0 }, gape: 0, tail: tail() }),
    enter(a, place) { sitAt(place); bird.want.feet = feet(); Object.assign(a.now, { wait: way.hunt.wait[0] + r() * (way.hunt.wait[1] - way.hunt.wait[0]), look: 0, head: { yaw: 0, pitch: -0.4, roll: 0 }, bob: 0, song: 0, flicking: 0, aside: way.flick ? (r() - 0.5) * 0.6 : 0 }); },
    step(a, dt) {
      const now = a.now;
      // roosting time: back to a roost near its home
      if (!awake()) {
        again -= dt;
        if (again <= 0) { const place = roostNear(home.x, home.z, 30) || roostNear(bird.at.x, bird.at.z, 30); if (place && go(place, 'roost', night ? 'flying back to roost at first light' : 'flying off to roost')) return; again = 4; }
      }
      // small birds about it by day, for a while: it moves off
      if (way.mobbed && world.day > 0.5) {
        const near = world.others(bird.at.x, bird.at.z, 6, bird, []).filter((b) => b.size < bird.size * 1.3 && b.key !== bird.key && b.state !== 'gone' && !(b.sheet && b.sheet.plan && b.sheet.plan !== 'bird')).length;
        mob = near >= 2 ? mob + dt : Math.max(0, mob - dt * 0.5);
        if (mob > way.mobbed) { mob = 0; const p = pickOf(perches(bird.at.x, bird.at.z, way.hunt.reach[1], way.hunt.reach[0])); if (p && go(p, 'watch', 'moving off from the small birds round it')) return; }
      }
      // its song
      if (now.song > 0) { now.song -= dt; sit({ pitch: rest.pitch - 0.02, head: { yaw: now.head.yaw * 0.3, pitch: 0.12, roll: 0 }, gape: 0, tail: tail() }); bird.doing = way.song.doing; return; }
      if (singing(dt)) return;
      // the head: turned in jerks, now and then bobbed to fix on something
      now.look -= dt; now.wait -= dt;
      if (now.look < 0) {
        now.look = 0.6 + r() * 2.2;
        if (r() < 0.25) now.bob = 0.7;
        now.head = { yaw: (r() - 0.5) * 2.6, pitch: -0.15 - r() * 0.75, roll: (r() - 0.5) * 0.25 };
        bird.snap = true;
      }
      let head = now.head;
      if (now.bob > 0) { now.bob -= dt; head = { ...head, pitch: head.pitch + 0.18 * Math.sin(now.bob * 22), roll: head.roll + 0.12 * Math.sin(now.bob * 11) }; }
      // a Pygmy-Owl's tail, cocked, held to one side and flicked up and down (BirdWeb)
      let t = tail({ yaw: now.aside });
      if (way.flick) {
        flick -= dt;
        if (flick < 0) { flick = way.flick[0] + r() * (way.flick[1] - way.flick[0]); now.flicking = 0.36; if (r() < 0.3) now.aside = (r() - 0.5) * 0.6; }
        if (now.flicking > 0) { now.flicking -= dt; t = tail({ pitch: tailRest + (way.cock || 0) + 0.4 * Math.abs(Math.sin(now.flicking * 26)), yaw: now.aside, fan: 0.12 }); bird.snap = true; }
      }
      sit({ pitch: rest.pitch - 0.08, head, gape: 0, tail: t });
      bird.doing = now.bob > 0 ? 'bobbing its head, fixing something on the floor' : (way.day ? 'on its perch, watching, its tail cocked' : 'on a perch, watching the floor');
      if (now.wait > 0) return;
      now.wait = way.hunt.wait[0] + r() * (way.hunt.wait[1] - way.hunt.wait[0]);
      // a small bird near by, in the open: it dashes at it (the Pygmy-Owl)
      if (way.dash && world.day > 0.5 && r() < way.dash.chance && dash()) return;
      // something on the floor: it drops onto it
      if (r() < way.hunt.drop && drop()) return;
      // or it moves on, to another perch
      const p = pickOf(perches(bird.at.x, bird.at.z, way.hunt.reach[1], way.hunt.reach[0]));
      if (p) go(p, 'watch', way.flies || 'gliding off to another perch, without a sound');
    },
  };

  // a dash at a small bird: fast at it, and onto a perch near where it was
  const dash = () => {
    const prey = world.others(bird.at.x, bird.at.z, way.dash.reach, bird, []).filter((b) => b.size < bird.size && b.state !== 'fly' && b.state !== 'gone' && !b.cover && !(b.sheet && b.sheet.plan && b.sheet.plan !== 'bird') && !world.blocked(bird.at, b.at));
    const one = pickOf(prey);
    if (!one) return false;
    const near = perches(one.at.x, one.at.z, 6).filter((p) => p.point.distanceTo(bird.at) > 4);
    if (!near.length) return false;
    const land = near.reduce((m, p) => (p.point.distanceTo(one.at) < m.point.distanceTo(one.at) ? p : m));
    if (typeof behave.raise === 'function') behave.raise(world, { at: bird.at, reach: 7, until: world.clock + 2.5, size: bird.size, by: bird });
    go(land, 'watch', `dashing at a ${one.sheet && one.sheet.name ? one.sheet.name : 'small bird'}`, way.dash.speed);
    return true;
  };
  // a drop onto something on the floor, in front of it and a few metres off
  const drop = () => {
    const H = way.hunt;
    _v.set(1, 0, 0).applyQuaternion(bird.q).setY(0).normalize();
    for (let tries = 0; tries < 6; tries += 1) {
      const turn = (r() - 0.5) * 2.2, d = H.floor[0] + r() * (H.floor[1] - H.floor[0]);
      const c = Math.cos(turn), s = Math.sin(turn), x = bird.at.x + (_v.x * c - _v.z * s) * d, z = bird.at.z + (_v.x * s + _v.z * c) * d;
      if (!world.walkable(x, z, 0.3)) continue;
      const to = new THREE.Vector3(x, world.height(x, z), z);
      if (!a.clear(to) || world.blocked(bird.at, to) || world.crowd(to, bird) < 0.8) continue;
      a.fly({ at: to, q: frame(_w.subVectors(to, bird.at).setY(0), UP, _q).clone(), rise: 0, floor: world.height }, 'pounce');
      bird.doing = 'dropping onto something in the litter';
      return true;
    }
    return false;
  };

  // ---- on the ground: mantling over what it dropped onto, wings half spread; then up to a perch
  const pounce = {
    pose: () => ({ pitch: 0.5, lift: 0.45, spread: 0.42, flap: 0.3, hand: 0.25, sweep: 0.25, droop: 0, head: { yaw: 0, pitch: -0.9, roll: 0 }, gape: 0, tail: { pitch: 0.25, fan: 0.6, yaw: 0, prop: null }, feet: { mode: 'flat' } }),
    enter(a) { at.grip = false; Object.assign(a.now, { t: way.hunt.stay[0] + r() * (way.hunt.stay[1] - way.hunt.stay[0]), caught: r() < way.hunt.catch, since: 0 }); },
    step(a, dt) {
      const now = a.now;
      now.t -= dt; now.since += dt;
      const settled = Math.min(1, now.since / 1.5);
      Object.assign(bird.want, { spread: 0.42 * (1 - settled * (now.caught ? 0.6 : 0.9)), flap: 0.3 * (1 - settled), pitch: 0.5 + 0.2 * settled, head: { yaw: now.caught ? 0 : Math.sin(now.since * 1.3) * 0.9, pitch: now.caught ? -0.95 : -0.2, roll: 0 } });
      bird.doing = now.since < 1.5 ? 'on the floor, its wings spread over what it dropped onto' : now.caught ? 'on the floor, eating what it caught' : 'on the floor: it missed, and looks about';
      if (now.t > 0) return;
      const p = pickOf(perches(bird.at.x, bird.at.z, 25));
      if (p) go(p, 'watch', 'up from the floor to a perch'); else if (!a.leave(a.awhile())) now.t = 1;
    },
  };

  // ---- its flight: deep, slow beats and long glides, without a sound
  const fly = {
    wary: false,
    step(a, dt) {
      flying(bird, dt, way.hz);
      const f = bird.flight;
      if (!f || !(f.time > 1.2)) return;
      // held out still for the middle of a flight of more than a second (`glide` of it), eased in and out
      const k = clamp(Math.min((f.t - 0.18) / 0.08, (0.18 + way.glide - f.t) / 0.08), 0, 1);
      if (k > 0) Object.assign(bird.want, { flap: bird.want.flap * (1 - k) + 0.08 * k, hand: bird.want.hand * (1 - k) + 0.02 * k });
    },
  };

  return {
    activities: { roost, watch, pounce, fly },
    // Flushed: at roost, off to another roost near by; abroad, to another perch; landing as it was.
    refuge() {
      if (a.name === 'roost') { const place = roostNear(bird.at.x, bird.at.z, 35, 8); return place ? go(place, 'roost', 'flying off to another roost') : false; }
      const p = pickOf(perches(bird.at.x, bird.at.z, way.hunt.reach[1], 8));
      return p ? go(p, 'watch', 'flying off to another perch') : false;
    },
    // Where it is when it comes: at roost (in the hours it roosts) on a tree near its home, or abroad on a perch
    // near it; and it flies in to it if the walker could see it be there from nowhere.
    begin() {
      bird.at.set(home.x, world.height(home.x, home.z) + 3, home.z);
      const place = awake() ? pickOf(perches(home.x, home.z, 30)) : (roostNear(home.x, home.z, 6) || roostNear(home.x, home.z, 30));
      if (!place) { bird.left = 8 + r() * 12; return; }
      const landing = place.roost ? 'roost' : 'watch';
      a.to(landing, place);
      if (a.life && !a.life.first && (world.plain(bird.at, bird.size) || r() < 0.5)) {
        if (!a.come({ at: bird.at.clone(), q: bird.q.clone(), rise: 0.3, floor: world.height }, landing, place)) bird.left = 5 + r() * 10;
      }
    },
  };
}

// Its home for the visit: a tree of the kinds it roosts in, with a roost on it, within `roost.off` of the walk and
// `apart` from another of its kind's. A Spotted Owl has none on a visit a Barred Owl has one on (above).
const owlHome = (way) => (habitat, r, taken) => {
  if (way.ousted && OUSTING.has(r)) return null;
  const trees = habitat.leafy.filter((t) => way.roost.trees.includes(t.kind) && t.off < way.roost.off && taken.every((h) => Math.hypot(h.x - t.x, h.z - t.z) > way.apart));
  for (let tries = 0; trees.length && tries < 20; tries += 1) {
    const tree = trees[Math.floor(r() * trees.length)];
    if (roostsOn(tree, habitat.perchesOf, way.roost, 0.12).length) {
      if (way.ousts) OUSTING.add(r);
      return { x: tree.x, z: tree.z };
    }
  }
  return null;
};

const chance = test((v) => Number.isFinite(v) && v >= 0 && v <= 1, 'a chance, from 0 to 1');
export default {
  // what an owl's way holds besides what every way has (life/families/index.js)
  fields: {
    hz: 'number', speed: 'number', glide: chance,      // wingbeats a second; how fast it flies (m/s); the share of a long flight it glides
    flies: optional('string'),                         // how it goes from perch to perch, in words (the card's)
    day: optional('boolean'),                          // it hunts by day and roosts by night (the Pygmy-Owl)
    ...behave.WARY,                                    // how near it lets the walker come (life/behave.js)
    doze: 'number',                                    // how far its lids come down at roost (the pose's `gape`: life/parts/owl.js)
    apart: 'number',                                   // no home within this many metres of another of its kind's
    // where it roosts: the kinds of tree, how high (m above the tree's foot), how far from the walk, the thinnest limb (m)
    roost: { trees: list('string', 1), low: 'number', high: 'number', off: 'number', thin: 'number' },
    // how it hunts: from how high (m above the ground), off the thinnest limb (m), moving on from `reach[0]` to
    // `reach[1]` metres; seconds on a perch before it does something; the chance that is a drop onto the floor,
    // `floor` metres off; seconds on the floor; the chance it caught something
    hunt: { low: 'number', high: 'number', thin: 'number', reach: nums(2), wait: nums(2), drop: chance, floor: nums(2), stay: nums(2), catch: chance },
    ends: optional('boolean'), snags: optional('boolean'),   // it hunts from the outer ends of limbs; from the tops of snags
    cock: optional('number'), flick: optional(nums(2)),      // its tail cocked up (radians); flicked up and down every so many seconds
    dash: optional({ reach: 'number', chance, speed: 'number' }),   // it dashes at a small bird within reach
    mobbed: optional('number'),                        // seconds with small birds round it by day before it moves off
    // its song: seconds between, how long, how far it carries (m), what it is doing; by day, the chance of each
    song: { every: nums(2), time: 'number', reach: 'number', doing: 'string', day: optional(chance) },
    ousts: optional('boolean'), ousted: optional('boolean'),   // the Barred Owl; the Spotted Owl (above)
  },
  act: (way) => (bird, world) => behave.live(bird, world, way, owl),
  home: (way) => owlHome(way),
};
