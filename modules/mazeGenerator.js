// MazeGenerator: creates 3D maze, walls, floor, doors, checkpoints
import * as THREE from "three";

export class MazeGenerator {
  constructor(scene, assets) {
    this.scene = scene;
    this.assets = assets;
    this.cells = [];
    this.checkpoints = [];
    this.doors = [];
    this.exitGate = null;
    this._generateMaze();
  }

  _generateMaze() {
    // For demo: simple spiral/rectangular maze matching reference image
    const mazeSize = 9;

    // Material for walls
    const wallMat = new THREE.MeshStandardMaterial({
      map: new THREE.TextureLoader().load(
        "assets/textures/walls/Bricks092_4K-JPG_Color.jpg"
      ),
      normalMap: new THREE.TextureLoader().load(
        "assets/textures/walls/Bricks092_4K-JPG_NormalGL.jpg"
      ),
      roughnessMap: new THREE.TextureLoader().load(
        "assets/textures/walls/Bricks092_4K-JPG_Roughness.jpg"
      ),
      displacementMap: new THREE.TextureLoader().load(
        "assets/textures/walls/Bricks092_4K-JPG_Displacement.jpg"
      ),
      aoMap: new THREE.TextureLoader().load(
        "assets/textures/walls/Bricks092_4K-JPG_AmbientOcclusion.jpg"
      ),
      displacementScale: 0.1, // Adjust for depth effect
      metalness: 0.58,
      roughness: 0.28,
    });

    // Material for floor
    const floorMat = new THREE.MeshStandardMaterial({
      map: new THREE.TextureLoader().load(
        "assets/textures/floors/WoodFloor053_4K-JPG_Color.jpg"
      ),
      normalMap: new THREE.TextureLoader().load(
        "assets/textures/floors/WoodFloor053_4K-JPG_NormalGL.jpg"
      ),
      roughnessMap: new THREE.TextureLoader().load(
        "assets/textures/floors/WoodFloor053_4K-JPG_Roughness.jpg"
      ),
      displacementMap: new THREE.TextureLoader().load(
        "assets/textures/floors/WoodFloor053_4K-JPG_Displacement.jpg"
      ),
      aoMap: new THREE.TextureLoader().load(
        "assets/textures/floors/WoodFloor053_4K-JPG_AmbientOcclusion.jpg"
      ),
      displacementScale: 0.08,
      metalness: 0.26,
      roughness: 0.4,
    });

    // Floor
    const floor = new THREE.Mesh(
      new THREE.PlaneGeometry(mazeSize, mazeSize),
      floorMat
    );
    floor.rotation.x = -Math.PI / 2;
    floor.receiveShadow = true;
    this.scene.add(floor);

    // Walls (spiral/rect path)
    const wallCoords = [
      // (x1, z1, x2, z2) : start/end
      [-4, -4, 4, -4],
      [4, -4, 4, 4],
      [4, 4, -4, 4],
      [-4, 4, -4, -2],
      [-3, -2, 3, -2],
      [3, -2, 3, 3],
      [3, 3, -3, 3],
      [-3, 3, -3, 0],
      [-2, 0, 2, 0],
      [2, 0, 2, 2],
      [2, 2, -2, 2],
      [-2, 2, -2, 1],
      [-1, 1, 1, 1],
      [1, 1, 1, -1],
      [1, -1, -1, -1],
    ];
    for (const [x1, z1, x2, z2] of wallCoords) {
      const dx = x2 - x1;
      const dz = z2 - z1;
      const len = Math.sqrt(dx * dx + dz * dz);
      const wall = new THREE.Mesh(
        new THREE.BoxGeometry(len, 1.9, 0.36),
        wallMat
      );
      wall.castShadow = true;
      wall.receiveShadow = true;
      wall.position.set((x1 + x2) / 2, 0.95, (z1 + z2) / 2);
      if (dx === 0) wall.rotation.y = Math.PI / 2;
      this.scene.add(wall);
      this.cells.push(wall);
    }

    // Checkpoints and doors
    this._addCheckpoint({ x: 0, z: -1.3 }, "Saving vs Spending?", 0);
    this._addCheckpoint({ x: 0, z: 1.2 }, "Loans & EMI?", 1);

    // Exit Gate
    this.exitGate = this._addExitGate({ x: 0, z: 3.8 });
  }

  _addCheckpoint(pos, question, doorId) {
    // Glowing checkpoint door
    const door = new THREE.Mesh(
      new THREE.BoxGeometry(1, 1.8, 0.18),
      new THREE.MeshStandardMaterial({
        map: new THREE.TextureLoader().load(
          "assets/textures/doors/Door002_4K-JPG_Color.jpg"
        ),
        normalMap: new THREE.TextureLoader().load(
          "assets/textures/doors/Door002_4K-JPG_NormalGL.jpg"
        ),
        roughnessMap: new THREE.TextureLoader().load(
          "assets/textures/doors/Door002_4K-JPG_Roughness.jpg"
        ),
        metalnessMap: new THREE.TextureLoader().load(
          "assets/textures/doors/Door002_4K-JPG_Metalness.jpg"
        ),
        displacementMap: new THREE.TextureLoader().load(
          "assets/textures/doors/Door002_4K-JPG_Displacement.jpg"
        ),
        displacementScale: 0.05,
        emissive: 0x22ff99,
        emissiveIntensity: 1.35,
        metalness: 0.5,
        roughness: 0.22,
      })
    );
    door.position.set(pos.x, 0.9, pos.z + 0.55);
    door.castShadow = true;
    door.receiveShadow = true;
    door.name = `door-${doorId}`;
    this.scene.add(door);

    // PointLight for glow
    const glow = new THREE.PointLight(0x36ef8a, 1.6, 3.6, 2.2);
    glow.position.copy(door.position).add(new THREE.Vector3(0, 1, 0));
    this.scene.add(glow);

    // Save door reference
    this.doors[doorId] = door;

    // Checkpoint data
    this.checkpoints.push({
      pos: pos,
      question,
      doorId,
      doorObj: door,
      active: true,
    });
  }

  _addExitGate(pos) {
    const exit = new THREE.Mesh(
      new THREE.BoxGeometry(1.18, 2.3, 0.18),
      new THREE.MeshStandardMaterial({
        color: 0xf8ec59,
        emissive: 0xf8ec59,
        emissiveIntensity: 2.2,
        metalness: 0.12,
        roughness: 0.35,
      })
    );
    exit.position.set(pos.x, 1.15, pos.z);
    exit.castShadow = true;
    this.scene.add(exit);

    const glow = new THREE.PointLight(0xf8ec59, 2.5, 6.5, 2.4);
    glow.position.copy(exit.position).add(new THREE.Vector3(0, 1.3, 0));
    this.scene.add(glow);

    return exit;
  }

  resolveCollision(pos, move, capsule) {
    // Simple bounding box collision with walls & doors
    const next = pos.clone().add(move);
    const box = new THREE.Box3(
      next.clone().add(new THREE.Vector3(-capsule.radius, 0, -capsule.radius)),
      next
        .clone()
        .add(new THREE.Vector3(capsule.radius, capsule.height, capsule.radius))
    );
    for (const w of this.cells.concat(this.doors)) {
      if (!w) continue;
      const wallBox = new THREE.Box3().setFromObject(w);
      if (box.intersectsBox(wallBox)) {
        move.x = 0;
        move.z = 0;
      }
    }
    return move;
  }
}
