import { TIER } from './census.js';

// Body plans, as data. What a kind's file must hold (each plan's `fields`), how long one of its animals is and the
// box its body fills: what the registry checks every kind's file with as it loads, and what a visit asks of an
// animal's body without building it. Nothing here imports three or a builder (as life/census.js does not), so the
// registry, the visit and the sound can import it. What builds, paints, poses and measures a body is life/plans.js,
// which answers the same calls for every plan and is what the page and the contact sheet import.
//
// A kind's file holds who is about (`census`) and, once it is built, a body of one plan (a bird's unless `plan`
// says otherwise), how it lives on a visit (`way`) and what it says (`voices`): life/species/index.js says what each
// of those is. `validate` names every fault in a file at once, with the field it is in, and the page stops with
// them as its error: "life/species/wilsonsWarbler.js: shape.leg.toes.hind is missing; plumage.wing.tertialbars
// is not a field that is read (misspelt?)".
//
// What a field must be is written as one of:
//   'number', 'string', 'function', 'boolean', 'null', 'any'   that kind of value ('any': anything, but there)
//   a table { field: what it is, ... }   each field there unless optional(); no field that is not in it
//   rest({ field: ..., ... }, what)      a table with those fields, and any others each `what`
//   optional(what)                       may be left out
//   list(what, least)                    a list of things each `what`, at least `least` of them
//   tuple(a, b, ...)                     a list of exactly those
//   either(a, b, ...), maybe(what)       one of them; `what` or null
//   nums(n), points, oneOf(...)          n numbers (any number of them with no n); [x, y] pairs; one of the values
//   pick(choose, what)                   whatever choose(value) says this one should be (null: none fits)
const SPEC = Symbol('what a field must be');
const make = (kind, more) => ({ [SPEC]: kind, ...more });
const finite = (x) => typeof x === 'number' && Number.isFinite(x);
export const optional = (spec) => make('optional', { spec });
export const list = (spec, least = 0) => make('list', { spec, least });
export const tuple = (...specs) => make('tuple', { specs });
export const either = (...specs) => make('either', { specs });
export const maybe = (spec) => either(spec, 'null');
export const rest = (fields, spec) => make('rest', { fields, spec });
export const test = (fn, what) => make('test', { fn, what });
export const pick = (choose, what) => make('pick', { choose, what });
export const nums = (n) => test((v) => Array.isArray(v) && (n == null ? v.length > 0 : v.length === n) && v.every(finite), n == null ? 'a list of numbers' : `a list of ${n} numbers`);
export const points = test((v) => Array.isArray(v) && v.length >= 2 && v.every((p) => Array.isArray(p) && p.length === 2 && p.every(finite)), 'a list of [x, y] points');
export const oneOf = (...values) => test((v) => values.includes(v), `one of ${values.map((x) => JSON.stringify(x)).join(', ')}`);

const WORDS = { number: 'a number', string: 'a string', function: 'a function', boolean: 'true or false', null: 'null', any: 'there' };
function describe(spec) {
  if (typeof spec === 'string') return WORDS[spec];
  switch (spec[SPEC]) {
    case 'test': case 'pick': return spec.what;
    case 'list': return 'a list';
    case 'tuple': return `a list of ${spec.specs.length}`;
    case 'either': return spec.specs.map(describe).join(' or ');
    case 'optional': return describe(spec.spec);
    default: return 'a table';
  }
}
const short = (v) => { if (typeof v === 'function') return 'a function'; const s = JSON.stringify(v); return s === undefined ? String(v) : s.length > 48 ? `${s.slice(0, 45)}...` : s; };
const it = (v) => ` (it is ${short(v)})`;

// Every fault of `value` against `spec`, each with where it is (`path`), as a list.
export const faultsOf = (value, spec, path = '') => { const faults = []; check(value, spec, path, faults); return faults; };

