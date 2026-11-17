// American black bear, Ursus americanus (the Olympic form is listed as U. a. altifrontalis): the only bear of the
// Olympic Peninsula. Built by life/beast.js from `shape`, its paws by life/parts/paw.js, painted by life/coat.js;
// how it stands up and digs is life/parts/stance.js, and how it lives on a visit life/families/bear.js.
//
// What is published and what is not (read 2026-11-16: the species' entry in .local-assets/forest/research/
// beasts-herps-2026-11-16.json, read by one agent and checked by a second, and the pages named under `sources`,
// read by this agent through a tool that returns a summary of a page's text; none of it seen as an image). No
// measurement of the Olympic form itself was found: the lengths are the species', and the state's. Not found, and
// the agent's: the head's, the neck's and the legs' segments, the ear, how wide the body is, the outline (drawn from
// memory of photographs of black bears, none of them looked at), the coat in the middle of May, the claws' and the
// pads' colours (one source's claws were not confirmed by its checker), and the eye's.

export const published = {
  shown: 'an adult sow (a boar is drawn from the same body, larger; a yearling and a cub of the year smaller)',
  note: 'Published: the lengths and masses below, that the coat of Olympic bears is virtually all black with a brown muzzle, that the rump stands higher than the shoulders and there is no hump, that the face is straight in profile and the ears tall and oval, that the feet are plantigrade with five toes each and short curved claws, the front claws under two inches and as long as the hind ones. Not found, and the agent\'s: the head\'s and the neck\'s lengths, the legs\' segments, the ear\'s size, the body\'s width, the coat in mid-May (a search\'s summary put the moult in summer), the claws\' and the soles\' colours.',
  sources: {
    W: 'Washington Department of Fish and Wildlife, "Black bear": 2.5 to 3 ft at the shoulder on all fours and about 5 ft upright; 100 to 300 lb, males larger',
    A: 'Animal Diversity Web, Ursus americanus: body length of females 1,200 to 1,600 mm, of males 1,400 to 2,000 mm; tail 80 to 140 mm; a pale muzzle',
    K: 'Wikipedia, "American black bear": head and body 120 to 188 cm, shoulder 63 to 103.5 cm, tail 7.7 to 17.7 cm, forepaws 5.3 to 13.5 cm long and hind paws 7.1 to 20.3 cm long; British Columbia males 103.1 kg (243 bears), females 73.7 kg (89 bears)',
    I: 'National Park Service, "Bear Identification": front claws less than 2 in long and curved; the rump higher than the shoulders, no shoulder hump; the face straight from between the eyes to the tip of the muzzle; the ears taller and oval and prominent; the toes separated and fairly arced',
    B: 'International Association for Bear Research and Management (bearbiology.org), Ursus americanus: plantigrade, five toes, claws that do not retract, the front claws as long as the hind; uniform in colour but for a brown muzzle; adult females 40 to 70 kg; cubs born in late January or early February, two on average, dependent on the mother until about 16 months',
    O: 'National Park Service, Olympic National Park, "Black Bear": riparian, coastal, subalpine and forested areas; bears dig through logs for insects; a bear "may come closer or stand on its hind legs to get a better look or smell"; "a standing bear is usually curious, not threatening"; stay at least 100 ft away',
    S: 'Sequim Gazette, 2017: virtually all Olympic bears are black; in the Olympics a 250-lb bear is big',
  },
  // [key, label, value (m), [least, most], source]: what the built sow is measured against (life/beast.js measureBeast)
  lengths: [
    ['shoulder', 'Height at the shoulder on all fours, adults', null, [0.76, 0.91], 'W'],
    ['length', 'Length, nose to rump, adult females', null, [1.2, 1.6], 'A'],
    ['tail', 'Tail', null, [0.077, 0.177], 'K'],
    ['forefoot', 'Forepaw, length', null, [0.053, 0.135], 'K'],
    ['hindfoot', 'Hind paw, length', null, [0.071, 0.203], 'K'],
    ['claw', 'Front claw (its chord, root to tip), less than', null, ['?', 0.0508], 'I'],
  ],
  proportions: [
    'No shoulder hump; the rump higher than the shoulders (I, W); the face straight in profile; the ears tall, oval and prominent (I; Wikipedia has them small and rounded: the two disagree)',
    'Plantigrade, five toes to each foot in an arc (B, I); the forefeet turned in a little (the agent\'s, from memory of how bears walk)',
    'Not found: the head (built 0.31 m from the poll to the nose), the ear (0.1 m), the neck, the legs\' segments, the width of the body',
  ],
  mass: 'Adult females 40 to 70 kg and males 60 to 140 kg (B); British Columbia females 73.7 kg and males 103.1 kg (K); in the Olympics a 250-lb (113 kg) bear is big (S)',
};

