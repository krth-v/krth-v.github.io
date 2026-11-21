import * as THREE from 'three';
import { GLTFLoader } from 'three/addons/loaders/GLTFLoader.js';
import { toCreasedNormals } from 'three/addons/utils/BufferGeometryUtils.js';
import { RectAreaLightUniformsLib } from 'three/addons/lights/RectAreaLightUniformsLib.js';
import { hitProxy, clayify } from './utils.js';

// RectAreaLight needs its BRDF lookup textures initialised once before any such
// light is added. Guarded so re-entry (HMR / multiple desks) is a no-op.
let _rectUniformsReady = false;
function ensureRectAreaUniforms() {
  if (_rectUniformsReady) return;
  RectAreaLightUniformsLib.init();
  _rectUniformsReady = true;
}

// ============================================================================
// DESK OBJECTS
// The desk surface currently holds only the lamp. The macbook, mug, résumé
// stack, scratch pad, phone, and binoculars were removed at the user's
// request (along with their click proxies) to leave a bare desk. Note this
// also removes the desk's only entry point into birding mode (the binoculars'
// 'window' action) and the résumé/links hotspots — reintroduce those proxies
// here if/when those objects come back.
// ============================================================================

// -------------------------------------------------------- Desk lamp (GLB) ----
// The procedural chain-lamp was replaced by a Blender-modeled lamp that matches
// the reference photo: light-wood top cap, black bell shade, articulated arm
// with a knuckle joint + adjustment knob, and a black pen-cup base holding a
// cluster of mixed pens/pencils. Modeled in assets/lamp.glb.
//
// Tuning knobs (the GLB is authored base-down, head cantilevered toward +Z,
// origin at the base centre on the floor plane y=0):
const LAMP_SCALE = 2.10;          // GLB is ~0.65 tall in metres. Iter 19 raised
                                  // it +8% for a broader, flatter pool; iter 20
                                  // goes taller again per feedback ("make the
                                  // lamp taller").
// Iter 20: nod the whole head assembly (shade/inner/cap/neck) downward around
// the Joint_Head knuckle so the lamp visibly faces the desk more steeply. The
// GLB exports these as flat root siblings, so buildLamp reparents them into a
// runtime pivot at the joint's centre; the bulb + SpotLight live in the lamp
// head subtree and inherit the nod, keeping beam and bell aligned.
const HEAD_PITCH = 0.03;          // rad; the head cantilevers toward model −z,
                                  // so negative x-rotation nods the bell down.
                                  // Iter 21: the beam aims AT the paper, which
                                  // sits close — a 52° depression instead of
                                  // iter 20's 66° plunge into the desk's back
                                  // edge, so the head comes up from −0.22.
                                  // Solved jointly with the base position and
                                  // yaw (the bulb orbits 0.58 units when the
                                  // group yaws!) against live probes — see
                                  // tools/probe_scene.mjs.
// NOTE: the lamp's actual facing is set by the place() call below, which
// overwrites rotation.y. LAMP_YAW is only the build-time default and is a no-op
// once place() runs — adjust the lamp's facing in the place() call, not here.
const LAMP_YAW   = -Math.PI;

// warm tungsten colour for the bulb glow + cast light
const LAMP_WARM = 0xffb24d;

// ---- iter 23 prop palette (gap #2) ------------------------------------------
// Books/wood pull their hues from TARGET; the lamp + pen cup are BLACK by user
// direction (mid-iter-23 feedback overrode TARGET's hunter green). Near-black
// rather than #000000: the satin anodised sheen needs a little albedo to catch
// the IBL, and AgX lifts true black toward grey anyway.
const LAMP_BLACK    = 0x1b1c1e;   // shade / arm / joints / base — anodised black
const LAMP_CAP_WOOD = 0xc4a06e;   // top cap — light oiled wood
const CUP_BLACK     = 0x232326;   // pencil-cup ceramic — matte black

// iter 12: the pencil cup is split out of lamp.glb into its OWN desk object.
// lamp.glb bundles a pen cup (Lamp_Cup + Pen_*/PenTip_*) right beside the lamp
// base; buildLamp reparents those nodes into a separate cupGroup and slides it
// forward-and-right of the lamp base so the two read as distinct props (matching
// TARGET). SAME colour for now — both keep the GLB's LampBlack/LampBlackP; a
// later iteration recolours lamp vs cup independently. Offsets are in the desk
// FRAME's local units, added to the lamp's placed position.
// Iter 19 (user feedback): the cup moves from the lamp's front-right foot to
// the LEFT SIDE OF THE PAPER — beside the sheet's upper-left edge, matching
// TARGET. In authored frame terms that is barely left of the lamp's x and well
// toward the wall in z, clearing the lamp base plate by ~3 cup radii.
// Iter 20: the lamp moved to the desk's back-left (1.50, 1.75) and the paper
// slid toward the desk centre (x 0.70), so the offsets re-anchor the cup beside
// the sheet's NEW left edge — still between the lamp post and the paper, and
// forward of the nodded bell so the shade never occludes it from the camera.
// Iter 21: the beam axis moved onto the paper, and the cup must sit INSIDE the
// lit cone to cast the pen shadows the user asked for. Beside the sheet's
// near-left corner it rides the cone at ~0.73 rad off-axis — grazing light,
// long pen shadows streaking toward the viewer, clear of the résumé text.
const CUP_DX = -0.46;
const CUP_DZ = -0.38;

// ---- flat-top light cookie (iter 19) ----------------------------------------
// The user's requirement is an EVEN pool: "the lamp's light should not be
// concentrated in the center and diffuse out rapidly". A bare SpotLight cannot
// deliver that — its penumbra attenuates from the axis outward, and cos³/d²
// geometry piles light under the bulb. Instead the spot projects this radial
// cookie (SpotLight.map, WebGL-supported when castShadow is on): the centre is
// slightly DARKENED to cancel the residual axis hotspot, a wide plateau holds
// the pool uniform, and a smooth hermite shoulder feathers it out with no
// legible cone boundary. Linear data — the values are multipliers, not colour.
let _lampCookie = null;
function makeLampCookieTexture() {
  if (_lampCookie) return _lampCookie;
  const S = 256;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const ctx = c.getContext('2d');
  const img = ctx.createImageData(S, S);
  const smooth = (a, b, x) => {
    const t = Math.min(1, Math.max(0, (x - a) / (b - a)));
    return t * t * (3 - 2 * t);
  };
  for (let y = 0; y < S; y++) {
    for (let x = 0; x < S; x++) {
      const r = Math.hypot(x - (S - 1) / 2, y - (S - 1) / 2) / (S / 2);
      let v;
      if (r < 0.34) v = 0.82 + 0.18 * smooth(0, 0.34, r);   // counter the axis hotspot
      else if (r < 0.60) v = 1.0;                            // even plateau
      else v = 1.0 - smooth(0.60, 0.96, r);                  // soft shoulder to black
      const i = (y * S + x) * 4;
      const b = Math.round(v * 255);
      img.data[i] = img.data[i + 1] = img.data[i + 2] = b;
      img.data[i + 3] = 255;
    }
  }
  ctx.putImageData(img, 0, 0);
  _lampCookie = new THREE.CanvasTexture(c);
  _lampCookie.colorSpace = THREE.NoColorSpace;   // light multiplier = linear data
  return _lampCookie;
}

