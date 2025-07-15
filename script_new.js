// Enhanced 3D Scene with 360° Scroll Animation
let scene, camera, renderer, car;
let rotationY = 0;
let scrollRotation = 0;
let targetRotation = 0;

// Initialize 3D Scene
function init() {
  // Scene setup
  scene = new THREE.Scene();
  camera = new THREE.PerspectiveCamera(50, window.innerWidth / window.innerHeight, 0.1, 2000);
  renderer = new THREE.WebGLRenderer({ 
    canvas: document.getElementById('webgl'), 
    alpha: true, 
    antialias: true 
  });
  
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.setClearColor(0x000000, 0);
  renderer.shadowMap.enabled = true;
  renderer.shadowMap.type = THREE.PCFSoftShadowMap;

  // Load the car/drone model
  const loader = new THREE.GLTFLoader();
  loader.load('assets/car.glb', function(gltf) {
    car = gltf.scene;
    car.scale.set(4, 4, 4);
    car.position.set(8, -2, 0);
    car.castShadow = true;
    car.receiveShadow = true;
    scene.add(car);
  }, undefined, function(error) {
    console.warn('Model not found, creating placeholder geometry');
    // Create a placeholder drone/car if model doesn't load
    createPlaceholderDrone();
  });

  // Enhanced lighting setup
  const ambientLight = new THREE.AmbientLight(0x333333, 0.4);
  scene.add(ambientLight);

  // Orange key light
  const keyLight = new THREE.DirectionalLight(0xff6600, 1.2);
  keyLight.position.set(10, 10, 5);
  keyLight.castShadow = true;
  keyLight.shadow.mapSize.width = 2048;
  keyLight.shadow.mapSize.height = 2048;
  scene.add(keyLight);

  // Secondary rim light
  const rimLight = new THREE.DirectionalLight(0xffffff, 0.8);
  rimLight.position.set(-10, 5, -10);
  scene.add(rimLight);

  // Accent point light
  const accentLight = new THREE.PointLight(0xff6600, 0.6, 50);
  accentLight.position.set(0, 8, 15);
  scene.add(accentLight);

  camera.position.set(0, 0, 15);
  animate();
}

// Create placeholder drone geometry if model fails to load
function createPlaceholderDrone() {
  const group = new THREE.Group();
  
  // Main body
  const bodyGeometry = new THREE.CylinderGeometry(0.5, 0.8, 2, 8);
  const bodyMaterial = new THREE.MeshPhongMaterial({ 
    color: 0x333333,
    shininess: 100 
  });
  const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
  group.add(body);
  
  // Propellers
  for (let i = 0; i < 4; i++) {
    const propGeometry = new THREE.CylinderGeometry(1.5, 1.5, 0.1, 16);
    const propMaterial = new THREE.MeshPhongMaterial({ 
      color: 0xff6600,
      transparent: true,
      opacity: 0.7 
    });
    const propeller = new THREE.Mesh(propGeometry, propMaterial);
    
    const angle = (i / 4) * Math.PI * 2;
    propeller.position.x = Math.cos(angle) * 2;
    propeller.position.z = Math.sin(angle) * 2;
    propeller.position.y = 0.5;
    
    group.add(propeller);
  }
  
  car = group;
  car.scale.set(2, 2, 2);
  car.position.set(8, -2, 0);
  scene.add(car);
}

// Animation loop
function animate() {
  requestAnimationFrame(animate);
  
  if (car) {
    // Smooth rotation interpolation
    rotationY += 0.005; // Base rotation
    targetRotation = scrollRotation;
    
    // Smooth interpolation for scroll-based rotation
    car.rotation.y = THREE.MathUtils.lerp(car.rotation.y, targetRotation + rotationY, 0.1);
    
    // Floating animation
    car.position.y = -2 + Math.sin(rotationY * 2) * 0.5;
    
    // Slight tilt based on rotation speed
    car.rotation.x = Math.sin(rotationY * 0.5) * 0.1;
    car.rotation.z = Math.cos(rotationY * 0.3) * 0.05;
  }
  
  renderer.render(scene, camera);
}

// Handle window resize
function handleResize() {
  camera.aspect = window.innerWidth / window.innerHeight;
  camera.updateProjectionMatrix();
  renderer.setSize(window.innerWidth, window.innerHeight);
}

// Enhanced scroll handling with 360° rotation
let lastScrollY = 0;
let ticking = false;

function updateScrollAnimation() {
  const currentScrollY = window.scrollY;
  const maxScroll = document.body.scrollHeight - window.innerHeight;
  const scrollProgress = currentScrollY / maxScroll;
  
  // Calculate 360° rotation based on scroll progress
  scrollRotation = scrollProgress * Math.PI * 4; // 2 full rotations
  
  // Header effects
  const header = document.getElementById('header');
  if (currentScrollY > 100) {
    header.style.background = 'rgba(0, 0, 0, 0.98)';
    header.style.borderBottom = '1px solid #ff6600';
  } else {
    header.style.background = 'rgba(0, 0, 0, 0.95)';
    header.style.borderBottom = '1px solid #333333';
  }
  
  // Section visibility animations
  animateSections();
  
  lastScrollY = currentScrollY;
  ticking = false;
}

