// Northern Saw-whet Owl, Aegolius acadicus: the adult (the sexes are alike in plumage; the female is the larger).
// Ridgway knew it as Cryptoglaux acadica, and gives one table for the whole species; he says the birds of the Pacific
// coast are the reddest brown, so the upper parts are painted at the red end of his range.
//
// What is published and what is not. The wing, tail, culmen (from the cere) and length under `published` are
// Ridgway's for eight adult males, and the bird is built to their means; the wingspan's range is Wikipedia's, for
// both sexes, and the span built is the agent's within it. No tarsus or toe was found in millimetres: only the
// genus's proportion, "tarsus about as long as middle toe without claw" (Ridgway), which the legs are built to. The
// colours follow Ridgway's description tract by tract; the white Y between the eyes is BirdWeb's, the black
// bristles at the bill's base Birds of the World's. The outline of head and body, the size of the face and where the
// eyes sit in it, how the folded wing lies and the toes' lengths are the agent's drawing, scaled from the Barred Owl's
// and made a little bigger in the head (Ridgway: "a relatively very large head, a very broad flat face").
//
// How the sources were read: Ridgway's text through the Internet Archive's character recognition of the volume, read
// by one agent and checked against it by a second; BirdWeb, Birds of the World, Wikipedia and Animal Diversity Web
// through a tool that returns a page's text. No page was seen as an image.
//
// Its eyes in a light (shape.eye.shine): no source read says whether this owl's eyes shine, or in what colour; only
// that owls have the reflecting layer behind the retina that makes eyes shine (Wikipedia, "Tapetum lucidum"). The
// red is the Barred Owl's (life/species/barredOwl.js), and is the agent's call here.

const R = 'Ridgway 1914, The Birds of North and Middle America, Part VI (U.S. National Museum Bulletin 50), Cryptoglaux acadica, p. 627-629';

