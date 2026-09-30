// Replace the simplified assembly through VITE_EQUIPMENT_MODEL_URL (GLB/GLTF).
// This geometry is a visual approximation of the supplied test rig, not a replica.
import * as THREE from "three";
export const rigParts = {
  engine: {
    name: "Diesel engine",
    detail:
      "Simplified single-cylinder engine block. Vibration is monitored at the engine block.",
  },
  generator: {
    name: "Dynamometer assembly",
    detail:
      "Simplified generator/dynamometer housing. Current is monitored at the output cable.",
  },
  panel: {
    name: "Control cabinet",
    detail: "Simplified laboratory control and instrument cabinet.",
  },
  exhaust: {
    name: "Exhaust manifold",
    detail: "Surface temperature is monitored at the outside manifold surface.",
  },
  frame: {
    name: "Test-rig frame",
    detail: "Simplified stationary frame supporting the equipment.",
  },
};
export function createRig() {
  const group = new THREE.Group();
  const colors = {
    green: 0x52948a,
    blue: 0x246989,
    metal: 0x7e8d98,
    dark: 0x1d303c,
    panel: 0xa3adb3,
  };
  function material(color) {
    return new THREE.MeshStandardMaterial({
      color,
      roughness: 0.58,
      metalness: 0.3,
    });
  }
  function add(geometry, color, x, y, z, part, rotation) {
    const m = new THREE.Mesh(geometry, material(color));
    m.position.set(x, y, z);
    if (rotation) m.rotation.set(...rotation);
    m.castShadow = true;
    m.receiveShadow = true;
    m.userData.part = part;
    group.add(m);
    return m;
  }
  const box = (w, h, d, c, x, y, z, p) =>
    add(new THREE.BoxGeometry(w, h, d), c, x, y, z, p);
  const cylinder = (r, h, c, x, y, z, p, rotation) =>
    add(new THREE.CylinderGeometry(r, r, h, 32), c, x, y, z, p, rotation);
  box(4.9, 0.15, 2, colors.dark, 0, 0.2, 0, "frame");
  for (const z of [-0.72, 0.72])
    box(4.7, 0.22, 0.16, colors.metal, 0, 0.39, z, "frame");
  for (const x of [-2, 2])
    for (const z of [-0.7, 0.7])
      box(0.2, 0.22, 0.2, colors.dark, x, 0.08, z, "frame");
  box(0.95, 1.32, 0.8, colors.blue, -1.82, 1.1, -0.22, "panel");
  box(0.95, 1.23, 0.57, colors.panel, -1.82, 2.25, -0.31, "panel");
  box(1.05, 0.08, 0.7, colors.blue, -1.82, 2.91, -0.3, "panel");
  for (const x of [-2.04, -1.63])
    for (const y of [1.98, 2.31, 2.62]) {
      box(0.23, 0.2, 0.035, colors.dark, x, y, -0.005, "panel");
      box(0.16, 0.1, 0.04, 0x95bcb0, x, y + 0.02, 0.02, "panel");
    }
  for (const x of [-2, -1.72])
    cylinder(0.045, 0.04, 0xdaa45b, x, 1.79, 0.03, "panel", [
      Math.PI / 2,
      0,
      0,
    ]);
  box(0.76, 0.86, 0.82, colors.green, -0.32, 0.99, 0, "engine");
  cylinder(0.36, 0.75, colors.green, -0.32, 1.65, 0, "engine");
  box(0.79, 0.14, 0.68, colors.metal, -0.32, 2.09, 0, "engine");
  for (const y of [1.43, 1.57, 1.71, 1.85])
    box(0.78, 0.035, 0.72, 0x3c726b, -0.32, y, 0, "engine");
  cylinder(0.55, 0.2, colors.green, -0.32, 0.94, 0.56, "engine", [
    Math.PI / 2,
    0,
    0,
  ]);
  cylinder(0.38, 0.23, colors.dark, -0.32, 0.94, 0.58, "engine", [
    Math.PI / 2,
    0,
    0,
  ]);
  cylinder(0.18, 0.25, colors.metal, -0.32, 0.94, 0.6, "engine", [
    Math.PI / 2,
    0,
    0,
  ]);
  cylinder(0.24, 0.8, colors.green, -0.4, 2.58, -0.24, "engine", [
    0,
    0,
    Math.PI / 2,
  ]);
  for (const x of [-0.66, -0.16])
    box(0.04, 0.32, 0.05, colors.metal, x, 2.31, -0.24, "engine");
  cylinder(0.06, 0.65, colors.dark, 0.2, 2.12, -0.15, "exhaust");
  cylinder(0.07, 0.47, colors.dark, 0.41, 2.43, -0.15, "exhaust", [
    0,
    0,
    Math.PI / 2,
  ]);
  cylinder(0.44, 1.16, colors.blue, 1.03, 1.06, 0, "generator", [
    0,
    0,
    Math.PI / 2,
  ]);
  cylinder(0.47, 0.36, colors.metal, 1.67, 1.06, 0, "generator", [
    0,
    0,
    Math.PI / 2,
  ]);
  box(0.38, 0.35, 0.6, colors.metal, 1.24, 1.58, 0, "generator");
  for (let i = 0; i < 10; i++) {
    const a = (i * Math.PI * 2) / 10;
    cylinder(
      0.025,
      0.42,
      colors.dark,
      1.7,
      1.06 + Math.cos(a) * 0.36,
      Math.sin(a) * 0.36,
      "generator",
      [0, 0, Math.PI / 2],
    );
  }
  for (const x of [0.72, 1.4])
    box(0.22, 0.3, 0.84, colors.metal, x, 0.63, 0, "generator");
  box(0.65, 0.69, 0.63, colors.blue, 2.1, 0.84, 0.67, "generator");
  cylinder(0.035, 1.2, colors.dark, 0.43, 0.73, -0.32, "generator", [
    0,
    0,
    Math.PI / 2,
  ]);
  return group;
}
