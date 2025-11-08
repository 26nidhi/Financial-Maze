// src/checkpoint.js
import * as THREE from "three";

export const checkpointList = [];

export function createCheckpoint(position, opts = {}) {
  const geom = new THREE.CylinderGeometry(0.5, 0.5, 0.06, 16);
  const mat = new THREE.MeshBasicMaterial({ color: 0xffcc00 });
  const mesh = new THREE.Mesh(geom, mat);
  mesh.rotation.x = -Math.PI / 2;
  mesh.position.copy(position);
  mesh.userData.isCheckpoint = true;

  const cp = {
    mesh,
    position: mesh.position.clone(),
    used: false,
    question: opts.question || "Make a choice",
    onChoose: (choice, updateScore) => {
      if (cp.used) return;
      cp.used = true;
      if (choice === "good") {
        if (opts.goodEffect) opts.goodEffect(updateScore);
      } else {
        if (opts.badEffect) opts.badEffect(updateScore);
      }
      // visual feedback
      mesh.material.color.set(choice === "good" ? 0x2ecc71 : 0xe74c3c);
      // optionally hide
      setTimeout(() => (mesh.visible = false), 800);
    },
  };

  checkpointList.push(cp);
  return cp;
}