// The coat in the middle of May, as paint: [hue, saturation, lightness]. Black all over but the muzzle (S, B, A);
// nothing read said what the coat looks like in May, and a search's summary put the moult in summer: the winter
// coat is drawn whole, its guard hairs a little brown and dull at the tips (the agent's call, as are every shade
// and where each boundary runs).
const BLACK = [26, 7, 7], BACK = [26, 8, 8], DULL = [26, 18, 14], MUZZLE = [27, 30, 36], MUZZLE_DARK = [24, 18, 18], NOSE = [20, 8, 6];
const LEG = [24, 9, 7];
const smooth = (a, b, x) => { const t = Math.min(1, Math.max(0, (x - a) / (b - a))); return t * t * (3 - 2 * t); };

export default {
  name: 'American black bear', latin: 'Ursus americanus', key: 'black-bear', seed: 461,
  // ---- who is about on a visit (life/species/index.js says what each is)
  census: { tier: 'rare', source: 'N C; the park: sightings are rare', clock: 'any', party: [1, 3] },
  // How it lives on a visit (life/families/bear.js): every number the agent's own. A party is a bear on its own, or a
  // sow with one or two young (`herd`: they come together; `together`: they move on together). It feeds about its
  // home for four to twelve minutes, and is about again some minutes after it has gone. It watches a walker from 45 m,
  // ambles off from one who comes on within 22 m, and runs from one within 9 m (from nearly twice as far for one who
  // runs, and from a runner anywhere within sight); the park asks walkers to keep a hundred feet off (NPS Olympic).
  way: { family: 'bear', there: 0.6, gap: [180, 600], together: true, herd: true, fastest: 13,
    see: 45, shy: 22, flush: 9, stand: 0.5, curious: 0.15, gone: 0.35, stay: [240, 720], amble: 1.0, trot: 3.2, gallop: 9.5 },
  // (nothing found for the black bear under a licence that can be used: the public-domain recordings are a grizzly's)
  voices: {
    huff: { silent: true },
  },
  plan: 'beast',
  published,
  // How long it is, for what can be seen of it, and its body, for whether any of it is seen and whether two bodies
  // are in one another: how high its back is, half its length and half its width (m). An adult sow's.
  size: 1.4, body: { high: 0.84, long: 0.56, wide: 0.28 },
  // The body, in metres, standing square: an adult sow (life/beast.js says what each table is). Every number is the
  // agent's but the shoulder's height, the length, the tail and the paws, which are set inside the published ranges
  // above, and the claws, which are under the published most.
  shape: {
    // the torso and the neck, rump to head: [top x, top y, bottom x, bottom y, half width, widest at, square]
    trunk: [
      [-0.545, 0.770, -0.552, 0.655, 0.060, 0.50, 2.0],      // the rump's end, round the tail's root
      [-0.528, 0.840, -0.552, 0.520, 0.170, 0.52, 2.1],      // the rump rounds down to the backs of the thighs
      [-0.480, 0.872, -0.512, 0.405, 0.230, 0.52, 2.25],     // the buttocks
      [-0.385, 0.885, -0.400, 0.330, 0.258, 0.53, 2.35],     // the haunch: the highest of the back (I, W: the rump above the shoulders)
      [-0.250, 0.868, -0.250, 0.300, 0.272, 0.54, 2.35],     // the flank
      [-0.100, 0.845, -0.100, 0.285, 0.280, 0.55, 2.3],      // the belly, low and round
      [0.040, 0.826, 0.045, 0.280, 0.276, 0.57, 2.25],       // the girth
      [0.160, 0.815, 0.180, 0.290, 0.258, 0.59, 2.25],       // the chest, under the withers: no hump (I)
      [0.260, 0.802, 0.300, 0.320, 0.232, 0.60, 2.2],        // the shoulders
      [0.350, 0.778, 0.405, 0.390, 0.198, 0.56, 2.1],        // the neck's base and the breast
      [0.420, 0.752, 0.470, 0.465, 0.162, 0.50, 2.0],        // the neck, short and thick
      [0.475, 0.730, 0.505, 0.530, 0.130, 0.50, 2.0],        // the throat, and the poll behind it
      [0.515, 0.715, 0.530, 0.575, 0.100, 0.50, 2.0],        // inside the head
    ],
    withers: [0.05, 0.3],                                    // where along the back the withers are (m): the shoulder's height is taken there
    spine: { hips: [-0.32, 0.64], chest: [0.08, 0.6], neck1: [0.3, 0.58], neck2: [0.39, 0.615], neck3: [0.46, 0.645] },
    blend: [0.2, 0.12, 0.07, 0.06, 0.05],                     // how far either side of each joint the skin is shared (m)
    head: {
      at: [0.505, 0.68], tilt: -28, square: 2.1, jaw: [0.13, -0.055],
      //          s      up     down   half
      stations: [[-0.05, 0.085, 0.085, 0.095], [0, 0.098, 0.092, 0.115], [0.05, 0.098, 0.102, 0.125], [0.1, 0.088, 0.1, 0.118],
        [0.145, 0.072, 0.088, 0.098], [0.185, 0.058, 0.072, 0.072], [0.225, 0.049, 0.06, 0.057], [0.265, 0.042, 0.051, 0.047],
        [0.295, 0.037, 0.044, 0.041], [0.312, 0.026, 0.03, 0.03]],
      eye: { s: 0.142, up: 0.045, side: 0.074, r: 0.011 },
    },
    ear: { s: 0.03, up: 0.085, side: 0.075, length: 0.088, width: 0.1, out: 30, open: 25 },
    tail: { at: [-0.545, 0.75], length: 0.085, width: 0.07, depth: 0.042, hang: 30 },
    // the paws (life/parts/paw.js): plantigrade, five toes in an arc, the forefeet turned in; the front claws under 2 in
    // and the hind as long (I, B), the front ones more curved (a search's summary of iNaturalist's guide, not read)
    paw: { kind: 'plantigrade', claw: 40, hind: 38, curve: 1.1, in: 9, hindIn: 3, thick: 0.25 },
    fore: {
      at: [0.21, 0.15], scapula: [0.13, 0.7], blade: { at: [0.16, 0.58], reach: [0.17, 0.22], most: 0.7 }, scapSwing: 0.4, scapMost: 0.25, lean: 0.5,
      bones: [0.26, 0.24, 0.045], angles: [30, -6, 0], pastern: [0, 0.035],
      //       d     front  across ahead
      girth: [[0, 0.085, 0.072, 0], [0.12, 0.1, 0.082, 0], [0.24, 0.088, 0.075, -0.01], [0.3, 0.076, 0.066, 0], [0.4, 0.064, 0.057, 0.005],
        [0.49, 0.058, 0.056, 0.004], [0.545, 0.055, 0.056, 0]],
      share: { at: [0.13, 0.38], reach: [0.17, 0.14], most: 0.5 },
      foot: { long: 0.118, wide: 0.118, high: 0.05, heel: 0.3, toes: 5, digits: 0.3, round: 0.75, thumb: 0.85 },
    },
    hind: {
      at: [-0.34, 0.145], bones: [0.33, 0.28, 0.05], angles: [-15, 20, 0], pastern: [0, 0.04],
      girth: [[0, 0.09, 0.075, 0], [0.16, 0.14, 0.105, 0], [0.3, 0.115, 0.09, 0.01], [0.4, 0.088, 0.07, -0.01], [0.52, 0.064, 0.054, -0.012],
        [0.61, 0.058, 0.054, 0], [0.66, 0.055, 0.052, 0]],
      share: { at: [-0.3, 0.42], reach: [0.22, 0.2], most: 0.7 }, lean: 0.5,
      foot: { long: 0.172, wide: 0.11, high: 0.055, heel: 0.24, toes: 5, digits: 0.22, round: 0.6, thumb: 0.8 },
    },
    // the neck's four joints (neck1, neck2, neck3, the poll) turned from as it stands (radians): the muzzle to the
    // ground, and the head up; `dip`, how far the chest is let down to feed
    neck: { low: [-1.05, -0.42, -0.336, 0.9], high: [0.3, 0.14, 0.08, -0.1], dip: -0.2 },
    // lying down (life/beastRig.js): how far the body comes down; where the wrist or the ankle and the paw's joint go
    // (x from the top joint, y), how far out to the side, and how the paw is bent from the bone it then follows
    lie: { drop: 0.235, fore: { top: [0.2, 0.06], fetlock: [0.24, 0.065], out: 1.05, hoof: -1.35 }, hind: { top: [-0.12, 0.08], fetlock: [0.1, 0.05], out: 1.45, hoof: 0.4 } },
  },
  coat: {
    body: [
      { colour: BLACK },                                                                        // black all over (S, K)
      { colour: BACK, where: (p) => smooth(0.75, 0.95, p.a) },
    ],
    // (the winter coat, its guard hairs a little brown and dull at the tips, in soft patches: the agent's)
    moult: { shift: [2, 6, 3], share: 0.4, scale: 2.2, soft: 0.3, strength: 0.4, stretch: [1.0, 0.7, 1] },
    head: [
      { colour: BLACK },
      { colour: MUZZLE_DARK, where: (p) => smooth(0.14, 0.19, p.s) },
      { colour: MUZZLE, where: (p) => smooth(0.17, 0.235, p.s) * (1 - 0.6 * smooth(0.02, 0.06, p.up)) },     // a brown muzzle (B, A, W)
      { colour: NOSE, where: (p) => smooth(0.283, 0.3, p.s) * smooth(-0.025, 0.0, p.up) },                       // the nose's bare leather
    ],
    leg: ({ d }) => [LEG[0], LEG[1], LEG[2] - 1.5 * smooth(0.4, 1, d)],
    claw: [25, 8, 9],                                                                            // dark grey-brown (not confirmed: see the note)
    pad: [20, 5, 8],
    ear: { outer: BLACK, inner: [20, 10, 17], edge: DULL },
    tail: { top: BLACK, under: [24, 12, 13] },
    eye: { iris: [24, 40, 16], pupil: [240, 10, 4] },
    hair: { long: (p) => p.a < 0.55 || p.x > 0.3 },                                          // shaggy down the sides, under the belly and round the neck
  },
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'A sow stands about 0.8 m at the shoulder and weighs 40 to 75 kg; a boar is larger, to 140 kg. Standing up, about 1.5 m tall.',
    marks: ['Black all over but for a brown muzzle: virtually every bear of the Olympics is black', 'No hump on the shoulders; the rump stands higher than them', 'Tall, oval ears; a straight face', 'Flat-footed, five toes to each foot, with short curved claws'],
    lives: 'In the valleys and the forest of the peninsula. In spring, out of its den, it grazes the new grasses, sedges and skunk cabbage, tears rotten logs apart for grubs and ants, and turns stones by the river. Shy: it usually leaves when it knows you are there. A bear that stands on its hind legs is curious, getting a better look or smell. Keep at least 30 m away, and give a sow with cubs more.',
  },
};
