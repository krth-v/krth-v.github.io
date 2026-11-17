// The Yuma Myotis, Myotis yumanensis: the bat of the river. A kind's file is all there is of it (life/species/index.js
// says what goes in one). Until 2026-11-16 this file was `bats.js`, the kind `bats`, a Yuma Myotis standing for the
// three small myotis of the valley; the Little Brown Myotis is a kind of its own now (littleBrownMyotis.js), and the
// California Myotis, uncommon in the park, is not built.
//
// What was read (2026-11-16; none of it seen as an image). By an earlier reader, kept in
// .local-assets/forest/research/beasts-herps-2026-11-16.json: Animal Diversity Web, Myotis yumanensis (forearm 33 to
// 37 mm, mass 5 to 7 g, wingspan about 235 mm, tail 32 to 45 mm; its "body 84 to 99 mm" is likely a total length, and
// is not used); Wikipedia, "Yuma myotis" (head-body 39 to 48 mm, tail 27 to 40 mm, wingspan 24 cm on average, about
// 6 g, a wing aspect ratio of about 6.45, a top speed of 14 km/h); the Washington Department of Fish and Wildlife (the
// race of the west has dark brown to chestnut fur, paler beneath, and dark ears and wings; ears short, reaching the
// nostrils pressed forward; the tragus about half the ear and blunt; the calcar not keeled; one of the commoner bats
// at some sites of the Olympic Peninsula); and the park's mammal list (Yuma Myotis: C, the only bat it calls common).
// By this agent: the Handbook of the Mammals of the World, vol. 9, Bats (Wilson and Mittermeier 2019, p. 938, read as
// its Plazi TreatmentBank text): head-body c. 48 to 49 mm (as the scan reads), tail 27 to 40, ear 11 to 15, hind foot
// 6 to 9, forearm 32 to 37.9 mm, 4 to 7 g; fur short and woolly, dark brown in the north-west; the calcar straight,
// unkeeled; "exclusively associated with open water"; it feeds "just a few inches above the surface of water,
// repeatedly flying regular routes", up and down streams "in relatively straight patterns" and in circles over ponds,
// and takes prey from the water's face with its feet and tail membrane; activity starts "a few minutes before sunset"
// and peaks within two hours; it roosts in hollow trees, under loose bark and in cracks in dead trees, often in a
// different place each night; its calls sweep from 59 to 72 kHz down to 45 to 50 kHz, beyond hearing.
// For the wingbeat, Siemers and others on a smaller myotis (10 to 15 Hz in search flight, read through a search
// summary): no rate of a Yuma Myotis was found, and the 12 a second here is the agent's.
// Not found, and the agent's drawing: the ear's width, the hind leg, the thumb, the humerus, the angles of the finger
// bones, the body's girths and every outline, the eye, the membrane's veins, every pose, and every number of its way.
// The sheet's numbers are millimetres.

