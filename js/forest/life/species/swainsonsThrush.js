// Swainson's Thrush, Catharus ustulatus (Ridgway's Hylocichla ustulata ustulata, the russet-backed thrush of the
// Pacific coast): the adult male in spring and summer. The sexes are alike but for size (the female's wing is 3 mm
// shorter and her tail 4 mm).
//
// What is published and what is not. The lengths under `published` are Ridgway's for 34 adult males of the
// Pacific coast form, and the bird is built to their means; life/measure.js measures the built bird against them.
// The colours and where each lies follow his description of the adult in spring and summer, tract by tract. The
// outline (how deep and wide the body and head are, where the eye sits, how the folded wing lies) is in no table:
// it is the agent's drawing, begun from the Varied Thrush's (which the owner approved) scaled to this bird's
// length, so that the two thrushes are one family of shapes, and then set to the published lengths. The owner,
// who knows the bird, judges it from the contact sheet.
//
// How the sources were read: Ridgway 1907 through the Internet Archive's scan, by its character recognition
// (the page numbers are the ones its text gives); the wingspan and mass from Wikipedia's text. No page was seen
// as an image. Not seen, and the agent's: the width of the buff tips and the size of the chest spots, how many of
// the chest's feathers are spotted, the iris's exact brown, the legs' colour in life (Wikipedia says pink; Ridgway
// "pale brownish" in dried skins), and every colour is laid darker than its name reads.

const R = 'Ridgway 1907, The Birds of North and Middle America, Part IV (U.S. National Museum Bulletin 50), Hylocichla ustulata ustulata, pp. 52-53 (https://archive.org/download/bwb_T2-EYP-566/bwb_T2-EYP-566_djvu.txt)';

