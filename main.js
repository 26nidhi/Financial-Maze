import * as THREE from "three";
import { RGBELoader } from "three/examples/jsm/loaders/RGBELoader.js";
import { EffectComposer } from "three/examples/jsm/postprocessing/EffectComposer.js";
import { RenderPass } from "three/examples/jsm/postprocessing/RenderPass.js";
import { UnrealBloomPass } from "three/examples/jsm/postprocessing/UnrealBloomPass.js";
import { FilmPass } from "three/examples/jsm/postprocessing/FilmPass.js";
import { ShaderPass } from "three/examples/jsm/postprocessing/ShaderPass.js";
import { FXAAShader } from "three/examples/jsm/shaders/FXAAShader.js";
import { PointerLockControls } from "three/examples/jsm/controls/PointerLockControls.js";

import { MazeGenerator } from "./modules/mazeGenerator.js";
import { InteractionManager } from "./modules/interactionManager.js";
import { PlayerControls } from "./playerControls.js";
import { UIManager } from "./ui.js";

// === GLOBALS ===
let scene, camera, renderer, composer;
let player, controls, maze, interactionManager, ui, audio;
let clock = new THREE.Clock();
let score = 750;
let gamePaused = false;
let gameCompleted = false;

// === INIT THREE.JS ===
function init() {
  // Scene
  scene = new THREE.Scene();
  scene.background = new THREE.Color(0x181b23);
  scene.fog = new THREE.FogExp2(0x181b23, 0.032);

  // Camera
  camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    60
  );
  camera.position.set(1.5, 2.1, 1.5);

  // Renderer
  renderer = new THREE.WebGLRenderer({ antialias: true });
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x181b23);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;
  document.getElementById("game-container").appendChild(renderer.domElement);

  // HDRI Skybox
  const loader = new RGBELoader();
  loader.load("assets/hdr/sky.hdr", function (texture) {
    texture.mapping = THREE.EquirectangularReflectionMapping;
    scene.environment = texture;
  });

  // LIGHTING
  const ambient = new THREE.AmbientLight(0xbfdfff, 0.24);
  scene.add(ambient);

  const dir = new THREE.DirectionalLight(0xffffff, 1.15);
  dir.position.set(13, 30, 8);
  dir.castShadow = true;
  dir.shadow.mapSize.set(2048, 2048);
  dir.shadow.camera.left = -30;
  dir.shadow.camera.right = 30;
  dir.shadow.camera.top = 30;
  dir.shadow.camera.bottom = -30;
  scene.add(dir);

  const spot = new THREE.SpotLight(0x6efaff, 1.1, 26, Math.PI / 6, 0.35, 1.1);
  spot.position.set(0, 3.4, 0);
  spot.castShadow = true;
  scene.add(spot);
  spot.target.position.set(0, 1.3, -3);
  scene.add(spot.target);

  // === Maze, Player, Interaction Setup ===
  maze = new MazeGenerator(scene, {
    wallTex: "assets/textures/walls/Bricks092_4K-JPG_Color.jpg",
    floorTex: "assets/textures/floors/WoodFloor053_4K-JPG_Color.jpg",
    doorTex: "assets/textures/doors/Door002_4K-JPG_Color.jpg",
  });

  controls = new PlayerControls(camera, scene, maze);
  player = controls.playerObj;
  spot.parent = player; // headlamp follows player

  interactionManager = new InteractionManager(scene, player, maze, controls);

  ui = new UIManager(maze, controls, interactionManager, {
    onPause: pauseGame,
    onResume: resumeGame,
    onRestart: restartGame,
    onChoice: handleCheckpointChoice,
    onExit: () => window.location.reload(),
  });

  // AUDIO
  audio = {
    correct: new Audio("assets/sounds/correct.wav"),
    wrong: new Audio("assets/sounds/wrong.wav"),
    footsteps: new Audio("assets/sounds/footsteps.wav"),
    door: new Audio("assets/sounds/door.wav"),
  };
  audio.footsteps.loop = true;

  // POST-PROCESSING
  composer = new EffectComposer(renderer);
  composer.addPass(new RenderPass(scene, camera));

  const bloom = new UnrealBloomPass(
    new THREE.Vector2(window.innerWidth, window.innerHeight),
    1.23,
    0.42,
    0.68
  );
  composer.addPass(bloom);

  composer.addPass(new FilmPass(0.15, 0.035, 648, false));

  const fxaa = new ShaderPass(FXAAShader);
  fxaa.uniforms["resolution"].value.set(
    1 / window.innerWidth,
    1 / window.innerHeight
  );
  composer.addPass(fxaa);

  window.addEventListener("resize", onWindowResize);
  animate();
}

// === MAIN GAME LOOP ===
function animate() {
  requestAnimationFrame(animate);
  if (!gamePaused && !gameCompleted) {
    const dt = clock.getDelta();
    controls.update(dt);
    interactionManager.update(dt);
    ui.update(dt, score);
  }
  composer.render();
}

// === CHECKPOINT CHOICE HANDLER ===
function handleCheckpointChoice(checkpoint, isGoodChoice) {
  if (isGoodChoice) {
    score += 500;
    ui.animateScore(score, true);
    audio.correct.currentTime = 0;
    audio.correct.play();
    interactionManager.openDoor(checkpoint.doorId);
  } else {
    score -= 200;
    ui.animateScore(score, false);
    audio.wrong.currentTime = 0;
    audio.wrong.play();
    interactionManager.blockDoor(checkpoint.doorId);
  }
}

// === PAUSE/RESUME/RESTART HANDLERS ===
function pauseGame() {
  gamePaused = true;
  audio.footsteps.pause();
}

function resumeGame() {
  gamePaused = false;
  audio.footsteps.play();
}

function restartGame() {
  window.location.reload();
}

// === WINDOW RESIZE HANDLER ===
function onWindowResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
  composer.setSize(window.innerWidth, window.innerHeight);
}

// === EXIT GATE DETECTION ===
interactionManager &&
  interactionManager.setOnExitReached(() => {
    gameCompleted = true;
    ui.showResults(score);
    audio.footsteps.pause();
  });

// === BOOT ===
window.onload = init;

