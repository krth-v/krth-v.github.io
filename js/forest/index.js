import * as THREE from 'three';
import { createTerrain, LEGACY } from './world/terrain.js';
import { createOldTrail, createTrail } from './world/trail.js';
import { buildLayoutSteps, RECORD, UNDER_KINDS } from './world/layout.js';
import { InstanceSet, buildCasters, SOLID_LAYER } from './world/instancer.js';
import { createLight } from './light/shared.js';
import { createMaterials } from './light/materials.js';
import { createSunMap } from './light/sunMap.js';
import { createCanopyMap, createNoiseTexture } from './light/canopyMap.js';
import { buildRiver, buildCreek, banksMap } from './world/water.js';
import { SHAPE } from './world/land.js';
import { backdropTexturesSteps, backdropBand } from './paint/backdrop.js';
import { createPost } from './post.js';
import { createTrailController } from './nav/trailController.js';
import { forestSettings, createGovernor } from './budget.js';
import { getLook } from './looks/index.js';
import * as paint from './paint/textures.js';
import { CONIFERS, buildConifer } from './plants/conifer.js';
import { CEDAR, buildCedar } from './plants/cedar.js';
import { MAPLE, VINE, buildMaple, buildVineMaple } from './plants/maple.js';
import { mapleAtlas } from './paint/maple.js';
import { ALDER, WILLOW, buildAlder, buildWillow } from './plants/alder.js';
import { alderAtlas, alderBark } from './paint/alder.js';
import { SPIRES, buildSpire } from './plants/spire.js';
import { spireAtlasSteps, spruceBark } from './paint/spire.js';
import { buildFallsRock } from './plants/crag.js';
import { buildFootbridge } from './plants/footbridge.js';
import { buildShelter, SHELTER } from './plants/shelter.js';
import { buildCabin, CABIN, SITE as CABIN_SITE } from './plants/cabin.js';
import { APPLE, buildApple } from './plants/apple.js';
import { appleAtlas } from './paint/apple.js';
import { buildFern, buildSorrel, buildSeedling, buildGrass, buildSkunkCabbage } from './plants/understory.js';
import { buildCobbles, buildRocks } from './plants/stones.js';
import { SALMON, ELDER, CLUB, HUCKLE, buildSalmonberry, buildElder, buildDevilsClub, buildHuckleberry, buildBracken } from './plants/shrubs.js';
import { shrubAtlas, ladyFernAtlas } from './paint/shrubs.js';
import { CARPET, FUNGUS, BEARD, buildCarpet, buildTrillium, buildFungus, buildBeard } from './plants/flowers.js';
import { flowerAtlas } from './paint/flowers.js';
import { standing, onTube, onTrunk } from './life/perch.js';
import { buildLog, buildStump, buildSnag, buildDrift } from './plants/deadwood.js';
import cathedral from './scenes/cathedral.js';
import walk from './scenes/walk.js';
import { buildStructures, cabinFloor } from './world/structures.js';
import { buildLantern, LANTERN } from './world/lantern.js';
import { growLife } from './life/index.js';
import { createSound } from './sound/index.js';
import { createHud } from './hud.js';

// The forest: its own scene, camera and render chain on the caller's renderer.
// Nothing here imports from, or is imported by, the cabin's modules except the
// solar object handed to frame().
//
//   const forest = createForest({ renderer, look: 'gouache', overrides });
//   forest.frame(t, dt, solarState(hour));

export const SCENES = [cathedral, walk];

// How far each metre of the trail map reaches: the red channel is distance / 8 m. It covers the old
// world's box (WORLD here), which holds the whole walk; beyond it a read takes the edge's value, which is
// "far from the trail" so long as the trail keeps 8 m inside the box.
const WORLD = LEGACY;
function createTrailMap(trail) {
  const size = 256, w = WORLD.maxX - WORLD.minX, h = WORLD.maxZ - WORLD.minZ;
  const data = new Uint8Array(size * size);
  for (let j = 0; j < size; j += 1) {
    for (let i = 0; i < size; i += 1) {
      const d = trail.distance(WORLD.minX + ((i + 0.5) / size) * w, WORLD.minZ + ((j + 0.5) / size) * h);
      data[j * size + i] = Math.round(255 * Math.min(1, d / 8));
    }
  }
  const texture = new THREE.DataTexture(data, size, size, THREE.RedFormat, THREE.UnsignedByteType);
  texture.minFilter = texture.magFilter = THREE.LinearFilter;
  texture.needsUpdate = true;
  return { texture, origin: new THREE.Vector2(WORLD.minX, WORLD.minZ), invSize: new THREE.Vector2(1 / w, 1 / h) };
}

// The forest is built in steps: each ends with a yield, which says what was done. createForest and layOut take
// all of them at once, as they always did; the cabin's page takes them a few milliseconds at a time, between the
// room's frames (createForestSlowly). The steps change nothing of what is built or in what order.
const drain = (steps) => { for (;;) { const { done, value } = steps.next(); if (done) return value; } };
const nextFrame = () => new Promise((resolve) => requestAnimationFrame(() => setTimeout(resolve, 0)));
// Every texture a scene's materials read.
function texturesOf(scene) {
  const textures = new Set();
  scene.traverse((object) => {
    const materials = Array.isArray(object.material) ? object.material : object.material ? [object.material] : [];
    for (const material of materials) {
      for (const uniform of Object.values(material.uniforms || {})) {
        const value = uniform && uniform.value;
        if (value && value.isTexture) textures.add(value);
        else if (Array.isArray(value)) for (const each of value) if (each && each.isTexture) textures.add(each);
      }
      for (const key of ['map', 'normalMap', 'alphaMap']) if (material[key] && material[key].isTexture) textures.add(material[key]);
    }
  });
  return textures;
}
// A painted sheet's pixels are let go once the GPU has them. three r160 sends a texture once and keeps what it was
// sent from: a cut-out sheet's canvas, a copy of that canvas and its mip levels, which for the forest and a visit's
// animals came to 955 MB held for the life of the page (counted 2026-11-19; the renderer process 1,338 MB against 831
// without). Nothing in the forest reads a sheet's pixels again (the studios and show=textures paint their own), so
// each is let go right after its upload (`onUpdate`), its sizes kept. A canvas two textures were painted on goes when
// the last of them has been sent. What cannot be sent again cannot survive a lost WebGL context: the pages that show
// the forest start again, or fall back, if that happens (dev.js, outside.js).
function letPixelsGo(renderer, textures) {
  const waiting = new Map();
  const painted = [...textures].filter((t) => !t.isDataTexture && !t.isDepthTexture && !t.isRenderTargetTexture && !t.isCompressedTexture
    && typeof HTMLCanvasElement !== 'undefined' && t.image instanceof HTMLCanvasElement);
  for (const texture of painted) waiting.set(texture.image, (waiting.get(texture.image) || 0) + 1);
  const release = (texture) => {
    texture.onUpdate = null;
    const canvas = texture.image;
    if (texture.mipmaps && texture.mipmaps.length) texture.mipmaps = texture.mipmaps.map(({ width, height }) => ({ width, height }));
    if (!(canvas instanceof HTMLCanvasElement)) return;
    texture.image = { width: canvas.width, height: canvas.height };
    const left = waiting.get(canvas) - 1;
    waiting.set(canvas, left);
    if (left <= 0) canvas.width = canvas.height = 0;
  };
  for (const texture of painted) {
    const sent = renderer.properties.get(texture);
    if (sent.__webglTexture && sent.__version === texture.version) release(texture); else texture.onUpdate = release;
  }
  return painted.length;
}
// A painter's steps, each labelled with what is being painted; a painter that is no generator is one step.
function* stepsOf(label, made) {
  if (!made || typeof made.next !== 'function') { yield label; return made; }
  for (;;) { const { done, value } = made.next(); if (done) { yield label; return value; } yield `${label}, ${value}`; }
}

