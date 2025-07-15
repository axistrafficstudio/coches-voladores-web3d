// SkyDrive Flight Simulator - Advanced 3D Flight Experience
// Modern DJI-inspired drone simulator with realistic physics

class FlightSimulator {
    constructor() {
        this.scene = null;
        this.camera = null;
        this.renderer = null;
        this.drone = null;
        this.obstacles = [];
        
        // Flight physics
        this.velocity = { x: 0, y: 0, z: 0 };
        this.acceleration = { x: 0, y: 0, z: 0 };
        this.rotation = { pitch: 0, roll: 0, yaw: 0 };
        
        // Flight parameters
        this.speed = 0.15;
        this.maxSpeed = 2.5;
        this.boostMultiplier = 2.0;
        this.dampening = 0.95;
        
        // Flight metrics
        this.altitude = 0;
        this.battery = 100;
        this.totalDistance = 0;
        this.lastPosition = { x: 0, y: 0, z: 0 };
        this.heading = 0;
        this.gForce = 0;
        this.lastVelocity = { x: 0, y: 0, z: 0 };
        
        // Control states
        this.keys = {};
        this.isLoading = true;
        this.loadingProgress = 0;
        
        // Camera shake
        this.cameraShake = { x: 0, y: 0, z: 0 };
        this.shakeIntensity = 0;
        
        this.init();
    }
    
    async init() {
        this.setupLoading();
        await this.setupScene();
        await this.loadDrone();
        this.createEnvironment();
        this.setupControls();
        this.setupHUD();
        this.startSimulation();
    }
    
    setupLoading() {
        // Simulate loading progress
        const loadingInterval = setInterval(() => {
            this.loadingProgress += Math.random() * 10;
            document.getElementById('loading-progress').style.width = `${Math.min(this.loadingProgress, 100)}%`;
            
            if (this.loadingProgress >= 100) {
                clearInterval(loadingInterval);
                setTimeout(() => {
                    document.getElementById('loading-screen').style.display = 'none';
                    this.isLoading = false;
                    document.getElementById('flight-status').textContent = 'ACTIVE';
                }, 500);
            }
        }, 100);
    }
    
    async setupScene() {
        // Scene
        this.scene = new THREE.Scene();
        this.scene.background = new THREE.Color(0x0a0a0a);
        this.scene.fog = new THREE.FogExp2(0x111111, 0.008);
        
        // Renderer
        const canvas = document.getElementById('simulator-canvas');
        this.renderer = new THREE.WebGLRenderer({ 
            canvas: canvas, 
            antialias: true,
            alpha: true 
        });
        this.renderer.setSize(window.innerWidth, window.innerHeight);
        this.renderer.setPixelRatio(window.devicePixelRatio);
        this.renderer.shadowMap.enabled = true;
        this.renderer.shadowMap.type = THREE.PCFSoftShadowMap;
        this.renderer.outputEncoding = THREE.sRGBEncoding;
        this.renderer.toneMapping = THREE.ACESFilmicToneMapping;
        this.renderer.toneMappingExposure = 1.2;
        
        // Camera
        this.camera = new THREE.PerspectiveCamera(
            75,
            window.innerWidth / window.innerHeight,
            0.1,
            1000
        );
        this.camera.position.set(0, 5, 15);
        
        // Lighting
        this.setupLighting();
    }
    
    setupLighting() {
        // Ambient light
        const ambientLight = new THREE.AmbientLight(0x404040, 0.6);
        this.scene.add(ambientLight);
        
        // Main directional light (sun)
        const directionalLight = new THREE.DirectionalLight(0xffffff, 1.2);
        directionalLight.position.set(50, 100, 50);
        directionalLight.castShadow = true;
        directionalLight.shadow.mapSize.width = 2048;
        directionalLight.shadow.mapSize.height = 2048;
        directionalLight.shadow.camera.near = 0.5;
        directionalLight.shadow.camera.far = 500;
        directionalLight.shadow.camera.left = -100;
        directionalLight.shadow.camera.right = 100;
        directionalLight.shadow.camera.top = 100;
        directionalLight.shadow.camera.bottom = -100;
        this.scene.add(directionalLight);
        
        // Dynamic accent lights
        const orangeLight = new THREE.PointLight(0xff6600, 1.5, 50);
        orangeLight.position.set(20, 10, 0);
        this.scene.add(orangeLight);
        
        const blueLight = new THREE.PointLight(0x0066ff, 1.0, 40);
        blueLight.position.set(-20, 15, -10);
        this.scene.add(blueLight);
        
        // Store lights for animation
        this.lights = { orange: orangeLight, blue: blueLight };
    }
    
