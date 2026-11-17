// American Robin, Turdus migratorius: the adult male in May, as Ridgway has the western robin (his Planesticus
// migratorius propinquus, "from Rocky Mountains ... to the Pacific coast"), with the very dark head of the coastal
// birds.
//
// What is published and what is not. The lengths are Ridgway's for eleven adult males "from western United States
// and British Columbia" (1907, The Birds of North and Middle America, Part IV, read on 2026-11-16 as the Internet
// Archive's text of the scan, by its character recognition: no page was seen as an image). The plumage is his
// adult male in spring and summer, tract by tract, with what he gives for the western bird: "inner web of lateral
// rectrices without white tip (or with this very much reduced in extent); gray of upper parts slightly paler and
// more olivaceous, more abruptly defined against black of head; cinnamon-rufous of under parts averaging slightly
// paler". The robins of the Pacific coast were named apart after his volume (T. m. caurinus), as "slightly smaller
// than the eastern subspecies and very dark-headed" (Wikipedia): the form's original description and any table of
// the coastal birds' lengths were not read, so this bird is built to the western males, and may be a
// little large for one of the coast. What his text does not give, and is the agent's: the outline, where the eye
// sits, how the folded wing lies, the size of each white mark round the eye, the bill's dusky tip (which the
// painter has no field for: the bill is yellow to its tip), and every colour as a number (painted darker than the
// names read). (An earlier version of this file was built to the middles of ranges from Wikipedia and Animal
// Diversity Web, and said that Ridgway could not be reached; it was his 1914 volume that could not.)

const R = 'Ridgway 1907, The Birds of North and Middle America, Part IV (U.S. National Museum Bulletin 50), genus Planesticus, pp. 90-91; P. m. migratorius, the adult male, pp. 97-98; P. m. propinquus, p. 101 (the Internet Archive\'s text of the scan)';
export const published = {
  shown: 'adult male, May, western form',
  note: 'Published: the lengths above (Ridgway\'s eleven adult males of the western robin, from the western United States and British Columbia), and the plumage after his adult male in spring and summer: head black, with a small white spot over the back of the lores, a larger white mark on the back half of the upper eyelid and a large white mark or blunt crescent on the lower eyelid; chin white; throat streaked white and black; back, scapulars, lesser coverts, rump and upper tail coverts plain deep mouse grey or brownish slate-grey (paler and more olivaceous in the western bird); the larger coverts and tertials darker, edged paler; the flight feathers dark brownish slate, edged pale grey; the tail sooty black with narrow greyish edgings (the white at its corners very reduced or none in the western bird); chest, breast, upper abdomen, sides, flanks and under wing coverts plain deep cinnamon-rufous; lower abdomen, vent and under tail coverts white; bill yellow, the end of the culmen dusky; iris deep brown; legs and feet dark horn colour or blackish brown. From the genus: no pale area at the base of the flight feathers underneath. Not found, and the agent\'s: the outline of head and body, where the eye sits, the size of each white mark, how wide the throat\'s streaking is, and every colour as a number. The bill\'s dusky tip is not painted (no field for it). The wingspan is Wikipedia\'s range, for the species.',
  sources: {
    R,
    W: 'Wikipedia, "American robin" (2026-11-16): length 23-28 cm, wingspan 31-41 cm, males 72-94 g; T. m. caurinus slightly smaller and very dark-headed, with restricted white on the outer two tail tips',
  },
  // key, what it is, mean, range, source
  lengths: [
    ['wing', 'Wing, folded', 139.8, [132.5, 145], 'R'],
    ['tail', 'Tail', 104.8, [97.5, 111.5], 'R'],
    ['culmen', 'Exposed culmen', 20.3, [19, 21.5], 'R'],
    ['tarsus', 'Tarsus', 34.1, [32.5, 35.5], 'R'],
    ['midToe', 'Middle toe', 22.2, [20.5, 24], 'R'],
    ['length', 'Length, bill tip to tail tip (skins)', 241, [224, 258], 'R'],
    ['span', 'Wingspan (the species)', null, [310, 410], 'W'],
  ],
  // proportions Ridgway gives for the genus, which the wing, the tail and the feet are laid out to
  proportions: [
    'Tail shorter than the wing but usually longer than from the bend of the wing to the end of the secondaries, even or slightly rounded, the feathers rather broad: the secondaries end 0.72 of the way along the folded wing',
    'Longest primaries exceed the longest secondaries by at least the exposed culmen, sometimes by more than the tarsus (here 39 mm)',
    'Middle toe without claw about two-thirds of the tarsus or slightly more; the inner toe reaching the middle toe\'s last joint but one, the outer slightly beyond; the hind toe slightly shorter than the inner',
    'How Ridgway took "wing" and "middle toe" is not said on the pages read. Built here: the wing from its bend to the tip of the longest primary, the toe without its claw',
  ],
  mass: 'Males 72-94 g (W)',
};