function buildLamp() {
  const g = new THREE.Group();
  g.scale.setScalar(LAMP_SCALE);
  g.rotation.y = LAMP_YAW;

  // The pencil cup gets its own group, populated from the GLB in the loader
  // callback below and mounted on the desk frame by buildDeskObjects.
  const cupGroup = new THREE.Group();
  cupGroup.name = 'PencilCup';

  // --- bulb + light: created here but NOT parented to the lamp group directly.
  // Instead they are attached to the shade node inside the GLB once it loads, so
  // they live in the lamp HEAD's subtree and stay locked to the shade through any
  // rotation/scale/placement. (See the loader callback below.)
  // The bulb: kept as the light-rig anchor (SpotLight + halo seat on it) but NOT
  // rendered — an opaque opal diffuser now covers the mouth (see below),
  // so a visible bulb would only poke through it. Its emissive is still driven,
  // harmlessly, on the hidden mesh.
  const bulbMat = new THREE.MeshStandardMaterial({
    color: 0x2a2118, emissive: LAMP_WARM, emissiveIntensity: 0, roughness: 0.4,
  });
  const bulb = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), bulbMat);
  bulb.visible = false;
  bulb.castShadow = false; bulb.receiveShadow = false;   // sits at the light; must not self-occlude

  // The lamp casts real shadows so the cup, arm and post are grounded on the
  // desk. The earlier hard self-shadow ring is avoided by placing the SpotLight
  // outside the bell mouth, past the enclosure geometry.
  //
  // SpotLight, not PointLight: a real desk lamp only throws light down out of
  // the open bell, not in all directions, so a cone is the physically honest
  // shape AND the cheap one — its shadow is a single perspective pass instead
  // of a PointLight's 6-face cube map (6x the shadow draw calls for the same
  // light). distance/angle/shadow camera are all sized to the lamp's actual
  // short desk-scale throw rather than the old room-scale guess.
  // Iter 19 rig: WIDE cone + LOW penumbra + the flat-top cookie above. The
  // cookie owns the radial profile (even plateau, feathered shoulder), so the
  // penumbra only needs a light touch of angular softening — a high penumbra
  // would re-introduce the centre-weighted ramp the cookie exists to remove.
  // decay drops 2 → 1: with the raised head, linear distance falloff keeps the
  // far half of the pool alive so it covers half the desk before diffusing.
  const LAMP_ANGLE = 1.00;     // Iter 21: the axis now points AT the paper, so
                               // the cone no longer needs iter 20's 1.32 rad
                               // skirt to reach the props — the MacBook sits
                               // 0.71 rad off-axis (cookie shoulder, ~0.7×
                               // plateau: the diffusing tail + soft shadow) and
                               // the pen cup 0.64 rad. Narrower matters for
                               // SHADOW QUALITY: the shadow camera's fov is
                               // locked to this angle, so 1.32→1.00 concentrates
                               // ~2.5× more texels per unit — pens/cup/MacBook
                               // now resolve crisp lamp shadows from the same
                               // 512–1024 map.
  const LAMP_PENUMBRA = 0.35;  // cookie feathers the edge; this just de-hardens the rim
  const light = new THREE.SpotLight(LAMP_WARM, 0, 4.5, LAMP_ANGLE, LAMP_PENUMBRA, 1);
  light.name = 'LampKey';
  light.castShadow = true;
  light.map = makeLampCookieTexture();   // flat-top projection (needs castShadow)
  const _lampCaps = (typeof window !== 'undefined' && window.__caps) || {};
  light.shadow.mapSize.set(_lampCaps.lampShadowSize || 512, _lampCaps.lampShadowSize || 512);   // tier-driven (was 512)
  light.shadow.bias = -0.0005;
  light.shadow.normalBias = 0.008;
  light.shadow.camera.near = 0.08;   // source sits outside the mouth; retain desk-scale contacts
  light.shadow.camera.far = 4.6;     // reach the MacBook (~2.4 away) so it casts a faint lamp shadow
  const LAMP_THROW = 1.0;      // how far (in lamp-group local units) the cone aims past the bulb

  // near-field halo: the bulb's own short-range radiance. The narrow main cone
  // only lights the desk below; a real bulb also rims the bell's mouth, the arm
  // and the air right around the head. A tiny shadowless PointLight with a hard
  // distance cutoff carries that local glow without reaching the room.
  const halo = new THREE.PointLight(LAMP_WARM, 0, 1.15, 2);
  halo.name = 'LampBulbHalo';
  halo.castShadow = false;

  // Diffuser material handle — made to glow softly when lit so the bell reads as
  // illuminated from within (set once the GLB resolves).
  const lampState = { innerMat: null, capMat: null, attached: false };

  // How far up into the bell (toward the wood cap) to keep the hidden bulb rig,
  // in lamp-group local units measured along the shade→cap axis.
  const BULB_INSET = 0.04;
  // Put the actual SpotLight OUTSIDE the bell mouth. The hidden bulb rig stays
  // inset, but the shadow camera now looks away from the enclosure instead of
  // starting inside it. That lets the complete lamp silhouette cast window/sun
  // shadows without the lamp trapping its own beam.
  // Iter 19: 0.025 was sized for the old 0.62 rad cone; the wide 1.15 rad cone
  // gets extra clearance so its skirt can never catch the bell rim (the shade
  // is a real shadow caster since iter 18).
  const LIGHT_EXIT = 0.09;

  // async load — the lamp pops in a frame or two after the rest of the desk.
  const loader = new GLTFLoader();
  loader.load('assets/lamp.glb', (gltf) => {
    const model = gltf.scene;
    let shadeNode = null, shadeShellNode = null, capNode = null;
    model.traverse((o) => {
      if (o.name === 'Lamp_Shade' || o.name === 'Lamp_ShadeInner') {
        // prefer the inner shade node as the bulb's parent (it's at the mouth)
        if (!shadeNode || o.name === 'Lamp_ShadeInner') shadeNode = o;
        if (o.name === 'Lamp_Shade') shadeShellNode = o;
      }
      if (o.name === 'Lamp_WoodCap') capNode = o;
      if (o.isMesh) {
        // The SpotLight is mounted just outside the mouth below, so enclosure
        // geometry is behind its shadow camera and no longer self-traps the beam.
        // Keep every visible lamp part as a caster: the window and sun must see
        // the complete lamp silhouette, not only its base and arm.
        o.castShadow = true;
        o.receiveShadow = true;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          if (!m) continue;
          if (m.name === 'ShadeInner') {
            // The imported inner disc is the stray floating shape. Hide it and
            // build a clean diffuser against Lamp_Shade's actual mouth below.
            o.visible = false;
            continue;
          }
          // PREMIUM METALS (2026 redesign): now that the scene carries a daylight
          // IBL (lighting.js), refine the GLB's flat materials so they catch the
          // window. Shade / arm / base → satin anodised black metal with a soft
          // directional sheen (iter 23, per user direction); the __noClay flag
          // keeps the clayify() at the end of this loader from flattening it
          // back to clay grey.
          if (m.name === 'LampBlack' || m.name === 'LampBlackP') {
            m.color.set(LAMP_BLACK);
            m.userData.__noClay = true;
            m.metalness = 0.30; m.roughness = 0.42; m.envMapIntensity = 1.3; m.needsUpdate = true;
          }
          // light-wood top cap → a touch more oiled so it picks up the daylight.
          if (m.name === 'LampWood') {
            m.color.set(LAMP_CAP_WOOD);
            m.userData.__noClay = true;
            m.roughness = 0.50; m.envMapIntensity = 1.0; m.needsUpdate = true;
          }
        }
      }
    });

    // The GLB exports the bell fully flat-shaded (split normals on every quad),
    // which reads as stair-step bands across the shade. Rebuild the normals
    // smoothed wherever adjacent faces meet at under 45° — the bell's gentle
    // curvature fuses into one continuous surface while the mouth rim and its
    // bevel (near-90° creases) stay crisp. Positions are untouched, so the
    // aperture scan below still sees the same mouth ring.
    if (shadeShellNode) {
      shadeShellNode.geometry = toCreasedNormals(shadeShellNode.geometry, Math.PI / 4);
    }

    // Opaque opal diffuser seated just inside the modeled bell mouth. Derive the
    // aperture from the shade's actual mouth ring instead of tuning a projected
    // screen-space offset: this stays centered from every camera angle and keeps
    // the metal lip in front of the lens through normal depth testing.
    if (shadeShellNode) {
      const shadeGeometry = shadeShellNode.geometry;
      shadeGeometry.computeBoundingBox();
      const bounds = shadeGeometry.boundingBox;
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const mouthBand = Math.max(size.y * 0.01, 1e-4);
      const positions = shadeGeometry.getAttribute('position');
      let apertureRadius = Infinity;
      for (let i = 0; i < positions.count; i += 1) {
        const y = positions.getY(i);
        if (y > bounds.min.y + mouthBand) continue;
        const radius = Math.hypot(
          positions.getX(i) - center.x,
          positions.getZ(i) - center.z,
        );
        if (radius > 1e-5) apertureRadius = Math.min(apertureRadius, radius);
      }
      if (!Number.isFinite(apertureRadius)) {
        apertureRadius = Math.min(size.x, size.z) * 0.46;
      }

      // A thin capped cylinder reads as a real inset lens at grazing angles. Its
      // front face sits barely behind the rim; the 2.5% radial clearance avoids
      // z-fighting with the shade's beveled inner edge.
      const diffuserRadius = apertureRadius * 0.975;
      const diffuserDepth = Math.max(size.y * 0.015, 0.002);
      const diffuserGeometry = new THREE.CylinderGeometry(
        diffuserRadius, diffuserRadius, diffuserDepth, 48,
      );
      const diffuserMaterial = new THREE.MeshStandardMaterial({
        color: 0xf1ece1,
        emissive: LAMP_WARM,
        emissiveIntensity: 0,
        roughness: 1,
        metalness: 0,
      });
      diffuserMaterial.name = 'LampDiffuser';
      diffuserMaterial.userData.__noClay = true;
      const diffuser = new THREE.Mesh(diffuserGeometry, diffuserMaterial);
      diffuser.name = 'Lamp_Diffuser';
      diffuser.position.set(
        center.x,
        bounds.min.y + diffuserDepth * 0.6,
        center.z,
      );
      diffuser.castShadow = false;
      diffuser.receiveShadow = false;
      shadeShellNode.add(diffuser);
      lampState.innerMat = diffuserMaterial;
    }
    g.add(model);

    // ---- split the pencil cup out of the lamp (iter 12) --------------------
    // Reparent the cup + pens into cupGroup (an independent desk object) and
    // slide it clear of the lamp base. cupGroup is already mounted on the desk
    // frame (buildDeskObjects), so we align it to the lamp's placed transform,
    // attach() the nodes (which preserves their world pose so nothing jumps),
    // then offset the whole group by CUP_DX/CUP_DZ in frame space. Materials are
    // untouched → same colour as before.
    const CUP_RE = /^(Lamp_Cup|Pen_\d+|PenTip_\d+)$/;
    const cupNodes = model.children.filter((o) => CUP_RE.test(o.name));
    if (cupGroup.parent && cupNodes.length) {
      cupGroup.parent.updateMatrixWorld(true);
      cupGroup.position.copy(g.position);
      cupGroup.quaternion.copy(g.quaternion);
      cupGroup.scale.copy(g.scale);
      cupGroup.updateMatrixWorld(true);
      for (const o of cupNodes) cupGroup.attach(o);   // keep world pose, then shift the group
      cupGroup.position.set(g.position.x + CUP_DX, g.position.y, g.position.z + CUP_DZ);

      // Iter 23: the cup shares LampBlackP with the lamp's base disc — clone it
      // so the cup reads as its own object: matte black ceramic against the
      // lamp's satin black metal. The pens keep their GLB colors — their
      // materials live only on the reparented pen meshes, out of clayify's
      // reach — and pop against the black cup.
      const cupMesh = cupNodes.find((o) => o.name === 'Lamp_Cup');
      if (cupMesh && cupMesh.material) {
        const ceramic = cupMesh.material.clone();
        ceramic.name = 'CupCeramic';
        ceramic.color.set(CUP_BLACK);
        ceramic.metalness = 0; ceramic.roughness = 0.88; ceramic.envMapIntensity = 0.6;
        ceramic.userData.__noClay = true;
        cupMesh.material = ceramic;
      }
    }

    // ---- head pitch (iter 20): nod the bell assembly toward the desk --------
    // The head parts are flat siblings in the GLB, so rotate them together
    // around a pivot seated at the Joint_Head knuckle's centre. Done BEFORE the
    // bulb/light binding below so the bell-axis math reads the pitched pose.
    const jointNode = model.children.find((o) => o.name === 'Joint_Head');
    if (jointNode) {
      if (g.parent) g.parent.updateMatrixWorld(true); else g.updateMatrixWorld(true);
      const jc = new THREE.Box3().setFromObject(jointNode).getCenter(new THREE.Vector3());
      const pivot = new THREE.Group();
      pivot.name = 'LampHeadPivot';
      pivot.position.copy(model.worldToLocal(jc.clone()));
      model.add(pivot);
      pivot.updateMatrixWorld(true);
      for (const nm of ['Lamp_Shade', 'Lamp_ShadeInner', 'Lamp_WoodCap', 'Lamp_Neck']) {
        const n = model.children.find((o) => o.name === nm);
        if (n) pivot.attach(n);
      }
      pivot.rotation.x = HEAD_PITCH;   // GLB head cantilevers toward +z; x-rot nods it
      pivot.updateMatrixWorld(true);
    }

    // ---- bind the bulb + light to the shade so they are INSEPARABLE from it ----
    // Parenting to the shade node means the light source is part of the lamp
    // head: it inherits every transform applied to the head/arm/group, so the
    // glow always emanates from inside the shade no matter how the lamp is posed.
    const host = shadeShellNode || shadeNode || g;
    host.add(bulb);
    host.add(light);
    host.add(light.target);   // SpotLight needs its target IN the scene graph to aim correctly

    // Seat the bulb UP inside the funnel. The shade + cap nodes are siblings in
    // the model root, so the world-space points give the true bell axis (mouth →
    // cap, i.e. up into the shade). We place the bulb at that world point, then
    // convert into the shade node's local space (its parent) via worldToLocal so
    // it stays glued to the shade through every transform.
    if (g.parent) g.parent.updateMatrixWorld(true); else g.updateMatrixWorld(true);
    model.updateMatrixWorld(true);
    if (shadeNode && capNode) {
      const sWorld = new THREE.Vector3(); shadeNode.getWorldPosition(sWorld);
      const cWorld = new THREE.Vector3(); capNode.getWorldPosition(cWorld);
      const axisUnit = cWorld.clone().sub(sWorld).normalize();   // mouth -> cap ("up" into the bell)
      // BULB_INSET is in the lamp group's LOCAL units; the world axis already
      // carries the group's scale, so scale the inset by it to stay in local terms.
      const s = g.scale.x || 1;
      const bulbWorld = sWorld.clone().add(axisUnit.clone().multiplyScalar(BULB_INSET * s));
      const bulbLocal = host.worldToLocal(bulbWorld.clone());
      bulb.position.copy(bulbLocal);
      const lightWorld = sWorld.clone().add(axisUnit.clone().multiplyScalar(-LIGHT_EXIT * s));
      light.position.copy(host.worldToLocal(lightWorld.clone()));
      // Aim the cone straight out of the shade's mouth and down onto the desk.
      const aimWorld = lightWorld.clone().add(axisUnit.clone().multiplyScalar(-LAMP_THROW * s));
      light.target.position.copy(host.worldToLocal(aimWorld.clone()));

      // the halo sits at the bulb itself, inside the shade mouth
      host.add(halo);
      halo.position.copy(bulbLocal);
    } else {
      bulb.position.set(0, 0, 0);
      light.position.set(0, 0, 0);
      light.target.position.set(0, -1, 0);
    }
    lampState.attached = true;
    clayify(gltf.scene);

    window.__lampLoaded = true;
  }, undefined, (err) => {
    console.error('Failed to load lamp.glb', err);
    window.__lampLoadError = err;
  });

  return { group: g, cupGroup, bulb, light, halo, bulbMat, lampState };
}