    async loadDrone() {
        return new Promise((resolve, reject) => {
            const loader = new THREE.GLTFLoader();
            loader.load('./assets/car.glb', 
                (gltf) => {
                    this.drone = gltf.scene;
                    this.drone.scale.set(1.2, 1.2, 1.2);
                    this.drone.position.set(0, 2, 0);
                    
                    // Enhanced materials
                    this.drone.traverse((child) => {
                        if (child.isMesh) {
                            child.castShadow = true;
                            child.receiveShadow = true;
                            
                            // Enhance material properties
                            if (child.material) {
                                child.material.metalness = 0.8;
                                child.material.roughness = 0.2;
                                child.material.envMapIntensity = 1.5;
                            }
                        }
                    });
                    
                    this.scene.add(this.drone);
                    this.lastPosition = { ...this.drone.position };
                    resolve();
                },
                (progress) => {
                    console.log('Loading progress:', progress);
                },
                (error) => {
                    console.error('Error loading drone model:', error);
                    reject(error);
                }
            );
        });
    }
    
    createEnvironment() {
        // Ground plane
        const groundGeometry = new THREE.PlaneGeometry(200, 200);
        const groundMaterial = new THREE.MeshLambertMaterial({ 
            color: 0x333333,
            transparent: true,
            opacity: 0.8
        });
        const ground = new THREE.Mesh(groundGeometry, groundMaterial);
        ground.rotation.x = -Math.PI / 2;
        ground.receiveShadow = true;
        this.scene.add(ground);
        
        // Particle field (stars/dust)
        this.createParticleField();
        
        // Create obstacles
        this.createObstacles();
        
        // Skybox
        this.createSkybox();
    }
    
    createParticleField() {
        const particleCount = 3000;
        const positions = new Float32Array(particleCount * 3);
        
        for (let i = 0; i < particleCount * 3; i += 3) {
            positions[i] = (Math.random() - 0.5) * 400;     // x
            positions[i + 1] = Math.random() * 200;         // y
            positions[i + 2] = (Math.random() - 0.5) * 400; // z
        }
        
        const particleGeometry = new THREE.BufferGeometry();
        particleGeometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
        
        const particleMaterial = new THREE.PointsMaterial({
            color: 0xff6600,
            size: 0.5,
            opacity: 0.6,
            transparent: true,
            blending: THREE.AdditiveBlending
        });
        
        this.particles = new THREE.Points(particleGeometry, particleMaterial);
        this.scene.add(this.particles);
    }
    
    createObstacles() {
        const obstacleTypes = [
            { geometry: new THREE.BoxGeometry(2, 8, 2), color: 0xff3300 },
            { geometry: new THREE.ConeGeometry(1.5, 6, 8), color: 0xff6600 },
            { geometry: new THREE.CylinderGeometry(1, 1, 10, 8), color: 0xff9900 }
        ];
        
        for (let i = 0; i < 15; i++) {
            const type = obstacleTypes[Math.floor(Math.random() * obstacleTypes.length)];
            const obstacle = new THREE.Mesh(
                type.geometry,
                new THREE.MeshPhongMaterial({ 
                    color: type.color,
                    transparent: true,
                    opacity: 0.8
                })
            );
            
            obstacle.position.set(
                (Math.random() - 0.5) * 100,
                Math.random() * 20 + 5,
                (Math.random() - 0.5) * 100
            );
            
            obstacle.castShadow = true;
            obstacle.receiveShadow = true;
            
            this.obstacles.push(obstacle);
            this.scene.add(obstacle);
        }
    }
    
    createSkybox() {
        const skyGeometry = new THREE.SphereGeometry(300, 32, 32);
        const skyMaterial = new THREE.MeshBasicMaterial({
            color: 0x111111,
            side: THREE.BackSide,
            transparent: true,
            opacity: 0.9
        });
        const sky = new THREE.Mesh(skyGeometry, skyMaterial);
        this.scene.add(sky);
    }
    
    setupControls() {
        // Keyboard controls
        document.addEventListener('keydown', (event) => {
            this.keys[event.code] = true;
            
            // Prevent default browser behavior for arrow keys and space
            if (['ArrowUp', 'ArrowDown', 'ArrowLeft', 'ArrowRight', 'Space'].includes(event.code)) {
                event.preventDefault();
            }
        });
        
        document.addEventListener('keyup', (event) => {
            this.keys[event.code] = false;
        });
        
        // Window resize
        window.addEventListener('resize', () => {
            this.camera.aspect = window.innerWidth / window.innerHeight;
            this.camera.updateProjectionMatrix();
            this.renderer.setSize(window.innerWidth, window.innerHeight);
        });
    }
    
