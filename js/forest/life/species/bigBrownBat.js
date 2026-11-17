// The Big Brown Bat, Eptesicus fuscus: the biggest bat of the valley, glossy brown with a black face, high over the
// clearing. A kind's file is all there is of it (life/species/index.js says what goes in one).
//
// What was read by this agent (2026-11-16; none of it seen as an image): the Handbook of the Mammals of the World,
// vol. 9, Bats (Wilson and Mittermeier 2019, p. 843), read as its Plazi TreatmentBank text: head-body c. 53 to 82 mm,
// tail 34 to 56, ear 10 to 20, hind foot 8 to 14, forearm 39 to 54 mm, 11 to 23 g; long, oily fur, the back pinkish
// tan to rich chocolate with shiny tips, the belly paler, pinkish to olive buff; ears short and rounded, the tragus
// broad; the face and nose wide; "Face, ears, and membranes are black and naked"; a few hairs on the base quarter of
// the tail membrane; "Flying speeds are up to 33 km/h"; flying heights from 50 m, "later descending to 10-15 m in
// forested areas, to c. 5 m over canopy-enclosed streams", over water, land, forest edges and clearings; it starts
// "leaving roosts well before sunset", busiest two to three hours after; roosts in hollow trees; males mostly alone in
// spring and summer; calls sweep from 48 to 27 kHz, beyond hearing. Animal Diversity Web, Eptesicus fuscus: forearm
// 41 to 50 mm, total length 110 to 130 mm with a tail of 38 to 50, ears 16 to 20 mm from the notch, hind foot 10 to 14,
// wingspan about 330 mm, 23 g on average, black naked parts; foraging from 20 minutes after sunset in good weather.
// Wikipedia, "Big brown bat": 15 to 26 g, wingspan 32.5 to 35 cm, tail 47 to 52 mm, fur reddish brown and glossy;
// roosts in cavities and sometimes under loose bark. The Encyclopedia of Puget Sound: "Flight is strong, direct, and
// moderately fast"; it may first circle high and then feed within 15 m of the ground; in the Pacific Northwest it
// hunts over the forest's canopy, over clearings and water and along forest edges; "In Washington, big brown bats have
// been found at nearly every location where surveys have been conducted", but on the Olympic Peninsula detections were
// "infrequent or not made". The park's list: U, uncommon. Falk, Kasnadi and Moss (2015, Journal of Experimental
// Biology): in a flight room, wingbeats of 11.2 a second on average (9 to 13), at 2.79 m/s.
// Not found, and the agent's drawing: the humerus, the thumb, the angles of the finger bones, every girth and outline,
// every pose, and every number of its way but its top speed. The sheet's numbers are millimetres.

