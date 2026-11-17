// Fox Sparrow, Passerella iliaca: the dark coastal "Sooty" form, P. i. fuliginosa, the adult male in spring.
//
// What is published and what is not. The lengths under `published` are Ridgway's for eight adult male skins
// of P. i. fuliginosa, and the bird is built to their means; life/measure.js measures the built bird against
// them. His text for this form is a comparison with the Townsend's form (darker, less rufescent, the spots
// below larger, blacker and more crowded), so the colours are those of the Townsend's form's description
// darkened as he says, tract by tract. Not described for these dark forms in what was read, and the agent's:
// the forehead, the nape, the wing coverts, wing bars (none are painted) and flight-feather edgings, any
// tail pattern, how many spots the underparts have and where, the colour of the bill and legs in life. Which
// form passes through the Olympic lowlands in spring was not found: the sources name only the Sooty group
// (BirdWeb: abundant in winter in western Washington, an uncommon local breeder on the outer coast), and this
// is the nearest named race. Ridgway's text is not season-specific, so "in spring" is not from a source. The
// outline of head and body, where the eye sits and how the folded wing lies are the agent's drawing, for the
// owner to judge from the contact sheet.
//
// How the sources were read: Ridgway through the Internet Archive scan's character recognition (one reading
// by one agent, checked by a second); BirdWeb, the Audubon Field Guide and the Animal Diversity Web as page
// text. No page was seen as an image. Cornell's pages were refused and Birds of the World is paywalled: neither
// was read.

const R = 'Ridgway 1901, The Birds of North and Middle America, Part I (U.S. National Museum Bulletin 50), Passerella iliaca fuliginosa, p. 394';

export const published = {
  shown: 'adult male (Sooty form), spring',
  note: 'Published: the lengths above, and the colour of each tract as Ridgway describes the Townsend\'s form with the Sooty form\'s differences (upper parts, sides of head and neck and the flanks dark sepia brown; upper tail coverts and tail more rufescent, between sepia and Vandyke brown; under parts white, everywhere spotted with deep chestnut or Vandyke brown in triangular spots, very heavy and nearly confluent on the chest, smaller on the throat and breast, larger, blacker and more crowded than in the Townsend\'s form; under tail coverts olive-brown broadly margined with buffy; iris brown; the upper mandible dusky and the lower yellowish; legs brownish). BirdWeb: the head not striped, the face plain, a yellow lower mandible. Not found in what was read, and the agent\'s: forehead, nape, wing coverts and their edgings (painted as a rusty brown a little redder than the back, with no bars), tail pattern, where the spots are and how many, the culmen\'s upper value (the scan prints "1170", which is below the mean, so it is dropped), whether the middle toe was measured with its claw (his genus text says the toe with its claw about equals the tarsus, which a toe of 17.3 mm against a tarsus of 25.9 does not: read here as without the claw), the wingspan of this form, and the posture. Built from Ridgway: the hind toe about as long as the middle toe, with its claw.',
  sources: {
    R: `${R}: 8 adult male skins (one adult female: wing 77.47, tail 72.39, culmen 10.67, tarsus 25.15, length 160.02)`,
    A: 'Audubon Field Guide, Fox Sparrow (from Kaufman): wingspan 10.6 to 11.8 in; "darker sooty brown in Pacific northwest", a reddish tail on most forms, an often two-toned bill',
    D: 'Animal Diversity Web, Passerella iliaca: wingspan 26.67 to 29.85 cm for the species (not read by the second reader from the page itself)',
    B: 'Seattle Audubon, BirdWeb, Fox Sparrow: a large, chunky sparrow; the head not striped, the face plain; the lower mandible yellow; scratches in the litter with both feet',
  },
  lengths: [
    ['wing', 'Wing, folded', 81.5, [77.5, 85.9], 'R'],
    ['tail', 'Tail', 74.2, [69.1, 78.2], 'R'],
    ['culmen', 'Exposed culmen (the largest value is garbled in the scan)', 12.2, [10.9, 12.7], 'R'],
    ['tarsus', 'Tarsus', 25.9, [25.4, 26.7], 'R'],
    ['midToe', 'Middle toe (claw not said)', 17.3, [16.5, 17.8], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 166.4, [161.3, 178.5], 'R'],
    ['span', 'Wingspan (the species, secondary sources)', null, [267, 298], 'A'],
  ],
  proportions: [
    'The tail nine tenths of the wing (74.2 to 81.5: worked out from Ridgway\'s means; he has "about five-sixths" for the genus)',
    'Wing rather long and pointed, the primaries exceeding the secondaries by less than the tarsus; the tail very slightly rounded',
    'Tarsus about twice the exposed culmen; the hind toe about equal to the middle toe',
  ],
  mass: 'Mass 26-44 g for the species (Audubon, Wikipedia); none for this form',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]
