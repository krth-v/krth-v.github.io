// The grouse's voices, made in the page (the grouse's, 2026-11-16): sound/index.js plays a voice whose `synth` is
// named here by calling its maker, `(ctx, out, now, level, voice, event) => seconds`: it lays its sound into `out`
// (a gain node, through the wood's dulling and the walker's side to the whole) from the time `now`, at `level`, and
// says how long it lasts. Every level, filter and envelope here is the agent's own, and no one has heard them: what
// was checked is each rendered alone through an OfflineAudioContext, by number (2026-11-16, at level 1): the drum
// sounds for 7.5 s, peak 0.67, and 40 beats are found in its envelope (of the 42 laid: in the roll some run together),
// the first gaps 0.88, 0.77, 0.66, 0.56 and 0.49 s; the flush sounds for 1.5 s, peak 1.05, beating every 55 to 60 ms;
// the hoot sounds for 2.7 s in five bursts. Nothing here imports anything.
//
//   grouse        the Ruffed Grouse's drum. Each beat is a thump of a low tone (`voice.pitch`, Hz) with its second and
//                 third harmonics and a puff of low noise, and a weaker thump 85 ms after it. Timed by the agent from
//                 the file "Yellowstone sound library - Ruffed Grouse - 001" (the National Park Service's Yellowstone
//                 sound library; the copy the voices agent downloaded for this round, not kept or played here): in it,
//                 seventeen beats over 5.7 s, their gaps shortening from 0.89 s by about a seventh each, then a roll
//                 of beats 60 to 70 ms apart for about 1.8 s that dies away; its energy is under 150 Hz, most at 50 to
//                 60 Hz, and each beat has an after-thump 80 to 90 ms later at about a fifth of its strength. The beats
//                 here follow the same law as the drummer's wings (life/families/fowl.js).
//   grouse-flush  the roar of wings as a grouse bursts up: noise through a band of the middle and high frequencies,
//                 beating at the wingbeat (18 a second), loud at once and dying away over a second and a half, over a
//                 low thrum. From no recording: the agent's.
//   grouse-hoot   the Sooty Grouse's hooting: five deep hoots, the first and the last of two syllables (Mount Rainier
//                 Nature Notes, of the hooting heard there), about 2.7 s in all. Its pitch (`voice.pitch`, Hz) is the
//                 agent's guess, from no measurement; the hoot is a soft-edged tone with a few harmonics, so that a
//                 laptop's speaker, which gives nothing under about a hundred hertz, still carries it.
const clamp = (v, a, b) => Math.min(b, Math.max(a, v));
const smooth = (a, b, v) => { const t = clamp((v - a) / (b - a), 0, 1); return t * t * (3 - 2 * t); };

// the drum's beats, seconds from its first: as life/families/fowl.js `drumBeats`
const drumBeats = () => {
  const beats = [];
  let t = 0, gap = 0.89;
  while (gap > 0.14) { beats.push(t); t += gap; gap *= 0.86; }
  for (let k = 0; k < 4; k += 1) { beats.push(t); t += gap; gap = Math.max(0.065, gap * 0.8); }
  for (const end = t + 1.6; t < end; t += 0.065) beats.push(t);
  return beats;
};
const BEATS = drumBeats();

const made = new WeakMap();                          // what is made once for each audio context
const cached = (ctx, name, build) => {
  if (!made.has(ctx)) made.set(ctx, {});
  const own = made.get(ctx);
  if (!own[name]) own[name] = build();
  return own[name];
};
// seconds of noise, the same on every load
const noiseOf = (ctx) => cached(ctx, 'noise', () => {
  const buffer = ctx.createBuffer(1, Math.floor(ctx.sampleRate * 2), ctx.sampleRate), data = buffer.getChannelData(0);
  let a = 421;
  for (let i = 0; i < data.length; i += 1) { a = (Math.imul(a, 1664525) + 1013904223) >>> 0; data[i] = a / 2147483648 - 1; }
  return buffer;
});
// one beat of the drum, made once at each pitch
const thumpOf = (ctx, pitch) => cached(ctx, `thump${pitch}`, () => {
  const rate = ctx.sampleRate, n = Math.floor(rate * 0.26), buffer = ctx.createBuffer(1, n, rate), data = buffer.getChannelData(0);
  let a = 9001, low = 0, phase = 0;
  for (let i = 0; i < n; i += 1) {
    const t = i / rate;
    // (a thump and its after-thump: each falls a little in pitch as it goes)
    const one = (s, gain) => {
      if (s < 0) return 0;
      const env = Math.min(1, s / 0.004) * Math.exp(-s / 0.035);
      return gain * env;
    };
    const e0 = one(t, 1), e1 = one(t - 0.085, 0.22);
    phase += (2 * Math.PI * pitch * (1 + 0.25 * Math.exp(-t / 0.02))) / rate;
    a = (Math.imul(a, 1664525) + 1013904223) >>> 0;
    low += ((a / 2147483648 - 1) - low) * 0.06;     // noise, low-passed to a few hundred hertz
    data[i] = (e0 + e1) * (0.62 * Math.sin(phase) + 0.3 * Math.sin(2 * phase + 0.4) + 0.14 * Math.sin(3 * phase + 1.1) + 1.4 * low * Math.exp(-t / 0.012));
  }
  return buffer;
});