// ------------------------------------------------ Résumé sheet (paper) ------
// A flat sheet of paper resting on the desk beside the lamp, nudged toward the
// wall. The résumé PDF's first page is rendered to an image (assets/
// resume_page.png) and mapped loosely onto the sheet, so it reads as "my résumé
// is sitting right here." A hit proxy over the sheet (added in buildDeskObjects)
// opens the in-page PDF viewer — see the #resume panel in index.html.
const PAPER_W = 0.66;                 // sheet width (across the desk)
const PAPER_L = PAPER_W * 1.294;      // sheet length toward the wall (US-letter 8.5:11)

function buildPaper() {
  const group = new THREE.Group();

  // warm-white stock with a hair of thickness so the sheet reads as paper, not
  // a decal — it catches the lamp and casts a soft shadow on the desk.
  const stockMat = new THREE.MeshStandardMaterial({
    color: 0xf2ecdb, roughness: 0.95, metalness: 0.0,
  });
  const base = new THREE.Mesh(new THREE.BoxGeometry(PAPER_W, 0.006, PAPER_L), stockMat);
  base.position.y = 0.003;
  base.castShadow = true; base.receiveShadow = true;
  group.add(base);

  // printed face: the résumé render laid on top of the stock, inset a touch so a
  // thin paper margin shows around the print.
  const printMat = new THREE.MeshStandardMaterial({
    color: 0xffffff, roughness: 0.97, metalness: 0.0,
  });
  const print = new THREE.Mesh(new THREE.PlaneGeometry(PAPER_W * 0.94, PAPER_L * 0.95), printMat);
  print.receiveShadow = true;
  // Lay the page flat and READABLE from the seated camera: sheet normal points up
  // (+y), the top of the page points toward the wall (frame +z, i.e. away from
  // the viewer) and the text isn't mirrored. Built from an explicit basis so the
  // mapping is exact (texture +x→frame −x, texture +y→frame +z, normal→frame +y).
  const basis = new THREE.Matrix4().makeBasis(
    new THREE.Vector3(-1, 0, 0),
    new THREE.Vector3( 0, 0, 1),
    new THREE.Vector3( 0, 1, 0),
  );
  print.quaternion.setFromRotationMatrix(basis);
  print.position.y = 0.0065;          // just above the stock's top face
  group.add(print);

  // async-load the résumé page texture; until it lands the sheet is blank stock.
  new THREE.TextureLoader().load('assets/resume_page.png', (tex) => {
    tex.colorSpace = THREE.SRGBColorSpace;
    tex.anisotropy = 8;
    printMat.map = tex;
    printMat.needsUpdate = true;
  }, undefined, (err) => { console.error('Failed to load resume_page.png', err); });

  return { group };
}