export const published = {
  shown: 'adult male, spring (the russet-backed form of the Pacific coast)',
  note: 'Published: the lengths above (34 adult males; the plumage after Ridgway\'s adult in spring and summer: above plain olive-brown, "between raw-umber and russet" at its reddest, hair brown to broccoli brown at its palest; a conspicuous orbital ring and the loral region pale buff, the lores more or less obscured with olive-brownish; the auricular region olive-brown with narrow buffy shaft-streaks; the malar region buffy, streaked or suffused with olive-brown; chin, throat and chest buff (the chin and throat sometimes buffy white), the sides of the lower throat and the whole chest with triangular marks of deep olive-brown, narrower and wedge-shaped in front, broader behind, the middle of the chest darker; a submalar streak of olive-brown down each side of the throat; breast, abdomen and under tail coverts white, the upper breast especially at the sides transversely spotted with light olive-brown; sides and flanks pale olive-brown; bill dusky brown or blackish with the basal half of the mandible pale; iris deep brown; legs and feet pale brownish in dried skins; wings and tail not described apart from being brown like the back). Also from Ridgway: the tail is not longer than the distance from the bend of the wing to the end of the secondaries, and the orbital ring is buff. Not found, and the agent\'s: the outline, the stance, the shape of the wing\'s tip, the pale edgings of the wing, the wing\'s underside, the legs\' pink (Wikipedia\'s word, here read as a pinkish brown), the width of the eye ring, and how reddish the back is within Ridgway\'s range (painted between the two, towards russet for the Pacific form). The wingspan is Wikipedia\'s average and is built to it.',
  sources: {
    R: `${R}: 34 adult males, museum skins`,
    W: 'Wikipedia, "Swainson\'s thrush" (read 2026-11-16): length 16 to 20 cm, wingspan averaging 30 cm, mass 23 to 45 g, legs pink, western birds more reddish brown',
  },
  lengths: [
    ['wing', 'Wing, folded', 97.8, [93, 103.5], 'R'],
    ['tail', 'Tail', 73, [67, 79.5], 'R'],
    ['culmen', 'Exposed culmen', 13.9, [13, 15], 'R'],
    ['tarsus', 'Tarsus', 28.2, [27, 31], 'R'],
    ['midToe', 'Middle toe', 17.4, [16, 18.5], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 173, [161, 185], 'R'],
    ['span', 'Wingspan (one secondary source: its average)', null, [280, 320], 'W'],
  ],
  proportions: [
    'The tail not longer than the distance from the bend of the wing to the end of the secondaries (R: the genus Hylocichla ustulata), so the secondaries end about 0.7 of the way along the folded wing',
    'The outermost (spurious) primary much shorter than the primary coverts; the tail and upper tail coverts the colour of the back',
    'How Ridgway took "wing" and "middle toe" is not said on the pages read. Built here: the wing from its bend to the tip of the longest primary, the toe without its claw',
  ],
  mass: 'Mass 23 to 45 g (W)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness] (darker than their names read)
const BACK = [30, 28, 22], CROWN = [30, 28, 20], RUSSET = [24, 36, 24], SPOT = [28, 32, 20], DEEP = [27, 30, 15];
const BUFF = [36, 42, 63], BUFFWHITE = [40, 22, 80], WHITE = [45, 10, 88], FLANK = [32, 22, 40], WASH = [32, 24, 52];
const RING = [38, 44, 60], DUSKY = [28, 20, 19];

// A fixed pseudo-random number from where a feather is, so that the spots stand where they do on every load
const hash = (i, j) => { const s = Math.sin(i * 127.1 + j * 311.7) * 43758.5453; return s - Math.floor(s); };
// the chest's triangular marks (R): on the buff, "narrower and more wedge-shaped anteriorly, broader posteriorly,
// those on middle or central portion of chest darker". Marks on buff, and not a dark patch: at nearly every feather
// of the middle of the chest, with no buff edge to the darker ones (the first version), they ran together into one
const marked = (p) => {
  const heavy = p.x > 60 && p.x < 74 ? 0.7 : p.x >= 74 ? 0.55 : p.x > 50 ? 0.6 : 0.1;
  return hash(Math.floor(p.x / 1.7), Math.floor(p.a * 40)) < heavy;
};
const upper = (p) => p.a > 0.6;
const size = (p) => (p.x > 72 ? 2.8 : p.x > 65 ? 4.2 : 6.5);

export default {
  name: 'Swainson\'s Thrush', latin: 'Catharus ustulatus', key: 'swainsons-thrush', seed: 227,
  census: { tier: 'some', source: 'B C in May, R in April: arriving', extra: true },
  // A shy thrush of the hardwoods and the young woods (life/families/ground.js): it feeds at the edge of the trail in
  // hops, picking at the litter, is up into the low boughs well before a walker comes near, picks at the leaves
  // there, now and then hovers at them, and calls; some have begun to sing, at dawn and dusk. Every number here is
  // the agent's own (what was read is in the family's file).
  way: {
    family: 'ground', there: 0.5, gap: [60, 240],
    // a stretch of the walk under the hardwoods and young trees of the hill and the maple hall: where the air is half
    // open (BirdWeb: "dense hardwood and mixed forests, young conifer forests, and forest openings"), not the old
    // terrace's deep shade nor the open bank. It feeds on the tread and at its very edge, where a walker can see it:
    // the floor beyond is under ferns
    home: (habitat, r) => { for (let i = 0; i < 160; i += 1) { const s = r() * habitat.length; if (habitat.airAt(s) >= 0.25 && habitat.wooded(s, 3)) return { s, side: (r() - 0.5) * 0.8 }; } return null; },
    // within fifteen metres of there, either way along the walk
    spot: (home, r, habitat) => { for (let i = 0; i < 12; i += 1) { const s = home.s + (r() - 0.5) * 30; if (habitat.airAt(s) >= 0.25 && habitat.wooded(s, 2)) return { s, side: home.side + (r() - 0.5) * 0.6 }; } return { s: home.s, side: home.side }; },
    hz: 13, speed: 8,
    // shy: up and away from a walker further off than the Varied Thrush is
    flush: 8, startle: 15, near: 0.55, gone: 0.35,
    gait: 'hop', stride: [0.07, 0.14], quick: 0.13, pause: [0.4, 2],
    feeding: 'pick', work: 0.5,
    moving: 'hopping along the edge of the trail', standing: 'standing still, its head up',
    stray: 2, roam: 6, verge: 1, walk: ['tread', 'floor'],
    // (at a quarter of its picks, the first try, it hovered four times in seventy seconds on one bough)
    feed: [15, 45], sit: [30, 80], off: 0.5, lost: 0.35, hover: 0.08,
    // low boughs, where a walker can see it (higher up it is looked at through the bough's own leaves)
    perch: { stubs: false, boughs: [1.6, 6], reach: 18 },
    // its song is silent for now (no recording of it was staged): those that sing are seen to, and not heard
    song: { share: 0.6, note: [1.6, 2.2], gap: [3, 9], stay: [240, 480], rate: 5, reach: 120, doing: 'singing: a rising spiral of flute-like notes', high: [3, 12] },
    // the recording's two notes, in seconds from its start (read off its spectrogram)
    call: { every: [15, 45], time: 2.9, notes: [[0.24, 0.52], [2.34, 2.62]], reach: 50, doing: 'calling: a soft, liquid "whit"', flush: 0.7 },
  },
  voices: {
    call: { file: 'swainsons-call.mp3', level: 0.3, near: 4,
      credit: { what: "Swainson's Thrush, call", by: "J. Job, National Park Service, Rocky Mountain NP sound library, 2015", licence: "public domain (US federal work): cut and filtered; credit \"National Park Service\"",
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-swainsonsthrush.htm', bytes: 863197, kept: 2.9 } },
    // no recording of its song was staged
    song: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 17 cm long, wings about 30 cm across, 25 to 45 g: a little smaller than a robin.',
    marks: ['Plain russet-brown above, with no wing bars or tail marks', 'A buff face with a buff ring round the eye', 'A buff breast spotted with dark brown, a white belly', 'A pale base to the bill'],
    lives: 'The thickets and young woods of the valley, in alder and salmonberry; it arrives in May. It is heard far oftener than it is seen: the male sings a rising spiral of flute-like notes at dusk. It feeds low, on the ground and in shrubs, and takes berries as they ripen.',
  },
  plate: { wide: 0.6, bar: 0.04 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 88.8
    top:    [[-21.8, 1.8], [-8.7, 5.8], [5.8, 10.5], [21.8, 14.9], [37.7, 17], [52.2, 17.8], [63.8, 16.7], [69.6, 16.2], [74.7, 17.8], [79, 19.6], [83, 19], [86.3, 15.8], [88.2, 10.9], [88.8, 6.5]],
    bottom: [[-27.6, -1.1], [-13, -5.8], [0, -11.2], [13, -19.2], [27.6, -25], [40.6, -27.2], [52.2, -25.7], [62.4, -21.4], [68.9, -15.6], [75.4, -9.1], [80.5, -4.7], [84.8, -1.9], [88.8, 1]],
    half:   [[-27.6, 3.6], [-14.5, 7.3], [0, 12.7], [14.5, 18.1], [29, 21.4], [42, 22.1], [55.1, 20.7], [65.3, 15.6], [71, 12], [76.8, 11], [81.2, 10.7], [84.8, 8.3], [87.7, 4.7], [88.8, 2.9]],
    widest: 0.46,
    neck: [65, 75],
    eye: { x: 81.6, y: 8.3, r: 2.7 },
    bill: { culmen: 13.9, drop: 0.05, gape: 2.4 },
    wing: {
      chord: 97.8, wrist: [59.5, -2.3], aim: [-94.2, 5.4],
      // the folded wing's edges either side of the line from wrist to tip; the secondaries end 0.7 of the way along it
      up:   [[0, 3], [0.12, 13.5], [0.3, 15.8], [0.5, 12.8], [0.7, 7.2], [0.85, 2.8], [1, 0.7]],
      down: [[0, 2.3], [0.12, 6.8], [0.3, 9.8], [0.5, 9.8], [0.7, 7.5], [0.85, 4.1], [1, 0.7]],
      rest: 3, proud: 1.6,
      span: 300, shoulder: [58, 9.5, 14.5], arm: 37, lead: 9, sweep: 30, root: 64, tipChord: 20,
    },
    tail: { length: 73, root: 1.2, rootHalf: 3.2, feathers: 12, width: 14, closed: 0.037, graded: 1.5, point: 0.65, droop: 0.03, tent: 9 },
    leg: { knee: [36, -15, 7.6], shin: 19.5, tarsus: 28.2, thick: [4.8, 1.9, 1.15], toes: { mid: 17.4, side: 12.2, hind: 11, claw: 5, hindClaw: 6.2 }, splay: 0.5 },
  },
  poses: {
    perched: { pitch: 0.5, lift: 0.55, head: { pitch: 0.06 }, tail: { pitch: -0.04 }, feet: { mode: 'grip', round: 0.01 }, perch: 0.01 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.3 }, feet: { mode: 'tuck' } },
    // on the ground: a thrush's upright stance, the body tilted up in front, the feet flat
    ground: { pitch: 0.4, lift: 0.8, head: { pitch: 0.05 }, tail: { pitch: -0.06 }, feet: { mode: 'flat' } },
  },
  plumage: {
    body: [
      { colour: WHITE, size },                                                                   // breast, abdomen and under tail coverts white (R)
      { where: (p) => p.a > 0.24 && p.a < 0.6 && p.x > 40 && p.x < 66, colour: WASH, edge: FLANK, fringe: 0.4, size: 6 },   // the upper breast spotted with light olive-brown, most at the sides (R)
      { where: (p) => p.a > 0.2 && p.a < 0.62 && p.x < 52 && p.x > 0, colour: FLANK, size: 7 },  // sides and flanks pale olive-brown (R)
      { where: (p) => p.x > 62 && p.a < 0.6, colour: BUFF, size },                               // chin, throat and chest buff (R)
      { where: (p) => p.x > 78 && p.a < 0.5, colour: BUFFWHITE, size: 2.8 },                    // the chin and throat sometimes buffy white (R)
      { where: (p) => p.x > 58 && p.x < 82 && p.a < 0.56 && marked(p), colour: SPOT, edge: BUFF, fringe: 0.25, size: 4.2 },   // triangular marks of deep olive-brown (R)
      { where: (p) => p.x > 60 && p.x < 74 && p.a < 0.4 && marked(p), colour: DEEP, edge: BUFF, fringe: 0.3, size: 3.4 },  // darker on the middle of the chest (R)
      { where: upper, colour: BACK, size },                                                      // above plain olive-brown (R)
      { where: (p) => upper(p) && p.x < 20, colour: BACK, size: 8 },
      { where: (p) => upper(p) && p.x < 56 && p.x > 8, colour: RUSSET, edge: BACK, fringe: 0.45, size: 6 },   // towards russet on the Pacific form: the agent's mix
      { where: (p) => p.x > 74 && p.a > 0.56, colour: BACK, size: 2.8 },                         // nape and side of the neck
      { where: (p) => p.x > 79 && p.y > 15, colour: CROWN, size: 2.4 },                          // crown: a shade darker, the agent's
      { where: (p) => p.x > 76 && p.x < 87 && p.y > 5 && p.y < 13.5, colour: BACK, edge: BUFF, fringe: 0.3, size: 2.2 },  // auricular region olive-brown with narrow buffy streaks (R)
      { where: (p) => p.x > 83 && p.y > 4 && p.y < 11, colour: BUFF, edge: [31, 28, 33], fringe: 0.4, size: 2 },    // the loral region pale buff, obscured with olive-brownish (R)
      { where: (p) => ((p.x - 81.6) / 5.4) ** 2 + ((p.y - 8.3) / 5) ** 2 < 1 && ((p.x - 81.6) / 3.1) ** 2 + ((p.y - 8.3) / 2.9) ** 2 > 1, colour: RING, size: 1.2 },   // a conspicuous buff orbital ring (R)
      { where: (p) => p.x > 78 && p.x < 87 && p.y > 0 && p.y < 3.4, colour: BUFF, edge: BACK, fringe: 0.3, size: 2 },  // malar region buffy, streaked with olive-brown (R)
      { where: (p) => p.x > 74 && p.x < 87 && p.y > -3.2 && p.y <= 0, colour: SPOT, size: 2 },   // a submalar streak of olive-brown along each side of the throat (R)
    ],
    wing: {
      // not described by Ridgway beyond "the remiges and rectrices as in adults" for the young: the agent's, plain, the
      // edges barely paler (paler edges drew pale stripes across the folded wing). The buff tips of the middle and
      // greater coverts are the young's (R: "tipped (more or less distinctly) with buff or pale tawny"), not the adult's
      web: [28, 22, 24], edge: [29, 22, 27], tertial: [30, 24, 25], covert: [30, 26, 25], lesser: [31, 28, 26], lesserEdge: [31, 26, 32],
      medianTip: null, greaterTip: null,
      patchSkip: 0, primaryBars: [], secondaryBars: [],
      tertialTip: null, tertialBars: [],
      // under the wing: pale buffy suffused with brownish (R, the under wing coverts); the flight feathers grey-brown
      under: [30, 10, 34], underCovert: [36, 28, 68], underCovertTip: null, underBars: [[0.45, 0.7, [36, 30, 62], 'both']],
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.7, greater: 7, greaterEnd: 0.4, median: 6, medianEnd: 0.23 },
      spread: { primaries: 9, secondaries: 6, shape: [0.55, 0.8, 0.95, 1, 1, 1, 1, 1, 1] },
    },
    // the tail and the upper tail coverts the colour of the back (R)
    tail: { web: [29, 28, 24], edge: [30, 28, 28], under: [30, 10, 38], tip: [], point: 0.3 },
    bill: { upper: [28, 18, 17], lower: [28, 18, 19], lowerBase: [[26, 30, 56], 0.5] },        // dusky brown, the basal half of the mandible pale (R)
    mouth: [8, 45, 50],
    eye: { iris: [24, 38, 11], pupil: [240, 15, 5] },                                          // iris deep brown (R)
    leg: [22, 24, 54],                                                                         // pale brownish in skins (R); pink in life (W): read here as a pinkish brown
    shin: [24, 20, 46],
  },
};
