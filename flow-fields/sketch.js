// Daniel Shiffman's Coding Train Flow Field ideas are a strong inspiration for this sketch.
// https://thecodingtrain.com/CodingChallenges/024-perlinnoiseflowfield.html

// Global variables for the simulation
let particles = [];
let numParticles = 300; // Now this can be modified through the control panel
let colorOffset = 0;
let paletteInterval = 10; // Interval in seconds for palette switching
let maxParticleSpeed = 4; // Maximum speed for particles
let paletteSwitchInterval;

// Color palette arrays (you can modify these to create different moods)
const colorPalettes = {
  cosmic: [
    [64, 127, 255],  // Light blue
    [255, 64, 255],  // Pink
    [128, 0, 255],   // Purple
    [0, 255, 255]    // Cyan
  ],
  sunset: [
    [255, 128, 0],   // Orange
    [255, 64, 64],   // Red
    [255, 192, 128], // Light orange
    [128, 0, 64]     // Dark red
  ],
  retro: [
    [255, 255, 255], // White
    [255, 192, 128], // Light orange
    [255, 0, 0],     // Red
    [0, 0, 255]      // Blue
  ],
  vibrant: [
    [255, 0, 0],     // Red
    [0, 255, 0],     // Green
    [0, 0, 255],     // Blue
    [255, 255, 0]    // Yellow
  ]
};

let currentPalette = 'cosmic'; // Can switch between palettes

let flowfield;
let scl = 20; // Scale of the grid cells for the flow field
let cols, rows; // Number of columns and rows in the grid

let zoff = 0; // Time dimension for Perlin noise, to make the field dynamic

// --- SETUP FUNCTION --- //
// This function runs once when the sketch starts.
function setup() {
  createCanvas(windowWidth, windowHeight);
  
  // Calculate the number of columns and rows based on canvas size and scale
  cols = floor(width / scl);
  rows = floor(height / scl);
  flowfield = new Array(cols * rows);

  // Create particles and add them to the particles array
  for (let i = 0; i < numParticles; i++) {
    particles[i] = new Particle();
  }
  
  // Initialize controls
  initializeControls();
  
  // Start palette switching
  resetPaletteInterval();

  // Add hover detection for control panel visibility
  let controlPanel = document.getElementById('controlPanel');
  let triggerArea = createDiv('');
  triggerArea.position(0, 0);
  triggerArea.size(100, 100);
  triggerArea.style('position', 'fixed');
  triggerArea.mouseOver(() => {
    controlPanel.classList.add('visible');
  });
  controlPanel.addEventListener('mouseleave', () => {
    controlPanel.classList.remove('visible');
  });
}

// --- DRAW FUNCTION --- //
// This function runs repeatedly, creating the animation.
function draw() {
  // Create a more dynamic background effect
  background(5, 5, 5, 15); // Lower alpha for longer trails

  // Update global color offset
  colorOffset += 0.002;

  // --- Flow Field Calculation ---
  // This section updates the flow field vectors in each frame using Perlin noise.
  // The noise function takes x, y, and z (time) offsets to create a smooth, evolving field.
  let yoff = 0;
  for (let y = 0; y < rows; y++) {
    let xoff = 0;
    for (let x = 0; x < cols; x++) {
      let index = x + y * cols;
      // Calculate angle using Perlin noise. noise() returns values between 0 and 1.
      // Multiply by TWO_PI to get a full range of angles (0 to 360 degrees).
      let angle = noise(xoff, yoff, zoff) * TWO_PI * 2; // Multiply by 2 for more curl
      let v = p5.Vector.fromAngle(angle); // Create a vector from the angle
      v.setMag(0.5); // Set the magnitude (strength) of the vector
      flowfield[index] = v; // Store the vector in the flowfield array
      xoff += 0.1; // Increment x-offset for Perlin noise

      // --- Optional: Draw the flow field vectors (for debugging/visualization) ---
      // stroke(0, 50); // Light gray color for vectors
      // push(); // Save current drawing style
      // translate(x * scl, y * scl); // Move to the grid cell
      // rotate(v.heading()); // Rotate by the vector's angle
      // strokeWeight(1);
      // line(0, 0, scl * 0.8, 0); // Draw a line representing the vector
      // pop(); // Restore previous drawing style
    }
    yoff += 0.1; // Increment y-offset for Perlin noise
  }
  zoff += 0.005; // Increment z-offset (time) for Perlin noise to animate the field

  // --- Particle Update and Display ---
  // Loop through all particles and apply behaviors.
  for (let i = 0; i < particles.length; i++) {
    particles[i].follow(flowfield); // Particle follows the flow field
    particles[i].update(); // Update particle's position
    particles[i].edges(); // Check if particle is off-screen
    particles[i].display(); // Draw the particle
  }
}

