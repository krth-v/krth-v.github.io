// Barred Owl, Strix varia: the adult (the sexes are alike in plumage; the female is the larger). The birds of the
// Pacific Northwest are the eastern form, varia, which spread west through the last century (Wikipedia: across
// Washington by 1965), so Ridgway's eastern males are the ones built.
//
// What is published and what is not. The wing, tail, culmen and length under `published` are Ridgway's for eleven
// adult males of the eastern form, and the bird is built to their means; the wingspan is his, for males in life.
// No tarsus was found but one bird's (Wikipedia: "One nominate bird had a tarsal length of 63.5 mm"), and no toe at
// all. The colours follow his description tract by tract; the rings on the face are counted as owling.com counts
// them (four or five). The outline of head and body, how big the face is and where the eyes sit in it, how the folded
// wing lies, the toes, and how the legs are hidden in the belly's feathers are in nothing that was read: they are the
// agent's drawing, for the owner to judge from the contact sheet.
//
// How the sources were read: Ridgway's text through the Internet Archive's character recognition of the volume,
// read directly (by two agents, one reading and one checking it); Wikipedia and owling.com through a tool that
// returns a page's text or a summary of it. No page was seen as an image.
//
// Its eyes in a light (shape.eye.shine, life/parts/owl.js): what was read is that "most owls have red eyeshine"
// (Wild About Utah, H. Strand, 2008), that "Barred Owls have strong red eyeshine" (PEI Untamed, K. MacQuarrie), and
// that eyeshine is seen with the light held at the eye, looking down its beam (Wild About Utah). How strong, how
// wide the angle it is seen within, and its exact colour are the agent's.

const R = 'Ridgway 1914, The Birds of North and Middle America, Part VI (U.S. National Museum Bulletin 50), Strix varia varia, p. 641-642';

