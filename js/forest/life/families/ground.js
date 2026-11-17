import * as THREE from 'three';
import { onLimb } from '../perch.js';
import { frame, UP, spot, thrush as named } from '../agents.js';
import { live, WARY } from '../behave.js';
import { optional, nums, list, oneOf } from '../bodies.js';

// Thrushes: birds that feed on the ground and go up to a perch, and sing there at dawn and dusk. Three kinds live
// this life, each in a manner its way names (`gait`, `feeding`, where it perches), and each kind's file says where it
// lives (`home`, `spot`: a stretch of the walk, { s, side }: metres along it and to its right):
//   the Varied Thrush (life/species/variedThrush.js), on the trail under the trees, in hops, turning the litter over
//   with its bill, and up to the stub of a broken limb, where it sings one long whistle at a time (as approved at
//   checkpoint 2: the owner, 2026-11-15, "The varied thrush and the brown creeper are good");
//   the American Robin (americanRobin.js), on the worn tread through the open (the old clearing, the river's bank,
//   the beach), in short runs, stopping upright with its head cocked to look at the ground and now and then pulling
//   up a worm; it sings from the top of a tree;
//   Swainson's Thrush (swainsonsThrush.js), on the trail through the hardwoods and the young woods, in hops, picking
//   at the litter, and up into the low boughs, where it picks at the leaves, now and then hovers at them, and calls.
//
// From what was read (each kind's file names its sources): the Varied Thrush as in its file (it feeds on the ground,
// turning the litter; it sings from high perches, mostly at dawn and dusk, one whistle at a time). The robin: "a
// short, straight run with a quick, tripping gait, then pause to look or listen for their prey. As they run, the back
// is nearly parallel to the ground, and the head is drawn back and settled between the shoulders"; stopped, "they
// lean forward, turning the head to one side"; "seizing a worm, leans backward ... bracing his feet against the
// pull, carefully draws the worm from the ground" (Bent's life history of the robin); it "usually sings from a high
// perch in a tree", and
// is "among the first songbirds to sing as dawn rises ... and last as evening sets in" (Wikipedia); its "tut-tut-tut"
// notes are "often given when a bird starts away in flight" (Bent). Swainson's Thrush: "forage mostly on the
// ground" in spring, "hover while gleaning insects from foliage", "usually stays under cover" (BirdWeb); "moving in
// hops on the ground and flying short flights from branches", and it "respond[s] to predators by repeated 'whit'
// calls and flying around from perch to perch" (Animal Diversity Web); on its return in spring "subtle calls ...
// 'whit' or 'wink'", and "about a week later, generally at dusk, they break into full song" (BirdNote). The agent's
// own: every distance, time and chance in the ways, that a robin put up from the trail may skim along it and come
// down again further on, and where on the walk each kind lives.
//
// It lives on life/behave.js: it goes on with what it is doing until the walker is too near or moves suddenly, and
// then it is up onto a perch clear of them (a robin may skim along the trail instead), or off out of their sight.
// It no longer stands tall to watch them, hops off away from them or gets used to them. By night it roosts on a
// perch, and is not put up there. One of the cast of checkpoint 2 (a Varied Thrush with no `bird.life`) lives in the
// composed scene's world, which has only its trunks and their stubs, and never leaves.
const TWILIGHT = [0.3, 13];               // the sun's height (degrees) between which it sings: dawn and dusk (the thrush's, as approved)
// How near another animal a hop or a run of its own may take it (m): no point of the way comes nearer one than this,
// one standing there or one about to land there (`world.crowd`); and once one has come up closer than this, no point
// comes any nearer it than it is (so it may still go off from it). It turns off another way before it sets out, or
// stops short on the way. (Two robins ran into one spot on the tread, 3.5 cm apart: each had asked only whether the
// end of its run was clear, and of where the other stood, not of where the other's run was taking it.)
const ROOM = 0.3;
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _p = new THREE.Vector3(), _near = [], _trees = [];

