// Roosevelt elk, Cervus canadensis roosevelti: the largest elk of North America, and the elk of the Olympic
// Peninsula's rain-forest valleys. Built by life/beast.js from `shape`, painted by life/coat.js; how it lives is
// life/beasts.js.
//
// What is published and what is not (read 2026-11-16 by agents, each reader's claims checked by a second agent
// against the source and a second one where one existed; kept in .local-assets/forest/research/elk-2026-11-16.json
// and animals-2-2026-11-16.json; none of it seen as an image). Few measurements of the Roosevelt elk itself were
// reached: the mammal monographs that hold them (Dalquest 1948, Bailey 1936, Murie 1951, Verts and Carraway 1998)
// could not be opened. What was: the masses of Roosevelt bulls and cows; the shoulder height of adult elk in
// Washington; the whole species' total length; a tail and a hind foot of males of other stock; two bone lengths
// and a track's length of elk of no stated stock. Not found, and the agent's: the ear, the head, the neck, the
// legs' segments but those two bones, how wide the body is, the antlers in May.

export const published = {
  shown: 'an adult cow (bulls are drawn from the same body, larger, with antlers in velvet)',
  note: 'Published: the masses and the shoulder height below, the colours (a dark brown head, neck and legs; a pale brown body; a large pale rump; a short tail; a thin dark mane), that the winter coat is greyish brown and the summer coat golden brown, and that calving is late May to early June. Not found, and the agent\'s: the ear, the head\'s and the neck\'s lengths, the legs\' segments but the humerus and the metatarsal, the body\'s width, how patchy the coat is in mid-May, and the size of a bull\'s velvet antlers in mid-May (antlers are cast from mid-January to April, and grow again soon after).',
  sources: {
    W: 'Washington Department of Fish and Wildlife, "Elk" (publication 00614): adult elk 4.5 to 5 ft at the shoulder; bulls 600 to 800 lb, cows 400 to 500 lb',
    N: 'National Park Service, Olympic National Park: "Roosevelt Elk", and the "Common Mammals" brochure (a bull sometimes 5 ft at the shoulder); herds of about 20 cows with their young, bulls alone or in small groups',
    K: 'Wikipedia, "Elk": Roosevelt bulls 318 to 499 kg, cows 261 to 283 kg',
    A: 'Animal Diversity Web, Cervus elaphus: 1.6 to 2.7 m from nose to tail, the whole species',
    T: 'Schmidly and Bradley, The Mammals of Texas (2016), wapiti: males about 2 m long, tail 160 mm, hind foot 670 mm (Rocky Mountain stock, not Roosevelt)',
    O: 'OsteoID, elk humerus 273 to 363 mm and metatarsal 282 to 356 mm (no stock, sex or sample given)',
    M: 'New Mexico State University, circular CR561: an adult elk\'s track 4 to 4 3/4 in long',
    F: 'US Forest Service, FEIS, Cervus elaphus: cows about 80 % of a bull\'s mass; most calving late May to early June; active day and night, most at dawn and dusk',
  },
  // [key, label, value (m), [least, most], source]: what the built cow is measured against (life/measure.js)
  lengths: [
    ['shoulder', 'Height at the shoulder, adults', null, [1.37, 1.52], 'W'],
    ['length', 'Length, nose to rump (the whole species)', null, [1.6, 2.7], 'A'],
    ['humerus', 'Humerus', null, [0.273, 0.363], 'O'],
    ['metatarsus', 'Metatarsal (the hind cannon bone)', null, [0.282, 0.356], 'O'],
    ['track', 'Track, length', null, [0.102, 0.121], 'M'],
  ],
  proportions: [
    'Thick-bodied, with slender legs and a short tail (Wikipedia, "Elk")',
    'The tail 160 mm and the hind foot 670 mm in males of other stock (T): the cow\'s are built a little shorter',
    'Not found: the ear (built at 0.2 m from its notch), the head (0.5 m), the neck, the width of the body',
  ],
  mass: 'Cows 261 to 283 kg, bulls 318 to 499 kg (K); in Washington cows 400 to 500 lb and bulls 600 to 800 lb (W)',
};

