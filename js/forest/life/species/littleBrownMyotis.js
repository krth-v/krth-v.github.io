// The Little Brown Myotis, Myotis lucifugus: a small dark bat of the water and the clearing. A kind's file is all
// there is of it (life/species/index.js says what goes in one).
//
// What was read (2026-11-16; none of it seen as an image). By an earlier reader, kept in
// .local-assets/forest/research/beasts-herps-2026-11-16.json: Wikipedia, "Little brown bat" (forearm 36 to 40 mm,
// wingspan 22.2 to 26.9 cm, ear 11.0 to 15.5 mm, 5.5 to 12.5 g, lightest in spring; "commonly within 5 m of the
// ground", in circles and zigzags); the Encyclopedia of Puget Sound (in Washington its fur runs from yellow or olive,
// M. l. carissima, to blackish, M. l. alascensis, the race of the coast; paler beneath; longer and glossier than the
// like myotis; ears and membranes dark brown; it "typically ranks as one of the most common species" on both sides of
// the Cascades and on the Olympic Peninsula); the park's list (U, uncommon). By this agent: the Handbook of the
// Mammals of the World, vol. 9, Bats (2019), pp. 927-928, read as its Plazi TreatmentBank text: head-body c. 32 to
// 53 mm, tail 28 to 49, ear 11 to 15, hind foot 8 to 10, forearm 33.1 to 41.4 mm, 5 to 12 g; fur "long, silky, and
// glossy", the back dark brown, golden brown, reddish or olive brown with darker bases, the belly with pale yellowish
// tips; ears short, reaching halfway from the eye to the nostril; the tragus 7 to 9 mm and blunt; membranes "mummy
// brown or blackish"; the tibia short beside the hind foot; it hawks over water, in wooded places and over fields, and
// takes insects from the water's face; it comes out at dusk, busiest two to three hours after, and again before dawn;
// day roosts in trees among other places; calls at 45 kHz, sweeping from 80 to 40 kHz, beyond hearing; classed
// Endangered. A web search's summary of a USGS report on the parks of the north-west (2016 to 2024) and of the park's
// bat page: the fungus of white-nose syndrome was first found in the park in 2024 (the report itself not opened).
// Not found, and the agent's drawing: the wingbeat (12 a second, as the Yuma Myotis's), the humerus, the thumb, the
// angles of the finger bones, every girth and outline, the eye, every pose, and every number of its way. Its outline
// is the Yuma Myotis's drawn a little larger, which is what the sources have the two look like.
// The sheet's numbers are millimetres.

