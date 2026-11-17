// Olive-sided Flycatcher, Contopus cooperi (Ridgway's Nuttallornis borealis): the adult in spring. The sexes
// are alike in plumage (Ridgway); the lengths are his for adult males.
//
// What is published and what is not. The lengths under `published` are Ridgway's for 19 adult males of the
// species (it is monotypic; they are not specifically birds of the Pacific Northwest: his five males of the
// Pacific coast district have a wing mean of 109.6, the OCR printing "109. G"), and the bird is built to their
// means; life/measure.js measures the built bird against them. The colours follow his description tract by
// tract. The outline of head and body, where the eye sits, how the folded wing lies, the width and shape of the
// bill's base and the wingspan (built at 335 mm) are in nothing that was read: they are the agent's drawing,
// for the owner to judge from the contact sheet. The tail is built with a slight notch (the outer feathers
// longer: Ridgway "rather deeply emarginate"; how deep is the agent's).
//
// Reviewed on 2026-11-16 by a second agent, who painted the white tuft at the side of the rump (Ridgway: "usually
// concealed but capable of being spread over secondaries of the closed wing"; the card's "shows above the wing at
// times"): a small patch of white on the back just above the folded wing's edge, where it shows; it is painted
// always, which is the agent's call. Also: the white of the throat had run up the side of the head to the eye,
// through a gap between two rules (the sides of the throat are now streaked grey to a third of the way round, and
// slaty above that); and the pale tips of the greater coverts and the edges of the tertials, laid as bright as a
// wing bar, are now as narrow and dull as Ridgway's "narrowly edged" and "grey white" read.
//
// How the sources were read: one agent reading and one checking, through the Internet Archive's character
// recognition of the Google scan (the full text), by search for the printed lines; the digits read clean. No
// page was seen as an image. Ridgway's table does not say whether the middle toe is measured with its claw: his
// text for the genus has the tarsus shorter than the "middle toe with claw", so it is probably without, which is
// how it is built, but that is not stated. The wingspan (31.5 to 34.5 cm Wikipedia, 33 to 36 cm Audubon) was
// read by one agent through a summary tool and was not checked by the second: it is used only as a range.

const R = 'Ridgway 1907, The Birds of North and Middle America, Part IV (U.S. National Museum Bulletin 50), Nuttallornis borealis, p. 506';

