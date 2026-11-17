import * as THREE from 'three';
import { frame, UP } from '../agents.js';
import { live, WARY } from '../behave.js';
import { optional, nums, rest, oneOf } from '../bodies.js';
import { shrubsOf } from '../places/thicket.js';

// Warblers of the thickets: Wilson's, the Orange-crowned, MacGillivray's and the Common Yellowthroat. Each is one of a
// visit's own, low in the shrubs near the walk (life/places/thicket.js: the twigs of the salmonberry, the red
// elderberry, the devil's club, the huckleberry, the willows of the bars and the vine maples of the hall). Its home
// (`bird.home`: { x, z, plants }) is a few shrubs that its kind likes, which it works through twig by twig; a kind that
// keeps to wet ground has its home where the ground is wet or by the river. One that is in a party of migrants
// (`bird.home.party`: { at, heading, radius, gone }, which the visit moves through the wood) keeps instead to whatever
// grows within the party's reach of where the party is, and to the low boughs of the trees there where no shrub is.
//
// What it does there, each an activity: it works through the twigs (`glean`: hops along a twig, flits to the next,
// picks insects from the leaves, flicks its tail, and now and then gives its chip); it goes up to a song post to sing a
// run of songs, or sings from where it is (`sing`), and drops back into the thicket; a kind that does flies out to snap
// an insect from the air (`snap`), hovers at the leaves (`hover`), or hops on the ground at the shrubs' edge
// (`ground`); by night it roosts in the thicket (`roost`). After a spell it goes off, for a while or for good.
//
// Where on a shrub. A bird inside a shrub is behind the shrub's own leaves from everywhere, and the first version's
// close-ups were frames of leaves. So, going about its day, it keeps to the twigs the walk sees (life/places/thicket.js
// `open`: no twig between them and the walk) and to those at a walker's waist or higher, where the ferns and the
// floor's plants do not stand in front of it; it sings from the top of a shrub (a cane's end, a willow's); and it feeds
// on the ground between the shrubs and the walk, at the walk's own edge (at the shrub's edge grass and the floor's low
// plants hid it in 14 close-ups of 17). It keeps to the inside of the shrub (`skulk`) for a while after the walker has
// put it up, and to roost. (A shrub whose stems are painted on its cards moves in the wind, a cane's end by a few
// centimetres, and a bird on it does not move with it: nothing of the wind reaches a family. A bird held still on a
// salmonberry's cane end and looked at close up for three seconds, 2026-11-16: the leaves moved round it, and no twig
// showed from under its feet.)
//
// It lives on life/behave.js: it goes on with what it is doing until the walker is too near or moves suddenly, and
// then it is off through the thicket, chipping, to a twig further from them, or out of sight.
//
// From what was read (2026-11-16, by this agent; Seattle Audubon's BirdWeb and Wikipedia, each page's text through a
// tool that returns it; none of it seen as an image. The Cornell Lab's pages refused the tool and were not read):
//   Wilson's: "Wilson's Warblers breed in wet, shrubby areas within forests ... small breaks in the forest that have
//     dense, moist, shrubby cover, especially willow and alder thickets"; "They typically glean prey from leaf and twig
//     surfaces, but also catch aerial prey. They forage fairly low, but rarely on the ground, and are very active,
//     hopping from branch to branch"; "a characteristic tail wave or flip" (BirdWeb); "Feeding birds often twitch
//     their tails or flick their wings nervously"; the call "a flat 'chuff'"; the song "a chattering series of loud
//     descending notes" (Wikipedia).
//   Orange-crowned: "They usually stay low, in bushes or small trees, and often flick their tails. They forage in the
//     foliage, gleaning food from the undersides of leaves and flowers" (BirdWeb); "They forage actively in low
//     shrubs, flying from perch to perch, sometimes hovering"; "The call is a high chip" (Wikipedia).
//   MacGillivray's: "MacGillivray's Warblers generally stay in the understory or on the ground, although males
//     sometimes sing from higher perches. They flick their tails from side to side while they forage ... These shy,
//     secretive birds are often hard to see, but are easily located by their loud vocalizations" (BirdWeb); "Males
//     sing mostly at dawn and dusk, typically from a high perch"; "a harsh chip note" (Wikipedia).
//   Yellowthroat: "In western Washington ... most common in wet, shrubby, lowland thickets"; "Common Yellowthroats
//     sometimes cock their tails up. They forage low, mostly gleaning prey from the foliage, but sometimes flying out
//     to catch aerial prey"; "males often perch on a tall stalk to sing, and flick their wings and tails" (BirdWeb);
//     "Its call is a soft jip" (Wikipedia).
// The agent's own: every distance, time and chance below and in the kinds' ways; that a bird sings its songs in runs
// with a few seconds between, from the top of a shrub or from inside it; how a tail flip, a side-to-side flick and a
// cocked tail are drawn; that a bird leaves after a spell; and how near it lets the walker come (no flush distance was
// found for any of the four).
//
// A party's member, when its party has gone (`party.gone`), leaves for good: it is about again elsewhere, as any animal
// that is gone for good is, unless the visit says otherwise.

