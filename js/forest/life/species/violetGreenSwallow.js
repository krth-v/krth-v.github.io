// Violet-green Swallow, Tachycineta thalassina lepida: the adult male in spring, of the form of western North
// America. The female is much duller (Ridgway), and is not built.
//
// What is published and what is not. The lengths under `published` are Ridgway's for 23 adult males of lepida,
// and the bird is built to their means; life/measure.js measures the built bird against them. The colours
// follow his description tract by tract. Not found in what was read, and so the agent's drawing: the notch's
// depth (Wikipedia has it "slightly shallower than the Tree Swallow's", no number), how far the folded wings
// project past the tail, the outline of head and body, where the eye sits, how a perched bird holds itself and
// every number of the spread wing but the span. The wingspan is one secondary source's. The spread wing was drawn
// again on 2026-11-16 by a second agent (aerial2), who found the first drawing a songbird's broad, square wing where
// the sources have "long pointed wings" (Wikipedia): it is now a short arm, a long swept hand and a narrow chord,
// with the primaries' tips laid on one smooth trailing edge, and its flight pose is a glide on swept wings. Those
// numbers are that agent's drawing too, as are the underwing's two tones and the darker lesser coverts.
//
// How the sources were read: Ridgway through the archive.org full-text character recognition of the scan, by one
// agent for the research file and again by this one for the lengths (the line was found in the text and matches:
// "wing, 108-120 (115.2); tail, 44-51 (46); exposed culmen, 4.5-5.5 (5.2) ... tarsus, 10-11 (10.6); middle toe,
// 9-11 (10.1)"); BirdWeb, Wikipedia and the Park Service's page through summaries. No page was seen as an image.
// Ridgway does not say whether his tail is measured to the longest feather; it is built so (the notch is cut into
// a tail whose outer feathers are 46 mm), and whether the middle toe is measured with its claw is not said (built
// without).

const R = 'Ridgway 1904, The Birds of North and Middle America, Part III (U.S. National Museum Bulletin 50), Tachycineta thalassina lepida, p. 95';