// ----------------------------------------------------- MacBook Air (GLB) ----
// A detailed MacBook Air modeled in Blender (assets/macbook.blend) and exported
// to assets/macbook.glb. Authored in metres, base-down, origin at the base
// centre on the floor plane (y=0), lid open ~107°, screen facing the model's
// local +z. The GLB ships light-grey, low-metalness aluminium; since the 2026
// redesign added a daylight IBL (lighting.js), buildMacbook raises the aluminium /
// hinge / logo metalness so the body reads as proper brushed/anodised aluminium
// catching the window, not flat silver. The "Screen" material is its own named
// slot (emissive desktop); "MB_GlassDark" (the panel glass) gets a faint
// fingerprint-smudge roughness map.
//
// Scale: the scene runs ~3.05x real size — the résumé sheet (US-letter, 0.216 m
// wide) is PAPER_W = 0.66 units (0.66 / 0.216 ≈ 3.05) — so the 0.304 m-wide
// MacBook becomes ~0.93 units beside the sheet. Iter 19 lifts it ~10% above
// strict physical scale for more presence in frame (user feedback); the screen
// RectAreaLight is parented inside this group and sized from the panel's world
// extent after this scale applies, so the lighting tracks the resize for free.
const MB_SCALE = 3.35;

// -- the desktop drawn onto the 3D display: a macOS Finder window showing the
//    Projects folder (one file per project). Drawn once into a canvas and used
//    as the screen's emissive map so it glows softly. The interactive, full-
//    screen version of this lives in the HTML overlay (see computer.js).
function _rr(ctx, x, y, w, h, r) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}
function _file(ctx, cx, top, w, name) {
  const h = w * 1.28, x = cx - w / 2, y = top;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.22)'; ctx.shadowBlur = w * 0.16; ctx.shadowOffsetY = w * 0.06;
  ctx.fillStyle = '#ffffff';
  _rr(ctx, x, y, w, h, w * 0.10); ctx.fill();
  ctx.restore();
  // blue header
  ctx.fillStyle = '#3f8fe0';
  _rr(ctx, x, y, w, h * 0.20, w * 0.10); ctx.fill();
  ctx.fillRect(x, y + h * 0.11, w, h * 0.09);
  // ruled lines
  ctx.fillStyle = '#d4d4d9';
  for (let i = 0; i < 4; i++) ctx.fillRect(x + w * 0.16, y + h * 0.36 + i * h * 0.135, w * 0.68, h * 0.05);
  // label
  ctx.fillStyle = 'rgba(36,38,44,0.96)';
  ctx.textAlign = 'center';
  ctx.font = '500 19px -apple-system, "Helvetica Neue", Arial';
  let nm = String(name || 'Untitled'); if (nm.length > 13) nm = nm.slice(0, 12) + '…';
  ctx.fillText(nm + '.txt', cx, top + h + 28);
  ctx.textAlign = 'left';
}
function makeMacScreenTexture(projects) {
  const W = 1024, H = 680;
  const c = document.createElement('canvas'); c.width = W; c.height = H;
  const ctx = c.getContext('2d');
  // desktop behind the window
  const g = ctx.createLinearGradient(0, 0, W * 0.35, H);
  g.addColorStop(0, '#1f3147'); g.addColorStop(0.55, '#2d4a63'); g.addColorStop(1, '#3d6678');
  ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  // menu bar
  ctx.fillStyle = 'rgba(16,22,30,0.5)'; ctx.fillRect(0, 0, W, 30);
  ctx.fillStyle = 'rgba(255,255,255,0.95)';
  ctx.font = '700 16px -apple-system, Arial'; ctx.fillText('Finder', 20, 21);
  ctx.font = '500 14px -apple-system, Arial'; ctx.textAlign = 'right';
  ctx.fillText('Krutharth   Mon 9:41', W - 18, 21); ctx.textAlign = 'left';
  // ---- Finder window ----
  const wx = 46, wy = 58, ww = W - 92, wh = H - 96;
  ctx.save();
  ctx.shadowColor = 'rgba(0,0,0,0.45)'; ctx.shadowBlur = 40; ctx.shadowOffsetY = 16;
  ctx.fillStyle = '#f6f6f7'; _rr(ctx, wx, wy, ww, wh, 16); ctx.fill();
  ctx.restore();
  // title bar + traffic lights
  ctx.fillStyle = '#e9e9eb'; _rr(ctx, wx, wy, ww, 46, 16); ctx.fill();
  ctx.fillRect(wx, wy + 30, ww, 16);
  for (const [col, off] of [['#ff5f57', 26], ['#febc2e', 48], ['#28c840', 70]]) {
    ctx.beginPath(); ctx.arc(wx + off, wy + 23, 7, 0, Math.PI * 2); ctx.fillStyle = col; ctx.fill();
  }
  ctx.fillStyle = '#1d1d1f'; ctx.font = '700 18px -apple-system, Arial'; ctx.textAlign = 'center';
  ctx.fillText('Projects', wx + ww / 2, wy + 30); ctx.textAlign = 'left';
  // sidebar
  const sbw = 200;
  ctx.fillStyle = '#ededf0'; ctx.fillRect(wx, wy + 46, sbw, wh - 46);
  ctx.fillStyle = '#9b9ba0'; ctx.font = '700 13px -apple-system, Arial'; ctx.fillText('FAVORITES', wx + 22, wy + 86);
  ctx.fillStyle = '#d4d4d9'; _rr(ctx, wx + 12, wy + 98, sbw - 24, 34, 8); ctx.fill();
  ctx.fillStyle = '#1d1d1f'; ctx.font = '500 17px -apple-system, Arial'; ctx.fillText('📁  Projects', wx + 24, wy + 121);
  // files grid (one per project)
  const names = (projects && projects.length)
    ? projects.map(p => (typeof p === 'string') ? p : (p && p.name) || 'Untitled')
    : ['Project One', 'Project Two', 'Project Three', 'Project Four'];
  const gx0 = wx + sbw + 46, tileW = 100, colGap = 60, rowH = tileW * 1.28 + 62, cols = 3, gy0 = wy + 92;
  names.slice(0, 6).forEach((nm, i) => {
    const cx = gx0 + (i % cols) * (tileW + colGap) + tileW / 2;
    const top = gy0 + Math.floor(i / cols) * rowH;
    _file(ctx, cx, top, tileW, nm);
  });
  const tex = new THREE.CanvasTexture(c);
  tex.colorSpace = THREE.SRGBColorSpace; tex.anisotropy = 8;
  // The GLB's MB_Display UVs are authored without the GL vertical flip, so the
  // default flipY=true samples the canvas upside-down. Disable it to match.
  tex.flipY = false;
  return tex;
}

