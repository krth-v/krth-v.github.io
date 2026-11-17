// Pacific-slope Flycatcher, Empidonax difficilis difficilis (Ridgway's "Western Flycatcher", the Pacific-slope
// form, now lumped as the Western Flycatcher): the adult in spring. The sexes are alike in colour (Ridgway).
//
// What is published and what is not. The lengths under `published` are Ridgway's for 21 adult males of the form
// (pooled over the Rocky Mountain district, California, the Santa Barbara Islands and coastal Alaska: his table
// has no Washington or Olympic row), and the bird is built to their means; life/measure.js measures the built
// bird against them. The colours follow his description tract by tract. The eye ring's teardrop shape is from
// BirdWeb and Wikipedia, not from Ridgway. The outline of head and body, where the eye sits, how the folded wing
// lies, the wingspan and the upright stance of the perched pose are in nothing that was read: they are the
// agent's drawing, for the owner to judge from the contact sheet.
//
// Reviewed on 2026-11-16 by a second agent, who read BirdWeb's page and Wikipedia's ("Western flycatcher") again
// through a tool that answers from a page's text: "yellow extending up to the throat", "the lower mandible is
// yellow", "a conspicuous teardrop-shaped white eye ring", "a small bill", and of how it feeds, "watches from a
// perch in the lower or middle canopy, and flies out to catch prey in the air" and "will also pluck insects from
// foliage while hovering". The eye ring and the lores had been painted forward of the eye (see `shows`); the throat
// and the lower mandible are now as yellow as those lines have them.
//
// How the sources were read: one agent reading and one checking, Ridgway through the archive.org full-text
// character recognition of the scan (the page numbers were not seen), the others as stripped page text. No page
// was seen as an image. The checker confirmed every length and every colour of Ridgway's below; the Animal
// Diversity Web, BirdWeb and Wikipedia lines were not checked by it.

const R = 'Ridgway 1907, The Birds of North and Middle America, Part IV (U.S. National Museum Bulletin 50), p. 577, Empidonax difficilis difficilis';

export const published = {
  shown: 'adult (the sexes alike)',
  note: 'Published: the lengths above, and the colour of each tract as Ridgway has it (above plain brownish olive, varying to greyish olive; a broad orbital ring of pale buffy yellow or yellowish white, narrower but scarcely broken over the eye; lores pale yellowish or dull yellowish white, suffused with dusky; the rest of the side of the head like the back, fading below into the pale straw yellow or dull greyish yellowish white of chin and throat; chest and sides pale buffy olive, fading towards the flanks; the rest of the underparts pale (primrose to straw) yellow; wings dusky, the middle and greater coverts broadly tipped pale greyish olive, greyish buff or olive-buff, which makes two distinct bars, the secondaries edged with the same, the primaries greyish brown and narrowly edged paler; tail greyish brown, the outer webs of the feathers passing into light greyish olive on the edges; upper mandible brownish black, lower wholly yellowish in life; iris brown; legs dusky brown to brownish black). The ring\'s teardrop shape is from BirdWeb and Wikipedia. Not found in what was read, and the agent\'s: the outline, any separate colour for the crown, rump or tail coverts (the crown is painted as the back), the shape of the tail, the wingspan (the Animal Diversity Web\'s "60 to 70 mm" is the folded wing, and was not used), the wingbeat and the perched posture. The Cornell Lab\'s pages could not be read. Ridgway\'s middle toe is not said to be without its claw (probably it is). The checker could not tell, from the scan\'s columns, which of his regional rows is which, so the pooled figures of 21 males are used; one regional wing is printed 60.5 where 69.5 was probably meant. A crest is not in Ridgway; BirdWeb has a slight one for the family, and none is built.',
  sources: {
    R: `${R}: 21 adult males, museum skins (https://archive.org/details/birdsnorthandmi01friegoog, full-text character recognition)`,
    D: 'Animal Diversity Web, Empidonax difficilis (https://animaldiversity.org/accounts/Empidonax_difficilis/): 14 to 17 cm long, 9 to 12 g; a relatively large head; not checked by a second reader',
    B: 'Seattle Audubon, BirdWeb, Western Flycatcher (https://www.birdweb.org/birdweb/bird/western_flycatcher): a broad bill with a yellow lower mandible; a teardrop eye ring; yellow up to the throat; watches from a perch in the lower or middle canopy and flies out after insects (read again by a second agent, 2026-11-16)',
    W: 'Wikipedia, "Western flycatcher" (read 2026-11-16 through a tool that answers from the page\'s text): a conspicuous teardrop-shaped white eye ring; a small bill; plucks insects from foliage while hovering; the song "pseet, ptsick, seet"',
  },
  lengths: [
    ['wing', 'Wing, folded', 67.5, [62.5, 72], 'R'],
    ['tail', 'Tail', 57.1, [52, 62.5], 'R'],
    ['culmen', 'Exposed culmen', 11.8, [10.5, 13], 'R'],
    ['tarsus', 'Tarsus', 17.3, [16, 18], 'R'],
    ['midToe', 'Middle toe (not said whether with its claw)', 8.9, [8.5, 10], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 127, [117, 133], 'R'],
  ],
  proportions: [
    'The tail 85 % of the wing (57.1 to 67.5: worked out from Ridgway\'s means); his genus has it more than four fifths of the wing, even or slightly notched',
    'Longest primaries exceed the longest secondaries by about the tarsus (his genus; built to it, not measured)',
    'Bill broad and flat at the base, about half as long as the head, tip hooked (his genus, and BirdWeb: "a broad bill")',
    'Head relatively large for the body (D); feet small (B, family text)',
  ],
  mass: 'Mass 9 to 12 g (D); no wingspan was found',
};

