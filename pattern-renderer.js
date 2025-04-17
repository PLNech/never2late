/**
 * i've never picked a protected flower - Enhanced Pattern Renderer
 * Integrating concepts from Everest Pipkin's original work
 */

// Configuration with expanded options
const config = {
  // Visual settings
  backgroundColor: '#111',
  textColor: '#ddd',
  highlightColor: '#ff5',
  patternDensity: 0.8,
  fontSize: 12,
  // Expanded character sets for rich texture variety
  characterSet: '#@*o+=-.░▒▓█▓▒░', // Background pattern characters
  highlightedChars: '█▓▒░',  // Used for poem emphasis
  accentChars: '◆◇◈○●◐◑⊕⊗⊙⊚', // Special accent characters
  borderChars: '┌┐└┘│─┼┬┴┤├╋╂╀╁╃╄╅╆╇╈╉╊', // Box drawing characters
  
  // Animation settings
  scrollSpeed: 0.2,
  transitionSpeed: 3000,
  refreshInterval: 12000,
  
  // Layout
  gridSize: 16,
  poemLineSpacing: 5,
  
  // Special characters for flowering effect
  flowerChars: '@*o░▒▓█OQ•·°♠♣♥♦⚘❁✿✾✽✼✻✺✹✸✷✶✵✴✳✲✱✰✯✮✭✬',
  wallpaperChars: '▓▒░█▓▒░┌┐└┘│─┼┬┴┤├╋╂╀╁╃╄╅╆╇╈╉╊',
  
  // Character encoding ranges for Unicode patterns
  unicodeRanges: [
    { start: 0x2500, end: 0x257F }, // Box Drawing
    { start: 0x2580, end: 0x259F }, // Block Elements
    { start: 0x25A0, end: 0x25FF }, // Geometric Shapes
    { start: 0x2600, end: 0x26FF }, // Miscellaneous Symbols
    { start: 0x2700, end: 0x27BF }, // Dingbats
    { start: 0x1F300, end: 0x1F5FF }, // Miscellaneous Symbols and Pictographs
  ]
};

// State
let canvas = null;
let ctx = null;
let grid = [];
let currentPoem = [];
let nextPoem = [];
let lastRefreshTime = 0;
let offsetY = 0;
let transitionAlpha = 0;
let transitionProgress = 0;
let isTransitioning = false;
let symbolMap = {};  // Maps coordinates to specific characters

// Pattern state and settings
let wallpaperGroup = "p6m";
let baseRotation = 0;
let patternType = "wallpaper"; // Options: "wallpaper", "glass", "flower"

/**
 * Initialize the renderer
 */
function initialize(canvasId) {
  canvas = document.getElementById(canvasId);
  if (!canvas) return false;
  
  ctx = canvas.getContext('2d');
  
  // Set canvas size to window dimensions
  resizeCanvas();
  window.addEventListener('resize', resizeCanvas);
  
  // Set a random wallpaper group
  if (window.DRand && window.DRand.pick && window.groupNameString) {
    wallpaperGroup = window.DRand.pick(window.groupNameString);
  } else {
    const groups = ["p1", "pm", "pmm", "pg", "cm", "pmg", "cmm", "pgg", "p2", "p3", "p3m1", "p31m", "p4", "p4m", "p4g", "p6", "p6m"];
    wallpaperGroup = groups[Math.floor(Math.random() * groups.length)];
  }
  
  // Set a random base rotation
  if (window.DRand && window.DRand.dRandomFloat) {
    baseRotation = window.DRand.dRandomFloat() * Math.PI * 2;
  } else {
    baseRotation = Math.random() * Math.PI * 2;
  }
  
  // Initialize the character grid
  initializeGrid();
  
  // Start animation loop
  requestAnimationFrame(render);
  
  return true;
}

/**
 * Resize canvas to fit window
 */
function resizeCanvas() {
  if (!canvas) return;
  canvas.width = canvas.clientWidth;
  canvas.height = canvas.clientHeight;
  initializeGrid(); // Reinitialize grid when canvas resizes
}

/**
 * Initialize the character grid with Unicode characters
 */