// Every fault of `value` against `spec`, each with where it is, into `faults`.
function check(value, spec, path, faults) {
  const at = path || 'the file';
  if (typeof spec === 'string') {
    const ok = spec === 'any' ? value !== undefined : spec === 'null' ? value === null : spec === 'number' ? finite(value) : typeof value === spec;
    if (!ok) faults.push(`${at} should be ${WORDS[spec]}${it(value)}`);
    return;
  }
  const kind = spec[SPEC];
  if (kind === 'test') { if (!spec.fn(value)) faults.push(`${at} should be ${spec.what}${it(value)}`); return; }
  if (kind === 'pick') { const chosen = spec.choose(value); if (chosen) check(value, chosen, path, faults); else faults.push(`${at} should be ${spec.what}${it(value)}`); return; }
  if (kind === 'either') {
    if (!spec.specs.some((one) => { const none = []; check(value, one, path, none); return !none.length; })) faults.push(`${at} should be ${describe(spec)}${it(value)}`);
    return;
  }
  if (kind === 'list') {
    if (!Array.isArray(value)) { faults.push(`${at} should be a list${it(value)}`); return; }
    if (value.length < spec.least) faults.push(`${at} should have at least ${spec.least} in it`);
    value.forEach((one, i) => check(one, spec.spec, `${path}[${i}]`, faults));
    return;
  }
  if (kind === 'tuple') {
    if (!Array.isArray(value) || value.length !== spec.specs.length) { faults.push(`${at} should be a list of ${spec.specs.length}: ${spec.specs.map(describe).join(', ')}${it(value)}`); return; }
    spec.specs.forEach((one, i) => check(value[i], one, `${path}[${i}]`, faults));
    return;
  }
  const fields = kind === 'rest' ? spec.fields : spec, others = kind === 'rest' ? spec.spec : null;
  if (!value || typeof value !== 'object' || Array.isArray(value)) { faults.push(`${at} should be a table${it(value)}`); return; }
  for (const [key, field] of Object.entries(fields)) {
    const here = path ? `${path}.${key}` : key, one = value[key];
    if (field && field[SPEC] === 'optional') { if (one !== undefined) check(one, field.spec, here, faults); continue; }
    if (one === undefined) { faults.push(`${here} is missing`); continue; }
    check(one, field, here, faults);
  }
  for (const key of Object.keys(value)) {
    if (Object.hasOwn(fields, key)) continue;
    const here = path ? `${path}.${key}` : key;
    if (others) check(value[key], others, here, faults); else faults.push(`${here} is not a field that is read (misspelt?)`);
  }
}

// ---- what every kind's file has, and what every body has
const colour = nums(3);                                    // hue, saturation, lightness
const CENSUS = {
  tier: oneOf(...Object.keys(TIER)), source: 'string', mean: optional('number'),
  party: optional(test((v) => Array.isArray(v) && v.length === 2 && v.every(Number.isInteger) && v[0] >= 1 && v[0] <= v[1], 'the fewest and the most that go about together, two whole numbers')),
  clock: optional(oneOf('day', 'night', 'dusk', 'any')), wave: optional(oneOf(true)), extra: optional(oneOf(true)),
};
// What every kind's way has (life/species/index.js says what each is). A family's own numbers are checked against
// its family's fields when the ways are bound to their families (life/families/index.js).
export const WAY = {
  family: 'string', home: optional('function'), spot: optional('function'), gap: nums(2), together: optional('boolean'), herd: optional('boolean'),
  passing: optional('boolean'), there: test((v) => finite(v) && v >= 0 && v <= 1, 'a number from 0 to 1'),
  // (the count of walks' limits for a kind that passes the small birds' ones, life/visit.js `checks`: the fastest it
  // may go in m/s, and how far under the ground or the water it may go in m, for a swimmer, a diver or a burrower)
  fastest: optional('number'), under: optional('number'),
};
const RECORDING = { file: 'string', level: 'number', near: 'number',
  credit: { what: 'string', by: 'string', licence: 'string', licenceUrl: optional('string'), source: 'string', bytes: 'number', kept: 'number' } };
const SYNTH = { synth: 'string', level: 'number', near: 'number', pitch: optional('number') };     // (sound/index.js makes each by its name)
const VOICE = pick((v) => (!v || typeof v !== 'object' ? null : v.file !== undefined ? RECORDING : v.synth !== undefined ? SYNTH : v.silent !== undefined ? { silent: oneOf(true) } : null),
  'a recording ({ file, level, near, credit }), a synth ({ synth, level, near }) or { silent: true }');