const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const SLIDE = 0.12;               // how far along its twig from the place a bird hops (m, either way)
const _v = new THREE.Vector3(), _w = new THREE.Vector3(), _boughs = [];
// a bough of a tree, as a place, for a party's member where no shrub is near (life/habitat.js perches); one pretend
// plant to a tree
const bough = new WeakMap(), crowns = new WeakMap();
// what a plant is called, for what a bird is doing on it (by the names the kinds' ways like them by)
const NAMES = { salmon: 'a salmonberry', elder: 'an elderberry', club: "a devil's club", huckle: 'a huckleberry', willow: 'a willow', vine: 'a vine maple', bough: 'a tree' };
const named = (place) => (place && NAMES[place.plant.kind]) || 'a shrub';
// How much of a bird close-ups showed on each kind's twigs, on the mean, against a willow's (2026-11-16: 90 places held
// still and 77 birds as they lived, from 6 to 15 m on the walk; on a willow 0.55 of the bird, on a salmonberry 0.32, an
// elderberry and a devil's club 0.27, a vine maple 0.14): the others are thicker with leaves about their twigs than
// `open` knows. A kind not named here (the huckleberry, not measured) is taken at half. And the end of a stem showed
// more of a bird than the rest of it (the 77 birds: on a salmonberry 0.39 of it against 0.24, an elderberry 0.25
// against 0.13, a willow 0.64 against 0.48): `END`.
const SHOWN = { willow: 1, salmon: 0.6, elder: 0.5, club: 0.5, vine: 0.25 };
const END = 1.6;
const shown = (one) => (SHOWN[one.plant.kind] ?? 0.5) * (one.end ? END : 1);
const boughPlace = (perch, world) => {
  let one = bough.get(perch);
  if (one) return one;
  let plant = crowns.get(perch.tree);
  if (!plant) { plant = { kind: 'bough', x: perch.tree.x, z: perch.tree.z, places: [], top: null, reach: 4, ground: 'floor', wood: true, edge: [] }; crowns.set(perch.tree, plant); }
  // (a bough's place is on top of the limb already, life/perch.js `onLimb`; a twig's is its middle, and `stand` puts the
  // bird on top of it: the bough's is let down to its middle here, so that it is not put on top twice)
  const point = perch.point.clone();
  point.y -= perch.radius * 0.96;
  one = { point, along: perch.along, radius: perch.radius, above: point.y - world.height(point.x, point.z), plant, wood: true };
  bough.set(perch, one);
  return one;
};