function ground(a) {
  const { bird, world, way, r, cast } = a, home = bird.home;                 // home: { s, side }
  const rest = bird.sheet.poses.perched, stance = bird.sheet.poses.ground || { pitch: 0.66, lift: 0.62 };
  const q = new THREE.Quaternion(), to = new THREE.Vector3(), ahead = new THREE.Vector3(), centre = new THREE.Vector3(), mid = new THREE.Vector3(), tan = new THREE.Vector3(), p = spot();
  const L = world.trail.length;
  // (the cast's world has less in it: no other animals to keep clear of, nothing is said, no stubs by the square)
  const free = (point, room = 0.5) => !world.free || world.free(point, bird, room);
  const crowd = (point) => (world.crowd ? world.crowd(point, bird) : Infinity);
  // Is the way from where it is to `till` clear of every other animal (ROOM, above)? A point of it every tenth of a
  // metre, `till` the last; how near the nearest other is to where it is now (`room`) sets how near is too near. When
  // none is nearer than the way is long and ROOM more, no point of it can be too near, and none is looked at.
  const clearWay = (till, room = crowd(bird.at)) => {
    if (!world.crowd) return true;
    const far = bird.at.distanceTo(till);
    if (room > far + ROOM) return true;
    const least = Math.min(ROOM, room), n = Math.max(1, Math.ceil(far / 0.1));
    for (let k = 1; k <= n; k += 1) if (crowd(_p.lerpVectors(bird.at, till, k / n)) < least) return false;
    return true;
  };
  const say = (what, reach, hold) => { if (world.say) world.say(bird, what, reach, hold); };
  const span = ([least, most]) => least + r() * (most - least);
  const twilight = () => world.day >= 0.08 && world.sunHeight > TWILIGHT[0] && world.sunHeight < TWILIGHT[1];
  // whether it sings at all (a Swainson's Thrush just arrived in May may not have begun: its way's `share`)
  const sings = !!way.song && (cast || r() < way.song.share);
  // what it keeps across its activities: the way it faces on the ground, when it next looks about, the perch it is
  // on, when it next calls, how many times it has skimmed along the trail since it was last on a perch
  let heading = r() * 6.28, look = 0, here = null, calls = way.call ? span(way.call.every) : Infinity, skips = 0;

  // a place beside the walk, `s` metres along it and `side` to its right, on the ground
  const place = (s, side, out) => { world.trail.sample(((s % L) + L) % L, mid, tan); const x = mid.x - tan.z * side, z = mid.z + tan.x * side; return out.set(x, world.height(x, z), z); };
  const face = () => frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), UP, bird.q);
  // ground it may stand on to feed: of the kinds its way keeps to, and no further from the walk's middle line
  const fit = (point) => (!way.walk || !world.ground || way.walk.includes(world.ground(point.x, point.z))) && (way.verge == null || world.trail.distance(point.x, point.z) <= way.verge);

  // On the ground, its body tilted `pitch` from level: from a run's level back to standing upright.
  const stand = (pitch, extra = {}) => Object.assign(bird.want, { pitch, lift: stance.lift, lean: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0.04, gape: 0,
    tail: { pitch: -0.05, fan: 0 }, feet: { mode: 'flat' } }, extra);
  // On a perch, as its sheet draws it, its toes round the perch.
  const sit = () => Object.assign(bird.want, { pitch: rest.pitch, lift: rest.lift, lean: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0.02, gape: 0,
    tail: { pitch: rest.tail && rest.tail.pitch != null ? rest.tail.pitch : 0, fan: 0 }, feet: { mode: 'grip', round: here ? here.radius : rest.feet.round } });
  // it looks about, in quick turns of the head
  const glance = (dt) => { look -= dt; if (look < 0) { look = 0.35 + r() * 1.3; bird.want.head = { yaw: (r() - 0.5) * 2.2, pitch: 0.02 + r() * 0.2, roll: (r() - 0.5) * 0.3 }; } };

  // ---- perches. The stubs of broken limbs, if its kind takes them, and the boughs of trees in its band of height
  // (metres above the tree's foot), none that runs more steeply than about forty degrees; for a song from the top
  // of a tree, each tree's highest bough in the song's band, and no stub; for a song from a band of height, the
  // stubs in that band over the ground under them (a stub's record has no height of its own).
  const perchesNear = (x, z, reach, song = false) => {
    const all = [], band = song && way.song.high ? way.song.high : way.perch.boughs;
    if (way.perch.stubs && !(song && way.song.top)) {
      const high = song && way.song.high, keep = (one) => { if (!high) return true; const h = one.point.y - world.height(one.point.x, one.point.z); return h >= high[0] && h <= high[1]; };
      if (world.stubsNear) { for (const one of world.stubsNear(x, z, reach, _near)) if (keep(one)) all.push(one); }
      else for (const one of world.stubs) if (Math.hypot(one.point.x - x, one.point.z - z) <= reach && keep(one)) all.push(one);
    }
    if (band && world.leafyNear) for (const tree of world.leafyNear(x, z, reach, _trees)) {
      let best = null;
      for (const one of world.perchesOf(tree)) {
        if (one.above < band[0] || one.above > band[1] || Math.abs(one.along.y) > 0.62) continue;
        if (song && way.song.top) { if (!best || one.above > best.above) best = one; } else all.push(one);
      }
      if (best) all.push(best);
    }
    return all;
  };
  // it sits across a perch, facing the open side (the walker's, more often than not)
  const across = (one, out) => {
    _v.crossVectors(one.along, UP);
    if (_v.lengthSq() < 1e-6) _v.set(1, 0, 0);
    if (_v.dot(_w.subVectors(world.eye, one.point)) < 0 && r() < 0.7) _v.negate();
    return frame(_v, UP, out);
  };
  const land = (one, time, doing) => {
    a.fly({ at: one.point.clone(), q: across(one, q).clone(), rise: 0.3, floor: world.height }, 'perch', one, time);
    if (doing) bird.doing = doing;
    return true;
  };
  // Up to a perch near by: one no other animal has, clear of the walker (and when they have put it up, no nearer
  // them than it is now), not the one it is on; of those, one of the nearest few (for a song from a treetop, of the
  // highest) that the walker can see and that it can fly to with no trunk in the way, or if there are none of
  // those, one of the nearest few. False if there is none.
  const up = ({ put = false, song = false, doing = null } = {}) => {
    const off = put ? bird.at.distanceTo(world.eye) : 0;
    const all = perchesNear(bird.at.x, bird.at.z, way.perch.reach, song).filter((one) => one !== here && one.point.distanceTo(world.eye) > off && a.clear(one.point) && free(one.point));
    if (!all.length) return false;
    all.sort(song && way.song.top ? (m, n) => n.above - m.above : (m, n) => m.point.distanceTo(bird.at) - n.point.distanceTo(bird.at));
    const open = [];
    for (const one of all) { if (!world.blocked(world.eye, one.point) && !world.blocked(bird.at, one.point)) open.push(one); if (open.length === 4) break; }
    const some = open.length ? open : all.slice(0, 4);
    return land(some[Math.floor(r() * some.length)], song ? span(way.song.stay) : null, doing);
  };
  // Down to feed: about its spot on the walk, on ground it keeps to, clear of the walker, with no trunk in the way
  // and not onto another animal.
  const down = () => {
    for (let tries = 0; tries < 6; tries += 1) {
      place(home.s + (r() - 0.5) * 2 * way.roam, home.side + (r() - 0.5) * 0.7, to);
      if (!fit(to) || !a.clear(to) || world.blocked(bird.at, to) || crowd(to) < 0.6) continue;
      heading = r() * 6.28;
      a.fly({ at: to.clone(), q: frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), UP, q).clone(), floor: world.height, speed: way.speed * 0.9 }, 'forage', 0.6);
      bird.doing = 'flying down to feed';
      return true;
    }
    return false;
  };
  // Put up from the trail, a bird that runs (a robin) may skim low along it, away from the walker, and come down
  // again further on: twice at the most before it goes up instead.
  const skip = () => {
    if (skips >= 2) return false;
    const [, s0] = world.trail.locate(bird.at.x, bird.at.z), d = ((((s0 - world.walker.s) % L) + 1.5 * L) % L) - 0.5 * L, away = d >= 0 ? 1 : -1;
    for (let tries = 0; tries < 6; tries += 1) {
      place(s0 + away * (8 + r() * 14), (r() - 0.5) * 2 * Math.min(way.verge ?? 0.6, 0.6), to);
      if (!fit(to) || !a.clear(to) || crowd(to) < 0.6 || world.blocked(bird.at, to)) continue;
      heading = Math.atan2(to.z - bird.at.z, to.x - bird.at.x);
      a.fly({ at: to.clone(), q: frame(_v.set(Math.cos(heading), 0, Math.sin(heading)), UP, q).clone(), rise: -0.3, floor: world.height, speed: way.speed * 0.85 }, 'forage', 0.5);
      skips += 1;
      bird.doing = 'put up: off low along the trail';
      return true;
    }
    return false;
  };
  // Out from its bough to hover at the leaves for a moment (Swainson's Thrush): in clear air, clear of the walker,
  // with no trunk between. False if there is no such place.
  const sally = () => {
    if (!here || !here.tube) return false;
    onLimb(here.tree.place, here.tree.limbs, here.tube, 0.999, p);
    const at = p.point.clone().addScaledVector(p.along, 0.25 + r() * 0.3);
    at.y -= 0.1 + r() * 0.15;
    if (crowd(at) < 0.4 || at.y - world.height(at.x, at.z) < 0.8 || !a.clear(at) || world.blocked(here.point, at)) return false;
    a.fly({ at, q: frame(_v.copy(p.along).negate().setY(0), UP, q).clone(), rise: 0, floor: world.height }, 'hover', at.clone(), 0.5 + r() * 0.5);
    bird.doing = 'flying out to the leaves';
    return true;
  };
  // It has fed a while: up to a perch (to sing, at dawn and dusk, if it is a singer), or (one of a visit's own) off
  // out of the walker's sight, for a while or for good.
  const done = () => {
    if (!cast && r() < way.off && a.leave(r() < way.lost ? Infinity : a.awhile())) return true;
    return up({ song: sings && twilight() }) || (!cast && a.leave(a.awhile()));
  };
  // Long enough on this perch: at dawn and dusk a singer goes to another to sing; otherwise down to feed, or off.
  const next = () => {
    if (sings && twilight()) return up({ song: true, doing: 'flying to another perch to sing' });
    if (!cast && r() < way.off && a.leave(r() < way.lost ? Infinity : a.awhile())) return true;
    return down() || up({ doing: 'flying to another perch' });
  };

  // ---- on the ground: what it does at a stop, and how long each thing takes (seconds)
  const TASKS = { flip: () => 0.55, peck: () => 0.22 + r() * 0.18, cock: () => span(way.pause), stab: () => 0.2, tug: () => 0.7 + r() * 0.7, swallow: () => 0.3 + r() * 0.2 };
  const task = (now, name) => { now.task = { name, left: TASKS[name](), time: 0, side: r() < 0.5 ? 1 : -1, from: bird.at.clone() }; now.task.whole = now.task.left; now.last = name; };
  // what it does to feed: a Varied Thrush turns the litter over; a Swainson's Thrush picks at it, a few times; a
  // robin thrusts its bill into the ground, and about half the time pulls up a worm
  const feed = (now) => {
    now.queue = way.feeding === 'litter' ? [] : way.feeding === 'pick' ? Array(Math.floor(r() * 3)).fill('peck') : r() < 0.55 ? ['tug', 'swallow'] : [];
    task(now, way.feeding === 'litter' ? 'flip' : way.feeding === 'pick' ? 'peck' : 'stab');
  };
  const working = (now, dt) => {
    const t = now.task;
    t.left -= dt; t.time += dt;
    if (t.name === 'flip') {
      // the bill sweeps leaves aside, low to the ground
      stand(0.12, { lift: stance.lift * 0.8 }); bird.want.head = { yaw: 0.9 * Math.sin(t.left * 22), pitch: -0.95, roll: 0 };
      bird.doing = 'turning over leaf litter';
    } else if (t.name === 'peck') {
      stand(0.2, { lift: stance.lift * 0.85 }); bird.want.head = { yaw: 0.15 * t.side, pitch: -0.8 - 0.2 * Math.abs(Math.sin(t.time * 15)), roll: 0 };
      bird.doing = 'picking at the leaf litter';
    } else if (t.name === 'cock') {
      // upright, leaning a little forward, the head turned to one side to look at the ground
      stand(stance.pitch - 0.06); bird.want.head = { yaw: 0.4 * t.side, pitch: -0.35, roll: 0.55 * t.side };
      bird.doing = 'standing still, its head cocked to look at the ground';
    } else if (t.name === 'stab') {
      stand(0.1, { lift: stance.lift * 0.85 }); bird.want.head = { yaw: 0, pitch: -1.1, roll: 0 };
      bird.doing = 'thrusting its bill into the ground';
    } else if (t.name === 'tug') {
      // it leans back on braced feet, and the worm comes out a little at a time
      const k = Math.sin(Math.PI * Math.min(1, t.time / t.whole));
      stand(stance.pitch + 0.16 * k, { lift: stance.lift * 0.92 }); bird.want.head = { yaw: 0, pitch: -0.6 + 0.12 * Math.sin(t.time * 17), roll: 0 };
      bird.at.copy(t.from).addScaledVector(_v.set(Math.cos(heading), 0, Math.sin(heading)), -0.025 * k);
      bird.at.y = world.height(bird.at.x, bird.at.z);
      bird.doing = 'pulling a worm from the ground';
    } else {
      stand(stance.pitch); bird.want.head = { yaw: 0, pitch: 0.35, roll: 0 }; bird.want.gape = 0.25 * Math.max(0, Math.sin(t.time * 20));
      bird.doing = 'swallowing a worm';
    }
    if (t.left > 0) return;
    if (t.name === 'tug') bird.at.copy(t.from);
    now.task = null;
    if (now.queue.length) { task(now, now.queue.shift()); return; }
    // (a robin's look is over: it feeds there now and then, and otherwise is soon off on another run)
    if (t.name === 'cock' && r() < way.work) { feed(now); return; }
    now.wait = t.name === 'cock' ? 0.15 + r() * 0.4 : 0.05 + r() * 0.3;
  };
  // A hop, or a run, it is in the middle of. If another animal has come into its way since it set off (standing
  // there, or coming down there), it stops short where it is, on the ground, before the step that would take it too
  // near: a runner stands to look about, a hopper stands a while, and either goes on another way.
  const moving = (now, dt) => {
    const g = now.go, t = Math.min(1, g.t + dt / g.time);
    if (!clearWay(ahead.lerpVectors(g.a, g.b, t))) {
      now.go = null;
      bird.at.y = world.height(bird.at.x, bird.at.z);
      if (way.gait === 'run') task(now, 'cock');
      else { now.moves = 0; now.wait = span(way.pause); }
      return;
    }
    g.t = t;
    bird.at.lerpVectors(g.a, g.b, g.t);
    if (way.gait === 'run') {
      // a quick, tripping gait, the back nearly level and the head drawn in: a little bob at each step
      bird.at.y = world.height(bird.at.x, bird.at.z) + 0.006 * Math.abs(Math.sin(Math.PI * g.steps * g.t));
      stand(0.14, { lift: stance.lift * 0.8, head: { yaw: 0, pitch: -0.05, roll: 0 }, tail: { pitch: 0.02, fan: 0 } });
    } else {
      bird.at.y += 0.02 * Math.sin(Math.PI * g.t);
      // (lift is how high the hips are as a share of straight legs: never more than the legs reach)
      stand(0.42, { lift: Math.min(0.97, stance.lift * (0.8 + 0.48 * Math.sin(Math.PI * g.t))), feet: { mode: g.t > 0.15 && g.t < 0.85 ? 'tuck' : 'flat' } });
    }
    if (g.t < 1) return;
    now.go = null;
    if (way.gait === 'run') task(now, 'cock');                          // a run, then a stop to look
    else now.wait = now.moves > 0 ? 0.07 : span(way.pause);
  };
  // What next on the ground: feed where it is, or move on, a hop at a time or in a short run. It goes back towards
  // where it came down if it has strayed; a runner runs along the trail. Never onto ground it does not keep to, to
  // within half a metre of another animal or by a way that passes too near one (ROOM: it turns off), or towards the
  // walker inside the distance at which they would put it up.
  const choose = (now) => {
    if (now.moves <= 0) {
      if (way.gait === 'hop' && now.last === '' && r() < way.work) { feed(now); return; }
      now.moves = way.gait === 'run' ? 1 : 1 + Math.floor(r() * 4);
      if (centre.distanceTo(bird.at) > way.stray) heading = Math.atan2(centre.z - bird.at.z, centre.x - bird.at.x) + (r() - 0.5) * 0.8;
      else if (way.gait === 'run') {
        const [, s0] = world.trail.locate(bird.at.x, bird.at.z);
        world.trail.sample(s0, mid, tan);
        heading = Math.atan2(tan.z, tan.x) + (r() < 0.5 ? 0 : Math.PI) + (r() - 0.5) * 0.6;
      } else heading += (r() - 0.5) * 2.4;
      face();
    }
    now.moves -= 1; now.last = '';
    const reach = span(way.stride);
    to.set(bird.at.x + Math.cos(heading) * reach, 0, bird.at.z + Math.sin(heading) * reach);
    to.y = world.height(to.x, to.z);
    const room = crowd(bird.at);
    if (!fit(to) || crowd(to) < Math.min(0.5, room) || !a.clear(to, 0) || !clearWay(to, room)) {
      heading += way.gait === 'run' ? Math.PI * (0.6 + r() * 0.8) : 1.6 + r() * 1.6;
      face();
      if (way.gait === 'run') task(now, 'cock');                         // (a runner stops and looks about before it goes on another way)
      else { now.moves = Math.max(now.moves, 1); now.wait = 0.1; }
      return;
    }
    const time = way.gait === 'run' ? reach / way.quick : way.quick;
    now.go = { a: bird.at.clone(), b: to.clone(), t: 0, time, steps: Math.max(1, Math.round(time * 11)) };
    bird.doing = way.moving;
  };

  // ---- its activities
  const forage = {
    pose: () => ({ pitch: stance.pitch, lift: stance.lift, feet: { mode: 'flat' } }),
    enter(a, wait = 0.6, time = null) {
      here = null; centre.copy(bird.at);
      Object.assign(a.now, { wait, until: time ?? span(way.feed), again: 0, moves: 0, go: null, task: null, queue: [], last: '' });
    },
    step(a, dt) {
      const now = a.now;
      now.wait -= dt; now.until -= dt; now.again -= dt;
      if (now.go) { moving(now, dt); return; }
      if (now.task) { working(now, dt); return; }
      // night: up to roost (with nowhere to roost it stands where it is, and looks again a little later)
      if (world.day < 0.08) {
        if (now.again <= 0) { if (up({ doing: 'going up to roost' })) return; now.again = 2; }
        stand(stance.pitch); bird.doing = 'standing still in the dark';
        return;
      }
      // fed a while: up or off (with nowhere to go it feeds on, and asks again a few seconds later)
      if (now.until < 0 && now.again <= 0) { if (done()) return; now.again = 4 + r() * 4; }
      glance(dt);
      if (now.wait > 0) { if (now.moves <= 0) { stand(stance.pitch); bird.doing = way.standing; } return; }
      choose(now);
    },
  };

  const perch = {
    // by night it roosts on its perch, and the walker does not put it up there
    wary: () => world.day >= 0.08,
    pose: () => ({ pitch: rest.pitch, lift: rest.lift, feet: { mode: 'grip', round: rest.feet.round } }),
    enter(a, one, time = null) {
      here = one; skips = 0;
      Object.assign(a.now, { until: time ?? (sings && twilight() ? span(way.song.stay) : span(way.sit)), again: 0, gap: 1 + r() * 3, note: 0, sang: 0, calling: 0, pick: 1.5 + r() * 3, peck: 0, dark: false });
    },
    step(a, dt) {
      const now = a.now;
      sit();
      if (world.day < 0.08) {
        bird.want.head = { yaw: 0, pitch: 0.05, roll: 0 }; bird.want.pitch = rest.pitch + 0.1;
        bird.doing = 'roosting'; now.dark = true; now.note = 0; now.calling = 0; now.peck = 0;
        return;
      }
      if (now.dark) { now.dark = false; now.until = 30 + r() * 60; }        // (it roosted here, and day has come)
      now.until -= dt; now.again -= dt; calls -= dt;
      const singing = sings && twilight();
      if (now.calling > 0) {
        // a call: the bill open at each of its notes, as the recording that is played for it has them
        now.calling -= dt;
        const t = way.call.time - now.calling;
        bird.want.gape = way.call.notes.some(([from, till]) => t >= from && t <= till) ? 0.5 : 0.06;
        bird.want.head = { yaw: 0, pitch: 0.2, roll: 0 };
        bird.doing = way.call.doing;
        return;
      }
      if (now.note > 0) {
        // a song: the bill open and the head raised (a robin's phrases come about two a second)
        now.note -= dt; now.sang += dt;
        bird.want.gape = way.song.rate ? ((now.sang * way.song.rate) % 1 < 0.6 ? 0.45 : 0.1) : 0.55;
        bird.want.head = { yaw: 0, pitch: 0.42, roll: 0 }; bird.want.pitch = rest.pitch + 0.1;
        bird.doing = way.song.doing;
        return;
      }
      glance(dt);
      if (now.peck > 0) {
        now.peck -= dt;
        bird.want.head = { yaw: 0.6 * Math.sin(now.peck * 9), pitch: -0.3 - 0.25 * Math.abs(Math.sin(now.peck * 20)), roll: 0 };
        bird.doing = 'picking insects from the leaves';
        return;
      }
      bird.doing = 'perched, looking about';
      if (singing) {
        // a song, then a silence (the thrush's whistle of one to two seconds and silence of three to twenty, as approved)
        now.gap -= dt;
        if (now.gap < 0) { now.note = span(way.song.note); now.gap = span(way.song.gap); now.sang = 0; say('song', way.song.reach, now.note); return; }
      } else {
        if (way.call && calls < 0) { calls = span(way.call.every); now.calling = way.call.time; say('call', way.call.reach); return; }
        // one that gleans picks at the leaves round its bough now and then, and may fly out to hover at them
        if (way.hover != null && here && here.tube) {
          now.pick -= dt;
          if (now.pick < 0) { now.pick = 1.5 + r() * 3; if (r() < way.hover && sally()) return; now.peck = 0.35 + r() * 0.3; return; }
        }
      }
      if (now.until < 0 && now.again <= 0) { if (next()) return; now.again = 3 + r() * 3; }
    },
  };

  // hovering at the leaves of a bough, on beating wings, picking at them; then back onto its bough, or another, or off
  const hover = {
    wary: false,
    enter(a, at, time) { a.now.at = at; a.now.time = time; bird.aloft = true; },
    step(a, dt) {
      const now = a.now;
      now.time -= dt;
      bird.beat += dt * way.hz * Math.PI * 2;
      bird.at.copy(now.at); bird.at.y += 0.01 * Math.sin(now.time * 11);
      Object.assign(bird.want, { pitch: 0.8, lift: 0.6, lean: 0, spread: 1, flap: 0.75 * Math.sin(bird.beat) + 0.15, hand: 0.5 * Math.sin(bird.beat - 1), sweep: -0.12, droop: 0, gape: 0,
        head: { yaw: 0, pitch: -0.4, roll: 0 }, tail: { pitch: 0.4, fan: 0.5, prop: null }, feet: { mode: 'tuck' } });
      bird.snap = true; bird.doing = 'hovering at the leaves, picking at them';
      if (now.time > 0) return;
      if (here && free(here.point) && a.clear(here.point)) { land(here, null, 'back onto its bough'); return; }
      if (up({ doing: 'onto another bough' })) return;
      if (!cast && a.leave(a.awhile())) return;
      now.time = 0.4;
    },
  };

  return {
    activities: { forage, perch, hover },
    // Put up: a robin on the trail may skim along it ahead; otherwise up onto a perch clear of the walker, no nearer
    // them than it was. A kind that calls (a robin, a Swainson's Thrush) may call as it goes.
    refuge: () => {
      const went = (a.name === 'forage' && way.skip && r() < way.skip && skip()) || up({ put: true, doing: 'put up: onto a perch' });
      if (went && way.call && r() < way.call.flush) say('call', way.call.reach);
      return went;
    },
    // Where it is when it comes: by day feeding about its spot (a singer, at dawn and dusk, may be on a song perch
    // instead), and it flies in if the walker could see it be there from nowhere; not where they would put it up at
    // once (it comes a little later). By night at roost on a perch near its spot (with none, a visit's is not about).
    begin: () => {
      place(home.s, home.side, bird.at); face();
      if (world.day < 0.08) {
        const all = perchesNear(bird.at.x, bird.at.z, 40).filter((one) => free(one.point));
        if (!all.length) { if (cast) a.to('forage'); else bird.left = Infinity; return; }
        const one = all[Math.floor(r() * all.length)];
        bird.at.copy(one.point); across(one, bird.q);
        a.to('perch', one);
        return;
      }
      if (cast) { a.to('forage', 0, 20 + r() * 20); return; }
      if (sings && twilight() && r() < 0.5) {
        const all = perchesNear(bird.at.x, bird.at.z, way.perch.reach, true).filter((one) => free(one.point) && a.clear(one.point));
        if (all.length) {
          const one = all[Math.floor(r() * all.length)], stay = span(way.song.stay);
          bird.at.copy(one.point); across(one, bird.q);
          a.to('perch', one, stay);
          if (!a.life.first && (world.plain(bird.at, bird.size) || r() < 0.5) && !a.come({ at: bird.at.clone(), q: bird.q.clone(), rise: 0.3, floor: world.height }, 'perch', one, stay)) bird.left = 4 + r() * 8;
          return;
        }
      }
      if (!a.clear(bird.at)) { bird.left = 4 + r() * 8; return; }
      a.to('forage', 0.8);
      if (!a.life.first && (world.plain(bird.at, bird.size) || r() < 0.5) && !a.come({ at: bird.at.clone(), q: bird.q.clone(), floor: world.height }, 'forage', 0.8)) bird.left = 4 + r() * 8;
    },
  };
}