const ONLY_CENSUS = { key: 'string', name: 'string', census: CENSUS };
const BODY = {
  key: 'string', name: 'string', latin: 'string', seed: 'number', census: CENSUS, way: optional(rest(WAY, 'any')), voices: optional(rest({}, VOICE)),
  published: { shown: 'string', note: 'string', sources: rest({}, 'string'), mass: 'string', proportions: list('string'),
    // [key, what, mean or null, [least, most] (a '?' where the source cannot be read), source]
    lengths: list(tuple('string', 'string', maybe('number'), tuple(either('number', 'string'), either('number', 'string')), 'string'), 1) },
  card: { size: 'string', marks: list('string', 1), lives: 'string' },
};

// ---- a bird (life/bird.js, life/rig.js, life/plumage.js, life/measure.js)
const tip = maybe(tuple(colour, 'number'));               // a colour laid on a feather's tip, and how much of it
const band = tuple('number', 'number', colour, oneOf('outer', 'inner', 'edge', 'both'));     // across a flight feather: from, to (shares of its length), colour, which web
const barring = tuple(colour, 'number', 'number');        // bars across a body feather or the tail: colour, how many, how wide
const POSE = rest({ pitch: 'number', lift: 'number', feet: rest({ mode: oneOf('grip', 'flat', 'tuck'), walk: optional(nums(4)) }, 'number') }, either('number', 'boolean', rest({}, 'number')));
const BIRD = {
  ...BODY, plan: optional(oneOf('bird')),
  plate: { wide: 'number', bar: 'number' },
  shape: {
    top: points, bottom: points, half: points, widest: 'number', neck: nums(2),
    // (fields marked with an owner's name were declared on 2026-11-16 before twenty agents built at once, each
    // its own feature, so that a sheet can use another's feature before it is merged; each owner gives its own
    // field its real form here when it builds it)
    eye: { x: 'number', y: 'number', r: 'number', shine: optional(colour) },                // shine: the owls' (life/parts/owl.js)
    bill: { culmen: 'number', drop: 'number', gape: 'number',
      // the raptors' (life/parts/raptor.js): a hooked upper mandible, its tip `drop` mm under the gape line, curling
      // from `from` of the way along the culmen; a cere `long` mm from the feathers (the culmen is then from the cere)
      hook: optional({ drop: 'number', from: 'number' }), cere: optional({ long: 'number' }),
      // the ducks' (life/parts/duck.js): how flat its section is, its nail (mm), its teeth, its width and depth at
      // the tip as shares of its base's, and where its nostril is
      duck: optional({ flat: 'number', nail: 'number', serrate: 'number', tip: optional('number'), deep: optional('number'), nostril: optional('number') }) },
    wing: { chord: 'number', wrist: nums(2), aim: nums(2), up: points, down: points, rest: 'number', proud: 'number', span: 'number', shoulder: nums(3),
      arm: 'number', lead: 'number', sweep: 'number', root: 'number', tipChord: 'number' },
    tail: { length: 'number', root: 'number', rootHalf: 'number', feathers: 'number', width: 'number', closed: 'number', graded: 'number', point: 'number',
      droop: 'number', tent: 'number', fork: optional('number'), spine: optional('number'),
      fan: optional({ spread: 'number' }) },                                                // fan: the grouse's (life/parts/display.js)
    leg: { knee: nums(3), shin: 'number', tarsus: 'number', thick: nums(3), splay: 'number', yaw: optional(rest({}, 'number')),
      toes: { mid: 'number', side: 'number', hind: 'number', claw: 'number', hindClaw: 'number' },
      feathered: optional({ to: oneOf('tarsus', 'toes'), full: 'number' }),                 // the owls' (the grouse use it): life/parts/owl.js
      talons: optional({ claw: 'number', curve: 'number' }),                                 // the raptors': claws `claw` mm deep at the root, turning down through `curve` radians (life/parts/raptor.js)
      web: optional({ share: 'number', scallop: optional('number') }) },                     // the ducks' (life/parts/duck.js): how far out the webs reach, and how far their edge is cut back
    crest: optional({ sunk: 'number', paint: optional(nums(2)), lobes: list(nums(6), 1) }),
    // the owls' (life/parts/owl.js says what each is)
    disc: optional({ rim: 'number', depth: 'number', apart: optional('number'), wide: optional('number'), at: optional('number'), seam: optional('number'),
      ruff: optional('number'), back: optional('number'), lid: optional(either('number', oneOf(false))) }),
    tufts: optional({ long: 'number', at: nums(2), lean: optional('number'), out: optional('number'), wide: optional('number'), deep: optional('number') }),
    // the grouse's (life/parts/display.js says what each is; `brow.over`: mm of the culmen under the forehead's feathers, life/bird.js)
    brow: optional({ over: 'number' }),
    comb: optional({ long: 'number', high: 'number', rest: optional('number'), wide: optional('number'), ahead: optional('number') }),
    ruff: optional({ long: 'number', at: optional('number'), around: optional(nums(2)), wide: optional('number'), fan: optional('number'), raise: optional('number'), tilt: optional('number') }),
    float: optional({ line: 'number' }),                                                    // the ducks' (life/parts/swim.js): its waterline, mm above its belly's lowest point
  },
  poses: rest({ perched: POSE, level: POSE, flight: POSE }, POSE),
  plumage: {
    body: list({ colour, size: either('number', 'function'), where: optional('function'), shaft: optional(colour), shaftWidth: optional('number'),
      edge: optional(colour), fringe: optional('number'), bars: optional(barring) }, 1),
    wing: { web: colour, edge: colour, tertial: colour, covert: colour, lesser: colour, lesserEdge: colour, medianTip: tip, greaterTip: tip, tertialTip: tip,
      patchSkip: 'number', primaryBars: list(band), secondaryBars: list(band), tertialBars: optional(list(band)), greaterBars: optional(list(band)),
      under: colour, underCovert: colour, underCovertTip: tip, underBars: list(band),
      fold: { primaries: 'number', secondaries: 'number', secondaryEnd: 'number', greater: 'number', greaterEnd: 'number', median: 'number', medianEnd: 'number',
        feather: optional('number') },                                                    // feather: the raptors' (how wide the folded wing's feathers are painted, as a multiple of a songbird's)
      spread: { primaries: 'number', secondaries: 'number', shape: nums(9) } },
    // `tip`: [which feathers from the middle out, colour, how much of each]
    tail: { web: colour, edge: colour, under: colour, point: 'number', middle: optional(colour), shaft: optional(colour), bars: optional(barring),
      band: optional(list(tuple('number', 'number', colour))),                              // the grouse's: bands right across the tail, [from, to, colour] (life/parts/displayPaint.js)
      tip: optional(list(tuple('number', colour, 'number'))) },
    bill: { upper: colour, lower: colour, lowerBase: optional(tip), cere: optional(colour),   // cere: the raptors'
      nail: optional(colour), ridge: optional(colour) },                                     // the ducks': the nail, and a stripe along the top
    claw: optional(colour),                                                                 // the raptors': the talons' colour (life/parts/raptorPaint.js)
    mouth: colour, eye: { iris: colour, pupil: colour }, leg: colour, shin: colour,
    web: optional(colour),                                                                  // the ducks': the webs between the toes
    disc: optional({ face: colour, rim: colour, band: optional(colour), eyering: optional(colour), eyeringWide: optional('number'), brow: optional(colour), bristle: optional(colour),      // the owls'
      rings: optional(tuple(colour, 'number')), rays: optional(tuple(colour, 'number')), pupil: optional('number'), lid: optional(colour), streak: optional(colour) }),
    comb: optional(colour), ruff: optional(colour),                                         // the grouse's (life/parts/displayPaint.js)
  },
};
// (the ducks': a sheet is one plumage, and a pair of harlequins is a drake and a duck. `mate` is the other of a pair:
// what it is, its size as a share of the sheet's bird, and its own paint. Its family marks the bird that is the mate,
// `bird.mate = true`, and poses it at that size; the page paints this plumage on a second sheet and draws the mate
// with it, as a flock of its own, and its card says which of the pair it is: life/index.js.)
BIRD.mate = optional({ shown: 'string', scale: 'number', plumage: BIRD.plumage });

