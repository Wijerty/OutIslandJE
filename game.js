import * as THREE from 'https://cdn.skypack.dev/three@0.160.0';
import { PointerLockControls } from 'https://cdn.skypack.dev/three@0.160.0/examples/jsm/controls/PointerLockControls.js';

const scene = new THREE.Scene();
scene.fog = new THREE.Fog(0x9ed0ff, 40, 180);

const camera = new THREE.PerspectiveCamera(75, window.innerWidth / window.innerHeight, 0.1, 300);
const renderer = new THREE.WebGLRenderer({ antialias: true });
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
renderer.setClearColor(0x9ed0ff);
renderer.shadowMap.enabled = true;

document.body.appendChild(renderer.domElement);

const controls = new PointerLockControls(camera, renderer.domElement);
const overlay = document.getElementById('overlay');
const startButton = document.getElementById('start');
const cardsLabel = document.getElementById('cards');
const hint = document.getElementById('hint');
const message = document.getElementById('message');

let velocity = new THREE.Vector3();
let direction = new THREE.Vector3();
let canJump = false;
let running = false;

const keys = {
  forward: false,
  backward: false,
  left: false,
  right: false,
};

const islandGroup = new THREE.Group();
scene.add(islandGroup);

const hemiLight = new THREE.HemisphereLight(0xbad7ff, 0x2f3a4d, 0.9);
scene.add(hemiLight);

const sun = new THREE.DirectionalLight(0xffffff, 1.0);
sun.position.set(-30, 60, 10);
sun.castShadow = true;
sun.shadow.mapSize.set(2048, 2048);
scene.add(sun);

const water = new THREE.Mesh(
  new THREE.CircleGeometry(180, 64),
  new THREE.MeshPhongMaterial({ color: 0x1da7c9, transparent: true, opacity: 0.9 })
);
water.rotation.x = -Math.PI / 2;
water.position.y = -2.5;
scene.add(water);

const islandBase = new THREE.Mesh(
  new THREE.CylinderGeometry(55, 80, 20, 64),
  new THREE.MeshStandardMaterial({ color: 0x385b3a })
);
islandBase.castShadow = true;
islandBase.receiveShadow = true;
islandBase.position.y = -2;
islandGroup.add(islandBase);

const beach = new THREE.Mesh(
  new THREE.CylinderGeometry(60, 85, 6, 64),
  new THREE.MeshStandardMaterial({ color: 0xd8c291 })
);
beach.position.y = 4;
beach.castShadow = true;
beach.receiveShadow = true;
islandGroup.add(beach);

const plateau = new THREE.Mesh(
  new THREE.CylinderGeometry(35, 45, 12, 64),
  new THREE.MeshStandardMaterial({ color: 0x4f7b45 })
);
plateau.position.y = 10;
plateau.castShadow = true;
plateau.receiveShadow = true;
islandGroup.add(plateau);

const mansion = new THREE.Group();
const mansionBase = new THREE.Mesh(
  new THREE.BoxGeometry(20, 6, 14),
  new THREE.MeshStandardMaterial({ color: 0xe7e2d4 })
);
const mansionRoof = new THREE.Mesh(
  new THREE.ConeGeometry(12, 4, 4),
  new THREE.MeshStandardMaterial({ color: 0xd4c3a0 })
);
mansionRoof.position.y = 5;
mansionBase.castShadow = true;
mansionBase.receiveShadow = true;
mansionRoof.castShadow = true;
mansion.add(mansionBase, mansionRoof);
mansion.position.set(-5, 16, -6);
islandGroup.add(mansion);

const pool = new THREE.Mesh(
  new THREE.BoxGeometry(10, 1, 6),
  new THREE.MeshStandardMaterial({ color: 0x4fd3ff, transparent: true, opacity: 0.85 })
);
pool.position.set(-12, 14.5, 6);
pool.castShadow = true;
planeShadow(pool);
islandGroup.add(pool);