// Ridgway's colours, as paint: [hue, saturation, lightness], laid darker than the names read. Mouse grey above, a
// little olive for the western bird; black head; deep cinnamon-rufous below; dark brownish slate wings, edged grey.
const BACK = [40, 9, 29], HEAD = [220, 10, 12], BREAST = [15, 55, 28], WHITE = [45, 8, 88], FLANKMIX = [16, 52, 32];
const WEB = [28, 8, 18], COVERT = [32, 9, 24], TAIL = [24, 8, 13], BILL = [47, 72, 47], BILLLOW = [47, 70, 52];
const upper = (p) => p.a > (p.x < 78 ? 0.6 : 0.6 + 0.07 * Math.min(1, (p.x - 78) / 19));
const face = (p) => (p.x > 112 && p.y > 2.5 && p.y < 13.6) || (p.x <= 113 && ((p.x - 106.5) / 11.5) ** 2 + ((p.y - 7) / 7.2) ** 2 < 1);
// the white about the eye, as Ridgway has it: "a small white spot or streak over posterior margin of lores, a larger
// white mark on posterior half of upper eyelid, and a large white mark or blunt crescent on lower eyelid". So no ring:
// the black runs between the marks in front of the eye and behind it. (The eye looks along +x, its middle at
// (112.5, 11.5); the angles are from straight ahead.)
const marks = (p) => {
  const dx = p.x - 112.5, dy = p.y - 11.5, d = Math.hypot(dx, dy), t = Math.atan2(dy, dx);
  if (d > 3.3 && d < 5.8 && t > 1.3 && t < 2.9) return true;            // over it, its back half: the larger mark
  if (d > 3.4 && d < 5.9 && t > -2.6 && t < -0.55) return true;         // under it, a blunt crescent
  return Math.hypot(p.x - 117.2, p.y - 14.2) < 1.3;                     // a spot over the back of the lores
};
const size = (p) => (p.x > 99 ? 4.2 : p.x > 90 ? 6 : 9);

