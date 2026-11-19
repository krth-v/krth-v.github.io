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
const BLACK = [226, 9, 7.5], DULL = [26, 18, 14], MUZZLE = [30, 38, 40], MUZZLE_DARK = [26, 22, 17], NOSE = [20, 8, 6];
// a field's edge: 0 where `x` is under nothing, 1 where it is over, across `soft` either side of it
const edge = (x, soft) => { const t = Math.min(1, Math.max(0, (x + soft) / (2 * soft))); return t * t * (3 - 2 * t); };

export default {
  name: 'American black bear', latin: 'Ursus americanus', key: 'black-bear', seed: 461,
  // ---- who is about on a visit (life/species/index.js says what each is)
  // `sure`: a bear's party is about on every visit, one and now and then two (the owner, 2026-11-18: "The bears need
  // to be more present, I have yet to see a single bear"; "I'd rather have more animals present in their respective
  // niches than an empty world"). The tier is the sources' and is kept; `sure` is the owner's.
  census: { tier: 'rare', source: 'N C; the park: sightings are rare', clock: 'any', party: [1, 3], sure: [1, 2] },
  // How it lives on a visit (life/families/bear.js): every number the agent's own. A party is a bear on its own, or a
  // sow with one or two young (`herd`: they come together; `together`: they move on together; `young`: the chance a
  // party of two or three is a family, so that about one visit in three has one; `cubs`: how often her young are cubs
  // of the year). It is there from the first (`there`), and about its home for ten to twenty minutes (`stay`), longer
  // than a walk round; gone for a while it is about again a minute or three later. A walker may watch it: it goes on
  // with what it is doing until they are within 22 m (`shy`, at a walk), stands up to look and smell, drops and ambles
  // off twenty to forty metres and takes up again; it bolts only from one within 9 m (`flush`) or one who runs at it
  // within 30 m (`rush`). The park asks walkers to keep a hundred feet off (NPS Olympic).
  way: { family: 'bear', there: 1, gap: [60, 200], together: true, herd: true, fastest: 13,
    shy: 22, flush: 9, rush: 30, gone: 0.25, stay: [600, 1200], young: 0.42, cubs: 0.6, amble: 1.0, trot: 3.2, gallop: 9.5 },
  // (nothing found for the black bear under a licence that can be used: the public-domain recordings are a grizzly's)
  voices: {
    huff: { silent: true },
  },
  plan: 'beast',
  published,
  // How long it is, for what can be seen of it, and its body, for whether any of it is seen and whether two bodies
  // are in one another: how high its back is, half its length and half its width (m). An adult sow's.
  size: 1.4, body: { high: 0.84, long: 0.56, wide: 0.28 },
  // One stride of each gait, metres at the sow's size (life/beasts.js `stridesOf`): as they were (the elk's, by the
  // length of the bear's foreleg against the elk's).
  strides: { walk: 0.84, trot: 1.62, gallop: 2.67 },
  // The body, in metres, standing square: an adult sow, drawn as a plate (life/plate.js says what each drawing is).
  // Every number is the agent's but the shoulder's height, the length, the tail and the paws, which are set inside
  // the published ranges above, and the claws, which are under the published most. Drawn from memory of black bears
  // and of field-guide plates of them (no photograph was looked at): the rump the highest of the back and round, no
  // hump at the shoulders, a deep shaggy barrel on short thick legs, a short thick neck carried low, a broad skull
  // and a straight, longish muzzle; flat-footed.
  shape: {
    plate: {
      side: {
        //     t      x       y
        top: [[0.0, -0.545, 0.660], [0.5, -0.538, 0.745], [1.0, -0.512, 0.822], [2.0, -0.420, 0.895],        // the rump's end, round up over the tail
          [3.0, -0.290, 0.915], [4.0, -0.120, 0.900], [5.0, 0.060, 0.876], [6.0, 0.220, 0.862],                // the croup, the highest of the back; the back
          [7.0, 0.340, 0.866], [8.0, 0.450, 0.862], [9.0, 0.540, 0.852], [10.0, 0.610, 0.842],                 // the shoulders (no hump), the short neck
          [11.0, 0.670, 0.840], [12.0, 0.745, 0.820], [12.6, 0.790, 0.790], [13.0, 0.820, 0.758],              // the poll, the broad forehead, the brow, between the eyes
          [14.0, 0.888, 0.716], [14.6, 0.928, 0.694], [15.0, 0.952, 0.668]],                                   // the muzzle, straight, to the nose
        bottom: [[0.0, -0.545, 0.600], [0.5, -0.541, 0.520], [1.0, -0.527, 0.455], [2.0, -0.440, 0.402],     // the buttocks, down between the thighs
          [3.0, -0.290, 0.410], [4.0, -0.120, 0.398], [5.0, 0.060, 0.392], [6.0, 0.220, 0.400],                // the belly, deep and shaggy
          [7.0, 0.360, 0.424], [8.0, 0.470, 0.470], [9.0, 0.555, 0.522], [10.0, 0.615, 0.548],                 // the chest, the brisket, the throat
          [11.0, 0.662, 0.555], [12.0, 0.722, 0.548], [13.0, 0.795, 0.556],                                    // the angle of the jaw
          [14.0, 0.862, 0.574], [14.6, 0.908, 0.588], [15.0, 0.940, 0.600]],                                   // the chin, the lips
      },
      //        t   half
      above: [[0, 0.03], [0.5, 0.14], [1, 0.200], [2, 0.255], [3, 0.270], [4, 0.276], [5, 0.270], [6, 0.260], [7, 0.245], [8, 0.200],
        [9, 0.170], [10, 0.152], [11, 0.138], [12, 0.136], [12.6, 0.124], [13, 0.098], [14, 0.070], [14.6, 0.062], [15, 0.048]],
      //        t  wide  over under
      front: [[0, 0.5, 2.0, 2.0], [1, 0.52, 2.1, 2.0], [3, 0.52, 2.1, 2.2], [5, 0.48, 2.1, 2.3], [7, 0.50, 2.0, 2.1], [9, 0.50, 2.0, 2.1],
        [11, 0.55, 2.3, 2.0], [12, 0.58, 2.5, 1.9], [13, 0.60, 2.3, 2.0], [14, 0.55, 2.3, 2.2], [15, 0.50, 2.4, 2.3]],
      spine: [['hips', -0.36, 0.72], ['loin', -0.18, 0.74], ['back', 0.0, 0.72], ['chest', 0.17, 0.70],
        ['neck1', 0.40, 0.70], ['neck2', 0.50, 0.71], ['neck3', 0.59, 0.70], ['head', 0.668, 0.70]],
      marks: { rump: 0, withers: [6.5, 7.5], poll: 11 },
      jaw: { hinge: [0.725, 0.630], from: 12.6, soft: 1.2, lips: 0.40, open: 0.3 },
      eye: { at: [0.812, 0.722], r: 0.012 },
    },
    // the paws (life/parts/paw.js): plantigrade, five toes in an arc, the forefeet turned in; the front claws under 2 in
    // and the hind as long (I, B), the front ones more curved (a search's summary of iNaturalist's guide, not read)
    paw: { kind: 'plantigrade', claw: 40, hind: 38, curve: 1.1, in: 9, hindIn: 3, thick: 0.25 },
    fore: {
      at: [0.335, 0.17], proud: 0.03,
      //        the blade's top      the point of the shoulder  the elbow           the wrist            over the pad
      joints: [[0.24, 0.82, 0.12], [0.43, 0.60, 0.19], [0.25, 0.43, 0.20], [0.33, 0.11, 0.17], [0.335, 0.045, 0.17]],
      //          y     front   back    out    in
      outline: [[0.76, 0.400, 0.170, 0.140, 0.05], [0.68, 0.465, 0.125, 0.225, 0.055], [0.60, 0.490, 0.115, 0.260, 0.065],
        [0.52, 0.475, 0.140, 0.268, 0.075], [0.44, 0.445, 0.185, 0.262, 0.085],                                         // the shoulder, the elbow behind
        [0.36, 0.425, 0.225, 0.250, 0.090], [0.28, 0.412, 0.245, 0.240, 0.095], [0.20, 0.402, 0.258, 0.235, 0.100],     // the forearm, thick with hair
        [0.13, 0.398, 0.266, 0.230, 0.105], [0.08, 0.402, 0.270, 0.230, 0.105], [0.045, 0.408, 0.270, 0.232, 0.103]],   // the wrist
      foot: { long: 0.118, wide: 0.118, high: 0.05, heel: 0.3, toes: 5, digits: 0.3, round: 0.75, thumb: 0.85 },
    },
    hind: {
      at: [-0.42, 0.17], proud: 0.035,
      //        the hip               the knee             the ankle             over the pad
      joints: [[-0.36, 0.72, 0.15], [-0.25, 0.42, 0.21], [-0.44, 0.12, 0.17], [-0.42, 0.045, 0.17]],
      outline: [[0.80, -0.200, -0.470, 0.150, 0.05], [0.72, -0.140, -0.520, 0.235, 0.05], [0.62, -0.115, -0.540, 0.275, 0.055],
        [0.52, -0.130, -0.540, 0.280, 0.065], [0.44, -0.160, -0.532, 0.270, 0.075],                                       // the haunch, down to the knee
        [0.36, -0.215, -0.520, 0.258, 0.085], [0.28, -0.270, -0.505, 0.248, 0.095], [0.20, -0.310, -0.495, 0.240, 0.100], // the shank, in its trousers
        [0.13, -0.335, -0.492, 0.236, 0.104], [0.08, -0.338, -0.495, 0.235, 0.105], [0.045, -0.335, -0.498, 0.236, 0.104]], // the ankle, the heel
      foot: { long: 0.172, wide: 0.11, high: 0.055, heel: 0.24, toes: 5, digits: 0.22, round: 0.6, thumb: 0.8 },
    },
    ear: { at: [0.690, 0.800], length: 0.125, width: 0.11, out: 42, open: 25, round: 1, back: 10 },
    tail: { at: [-0.528, 0.725], length: 0.095, width: 0.07, depth: 0.042, hang: 55 },
    // the neck's four joints (neck1, neck2, neck3, the poll) turned from as it stands (radians): the muzzle to the
    // ground, and the head up; `dip`, how far the chest is let down to feed
    neck: { low: [-0.45, -0.25, -0.2, 0.2], high: [0.26, 0.16, 0.12, 0.06], dip: -0.1 },
    // lying down: how far the body comes down; where the wrist or the ankle and the paw's joint go (x from the top
    // joint, y), how far out to the side, and how the paw is bent from the bone it then follows
    lie: { drop: 0.365, fore: { top: [0.2, 0.07], fetlock: [0.27, 0.05], out: 1.05, hoof: -0.2 }, hind: { top: [-0.14, 0.08], fetlock: [0.02, 0.05], out: 1.45, hoof: 0.4 } },
    // a cub or a yearling: a bigger head on the same legs
    young: { legs: 0, head: 0.2, neck: 0 },
    // sat on its haunches: the rump on the ground, the body near upright, the forefeet down between the hind
    sit: { pitch: 1.12, arch: 0.3, back: 0.2, fore: 0.14, high: 0.3 },
  },
  // The coat in the middle of May, as paint (life/plateCoat.js says what each table is): black all over but the
  // muzzle (S, B, A), the form in cooler, lighter planes where the coat turns to the sky. Nothing read said what the
  // coat looks like in May: every shade, and where each boundary runs, is the agent's.
  coat: {
    rules: [
      { colour: BLACK },
      // a brown muzzle (B, A, W): darker along its top, the nose's leather black
      { colour: MUZZLE_DARK, where: (p) => (p.part === 'body' ? edge(p.t - 13.15, 0.2) : 0) },
      { colour: MUZZLE, where: (p) => (p.part === 'body' ? edge(p.t - 13.5, 0.2) * edge(0.8 - p.a, 0.06) : 0) },
      { colour: NOSE, where: (p) => (p.part === 'body' ? edge(p.t - 14.62, 0.05) * edge(p.a - 0.42, 0.06) : 0) },
    ],
    // (the form is the turn of the surface itself, in two tones each way; no plane of its own is drawn)
    planes: [],
    tones: { light: [0, 3, 4], shade: [0, -2, -2.2] },
    turn: { top: 1.1, under: 0.8 },
    hair: { count: 0.35, long: 0.05 },
    claw: [25, 8, 9],                                                                            // dark grey-brown (not confirmed: see the note)
    pad: [20, 5, 8],
    ear: { outer: BLACK, inner: [20, 10, 15], edge: DULL },
    tail: { top: BLACK, under: BLACK },
    eye: { iris: [24, 40, 14], pupil: [240, 10, 4] },
  },
  // Who a bear may be (life/plateRig.js; its family sets these once): the sow is the sheet; a boar larger; a
  // yearling and a cub smaller, their heads bigger for their bodies. And the poses the contact sheet shows
  // (life/plateStudio.js), each the fields of a pose a family may ask for.
  who: { sow: {}, boar: { scale: 1.15 }, yearling: { scale: 0.7 }, cub: { scale: 0.42 } },
  poses: {
    alert: { neck: 1, ears: 1 },
    forage: { neck: 0, jaw: 0.2 },
    look: { neck: 0.85, ears: 1, head: { yaw: 0.9 } },
    walk: { walk: 1, cycle: 0.1, neck: 0.45 },
    trot: { trot: 1, cycle: 0.1 },
    // (the moment the sheet shows: the forefeet planted one before the other and the hind feet swinging up under the
    // body. At 0.22, as it was, both forefeet were off the ground and reaching forward together, which read wrong
    // on the sheet: the gait's own phases, life/plateRig.js, put them only 0.12 of a stride apart)
    gallop: { gallop: 1, cycle: 0.55, ears: -0.4 },
    lie: { lie: 1, neck: 0.5 },
    sit: { sit: 1, neck: 0.7 },
    upright: { rear: 1, neck: 0.75, ears: 1 },
    reach: { rear: 1, arms: 1, neck: 1, jaw: 0.4 },
    rub: { rear: 1, rub: 1, beat: 0.2, arms: -0.6, neck: 0.9, head: { tilt: 0.3 } },
    climb: { cling: 1, grip: 0.45, walk: 1, cycle: 0.15, neck: 0.8 },
    dig: { dig: 1, rake: 0.5, reach: 0.3, at: 0.22, neck: 0.25 },
    scratch: { scratch: 1, beat: 0.1 },
    shake: { shake: 1, beat: 0.05 },
    eat: { sit: 1, hold: 1, neck: 0.5, jaw: 0.5 },
    roll: { roll: 2.7, beat: 0.3, neck: 0.75 },
  },
  studio: { high: 1.3, tall: 1.0, middle: 0.21,
    rows: [
      { span: 1.95, high: 1.25, cells: [['sow', 'sow', null, 'side'], ['front', 'sow', null, 'front'], ['behind', 'sow', null, 'behind'], ['three-quarters', 'sow', null, 'quarter'], ['from above', 'sow', null, 'above'], ['cub', 'cub', null, 'side']] },
      { span: 1.95, high: 1.25, cells: [['walk', 'sow', 'walk', 'side'], ['gallop', 'sow', 'gallop', 'side'], ['foraging', 'sow', 'forage', 'side'], ['looking round', 'sow', 'look', 'quarter'], ['lying', 'sow', 'lie', 'side'], ['digging at a log', 'sow', 'dig', 'side']] },
      { span: 1.95, high: 2.1, cells: [['sitting', 'sow', 'sit', 'side'], ['standing up to look', 'sow', 'upright', 'side'], ['reaching', 'sow', 'reach', 'side'], ['rubbing its back', 'sow', 'rub', 'side'], ['climbing', 'sow', 'climb', 'up'], ['boar, upright', 'boar', 'upright', 'quarter']] },
      { span: 1.95, high: 1.3, cells: [['scratching', 'sow', 'scratch', 'side'], ['shaking', 'sow', 'shake', 'quarter'], ['on its back', 'sow', 'roll', 'side'], ['going away', 'sow', 'walk', 'rear'], ['eating, sat down', 'sow', 'eat', 'quarter'], ['trot', 'sow', 'trot', 'side']] },
    ] },
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'A sow stands about 0.8 m at the shoulder and weighs 40 to 75 kg; a boar is larger, to 140 kg. Standing up, about 1.5 m tall.',
    marks: ['Black all over but for a brown muzzle: virtually every bear of the Olympics is black', 'No hump on the shoulders; the rump stands higher than them', 'Tall, oval ears; a straight face', 'Flat-footed, five toes to each foot, with short curved claws'],
    lives: 'In the valleys and the forest of the peninsula. In spring, out of its den, it grazes the new grasses, sedges and skunk cabbage, tears rotten logs apart for grubs and ants, and turns stones by the river. It may go on feeding while you watch it from a distance; come nearer and it may stand on its hind legs to look and smell (a standing bear is curious, getting a better look or smell) and then amble off a little way. A sow sends her cubs up a tree and waits under it. Keep at least 30 m away, and give a sow with cubs more.',
  },
};