// ---- a beast, which walks (life/beast.js, life/beastRig.js, life/coat.js)
// (`foot` and `web`: the bear's, for a paw: life/parts/paw.js says what each is)
const FOOT = { long: optional('number'), wide: optional('number'), high: optional('number'), heel: optional('number'), toes: optional('number'),
  digits: optional('number'), round: optional('number'), thumb: optional('number') };
const LIMB = rest({ at: nums(2), bones: nums(3), angles: nums(3), pastern: nums(2), hoof: optional(nums(3)), girth: list(nums(4), 2), share: { at: nums(2), reach: nums(2), most: 'number' },
  foot: optional(FOOT), web: optional(test((v) => finite(v) && v >= 0 && v <= 1, 'a share from 0 to 1')) }, 'any');
// a paw (the bear's: life/parts/paw.js)
const PAW = { kind: oneOf('plantigrade', 'digitigrade'), claw: 'number', hind: optional('number'), curve: optional('number'), in: optional('number'), hindIn: optional('number'), thick: optional('number') };
const RULE = { colour, where: optional('function') };
const BEAST = {
  ...BODY, plan: oneOf('beast'),
  size: 'number', body: { high: 'number', long: 'number', wide: 'number' },
  // one stride of each gait, metres at the sheet's size (life/beasts.js `stridesOf`: the elk's, scaled by the foreleg, if not given)
  strides: optional({ walk: 'number', trot: 'number', gallop: 'number' }),
  shape: {
    trunk: list(nums(7), 4), withers: nums(2), spine: rest({}, nums(2)), blend: nums(5),
    long: optional(rest({}, 'any')),                      // the weasel family's long low body, how it bounds and swims (life/parts/longRig.js)
    head: rest({ at: nums(2), stations: list(nums(4), 2), eye: rest({}, 'number') }, 'any'),
    // (an antler and hooves are the elk's: the mammals built on this plan from 2026-11-16 have neither, and give
    // their paws, claws and tails in fields of their own, which are loose here until their owners build them:
    // `paw` the bear's, `tail` the rodents' (it was loose already), the long low trunk and webbed paws the
    // mustelids')
    ear: rest({}, 'number'), tail: rest({ at: nums(2), bush: optional({ long: 'number', round: 'number' }) }, 'any'), antler: optional(rest({ s: 'number', up: 'number', side: 'number' }, 'any')),
    fore: LIMB, hind: LIMB, neck: rest({ high: 'any', low: 'any', dip: 'number' }, 'any'), lie: rest({ drop: 'number' }, 'any'), paw: optional(PAW),
    // the rodents' (life/parts/rodent.js, rodentRig.js): the builder's own small sizes, how it climbs and bounds, a cone to hold
    unit: optional('number'), climb: optional({ stride: 'number', splay: 'number', flex: 'number' }), cone: optional({ long: 'number', wide: 'number' }),
  },
  coat: rest({ body: list(RULE, 1), head: list(RULE, 1), leg: 'function', hoof: optional(colour), claw: optional(colour), pad: optional(colour), eye: { iris: colour, pupil: colour } }, 'any'),
  studio: optional({ wide: 'number', bar: 'number' }),          // a small one's contact sheet (life/parts/rodentStudio.js): metres across, and its scale bar
};