export default {
  name: 'American Robin', latin: 'Turdus migratorius', key: 'american-robin', seed: 223,
  // ---- who is about on a visit, how it lives on one and what it says (life/species/index.js says what each is)
  census: { tier: 'most', source: 'B C; P regular', extra: true },
  // A thrush of the open (life/families/ground.js): it runs, stops upright with its head cocked to look at the ground,
  // and now and then pulls up a worm; it sings from the top of a tree at dawn and dusk. Every number here is the
  // agent's own (what was read is in the family's file).
  way: {
    family: 'ground', there: 0.7, gap: [40, 160],
    // a stretch of the walk in the open (the worn tread through the old clearing, beside the river and on the
    // beach): the meadow's grass stands knee high and would hide it, the tread does not
    home: (habitat, r) => {
      const at = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } };
      const open = (s) => habitat.airAt(s) >= 0.6 && habitat.ground(habitat.beside(s, 0, at).x, at.z) === 'tread';
      for (let i = 0; i < 160; i += 1) { const s = r() * habitat.length; if (open(s) && open(s - 4) && open(s + 4)) return { s, side: (r() - 0.5) * 0.8 }; }
      return null;
    },
    // within fifteen metres of there, either way along the walk, and in the open too
    spot: (home, r, habitat) => {
      const at = { x: 0, y: 0, z: 0, set(x, y, z) { this.x = x; this.y = y; this.z = z; return this; } };
      for (let i = 0; i < 12; i += 1) {
        const s = home.s + (r() - 0.5) * 30;
        if (habitat.airAt(s) >= 0.6 && habitat.ground(habitat.beside(s, 0, at).x, at.z) === 'tread') return { s, side: (r() - 0.5) * 0.8 };
      }
      return { s: home.s, side: home.side };
    },
    hz: 10, speed: 9.5,
    // it lets a walker come nearer than the woods' thrushes do (the agent's, from general knowledge of a bird of lawns)
    flush: 4, startle: 9, near: 0.8, gone: 0.1,
    gait: 'run', stride: [0.5, 1.8], quick: 2.2, pause: [0.8, 2.4],
    feeding: 'worms', work: 0.35,
    moving: 'running a few quick steps', standing: 'standing upright, looking about',
    stray: 6, roam: 10, verge: 2.5, walk: ['tread', 'stones'],
    feed: [30, 90], sit: [20, 60], off: 0.3, lost: 0.25, skip: 0.5,
    perch: { stubs: true, boughs: [2, 14], reach: 30 },
    // its song is silent for now (no recording of it was staged): it is seen to sing, and not heard
    song: { share: 1, note: [2.5, 7], gap: [2, 6], stay: [240, 480], rate: 2, reach: 120, doing: 'singing: a run of short, rising and falling, carolled phrases', high: [4, 30], top: true },
    // the recording's sixteen notes, in seconds from its start (read off its spectrogram)
    call: { every: [25, 70], time: 2.0, notes: Array.from({ length: 16 }, (_, k) => [0.22 + k * 0.112, 0.29 + k * 0.112]), reach: 60, doing: 'calling: a quick run of sharp notes', flush: 0.6 },
  },
  voices: {
    // A run of sixteen like notes, about nine a second, each a quick fall in pitch: seen in its spectrogram, it is
    // the robin's calls and not its song (a carol of phrases, about two a second: Bent), though it was staged
    // as its song. Its song is silent: no recording of it was staged for it.
    call: { file: 'robin-song.mp3', level: 0.5, near: 7,
      credit: { what: "American Robin, a run of calls", by: "J. Job, National Park Service, Rocky Mountain NP sound library, 2017", licence: "public domain (US federal work): cut and filtered; credit \"National Park Service\"",
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-americanrobin.htm', bytes: 833238, kept: 2.0 } },
    song: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 25 cm long, wings 31 to 41 cm across: a large thrush.',
    marks: ['A reddish-orange breast, from throat to flanks, over a white belly', 'A black head, with white marks above and below the eye', 'A yellow bill, dusky at the tip', 'Grey above; the throat is white with black streaks'],
    lives: 'Lawns, clearings and the edges of woods. It runs a few steps over open ground, stops upright and cocks its head to look for worms, and sings from a high perch at dawn and dusk.',
  },
  plate: { wide: 0.8, bar: 0.05 },
  shape: {
    top:    [[-30, 2.5], [-12, 8], [8, 14], [30, 19.5], [52, 22.5], [72, 23.5], [88, 22.3], [96, 21.7], [103, 23.6], [109, 25.6], [114.5, 24.8], [119, 21], [121.6, 14.5], [122.5, 8.9]],
    bottom: [[-38, -1.5], [-18, -7.5], [0, -14.5], [18, -24.5], [38, -32], [56, -35], [72, -33.5], [86, -28], [95, -20.5], [104, -12], [111, -6.3], [117, -2.6], [122.5, 1.4]],
    half:   [[-38, 4.8], [-20, 9.5], [0, 16.5], [20, 23.5], [40, 27.5], [58, 28.5], [76, 26.5], [90, 20.5], [98, 15.8], [106, 14.5], [112, 14.2], [117, 11], [121, 6.2], [122.5, 3.8]],
    widest: 0.46,
    neck: [90, 104],
    eye: { x: 112.5, y: 11.5, r: 3.3 },
    bill: { culmen: 20.3, drop: 0.05, gape: 3 },
    wing: {
      chord: 139.8, wrist: [82, -3], aim: [-122, 7],
      up:   [[0, 4], [0.12, 17], [0.3, 20], [0.5, 17], [0.72, 9], [0.88, 3.3], [1, 0.8]],
      down: [[0, 3], [0.12, 9], [0.3, 12.5], [0.5, 13], [0.72, 9.5], [0.88, 5.2], [1, 0.8]],
      rest: 4, proud: 2.2,
      span: 385, shoulder: [80, 13, 20], arm: 55, lead: 12, sweep: 40, root: 88, tipChord: 28,
    },
    tail: { length: 104.8, root: 1.5, rootHalf: 4, feathers: 12, width: 16, closed: 0.037, graded: 2.5, point: 0.72, droop: 0.03, tent: 12 },
    leg: { knee: [50, -21, 10.5], shin: 29.6, tarsus: 34.1, thick: [6, 2.4, 1.35], toes: { mid: 22.2, side: 15.8, hind: 14.6, claw: 6.5, hindClaw: 8 }, splay: 0.5 },
  },
  poses: {
    perched: { pitch: 0.52, lift: 0.6, head: { pitch: 0.06 }, tail: { pitch: -0.04 }, feet: { mode: 'grip', round: 0.014 }, perch: 0.014 },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.3 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: BREAST, size },                                                                  // breast and flanks reddish-orange
      { where: (p) => p.a > 0.2 && p.a < 0.62 && p.x < 74 && p.x > 2, colour: BREAST, edge: FLANKMIX, fringe: 0.12, size: 9.5 },
      { where: (p) => p.a < 0.28 && p.x < 50 && p.x > -6, colour: WHITE, size: 9 },             // the lower abdomen and vent white (the upper abdomen rufous)
      { where: (p) => p.x <= 2 && p.a < 0.5, colour: WHITE, edge: [30, 8, 40], fringe: 0.25, size: 11 },
      { where: upper, colour: BACK, size },                                                      // brown-grey above
      { where: (p) => p.x > 96 && p.y > 13, colour: HEAD, size },                                // head dark
      { where: (p) => p.x > 97 && p.y > 17.5, colour: HEAD, size },
      { where: face, colour: HEAD, size: 3.6 },
      { where: (p) => p.x > 104 && p.y < 5 && p.y > -4 && p.x < 121, colour: [40, 6, 78], edge: [220, 10, 14], fringe: 0.4, size: 3.2 },  // throat white, streaked black
      { where: marks, colour: WHITE, size: 2.4 },                                                // the white marks over and under the eye
    ],
    wing: {
      // the flight feathers dark brownish slate, edged pale grey; the larger coverts and tertials darker than the back
      // (edged as pale as the name reads, the edges drew white stripes across the folded wing: about the back's grey)
      web: WEB, edge: [36, 7, 27], tertial: [30, 9, 21], covert: COVERT, lesser: BACK, lesserEdge: [40, 7, 36],
      medianTip: null, greaterTip: null, patchSkip: 0, primaryBars: [], secondaryBars: [], tertialTip: null, underBars: [],   // no wing bars: the coverts are plain
      fold: { primaries: 7, secondaries: 6, secondaryEnd: 0.72, greater: 8, greaterEnd: 0.4, median: 7, medianEnd: 0.23 },
      // underneath: the under wing coverts plain deep cinnamon-rufous, the flight feathers grey with no pale area at
      // their base (the genus)
      under: [26, 7, 30], underCovert: [17, 58, 34], underCovertTip: null,
      spread: { primaries: 9, secondaries: 6, shape: [0.55, 0.8, 0.95, 1, 1, 1, 1, 1, 1] },
    },
    // sooty black, with narrow greyish edges; in the western bird the white at the corners very reduced, or none
    tail: { web: TAIL, edge: [30, 5, 28], under: [24, 7, 26], tip: [[5, WHITE, 0.035]], point: 0.2 },
    bill: { upper: BILL, lower: BILLLOW, lowerBase: [[47, 70, 56], 0.5] },
    mouth: [10, 70, 50],
    eye: { iris: [22, 45, 15], pupil: [240, 15, 5] },
    leg: [24, 18, 16],                                                   // dark horn colour or blackish brown
    shin: [24, 16, 15],
  },
};