function drum(ctx, out, now, level, voice) {
  const buffer = thumpOf(ctx, voice.pitch || 54), last = BEATS[BEATS.length - 1];
  out.gain.value = level;
  BEATS.forEach((t, k) => {
    const source = ctx.createBufferSource(), g = ctx.createGain();
    // louder over the first beats, steady, and dying away over the roll's last second
    g.gain.value = Math.min(1, 0.5 + k * 0.07) * (1 - 0.85 * smooth(last - 1.0, last, t)) * (0.9 + 0.1 * Math.sin(k * 2.7));
    source.buffer = buffer; source.connect(g); g.connect(out); source.start(now + t);
  });
  return last + 0.3;
}

function flush(ctx, out, now, level) {
  const length = 1.5, noise = ctx.createBufferSource(), band = ctx.createBiquadFilter(), beat = ctx.createGain(), lfo = ctx.createOscillator(), depth = ctx.createGain();
  noise.buffer = noiseOf(ctx); noise.loop = true;
  band.type = 'bandpass'; band.frequency.value = 1300; band.Q.value = 0.55;
  // the wingbeats: the band's loudness beating 18 times a second, between a third and all of it
  beat.gain.value = 0.66; lfo.frequency.value = 18; depth.gain.value = 0.34;
  lfo.connect(depth); depth.connect(beat.gain);
  noise.connect(band); band.connect(beat); beat.connect(out);
  // under it a low thrum
  const thrum = ctx.createBufferSource(), deep = ctx.createBiquadFilter(), thrumGain = ctx.createGain();
  thrum.buffer = noiseOf(ctx); thrum.loop = true;
  deep.type = 'lowpass'; deep.frequency.value = 180; deep.Q.value = 0.7; thrumGain.gain.value = 1.6;
  thrum.connect(deep); deep.connect(thrumGain); thrumGain.connect(beat);
  out.gain.setValueAtTime(0, now); out.gain.linearRampToValueAtTime(level, now + 0.03);
  out.gain.setValueAtTime(level, now + 0.35); out.gain.exponentialRampToValueAtTime(Math.max(1e-4, level * 0.02), now + length);
  for (const node of [noise, lfo, thrum]) { node.start(now, node === lfo ? undefined : Math.random()); node.stop(now + length + 0.05); }
  return length;
}

function hoot(ctx, out, now, level, voice) {
  const pitch = voice.pitch || 96, wave = cached(ctx, 'hoot', () => ctx.createPeriodicWave(new Float32Array([0, 0, 0, 0, 0]), new Float32Array([0, 1, 0.5, 0.22, 0.08])));
  // five hoots: [start, length, syllables]
  const notes = [[0, 0.46, 2], [0.66, 0.32, 1], [1.18, 0.32, 1], [1.7, 0.32, 1], [2.22, 0.46, 2]];
  out.gain.value = level;
  for (const [start, length, syllables] of notes) {
    const osc = ctx.createOscillator(), g = ctx.createGain(), t0 = now + start;
    osc.setPeriodicWave(wave);
    osc.frequency.setValueAtTime(pitch * 0.97, t0); osc.frequency.linearRampToValueAtTime(pitch * 1.03, t0 + length * 0.4); osc.frequency.linearRampToValueAtTime(pitch * 0.95, t0 + length);
    g.gain.setValueAtTime(0, t0);
    if (syllables === 2) {
      g.gain.linearRampToValueAtTime(0.7, t0 + 0.06); g.gain.linearRampToValueAtTime(0.25, t0 + 0.2);
      g.gain.linearRampToValueAtTime(1, t0 + 0.27); g.gain.linearRampToValueAtTime(0, t0 + length);
    } else {
      g.gain.linearRampToValueAtTime(1, t0 + 0.07); g.gain.setValueAtTime(1, t0 + length - 0.12); g.gain.linearRampToValueAtTime(0, t0 + length);
    }
    osc.connect(g); g.connect(out); osc.start(t0); osc.stop(t0 + length + 0.02);
  }
  return 2.75;
}

export const MADE = { grouse: drum, 'grouse-flush': flush, 'grouse-hoot': hoot };