// Faint fingerprint-smudge ROUGHNESS map for the MacBook's screen glass. A subtle
// imperfection: the glass is glossy (low roughness) where clean and smears to a
// higher roughness in soft fingerprint blobs, so the window reflection on the
// panel breaks up the way a handled screen really does. Linear data (not colour).
let _smudgeTex = null;
function makeScreenSmudgeTexture() {
  if (_smudgeTex) return _smudgeTex;
  const S = 512;
  const c = document.createElement('canvas'); c.width = c.height = S;
  const ctx = c.getContext('2d');
  ctx.fillStyle = '#4d4d4d';                         // clean glossy glass (roughness floor)
  ctx.fillRect(0, 0, S, S);
  for (let i = 0; i < 22; i++) {                     // soft, overlapping smudges
    const x = Math.random() * S, y = Math.random() * S, r = 24 + Math.random() * 70;
    const g = ctx.createRadialGradient(x, y, 0, x, y, r);
    g.addColorStop(0, 'rgba(188,188,188,0.5)');      // rougher (smeared) core
    g.addColorStop(1, 'rgba(188,188,188,0)');
    ctx.fillStyle = g;
    ctx.save(); ctx.translate(x, y); ctx.rotate(Math.random() * Math.PI);
    ctx.scale(1, 0.5 + Math.random() * 0.5);
    ctx.beginPath(); ctx.arc(0, 0, r, 0, Math.PI * 2); ctx.fill();
    ctx.restore();
  }
  _smudgeTex = new THREE.CanvasTexture(c);
  _smudgeTex.colorSpace = THREE.NoColorSpace;        // roughnessMap = linear data
  return _smudgeTex;
}

