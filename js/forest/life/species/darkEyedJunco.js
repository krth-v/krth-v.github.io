// Dark-eyed Junco, Junco hyemalis, the "Oregon" group: the adult male in spring. Built as J. h. shufeldti, which is
// the form the sources point to for the Olympic Peninsula's lowlands (see the note); the head is slaty black, the back
// brown and the sides pinkish buff.
//
// What is published and what is not. The lengths under `published` are Ridgway's for ten adult males of
// shufeldti, and the bird is built to their means; life/measure.js measures the built bird against them. The
// colours are his description of Junco oreganus, the northern coastal form, which he gives as the base for
// shufeldti and for which he states the differences: a back much less rufescent, from brownish mouse grey to sepia,
// and the black of head and chest more slaty. The outline of head and body, where the eye sits and how the folded
// wing lies are in nothing that was read: they are the agent's drawing, for the owner to judge from the contact sheet.
//
// Which form. Ridgway has shufeldti breeding "south to Vancouver Island, Washington, and northern Oregon" and
// oreganus only on the northern end of the British Columbia coast and the Alaskan; Wikipedia's table gives shufeldti
// "west slopes of coastal mountains from western Oregon to southwest British Columbia". No source that was opened
// names the Olympic Peninsula. A second reader found that Ridgway's own shufeldti is largely an interior and
// Rocky Mountain form (its Oregon breeding skins are from the Maury Mountains and Elgin), so it is the more likely
// to run larger than the coastal birds of the valley: the wing is 79.8 for shufeldti and 75.2 for oreganus. That is
// not settled, and shufeldti is the agent's choice.
//
// How the sources were read: two agents, one reading and one checking, the text of the Internet Archive's scan
// of Ridgway 1901 (Bulletin 50, Part I, pp. 271-286), by its character recognition. No page was seen as an image.
// Shared by both readers, so a slip of the scan would be shared. Unconfirmed: oreganus tarsus's upper end (garbled in
// the scan: not used) and the wingspan. The middle toe's claw is not said to be counted; it is built without,
// as for the other sheets.

const R = 'Ridgway 1901, The Birds of North and Middle America, Part I (U.S. National Museum Bulletin 50), Junco oreganus shufeldti, pp. 285-286; plumage from J. o. oreganus, p. 283 (https://archive.org/download/cu31924090256870/cu31924090256870_djvu.txt)';