export default {
  key: 'big-brown-bat', name: 'Big Brown Bat', latin: 'Eptesicus fuscus', seed: 493, plan: 'bat',
  census: { tier: 'rare', source: 'N U; the Encyclopedia of Puget Sound: on the Olympic Peninsula detections "infrequent or not made"; the tier is the agent\'s reading: the passage after N U was not kept in the research folder and had no second reader', clock: 'dusk' },
  size: 0.18,
  published: {
    shown: 'a Big Brown Bat, Eptesicus fuscus: glossy chocolate-brown fur, paler beneath; black face, ears and wings',
    note: 'Published: the forearm, the head and body, the tail, the wingspan, the ear (10 to 20 mm: drawn 15), the hind foot (8 to 14: drawn 11) and the mass; the glossy brown fur, paler beneath; the black, naked face, ears and membranes; the wide face; the short round ears and broad tragus; the few hairs on the base of the tail membrane; the wingbeat (F: 11.2 a second). Not found, and the agent\'s: the humerus, the leg but the foot, the thumb, the angles of the finger bones, every girth and outline, and every pose.',
    sources: {
      H: 'Handbook of the Mammals of the World, vol. 9, Bats (2019), p. 843: head-body c. 53 to 82 mm, tail 34 to 56, ear 10 to 20, hind foot 8 to 14, forearm 39 to 54 mm, 11 to 23 g; face, ears and membranes black and naked; up to 33 km/h; 10 to 15 m up over forest, 5 m over streams',
      A: 'Animal Diversity Web, Eptesicus fuscus: forearm 41 to 50 mm, total length 110 to 130 with a tail of 38 to 50, ears 16 to 20 from the notch, wingspan about 330 mm, 23 g on average',
      W: 'Wikipedia, "Big brown bat": 15 to 26 g, wingspan 32.5 to 35 cm, tail 47 to 52 mm; reddish brown, glossy fur',
      F: 'Falk, Kasnadi and Moss 2015 (Journal of Experimental Biology 218): wingbeats 11.2 a second on average (9 to 13), in a flight room at 2.79 m/s',
    },
    mass: '11 to 23 g (H); 15 to 26 g (W)',
    lengths: [
      ['forearm', 'Forearm, elbow to wrist (H: 39 to 54)', null, [41, 50], 'AH'],
      ['headBody', 'Head and body, nose to the tail\'s root', null, [53, 82], 'H'],
      ['tail', 'Tail (A: 38 to 50, W: 47 to 52)', null, [34, 56], 'H'],
      ['span', 'Wingspan, tip to tip (A: about 330)', null, [325, 350], 'WA'],
    ],
    proportions: [
      'The ears short and rounded (10 to 20 mm, H; 16 to 20 from the notch, A); the tragus broad; the face and nose wide (H)',
      'A few hairs on the base quarter of the tail membrane (H)',
      'Females slightly larger than males (H)',
    ],
  },
  card: {
    size: 'The size of a big mouse, with a wingspan of a ruler: 11 to 23 grams.',
    marks: ['Glossy chocolate-brown fur, paler beneath', 'A black, naked face, black ears and wings', 'Strong, straight, fairly fast flight, well up over the clearing and the river'],
    lives: 'Roosts by day in a hollow tree, and is often out before sunset; hunts beetles high over clearings, water and the forest\'s edge.',
  },
  flight: { rate: 11.2, note: 'Strokes a second: the average Falk, Kasnadi and Moss measured in a flight room (9 to 13).' },
  shape: {
    trunk: [[36.5, 1.7, 1.7, 2.5], [32.7, 4.1, 3.2, 5.3], [25.8, 5.8, 4.4, 6.7], [18.2, 6.1, 4.6, 5.2], [10.6, 7.3, 6.1, 7], [0, 8, 7.3, 7.8], [-12.2, 7.5, 7, 7.3], [-21.3, 6.4, 5.8, 6.1], [-30.4, 1.7, 1.7, 1.7]],
    neck: [21.3, 12.2],
    shoulder: [7.6, 1.5, 6.7],
    humerus: [31, -6, 8], forearm: [46, 21, -2],
    digits: { d2: [41.2, 20, 0], d3: [85.8, 8, -3], d4: [77.2, -10, -3], d5: [58.3, -44, -3] },
    knuckle: [0.52, 0.52],
    thumb: [6.5, 3, 60, 30],
    leg: { hip: [-18.2, -2.2, 6.1], thigh: [15, -0.55, -0.15, 0.82], shin: [19, -0.9, -0.1, 0.42], foot: [11, -0.8, -0.2, 0.3], calcar: [15, -0.8, 0, -0.5] },
    tail: { length: 45, edge: 42 },
    ear: { at: [20.5, 5.2, 4.4], length: 15, width: 8, lean: [10, 38], tragus: [6.5, 2.8] },
    eye: [31.2, 78, 1.15],
  },
  fur: {
    back: [22, 34, 22], belly: [32, 26, 42], face: [12, 14, 8], nose: [10, 12, 7],
    ear: { outer: [12, 12, 8], inner: [10, 14, 11], edge: [12, 10, 6] },
    membrane: { top: [16, 12, 8], under: [16, 10, 10], vein: [16, 12, 6], edge: [16, 10, 12] },
    bone: [16, 12, 8], foot: [14, 14, 12], eye: [20, 20, 4],
    uro: [0.25, 0.3],
  },
  poses: { flight: { flap: 1, cycle: 0.25 }, roost: { hang: 1, fold: 1 }, crawl: { crawl: 1, fold: 1 } },
  // How it lives on a visit (life/families/bat.js): in long, straight runs well up over the clearing and the river,
  // and along the edge of the trees; out before sunset, and of the valley's bats the likeliest to be seen by day.
  // Every number is the agent's but its top speed (H: 33 km/h).
  way: {
    family: 'bat', there: 0.6, gap: [90, 360],
    haunts: { clearing: [2.5, 5, 15], river: [1.5, 4, 12], edge: [1, 6, 14] },
    keep: 1, speed: [5, 8], fastest: 10, turn: 2.2,
    jink: [1.2, 4], skim: 0.6,
    bout: [150, 600], gone: 0.4,
    emerge: 0.95, dawn: 0.35, early: 0.25, avoid: 3.5,
    hunting: { clearing: 'hunting high over the clearing', river: 'hunting high over the river', edge: 'hunting along the tops of the trees at the clearing\'s edge' },
    turning: 'wheeling round', twisting: 'diving after a beetle', catching: 'scooping a beetle up in its tail',
    dipping: 'dropping low', gliding: 'gliding', coming: 'flying in to hunt',
    leaving: 'flying off over the trees', homing: 'flying off to its roost in a hollow tree',
  },
};
