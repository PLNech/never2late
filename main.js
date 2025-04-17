/**
 * i've never picked a protected flower - Interactive Installation
 * Main application entry point
 */

// Global state management
const state = {
  currentPoem: [],
  poems: [],
  seedWord: "flower", // Default seed word
  patternType: "wallpaper", // Options: "wallpaper", "glass", "flower"
  wallpaperGroup: "p6m", // Default wallpaper symmetry group
  animationSpeed: 0.15,
  colorScheme: { bg: "#333", fg: "#ddd" },
  fontSize: 16,
  unicodeRange: [0x2500, 0x25FF], // Default to box drawing characters
  canvasCount: 3,
  refreshInterval: 5000, // ms between poem updates
  jitterAmount: 0.1,
  asciiDensity: 0.5
};

// Canvas references
let canvases = [];
let contexts = [];
let animations = [];
let lastPoemRefreshTime = 0;

// Animation frame request ID for cancellation
let animationFrameId = null;

// Import modules
window.onload = async function() {
  // Initialize the application
  initializeApp();
  
  // Start the animation loop
  startAnimation();
  
  // Generate the first poem
  await generatePoem(state.seedWord);
  
  // Set up event listeners
  setupEventListeners();
};

async function initializeApp() {
  console.log("Initializing application...");
  
  // Create canvas containers
  createCanvases(state.canvasCount);
  
  // Initialize input controllers
  initializeMIDIController();
  initializeKeyboardController();
  
  // Initialize UI controls
  createControlPanel();
}

function createCanvases(count) {
  const container = document.getElementById('canvas-container');
  container.innerHTML = '';
  canvases = [];
  contexts = [];
  
  for (let i = 0; i < count; i++) {
    const canvas = document.createElement('canvas');
    canvas.id = `canvas-${i}`;
    canvas.width = window.innerWidth;
    canvas.height = window.innerHeight / count;
    canvas.className = 'poem-canvas';
    
    container.appendChild(canvas);
    canvases.push(canvas);
    contexts.push(canvas.getContext('2d'));
  }
}

async function generatePoem(seedWord) {
  try {
    // Use the conceptNet API to get related terms
    const poem = await getRelatedWordsPoem(seedWord);
    state.currentPoem = poem;
    state.poems.push(poem);
    
    // Update the seed word for the next poem
    if (poem.length > 0) {
      const randomLine = poem[Math.floor(Math.random() * poem.length)];
      const words = randomLine.split(' ');
      if (words.length > 0) {
        state.seedWord = words[Math.floor(Math.random() * words.length)];
      }
    }
    
    // Limit the number of stored poems
    if (state.poems.length > 10) {
      state.poems.shift();
    }
    
    // Update the display
    updateDisplay();
    
    console.log("Generated poem with seed word:", seedWord);
    return poem;
  } catch (error) {
    console.error("Error generating poem:", error);
    return [];
  }
}

async function getRelatedWordsPoem(seedWord) {
  // Mock implementation - in a real scenario, you'd call your API
  // This would use the ConceptNet API as in generator.js
  console.log("Getting related words for:", seedWord);
  
  // Simulated API delay
  await new Promise(resolve => setTimeout(resolve, 500));
  
  // For demo purposes, return a simple poem
  return [
    "the " + seedWord + " stands alone in the garden",
    "light catches its edges",
    "i've never picked a protected " + seedWord,
    "the wind carries its scent",
    "seasons change but it remains"
  ];
}

function updateDisplay() {
  // Clear previous animations
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
  }
  
  // Reset animations array
  animations = [];
  
  // Distribute the poem lines across the canvases
  const linesPerCanvas = Math.ceil(state.currentPoem.length / canvases.length);
  
  for (let i = 0; i < canvases.length; i++) {
    const startIndex = i * linesPerCanvas;
    const endIndex = Math.min((i + 1) * linesPerCanvas, state.currentPoem.length);
    const lines = state.currentPoem.slice(startIndex, endIndex);
    
    // Set up animation for this canvas
    animations.push({
      canvas: canvases[i],
      context: contexts[i],
      lines: lines,
      pattern: state.patternType,
      group: state.wallpaperGroup,
      offset: 0,
      speed: state.animationSpeed * (0.8 + Math.random() * 0.4) // Slight variation
    });
  }
  
  // Start the animations
  startAnimation();
}