const pier = new THREE.Group();
const pierDeck = new THREE.Mesh(
  new THREE.BoxGeometry(18, 1, 4),
  new THREE.MeshStandardMaterial({ color: 0x7b5b3b })
);
pierDeck.position.y = 6;
pier.add(pierDeck);
const pierLegs = new THREE.InstancedMesh(
  new THREE.CylinderGeometry(0.4, 0.5, 5, 12),
  new THREE.MeshStandardMaterial({ color: 0x5b4431 }),
  6
);
for (let i = 0; i < 6; i++) {
  const row = i % 3;
  const col = i < 3 ? -1 : 1;
  const matrix = new THREE.Matrix4();
  matrix.setPosition(-6 + row * 6, 3, col * 1.2);
  pierLegs.setMatrixAt(i, matrix);
}
pier.add(pierLegs);
pier.position.set(42, 0, -8);
pier.rotation.y = Math.PI * 0.2;
islandGroup.add(pier);

const boat = new THREE.Group();
const boatBase = new THREE.Mesh(
  new THREE.BoxGeometry(6, 2, 2.5),
  new THREE.MeshStandardMaterial({ color: 0x5f6b75 })
);
boatBase.castShadow = true;
boatBase.receiveShadow = true;
const boatCabin = new THREE.Mesh(
  new THREE.BoxGeometry(3, 1.8, 2),
  new THREE.MeshStandardMaterial({ color: 0xc4d0dd })
);
boatCabin.position.set(0.5, 1.5, 0);
boatCabin.castShadow = true;
boat.add(boatBase, boatCabin);
boat.position.set(52, 2, -8);
scene.add(boat);

function planeShadow(mesh) {
  mesh.castShadow = true;
  mesh.receiveShadow = true;
}

const trees = new THREE.Group();
const trunkGeo = new THREE.CylinderGeometry(0.4, 0.6, 4, 8);
const leafGeo = new THREE.ConeGeometry(2, 4, 8);
const trunkMat = new THREE.MeshStandardMaterial({ color: 0x7a5430 });
const leafMat = new THREE.MeshStandardMaterial({ color: 0x2f7a3d });

for (let i = 0; i < 40; i++) {
  const trunk = new THREE.Mesh(trunkGeo, trunkMat);
  const leaves = new THREE.Mesh(leafGeo, leafMat);
  trunk.castShadow = true;
  trunk.receiveShadow = true;
  leaves.castShadow = true;
  const radius = 20 + Math.random() * 35;
  const angle = Math.random() * Math.PI * 2;
  const heightVariation = Math.random() * 2;
  const x = Math.cos(angle) * radius;
  const z = Math.sin(angle) * radius;
  trunk.position.set(x, 12 + heightVariation, z);
  leaves.position.set(x, 16 + heightVariation, z);
  trees.add(trunk, leaves);
}

islandGroup.add(trees);

const cardPositions = [
  new THREE.Vector3(-8, 17, -2),
  new THREE.Vector3(-2, 17, 8),
  new THREE.Vector3(8, 14, 12),
];

const cardMaterial = new THREE.MeshStandardMaterial({
  color: 0x5ff2ff,
  emissive: 0x2fd2ff,
  emissiveIntensity: 0.8,
});

const cards = cardPositions.map((position) => {
  const mesh = new THREE.Mesh(new THREE.BoxGeometry(1.2, 1.8, 0.2), cardMaterial);
  mesh.position.copy(position);
  mesh.castShadow = true;
  islandGroup.add(mesh);
  return mesh;
});

const dockZone = new THREE.Sphere(new THREE.Vector3(45, 6, -8), 6);

let collected = 0;

const clock = new THREE.Clock();

function showMessage(text) {
  message.textContent = text;
  message.classList.add('visible');
  clearTimeout(showMessage.timeout);
  showMessage.timeout = setTimeout(() => {
    message.classList.remove('visible');
  }, 2400);
}

function updateCardsLabel() {
  cardsLabel.textContent = `Пропуска: ${collected}/3`;
}

function onKeyDown(event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      keys.forward = true;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      keys.left = true;
      break;
    case 'ArrowDown':
    case 'KeyS':
      keys.backward = true;
      break;
    case 'ArrowRight':
    case 'KeyD':
      keys.right = true;
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      running = true;
      break;
    case 'Space':
      if (canJump) {
        velocity.y += 8;
        canJump = false;
      }
      break;
    default:
      break;
  }
}

