// The Silver-haired Bat, Lasionycteris noctivagans: a black bat frosted with silver, of old forest and its edges. A
// kind's file is all there is of it (life/species/index.js says what goes in one).
//
// What was read by this agent (2026-11-16; none of it seen as an image): the Handbook of the Mammals of the World,
// vol. 9, Bats (Wilson and Mittermeier 2019, p. 839), read as its Plazi TreatmentBank text: head-body c. 57 to 70 mm,
// tail 35 to 45, ear 8 to 10, hind foot 7 to 9, forearm 37 to 44 mm, 8.1 to 11 g; black fur with silver to white
// tips above and below, less below, the head's fur darker; the base half of the tail's membrane densely furred
// above; wings, tail membrane and ears black; ears short, naked and rounded; the tragus broad and blunt; it "is adapted
// to edge habitats and cannot forage in closed habitats"; it hunts "over small ponds and streams or on treetops", a
// slow flier on hunting routes of 46 to 91 m across that "fly erratically taking many twists and frequent short
// glides"; it forages "right before and shortly after sunset", later in the night and near dawn; day roosts mainly
// under loose bark, also in hollows; solitary; calls sweep from 46 to 26 kHz, beyond hearing. Animal Diversity Web,
// Lasionycteris noctivagans: forearm 37 to 44 mm (mean 39), wingspan 27 to 31 cm (mean 29.5), 8 to 11 g, total length
// 9.5 to 11.5 cm, ears 5 to 9 mm and round, speeds of "just 4.8-5.0 m/s", summer day roosts "typically under loose
// bark", in snags. Wikipedia, "Silver-haired bat" (from the Mammals of Texas): total length about 100 mm, tail 40,
// forearm 37 to 44, 8 to 12 g; it forages low over still and running water and in forest openings. The Mammals of
// Texas online: averages of total length 100, tail 40, hind foot 8, ear 16, forearm 41 mm; "a relatively late flier"
// there (the sources disagree on its hour: the State University of New York's Adirondack page has it "may begin
// foraging before sunset", and that "the flight ... is slow, erratic, and punctuated with short glides", up to 18 km/h
// on a straight course). The Encyclopedia of Puget Sound: black or dark brown hairs tipped in silver, black wings and
// tail membrane; older, more varied forest; day roosts under loose bark of large decaying trees; in western
// Washington busiest for several hours after sunset and again before sunrise; but surveys "captured only single
// individuals ... on the Olympic Peninsula". The park's list: U, uncommon.
// The ear: the Handbook's 8 to 10 mm is drawn (Animal Diversity Web has 5 to 9, the Mammals of Texas 16, measured
// some other way). Not found, and the agent's drawing: the wingbeat (11 a second: between the Big Brown Bat's measured
// 11.2 and the myotis's 12), the humerus, the thumb, the angles of the finger bones (its wing drawn broad, as the
// Encyclopedia has it: "short broad wings"), every girth and outline, every pose, and every number of its way.
// The sheet's numbers are millimetres.