function startAnimation() {
  function animate() {
    const currentTime = performance.now();
    
    // Check if we should refresh the poem
    if (currentTime - lastPoemRefreshTime > state.refreshInterval) {
      generatePoem(state.seedWord);
      lastPoemRefreshTime = currentTime;
    }
    
    // Update and render each animation
    for (let i = 0; i < animations.length; i++) {
      const anim = animations[i];
      
      if (state.animationSpeed > 0) {
        // Original speed serves as a base rate multiplier
        anim.offset += anim.speed * state.animationSpeed;
      }
      
      // Clear the canvas
      anim.context.clearRect(0, 0, anim.canvas.width, anim.canvas.height);
      
      // Draw the pattern based on the selected type
      if (anim.pattern === "wallpaper") {
        drawPatternWithPoem(anim.canvas.id, anim.group, anim.lines, anim.offset);
      } else if (anim.pattern === "glass") {
        drawGlassWithPoem(anim.canvas.id, anim.lines, anim.offset);
      } else if (anim.pattern === "flower") {
        drawFlowerWithPoem(anim.canvas.id, anim.lines, anim.offset);
      }
    }
    
    // Request the next frame
    animationFrameId = requestAnimationFrame(animate);
  }
  
  // Start the animation loop
  animationFrameId = requestAnimationFrame(animate);
}

function drawPatternWithPoem(canvasId, group, poemLines, offset) {
  // UNCOMMENT FOR DEBUGGING 
  // console.log(`Drawing pattern ${group} with poem on ${canvasId} at offset ${offset}`);
  
  if (window.patternRenderer && typeof window.patternRenderer.renderPattern === 'function') {
    window.patternRenderer.renderPattern(canvasId, group, poemLines, offset);
  } else {
    console.error("Pattern renderer not initialized properly");
  }
}

function drawGlassWithPoem(canvasId, poemLines, offset) {
  if (window.patternRenderer && typeof window.patternRenderer.renderGlass === 'function') {
    window.patternRenderer.renderGlass(canvasId, poemLines, offset);
  } else {
    console.error("Pattern renderer not initialized properly");
  }
}

function drawFlowerWithPoem(canvasId, poemLines, offset) {  
  if (window.patternRenderer && typeof window.patternRenderer.renderFlower === 'function') {
    window.patternRenderer.renderFlower(canvasId, poemLines, offset);
  } else {
    console.error("Pattern renderer not initialized properly");
  }
}
function setupEventListeners() {
  // Window resize handler
  window.addEventListener('resize', () => {
    // Resize all canvases
    for (let i = 0; i < canvases.length; i++) {
      canvases[i].width = window.innerWidth;
      canvases[i].height = window.innerHeight / canvases.length;
    }
  });
  
  // Other event listeners can be added here
}

function createControlPanel() {
  const panel = document.createElement('div');
  panel.id = 'control-panel';
  panel.className = 'control-panel';
  
  // Add controls here
  panel.innerHTML = `
    <h3>Pattern Controls</h3>
    <div class="control-group">
      <label for="pattern-type">Pattern Type:</label>
      <select id="pattern-type">
        <option value="wallpaper">Wallpaper</option>
        <option value="glass">Glass</option>
        <option value="flower">Flower</option>
      </select>
    </div>
    
    <div class="control-group wallpaper-controls">
      <label for="wallpaper-group">Wallpaper Group:</label>
      <select id="wallpaper-group">
        <option value="p1">p1</option>
        <option value="p2">p2</option>
        <option value="pm">pm</option>
        <option value="pg">pg</option>
        <option value="cm">cm</option>
        <option value="pmm">pmm</option>
        <option value="pmg">pmg</option>
        <option value="pgg">pgg</option>
        <option value="cmm">cmm</option>
        <option value="p4">p4</option>
        <option value="p4m">p4m</option>
        <option value="p4g">p4g</option>
        <option value="p3">p3</option>
        <option value="p3m1">p3m1</option>
        <option value="p31m">p31m</option>
        <option value="p6">p6</option>
        <option value="p6m" selected>p6m</option>
      </select>
    </div>
    
    <div class="control-group">
      <label for="animation-speed">Animation Speed:</label>
      <input type="range" id="animation-speed" min="0" max="2" step="0.1" value="0.5">
    </div>
    
    <div class="control-group">
      <label for="refresh-interval">Poem Refresh (sec):</label>
      <input type="range" id="refresh-interval" min="1" max="30" step="1" value="5">
    </div>
    
    <h3>Current Seed: <span id="current-seed">${state.seedWord}</span></h3>
    <button id="generate-new">Generate New Poem</button>
  `;
  
  document.body.appendChild(panel);
  
  // Add event listeners to controls
  document.getElementById('pattern-type').addEventListener('change', (e) => {
    state.patternType = e.target.value;
    updateDisplay();
  });
  
  document.getElementById('wallpaper-group').addEventListener('change', (e) => {
    state.wallpaperGroup = e.target.value;
    updateDisplay();
  });
  
  document.getElementById('animation-speed').addEventListener('input', (e) => {
    state.animationSpeed = parseFloat(e.target.value);
  });
  
  document.getElementById('refresh-interval').addEventListener('input', (e) => {
    state.refreshInterval = parseInt(e.target.value) * 1000;
  });
  
  document.getElementById('generate-new').addEventListener('click', () => {
    generatePoem(state.seedWord);
  });
}