function buildMacbook(projects) {
  const g = new THREE.Group();
  g.scale.setScalar(MB_SCALE);
  let screenMesh = null;
  // Screen light + material handles, filled once the GLB resolves (async). The
  // display's RectAreaLight provides a soft, physically motivated spill onto
  // the desk; applyTime() drives both it and the panel emissive by dayFactor.
  const screen = { light: null, mat: null };

  // world-space anchor of the display: { center, normal } — used by main.js to
  // fly the camera into the screen. Normal is derived from the quad geometry so
  // it stays correct regardless of placement, and forced to face the room (+x).
  function getScreenAnchor() {
    if (!screenMesh) return null;
    screenMesh.updateWorldMatrix(true, false);
    const center = new THREE.Box3().setFromObject(screenMesh).getCenter(new THREE.Vector3());
    const p = screenMesh.geometry.attributes.position;
    const a = new THREE.Vector3().fromBufferAttribute(p, 0);
    const b = new THREE.Vector3().fromBufferAttribute(p, 1);
    const d = new THREE.Vector3().fromBufferAttribute(p, 2);
    const normal = new THREE.Vector3().subVectors(b, a).cross(new THREE.Vector3().subVectors(d, a));
    normal.transformDirection(screenMesh.matrixWorld).normalize();
    if (normal.x < 0) normal.negate();          // face the seated viewer (+x)
    return { center, normal };
  }

  // async load — pops in a frame or two after the rest of the desk.
  const loader = new GLTFLoader();
  loader.load('assets/macbook.glb', (gltf) => {
    const model = gltf.scene;
    model.traverse((o) => {
      if (o.isMesh) {
        o.castShadow = true;
        o.receiveShadow = true;
        const mats = Array.isArray(o.material) ? o.material : [o.material];
        for (const m of mats) {
          if (!m) continue;
          if (m.map) m.map.colorSpace = THREE.SRGBColorSpace;
          // PREMIUM METALS (2026 redesign): the daylight IBL now lets the aluminium
          // read as real brushed metal — raise metalness (was a low 0.3 to avoid
          // going dark when there was no env map) so the body catches the window.
          switch (m.name) {
            case 'MB_Aluminum':                       // body + lid
              m.metalness = 0.85; m.roughness = 0.40; m.envMapIntensity = 1.2; m.needsUpdate = true; break;
            case 'MB_AluHinge':
              m.metalness = 0.85; m.roughness = 0.38; m.envMapIntensity = 1.2; m.needsUpdate = true; break;
            case 'MB_TPBorder':                       // trackpad aluminium border
              m.metalness = 0.70; m.roughness = 0.40; m.envMapIntensity = 1.1; m.needsUpdate = true; break;
            case 'MB_Logo':                           // polished mirror logo
              m.metalness = 0.95; m.roughness = 0.20; m.envMapIntensity = 1.3; m.needsUpdate = true; break;
            case 'MB_Trackpad':                       // glass trackpad
              m.metalness = 0.10; m.roughness = 0.18; m.envMapIntensity = 1.1; m.needsUpdate = true; break;
            case 'MB_GlassDark':                      // screen glass + faint smudge
              m.roughness = 0.50; m.roughnessMap = makeScreenSmudgeTexture(); m.envMapIntensity = 1.1; m.needsUpdate = true; break;
          }
        }
      }
      if (o.isMesh && (o.name === 'MB_Display' || (o.material && o.material.name === 'Screen'))) screenMesh = o;
    });
    g.add(model);

    // light the screen: the desktop wallpaper as an emissive map so it glows.
    if (screenMesh) {
      const tex = makeMacScreenTexture(projects);
      const m = Array.isArray(screenMesh.material) ? screenMesh.material[0] : screenMesh.material;
      m.map = tex;
      m.emissive = new THREE.Color(0xffffff);
      m.emissiveMap = tex;
      // Daytime panel brightness. At night applyTime() raises this above the
      // bloom threshold so the panel halos like a real screen in a dark room
      // (fixed virtual exposure = the boost stands in for eye adaptation).
      m.emissiveIntensity = 0.55;
      m.roughness = 0.5; m.metalness = 0.0;   // higher roughness = no tight specular hotspot
      m.side = THREE.DoubleSide;
      m.needsUpdate = true;
      screen.mat = m;   // applyTime drives emissiveIntensity day↔night

      // Real screen illumination. The old approach was a flat additive decal
      // lying on the desk in front of the laptop — it read as a fog-like bloom
      // pooled at the bottom, with the "glow" clearly coming from the desk
      // rather than the panel. Replaced with a RectAreaLight sized to the panel
      // and sitting ON the screen surface, emitting outward along the screen
      // normal: light radiates UNIFORMLY from the whole rectangle, is strongest
      // close to the glass and falls off naturally with distance — physically
      // plausible screen spill onto the keyboard, desk and seated figure.
      // RectAreaLight casts no shadows in three.js, so this stays a restrained
      // local spill only. The aperture-masked window key in lighting.js owns the
      // MacBook's cast silhouette; this source only lights the keys and nearby
      // desk. It affects MeshStandard/Physical materials around the desk.
      ensureRectAreaUniforms();
      g.updateWorldMatrix(true, false);
      const anchor = getScreenAnchor();
      if (anchor) {
        // Panel size in WORLD units. RectAreaLight.width/height are world-space
        // and ignore parent scale (the renderer normalises the light's basis),
        // so measure the panel face directly in world space: geometry extent x
        // the mesh's world scale, taking the two largest axes (it's a thin quad).
        screenMesh.geometry.computeBoundingBox();
        const bsize = screenMesh.geometry.boundingBox.getSize(new THREE.Vector3());
        const wscale = screenMesh.getWorldScale(new THREE.Vector3());
        const ext = [bsize.x * wscale.x, bsize.y * wscale.y, bsize.z * wscale.z]
          .sort((a, b) => b - a);
        const sw = ext[0], sh = ext[1];

        // Soft cool-white, like a lit display, with enough real-time intensity
        // to illuminate the keyboard and nearby desk props.
        const screenLight = new THREE.RectAreaLight(0xcfe0ff, 2.8, sw, sh);
        screenLight.name = 'MacBookScreen';
        // Sit a hair off the glass along the normal so the rectangle isn't
        // coplanar with the panel it illuminates.
        const lightWorld = anchor.center.clone()
          .add(anchor.normal.clone().multiplyScalar(0.02));
        screenLight.position.copy(g.worldToLocal(lightWorld.clone()));
        g.add(screenLight);
        // Aim into the room along the screen normal — RectAreaLight illuminates
        // the side it faces (the point it looks at). lookAt resolves in world
        // space and factors out the group's transform.
        screenLight.lookAt(anchor.center.clone().add(anchor.normal));
        screenLight.userData.isScreenLight = true;
        screen.light = screenLight;
      }
    }
    // Iter 23 palette (gap #2): no clayify — the GLB ships a fully authored
    // MacBook (light-grey aluminium body, dark bezel/keys/well/ports/feet),
    // which with the PREMIUM METALS pass above matches TARGET's silver laptop.
    window.__macbookLoaded = true;
  }, undefined, (err) => {
    console.error('Failed to load macbook.glb', err);
    window.__macbookLoadError = err;
  });

  return { group: g, getScreenAnchor, screen };
}

