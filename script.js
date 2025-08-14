document.addEventListener('DOMContentLoaded', () => {
    // DOM Element References
    const canvas = document.getElementById('universe-canvas');
    const ctx = canvas.getContext('2d');

    const cosmologicalConstantSlider = document.getElementById('cosmological-constant');
    const higgsMassSlider = document.getElementById('higgs-mass');
    const fineStructureConstantSlider = document.getElementById('fine-structure-constant');

    const cosmologicalConstantValueSpan = document.getElementById('cosmological-constant-value');
    const higgsMassValueSpan = document.getElementById('higgs-mass-value');
    const fineStructureConstantValueSpan = document.getElementById('fine-structure-constant-value');

    const startButton = document.getElementById('start-button');
    const resetButton = document.getElementById('reset-button');

    // --- Simulation State ---
    let animationFrameId = null;
    let particles = [];

    // --- Constants Configuration ---
    const constants = {
        cosmological: {
            slider: cosmologicalConstantSlider,
            span: cosmologicalConstantValueSpan,
            value: 1.0, // Default value factor
        },
        higgsMass: {
            slider: higgsMassSlider,
            span: higgsMassValueSpan,
            value: 1.0,
        },
        fineStructure: {
            slider: fineStructureConstantSlider,
            span: fineStructureConstantValueSpan,
            value: 1.0,
        }
    };

    const REAL_WORLD_DEFAULTS = {
        cosmological: 100,
        higgsMass: 100,
        fineStructure: 100
    };

    // --- Main Functions ---

    /**
     * Resizes the canvas to fit its container.
     */
    function resizeCanvas() {
        canvas.width = canvas.clientWidth;
        canvas.height = canvas.clientHeight;
    }

    /**
     * Initializes the simulation state.
     */
    function init() {
        console.log("Initializing simulation...");
        resizeCanvas();
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }
        resetToDefaults();
        // Further initialization logic will go here
    }

    /**
     * Resets all constants and the simulation to their default values.
     */
    function resetToDefaults() {
        console.log("Resetting to default values.");
        cosmologicalConstantSlider.value = REAL_WORLD_DEFAULTS.cosmological;
        higgsMassSlider.value = REAL_WORLD_DEFAULTS.higgsMass;
        fineStructureConstantSlider.value = REAL_WORLD_DEFAULTS.fineStructure;
        updateAllConstantValues();
        // Restart simulation with these defaults
        runSimulation();
    }

    /**
     * Starts or restarts the simulation.
     */
    function runSimulation() {
        console.log("Starting simulation...");
        if (animationFrameId) {
            cancelAnimationFrame(animationFrameId);
        }

        // Create initial particles for the Big Bang
        createParticles();

        // Start the animation loop
        animate();
    }

    /**
     * Creates the initial set of particles.
     */
    function createParticles() {
        particles = []; // Clear existing particles
        const numParticles = 200; // Example number
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        for (let i = 0; i < numParticles; i++) {
            particles.push({
                x: centerX,
                y: centerY,
                vx: (Math.random() - 0.5) * 4, // Initial velocity
                vy: (Math.random() - 0.5) * 4,
                mass: 1 // All particles have the same mass for now
            });
        }
    }

    /**
     * The main animation loop.
     */
    function animate() {
        updateState();
        draw();
        animationFrameId = requestAnimationFrame(animate);
    }

    const SIMULATION_PARAMS = {
        gravity: 0.01,
        particleInteractionRange: 50,
        boundsDamping: -0.5 // Reverse velocity and dampen
    };

    /**
     * Updates the state of all particles based on the constants.
     */
    function updateState() {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;

        // Get current constant values
        const cosmo = constants.cosmological.value;
        const higgs = constants.higgsMass.value;
        const fine = constants.fineStructure.value;

        for (let i = 0; i < particles.length; i++) {
            const p1 = particles[i];

            // 1. Cosmological Constant Force (Expansion/Contraction)
            // Pushes particles away from the center. Strength is related to distance.
            const distFromCenterX = p1.x - centerX;
            const distFromCenterY = p1.y - centerY;
            // A value of 1.0 is neutral. > 1 expands, < 1 contracts.
            const cosmoForceX = (distFromCenterX) * (cosmo - 1.0) * 0.0001;
            const cosmoForceY = (distFromCenterY) * (cosmo - 1.0) * 0.0001;
            p1.vx += cosmoForceX;
            p1.vy += cosmoForceY;

            for (let j = i + 1; j < particles.length; j++) {
                const p2 = particles[j];

                const dx = p2.x - p1.x;
                const dy = p2.y - p1.y;
                const distSq = dx * dx + dy * dy;

                // Avoid singularity and ignore distant particles
                if (distSq < 1 || distSq > SIMULATION_PARAMS.particleInteractionRange * SIMULATION_PARAMS.particleInteractionRange) {
                    continue;
                }

                const dist = Math.sqrt(distSq);
                const force = SIMULATION_PARAMS.gravity / distSq;

                // 2. Gravitational Force (related to Higgs Mass)
                // Stronger gravity with higher higgs mass value.
                const gravityForce = force * higgs;
                const fx = (dx / dist) * gravityForce;
                const fy = (dy / dist) * gravityForce;

                // 3. Fine-Structure "Clumping" Force
                // This is a simplified, short-range force.
                // Ideal value (1.0) allows clumping. Deviations cause repulsion or excessive attraction.
                const fineStructureEffect = 1.0 - Math.abs(1.0 - fine); // Peaks at 1.0, falls off
                const clumpingForce = (1 / dist) * fineStructureEffect * 0.05; // Short-range attraction

                let totalForceX = fx + (dx / dist) * clumpingForce;
                let totalForceY = fy + (dy / dist) * clumpingForce;

                // If fine structure is too high, it should prevent clumping (repulsion)
                if (fine > 1.2) {
                    totalForceX = -fx; // Repulsive
                    totalForceY = -fy;
                }

                p1.vx += totalForceX;
                p1.vy += totalForceY;
                p2.vx -= totalForceX;
                p2.vy -= totalForceY;
            }
        }

        // Update positions and handle boundaries
        particles.forEach(p => {
            p.x += p.vx;
            p.y += p.vy;

            // Simple boundary check
            if (p.x < 0 || p.x > canvas.width) {
                p.vx *= SIMULATION_PARAMS.boundsDamping;
                p.x = Math.max(0, Math.min(canvas.width, p.x));
            }
            if (p.y < 0 || p.y > canvas.height) {
                p.vy *= SIMULATION_PARAMS.boundsDamping;
                p.y = Math.max(0, Math.min(canvas.height, p.y));
            }
        });
    }

    /**
     * Draws everything on the canvas.
     */
    function draw() {
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = 'white';
        particles.forEach(p => {
            ctx.beginPath();
            ctx.arc(p.x, p.y, 1.5, 0, Math.PI * 2);
            ctx.fill();
        });
    }

    /**
      * Updates a constant's value from its slider and updates the display.
     */
    function updateConstantValue(constantName) {
        const config = constants[constantName];
        // The slider goes from 0 to 200. We map this to a factor, e.g., 0x to 2x the "real" value.
        // A slider value of 100 is the baseline (1x).
        const sliderValue = config.slider.value;
        config.value = sliderValue / 100;
        config.span.textContent = config.value.toFixed(2);
    }

    function updateAllConstantValues() {
        updateConstantValue('cosmological');
        updateConstantValue('higgsMass');
        updateConstantValue('fineStructure');
    }

    // --- Event Listeners ---
    window.addEventListener('resize', resizeCanvas);
    startButton.addEventListener('click', runSimulation);
    resetButton.addEventListener('click', resetToDefaults);

    cosmologicalConstantSlider.addEventListener('input', () => updateConstantValue('cosmological'));
    higgsMassSlider.addEventListener('input', () => updateConstantValue('higgsMass'));
    fineStructureConstantSlider.addEventListener('input', () => updateConstantValue('fineStructure'));

    // --- Initial Setup ---
    init();
});