export const published = {
  shown: 'adult male, spring (the female is duller)',
  note: 'Published: the lengths above, and the colour of each tract as Ridgway has it (crown and hindneck bronzy green to purplish bronze; back soft bronzy green tinged with purple; the middle of the rump and the upper tail coverts violet-purple mixed with blue; a white patch on each side of the rump; wings and tail blackish, faintly glossed with blue; a white spot over the eye joined to the white of the cheek; underparts pure white; lores greyish, blackish next to the eye; bill black, iris brown, legs and feet brownish). Wikipedia and the Park Service have the wings greyish-bronze, which Ridgway does not: his blackish is followed. Not found, and the agent\'s: the notch (6 mm, built), how far the wing tips pass the tail, the wingspan\'s shape, the outline, the stance. The iridescence of the green and the violet is painted as a flat colour: the paint has no gloss that changes with the angle.',
  sources: {
    R: `${R}: 23 adult males, museum skins`,
    W: 'Wikipedia, "Violet-green swallow" (read 2026-11-16, through a summary): wingspan 27 cm, body 12 to 13 cm, about 14 g; long pointed wings; the tail notched, a little less than the Tree Swallow\'s; white of the cheeks partly round the eye, the rump patches almost meeting at the tail',
    B: 'Seattle Audubon, BirdWeb, Violet-green Swallow: "their flight is more fluttery than that of Tree Swallows, and they often fly higher"; feeds on the wing; common in May on the Pacific Northwest Coast',
    N: 'National Park Service, Rocky Mountain National Park, Violet-green Swallow sounds page: greenish-bronze back, violet rump, green head, white underparts',
  },
  // key, what it is, mean, range, source
  lengths: [
    ['wing', 'Wing, folded', 115.2, [108, 120], 'R'],
    ['tail', 'Tail (to the longest feather)', 46, [44, 51], 'R'],
    ['culmen', 'Exposed culmen', 5.2, [4.5, 5.5], 'R'],
    ['tarsus', 'Tarsus', 10.6, [10, 11], 'R'],
    ['midToe', 'Middle toe', 10.1, [9, 11], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 116.1, [106, 126], 'R'],
    ['span', 'Wingspan (both sexes)', 270, [270, 270], 'W'],
  ],
  proportions: [
    'The wing nearly two and a half times the tail (115.2 to 46: Ridgway\'s means), so a perched bird\'s wing tips lie past the tail',
    'The bill tiny: 5.2 mm exposed culmen and 4 mm across its base (Ridgway), which is flat and wide-gaped for catching insects in the air',
    'The tarsus and the toes tiny: about a tenth of the wing each',
  ],
  mass: 'About 14 g (W)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]
const WHITE = [40, 6, 88], GREEN = [112, 34, 25], BRONZE = [100, 30, 24], CROWN = [135, 34, 24], PURPLE = [268, 44, 27], BLUE = [226, 40, 27];
const WING = [226, 14, 13], WINGEDGE = [225, 16, 19], TAIL = [226, 12, 12], MASK = [30, 10, 14], GREY = [30, 5, 55];

const size = (p) => (p.x > 55 ? 2.6 : 4.4);
const head = (p) => p.x > 50;
const eyeD = (p) => Math.hypot(p.x - 59.6, p.y - 1.8);

export default {
  name: 'Violet-green Swallow', latin: 'Tachycineta thalassina', key: 'violet-green-swallow', seed: 317,
  // ---- who is about on a visit, how it lives on one and what it says (life/species/index.js says what each is)
  census: { tier: 'most', source: 'B C; over the river and the clearing', mean: 1.2, party: [2, 7] },
  // ---- how it lives on a visit (life/families/aerial.js, which says what was read: it "forage[s] almost exclusively in
  // flight", often higher than other swallows, low over water in bad weather, with "faster wingbeats, less gliding" than
  // the Tree Swallow (BirdWeb, Audubon), perches on snags at the forest's edge, calls in flight). A party hawks in the
  // open air of the clearing, the bend or the reach, and drifts along it; now and then one sits on the cabin's ridge, the
  // old apple's dead limb or an open snag's top, twittering; at dusk the party goes, for the night. Every number is the
  // agent's own, from no source: 11 wingbeats a second, 6 to 9.5 m/s hawking and 15 at the most (a Cliff Swallow chasing
  // insects was measured at 7 m/s on average and 15.6 at the most: a summary of a study, not this kind), 2.5 to 24 m over
  // the ground by day, the loops, the turns and the times.
  way: {
    family: 'aerial', together: true, there: 0.75, gap: [40, 200], fastest: 17,
    windows: ['clearing', 'bend', 'reach'], span: 28, drift: [140, 320],
    heights: { day: [2.5, 24], dim: [1.2, 12], dusk: [0.4, 5], high: 0.03 },
    hz: 11, speed: 8, cruise: [6, 9.5], burst: 15, climb: 4, sink: 5,
    turn: 3.8, jerk: 22, bank: 1.2, loop: [3.5, 9],
    modes: { run: 0.35, loop: 0.3, chase: 0.35, swoop: 0.25 },
    bursts: { flap: [0.3, 1.0], glide: [0.25, 1.1] },
    // full strokes, the hand flexed and swept on the upstroke; glides on wings swept further back the faster it goes
    wing: { flap: [0.62, 0.06], hand: [0.4, 0.9], sweep: [0.12, 0.42], glide: { flap: -0.03, hand: -0.05, sweep: [0.32, 0.72] }, rock: 0.03, tail: [0.12, 0.6] },
    spell: [100, 360], moveOn: 0.35,
    dusk: 1.6,
    perch: { every: [25, 80], stay: [6, 26], reach: 70, calls: [1.5, 5] },
    flush: 6, startle: 13, near: 0.85, gone: 0.1,
    call: { every: [6, 22], time: 1.0, rate: 9, reach: 45 },
  },
  voices: {
    call: { file: 'swallow-call.mp3', level: 0.3, near: 5,
      credit: { what: "Violet-green Swallow, call (twitter; noisy original, light noise reduction)", by: "J. Job, National Park Service, Rocky Mountain NP sound library, 2015", licence: "public domain (US federal work): cut and filtered; credit \"National Park Service\"",
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-violetgreenswallow.htm', bytes: 559732, kept: 1.0 } },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 12 to 13 cm long and 14 g: a small, slim swallow with long pointed wings.',
    marks: ['Green and bronze above, with a violet rump', 'Pure white below, the white running up the cheek round the eye', 'A white patch on each side of the rump', 'A shallowly notched tail'],
    lives: 'Open air above rivers, clearings and the edges of the forest, often higher than other swallows. It feeds only on the wing, taking flying insects in a fluttery, acrobatic flight with long glides, and it nests in holes in old snags. It goes about in pairs and small flocks.',
  },
  plate: { wide: 0.4, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 65.4
    top:    [[-8, 1.5], [-2, 4.5], [8, 8], [20, 10.4], [34, 11.2], [44, 11], [52, 10], [58, 8.8], [62, 7], [64.2, 4.6], [65.4, 2.6]],
    bottom: [[-8, -1], [-2, -4.5], [8, -7.5], [20, -9.6], [34, -10.2], [44, -9.4], [52, -7.6], [58, -5.4], [62, -3.4], [64.2, -1.8], [65.4, -0.4]],
    half:   [[-8, 2.2], [-2, 5], [8, 7.6], [20, 9.2], [34, 9.8], [44, 9.4], [52, 8], [58, 6.8], [62, 5.6], [64.2, 4.2], [65.4, 3.2]],
    widest: 0.45,
    neck: [44, 56],
    eye: { x: 59.6, y: 1.8, r: 1.6 },
    bill: { culmen: 5.2, drop: 0.04, gape: 7 },
    wing: {
      chord: 115.2, wrist: [50, -1.5], aim: [-112, 2],
      // long and pointed: the folded wing narrows from its middle to a tip (the agent's)
      up:   [[0, 3], [0.1, 9.5], [0.3, 11.5], [0.55, 9], [0.8, 4.6], [0.95, 1.8], [1, 0.6]],
      down: [[0, 2], [0.1, 5.5], [0.3, 7.5], [0.55, 6], [0.8, 3.2], [0.95, 1.4], [1, 0.6]],
      rest: 4, proud: 1.5,
      // Spread: a short arm and a long hand swept back from the wrist (2026-11-16, the agent's: the first drawing had a
      // 38 mm arm at its full chord and a hand 90 mm long, so that in flight from above it was a broad, square-ended
      // songbird's wing; the hand of the folded wing is 115 mm, and the span is the same 270 mm whatever the sweep)
      span: 270, shoulder: [48, 10, 12], arm: 28, lead: 6, sweep: 50, root: 42, tipChord: 8,
    },
    // notched: the middle feathers 6 mm shorter than the outer ones (the agent's)
    tail: { length: 46, root: 1, rootHalf: 3, feathers: 12, width: 6, closed: 0.03, graded: 0, point: 0.55, droop: 0.01, tent: 4, fork: 6 },
    leg: { knee: [26, -6, 5], shin: 5, tarsus: 10.6, thick: [2.2, 1, 0.7], toes: { mid: 10.1, side: 7.5, hind: 6, claw: 3, hindClaw: 3.5 }, splay: 0.5 },
  },
  poses: {
    perched: { pitch: 0.42, lift: 0.45, head: { pitch: 0.05 }, tail: { pitch: -0.05, fan: 0.02 }, feet: { mode: 'grip', round: 0.004 }, perch: 0.004 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    // in a glide, its wings swept back from the shoulder (the contact sheet's flight views; life/families/aerial.js flies it)
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: -0.02, hand: -0.05, sweep: 0.35, tail: { fan: 0.15 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: WHITE, size },                                                                  // the entire underparts pure white (R)
      { where: (p) => p.a > 0.66, colour: GREEN, size },                                        // back and scapulars soft bronzy green, tinged with purple (R)
      { where: (p) => p.a > 0.66 && p.x > 18 && p.x < 44, colour: BRONZE, size },               // (the tinge of purple: the agent's, as a warmer band)
      { where: (p) => p.a > 0.74 && p.x < 14, colour: PURPLE, size },                           // the middle of the rump and the upper tail coverts violet-purple mixed with blue (R)
      { where: (p) => p.a > 0.44 && p.a <= 0.74 && p.x < 12, colour: WHITE, size },             // a conspicuous white patch on each side of the rump (R)
      { where: (p) => p.a > 0.74 && p.x >= 44 && p.x < 56, colour: [150, 32, 26], size },       // hindneck, with a more purple lower margin (R)
      { where: (p) => head(p) && p.a > 0.78, colour: CROWN, size },                             // crown and hindneck bronzy green to purplish bronze (R)
      { where: (p) => head(p) && p.a > 0.5 && p.a <= 0.78 && p.y > 4.5, colour: WHITE, size: 2.4 },     // a white spot above the eye joined to the white of the cheek (R)
      { where: (p) => head(p) && p.a > 0.5 && p.a <= 0.8 && eyeD(p) < 6, colour: GREY, size: 1.8 },     // lores greyish, blackish next to the eye (R)
      { where: (p) => head(p) && p.a > 0.4 && eyeD(p) < 3.2, colour: MASK, size: 1.5 },
    ],
    wing: {
      // wings blackish, faintly glossed with blue; the lesser coverts glossed like the back (R). The painter lays the
      // lesser coverts along the whole leading edge of the spread wing, out to its tip, and in the back's green they
      // were a green stripe the length of the wing seen from above in flight, which is how this bird is seen: they are
      // a dark bronze-green here, green at the bend of the folded wing and nearly the wing's black along the hand (the
      // agent's call)
      web: WING, edge: WINGEDGE, tertial: WING, covert: WING, lesser: [128, 24, 16], lesserEdge: [118, 24, 19],
      medianTip: null, greaterTip: null,
      patchSkip: 0,
      primaryBars: [], secondaryBars: [],
      tertialTip: null, tertialBars: [],
      // under wing coverts pale gray, becoming white on the edge of the wing (R); the flight feathers' undersides are
      // not described in what was read, and are a dusky grey here, darker than the coverts (they were as pale as the
      // belly, and the underwing was one cream with the body)
      under: [222, 8, 22], underCovert: [30, 4, 50], underCovertTip: null, underBars: [],
      fold: { primaries: 9, secondaries: 8, secondaryEnd: 0.56, greater: 7, greaterEnd: 0.3, median: 6, medianEnd: 0.2 },
      // (each primary's tip laid on the spread wing's trailing edge, so that the edge is smooth: the outermost runs along
      // the leading edge to the tip; the agent's)
      spread: { primaries: 9, secondaries: 7, shape: [0.6, 1.3, 1.35, 1.3, 1.22, 1.14, 1.08, 1.03, 1] },
    },
    tail: { web: TAIL, edge: [226, 14, 17], under: [226, 8, 22], point: 0.3 },                  // blackish (R)
    bill: { upper: [30, 5, 9], lower: [30, 5, 10] },                                            // bill black (R)
    mouth: [350, 25, 28],
    eye: { iris: [24, 40, 11], pupil: [240, 15, 5] },                                           // iris brown (R)
    leg: [24, 14, 26],                                                                           // legs and feet brownish (R)
    shin: [30, 6, 74],
  },
};