    setupHUD() {
        // HUD elements are already in HTML, we just need to update them
        this.hudElements = {
            speed: document.getElementById('speed-display'),
            altitude: document.getElementById('altitude-display'),
            battery: document.getElementById('battery-display'),
            distance: document.getElementById('distance-display'),
            gforce: document.getElementById('gforce-display'),
            speedIndicator: document.getElementById('speed-indicator'),
            altitudeIndicator: document.getElementById('altitude-indicator'),
            gforceIndicator: document.getElementById('gforce-indicator'),
            gforceFill: document.getElementById('gforce-fill'),
            compassNeedle: document.getElementById('compass-needle'),
            warningPanel: document.getElementById('warning-panel'),
            gpsStatus: document.getElementById('gps-status'),
            flightStatus: document.getElementById('flight-status'),
            signalStrength: document.getElementById('signal-strength')
        };
    }
    
    handleInput() {
        if (!this.drone || this.isLoading) return;
        
        const currentSpeed = this.speed;
        const isBoost = this.keys['Space'];
        const activeSpeed = isBoost ? currentSpeed * this.boostMultiplier : currentSpeed;
        
        // Reset accelerations and rotations
        this.acceleration.x = 0;
        this.acceleration.y = 0;
        this.acceleration.z = 0;
        this.rotation.pitch = 0;
        this.rotation.roll = 0;
        this.rotation.yaw = 0;
        
        // Movement controls
        if (this.keys['ArrowUp']) {
            this.acceleration.z = -activeSpeed;
            this.rotation.pitch = -0.15;
        }
        if (this.keys['ArrowDown']) {
            this.acceleration.z = activeSpeed;
            this.rotation.pitch = 0.15;
        }
        if (this.keys['ArrowLeft']) {
            this.acceleration.x = -activeSpeed;
            this.rotation.roll = -0.15;
        }
        if (this.keys['ArrowRight']) {
            this.acceleration.x = activeSpeed;
            this.rotation.roll = 0.15;
        }
        
        // Vertical movement
        if (this.keys['KeyW']) {
            this.acceleration.y = activeSpeed;
        }
        if (this.keys['KeyS']) {
            this.acceleration.y = -activeSpeed;
        }
        
        // Rotation
        if (this.keys['KeyA']) {
            this.rotation.yaw = -0.02;
        }
        if (this.keys['KeyD']) {
            this.rotation.yaw = 0.02;
        }
        
        // Apply boost effects
        if (isBoost) {
            this.battery = Math.max(0, this.battery - 0.3);
            this.shakeIntensity = 0.8;
        } else {
            this.shakeIntensity *= 0.9;
        }
        
        // Battery drain based on movement
        const movementIntensity = Math.abs(this.acceleration.x) + Math.abs(this.acceleration.y) + Math.abs(this.acceleration.z);
        this.battery = Math.max(0, this.battery - movementIntensity * 0.05);
    }
    
    updatePhysics() {
        if (!this.drone) return;
        
        // Apply acceleration to velocity
        this.velocity.x += this.acceleration.x;
        this.velocity.y += this.acceleration.y;
        this.velocity.z += this.acceleration.z;
        
        // Apply dampening
        this.velocity.x *= this.dampening;
        this.velocity.y *= this.dampening;
        this.velocity.z *= this.dampening;
        
        // Limit max speed
        const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2 + this.velocity.z ** 2);
        if (currentSpeed > this.maxSpeed) {
            const scale = this.maxSpeed / currentSpeed;
            this.velocity.x *= scale;
            this.velocity.y *= scale;
            this.velocity.z *= scale;
        }
        
        // Update position
        const newPosition = {
            x: this.drone.position.x + this.velocity.x,
            y: Math.max(0.5, this.drone.position.y + this.velocity.y), // Prevent going underground
            z: this.drone.position.z + this.velocity.z
        };
        
        // Check collision with obstacles
        if (!this.checkCollisions(newPosition)) {
            this.drone.position.copy(newPosition);
        } else {
            // Stop movement and shake camera on collision
            this.velocity.x *= -0.5;
            this.velocity.y *= -0.5;
            this.velocity.z *= -0.5;
            this.shakeIntensity = 2.0;
            this.showWarning('COLLISION DETECTED!');
        }
        
