// src/main.js
import * as THREE from "three";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

import { createMaze } from "./maze.js";
import { setupPlayer, updatePlayer, playerPosition } from "./player.js";
import { createDoor, animateDoors, doors } from "./door.js";
import { createCheckpoint, checkpointList } from "./checkpoint.js";

const canvas = document.getElementById("c");
const renderer = new THREE.WebGLRenderer({ canvas, antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.shadowMap.enabled = true;

const scene = new THREE.Scene();
scene.background = new THREE.Color(0x20232a);

// camera
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  2000
);
camera.position.set(0, 1.6, 5);

// lights
const hemi = new THREE.HemisphereLight(0xffffff, 0x444444, 0.6);
scene.add(hemi);
const dir = new THREE.DirectionalLight(0xffffff, 0.6);
dir.position.set(8, 20, 10);
dir.castShadow = true;
scene.add(dir);

// loaders & textures
const loader = new GLTFLoader();
const texLoader = new THREE.TextureLoader();
const floorTex = texLoader.load("/src/assets/floor_texture.jpg");
floorTex.wrapS = floorTex.wrapT = THREE.RepeatWrapping;
floorTex.repeat.set(20, 20);

const wallTex = texLoader.load("/src/assets/brick_texture.jpg");
wallTex.wrapS = wallTex.wrapT = THREE.RepeatWrapping;
wallTex.repeat.set(4, 2);

const doorTex = texLoader.load("/src/assets/door_texture.jpg");

// floor
const floorMat = new THREE.MeshStandardMaterial({
  map: floorTex,
  roughness: 0.8,
});
const floor = new THREE.Mesh(new THREE.PlaneGeometry(200, 200), floorMat);
floor.rotation.x = -Math.PI / 2;
floor.receiveShadow = true;
scene.add(floor);

// maze group
const mazeGroup = new THREE.Group();
scene.add(mazeGroup);

// create maze, walls use wallTex internally
createMaze(mazeGroup, wallTex, createDoor, createCheckpoint);

// player controls + collision
const controls = new PointerLockControls(camera, document.body);
setupPlayer(camera, controls, mazeGroup);

// HUD & UI references
const scoreEl = document.getElementById("score-val");
const startBtn = document.getElementById("startBtn");
const decisionUI = document.getElementById("decision-ui");
const questionEl = document.getElementById("question");
const optGood = document.getElementById("opt-good");
const optBad = document.getElementById("opt-bad");

let score = 500;
function updateScore(delta) {
  score = Math.max(0, score + delta);
  scoreEl.innerText = score;
}

startBtn.addEventListener("click", () => controls.lock());
controls.addEventListener("lock", () => {
  startBtn.innerText = "Mouse Locked — Play";
});
controls.addEventListener("unlock", () => {
  startBtn.innerText = "Start / Lock Mouse";
});

// Decision handling
let currentCheckpoint = null;
optGood.addEventListener("click", () => {
  if (!currentCheckpoint) return;
  currentCheckpoint.onChoose("good", updateScore);
  decisionUI.classList.add("hidden");
  currentCheckpoint = null;
});
optBad.addEventListener("click", () => {
  if (!currentCheckpoint) return;
  currentCheckpoint.onChoose("bad", updateScore);
  decisionUI.classList.add("hidden");
  currentCheckpoint = null;
});

// game loop
let last = 0;
function animate(t = 0) {
  requestAnimationFrame(animate);
  const dt = (t - last) / 1000;
  last = t;

  updatePlayer(dt, camera, mazeGroup); // move camera with collision
  animateDoors(dt); // door animations

  // detect nearby checkpoint
  const pos = playerPosition();
  for (const cp of checkpointList) {
    if (!cp.used && cp.position.distanceTo(pos) < 1.5) {
      // show decision UI and freeze movement while choosing
      currentCheckpoint = cp;
      questionEl.innerText = cp.question || "Choose";
      decisionUI.classList.remove("hidden");
      break;
    }
  }

  renderer.render(scene, camera);
}

animate();

// resize handling
window.addEventListener("resize", () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