// ============================================================================
// ASSEMBLE + PLACE
// ============================================================================
export function buildDeskObjects(desk, opts = {}) {
  const group = new THREE.Group();
  const interactives = [];

  // The desk's surface objects keep their ORIGINAL relative layout, which was
  // authored around a desk centred at three.js (x 0, z 1.7). We build that layout
  // into `frame`, then move/rotate `frame` as one rigid unit to the desk's new
  // pose against the left wall (facing the bookshelf). This preserves every
  // object's relative placement, scale and orientation exactly.
  const frame = new THREE.Group();
  group.add(frame);
  const LAYOUT_Z0 = 1.7;          // original desk-centre z the layout was authored at
  const SURF = 0;                 // objects sit on the frame plane (frame is lifted to surfaceY)

  const lamp = buildLamp();

  // place(node, x, z, rotY): drops an object onto the desk surface, relative to
  // the original authored desk centre (x 0, z LAYOUT_Z0).
  function place(obj, x, z, rotY = 0) { obj.position.set(x, SURF, z - LAYOUT_Z0); obj.rotation.y = rotY; frame.add(obj); return obj; }

  // NOTE: place() overwrites the group's rotation.y, so the lamp's facing is
  // controlled HERE (not by LAMP_YAW).
  // Iter 21: yawed ~−1.38 rad clockwise (user feedback — the bell faced the
  // wall, "turned away from the user") so the beam axis lands on the paper
  // and the bell's mouth shows to the seated camera, as in TARGET. The base
  // also steps into the desk's left-edge corner (1.59, 1.85): yawing swings
  // the cantilevered bulb 0.58 units, and from the old base every paper-
  // facing pose left the pen cup outside the cone. Pose solved by grid search
  // against live probe numbers (base × yaw × pitch × cup, with desk-edge,
  // shelf-face and mouth-visibility constraints).
  place(lamp.group, 1.59, 1.99, -3.07 - Math.PI / 2);

  // Mount the pencil cup as its OWN desk object. It is populated + positioned
  // from the GLB inside buildLamp's loader once it resolves (see CUP_DX/CUP_DZ);
  // it must already live on the frame before that async callback fires.
  frame.add(lamp.cupGroup);

  // clickable lamp — tall box covering the post + head so clicking anywhere on
  // the lamp toggles it. Sits over the lamp's placed spot (kept in sync with
  // the place() call above — it had lagged at the pre-iter-20 position). The
  // proxy carries the live on/off label, refreshed by the controller below.
  const lampProxy = hitProxy(0.9, 1.9, 0.9, 'lamp', null, 'Turn off the lamp', 'amber');
  lampProxy.position.set(1.59, SURF + 0.95, 1.99 - LAYOUT_Z0);
  frame.add(lampProxy); interactives.push(lampProxy);

  // ------------------------------------------------- Résumé sheet + hotspot ---
  // Sits beside the lamp and a little closer to the wall (higher authored z),
  // with a slight hand-set skew. Clicking it opens the résumé PDF viewer.
  // Iter 20: x 0.95 → 0.70 — the sheet slides toward the desk's centre (user
  // feedback), which also seats it in the middle of the lamp pool.
  const PAPER = { x: 0.70, z: 1.80, rotY: -0.16 };
  const paper = buildPaper();
  place(paper.group, PAPER.x, PAPER.z, PAPER.rotY);
  paper.group.position.y = SURF + 0.001;   // rest on the desk top, just clear of z-fighting

  const paperProxy = hitProxy(PAPER_W + 0.14, 0.22, PAPER_L + 0.14, 'resume', null, 'Résumé — click to read', 'blue');
  paperProxy.position.set(PAPER.x, SURF + 0.11, PAPER.z - LAYOUT_Z0);
  paperProxy.rotation.y = PAPER.rotY;
  frame.add(paperProxy); interactives.push(paperProxy);

  // --------------------------------------------------------- MacBook Air ------
  // Sits in the BACK-RIGHT of the desk relative to the seated camera. The camera
  // is at +x looking down -x, so its right is -z and "back" is toward the wall
  // (-x); this spot (authored x -0.92, z 1.92) lands there, well clear of the
  // lamp (front-left) and résumé (mid-left). rotY includes the frame's own -90°
  // yaw so the open screen ends up facing the viewer (final world yaw ≈ +74°).
  const MB = { x: -0.92, z: 1.92, rotY: 2.874 };
  const macbook = buildMacbook(opts.projects || []);
  place(macbook.group, MB.x, MB.z, MB.rotY);   // place() rests it on the desk top (y = SURF)

  // clickable laptop — a box over the whole MacBook so a click anywhere on it
  // enters the computer screen (action 'computer', handled in main.js). Aligned
  // to the laptop's yaw and tall enough to cover the open lid.
  const mbProxy = hitProxy(1.12, 0.88, 0.95, 'computer', null, 'Open the laptop', 'blue');
  mbProxy.position.set(MB.x, SURF + 0.34, MB.z - LAYOUT_Z0);
  mbProxy.rotation.y = MB.rotY;
  frame.add(mbProxy); interactives.push(mbProxy);

  // ---- move the whole desk-surface layout to the desk's new world pose ----
  // Desk centre in world (x = desk.centerX, z = desk.z), surface at desk.surfaceY,
  // rotated to face the bookshelf (desk.rotY).
  frame.position.set(desk.centerX ?? 0, desk.surfaceY, desk.z);
  frame.rotation.y = desk.rotY ?? 0;

  // world position of the lamp (kept for any external use). The bulb is parented
  // to the shade asynchronously, so anchor to the lamp group here — the light no
  // longer depends on this value (it lives inside the lamp head subtree).
  const lampAnchor = new THREE.Vector3();
  group.updateMatrixWorld(true);
  lamp.group.getWorldPosition(lampAnchor);

  // ============================ LAMP ON/OFF CONTROLLER =====================
  // The lamp is a clickable light. Defaults: OFF during the day, ON at night.
  // Clicking toggles it regardless of time of day. Turning ON plays a slow
  // warm-up that blinks once before settling; turning OFF fades out quickly.
  // All driven from update(t).
  // The realtime SpotLight carries the lamp's visible warm pool and shadows;
  // its brightness follows the same on/off warm-up curve as the emissive bulb.
  const LAMP_MAX_LIGHT = 4.2;   // iter 21: the beam axis moved onto the paper,
                                // which sits only 0.83 units from the bulb —
                                // ~1.6× more incident light than iter 20's
                                // off-axis geometry, so the intensity drops
                                // 6.0 → 4.2 to keep the sheet unclipped (decay 1
                                // + flat-top cookie unchanged)
  const LAMP_AUTO_REF  = 4.5;   // reference for the auto level curve (keeps the
                                // historical day-ember/night-full 0..1 levels
                                // stable independent of LAMP_MAX_LIGHT retunes)
  const LAMP_MAX_EMIT  = 2.6;   // sustained bulb emissive intensity when fully on
  const LAMP_MAX_INNER = 2.0;   // sustained shade-inner glow when fully on
  const LAMP_MAX_HALO  = 0.0;   // diffuser is the visible emitter; avoid a bulb-like hot patch on the bell wall

  // turn-on timeline (seconds), an array of [time, multiplier] keyframes that
  // produce a slow rise, a brief dip ("blink"), a small overshoot, then steady.
  const ON_CURVE = [
    [0.00, 0.00],
    [0.55, 0.62],   // slow rise
    [0.70, 0.18],   // blink: drop
    [0.84, 0.95],   // snap back up (slight overshoot)
    [0.96, 0.86],
    [1.15, 1.00],   // settle
  ];
  const ON_DUR = 1.15;          // matches the last keyframe time
  const OFF_DUR = 0.35;         // quick fade out

  const lampCtl = {
    on: false,          // current logical state; initialized by time of day
    level: 0,           // 0..1 applied brightness multiplier
    anim: null,         // { mode:'on'|'off', t0 }
    userOverride: false, // once the user clicks the lamp, manual state wins for the session
  };

  // Latest time-of-day, fed by applyTime()/setDayFactor(). Until the first frame
  // they default to daytime so the lamp starts as a dim ember (applyTime corrects
  // on frame 1). Used only while !userOverride.
  let _dayFactor = 1;
  let _stateLamp = 3;
  let _mode = 'day';

  function sampleOnCurve(tt) {
    if (tt <= ON_CURVE[0][0]) return ON_CURVE[0][1];
    for (let i = 0; i < ON_CURVE.length - 1; i++) {
      const [t0, v0] = ON_CURVE[i], [t1, v1] = ON_CURVE[i + 1];
      if (tt <= t1) {
        const k = (tt - t0) / Math.max(1e-4, t1 - t0);
        return v0 + (v1 - v0) * k;
      }
    }
    return ON_CURVE[ON_CURVE.length - 1][1];
  }

  function applyLampLevel(level) {
    lampCtl.level = level;
    lamp.light.intensity = level * LAMP_MAX_LIGHT;
    lamp.bulbMat.emissiveIntensity = level * LAMP_MAX_EMIT;
    if (lamp.lampState.innerMat) lamp.lampState.innerMat.emissiveIntensity = level * LAMP_MAX_INNER;
    lamp.light.visible = level > 0.001;
    // The short-range bulb halo rides the same curve. The iter-17 fake bounce
    // spotlight was removed: its cone was the odd oval projected on the wall.
    lamp.halo.intensity = level * LAMP_MAX_HALO;
    // (visible only if it would give light: at an intensity of nothing every lit pixel of the room still worked a
    // whole point light out and multiplied it by zero, whenever the lamp was on)
    lamp.halo.visible = level * LAMP_MAX_HALO > 0.001;
  }

  function refreshLampLabel() {
    if (lampProxy) lampProxy.userData.label = lampCtl.on ? 'Turn off the lamp' : 'Turn on the lamp';
  }

  function isLampOn() { return lampCtl.on; }

  function setLamp(on, { animate = true, user = false } = {}) {
    // A user click latches manual mode: applyTime's time-driven default no longer
    // touches the lamp for the rest of the session (their explicit on/off wins).
    if (user) lampCtl.userOverride = true;
    if (on === lampCtl.on && !lampCtl.anim) { applyLampLevel(on ? 1 : 0); refreshLampLabel(); return; }
    lampCtl.on = on;
    refreshLampLabel();
    if (!animate) { lampCtl.anim = null; applyLampLevel(on ? 1 : 0); return; }
    lampCtl.anim = { mode: on ? 'on' : 'off', t0: performance.now() / 1000, from: lampCtl.level };
  }

  function toggleLamp() { setLamp(!lampCtl.on, { user: true }); }

  // ---- initial default. Called by main.js once it knows the time of day. ----
  function setLampDefault(isNight) {
    // Start off in daytime and on at night. Time-of-day brightness then follows
    // the same logical state until the user clicks and takes manual control.
    setLamp(!!isNight, { animate: false });
  }

  // ---- time-of-day auto-drive. Until a click takes manual control, the lamp is
  // genuinely off by day and on at night. ----
  function setDayFactor(f, lampVal, mode) {
    _dayFactor = f;
    if (typeof lampVal === 'number') _stateLamp = lampVal;
    if (mode) _mode = mode;
    if (lampCtl.userOverride) return;
    // Absolute auto level curve for the night-time lamp. Computed against the
    // fixed LAMP_AUTO_REF so retuning the realtime spot does not warp it.
    const autoI = THREE.MathUtils.lerp(6.0, LAMP_AUTO_REF, 1 - _dayFactor) * (_stateLamp / 16);
    const level = THREE.MathUtils.clamp(autoI / LAMP_AUTO_REF, 0, 1);
    lampCtl.on = _mode === 'night';
    refreshLampLabel();
    applyLampLevel(lampCtl.on ? level : 0);
  }

  function applyTime(state) {
    setDayFactor(state.dayFactor, state.lamp, state.mode);
    // Screen glow vs time of day. The panel's real luminance is constant, but
    // the render's exposure is fixed while a real eye adapts to the dark — so
    // the screen's APPARENT brightness must rise as the room falls away. At
    // night the emissive crosses the bloom threshold (post.js: 0.9) and the
    // panel halos like the reference laptop-in-the-dark; the RectAreaLight
    // spill onto keyboard/desk deepens in step.
    const nightK = 1 - THREE.MathUtils.clamp(state.dayFactor, 0, 1);
    if (macbook.screen.light) macbook.screen.light.intensity = THREE.MathUtils.lerp(2.2, 4.2, nightK);
    if (macbook.screen.mat) macbook.screen.mat.emissiveIntensity = THREE.MathUtils.lerp(0.55, 1.25, nightK);
  }

  function update(t) {
    // drive the lamp warm-up / fade animation
    if (lampCtl.anim) {
      const now = performance.now() / 1000;
      const dt = now - lampCtl.anim.t0;
      if (lampCtl.anim.mode === 'on') {
        if (dt >= ON_DUR) { applyLampLevel(1); lampCtl.anim = null; }
        else applyLampLevel(sampleOnCurve(dt));
      } else {
        // quick linear fade from the level we were at when OFF was triggered
        const k = Math.min(1, dt / OFF_DUR);
        if (k >= 1) { applyLampLevel(0); lampCtl.anim = null; }
        else applyLampLevel(lampCtl.anim.from * (1 - k));
      }
    }
  }

  function getLampLevel() { return lampCtl.level; }

  clayify(group, { skip: ['Screen'] });
  return { group, interactives, lampAnchor, setLampDefault, applyTime, setDayFactor, update, toggleLamp, setLamp, getLampLevel, isLampOn, lamp, macbook };
}
