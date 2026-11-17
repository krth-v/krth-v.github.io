// Western Screech-Owl, Megascops kennicottii kennicottii: the adult of the brown phase (the sexes are alike in
// plumage). Ridgway knew it as Otus asio kennicottii, Kennicott's Screech Owl, of the coast from western Washington
// northward, and found the grey phase rare in it (one adult in twenty-one).
//
// What is published and what is not. The wing, tail, culmen (from the cere) and length under `published` are
// Ridgway's for adult males of this form, and the bird is built to their means; the wingspan's range is Wikipedia's
// and Audubon's, for both sexes, and the span built is the agent's within it. Ridgway describes this form only by
// comparison ("dark and browner ... upper parts inclining to tawny-brown, markings brownish buff or pale cinnamon;
// under parts more or less strongly suffused with pale cinnamon; legs, especially thighs, light tawny"); the pattern
// of each tract is his description of the eastern form, asio, which he says the genus shares, painted in this
// form's colours. No tarsus, toe or ear tuft was found in millimetres; the tarsus is built "slightly longer than the
// middle toe with its claw" (Ridgway, of the genus). The outline of head and body, the size of the face and the
// tufts, how the folded wing lies, and the bill's colour (the sources disagree: Audubon and BirdWeb have it dark,
// with a blackish base, Ridgway's eastern bird pale greyish green) are the agent's.
//
// How the sources were read: Ridgway's text through the Internet Archive's character recognition of the volume, read
// by one agent and checked against it by a second; BirdWeb, the Audubon Field Guide and Wikipedia through a tool
// that returns a page's text. No page was seen as an image.
//
// Its eyes in a light (shape.eye.shine): no source read says whether its eyes shine, or in what colour. The red is
// the Barred Owl's (life/species/barredOwl.js), and is the agent's call here.

const R = 'Ridgway 1914, The Birds of North and Middle America, Part VI (U.S. National Museum Bulletin 50), Otus asio kennicottii, p. 698-699; the eastern form, p. 687-688';

export const published = {
  shown: 'adult, brown phase (the sexes are alike)',
  note: 'Published (Ridgway, of this form): dark, browner than the forms east of it, the upper parts inclining to tawny-brown with brownish buff or pale cinnamon markings, the under parts suffused with pale cinnamon, the thighs light tawny. Published of the eastern form, whose pattern the genus shares: the upper parts finely mottled with dusky, a streak or a chain of spots along each feather\'s shaft; the outer scapulars and the outermost middle and greater coverts with large pale spots; quadrate pale spots on the primaries; the secondaries with narrow pale bands; the tail with seven or eight narrow broken bands; the face greyish, narrowly barred with dusky, the rim of the face mostly black; the lores with black shafts; the under parts white with dense narrow black bars and broad black streaks joined to them; the middle of the belly plain; the iris lemon yellow, the eyelids black. Not found, and the agent\'s: the tarsus, the toes and the ear tufts in millimetres, the outline, the bill\'s colour (the sources disagree).',
  sources: {
    R: `${R}: adult males of this form, museum skins`,
    W: 'Wikipedia, "Western screech owl" (read 2026-11-16): 22 cm long and 55 cm across the wings on average; 88 to 220 g',
    A: 'Audubon Field Guide, Western Screech-Owl: 55 to 61 cm across; the bill\'s base blackish; the bouncing-ball song; direct flight with rapid wingbeats',
    B: 'Seattle Audubon, BirdWeb, Western Screech-Owl: open woodland and wooded streamsides, often deciduous or mixed, nesting in cottonwood or bigleaf maple; uncommon in May on the coast',
  },
  lengths: [
    ['wing', 'Wing, folded', 176.5, [170.5, 190.5], 'R'],
    ['tail', 'Tail', 89, [82, 98.5], 'R'],
    ['culmen', 'Culmen from the cere', 15.1, [14.5, 16.5], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 231, [220, 252], 'R'],
    ['span', 'Wingspan, both sexes', null, [550, 610], 'W, A'],
  ],
  proportions: [
    'A small owl with ear tufts, often but not always raised (Ridgway, of the genus; BirdWeb)',
    'Tail about half the wing, a little rounded (Ridgway)',
    'Tarsus slightly longer than the middle toe with its claw, feathered; the toes bristled (Ridgway, of the genus)',
    'About the size of an American Robin (Audubon)',
  ],
  mass: '88 to 220 g, both sexes, 143 g on average (W)',
};

// the colours, as paint: [hue, saturation, lightness]
const BROWN = [25, 30, 31], DARK = [20, 24, 12], TAWNY = [24, 40, 46], PALE = [28, 30, 82], CINNAMON = [24, 42, 72];