// ---- a bat, which flies and hangs (life/bat.js, life/batRig.js, life/batPaint.js). The sheet's numbers are millimetres.
const BAT = {
  ...BODY, plan: oneOf('bat'), size: 'number',
  flight: { rate: 'number', note: 'string' },
  shape: {
    trunk: list(nums(4), 4), neck: nums(2), shoulder: nums(3), humerus: nums(3), forearm: nums(3),
    digits: { d2: nums(3), d3: nums(3), d4: nums(3), d5: nums(3) }, knuckle: nums(2), thumb: nums(4),
    leg: { hip: nums(3), thigh: nums(4), shin: nums(4), foot: nums(4), calcar: nums(4) },
    tail: { length: 'number', edge: 'number' },
    ear: { at: nums(3), length: 'number', width: 'number', lean: nums(2), tragus: nums(2) },
    eye: nums(3),
  },
  fur: {
    back: colour, belly: colour, face: colour, nose: colour, ear: { outer: colour, inner: colour, edge: colour },
    membrane: { top: colour, under: colour, vein: colour, edge: colour }, bone: colour, foot: colour, eye: colour,
    frost: optional(tuple(colour, 'number')),             // pale tips on the fur of the body, not the head: [colour, how much]
    uro: optional(nums(2)),                               // fur on the tail's membrane, above: [how much of it from its base, how thick]
  },
  poses: rest({}, rest({}, 'any')),
};