function initializeGrid() {
  if (!canvas) return;
  
  const cols = Math.ceil(canvas.width / config.gridSize);
  const rows = Math.ceil(canvas.height / config.gridSize);
  
  grid = [];
  
  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      // Randomly select a character from our set
      let char;
      
      if (window.DRand && window.DRand.dRandomFloat) {
        // Use deterministic random if available
        if (window.DRand.dRandomFloat() < 0.1) {
          // Occasionally use special characters from Unicode ranges
          const rangeIndex = window.DRand.dRandomInt(config.unicodeRanges.length);
          const range = config.unicodeRanges[rangeIndex];
          const codePoint = window.DRand.dRandomInRange(range.start, range.end);
          char = String.fromCodePoint(codePoint);
        } else {
          // Usually use our predefined character set
          const charIndex = window.DRand.dRandomInt(config.characterSet.length);
          char = config.characterSet[charIndex];
        }
      } else {
        // Fallback to standard Math.random
        if (Math.random() < 0.1) {
          const rangeIndex = Math.floor(Math.random() * config.unicodeRanges.length);
          const range = config.unicodeRanges[rangeIndex];
          const codePoint = Math.floor(Math.random() * (range.end - range.start + 1)) + range.start;
          char = String.fromCodePoint(codePoint);
        } else {
          const charIndex = Math.floor(Math.random() * config.characterSet.length);
          char = config.characterSet[charIndex];
        }
      }
      
      // Initialize with random values
      row.push({
        char,
        alpha: (window.DRand?.dRandomFloat() || Math.random()) * 0.5 + 0.1,
        size: config.fontSize * ((window.DRand?.dRandomFloat() || Math.random()) * 0.4 + 0.8),
        highlight: false
      });
    }
    grid.push(row);
  }
  
  // Create symbolic patterns (like flowers)
  createSymbolicPatterns();
}

/**
 * Create symbolic patterns in the grid
 */
function createSymbolicPatterns() {
  const rnd = window.DRand || { 
    dRandomFloat: () => Math.random(),
    dRandomInt: (max) => Math.floor(Math.random() * max),
    pick: (arr) => arr[Math.floor(Math.random() * arr.length)]
  };
  
  const flowerCount = rnd.dRandomInt(3) + 2;
  
  for (let f = 0; f < flowerCount; f++) {
    const centerX = rnd.dRandomInt(grid[0]?.length || 10);
    const centerY = rnd.dRandomInt(grid.length || 10);
    const radius = rnd.dRandomInt(10) + 5;
    
    // Create a flower-like pattern
    for (let y = centerY - radius; y <= centerY + radius; y++) {
      for (let x = centerX - radius; x <= centerX + radius; x++) {
        if (y >= 0 && y < grid.length && x >= 0 && x < grid[0].length) {
          const distance = Math.sqrt(Math.pow(x - centerX, 2) + Math.pow(y - centerY, 2));
          
          if (distance <= radius) {
            // Calculate a normalized distance (0-1)
            const normDist = distance / radius;
            
            // Different patterns based on distance
            if (normDist < 0.3) {
              // Center of flower
              symbolMap[`${x},${y}`] = {
                char: rnd.pick(config.flowerChars.substring(0, 4)),
                alpha: 0.8,
                size: config.fontSize * 1.2
              };
            } else if (normDist < 0.7) {
              // Middle area
              symbolMap[`${x},${y}`] = {
                char: rnd.pick(config.flowerChars.substring(4, 10)),
                alpha: 0.7 - normDist * 0.3,
                size: config.fontSize * (1.1 - normDist * 0.3)
              };
            } else if (rnd.dRandomFloat() > 0.7) {
              // Outer petals - more sparse
              symbolMap[`${x},${y}`] = {
                char: rnd.pick(config.flowerChars),
                alpha: 0.5 - normDist * 0.3,
                size: config.fontSize * (1 - normDist * 0.2)
              };
            }
          }
        }
      }
    }
  }
}

/**
 * Set the current poem
 */
function setPoem(poemLines) {
  if (currentPoem.length === 0) {
    // First poem, set directly
    currentPoem = [...poemLines];
  } else {
    // Prepare for transition
    nextPoem = [...poemLines];
    isTransitioning = true;
    transitionProgress = 0;
  }
}

/**
 * Transition to the next poem
 */
function transitionToNextPoem() {
  if (nextPoem.length > 0) {
    // If we already have a next poem ready, start transition
    isTransitioning = true;
    transitionProgress = 0;
  } else {
    // Otherwise, get a new poem from the poem generator
    let newPoem;
    if (window.PoemGenerator && typeof window.PoemGenerator.generatePoem === 'function') {
      const seedWord = window.PoemGenerator.getRandomSeedWord();
      newPoem = window.PoemGenerator.generatePoem(seedWord, 5);
    } else {
      // Fallback poem if generator not available
      newPoem = [
        "i've never picked a protected flower",
        "morning light bathes silent petals",
        "nature speaks in whispered verses",
        "each stem holds memories of rain",
        "blossoms transform beneath the moon"
      ];
    }
    
    nextPoem = [...newPoem];
    isTransitioning = true;
    transitionProgress = 0;
  }
}