export default {
  key: 'silver-haired-bat', name: 'Silver-haired Bat', latin: 'Lasionycteris noctivagans', seed: 492, plan: 'bat',
  census: { tier: 'few', source: 'N U; the Encyclopedia of Puget Sound: surveys caught "only single individuals" on the Olympic Peninsula; solitary (Handbook); the tier is the agent\'s reading: the passages after N U were not kept in the research folder and had no second reader', clock: 'dusk' },
  size: 0.16,
  published: {
    shown: 'a Silver-haired Bat, Lasionycteris noctivagans: black fur frosted silver on the back and less on the belly, black ears and wings',
    note: 'Published: the forearm, the head and body, the tail, the wingspan, the ear (8 to 10 mm: drawn 10), the hind foot (7 to 9: drawn 8) and the mass; the black fur with silver tips, darker on the head; the furred base of the tail membrane; black wings and ears; the short, round, naked ears and the broad blunt tragus; the short broad wings. Not found, and the agent\'s: the humerus, the leg but the foot, the thumb, the angles of the finger bones, every girth and outline, the wingbeat (11 a second), and every pose.',
    sources: {
      H: 'Handbook of the Mammals of the World, vol. 9, Bats (2019), p. 839: head-body c. 57 to 70 mm, tail 35 to 45, ear 8 to 10, hind foot 7 to 9, forearm 37 to 44 mm, 8.1 to 11 g; silver to white tips on black fur; the base half of the tail membrane furred; slow, erratic flight with short glides',
      A: 'Animal Diversity Web, Lasionycteris noctivagans: forearm 37 to 44 mm, wingspan 27 to 31 cm (mean 29.5), 8 to 11 g; up to 4.8 to 5.0 m/s',
      E: 'Encyclopedia of Puget Sound: black or dark brown hairs tipped in silver; black wings and tail membrane; short broad wings; only single animals caught on the Olympic Peninsula',
      T: 'The Mammals of Texas, online edition: averages of total length 100, tail 40, hind foot 8, ear 16, forearm 41 mm',
    },
    mass: '8 to 11 g (A, H)',
    lengths: [
      ['forearm', 'Forearm, elbow to wrist (T: 41 on average)', null, [37, 44], 'HA'],
      ['headBody', 'Head and body, nose to the tail\'s root', null, [57, 70], 'H'],
      ['tail', 'Tail (T: 40 on average)', null, [35, 45], 'H'],
      ['span', 'Wingspan, tip to tip (A: 270 to 310)', 295, [270, 310], 'A'],
    ],
    proportions: [
      'The ear short (8 to 10 mm, H), round and naked; the tragus broad and blunt (H)',
      'Short broad wings (E): drawn with the fifth finger long and swept back',
      'The base half of the tail membrane densely furred above (H)',
    ],
  },
  card: {
    size: 'About the size of a mouse, with a wingspan of a long hand: 8 to 11 grams.',
    marks: ['Black fur frosted with silver, darker on the head', 'Black wings and short round black ears', 'Slow, erratic flight with many twists and short glides, along the edge of the trees'],
    lives: 'Roosts alone by day under the loose bark of old dead trees, and hunts along the forest\'s edges and over streams around sunset and again before dawn.',
  },
  flight: { rate: 11, note: 'Strokes a second. No rate of a Silver-haired Bat was found; it is the agent\'s, between the Big Brown Bat\'s measured 11.2 and the myotis\'s 12.' },
  shape: {
    trunk: [[33.4, 1.3, 1.5, 2.1], [29.9, 3.3, 2.8, 4.5], [23.6, 4.6, 3.8, 5.6], [16.7, 5.3, 4, 4.5], [9.7, 6.3, 5.3, 6], [0, 6.9, 6.3, 6.8], [-11.1, 6.5, 6, 6.3], [-19.5, 5.5, 5, 5.3], [-27.8, 1.5, 1.5, 1.5]],
    neck: [19.5, 11.1],
    shoulder: [7, 1.3, 5.8],
    humerus: [29, -6, 8], forearm: [41, 20, -2],
    digits: { d2: [36.2, 20, 0], d3: [75.5, 8, -3], d4: [68, -10, -3], d5: [52.9, -46, -3] },
    knuckle: [0.52, 0.52],
    thumb: [5.5, 2.5, 60, 30],
    leg: { hip: [-16.7, -1.9, 5.3], thigh: [13, -0.55, -0.15, 0.82], shin: [17, -0.9, -0.1, 0.42], foot: [8, -0.8, -0.2, 0.3], calcar: [13, -0.8, 0, -0.5] },
    tail: { length: 41, edge: 38 },
    ear: { at: [18.8, 4.2, 3.8], length: 10, width: 6.5, lean: [8, 42], tragus: [4.5, 2.4] },
    eye: [28.5, 78, 1],
  },
  fur: {
    back: [24, 14, 9], belly: [24, 12, 13], face: [20, 12, 6], nose: [15, 10, 6],
    ear: { outer: [20, 10, 8], inner: [15, 10, 11], edge: [15, 8, 6] },
    membrane: { top: [20, 10, 8], under: [20, 9, 10], vein: [20, 10, 6], edge: [20, 8, 13] },
    bone: [20, 10, 8], foot: [18, 14, 14], eye: [20, 20, 4],
    frost: [[40, 8, 80], 1], uro: [0.5, 1],
  },
  poses: { flight: { flap: 1, cycle: 0.25 }, roost: { hang: 1, fold: 1 }, crawl: { crawl: 1, fold: 1 } },
  // How it lives on a visit (life/families/bat.js): along the clearing's edge, over the creek and the river and over
  // the clearing, slowly, twisting and gliding; out before sunset, and now and then by day. Every number is the
  // agent's but the speed (A: 4.8 to 5.0 m/s).
  way: {
    family: 'bat', there: 0.6, gap: [90, 360],
    haunts: { edge: [2.5, 2.5, 9], creek: [1.2, 1.2, 4], river: [0.8, 1.5, 6], clearing: [0.6, 3, 9] },
    keep: 1, speed: [2.6, 4.2], fastest: 5.8, turn: 3,
    jink: [0.8, 2.5], glide: { every: [1.5, 5], time: [0.25, 0.7] }, skim: 0.4,
    bout: [120, 480], gone: 0.4,
    emerge: 0.9, dawn: 0.35, early: 0.12, avoid: 3,
    hunting: { edge: 'hunting slowly along the edge of the trees', creek: 'hunting over the creek', river: 'hunting over the river', clearing: 'hunting over the clearing' },
    turning: 'twisting round', twisting: 'twisting after an insect', catching: 'scooping an insect up in its tail',
    dipping: 'dipping low', gliding: 'gliding a moment on still wings', coming: 'flying in to hunt',
    leaving: 'flying off into the wood', homing: 'flying off to its roost under bark',
  },
};