// ---- a frog or a toad, which sits and leaps (life/frog.js, life/frogRig.js, life/frogCoat.js); every length of its shape is
// in units of its snout-to-vent length `shape.svl` (life/frog.js says what each table is)
const FROG_RULE = { colour, where: optional('function') };
const FROG = {
  ...BODY, plan: oneOf('frog'),
  shape: {
    svl: 'number', axis: nums(2), trunk: list(nums(5), 4), hinge: nums(3),
    eye: { s: 'number', up: 'number', side: 'number', r: 'number' },
    hind: { hip: nums(3), knee: nums(3), ankle: nums(3), ball: nums(3), girth: nums(5), toes: { lens: nums(5), r: 'number', spread: 'number', pad: 'number', web: 'number' } },
    fore: { shoulder: nums(3), elbow: nums(3), wrist: nums(3), girth: nums(4), fingers: { lens: nums(4), r: 'number', spread: 'number', pad: 'number' } },
    sac: { s: 'number', size: nums(3) },
    features: { ridges: list(nums(5)), bumps: list(nums(5)), warts: optional({ count: 'number', h: 'number', r: 'number', from: nums(2), low: 'number' }) },
  },
  skin: {
    body: list(FROG_RULE, 1), leg: 'function', mouth: { a: 'number', from: 'number', colour },
    foot: { top: colour, under: colour, pad: optional(colour), web: colour },
    eye: { iris: colour, pupil: colour, lid: colour, ring: colour }, sac: { colour, fold: colour },
    spots: optional(list({ colour, count: 'number', size: nums(2), where: optional('function'), alpha: optional('number'), long: optional('boolean') })),
  },
};

// ---- a salamander or a newt, which walks with its body bending from side to side, and swims (life/salamander.js,
// life/salamanderRig.js, life/salamanderSkin.js); every length of its shape is in units of its snout-to-vent length
// `shape.svl` (life/salamander.js says what each table is)
const SAL_LIMB = (toes) => ({ upper: 'number', lower: 'number', girth: nums(3), foot: nums(2), palm: 'number', wide: 'number', toes: nums(toes), toe: 'number', spread: 'number', turn: 'number' });
const SALAMANDER = {
  ...BODY, plan: oneOf('salamander'),
  shape: {
    svl: 'number', tail: 'number', rings: list(nums(5), 4), ends: nums(2), axis: 'number', neck: 'number', shoulder: 'number', hip: 'number', stride: 'number',
    eye: { s: 'number', up: 'number', side: 'number', r: 'number' },
    fore: SAL_LIMB(4), hind: SAL_LIMB(5),
    gills: optional({ s: 'number', up: 'number', side: 'number', r: 'number', stalks: list(nums(3), 1), fringe: nums(2) }),
  },
  skin: {
    body: list({ colour, where: optional('function') }, 1), leg: 'function', foot: { top: colour, under: colour },
    eye: { iris: colour, pupil: colour, ring: colour, lid: colour, bar: optional(colour) },
    grain: optional({ size: 'number', relief: 'number', from: 'number' }),
    grooves: optional({ count: 'number', from: 'number', to: 'number', colour, width: 'number' }),
    spots: optional(list({ colour, count: 'number', size: nums(2), where: optional('function'), alpha: optional('number'), long: optional('boolean') })),
    mouth: optional({ a: 'number', to: 'number', colour }),
    gills: optional({ stalk: colour, fringe: colour }),
  },
};