// --- PARTICLE CLASS --- //
class Particle {
  constructor() {
    // Initialize particle at a random position
    this.pos = createVector(random(width), random(height));
    this.vel = createVector(0, 0); // Initial velocity
    this.acc = createVector(0, 0); // Initial acceleration
    this.maxSpeed = random(2, 4); // Varied speeds for more dynamic movement
    this.prevPos = this.pos.copy(); // Store previous position for drawing trails
    this.lifespan = 255; // Initial lifespan for fading or rebirth (optional)
    this.colorIndex = floor(random(colorPalettes[currentPalette].length));
    this.size = random(0.5, 2.5); // Varied particle sizes
    this.updateColor(); // Initialize color
  }

  updateColor() {
    let baseColor = colorPalettes[currentPalette][this.colorIndex];
    // Create a shifting effect based on position and time
    let hueShift = map(noise(this.pos.x * 0.01, this.pos.y * 0.01, colorOffset), 0, 1, -20, 20);
    this.color = color(
      baseColor[0] + hueShift,
      baseColor[1] + hueShift * 0.5,
      baseColor[2] + hueShift * 0.25,
      100
    );
  }

  // --- update() method ---
  // Updates the particle's physics (velocity, position).
  update() {
    this.vel.add(this.acc); // Add acceleration to velocity
    this.vel.limit(this.maxSpeed); // Limit velocity to maxSpeed
    this.pos.add(this.vel); // Add velocity to position
    this.acc.mult(0); // Reset acceleration (forces are applied each frame)
    this.updateColor(); // Update color each frame for dynamic effect
    // this.lifespan -= 1.0; // Decrease lifespan (optional)
  }

  // --- follow(vectors) method ---
  // Calculates and applies a steering force based on the flow field.
  follow(vectors) {
    let x = floor(this.pos.x / scl);
    let y = floor(this.pos.y / scl);
    let index = x + y * cols;
    let force = vectors[index]; // Get the vector from the flow field
    if (force) { // Ensure the force vector exists
        this.applyForce(force);
    }
  }

  // --- applyForce(force) method ---
  // Adds a force to the particle's acceleration.
  applyForce(force) {
    this.acc.add(force);
  }

  // --- display() method ---
  // Draws the particle on the canvas.
  display() {
    stroke(this.color);
    strokeWeight(this.size);
    // Draw particle with dynamic alpha based on velocity
    let speed = this.vel.mag();
    let alpha = map(speed, 0, this.maxSpeed, 50, 200);
    stroke(red(this.color), green(this.color), blue(this.color), alpha);
    line(this.pos.x, this.pos.y, this.prevPos.x, this.prevPos.y);
    this.updatePrev(); // Update previous position after drawing
  }

  // --- updatePrev() method ---
  // Updates the previous position of the particle.
  updatePrev() {
    this.prevPos.x = this.pos.x;
    this.prevPos.y = this.pos.y;
  }

  // --- edges() method ---
  // Handles particle behavior at canvas edges (wrap around or rebirth).
  edges() {
    if (this.pos.x > width || this.pos.x < 0 || this.pos.y > height || this.pos.y < 0 || this.lifespan < 0) {
      // Reset particle to a new random position and full lifespan
      this.pos = createVector(random(width), random(height));
      this.vel = createVector(0, 0); // Reset velocity
      this.acc = createVector(0, 0); // Reset acceleration
      this.prevPos = this.pos.copy();
      this.lifespan = 255;
    }
  }
}

// --- windowResized() function --- //
// This p5.js function is called automatically when the browser window is resized.
function windowResized() {
  resizeCanvas(windowWidth, windowHeight);
  // Recalculate grid dimensions and reinitialize flow field if necessary
  cols = floor(width / scl);
  rows = floor(height / scl);
  flowfield = new Array(cols * rows); // Reinitialize flow field array
}