// The coat in the middle of May, as paint: [hue, saturation, lightness]. The pattern is from the sources above; the
// shades, the moult's patches and where each boundary runs are the agent's.
const TAN = [32, 36, 47], DARK = [20, 30, 12.5], DARKER = [19, 26, 9.5];
const CREAM = [39, 38, 72], BORDER = [22, 34, 24], HEAD = [24, 32, 25], MUZZLE = [20, 24, 13], CHIN = [34, 26, 58], NOSE = [20, 8, 7];
// how far forward the pale rump comes at a height: furthest at the tail's height, narrowing above and below
const RUMP = (y) => -0.655 - 0.28 * Math.abs(y - 1.12);
// a field's edge: 0 where `x` is under nothing, 1 where it is over, across `soft` either side of it
const edge = (x, soft) => { const t = Math.min(1, Math.max(0, (x + soft) / (2 * soft))); return t * t * (3 - 2 * t); };

export default {
  name: 'Roosevelt elk', latin: 'Cervus canadensis roosevelti', key: 'roosevelt-elk', seed: 211,
  // ---- who is about on a visit, how it lives on one and what it says (life/species/index.js says what each is)
  // (a herd on every visit, by day and by night, and now and then two: the owner's living world over the census's
  // tier, 2026-11-18. A herd is of mixed company, four to eleven: life/beasts.js `castOf`)
  census: { tier: 'some', source: 'N C', party: [4, 11], clock: 'any', sure: [1, 2] },
  way: { family: 'herd', there: 0.8, gap: [45, 240], together: true, herd: true },
  // what the herd says (life/beasts.js `world.say`): a cow's bark when it is alarmed, and the mew that keeps a herd together
  voices: {
    bark: { file: 'elk-bark.mp3', level: 0.9, near: 30,
      credit: { what: "Elk, cow's alarm bark (Rocky Mountain elk, Moraine Park)", by: "J. Job, National Park Service, Rocky Mountain NP sound library, 2017", licence: "public domain (US federal work): cut and filtered; credit \"National Park Service\"",
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-wildlife-soundscapes.htm', bytes: 76477, kept: 1.1 } },
    mew: { file: 'elk-mew.mp3', level: 0.6, near: 12,
      credit: { what: "Elk, cow's mew (the page says elk can be heard bugling in the background of the original)", by: "J. Job, National Park Service, Rocky Mountain NP sound library, 2017", licence: "public domain (US federal work): cut and filtered; credit \"National Park Service\"",
        licenceUrl: 'https://www.nps.gov/romo/learn/photosmultimedia/soundlibrary.htm', source: 'https://www.nps.gov/romo/learn/photosmultimedia/sounds-wildlife-soundscapes.htm', bytes: 482237, kept: 1.95 } },
  },
  plan: 'beast',
  published,
  // How long it is, for what can be seen of it (a bird's size is worked out from its wing), and its body, for
  // whether any of it is seen and whether two bodies are in one another: how high its back is, half its length
  // and half its width (m). An adult cow's.
  size: 2.3, body: { high: 1.2, long: 1.1, wide: 0.42 },
  // One stride of each gait, metres at the cow's size (life/beasts.js `stridesOf`: what the rig sweeps the feet by
  // and a family runs the stride on by). The agent's own, as they were.
  strides: { walk: 1.45, trot: 2.8, gallop: 4.6 },
  // The body, in metres, standing square: an adult cow, drawn as a plate (life/plate.js says what each drawing is).
  // Every number is the agent's but the shoulder's height, the humerus, the metatarsal and the hoof's length, which
  // are set inside the published ranges above. Drawn from memory of elk and of field-guide plates of them (no
  // photograph was looked at): the withers the highest of the back, the croup a little lower and falling to the
  // tail, the chest deep and the flank tucked up, the neck rising at about 45 degrees, deep where it leaves the
  // chest; the head long, 0.49 m, its profile straight.
  shape: {
    plate: {
      side: {
        //     t      x       y
        top: [[0.0, -0.800, 1.075], [0.3, -0.792, 1.150], [0.6, -0.775, 1.212], [1.0, -0.722, 1.258],        // the buttock's end, up to the tail's root
          [2.0, -0.540, 1.332], [2.5, -0.410, 1.346], [3.0, -0.250, 1.326],                                    // the croup, the hips the highest of it, the loin
          [4.0, 0.000, 1.306], [5.0, 0.220, 1.330], [6.0, 0.400, 1.400], [6.5, 0.500, 1.404],                  // the back, rising to the withers
          [7.0, 0.600, 1.432], [8.0, 0.765, 1.555], [9.0, 0.915, 1.685], [10.0, 1.030, 1.776],                 // the crest of the neck
          [11.0, 1.100, 1.820], [11.5, 1.156, 1.814], [12.0, 1.216, 1.780],                                    // the poll, the forehead, the brow
          [13.0, 1.330, 1.690], [14.0, 1.420, 1.606], [14.6, 1.466, 1.560], [15.0, 1.486, 1.526]],             // the face, straight, to the nose
        bottom: [[0.0, -0.800, 1.055], [0.3, -0.794, 0.975], [0.6, -0.780, 0.905], [1.0, -0.750, 0.845],     // the buttocks, down between the thighs
          [2.0, -0.560, 0.805], [2.5, -0.420, 0.840], [3.0, -0.250, 0.832],                                    // the groin, the flank tucked up
          [4.0, 0.000, 0.765], [5.0, 0.220, 0.728], [6.0, 0.420, 0.716], [6.5, 0.550, 0.742],                  // the belly, the girth, the chest's floor
          [7.0, 0.675, 0.812], [7.5, 0.765, 0.922], [8.0, 0.830, 1.060],                                       // the brisket, and the neck leaving it
          [9.0, 0.925, 1.295], [10.0, 1.005, 1.468], [11.0, 1.050, 1.566],                                     // the throat
          [11.5, 1.092, 1.556], [12.0, 1.156, 1.545], [13.0, 1.270, 1.525],                                    // the angle of the jaw, the jaw's line
          [14.0, 1.375, 1.496], [14.6, 1.430, 1.476], [15.0, 1.468, 1.460]],                                   // the chin, the lips: a blunt muzzle
      },
      //        t   half
      above: [[0, 0.02], [0.3, 0.10], [0.6, 0.155], [1, 0.200], [2, 0.262], [3, 0.280], [4, 0.300], [5, 0.290], [6, 0.250], [7, 0.215],
        [8, 0.170], [9, 0.135], [10, 0.112], [11, 0.100], [11.5, 0.102], [12, 0.102], [13, 0.076], [14, 0.062], [14.6, 0.056], [15, 0.044]],
      //        t  wide  over under
      front: [[0, 0.5, 2.0, 2.0], [1, 0.55, 2.1, 2.0], [2, 0.62, 2.3, 1.9], [3, 0.55, 2.3, 2.2], [4, 0.50, 2.2, 2.3], [5, 0.52, 2.0, 2.1],
        [6, 0.56, 1.7, 1.8], [7, 0.50, 1.8, 1.8], [8, 0.50, 1.9, 2.0], [9, 0.50, 2.0, 2.1], [10, 0.50, 2.0, 2.1], [11, 0.55, 2.1, 2.0],
        [11.5, 0.50, 2.2, 1.9], [12, 0.62, 2.3, 1.8], [13, 0.60, 2.2, 1.9], [14, 0.55, 2.3, 2.2], [15, 0.50, 2.4, 2.3]],
      spine: [['hips', -0.50, 1.13], ['loin', -0.27, 1.15], ['back', 0.0, 1.13], ['chest', 0.25, 1.12],
        ['neck1', 0.62, 1.14], ['neck2', 0.78, 1.33], ['neck3', 0.93, 1.52], ['head', 1.065, 1.70]],
      marks: { rump: 0, withers: [5.5, 6.6], poll: 11 },
      jaw: { hinge: [1.10, 1.655], from: 11.8, soft: 1.5, lips: 0.42 },
      mane: { from: 6.6, to: 11.2, at: [0.86, 1.62], most: 0.75 },
      eye: { at: [1.236, 1.722], r: 0.019 },
    },
    fore: {
      at: [0.55, 0.15], proud: 0.035,
      //        the blade's top      the point of the shoulder  the elbow             the knee              the fetlock
      joints: [[0.40, 1.30, 0.10], [0.685, 0.985, 0.19], [0.455, 0.815, 0.185], [0.505, 0.455, 0.150], [0.510, 0.135, 0.150]],
      //          y     front   back    out    in
      outline: [[1.30, 0.500, 0.300, 0.160, 0.04], [1.20, 0.585, 0.275, 0.210, 0.05], [1.10, 0.665, 0.270, 0.245, 0.06],
        [1.00, 0.715, 0.300, 0.265, 0.07], [0.92, 0.705, 0.335, 0.265, 0.08], [0.84, 0.650, 0.370, 0.250, 0.09],        // the point of the shoulder, the elbow behind
        [0.78, 0.615, 0.405, 0.235, 0.10], [0.70, 0.590, 0.425, 0.220, 0.105], [0.60, 0.565, 0.445, 0.200, 0.11],       // the forearm
        [0.50, 0.548, 0.458, 0.190, 0.112], [0.455, 0.553, 0.452, 0.193, 0.108], [0.41, 0.545, 0.462, 0.188, 0.112],    // the knee
        [0.36, 0.530, 0.470, 0.178, 0.122], [0.25, 0.528, 0.474, 0.176, 0.124], [0.17, 0.532, 0.470, 0.178, 0.122],     // the cannon
        [0.135, 0.545, 0.462, 0.184, 0.116], [0.09, 0.570, 0.490, 0.180, 0.120], [0.05, 0.598, 0.512, 0.190, 0.110]],   // the fetlock, the pastern, the coronet
      hoof: { long: 0.112, high: 0.05, wide: 0.085, ahead: 0.045 },
    },
    hind: {
      at: [-0.535, 0.16], proud: 0.04,
      //        the hip               the stifle            the hock               the fetlock
      joints: [[-0.46, 1.11, 0.14], [-0.305, 0.80, 0.20], [-0.625, 0.49, 0.165], [-0.595, 0.145, 0.16]],
      outline: [[1.32, -0.320, -0.620, 0.200, 0.05], [1.22, -0.235, -0.725, 0.262, 0.05], [1.10, -0.185, -0.780, 0.285, 0.05],
        [1.00, -0.175, -0.790, 0.290, 0.05], [0.90, -0.185, -0.785, 0.280, 0.06], [0.80, -0.215, -0.755, 0.262, 0.08],  // the haunch, down to the stifle
        [0.72, -0.290, -0.720, 0.240, 0.10], [0.64, -0.390, -0.695, 0.222, 0.115], [0.56, -0.495, -0.690, 0.208, 0.122], // the gaskin
        [0.49, -0.550, -0.705, 0.200, 0.128], [0.45, -0.572, -0.682, 0.196, 0.130], [0.38, -0.582, -0.650, 0.190, 0.134], // the hock, its point behind
        [0.25, -0.576, -0.636, 0.188, 0.134], [0.18, -0.566, -0.630, 0.190, 0.132],                                      // the cannon
        [0.145, -0.556, -0.640, 0.194, 0.126], [0.09, -0.525, -0.605, 0.190, 0.130], [0.048, -0.505, -0.592, 0.198, 0.122]],
      hoof: { long: 0.105, high: 0.048, wide: 0.08, ahead: 0.045 },
    },
    ear: { at: [1.085, 1.795], length: 0.225, width: 0.125, out: 35, open: 40, back: 42 },
    tail: { at: [-0.786, 1.20], length: 0.14, width: 0.075, depth: 0.04, hang: 12 },
    // a bull's antlers, in velvet: well grown, each beam sweeping up, out and back with its brow, bez and trez tines
    // and forking at its top (true to June more than to the middle of May: the owner's choice, 2026-11-18)
    antler: {
      at: [1.128, 1.810], side: 0.062, base: 0.042, tip: 0.027, far: 3,
      beam: [[0, 0, 0], [-0.02, 0.10, 0.07], [-0.10, 0.24, 0.17], [-0.24, 0.40, 0.25], [-0.40, 0.54, 0.28], [-0.54, 0.66, 0.25], [-0.62, 0.80, 0.20]],
      //       along the beam; its line from there; how thick
      tines: [[0.05, [[0.10, 0.0, 0.02], [0.22, 0.03, 0.03], [0.31, 0.11, 0.03]], 0.85],          // the brow tine, forward over the face
        [0.13, [[0.09, 0.04, 0.06], [0.20, 0.10, 0.10], [0.27, 0.20, 0.12]], 0.85],              // the bez
        [0.36, [[0.08, 0.06, 0.03], [0.15, 0.16, 0.05], [0.18, 0.28, 0.06]], 0.9],               // the trez
        [0.58, [[0.05, 0.10, 0.02], [0.08, 0.23, 0.02], [0.08, 0.36, 0.01]], 0.95],              // the royal, the longest
        [0.80, [[0.05, 0.08, -0.01], [0.07, 0.18, -0.02]], 0.95]],                               // the fork of the top
    },
    // the neck's four joints (neck1, neck2, neck3, the poll) turned from as it stands (radians): grazing, and head up;
    // `dip`, how far the chest is let down to graze
    // a bull: his neck deeper and wider (the `mane` bone's scale), his head a little bigger
    bull: { mane: [1.25, 1.36, 1.55], head: 0.05 },
    // sparring: the neck out and a little down, the chin tucked hard so that the antlers come forward
    spar: { neck: 0.42, head: -1.25 },
    neck: { low: [-0.87, -0.47, -0.52, 1.4], high: [0.21, 0.1, 0.07, -0.05], dip: -0.14 },
    // lying down: how far the body comes down; where the knee or the hock and the fetlock go (x from the top joint, y),
    // how far out to the side, and how the hoof is bent from the cannon it then follows (radians)
    lie: { drop: 0.63, fore: { top: [0.13, 0.065], fetlock: [-0.17, 0.045], out: 1.0, hoof: -0.75 }, hind: { top: [-0.09, 0.075], fetlock: [0.23, 0.045], out: 1.55, hoof: 0.2 } },
  },
  // The coat, as paint (life/plateCoat.js says what each table is): a tawny buff body; a dark chocolate neck, head,
  // belly line and legs; a pale rump patch with a soft dark border, and a short pale tail. The pattern is from the
  // sources above; the shades and where each boundary runs are the agent's.
  coat: {
    rules: [
      { colour: TAN },                                                                                       // a pale brown body (NPS)
      // a dark brown neck (NPS): from before the withers down over the point of the shoulder to the brisket
      { colour: DARK, where: (p) => edge(p.x - (p.y > 1.0 ? 0.70 - 0.32 * (p.y - 1.0) : 0.70 - 0.5 * (1.0 - p.y)), 0.014) },
      // the legs dark from the elbow down, and from the stifle down and back
      { colour: DARK, where: (p) => (p.part === 'limb' ? edge((p.hind ? 0.78 + 0.45 * (p.x + 0.40) : 0.84) - p.y, 0.014) : 0) },
      { colour: DARKER, where: (p) => (p.part === 'limb' ? edge(0.4 - p.y, 0.05) : 0) },
      // a dark belly line (Mammals of Texas: belly dull rusty brown to blackish)
      { colour: DARK, where: (p) => (p.part === 'body' ? edge(0.17 - p.a, 0.03) * edge(p.x + 0.62, 0.04) : 0) },
      // a large pale rump round the tail (NPS: "large white rump"; creamy buff, Mammals of Texas), with a dark edge
      { colour: BORDER, where: (p) => edge(RUMP(p.y) + 0.035 - p.x, 0.02) * edge(p.y - 0.80, 0.03) },
      { colour: CREAM, where: (p) => edge(RUMP(p.y) - p.x, 0.012) * edge(p.y - 0.83, 0.03) },
      // the face: a browner head, darker down the muzzle, a pale chin, the nose's leather black
      { colour: HEAD, where: (p) => (p.part === 'body' ? edge(p.t - 11.3, 0.3) : 0) },
      { colour: MUZZLE, where: (p) => (p.part === 'body' ? edge(p.t - 13.7, 0.25) : 0) },
      { colour: CHIN, where: (p) => (p.part === 'body' ? edge(p.t - 13.5, 0.2) * edge(0.24 - p.a, 0.05) : 0) },
      { colour: NOSE, where: (p) => (p.part === 'body' ? edge(p.t - 14.66, 0.05) * edge(p.a - 0.40, 0.06) : 0) },
    ],
    // the form: the shoulder and the haunch a tone lighter where they stand out, the hollows behind the elbow and in
    // the flank a tone darker; the neck's side plane, and the long hair under it; the cheek
    // (most of the form is the turn of the surface itself; these are the hollows it does not have)
    planes: [
      { at: [0.30, 0.93], r: [0.055, 0.16], tone: -1 },
      { at: [-0.26, 1.00], r: [0.06, 0.14], turn: 12, tone: -1 },
      { at: [0.92, 1.24], r: [0.24, 0.07], turn: 66, tone: -1 },
    ],
    tones: { light: [2, 0, 5], shade: [-3, 2, -6] },
    turn: { top: 1, under: 1 },
    hoof: [24, 10, 7],
    ear: { outer: [26, 22, 30], inner: [34, 26, 66], edge: [22, 22, 16] },
    tail: { top: [36, 32, 66], under: [38, 34, 72] },
    antler: [24, 20, 27],                                                                                    // velvet (its colour not found)
    eye: { iris: [20, 45, 9], pupil: [240, 10, 4] },
  },
  // Who an elk may be (life/plateRig.js: one skeleton and one paint; its family sets these once): the cow is the
  // sheet; a bull is larger, his neck deep and maned, with antlers; a calf small, on long legs. And the poses the
  // contact sheet shows (life/plateStudio.js), each the fields of a pose a family may ask for.
  who: { cow: {}, bull: { scale: 1.07, antler: 1 }, spike: { scale: 0.95, antler: 0.55 }, calf: { scale: 0.5 }, yearling: { scale: 0.84 } },
  poses: {
    alert: { neck: 1, ears: 1, head: { pitch: 0.05 } },
    graze: { neck: 0, jaw: 0.3, ears: -0.2 },
    look: { neck: 0.9, ears: 1, head: { yaw: 1.0, pitch: 0.05 } },
    lie: { lie: 1, neck: 0.55, ears: 0 },
    walk: { walk: 1, cycle: 0.1 },
    trot: { trot: 1, neck: 0.8, cycle: 0.1 },
    gallop: { gallop: 1, neck: 0.75, ears: -0.3, cycle: 0.2 },
    high: { walk: 1, high: 1, neck: 1, ears: 1, cycle: 0.45 },
    spar: { spar: 1, push: 0.6, ears: -0.6 },
    rear: { rear: 1, box: 1, beat: 0.2, ears: -0.5 },
    paw: { dig: 1, rake: 0.55, neck: 0.3 },
    scratch: { scratch: 1, beat: 0.1 },
    shake: { shake: 1, beat: 0.05 },
  },
  studio: { high: 2.45, tall: 1.75, small: ['cow', 'bull'], middle: 0.34, apart: 2.95,
    rows: [
      { span: 2.85, high: 2.45, cells: [['cow', 'cow', null, 'side'], ['front', 'cow', null, 'front'], ['behind', 'cow', null, 'behind'], ['three-quarters', 'cow', null, 'quarter'], ['bull, in velvet', 'bull', 'alert', 'side']] },
      { span: 2.85, high: 2.3, cells: [['from above', 'cow', null, 'above'], ['calf', 'calf', null, 'side'], ['grazing', 'cow', 'graze', 'side'], ['alert', 'cow', 'alert', 'side'], ['looking round', 'cow', 'look', 'quarter'], ['lying', 'cow', 'lie', 'side']] },
      { span: 3.1, high: 2.2, cells: [['walk', 'cow', 'walk', 'side'], ['trot', 'cow', 'trot', 'side'], ['gallop', 'cow', 'gallop', 'side'], ['the high step', 'cow', 'high', 'side'], ['pawing', 'bull', 'paw', 'side'], ['scratching', 'cow', 'scratch', 'side']] },
      { span: 3.1, high: 2.9, cells: [['rearing to box', 'cow', 'rear', 'side'], ['sparring', 'bull', 'spar', 'side'], ['shaking', 'cow', 'shake', 'quarter'], ['bull', 'bull', 'look', 'quarter'], ['bull, going away', 'bull', null, 'rear']] },
    ] },
  // The words of the information card. Drafted by the agent from the sources above, for the owner to correct.
  card: {
    size: 'A cow stands about 1.4 m at the shoulder and weighs 260 to 280 kg; a bull is larger, to 1.5 m and 500 kg. The largest elk of North America.',
    marks: ['A pale brown body, a dark brown head, neck and legs', 'A large pale rump round a short tail', 'In May every elk is losing its greyish winter coat, and a bull\'s new antlers are growing, furred in velvet', 'Cows and their young go about in herds led by an old cow; bulls keep apart, alone or a few together'],
    lives: 'In the rain-forest valleys of the Olympic Peninsula all year: grazing the meadows and the river\'s banks at dawn and dusk, and browsing ferns and shrubs under the old trees, which it keeps open. By day it often lies up, chewing the cud. Unhunted here, the herds grow used to people: the park asks walkers to keep thirty metres off.',
  },
};
