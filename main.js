/**
 * i've never picked a protected flower - Interactive Installation
 * Enhanced main application entry point
 * Integrating concepts from Everest Pipkin's original work
 */

// Global state management with expanded options
const state = {
  currentPoem: [],
  poems: [],
  seedWord: "flower", // Default seed word
  patternType: "wallpaper", // Options: "wallpaper", "glass", "flower"
  wallpaperGroup: "p6m", // Default wallpaper symmetry group
  animationSpeed: 0.15,
  colorScheme: { bg: "#222", fg: "#ddd" },
  fontSize: 16,
  unicodeRange: [0x2500, 0x25FF], // Default to box drawing characters
  canvasCount: 3,
  refreshInterval: 10000, // ms between poem updates
  jitterAmount: 0.1,
  asciiDensity: 0.5,
  poemLineCount: 5,
  displayMode: "visual", // Options: "visual", "ascii", "mixed"
  showControls: true,
  fontFamily: "monospace",
  autoUpdate: true,
  useSeed: null // For deterministic generation
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
  // Set a seed for deterministic randomness if desired
  if (state.useSeed !== null && window.DRand && window.DRand.seedDRand) {
    window.DRand.seedDRand(state.useSeed);
  } else if (window.DRand && window.DRand.seedDRand) {
    // Use the time as a seed
    window.DRand.seedDRand(Date.now() % 1000000);
  }
  
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
  console.log("Initializing flower installation...");
  
  // Create canvas containers
  createCanvases(state.canvasCount);
  
  // Initialize input controllers
  initializeMIDIController();
  initializeKeyboardController();
  
  // Create the control panel if enabled
  if (state.showControls) {
    createControlPanel();
  }
  
  // Apply initial styles
  document.body.style.backgroundColor = state.colorScheme.bg;
  document.body.style.color = state.colorScheme.fg;
}

function createCanvases(count) {
  const container = document.getElementById('canvas-container');
  if (!container) return;
  
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
    console.log("Generating poem with seed word:", seedWord);
    
    // Use our enhanced poem generator
    let poem;
    if (window.PoemGenerator && typeof window.PoemGenerator.generatePoem === 'function') {
      poem = window.PoemGenerator.generatePoem(seedWord, state.poemLineCount);
    } else {
      // Fallback for testing
      poem = [
        "i've never picked a protected " + seedWord,
        "light catches its edges",
        "petals fall silently to the ground",
        "the wind carries its scent",
        "seasons change but it remains"
      ];
    }
    
    state.currentPoem = poem;
    state.poems.push(poem);
    
    // Update the seed word for the next poem
    if (window.PoemGenerator && typeof window.PoemGenerator.findNextSeedWord === 'function') {
      state.seedWord = window.PoemGenerator.findNextSeedWord(poem);
    } else if (poem.length > 0) {
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
    
    // Update the current seed word display
    const seedElement = document.getElementById('current-seed');
    if (seedElement) {
      seedElement.textContent = state.seedWord;
    }
    
    // Update the poem display
    const poemElement = document.getElementById('current-poem');
    if (poemElement) {
      poemElement.innerHTML = poem.join('<br>');
    }
    
    return poem;
  } catch (error) {
    console.error("Error generating poem:", error);
    return [];
  }
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
    if (!canvases[i]) continue;
    
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
      // Add slight variation to animation speed
      speed: state.animationSpeed * (0.8 + (window.DRand?.dRandomFloat() || Math.random()) * 0.4)
    });
    
    // Set the current poem for the renderer
    if (window.SimpleRenderer && typeof window.SimpleRenderer.setPoem === 'function') {
      window.SimpleRenderer.initialize(canvases[i].id);
      window.SimpleRenderer.setPoem(lines);
      window.SimpleRenderer.setPatternType(state.patternType);
      window.SimpleRenderer.setWallpaperGroup(state.wallpaperGroup);
    }
  }
  
  // Start the animations
  startAnimation();
}

