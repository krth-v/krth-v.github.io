// Brown Creeper, Certhia americana. The sexes are alike in plumage; the male's bill is a little longer.
//
// What is published and what is not. The lengths under `published` were read from the sources named: wing,
// tail, culmen, tarsus and toe are Aldrich's adult males of the north-western coast. The description of the
// plumage that could be read is thinner than the thrush's: Ridgway's account of the creepers could not be
// reached, so the tracts marked "not read" below are painted from general knowledge of the bird, and want
// the owner's eye most. The outline is the agent's drawing, as for every species. Every source was read
// through a tool that fetches a page and returns its text or a summary of it, not seen as an image.

export const published = {
  shown: 'adult (sexes alike); measurements are of males',
  note: 'Published: the lengths above, and the bird in broad terms (brown above streaked whitish, white below, a pale stripe over the eye, a rufous rump, a buff band across the wing, a thin down-curved bill, a stiff pointed tail). Not read, and painted from general knowledge: the crown, the tips of the wing coverts, how brown the tail is, the legs and the eye. Drawn by the agent: the outline of head and body, the place of the eye, how the folded wing lies.',
  sources: {
    A: 'Aldrich 1946, "New subspecies of birds from western North America", Proc. Biol. Soc. Washington 59: 16 adult males of the north-western coastal form (described there as caurina), museum skins',
    W: 'Wikipedia, "Brown creeper" (read 2026-11-14), giving Cornell Lab figures',
    D: 'Animal Diversity Web, Certhia americana',
    B: 'Bent 1948, Life Histories of North American Nuthatches, Wrens, Thrashers and their Allies (U.S. Nat. Mus. Bull. 195)',
    N: 'National Geographic, Brown Creeper; Seattle Audubon BirdWeb; Audubon Field Guide',
    O: 'oiseaux-birds.com, Brown Creeper',
  },
  lengths: [
    ['wing', 'Wing, folded', 63.4, [58, 66], 'A'],
    ['tail', 'Tail', 60.7, [56, 65.5], 'A'],
    ['culmen', 'Exposed culmen', 15.2, [13, 16], 'A'],
    ['tarsus', 'Tarsus', 15.7, [14, 16.8], 'A'],
    ['midToe', 'Middle toe', 11.5, [11, 12.3], 'A'],
    ['length', 'Length, bill tip to tail tip', null, [120, 140], 'W'],
    ['span', 'Wingspan', null, [170, 200], 'W'],
  ],
  proportions: [
    'Tail long and stiff, nearly half the bird\'s length, its feathers pointed: a prop against the bark (B, D)',
    'Bill long, slender, curved downward (B); the lower mandible paler at the base (O)',
    'How Aldrich took "wing" and "middle toe" is not said in what was read. Built here: the wing from its bend to the tip of the longest primary, the toe without its claw',
    'Not read, and drawn from general knowledge: how far the wing tip reaches down the tail, the length of the hind claw, the colours of legs and eye',
  ],
  mass: 'Mass 5.7-8.5 g (W); 7.2-9.9 g (D)',
};

// colours as paint: [hue, saturation, lightness]
const BROWN = [27, 34, 23], STREAK = [40, 38, 78], RUFOUS = [24, 52, 36], WHITE = [45, 22, 93], BUFF = [38, 42, 84], PALE = [42, 32, 88];
const DARK = [26, 28, 21], BAND = [37, 62, 63], TIP = [38, 46, 70];
const size = (p) => (p.x > 40 ? 2.4 : 5);
// the white stripe over the eye, and the brown stripe through it (D)
const brow = (p) => p.x > 38 && p.x < 52.6 && p.y - (6.3 + (47 - p.x) * 0.05) > -0.9 && p.y - (6.3 + (47 - p.x) * 0.05) < 1.5;
const through = (p) => p.x > 39 && p.x < 52.4 && Math.abs(p.y - (4.3 + (47 - p.x) * 0.03)) < 1.35;

