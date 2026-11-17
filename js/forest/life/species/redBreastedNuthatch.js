// Red-breasted Nuthatch, Sitta canadensis: the adult male in spring. The female has the crown and the stripe
// through the eye slate where his are black, and is a little paler below (Ridgway).
//
// What is published and what is not. The lengths under `published` are Ridgway's for 22 adult males, and the
// bird is built to their means; life/measure.js measures the built bird against them. The colours follow his
// description tract by tract. The outline of head and body, where the eye sits and how the folded wing lies
// are in nothing that was read: they are the agent's drawing, for the owner to judge from the contact sheet.
//
// How the sources were read: two agents, one reading and one checking, each through a tool that returns a
// summary of the scan's character recognition. No page was seen as an image. The culmen's range was printed
// "18.5-17.5", which cannot be: only its mean is used.

const R = 'Ridgway 1904, The Birds of North and Middle America, Part III (U.S. National Museum Bulletin 50), Sitta canadensis, p. 451';

export const published = {
  shown: 'adult male, spring',
  note: 'Published: the lengths above, and the colour of each tract as Ridgway has it (crown and hindneck black; a broad white stripe over the eye and a black one through it; white below the eye; back, rump, coverts and tertials bluish grey; flight feathers dull slate with grey edgings; the tail\'s middle pair grey, the rest black with grey tips, the outer two or three with a white band near the tip; chin dull white, deepening to tawny buff below; bill black above, pale grey below; iris brown). Not found in what was read, and the agent\'s: the tail\'s shape, the outline, how deep the buff is on the breast. Whether the middle toe was measured with its claw is not said; it is built without.',
  sources: {
    R: `${R}: 22 adult males, museum skins, from the whole of its range (he saw no difference between eastern and western birds)`,
    W: 'Wikipedia, "Red-breasted nuthatch" (read 2026-11-16): wingspan 8.5 in and mass 9.9 g, credited there to Sibley',
    B: 'Seattle Audubon, BirdWeb, Red-breasted Nuthatch: how it climbs, what it eats, that it comes boldly close to people',
  },
  lengths: [
    ['wing', 'Wing, folded', 68.2, [66.5, 70], 'R'],
    ['tail', 'Tail', 37.2, [35.5, 39], 'R'],
    ['culmen', 'Culmen (its range was not legible in the scan)', 14.6, ['?', '?'], 'R'],
    ['tarsus', 'Tarsus', 16.1, [15, 17], 'R'],
    ['midToe', 'Middle toe', 12, [11, 13], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 107, [100, 116], 'R'],
    ['span', 'Wingspan (one secondary source)', 216, [216, 216], 'W'],
  ],
  proportions: [
    'The tail short: about 55 % of the wing (37.2 to 68.2: worked out from Ridgway\'s means)',
    'The tarsus a little longer than the middle toe; the culmen shorter than the tarsus',
    'BirdWeb: compact, with a short tail, a long solid bill, and long strong toes and claws',
  ],
  mass: 'Mass 9.9 g (W)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]
const BLACK = [222, 16, 10], WHITE = [45, 16, 91], GREY = [212, 22, 40], BUFF = [24, 62, 48], FLANK = [22, 64, 42];
const PALE = [30, 52, 66], CHIN = [40, 20, 86], SLATE = [215, 12, 26];

// feathers are small on the head
const size = (p) => (p.x > 44 ? 2 : p.x > 38 ? 2.8 : 4.6);
const head = (p) => p.x > 40.5;

export default {
  name: 'Red-breasted Nuthatch', latin: 'Sitta canadensis', key: 'red-breasted-nuthatch', seed: 71,
  // ---- who is about on a visit, how it lives on one and what it says (life/species/index.js says what each is)
  census: { tier: 'most', source: 'B C; P regular' },
  way: {
    family: 'trunk', there: 0.6, gap: [30, 150],
    // how it works a trunk (what life/families/trunk.js reads)
    // (it keeps to the lower trunk, under the boughs: higher, a bird as long as a finger is not seen from the walk)
    hz: 16, speed: 7, range: 26, low: 1, high: 6.5, start: [0.55, 1], quota: [2, 4], stay: [18, 50],
    suits: (t) => t.top > 5,
    // how near it lets the walker come (life/behave.js): nearer than `flush` metres (further for one who runs), or
    // a sudden movement of theirs within `startle`, and it is off, to a trunk clear of them `near` of the times and
    // otherwise out of sight, for good `gone` of those (the agent's own: it is often tame)
    flush: 2.5, startle: 6, near: 0.75, gone: 0.25,
    step: [0.02, 0.04], beat: 0.1, run: [3, 8],
    // mostly head first down the trunk; now and then sideways, or back up
    bear: (r) => { const k = r(); return k < 0.68 ? Math.PI + (r() - 0.5) * 1.3 : k < 0.86 ? (r() < 0.5 ? 1 : -1) * (Math.PI / 2 + (r() - 0.5) * 0.5) : (r() - 0.5) * 0.9; },
    moving: (bearing) => (Math.cos(bearing) < -0.4 ? 'going down the trunk head first' : Math.cos(bearing) > 0.4 ? 'walking up the trunk' : 'walking round the trunk'),
    probing: 'probing a crack in the bark', resting: 'clinging head down, its head held out',
    work: { chance: 0.18, time: [1.2, 3], rate: 5, doing: 'hammering at something wedged in the bark', reach: 12 },
    call: { every: [7, 26], time: 1.8, rate: 3.3, reach: 80, doing: 'calling: a nasal yank, yank, yank' },
    // a trunk within sixteen metres of the walk, and then any within twenty-two metres of that
    home: (habitat, r) => { const near = habitat.trunks.filter((t) => t.off < 16 && t.top > 5); return near.length ? near[Math.floor(r() * near.length)] : null; },
    spot: (home, r, habitat) => { const near = habitat.trunksNear(home.foot.x, home.foot.z, 22).filter((t) => t.off < 18 && t.top > 5); return near.length ? near[Math.floor(r() * near.length)] : home; },
  },
  voices: {
    call: { file: 'nuthatch.mp3', level: 0.45, near: 5,
      credit: { what: 'Red-breasted Nuthatch, call', by: 'J. Job, U.S. National Park Service (Rocky Mountain National Park sound library), 2016', licence: 'Public domain',
        source: 'https://www.nps.gov/nps-audiovideo/legacy/mp3/imr/avElement/romo-RBNUROMO5262016BlackCanyonTrail.mp3', bytes: 317848, kept: 1.85 } },
    // (made in the page: a bill on wood is a knock, and a roll of knocks)
    knock: { synth: 'knock', level: 0.1, near: 3, pitch: 1900 },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 11 cm long and 10 g: a small, short-tailed bird with a long bill.',
    marks: ['A black cap, a white stripe over the eye and a black one through it', 'Blue-grey above, rust below', 'It goes down a trunk head first', 'This is a male; her cap is grey'],
    lives: 'The trunks and big limbs of conifers, where it walks up, down and sideways without propping itself on its tail, probing the bark and wedging seeds into it to hammer open. Its call is a nasal "yank, yank", like a toy tin horn. Often tame.',
  },
  plate: { wide: 0.36, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 55.5
    top:    [[-9, 1.8], [-3, 4.6], [6, 8], [17, 10.4], [28, 11.2], [37, 10.9], [43, 10.8], [47.5, 11.2], [51, 10.2], [53.6, 7.8], [55, 5.4], [55.5, 3.9]],
    bottom: [[-11, -1], [-4, -5], [5, -9.6], [16, -12.6], [27, -13], [36, -11], [43, -7.8], [48.5, -4.2], [52.5, -1.2], [55.5, 0.4]],
    half:   [[-11, 2.4], [-4, 6.4], [5, 10.4], [16, 12.6], [27, 12.9], [36, 11.6], [42, 10], [47, 9.4], [51, 7.6], [53.8, 4.6], [55.5, 1.75]],
    widest: 0.46,
    neck: [38, 47],
    eye: { x: 48.6, y: 5.5, r: 1.5 },
    bill: { culmen: 14.6, drop: 0, gape: 2 },
    wing: {
      chord: 68.2, wrist: [36, -1.5], aim: [-66, 5],
      // long for the bird: its tip is nearly at the tail's (the agent's, from the two lengths)
      up:   [[0, 2], [0.12, 8], [0.3, 9.6], [0.5, 8.2], [0.7, 5.4], [0.88, 2.6], [1, 0.6]],
      down: [[0, 1.5], [0.12, 4.6], [0.3, 6.6], [0.5, 6.6], [0.7, 4.8], [0.88, 2.6], [1, 0.6]],
      rest: 2.2, proud: 1.2,
      span: 216, shoulder: [34, 6, 9], arm: 30, lead: 6, sweep: 16, root: 50, tipChord: 19,
    },
    tail: { length: 37.2, root: 0.8, rootHalf: 2.6, feathers: 12, width: 6.6, closed: 0.04, graded: 2.5, point: 0.85, droop: 0.03, tent: 4 },
    leg: { knee: [23, -7.5, 6], shin: 11, tarsus: 16.1, thick: [2.8, 1.2, 0.72], toes: { mid: 12, side: 9, hind: 9.5, claw: 5.5, hindClaw: 8 }, splay: 0.6 },
  },
  poses: {
    // on a trunk: +x is the way it faces along the bark (down it, as often as not) and +y out of it. The body
    // lies along the bark and the head is held out from it; the tail is no prop.
    perched: { pitch: 0.08, lift: 0.3, lean: 0.004, droop: 0.04, head: { pitch: 0.45 }, tail: { pitch: 0.04, fan: 0.03 }, feet: { mode: 'flat', width: 0.012, ahead: 0.004, toeOut: 0.6 }, board: true },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.3 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: BUFF, size },                                                                   // underparts tawny-buff or dull ochraceous-buff (R)
      { where: (p) => p.a > 0.16 && p.a < 0.55 && p.x < 34, colour: FLANK, size: 4.8 },         // deepest on the flanks (R)
      { where: (p) => p.x <= 3 && p.a < 0.5, colour: PALE, size: 5 },                           // the longer under tail coverts paler buff (R)
      { where: (p) => p.x > 37 && p.x <= 44 && p.a < 0.45, colour: PALE, size: 2.8 },           // pale buff on the lower throat (R)
      { where: (p) => p.x > 44 && p.a < 0.45, colour: CHIN, size: 2 },                          // chin and upper throat a duller white (R)
      { where: (p) => p.a >= 0.58, colour: GREY, size },                                        // back, scapulars, rump and upper tail coverts uniform bluish grey (R)
      { where: (p) => head(p) && p.y > 0.4 && p.y <= 4.1, colour: WHITE, size: 2 },             // white below the eye: the lower ear coverts and the lower sides of the neck (R)
      { where: (p) => (head(p) && p.y > 4.1 && p.y <= 6.7) || (p.x > 36 && p.x <= 43 && p.y > 2.6 && p.y <= 7.2), colour: BLACK, size: 2 },      // a black stripe through the eye, broader over the sides of the neck (R)
      { where: (p) => head(p) && p.y > 6.7 && p.y <= 8.4 + (55.5 - p.x) * 0.02, colour: WHITE, size: 2 },                                        // a broad white stripe from the sides of the forehead to the sides of the nape (R)
      { where: (p) => p.x > 38 && p.y > 8.4 + (55.5 - p.x) * 0.02, colour: BLACK, size: 2.2 },  // crown and hindneck uniform black (R)
    ],
    wing: {
      web: SLATE, edge: [212, 18, 46], tertial: [212, 22, 41], covert: GREY, lesser: GREY, lesserEdge: [212, 20, 50],   // flight feathers dull slate with grey edgings; coverts and tertials as the back (R)
      medianTip: null, greaterTip: null, patchSkip: 0, primaryBars: [], secondaryBars: [], tertialTip: null,
      under: [215, 8, 40], underCovert: [215, 8, 56], underCovertTip: null, underBars: [],      // under the wing: not described in what was read; grey here
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.7, greater: 7, greaterEnd: 0.4, median: 6, medianEnd: 0.23 },
      spread: { primaries: 9, secondaries: 6, shape: [0.6, 0.85, 0.97, 1, 1, 1, 1, 0.98, 0.96] },
    },
    // the middle pair bluish grey, the rest black with grey tips; the two or three outermost with a white band near the tip (R); how large: the agent's
    tail: { web: [222, 12, 12], middle: GREY, edge: [215, 12, 22], under: [215, 8, 24], tip: [[5, WHITE, 0.2], [4, WHITE, 0.16], [3, WHITE, 0.1]], point: 0.5 },
    bill: { upper: [220, 10, 12], lower: [220, 8, 22], lowerBase: [[210, 14, 60], 0.6] },      // upper mandible black; the lower dusky at the tip, pale bluish grey behind (R)
    mouth: [350, 30, 40],
    eye: { iris: [22, 40, 13], pupil: [240, 15, 5] },                                           // iris brown (R)
    leg: [30, 14, 24],                                                                          // horn colour or dusky in skins (R)
    shin: [26, 44, 54],
  },
};