// Function to switch color palette
function switchPalette() {
  let palettes = Object.keys(colorPalettes);
  let currentIndex = palettes.indexOf(currentPalette);
  currentPalette = palettes[(currentIndex + 1) % palettes.length];
  // Update all particles with new colors
  for (let particle of particles) {
    particle.colorIndex = floor(random(colorPalettes[currentPalette].length));
    particle.updateColor();
  }
}

// Reset palette switching interval
function resetPaletteInterval() {
  if (paletteSwitchInterval) {
    clearInterval(paletteSwitchInterval);
  }
  paletteSwitchInterval = setInterval(switchPalette, paletteInterval * 1000);
}

// Function to update particle count
function updateParticleCount(newCount) {
  if (newCount > particles.length) {
    // Add more particles
    for (let i = particles.length; i < newCount; i++) {
      particles.push(new Particle());
    }
  } else {
    // Remove particles
    particles = particles.slice(0, newCount);
  }
  numParticles = newCount;
}

// Function to update palette select dropdown
function updatePaletteSelect() {
  const select = document.getElementById('currentPaletteSelect');
  select.innerHTML = '';
  Object.keys(colorPalettes).forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.text = name;
    option.selected = name === currentPalette;
    select.appendChild(option);
  });
}

// Function to initialize controls
function initializeControls() {
  // Set initial values in controls
  document.getElementById('numParticles').value = numParticles;
  document.getElementById('paletteInterval').value = paletteInterval;
  document.getElementById('particleSpeed').value = maxParticleSpeed;
  
  // Update palette select
  updatePaletteSelect();
  
  // Add event listeners
  document.getElementById('numParticles').addEventListener('change', (e) => {
    const newCount = parseInt(e.target.value);
    updateParticleCount(newCount);
  });
  
  document.getElementById('paletteInterval').addEventListener('change', (e) => {
    paletteInterval = parseInt(e.target.value);
    resetPaletteInterval();
  });
  
  document.getElementById('particleSpeed').addEventListener('input', (e) => {
    maxParticleSpeed = parseFloat(e.target.value);
    particles.forEach(p => p.maxSpeed = random(maxParticleSpeed * 0.5, maxParticleSpeed));
  });
  
  document.getElementById('currentPaletteSelect').addEventListener('change', (e) => {
    currentPalette = e.target.value;
    particles.forEach(p => {
      p.colorIndex = floor(random(colorPalettes[currentPalette].length));
      p.updateColor();
    });
  });
}

// Function to update particle count
function updateParticleCount(newCount) {
  if (newCount > particles.length) {
    // Add more particles
    for (let i = particles.length; i < newCount; i++) {
      particles.push(new Particle());
    }
  } else {
    // Remove particles
    particles = particles.slice(0, newCount);
  }
  numParticles = newCount;
}

// Function to update palette select dropdown
function updatePaletteSelect() {
  const select = document.getElementById('currentPaletteSelect');
  select.innerHTML = '';
  Object.keys(colorPalettes).forEach(name => {
    const option = document.createElement('option');
    option.value = name;
    option.text = name;
    option.selected = name === currentPalette;
    select.appendChild(option);
  });
}

// Function to add new palette
function addNewPalette() {
  const name = document.getElementById('paletteName').value.trim();
  if (!name) {
    alert('Please enter a palette name');
    return;
  }
  
  const colors = Array.from(document.getElementsByClassName('paletteColor'))
    .map(input => {
      const hex = input.value;
      // Convert hex to RGB
      const r = parseInt(hex.slice(1,3), 16);
      const g = parseInt(hex.slice(3,5), 16);
      const b = parseInt(hex.slice(5,7), 16);
      return [r, g, b];
    });
  
  colorPalettes[name] = colors;
  updatePaletteSelect();
  document.getElementById('paletteName').value = '';
}

// Function to reset palette switching interval
function resetPaletteInterval() {
  if (paletteSwitchInterval) {
    clearInterval(paletteSwitchInterval);
  }
  paletteSwitchInterval = setInterval(switchPalette, paletteInterval * 1000);
}

// Modify the setup function to initialize controls
let originalSetup = setup;
setup = function() {
  originalSetup();
  initializeControls();
  resetPaletteInterval();
}