export const published = {
  shown: 'adult (the sexes are alike)',
  note: 'Published (Ridgway): upper parts greyish bister to Vandyke brown, reddest on the Pacific coast; the crown narrowly streaked with white; the lower hindneck with large, mostly hidden, white spots; the outer scapulars mostly white on their outer webs; the outer larger wing coverts with a few white spots; the outer primaries spotted with white along the edge; the tail crossed by two or three broken narrow white bands and tipped white; brows, lores and chin dull white, the eye margined above and in front with dusky; the face buffy white to cinnamon-buff, broadly streaked with brown; a band of brown spots across the throat; the rest of the under parts white, broadly striped with chestnut-brown; the under tail coverts white; legs pale buff, the bare parts of the toes pale dull yellowish; the bill black; the iris lemon yellow. Not found in what was read, and the agent\'s: the tarsus and toes in millimetres, the outline, the size of the face, how far the folded wings reach.',
  sources: {
    R: `${R}: eight adult males, museum skins, of the whole species`,
    W: 'Wikipedia, "Northern saw-whet owl" (read 2026-11-16): the wingspan 42 to 56.3 cm and the length 17 to 22 cm, both sexes; 54 to 151 g',
    B: 'Seattle Audubon, BirdWeb, Northern Saw-whet Owl: all forest types, roosting in dense evergreens; uncommon in May on the Pacific Northwest coast; the white eyebrows joined in a Y over the bill',
    O: 'Birds of the World, Northern Saw-whet Owl (Behavior, Sounds, Appearance; read through a tool that returns a page\'s text): its flight, its call, the black bristles between the eyes',
  },
  lengths: [
    ['wing', 'Wing, folded', 136.3, [133.5, 139], 'R'],
    ['tail', 'Tail', 67.4, [65, 70], 'R'],
    ['culmen', 'Culmen from the cere', 12, [11, 13], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 177, [165, 195], 'R'],
    ['span', 'Wingspan, both sexes', null, [420, 563], 'W'],
  ],
  proportions: [
    'A small owl with no ear tufts to be seen, a relatively very large head and a very broad flat face (Ridgway, of the genus; BirdWeb)',
    'Tail about half the wing, square or a little rounded at its end (Ridgway)',
    'Tarsus about as long as the middle toe without its claw, and the toes feathered but for their last joints (Ridgway, of the genus)',
    'About the size of an American Robin (Wikipedia)',
  ],
  mass: 'Males about 75 g, females about 100 g (W; Animal Diversity Web)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]
const BROWN = [19, 40, 29], DARK = [17, 38, 19], CHESTNUT = [14, 46, 36], WHITE = [40, 22, 93], BUFF = [30, 42, 78];

export default {
  name: 'Northern Saw-whet Owl', latin: 'Aegolius acadicus', key: 'northern-saw-whet-owl', seed: 402,
  // ---- who is about on a visit (life/species/index.js says what each is). 'dusk': by day the few about are at roost.
  census: { tier: 'very rare', source: 'B U; P U; heard more than seen', clock: 'dusk' },
  // ---- how it lives on a visit (life/families/owl.js says what each number is). What was read (B, O, ADW): it hunts
  // almost wholly by night, waiting on low perches, generally 6 to 12 feet up, and swooping down without a sound on
  // mice, voles, shrews and large insects, which it takes on the ground; it flies low with quick beats, often in a
  // bounding flight, swooping up to its perches; by day it roosts in thick evergreens, often on the same perch day
  // after day; its call is a long run of whistled notes on one pitch, about two a second, that carries up to 300 m.
  // Which trees, how high it roosts, how near it lets a walker come, and every other number here are the agent's own.
  way: {
    family: 'owl', there: 0.7, gap: [60, 240],
    hz: 6, speed: 6, glide: 0.2, flies: 'flying low to another perch, without a sound',
    flush: 1.5, startle: 2.5, near: 0.9, gone: 0.1,
    doze: 2.6, apart: 150,
    roost: { trees: ['pole', 'mature', 'spruce'], low: 2, high: 6, off: 20, thin: 0.012 },
    hunt: { low: 1.8, high: 3.7, thin: 0.012, reach: [8, 35], wait: [15, 60], drop: 0.4, floor: [2, 7], stay: [3, 10], catch: 0.4 },
    song: { every: [30, 150], time: 8, reach: 300, doing: 'tooting: a long run of even whistled notes, about two a second' },
  },
  voices: {
    // the two CC BY recordings found (Hamilton Naturalists' Club) are 13 dB over their floor at best: too faint to
    // level without raising the hiss to the call
    song: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 20 cm long and 75 to 100 g: the size of a robin, all head.',
    marks: ['Lemon-yellow eyes in a broad face streaked with brown', 'White brows meeting in a Y over a black bill', 'Reddish brown above, spotted white', 'White below, striped with chestnut'],
    lives: 'Forests of every kind. By day it roosts in a thick evergreen, often in the same place day after day. By night it waits on a low perch and drops onto mice and voles. Its call, a long even run of whistled toots, is heard far more often than the bird is seen.',
  },
  plate: { wide: 0.5, bar: 0.05 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 101. The Barred Owl's
    // outline at 0.444 of its size, the head a ninth bigger again (life/species/barredOwl.js).
    top:    [[-22.2, 0.9], [-11.1, 4.4], [0, 8.4], [13.3, 14.7], [28.9, 20.9], [44.4, 24.9], [57.7, 26.3], [64.4, 27.6], [71, 31.2], [77.7, 34.1], [83.5, 34.8], [88.8, 33.6], [92.8, 31.3], [95.5, 28.8], [97.2, 24.9], [99, 17.9], [100.3, 9.9], [101.2, 4]],
    bottom: [[-24.9, -1.8], [-13.3, -6.7], [0, -16], [15.5, -27.5], [31.1, -34.6], [44.4, -35.5], [57.7, -32.1], [65.7, -30.3], [71.9, -28.8], [79, -28.8], [85.2, -28.3], [90.6, -26.9], [94.1, -24.9], [96.8, -21.9], [99, -14.9], [100.3, -8], [101.2, -3]],
    half:   [[-24.9, 3.6], [-13.3, 9.8], [0, 17.8], [15.5, 28.4], [31.1, 34.6], [44.4, 35.5], [57.7, 33.9], [65.7, 32.7], [71.9, 31.8], [79, 33.1], [85.2, 32.6], [90.6, 30.8], [94.1, 28.8], [96.8, 25.9], [99, 18.9], [100.3, 10.4], [101.2, 3.2]],
    widest: 0.45,
    neck: [52.4, 74.6],
    eye: { x: 95, y: 5.5, r: 5, shine: [8, 88, 44] },
    // the face: a broad flat dish, 50 mm tall and 58 across
    disc: { rim: 25, wide: 1.15, depth: 0.1, apart: 10.4, at: 2, back: 4.9, seam: 4.4 },
    bill: { culmen: 12, drop: 0.32, gape: 3 },
    wing: {
      chord: 136.3, wrist: [62.2, 1.8], aim: [-146.5, 9.8],
      up:   [[0, 4.9], [0.12, 18], [0.3, 23.8], [0.5, 20.5], [0.75, 12.3], [0.9, 5.7], [1, 1.2]],
      down: [[0, 3.3], [0.12, 12.3], [0.3, 16.4], [0.5, 15.6], [0.75, 11.1], [0.9, 5.3], [1, 1.2]],
      rest: 2.7, proud: 1.8,
      span: 480, shoulder: [66.6, 13.3, 20], arm: 85, lead: 16, sweep: 14, root: 102, tipChord: 61,
    },
    // short and square at its end (Ridgway)
    tail: { length: 67.4, root: 4.4, rootHalf: 10.7, feathers: 12, width: 19, closed: 0.04, graded: 2, point: 0.45, droop: 0.02, tent: 5.3 },
    // two toes forward, two back; the legs and the toes but their last joints feathered (Ridgway, of the genus)
    leg: { knee: [31.1, -20, 13.3], shin: 32, tarsus: 17, thick: [11.5, 4.9, 2.7], toes: { mid: 16, side: 13, hind: 10, claw: 9.5, hindClaw: 8.5 }, splay: 0.45, yaw: { O: 2.3 },
      feathered: { to: 'toes', full: 1 } },
  },
  poses: {
    perched: { pitch: 1.3, lift: 0.5, head: { pitch: 0 }, tail: { pitch: 0 }, feet: { mode: 'grip', width: 0.02, round: 0.02, toeOut: 0.3 } },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.05, hand: 0.02, tail: { fan: 0.3 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: WHITE, shaft: CHESTNUT, shaftWidth: 0.55, size: 10 },                                                // under parts white, broadly striped with chestnut-brown (R)
      { where: (p) => p.x < 2 && p.a < 0.4, colour: WHITE, size: 8 },                                                 // under tail coverts white (R)
      { where: (p) => p.x >= 2 && p.x < 22 && p.a < 0.14, colour: WHITE, size: 8 },
      { where: (p) => p.x >= 74 && p.a < 0.45, colour: WHITE, bars: [CHESTNUT, 1, 0.2], size: 7 },                    // a band of brown spots across the throat (R)
      { where: (p) => p.a >= 0.5, colour: BROWN, size: 10 },                                                          // upper parts reddish brown (R)
      { where: (p) => p.a >= 0.5 && p.x >= 46 && p.x < 66, colour: BROWN, bars: [WHITE, 1, 0.16], size: 9 },         // the lower hindneck spotted white (R)
      { where: (p) => p.a >= 0.6 && p.x >= 66, colour: BROWN, shaft: WHITE, shaftWidth: 0.18, size: 6 },              // the crown narrowly streaked with white (R)
    ],
    wing: {
      web: [19, 32, 25], edge: [20, 30, 33], tertial: BROWN, covert: BROWN, lesser: DARK, lesserEdge: [19, 34, 27],
      medianTip: [WHITE, 0.26], greaterTip: [WHITE, 0.2], tertialTip: null, patchSkip: 0,
      // the outer primaries spotted with white along their edge (R), three or four spots (O)
      primaryBars: [[0.28, 0.34, WHITE, 'outer'], [0.47, 0.53, WHITE, 'outer'], [0.66, 0.72, WHITE, 'outer'], [0.84, 0.89, WHITE, 'outer']],
      secondaryBars: [[0.3, 0.38, [24, 20, 62], 'inner'], [0.55, 0.63, [24, 20, 62], 'inner'], [0.78, 0.85, [24, 20, 62], 'inner']],
      tertialBars: [],
      greaterBars: [[0.55, 0.7, WHITE, 'outer']],                                                                       // a few white spots on the outer larger coverts (R)
      under: [24, 16, 56], underCovert: [30, 40, 82], underCovertTip: null,
      underBars: [[0.2, 0.3, WHITE, 'both'], [0.42, 0.52, WHITE, 'both'], [0.64, 0.74, WHITE, 'both'], [0.84, 0.92, WHITE, 'both']],
      fold: { primaries: 7, secondaries: 7, secondaryEnd: 0.72, greater: 9, greaterEnd: 0.42, median: 8, medianEnd: 0.25 },
      spread: { primaries: 9, secondaries: 9, shape: [0.6, 0.78, 0.9, 0.97, 1, 1, 0.99, 0.96, 0.92] },
    },
    // two or three broken narrow white bands, and a white tip (R)
    tail: { web: [19, 32, 23], edge: [20, 28, 30], under: [24, 16, 52], point: 0.45, bars: [WHITE, 3, 0.045],
      tip: [[0, WHITE, 0.05], [1, WHITE, 0.05], [2, WHITE, 0.05], [3, WHITE, 0.05], [4, WHITE, 0.05], [5, WHITE, 0.05]] },
    bill: { upper: [0, 0, 9], lower: [0, 0, 13] },                                                                      // black (R)
    mouth: [8, 30, 42],
    eye: { iris: [52, 92, 54], pupil: [225, 30, 6] },                                                                   // lemon yellow (R)
    leg: [46, 30, 60],                                                                                                   // the bare parts of the toes pale dull yellowish (R)
    shin: [32, 40, 80],                                                                                                  // the legs pale buff (R)
    // the face buffy white to cinnamon-buff, broadly streaked with brown; the ruff streaked brown and white, the brown
    // the more; white brows; the eye margined above and in front with dusky (R); black bristles at the bill (O)
    disc: { face: [30, 34, 80], rim: [20, 32, 30], band: [19, 38, 30], streak: WHITE, rays: [[19, 40, 36], 9], brow: WHITE, bristle: [0, 0, 10],
      eyering: [18, 28, 16], eyeringWide: 0.28, pupil: 0.52 },
  },
};
