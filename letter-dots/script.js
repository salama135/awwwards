// Dot Matrix Text Effect using Three.js
import * as THREE from 'https://cdn.jsdelivr.net/npm/three@0.121.1/build/three.module.js';
import { EffectComposer } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/postprocessing/EffectComposer.js';
import { RenderPass } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/postprocessing/RenderPass.js';
import { UnrealBloomPass } from 'https://cdn.jsdelivr.net/npm/three@0.121.1/examples/jsm/postprocessing/UnrealBloomPass.js';

// Main class for creating the effect
class DotMatrixText {
  constructor(options = {}) {
    // Default options
    this.options = {
      text: options.text || 'SAMPLE TEXT',
      color: options.color || 0xffffff,
      backgroundColor: options.backgroundColor || 0x000000,
      containerEl: options.container || document.body,
      fontSize: options.fontSize || 60,
      fontFamily: options.fontFamily || 'Arial',
      dotSize: options.dotSize || 2,
      lineWidth: options.lineWidth || 1,
      dotDensity: options.dotDensity || 0.1,
      glowIntensity: options.glowIntensity || 0.8,
      glowSize: options.glowSize || 5,
      width: options.width || window.innerWidth,
      height: options.height || window.innerHeight
    };

    // Initialize
    this.init();
    this.createTextGeometry();
    this.animate();
  }

  init() {
    // Set up scene
    this.scene = new THREE.Scene();
    this.scene.background = new THREE.Color(this.options.backgroundColor);

    // Set up camera
    this.camera = new THREE.PerspectiveCamera(75, this.options.width / this.options.height, 0.1, 1000);
    this.camera.position.z = 100;

    // Set up renderer
    this.renderer = new THREE.WebGLRenderer({ antialias: true });
    this.renderer.setSize(this.options.width, this.options.height);
    this.renderer.setPixelRatio(window.devicePixelRatio);
    this.options.containerEl.appendChild(this.renderer.domElement);

    // Add effects composer for glow effect
    this.composer = this.setupGlowEffect();

    // Handle resize
    window.addEventListener('resize', this.onWindowResize.bind(this), false);
  }

  setupGlowEffect() {
    // Import required libraries
    const composer = new EffectComposer(this.renderer);
    const renderPass = new RenderPass(this.scene, this.camera);
    const bloomPass = new UnrealBloomPass(
      new THREE.Vector2(this.options.width, this.options.height),
      this.options.glowIntensity,
      this.options.glowSize,
      0.1
    );
    composer.addPass(renderPass);
    composer.addPass(bloomPass);
    
    return composer;
  }

  createTextGeometry() {
    // Create canvas for text measurement
    const canvas = document.createElement('canvas');
    const context = canvas.getContext('2d');
    context.font = `${this.options.fontSize}px ${this.options.fontFamily}`;
    
    const textWidth = context.measureText(this.options.text).width;
    const textHeight = this.options.fontSize;
    
    canvas.width = textWidth;
    canvas.height = textHeight * 1.5;
    
    // Draw text to canvas for sampling
    context.font = `${this.options.fontSize}px ${this.options.fontFamily}`;
    context.fillStyle = 'white';
    context.textBaseline = 'top';
    context.fillText(this.options.text, 0, textHeight * 0.25);
    
    // Get pixel data
    const imageData = context.getImageData(0, 0, canvas.width, canvas.height);
    const pixels = imageData.data;
    
    // Prepare materials
    const dotMaterial = new THREE.MeshBasicMaterial({ color: this.options.color });
    const lineMaterial = new THREE.LineBasicMaterial({ 
      color: this.options.color,
      linewidth: this.options.lineWidth,
      linecap: 'round',
      linejoin: 'round'
    });
    
    // Create dots and lines
    this.dots = new THREE.Group();
    this.lines = new THREE.Group();
    
    const points = [];
    const dotGeometry = new THREE.SphereGeometry(this.options.dotSize, 16, 16);
    
    // Sample pixels to create dots
    for (let y = 0; y < canvas.height; y += 1 / this.options.dotDensity) {
      for (let x = 0; x < canvas.width; x += 1 / this.options.dotDensity) {
        const i = (Math.floor(y) * canvas.width + Math.floor(x)) * 4;
        
        // If the pixel is part of the text (not transparent)
        if (pixels[i + 3] > 200) {
          // Calculate position
          const posX = x - textWidth / 2;
          const posY = -(y - textHeight / 2);
          
          // Create dot
          const dot = new THREE.Mesh(dotGeometry, dotMaterial);
          dot.position.set(posX, posY, 0);
          this.dots.add(dot);
          
          // Store point for line creation
          points.push(new THREE.Vector3(posX, posY, 0));
        }
      }
    }
    
    // Create lines connecting nearby dots
    this.createLines(points, lineMaterial);
    
    // Add groups to scene
    this.scene.add(this.dots);
    this.scene.add(this.lines);
    
    // Center the text in the scene
    this.dots.position.x = 0;
    this.lines.position.x = 0;
  }
  
  createLines(points, material) {
    const MAX_DISTANCE = 10; // Maximum distance between points to create a line
    
    for (let i = 0; i < points.length; i++) {
      for (let j = i + 1; j < points.length; j++) {
        const distance = points[i].distanceTo(points[j]);
        
        if (distance < MAX_DISTANCE) {
          const lineGeometry = new THREE.BufferGeometry().setFromPoints([points[i], points[j]]);
          const line = new THREE.Line(lineGeometry, material);
          this.lines.add(line);
        }
      }
    }
  }

  onWindowResize() {
    this.camera.aspect = window.innerWidth / window.innerHeight;
    this.camera.updateProjectionMatrix();
    this.renderer.setSize(window.innerWidth, window.innerHeight);
    this.composer.setSize(window.innerWidth, window.innerHeight);
  }

  animate() {
    requestAnimationFrame(this.animate.bind(this));
    
    // Add subtle animation
    this.dots.rotation.y = Math.sin(Date.now() * 0.0005) * 0.1;
    this.lines.rotation.y = Math.sin(Date.now() * 0.0005) * 0.1;
    
    // Render scene with glow effect
    this.composer.render();
  }
}

// Example usage:
function initializeExample() {
  // Create title text
  const titleText = new DotMatrixText({
    text: 'TAME IMPALA',
    color: 0xffffff,
    container: document.getElementById('text-container'),
    fontSize: 60,
    dotSize: 1.5,
    dotDensity: 0.15,
    glowIntensity: 1,
    glowSize: 2,
    width: window.innerWidth,
    height: window.innerHeight / 2
  });
  
  // Create subtitle text
  const subtitleText = new DotMatrixText({
    text: 'BREATHE DEEPER',
    color: 0xaaff00, // Bright green color
    container: document.getElementById('text-container'),
    fontSize: 50,
    dotSize: 1.5,
    dotDensity: 0.15,
    glowIntensity: 1,
    glowSize: 2,
    width: window.innerWidth,
    height: window.innerHeight / 2
  });
  
  // Position subtitle text below title
  subtitleText.dots.position.y = -40;
  subtitleText.lines.position.y = -40;
}

// Create container div
const container = document.createElement('div');
container.id = 'text-container';
container.style.width = '100%';
container.style.height = '100vh';
container.style.backgroundColor = '#000';
document.body.appendChild(container);

// Initialize when DOM is loaded
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initializeExample);
} else {
  initializeExample();
}