function onKeyUp(event) {
  switch (event.code) {
    case 'ArrowUp':
    case 'KeyW':
      keys.forward = false;
      break;
    case 'ArrowLeft':
    case 'KeyA':
      keys.left = false;
      break;
    case 'ArrowDown':
    case 'KeyS':
      keys.backward = false;
      break;
    case 'ArrowRight':
    case 'KeyD':
      keys.right = false;
      break;
    case 'ShiftLeft':
    case 'ShiftRight':
      running = false;
      break;
    default:
      break;
  }
}

function beginGame() {
  overlay.style.display = 'none';
  overlay.style.pointerEvents = 'none';
  controls.lock();
  if (!controls.isLocked) {
    showMessage('Кликните по сцене, чтобы продолжить.');
  }
}

startButton.addEventListener('click', beginGame);

renderer.domElement.addEventListener('click', () => {
  if (overlay.style.display === 'none' && !controls.isLocked) {
    controls.lock();
  }
});

controls.addEventListener('lock', () => {
  hint.textContent = 'Осматривайтесь мышью';
});

controls.addEventListener('unlock', () => {
  hint.textContent = 'Нажмите, чтобы начать';
});

document.addEventListener('keydown', onKeyDown);
document.addEventListener('keyup', onKeyUp);

camera.position.set(-15, 18, 30);

const groundRaycaster = new THREE.Raycaster();
const groundDirection = new THREE.Vector3(0, -1, 0);

function checkGround() {
  groundRaycaster.set(camera.position, groundDirection);
  const intersects = groundRaycaster.intersectObject(beach, true);
  if (intersects.length > 0) {
    const distance = intersects[0].distance;
    if (distance < 2.5) {
      camera.position.y = intersects[0].point.y + 2.2;
      velocity.y = Math.max(0, velocity.y);
      canJump = true;
    }
  }
}

function constrainToIsland() {
  const radius = 70;
  const distance = Math.sqrt(camera.position.x ** 2 + camera.position.z ** 2);
  if (distance > radius) {
    const angle = Math.atan2(camera.position.z, camera.position.x);
    camera.position.x = Math.cos(angle) * radius;
    camera.position.z = Math.sin(angle) * radius;
  }
}

function updateCards() {
  cards.forEach((card) => {
    if (!card.visible) return;
    card.rotation.y += 0.02;
    const distance = card.position.distanceTo(camera.position);
    if (distance < 3) {
      card.visible = false;
      collected += 1;
      updateCardsLabel();
      showMessage('Пропуск найден!');
      if (collected === 3) {
        showMessage('Все пропуска собраны. Бегите к причалу!');
      }
    }
  });
}

function checkEscape() {
  if (collected < 3) return;
  if (dockZone.containsPoint(camera.position)) {
    showMessage('Побег удался! Лодка готова.');
    collected = 0;
    cards.forEach((card) => {
      card.visible = true;
    });
    updateCardsLabel();
  }
}

function animate() {
  requestAnimationFrame(animate);
  const delta = clock.getDelta();

  if (controls.isLocked) {
    direction.set(0, 0, 0);
    direction.z = Number(keys.forward) - Number(keys.backward);
    direction.x = Number(keys.right) - Number(keys.left);
    direction.normalize();

    const speed = running ? 18 : 10;

    velocity.x -= velocity.x * 8.0 * delta;
    velocity.z -= velocity.z * 8.0 * delta;
    velocity.y -= 20.0 * delta;

    if (keys.forward || keys.backward) velocity.z -= direction.z * speed * delta;
    if (keys.left || keys.right) velocity.x -= direction.x * speed * delta;

    controls.moveRight(-velocity.x * delta);
    controls.moveForward(-velocity.z * delta);
    camera.position.y += velocity.y * delta;

    checkGround();
    constrainToIsland();
    updateCards();
    checkEscape();
  }

  boat.position.y = 2 + Math.sin(clock.elapsedTime * 1.5) * 0.3;
  water.material.opacity = 0.85 + Math.sin(clock.elapsedTime * 0.6) * 0.05;

  renderer.render(scene, camera);
}

updateCardsLabel();
animate();

window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
