/**
 * i've never picked a protected flower - Simplified Renderer
 * A focused, minimal rendering approach emphasizing poem text
 */

// Configuration
const config = {
  // Visual settings
  backgroundColor: '#111',
  textColor: '#ddd',
  highlightColor: '#ff5',
  patternDensity: 0.8,
  fontSize: 12,
  characterSet: '#@*o+=-.', // Background pattern characters
  highlightedChars: '█▓▒░',  // Used for poem emphasis
  
  // Animation settings
  scrollSpeed: 0.2,
  transitionSpeed: 3000,
  refreshInterval: 12000,
  
  // Layout
  gridSize: 16,
  poemLineSpacing: 5,
  
  // Special characters for flowering effect
  flowerChars: '@*o░▒▓█OQ•·°'
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
  
  // Initialize the character grid
  initializeGrid();
  
  // Start animation loop
  requestAnimationFrame(render);
  
  // Set interval for poem transitions
  setInterval(transitionToNextPoem, config.refreshInterval);
  
  return true;
}

/**
 * Resize canvas to fit window
 */
function resizeCanvas() {
  canvas.width = window.innerWidth;
  canvas.height = window.innerHeight;
  initializeGrid(); // Reinitialize grid when canvas resizes
}

/**
 * Initialize the character grid
 */
function initializeGrid() {
  const cols = Math.ceil(canvas.width / config.gridSize);
  const rows = Math.ceil(canvas.height / config.gridSize);
  
  grid = [];
  
  for (let y = 0; y < rows; y++) {
    const row = [];
    for (let x = 0; x < cols; x++) {
      // Randomly select a character from our set
      const charIndex = Math.floor(Math.random() * config.characterSet.length);
      const char = config.characterSet[charIndex];
      
      // Initialize with random values
      row.push({
        char,
        alpha: Math.random() * 0.5 + 0.1,
        size: config.fontSize * (Math.random() * 0.4 + 0.8),
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
  const flowerCount = Math.floor(Math.random() * 3) + 2;
  
  for (let f = 0; f < flowerCount; f++) {
    const centerX = Math.floor(Math.random() * grid[0].length);
    const centerY = Math.floor(Math.random() * grid.length);
    const radius = Math.floor(Math.random() * 10) + 5;
    
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
                char: config.flowerChars[Math.floor(Math.random() * 4)],
                alpha: 0.8,
                size: config.fontSize * 1.2
              };
            } else if (normDist < 0.7) {
              // Middle area
              symbolMap[`${x},${y}`] = {
                char: config.flowerChars[Math.floor(Math.random() * 6) + 4],
                alpha: 0.7 - normDist * 0.3,
                size: config.fontSize * (1.1 - normDist * 0.3)
              };
            } else if (Math.random() > 0.7) {
              // Outer petals - more sparse
              symbolMap[`${x},${y}`] = {
                char: config.flowerChars[Math.floor(Math.random() * config.flowerChars.length)],
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
    // Otherwise, get a new poem
    // In a real implementation, you would call your poem generator here
    const dummyPoem = [
      "i've never picked a protected flower",
      "morning light bathes silent petals",
      "nature speaks in whispered verses",
      "each stem holds memories of rain",
      "blossoms transform beneath the moon"
    ];
    
    nextPoem = [...dummyPoem];
    isTransitioning = true;
    transitionProgress = 0;
  }
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
  
  // Render background character grid
  renderGrid();
  
  // Render the poem text
  renderPoem();
  
  // Continue animation
  requestAnimationFrame(render);
}

/**
 * Render the character grid
 */
function renderGrid() {
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
  if (currentPoem.length === 0) return;
  
  const centerX = canvas.width / 2;
  const startY = canvas.height / 2 - ((currentPoem.length - 1) * config.poemLineSpacing) / 2;
  
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  
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
    const keyWords = ['flower', 'petal', 'bloom', 'nature', 'garden', 'light', 'rain', 'sun', 'moon'];
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

// Export module
window.SimpleRenderer = {
  initialize,
  setPoem
};