export const published = {
  shown: 'adult (the sexes are alike)',
  note: 'Published (Ridgway): head, neck, chest, back, scapulars and rump broadly and regularly barred with pale buff or buffy white and deep brown (bister or warm sepia), the brown terminal, broader than the pale bars above and narrower on the neck and chest; the breast barred too, the brown bars joined by a streak down the middle of each feather; each feather of the belly, sides and flanks with a broad brown stripe down its middle, the under tail coverts with narrower ones, the vent plain buffy white; the face greyish white with concentric half rings of brown; brows and lores greyish white with black shafts; a narrow black crescent against the front of the eye; the ruff round the face barred blackish brown and buffy white; the middle and greater wing coverts with round white spots on their outer webs, the lesser coverts plain deep brown; about six pale greyish-brown bands across the secondaries; square pale-brown spots on the outer webs of the primaries, about eight on the longest; the tail brown, crossed by six or seven sharply defined pale-brown bands; the legs with faint brown bars; the bill dull buff-yellowish; the iris very dark brown; the bare part of the toes dull yellowish, the claws dark horn, blackish at the tips. Ridgway: the base of the toes densely feathered, their middle scantily feathered or bristled; Wikipedia: the tarsi and toes feathered up to the talons. Not found in what was read, and the agent\'s: the toes\' lengths, the outline, the size of the face, how far the folded wings reach.',
  sources: {
    R: `${R}: eleven adult males (seven females), museum skins, of eastern and central North America; the span in life from his footnote`,
    W: 'Wikipedia, "Barred owl" (read 2026-11-16): one bird\'s tarsus; the wingspan 96 to 125 cm; the tarsi and toes feathered up to the talons; four or five whitish tail bars',
    O: 'owling.com, Barred Owl Biology: the face with four to five concentric semicircular brown rings; males about 635 g, females about 815 g (not checked by a second reader)',
    B: 'Seattle Audubon, BirdWeb, Barred Owl: old and mature second-growth forest, swamps, near openings; rare in May on the Pacific Northwest coast',
  },
  lengths: [
    ['wing', 'Wing, folded', 332.8, [320, 340], 'R'],
    ['tail', 'Tail', 225.4, [215, 230], 'R'],
    ['culmen', 'Culmen from the cere', 25.1, [23.5, 27], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 471, [450, 495], 'R'],
    ['tarsus', 'Tarsus (one bird)', 63.5, [63.5, 63.5], 'W'],
    ['span', 'Wingspan, males in life', null, [1143, 1219], 'R'],
  ],
  proportions: [
    'A large, round-headed owl with no ear tufts (Ridgway, of the genus; BirdWeb)',
    'Tail about two thirds of the wing (Ridgway)',
    'Relatively large eyes, the iris always dark brown (Ridgway, of the genus)',
    'Tarsus completely feathered, the toes but their last joint feathered too (Ridgway, of the genus; Wikipedia)',
    'In life 501 to 533 mm long, the wings 1143 to 1219 mm across (Ridgway\'s males)',
  ],
  mass: 'Males about 635 g, females about 815 g (O); females 610 to 1150 g (W)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]
const BROWN = [27, 34, 27], DARK = [22, 32, 15], BUFF = [37, 42, 74], WHITE = [40, 30, 86], PALE = [32, 30, 54], GREYBROWN = [30, 14, 50];

export default {
  name: 'Barred Owl', latin: 'Strix varia', key: 'barred-owl', seed: 401,
  // ---- who is about on a visit (life/species/index.js says what each is). 'dusk': by day the few that are about are at roost.
  census: { tier: 'few', source: 'B R on the coast; P U', clock: 'dusk' },
  // ---- how it lives on a visit (life/families/owl.js says what each number is). What was read (B, W): a perch
  // hunter that waits and then swoops without a sound on what it has seen or heard (small mammals, birds, frogs,
  // crayfish, large insects), gliding from perch to perch until it finds something; most active by night, but it
  // calls and hunts by day too; it calls eight hoots, "who cooks for you, who cooks for you all" (W, O); it nests
  // in hollows in May. Where in a tree it roosts, how high it hunts from, how near it lets a walker come, and every
  // other number here are the agent's own.
  way: {
    family: 'owl', there: 0.7, gap: [60, 240], ousts: true,
    hz: 3.2, speed: 7, glide: 0.55,
    // it sits tight: put up only by a walker within 3 m (further for one who runs) or by a sudden movement within 4,
    // and it roosts 6 m up and more, so a walker passes beneath it
    flush: 3, startle: 4, near: 0.85, gone: 0.15,
    doze: 2.4, apart: 300,
    roost: { trees: ['mature', 'cedar', 'spruce'], low: 6, high: 14, off: 26, thin: 0.03 },
    hunt: { low: 2.5, high: 9, thin: 0.03, reach: [15, 60], wait: [20, 80], drop: 0.35, floor: [3, 12], stay: [4, 14], catch: 0.35 },
    song: { every: [45, 200], time: 4.1, reach: 400, doing: 'calling: eight hoots, who cooks for you, who cooks for you-all', day: 0.08 },
  },
  voices: {
    song: { file: 'barredowl-hoots.mp3', level: 0.9, near: 25,
      credit: { what: "Barred Owl, 'who cooks for you' hoots (recorded in Florida)", by: "Tom Cosburn, Florida; British Library Board (Wikimedia Commons)", licence: "CC BY 4.0: cut and filtered",
        licenceUrl: 'https://creativecommons.org/licenses/by/4.0/', source: 'https://commons.wikimedia.org/wiki/File:Barred_Owl_(Strix_varia)_(W1CDR0000351_BD27).ogg', bytes: 1713629, kept: 4.1 } },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 50 cm long, wings 114 to 122 cm across: a big, round-headed owl with no ear tufts.',
    marks: ['Dark eyes in a pale grey face ringed with brown', 'Barred across the throat and upper breast, streaked lengthwise below', 'Brown above, barred and spotted with white', 'A pale yellow bill'],
    lives: 'Old and mature forest, often near water. By day it roosts in a tree, still and hard to see; from dusk it hunts from a perch, watching the floor, and drops onto small mammals, frogs and crayfish. Its call is eight hoots, "who cooks for you, who cooks for you all". It came west in the last century and has taken over many of the Spotted Owl\'s territories.',
  },
  plate: { wide: 1.2, bar: 0.1 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 228. The head is round, about
    // 126 mm long, 126 tall and 132 wide, its middle at x = 180; its front is the face (life/parts/owl.js), whose rim
    // lies where the head is as big round as the face, 11 mm behind the bill's base, and whatever of the head's own
    // skin lies in front of the face is pressed back behind it.
    top:    [[-50, 2], [-25, 10], [0, 19], [30, 33], [65, 47], [100, 56], [130, 58], [145, 58], [160, 63], [175, 68.5], [188, 70], [200, 67.5], [209, 63], [215, 58], [219, 50], [223, 36], [226, 20], [228, 8]],
    bottom: [[-56, -4], [-30, -15], [0, -36], [35, -62], [70, -78], [100, -80], [130, -71], [148, -63], [162, -58], [178, -58], [192, -57], [204, -54], [212, -50], [218, -44], [223, -30], [226, -16], [228, -6]],
    half:   [[-56, 8], [-30, 22], [0, 40], [35, 64], [70, 78], [100, 80], [130, 75], [148, 68], [162, 64], [178, 66.5], [192, 65.5], [204, 62], [212, 58], [218, 52], [223, 38], [226, 21], [228, 6.5]],
    widest: 0.45,
    neck: [118, 168],
    eye: { x: 214, y: 11, r: 8.5, shine: [8, 88, 44] },
    // the face: a dish 96 mm tall and 108 across, the eyes 19.5 mm either side of its middle
    disc: { rim: 48, wide: 1.12, depth: 0.16, apart: 19.5, at: 4, back: 11, seam: 10 },
    bill: { culmen: 25.1, drop: 0.3, gape: 6 },
    wing: {
      chord: 332.8, wrist: [140, 4], aim: [-330, 22],
      up:   [[0, 12], [0.12, 44], [0.3, 58], [0.5, 50], [0.75, 30], [0.9, 14], [1, 3]],
      down: [[0, 8], [0.12, 30], [0.3, 40], [0.5, 38], [0.75, 27], [0.9, 13], [1, 3]],
      rest: 6, proud: 4,
      span: 1181, shoulder: [150, 30, 45], arm: 210, lead: 40, sweep: 35, root: 250, tipChord: 150,
    },
    // long and rounded, of broad soft feathers
    tail: { length: 225.4, root: 10, rootHalf: 24, feathers: 12, width: 44, closed: 0.04, graded: 28, point: 0.55, droop: 0.02, tent: 12 },
    // The outer toe turned back, as an owl perches (two toes forward, two back); the legs feathered to the toes'
    // last joints (life/parts/owl.js).
    leg: { knee: [70, -45, 30], shin: 72, tarsus: 63.5, thick: [26, 11, 6], toes: { mid: 36, side: 30, hind: 22, claw: 22, hindClaw: 20 }, splay: 0.45, yaw: { O: 2.3 },
      feathered: { to: 'toes', full: 0.9 } },
  },
  poses: {
    // upright on a branch, as an owl sits: the head level, the tail hanging in line with the body
    perched: { pitch: 1.3, lift: 0.5, head: { pitch: 0 }, tail: { pitch: 0 }, feet: { mode: 'grip', width: 0.045, round: 0.04, toeOut: 0.3 } },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.05, hand: 0.02, tail: { fan: 0.3 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: WHITE, shaft: BROWN, shaftWidth: 0.42, size: 22 },                                                   // belly, sides and flanks: a broad brown stripe down each feather (R)
      { where: (p) => p.x < 2 && p.a < 0.4, colour: WHITE, shaft: BROWN, shaftWidth: 0.2, size: 18 },                // under tail coverts: narrower stripes (R)
      { where: (p) => p.x >= 2 && p.x < 40 && p.a < 0.14, colour: WHITE, size: 16 },                                 // the vent plain buffy white (R)
      { where: (p) => p.x >= 118 && p.x < 170 && p.a < 0.5, colour: WHITE, bars: [BROWN, 2, 0.1], shaft: BROWN, shaftWidth: 0.16, size: 17 },  // breast: barred, the bars joined by a streak (R)
      { where: (p) => p.x >= 170 && p.a < 0.5, colour: BUFF, bars: [BROWN, 3, 0.075], size: 12 },                     // neck and chest: barred, the brown bars the narrower (R)
      { where: (p) => p.a >= 0.5, colour: BROWN, bars: [BUFF, 3, 0.085], size: 20 },                                  // back, scapulars, rump: the brown bars the broader (R)
      { where: (p) => p.a >= 0.5 && p.x >= 150, colour: BROWN, bars: [BUFF, 3, 0.09], size: 12 },                     // nape and crown, the same, finer
    ],
    wing: {
      web: [27, 30, 30], edge: [30, 24, 40], tertial: BROWN, covert: BROWN, lesser: DARK, lesserEdge: [25, 30, 22],   // lesser coverts plain deep brown (R)
      medianTip: [WHITE, 0.28], greaterTip: null, tertialTip: [PALE, 0.08], patchSkip: 0,
      // square pale-brown spots on the primaries' outer webs, about eight on the longest (R)
      primaryBars: [[0.1, 0.15, PALE, 'outer'], [0.21, 0.26, PALE, 'outer'], [0.32, 0.37, PALE, 'outer'], [0.43, 0.48, PALE, 'outer'], [0.54, 0.59, PALE, 'outer'], [0.65, 0.7, PALE, 'outer'], [0.76, 0.81, PALE, 'outer'], [0.88, 0.94, PALE, 'outer']],
      // about six pale greyish-brown bands across the secondaries, the last whitish at the margin (R)
      secondaryBars: [[0.08, 0.15, GREYBROWN, 'both'], [0.23, 0.3, GREYBROWN, 'both'], [0.38, 0.45, GREYBROWN, 'both'], [0.53, 0.6, GREYBROWN, 'both'], [0.68, 0.75, GREYBROWN, 'both'], [0.86, 0.95, [36, 22, 70], 'both']],
      tertialBars: [[0.2, 0.28, GREYBROWN, 'both'], [0.45, 0.53, GREYBROWN, 'both'], [0.7, 0.78, GREYBROWN, 'both']],
      greaterBars: [[0.42, 0.55, WHITE, 'outer'], [0.7, 0.82, WHITE, 'outer']],                                           // round white spots on the greater coverts' outer webs (R)
      under: [36, 22, 72], underCovert: [38, 34, 84], underCovertTip: null,
      underBars: [[0.12, 0.2, GREYBROWN, 'both'], [0.34, 0.42, GREYBROWN, 'both'], [0.56, 0.64, GREYBROWN, 'both'], [0.78, 0.86, GREYBROWN, 'both']],
      fold: { primaries: 7, secondaries: 7, secondaryEnd: 0.72, greater: 9, greaterEnd: 0.42, median: 8, medianEnd: 0.25 },
      spread: { primaries: 9, secondaries: 9, shape: [0.6, 0.78, 0.9, 0.97, 1, 1, 0.99, 0.96, 0.92] },
    },
    tail: { web: BROWN, edge: [28, 26, 34], under: [32, 20, 62], point: 0.5, bars: [PALE, 7, 0.05] },                // six or seven sharply defined pale-brown bands (R)
    bill: { upper: [48, 40, 70], lower: [48, 36, 64] },                                                                 // dull buff-yellowish (R)
    mouth: [8, 30, 42],
    eye: { iris: [22, 34, 9], pupil: [225, 30, 7] },                                                                     // the iris very dark brown, the pupil looking blue beside it (R)
    leg: [48, 30, 54],                                                                                                   // the bare toes dull yellowish (R)
    shin: [38, 32, 80],                                                                                                  // the feathered legs pale buff (R: with faint brown bars)
    // the face: greyish white with four or five brown half rings round each eye (R, O), the brows pale, the bristles
    // about the bill pale with dark shafts, a narrow black crescent before the eye, the ruff blackish brown barred buff (R)
    disc: { face: [32, 10, 74], rim: [24, 32, 22], band: [27, 30, 36], streak: BUFF, rings: [[28, 30, 40], 5], brow: [38, 8, 82], bristle: [32, 10, 58], eyering: [20, 28, 8], eyeringWide: 0.28 },
  },
};