/**
 * Set the pattern type
 */
function setPatternType(type) {
  patternType = type;
}

/**
 * Set the wallpaper group for wallpaper patterns
 */
function setWallpaperGroup(group) {
  wallpaperGroup = group;
}

/**
 * Main render loop
 */
function render(timestamp) {
  // Clear canvas
  ctx.fillStyle = config.backgroundColor;
  ctx.fillRect(0, 0, canvas.width, canvas.height);
  
  // Calculate scroll offset
  offsetY = (offsetY + config.scrollSpeed) % config.gridSize;
  
  // Update transition if active
  if (isTransitioning) {
    transitionProgress += 0.01;
    transitionAlpha = Math.sin(transitionProgress * Math.PI);
    
    if (transitionProgress >= 1) {
      // Transition complete
      currentPoem = [...nextPoem];
      nextPoem = [];
      isTransitioning = false;
      transitionProgress = 0;
    }
  }
  
  // Choose rendering method based on pattern type
  switch (patternType) {
    case "wallpaper":
      if (typeof window.drawPattern === 'function') {
        window.drawPattern(canvas.id, wallpaperGroup);
      } else {
        renderGrid(); // Fallback
        renderPoem();
      }
      break;
    case "glass":
      if (typeof window.drawGlass === 'function') {
        window.drawGlass(canvas.id);
      } else {
        renderGrid(); // Fallback
        renderPoem();
      }
      break;
    case "flower":
      if (typeof window.drawFlower === 'function') {
        window.drawFlower(canvas.id, currentPoem);
      } else {
        renderGrid(); // Fallback
        renderPoem();
      }
      break;
    default:
      // Default rendering
      renderGrid();
      renderPoem();
  }
  
  // Continue animation
  requestAnimationFrame(render);
}

/**
 * Render the character grid
 */
function renderGrid() {
  if (!canvas || !ctx || !grid || grid.length === 0) return;
  
  const cols = grid[0].length;
  const rows = grid.length;
  
  ctx.font = `${config.fontSize}px monospace`;
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  for (let y = 0; y < rows; y++) {
    for (let x = 0; x < cols; x++) {
      const cell = grid[y][x];
      
      // Check if this position has a special symbol
      const symbolKey = `${x},${y}`;
      const symbol = symbolMap[symbolKey];
      
      if (symbol) {
        // Render special symbol
        ctx.fillStyle = `rgba(255, 255, 255, ${symbol.alpha})`;
        ctx.font = `${symbol.size}px monospace`;
        ctx.fillText(
          symbol.char,
          x * config.gridSize + config.gridSize/2,
          y * config.gridSize + config.gridSize/2 + offsetY
        );
      } else {
        // Render regular grid character
        ctx.fillStyle = `rgba(200, 200, 200, ${cell.alpha})`;
        ctx.font = `${cell.size}px monospace`;
        ctx.fillText(
          cell.char,
          x * config.gridSize + config.gridSize/2,
          y * config.gridSize + config.gridSize/2 + offsetY
        );
      }
    }
  }
}

/**
 * Render the poem text
 */
function renderPoem() {
  if (currentPoem.length === 0 || !canvas || !ctx) return;
  
  const centerX = canvas.width / 2;
  const startY = canvas.height / 2 - ((currentPoem.length - 1) * config.poemLineSpacing) / 2;
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
  // Update the current poem display for the UI
  updatePoemDisplay(currentPoem);
  
  // Render current poem
  for (let i = 0; i < currentPoem.length; i++) {
    const lineY = startY + i * config.poemLineSpacing;
    renderPoemLine(currentPoem[i], centerX, lineY, 1 - transitionAlpha);
  }
  
  // Render next poem if transitioning
  if (isTransitioning && nextPoem.length > 0) {
    for (let i = 0; i < nextPoem.length; i++) {
      const lineY = startY + i * config.poemLineSpacing;
      renderPoemLine(nextPoem[i], centerX, lineY, transitionAlpha);
    }
  }
}

/**
 * Update the poem display in the UI
 */
function updatePoemDisplay(poem) {
  const poemDisplay = document.getElementById('current-poem');
  if (poemDisplay) {
    poemDisplay.innerHTML = poem.join('<br>');
  }
}