// Ridgway's colours, as paint: [hue, saturation, lightness] (each darker than its name reads)
const OLIVE = [58, 20, 30], CHEEK = [56, 16, 36], FADE = [54, 20, 44], BUFF = [50, 22, 44], THROAT = [52, 42, 62], BELLY = [51, 52, 58];
const RING = [50, 28, 74], LORE = [52, 16, 50], DUSKY = [40, 10, 19], COV = [46, 12, 22], EDGE = [54, 22, 38], BAR = [46, 22, 62];

const size = (p) => (p.x > 50 ? 1.9 : p.x > 42 ? 2.6 : 4.6);
const head = (p) => p.x > 38;
// Where along the body (mm) a feather picked at p shows. The painter (life/plumage.js) takes a feather's colour from a
// point 3 mm behind the feather's root, and what shows of a feather is its end, the rest lying under the next one
// forward: so a mark made of feathers `size` long shows about 3.4 - size mm forward of where its rule has it (read
// from the painter; on the contact sheet the ring, drawn where its rule said, lay over the lores and the eye had
// only a crescent behind it). The head's small marks are tested where they will show.
const shows = (p, size) => p.x + 3.4 - size;
// The eye ring: broad, "narrower but scarcely interrupted on middle of upper eyelid" (R), and drawn out behind the
// eye into a point, a teardrop (B, W). How broad, and how long the point, are the agent's.
const EYE = [51.4, 6.6];
const ring = (x, y) => {
  const dx = x - EYE[0], dy = y - EYE[1];
  if (Math.hypot(dx, dy) < (dy > 0 ? 2.45 : 3.1)) return true;
  return dx < 0 && dx > -5.8 && Math.abs(dy + 0.3) < 2.6 * (1 + dx / 5.8);
};