// The ground, the trail and where every plant stands. Nothing here touches the GPU:
// the map view (forest.html?show=map) draws from it alone.
export function layOut(options) { return drain(layOutSteps(options)); }
function* layOutSteps({ seed = 1, density = 1 } = {}) {
  const terrain = createTerrain(7);
  yield 'terrain';
  const oldTrail = createOldTrail(terrain.base);            // the loop of checkpoint 2, on the ground of checkpoint 2
  const trail = createTrail(terrain, oldTrail);             // the walk
  yield 'trail';
  yield* terrain.grow();                                    // (the ground's own mesh, which knows the trail's cut)
  const layout = yield* buildLayoutSteps({ trail, oldTrail, terrain, seed, density, scenes: SCENES });
  return { terrain, trail, oldTrail, layout };
}

// The records of a kind that stand inside the old world's box: what the sun's shadow map is drawn from.
function inOldWorld(records) {
  const kept = [];
  for (let o = 0; o < records.length; o += RECORD) {
    const x = records[o], z = records[o + 2];
    if (x >= LEGACY.minX && x <= LEGACY.maxX && z >= LEGACY.minZ && z <= LEGACY.maxZ) kept.push(o);
  }
  if (kept.length * RECORD === records.length) return records;
  const out = new Float32Array(kept.length * RECORD);
  kept.forEach((o, i) => out.set(records.subarray(o, o + RECORD), i * RECORD));
  return out;
}

// The valley's conifers stand where the layout scattered its `spruce`, and which of the two a tree is goes by
// where it stands (plants/spire.js has what was read): Sitka spruce on our side of the river, on the hill and
// the bank, and on the walls for 26 m back from the cobbles, where it is the forest's edge to the river;
// beyond that, up the far wall and our own wall up the valley, more and more of them western hemlock, and
// from 46 m back all of them. A tree's share is
// set against a number made from where it stands, so no random number is drawn for it and the layout is what
// it was. (Not against a number the tree already has: set against its phase in the wind, where the two are
// mixed every hemlock had one of the low phases and every spruce one of the high.)
// `lists` are the scatter's own (layout.spruce) and the ones laid since on the walls (layout.slopes).
export function valleyConifers(lists, land) {
  const spruce = [], slope = [];
  for (const records of lists) {
    for (let o = 0; o < records.length; o += RECORD) {
      const x = records[o], z = records[o + 2], zone = land.zone(x, z);
      const back = zone.from - zone.bar, t = Math.min(1, Math.max(0, (back - 26) / 20)), share = zone.kind === 'wall' ? t * t * (3 - 2 * t) : 0;
      const lot = Math.abs(Math.sin(x * 12.9898 + z * 78.233) * 43758.5453) % 1;
      (lot < share ? slope : spruce).push(records.subarray(o, o + RECORD));
    }
  }
  const take = (list) => { const out = new Float32Array(list.length * RECORD); list.forEach((record, i) => out.set(record, i * RECORD)); return out; };
  return { spruce: take(spruce), slope: take(slope) };
}