function onScroll() {
  if (!ticking) {
    requestAnimationFrame(updateScrollAnimation);
    ticking = true;
  }
}

// Section visibility animations
function animateSections() {
  const sections = document.querySelectorAll('.section');
  const triggerHeight = window.innerHeight * 0.8;
  
  sections.forEach(section => {
    const sectionTop = section.getBoundingClientRect().top;
    
    if (sectionTop < triggerHeight) {
      section.classList.add('visible');
    }
  });
}

// Theme toggle functionality
function initThemeToggle() {
  const toggleButton = document.getElementById('toggle-mode');
  const body = document.body;
  
  // Check for saved theme preference
  const savedTheme = localStorage.getItem('theme');
  if (savedTheme === 'light') {
    body.classList.add('light-mode');
  }
  
  toggleButton.addEventListener('click', function() {
    body.classList.toggle('light-mode');
    
    // Save theme preference
    if (body.classList.contains('light-mode')) {
      localStorage.setItem('theme', 'light');
    } else {
      localStorage.setItem('theme', 'dark');
    }
    
    // Update button icon if needed
    updateThemeIcon();
  });
}

function updateThemeIcon() {
  const toggleButton = document.getElementById('toggle-mode');
  const isLight = document.body.classList.contains('light-mode');
  
  // You can update the icon here if you want different icons for light/dark mode
  if (isLight) {
    toggleButton.style.color = '#666666';
  } else {
    toggleButton.style.color = '#cccccc';
  }
}

// Smooth scroll for navigation links
function initSmoothScroll() {
  const navLinks = document.querySelectorAll('.nav-link');
  
  navLinks.forEach(link => {
    link.addEventListener('click', function(e) {
      e.preventDefault();
      
      // Remove active class from all links
      navLinks.forEach(l => l.classList.remove('active'));
      
      // Add active class to clicked link
      this.classList.add('active');
      
      // Smooth scroll to section (you can implement this based on your sections)
      // For now, just update the active state
    });
  });
}

// HUD animation
function animateHUD() {
  const hudLines = document.querySelectorAll('.hud-line');
  
  hudLines.forEach((line, index) => {
    const randomHeight = Math.random() * 60 + 20;
    const animationDelay = index * 200;
    
    setTimeout(() => {
      line.style.height = randomHeight + 'px';
    }, animationDelay);
  });
}

// Parallax effect for hero section
function initParallax() {
  const heroSection = document.querySelector('.hero-section');
  
  if (heroSection) {
    window.addEventListener('scroll', () => {
      const scrolled = window.pageYOffset;
      const rate = scrolled * -0.5;
      
      heroSection.style.transform = `translateY(${rate}px)`;
    });
  }
}

// Button hover effects
function initButtonEffects() {
  const buttons = document.querySelectorAll('.cta-button');
  
  buttons.forEach(button => {
    button.addEventListener('mouseenter', function() {
      this.style.transform = 'translateY(-2px) scale(1.05)';
    });
    
    button.addEventListener('mouseleave', function() {
      this.style.transform = 'translateY(0) scale(1)';
    });
  });
}

// Tech card animations
function initTechAnimations() {
  const techElements = document.querySelectorAll('.tech-line, .tech-circle, .tech-square');
  
  // Add random delays and rotations
  techElements.forEach((element, index) => {
    const randomDelay = Math.random() * 2;
    const randomRotation = Math.random() * 360;
    
    element.style.animationDelay = randomDelay + 's';
    element.style.transform += ` rotate(${randomRotation}deg)`;
  });
}

// Initialize everything when DOM is loaded
document.addEventListener('DOMContentLoaded', function() {
  init();
  initThemeToggle();
  initSmoothScroll();
  initButtonEffects();
  initTechAnimations();
  initParallax();
  
  // Start HUD animation
  setInterval(animateHUD, 3000);
  
  // Initial section animation
  setTimeout(animateSections, 500);
});

// Event listeners
window.addEventListener('resize', handleResize);
window.addEventListener('scroll', onScroll);

// Performance optimization
window.addEventListener('beforeunload', function() {
  if (renderer) {
    renderer.dispose();
  }
});

// Additional utility functions
function lerp(start, end, factor) {
  return start + (end - start) * factor;
}

function clamp(value, min, max) {
  return Math.min(Math.max(value, min), max);
}

// Mouse movement parallax for tech elements
document.addEventListener('mousemove', function(e) {
  const techElements = document.querySelectorAll('.tech-line, .tech-circle, .tech-square');
  const mouseX = e.clientX / window.innerWidth - 0.5;
  const mouseY = e.clientY / window.innerHeight - 0.5;
  
  techElements.forEach((element, index) => {
    const speed = (index + 1) * 0.5;
    const x = mouseX * speed * 20;
    const y = mouseY * speed * 20;
    
    element.style.transform += ` translate(${x}px, ${y}px)`;
  });
});

// Export for potential external use
window.SkyDriveApp = {
  scene,
  camera,
  renderer,
  car,
  updateScrollAnimation,
  animateSections
};