// Each plan: what its sheet must hold; how long one of its animals is, in metres (what a close-up frames, the
// pointer's ring, the distances its detail levels are drawn to, and whether it is "plainly" seen); and the box
// its body fills, for an animal big enough that part of it can be seen when the point it stands on cannot.
// `rest(sheet)`: the neutral pose, a new table each time, that every activity's own is laid over as an animal
// begins it (life/behave.js): a bird as it sits on its sheet, wings folded, bill shut, tail closed, feet flat.
// And for the page that draws the animals (life/index.js), each optional, with a default for a plan that gives none:
//   middle(bird)   where the middle of one of its animals is, [ahead, up] in metres in the animal's own frame (+x the
//                  way it faces, +y up from what it stands on), as it is posed now (`bird.pose`): what a close-up aims
//                  at, the pointer's ring is round and the frame's edge is tested against. By default a quarter of its
//                  length up (a bird's), or, for a plan with a `body`, 0.85 of the height of its back
//   frame          how many times as tall as one of its animals is long a close-up's frame is: 2.4 by default (a
//                  bird's), less for a long body that stands low in a frame as wide as a screen
//   whole          the fields of its pose the page takes whole rather than easing number by number (a bird's `feet`,
//                  whose mode and numbers go together). A field called `cycle` is a phase, where in a stride or a
//                  wingbeat the animal is, and is always taken as it is: a family runs it on, and easing it from 0.98
//                  to 0.02 ran it back through a whole stride
const birdRest = (sheet) => {
  const p = sheet.poses.perched;
  return { pitch: p.pitch, lift: p.lift, roll: 0, lean: 0, spread: 0, flap: 0, hand: 0, sweep: 0, droop: 0, gape: 0,
    head: { yaw: 0, pitch: p.head && p.head.pitch != null ? p.head.pitch : 0.05, roll: 0 },
    tail: { pitch: p.tail && p.tail.pitch != null ? p.tail.pitch : 0, fan: 0, yaw: 0, prop: null }, feet: { mode: 'flat' } };
};
export const BODIES = {
  bird: { fields: BIRD, size: (sheet) => sheet.shape.wing.chord * 0.0018, body: () => null, rest: birdRest, whole: ['feet'] },
  // (a beast's neutral pose: standing square, no gait, the head as it stands, the ears out, the tail down, every foot
  // on the plane it stands on; every field life/beastRig.js reads but `cycle`, a phase that runs on, and `scale` and
  // `antler`, which are who the animal is and are set by its family. Its middle is the barrel's, let down as it lies.)
  beast: { fields: BEAST, size: (sheet) => sheet.size, body: (sheet) => sheet.body,
    rest: () => ({ walk: 0, trot: 0, gallop: 0, high: 0, stamp: 0, lie: 0, neck: 0.6, head: { yaw: 0, pitch: 0 }, jaw: 0, ears: 0.2, tail: 0, ground: [0, 0, 0, 0] }),
    middle: (bird) => { const b = bird.body, lie = (bird.pose && bird.pose.lie) || 0; return b ? [b.long * 0.1, b.high * (0.85 - 0.5 * lie)] : [0, bird.size * 0.25]; },
    frame: 1.5 },
  // (a bat's neutral pose is the roost, wings folded, hanging; hung from its feet it is below them, and in flight its
  // origin is its middle)
  bat: { fields: BAT, size: (sheet) => sheet.size, body: () => null, rest: (sheet) => ({ ...sheet.poses.roost }),
    middle: (bird) => { const p = bird.pose || {}; return [0, bird.size * (-0.35 * (p.hang || 0) + 0.12 * (p.crawl || 0))]; } },
  // (a frog's neutral pose is the crouch, the sac empty)
  frog: { fields: FROG, size: (sheet) => sheet.shape.svl / 1000, body: () => null, rest: () => ({ leap: 0, walk: 0, swim: 0, cycle: 0, lift: 0, sac: 0, jaw: 0, head: { yaw: 0, pitch: 0 } }) },
  // (a salamander is as long as it is from its snout to its tail's tip; its neutral pose stands still, its body
  // straight and its tail on the ground. `cycle` and `wave` are left out of it: they are counts that only grow, and
  // eased back to nothing a walking salamander's legs would spin backwards through every stride it had walked)
  salamander: { fields: SALAMANDER, size: (sheet) => (sheet.shape.svl * (1 + sheet.shape.tail)) / 1000, body: () => null,
    rest: () => ({ walk: 0, swim: 0, warn: 0, tall: 0, crouch: 0, bend: 0, lunge: 0, gills: 0.5, height: 0, afloat: false, head: { yaw: 0, pitch: 0 }, tail: { pitch: 0, yaw: 0, sway: 0 } }),
    // (its middle is its back, a little above the ground: a quarter of its whole length up, the default, is over it)
    middle: (bird) => [0, bird.sheet.shape.svl * 0.00012], frame: 1.5 },
};
export const bodyOf = (sheet) => BODIES[sheet.plan || 'bird'];
// Which way an animal's body lies, seen from above (radians: its nose is towards (cos, sin) in (x, z)): what its
// family says (`bird.heading`), or, for a family that says nothing, read from the way it is turned. The elk's and
// the bear's spacing passed over any body with no heading given, and walked through it (2026-11-16).
export const headingOf = (bird) => bird.heading ?? Math.atan2(2 * (bird.q.x * bird.q.z - bird.q.w * bird.q.y), 1 - 2 * (bird.q.y * bird.q.y + bird.q.z * bird.q.z));