const FUR = [24, 38, 21], BELLY = [34, 30, 47];
export default {
  key: 'yuma-myotis', name: 'Yuma Myotis', latin: 'Myotis yumanensis', seed: 349, plan: 'bat',
  census: { tier: 'most', source: 'N C, the park\'s only common bat; WDFW: one of the commoner at some sites of the Olympic Peninsula; over open water; the tier is the agent\'s reading: the second reader gave the bats one tier together (some visits) and did not open WDFW', party: [1, 4], clock: 'dusk' },
  // (how long it is to the eye: its span is most of what is seen of a bat in flight)
  size: 0.13,
  published: {
    shown: 'a Yuma Myotis, Myotis yumanensis, of western Washington: dark brown fur, dark ears and wings',
    note: 'Published: the forearm, the head and body, the tail, the wingspan, the ear (11 to 15 mm: drawn 12), the hind foot (6 to 9: drawn 8) and the mass; the dark brown to chestnut fur paler beneath, dark ears and wings, the short ear and the blunt tragus, the straight unkeeled calcar, the free thumb and the roost posture. Not found, and the agent\'s: the ear\'s width, the leg, the thumb, the humerus, the angles of the finger bones, every girth and outline, the wingbeat (12 a second, from a smaller myotis\'s 10 to 15), and every pose.',
    sources: {
      A: 'Animal Diversity Web, Myotis yumanensis: forearm 33 to 37 mm, mass 5 to 7 g, wingspan about 235 mm, tail 32 to 45 mm',
      W: 'Wikipedia, "Yuma myotis": head-body 3.9 to 4.8 cm, tail 2.7 to 4.0 cm, wingspan 24 cm on average, about 6 g, wing aspect ratio about 6.45, up to 14 km/h',
      D: 'Washington Department of Fish and Wildlife, Yuma myotis: dark brown to chestnut fur, paler beneath, dark ears and wings (the race of western Washington); the ear short, reaching the nostrils pressed forward; the tragus about half the ear, blunt; the calcar not keeled',
      H: 'Handbook of the Mammals of the World, vol. 9, Bats (2019), p. 938: head-body c. 48 to 49 mm, tail 27 to 40, ear 11 to 15, hind foot 6 to 9, forearm 32 to 37.9 mm, 4 to 7 g; over open water, a few inches above it; roosts in hollow trees, under loose bark',
      S: 'Siemers et al. and others: wingbeat of 10 to 15 Hz in the search flight of Myotis nigricans (read through a search summary, not the papers)',
    },
    mass: 'About 6 g (5 to 7 g: A, W; 4 to 7 g: H)',
    // [key, label, mean, [least, most], source]: what the built bat is measured against (life/bat.js), in millimetres
    lengths: [
      ['forearm', 'Forearm, elbow to wrist (H: 32 to 37.9)', null, [33, 37], 'AH'],
      ['headBody', 'Head and body, nose to the tail\'s root', null, [39, 48], 'W'],
      ['tail', 'Tail (A: 32 to 45, W: 27 to 40, H: 27 to 40)', null, [27, 45], 'AWH'],
      ['span', 'Wingspan, tip to tip (A: about 235, W: 240)', 237.5, [235, 240], 'AW'],
    ],
    proportions: [
      'Small; the ear short (11 to 15 mm, H) and the tragus blunt, half the ear; the calcar straight and not keeled (D, H)',
      'Wing aspect ratio about 6.45 (W). The built wing\'s, its span squared over its area through its joints with the body and the tail\'s membrane in, is about 5.8: no finger\'s length was found to draw a narrower wing from, and it is left',
      'The tail\'s tip only just passes the edge of the membrane (D, W)',
      'Not found: the humerus (drawn 21 mm), the thumb (4 and a 2 mm claw)',
    ],
  },
  card: {
    size: 'About the length of a thumb, with a wingspan of a hand: 6 grams.',
    marks: ['Dark brown fur, paler below; dark ears and wings', 'A short ear with a blunt tragus', 'Flies low over the river, a few inches over the water, up and down its reach'],
    lives: 'Roosts by day in a hollow tree or under loose bark, often in a different one each night, and comes out a little before sunset to hunt over open water.',
  },
  // the wingbeat: strokes a second in the search flight (the agent's, from 10 to 15 Hz in a smaller myotis)
  flight: { rate: 12, note: 'Strokes a second. No rate of a Yuma myotis was found; this is from a smaller myotis (10 to 15) and a larger (7).' },
  shape: {
    trunk: [[24, 1.2, 1.2, 1.5], [21.5, 3.0, 2.2, 3.2], [17, 4.2, 3.0, 4.0], [12, 4.2, 3.2, 3.6], [7, 5.0, 4.2, 4.8], [0, 5.5, 5.0, 5.4], [-8, 5.2, 4.8, 5.0], [-14, 4.4, 4.0, 4.2], [-20, 1.2, 1.2, 1.2]],
    neck: [14, 8],
    shoulder: [5, 1, 4.6],
    humerus: [21, -12, 8], forearm: [35, 27, -2],
    digits: { d2: [30, 20, 0], d3: [62.4, 8, -3], d4: [57, -10, -3], d5: [40, -42, -3] },
    knuckle: [0.52, 0.52],
    thumb: [4, 2, 60, 30],
    leg: { hip: [-12, -1.5, 4.2], thigh: [10, -0.55, -0.15, 0.82], shin: [16, -0.9, -0.1, 0.42], foot: [8, -0.8, -0.2, 0.3], calcar: [9, -0.8, 0, -0.5] },
    tail: { length: 36, edge: 33 },
    ear: { at: [13.5, 3.8, 3.0], length: 12, width: 3.2, lean: [18, 30], tragus: [6, 1.4] },
    eye: [20.5, 78, 0.8],
  },
  fur: {
    back: FUR, belly: BELLY, face: [22, 34, 13], nose: [10, 20, 10],
    ear: { outer: [24, 25, 16], inner: [20, 30, 24], edge: [22, 22, 11] },
    membrane: { top: [26, 22, 16], under: [27, 20, 21], vein: [22, 26, 10], edge: [28, 16, 28] },
    bone: [24, 22, 13], foot: [18, 30, 36], eye: [20, 20, 5],
  },
  poses: { flight: { flap: 1, cycle: 0.25 }, roost: { hang: 1, fold: 1 }, crawl: { crawl: 1, fold: 1 } },
  // How it lives on a visit (life/families/bat.js): up and down a reach of the river a hand or two over the water,
  // or the creek, dipping to its face; out a little before sunset. Every number is the agent's but the speed (W: up
  // to 14 km/h).
  way: {
    family: 'bat', there: 0.7, gap: [60, 240],
    haunts: { river: [3, 0.12, 1.4], creek: [1.2, 0.3, 1.6] },
    keep: 2.2, speed: [2.8, 3.9], fastest: 5.5, turn: 3.6,
    jink: [0.7, 2.4], dip: [1.5, 6], skim: 0.07,
    bout: [150, 600], gone: 0.3,
    emerge: 0.72, dawn: 0.3, early: 0.04, avoid: 2.5,
    hunting: { river: 'skimming the river for insects, a hand over the water', creek: 'flying low up and down the creek after insects' },
    turning: 'turning back along its reach', twisting: 'twisting after an insect', catching: 'scooping an insect up in its tail',
    dipping: 'dipping to take an insect from the water\'s face', gliding: 'gliding', coming: 'flying in to hunt over the water',
    leaving: 'flying off into the wood', homing: 'flying off to its roost',
  },
};
