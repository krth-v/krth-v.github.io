// Northern Pygmy-Owl, Glaucidium gnoma grinnelli: the adult (the sexes are alike). Ridgway's Coast Pygmy Owl, of the
// humid coast from Monterey County north through Oregon and Washington to southern British Columbia: "much browner"
// than the form of California's interior, "the general color of upper parts varying from deep snuff brown to verona
// brown; spots on upper parts (especially those on pileum and hindneck) distinctly fulvous or rufescent". The pattern
// of each tract is his description of the species, painted in this form's colours.
//
// What is published and what is not. The wing, tail, culmen (from the cere) and length under `published` are
// Ridgway's for nine adult males of this form, and the bird is built to their means. No wingspan was found; the span
// built is the agent's. No tarsus or toe was found in millimetres. The "false eyes" on its nape are Ridgway's
// interrupted collars of white and of black across the lower hindneck, the black "most developed laterally", and
// BirdWeb's "false eye-spots, black outlined in white, on the back of its neck". The outline of head and body, the
// size of the face, how the folded wing lies, the toes, and the length of its legs are the agent's drawing, scaled
// from the Barred Owl's; the tail is longer than an owl's of its size usually is ("quite long compared to other
// owls", Wikipedia), because Ridgway's tail is.
//
// How the sources were read: Ridgway's text through the Internet Archive's character recognition of the volume, read
// by this agent (not checked by a second); BirdWeb and Wikipedia through a tool that returns a page's text or a
// summary of it. No page was seen as an image.
//
// Its eyes in a light (shape.eye.shine): no source read says whether its eyes shine. It hunts by day; by night, at
// roost, a walker's lantern may still find its eyes. The red is the Barred Owl's (life/species/barredOwl.js), and is
// the agent's call here.

const R = 'Ridgway 1914, The Birds of North and Middle America, Part VI (U.S. National Museum Bulletin 50), Glaucidium gnoma grinnelli, p. 791-792; the species, p. 785-787';

export const published = {
  shown: 'adult (the sexes are alike)',
  note: 'Published (Ridgway, of the species): upper parts brown, the crown and hindneck with many small roundish pale spots; across the lower hindneck an interrupted collar of white and below it another of black, most developed at the sides; the back and inner scapulars with minute pale spots, mostly hidden; the outer scapulars with large buffy-white spots; the outermost middle and greater coverts with larger white spots; the remiges with spots or bars of paler brown, white on the far secondaries and the longer primaries; the tail crossed by six or seven broken white bars, broader on the inner webs; brows and lores dull white, the lores with black bristly shafts; chin and the sides of the throat white; a band of brown across the throat; the foreneck and the middle of the breast and belly white; the sides of the chest brown, spotted with cinnamon-buff; the rest of the under parts white, broadly streaked with dark brown, black on the flanks; the legs dull white mottled with greyish brown; the bill pale greyish yellow; the iris lemon yellow; the toes light yellowish brown. Of this form: much browner, snuff brown to verona brown, the spots fulvous. Not found, and the agent\'s: the tarsus and toes, the wingspan, the outline.',
  sources: {
    R: `${R}: nine adult males of this form, museum skins`,
    B: 'Seattle Audubon, BirdWeb, Northern Pygmy-Owl (read 2026-11-16): most active at dawn and dusk and often seen by day; perches in the open at the top of a conifer or snag; bobs its head and flicks its tail up and down, often holding it to one side; mobbed by small songbirds; the false eye-spots; uncommon in May on the Pacific Northwest coast',
    W: 'Wikipedia, "Northern pygmy owl" (read 2026-11-16): 15 to 17 cm long; the tail long for an owl; diurnal and also active at dawn and dusk; a sit-and-wait hunter that also moves between perches in short flights; its wings buzz or whirr as it flies',
  },
  lengths: [
    ['wing', 'Wing, folded', 93, [89, 96], 'R'],
    ['tail', 'Tail', 64.5, [61, 70], 'R'],
    ['culmen', 'Culmen from the cere', 10.5, [10, 11], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 169, [159, 194], 'R'],
  ],
  proportions: [
    'A small, long-tailed owl; its ear tufts small and not to be seen (BirdWeb; Wikipedia)',
    'Tail about two thirds of the wing (Ridgway)',
    'On the back of the head two black spots outlined in white, which look like eyes (BirdWeb; Ridgway\'s collars)',
    'In life 15 to 17 cm long (Wikipedia)',
  ],
  mass: 'Not found in what was read',
};

