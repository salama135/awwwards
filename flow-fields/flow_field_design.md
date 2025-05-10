## p5.js Flow Field Simulation: Design Document

### 1. Overview
This document outlines the design for an artistic and refined p5.js flow field simulation. The simulation will feature particles moving in real-time, guided by a dynamic vector field generated using Perlin noise. The goal is to create a visually appealing and smooth animation suitable for a creative coding beginner to understand and modify.

### 2. Flow Field Generation
- **Method:** A 2D grid of vectors will define the flow field.
- **Noise Function:** Perlin noise (`noise()`) will be used to determine the angle of the vectors at each grid point. This creates organic, smooth patterns.
- **Dynamic Field:** The Perlin noise function will incorporate a time dimension (e.g., `noise(x_offset, y_offset, time_offset)`). This `time_offset` will increment slowly in the `draw()` loop, causing the flow field to evolve gradually over time, making the simulation more dynamic and mesmerizing.
- **Resolution:** A `scale` variable will determine the resolution of the grid. A smaller scale means a denser grid and potentially more detailed flow, but also more computation.

### 3. Particle System
- **Particle Class (`Particle`):**
    - **Properties:** Each particle will have `position` (vector), `velocity` (vector), `acceleration` (vector), `maxSpeed` (to limit velocity), and `lifespan`.
    - **Constructor:** `constructor(x, y)` will initialize a particle at a random position on the canvas (or a specific starting point if desired) with an initial lifespan.
    - **`update()` method:** This method will be called in each frame to:
        - Add acceleration to velocity.
        - Limit velocity to `maxSpeed`.
        - Add velocity to position.
        - Reset acceleration to zero (as forces are applied per frame).
        - Decrease `lifespan`.
    - **`follow(vectors)` method:** This method will determine the force influencing the particle:
        - Find the appropriate vector in the flow field grid based on the particle's current position.
        - Apply this vector as a steering force to the particle's acceleration.
    - **`edges()` method:** This method will handle what happens when particles reach the canvas boundaries:
        - **Rebirth:** When a particle's `lifespan` runs out or it moves off-screen, it will be reset to a new random position on the canvas with a full `lifespan`. This ensures a continuous flow of particles.
    - **`display()` method:** This method will draw the particle on the canvas.
        - **Appearance:** Particles will be rendered as small, semi-transparent circles or points.
        - **Trails:** To create an artistic trail effect, particles will draw a short line from their previous position to their current position, or the background will not be fully cleared each frame, allowing faint traces of previous frames to remain.

### 4. Artistic Aesthetics
- **Color Palette:**
    - **Background:** A dark, desaturated color (e.g., very dark blue `#0A0F29` or near-black `#050505`). The background will be drawn with a low alpha value in the `draw()` loop (e.g., `background(5, 5, 5, 25)`) to create a fading trail effect for the particles.
    - **Particles:** Bright, luminous, but slightly desaturated colors to contrast with the dark background. A palette of soft cyans, magentas, and light blues (e.g., `rgba(100, 200, 255, 150)`, `rgba(200, 100, 255, 150)`). Color could also change based on particle velocity or position.
- **Visual Style:** The overall style will aim for a refined, elegant, and somewhat ethereal look. The motion should feel fluid and organic.
- **Particle Density:** The number of particles will be chosen to create a visually rich field without overwhelming the canvas or causing performance issues (e.g., 200-500 particles).

### 5. Real-Time Movement and Performance
- **Optimization:** Calculations within the `Particle` class and flow field updates will be kept efficient.
- **Frame Rate:** The simulation will target a smooth frame rate (ideally 30-60 FPS).
- **Beginner-Friendly Code:** The code will be well-commented and structured to be understandable for someone new to creative coding with p5.js.

### 6. Code Structure
- **`index.html`:**
    - Standard HTML5 boilerplate.
    - Include the p5.js library (CDN link).
    - Include the `sketch.js` file.
    - Basic CSS for full-page canvas if needed.
- **`sketch.js`:**
    - **Global Variables:** `particles` (array), `flowfield` (array), `scl` (scale of the grid), `cols`, `rows`, `zoff` (for 3D Perlin noise time dimension).
    - **`setup()` function:**
        - `createCanvas(windowWidth, windowHeight)`.
        - Initialize `cols` and `rows` based on canvas size and `scl`.
        - Initialize the `flowfield` array.
        - Instantiate particles and add them to the `particles` array.
        - Set initial background color.
    - **`draw()` function:**
        - Optionally, draw a semi-transparent background to create trails (e.g., `background(0, 0, 0, 25)`).
        - Update the `flowfield` vectors using Perlin noise and the incrementing `zoff` for dynamic behavior.
        - Loop through all particles:
            - Call `particle.follow(flowfield)`.
            - Call `particle.update()`.
            - Call `particle.edges()`.
            - Call `particle.display()`.
    - **`Particle` class:** As described in Section 3.
    - **Helper functions:** (Optional) e.g., for resizing the canvas if the window is resized (`windowResized()`).

### 7. Deliverables
- `index.html` file.
- `sketch.js` file.
- A brief instruction on how to run the simulation (e.g., open `index.html` in a browser).
