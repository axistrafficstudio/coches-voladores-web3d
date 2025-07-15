// Three.js scene variables
let scene, camera, renderer, car;
let rotationY = 0;

/**
 * Initialize the 3D scene with Three.js
 */
function init() {
  // Create scene, camera, and renderer
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
  renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('webgl'), 
    alpha: true 
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);

  // Load the 3D car model
  const loader = new THREE.GLTFLoader();
  loader.load('assets/car.glb', function(gltf) {
    car = gltf.scene;
    car.scale.set(4, 4, 4);
    car.position.set(8, -2, 0);
    scene.add(car);
  });

  // Setup lighting
  setupLighting();
  
  // Position camera
  camera.position.set(0, 0, 15);
  
  // Start animation loop
  animate();
}

/**
 * Setup three different types of lighting for the scene
 */
function setupLighting() {
  // Ambient light for overall illumination
  const ambientLight = new THREE.AmbientLight(0x3a6cff, 0.4);
  scene.add(ambientLight);

  // Directional light for main lighting
  const directionalLight = new THREE.DirectionalLight(0x5eeaff, 0.8);
  directionalLight.position.set(10, 10, 5);
  scene.add(directionalLight);

  // Point light for accent lighting
  const pointLight = new THREE.PointLight(0xff8c3a, 0.6, 50);
  pointLight.position.set(-10, 5, 10);
  scene.add(pointLight);
}

/**
 * Animation loop for the 3D scene
 */
function animate() {
  requestAnimationFrame(animate);
  
  if (car) {
    // Rotate the car continuously
    rotationY += 0.005;
    car.rotation.y = rotationY;
    
    // Add floating animation
    car.position.y = -2 + Math.sin(rotationY * 2) * 0.5;
  }
  
  renderer.render(scene, camera);
}

/**
 * Handle window resize events
 */
function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

/**
 * Header scroll effects
 */
function initHeaderScrollEffects() {
  let lastScrollY = window.scrollY;
  
  window.addEventListener('scroll', () => {
    const header = document.getElementById('header');
    const currentScrollY = window.scrollY;
    
    if (currentScrollY > 100) {
      header.style.background = 'linear-gradient(90deg, rgba(30, 58, 138, 0.95) 0%, rgba(255, 140, 58, 0.95) 100%)';
      header.style.backdropFilter = 'blur(20px)';
    } else {
      header.style.background = 'linear-gradient(90deg, #1e3a8a 0%, #ff8c3a 100%)';
      header.style.backdropFilter = 'blur(12px)';
    }
    
    lastScrollY = currentScrollY;
  });
}

/**
 * Initialize theme toggle functionality
 */
function initThemeToggle() {
  const toggleButton = document.getElementById('toggle-mode');
  
  if (toggleButton) {
    toggleButton.addEventListener('click', function() {
      this.classList.toggle('light');
      document.body.classList.toggle('light-mode');
    });
  }
}

/**
 * Initialize smooth scrolling for navigation links
 */
function initSmoothScrolling() {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      // Remove active class from all links
      navLinks.forEach(navLink => navLink.classList.remove('active'));
      
      // Add active class to clicked link
      this.classList.add('active');
    });
  });
}

/**
 * Initialize hero section interactions
 */
function initHeroInteractions() {
  const toolIcons = document.querySelectorAll('.tool-icon');
  const mockupButton = document.querySelector('.mockup-button');
  
  // Add hover effects to tool icons
  toolIcons.forEach(icon => {
    icon.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-4px) scale(1.05)';
    });
    
    icon.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });
  
  // Add click effect to mockup button
  if (mockupButton) {
    mockupButton.addEventListener('click', function() {
      console.log('Explore Models clicked');
      // Add your navigation logic here
    });
  }
}

/**
 * Initialize all interactive elements
 */
function initInteractions() {
  initHeaderScrollEffects();
  initThemeToggle();
  initSmoothScrolling();
  initHeroInteractions();
}

/**
 * Main initialization function
 */
function initApp() {
  init(); // Initialize 3D scene
  initInteractions(); // Initialize UI interactions
}

// Event listeners
window.addEventListener('resize', handleResize);
document.addEventListener('DOMContentLoaded', initApp);

// Export functions for potential module usage
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    init,
    animate,
    handleResize,
    initInteractions
  };
}