        // Update rotation with smooth interpolation
        this.drone.rotation.x = THREE.MathUtils.lerp(this.drone.rotation.x, this.rotation.pitch, 0.1);
        this.drone.rotation.z = THREE.MathUtils.lerp(this.drone.rotation.z, this.rotation.roll, 0.1);
        
        // Only update yaw when there's input
        if (this.keys['KeyA'] || this.keys['KeyD']) {
            this.drone.rotation.y += this.rotation.yaw;
        }
        
        // Calculate heading for compass
        this.heading = (this.drone.rotation.y * 180 / Math.PI + 360) % 360;
        
        // Calculate distance traveled
        const distanceMoved = Math.sqrt(
            (this.drone.position.x - this.lastPosition.x) ** 2 +
            (this.drone.position.y - this.lastPosition.y) ** 2 +
            (this.drone.position.z - this.lastPosition.z) ** 2
        );
        this.totalDistance += distanceMoved;
        this.lastPosition = { ...this.drone.position };
        
        // Calculate G-Force based on acceleration changes
        const accelerationChange = Math.sqrt(
            (this.velocity.x - this.lastVelocity.x) ** 2 +
            (this.velocity.y - this.lastVelocity.y) ** 2 +
            (this.velocity.z - this.lastVelocity.z) ** 2
        );
        this.gForce = Math.min(accelerationChange * 20, 5.0); // Scale and limit to 5G
        this.lastVelocity = { ...this.velocity };
        
