import { KINDS } from '../life/species/index.js';

// Which of the animals' voices can be heard, and whose recordings they are: each kind's are in its own file
// (`voices`, life/species/index.js), and gathered here.
//
// A recording is used only where one was found whose licence is clear: in the public domain, or under a
// Creative Commons licence that asks for nothing but credit. Each was read from its source's own page by the
// agent (2026-11-16), cut to one call or one song, band-limited to the bird's own voice, levelled, and encoded
// again; nothing else was done to it. What was not found stays silent (SILENT).
//
// The recordings (31 files, 1.1 MB) are in the repository since 2026-11-19, once the owner had walked the forest
// with them and published it: assets/forest/sound/. A page that serves the forest serves that folder beside it.
export const BASE = 'assets/forest/sound/';

// every voice of every kind, as `${kind}/${what it said}` (life/agents.js: world.say)
const VOICES = KINDS.flatMap((kind) => Object.entries(kind.voices || {}).map(([what, voice]) => [`${kind.key}/${what}`, voice]));
// played as recordings: the file, how loud, how near is full strength
export const RECORDINGS = Object.fromEntries(VOICES.filter(([, voice]) => voice.file).map(([id, { credit, ...voice }]) => [id, voice]));
// made in the page, and not recordings
export const SYNTHS = Object.fromEntries(VOICES.filter(([, voice]) => voice.synth));
// silent, because no recording with a clear licence was found
export const SILENT = VOICES.filter(([, voice]) => voice.silent).map(([id]) => id);
// whose each recording is. `bytes`: the file as it was downloaded; `kept`: the seconds of it that are used.
export const CREDITS = VOICES.filter(([, voice]) => voice.file).map(([, voice]) => ({ file: voice.file, ...voice.credit }));
