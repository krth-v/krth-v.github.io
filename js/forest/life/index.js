import * as THREE from 'three';
import { SPECIES, WAYS, ROLL } from './species/index.js';
import { bind } from './families/index.js';
import { feelWalker } from './behave.js';
import { census } from './census.js';
import { planOf } from './plans.js';
import { bodyOf, middleOf } from './bodies.js';
import { CEILINGS } from '../budget.js';
import { createAnimalMaterial } from './material.js';
import { createFlock } from './flock.js';
import { standing, onStub, onTrunk, groundUnder } from './perch.js';
import { thrush, creeper } from './agents.js';
import { createHabitat } from './habitat.js';
import { createVisit, walkThrough } from './visit.js';
import { createCard } from './card.js';

// The animals of the forest: who is about, what each is doing this frame, which detail level of it is
// drawn, which one the pointer is on, and the close-up. A click on an animal narrows the view onto it from
// where the walker stands, so nothing is disturbed and the camera never passes through a leaf; the
// surroundings soften, the view follows the animal, and a card says what it is and what it is doing.
//
// Who is about is one of two things. A visit (life/visit.js): the valley as a seed and the hour draw it, with
// animals all along the walk that come and go. Or, where `count` is given, the cast of checkpoint 2: that many
// thrushes and creepers in the composed scene, each where it always was, doing what was approved then. The
// tools ask for the cast, so that what they check stays what it was.

const BEHAVIOUR = { 'varied-thrush': thrush, 'brown-creeper': creeper };
// how each kind that has been built lives on a visit: its way bound to its family (life/families/)
const LIVES = bind(WAYS);
const NEAR = 14, MID = 45, FAR = 150;          // metres (as seen: distance times zoom) to which each detail level is drawn
// Those are a thrush's, and the cast's. One of a visit's animals is drawn to distances that go by its size
// (`size`, m): to where it is about 14, 4.5 and 1.5 pixels long at 1080 lines. A wren 150 m off is a third of a
// pixel, and was drawn.
const REACH = [62, 200, 620];
// And by how many triangles a level holds: a kind whose near or middle level holds more than a small bird's (a
// thrush's are 4,100 and 700) is drawn at it only so much nearer that no animal is drawn with more triangles to a
// pixel of it than a small bird (by the square root of the ratio: an elk's near level of 13,000 triangles is drawn
// to 0.6 of the distance its length alone gives, about 80 m).
const DENSE = [4500, 900];
// And a visit's animals of one kind are drawn together at the finest level any of them in the frame needs, a
// draw call a kind, unless drawing each at its own level saves this many triangles or more (a herd of which one is
// near, a flock of thirty swallows) and the view has the calls for it (`allot`).
const SPLIT = 20000;
// What is kept back of the view's ceilings (js/forest/budget.js CEILINGS) when the animals' share is worked out: what
// the rest of a view may draw more than the most of the last thirty frames (walked as the verifier walks, 1.2 m a
// frame, it drew 3 calls more once in 500 frames, with the ceiling lowered so that the share bound: 2 let it over by one).
const MARGIN = { calls: 4, solid: 8000 };
// What the rest of a view is taken to draw in a frame whose view has jumped, before the visit has drawn anything heavier
// (`allot`): about what the plants, the ground and the water take at the walk's heaviest views, less the post chain's
// passes (94 calls at the most on the busiest visit's walk, 2026-11-16; the brief has the plants at 105 with the passes).
const PRIOR = { calls: 98 };
const WIDE = 50;                               // the walker's field of view, degrees
const FRAME = 2.4;                             // a close-up is this many times as tall as the animal is long (a bird's; its plan's `frame`, life/bodies.js)
const frameOf = (bird) => bodyOf(bird.sheet).frame || FRAME;
// How long an animal is, m: its sheet's length (`size`), or for the other of a pair (`bird.mate`, below) her share of it.
const lengthOf = (bird) => (bird.mate && bird.sheet.mate ? bird.size * bird.sheet.mate.scale : bird.size);
const ASIDE = 0.2;                             // and holds the animal this share of half the frame's width left of the middle: the card is on the right
const _v = new THREE.Vector3(), _q = new THREE.Quaternion(), _m = new THREE.Matrix4(), _eye = new THREE.Vector3(), _w = new THREE.Vector3();
const smooth = (t) => t * t * (3 - 2 * t);

