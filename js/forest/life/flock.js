import * as THREE from 'three';
import { BONES } from './bird.js';
import { createBird } from './rig.js';

// One kind of animal drawn as one mesh a detail level, however many of it are about. A skinned mesh is a
// draw call to itself, and a view may hold few of those (budget.js); a flock of small birds overhead would
// have spent the forest's whole allowance. So each animal's bones are a row of one texture, written every
// frame, and a level's instances each say which row is theirs. The bones' matrices already hold where the
// animal stands in the world: a vertex is carried straight there, and the meshes themselves stay at the
// world's origin.
//
// One skeleton poses every animal of the kind, one after another: a pose names everything it sets
// (life/rig.js), so the skeleton keeps nothing of the animal before. A bird's bones and rig are the default; a big
// animal that walks gives its own (life/beast.js, life/beastRig.js).
export function createFlock(kind, makeMaterial, most = 48, { bones = BONES, puppet: make = createBird } = {}) {
  const puppet = make(kind);
  const N = bones.length, data = new Float32Array(most * N * 16);
  const texture = new THREE.DataTexture(data, N * 4, most, THREE.RGBAFormat, THREE.FloatType);
  texture.needsUpdate = true;
  const material = makeMaterial(texture);
  const levels = kind.levels.map((level) => {
    const geometry = new THREE.InstancedBufferGeometry();
    geometry.setIndex(level.geometry.index);
    for (const [name, attribute] of Object.entries(level.geometry.attributes)) geometry.setAttribute(name, attribute);
    const rows = new THREE.InstancedBufferAttribute(new Float32Array(most), 1);
    rows.setUsage(THREE.DynamicDrawUsage);
    geometry.setAttribute('aRow', rows);
    geometry.instanceCount = 0;
    const mesh = new THREE.Mesh(geometry, material);
    mesh.frustumCulled = false; mesh.matrixAutoUpdate = false; mesh.visible = false;
    return { mesh, rows, count: 0 };
  });
  let used = 0;
  return {
    meshes: levels.map((level) => level.mesh), material, texture,
    begin() { used = 0; for (const level of levels) level.count = 0; },
    // one animal at a detail level: where its feet grip, how it is turned, how it holds itself. False if the
    // texture has no row left for it.
    add(at, q, pose, level) {
      if (used >= most) return false;
      puppet.group.position.copy(at); puppet.group.quaternion.copy(q);
      puppet.pose(pose);
      puppet.group.updateMatrixWorld(true);
      puppet.skeleton.update();
      data.set(puppet.skeleton.boneMatrices, used * N * 16);
      const into = levels[level];
      into.rows.array[into.count] = used;
      into.count += 1; used += 1;
      return true;
    },
    end() {
      if (used) texture.needsUpdate = true;
      for (const level of levels) {
        level.mesh.geometry.instanceCount = level.count;
        level.mesh.visible = level.count > 0;
        if (level.count) level.rows.needsUpdate = true;
      }
    },
    dispose() { texture.dispose(); material.dispose(); puppet.skeleton.dispose(); for (const level of levels) level.mesh.geometry.dispose(); },
  };
}