function initializeMIDIController() {
  // Initialize MIDI if available
  if (navigator.requestMIDIAccess) {
    navigator.requestMIDIAccess()
      .then(onMIDISuccess, onMIDIFailure);
  } else {
    console.log("WebMIDI is not supported in this browser.");
  }
}

function onMIDISuccess(midiAccess) {
  console.log("MIDI access obtained");
  
  // Get lists of available MIDI controllers
  const inputs = midiAccess.inputs.values();
  const outputs = midiAccess.outputs.values();
  
  for (let input = inputs.next(); input && !input.done; input = inputs.next()) {
    // Set up event listeners for MIDI messages
    input.value.onmidimessage = onMIDIMessage;
  }
}

function onMIDIFailure(error) {
  console.error("Failed to access MIDI devices:", error);
}

function onMIDIMessage(message) {
  const [command, note, velocity] = message.data;
  
  // Process various MIDI messages
  if (command >= 144 && command <= 159) {
    // Note On
    handleNoteOn(note, velocity);
  } else if (command >= 128 && command <= 143) {
    // Note Off
    handleNoteOff(note);
  } else if (command >= 176 && command <= 191) {
    // Control Change
    handleControlChange(note, velocity);
  }
}

function handleNoteOn(note, velocity) {
  if (velocity === 0) {
    // Some MIDI devices send Note On with velocity 0 as Note Off
    handleNoteOff(note);
    return;
  }
  
  // Map notes to actions
  // For example, different notes could trigger different patterns
  const noteIndex = note % 17; // 17 wallpaper groups
  state.wallpaperGroup = window.groupNameString[noteIndex];
  updateDisplay();
}

function handleNoteOff(note) {
  // Handle note off events if needed
}

function handleControlChange(control, value) {
  // Map control values to parameters
  switch (control) {
    case 1: // Modulation wheel
      state.animationSpeed = value / 127 * 2; // Scale to 0-2
      break;
    case 7: // Volume
      // Adjust some other parameter
      state.jitterAmount = value / 127;
      break;
    // Add more controls as needed
  }
}

function initializeKeyboardController() {
  // Set up keyboard controls
  document.addEventListener('keydown', (event) => {
    switch (event.key) {
      case ' ':
        // Space bar - generate new poem
        generatePoem(state.seedWord);
        break;
      case 'ArrowUp':
        // Increase animation speed
        state.animationSpeed = Math.min(2, state.animationSpeed + 0.1);
        document.getElementById('animation-speed').value = state.animationSpeed;
        break;
      case 'ArrowDown':
        // Decrease animation speed
        state.animationSpeed = Math.max(0, state.animationSpeed - 0.1);
        document.getElementById('animation-speed').value = state.animationSpeed;
        break;
      case 'ArrowLeft':
        // Previous pattern type
        const patternTypes = ['wallpaper', 'glass', 'flower'];
        let index = patternTypes.indexOf(state.patternType);
        index = (index - 1 + patternTypes.length) % patternTypes.length;
        state.patternType = patternTypes[index];
        document.getElementById('pattern-type').value = state.patternType;
        updateDisplay();
        break;
      case 'ArrowRight':
        // Next pattern type
        const patterns = ['wallpaper', 'glass', 'flower'];
        let patternIndex = patterns.indexOf(state.patternType);
        patternIndex = (patternIndex + 1) % patterns.length;
        state.patternType = patterns[patternIndex];
        document.getElementById('pattern-type').value = state.patternType;
        updateDisplay();
        break;
      // Add more keyboard controls as needed
    }
  });
}