// (set darker than the names read: Vandyke brown and sepia are near black in a shaded wood)
// (2026-11-16, the agent called sparrows, against the plates: the tail and the spread wing were a bright orange-red
// where this form's tail is only "slightly more rufescent" than its back, between sepia and Vandyke brown; set
// darker and less red)
const BACK = [22, 24, 14], CROWN = [23, 18, 13], SIDE = [23, 22, 15], FLANK = [24, 26, 17];
const RUFOUS = [14, 38, 17], WING = [20, 26, 14], WING_EDGE = [16, 34, 19];
const SPOT = [18, 34, 11], WHITE = [40, 14, 74], UNDER_TAIL = [36, 24, 45];

// A fixed pseudo-random number from where a feather is, so that the spots stand where they do on every load
const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
// where on the underparts a feather is a spot: most of them on the chest, fewer on the throat and breast,
// few on the belly (Ridgway: heavy and confluent on the chest, smaller on throat and breast; white the ground of
// all of it). (Nearly every feather of the chest dark, as first painted, made a brown bird with white flecks, the
// inverse of a white one heavily spotted: the agent called sparrows, 2026-11-16.)
const spotted = (p) => {
  const heavy = p.x > 36 && p.x < 62 ? 0.78 : p.x >= 62 ? 0.42 : p.x > 22 ? 0.6 : p.x > 8 ? 0.36 : 0.14;
  return hash(Math.floor(p.x / 2.2), Math.floor(p.a * 30)) < heavy;
};
// the upper parts end down the side of the body, and the dark sides run up under the face
const upper = (p) => p.a > 0.56;
const size = (p) => (p.x > 62 ? 2.1 : p.x > 52 ? 3 : 4.4);

