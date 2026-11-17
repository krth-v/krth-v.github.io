// Willow Flycatcher, Empidonax traillii (the Pacific-slope form, E. t. brewsteri Oberholser 1918, which breeds
// west of the Cascades in Oregon and Washington): the adult in spring. The sexes are alike (Ridgway), and a
// first-spring bird looks like an older one (Unitt: the first basic plumage is definitive).
//
// What is published and what is not. Two sources are used, and they are not of one bird. The wing, the tail and
// the bill's width are Unitt's for 22 adult male brewsteri (the bill from the nostril, which is shorter than an
// exposed culmen, so it is not used as one; only about nine of the 22 skins are from Washington and Oregon, the
// rest from California, Arizona, Baja and Sonora). The exposed culmen, the tarsus, the middle toe and the length
// of a skin are Ridgway's for 20 adult male "traillii" of 1907, which is the western birds before brewsteri was
// named, and the nearest he has: his wing is 71.2 where Unitt's brewsteri is 68.0, so his birds are a little
// larger. The bird is built to Unitt's wing and tail and Ridgway's other means; they are of different samples,
// and the length of the built bird comes out of the two together. Ridgway's own eight males from California and
// Oregon average wing 69.9, tail 57.9, tarsus 16.9, middle toe 9.5, which lie between the two. The colours are
// Ridgway's description of the species, tract by tract; Unitt has brewsteri as a dark brownish olive, with a
// paler cap against a darker back in unworn birds. Whether Ridgway's middle toe is measured with its claw is not
// said; it is built without. The outline of head and body (the flat forehead and the peak at the back of the
// crown, which BirdWeb has in words), where the eye sits, how the folded wing lies, the tail's shape (no source
// read says whether it is square, notched or rounded) and every pose are the agent's drawing, for the owner to
// judge from the contact sheet. No page was seen as an image.
//
// How the sources were read: two agents, one reading and one checking. Unitt through the text layer of the
// journal's PDF (a table read directly), Ridgway through the Internet Archive's character recognition of the
// scan, two scans agreeing; Wikipedia through the page's own wikitext; BirdWeb through a page-text summary.
//
// Reviewed on 2026-11-16 by a second agent, who read BirdWeb's page again ("an almost invisible white eye-ring";
// "the base of the lower mandible is yellow"; it forages "in the shrub layer, or in low trees", watches "from a
// perch", flies out "in quick darts, and return[s] to the perch", and gleans "from twigs and branches as they hover
// in the foliage"; "one of the latest birds to arrive", and "rare along the outer coast"), and changed: the eye ring,
// which had been painted forward of the eye (see `shows`) and as plain as a Pacific-slope's, is now narrow and
// dull; two gaps between rules, which showed the belly's paint as a pale blotch on the side of the neck and a pale
// line across the nape, are closed; the lower mandible's base is yellow.

const R = 'Ridgway 1907, The Birds of North and Middle America, Part IV (U.S. National Museum Bulletin 50), p. 555-556, Empidonax traillii traillii (western birds)';
const U = 'Unitt 1987, "Empidonax traillii extimus: an endangered subspecies", Western Birds 18(3), Table 1, E. t. brewsteri';