export default {
  // what a thrush's way holds besides what every way has (life/families/index.js)
  fields: {
    hz: 'number', speed: 'number',                  // wingbeats a second; how fast it flies (m/s)
    ...WARY,                                        // how near it lets the walker come (life/behave.js)
    gait: oneOf('hop', 'run'),                      // how it goes over the ground: in hops, or in short runs
    stride: nums(2),                                // a hop's length, or a run's (m)
    quick: 'number',                                // how long a hop takes (s), or how fast it runs (m/s)
    pause: nums(2),                                 // seconds it stands still after a run of hops, or stands to look after a run
    feeding: oneOf('litter', 'pick', 'worms'),      // it turns the litter over; it picks at it; it looks and pulls up worms
    work: 'number',                                 // the chance it feeds at a stop
    moving: 'string', standing: 'string',           // what it says it is doing as it goes over the ground, and as it stands
    stray: 'number',                                // how far (m) from where it came down it goes before it turns back
    roam: 'number',                                 // how far along the walk from its spot (m) it comes down to feed
    verge: optional('number'),                      // no further from the walk's middle line than this (m)
    walk: optional(list('string', 1)),              // the ground it stands on (life/habitat.js `ground`: 'tread', 'floor', ...)
    feed: nums(2), sit: nums(2),                    // seconds it feeds before it goes up; seconds on a perch when it is not singing
    off: 'number', lost: 'number',                  // the chance it goes off out of sight at the end of a while, and that that is for good
    skip: optional('number'),                       // put up on the trail, the chance it skims along it ahead instead of going up
    hover: optional('number'),                      // on a bough, the chance it flies out to hover at the leaves, each time it picks
    perch: { stubs: 'boolean', boughs: optional(nums(2)), reach: 'number' },    // the stubs of broken limbs; boughs this high above a tree's foot (m); within reach (m)
    // its song: the share of birds that sing yet; a song's length and the silence after it (s); how long it sings
    // from one perch (s); notes a second (0: one held note); how far it carries (m); what it says it is doing; the
    // band of height of its song perches, and whether it sings from the top of a tree
    song: optional({ share: 'number', note: nums(2), gap: nums(2), stay: nums(2), rate: 'number', reach: 'number', doing: 'string', high: optional(nums(2)), top: optional('boolean') }),
    // its call, from a perch now and then and as it is put up: how often (s); how long the recording is (s) and
    // when its notes are (s from its start); how far it carries (m); what it says it is doing; the chance it calls
    // when it is put up
    call: optional({ every: nums(2), time: 'number', notes: list(nums(2), 1), reach: 'number', doing: 'string', flush: 'number' }),
  },
  act: (way) => (bird, world) => live(bird, world, way, ground),
};

// The cast of checkpoint 2 asks life/agents.js for the thrush's behaviour by name (life/index.js): it lives this life,
// with its kind's own numbers (its sheet is its kind's file).
named.cast = (bird, world) => live(bird, world, bird.sheet.way, ground);
