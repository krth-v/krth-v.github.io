// The Rufous Hummingbird's two sounds that are not its voice, made in the page (sound/index.js plays each when the bird
// says it: life/families/hoverer.js). Each maker is given the audio context, the node to play into (`out`: its level
// already set, and the air and the side after it), when to begin, how loud, and what was said; it returns how long it
// plays, in seconds.
//
// What is from sources (the research file and the papers the species' sheet names, read through text): the hum is the
// wingbeat's own rate, 35 to 100 Hz, 52 a second hovering (Birds of the World, Healy and Calder 2020, after Hunter and
// Picman 2005 and Chai and Millard 1997); the adult male's narrow outer primaries make "a high wing trill (8-10 kHz)" and
// a "loud whining or cicada-like wing sound" (the same, and BirdWeb); the dive's sound is made by his second tail
// feather, its fundamental 0.7 to 0.8 kHz, buzzier than the Allen's pure tone (Myers, Rankin, Burns and Clark 2019,
// after Clark 2014), and it ends in "chirrups", "short, loud pulses of wing trill" made while he flips his tail
// ("writhing", the same; "chu-chu-chu at the bottom of the J-dive", Healy and Calder 2020). The agent's own, from no
// source and from no recording (none was heard): every length, every level, the buzz's rate, the fall of the note as
// the bird goes by, and the number of chirrups.

const hisses = new WeakMap();
// a second of white noise, made once for an audio context
function hissOf(ctx) {
  if (hisses.has(ctx)) return hisses.get(ctx);
  const n = ctx.sampleRate, buffer = ctx.createBuffer(1, n, ctx.sampleRate), data = buffer.getChannelData(0);
  let a = 987654321;
  for (let i = 0; i < n; i += 1) { a = (Math.imul(a, 1664525) + 1013904223) >>> 0; data[i] = a / 2147483648 - 1; }
  hisses.set(ctx, buffer);
  return buffer;
}
// a gain that rises from nothing to `peak` over `rise` seconds from `t0`, holds, and falls to nothing over `fall` by `t1`
function envelope(ctx, t0, t1, peak, rise, fall) {
  const g = ctx.createGain();
  g.gain.setValueAtTime(0, t0);
  g.gain.linearRampToValueAtTime(peak, t0 + rise);
  g.gain.setValueAtTime(peak, Math.max(t0 + rise, t1 - fall));
  g.gain.linearRampToValueAtTime(0, t1);
  return g;
}

export const HUMMINGBIRD = {
  // The hum of its wings, near by: the beat's own low note and its overtones (which carry it on a small speaker), and
  // over it the male's high trill, beating with the wings. `event.hold`: how long it is heard (it is said again before
  // that is over, while the walker is near).
  'hummingbird-hum'(ctx, out, now, level, event) {
    const length = Math.min(2, Math.max(0.4, event.hold || 1)), end = now + length, rate = 50 + Math.random() * 6;
    const body = envelope(ctx, now, end, 1, 0.12, 0.2);
    body.connect(out);
    // the beat: a sawtooth at the wingbeat's rate, its overtones kept below 0.9 kHz
    const beat = ctx.createOscillator(), low = ctx.createBiquadFilter(), deep = ctx.createGain();
    beat.type = 'sawtooth'; beat.frequency.value = rate;
    low.type = 'lowpass'; low.frequency.value = 900; low.Q.value = 0.8;
    deep.gain.value = 0.75;
    beat.connect(low); low.connect(deep); deep.connect(body);
    // the trill: noise in a narrow band near 9 kHz, swelling and falling with each beat
    const noise = ctx.createBufferSource(), band = ctx.createBiquadFilter(), trill = ctx.createGain(), lfo = ctx.createOscillator(), depth = ctx.createGain();
    noise.buffer = hissOf(ctx); noise.loop = true;
    band.type = 'bandpass'; band.frequency.value = 8600 + Math.random() * 900; band.Q.value = 3;
    trill.gain.value = 0.3; lfo.frequency.value = rate; depth.gain.value = 0.3;
    lfo.connect(depth); depth.connect(trill.gain);
    noise.connect(band); band.connect(trill); trill.connect(body);
    out.gain.value = level;
    beat.start(now); lfo.start(now); noise.start(now, Math.random() * 0.9);
    for (const source of [beat, noise, lfo]) source.stop(end + 0.05);
    return length;
  },
  // The dive's note: a buzzing tone near 0.75 kHz, a third of a second long, falling a little as the bird goes by at
  // the bottom of the J; then three chirrups of the wing trill as it pulls out, flicking its tail.
  'hummingbird-dive'(ctx, out, now, level) {
    const buzz = 0.34, end = now + buzz;
    out.gain.value = level;
    const note = envelope(ctx, now, end, 1, 0.05, 0.08);
    note.connect(out);
    const tone = ctx.createOscillator(), shape = ctx.createBiquadFilter(), flutter = ctx.createGain(), lfo = ctx.createOscillator(), depth = ctx.createGain();
    tone.type = 'sawtooth';
    tone.frequency.setValueAtTime(800, now); tone.frequency.linearRampToValueAtTime(705, end);
    // the buzz: the note fluttering about seventy times a second
    flutter.gain.value = 0.55; lfo.frequency.value = 68; depth.gain.value = 0.45;
    lfo.connect(depth); depth.connect(flutter.gain);
    shape.type = 'bandpass'; shape.frequency.value = 1600; shape.Q.value = 0.5;
    tone.connect(flutter); flutter.connect(shape); shape.connect(note);
    tone.start(now); tone.stop(end + 0.05); lfo.start(now); lfo.stop(end + 0.05);
    // the chirrups
    let last = end;
    for (let k = 0; k < 3; k += 1) {
      const t0 = end + 0.1 + k * 0.11, t1 = t0 + 0.05, noise = ctx.createBufferSource(), band = ctx.createBiquadFilter(), g = envelope(ctx, t0, t1, 0.8, 0.008, 0.03);
      noise.buffer = hissOf(ctx);
      band.type = 'bandpass'; band.frequency.value = 8400; band.Q.value = 2.2;
      noise.connect(band); band.connect(g); g.connect(out);
      noise.start(t0, Math.random() * 0.9); noise.stop(t1 + 0.02);
      last = t1;
    }
    return last - now + 0.05;
  },
};