export default {
  name: 'Brown Creeper', latin: 'Certhia americana', key: 'brown-creeper', seed: 47,
  // ---- who is about on a visit, how it lives on one and what it says (life/species/index.js says what each is)
  census: { tier: 'some', source: 'B F; P regular; BirdWeb: "generally avoid the rainforests of the outer coast"', mean: 0.7 },
  way: {
    family: 'creeper', there: 0.65, gap: [30, 160],
    // a big living trunk within fourteen metres of the walk: a bird as long as a finger is not seen from further
    home: (habitat, r) => { const near = habitat.trunks.filter((t) => t.off < 14 && t.kind !== 'snag'); return near.length ? near[Math.floor(r() * near.length)] : null; },
    // that trunk, or one within twenty-two metres of it and no further from the walk than sixteen
    spot: (home, r, habitat) => { const near = habitat.trunksNear(home.foot.x, home.foot.z, 22).filter((t) => t.off < 16); return near.length ? near[Math.floor(r() * near.length)] : home; },
    // How it climbs (life/families/creeper.js says what each is): the climb approved at checkpoint 2, in its own
    // numbers. Every one of them is the agent's.
    hz: 18, speed: 6.5, drop: 5.5, range: 26, start: [0.6, 1.2], top: [7, 15], quota: [2, 4],
    step: [0.022, 0.036], beat: 0.085, run: [3, 8], twist: [0.05, 0.12],
    // How it takes the walker (life/behave.js): put up within 3.5 m of one at a stroll (4.5 at a walk, 6.7 at a run),
    // or by a sudden movement of theirs within 8; then round its trunk out of their sight, more often than not, or to
    // another trunk, and seldom off out of sight.
    flush: 3.5, startle: 8, near: 0.85, gone: 0.25, slip: 0.7,
    // its call, thin and high, as it works; and one time in three its song (as long as the recording played for it)
    call: { every: [6, 22], time: 0.25, reach: 28 }, song: { chance: 0.35, time: 1.8, reach: 45 },
  },
  voices: {
    song: { file: 'creeper-song.mp3', level: 0.3, near: 4,
      credit: { what: 'Brown Creeper, song', by: 'J. Job, U.S. National Park Service (Rocky Mountain National Park sound library), 2016', licence: 'Public domain',
        source: 'https://www.nps.gov/nps-audiovideo/legacy/mp3/imr/avElement/romo-BRCRROMO5192016UpperBeaverMeadows.mp3', bytes: 1138730, kept: 1.85 } },
    // (silent: no recording of it was found under a licence that could be used)
    call: { silent: true },
  },
  published,
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'About 13 cm long, nearly half of it tail, and 6 to 10 g.',
    marks: ['Streaked brown above, like the bark it climbs; white below', 'A thin bill, curved downward', 'A long, stiff, pointed tail, pressed to the trunk as a prop', 'A buff band across the open wing'],
    lives: 'The trunks of large old trees. It starts near the foot of one, hitches upward in a spiral looking into the furrows of the bark, then drops to the foot of the next.',
  },
  plate: { wide: 0.44, bar: 0.02 },
  shape: {
    // millimetres, in the level pose: x = 0 where the tail is rooted, the bill's base at 53.2
    top:    [[-12, 1.8], [-4, 4], [6, 7.5], [18, 10.5], [30, 11.8], [38, 11.3], [43, 10.6], [47.5, 10.2], [50.5, 8.6], [52.4, 6.2], [53.2, 4.3]],
    bottom: [[-15, -1.2], [-6, -4], [4, -8], [16, -11.5], [28, -12.5], [38, -10.2], [44, -6.6], [49, -3.2], [52, -0.9], [53.2, 0.7]],
    half:   [[-15, 2.5], [-6, 5.5], [4, 9], [16, 11.5], [28, 12], [38, 10.5], [44, 8.8], [48, 7.8], [51, 4.8], [53.2, 1.7]],
    widest: 0.45,
    neck: [37, 46],
    eye: { x: 47.2, y: 4.4, r: 1.55 },
    bill: { culmen: 15.2, drop: 0.2, gape: 1.5 },
    wing: {
      chord: 63.4, wrist: [35, -2], aim: [-61, 4],
      up:   [[0, 2], [0.12, 8], [0.3, 9.5], [0.5, 8], [0.7, 5], [0.88, 2.2], [1, 0.5]],
      down: [[0, 1.5], [0.12, 4.5], [0.3, 6.5], [0.5, 6.5], [0.7, 4.5], [0.88, 2.5], [1, 0.5]],
      rest: 2.2, proud: 1.2,
      span: 185, shoulder: [33, 6, 8.5], arm: 28, lead: 6, sweep: 16, root: 46, tipChord: 16,
    },
    // graduated: the outer feathers much the shorter, every tip a point
    tail: { length: 60.7, root: 0.8, rootHalf: 2.2, feathers: 12, width: 6.2, closed: 0.03, graded: 14, point: 0.3, droop: 0.06, tent: 4 },
    leg: { knee: [22, -7.5, 5.5], shin: 11, tarsus: 15.7, thick: [2.6, 1.1, 0.66], toes: { mid: 11.5, side: 8.5, hind: 7.5, claw: 5, hindClaw: 8.5 }, splay: 0.6 },
  },
  poses: {
    // on a trunk: +x is up the bark and +y out of it. The body lies along the bark, low, and the tail is let down until its tip rests on it.
    perched: { pitch: 0.05, lift: 0.27, lean: 0.004, droop: 0.1, head: { pitch: 0.2 }, tail: { prop: 0.0006, fan: 0.05 }, feet: { mode: 'flat', width: 0.011, ahead: 0.005, toeOut: 0.55 }, board: true },
    level: { pitch: 0, lift: 0.6, tail: { fan: 0.02 }, feet: { mode: 'tuck' } },
    flight: { pitch: 0, lift: 0.6, spread: 1, flap: 0.06, hand: 0.03, tail: { fan: 0.22 }, feet: { mode: 'tuck' } },
  },
  plumage: {
    body: [
      { colour: WHITE, size },                                                                  // underparts white (D, B)
      { where: (p) => p.a > 0.16 && p.a < 0.56 && p.x < 26, colour: BUFF, size: 5 },            // a warm wash on the flanks (N)
      { where: (p) => p.a > 0.56, colour: BROWN, shaft: STREAK, shaftWidth: 0.34, size },       // upperparts dark brown, heavily streaked whitish (D)
      { where: (p) => p.a > 0.56 && p.x < 10, colour: RUFOUS, size: 5.5 },                      // rump tawny to rufous (N)
      { where: (p) => p.x > 40 && p.y > 8.4, colour: DARK, shaft: STREAK, shaftWidth: 0.3, size: 2.3 },       // crown: not read
      { where: through, colour: [26, 30, 22], size: 2.1 },                                      // a brown stripe through the eye (D)
      { where: brow, colour: PALE, size: 2.1 },                                                 // a white stripe above it (D)
    ],
    wing: {
      web: DARK, edge: [32, 38, 42], tertial: [26, 30, 21], covert: DARK, lesser: BROWN, lesserEdge: [38, 40, 64],
      medianTip: [TIP, 0.2], greaterTip: [TIP, 0.17],                                            // coverts tipped buff: not read
      patchSkip: 3,
      primaryBars: [[0.32, 0.44, BAND, 'both'], [0.66, 0.72, TIP, 'outer']],                     // a bold buff band across the wing (N: BirdWeb)
      secondaryBars: [[0.38, 0.5, BAND, 'both'], [0.9, 1, TIP, 'edge']],
      tertialTip: [TIP, 0.08],
      under: [30, 10, 58], underCovert: [45, 15, 92], underCovertTip: null,
      underBars: [[0.3, 0.46, [40, 45, 84], 'both']],                                            // the band shows from below too
      fold: { primaries: 6, secondaries: 6, secondaryEnd: 0.78, greater: 7, greaterEnd: 0.42, median: 6, medianEnd: 0.24 },
      spread: { primaries: 9, secondaries: 6, shape: [0.5, 0.72, 0.9, 0.98, 1, 1, 1, 1, 1] },
    },
    tail: { web: [28, 29, 32], edge: [30, 33, 42], under: [30, 20, 46], tip: [], point: 0.6, shaft: [24, 30, 20] },       // brown, less red than the rump; "rusty base of tail" (N); the rest not read
    bill: { upper: [28, 20, 18], lower: [30, 32, 68], lowerBase: null },                         // dark, the lower mandible paler
    mouth: [350, 45, 68],
    eye: { iris: [24, 40, 10], pupil: [240, 15, 5] },                                            // not read
    leg: [28, 30, 55],                                                                           // not read
    shin: [40, 22, 80],
  },
};