// the colours, as paint: [hue, saturation, lightness]
const BROWN = [22, 40, 29], DARK = [20, 36, 16], SPOT = [30, 52, 60], WHITE = [40, 18, 92], BLACK = [20, 20, 7], STREAK = [20, 38, 20];

export default {
  name: 'Northern Pygmy-Owl', latin: 'Glaucidium gnoma', key: 'northern-pygmy-owl', seed: 405,
  // ---- who is about on a visit (life/species/index.js says what each is): an owl of the day
  census: { tier: 'very rare', source: 'B U; P regular; an owl of the day', extra: true },
  // ---- how it lives on a visit (life/families/owl.js says what each number is). What was read (B, W): it is about
  // by day, most at dawn and dusk; it perches in the open at the top of a conifer or a snag, or in a small tree,
  // bobbing its head and flicking its tail up and down, often holding it to one side; it waits and also moves from
  // perch to perch in short flights, and is fast enough to chase small birds in the air; it takes rodents, large
  // insects and small birds; its wings whirr as it flies; small songbirds mob it. How high it hunts from, how near it
  // lets a walker come, how often it dashes, and every other number here are the agent's own; so is its call, a run
  // of single hollow toots, which is not in what was read.
  way: {
    family: 'owl', day: true, there: 0.6, gap: [60, 240],
    hz: 9, speed: 8, glide: 0.15, flies: 'off to another perch, its wings whirring',
    flush: 2.5, startle: 4, near: 0.85, gone: 0.2,
    doze: 2.6, apart: 300,
    roost: { trees: ['pole', 'mature', 'spruce'], low: 3, high: 12, off: 26, thin: 0.012 },
    hunt: { low: 3, high: 17, thin: 0.012, reach: [12, 50], wait: [8, 40], drop: 0.2, floor: [3, 10], stay: [2, 6], catch: 0.3 },
    ends: true, snags: true, cock: 0.45, flick: [1.5, 5], dash: { reach: 12, chance: 0.4, speed: 11 }, mobbed: 20,
    song: { every: [20, 90], time: 6, reach: 300, doing: 'calling: a run of single hollow toots' },
  },
  voices: {
    // (nothing was found under a licence that could be used: the one Freesound recording is CC BY-NC)
    song: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 15 to 17 cm long: a sparrow-sized owl with a long tail.',
    marks: ['Lemon-yellow eyes; white brows', 'Two black spots ringed with white on the back of its head, like eyes', 'Brown, finely spotted with buff', 'White below, streaked with dark brown; a long barred tail, often cocked'],
    lives: 'Conifer and mixed wood with openings. Unlike most owls it hunts by day, most at dawn and dusk, from the top of a tree or a snag, bobbing its head and flicking its tail; it is fast enough to catch small birds in the air, and small birds mob it when they find it.',
  },
  plate: { wide: 0.5, bar: 0.05 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 97. The Barred Owl's
    // outline at 0.426 of its size, the head a little smaller again (life/species/barredOwl.js).
    top:    [[-21.3, 0.8], [-10.7, 4.2], [0, 7.9], [12.8, 13.8], [27.7, 19.6], [42.6, 23.4], [55.4, 24.2], [61.8, 24.1], [68.2, 26], [74.5, 28.3], [80.1, 28.9], [85.2, 27.9], [89, 26], [91.6, 24], [93.3, 20.7], [95, 14.9], [96.3, 8.3], [97.1, 3.3]],
    bottom: [[-23.9, -1.7], [-12.8, -6.3], [0, -15], [14.9, -25.9], [29.8, -32.6], [42.6, -33.4], [55.4, -29.6], [63, -26.1], [69, -24], [75.8, -24], [81.8, -23.6], [86.9, -22.3], [90.3, -20.7], [92.9, -18.2], [95, -12.4], [96.3, -6.6], [97.1, -2.5]],
    half:   [[-23.9, 3.3], [-12.8, 9.2], [0, 16.7], [14.9, 26.7], [29.8, 32.6], [42.6, 33.4], [55.4, 31.3], [63, 28.2], [69, 26.4], [75.8, 27.5], [81.8, 27.1], [86.9, 25.6], [90.3, 24], [92.9, 21.5], [95, 15.7], [96.3, 8.7], [97.1, 2.7]],
    widest: 0.45,
    neck: [50.3, 71.6],
    eye: { x: 91.2, y: 4.5, r: 4.1, shine: [8, 88, 44] },
    // the face: a shallow dish, 36 mm tall and 40 across (the agent's: no source gives it)
    disc: { rim: 18, wide: 1.1, depth: 0.06, apart: 8.4, at: 1.7, back: 4.7, seam: 4.3 },
    bill: { culmen: 10.5, drop: 0.3, gape: 3 },
    wing: {
      chord: 93, wrist: [59.6, 1.7], aim: [-140.6, 9.4],
      up:   [[0, 3.4], [0.12, 12.3], [0.3, 16.2], [0.5, 14], [0.75, 8.4], [0.9, 3.9], [1, 0.8]],
      down: [[0, 2.2], [0.12, 8.4], [0.3, 11.2], [0.5, 10.6], [0.75, 7.5], [0.9, 3.6], [1, 0.8]],
      rest: 2.6, proud: 1.7,
      span: 360, shoulder: [63.9, 12.8, 19.2], arm: 64, lead: 12, sweep: 11, root: 75, tipChord: 48,
    },
    tail: { length: 64.5, root: 4.3, rootHalf: 10.2, feathers: 12, width: 16, closed: 0.04, graded: 7, point: 0.5, droop: 0.02, tent: 5.1 },
    // two toes forward, two back; the tarsus feathered, the toes bare (the agent's)
    leg: { knee: [29.8, -19.2, 12.8], shin: 30.7, tarsus: 15, thick: [11.1, 4.7, 2.6], toes: { mid: 13, side: 11, hind: 8, claw: 8.5, hindClaw: 7.5 }, splay: 0.45, yaw: { O: 2.3 },
      feathered: { to: 'tarsus', full: 0.7 } },
  },
  poses: {
    perched: { pitch: 1.3, lift: 0.5, head: { pitch: 0 }, tail: { pitch: 0 }, feet: { mode: 'grip', width: 0.019, round: 0.015, toeOut: 0.3 } },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.05, hand: 0.02, tail: { fan: 0.3 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: WHITE, shaft: STREAK, shaftWidth: 0.5, size: 8 },                                                      // under parts white, broadly streaked with dark brown (R)
      { where: (p) => p.a > 0.3 && p.a < 0.5 && p.x < 40, colour: WHITE, shaft: BLACK, shaftWidth: 0.5, size: 8 },       // the streaks black on the flanks (R)
      { where: (p) => p.a < 0.08, colour: WHITE, size: 7 },                                                              // the middle of the breast and belly white (R)
      { where: (p) => p.x < 2 && p.a < 0.4, colour: WHITE, size: 7 },
      { where: (p) => p.x >= 56 && p.x < 72 && p.a > 0.2 && p.a < 0.5, colour: [24, 44, 38], bars: [SPOT, 1, 0.16], size: 7 },   // the sides of the chest brown, spotted cinnamon-buff (R)
      { where: (p) => p.x >= 74 && p.a < 0.42, colour: [24, 36, 40], size: 6 },                                           // a band of brown across the throat (R)
      { where: (p) => p.x >= 86 && p.a < 0.3, colour: WHITE, size: 5 },                                                  // the chin white (R)
      { where: (p) => p.a >= 0.5, colour: BROWN, size: 8 },                                                              // upper parts brown, the small spots mostly hidden (R)
      { where: (p) => p.a >= 0.5 && p.x >= 60, colour: BROWN, bars: [SPOT, 1, 0.16], size: 5 },                          // the crown and hindneck spotted fulvous (R)
      // across the lower hindneck an interrupted collar of white, and below it one of black, most developed at the
      // sides (R): the false eyes, black outlined in white (B)
      { where: (p) => p.a >= 0.62 && p.x >= 55 && p.x < 60, colour: WHITE, size: 5 },
      { where: (p) => p.a >= 0.66 && p.a < 0.93 && p.x >= 47 && p.x < 55, colour: BLACK, size: 6 },
    ],
    wing: {
      web: [22, 30, 25], edge: [22, 28, 33], tertial: BROWN, covert: BROWN, lesser: DARK, lesserEdge: [20, 34, 26],
      // the outermost middle and greater coverts with larger white spots (R)
      medianTip: [WHITE, 0.24], greaterTip: [WHITE, 0.2], tertialTip: null, patchSkip: 0,
      // spots or bars of paler brown on the remiges, white on the longer primaries' far part (R)
      primaryBars: [[0.15, 0.22, [26, 22, 52], 'outer'], [0.33, 0.4, [26, 22, 54], 'outer'], [0.51, 0.58, [26, 22, 58], 'outer'], [0.69, 0.76, WHITE, 'outer'], [0.86, 0.92, WHITE, 'outer']],
      secondaryBars: [[0.15, 0.24, [26, 22, 52], 'both'], [0.4, 0.49, [26, 22, 54], 'both'], [0.65, 0.74, [32, 18, 82], 'both']],
      tertialBars: [[0.3, 0.38, [26, 22, 52], 'both'], [0.6, 0.68, [26, 22, 52], 'both']],
      greaterBars: [[0.58, 0.72, WHITE, 'outer']],
      under: [26, 14, 58], underCovert: [36, 40, 84], underCovertTip: null,
      underBars: [[0.2, 0.3, [36, 40, 84], 'both'], [0.45, 0.55, [36, 40, 84], 'both'], [0.7, 0.8, [36, 40, 84], 'both']],
      fold: { primaries: 7, secondaries: 7, secondaryEnd: 0.72, greater: 9, greaterEnd: 0.42, median: 8, medianEnd: 0.25 },
      spread: { primaries: 9, secondaries: 9, shape: [0.6, 0.78, 0.9, 0.97, 1, 1, 0.99, 0.96, 0.92] },
    },
    tail: { web: [22, 30, 23], edge: [22, 28, 29], under: [26, 16, 52], point: 0.5, bars: [WHITE, 7, 0.04] },             // six or seven broken white bars (R)
    bill: { upper: [50, 30, 72], lower: [50, 26, 66] },                                                                   // pale greyish yellow (R)
    mouth: [8, 30, 42],
    eye: { iris: [52, 95, 54], pupil: [225, 30, 6] },                                                                     // lemon yellow (R)
    leg: [44, 52, 62],                                                                                                     // the toes light yellowish brown (R), yellow (B)
    shin: [34, 14, 80],                                                                                                    // the legs dull white, mottled with greyish brown (R)
    // a weak face, brown flecked pale, the brows and lores dull white, the lores with black bristly shafts (R)
    disc: { face: [26, 30, 46], rim: [22, 36, 28], band: BROWN, rays: [[32, 36, 74], 12], brow: WHITE, bristle: [20, 20, 12], pupil: 0.46 },
  },
};