// Built in steps, as the rest of the forest is (js/forest/index.js): a species at a time, then the habitat, then
// the visit. createLife is the whole of it at once.
export function createLife(options) {
  const steps = growLife(options);
  for (;;) { const { done, value } = steps.next(); if (done) return value; }
}
// `frameStats`: what the frame just drawn drew (js/forest/index.js `stats`: its `calls`, its `solid` triangles, and
// whether the sun's map was redrawn in it), from which the animals' share of the next is worked out (`allot`).
export function* growLife({ scene, camera, nav, U, look, settings, terrain, trail, layout, plants, element, post, records, sceneRange, count, visit: seed = 1, hour = 12, busy = false, frameStats = null }) {
  // ---- the species that can be met here, each built and painted once through its body plan (life/plans.js): the
  // cast's two, or the kinds about on this visit (the census, drawn again, the same, by the visit itself). Built at
  // every load, fifty species would take seconds. A kind whose plan is not drawn yet is not built.
  const cast = count != null;
  // Only the animals drawn by this visit can ever occupy a row of a species' bone texture.
  const population = cast
    ? new Map(['varied-thrush', 'brown-creeper'].map(key => [key, Math.ceil(count / 2)]))
    : new Map(census(seed, hour, { busy, roll: ROLL }).about.map(({ key, parties }) =>
      [key, parties.reduce((sum, size) => sum + size, 0)]));
  const kinds = {};
  // (the other of a pair, by its kind's key: a sheet is one plumage, and a sheet with a `mate` is two, life/bodies.js)
  const mates = {};
  // (the animals' share of the view, worked out every frame: `allot`, below; `levels`, each kind's triangles at its three levels)
  const share = { calls: Infinity, solid: Infinity, others: { calls: 0, solid: 0 }, own: 0, passes: 0, cap: null, ceiling: null, guard: true, jumped: false, kinds: 0, used: { calls: 0, solid: 0 }, left: [], coarser: [], split: [], levels: {} };
  for (const [key, sheet] of Object.entries(SPECIES)) {
    const plan = planOf(sheet);
    if (plan.undrawn || !population.has(key) || !LIVES[key]) continue;            // (nor one that has no way of living yet)
    const capacity = Math.max(1, Math.min(48, population.get(key)));
    const kind = plan.build(sheet);
    yield `life: ${key} built`;
    const painted = plan.paint(sheet, look, kind);
    // every animal of a kind is drawn together, a draw call to each detail level in use (life/flock.js)
    const flock = createFlock(kind, (bones) => createAnimalMaterial(U, painted.texture, { msaa: settings.msaa, bones }), capacity, { bones: plan.bones, puppet: plan.puppet });
    scene.add(...flock.meshes);
    // (how far each level is drawn, a metre of the animal's length: REACH, nearer for a level heavier than a small bird's)
    const reach = [REACH[0] * Math.min(1, Math.sqrt(DENSE[0] / kind.triangles[0])), REACH[1] * Math.min(1, Math.sqrt(DENSE[1] / kind.triangles[1])), REACH[2]];
    kinds[key] = { key, kind, sheet, texture: painted.texture, flock, framed: [], reach, whole: plan.whole || null, mode: 'together', least: 0, drawnLast: false };
    share.levels[key] = kind.triangles;
    yield `life: ${key} painted`;
    // The other of a pair (a harlequin's duck beside the drake): the same body in its own paint. So it has a flock of
    // its own, and wherever the kinds are counted it is one more (`allot`: a draw call of its own for each level it is
    // drawn at). Which animal it is its family says (`bird.mate`), and poses it at its own size. Drawn in the one
    // flock, the duck was a small drake.
    if (sheet.mate) {
      const other = plan.paint({ ...sheet, plumage: sheet.mate.plumage }, look, kind);
      const pair = createFlock(kind, (bones) => createAnimalMaterial(U, other.texture, { msaa: settings.msaa, bones }), capacity, { bones: plan.bones, puppet: plan.puppet });
      scene.add(...pair.meshes);
      mates[key] = { ...kinds[key], key: `${key}, ${sheet.mate.shown}`, texture: other.texture, flock: pair, framed: [], mate: true };
      yield `life: ${key}, the ${sheet.mate.shown}, painted`;
    }
  }
  // (every flock there is, for whatever is done to each of them every frame; and which of them an animal is drawn in)
  const entries = [...Object.values(kinds), ...Object.values(mates)];
  const entryOf = (bird) => (bird.mate && mates[bird.key]) || kinds[bird.key];
  // (every species' sheet, built here or not: the count of walks meets kinds this page never built)
  const sheets = SPECIES;
  // ---- a visit: everything an animal can stand on along the whole walk, and the visit's own animals
  const habitat = cast ? null : createHabitat({ terrain, trail, layout, plants, records });
  yield 'life: habitat';
  // (a kind with no model yet lives only in the count of walks: on the page it would be an animal nobody can see,
  // that the pointer could land on and other animals make way for)
  const drawable = Object.fromEntries(Object.entries(LIVES).filter(([key]) => kinds[key] && kinds[key].flock));
  const visit = cast ? null : createVisit({ habitat, trail, ways: drawable, sheets, seed, hour, busy });
  yield 'life: visit';

  // ---- the cast: where they can stand is the trunks of the composed scene, and the stubs on them
  const world = cast ? { height: (x, z) => groundUnder(terrain.heightAt, x, z), trail, eye: new THREE.Vector3(), walker: { speed: 0, s: 0 }, day: 1, sunHeight: 20, trunks: [], stubs: [] } : visit.world;
  const out = { point: new THREE.Vector3(), normal: new THREE.Vector3(), up: new THREE.Vector3(), along: new THREE.Vector3() };
  // Does a trunk stand between two places? Seen from above: a trunk is a circle, and what is at either end of the line does not count.
  if (cast) world.blocked = (a, b) => {
    const dx = b.x - a.x, dz = b.z - a.z, len2 = dx * dx + dz * dz;
    if (len2 < 1e-6) return false;
    for (const place of world.trunks) {
      const t = ((place.foot.x - a.x) * dx + (place.foot.z - a.z) * dz) / len2;
      if (t < 0.02 || t > 0.985) continue;
      if (Math.hypot(a.x + dx * t - place.foot.x, a.z + dz * t - place.foot.z) < place.girth * 0.92) return true;
    }
    return false;
  };
  for (const name of cast ? ['giant', 'mature', 'snag'] : []) {
    const records = layout[name], perch = name === 'snag' ? plants.snag.solid.perch : plants[name].perch;
    for (let i = 0; i < (layout.composed[name] || 0); i += 1) {
      const place = standing(perch, records, i);
      place.kind = name;
      place.turnOffset = -records[i * 8 + 3] / (Math.PI * 2);      // a yaw about +y carries the plant's own +x to (cos, 0, -sin)
      onTrunk(place, 1.5, 0, out);
      place.girth = Math.hypot(out.point.x - place.foot.x, out.point.z - place.foot.z);
      world.trunks.push(place);
      for (const stub of perch.stubs) {
        const radius = onStub(place, stub, out), above = out.point.y - place.foot.y;
        if (radius > 0 && above > 2.5 && above < 13) world.stubs.push({ point: out.point.clone(), along: out.along.clone(), radius, place });
      }
    }
  }

  // ---- who is about: the visit's own animals (the visit adds to the list and takes from it as they come and
  // go), or the cast
  const birds = cast ? [] : visit.birds;
  const add = (key, home, extra = {}) => {
    const { sheet } = kinds[key];
    const bird = { key, sheet, at: new THREE.Vector3(), q: new THREE.Quaternion(), want: {}, pose: {}, doing: '', state: '', beat: 0, home, seed: 17 + birds.length * 101, size: bodyOf(sheet).size(sheet), shown: -1, screen: { x: 0, y: 0, r: 0, d: 0, seen: false }, left: null, held: false, ...extra };
    bird.act = BEHAVIOUR[key](bird, world);
    birds.push(bird);
    return bird;
  };
  const [from, to] = sceneRange, walker = new THREE.Vector3(), tangent = new THREE.Vector3();
  // the side of a trunk that faces a point on the trail, as a share of the way round it
  const facing = (place, s) => { trail.sample(s, walker, tangent); return (Math.atan2(walker.z - place.foot.z, walker.x - place.foot.x)) / (Math.PI * 2) - place.turnOffset; };
  const wanted = cast ? count : 0, each = Math.ceil(wanted / 2);
  for (let i = 0; i < each; i += 1) {
    const f = each === 1 ? 0.2 : i / (each - 1);
    add('varied-thrush', { s: from + 12 + (to - from - 20) * (each <= 2 ? [0.02, 0.72][i] : f), side: [0.25, -0.3, 0.1][i % 3] });
    // a creeper starts on the trunk nearest the trail a little way ahead of where a walker would stand, on the side they see
    const stand = from + 3 + (to - from - 20) * (each <= 2 ? [0, 0.62][i] : f);
    if (world.trunks.length && birds.length < wanted) {                // an odd number is one more thrush than creepers
      trail.sample(stand + 11, walker, tangent);
      let tree = 0, least = Infinity;
      world.trunks.forEach((place, index) => {
        const d = Math.hypot(place.foot.x - walker.x, place.foot.z - walker.z);
        if (d < least && !birds.some((b) => b.key === 'brown-creeper' && b.home === index)) { least = d; tree = index; }
      });
      add('brown-creeper', tree, { turn: facing(world.trunks[tree], stand) });
    }
  }

  // ---- what sets them on the ground: a soft dark patch under an animal that stands on the floor or clings to
  // bark. The sun map holds trunks and logs only, and a bird with nothing under it looked laid over the frame.
  // One instanced mesh, so one draw call however many there are. A patch is as long and as wide as its animal's
  // body (its plan's `body`, or its length), and is gone by the distance at which the animal is a few pixels long:
  // 16 to 36 m for a bird, and as much further as an animal is longer than a quarter of a metre, which the patch
  // carries as the height of its instance (the patch is flat, so its height scales nothing else).
  const SHADES = 64;
  const shades = new THREE.InstancedMesh(new THREE.PlaneGeometry(1, 1).rotateX(-Math.PI / 2), new THREE.ShaderMaterial({
    transparent: true, depthWrite: false, polygonOffset: true, polygonOffsetFactor: -2, polygonOffsetUnits: -2,
    uniforms: { uDark: { value: 0.4 }, uZoom: { value: 1 } },
    vertexShader: /* glsl */`
      varying vec2 vUv; varying float vFar; varying float vReach;
      void main() {
        vUv = uv;
        vReach = length(instanceMatrix[1].xyz);
        vec4 wp = modelMatrix * instanceMatrix * vec4(position, 1.0);
        vFar = distance(wp.xyz, cameraPosition);
        gl_Position = projectionMatrix * viewMatrix * wp;
      }`,
    fragmentShader: /* glsl */`
      varying vec2 vUv; varying float vFar; varying float vReach;
      uniform float uDark, uZoom;
      void main() {
        float a = 1.0 - smoothstep(0.2, 1.0, length(vUv - 0.5) * 2.0);
        // gone by the distance at which the animal itself is a few pixels: mist would not darken with it
        gl_FragColor = vec4(0.0, 0.0, 0.0, a * a * uDark * (1.0 - smoothstep(16.0 * vReach, 36.0 * vReach, vFar * uZoom)));
      }`,
  }), SHADES);
  shades.frustumCulled = false; shades.count = 0; shades.renderOrder = 9;
  scene.add(shades);
  const _n = new THREE.Vector3(), _s = new THREE.Vector3(), flat = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);

  // ---- the pointer, the close-up and the card
  const card = createCard();
  const pointer = { x: -1, y: -1, down: null };
  let hover = null, focus = null, held = 0;                       // held: 0 the walker's own view .. 1 the close-up
  let drawn = 0;                                                  // the triangles of the animals drawn in the last frame
  // The way the close-up looks is a state of its own (`gaze`), not a blend from the walker's own view: a bird
  // that flies off while the view is still narrowing is soon far from where the walker was looking, and a
  // blend that was nine-tenths done left it outside a frame a few degrees wide. `turning` is how much of the
  // gaze is left in the view after the close-up is let go; `unseen` how long a trunk has stood between the
  // walker and the animal. A click on a second animal during a close-up must not jump the view to it, so
  // what the first click set eases: `tight` is the narrowed field of view, `reach` how far off the frame is
  // cleared to, `slack` how far off its place in the frame the animal may still be (in half-frames) and `lag`
  // how far behind it the view's aim may still be (m). Both allowances start as large as the jump and die away.
  const gaze = new THREE.Quaternion();
  let turning = 0, fresh = false, unseen = 0, tight = 0, reach = 0, slack = 0, lag = 0;
  // (which one of its kind an animal is, for its card: its family's word, or that it is the other of a pair, as its
  // sheet names her: "The adult female of the pair")
  const noteOf = (bird) => bird.note || (bird.mate && bird.sheet.mate ? `The ${bird.sheet.mate.shown} of the pair` : '');
  // (an animal the view is held on is not let go from the world while it is held: life/visit.js)
  const hold = (bird) => { if (focus) focus.held = false; focus = bird; bird.held = true; fresh = true; unseen = 0; card.show(bird.sheet, bird.doing, noteOf(bird)); };
  const aim = new THREE.Vector3(), lookAt = new THREE.Quaternion(), NEAREST = camera.near;
  const pick = (x, y) => {
    let best = null, near = Infinity;
    for (const bird of birds) {
      const s = bird.screen;
      if (!s.seen) continue;
      const d = Math.hypot(s.x - x, s.y - y);
      if (d < s.r && d < near) { near = d; best = bird; }
    }
    return best;
  };
  const release = () => { if (focus) { focus.held = false; focus = null; card.hide(); } };
  // where the pointer is, from the event itself: a finger sends no move before it presses
  const point = (e) => { const b = element.getBoundingClientRect(); pointer.x = e.clientX - b.left; pointer.y = e.clientY - b.top; };
  const onMove = (e) => {
    point(e);
    // a drag is the walker turning to look elsewhere
    if (focus && pointer.down && Math.hypot(e.clientX - pointer.down.x, e.clientY - pointer.down.y) > 5) release();
  };
  const onDown = (e) => { point(e); pointer.down = { x: e.clientX, y: e.clientY }; };
  const onUp = (e) => {
    // a click is a press let go where it was made; a drag turns the walker's head, as before
    const d = pointer.down; pointer.down = null;
    point(e);
    if (!d || Math.hypot(e.clientX - d.x, e.clientY - d.y) > 5) return;
    const hit = pick(pointer.x, pointer.y);
    if (hit && hit !== focus) hold(hit); else if (!hit) release();
  };
  const onKey = (e) => { if (e.key === 'Escape') release(); };
  const onLeave = () => { pointer.x = pointer.y = -1; pointer.down = null; };      // (a press let go outside the page is over: left set, no animal was hovered until the next press)
  element.addEventListener('pointermove', onMove);
  element.addEventListener('pointerdown', onDown);
  element.addEventListener('pointerup', onUp);
  element.addEventListener('pointerleave', onLeave);
  window.addEventListener('keydown', onKey);

  // ---- every frame, after the walker has moved and before the frame is drawn
  // A pose is eased towards what is wanted, whatever the plan (life/bodies.js): a number a share of the way, a table
  // field by field (a head twice as fast), a phase (`cycle`) taken as it is, and what the plan names in its `whole`
  // (a bird's `feet`) taken whole.
  const ease = (pose, want, k, snap, whole) => {
    for (const name in want) {                       // (no list is made of them: this runs for every animal in every frame)
      const value = want[name];
      if (typeof value === 'number') pose[name] = snap || name === 'cycle' || typeof pose[name] !== 'number' ? value : pose[name] + (value - pose[name]) * k;
      else if (value === null || typeof value !== 'object' || (whole && whole.includes(name))) pose[name] = value;
      else { pose[name] = pose[name] || {}; ease(pose[name], value, name === 'head' ? Math.min(1, k * 2.6) : k, snap, null); }
    }
  };
  // Where an animal's middle is in the world (its plan's `middle`, life/bodies.js), into `out`.
  const _ahead = new THREE.Vector3(), _upward = new THREE.Vector3();
  const middle = (bird, out) => {
    const [ahead, up] = middleOf(bird);
    return out.copy(bird.at).addScaledVector(_ahead.set(1, 0, 0).applyQuaternion(bird.q), ahead).addScaledVector(_upward.set(0, 1, 0).applyQuaternion(bird.q), up);
  };
  // ---- the close-up's view, while there is any of it (`held`, `turning`): where it aims, how narrow it is, what is
  // cleared before it and softened round it. It is set before the animals move, since what they do goes by what the
  // walker can see; and with an animal held it is set again, in no time (a `step` of 0: nothing eases, and the view
  // is only brought back to within what it allows itself of the animal), once they have moved. Aimed only before, it
  // was aimed at where the animal had been, a frame's flight behind: a swift at 12 m/s, 45 m off in a frame 0.8 m
  // tall, was up to half of the frame's half width from its place in it, and is now a fifth at the most.
  function closeUp(step) {
    if (focus) {
      // The view follows the animal's middle (its plan's, life/bodies.js) a moment behind it, which is what keeps a
      // hop from shaking the frame, but never by more than a share of the frame: a bird in flight would be out of it
      // in a wingbeat.
      middle(focus, _v);
      if (aim.lengthSq() === 0) { aim.copy(_v); lag = 0; }
      else {
        if (fresh) lag = aim.distanceTo(_v);
        aim.lerp(_v, Math.min(1, step * 7));
        lag *= Math.exp(-step * 5);
        const behind = aim.distanceTo(_v), most = Math.max(lengthOf(focus) * frameOf(focus) * 0.12, lag);
        if (behind > most) aim.lerp(_v, 1 - most / behind);
      }
    }
    const d = aim.distanceTo(camera.position), size = focus ? lengthOf(focus) : update.size, k = smooth(held);
    const tall = focus ? frameOf(focus) * size : update.tall;           // (how tall the frame is, m: its plan's share of the animal's length)
    update.size = size; update.tall = tall;
    const narrow = THREE.MathUtils.clamp(THREE.MathUtils.radToDeg(2 * Math.atan(tall / (2 * d))), 1, 40);
    tight = tight === 0 ? narrow : tight + (narrow - tight) * Math.min(1, step * 5);
    reach = reach === 0 ? d : reach + (d - reach) * Math.min(1, step * 5);
    camera.fov = WIDE + (tight - WIDE) * k;
    // Nothing nearer than most of the way to the animal is drawn: a twig a metre from the lens would lie across
    // the whole frame. What grows round the animal stays, and so does all of the animal: an elk seen end on
    // reaches more than a metre towards the lens from its middle.
    const ahead = Math.min(d, reach);
    camera.near = NEAREST + (Math.max(NEAREST, Math.min(0.72 * ahead, ahead - 0.6 * size)) - NEAREST) * k;
    // look a little to the animal's right, so that it sits left of the middle
    _eye.subVectors(aim, camera.position).cross(camera.up).normalize();
    _v.copy(aim).addScaledVector(_eye, ASIDE * camera.aspect * d * Math.tan(THREE.MathUtils.degToRad(tight / 2)));
    lookAt.setFromRotationMatrix(_m.lookAt(camera.position, _v, camera.up));
    if (focus) {
      const half = THREE.MathUtils.degToRad(camera.fov / 2);
      if (fresh) {
        // from where the view is now: the walker's own, part of the way back from the last close-up, or the close-up of another animal
        gaze.copy(turning > 0 ? _q.copy(camera.quaternion).slerp(gaze, smooth(turning)) : camera.quaternion);
        slack = gaze.angleTo(lookAt) / half;
        fresh = false;
      }
      // The gaze closes on the animal. It is never further from it than a quarter of the half-frame, except
      // just after a click: then no further, in half-frames, than the animal was when it was clicked.
      gaze.slerp(lookAt, 1 - Math.exp(-step * 5));
      slack *= Math.exp(-step * 3);
      const off = gaze.angleTo(lookAt), most = half * Math.max(0.25, slack);
      if (off > most) gaze.slerp(lookAt, 1 - most / off);
      turning = 1;
      camera.quaternion.copy(gaze);
    } else camera.quaternion.slerp(gaze, smooth(turning));
    // (and never beyond the ground at the frame's foot. A lying elk's frame reaches a metre below the ground it lies
    // on; that ground rose towards it, the frame's lowest rays met it 8.4 m out where the near plane stood at 8.9, and
    // a grey band lay across the foot of the frame where the ground had been cut away. So the frame's foot is followed
    // out, at its two corners and its middle, as far as the near plane, and where it meets the ground first the near
    // plane comes in to there. `t` is depth along the view, the ray being one deep; at most forty steps a ray.)
    {
      const down = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)), across = down * camera.aspect, p = camera.position;
      const stride = Math.max(0.5, camera.near / 40);
      const below = (t) => p.y + _w.y * t < world.height(p.x + _w.x * t, p.z + _w.z * t) + 0.05;
      for (const side of [-1, 0, 1]) {
        _w.set(side * across, -down, -1).applyQuaternion(camera.quaternion);
        for (let t = stride; t < camera.near; t += stride) {
          if (!below(t)) continue;
          // (where it crosses, to a thirty-second of a step: found to the step, the near plane jumped by half a metre
          // as the frame followed a moving animal)
          let a = t - stride, b = t;
          for (let k = 0; k < 5; k += 1) { const m = (a + b) / 2; if (below(m)) b = m; else a = m; }
          camera.near = Math.max(NEAREST, 0.95 * a);
          break;
        }
      }
    }
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
    post.setSoft(k, d);
  }

  // `lent`: the frame's view is given from outside (js/forest/index.js `frame`: the cabin's own eye, through its window).
  function update(dt, cfg, day, lent = false) {
    const step = Math.min(dt, 0.05), height = element.clientHeight || 1, width = element.clientWidth || 1;
    // A view given from outside is not the walker's to narrow: a close-up is let go at once, with nothing of it left
    // to ease out of. (Let go as the visitor came in through the cabin's door, it went on easing out for two seconds
    // of the window's frames: their surroundings softened and their mist halved.)
    if (lent) { release(); held = 0; turning = 0; }
    // (what the walker's own movements are, as the animals feel them: life/behave.js)
    const controls = { speed: nav.state.speed, yaw: nav.state.yaw, s: nav.state.s, auto: !!(nav.state.auto || nav.state.free), elapsed: dt };
    if (cast) { world.eye.copy(camera.position); world.day = day; world.sunHeight = cfg.elevationDeg; feelWalker(world.walker, controls, step); }

    // the close-up: the view turns to the animal and narrows onto it; let go, it widens back to the walker's own
    // it ends when the walker walks on, when the animal is far off, or when it has gone round its trunk and stayed there
    if (focus && focus.left != null) release();                 // (it has gone: left held, it hung where it stopped)
    if (focus) unseen = hidden(focus) || focus.cover ? unseen + step : 0;
    // (far off: 80 m for a bird, and as much further as an animal is longer than two thirds of a metre: an elk's 276 m)
    if (focus && (Math.abs(nav.state.speed) > 0.35 || focus.at.distanceTo(camera.position) > Math.max(80, 120 * focus.size) || unseen > 2.5)) release();
    held += ((focus ? 1 : 0) - held) * Math.min(1, step * 3.2);
    if (Math.abs((focus ? 1 : 0) - held) < 0.002) held = focus ? 1 : 0;
    if (!focus && turning > 0) { turning -= turning * Math.min(1, step * 3.2); if (turning < 0.002) turning = 0; }
    const zoomed = held > 0 || turning > 0;
    if (zoomed) {
      closeUp(step);
      // A long lens gathers all the mist between it and the animal into one small frame, and at dawn a thrush
      // fourteen metres off was a pale shape. The close-up sees through half of it. (The light sets the
      // mist every frame before this runs, so nothing has to be put back.)
      U.uFogDensity.value *= 1 - 0.5 * smooth(held);
    } else {
      if (camera.fov !== WIDE || camera.near !== NEAREST) { camera.fov = WIDE; camera.near = NEAREST; camera.updateProjectionMatrix(); }
      post.setSoft(0, 1);
      aim.set(0, 0, 0);
      tight = reach = 0;
    }

    const zoom = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / Math.tan(THREE.MathUtils.degToRad(WIDE / 2));
    const focal = (height / 2) / Math.tan(THREE.MathUtils.degToRad(camera.fov / 2));
    // (what the rest of the frame just drawn drew, before this frame's animals are counted: `allot`)
    if (!cast && step > 0 && frameStats) note(frameStats());
    let shaded = 0;
    drawn = 0;
    for (const { flock } of entries) if (flock) flock.begin();
    // everyone's life goes on by a step: a frame that takes no time changes nothing (the pop check draws two and
    // wants them the same to the last pixel)
    if (step > 0) {
      if (visit) visit.step(step, { camera, focal, day, sunHeight: cfg.elevationDeg, ...controls });
      else for (const bird of birds) { bird.snap = false; bird.act(step); }
      if (focus) closeUp(0);                       // (the animal held has moved: the view, to where it is now)
    }
    // ---- each animal: which level its distance draws it at, whether any of it is in the frame, where it is on the page
    for (const bird of birds) {
      const entry = entryOf(bird), d = bird.at.distanceTo(camera.position), seen = (d * zoom) / settings.lodScale;
      const level = cast ? (seen < NEAR ? 0 : seen < MID ? 1 : seen < FAR ? 2 : -1)
        : seen < entry.reach[0] * bird.size ? 0 : seen < entry.reach[1] * bird.size ? 1 : seen < entry.reach[2] * bird.size ? 2 : -1;
      bird.shown = level;
      // a bird too far off to be drawn still lives its life, but how it holds itself is left as it was
      if (level >= 0) ease(bird.pose, bird.want, Math.min(1, step * 14), bird.snap, entry.whole);
      // where its middle is on the page, for the pointer: never a smaller target than 18 pixels round
      middle(bird, _v).project(camera);
      // it is drawn if any of it could be in the frame: its middle within a sixth of a frame of the frame's edge,
      // and as much further as the animal is long there
      const edge = 1.35 + (bird.size / Math.max(d, 0.05)) * (focal / (height / 2));
      // (nor is one its family hides, `hide`: a frog under the water or under cover. It is not drawn, and it is not
      // counted among what is: counted, a kind that was all under water took a call from a kind that could be seen)
      bird.framed = level >= 0 && !bird.hide && !!entry.flock && _v.z < 1 && _v.z > -1 && Math.abs(_v.x) < edge && Math.abs(_v.y) < edge;
      if (bird.framed && !cast) entry.framed.push(bird);
      const s = bird.screen;
      s.x = (_v.x * 0.5 + 0.5) * width; s.y = (-_v.y * 0.5 + 0.5) * height; s.d = d;
      s.r = Math.max(18, (lengthOf(bird) * 0.8 / d) * focal);
      // (one under cover is not the pointer's to find: a ring round a fern with nothing to be seen in it)
      s.seen = level >= 0 && _v.z < 1 && _v.z > -1 && Math.abs(_v.x) < 1.05 && Math.abs(_v.y) < 1.05 && !bird.cover && !hidden(bird);
    }
    // ---- which kinds in the frame are drawn, and at which levels, within the view's ceilings (`allot`)
    if (!cast) allot(step, zoomed && smooth(held) > 0.003, focal, zoomed);
    // ---- drawn: each animal, and its patch: on the floor it lies the way the ground slopes, on bark the way the animal clings
    for (const bird of birds) {
      if (!bird.framed) continue;
      const entry = entryOf(bird), level = cast ? bird.shown : bird.drawAt;
      if (level < 0) { bird.screen.seen = false; continue; }                 // (left out of a frame that had no room for its kind)
      // (`omit`: left out of the picture for a frame, by a tool that wants to know how much of it the picture shows;
      // its patch stays, as it always has. It is the tool's own word: `hide` is the animal's family's, and a tool that
      // set and cleared that brought a frog out from under the water)
      if (!bird.omit && entry.flock.add(bird.at, bird.q, bird.pose, level)) drawn += entry.kind.triangles[level];
      if (bird.shown < 2 && shaded < SHADES && !bird.cover && patch(bird)) {
        shades.setMatrixAt(shaded, _m.compose(_v, flat, _s));
        shaded += 1;
      }
    }
    for (const entry of entries) entry.framed.length = 0;
    for (const { flock } of entries) if (flock) flock.end();
    shades.count = shaded;
    shades.instanceMatrix.needsUpdate = true;
    shades.material.uniforms.uZoom.value = zoom;
    // (the draws the animals made, for the next frame's share: a call to each level of each kind drawn, and one for the patches)
    let own = shaded > 0 ? 1 : 0;
    for (const { flock } of entries) if (flock) for (const mesh of flock.meshes) if (mesh.visible) own += 1;
    share.own = own;
    hover = pointer.x >= 0 && !pointer.down ? pick(pointer.x, pointer.y) : null;
    card.ring(hover && hover !== focus ? hover.screen : null);
    element.style.cursor = hover ? 'pointer' : '';
    if (focus) card.doing(focus.doing);
  }

  // ---- an animal's patch, into _v (where), `flat` (how it lies) and _s (its length, its reach as the patch's height,
  // its width); false if it has none. It lies on what the animal stands on: by its family's word, what `bird.on` says
  // ('ground'; 'surface', in the animal's own frame: bark, a log's back, a stump's top; null: none); or, for a bird
  // in one of the states that had a patch before there was `on` (ONE), what that gave; or else the ground if the
  // animal is within a hand (a share of its length) of it and upright, and what it clings to if its own up is tilted
  // far from upright (bark). Never on the wing.
  const ONE = { forage: 'ground', climb: 'surface', log: 'surface' };
  function patch(bird) {
    if (bird.state === 'fly' || bird.state === 'gone') return false;
    const q = bird.q, size = bird.size, body = bird.body;
    const x = bird.at.x, z = bird.at.z, here = world.height(x, z);
    let on = bird.on !== undefined ? bird.on : ONE[bird.state];
    if (on === undefined) {
      const tilted = _upward.set(0, 1, 0).applyQuaternion(q).y < 0.55;
      on = tilted ? 'surface' : bird.at.y - here < Math.max(0.06, 0.3 * size) ? 'ground' : null;
    }
    if (on !== 'ground' && on !== 'surface') return false;
    if (on === 'ground') {
      // (the slope over a stride of the animal: 8 cm for a bird, most of its length for a big one)
      const e = Math.max(0.08, body ? body.long * 0.8 : 0);
      _n.set(world.height(x - e, z) - world.height(x + e, z), 2 * e, world.height(x, z - e) - world.height(x, z + e)).normalize();
      flat.setFromUnitVectors(UP, _n).multiply(_q.setFromAxisAngle(UP, Math.atan2(-_ahead.set(1, 0, 0).applyQuaternion(q).z, _ahead.x)));
      _v.set(x, here, z);
    } else { flat.copy(q); _v.copy(bird.at); }
    _v.addScaledVector(_n.set(0, 1, 0).applyQuaternion(flat), 0.003);
    _s.set(body ? body.long * 2.3 : size * 1.25, Math.max(1, size / 0.25), body ? body.wide * 3 : size * 0.8);
    return true;
  }

  // ---- the animals' share of a view. A view draws at most CEILINGS.drawCalls and holds at most
  // CEILINGS.solidTriangles (js/forest/budget.js); the plants, the ground, the water and the post chain's passes take
  // what they take, and the animals have what is left of each, less a little (MARGIN). What the rest takes is read
  // from the frames just drawn (`frameStats`: the most of the last thirty, so that the share changes slowly), since
  // this runs before the plants are packed; a frame in which the sun's map was redrawn draws that besides, for a
  // frame, and is not counted. Each kind in the frame is a draw call to each detail level it is drawn at:
  //   - every kind is first drawn together, all of its animals in the frame at the finest level any of them needs:
  //     one call. One is drawn at its animals' own levels instead (a call a level in use) where that saves SPLIT
  //     triangles or more and the calls allow, those that save the most first (a herd or a flock, of which one is near).
  //     The other of a pair, drawn in paint of its own, counts as a kind of its own in all of this.
  //   - more kinds in the frame than calls: those smallest on the screen are left out of it, the smallest first.
  //   - more triangles than are left: the kinds smallest on the screen are drawn a level coarser, the smallest first,
  //     until it fits.
  // The kind of the animal held in a close-up is always drawn, and never coarser. A kind drawn in the last frame
  // counts as half as large again, one drawn at its own levels stays so while that saves half of SPLIT, and one drawn
  // coarser stays so until there is room to spare, so that a kind on the edge of any of them does not come and go
  // from one frame to the next. A frame that takes no time (the pop check, the close-up check and `shows` each draw
  // two and compare them) chooses from the same state as the frame before it and keeps nothing of what it chose, so
  // that two such frames draw the same, wherever the camera has been put; an animal a tool leaves out (`omit`) is
  // counted as if it were drawn, and one its family hides (`hide`) is not counted. A tool may set a lower ceiling on the animals' calls (`life.drawing.cap`: the patches' one
  // call is besides), or a lower ceiling on the whole view's (`life.drawing.ceiling`, to see the share bind).
  //   A view that has jumped since the last frame (put somewhere by a script or through the cabin's door, a long frame
  // at a run: more than 2 m, a turn of more than a quarter of a radian, or a field of view a sixth wider or narrower
  // that is not a close-up's doing)
  // is not the view the last thirty frames drew, and what the rest takes there is not known until it is drawn: for
  // that one frame the most calls the rest has taken on this visit are counted, and never fewer than PRIOR, about what
  // the plants take at the walk's heaviest views (`guard`; a tool may turn it off to see what it does). So too while
  // no frame has been counted yet. Jumped to the
  // walk's busiest view from its lightest, the frame after each jump was over a lowered ceiling by up to five calls
  // without it, and none with it. Only calls: a frame's triangles may be over for that one frame. And only in a frame
  // that takes time: a tool's held frame chooses as it always has, so that what the tools hold is what it was.
  const history = [], peak = { calls: 0 }, lastView = { at: new THREE.Vector3(), ahead: new THREE.Vector3(), fov: 0, lens: false, set: false };
  function note(s) {
    if (!s || s.sunMapRedrawn || !(s.calls > 0)) return;            // (no frame drawn yet, or one that redrew the sun's map besides)
    const h = { calls: Math.max(0, s.calls - share.own - share.passes), solid: Math.max(0, s.solid - drawn) };
    history.push(h);
    if (history.length > 30) history.shift();
    peak.calls = Math.max(peak.calls, h.calls);
    share.others.calls = 0; share.others.solid = 0;
    for (const one of history) { share.others.calls = Math.max(share.others.calls, one.calls); share.others.solid = Math.max(share.others.solid, one.solid); }
  }
  // (on the working state: `use` is how a kind is drawn this frame, 'together', 'own' or 'left', and `floor` the
  // coarsest level any of its animals is drawn at, at the least)
  const levelsOf = (e) => { let mask = 0; for (const b of e.framed) mask |= 1 << Math.max(b.shown, e.floor); return mask; };
  const callsOf = (mask) => (mask & 1) + ((mask >> 1) & 1) + ((mask >> 2) & 1);
  const callsIn = (e) => (e.use === 'left' ? 0 : e.use === 'together' ? 1 : callsOf(levelsOf(e)));
  const trianglesOf = (e, use = e.use) => {
    const T = e.kind.triangles;
    if (use === 'left') return 0;
    if (use === 'together') return e.framed.length * T[Math.max(e.finest, e.floor)];
    let sum = 0;
    for (const b of e.framed) sum += T[Math.max(b.shown, e.floor)];
    return sum;
  };
  function allot(step, soft, focal, lens) {
    const list = [];
    for (const entry of entries) if (entry.flock && entry.framed.length) list.push(entry);
    for (const e of list) {
      let finest = 2, px = 0;
      for (const b of e.framed) { finest = Math.min(finest, b.shown); px = Math.max(px, (b.size / Math.max(b.screen.d, 0.05)) * focal); }
      e.finest = finest;
      e.held = !!focus && e.framed.includes(focus);
      e.rank = e.held ? Infinity : px * (e.drawnLast ? 1.5 : 1);
      e.floor = e.held ? 0 : e.least;
    }
    // the share: what is left of the ceilings, less what the post chain's passes after the scene take (the final pass,
    // the light shafts, bloom's six, and six more to soften a close-up's surroundings: js/forest/post.js)
    const passes = 1 + (settings.shaftSteps > 0 ? 1 : 0) + (settings.bloom ? 6 : 0) + (soft ? 6 : 0);
    _w.set(0, 0, -1).applyQuaternion(camera.quaternion);
    // (a close-up's own narrowing and widening is no jump: `lens`, in this frame or the last. Taken for one, the eight
    // frames in which a narrow close-up widens fastest left the animals three calls, and every kind in the frame but
    // the three largest was gone for them)
    const jumped = !lastView.set || camera.position.distanceTo(lastView.at) > 2 || _w.angleTo(lastView.ahead) > 0.25 || (!lens && !lastView.lens && Math.abs(camera.fov / lastView.fov - 1) > 1 / 6);
    // (and with no frame counted yet, what the rest takes is as little known as after a jump: the page's first frame
    // draws the sun's map and is not counted, and in its second the animals had every call there is)
    const guarded = (jumped || !history.length) && share.guard && step > 0;
    const othersCalls = guarded ? Math.max(share.others.calls, peak.calls, PRIOR.calls) : share.others.calls;
    const othersSolid = share.others.solid;
    share.jumped = jumped;
    if (step > 0) { lastView.at.copy(camera.position); lastView.ahead.copy(_w); lastView.fov = camera.fov; lastView.lens = lens; lastView.set = true; }
    share.calls = Math.min(share.cap ?? Infinity, (share.ceiling ?? CEILINGS.drawCalls) - othersCalls - passes - MARGIN.calls - 1);     // (and one for the patches)
    share.solid = CEILINGS.solidTriangles - othersSolid - MARGIN.solid;
    list.sort((a, b) => b.rank - a.rank);
    // together, one call each, the largest on the screen first, as many as there are calls for
    let calls = 0;
    for (const e of list) { if (calls < share.calls || e.held) { e.use = 'together'; calls += 1; } else e.use = 'left'; }
    // at their own levels, where that saves many triangles, the most first, while the calls allow
    const saving = (e) => trianglesOf(e, 'together') - trianglesOf(e, 'own');
    for (const e of list.filter((one) => one.use === 'together' && saving(one) >= (one.mode === 'own' ? SPLIT / 2 : SPLIT)).sort((a, b) => saving(b) - saving(a))) {
      const more = callsOf(levelsOf(e)) - 1;
      if (calls + more <= share.calls) { e.use = 'own'; calls += more; }
    }
    // triangles: a level finer where there is room to spare, the largest first; then coarser while over, the smallest
    // first; and if every one of them is at its coarsest and it is over still, the smallest left out
    let tris = 0;
    for (const e of list) tris += trianglesOf(e);
    for (const e of list) {
      if (e.floor === 0 || e.use === 'left') continue;
      const before = trianglesOf(e), callsBefore = callsIn(e);
      e.floor -= 1;
      const after = trianglesOf(e), callsAfter = callsIn(e);
      if (tris - before + after < share.solid - SPLIT && calls - callsBefore + callsAfter <= share.calls) { tris += after - before; calls += callsAfter - callsBefore; } else e.floor += 1;
    }
    for (let i = list.length - 1; i >= 0 && tris > share.solid; i -= 1) {
      const e = list[i];
      while (tris > share.solid && e.floor < 2 && !e.held && e.use !== 'left') {
        const before = trianglesOf(e), callsBefore = callsIn(e);
        e.floor += 1;
        tris += trianglesOf(e) - before; calls += callsIn(e) - callsBefore;
      }
    }
    for (let i = list.length - 1; i >= 0 && tris > share.solid; i -= 1) {
      const e = list[i];
      if (!e.held && e.use !== 'left') { tris -= trianglesOf(e); calls -= callsIn(e); e.use = 'left'; }
    }
    // each animal's level, as its kind is drawn
    for (const e of list) for (const b of e.framed) b.drawAt = e.use === 'left' ? -1 : e.use === 'together' ? Math.max(e.finest, e.floor) : Math.max(b.shown, e.floor);
    // what it came to (`life.drawing`)
    share.passes = passes; share.kinds = list.length; share.used.calls = calls; share.used.solid = tris;
    share.left = list.filter((e) => e.use === 'left').map((e) => e.key);
    share.coarser = list.filter((e) => e.floor > 0 && e.use !== 'left').map((e) => e.key);
    share.split = list.filter((e) => e.use === 'own').map((e) => e.key);
    // kept for the next frame, from a frame that took time (a kind out of the frame starts afresh when it comes back into it)
    if (step > 0) {
      for (const entry of entries) if (!list.includes(entry)) { entry.drawnLast = false; entry.mode = 'together'; entry.least = 0; }
      for (const e of list) { e.mode = e.use; e.least = e.held ? e.least : e.floor; e.drawnLast = e.use !== 'left'; }
    }
  }

  // Is a trunk between the walker and the animal? (The trunk a creeper is on hides it from the far side.) A big
  // animal (`body`) is hidden only if its middle, its head end and its rump end, at the height of its back, all are.
  function hidden(bird) {
    if (!bird.body) return world.blocked(camera.position, bird.at);
    _ahead.set(1, 0, 0).applyQuaternion(bird.q).setY(0);
    if (_ahead.lengthSq() < 1e-8) _ahead.set(1, 0, 0); else _ahead.normalize();
    for (const k of [0, 1, -1]) {
      _w.copy(bird.at).addScaledVector(_ahead, k * bird.body.long); _w.y += bird.body.high * 0.85;
      if (!world.blocked(camera.position, _w)) return false;
    }
    return true;
  }

  // (what was drawn, and not what each animal's own distance would have drawn it at: the animals of a kind in the
  // frame are drawn together at the finest level any of them needs, and one out of the frame is not drawn)
  const triangles = () => drawn;
  function dispose() {
    element.removeEventListener('pointermove', onMove); element.removeEventListener('pointerdown', onDown);
    element.removeEventListener('pointerup', onUp); element.removeEventListener('pointerleave', onLeave);
    window.removeEventListener('keydown', onKey);
    card.dispose();
    scene.remove(shades); shades.geometry.dispose(); shades.material.dispose(); shades.dispose();
    // (the other of a pair has its kind's own body: that is let go once, with the kind)
    for (const { kind, texture, flock, mate } of entries) { if (!flock) continue; scene.remove(...flock.meshes); flock.dispose(); texture.dispose(); if (!mate) kind.levels.forEach((l) => l.geometry.dispose()); }
  }

  // A visit walked once round with nothing drawn (life/visit.js): what a walk at `pace` metres a second met.
  // `elevation` is the sun's, in degrees, as the site's clock gives it for the hour. It is a valley of its own:
  // the page's own animals are not touched.
  const dayAt = (elevation) => { const t = Math.min(1, Math.max(0, (elevation - 0.3) / 3.2)); return t * t * (3 - 2 * t); };
  // A visit of its own, not yet begun, for a tool to step by hand with a walker of its own (life/visit.js `step`).
  function meet({ seed: which = 1, hour: when = 12, busy: most = false } = {}) {
    return createVisit({ habitat: habitat || createHabitat({ terrain, trail, layout, plants, records }), trail, ways: LIVES, sheets, seed: which, hour: when, busy: most });
  }
  function walk({ seed: which = 1, hour: when = 12, elevation = 20, pace = 3.2, busy: most = false, from: start = 0, stay = 0, dt = 0.1, each = null } = {}) {
    const lands = habitat || createHabitat({ terrain, trail, layout, plants, records });
    return walkThrough(createVisit({ habitat: lands, trail, ways: LIVES, sheets, seed: which, hour: when, busy: most }), trail, { pace, dt, from: start, stay, day: dayAt(elevation), sunHeight: elevation, each });
  }

  // (`species`: every species whose body is drawn, for the tools' contact sheets; `built`: the ones built on this page)
  return { birds, world, update, triangles, dispose, release, species: Object.keys(SPECIES).filter((key) => !planOf(SPECIES[key]).undrawn), built: Object.keys(kinds), walk, meet,
    // the animals' share of the view (`allot`): what was left of the ceilings for them (`calls`, `solid`), what the rest
    // of the frame drew (`others`), what they used (`used`), the kinds in the frame, those left out of it, drawn
    // coarser or at their own levels; `cap`, which a tool may set, is a lower ceiling on their calls
    drawing: share,
    // the kinds that are here now: the cast's two, or whoever of a visit's is there at the moment
    get about() { return [...new Set(birds.map((b) => b.key))]; },
    names: Object.fromEntries(Object.entries(SPECIES).map(([key, sheet]) => [key, sheet.name])),
    // the visit: its seed, and who is about on it (null for the cast)
    visit: visit ? { seed, busy, summary: visit.summary, who: visit.who, voices: visit.voices, get broken() { return visit.broken; } } : null,
    focus: (i) => { if (birds[i]) hold(birds[i]); }, get focused() { return focus ? birds.indexOf(focus) : -1; }, get held() { return held; } };
}