export const published = {
  shown: 'adult male, spring (shufeldti)',
  note: 'Published: the lengths above, and the colours as Ridgway has them for the northern coastal form and the differences he gives for shufeldti (head, neck and chest black, sharply defined behind, "more slaty" in shufeldti; back chestnut to walnut brown in oreganus and much less red in shufeldti, from brownish mouse grey to sepia; rump, upper tail coverts and the lesser and middle wing coverts dull slate or mouse grey; wings and tail blackish, the greater coverts broadly and the flight feathers narrowly edged greyish, the innermost greater coverts and secondaries brownish on their outer webs; the outermost tail feather white, the second mostly white, the third partly white near its tip; sides and flanks light vinaceous cinnamon mixed with grey-brown; the rest of the underparts white; bill pinkish white with a little dusky at the tip; iris reddish brown or claret; tarsi light brownish, toes darker). Which form breeds on the Olympic Peninsula is not named in anything that was read. Not found, and the agent\'s: the outline, the stance, the wingspan (built at 230 mm, within the species\' 180 to 250), the shape of the wing\'s tip, where on the face the black ends, how far down the breast it goes, the pale bill\'s dusky tip, and how dark or pale the back is within "brownish mouse grey to sepia".',
  sources: {
    R: `${R}: ten adult males, museum skins`,
    W: 'Wikipedia, "Dark-eyed junco" (read 2026-11-16, raw text): 13 to 17.5 cm long, wingspan 18 to 25 cm, 18 to 30 g, the whole species',
    A: 'Audubon Field Guide and Seattle Audubon BirdWeb, Dark-eyed Junco: pink bill, white outer tail feathers that flash, forages hopping and running on the ground, common in May on the Pacific Northwest coast',
  },
  lengths: [
    ['wing', 'Wing, folded', 79.8, [76.5, 81.8], 'R'],
    ['tail', 'Tail', 69.3, [66.5, 72.1], 'R'],
    ['culmen', 'Exposed culmen', 10.9, [10.7, 11.7], 'R'],
    ['tarsus', 'Tarsus', 20.8, [20.1, 21.6], 'R'],
    ['midToe', 'Middle toe (the claw is not said to be counted)', 14, [13.5, 14.5], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 149.1, [141, 157.5], 'R'],
    ['span', 'Wingspan (one secondary source: the whole species)', null, [180, 250], 'W'],
  ],
  proportions: [
    'The tail 87 % of the wing (69.3 to 79.8: worked out from Ridgway\'s means), double-rounded, the outer feathers about as long as the middle pair',
    'The bill less than half the tarsus, conical, as deep as it is wide at the base',
    'The middle toe with its claw "decidedly shorter than the tarsus" (genus text)',
    'The wing\'s longest primaries project beyond the secondaries by about half the tarsus (genus text)',
  ],
  mass: 'Mass 18 to 30 g, the whole species (W)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness]
// (every one set darker than its name reads: "slate-black" is nearly black, "vinaceous-cinnamon" a pinkish buff-brown)
// (2026-11-16, the agent called sparrows, against the plates: the back was a pale pinkish tan where "sepia" is a dark
// brown, the sides nearly white, the lesser coverts a pale block on the folded wing where the wing is "blackish", and
// the iris a bright red where it is "reddish brown or claret": each set darker)
const HOOD = [220, 8, 13], LORE = [220, 8, 9], BACK = [24, 28, 23], RUMP = [210, 6, 29], SIDE = [20, 26, 44], WHITE = [48, 8, 91];
const DUSKY = [28, 8, 17], EDGE = [28, 8, 35], BROWNISH = [26, 24, 27], SLATE = [215, 6, 27];

const size = (p) => (p.x > 62 ? 2 : p.x > 52 ? 2.8 : 5.2);
const head = (p) => p.x > 49;

export default {
  name: 'Dark-eyed Junco', latin: 'Junco hyemalis', key: 'dark-eyed-junco', seed: 107,
  // ---- who is about on a visit (life/species/index.js says what each field is), how it lives on one and its voices
  census: { tier: 'most', source: 'B C; P regular; edges and clearings', party: [1, 2] },
  // How it lives on a visit: its family's (life/families/scratcher.js), with these numbers. From BirdWeb (read
  // 2026-11-16): it forages on the ground "scratching with their feet to find food"; the flash of its white tail
  // feathers "alerts members of the flock when one is alarmed"; the male "sings from a high perch"; in May it is
  // paired. The agent's own: every number here, and the perch it sings from, lower than BirdWeb's high one (up to
  // six metres, where it is seen from the walk).
  way: {
    // a pair: where one moves on to along the trail the other follows, and when one goes so does its mate
    family: 'scratcher', there: 0.7, gap: [40, 180], together: true,
    hz: 18, speed: 7,                                // wingbeats a second (a guess from its size, as the thrush's 11 is); how fast it flies (m/s)
    // put up from 4 m at a stroll (further for one who runs: life/behave.js), or by a sudden movement within 9 m;
    // up into a tree clear of the walker most times, else off, for good one time in seven of those
    flush: 4, startle: 9, near: 0.85, gone: 0.15,
    // anywhere along the walk, under the trees or in the open: a stretch of 44 m of the tread, perches up to 6 m
    // over the ground within 12 m of it, and no other pair's within 60 m
    air: [0, 1], thicket: 0, stretch: 44, apart: 60, reach: 12, high: 6,
    stay: [10, 35], patches: [3, 7], sit: 0.15, rest: [4, 12],
    hop: [0.06, 0.12], kick: 0.12, kicks: [1, 2], flick: 0.1, flash: 0.62, pump: 0,
    hopping: 'hopping along the edge of the trail', perched: 'perched in a low tree, looking about',
    call: { every: [0.6, 2.2], time: 0.12, reach: 30, doing: 'calling: a sharp tick' },
    // (a song as long as the recording that is played for it)
    song: { chance: 0.3, songs: [3, 7], time: [1.8, 2], gap: [6, 14], reach: 120, high: [2, 6], doing: 'singing: a dry, ringing trill' },
  },
  voices: {
    song: { file: 'junco-song.mp3', level: 0.35, near: 4,
      credit: { what: 'Dark-eyed Junco, song (a trill)', by: 'J. Job, National Park Service, Rocky Mountain NP sound library, 2015', licence: 'public domain (US federal work): cut and filtered; credit "National Park Service"',
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-darkeyedjunco.htm', bytes: 622454, kept: 1.9 } },
    // (the tick it gives as it is put up: silent, no recording of it was found under a licence that could be used)
    call: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 15 cm long and 20 g: a sparrow-sized finch.',
    marks: ['A slaty-black hood, sharply cut off against a white belly', 'A brown back and pinkish-buff sides', 'A pale pink bill', 'White outer tail feathers that flash as it flies'],
    lives: 'Forest edges, openings and clearings with cover near the ground. It hops and runs over the ground, scratching in the litter for seeds and insects. In spring the male sings a dry, ringing trill from a high perch; its call is a sharp "tsick".',
  },
  plate: { wide: 0.38, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 69
    top:    [[-10, 2.2], [-3, 6.2], [7, 11.4], [18, 15.2], [30, 16.6], [40, 16.1], [48, 15.5], [54, 16.2], [60, 15.7], [64.5, 12.6], [67.6, 8.8], [69, 6.6]],
    bottom: [[-12, -1], [-4, -6.2], [6, -12.2], [17, -16.6], [29, -17.2], [39, -15.2], [47, -11.6], [55, -8], [61, -5], [65.5, -2], [69, -0.3]],
    half:   [[-12, 2.8], [-4, 7.2], [6, 11.8], [17, 14.4], [29, 15], [39, 13.4], [47, 11.8], [55, 11.4], [61, 9.4], [65.5, 6], [69, 3.5]],
    widest: 0.47,
    neck: [45, 56],
    eye: { x: 60.2, y: 6.8, r: 1.6 },
    bill: { culmen: 10.9, drop: 0.03, gape: 2 },
    wing: {
      chord: 79.8, wrist: [43, -2], aim: [-78, 6],
      up:   [[0, 2.5], [0.12, 9.8], [0.3, 11.8], [0.5, 10.4], [0.72, 6.6], [0.9, 3], [1, 0.8]],
      down: [[0, 1.8], [0.12, 5.4], [0.3, 7.6], [0.5, 7.8], [0.72, 5.8], [0.9, 3.2], [1, 0.8]],
      rest: 2.5, proud: 1.3,
      span: 230, shoulder: [41, 7.6, 12], arm: 36, lead: 7, sweep: 14, root: 64, tipChord: 25,
    },
    // double-rounded: the outer feathers about as long as the middle pair (Ridgway's genus text)
    tail: { length: 69.3, root: 1.1, rootHalf: 3, feathers: 12, width: 7.6, closed: 0.035, graded: 1, point: 0.7, droop: 0.03, tent: 4.8 },
    leg: { knee: [28, -11, 7.4], shin: 14, tarsus: 20.8, thick: [3.3, 1.4, 0.85], toes: { mid: 14, side: 10.6, hind: 10, claw: 4.6, hindClaw: 5.8 }, splay: 0.55 },
  },
  poses: {
    perched: { pitch: 0.32, lift: 0.4, head: { pitch: 0.08 }, tail: { pitch: -0.08, fan: 0.02 }, feet: { mode: 'grip', round: 0.006 }, perch: 0.006 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.3 }, feet: { mode: 'tuck' } },
    // on the ground: a finch's low, level stance, the tail held level, the feet flat (it feeds hopping and running)
    // (lift 0.88 stood it on stilts, its thighs showing under the belly: 0.5 is as low as a sparrow stands)
    ground: { pitch: 0.24, lift: 0.5, head: { pitch: 0.02 }, tail: { pitch: 0.04, fan: 0.02 }, feet: { mode: 'flat' } },
  },
  plumage: {
    body: [
      { colour: WHITE, size },                                                                  // everything behind the chest is white (R)
      { where: (p) => p.a > 0.28 && p.a < 0.58 && p.x < 46 && p.x > -2, colour: SIDE, size: 5.4 },       // sides and flanks light vinaceous cinnamon, mixed with grey-brown (R)
      { where: (p) => p.a >= 0.58 && p.x <= 56, colour: BACK, size },                           // back and scapulars brownish mouse grey to sepia in shufeldti (R)
      { where: (p) => p.a >= 0.58 && p.x < 12, colour: RUMP, size: 5 },                         // rump and upper tail coverts dull slate (R)
      { where: (p) => p.a >= 0.5 && p.x > 49 && p.x <= 58, colour: HOOD, size: 2.6 },           // the hood runs back over the nape, sharply cut against the brown back (R)
      { where: (p) => p.x > 44.5 && p.a < 0.58, colour: HOOD, size: 2.6 },           // chin, throat and chest black, sharply defined behind (R: it ends about here; the agent's)
      { where: (p) => head(p) && p.y > -6, colour: HOOD, size: 2 },                             // crown, face and sides of the head slaty black (R)
      { where: (p) => p.x > 62 && p.y > 0.5 && p.y < 11, colour: LORE, size: 1.7 },             // the face in front of the eye darkest (the agent's)
    ],
    wing: {
      web: DUSKY, edge: EDGE, tertial: BROWNISH, covert: DUSKY, lesser: SLATE, lesserEdge: [215, 5, 32],      // wings blackish with greyish edgings; lesser and middle coverts slate (R)
      medianTip: null, greaterTip: [[28, 8, 34], 0.12],                                        // greater coverts broadly edged greyish (R); no wing bars are mentioned
      patchSkip: 0, primaryBars: [], secondaryBars: [],
      tertialTip: null, tertialBars: [[0.3, 0.95, [24, 24, 27], 'edge']],                      // the innermost secondaries brownish on their outer webs (R)
      under: [215, 6, 40], underCovert: [40, 8, 80], underCovertTip: null, underBars: [],        // under the wing: not described in what was read; pale grey here
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.72, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 6, shape: [0.55, 0.82, 0.95, 1, 1, 1, 1, 0.98, 0.96] },
    },
    // blackish with greyish edges; the outer feather white, the second mostly white, the third white near its tip (R)
    tail: { web: DUSKY, edge: EDGE, under: [215, 6, 36], tip: [[5, WHITE, 0.97], [5, WHITE, 0.97], [4, WHITE, 0.75], [4, WHITE, 0.75], [3, WHITE, 0.2]], point: 0.5 },
    bill: { upper: [14, 24, 66], lower: [14, 22, 72], lowerBase: null },                       // pinkish white, a little dusky at the tip (R): painted pink, no dusky tip
    mouth: [350, 40, 50],
    eye: { iris: [8, 40, 13], pupil: [240, 15, 5] },                                            // reddish brown to claret (R): dark, since the common name is "dark-eyed"
    leg: [26, 24, 52],                                                                          // tarsi light brownish (R)
    shin: [26, 22, 40],                                                                         // toes darker (R)
  },
};