export const published = {
  shown: 'adult, spring',
  note: 'Published: the lengths above, and the colours as Ridgway has them for the species (above plain olive, the crown and hindneck very slightly greyer than the back, the rump and upper tail coverts paler and more brownish; wings darker greyish brown, the middle and greater coverts broadly tipped pale olive or pale buffy greyish brown in two bands, the secondaries edged olive-whitish; tail deep greyish brown, edged olive; lores and an indistinct ring round the eye olive-whitish, the lores mixed with dusky; chin and throat white; chest and breast sides pale brownish grey, fading to pale olive on the flanks; the rest below white tinged pale primrose yellow; upper mandible dusky, lower pale brownish or brownish white, lilaceous in life; iris brown; legs dusky). BirdWeb has a flat forehead, a peak at the rear of the crown, a broad bill with a pale lower mandible and an almost invisible white eye ring. Wing and tail are Unitt\'s brewsteri males; the culmen, tarsus, middle toe and length are Ridgway\'s western males, a slightly larger sample (his wing is 71.2). Not found, and the agent\'s: the outline, the tail\'s shape, how far the wing\'s tip reaches over the tail (Unitt gives the wing formula, 10th primary equal to or shorter than the 5th, and no projection in millimetres), the wingspan in a measured source (216 mm is Wikipedia\'s 8.5 inches), how white the wing bars are in the adult. Whether the middle toe was measured with its claw is not said.',
  sources: {
    R: `${R}: 20 adult males, museum skins`,
    U: `${U}: 22 adult males (wing, tail); tail measured from the insertion of the central feathers`,
    W: 'Wikipedia, "Willow flycatcher" (read 2026-11-16, wikitext): 13.2 to 15.2 cm long, 13.5 g, wingspan 8.5 in',
    B: 'Seattle Audubon, BirdWeb, Willow Flycatcher: shrub layer near water; sits on a perch and darts out after insects; late to arrive in spring',
  },
  lengths: [
    ['wing', 'Wing, folded (brewsteri males; Ridgway\'s western males 71.2)', 68, [65.9, 71.2], 'U'],
    ['tail', 'Tail (brewsteri males; Ridgway\'s 58.5)', 58.1, [54.8, 60.7], 'U'],
    ['culmen', 'Exposed culmen (Ridgway\'s western males)', 12.7, [11, 13.5], 'R'],
    ['tarsus', 'Tarsus (Ridgway\'s western males)', 16.8, [15.5, 17.5], 'R'],
    ['midToe', 'Middle toe (Ridgway\'s western males)', 9.7, [9, 10.5], 'R'],
    ['length', 'Length, bill tip to tail tip (skins; Ridgway\'s western males)', 133, [124, 141], 'R'],
    ['span', 'Wingspan (one secondary source)', null, [200, 240], 'W'],
  ],
  proportions: [
    'The tail nearly as long as the wing: 58.1 to 68.0 (Unitt\'s brewsteri means)',
    'One of the larger of the Empidonax flycatchers, with a bill broad at the base: 7.3 mm wide there, 9.5 from the nostril (U)',
  ],
  mass: 'Mass about 13.5 g (W)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]; laid darker than their names read
const BACK = [68, 20, 29], CROWN = [66, 13, 31], RUMP = [64, 20, 35], FACE = [66, 10, 40], LORES = [58, 10, 56], RING = [60, 10, 52];
const THROAT = [54, 8, 82], BREAST = [60, 10, 52], SIDE = [64, 14, 42], FLANK = [62, 20, 58], BELLY = [54, 22, 76], VENT = [52, 34, 76];
const DUSKY = [40, 10, 19], EDGE = [62, 20, 32], BAR = [58, 16, 64], SECEDGE = [58, 14, 60];

const size = (p) => (p.x > 56 ? 1.8 : p.x > 46 ? 2.7 : 4.6);
const head = (p) => p.x > 47;
// Where along the body (mm) a feather picked at p shows. The painter (life/plumage.js) takes a feather's colour from a
// point 3 mm behind the feather's root, and what shows of a feather is its end, the rest lying under the next one
// forward: so a mark made of feathers `size` long shows about 3.4 - size mm forward of where its rule has it (read
// from the painter; on the contact sheet the ring lay over the lores). The head's small marks are tested where they
// will show.
const shows = (p, size) => p.x + 3.4 - size;
// the eye ring: indistinct (R), "almost invisible" (B): a narrow ring of olive-whitish, a little paler than the face
const EYE = [57.8, 6.8];
const ring = (x, y) => { const d = Math.hypot(x - EYE[0], y - EYE[1]); return d > 1.4 && d < 2.45; };

export default {
  name: 'Willow Flycatcher', latin: 'Empidonax traillii', key: 'willow-flycatcher', seed: 179,
  // ---- who is about on a visit (life/species/index.js says what each field is); how it lives on one and its voices are to come
  census: { tier: 'very rare', source: 'B U, and BirdWeb\'s text: rare along the outer coast; it comes late in May' },
  // ---- how it lives on a visit (life/families/sallier.js; the sources are the sheet's and BirdWeb's: willow thickets and
  // brush by water, "in the shrub layer, or in low trees"; it watches from a perch, darts out after an insect and comes
  // back, and gleans from twigs as it hovers in the foliage). Here it keeps to the riverside's willows (the twigs of
  // their upper half, which life/habitat.js does not read: life/families/sallier.js reads them), the low boughs of the
  // trees on the banks and in the clearing, and any stump or log there, from 0.6 to 5 m up and where the air is at
  // least half open. Its song is a sneezed "fitz-bew" and its call a dry "whit"; no recording of either was found that may be
  // used, so both are silent. Every distance, time and chance is the agent's own, the share of its sallies that go to
  // leaves among them (no count of it was found).
  way: {
    family: 'sallier', there: 0.4, gap: [90, 300],
    homeOff: 40, range: 22, reach: 10, apart: 50, need: 3,
    kinds: ['sprig', 'bough', 'stump', 'log'], heights: [0.6, 5], boughs: 5, air: [0.5, 1],
    hz: 22, speed: 6.5, spell: [30, 90], stay: [10, 40],
    flush: 6, startle: 14, near: 0.65, gone: 0.3,
    sally: { every: [5, 16], reach: [1, 3.5], rise: [-0.5, 1.5] }, glean: 0.3, back: 0.8, flick: [3, 9],
    watching: 'sitting upright on a low twig, watching',
    call: { every: [10, 30], time: 0.4, rate: 3, reach: 40, doing: 'calling: a dry "whit"' },
    song: { chance: 0.3, time: 0.9, rate: 3, reach: 50, doing: 'singing: a sneezed "fitz-bew"' },
  },
  // (only CC BY-SA 3.0 recordings of the song were found; the public-domain call is noisy and mixed)
  voices: {
    song: { silent: true },
    call: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 14 cm long and 13 g: a plain, small-headed flycatcher, one of the largest of its kind.',
    marks: ['Olive-brown above, white at the throat, with a faint grey band across the breast', 'Two pale bars on the wing', 'A broad bill with a pale lower half', 'Almost no eye ring, which tells it from its look-alikes'],
    lives: 'Willow thickets and brush by water. It sits upright on a low twig, darts out after an insect and comes back to it. It arrives late in spring; its song is a sneezed "fitz-bew" and its call a dry "whit".',
  },
  plate: { wide: 0.34, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 64
    top:    [[-10, 2], [-3, 7], [6, 11.5], [17, 14.5], [28, 15.5], [38, 15], [46, 14.4], [51, 15.6], [56, 15], [60, 12.8], [62.5, 9.5], [64, 6.2]],
    bottom: [[-11, -1], [-4, -6], [5, -11], [16, -14.5], [27, -14.5], [36, -12.5], [45, -9], [53, -5.2], [59, -2.2], [62.5, 0], [64, 1]],
    half:   [[-11, 2.5], [-4, 7], [5, 11.5], [16, 14], [27, 14.3], [36, 13], [45, 11.8], [53, 10.8], [59, 8.6], [62.5, 5.6], [64, 3.65]],
    widest: 0.46,
    neck: [43, 52],
    eye: { x: 57.8, y: 6.8, r: 1.7 },
    bill: { culmen: 12.7, drop: 0.04, gape: 2 },
    wing: {
      chord: 68, wrist: [40, -1.5], aim: [-66.5, 6],
      up:   [[0, 2], [0.12, 8], [0.3, 10], [0.5, 9], [0.72, 6], [0.9, 3], [1, 0.8]],
      down: [[0, 1.5], [0.12, 5], [0.3, 6.6], [0.5, 6.6], [0.72, 5], [0.9, 2.8], [1, 0.8]],
      rest: 2.1, proud: 1.1,
      span: 216, shoulder: [37, 6.5, 10.5], arm: 27, lead: 6, sweep: 14, root: 50, tipChord: 20,
    },
    // the agent's: a little rounded, the feathers long and broad
    tail: { length: 58.1, root: 0.9, rootHalf: 2.6, feathers: 12, width: 6.6, closed: 0.035, graded: 2, point: 0.55, droop: 0.03, tent: 4 },
    leg: { knee: [25, -9, 7], shin: 14, tarsus: 16.8, thick: [3, 1.3, 0.8], toes: { mid: 9.7, side: 7.2, hind: 7, claw: 3.8, hindClaw: 4.8 }, splay: 0.55 },
  },
  poses: {
    // upright on a bare twig, the tail hanging
    perched: { pitch: 0.8, lift: 0.4, head: { pitch: 0.1 }, tail: { pitch: -0.3, fan: 0.02 }, feet: { mode: 'grip', round: 0.0035 }, perch: 0.0035 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.22 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: BELLY, size },                                                                      // the rest of the underparts white, tinged pale primrose (R)
      { where: (p) => p.a < 0.22 && p.x < 28, colour: VENT, size: 4.6 },                            // the tinge most on the flanks, vent and under tail coverts (R)
      { where: (p) => p.a > 0.2 && p.a < (p.x > 26 ? 0.48 : 0.58) && p.x < 40, colour: FLANK, size: 4.6 },   // pale olive on the flanks (R)
      { where: (p) => p.a < 0.52 && p.x >= 32 && p.x < 56, colour: BREAST, size: 2.8 },             // chest and breast sides pale brownish grey (R)
      { where: (p) => p.a < 0.42 && p.x >= 53, colour: THROAT, size: 1.9 },                         // chin and throat white (R)
      { where: (p) => p.x >= 26 && p.x <= 48 && p.a >= 0.48 && p.a < 0.6, colour: SIDE, size: 3 },   // the side of the neck and of the breast over the wing's bend, between the back and the breast (no rule painted it: the belly's paint showed there)
      { where: (p) => p.a >= 0.58 && p.x <= 47.5, colour: BACK, size },                             // above plain olive, dark brownish in brewsteri (R, U)
      { where: (p) => p.a >= 0.58 && p.x < 10, colour: RUMP, size: 4.6 },                           // rump and upper tail coverts paler, more brownish (R)
      { where: (p) => head(p) && p.a >= 0.42 && p.a < 0.66, colour: FACE, size: 1.9 },              // sides of the head a little paler and greyer than the back (R)
      { where: (p) => head(p) && p.a >= 0.62, colour: CROWN, size: 2.2 },                           // crown and hindneck very slightly greyer than the back (R)
      { where: (p) => shows(p, 1.5) > 60.4 && p.y > 3.6 && p.y < 9 && p.a >= 0.46 && p.a < 0.72, colour: LORES, size: 1.5 },   // lores olive-whitish (R)
      { where: (p) => { const x = shows(p, 1.5); return x > 59.2 && x <= 60.4 && p.y > 4 && p.y < 9 && p.a >= 0.46; }, colour: [52, 10, 34], size: 1.5 },   // mixed with dusky next the eye (R)
      { where: (p) => p.a >= 0.45 && p.a < 0.85 && ring(shows(p, 1.2), p.y), colour: RING, size: 1.2 },   // an indistinct ring round the eye (R), "almost invisible" (B)
    ],
    wing: {
      web: DUSKY, edge: EDGE, tertial: [40, 10, 21], covert: [40, 10, 21], lesser: BACK, lesserEdge: [66, 18, 36],
      medianTip: [BAR, 0.26], greaterTip: [BAR, 0.2],            // middle and greater coverts broadly tipped pale olive or buffy grey: two bands (R)
      patchSkip: 0,
      primaryBars: [],
      secondaryBars: [[0.42, 0.95, SECEDGE, 'edge']],            // secondaries edged olive-whitish (R)
      tertialTip: null, tertialBars: [[0.35, 0.95, SECEDGE, 'edge']],
      under: [54, 18, 60], underCovert: [54, 30, 72], underCovertTip: null, underBars: [],   // axillars and under wing coverts pale primrose (R)
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.7, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 6, shape: [0.6, 0.86, 0.97, 1, 1, 1, 1, 0.98, 0.96] },
    },
    tail: { web: DUSKY, edge: EDGE, under: [40, 8, 34], point: 0.45 },                           // deep greyish brown, the outer webs olive (R)
    bill: { upper: [30, 14, 14], lower: [32, 22, 58], lowerBase: [[46, 52, 60], 0.55] },         // upper dusky, lower pale brownish (R), its base yellow (B)
    mouth: [14, 50, 55],
    eye: { iris: [25, 40, 13], pupil: [240, 15, 5] },                                            // iris brown (R)
    leg: [30, 10, 17],                                                                           // dusky brown (R)
    shin: [30, 8, 20],
  },
};