export default {
  name: 'Pacific-slope Flycatcher', latin: 'Empidonax difficilis', key: 'pacific-slope-flycatcher', seed: 103,
  // ---- who is about on a visit (life/species/index.js says what each field is); how it lives on one and its voices are to come
  census: { tier: 'most', source: 'B F; now the Western Flycatcher; "the only commonly found Empidonax" of the wet outer-coast forest', mean: 2.2 },
  // ---- how it lives on a visit (life/families/sallier.js says what was read of how the two Empidonax of these woods
  // feed: in May most of what they take is picked off leaves as they hover, and the rest from the air). It keeps to the
  // lower and middle levels of the shady wood (B): here from 1.6 to 8 m, on the stubs of broken limbs, the tops of
  // stumps and the boughs of the trees, the boughs no higher than 6 m, where a walker can see it among their leaves
  // ("Learned in milestone 4"). Its song is the male's "pseet, ptsick, seet" (W), its call a thin "suweet" (B); no
  // recording of either was found that may be used, so both are silent. Every distance, time and chance is the
  // agent's own, as is the wing and tail flick, which the sources give the Empidonax; the share of its sallies that
  // go to leaves is Sakai and Noon's for the Western Flycatcher before incubation (121 of 142 attacks), less where no
  // bough's tip is in reach.
  way: {
    family: 'sallier', there: 0.55, gap: [60, 240],
    homeOff: 14, range: 16, reach: 12, apart: 40, need: 3,
    kinds: ['stub', 'stump', 'log', 'bough'], heights: [1.6, 8], boughs: 6, air: [0, 0.7],
    hz: 20, speed: 6.5, spell: [25, 90], stay: [15, 50],
    flush: 6, startle: 14, near: 0.7, gone: 0.2,
    sally: { every: [5, 18], reach: [1.2, 4.5], rise: [-1, 2] }, glean: 0.85, back: 0.65, flick: [2.5, 8],
    watching: 'perched upright, watching for insects',
    call: { every: [10, 30], time: 0.5, rate: 3, reach: 40, doing: 'calling: a thin, upslurred "suweet"' },
    song: { chance: 0.35, time: 1.2, rate: 3, reach: 50, doing: 'singing: "pseet, ptsick, seet"' },
  },
  // (no recording was found under a licence that may be used: the only one is CC BY-SA 4.0, of a call)
  voices: {
    song: { silent: true },
    call: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 14 to 17 cm long and 9 to 12 g: a small, plain flycatcher.',
    marks: ['Olive-brown above, with a pale teardrop ring round the eye', 'Two pale bars on the wing', 'Yellowish below, to the throat', 'A broad bill, the lower half yellow'],
    lives: 'Damp, shady woods and streamsides, in the middle and lower levels. It sits upright on a twig, watching, then flies out to snatch an insect from the air and comes back to a perch; it also hovers at leaves. It is hard to see, but easy to know by its call, a thin upslurred "suweet".',
  },
  plate: { wide: 0.34, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 58
    top:    [[-9, 2], [-3, 5], [6, 9], [16, 11.8], [26, 12.8], [34, 12.6], [40, 12.6], [45, 14.2], [50, 14.8], [55, 12], [57.2, 7.6], [58, 4.2]],
    bottom: [[-11, -1], [-4, -5], [5, -9.4], [15, -12.4], [25, -13], [33, -12], [40, -9.6], [47, -6.2], [53, -2.8], [58, 0.6]],
    half:   [[-11, 2.4], [-4, 6], [5, 9.5], [15, 11.5], [25, 12], [33, 11], [40, 10.4], [46, 11.2], [51, 9.8], [55, 6.2], [58, 3.5]],
    widest: 0.47,
    neck: [37, 47],
    eye: { x: 51.4, y: 6.6, r: 1.7 },
    bill: { culmen: 11.8, drop: 0.06, gape: 2.4 },
    wing: {
      chord: 67.5, wrist: [40, -1.6], aim: [-66, 5],
      up:   [[0, 2], [0.12, 7.6], [0.3, 9], [0.5, 8], [0.72, 5], [0.9, 2.2], [1, 0.6]],
      down: [[0, 1.4], [0.12, 4.3], [0.3, 6], [0.5, 6.1], [0.72, 4.5], [0.9, 2.5], [1, 0.6]],
      rest: 2, proud: 1,
      span: 215, shoulder: [38.5, 5.8, 9.4], arm: 27, lead: 6, sweep: 14, root: 48, tipChord: 20,
    },
    // even, or a little notched (Ridgway's genus); the agent's choice of the notch
    tail: { length: 57.1, root: 0.9, rootHalf: 2.5, feathers: 12, width: 6.4, closed: 0.035, graded: -1, point: 0.5, droop: 0.03, tent: 4 },
    leg: { knee: [24, -7.6, 5.4], shin: 11.5, tarsus: 17.3, thick: [2.6, 1.1, 0.66], toes: { mid: 8.9, side: 6.7, hind: 6.5, claw: 3.4, hindClaw: 4.6 }, splay: 0.55 },
  },
  poses: {
    // upright on a twig, the tail hanging
    perched: { pitch: 0.92, lift: 0.42, head: { pitch: 0.2 }, tail: { pitch: -0.3, fan: 0.02 }, feet: { mode: 'grip', round: 0.004 }, perch: 0.004 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.25 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: BELLY, size },                                                                  // the rest of the underparts pale primrose to straw yellow (R)
      { where: (p) => p.a > 0.28 && p.a < 0.6 && p.x < 40, colour: BUFF, size: 4.4 },           // chest and sides pale buffy olive, fading towards the flanks (R)
      { where: (p) => p.a >= 0.28 && p.a < 0.6 && p.x < 12, colour: FADE, size: 4.6 },
      { where: (p) => p.x > 40 && p.x <= 50 && p.a < 0.5, colour: BUFF, size: 2.8 },            // across the chest
      { where: (p) => p.x > 50 && p.a < 0.45, colour: THROAT, size: 2.2 },                      // chin and throat pale straw yellow (R, B)
      { where: (p) => p.x <= 4 && p.a < 0.28, colour: [52, 36, 66], size: 5 },                  // under tail coverts pale yellow: no colour of their own in R
      { where: (p) => p.a >= 0.6 && p.x <= 40, colour: OLIVE, size },                           // above plain brownish olive (R)
      { where: (p) => head(p) && p.a >= 0.45 && p.a < 0.6, colour: FADE, size: 2.2 },           // the side of the head like the back, fading below into the throat (R)
      { where: (p) => head(p) && p.a >= 0.6, colour: OLIVE, size: 2 },
      { where: (p) => p.x > 41 && p.x <= 50 && p.a >= 0.4 && p.a < 0.6, colour: CHEEK, size: 2 },
      { where: (p) => shows(p, 1.6) > 53.4 && p.y > 2.6 && p.y < 9.4 && p.a > 0.3 && p.a < 0.8, colour: LORE, size: 1.6 },   // lores pale yellowish, suffused with dusky (R)
      { where: (p) => p.a > 0.3 && p.a < 0.85 && ring(shows(p, 1.5), p.y), colour: RING, size: 1.5 },          // a broad ring of pale buffy yellow, a teardrop (R, B, W)
    ],
    wing: {
      web: DUSKY, edge: EDGE, tertial: COV, covert: COV, lesser: OLIVE, lesserEdge: [58, 20, 36],
      medianTip: [BAR, 0.18], greaterTip: [BAR, 0.16],          // middle and greater coverts broadly tipped pale greyish olive: two distinct bars (R)
      patchSkip: 0,
      primaryBars: [],                                        // primaries greyish brown, narrowly and indistinctly edged paler (R): the edging
      secondaryBars: [[0.5, 0.95, EDGE, 'edge']],              // secondaries edged, except at the base, like the bars (R)
      tertialTip: null, tertialBars: [[0.5, 0.95, EDGE, 'edge']],
      under: [50, 26, 52], underCovert: [52, 44, 64], underCovertTip: null, underBars: [],      // axillars and under wing coverts pale primrose yellow (R)
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.72, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 6, shape: [0.58, 0.84, 0.96, 1, 1, 1, 1, 0.98, 0.96] },
    },
    tail: { web: [38, 10, 21], edge: [54, 20, 38], under: [40, 8, 34], point: 0.4 },            // tail greyish brown, the outer webs passing into light greyish olive (R)
    bill: { upper: [32, 14, 12], lower: [44, 62, 56] },                                         // upper brownish black, lower wholly yellowish in life (R), "yellow" (B)
    mouth: [20, 60, 50],
    eye: { iris: [24, 40, 12], pupil: [240, 15, 5] },                                           // iris brown (R)
    leg: [28, 16, 17],                                                                          // dusky brown to brownish black (R)
    shin: [28, 14, 22],
  },
};