/**
 * Render a single poem line with special text effects
 */
function renderPoemLine(line, x, y, alpha) {
  // Use a larger font size for poem text
  const poemFontSize = config.fontSize * 2.5;
  ctx.font = `bold ${poemFontSize}px monospace`;
  
  // Background shadow/glow for better readability
  ctx.shadowColor = 'rgba(0, 0, 0, 0.7)';
  ctx.shadowBlur = 5;
  
  // Calculate line width for highlight effect
  const lineWidth = ctx.measureText(line).width;
  
  // Draw highlight behind text
  ctx.fillStyle = `rgba(20, 20, 20, ${0.7 * alpha})`;
  ctx.fillRect(
    x - lineWidth/2 - 10,
    y - poemFontSize/2 - 5,
    lineWidth + 20,
    poemFontSize + 10
  );
  
  // Draw text with highlight for certain words
  const words = line.split(' ');
  let currentX = x - lineWidth/2;
  
  for (let i = 0; i < words.length; i++) {
    const word = words[i];
    const wordWidth = ctx.measureText(word + ' ').width;
    
    // Check if this is a key nature/flower word to highlight
    const keyWords = ['flower', 'petal', 'bloom', 'nature', 'garden', 'light', 'rain', 'sun', 'moon', 'seed', 'root', 'blossom', 'scent'];
    const isKeyWord = keyWords.some(key => word.toLowerCase().includes(key));
    
    if (isKeyWord) {
      ctx.fillStyle = `rgba(255, 255, 80, ${alpha})`;
    } else {
      ctx.fillStyle = `rgba(220, 220, 220, ${alpha})`;
    }
    
    ctx.textAlign = 'left';
    ctx.fillText(word, currentX, y);
    currentX += wordWidth;
  }
  
  // Reset shadow
  ctx.shadowBlur = 0;
}

/**
 * Create an ASCII art representation of a poem
 * Inspired by Pipkin's original jscii implementation
 * @param {string[]} poem - The poem to render
 * @param {Object} options - Rendering options
 * @returns {string} ASCII art representation
 */
function createAsciiArt(poem, options = {}) {
  const {
    width = 80,
    height = 40,
    chars = '#@*o+=-.░▒▓█▓▒░ ',
    density = 0.7
  } = options;
  
  // Create a blank canvas of spaces
  const canvas = Array(height).fill().map(() => Array(width).fill(' '));
  
  // Add a border of characters
  for (let x = 0; x < width; x++) {
    canvas[0][x] = '#';
    canvas[height-1][x] = '#';
  }
  
  for (let y = 0; y < height; y++) {
    canvas[y][0] = '#';
    canvas[y][width-1] = '#';
  }
  
  // Place the poem in the center
  const startY = Math.floor(height / 2) - Math.floor(poem.length / 2);
  
  for (let i = 0; i < poem.length; i++) {
    const line = poem[i];
    const startX = Math.floor(width / 2) - Math.floor(line.length / 2);
    
    for (let j = 0; j < line.length; j++) {
      if (startY + i >= 0 && startY + i < height && startX + j >= 0 && startX + j < width) {
        canvas[startY + i][startX + j] = line[j];
      }
    }
  }
  
  // Add random characters to fill in the space
  const rnd = window.DRand || { 
    dRandomFloat: () => Math.random(),
    dRandomInt: (max) => Math.floor(Math.random() * max)
  };
  
  for (let y = 1; y < height - 1; y++) {
    for (let x = 1; x < width - 1; x++) {
      // Skip the poem text
      let isPoemText = false;
      for (let i = 0; i < poem.length; i++) {
        const line = poem[i];
        const startX = Math.floor(width / 2) - Math.floor(line.length / 2);
        const startY = Math.floor(height / 2) - Math.floor(poem.length / 2);
        
        if (y >= startY + i && y <= startY + i && 
            x >= startX && x < startX + line.length) {
          isPoemText = true;
          break;
        }
      }
      
      if (!isPoemText && canvas[y][x] === ' ' && rnd.dRandomFloat() < density) {
        const charIndex = rnd.dRandomInt(chars.length);
        canvas[y][x] = chars[charIndex];
      }
    }
  }
  
  // Convert to string
  return canvas.map(row => row.join('')).join('\n');
}

// Export module
window.SimpleRenderer = {
  initialize,
  setPoem,
  setPatternType,
  setWallpaperGroup,
  transitionToNextPoem,
  createAsciiArt
};