function thicket(a) {
  const { bird, world, way, r } = a, index = shrubsOf(world);
  const rest = bird.sheet.poses.perched, singing = bird.sheet.poses.singing || null;
  const low = bird.sheet.poses.ground || { ...rest, feet: { mode: 'flat' } };
  const span = (range) => range[0] + r() * (range[1] - range[0]);
  const pos = new THREE.Vector3(), quat = new THREE.Quaternion();
  // where it is (kept across its activities): the place it is on, how far along the twig from it (m), and the way it
  // faces (level)
  const at = { place: null, slide: 0, face: new THREE.Vector3(Math.cos(r() * 6.28), 0, Math.sin(r() * 6.28)).normalize() };
  // (its songs come oftener in the early morning and the evening)
  const dawn = world.hour < 9 || world.hour > 18 ? (way.song.dawn ?? 0.5) : 1;
  const nextSong = () => span(way.song.every) * dawn;
  let spell = span(way.spell), chips = span(way.chip.every) * r(), songs = nextSong() * (0.15 + 0.85 * r());
  let sallies = way.sally ? span(way.sally.every) * r() : Infinity, downs = way.ground ? span(way.ground.every) * (0.3 + 0.7 * r()) : Infinity;
  let hovers = way.hover ? span(way.hover.every) * r() : Infinity, flicks = way.tail ? span(way.tail.every) * r() : Infinity;
  let again = 0, follow = null;
  // seconds left that it keeps to the inside of the shrub (after the walker has put it up)
  let skulk = 0;
  const mood = () => (skulk > 0 ? 'in' : 'out');
  const tick = (dt) => { spell -= dt; chips -= dt; songs -= dt; sallies -= dt; downs -= dt; hovers -= dt; flicks -= dt; again -= dt; skulk -= dt; };
  const party = () => (bird.home && bird.home.party) || null;

  // ---- places
  // where the bird stands on a place: on the twig, `slide` metres along it from the place, facing across it the way
  // it faces (a twig that stands upright: the way it faces). It stands on the twig's upper side, square to the twig
  // (on a stem that slopes steeply, a willow's or a vine maple's, which is a few centimetres across, that is to one
  // side of its middle line and not over it)
  const stand = (place, slide, outPos, outQ) => {
    outPos.copy(place.point).addScaledVector(place.along, slide);
    _w.copy(place.along).multiplyScalar(-place.along.y); _w.y += 1;
    if (_w.lengthSq() < 1e-6) _w.set(0, 1, 0);
    outPos.addScaledVector(_w.normalize(), place.radius * 0.96);
    _v.crossVectors(place.along, UP).setY(0);
    if (_v.lengthSq() < 0.04) _v.copy(at.face);
    _v.normalize();
    if (_v.dot(at.face) < 0) _v.negate();
    at.face.copy(_v);
    return frame(_v, UP, outQ);
  };
  const settle = () => stand(at.place, at.slide, bird.at, bird.q);
  // onto a place: where along its twig it is, unless it is the one it is on already
  // (`bird.twig` is the place it is on, or the spot on the ground: for the tools, which ask what it stands on)
  const onto = (place) => { if (place !== at.place) { at.place = place; at.slide = 0; } bird.twig = place; settle(); };
  // the plants about a spot: those within reach of it, or, in a party, those within the party's reach of where it is.
  // (Its home is where it begins; from there it works on through whatever shrubs it likes, and where the walker has
  // put it up it goes on from where it went to. Kept to its home's own shrubs, one put up out of them could only hop
  // along the twig it had gone to.)
  const plantsAbout = (x, z, reach) => {
    const p = party();
    if (p) return index.near(p.at.x, p.at.z, p.radius + 4, []);
    return index.near(x, z, reach + 4, []);
  };
  // How much of a place a walker sees, 0 to 1: how open it is to the walk (life/places/thicket.js `open`) and, with the
  // walker within 25 m, whether a twig stands between it and where they are now (`clear`); the less the nearer the
  // ground (the ferns and the floor's plants stand in front of it there). Measured, 2026-11-16 (a bird
  // held on 90 places of 18 shrubs near the walk and looked at from 10 m on it): of the places with no twig between
  // them and the eye, a quarter of the bird or more showed in 21 close-ups of 22 from 1.2 to 3 m over the ground, and
  // in 6 of 12 below 1.2 m. Which side of its shrub a place was on, and how far out, said nothing of it (a rule by
  // those, which this replaces, ranked the close-ups no better than chance). A bough of a tree is taken to be little
  // seen, and was not measured: no bird of the runs was on one (one bird looked at through an apple tree's blossom,
  // on what is not known, showed nothing of itself from 7 to 10 m and a quarter at most from 11 to 15).
  const seen = (one) => {
    if (one.open == null) { if (!one.plant.places.length) return 0.15; index.sight(one.plant); }
    const open = world.eye.distanceTo(one.point) < 25 ? 0.35 * one.open + 0.65 * (index.clear(one, world.eye) ? 1 : 0) : one.open;
    return open * clamp((one.above - 0.45) / 0.8, 0.3, 1);
  };
  // how much a place is wanted, for a bird that shows itself (`out`: and the more on a kind whose twigs show it, and at
  // a stem's end), that keeps out of sight (`in`), or neither
  const leaning = (one, mode) => (mode === 'out' ? shown(one) * (0.03 + 4 * seen(one) ** 3) : mode === 'in' ? 0.05 + 2 * (1 - seen(one)) ** 2 : 1);
  // A place to go to: on a plant about it that its kind likes, at its heights, within `reach` of (x, z), free, and clear
  // of the walker; with `beyond`, further from the walker than that; with `low`, the lowest few; in a party, within its
  // reach of where it is (and on a low bough there if no shrub is). Chosen by how much its kind likes the plant, and by
  // `mode`: where the walk sees it (`out`), or where it does not (`in`).
  const choose = (x, z, reach, { beyond = 0, low: lowest = false, below = Infinity, mode = null } = {}) => {
    const p = party(), list = [], weights = [];
    const [h0, h1] = way.heights;
    const fits = (one) => one !== at.place && one.point.y < below && world.free(one.point, bird, 0.3) && a.clear(one.point)
      && (!beyond || one.point.distanceTo(world.eye) > beyond) && (!p || Math.hypot(one.point.x - p.at.x, one.point.z - p.at.z) <= p.radius);
    for (const plant of plantsAbout(x, z, reach)) {
      const w = way.shrubs[plant.kind] || 0;
      if (!(w > 0) || Math.hypot(plant.x - x, plant.z - z) > reach + plant.reach) continue;
      for (const one of plant.places) {
        if (one.above < h0 || one.above > h1 || Math.hypot(one.point.x - x, one.point.z - z) > reach || !fits(one)) continue;
        list.push(one); weights.push(w * leaning(one, mode));
      }
    }
    // low boughs: a kind that takes them, and any of a party where no shrub is
    if ((way.shrubs.bough || 0) > 0 || (p && !list.length)) {
      for (const perch of world.boughsNear(x, z, reach, _boughs)) {
        const one = boughPlace(perch, world);
        if (one.above < Math.max(h0, 1) || one.above > (p ? way.high : Math.min(h1, way.high)) || Math.hypot(one.point.x - x, one.point.z - z) > reach || !fits(one)) continue;
        list.push(one); weights.push((way.shrubs.bough || 0.5) * leaning(one, mode));
      }
    }
    return pickOne(list, weights, lowest);
  };
  // one of a list, by its weights; with `lowest`, among the lowest few
  const pickOne = (list, weights, lowest = false) => {
    if (!list.length) return null;
    if (lowest) {
      let least = Infinity;
      for (const one of list) least = Math.min(least, one.above);
      for (let i = 0; i < list.length; i += 1) if (list[i].above > least + 0.6) weights[i] = 0;
    }
    let total = 0;
    for (const w of weights) total += w;
    if (!(total > 0)) return null;
    let k = r() * total;
    for (let i = 0; i < list.length; i += 1) { k -= weights[i]; if (k <= 0) return list[i]; }
    return list[list.length - 1];
  };
  // A song post near (x, z), within `reach`: the top of a shrub (a cane's end, the end of a willow's stem), no higher
  // than its kind's heights and `lift` (`song.lift`); the higher on its plant and the more the walker sees of it, the
  // likelier.
  const post = (x, z, reach) => {
    const p = party(), list = [], weights = [], high = way.heights[1] + way.song.lift;
    const fits = (point) => world.free(point, bird, 0.3) && a.clear(point) && (!p || Math.hypot(point.x - p.at.x, point.z - p.at.z) <= p.radius);
    for (const plant of plantsAbout(x, z, reach)) {
      const w = way.shrubs[plant.kind] || 0;
      if (!(w > 0) || !plant.top) continue;
      for (const one of plant.places) {
        if (one === at.place || one.above < 0.5 || one.above > high || Math.hypot(one.point.x - x, one.point.z - z) > reach || !fits(one.point)) continue;
        const k = (one.above / Math.max(0.5, plant.top.above)) ** 4 * shown(one) * (0.05 + seen(one) ** 2);
        if (k > 0.01) { list.push(one); weights.push(w * k); }
      }
    }
    return pickOne(list, weights);
  };
  // the ground between the shrubs and the walk, at the walk's edge, near (x, z): a spot free and clear of the walker
  const edgeNear = (x, z, reach) => {
    const list = [], weights = [];
    for (const plant of plantsAbout(x, z, reach)) {
      if (!((way.shrubs[plant.kind] || 0) > 0)) continue;
      for (const spot of plant.edge) {
        if (Math.hypot(spot.point.x - x, spot.point.z - z) > reach || !world.free(spot.point, bird, 0.3) || !a.clear(spot.point) || world.crowd(spot.point, bird) < 0.3) continue;
        list.push(spot); weights.push(1);
      }
    }
    return pickOne(list, weights);
  };
  // off to a place, and onto it, into the activity `landing`
  const go = (place, landing, doing, ...more) => {
    at.face.set(place.point.x - bird.at.x, 0, place.point.z - bird.at.z);
    if (at.face.lengthSq() < 1e-6) at.face.set(1, 0, 0);
    at.face.normalize();
    const to = new THREE.Vector3(), q = new THREE.Quaternion();
    stand(place, 0, to, q);
    if (place === at.place) at.slide = 0;
    const far = to.distanceTo(bird.at);
    a.fly({ at: to, q, rise: far < 2.5 ? 0.05 : 0.15, floor: world.height, speed: far < 2.5 ? way.speed * 0.55 : way.speed }, landing, place, ...more);
    bird.doing = doing;
    return true;
  };

  // ---- how it holds itself
  const sit = (head, extra = {}) => Object.assign(bird.want, { pitch: rest.pitch, lift: rest.lift, lean: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0.02, gape: 0,
    head, tail: { ...rest.tail, yaw: 0, prop: null }, feet: { mode: 'grip', round: Math.max(0.003, at.place ? at.place.radius : 0.005) } }, extra);
  const crouch = (head, extra = {}) => Object.assign(bird.want, { pitch: low.pitch, lift: low.lift, lean: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0.04, gape: 0,
    head, tail: { ...low.tail, yaw: 0, prop: null }, feet: { mode: 'flat' } }, extra);
  // its tail, by its kind: a flip with a flick of the wings (Wilson's), a flick from side to side (MacGillivray's), a
  // tail cocked up (the yellowthroat), a quick flick (the orange-crowned); laid over whatever it is doing
  const flicked = (dt) => {
    const now = a.now;
    if (!way.tail) return;
    if (!(now.flick > 0)) {
      if (flicks < 0) { flicks = span(way.tail.every); now.flickTime = now.flick = way.tail.kind === 'side' ? 0.5 : way.tail.kind === 'cock' ? 0.9 : 0.24; }
      return;
    }
    now.flick -= dt;
    const t = clamp(1 - now.flick / now.flickTime, 0, 1), s = Math.sin(Math.PI * t), tail = bird.want.tail;
    if (way.tail.kind === 'flip') { tail.pitch += 0.55 * s; tail.fan = (tail.fan || 0) + 0.18 * s; tail.yaw = 0.3 * Math.sin(2 * Math.PI * t); Object.assign(bird.want, { spread: 0.2 * s, flap: 0.35 * s }); bird.snap = true; }
    else if (way.tail.kind === 'side') tail.yaw = 0.42 * Math.sin(2 * Math.PI * t);
    else if (way.tail.kind === 'cock') tail.pitch += 0.4 * Math.min(1, 3 * s);
    else { tail.pitch += 0.35 * s; bird.snap = true; }
  };

  // ---- what takes it elsewhere, whatever it is doing
  // in a party: with it, or after it, or off when it has gone
  const company = (dt) => {
    const p = party();
    if (!p) return false;
    if (p.gone) { if (again <= 0) { again = 1; if (a.leave(Infinity)) return true; } return false; }
    if (Math.hypot(bird.at.x - p.at.x, bird.at.z - p.at.z) <= p.radius) { follow = null; return false; }
    if (follow == null) follow = 0.3 + r() * 2.2;
    follow -= dt;
    if (follow > 0) return false;
    follow = null;
    const one = choose(p.at.x, p.at.z, p.radius, { mode: mood() });
    if (one) return go(one, 'glean', 'following the flock through the trees');
    if (again <= 0) { again = 1.5; if (a.leave(a.awhile())) return true; }
    return false;
  };
  // alone: its spell is over, and it is off for a while or for good (with no way out found it looks again in a moment)
  const spent = () => {
    if (party() || spell > 0 || again > 0) return false;
    again = 1.5;
    return a.leave(r() < way.gone ? Infinity : a.awhile());
  };

  // ---- the things it goes off to do
  // up to a song post near it to sing a run of songs (one the walker has no trunk in front of, before any other), or a
  // run of them from where it is
  const toSing = () => {
    const count = Math.round(span(way.song.songs)), reach = way.reach * 2.5;
    if (r() < way.song.post) {
      const first = post(bird.at.x, bird.at.z, reach);
      const one = first && world.blocked(world.eye, first.point) ? post(bird.at.x, bird.at.z, reach) || first : first;
      if (one && one.point.y > bird.at.y + 0.15) return go(one, 'sing', 'flying up to the top of ' + named(one), count, true);
    }
    return a.to('sing', at.place, count, false);
  };
  // back down into the thicket
  const drop = () => {
    const one = choose(bird.at.x, bird.at.z, way.reach * 1.5, { below: bird.at.y - 0.3, mode: mood() });
    return one ? go(one, 'glean', 'dropping back into the thicket') : false;
  };
  // out after an insect: a short flight into the air near the shrub and a snap there
  const sally = () => {
    if (!way.sally || !at.place) return false;
    for (let tries = 0; tries < 6; tries += 1) {
      const th = r() * 6.283, d = span(way.sally.reach), dy = span(way.sally.rise);
      pos.set(at.place.point.x + Math.cos(th) * d, at.place.point.y + dy, at.place.point.z + Math.sin(th) * d);
      if (pos.y - world.height(pos.x, pos.z) < 0.7 || !a.clear(pos, 2) || world.blocked(at.place.point, pos) || world.crowd(pos, bird) < 0.8) continue;
      a.fly({ at: pos.clone(), q: frame(_v.subVectors(pos, bird.at).setY(0), UP, quat).clone(), rise: 0, floor: world.height, speed: way.speed }, 'snap', at.place);
      bird.doing = 'flying out after an insect';
      return true;
    }
    return false;
  };
  // out to the edge of the leaves, to hover there and pick at them
  const hoverOut = () => {
    if (!way.hover || !at.place || at.place.plant.kind === 'bough') return false;
    const plant = at.place.plant;
    _w.set(at.place.point.x - plant.x, 0, at.place.point.z - plant.z);
    if (_w.lengthSq() < 1e-4) _w.set(Math.cos(r() * 6.28), 0, Math.sin(r() * 6.28));
    _w.normalize();
    pos.copy(at.place.point).addScaledVector(_w, 0.22 + r() * 0.2); pos.y += (r() - 0.3) * 0.25;
    if (pos.y - world.height(pos.x, pos.z) < 0.5 || !a.clear(pos, 1) || world.crowd(pos, bird) < 0.5) return false;
    a.fly({ at: pos.clone(), q: frame(_w.clone().negate(), UP, quat).clone(), rise: 0, floor: world.height, speed: way.speed * 0.5 }, 'hover', pos.clone(), span(way.hover.time));
    bird.doing = 'flying out to the edge of the leaves';
    return true;
  };
  // down to the ground between the shrubs and the walk, at the walk's edge (life/places/thicket.js `edge`: not in
  // water, not on steep ground), clear of the walker
  const down = () => {
    if (!way.ground || !at.place || at.place.plant.kind === 'bough') return false;
    const spot = edgeNear(bird.at.x, bird.at.z, way.reach * 2);
    if (!spot) return false;
    at.face.set(spot.point.x - spot.plant.x, 0, spot.point.z - spot.plant.z);
    if (at.face.lengthSq() < 1e-6) at.face.set(1, 0, 0);
    at.face.normalize().applyAxisAngle(UP, (r() - 0.5) * 2);
    a.fly({ at: spot.point.clone(), q: frame(at.face, UP, quat).clone(), rise: 0, floor: world.height, speed: way.speed * 0.5 }, 'ground', spot);
    bird.doing = 'dropping to the ground at the edge of the trail';
    return true;
  };

  // ---- its activities
  const glean = {
    enter(a, place, wait = 0.25 + r() * 0.7) {
      Object.assign(a.now, { wait, hop: null, hops: 0, peck: 0, look: 0, chip: 0, head: { yaw: 0, pitch: rest.head && rest.head.pitch != null ? rest.head.pitch : 0.05, roll: 0 } });
      onto(place);
    },
    step(a, dt) {
      const now = a.now;
      if (world.day < 0.08) { if (!now.dusk) { now.dusk = true; const one = choose(bird.at.x, bird.at.z, way.reach * 2, { low: true, mode: 'in' }); if (one && go(one, 'roost', 'going to roost in the thicket')) return; } a.to('roost', at.place); return; }
      tick(dt); now.wait -= dt; now.look -= dt;
      // it turns its head this way and that, quickly
      if (now.look < 0) { now.look = 0.15 + r() * 0.5; now.head = { yaw: (r() - 0.5) * 2.2, pitch: (r() - 0.45) * 0.8, roll: (r() - 0.5) * 0.4 }; }
      // a hop along its twig
      if (now.hop) {
        const h = now.hop;
        h.t = Math.min(1, h.t + dt / 0.1);
        at.slide = h.a + (h.b - h.a) * h.t;
        settle();
        bird.at.y += 0.014 * Math.sin(Math.PI * h.t);
        sit(now.head, { lift: rest.lift + 0.12 * Math.sin(Math.PI * h.t) });
        if (h.t >= 1) { now.hop = null; now.wait = now.hops > 0 ? 0.04 + r() * 0.08 : 0.2 + r() * 0.7; }
        return;
      }
      if (company(dt) || spent()) return;
      if (now.peck > 0) {
        now.peck -= dt;
        sit({ yaw: 0.6 * Math.sin(now.peck * 23), pitch: -0.5 - 0.25 * Math.sin(now.peck * 9), roll: 0.25 }, { pitch: rest.pitch - 0.12 });
        flicked(dt);
        bird.doing = 'picking insects from the leaves';
        return;
      }
      sit(now.head);
      flicked(dt);
      // its chip, now and then, as it goes (it chipped oftener with the walker near: a bird goes about what it is
      // doing whoever is near, the owner's rule)
      if (chips < 0) { chips = span(way.chip.every); now.chip = 0.12; world.say(bird, 'chip', way.chip.reach); }
      if (now.chip > 0) { now.chip -= dt; bird.want.gape = 0.35; bird.doing = way.chip.doing; }
      else bird.doing = skulk > 0 ? 'skulking deep in the thicket' : 'working through the twigs';
      if (now.wait > 0) return;
      if (skulk <= 0) {
        if (songs < 0) { songs = nextSong(); if (toSing()) return; }
        if (sallies < 0) { sallies = span(way.sally.every); if (sally()) return; }
        if (hovers < 0) { hovers = span(way.hover.every); if (hoverOut()) return; }
        if (downs < 0) { downs = span(way.ground.every); if (down()) return; }
      }
      if (now.hops > 0) { now.hops -= 1; hop(now); return; }
      const k = r();
      if (k < 0.32) { now.peck = 0.3 + r() * 0.9; now.wait = 0.1 + r() * 0.3; return; }
      if (k < 0.6) { now.hops = Math.floor(r() * 3); hop(now); return; }
      if (k < 0.92) { const one = choose(bird.at.x, bird.at.z, way.reach, { mode: mood() }); if (one && go(one, 'glean', skulk > 0 ? 'creeping through the thicket' : 'flitting to another twig')) return; }
      // (nothing near it to go to, inside the shrub or out in the open: a longer flit)
      if (k < 0.97) { const one = choose(bird.at.x, bird.at.z, way.reach * 2, { mode: mood() }); if (one && go(one, 'glean', 'flitting to another twig')) return; }
      at.face.negate(); settle(); now.wait = 0.2 + r() * 0.4;
    },
  };
  // a hop along the twig it is on: not off its end, not onto another bird, not towards the walker past where it would flush
  const hop = (now) => {
    const step = (0.04 + r() * 0.06) * (r() < 0.5 ? 1 : -1);
    let b = at.slide + step;
    if (Math.abs(b) > SLIDE) b = at.slide - step;
    stand(at.place, b, pos, quat); settle();
    if (world.crowd(pos, bird) < 0.2 || !a.clear(pos, 0)) { now.hops = 0; now.wait = 0.3; return; }
    now.hop = { a: at.slide, b, t: 0 };
    bird.doing = 'hopping along a twig';
  };

  // a run of songs, each as long as the recording played for it (life/species: its voices), with a few seconds
  // between; then back down into the thicket
  const sing = {
    enter(a, place, count, high = false) {
      Object.assign(a.now, { songs: count, note: 0, wait: 0.4 + r() * 0.8, look: 0, high, head: { yaw: 0, pitch: 0.15, roll: 0 } });
      onto(place);
    },
    step(a, dt) {
      const now = a.now;
      if (world.day < 0.08) { const one = choose(bird.at.x, bird.at.z, way.reach * 2, { low: true, mode: 'in' }); if (!(one && go(one, 'roost', 'going to roost in the thicket'))) a.to('roost', at.place); return; }
      tick(dt); now.wait -= dt; now.note -= dt; now.look -= dt;
      if (now.note > 0) {
        const up = singing || rest;
        sit({ yaw: 0.3 * Math.sin(now.note * 1.4), pitch: 0.5, roll: 0 }, { pitch: up.pitch, lift: up.lift, gape: (now.note * way.song.rate) % 1 > 0.45 ? 0.55 : 0.12 });
        if (singing && singing.tail) bird.want.tail = { ...singing.tail, yaw: 0, prop: null };
        // (a yellowthroat flicks its wings and tail as it sings)
        if (way.song.flick) { const s = Math.max(0, Math.sin(now.note * 7)); Object.assign(bird.want, { spread: 0.16 * s, flap: 0.3 * s }); bird.want.tail.pitch += 0.25 * s; }
        bird.doing = way.song.doing;
        return;
      }
      if (company(dt)) return;
      if (now.look < 0) { now.look = 0.3 + r() * 0.8; now.head = { yaw: (r() - 0.5) * 2, pitch: 0.1 + (r() - 0.5) * 0.4, roll: 0 }; }
      sit(now.head);
      flicked(dt);
      bird.doing = now.high ? 'perched on the top of ' + named(at.place) : 'perched in ' + named(at.place);
      if (now.wait > 0) return;
      if (now.songs > 0) { now.note = way.song.time; now.songs -= 1; now.wait = now.note + span(way.song.gap); world.say(bird, 'song', way.song.reach); return; }
      if (now.high && drop()) return;
      a.to('glean', at.place, 0.4);
    },
  };

  // the snap: on the wing a moment at the end of a sally, bill open; back to its twig, or another near it
  const snap = {
    wary: false,
    enter(a, from) { a.now.from = from; a.now.time = 0.1 + r() * 0.12; bird.aloft = true; },
    step(a, dt) {
      const now = a.now;
      now.time -= dt;
      bird.beat += dt * way.hz * Math.PI * 2;
      bird.at.y += 0.4 * dt * Math.sin(world.clock * 9);
      Object.assign(bird.want, { pitch: 0.5, lift: 0.6, lean: 0, spread: 1, flap: 0.75 * Math.sin(bird.beat) + 0.15, hand: 0.5 * Math.sin(bird.beat - 1), sweep: -0.1, droop: 0, gape: 0.9,
        head: { yaw: 0, pitch: 0.2, roll: 0 }, tail: { pitch: 0.3, fan: 0.5, yaw: 0, prop: null }, feet: { mode: 'tuck' } });
      bird.snap = true; bird.doing = 'snapping an insect from the air';
      if (now.time > 0) return;
      const back = now.from && world.free(now.from.point, bird, 0.3) && a.clear(now.from.point) ? now.from : choose(bird.at.x, bird.at.z, way.reach, { mode: 'out' });
      if (back) go(back, 'glean', 'back to the shrub');
      else if (!a.leave(a.awhile())) now.time = 0.4;
    },
  };
  // at the edge of the leaves, on beating wings, picking at them
  const hover = {
    wary: false,
    enter(a, base, time) { a.now.base = base; a.now.time = time; bird.aloft = true; },
    step(a, dt) {
      const now = a.now;
      now.time -= dt;
      bird.beat += dt * way.hz * Math.PI * 2;
      bird.at.copy(now.base); bird.at.y += 0.01 * Math.sin(world.clock * 11);
      Object.assign(bird.want, { pitch: 0.75, lift: 0.6, lean: 0, spread: 1, flap: 0.75 * Math.sin(bird.beat) + 0.15, hand: 0.5 * Math.sin(bird.beat - 1), sweep: -0.12, droop: 0, gape: 0,
        head: { yaw: 0, pitch: -0.35, roll: 0 }, tail: { pitch: 0.4, fan: 0.5, yaw: 0, prop: null }, feet: { mode: 'tuck' } });
      bird.snap = true; bird.doing = 'hovering at the leaves, picking at them';
      if (now.time > 0) return;
      const back = at.place && world.free(at.place.point, bird, 0.3) && a.clear(at.place.point) ? at.place : choose(bird.at.x, bird.at.z, way.reach, { mode: 'out' });
      if (back) go(back, 'glean', 'back to the leaves');
      else if (!a.leave(a.awhile())) now.time = 0.4;
    },
  };
  // on the ground at the walk's edge by the shrubs: short hops, picking at the litter
  const ground = {
    enter(a, spot) { bird.twig = spot; Object.assign(a.now, { spot, until: span(way.ground.stay), wait: 0.3, hop: null, peck: 0, look: 0, head: { yaw: 0, pitch: 0, roll: 0 } }); },
    step(a, dt) {
      const now = a.now;
      if (world.day < 0.08) {
        if (!now.tried) { now.tried = true; skulk = Math.max(skulk, 1); if (rise()) return; }
        crouch({ yaw: 0, pitch: 0.05, roll: 0 }); bird.doing = 'roosting under the shrubs';
        return;
      }
      tick(dt); now.until -= dt; now.wait -= dt; now.look -= dt;
      if (now.look < 0) { now.look = 0.2 + r() * 0.6; now.head = { yaw: (r() - 0.5) * 2, pitch: (r() - 0.4) * 0.6, roll: (r() - 0.5) * 0.3 }; }
      if (now.hop) {
        const h = now.hop;
        h.t = Math.min(1, h.t + dt / 0.11);
        bird.at.lerpVectors(h.a, h.b, h.t); bird.at.y += 0.02 * Math.sin(Math.PI * h.t);
        crouch(now.head, { lift: low.lift + 0.15 * Math.sin(Math.PI * h.t) });
        if (h.t >= 1) { now.hop = null; now.wait = 0.15 + r() * 0.7; }
        return;
      }
      if (company(dt) || spent()) return;
      if (now.peck > 0) {
        now.peck -= dt;
        crouch({ yaw: 0.4 * Math.sin(now.peck * 19), pitch: -0.8, roll: 0 }, { pitch: low.pitch + 0.2 });
        flicked(dt);
        bird.doing = 'picking at the litter at the edge of the trail';
        return;
      }
      crouch(now.head);
      flicked(dt);
      bird.doing = 'hopping about at the edge of the trail';
      if (now.wait > 0) return;
      if (now.until < 0) { if (rise()) return; now.until = 2; }
      const k = r();
      if (k < 0.4) { now.peck = 0.3 + r() * 0.8; now.wait = 0.1; return; }
      if (k < 0.9) {
        // a hop of a hand's breadth: about its spot at the walk's edge (and no nearer the walk's middle line than half a
        // metre), not into water, not onto another animal, not towards the walker past where it would flush
        const th = Math.atan2(at.face.z, at.face.x) + (r() - 0.5) * 2.2, d = 0.05 + r() * 0.08;
        const x = bird.at.x + Math.cos(th) * d, z = bird.at.z + Math.sin(th) * d, kind = world.ground(x, z);
        if (Math.hypot(x - now.spot.point.x, z - now.spot.point.z) > 0.7 || kind === 'water' || kind === 'steep' || world.trail.locate(x, z)[0] < 0.5) { at.face.negate(); frame(at.face, UP, bird.q); now.wait = 0.3; return; }
        pos.set(x, world.height(x, z), z);
        if (world.crowd(pos, bird) < 0.2 || !a.clear(pos, 0)) { now.wait = 0.4; return; }
        at.face.set(Math.cos(th), 0, Math.sin(th)); frame(at.face, UP, bird.q);
        now.hop = { a: bird.at.clone(), b: pos.clone(), t: 0 };
        return;
      }
      at.face.negate(); frame(at.face, UP, bird.q); now.wait = 0.3 + r() * 0.4;
    },
  };
  // back up into the shrub, low
  const rise = () => {
    const one = choose(bird.at.x, bird.at.z, way.reach * 1.5, { low: true, mode: mood() });
    return one ? go(one, 'glean', 'back up into the thicket') : false;
  };

  // by night, still on a twig in the thicket
  const roost = {
    wary: false,
    enter(a, place) { if (place) onto(place); },
    step(a) {
      if (world.day >= 0.08) { a.to('glean', at.place, 0.5); return; }
      sit({ yaw: 0, pitch: 0.05, roll: 0 }, { pitch: rest.pitch + 0.1, lift: rest.lift * 0.85 });
      bird.doing = 'roosting in the thicket';
    },
  };

  return {
    activities: { glean, sing, snap, hover, ground, roost },
    // Put up: off through the thicket, chipping, to a twig further from the walker than it is (another shrub, or the
    // far side of this one); none, and it is off out of sight (life/behave.js)
    refuge() {
      const one = choose(bird.at.x, bird.at.z, way.flee, { beyond: bird.at.distanceTo(world.eye) + 1.5, mode: 'in' });
      if (!one) return false;
      world.say(bird, 'chip', way.chip.reach);
      skulk = span(way.skulk);
      return go(one, 'glean', 'off through the thicket, chipping');
    },
    // where it is when it comes: on a twig of its home (or about its party), low by night; it flies in if the walker
    // could see it be there from nowhere
    begin() {
      const night = world.day < 0.08, p = party(), x = p ? p.at.x : bird.home.x, z = p ? p.at.z : bird.home.z;
      const one = choose(x, z, p ? p.radius : way.range + 4, { low: night, mode: night ? 'in' : 'out' });
      if (!one) { bird.left = 6 + r() * 10; return; }
      a.to(night ? 'roost' : 'glean', one, 0.5);
      if (!night && !a.life.first && (world.plain(bird.at, bird.size) || r() < 0.5)) {
        if (!a.come({ at: bird.at.clone(), q: bird.q.clone(), rise: 0.1, floor: world.height }, 'glean', one, 0.5)) bird.left = 4 + r() * 8;
      }
    },
  };
}

