// Interactive Poetry Installation Controller
// Combines wallpaper.js patterns with generative poetry

// Configuration
const config = {
    transitionTime: 5000,         // Time between poem transitions (ms)
    patternChangeTime: 15000,     // Time between pattern changes (ms)
    interactionTimeout: 30000,    // Time before auto-mode resumes after interaction (ms)
    wordset: ["flower", "petal", "bloom", "garden", "blossom", "rose", "daisy", "sunflower", 
              "tulip", "orchid", "lily", "botanical", "floral", "pollen", "nectar", "fragrance",
              "bouquet", "wildflower", "meadow", "spring", "flora", "pollinate", "seed", "stem",
              "thorn", "dew", "sunshine", "growth", "beauty", "nature", "delicate"]
};

// State management
let state = {
    currentPoem: [],
    poemIndex: 0,
    patternIndex: 0,
    lastInteraction: Date.now(),
    isAutoMode: true,
    currentWord: "",
    relatedWords: [],
    poemCollection: [],
    mouseX: 0,
    mouseY: 0,
    isTransitioning: false
};

// Canvases and contexts
const patternCanvas = document.getElementById('pattern-canvas');
const asciiCanvas = document.getElementById('ascii-canvas');
const patternCtx = patternCanvas.getContext('2d');
const asciiCtx = asciiCanvas.getContext('2d');
const poemContainer = document.getElementById('poem-container');
const cursor = document.getElementById('cursor');

// Simulated poem database (would be loaded from your actual data)
const samplePoems = [
    ["i've never picked a protected flower", "held its petals with gentle fingers", "watching colors fade in the sunlight"],
    ["the garden grows wild in spring", "untamed beauty blooms between fences", "nature claims what we abandon"],
    ["she collects dried flowers", "preserves memories in pressed petals", "a fragile archive of summer"],
    ["pollen drifts through afternoon light", "microscopic journeys of creation", "the invisible dance of flowers"],
    ["a single rose on the windowsill", "defiant against winter's approach", "the last bloom of autumn"],
    ["wildflowers grow through concrete cracks", "persistent reminders of nature's strength", "beauty finds a way"]
];

// Resize canvases to fill window
function resizeCanvases() {
    patternCanvas.width = window.innerWidth;
    patternCanvas.height = window.innerHeight;
    asciiCanvas.width = window.innerWidth;
    asciiCanvas.height = window.innerHeight;
    
    // Redraw on resize
    drawPattern();
}

// Initialize
function init() {
    // Set up canvas dimensions
    resizeCanvases();
    
    // Load initial poem
    state.currentWord = getRandomWord();
    generatePoem();
    
    // Set up interaction handlers
    setupInteractionHandlers();
    
    // Start animation loops
    startAnimationLoops();
    
    // Window resize handler
    window.addEventListener('resize', resizeCanvases);
}

// Get a random word from the wordset
function getRandomWord() {
    return config.wordset[Math.floor(Math.random() * config.wordset.length)];
}

// Simulate fetching related words (would use ConceptNet in full implementation)
function getRelatedWords(word) {
    // This is a simulation - in reality you'd call the ConceptNet API
    const wordMap = {
        "flower": ["petal", "bloom", "garden", "blossom"],
        "petal": ["flower", "soft", "fragile", "color"],
        "bloom": ["flower", "open", "spring", "growth"],
        "garden": ["flower", "grow", "plant", "nature"],
        "blossom": ["tree", "flower", "spring", "beauty"],
        "rose": ["thorn", "red", "love", "flower"],
        "daisy": ["field", "simple", "white", "flower"],
        "sunflower": ["sun", "tall", "yellow", "seed"]
    };
    
    // Return related words if we have them, or random sampling if not
    return wordMap[word.toLowerCase()] || 
           config.wordset.sort(() => Math.random() - 0.5).slice(0, 4);
}

// Generate a poem based on the current word
function generatePoem() {
    if (state.isTransitioning) return;
    
    state.isTransitioning = true;
    poemContainer.style.opacity = 0;
    
    // In a timeout to allow fade-out transition
    setTimeout(() => {
        // In the real implementation, this would call your generator.js logic
        // For now, we're using sample poems
        if (state.poemCollection.length === 0) {
            // When we run out of poems, get a new batch
            state.poemCollection = [...samplePoems].sort(() => Math.random() - 0.5);
        }
        
        // Get the next poem
        state.currentPoem = state.poemCollection.pop();
        
        // Display the poem
        poemContainer.innerHTML = state.currentPoem.map(line => 
            `<div>${line}</div>`
        ).join('');
        
        // Get related words for next poem
        const lastLine = state.currentPoem[state.currentPoem.length - 1];
        const words = lastLine.split(' ').filter(word => word.length > 3);
        state.currentWord = words[Math.floor(Math.random() * words.length)] || getRandomWord();
        state.relatedWords = getRelatedWords(state.currentWord);
        
        // Fade in the poem
        poemContainer.style.opacity = 1;
        state.isTransitioning = false;
        
        // Change pattern
        drawPattern();
        
    }, 1000); // 1s fade out before new poem
}

