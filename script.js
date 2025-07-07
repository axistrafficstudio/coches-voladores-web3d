import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.160.1/build/three.module.js';
import { GLTFLoader } from 'https://cdn.jsdelivr.net/npm/three@0.160.1/examples/jsm/loaders/GLTFLoader.js';

// Escena
const scene = new THREE.Scene();
scene.background = new THREE.Color(0x0a0a0a);

// Cámara
const camera = new THREE.PerspectiveCamera(
  75,
  window.innerWidth / window.innerHeight,
  0.1,
  100
);
camera.position.set(0, 0, 4);

// Renderizador
const renderer = new THREE.WebGLRenderer({
  canvas: document.getElementById('webgl'),
  antialias: true,
  alpha: true,
});
renderer.setSize(window.innerWidth, window.innerHeight);
renderer.setPixelRatio(window.devicePixelRatio);

// Iluminación
const ambientLight = new THREE.AmbientLight(0xffe0b2, 0.7); // luz cálida
scene.add(ambientLight);

const dirLight = new THREE.DirectionalLight(0xffc107, 1.2); // luz cálida intensa
dirLight.position.set(5, 5, 5);
scene.add(dirLight);

// Cargar modelo GLB
const loader = new GLTFLoader();
let car;

loader.load('./assets/car.glb', (gltf) => {
  car = gltf.scene;
  car.scale.set(1, 1, 1);
  car.rotation.y = Math.PI;
  scene.add(car);
});

// Scroll que afecta a posición del modelo
let scrollY = 0;
let targetY = 0;
window.addEventListener('scroll', () => {
  targetY = window.scrollY;
});

// Animación
function animate() {
  requestAnimationFrame(animate);

  // Scroll suave
  scrollY += (targetY - scrollY) * 0.08;

  if (car) {
    car.rotation.y += 0.002;
    car.position.y = -scrollY * 0.002;
  }

  renderer.render(scene, camera);
}
animate();

// Resize responsivo
window.addEventListener('resize', () => {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
});
