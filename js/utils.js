import * as THREE from 'three';

// ============================================================================
// MATERIALS — flat-shaded low-poly, matching the faceted flamingo reference.
// No toon ramp, no inverted-hull outlines: just faceted Standard materials lit
// by a hemisphere + directional sun + a warm point light. Keep segment counts
// low so the facets read as deliberate low-poly planes.
// ============================================================================

// Primary faceted material. Use for almost everything in the room.
export function flat(color, opts = {}) {
  return new THREE.MeshStandardMaterial({
    color,
    flatShading: true,
    roughness: 0.82,
    metalness: 0.0,
    ...opts,
  });
}

// ============================================================================
// HELPERS
// ============================================================================

// Layer reserved for raycast-only pick proxies. The camera renders layer 0 only,
// so nothing on this layer is ever drawn — not by the beauty RenderPass and,
// crucially, not by the post passes (GTAOPass / BokehPass) that do a full-scene
// depth+normal prepass via `scene.overrideMaterial`. That override ignores each
// mesh's transparent/opacity/depthWrite, so an opacity:0 proxy would otherwise be
// rendered as SOLID geometry into the AO and DoF buffers — compositing back as a
// faint semi-transparent box around whatever the proxy encloses (e.g. the laptop).
// main.js enables this layer on the Raycaster so picking still works.
export const PROXY_LAYER = 1;

// Invisible pick proxy for raycasting; covers a visual region.
export function hitProxy(w, h, d, action, target, label, labelClass = '') {
  const m = new THREE.Mesh(
    new THREE.BoxGeometry(w, h, d),
    new THREE.MeshBasicMaterial({ transparent: true, opacity: 0, depthWrite: false })
  );
  m.layers.set(PROXY_LAYER);   // raycast-only: excluded from all render/post passes
  m.userData = { action, target, label, labelClass, isHit: true };
  return m;
}

// ---- clay baseline (2026-07 handoff) ---------------------------------------
// The visual reset: every surface becomes a flat matte clay tone; all texture
// maps are dropped. Material OBJECTS are mutated (not replaced) so references
// held elsewhere (lamp glow emissives, window tint) keep working. Materials
// named in `skip` or flagged `userData.__noClay` are left alone.
export const CLAY = { arch: '#b7b0a4', books: '#cbc4b6', props: '#a39c90' };

export function clayify(root, { skip = [], color = CLAY.props } = {}) {
  root.traverse((o) => {
    if (!o.isMesh) return;
    const mats = Array.isArray(o.material) ? o.material : [o.material];
    for (const m of mats) {
      if (!m || m.userData.__noClay || skip.includes(m.name)) continue;
      for (const slot of ['map', 'normalMap', 'roughnessMap', 'metalnessMap', 'aoMap']) {
        if (m[slot]) m[slot] = null;
      }
      if (m.color) m.color.set(m.name === 'baked_books' ? CLAY.books : color);
      if ('roughness' in m) m.roughness = 0.95;
      if ('metalness' in m) m.metalness = 0;
      m.needsUpdate = true;
    }
  });
}

export const lerp = (a, b, t) => a + (b - a) * t;
export const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
export const smoothstep = (e0, e1, x) => {
  const t = clamp((x - e0) / (e1 - e0), 0, 1);
  return t * t * (3 - 2 * t);
};
