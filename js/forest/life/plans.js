import { BONES } from './bird.js';
import { buildKind, createBird } from './rig.js';
import { paintBird } from './plumage.js';
import { compare } from './measure.js';
import { BEAST_BONES, buildBeastKind, compareBeast } from './beast.js';
import { createBeast } from './beastRig.js';
import { paintCoat } from './coat.js';
import { BAT_BONES, buildBatKind, compareBat } from './bat.js';
import { createBat } from './batRig.js';
import { paintBat } from './batPaint.js';
import { FROG_BONES, buildFrogKind, compareFrog } from './frog.js';
import { createFrog } from './frogRig.js';
import { paintFrog } from './frogCoat.js';
import { SAL_BONES, buildSalamanderKind, compareSalamander } from './salamander.js';
import { createSalamander } from './salamanderRig.js';
import { paintSalamander } from './salamanderSkin.js';
import { BODIES } from './bodies.js';

// Body plans (the owner, 2026-11-16: "Body types need one interface. ... If every body type answered the same
// build/paint/pose/measure calls, the drawing, close-ups, info cards and tools would stop needing special cases.")
//
// A kind's body is made by its plan: a bird's (life/bird.js, life/rig.js, life/plumage.js, life/measure.js) or a
// beast's (life/beast.js, life/beastRig.js, life/coat.js); a bat's, a frog's, a salamander's and the small mammals'
// are to come. A sheet names its plan (`plan`; one that names none is a bird). Whatever draws an animal
// (life/index.js, life/flock.js), frames it in a close-up, rings it for the pointer, counts what a walk meets
// (life/visit.js) or shows its contact sheet (life/studio.js) asks the plan, and never which kind of animal it is.
//
// The light half of each plan is in life/bodies.js, which imports nothing that builds: what its sheet must hold
// (`fields`, which every kind's file is checked against as the registry loads it), how long one of its animals is
// (`size`) and the box its body fills (`body`). The heavy half is here, and every plan answers the same calls:
//   bones                     the skeleton's bones by name, in the order a row of the bone texture holds them
//   build(sheet)              the kind: { sheet, levels, triangles, ...what its own posing needs }. `levels` is the
//                             body at three detail levels, each { geometry, pivots, marks, triangles }, in the
//                             bind pose
//   paint(sheet, look, kind)  { texture, canvas }: the painted sheet the body is drawn with
//   puppet(kind, material)    one skeleton under a group, { group, skeleton, pose(pose) }: the group's origin is
//                             where the animal stands, +x the way it faces, +y up from what it stands on. With no
//                             material it is the skeleton alone, which life/flock.js poses every animal of the kind
//                             with; with one, its skinned meshes too (the contact sheet)
//   measure(kind)             its published lengths against the body as built, measured between vertices of the
//                             mesh: [{ key, what, built, mean, range, source, off }]
//   studio(params, sheet)     its contact sheet (loaded only when one is asked for)
//   undrawn                   true while its animals are not drawn in the page: the page builds none of its kinds
//                             and leaves them out of its visit, as it always has for a kind with no body, and they
//                             live only in the count of walks. No plan is, from 2026-11-16: the page draws every
//                             plan through these calls and the light half's `size`, `body`, `middle`, `frame` and `whole`
//                             (life/bodies.js), with defaults for a plan that gives none of the last three
// A pose is the plan's own: named amounts its puppet reads (a bird's `pitch`, `lift`, `head`, `feet`, ...; a
// beast's `walk`, `cycle`, `neck`, `lie`, ...). What an animal does sets the one its plan reads as `want`; the page
// eases `pose` towards it and hands that to the puppet. Nothing outside the plan reads a pose's fields.
export const PLANS = {
  bird: {
    ...BODIES.bird, bones: BONES, build: buildKind, puppet: createBird,
    paint: (sheet, look) => paintBird(sheet, look),
    measure: (kind) => compare(kind.sheet, kind.levels[0]),
    studio: (params, sheet) => import('./studio.js').then((studio) => studio.birdStudio(params, sheet)),
  },
  beast: {
    ...BODIES.beast, bones: BEAST_BONES, build: buildBeastKind, puppet: createBeast,
    paint: (sheet, look, kind) => paintCoat(sheet, kind.levels[0], look),
    measure: (kind) => compareBeast(kind.sheet, kind.levels[0]),
    studio: (params, sheet) => import('./beastStudio.js').then((studio) => studio.showBeast(params, sheet)),
  },
  bat: {
    ...BODIES.bat, bones: BAT_BONES, build: buildBatKind, puppet: createBat,
    paint: (sheet, look, kind) => paintBat(sheet, kind.levels[0], look),
    measure: (kind) => compareBat(kind.sheet, kind.levels[0]),
    studio: (params, sheet) => import('./batStudio.js').then((studio) => studio.showBat(params, sheet)),
  },
  frog: {
    ...BODIES.frog, bones: FROG_BONES, build: buildFrogKind, puppet: createFrog,
    paint: (sheet, look, kind) => paintFrog(sheet, kind.levels[0], look),
    measure: (kind) => compareFrog(kind.sheet, kind.levels[0]),
    studio: (params, sheet) => import('./frogStudio.js').then((studio) => studio.showFrog(params, sheet)),
  },
  // (a salamander's or a newt's: life/salamander.js, life/salamanderRig.js, life/salamanderSkin.js)
  salamander: {
    ...BODIES.salamander, bones: SAL_BONES, build: buildSalamanderKind, puppet: createSalamander,
    paint: (sheet, look, kind) => paintSalamander(sheet, kind.levels[0], look),
    measure: (kind) => compareSalamander(kind.sheet, kind.levels[0]),
    studio: (params, sheet) => import('./salamanderStudio.js').then((studio) => studio.showSalamander(params, sheet)),
  },
};
export const planOf = (sheet) => PLANS[sheet.plan || 'bird'];