// A home: a few shrubs near the walk that its kind likes (`shrubs`), with enough twigs at its heights (`need`), no
// nearer another of its kind's home than `apart` (a territory each); a kind that keeps to wet ground (`wet`) is found
// where the ground is wet, or on the river's bars and banks, the more the more it keeps to it; and a kind that keeps
// to the densest thickets (`dense`) where the most shrubs it likes stand together (counted within 5 m).
const thicketHome = (way) => (habitat, r, taken = []) => {
  const index = shrubsOf(habitat), [h0, h1] = way.heights;
  const twigs = (plant) => plant.places.reduce((n, one) => n + (one.above >= h0 && one.above <= h1 ? 1 : 0), 0);
  const wetness = (plant) => (plant.ground === 'wet' ? 1 : plant.ground === 'stones' ? 0.8 : plant.ground === 'grass' && plant.open > 0.8 ? 0.4 : 0);
  const scored = [];
  let total = 0;
  const crowd = (plant) => (way.dense ? Math.pow(index.near(plant.x, plant.z, 5, []).filter((one) => (way.shrubs[one.kind] || 0) > 0).length, way.dense) : 1);
  for (const plant of index.plants) {
    const w = (way.shrubs[plant.kind] || 0) * (1 - way.wet + way.wet * 2 * wetness(plant)) * crowd(plant);
    if (!(w > 0) || plant.off > way.homeOff || !twigs(plant)) continue;
    scored.push([plant, w]); total += w;
  }
  for (let tries = 0; tries < 24 && total > 0; tries += 1) {
    let k = r() * total, plant = scored[scored.length - 1][0];
    for (const [one, w] of scored) { k -= w; if (k <= 0) { plant = one; break; } }
    if (taken.some((home) => home && Math.hypot(home.x - plant.x, home.z - plant.z) < way.apart)) continue;
    const plants = index.near(plant.x, plant.z, way.range, []).filter((one) => (way.shrubs[one.kind] || 0) > 0);
    if (plants.reduce((n, one) => n + twigs(one), 0) < way.need) continue;
    return { x: plant.x, z: plant.z, plants };
  }
  return null;
};