export default {
  key: 'little-brown-myotis', name: 'Little Brown Myotis', latin: 'Myotis lucifugus', seed: 491, plan: 'bat',
  census: { tier: 'some', source: 'N U; the Encyclopedia of Puget Sound: "typically ranks as one of the most common species" on the Olympic Peninsula', party: [1, 3], clock: 'dusk' },
  size: 0.14,
  published: {
    shown: 'a Little Brown Myotis, Myotis lucifugus, of the coast\'s dark race (alascensis): glossy dark brown, paler beneath, dark ears and wings',
    note: 'Published: the forearm, the head and body, the tail, the wingspan, the ear (11 to 15 mm: drawn 13), the tragus (7 to 9: drawn 7), the hind foot (8 to 10: drawn 9.5) and the mass; the glossy dark fur with pale yellowish tips beneath, the blackish membranes, the short ear and blunt tragus, the unkeeled calcar. Not found, and the agent\'s: the humerus, the leg but the foot, the thumb, the angles of the finger bones, every girth and outline, the wingbeat (12 a second), and every pose.',
    sources: {
      W: 'Wikipedia, "Little brown bat": forearm 36 to 40 mm, wingspan 22.2 to 26.9 cm, ear 11.0 to 15.5 mm, 5.5 to 12.5 g; commonly within 5 m of the ground, in circles and zigzags',
      H: 'Handbook of the Mammals of the World, vol. 9, Bats (2019), pp. 927-928: head-body c. 32 to 53 mm, tail 28 to 49, ear 11 to 15, hind foot 8 to 10, forearm 33.1 to 41.4 mm, 5 to 12 g; glossy fur; membranes mummy brown or blackish',
      E: 'Encyclopedia of Puget Sound: in Washington from yellow or olive to blackish (the coast\'s race); paler beneath; ears and membranes dark brown; one of the commonest bats on the Olympic Peninsula',
    },
    mass: '5 to 12 g, lightest in spring (W, H)',
    lengths: [
      ['forearm', 'Forearm, elbow to wrist (H: 33.1 to 41.4)', null, [36, 40], 'WH'],
      ['headBody', 'Head and body, nose to the tail\'s root', null, [32, 53], 'H'],
      ['tail', 'Tail', null, [28, 49], 'H'],
      ['span', 'Wingspan, tip to tip', null, [222, 269], 'W'],
    ],
    proportions: [
      'The ear short (11 to 15 mm), reaching halfway from the eye to the nostril; the tragus 7 to 9 mm, blunt (H)',
      'The hind foot large, over half the tibia (E, H)',
      'Looks like the Yuma Myotis, a little larger and glossier: the forearm and the like are no sure way to tell them apart (WDFW, as E has it)',
    ],
  },
  card: {
    size: 'A little bigger than a thumb, with a wingspan of a hand and a half: 5 to 12 grams.',
    marks: ['Glossy dark brown fur, paler and yellowish below', 'Blackish wings and ears', 'Hawks in circles and zigzags over water and the clearing, within a few metres of the ground'],
    lives: 'Roosts by day in a tree or a building and comes out at dusk; most active two or three hours after, and again before dawn. Endangered: the fungus that brings white-nose syndrome to hibernating bats was first found in the park in 2024.',
  },
  flight: { rate: 12, note: 'Strokes a second. No rate of a Little Brown Myotis was found; it is the Yuma Myotis\'s, from a smaller myotis (10 to 15) and a larger (7).' },
  shape: {
    trunk: [[25.1, 1.3, 1.3, 1.7], [22.5, 3.3, 2.4, 3.5], [17.8, 4.6, 3.3, 4.4], [12.5, 4.6, 3.5, 4], [7.3, 5.5, 4.6, 5.3], [0, 6.1, 5.5, 5.9], [-8.4, 5.7, 5.3, 5.5], [-14.6, 4.8, 4.4, 4.6], [-20.9, 1.3, 1.3, 1.3]],
    neck: [14.6, 8.4],
    shoulder: [5.2, 1.1, 5.1],
    humerus: [23, -12, 8], forearm: [38, 27, -2],
    digits: { d2: [31, 20, 0], d3: [64.5, 8, -3], d4: [58.9, -10, -3], d5: [41.3, -42, -3] },
    knuckle: [0.52, 0.52],
    thumb: [4.5, 2.2, 60, 30],
    leg: { hip: [-12.5, -1.6, 4.6], thigh: [10.5, -0.55, -0.15, 0.82], shin: [15.5, -0.9, -0.1, 0.42], foot: [9.5, -0.8, -0.2, 0.3], calcar: [10, -0.8, 0, -0.5] },
    tail: { length: 38, edge: 35 },
    ear: { at: [14.1, 4.2, 3.3], length: 13, width: 3.4, lean: [18, 30], tragus: [7, 1.6] },
    eye: [21.4, 78, 0.85],
  },
  fur: {
    back: [24, 32, 17], belly: [40, 30, 44], face: [20, 28, 11], nose: [10, 20, 9],
    ear: { outer: [22, 18, 13], inner: [18, 22, 18], edge: [20, 18, 10] },
    membrane: { top: [22, 16, 12], under: [24, 14, 16], vein: [20, 20, 8], edge: [24, 12, 20] },
    bone: [22, 18, 11], foot: [18, 24, 28], eye: [20, 20, 5],
  },
  poses: { flight: { flap: 1, cycle: 0.25 }, roost: { hang: 1, fold: 1 }, crawl: { crawl: 1, fold: 1 } },
  // How it lives on a visit (life/families/bat.js): in circles and zigzags over the river, the creek and the clearing,
  // or along the clearing's edge, a few metres up; out at dusk. Every number is the agent's.
  way: {
    family: 'bat', there: 0.65, gap: [60, 300],
    haunts: { river: [1.5, 0.5, 4], creek: [0.8, 0.5, 3], clearing: [1.5, 1.2, 5], edge: [0.8, 1.5, 5] },
    keep: 1.3, speed: [3, 4.5], fastest: 6, turn: 4,
    jink: [0.5, 1.8], dip: [4, 12], skim: 0.1,
    bout: [120, 500], gone: 0.35,
    emerge: 0.5, dawn: 0.25, early: 0.03, avoid: 2.5,
    hunting: { river: 'hawking insects over the river, in circles and zigzags', creek: 'hawking insects over the creek', clearing: 'hawking insects low over the clearing', edge: 'hunting along the edge of the trees' },
    turning: 'wheeling round', twisting: 'twisting after an insect', catching: 'scooping an insect up in its tail',
    dipping: 'dipping to take an insect from the water', gliding: 'gliding', coming: 'flying in to hunt',
    leaving: 'flying off into the wood', homing: 'flying off to its roost',
  },
};