export default {
  name: 'Western Screech-Owl', latin: 'Megascops kennicottii', key: 'western-screech-owl', seed: 403,
  // ---- who is about on a visit (life/species/index.js says what each is). 'dusk': by day the few about are at roost.
  census: { tier: 'very rare', source: 'B U; P U', clock: 'dusk' },
  // ---- how it lives on a visit (life/families/owl.js says what each number is). What was read (A, B, W): it is
  // abroad at dusk and by night (the coast's birds are sometimes about on cloudy days); it hunts by watching from a
  // perch and swooping down onto what is on the ground or in the leaves, and catches insects in the air; it flies
  // straight, on quick beats; it keeps to deciduous and mixed wood along streams; its song is a run of short low
  // whistles that speed up, a bouncing ball. Which trees, how high, how near it lets a walker come, and every other
  // number here are the agent's own.
  way: {
    family: 'owl', there: 0.7, gap: [60, 240],
    hz: 5.5, speed: 6, glide: 0.25, flies: 'flying straight to another perch, on quick beats',
    flush: 2, startle: 3, near: 0.85, gone: 0.15,
    doze: 2.6, apart: 200,
    roost: { trees: ['maple', 'alder', 'apple'], low: 3, high: 9, off: 26, thin: 0.015 },
    hunt: { low: 1.5, high: 6, thin: 0.015, reach: [8, 40], wait: [15, 60], drop: 0.4, floor: [2, 8], stay: [3, 10], catch: 0.4 },
    song: { every: [30, 150], time: 2.2, reach: 300, doing: 'calling: short low whistles that speed up, a bouncing ball' },
  },
  voices: {
    // the one CC BY recording found (Freesound 583099) showed no screech-owl's call in its spectrogram
    song: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 22 cm long, wings 55 to 61 cm across: a robin-sized owl with ear tufts.',
    marks: ['Yellow eyes in a grey-brown face with a black rim', 'Ear tufts, often but not always raised', 'Brown, finely barred and streaked with black, like bark', 'A row of pale spots across the shoulder'],
    lives: 'Broad-leaved and mixed wood along streams: bigleaf maples, alders, cottonwoods. By day it roosts, its streaked brown lost against the bark; at dusk it watches from a low perch and swoops onto insects, mice and frogs. Its song is a run of low whistles that quicken like a dropped ball bouncing to rest.',
  },
  plate: { wide: 0.6, bar: 0.05 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 131. The Barred Owl's
    // outline at 0.576 of its size, the head a twentieth bigger again (life/species/barredOwl.js).
    top:    [[-28.8, 1.2], [-14.4, 5.8], [0, 10.9], [17.3, 19], [37.4, 27.1], [57.6, 32.3], [74.9, 33.7], [83.5, 34.4], [92.2, 38], [100.8, 41.4], [108.3, 42.3], [115.2, 40.8], [120.4, 38.1], [123.8, 35.1], [126.1, 30.2], [128.4, 21.8], [130.2, 12.1], [131.3, 4.8]],
    bottom: [[-32.3, -2.3], [-17.3, -8.6], [0, -20.7], [20.2, -35.7], [40.3, -44.9], [57.6, -46.1], [74.9, -41.2], [85.2, -37.6], [93.3, -35.1], [102.5, -35.1], [110.6, -34.5], [117.5, -32.7], [122.1, -30.2], [125.6, -26.6], [128.4, -18.1], [130.2, -9.7], [131.3, -3.6]],
    half:   [[-32.3, 4.6], [-17.3, 12.7], [0, 23], [20.2, 36.9], [40.3, 44.9], [57.6, 46.1], [74.9, 43.6], [85.2, 40.5], [93.3, 38.7], [102.5, 40.2], [110.6, 39.6], [117.5, 37.5], [122.1, 35.1], [125.6, 31.4], [128.4, 23], [130.2, 12.7], [131.3, 3.9]],
    widest: 0.45,
    neck: [68, 96.8],
    eye: { x: 123.3, y: 6.7, r: 6.2, shine: [8, 88, 44] },
    // the face: a dish 58 mm tall and 63 across
    disc: { rim: 29, wide: 1.08, depth: 0.12, apart: 12, at: 2.4, back: 6.3, seam: 5.8 },
    // the ear tufts, from the top of the head over the face (their length is the agent's)
    tufts: { long: 20, at: [118, 34], lean: 0.3, out: 0.35 },
    bill: { culmen: 15.1, drop: 0.32, gape: 4 },
    wing: {
      chord: 176.5, wrist: [80.6, 2.3], aim: [-190.1, 12.7],
      up:   [[0, 6.4], [0.12, 23.3], [0.3, 30.8], [0.5, 26.5], [0.75, 15.9], [0.9, 7.4], [1, 1.6]],
      down: [[0, 4.2], [0.12, 15.9], [0.3, 21.2], [0.5, 20.2], [0.75, 14.3], [0.9, 6.9], [1, 1.6]],
      rest: 3.5, proud: 2.3,
      span: 575, shoulder: [86.4, 17.3, 25.9], arm: 102, lead: 19, sweep: 17, root: 133, tipChord: 80,
    },
    // short, a little rounded (Ridgway)
    tail: { length: 89, root: 5.8, rootHalf: 13.8, feathers: 12, width: 24, closed: 0.04, graded: 6, point: 0.5, droop: 0.02, tent: 6.9 },
    // two toes forward, two back; the tarsus feathered, the toes bristled (Ridgway, of the genus)
    leg: { knee: [40.3, -25.9, 17.3], shin: 41.5, tarsus: 30, thick: [15, 6.3, 3.5], toes: { mid: 18, side: 15, hind: 11, claw: 11, hindClaw: 10 }, splay: 0.45, yaw: { O: 2.3 },
      feathered: { to: 'tarsus', full: 0.8 } },
  },
  poses: {
    perched: { pitch: 1.3, lift: 0.5, head: { pitch: 0 }, tail: { pitch: 0 }, feet: { mode: 'grip', width: 0.026, round: 0.025, toeOut: 0.3 } },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.05, hand: 0.02, tail: { fan: 0.3 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: PALE, bars: [DARK, 4, 0.035], shaft: DARK, shaftWidth: 0.3, size: 10 },                               // under parts: dense narrow black bars and broad black streaks joined to them (R)
      { where: (p) => p.x < 2 && p.a < 0.4, colour: PALE, bars: [DARK, 2, 0.04], size: 8 },
      { where: (p) => p.x >= 2 && p.x < 26 && p.a < 0.14, colour: [30, 30, 86], size: 8 },                           // the middle of the belly plain buffy white (R)
      { where: (p) => p.x >= 74 && p.x < 92 && p.a > 0.2 && p.a < 0.5, colour: CINNAMON, bars: [DARK, 2, 0.06], shaft: DARK, shaftWidth: 0.35, size: 9 },   // the breast's sides: the streaks spread into spots (R)
      { where: (p) => p.x >= 96 && p.a < 0.45, colour: PALE, bars: [DARK, 3, 0.04], shaft: DARK, shaftWidth: 0.2, size: 7 },   // the throat narrowly barred and streaked (R)
      { where: (p) => p.a >= 0.5, colour: BROWN, bars: [TAWNY, 3, 0.05], shaft: DARK, shaftWidth: 0.2, size: 10 },        // upper parts: finely mottled, a streak along each shaft (R)
      { where: (p) => p.a >= 0.5 && p.x >= 86, colour: BROWN, bars: [TAWNY, 2, 0.06], shaft: DARK, shaftWidth: 0.22, size: 7 },
    ],
    wing: {
      web: [25, 24, 29], edge: [25, 22, 37], tertial: BROWN, covert: BROWN, lesser: DARK, lesserEdge: [24, 26, 26],
      // the outermost middle and greater coverts with a large pale spot at the tip: the row across the shoulder (R)
      medianTip: [PALE, 0.28], greaterTip: [PALE, 0.22], tertialTip: null, patchSkip: 0,
      primaryBars: [[0.15, 0.22, [26, 28, 58], 'outer'], [0.32, 0.39, [26, 28, 60], 'outer'], [0.49, 0.56, [26, 28, 64], 'outer'], [0.66, 0.73, [26, 26, 70], 'outer'], [0.83, 0.9, PALE, 'outer']],
      secondaryBars: [[0.12, 0.2, [28, 20, 56], 'both'], [0.34, 0.42, [28, 20, 56], 'both'], [0.56, 0.64, [28, 20, 56], 'both'], [0.78, 0.86, [28, 20, 58], 'both']],
      tertialBars: [[0.25, 0.33, [28, 20, 56], 'both'], [0.55, 0.63, [28, 20, 56], 'both']],
      greaterBars: [[0.62, 0.78, PALE, 'outer']],
      under: [26, 16, 56], underCovert: [32, 42, 78], underCovertTip: null,
      underBars: [[0.15, 0.25, [34, 40, 76], 'both'], [0.37, 0.47, [34, 40, 76], 'both'], [0.59, 0.69, [34, 40, 76], 'both'], [0.8, 0.9, [34, 40, 76], 'both']],
      fold: { primaries: 7, secondaries: 7, secondaryEnd: 0.72, greater: 9, greaterEnd: 0.42, median: 8, medianEnd: 0.25 },
      spread: { primaries: 9, secondaries: 9, shape: [0.6, 0.78, 0.9, 0.97, 1, 1, 0.99, 0.96, 0.92] },
    },
    tail: { web: [25, 24, 27], edge: [25, 22, 33], under: [28, 16, 54], point: 0.5, bars: [[26, 26, 58], 7, 0.04] },        // seven or eight narrow broken bands (R)
    bill: { upper: [90, 8, 26], lower: [90, 8, 32] },                                                                    // dark, the base blackish (A, B)
    mouth: [8, 30, 42],
    eye: { iris: [52, 95, 52], pupil: [225, 30, 6] },                                                                    // lemon yellow (R)
    leg: [40, 16, 52],                                                                                                    // the toes yellowish grey (R, of the eastern form)
    shin: [24, 44, 62],                                                                                                   // the legs light tawny (R)
    // the face greyish, narrowly barred with dusky, its rim mostly black; the lores with black shafts; the eyelids
    // jet black (R)
    disc: { face: [28, 18, 64], rim: [20, 18, 10], band: BROWN, streak: [28, 24, 66], rings: [[22, 20, 34], 4], brow: [30, 16, 80], bristle: [20, 14, 26],
      eyering: [0, 0, 6], eyeringWide: 0.12, pupil: 0.5 },
  },
};