export default {
  name: 'Fox Sparrow', latin: 'Passerella iliaca', key: 'fox-sparrow', seed: 173,
  // ---- who is about on a visit (life/species/index.js says what each field is), how it lives on one and its voices
  // (Which form, read 2026-11-16 by the agent called sparrows. Wikipedia's "Sooty fox sparrow": fuliginosa "Breeds on the
  // mainland south from the Stikine River to northwestern Washington", winter "from southwestern British Columbia
  // south to coastal central California"; the forms that breed further north winter further south. BirdWeb: the
  // Sooty Fox Sparrow is "an uncommon and local breeder in shrubby habitats along the outer coast", the Sooty birds
  // "abundant winter residents in western Washington", migration "early in spring"; on the Pacific Northwest Coast it
  // is C in April and F in May. So a Fox Sparrow in an Olympic lowland valley in the middle of May is a Sooty one:
  // one of the last of the winter's birds leaving, or one of the outer coast's own, fuliginosa either way the likeliest.
  // The tier is left at rare, as the roll had it: BirdWeb's F is for the whole coast, its breeders in shrubby places on
  // the outer coast, and the valley's floor is forest.)
  census: { tier: 'rare', source: 'B F in May, C in April: winter birds leaving; breeders are high up' },
  // How it lives on a visit: its family's (life/families/scratcher.js), with these numbers. From what was read:
  // "Ground-foragers, they scratch in the leaf litter with a two-footed jump-kick motion" (BirdWeb); the Sooty forms
  // "prefer to breed in willows and alders at the edge of wet habitats", and call "a sharp zitt or thik" (Wikipedia,
  // after Beadle and Rising). The agent's own: every number here; that it keeps near the creek, the river or the
  // clearing's edge, and only passes through (gone for good, it is not about again elsewhere).
  way: {
    family: 'scratcher', there: 0.8, gap: [40, 160], passing: true,
    hz: 16, speed: 7,                                // wingbeats a second (a guess from its size); how fast it flies (m/s)
    // shy: put up from 5.5 m at a stroll (further for one who runs), or by a sudden movement within 10 m
    flush: 5.5, startle: 10, near: 0.6, gone: 0.4,
    air: [0, 0.95], thicket: 16, stretch: 26, apart: 40, reach: 12, high: 4,
    stay: [10, 30], patches: [2, 4], sit: 0.1, rest: [5, 12],
    hop: [0.07, 0.13], kick: 0.62, kicks: [2, 5], flick: 0, flash: 0.2, pump: 0,
    hopping: 'hopping at the edge of the trail', perched: 'perched low, looking about',
    call: { every: [1.5, 4], time: 0.1, reach: 25, doing: 'calling: a sharp thik' },
    // (rarely in song in the middle of May, as a bird on its way; a song as long as the recording that is played for it)
    song: { chance: 0.12, songs: [2, 5], time: [3.3, 3.5], gap: [8, 16], reach: 140, high: [0.3, 4], doing: 'singing: clear whistles, then short trills' },
  },
  voices: {
    song: { file: 'foxsparrow-song.mp3', level: 0.5, near: 6,
      credit: { what: 'Fox Sparrow, song', by: 'J. Job, National Park Service, Rocky Mountain NP sound library, 2016', licence: 'public domain (US federal work): cut and filtered; credit "National Park Service"',
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-foxsparrow.htm', bytes: 1512960, kept: 3.4 } },
    // (its call: silent, no recording of it was found under a licence that could be used)
    call: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 17 cm long, wings 27 to 30 cm across, 26 to 44 g: a large, chunky sparrow.',
    marks: ['Dark sooty brown above, with a plain face', 'A white breast heavily spotted with dark brown, the spots joining into a patch on the chest', 'A rusty tail, redder than the back', 'A stout bill, yellowish below'],
    lives: 'Thickets, brushy edges and the tangled floor of the wood. It feeds on the ground, jumping forward and scratching back through the leaf litter with both feet at once, and stays low and hidden. In spring the males sing from the top of a bush: clear whistles followed by short trills.',
  },
  plate: { wide: 0.55, bar: 0.03 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 80
    top:    [[-20, 1.7], [-8, 5.4], [5, 9.9], [20, 13.9], [34, 16.2], [47, 16.8], [57, 16.2], [63, 16.6], [68, 18], [72.5, 18], [76, 15.6], [78.6, 11.6], [79.6, 8.4], [80, 6.4]],
    bottom: [[-25, -1], [-12, -5.4], [0, -10.5], [12, -18], [25, -23.4], [37, -25.5], [47, -24], [56, -20], [62, -14.6], [68, -9], [73, -5.4], [77, -3.2], [80, -1.8]],
    half:   [[-25, 3.4], [-13, 6.8], [0, 11.9], [13, 17], [26, 20], [38, 20.7], [50, 19.4], [59, 14.8], [64, 11.6], [69, 10.6], [73, 10.2], [76.5, 7.6], [79, 4.4], [80, 3.3]],
    widest: 0.46,
    neck: [58, 69],
    eye: { x: 73, y: 10.4, r: 2.2 },
    bill: { culmen: 12.2, drop: 0.05, gape: 2.4 },
    wing: {
      chord: 81.5, wrist: [52, -2], aim: [-79, 4.5],
      up:   [[0, 2.6], [0.12, 11.5], [0.3, 13.6], [0.5, 11], [0.7, 6.4], [0.87, 2.6], [1, 0.6]],
      down: [[0, 2], [0.12, 6.2], [0.3, 8.6], [0.5, 8.6], [0.7, 6.4], [0.87, 3.6], [1, 0.6]],
      rest: 2.6, proud: 1.4,
      span: 285, shoulder: [51, 8.6, 13], arm: 33, lead: 8, sweep: 26, root: 57, tipChord: 17,
    },
    tail: { length: 74.2, root: 1, rootHalf: 3, feathers: 12, width: 10, closed: 0.037, graded: 2, point: 0.6, droop: 0.03, tent: 8 },
    leg: { knee: [33, -14, 7], shin: 17, tarsus: 25.9, thick: [4.4, 1.8, 1.1], toes: { mid: 17.3, side: 12.4, hind: 10, claw: 5.5, hindClaw: 11 }, splay: 0.5 },
  },
  poses: {
    perched: { pitch: 0.5, lift: 0.5, head: { pitch: 0.08 }, tail: { pitch: -0.1, fan: 0.02 }, feet: { mode: 'grip', round: 0.008 }, perch: 0.008 },
    // on the ground, on flat feet: the body held low and level-ish, as it stands to scratch in the litter
    ground: { pitch: 0.36, lift: 0.58, head: { pitch: 0.12 }, tail: { pitch: -0.04, fan: 0.02 }, feet: { mode: 'flat' } },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.28 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: WHITE, size },                                                                  // under parts white (R)
      { where: spotted, colour: SPOT, size: 2.4 },                                              // spotted everywhere with deep chestnut or Vandyke brown, heavy and confluent on the chest (R); how many is the agent's
      { where: (p) => p.a > 0.24 && p.a < 0.6 && p.x < 52, colour: FLANK, size: 4.6 },          // sides and flanks almost uniform deep brown, tinged with buffy (R)
      { where: (p) => p.x <= 5 && p.a < 0.46, colour: UNDER_TAIL, edge: [38, 40, 62], fringe: 0.3, size: 5 },   // under tail coverts olive-brown, broadly margined with buffy (R)
      { where: upper, colour: BACK, size },                                                     // upper parts dark sepia brown, plain (R)
      { where: (p) => upper(p) && p.x < 11, colour: RUFOUS, size: 4.6 },                        // upper tail coverts more rufescent (R)
      { where: (p) => p.x > 62 && p.y > 4 && p.a > 0.3, colour: CROWN, size: 2.1 },             // crown a duller sooty brown (R, of the Townsend's form)
      { where: (p) => p.x > 60 && p.y <= 4 && p.y > -2.8 && p.a > 0.3, colour: SIDE, size: 2.1 },   // sides of head and neck dark sepia brown (R)
      { where: (p) => p.x > 66 && p.y <= 4 && p.y > -2.8 && p.a > 0.3 && hash(Math.floor(p.x * 1.3), Math.floor(p.y * 1.3)) < 0.2, colour: [30, 14, 36], size: 1.4 },   // the auriculars finely streaked with dull whitish (R, of the Townsend's form)
    ],
    wing: {
      web: WING, edge: WING_EDGE, tertial: [18, 26, 13], covert: [20, 24, 14], lesser: BACK, lesserEdge: [20, 22, 18],      // wings more rufescent than the back (R, generic): the rest is the agent's
      medianTip: null, greaterTip: null,
      patchSkip: 0, primaryBars: [], secondaryBars: [],
      tertialTip: null, tertialBars: [[0.4, 0.95, [15, 42, 24], 'edge']],
      under: [26, 12, 46], underCovert: [34, 10, 62], underCovertTip: null, underBars: [],        // under the wing: not described in what was read
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.7, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 6, shape: [0.55, 0.82, 0.95, 1, 1, 1, 1, 0.98, 0.96] },
    },
    tail: { web: RUFOUS, edge: [15, 32, 20], under: [22, 20, 34], point: 0.35 },                // tail more rufescent than the back (R); no pattern described
    bill: { upper: [28, 20, 20], lower: [42, 50, 52], lowerBase: [[44, 55, 58], 0.8] },         // maxilla dusky, mandible yellowish (R; BirdWeb)
    mouth: [350, 30, 42],
    eye: { iris: [22, 40, 12], pupil: [240, 15, 5] },                                           // iris brown (R)
    leg: [24, 24, 34],                                                                          // brownish (R)
    shin: [24, 22, 32],
  },
};