// Where an animal's middle is, [ahead, up] in its own frame: its plan's `middle`, or the default above.
export const middleOf = (bird) => {
  const plan = BODIES[bird.sheet.plan || 'bird'];
  if (plan && plan.middle) return plan.middle(bird);
  return bird.body ? [0, bird.body.high * 0.85] : [0, bird.size * 0.25];
};

// The faults of one kind's file (`file`: its name in life/species/), each named with the file and the field.
export function validate(kind, file) {
  const faults = [];
  if (!kind || typeof kind !== 'object') faults.push('it has no default export that is a table');
  else if (kind.shape === undefined && kind.plan === undefined) check(kind, ONLY_CENSUS, '', faults);
  else if (!Object.hasOwn(BODIES, kind.plan || 'bird')) faults.push(`plan should be one of ${Object.keys(BODIES).join(', ')}${it(kind.plan)}`);
  else check(kind, BODIES[kind.plan || 'bird'].fields, '', faults);
  if (kind && kind.voices !== undefined && kind.way === undefined) faults.push('voices: a kind that says something needs a way to say it in');
  // What one field asks of another (a reviewer's reading, 2026-11-16: each of these passed the tables and then threw,
  // or drew nothing, in the builder or the painter):
  if (kind && kind.shape && typeof kind.shape === 'object') {
    const shape = kind.shape, paint = kind.plumage || {};
    // (an owl's face is built from `shape.disc` and painted from `plumage.disc`: one without the other)
    if (!!shape.disc !== !!paint.disc && (kind.plan || 'bird') === 'bird') faults.push(`${shape.disc ? 'plumage.disc' : 'shape.disc'} is missing: a facial disc is built from shape.disc and painted from plumage.disc`);
    // (a beast's foot is a hoof unless the sheet gives it paws)
    if (kind.plan === 'beast' && !shape.paw) for (const limb of ['fore', 'hind']) if (shape[limb] && !shape[limb].hoof) faults.push(`shape.${limb}.hoof is missing: a limb ends in a hoof unless shape.paw is given`);
  }
  if (kind && typeof kind.key === 'string') {
    const name = kind.key.replace(/-([a-z])/g, (_, c) => c.toUpperCase());
    if (`${name}.js` !== file) faults.push(`key "${kind.key}" belongs in ${name}.js`);
  }
  return faults.map((fault) => `life/species/${file}: ${fault}`);
}