export default {
  // what a thicket warbler's way holds besides what every way has (life/families/index.js)
  fields: {
    homeOff: 'number', range: 'number',             // how far from the walk (m) the middle of its home may be; how far its home spreads
    apart: 'number', need: 'number',                // no nearer than this (m) to another of its kind's home; the twigs a home must have
    shrubs: rest({}, 'number'),                     // how much it likes each kind of plant (life/places/thicket.js), and `bough`: low boughs of trees
    wet: 'number',                                  // how much it keeps to wet ground, 0 to 1
    dense: optional('number'),                      // how much it keeps to where its shrubs stand thickest (a power of their number within 5 m)
    heights: nums(2),                               // the heights (m) above the ground of the twigs it works
    high: 'number',                                 // no higher than this (m) on a bough, where no shrub is (in a party)
    hz: 'number', speed: 'number',                  // wingbeats a second; how fast it flies (m/s)
    spell: nums(2),                                 // seconds it is about, alone, before it goes
    ...WARY,                                        // how near it lets the walker come (life/behave.js)
    reach: 'number', flee: 'number',                // how far it flits to another twig (m); how far it goes when it is put up
    skulk: nums(2),                                 // seconds it keeps to the inside of the shrub after it has been put up
    sally: optional({ every: nums(2), reach: nums(2), rise: nums(2) }),     // seconds between sallies; how far out (m); how far up or down (m)
    hover: optional({ every: nums(2), time: nums(2) }),                     // seconds between hovers at the leaves; how long one lasts
    ground: optional({ every: nums(2), stay: nums(2) }),                    // seconds between drops to the ground; how long it stays there
    tail: optional({ kind: oneOf('flip', 'side', 'cock', 'flick'), every: nums(2) }),
    // seconds between its chips as it goes, and within how many metres of the walker it chips three times as often
    chip: { every: nums(2), reach: 'number', doing: 'string' },
    // seconds between runs of songs, how many songs in a run, the seconds between songs, how long one is (the
    // recording's), notes a second, how far it carries; the chance it goes up to a song post for a run, and how much
    // higher than its heights that post may be (m); whether it flicks its wings and tail as it sings; and how much
    // oftener its runs come in the early morning and the evening (a share of the seconds between them: 0.5 if not given)
    song: { every: nums(2), dawn: optional('number'), songs: nums(2), gap: nums(2), time: 'number', rate: 'number', reach: 'number', post: 'number', lift: 'number', doing: 'string', flick: optional('boolean') },
  },
  act: (way) => (bird, world) => live(bird, world, way, thicket),
  home: thicketHome,
};
