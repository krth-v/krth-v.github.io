import * as THREE from 'three';

// The built bird measured the way a museum measures a skin, from the vertices of the mesh itself and not
// from the numbers it was built from: so a part laid out wrong shows here as a length that is wrong.
// Lengths are millimetres. A mark is the middle of the vertices listed for it (life/bird.js).
export function measure(built) {
  const position = built.geometry.getAttribute('position'), a = new THREE.Vector3(), b = new THREE.Vector3(), v = new THREE.Vector3();
  const mark = (name, out) => {
    const list = built.marks[name];
    if (!list) throw new Error(`the built bird has no mark called ${name}`);
    out.set(0, 0, 0);
    for (const index of list) out.add(v.fromBufferAttribute(position, index));
    return out.divideScalar(list.length);
  };
  const between = (from, to) => mark(from, a).distanceTo(mark(to, b)) * 1000;
  return {
    wing: between('wrist', 'wingTip'),             // the wing chord: the bend of the folded wing to the tip of its longest primary
    tail: between('tailBase', 'tailTip'),          // where the middle feathers are rooted to their tip
    culmen: between('culmenBase', 'billTip'),      // exposed culmen: where the feathers end on top of the bill to its tip
    tarsus: between('heel', 'toeBase'),
    midToe: between('toeBase', 'midToeTip'),       // without the claw
    length: between('billTip', 'tailTip'),         // the level pose is the bind pose: bill tip to tail tip, laid straight
    span: between('spreadTipL', 'spreadTipR'),
  };
}

// The published table of a sheet against the built bird: [{ key, what, built, mean, range, source, off }],
// `off` the share by which the built length misses the published mean (or, with no mean, the range).
export function compare(sheet, built) {
  const got = measure(built);
  return sheet.published.lengths.map(([key, what, mean, range, source]) => {
    const value = got[key];
    const off = mean !== null ? (value - mean) / mean : (value < range[0] ? (value - range[0]) / range[0] : value > range[1] ? (value - range[1]) / range[1] : 0);
    return { key, what, built: value, mean, range, source, off };
  });
}