// `hide` names plant kinds to leave out (diagnosis only: forest.html?hide=fern,sorrel).
// `birds`, if given, is the cast of checkpoint 2: that many birds in the composed scene, each where it always
// was (the tools ask for it). Without it the animals are a visit's (life/visit.js): `visit` is the seed the
// valley is drawn from (a number; without one, a new valley every time; 'busy' is the busiest there can be)
// and `hour` the hour it is when the visit begins.
// `night`: 'dark' (the default) is the night the owner asked for on 2026-11-14, darker than the one approved at
// checkpoint 1, with a lantern in the walker's hand and the lamp in the cabin's window lighting the ground
// outside it; 'approved' is the night of checkpoint 1 as it was, with neither (tools/forest_same.mjs asks for
// it, to compare the Cathedral's night frames with the approved ones). `lantern: false` leaves the lantern at home.
// `element`: what takes the walker's pointer and wheel (the canvas, on the forest's own page; in the cabin's page an
// element over it that is let through only while the visitor is outside: js/outside.js).
export function createForest(options) { return drain(growForest(options)); }
// A few milliseconds of steps to each frame the page draws in between (`budget`), until it is built. `onStep(what,
// ms)` is told of each step and how long it took.
export async function createForestSlowly(options, { budget = 8, between = nextFrame, onStep = null } = {}) {
  const steps = growForest(options);
  for (;;) {
    const until = performance.now() + budget;
    for (;;) {
      const t0 = performance.now(), { done, value } = steps.next();
      if (done) return value;
      if (onStep) onStep(value, performance.now() - t0);
      if (performance.now() >= until) break;
    }
    await between();
  }
}
function* growForest({ renderer, element = renderer.domElement, look: lookName, overrides = {}, seed = 1, hide = [], birds, visit, hour = 12, night = 'dark', lantern = true, sound: audible = true,
  guide = !(typeof window !== 'undefined' && window.__automated) }) {
  // (`guide`: the visitor's own things over the view, js/forest/hud.js, and the mouse turning the head once the view is
  // clicked, nav/trailController.js. A page a tool drives says it is one, `window.__automated`, and has neither: its
  // clicks are where it puts them and its frames have nothing laid over them.)
  if (night !== 'dark' && night !== 'approved') throw new Error(`forest: there is no night called "${night}": there is dark and approved`);
  const settings = forestSettings(overrides);
  const look = getLook(lookName);
  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(50, 1, 0.15, 420);
  const light = createLight();
  const U = light.U;
  light.applyLook(look);
  light.setNight(night === 'dark');

  const { terrain, trail, layout } = yield* layOutSteps({ seed, density: settings.density });

  // everything painted for this look, a sheet to a step (in the order they were always painted)
  const detail = settings.tier === 'high' ? 2 : 1;           // near boughs are seen from a metre away
  const sheets = {}, barks = {};
  for (const [name, paintIt] of [
    ['fir', () => paint.boughAtlasSteps('fir', look, detail)], ['hemlock', () => paint.boughAtlasSteps('hemlock', look, detail)], ['cedar', () => paint.cedarAtlasSteps(look, detail)],
    ['fern', () => paint.fernAtlas(look, detail)], ['cover', () => paint.coverAtlas(look)], ['grass', () => paint.grassAtlas(look, detail)], ['skunk', () => paint.skunkAtlas(look, detail)],
    ['maple', () => mapleAtlas(look, detail)], ['alder', () => alderAtlas(look)], ['apple', () => appleAtlas(look, detail)], ['spruce', () => spireAtlasSteps(look, SPIRES.spruce)], ['slope', () => spireAtlasSteps(look, SPIRES.slope)],
    ['shrub', () => shrubAtlas(look)], ['ladyfern', () => ladyFernAtlas(look, detail)], ['flower', () => flowerAtlas(look)]]) {
    sheets[name] = yield* stepsOf(`sheet: ${name}`, paintIt());
  }
  for (const [name, paintIt] of [['fir', () => paint.barkTextures('fir', look)], ['hemlock', () => paint.barkTextures('hemlock', look)], ['cedar', () => paint.barkTextures('cedar', look)],
    ['alder', () => alderBark(look)], ['spruce', () => spruceBark(look)]]) {
    barks[name] = yield* stepsOf(`bark: ${name}`, paintIt());
  }
  const floor = paint.groundTexture(look), tread = paint.treadTexture(look), gravel = paint.gravelTexture(look), meadow = paint.meadowTexture(look);
  yield 'ground';
  const far = yield* stepsOf('far view', backdropTexturesSteps(look));
  createNoiseTexture(U);
  // (the canvases the far view was painted on, and read back from, are of no more use: 17 MB. show=textures paints its own)
  for (const canvas of [far.canvas, far.air, far.peak && far.peak.canvas]) if (canvas) { canvas.width = 0; canvas.height = 0; }

  const make = createMaterials(U, look, { msaa: settings.msaa, prepass: settings.prepass, mossMap: floor.texture, mirror: settings.mirror });
  const conifer = (spec, moss, tone) => {
    const built = buildConifer(spec, sheets);
    return { ...built, materials: { solid: make.bark(barks[spec.bark], { moss, tone }), ...make.foliage(sheets[spec.sheet], { height: spec.height * 0.5 }) } };
  };
  const cover = (built, sheet, options) => ({ ...built, materials: make.foliage(sheet, options) });
  const wood = (built, options) => ({ ...built, materials: { solid: make.bark(barks.fir, options) } });
  // The old cedar is built for the spot the layout has it on: its record says where, and how it is turned.
  const cedar = () => {
    const [x, y, z, yaw] = layout.cedar;
    const built = buildCedar(sheets, { yaw, ground: (east, south) => terrain.surfaceAt(x + east, z + south) - y, tread: (east, south) => trail.distance(x + east, z + south) });
    return { ...built, materials: { solid: make.bark(barks.cedar, { moss: 0.45, foot: 0.3, wood: look.palette.silverWood, hollow: true }), ...make.foliage(sheets.cedar, { height: CEDAR.height * 0.5 }) } };
  };
  // (bedded stone is painted once, for the falls' rock and for whatever people have stacked)
  let stoneSheet = null;
  const rockSheet = () => (stoneSheet = stoneSheet || paint.rockTexture(look));
  // The rock of the falls is built for the spot the layout has it on.
  const crag = () => {
    const [x, y, z] = layout.crag, built = buildFallsRock({ x, y, z, terrain, trail });
    // What the layout rooted in the slope the rock stands on is rooted in the rock's ledges: left at the
    // ground's height, a fern was under the rock with its fronds through the face.
    const stands = built.standing;
    for (const name of ['fern', 'sorrel', 'seedling']) {
      const records = layout[name];
      for (let o = 0; o < records.length; o += RECORD) { const top = stands(records[o], records[o + 2]); if (top > records[o + 1]) records[o + 1] = top; }
    }
    return { ...built, materials: { solid: make.rock(rockSheet()) } };
  };
  // The footbridge above them: a hewn cedar log, its bare wood weathered grey and kept bare where it is walked on.
  const footbridge = () => ({ ...buildFootbridge(), materials: { solid: make.bark(barks.cedar, { moss: 0.55, foot: 0, wood: look.palette.hewnWood, worn: true }) } });
  // The trail shelter in the old clearing (plants/shelter.js) is built for the spot the layout has it on: its
  // footing takes up the ground's slope. It comes as two kinds, wood and stone, laid at the one spot. Its wood
  // is split cedar weathered dark, with no bark on it anywhere, and moss on whatever of it faces the sky; on
  // its roof, the moss and licorice fern of the maples' sheet.
  const shelter = layout.shelter.length ? (() => {
    const [x, y, z, yaw] = layout.shelter, cos = Math.cos(yaw), sin = Math.sin(yaw);
    return buildShelter(sheets, { ground: (lx, lz) => terrain.surfaceAt(x + lx * cos + lz * sin, z - lx * sin + lz * cos) - y });
  })() : null;
  // The cabin, from outside (plants/cabin.js), built for the spot the layout has it on: its footing takes up the
  // ground, and its floor is where the box that stood in for it had its own, so that its window is where the
  // window's vantage is. It comes as three kinds laid at the one spot: hewn timbers (no bark on them, and little
  // moss: the roof keeps the rain off), split shakes gone to moss, and stone.
  const cabin = layout.cabin.length ? (() => {
    const [x, y, z, yaw] = layout.cabin;
    if (yaw !== 0 || Math.abs(x - CABIN_SITE.x) > 1e-3 || Math.abs(z - CABIN_SITE.z) > 1e-3) {
      throw new Error(`forest: the cabin is laid at x=${x}, z=${z}, turned ${yaw}; its window is on the valley's axis only at x=${CABIN_SITE.x}, z=${CABIN_SITE.z}, unturned (scenes/walk.js)`);
    }
    return buildCabin(sheets, { ground: (lx, lz) => terrain.surfaceAt(x + lx, z + lz) - y, floor: cabinFloor(terrain) - y, tread: (lx, lz) => trail.distance(x + lx, z + lz) });
  })() : null;
  yield 'shelter and cabin';
  // The maples of the hall: one tree, turned a different way wherever it stands. Its bark is wrapped in moss
  // as far up as its limbs are thick, and its leaves are thin: the light comes through them.
  const maple = () => ({ ...buildMaple(sheets), materials: { solid: make.bark(barks.hemlock, { moss: 0.9, foot: 1, tone: [0.92, 0.96, 1.0], wrapped: true }),
    ...make.foliage(sheets.maple, { height: MAPLE.height * 0.45, thin: MAPLE.heart }) } });
  // The old apple tree of the clearing (plants/apple.js): thin reddish-grey bark (the hemlock's sheet, toned, at
  // half its size), mossy wherever it faces the sky, its dead limb bare and silver; leaves as thin as a maple's,
  // and among them blossom, which is not lit through from underneath and is kept from glaring by night.
  const apple = () => ({ ...buildApple(sheets), materials: { solid: make.bark(barks.hemlock, { moss: 0.55, foot: 0.45, tone: [1.14, 0.97, 0.9], wood: look.palette.silverWood }),
    ...make.foliage(sheets.apple, { height: APPLE.height * 0.5, thin: APPLE.heart, blossom: 0.75, sooner: true }) } });
  // The riverside (plants/alder.js). Red alder: a pale trunk under its crusts of lichen, with a little moss at its
  // foot, and leaves as thin as a maple's. Willow: smooth olive stems (the hemlock's bark, toned), and narrow
  // leaves with pale backs.
  const alder = () => ({ ...buildAlder(sheets), materials: { solid: make.bark(barks.alder, { moss: 0.3, foot: 1, night: 0.65 }),
    ...make.foliage(sheets.alder, { height: ALDER.height * 0.5, thin: ALDER.heart, axis: true }) } });
  const willow = () => ({ ...buildWillow(sheets), materials: { solid: make.bark(barks.hemlock, { moss: 0, foot: 0, tone: [1.15, 1.2, 0.7] }),
    ...make.foliage(sheets.alder, { height: WILLOW.height * 0.6, thin: WILLOW.heart }) } });
  // The valley's own conifers (plants/spire.js): Sitka spruce by the river and on the hill, western hemlock on
  // the valley's slopes. Each is its trunk, its limbs and their boughs, and its whole crown painted on two cards
  // through the trunk, which are drawn in as they turn edge-on and lit as the side of a cone (`axis`).
  const spire = (spec, sheet, bark, options) => ({ ...buildSpire(spec, sheet),
    materials: { solid: make.bark(bark, options), ...make.foliage(sheet, { height: spec.height * 0.5, axis: spec.heart }) } });
  const stands = valleyConifers([layout.spruce, layout.slopes], terrain.land);
  // Every kind, built and given its materials, a kind to a step, in the order they were always built (the order is
  // the order of `plants`, which is the order the instancer's meshes are made in).
  const plants = {};
  const BUILT = [
    ['giant', () => conifer(CONIFERS.firGiant, 0.55)],
    ['mature', () => conifer(CONIFERS.hemlock, 0.4)],
    ['pole', () => conifer(CONIFERS.hemlockPole, 0.3)],
    ['sapling', () => conifer(CONIFERS.hemlockSapling, 0.1, [0.8, 0.76, 0.78])],
    ['spruce', () => spire(SPIRES.spruce, sheets.spruce, barks.spruce, { moss: 0.3, foot: 0.7, night: 0.5 })],      // its bark is pale: by night, as the alder's
    ['slope', () => spire(SPIRES.slope, sheets.slope, barks.hemlock, { moss: 0.3, tone: [0.92, 0.9, 1.0] })],
    ['snag', () => wood(buildSnag(), { moss: 0.35, tone: [1.25, 1.2, 1.15] })],
    ['fern', () => cover(buildFern(sheets), sheets.fern, { glow: look.shade.glow * 1.3, height: 0.5 })],
    ['sorrel', () => cover(buildSorrel(sheets), sheets.cover, { glow: look.shade.glow, height: 0.1 })],
    ['seedling', () => cover(buildSeedling(sheets), sheets.cover, { height: 0.3 })],
    ['grass', () => cover(buildGrass(sheets), sheets.grass, { glow: look.shade.glow * 1.5, height: 0.45 })],
    ['log', () => wood(buildLog(), { moss: 0.62, foot: 0 })],
    ['stump', () => wood(buildStump(), { moss: 0.8, foot: 0.4 })],
    ['cobble', () => ({ ...buildCobbles(), materials: make.stone(gravel) })],
    ['rock', () => ({ ...buildRocks(), materials: make.stone(gravel) })],
    ['cedar', layout.cedar.length && cedar],
    ['crag', layout.crag.length && crag],
    ['footbridge', layout.footbridge.length && footbridge],
    ['shelter', shelter && (() => ({ ...shelter.wood, materials: { solid: make.bark(barks.cedar, { moss: 0.6, foot: 0, wood: look.palette.shakeWood, bare: true }),
      ...make.foliage(sheets.maple, { height: 1.6, thin: SHELTER.heart }) } }))],
    ['footing', shelter && layout.footing.length && (() => ({ ...shelter.footing, materials: { solid: make.rock(rockSheet(), { moss: 0.5 }) } }))],
    ['cabin', cabin && (() => ({ ...cabin.wood, materials: { solid: make.bark(barks.cedar, { moss: 0.3, foot: 0, wood: look.palette.cabinWood, bare: true }) } }))],
    ['cabinroof', cabin && layout.cabinroof.length && (() => ({ ...cabin.roof, materials: { solid: make.bark(barks.cedar, { moss: 0.6, foot: 0, wood: look.palette.shakeWood, bare: true }),
      ...make.foliage(sheets.maple, { height: 3.5, thin: CABIN.heart }) } }))],
    ['cabinstone', cabin && layout.cabinstone.length && (() => ({ ...cabin.stone, materials: { solid: make.rock(rockSheet(), { moss: 0.4, tone: [1.5, 1.42, 1.28] }) } }))],
    ['maple', layout.maple.length && maple],
    ['apple', layout.apple.length && apple],
    // vine maple under them: smooth green stems, and leaves as thin as the big maples'
    ['vine', layout.vine.length && (() => ({ ...buildVineMaple(sheets), materials: { solid: make.bark(barks.hemlock, { moss: 0.5, foot: 0.6, tone: [0.85, 1.3, 0.6] }),
      ...make.foliage(sheets.maple, { height: VINE.height * 0.6, thin: VINE.heart }) } }))],
    ['skunk', () => cover(buildSkunkCabbage(sheets), sheets.skunk, { glow: look.shade.glow * 1.3, height: 0.8 })],
    // driftwood on the bars: no bark, no moss, weathered pale
    ['drift', layout.drift.length && (() => ({ ...buildDrift(), materials: { solid: make.bark(barks.cedar, { moss: 0, foot: 0, wood: look.palette.driftWood, bare: true }) } }))],
    ['alder', layout.alder.length && alder],
    ['willow', layout.willow.length && willow],
    // The shrubs (plants/shrubs.js): leaves on cards, their stems painted on them; thin leaves, and where a sheet
    // has flowers among them, petals that are not lit through and are kept from glaring by night (as the apple's).
    ['salmon', () => cover(buildSalmonberry(sheets), sheets.shrub, { height: SALMON.height * 0.7, thin: SALMON.heart, blossom: 0.75 })],
    ['elder', () => cover(buildElder(sheets), sheets.shrub, { height: ELDER.height * 0.7, thin: ELDER.heart, blossom: 0.75 })],
    ['club', () => cover(buildDevilsClub(sheets), sheets.shrub, { height: CLUB.height * 0.8, thin: CLUB.heart })],
    ['huckle', () => cover(buildHuckleberry(sheets), sheets.shrub, { height: HUCKLE.height * 0.8, thin: HUCKLE.heart })],
    // bracken, and lady fern (the sword fern's builder, with fronds of its own): lit as the ferns are
    ['bracken', () => cover(buildBracken(sheets), sheets.shrub, { glow: look.shade.glow * 1.3, height: 0.8 })],
    ['ladyfern', () => cover({ ...buildFern({ fern: sheets.ladyfern }), max: 40, gone: 64 }, sheets.ladyfern, { glow: look.shade.glow * 1.4, height: 0.5 })],
    // The small things (plants/flowers.js), all on one sheet: flowers of the forest floor, what grows on dead
    // wood, and a lichen that hangs from limbs. Several are one kind, a column of the sheet to each (`variants`);
    // what is not green on them keeps a share of its lightness by night (`petal`), and the lichen all of it (`dim`).
    ['carpet', () => cover(buildCarpet(sheets), sheets.flower, { height: CARPET.height, variants: sheets.flower.carpet.variants, petal: 0.7 })],
    ['trillium', () => cover(buildTrillium(sheets), sheets.flower, { height: 0.3, variants: sheets.flower.trillium.variants, petal: 0.7 })],
    ['fungus', () => cover(buildFungus(sheets), sheets.flower, { glow: 0, height: FUNGUS.height, variants: sheets.flower.fungus.variants, petal: 0.7 })],
    // (it hangs under its own origin, which is where it is fast to the limb: its lower end is the one in the light)
    ['beard', () => cover(buildBeard(sheets), sheets.flower, { glow: look.shade.glow * 1.5, height: -BEARD.length, dim: 0.62 })],
  ];
  for (const [name, build] of BUILT) {
    if (!build) continue;
    plants[name] = build();
    yield `plant: ${name}`;
  }
  // (a kind the layout keeps out of the approved frames by how far off it is drawn has to be drawn no further than the layout was told)
  for (const kind of UNDER_KINDS) if (plants[kind.name].gone !== kind.gone) throw new Error(`forest: ${kind.name} is drawn to ${plants[kind.name].gone} m and the layout was told ${kind.gone} m (world/layout.js UNDER_KINDS)`);

  // What stands on dead wood, where the layout's own passes cannot put it: its place is read from the wood as
  // built (life/perch.js). Red huckleberry on the tops of stumps and along logs, out of the elk's reach: on
  // about half the stumps within 24 m of the walk, and at each of two places along a log there one time in
  // three, by a number made from where each stands (no random number is drawn), and never where it could show
  // in a frame approved at checkpoint 1. None on the two small hardwoods a scene has laid for the fungi
  // (scenes/walk.js `fungi`): a huckleberry roots in a rotting conifer, not in a limb a hand thick, and one as
  // tall as a walker stood on the maple's fallen limb among the turkey tails (a review asked; the page said).
  const hardwood = (() => {
    const here = new THREE.Vector3(), to = new THREE.Vector3();
    return (walk.fungi || []).map(({ s, side, grows }) => {
      const [name, more] = s.split(/([+-].*)/);
      trail.sample(trail.at[name] + Number(more || 0), here, to);
      return { x: here.x - to.z * side, z: here.z + to.x * side, grows };
    });
  })();
  const riders = { huckle: [] };
  {
    const lot = (x, z, k) => Math.abs(Math.sin(x * 12.9898 + z * 78.233 + k * 37.719) * 43758.5453) % 1;
    const spot = { point: new THREE.Vector3(), normal: new THREE.Vector3(), up: new THREE.Vector3() }, best = new THREE.Vector3();
    // the highest point round a ring of a lying or standing trunk, `along` rings from its root
    const crest = (place, tube, along) => {
      best.set(0, -Infinity, 0);
      for (let k = 0; k < 12; k += 1) { onTube(place, tube, along, k / 12, spot); if (spot.point.y > best.y) best.copy(spot.point); }
      return best;
    };
    for (const [name, share, rings] of [['stump', 0.5, [0.86]], ['log', 0.34, [0.3, 0.62]]]) {
      const records = layout[name], perch = plants[name].solid.perch;
      for (let i = 0; i < records.length / RECORD; i += 1) {
        const o = i * RECORD, x = records[o], z = records[o + 2];
        if (trail.distance(x, z) > 24 || layout.approved(x, z, HUCKLE.gone)) continue;
        if (name === 'log' && hardwood.some((h) => Math.hypot(h.x - x, h.z - z) < 0.2)) continue;
        const place = standing(perch, records, i);
        rings.forEach((share2, k) => {
          if (lot(x, z, k) > share) return;
          const at = crest(place, perch.trunk, share2 * (perch.trunk.rings - 1));
          // (on a stump, down inside the ring of splinters at its top; on a log, on its back)
          riders.huckle.push([at.x, at.y - (name === 'stump' ? 0.3 : 0.06) * records[o + 4], at.z, lot(x, z, k + 5) * 6.283, 0.62 + 0.5 * lot(x, z, k + 9), lot(x, z, k + 2) * 6.283, lot(x, z, k + 3), 0]);
        });
      }
    }
  }
  // What grows on dead wood, and on the wounds of old maples (plants/flowers.js; which of the four a record is,
  // is its tint). Red-belted conks, 20 to 35 cm across, on the snags, on two stumps in five and on the flanks of
  // one log in three, within 22 m of the walk; an artist's conk, 39 to 54 cm, low on every other maple; oyster
  // mushrooms and turkey tails in clusters on the two small hardwoods a scene has laid for them. Each is set on
  // the wood as built, on the side a walker sees it from, and never where it could show in a frame approved at
  // checkpoint 1.
  riders.fungus = [];
  {
    const lot = (x, z, k) => Math.abs(Math.sin(x * 12.9898 + z * 78.233 + k * 37.719) * 43758.5453) % 1;
    const spot = { point: new THREE.Vector3(), normal: new THREE.Vector3(), up: new THREE.Vector3() }, here = new THREE.Vector3(), to = new THREE.Vector3();
    // (out of the wood is a fungus's own +x: its yaw turns that to the bark's normal, taken level)
    const put = (variant, size, number) => riders.fungus.push([spot.point.x, spot.point.y - FUNGUS.lift * size, spot.point.z, Math.atan2(-spot.normal.z, spot.normal.x), size, 0, (variant + 0.15 + 0.7 * number) / 4, 0]);
    // the way to the walk from a spot, level
    const toWalk = (x, z) => { trail.sample(trail.locate(x, z)[1], here); return to.set(here.x - x, 0, here.z - z).normalize(); };
    // the turn round a standing trunk, at a height, whose bark faces the walk: by the plant's own number, from
    // a quarter towards it (the shelf seen from beside, standing out of the trunk) to nearly full on
    const facing = (place, height, x, z, number) => {
      let best = 0, score = -Infinity; toWalk(x, z);
      const want = 0.25 + 0.7 * number;
      for (let k = 0; k < 16; k += 1) { onTrunk(place, height, k / 16, spot); const d = spot.normal.x * to.x + spot.normal.z * to.z, s = -Math.abs(d - want) + 0.1 * (((k * 0.618 + number) % 1) - 0.5); if (s > score) { score = s; best = k / 16; } }
      return onTrunk(place, height, best, spot);
    };
    for (const [name, share, most] of [['snag', 1, 3], ['stump', 0.4, 2]]) {
      const records = layout[name], perch = plants[name].solid.perch;
      for (let i = 0; i < records.length / RECORD; i += 1) {
        const o = i * RECORD, x = records[o], z = records[o + 2];
        if (trail.distance(x, z) > 22 || layout.approved(x, z, FUNGUS.gone) || lot(x, z, 11) > share) continue;
        const place = standing(perch, records, i), top = place.heights[place.heights.length - 1];
        for (let k = 0; k < most; k += 1) {
          if (k > 0 && lot(x, z, 12 + k) < 0.35) continue;
          const height = name === 'snag' ? 0.9 + 1.3 * k + 0.8 * lot(x, z, 20 + k) : top * (0.35 + 0.3 * k + 0.1 * lot(x, z, 20 + k));
          if (height > top * 0.8) continue;
          facing(place, height, x, z, lot(x, z, 30 + k));
          put(0, 0.7 + 0.45 * lot(x, z, 40 + k), lot(x, z, 50 + k));
        }
      }
    }
    {
      // a log's flank: of the turns round it at a place along it, the one whose bark is towards the walk and
      // tilted up by `tilt` (0.25: its side; 0.6: its shoulder)
      const records = layout.log, perch = plants.log.solid.perch, last = perch.trunk.rings - 1;
      const flank = (place, ring, tilt) => {
        onTube(place, perch.trunk, ring, 0, spot); toWalk(spot.point.x, spot.point.z);
        let best = 0, score = -Infinity;
        for (let t = 0; t < 24; t += 1) { onTube(place, perch.trunk, ring, t / 24, spot); const s = spot.normal.x * to.x + spot.normal.z * to.z - 1.5 * Math.abs(spot.normal.y - tilt); if (s > score) { score = s; best = t / 24; } }
        return best;
      };
      // (the two small hardwoods a scene has laid for it are `hardwood`, above)
      for (let i = 0; i < records.length / RECORD; i += 1) {
        const o = i * RECORD, x = records[o], z = records[o + 2], scale = records[o + 4];
        const own = hardwood.find((h) => Math.hypot(h.x - x, h.z - z) < 0.2);
        if (own) {
          // Clusters, each cap or bracket a plant of its own, one over another like shingles. Oyster mushrooms: four
          // clusters of five to seven caps along the flank. Turkey tails: nine rows of six to nine small brackets
          // along its shoulder.
          const place = standing(perch, records, i), oyster = own.grows === 2;
          const metre = (16 * scale) / last;                                          // (a log is 16 m long at scale 1: one ring's share of it)
          const groups = oyster ? [0.2, 0.4, 0.57, 0.78] : [0.14, 0.22, 0.31, 0.4, 0.48, 0.57, 0.66, 0.75, 0.84];
          groups.forEach((along, g) => {
            const middle = along * last + (lot(x, z, 100 + g) - 0.5) * 0.6, turn = flank(place, middle, oyster ? 0.2 + 0.3 * lot(x, z, 110 + g) : 0.45 + 0.4 * lot(x, z, 110 + g));
            const caps = oyster ? 5 + Math.floor(3 * lot(x, z, 120 + g)) : 6 + Math.floor(4 * lot(x, z, 120 + g));
            for (let c = 0; c < caps; c += 1) {
              const n = lot(x, z, 130 + g * 10 + c), m = lot(x, z, 230 + g * 10 + c);
              const size = oyster ? 0.32 + 0.4 * n : 0.15 + 0.14 * n, spread = oyster ? 0.34 : 0.3;
              onTube(place, perch.trunk, Math.min(last, Math.max(0, middle + ((c + 0.5) / caps - 0.5 + 0.12 * (m - 0.5)) * spread / metre)), turn + (((c * 0.618) % 1) - 0.5) * (oyster ? 0.1 : 0.07), spot);
              put(own.grows, size, m);
            }
          });
          continue;
        }
        if (trail.distance(x, z) > 22 || layout.approved(x, z, FUNGUS.gone) || lot(x, z, 61) > 0.34) continue;
        const place = standing(perch, records, i);
        for (const [k, along] of [[0, 0.22], [1, 0.47], [2, 0.7]]) {
          if (lot(x, z, 62 + k) < 0.3) continue;
          const ring = along * last;
          onTube(place, perch.trunk, ring, flank(place, ring, 0.25), spot);
          put(0, 0.65 + 0.45 * lot(x, z, 70 + k), lot(x, z, 80 + k));
        }
      }
    }
    if (plants.maple) {
      // A maple hands over no reading of its trunk: where its bark is, at a height and on a bearing in the tree's
      // own frame, is read here from its wood as built (the vertices within a hand of that height and bearing).
      const wood = plants.maple.solid[0].attributes.position;
      const barkAt = (h, b) => {
        let far = 0;
        for (let i = 0; i < wood.count; i += 1) {
          if (Math.abs(wood.getY(i) - h) > 0.3) continue;
          const px = wood.getX(i), pz = wood.getZ(i), d = Math.hypot(px, pz);
          if (d > 1.7) continue;
          let turn = Math.atan2(pz, px) - b; turn = Math.atan2(Math.sin(turn), Math.cos(turn));
          if (Math.abs(turn) < 0.3) far = Math.max(far, d * Math.cos(turn));
        }
        return far;
      };
      const records = layout.maple;
      for (let i = 0; i < records.length / RECORD; i += 2) {
        const o = i * RECORD, x = records[o], y = records[o + 1], z = records[o + 2], yaw = records[o + 3], scale = records[o + 4];
        toWalk(x, z);
        // (towards the walk, a little to one side of it by the tree's own number, low on the trunk, where a walker
        // looks down onto it; then into the tree's frame)
        const out = Math.atan2(to.z, to.x) + (lot(x, z, 91) < 0.5 ? -1 : 1) * (0.2 + 0.4 * lot(x, z, 95)), b = out + yaw, h = 0.55 + 0.5 * lot(x, z, 92), far = barkAt(h, b);
        if (far < 0.3) continue;
        spot.point.set(x + Math.cos(out) * far * scale, y + h * scale, z + Math.sin(out) * far * scale); spot.normal.set(Math.cos(out), 0, Math.sin(out));
        put(1, 1.3 + 0.5 * lot(x, z, 93), lot(x, z, 94));
      }
    }
  }
  // Methuselah's beard, hanging from the limbs of every kind that offers places for it and says how readily it
  // takes it (`hang` and `lichen`: plants/build.js), where the walk comes within 46 m of a tree: at that share of
  // the tree's places (0.6 for the valley's spruces), by a number made from where each is; 0.9 to 3.1 m long, most
  // of them short.
  riders.beard = [];
  const lot = (x, z, k) => Math.abs(Math.sin(x * 12.9898 + z * 78.233 + k * 37.719) * 43758.5453) % 1;
  for (const name of Object.keys(plants)) {
    const plant = plants[name], records = plant.hang && plant.lichen > 0 && (stands[name] || layout[name]);
    if (!records) continue;
    for (let o = 0; o < records.length; o += RECORD) {
      const x = records[o], y = records[o + 1], z = records[o + 2], yaw = records[o + 3], scale = records[o + 4], cos = Math.cos(yaw), sin = Math.sin(yaw);
      if (scale < 0.5 || trail.distance(x, z) > 46 || layout.approved(x, z, BEARD.gone)) continue;
      plant.hang.forEach(([lx, ly, lz], k) => {
        if (lot(x, z, k) > plant.lichen) return;
        riders.beard.push([x + (lx * cos + lz * sin) * scale, y + (ly - 0.06) * scale, z + (-lx * sin + lz * cos) * scale, lot(x, z, k + 0.3) * 6.283, 0.45 + 1.1 * Math.pow(lot(x, z, k + 0.6), 1.5), lot(x, z, k + 0.2) * 6.283, lot(x, z, k + 0.8), 0]);
      });
    }
  }
  for (const name of Object.keys(riders)) riders[name] = new Float32Array(riders[name].flat());
  yield 'riders';
  // (a name that is no kind hides nothing, and what is then measured is the whole forest under that name)
  for (const name of hide) if (!(name in plants)) throw new Error(`forest: hide=${name} names no plant kind (the kinds: ${Object.keys(plants).join(', ')})`);

  createCanopyMap(U, [...[['giant', CONIFERS.firGiant], ['mature', CONIFERS.hemlock], ['pole', CONIFERS.hemlockPole], ['sapling', CONIFERS.hemlockSapling]]
    .map(([name, spec]) => ({ records: layout[name], terrace: layout.crowns[name], radius: spec.spread(0), weight: spec.crownWeight })),
    // (the valley's conifers, both kinds together, as the spruce that stood in for them was drawn)
    { records: layout.spruce, terrace: layout.crowns.spruce, radius: SPIRES.spruce.crownRadius, weight: SPIRES.spruce.crownWeight },
    // (and the ones laid since on the walls: none of them stood in the old world, and none stands on the terrace)
    { records: layout.slopes, terrace: new Float32Array(0), radius: SPIRES.spruce.crownRadius, weight: SPIRES.spruce.crownWeight },
    { records: layout.cedar, terrace: layout.crowns.cedar, radius: CEDAR.crown, weight: CEDAR.crownWeight },
    { records: layout.maple, terrace: layout.crowns.maple, radius: MAPLE.crown, weight: MAPLE.crownWeight },
    // (no alder stood in the old world, and none stands on the terrace: over the terrace the map is as it was)
    { records: layout.alder, terrace: new Float32Array(0), radius: ALDER.crown, weight: ALDER.crownWeight }]);
  yield 'canopy map';
  const sunMap = createSunMap(U, settings.sunMap);
  const casterMaterial = new THREE.MeshBasicMaterial({ colorWrite: false });

  const trailMap = createTrailMap(trail);
  const ground = new THREE.Mesh(terrain.geometry, make.ground(floor, tread, trailMap, gravel, meadow));
  ground.renderOrder = 8;           // after the foliage: ferns and sorrel hide most of the floor, and a hidden pixel is then never shaded
  ground.matrixAutoUpdate = false;
  ground.layers.enable(SOLID_LAYER);
  scene.add(ground);
  yield 'ground and trail map';

  // The river and the creek. They are laid over the ground they run on, which shows through them where they
  // are thin, so they are drawn after it and after the shadows the stones throw on it (order 9: a shadow on
  // the bed is then seen through the water, and is not cut off at the water's edge). A ripple of the river's
  // is a few metres long and half a metre across; the creek's are a hand's breadth.
  const conifers = (records, spec) => ({ records, height: spec.height, radius: spec.spread(0), shape: 'spire', leaf: 0 });
  const banks = banksMap(terrain, [conifers(layout.giant, CONIFERS.firGiant), conifers(layout.mature, CONIFERS.hemlock), conifers(layout.pole, CONIFERS.hemlockPole),
    conifers(layout.sapling, CONIFERS.hemlockSapling), conifers(stands.spruce, SPIRES.spruce), conifers(stands.slope, SPIRES.slope),
    { records: layout.cedar, height: CEDAR.height, radius: CEDAR.crown, shape: 'spire', leaf: 0 },
    { records: layout.maple, height: MAPLE.height, radius: MAPLE.crown, shape: 'dome', leaf: 0.8 },
    { records: layout.alder, height: ALDER.height, radius: ALDER.crown, shape: 'dome', leaf: 1 },
    { records: layout.willow, height: WILLOW.height, radius: 2.6, shape: 'dome', leaf: 1 }]);
  yield 'banks';
  const waters = [
    new THREE.Mesh(buildRiver(terrain), make.water(look.palette.river, { grain: [0.028, 0.13], clear: 0.5, banks, bed: [SHAPE.HALF, SHAPE.BED], mirrored: look.palette.mirrored })),
    new THREE.Mesh(buildCreek(terrain), make.water(look.palette.creek, { grain: [0.24, 1.1], clear: 1.6, wet: 0.5, sheen: 0.6, ragged: 0.55, woods: 1 }))];
  for (const water of waters) {
    water.renderOrder = 9.5;
    water.matrixAutoUpdate = false;
    water.layers.enable(SOLID_LAYER);
    scene.add(water);
  }

  yield 'water';
  // foliage draws nearest kinds first: the ones that grow at the walker's feet, then up into the crowns
  // (the slopes' hemlocks last: none stands nearer a walker than the far bank, and every other kind keeps its place)
  const ORDER = ['fern', 'ladyfern', 'skunk', 'bracken', 'club', 'sapling', 'sorrel', 'carpet', 'trillium', 'seedling', 'fungus', 'salmon', 'huckle', 'willow', 'vine', 'elder', 'apple', 'pole', 'alder', 'mature', 'giant', 'spruce', 'beard', 'cedar', 'maple', 'slope'];
  const sets = [];
  for (const [name, plant] of Object.entries(plants)) {
    const records = stands[name] || riders[name] || layout[name];
    if (!records || !records.length || hide.includes(name)) continue;
    sets.push(new InstanceSet({ archetype: { name, order: Math.max(0, ORDER.indexOf(name)), ...plant }, records, materials: plant.materials, scene, hand: settings.hand, tail: settings.tail,
      slope: plant.lies ? terrain.slopeAt : null }));
    // Shadows are cast by what stands in the old world's box, which is all the sun's map covers. A trunk beyond
    // it, up-valley and towards the sun, would otherwise lay the shadow of its top across the old terrace.
    if (plant.solid && name !== 'sapling' && plant.casts !== false) scene.add(buildCasters(plant, inOldWorld(records), casterMaterial));       // a stone carries its own shadow
    yield `set: ${name}`;
  }

  // what is left of the stand-ins: the light in the cabin's window, and the stones the creek is crossed on
  const built = buildStructures({ terrain, trail, look });
  const structures = new THREE.Mesh(built.geometry, make.plain());
  structures.matrixAutoUpdate = false;
  structures.layers.enable(SOLID_LAYER);
  scene.add(structures);

  // The walker's lantern (world/lantern.js), drawn only while it is lit. It hangs from the hand, which is low at
  // the walker's right side and a little ahead, and turns with the walker but not with a look up or down: looking
  // level its glass is at the foot of the frame, and a look down shows the whole of it.
  const lamp = new THREE.Mesh(buildLantern(look), structures.material);
  lamp.matrixAutoUpdate = false;
  lamp.frustumCulled = false;
  lamp.visible = false;
  lamp.layers.enable(SOLID_LAYER);
  scene.add(lamp);
  const HAND = { ahead: 0.74, right: 0.33, below: 0.16 };          // where the hand is from the eye, in metres: the lantern hangs under it
  const flame = new THREE.Vector3(), hand = new THREE.Vector3(), ahead = new THREE.Vector3(), swing = new THREE.Quaternion(), turn = new THREE.Quaternion(), UP = new THREE.Vector3(0, 1, 0);
  const pane = built.places.pane ? { at: new THREE.Vector3(...built.places.pane), facing: new THREE.Vector3(0, 0, -1) } : null;
  let stride = 0, striding = 0;

  const sky = new THREE.Mesh(new THREE.IcosahedronGeometry(1, 3), make.sky);
  sky.frustumCulled = false;
  sky.renderOrder = 10;
  scene.add(sky);
  // the valley's walls and the mountain, painted on a band of the sky over the valley's side of the world
  const backdrop = new THREE.Mesh(backdropBand(), make.backdrop(far));
  backdrop.frustumCulled = false;
  backdrop.renderOrder = 11;
  scene.add(backdrop);

  const post = createPost(renderer, U, settings);
  post.applyLook(look);
  const nav = createTrailController({ trail, camera, element, lock: guide });
  const governor = createGovernor({ minScale: settings.minScale, onScale: (s) => post.setScale(s) });
  const life = yield* growLife({ scene, camera, nav, U, look, settings, terrain, trail, layout, plants, post, element, records: (name) => stands[name] || layout[name],
    sceneRange: [cathedral.from, cathedral.to], count: birds, visit: visit === 'busy' ? 1 : visit ?? 1 + Math.floor(Math.random() * 999999), busy: visit === 'busy', hour, frameStats: () => stats() });
  // (the forest's sound begins at the visitor's first click or key: sound/index.js)
  const hud = createHud({ element, camera, nav, guide });
  const sound = audible ? createSound({ heard: hud.voice }) : null;
  const frustum = new THREE.Frustum(), viewProjection = new THREE.Matrix4(), walker = new THREE.Vector3();
  const REFERENCE = Math.tan(THREE.MathUtils.degToRad(25));
  const last = { calls: 0, triangles: 0, sunMapRedrawn: false, packMs: 0, drawMs: 0 };
  let governed = overrides.governor !== false;
  // The pop check (dev.js) chooses detail as if the walker stood somewhere else while the camera stays
  // put. What differs between two such frames is what would pop over that stretch of walking, and
  // nothing else: the view has not moved.
  let measuredFrom = null;
  // The close-up check compares whole visible cells with per-plant culling at the same camera pose.
  let eachPlant = true;
  // Plant motion is in the shader. Only the view and detail-selection inputs affect these buffers.
  const packedProjection = new THREE.Matrix4(), packedEye = new THREE.Vector3();
  let packedScale, packedZoom, packedEach, packedHide = '';

  // Call after renderer.setSize: the render targets take their size from the drawing buffer.
  function setSize(width, height) {
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    post.resize();
  }

  // `view`: the camera, given from outside, for this frame (js/outside.js: the cabin's own eye, put into the forest,
  // seeing through the cabin's window): { position, quaternion, fov, aspect, offset }; `offset`, if given, is the part
  // of that view to draw ([full width, full height, x, y, width, height], as three's setViewOffset takes it), and the
  // render chain is then to be the size of that part (post.resize). It is set after the animals have
  // moved, since a close-up's lens is theirs to set, and before anything is culled.
  // `into`: a render target to draw the frame into, as light (post.js), in place of the finished picture on the canvas.
  // `hide`: kinds left out of the camera's picture for this frame (still in the sun's map): the window's picture
  // leaves out the forest's own cabin, whose walls the room's walls are.
  function frame(t, dt, cfg, { view = null, into = null, hide = null } = {}) {
    // how open the air is where the walker stands: the mist and the sky's light follow it
    if (nav.state.free) walker.copy(nav.state.free); else trail.sample(nav.state.auto ? nav.state.auto.s : nav.state.s, walker);
    const day = light.applyTime(cfg, t, Math.max(terrain.land.open(walker.x, walker.z), (nav.state.free && nav.state.free.open) || 0));
    post.applyTime(day, light.U.uOpen.value);
    backdrop.material.uniforms.uDay.value = day;
    nav.update(dt);
    // The night's lights. The lantern is carried wherever the walker walks, and not at a vantage that is no
    // place on the trail (the cabin's window). It hangs from the hand and swings a little as the walker
    // steps; its flame is where its light comes from. (Its place is taken here, from the walker's own view,
    // before a close-up turns and narrows that: through a long lens the light stays where the walker holds it.)
    const carried = lantern && !nav.state.free;
    if (carried && day < 1) {
      camera.updateMatrixWorld();
      camera.getWorldDirection(ahead);
      // The hand goes down with a look down, and keeps its height for a look up. (Held at the chest whatever the
      // look, the lantern rose into the middle of a view that looked down: in the gallery's night frame of the
      // falls from the rim it hung in front of the lip. As it is, it keeps its place low in the view, and whoever
      // looks down at their feet has it at their hip.)
      const bow = Math.max(0, -Math.asin(Math.max(-1, Math.min(1, ahead.y))));
      ahead.setY(0).normalize();
      // It swings to the walker's steps, and steps come faster at a run, though not in proportion: a walk of
      // 3.2 m/s is 2.3 steps a second and a run of 7 is 3.2. (Swung once for every 2.4 m walked, as it was when a
      // walk was 1.4 m/s, it would flail at a run.) A swing from side to side is two steps.
      const pace = Math.abs(nav.state.speed);
      stride += dt * Math.PI * Math.min(3.2, 1.3 + 0.32 * pace);
      // (as wide as it goes from 1.2 m/s, and a quarter wider again at a run)
      striding += (Math.min(1, pace / 1.2) * (1 + 0.25 * Math.min(1, Math.max(0, (pace - 4) / 3))) - striding) * (1 - Math.exp(-dt * 3));
      const sway = 0.035 * Math.sin(t * 1.3) + striding * 0.11 * Math.sin(stride), nod = striding * 0.06 * Math.sin(stride * 2 + 0.7);
      const reach = HAND.ahead * Math.cos(bow) - HAND.below * Math.sin(bow), drop = HAND.ahead * Math.sin(bow) + HAND.below * Math.cos(bow);
      hand.copy(camera.position).addScaledVector(ahead, reach).addScaledVector(UP, -drop + striding * 0.012 * Math.sin(stride * 2));
      hand.x += -ahead.z * HAND.right; hand.z += ahead.x * HAND.right;
      // it swings from the hand: about the way the walker faces (side to side) and a little about the axis across
      // it. (Its bail arches from side to side: the lantern's own +x is the walker's right.)
      turn.setFromAxisAngle(UP, Math.atan2(-ahead.x, -ahead.z));
      swing.setFromAxisAngle(ahead, sway).multiply(turn);
      swing.premultiply(turn.setFromAxisAngle(flame.set(-ahead.z, 0, ahead.x), nod));
      flame.set(0, -LANTERN.top, 0).applyQuaternion(swing).add(hand);
      lamp.matrix.compose(flame, swing, lamp.scale);
      lamp.matrixWorldNeedsUpdate = true;
    }
    const lit = light.setLamps(carried ? flame : null, pane, 1 - day, 1 + 0.045 * Math.sin(t * 9.7) + 0.03 * Math.sin(t * 23.3 + 1.1));
    // the animals move, and a close-up turns and narrows the view, before anything is culled (a view given from
    // outside is no close-up's: one still easing out is let go at once, its near plane, its blur and its mist with it)
    life.update(dt, cfg, day, !!view);
    if (sound) sound.frame(dt, { camera, x: walker.x, z: walker.z, open: light.U.uOpen.value, t, voices: life.visit ? life.visit.voices : null });
    if (!view) hud.frame({ hovering: life.hovering, focused: life.focused >= 0 });
    lamp.visible = carried && lit > 0 && camera.fov > 44;                            // not through a close-up's long lens
    if (view) {
      camera.position.copy(view.position); camera.quaternion.copy(view.quaternion);
      const o = view.offset, v = camera.view, on = !!(v && v.enabled);
      const moved = o ? !on || v.fullWidth !== o[0] || v.fullHeight !== o[1] || v.offsetX !== o[2] || v.offsetY !== o[3] || v.width !== o[4] || v.height !== o[5] : on;
      if (moved || camera.fov !== view.fov || camera.aspect !== view.aspect) {
        camera.fov = view.fov; camera.aspect = view.aspect;
        if (o) camera.setViewOffset(o[0], o[1], o[2], o[3], o[4], o[5]); else camera.clearViewOffset();
        camera.updateProjectionMatrix();
      }
      camera.updateMatrixWorld();
    } else if (camera.view && camera.view.enabled) camera.clearViewOffset();

    // Count every draw this frame issues: the scene, the post chain's full-screen
    // passes, and the sun map on the frames it is redrawn.
    const autoReset = renderer.info.autoReset;
    renderer.info.autoReset = false;
    renderer.info.reset();
    try {
      last.sunMapRedrawn = sunMap.update(renderer, scene);

      viewProjection.multiplyMatrices(camera.projectionMatrix, camera.matrixWorldInverse);
      const zoom = Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) / REFERENCE;
      const t0 = performance.now();
      const eye = measuredFrom || camera.position, hidden = hide ? hide.join(',') : '';
      if (!packedProjection.equals(viewProjection) || !packedEye.equals(eye) ||
          packedScale !== settings.lodScale || packedZoom !== zoom || packedEach !== eachPlant || packedHide !== hidden) {
        frustum.setFromProjectionMatrix(viewProjection);
        terrain.cull(frustum);
        for (const set of sets) {
          set.update(eye, frustum, zoom, settings.lodScale, eachPlant);
          if (hide && hide.includes(set.name)) {
            for (const level of set.levels) for (const mesh of level.meshes) mesh.visible = false;
          }
        }
        packedProjection.copy(viewProjection);
        packedEye.copy(eye);
        packedScale = settings.lodScale; packedZoom = zoom; packedEach = eachPlant; packedHide = hidden;
      }
      const t1 = performance.now();
      post.render(scene, camera, into);
      last.packMs = t1 - t0;                 // choosing and packing instances (script only)
      last.drawMs = performance.now() - t1;  // issuing the draw calls (script, plus any wait on the GPU)
      last.calls = renderer.info.render.calls;
      last.triangles = renderer.info.render.triangles;
    } finally {
      renderer.info.autoReset = autoReset;   // the renderer is shared with the cabin from milestone 5
    }
    // (not counted against the picture: a frame in which the sun's map was drawn again, and one after the page was away,
    // whose time the caller has cut short)
    if (governed) governor.frame(dt * 1000, last.sunMapRedrawn || dt >= 0.1);
  }

  // What the walker's view is drawing right now, split the way the budget is.
  function stats() {
    let solid = ground.geometry.drawRange.count / 3 + life.triangles(), foliage = 0, instances = 0;
    for (const water of waters) solid += water.geometry.index.count / 3;
    solid += structures.geometry.getAttribute('position').count / 3 + (lamp.visible ? lamp.geometry.getAttribute('position').count / 3 : 0);
    for (const set of sets) {
      instances += set.drawn;
      for (const level of set.levels) {
        for (const mesh of level.meshes) {
          if (mesh.material.colorWrite === false) continue;
          const triangles = (mesh.geometry.index.count / 3) * level.used;
          if (mesh.layers.isEnabled(SOLID_LAYER)) solid += triangles; else foliage += triangles;
        }
      }
    }
    return { calls: last.calls, triangles: last.triangles, solid, foliage, instances, scale: post.scale,
      packMs: last.packMs, drawMs: last.drawMs, sunMapRedrawn: last.sunMapRedrawn, settings, look: look.name };
  }

  // What a walk would otherwise do the first time each thing comes into view, done beforehand: every texture sent to
  // the GPU, a few to a frame (`budget` ms of them, then `between`), and every program the scene needs compiled
  // (post.js `compile`). On the forest's own page nothing was warmed until 2026-11-19: on a first run round the walk 21
  // frames took 6 to 50 ms of script where the median took 1.9, each one a program or a sheet first used. The cabin's
  // page has always done this (js/outside.js), and now does it through here.
  async function warm({ budget = 6, between = nextFrame } = {}) {
    const textures = texturesOf(scene);
    let until = performance.now() + budget;
    for (const texture of textures) {
      if (texture.isRenderTargetTexture || texture.isDepthTexture) continue;
      renderer.initTexture(texture);
      if (performance.now() > until) { await between(); until = performance.now() + budget; }
    }
    await post.compile(scene, camera);
    return textures.size;
  }
  letPixelsGo(renderer, texturesOf(scene));

  function dispose() {
    life.dispose(); nav.dispose(); post.dispose(); sunMap.dispose(); if (sound) sound.dispose(); hud.dispose();
    scene.traverse((o) => {
      if (o.geometry) o.geometry.dispose();
      if (o.material) o.material.dispose();
      if (o.isInstancedMesh) o.dispose();            // frees the instance matrices, which no geometry owns
    });
    casterMaterial.dispose();
    trailMap.texture.dispose();
    for (const key of ['uCanopyMap', 'uNoiseTex']) U[key].value?.dispose();
    for (const made of [...Object.values(sheets), ...Object.values(barks), floor, tread, gravel, meadow, far]) { made.texture.dispose(); made.normal?.dispose(); made.aux?.dispose(); }
  }

  return { scene, camera, nav, trail, terrain, places: built.places, settings, look, frame, setSize, stats, dispose, warm,
    setScale: (s) => { governed = false; post.setScale(s, false); },
    setGoverned: (on) => { governed = on; if (on) post.setScale(governor.scale); },
    measureFrom: (position) => { measuredFrom = position; }, testEach: (on) => { eachPlant = on; }, post, light, life, sound, hud,
    // (for the tools: where the plants of a kind stand, as the instancer has them: x, y, z of each, its scale, and its phase and tint)
    plantsOf: (name) => { const set = sets.find((one) => one.name === name); return set ? { count: set.count, pos: set.pos, scale: set.scale, extra: set.extra } : null; },
    plants,          // (every kind as built, for the tools: its meshes and what stands on it, plants/build.js)
    banks };         // (the map of what stands along the river: for looking at, on the dev page)
}