function startAnimation() {
  function animate() {
    const currentTime = performance.now();
    
    // Check if we should refresh the poem
    if (state.autoUpdate && currentTime - lastPoemRefreshTime > state.refreshInterval) {
      generatePoem(state.seedWord);
      lastPoemRefreshTime = currentTime;
    }
    
    // Update and render each animation
    for (let i = 0; i < animations.length; i++) {
      const anim = animations[i];
      if (!anim || !anim.canvas) continue;
      
      if (state.animationSpeed > 0) {
        // Original speed serves as a base rate multiplier
        anim.offset += anim.speed * state.animationSpeed;
      }
      
      // If using SimpleRenderer, it handles its own rendering
      // Otherwise, fall back to our own rendering logic
      if (!(window.SimpleRenderer && typeof window.SimpleRenderer.setPoem === 'function')) {
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
    }
    
    // Request the next frame
    animationFrameId = requestAnimationFrame(animate);
  }
  
  // Start the animation loop
  animationFrameId = requestAnimationFrame(animate);
}

function drawPatternWithPoem(canvasId, group, poemLines, offset) {
  if (window.drawPattern && typeof window.drawPattern === 'function') {
    window.drawPattern(canvasId, group);
  } else if (window.patternRenderer && typeof window.patternRenderer.renderPattern === 'function') {
    window.patternRenderer.renderPattern(canvasId, group, poemLines, offset);
  } else {
    console.warn("Pattern renderer not initialized properly");
  }
}

function drawGlassWithPoem(canvasId, poemLines, offset) {
  if (window.drawGlass && typeof window.drawGlass === 'function') {
    window.drawGlass(canvasId);
  } else if (window.patternRenderer && typeof window.patternRenderer.renderGlass === 'function') {
    window.patternRenderer.renderGlass(canvasId, poemLines, offset);
  } else {
    console.warn("Glass renderer not initialized properly");
  }
}

function drawFlowerWithPoem(canvasId, poemLines, offset) {  
  if (window.drawFlower && typeof window.drawFlower === 'function') {
    window.drawFlower(canvasId, poemLines);
  } else if (window.patternRenderer && typeof window.patternRenderer.renderFlower === 'function') {
    window.patternRenderer.renderFlower(canvasId, poemLines, offset);
  } else {
    console.warn("Flower renderer not initialized properly");
  }
}

function setupEventListeners() {
  // Window resize handler
  window.addEventListener('resize', () => {
    // Resize all canvases
    for (let i = 0; i < canvases.length; i++) {
      if (canvases[i]) {
        canvases[i].width = window.innerWidth;
        canvases[i].height = window.innerHeight / canvases.length;
      }
    }
    
    // Update the display
    updateDisplay();
  });
}

function createControlPanel() {
  // Check if panel already exists
  let panel = document.getElementById('control-panel');
  if (panel) {
    panel.remove();
  }
  
  panel = document.createElement('div');
  panel.id = 'control-panel';
  panel.className = 'control-panel';
  
  // Add controls
  panel.innerHTML = `
    <h3>i've never picked a protected flower</h3>
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
      <input type="range" id="animation-speed" min="0" max="1" step="0.05" value="${state.animationSpeed}">
    </div>
    
    <div class="control-group">
      <label for="refresh-interval">Poem Refresh (sec):</label>
      <input type="range" id="refresh-interval" min="5" max="60" step="1" value="${state.refreshInterval/1000}">
    </div>
    
    <div class="control-group">
      <label for="poem-line-count">Poem Length:</label>
      <input type="range" id="poem-line-count" min="3" max="9" step="1" value="${state.poemLineCount}">
    </div>
    
    <div class="control-group">
      <label for="auto-update">Auto Update:</label>
      <input type="checkbox" id="auto-update" ${state.autoUpdate ? 'checked' : ''}>
    </div>
    
    <h3>Current Seed: <span id="current-seed">${state.seedWord}</span></h3>
    <button id="generate-new">Generate New Poem</button>
    
    <div class="control-group">
      <button id="hide-controls">Hide Controls</button>
    </div>
  `;
  
  document.body.appendChild(panel);
  
  // Add event listeners to controls
  document.getElementById('pattern-type').value = state.patternType;
  document.getElementById('pattern-type').addEventListener('change', (e) => {
    state.patternType = e.target.value;
    updateDisplay();
  });
  
  document.getElementById('wallpaper-group').value = state.wallpaperGroup;
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
  
  document.getElementById('poem-line-count').addEventListener('input', (e) => {
    state.poemLineCount = parseInt(e.target.value);
  });
  
  document.getElementById('auto-update').addEventListener('change', (e) => {
    state.autoUpdate = e.target.checked;
  });
  
  document.getElementById('generate-new').addEventListener('click', () => {
    generatePoem(state.seedWord);
  });
  
  document.getElementById('hide-controls').addEventListener('click', () => {
    panel.style.display = 'none';
    
    // Create a small button to show controls again
    const showButton = document.createElement('button');
    showButton.id = 'show-controls';
    showButton.innerHTML = 'Show Controls';
    showButton.style.position = 'fixed';
    showButton.style.top = '10px';
    showButton.style.right = '10px';
    showButton.style.zIndex = '1000';
    showButton.style.padding = '5px 10px';
    showButton.style.backgroundColor = '#333';
    showButton.style.color = '#ddd';
    showButton.style.border = '1px solid #555';
    showButton.style.borderRadius = '3px';
    showButton.style.cursor = 'pointer';
    
    showButton.addEventListener('click', () => {
      panel.style.display = 'block';
      showButton.remove();
    });
    
    document.body.appendChild(showButton);
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
  if (window.groupNameString) {
    const noteIndex = note % window.groupNameString.length;
    state.wallpaperGroup = window.groupNameString[noteIndex];
    updateDisplay();
  } else {
    // Fallback if groupNameString is not available
    const groups = ["p1", "pm", "pmm", "pg", "cm", "pmg", "cmm", "pgg", "p2", "p3", "p3m1", "p31m", "p4", "p4m", "p4g", "p6", "p6m"];
    const noteIndex = note % groups.length;
    state.wallpaperGroup = groups[noteIndex];
    updateDisplay();
  }
  
  // Higher notes can generate new poems
  if (note > 84) {
    generatePoem(state.seedWord);
  }
}

function handleNoteOff(note) {
  // Handle note off events if needed
}

function handleControlChange(control, value) {
  // Map control values to parameters
  switch (control) {
    case 1: // Modulation wheel
      state.animationSpeed = value / 127 * 1.0; // Scale to 0-1
      document.getElementById('animation-speed').value = state.animationSpeed;
      break;
    case 7: // Volume
      // Adjust some other parameter
      state.jitterAmount = value / 127;
      break;
    case 10: // Pan
      // Change pattern type
      const patternTypes = ['wallpaper', 'glass', 'flower'];
      const index = Math.floor(value / 127 * patternTypes.length);
      state.patternType = patternTypes[index];
      document.getElementById('pattern-type').value = state.patternType;
      updateDisplay();
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
        state.animationSpeed = Math.min(1, state.animationSpeed + 0.05);
        document.getElementById('animation-speed').value = state.animationSpeed;
        break;
      case 'ArrowDown':
        // Decrease animation speed
        state.animationSpeed = Math.max(0, state.animationSpeed - 0.05);
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
      case 'h':
        // Toggle controls visibility
        const panel = document.getElementById('control-panel');
        if (panel) {
          if (panel.style.display !== 'none') {
            panel.style.display = 'none';
            // Create a show button
            const showButton = document.getElementById('show-controls');
            if (!showButton) {
              const newShowButton = document.createElement('button');
              newShowButton.id = 'show-controls';
              newShowButton.innerHTML = 'Show Controls';
              newShowButton.style.position = 'fixed';
              newShowButton.style.top = '10px';
              newShowButton.style.right = '10px';
              newShowButton.style.zIndex = '1000';
              newShowButton.style.padding = '5px 10px';
              newShowButton.style.backgroundColor = '#333';
              newShowButton.style.color = '#ddd';
              newShowButton.style.border = '1px solid #555';
              newShowButton.style.borderRadius = '3px';
              newShowButton.style.cursor = 'pointer';
              
              newShowButton.addEventListener('click', () => {
                panel.style.display = 'block';
                newShowButton.remove();
              });
              
              document.body.appendChild(newShowButton);
            }
          } else {
            panel.style.display = 'block';
            const showButton = document.getElementById('show-controls');
            if (showButton) {
              showButton.remove();
            }
          }
        }
        break;
    }
  });
}

// Initialize patternRenderer if needed
window.patternRenderer = {
  renderPattern: function(canvasId, groupName, poemLines, offset) {
    if (window.drawPattern) {
      window.drawPattern(canvasId, groupName);
    }
  },
  renderGlass: function(canvasId, poemLines, offset) {
    if (window.drawGlass) {
      window.drawGlass(canvasId);
    }
  },
  renderFlower: function(canvasId, poemLines, offset) {
    if (window.drawFlower) {
      window.drawFlower(canvasId, poemLines);
    }
  }
};

// Export window groups array if not present
if (!window.groupNameString) {
  window.groupNameString = ["p1", "pm", "pmm", "pg", "cm", "pmg", "cmm", "pgg", "p2", "p3", "p3m1", "p31m", "p4", "p4m", "p4g", "p6", "p6m"];
}