// Draw the wallpaper pattern
function drawPattern() {
    // Clear the canvas
    patternCtx.clearRect(0, 0, patternCanvas.width, patternCanvas.height);
    
    // Create a div to pass to setupTilingPatterns
    const tempDiv = document.createElement('div');
    tempDiv.style.width = patternCanvas.width + 'px';
    tempDiv.style.height = patternCanvas.height + 'px';
    
    // Call the pattern generator with the current poem
    try {
        // Reset seed based on mouse position for some variety
        seedDRand(state.mouseX * state.mouseY);
        setupTilingPatterns(tempDiv, state.currentPoem.join(' '), 1);
        
        // In the real implementation, we need to capture the canvas created by setupTilingPatterns
        // For now, we'll just draw a placeholder
        const patternCanvasElement = document.getElementById('patternCanvas1');
        if (patternCanvasElement) {
            // Copy the generated canvas to our main canvas
            patternCtx.drawImage(patternCanvasElement, 0, 0, patternCanvas.width, patternCanvas.height);
        }
    } catch (e) {
        console.error("Error generating pattern:", e);
        // Fallback pattern
        patternCtx.fillStyle = '#333';
        patternCtx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
    }
    
    // Generate ASCII art from the pattern
    generateAscii();
}

// Generate ASCII art
function generateAscii() {
    try {
        // This would use jscii.js in the full implementation
        // For now, we'll simulate the effect with a placeholder
        asciiCtx.clearRect(0, 0, asciiCanvas.width, asciiCanvas.height);
        
        // Draw semi-transparent layer
        asciiCtx.fillStyle = 'rgba(0, 0, 0, 0.5)';
        asciiCtx.fillRect(0, 0, asciiCanvas.width, asciiCanvas.height);
        
        // Add some text to simulate ASCII art
        const unicodeChars = ['░', '▒', '▓', '█', '■', '□', '▪', '▫', '▬', '▭', '▮', '▯'];
        const gridSize = 20;
        asciiCtx.font = gridSize + 'px monospace';
        asciiCtx.fillStyle = 'rgba(255, 255, 255, 0.3)';
        
        for (let y = 0; y < asciiCanvas.height; y += gridSize) {
            for (let x = 0; x < asciiCanvas.width; x += gridSize) {
                const charIndex = Math.floor(dRandom() % unicodeChars.length);
                asciiCtx.fillText(unicodeChars[charIndex], x, y);
            }
        }
    } catch (e) {
        console.error("Error generating ASCII:", e);
    }
}

// Set up mouse and touch interactions
function setupInteractionHandlers() {
    // Mouse movement
    document.addEventListener('mousemove', (e) => {
        state.mouseX = e.clientX;
        state.mouseY = e.clientY;
        state.lastInteraction = Date.now();
        state.isAutoMode = false;
        
        // Update cursor position
        cursor.style.left = state.mouseX + 'px';
        cursor.style.top = state.mouseY + 'px';
        
        // Use mouse movement to affect the pattern
        seedDRand((state.mouseX * state.mouseY) % 1000000);
    });
    
    // Mouse click to generate new poem
    document.addEventListener('click', () => {
        generatePoem();
        state.lastInteraction = Date.now();
        state.isAutoMode = false;
    });
    
    // Touch events for mobile
    document.addEventListener('touchmove', (e) => {
        if (e.touches.length > 0) {
            state.mouseX = e.touches[0].clientX;
            state.mouseY = e.touches[0].clientY;
            state.lastInteraction = Date.now();
            state.isAutoMode = false;
            
            // Update cursor position
            cursor.style.left = state.mouseX + 'px';
            cursor.style.top = state.mouseY + 'px';
            
            // Use touch movement to affect the pattern
            seedDRand((state.mouseX * state.mouseY) % 1000000);
        }
    });
    
    document.addEventListener('touchend', () => {
        generatePoem();
        state.lastInteraction = Date.now();
        state.isAutoMode = false;
    });
    
    // Hide the cursor when it's not moving
    document.addEventListener('mouseleave', () => {
        cursor.style.opacity = 0;
    });
    
    document.addEventListener('mouseenter', () => {
        cursor.style.opacity = 1;
    });
}

// Start animation loops
function startAnimationLoops() {
    // Auto mode check
    setInterval(() => {
        if (Date.now() - state.lastInteraction > config.interactionTimeout) {
            state.isAutoMode = true;
        }
        
        // In auto mode, periodically change poems
        if (state.isAutoMode && !state.isTransitioning && 
            Date.now() - state.lastInteraction > config.transitionTime) {
            generatePoem();
            state.lastInteraction = Date.now() - (config.interactionTimeout - 5000); // Keep in auto mode
        }
    }, 1000);
    
    // Pattern animation frame
    function animatePattern() {
        if (!state.isTransitioning) {
            // Subtle pattern updates
            patternCtx.globalAlpha = 0.02;
            patternCtx.fillStyle = `rgba(${Math.random() * 50}, ${Math.random() * 50}, ${Math.random() * 50}, 0.01)`;
            patternCtx.fillRect(0, 0, patternCanvas.width, patternCanvas.height);
            patternCtx.globalAlpha = 1.0;
        }
        
        requestAnimationFrame(animatePattern);
    }
    animatePattern();
}

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', init);