export const published = {
  shown: 'adult, spring (the sexes alike)',
  note: 'Published: the lengths above, and the colour of each tract as Ridgway has it (above plain slaty olive or dark smoke grey, the feathers of the crown darker down their middles; the sides of the head and neck the same; wings sooty blackish, the middle coverts margined at the end with grey olive, the greater coverts narrowly edged with it and whitish at the tips, the secondaries edged with grey white, broader on the tertials; tail dusky, its feathers edged with grey olive; the chest at its sides, the sides of the breast and the flanks brownish grey tinged with olive and indistinctly streaked darker, like an unbuttoned vest; the throat and the middle of the belly white, often tinged pale yellow, the sides of the throat and the middle of the chest streaked brownish grey; the under tail coverts white with broad V-shaped marks of brownish grey; upper mandible brownish black, lower pale brownish with its end dusky; iris brown; legs and feet dusky brown), and in shape the long pointed wing (the ninth primary longest, the tips of the primaries projecting past the secondaries by much more than a third of the wing), the tail about a third as long as the wing and rather deeply notched, the tarsus shorter than the middle toe with its claw, and a bill much shorter than the head, moderately broad and little flattened at the base, hooked at the tip. Not found in what was read, and the agent\'s: the outline of head and body, the bill\'s depth and width at the base, the eye\'s place and size, the wing\'s outline, the wingspan (built at 335 mm), how deep the tail\'s notch is, how pale the streaking of the chest is, the colour of the inside of the mouth, and the upright carriage on the perch (the sources have that it sits upright on the top of a dead branch; the angle is the agent\'s). The white tuft at the sides of the rump ("usually concealed but capable of being spread over secondaries of the closed wing") is painted as a small patch just above the folded wing, always shown (the agent\'s). Whether the middle toe was measured with its claw is not said.',
  sources: {
    R: `${R}: 19 adult males, museum skins (read through the Internet Archive\'s text of the scan, checked by a second reader)`,
    W: 'Wikipedia, "Olive-sided flycatcher" (read by one agent through a summary tool, not checked): wingspan 31.5 to 34.5 cm, 28 to 40 g; the head feathers can be raised',
    A: 'Audubon Field Guide, Olive-sided Flycatcher (read by one agent through a summary tool, not checked): wingspan 33 to 36 cm, 25 to 34 g, direct flight with rapid wingbeats, pointed wings',
    B: 'Seattle Audubon, BirdWeb, Olive-sided Flycatcher (read by one agent, and again by a second on 2026-11-16 through a tool that answers from the page\'s text): "sits high in a treetop, darting out after a flying insect, then returns to its perch"; "It vocalizes frequently"; song "quick, three beers", call "pip-pip-pip"; logged areas, clearings and edges',
    M: 'McBeath, Gibbons and Staicer, "Foraging behaviour explains characteristics of Olive-sided Flycatcher breeding habitat in Nova Scotia" (an abstract, read 2026-11-16): perch trees averaged 16.3 m; nearly a third were snags; most live perch trees had emergent crowns; the birds sat on treetops beside small gaps',
    O: 'Oregon Conservation Strategy, Olive-sided Flycatcher (read 2026-11-16): open forests, often near water; "Tall (>12 m) snags or trees provide foraging perches where birds are often conspicuous"',
  },
  lengths: [
    ['wing', 'Wing, folded', 109.9, [105, 114.5], 'R'],
    ['tail', 'Tail', 71.9, [68, 77.5], 'R'],
    ['culmen', 'Exposed culmen', 17.1, [15.5, 18.5], 'R'],
    ['tarsus', 'Tarsus', 14.9, [14.5, 15.5], 'R'],
    ['midToe', 'Middle toe (with or without claw is not said)', 12, [11.5, 12.5], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 175, [165, 188], 'R'],
    ['span', 'Wingspan (two secondary sources, not checked)', null, [315, 360], 'W'],
  ],
  proportions: [
    'The tail about two thirds of the wing (71.9 to 109.9: worked out from Ridgway\'s means; his text has it about a third as long as the wing, which his own figures do not bear out)',
    'The tarsus short: about a seventh of the wing (14.9 to 109.9), as his text has it',
    'Ridgway\'s text, as it was read, gives the bill as shorter than the head; Wikipedia, through a summary, as relatively long',
  ],
  mass: 'Mass 25 to 40 g: 28 to 40 (W), 25 to 34 (A)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]
// (darker than the names read: "slaty olive" and "smoke grey" laid as light as they sound make a pale grey bird)
const BACK = [80, 7, 19], CROWN = [80, 6, 13], SIDE = [80, 7, 20], VEST = [72, 8, 24], FLANK = [66, 9, 38], WHITE = [56, 22, 80], THROAT = [56, 10, 66];
const SOOT = [60, 6, 11], OLIVE_EDGE = [76, 12, 32], GREY_WHITE = [60, 6, 46], PALE = [58, 6, 40], TUFT = [56, 16, 84];

// feathers are small on the head and grow down the neck
const size = (p) => (p.x > 66 ? 3.2 : p.x > 52 ? 4.6 : 6.2);
const head = (p) => p.x > 66;
// Where along the body (mm) a feather picked at p shows. The painter (life/plumage.js) takes a feather's colour from a
// point 3 mm behind the feather's root, and what shows of a feather is its end, the rest lying under the next one
// forward: so a mark made of feathers `size` long shows about 3.4 - size mm forward of where its rule has it (read
// from the painter, and seen on the Empidonax' contact sheets).
const shows = (p, size) => p.x + 3.4 - size;
// The tuft: on the back just above the folded wing, over the rump. Under the wing's outline the painter lays the wing's
// own colour on the skin, so the patch is kept above the wing's upper edge, which comes up the side from about a
// third of the way below the back's midline at 30 mm to near it at the rump (worked out from the wing's outline below,
// and looked at on the sheet).
const wingTop = (x) => (x < 8 ? 0.8 + (8 - x) * 0.022 : 0.8 - (x - 8) * 0.0045);
const tuft = (p) => { const x = shows(p, 4.6); return x > 4 && x < 24 && p.a > wingTop(x) - 0.01 && p.a < wingTop(x) + 0.11; };

export default {
  name: 'Olive-sided Flycatcher', latin: 'Contopus cooperi', key: 'olive-sided-flycatcher', seed: 151,
  // ---- who is about on a visit (life/species/index.js says what each field is); how it lives on one and its voices are to come
  census: { tier: 'few', source: 'B F (not confirmed by the second reader); arriving; forest openings and tall snags' },
  // ---- how it lives on a visit (life/families/sallier.js). It "sits high in a treetop, darting out after a flying
  // insect, then returns to its perch" (B), in open forest near water, at edges and openings (B, O), on the tops of
  // tall trees with crowns that stand over the rest, and of snags (M, O). Here it sits on the tops of snags, 12 to 27 m
  // up (M's perch trees averaged 16.3 m; O has them over 12 m). Not on living trees: the tip of an alder is inside its
  // painted crown (a close-up of one there, 25 m up, was a frame of leaves), and the valley's spruces and the old wood's
  // conifers stand 28 m and more. And on every snag, under the old wood's crowns as well as at its edges: of the 27
  // snags within 46 m of the walk, only about one in ten stands in air a quarter open or more (all on the hill), and
  // held to those it would be on the same two or three snags on every visit, where the owner asked that no spot always
  // have its animal. Both are the agent's calls. It does not flick, and takes nothing from leaves. "It vocalizes
  // frequently" (B): it calls and sings often, and its song carries far. Its song is the Park Service's recording, and
  // what it does is fitted to it (three notes in 1.35 s); no recording of its call was found that may be used. Every
  // distance, time and chance is the agent's own.
  way: {
    family: 'sallier', there: 0.4, gap: [90, 300],
    // Where it sits (the agent's numbers, changed 2026-11-16; the note above this block is of the first ones: the
    // tops of snags alone, 12 to 27 m up, its range's middle within 30 m of the walk and 40 m round). The 27 snags
    // within 46 m of the walk stand 14 to 23 m tall, and a bird on the top of one is looked up at too steeply to be
    // in a walker's view until it is too far off to be made out: over 300 counted walks it was about on 61 and in
    // sight on 1. So it sits on the stubs of broken limbs as well, from 7 m up (the habitat reads them to 13 m), and
    // its range is nearer the walk and smaller.
    homeOff: 18, range: 28, reach: 28, apart: 80, need: 1,
    kinds: ['snag', 'stub'], heights: [7, 27],
    hz: 17, speed: 8, spell: [60, 180], stay: [60, 180],
    flush: 9, startle: 20, near: 0.5, gone: 0.35,
    sally: { every: [8, 30], reach: [4, 12], rise: [-3, 4] }, glean: 0, back: 0.95,
    watching: 'sitting bolt upright on a high dead perch, watching the air',
    call: { every: [8, 22], time: 0.9, rate: 3.5, reach: 70, doing: 'calling: a firm "pip, pip, pip"' },
    song: { chance: 0.5, time: 1.35, rate: 3, reach: 120, doing: 'singing: "quick, three beers"', notes: [[0.17, 0.27], [0.49, 0.81], [0.89, 1.19]] },
  },
  voices: {
    song: { file: 'osfl-song.mp3', level: 0.7, near: 9,
      credit: { what: "Olive-sided Flycatcher, song (the \"quick three beers\")", by: "J. Job, National Park Service, Rocky Mountain NP sound library, 2017", licence: "public domain (US federal work): cut and filtered; credit \"National Park Service\"",
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-olivesidedflycatcher.htm', bytes: 1170464, kept: 1.35 } },
    call: { silent: true },           // (nothing found for it)
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 16.5 to 19 cm long and 25 to 40 g: between a sparrow and a robin, with a big head and a short tail.',
    marks: ['Dark olive-grey above, with a big head', 'Pale throat and belly between dark sides, like an unbuttoned vest', 'Long pointed wings, with narrow pale edges', 'A white tuft that shows above the wing at times'],
    lives: 'The edges and openings of conifer forest, often near water, from late spring. It sits bolt upright on the very top of a tall tree or a dead one, flies out after a bee or a wasp, and comes back to the same perch. It calls often, and its song carries far: "quick, three beers".',
  },
  plate: { wide: 0.4, bar: 0.03 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 87
    top:    [[-12, 3], [-4, 9], [10, 17], [26, 22], [42, 24.5], [56, 25], [66, 26.2], [72, 30.4], [78, 30], [83, 25.6], [86, 20.4], [87, 16]],
    bottom: [[-14, -1], [-6, -8], [8, -16], [24, -21], [40, -22.5], [54, -20.5], [64, -16], [72, -11], [79, -5], [84, 0], [87, 5.2]],
    half:   [[-14, 3], [-6, 8], [8, 14], [24, 18.5], [40, 19.8], [54, 19], [64, 17.6], [72, 16.5], [79, 14.5], [84, 10.6], [87, 6.6]],
    widest: 0.46,
    neck: [62, 76],
    eye: { x: 77.5, y: 15, r: 3.1 },
    bill: { culmen: 17.1, drop: 0.05, gape: 7 },
    wing: {
      chord: 109.9, wrist: [62, -2.2], aim: [-108, 9],
      // long and pointed: the primaries project far past the secondaries, which end 0.58 of the way along
      up:   [[0, 3.5], [0.12, 12], [0.3, 15], [0.5, 13], [0.72, 8], [0.9, 3.5], [1, 0.8]],
      down: [[0, 2.5], [0.12, 7], [0.3, 9.5], [0.5, 9.5], [0.72, 6.5], [0.9, 3], [1, 0.8]],
      rest: 3.4, proud: 1.8,
      span: 335, shoulder: [58, 11, 15], arm: 46, lead: 10, sweep: 28, root: 72, tipChord: 22,
    },
    // slightly notched: the outer feathers the longer (the agent's)
    tail: { length: 71.9, root: 1.5, rootHalf: 3, feathers: 12, width: 9, closed: 0.04, graded: -4, point: 0.7, droop: 0.02, tent: 6 },
    leg: { knee: [38, -12, 11], shin: 14, tarsus: 14.9, thick: [4.4, 1.9, 1.15], toes: { mid: 12, side: 9, hind: 8, claw: 6, hindClaw: 6.5 }, splay: 0.5 },
  },
  // Poses the contact sheet shows, and the forest's behaviours start from (life/rig.js says what each number is).
  poses: {
    // bolt upright on the top of a snag, the tail hanging
    perched: { pitch: 0.75, lift: 0.4, head: { pitch: -0.1 }, tail: { pitch: -0.1, fan: 0.02 }, feet: { mode: 'grip', round: 0.012 }, perch: 0.012 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.3 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: WHITE, size },                                                                  // under parts white, often tinged pale yellow (R)
      { where: (p) => p.a > 0.1 && p.x > 30 && p.x <= 66, colour: VEST, shaft: [72, 8, 15], shaftWidth: 0.3, size: 5 },  // chest sides and breast sides brownish grey tinged olive, indistinctly streaked (R)
      { where: (p) => p.a > 0.2 && p.a < 0.62 && p.x <= 30, colour: FLANK, shaft: [70, 9, 28], shaftWidth: 0.25, size: 6 },  // sides and flanks (R)
      { where: (p) => p.x > 66 && p.a >= 0.12 && p.a < 0.36, colour: THROAT, shaft: [66, 8, 34], shaftWidth: 0.22, size: 3 },  // the sides of the throat streaked brownish grey (R)
      { where: (p) => p.x <= 2 && p.a < 0.5, colour: WHITE, bars: [[66, 8, 38], 1, 0.16], size: 8 },        // under tail coverts with broad V marks of brownish grey (R)
      { where: (p) => p.a >= 0.36 && p.x > 66, colour: SIDE, size },                             // sides of head and neck plain slaty olive, like the upper parts (R)
      { where: (p) => p.a >= 0.58, colour: BACK, size },                                         // above plain slaty olive or dark smoke grey (R)
      { where: (p) => head(p) && p.a >= 0.8 && p.y > 17, colour: CROWN, shaft: [80, 6, 9], shaftWidth: 0.3, size: 3 },          // the feathers of the crown darker down their middles (R)
      { where: tuft, colour: TUFT, size: 4.6 },                                                  // a patch of soft white or yellowish white at the side of the rump (R)
    ],
    wing: {
      web: SOOT, edge: OLIVE_EDGE, tertial: [60, 6, 13], covert: [60, 6, 14], lesser: BACK, lesserEdge: [78, 9, 27],
      medianTip: [OLIVE_EDGE, 0.2],                              // the middle coverts margined at the end with grey olive (R)
      greaterTip: [GREY_WHITE, 0.13],                            // the greater coverts narrowly edged with it, whitish at the tips (R)
      patchSkip: 0,
      primaryBars: [],
      secondaryBars: [[0.38, 0.95, PALE, 'edge']],               // the secondaries edged, except basally, with grey white (R)
      tertialBars: [[0.3, 0.93, PALE, 'edge']],          // more broadly on the tertials (R)
      tertialTip: null,
      under: [66, 8, 38], underCovert: [66, 8, 48], underCovertTip: null, underBars: [],       // axillars and under wing coverts brownish grey, narrowly edged paler (R)
      fold: { primaries: 8, secondaries: 6, secondaryEnd: 0.58, greater: 8, greaterEnd: 0.36, median: 7, medianEnd: 0.21 },
      spread: { primaries: 9, secondaries: 6, shape: [0.66, 0.9, 0.99, 1, 1, 1, 0.99, 0.96, 0.93] },
    },
    tail: { web: [56, 6, 12], edge: OLIVE_EDGE, under: [58, 6, 24], point: 0.5 },                // tail dusky, the outer webs edged grey olive (R)
    bill: { upper: [40, 10, 10], lower: [40, 10, 12], lowerBase: [[34, 28, 42], 0.7] },           // upper brownish black; the lower pale brownish, its end dusky (R)
    mouth: [20, 60, 50],
    eye: { iris: [22, 40, 10], pupil: [240, 15, 5] },                                           // iris brown (R)
    leg: [30, 14, 14],                                                                          // legs and feet dusky brown (R)
    shin: [66, 9, 40],
  },
};