        // Update altitude
        this.altitude = this.drone.position.y;
    }
    
    checkCollisions(newPosition) {
        const droneRadius = 2;
        
        for (const obstacle of this.obstacles) {
            const distance = Math.sqrt(
                (newPosition.x - obstacle.position.x) ** 2 +
                (newPosition.y - obstacle.position.y) ** 2 +
                (newPosition.z - obstacle.position.z) ** 2
            );
            
            if (distance < droneRadius + 2) {
                return true; // Collision detected
            }
        }
        return false;
    }
    
    updateCamera() {
        if (!this.drone) return;
        
        // Camera follows drone with offset
        const offset = new THREE.Vector3(0, 5, 12);
        const targetPosition = this.drone.position.clone().add(offset);
        
        // Apply camera shake
        if (this.shakeIntensity > 0.1) {
            this.cameraShake.x = (Math.random() - 0.5) * this.shakeIntensity;
            this.cameraShake.y = (Math.random() - 0.5) * this.shakeIntensity;
            this.cameraShake.z = (Math.random() - 0.5) * this.shakeIntensity;
        }
        
        targetPosition.add(this.cameraShake);
        
        // Smooth camera movement
        this.camera.position.lerp(targetPosition, 0.1);
        this.camera.lookAt(this.drone.position);
    }
    
    updateEnvironment() {
        // Animate particles
        if (this.particles) {
            this.particles.rotation.y += 0.001;
        }
        
        // Animate lights
        const time = Date.now() * 0.001;
        if (this.lights) {
            this.lights.orange.position.x = Math.sin(time) * 20;
            this.lights.orange.position.z = Math.cos(time) * 20;
            this.lights.blue.position.x = Math.cos(time * 0.7) * -15;
            this.lights.blue.position.z = Math.sin(time * 0.7) * -15;
        }
    }
    
    updateHUD() {
        if (!this.hudElements) return;
        
        // Calculate current speed in km/h
        const currentSpeed = Math.sqrt(this.velocity.x ** 2 + this.velocity.y ** 2 + this.velocity.z ** 2);
        const speedKmh = Math.round(currentSpeed * 50);
        
        // Update HUD elements
        if (this.hudElements.speed) {
            this.hudElements.speed.innerHTML = `${speedKmh}<span class="metric-unit">KM/H</span>`;
        }
        if (this.hudElements.altitude) {
            this.hudElements.altitude.innerHTML = `${Math.round(this.altitude * 10)}<span class="metric-unit">M</span>`;
        }
        if (this.hudElements.battery) {
            this.hudElements.battery.innerHTML = `${Math.round(this.battery)}<span class="metric-unit">%</span>`;
        }
        if (this.hudElements.distance) {
            this.hudElements.distance.innerHTML = `${Math.round(this.totalDistance * 10)}<span class="metric-unit">M</span>`;
        }
        if (this.hudElements.gforce) {
            this.hudElements.gforce.innerHTML = `${this.gForce.toFixed(1)}<span class="metric-unit">G</span>`;
        }
        
        // Update circular indicators
        if (this.hudElements.speedIndicator) {
            this.hudElements.speedIndicator.textContent = speedKmh;
        }
        if (this.hudElements.altitudeIndicator) {
            this.hudElements.altitudeIndicator.textContent = Math.round(this.altitude * 10);
        }
        if (this.hudElements.gforceIndicator) {
            this.hudElements.gforceIndicator.textContent = this.gForce.toFixed(1);
        }
        
        // Update G-Force bar
        if (this.hudElements.gforceFill) {
            const gforcePercent = Math.min((this.gForce / 5.0) * 100, 100);
            this.hudElements.gforceFill.style.height = `${gforcePercent}%`;
        }
        
        // Update compass
        if (this.hudElements.compassNeedle) {
            this.hudElements.compassNeedle.style.transform = `rotate(${this.heading}deg)`;
        }
        
        // Battery warnings
        if (this.battery < 20) {
            this.showWarning('LOW BATTERY!');
            if (this.hudElements.battery) {
                this.hudElements.battery.style.color = '#ff0000';
            }
        } else {
            if (this.hudElements.battery) {
                this.hudElements.battery.style.color = '#ffffff';
            }
        }
        
        // Update status indicators
        if (this.battery < 10) {
            if (this.hudElements.flightStatus) {
                this.hudElements.flightStatus.textContent = 'CRITICAL';
            }
        } else if (currentSpeed > 1.5) {
            if (this.hudElements.flightStatus) {
                this.hudElements.flightStatus.textContent = 'HIGH SPEED';
            }
        } else {
            if (this.hudElements.flightStatus) {
                this.hudElements.flightStatus.textContent = 'ACTIVE';
            }
        }
    }
    
    showWarning(message) {
        if (this.hudElements.warningPanel) {
            this.hudElements.warningPanel.textContent = message;
            this.hudElements.warningPanel.style.display = 'block';
            setTimeout(() => {
                this.hudElements.warningPanel.style.display = 'none';
            }, 3000);
        }
    }
    
    animate() {
        requestAnimationFrame(() => this.animate());
        
        this.handleInput();
        this.updatePhysics();
        this.updateCamera();
        this.updateEnvironment();
        this.updateHUD();
        
        this.renderer.render(this.scene, this.camera);
    }
    
    startSimulation() {
        console.log('SkyDrive Flight Simulator initialized successfully!');
        this.initSimulatorControls();
        this.animate();
    }
    
    initSimulatorControls() {
        // Theme toggle for simulator
        const themeToggle = document.getElementById('simulator-toggle-mode');
        const body = document.body;
        
        if (themeToggle) {
            // Check for saved theme or default to dark
            const savedTheme = localStorage.getItem('simulator-theme') || 'dark';
            body.setAttribute('data-theme', savedTheme);
            
            themeToggle.addEventListener('click', () => {
                const currentTheme = body.getAttribute('data-theme');
                const newTheme = currentTheme === 'dark' ? 'light' : 'dark';
                
                body.setAttribute('data-theme', newTheme);
                localStorage.setItem('simulator-theme', newTheme);
                
                // Update scene background based on theme
                if (newTheme === 'light') {
                    this.scene.background = new THREE.Color(0xe0e0e0);
                    if (this.scene.fog) {
                        this.scene.fog = new THREE.FogExp2(0xcccccc, 0.008);
                    }
                } else {
                    this.scene.background = new THREE.Color(0x0a0a0a);
                    if (this.scene.fog) {
                        this.scene.fog = new THREE.FogExp2(0x111111, 0.008);
                    }
                }
                
                // Smooth transition
                body.style.transition = 'all 0.3s ease';
                setTimeout(() => {
                    body.style.transition = '';
                }, 300);
            });
        }
        
        // Spotify integration
        const spotifyButton = document.getElementById('simulator-spotify-button');
        if (spotifyButton) {
            spotifyButton.addEventListener('click', () => {
                window.open('https://open.spotify.com', '_blank');
                
                // Visual feedback
                spotifyButton.style.transform = 'scale(0.95)';
                setTimeout(() => {
                    spotifyButton.style.transform = '';
                }, 150);
            });
            
            // Hover effects
            spotifyButton.addEventListener('mouseenter', () => {
                spotifyButton.style.boxShadow = '0 0 15px rgba(255, 102, 0, 0.4)';
            });
            
            spotifyButton.addEventListener('mouseleave', () => {
                spotifyButton.style.boxShadow = '';
            });
        }
    }
}

// Initialize the flight simulator when page loads
document.addEventListener('DOMContentLoaded', () => {
    new FlightSimulator();
});
