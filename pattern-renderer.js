/**
 * i've never picked a protected flower - Interactive Installation
 * Enhanced pattern renderer based on wallpaper.js
 */

// Deterministic random number generator from original wallpaper.js
let a = 1664525 * Math.random();
let c = 1013904223;
let seed = 1234;

function seedDRand(newSeed) {
  seed = newSeed;
}

function dRandom() {
  seed = parseInt(a * seed + c) % 982451497;
  return seed;
}

function dRandomInt(spread) {
  return (dRandom() % spread);
}

function dRandomIn(min, max) {
  return min + dRandom() % (max - min + 1);
}

function dRandomFloat() {
  return dRandom() / 982451497;
}

function dRandomFloatIn(min, max) {
  return min + (max - min) * dRandom() / 982451497;
}

// Wallpaper groups
const groupNameString = ["p1", "pm", "pmm", "pg", "cm", "pmg", "cmm", "pgg", "p2", "p3", "p3m1", "p31m", "p4", "p4m", "p4g", "p6", "p6m"];

// Pattern parameters
let group = groupNameString[groupNameString.length - 1];
let errorSubdivisions = 8;
let errorRange = 2;
let baseRotation = Math.random() * 30 * Math.PI * 2;
let polygonSides = 3;
let angle0 = Math.PI / 3;
let xSpacing = 64;
let ySpacing = 64;
let rotationOffset = Math.random();
let rotateRule = Math.random();
let rowRotateRule = Math.random();
let shear = Math.random();
let xFlip = false;
let yFlip = false;
let yFlipPairs = false;
let yFlipRows = false;
let instancesPerStep = 1;
let mirrorInstances = false;
let autoInvert = false;
let neighbor = [];

// ASCII conversion parameters
let asciiChars = ['@', '#', '$', '%', '&', '=', '+', '*', ':', '-', '.', ' '];
let unicodeRanges = [
  // Box drawing
  [0x2500, 0x257F],
  // Block elements
  [0x2580, 0x259F],
  // Geometric shapes
  [0x25A0, 0x25FF],
  // Miscellaneous symbols
  [0x2600, 0x26FF],
  // Dingbats
  [0x2700, 0x27BF],
  // CJK symbols and punctuation
  [0x3000, 0x303F]
];

// Helper functions
function pick(array) {
  return array[dRandomInt(array.length)];
}

function jitter(input, amount) {
  return input - amount + 2 * amount * (Math.random() * 20);
}

function lerp(n1, n2, blend) {
  return (1.0 - blend) * n1 + blend * n2;
}

// Set up wallpaper pattern rules
function setRules(group) {
  polygonSides = 4;
  angle0 = Math.PI / 2;
  xSpacing = 128;
  ySpacing = 128;
  rotationOffset = 0;
  rotateRule = 0;
  rowRotateRule = 0;
  shear = 0;
  xFlip = false;
  yFlip = false;
  yFlipPairs = false;
  yFlipRows = false;
  instancesPerStep = 1;
  mirrorInstances = false;

  // Configure rules for each wallpaper group
  if (group == "p1") {
    polygonSides = 4;
    ySpacing = Math.sqrt(3/4) * xSpacing;
    angle0 = Math.PI / 3;
    rotateRule = 0;
    shear = 0.5;
    xSpacing *= 0.5;
  } else if (group == "pm") {
    polygonSides = 4;
    rotateRule = 0;
    xFlip = true;
    shear = 0.0;
    xSpacing *= 0.5;
  } else if (group == "pmm") {
    polygonSides = 4;
    rotateRule = 0;
    xFlip = true;
    yFlipRows = true;
    xSpacing *= 0.5;
    shear = 0.0;
  } else if (group == "pg") {
    polygonSides = 4;
    rotateRule = 0;
    yFlip = true;
    shear = 0.0;
    xSpacing *= 0.5;
  } else if (group == "pmg") {
    polygonSides = 4;
    rotateRule = 0;
    xFlip = true;
    yFlipPairs = true;
    shear = 0.0;
    xSpacing *= 0.5;
  } else if (group == "cmm") {
    polygonSides = 4;
    rotateRule = 0;
    xFlip = true;
    yFlipPairs = true;
    yFlipRows = true;
    shear = 0.0;
    xSpacing *= 0.5;
  } else if (group == "pgg") {
    polygonSides = 4;
    rotateRule = 0;
    rowRotateRule = Math.PI;
    xFlip = false;
    yFlip = true;
    yFlipPairs = false;
    yFlipRows = false;
    shear = 0.0;
    xSpacing *= 0.5;
  } else if (group == "p2") {
    polygonSides = 4;
    ySpacing = Math.sqrt(3/4) * xSpacing;
    angle0 = Math.PI / 3;
    rotateRule = Math.PI;
    shear = 0.5;
    xSpacing *= 0.5;
  } else if (group == "p4") {
    polygonSides = 4;
    xSpacing *= 2;
    ySpacing *= 2;
    instancesPerStep = 4;
  } else if (group == "p4m") {
    polygonSides = 3;
    angle0 = Math.PI / 4;
    xSpacing *= 2;
    ySpacing *= 2;
    instancesPerStep = 4;
    mirrorInstances = true;
  } else if (group == "p4g") {
    polygonSides = 4;
    rotateRule = Math.PI / 2;
    xSpacing *= 2;
    ySpacing *= 2;
    shear = 1;
    instancesPerStep = 2;
    mirrorInstances = true;
  } else if (group == "cm") {
    polygonSides = 4;
    rotateRule = 0;
    xFlip = true;
    yFlip = false;
    shear = 1.0;
    xSpacing *= 0.5;
  } else if (group == "p3") {
    polygonSides = 4;
    rotationOffset = Math.PI / 6;
    angle0 = Math.PI * 2 / 3;
    rotateRule = 0;
    xSpacing *= 2;
    ySpacing = Math.sqrt(3/4) * xSpacing;
    shear = 0.5;
    instancesPerStep = 3;
  } else if (group == "p3m1") {
    polygonSides = 3;
    angle0 = Math.PI / 3;
    rotationOffset = Math.PI / 6;
    rotateRule = Math.PI * 2 / 3;
    xSpacing *= 2;
    ySpacing = Math.sqrt(3/4) * xSpacing;
    shear = 0.5;
    instancesPerStep = 3;
    mirrorInstances = true;
  } else if (group == "p31m") {
    polygonSides = 3;
    angle0 = Math.PI / 6;
    rotateRule = 0;
    xSpacing *= 2;
    ySpacing = Math.sqrt(3/4) * xSpacing;
    shear = 0.5;
    instancesPerStep = 3;
    mirrorInstances = true;
  } else if (group == "p6") {
    polygonSides = 3;
    angle0 = Math.PI / 6;
    rotateRule = 0;
    xSpacing *= 2;
    ySpacing = Math.sqrt(3/4) * xSpacing;
    shear = 0.5;
    instancesPerStep = 6;
    mirrorInstances = false;
  } else if (group == "p6m") {
    polygonSides = 3;
    angle0 = Math.PI / 6;
    rotateRule = 0;
    xSpacing *= 2;
    ySpacing = Math.sqrt(3/4) * xSpacing;
    shear = 0.5;
    instancesPerStep = 6;
    mirrorInstances = true;
  }
}

// Function to get corner points for the patterns
function getCorner(index, groupName) {
  let newPoint = {x: 0, y: 0};
  let distance = xSpacing;

  if (groupName == "p3m1")
    distance = 2 / Math.sqrt(3) * xSpacing / 2;
  if ((groupName == "p4") || (groupName == "p4m") || (groupName == "p4g"))
    distance = xSpacing / 2;
  
  if (index == 0) {
    newPoint.x = 0;
    newPoint.y = 0;
  } else if (index == 1) {
    if ((groupName == "p3"))
      distance = 0.5 * xSpacing / Math.sqrt(3/4);
    if ((groupName == "p6m"))
      distance = 0.5 * xSpacing;
    newPoint.x = distance;
    newPoint.y = 0;
  } else if (index == 2) {
    if ((groupName == "p3"))
      distance = 0.5 * xSpacing / Math.sqrt(3/4);
    if ((groupName == "p31m") || (groupName == "p6") || (groupName == "p6m"))
      distance = 2 / Math.sqrt(3) * xSpacing / 2;
    if ((groupName == "p4m"))
      distance = 0.5 * Math.sqrt(2) * xSpacing;
    newPoint.x = distance * Math.cos(angle0);
    newPoint.y = distance * Math.sin(angle0);
  } else if (index == 3) {
    if ((groupName == "p3"))
      distance = 0.5 * xSpacing / Math.sqrt(3/4);
    if ((groupName == "p1") || (groupName == "p2"))
      distance = 2 * (Math.sqrt(3) / 2) * xSpacing;
    if ((groupName == "pm") || (groupName == "pmm") || (groupName == "pg") || 
        (groupName == "cm") || (groupName == "cmm") || (groupName == "pgg") || (groupName == "pmg"))
      distance = xSpacing * Math.sqrt(2);
    if ((groupName == "p4") || (groupName == "p4m") || (groupName == "p4g"))
      distance = Math.sqrt(2) * xSpacing / 2;
    newPoint.x = distance * Math.cos(angle0 / 2);
    newPoint.y = distance * Math.sin(angle0 / 2);
  }
  
  return newPoint;
}

// Generate a random Unicode character from the specified range
function getRandomUnicodeChar(rangeIndex) {
  const range = unicodeRanges[rangeIndex % unicodeRanges.length];
  const codePoint = dRandomIn(range[0], range[1]);
  return String.fromCodePoint(codePoint);
}

// Convert an image value to an ASCII character
function valueToChar(value, useUnicode, rangeIndex) {
  if (useUnicode) {
    // Create a probability-based selection
    if (Math.random() > 0.7) {
      return getRandomUnicodeChar(rangeIndex);
    }
  }
  
  // Default ASCII mapping
  return asciiChars[Math.floor(value * (asciiChars.length - 1))];
}

// Enhanced drawing function for wallpaper patterns that includes poem lines
function drawPatternWithPoem(canvasId, groupName, poemLines, offset) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set background
  context.fillStyle = "#333";
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Apply animation offset to base rotation
  const animatedRotation = baseRotation + (offset * 0.01);
  
  // Set the pattern rules
  setRules(groupName);
  
  context.save();
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(animatedRotation);
  
  // Draw the pattern
  const jitterAmount = 0.1;
  
  // Draw strokes forming the pattern
  for (let i = 0; i < 64; i++) {
    context.save();
    context.lineWidth = 8;
    context.globalAlpha = 1.0;
    context.strokeStyle = pick(["#333", "#ddd"]);
    
    const x0 = dRandomFloatIn(-xSpacing, xSpacing);
    const y0 = dRandomFloatIn(-ySpacing, ySpacing);
    const x1 = dRandomFloatIn(-xSpacing, xSpacing);
    const y1 = dRandomFloatIn(-ySpacing, ySpacing);
    
    if (dRandomFloat() < 0.5)
      drawStroke(context, x0, y0, x1, y0);
    else
      drawStroke(context, x0, y0, x0, y1);
    
    context.restore();
  }
  
  // Create ASCII art overlay with the poem
  createAsciiOverlay(canvas, context, poemLines);
  
  context.restore();
}

// Draw glass pattern with poem integration
function drawGlassWithPoem(canvasId, poemLines, offset) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const context = canvas.getContext("2d");
  context.clearRect(0, 0, canvas.width, canvas.height);
  
  // Set background
  context.fillStyle = "#555";
  context.fillRect(0, 0, canvas.width, canvas.height);
  
  // Calculate parameters based on offset for animation
  const sides = Math.floor(Math.random() * 16 + 3);
  const angleRotate = Math.floor(Math.random() * 360) + offset;
  const sizeGen = Math.floor(Math.random() * 25 + 5);
  
  context.save();
  context.translate(canvas.width / 2, canvas.height / 2);
  context.rotate(angleRotate * Math.PI / 180);
  
  // Draw the geometric pattern
  const size = sizeGen;
  const numberOfSides = sides;
  
  // Draw the central polygon
  context.beginPath();
  context.moveTo(size * Math.cos(0), size * Math.sin(0));
  
  for (let i = 1; i <= numberOfSides; i++) {
    context.lineTo(
      size * Math.cos(i * 2 * Math.PI / numberOfSides), 
      size * Math.sin(i * 2 * Math.PI / numberOfSides)
    );
  }
  
  context.strokeStyle = "#000000";
  context.lineWidth = size / 5;
  context.lineCap = "round";
  context.lineJoin = "round";
  
  context.save();
  context.globalAlpha = 0.4;
  context.globalCompositeOperation = "overlay";
  context.fillStyle = randomColor();
  context.fill();
  context.restore();
  
  context.stroke();
  context.closePath();
  
  // Draw the extended pattern
  for (let i = 1; i <= numberOfSides; i++) {
    context.beginPath();
    context.moveTo(
      size * Math.cos(i * 2 * Math.PI / numberOfSides), 
      size * Math.sin(i * 2 * Math.PI / numberOfSides)
    );
    context.lineTo(
      size * 3 * Math.cos(i * 2 * (Math.PI / numberOfSides)), 
      size * 3 * Math.sin(i * 2 * (Math.PI / numberOfSides))
    );
    context.lineTo(
      size * 3 * Math.cos((i + 1) * 2 * Math.PI / numberOfSides), 
      size * 3 * Math.sin((i + 1) * 2 * Math.PI / numberOfSides)
    );
    context.lineTo(
      size * 5 * Math.cos((i + 1) * 2 * Math.PI / numberOfSides), 
      size * 5 * Math.sin((i + 1) * 2 * Math.PI / numberOfSides)
    );
    
    context.save();
    context.globalAlpha = 0.4;
    context.globalCompositeOperation = "overlay";
    context.fillStyle = randomColor();
    context.restore();
    
    context.lineTo(
      size * 5 * Math.cos(i * 2 * Math.PI / numberOfSides), 
      size * 5 * Math.sin(i * 2 * Math.PI / numberOfSides)
    );
    
    context.save();
    context.globalAlpha = 0.4;
    context.globalCompositeOperation = "overlay";
    context.fillStyle = randomColor();
    context.fill();
    context.restore();
    
    context.stroke();
    context.closePath();
  }
  
  context.restore();
  
  // Create ASCII art overlay with the poem
  createAsciiOverlay(canvas, context, poemLines);
}

// Draw flower pattern with poem integration
function drawFlowerWithPoem(canvasId, poemLines, offset) {
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  
  const context = canvas.getContext("2d");
  
  // Set background
  context.save();
  context.globalCompositeOperation = "destination-under";
  context.fillStyle = "#555";
  context.fillRect(0, 0, canvas.width, canvas.height);
  context.restore();
  
  // Generate poem characteristics
  let text = poemLines.join(' ');
  let textlength = text.length;
  let period = (text.match(/\./g) || []).length * (Math.random() * 10);
  let comma = (text.match(/,/g) || []).length * (Math.random() * 10);
  let space = (text.match(/ /g) || []).length * (Math.random() * 10);
  let dash = (text.match(/-/g) || []).length * (Math.random() * 10);
  let upper = text.replace(/[a-z]/g, '').length * (Math.random() * 10);
  let lower = text.replace(/[A-Z]/g, '').length * (Math.random() * 10);
  
  // Calculate pattern parameters
  let quality = textlength / (0.007 * textlength);
  let radius = (Math.random() * (period + comma + dash)) + offset;
  let layerSize = comma * (Math.random() * 30) + (Math.random() * quality) * 0.2;
  
  // Create layers
  let layers = [];
  for (let i = 0; i < quality; i++) {
    layers.push({
      x: canvas.width / 2 + Math.sin(i / quality * 2 * Math.PI) * (radius - layerSize),
      y: canvas.height / 2 + Math.cos(i / quality * 2 * Math.PI) * (radius - layerSize),
      r: i / 1000 * Math.PI + offset
    });
  }
  
  // Draw the layers
  for (let i = 0; i < layers.length; i++) {
    context.save();
    context.globalCompositeOperation = 'screen';
    paintFlowerLayer(context, layers[i], {
      width: canvas.width,
      height: canvas.height,
      period, comma, space, dash, upper, lower, textlength
    });
    context.restore();
  }
  
  // Create ASCII art overlay with the poem
  createAsciiOverlay(canvas, context, poemLines);
}

// Paint a single layer of the flower pattern
function paintFlowerLayer(context, layer, params) {
  const { width, height, period, comma, space, dash, upper, lower, textlength } = params;
  
  context.save();
  context.globalCompositeOperation = 'destination-under';
  context.fillStyle = "#555";
  context.fillRect(0, 0, width, height);
  context.restore();
  
  context.beginPath();
  context.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);
  
  context.beginPath();
  context.translate(layer.x, layer.y);
  context.rotate(layer.r);
  context.strokeStyle = "#fff";
  
  // Choose a drawing method based on poem characteristics
  const modifier = (Math.floor(Math.random() * 100)) * (Math.random() < 0.5 ? -1 : 1) * 0.01;
  const option = textlength * 0.005 + modifier;
  
  if (option < 1) {
    // First drawing method
    context.lineWidth = (Math.random() * comma);
    const randwidth = (Math.random() * width) / (((Math.random() * 6) * 0.1) + 4);
    const randheight = (Math.random() * height) / (((Math.random() * 6) * 0.1) + 4);
    
    context.globalAlpha = 0.4;
    context.moveTo(randwidth, randheight);
    context.lineTo(randwidth - Math.random() * 4, randheight - Math.random() * 4);
    context.stroke();
    
    context.globalAlpha = 0.3;
    context.moveTo(randwidth + comma * 0.3, randheight + comma * 0.3);
    context.lineTo(randwidth - period, randheight - period);
    context.stroke();
    context.lineTo(randwidth - period - 3, randheight - period - 3);
    
    context.globalAlpha = 0.2;
    context.lineWidth = Math.random() * 4;
    context.lineCap = 'round';
    context.arcTo(
      randwidth + space * 0.03, 
      randheight + space * 0.03, 
      randwidth + space * 0.03, 
      randheight + space * 0.03, 
      dash
    );
    context.stroke();
  } else if (option > 1 && option < 2) {
    // Second drawing method
    context.lineWidth = (Math.random() * 10) + 0.2;
    const randwidth = (Math.random() * width) / (((Math.random() * 6) * 0.6) + 2);
    const randheight = (Math.random() * height) / (((Math.random() * 6) * 0.6) + 2);
    
    context.globalAlpha = (Math.floor(Math.random() * 40) * 0.05 + 0.01);
    
    context.moveTo(randwidth, randheight);
    context.lineTo(randwidth - Math.random() * 2, randheight - Math.random() * 3);
    context.stroke();
    
    context.lineTo(randwidth - Math.random() * 2, randheight - Math.random() * 2);
    context.stroke();
    
    context.lineWidth = (Math.random() * 10) + 0.2;
    context.moveTo(randwidth + Math.random() * 3, randheight + Math.random() * 2);
    context.lineTo(randwidth - Math.random() * 3, randheight - Math.random() * 1);
    context.stroke();
    
    context.lineTo(randwidth - Math.random() * 3, randheight - Math.random() * 4);
    context.stroke();
    context.setLineDash([Math.random() * comma, Math.random() * upper, Math.random() * space]);
    context.lineDashOffset = (Math.random() * dash);
    context.globalAlpha = (Math.floor(Math.random() * 20) * 0.05 + 0.1);
    context.arcTo(
      randwidth + (Math.random() * space) * 0.05, 
      randheight + (Math.random() * space) * 0.05, 
      randwidth + space * 0.05, 
      randheight + space * 0.05, 
      (Math.random() * textlength)
    );
    context.strokeRect(
      lower * Math.random() * 0.9, 
      -period * Math.random() * 0.9, 
      -period * Math.random() * 0.9, 
      comma * Math.random() * 0.9
    );
  } else {
    // Default drawing method - similar to "sixth" in the original
    context.lineWidth = (Math.random() * 10) + 0.4;
    const randwidth = (Math.random() * width) / (((Math.random() * 6) * 0.1) + 5);
    const randheight = (Math.random() * height) / (((Math.random() * 6) * 0.1) + 5);
    
    context.globalAlpha = (Math.floor(Math.random() * 100) * 0.005 + 0.1);
    
    context.moveTo(randwidth, randheight);
    context.lineTo(randwidth - Math.random() * 2, randheight - Math.random() * 2);
    context.stroke();
    
    context.lineTo(randwidth - Math.random() * 2, randheight - Math.random() * 2);
    context.stroke();
    
    context.moveTo(randwidth + Math.random() * 3, randheight + Math.random() * 3);
    context.lineTo(randwidth - Math.random() * 3, randheight - Math.random() * 3);
    context.stroke();
    
    context.lineTo(randwidth - Math.random() * 3, randheight - Math.random() * 3);
    context.stroke();
    
    context.moveTo(randwidth + Math.random() * 3 + 20, randheight + Math.random() * 3 + 20);
    context.lineTo(randwidth + Math.random() * 2 + 19, randheight + Math.random() * 2 + 19);
    context.stroke();
  }
  
  context.restore();
}

// Utility function to generate a random color
function randomColor() {
  const letters = '0123456789ABCDEF'.split('');
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

// Draw a stroke respecting the symmetries of the pattern
function drawStroke(context, startX, startY, endX, endY) {
  context.save();
  
  // Calculate viewport bounds based on canvas
  const xCount = context.canvas.height / xSpacing + 2;
  const yCount = context.canvas.height / ySpacing + 2;
  
  const jitterAmount = 0.1;
  
  for (let y = 0; y < yCount; y++) {
    for (let x = 0; x < xCount; x++) {
      context.save();
      context.translate(
        (x - xCount / 2 + (y - yCount / 2) * shear) * xSpacing, 
        (y - yCount / 2) * ySpacing
      );
      
      // Determine rotation for this instance
      const currentRotation = rotateRule * x + rowRotateRule * y + rotationOffset;
      context.rotate(currentRotation);
      
      // Apply x flip if needed
      if ((xFlip) && (x % 2 == 0)) {
        context.scale(-1, 1);
        context.translate(xSpacing, 0);
      }
      
      // Apply y flip if needed
      if ((yFlip) && (x % 2 == 0))
        context.scale(1, -1);
      if ((yFlipPairs) && (Math.floor(x / 2) % 2 == 0))
        context.scale(1, -1);
      if ((yFlipRows) && (y % 2 == 0)) {
        context.scale(1, -1);
        context.translate(0, ySpacing);
      }
      
      // Draw instances for rotational symmetry
      for (let i = 0; i < instancesPerStep; i++) {
        context.save();
        context.rotate(i * (2.0 * Math.PI / instancesPerStep));
        
        // Apply mirroring if needed
        let flipMax = 0;
        if (mirrorInstances)
          flipMax = 2;
        
        for (let flip = -1; flip <= flipMax; flip += 2) {
          context.save();
          context.scale(1, flip);
          
          context.beginPath();
          context.moveTo(jitter(startX, jitterAmount), jitter(startY, jitterAmount));
          context.lineTo(jitter(endX, jitterAmount), jitter(endY, jitterAmount));
          context.stroke();
          
          context.restore();
        }
        
        context.restore();
      }
      
      context.restore();
    }
  }
  
  context.restore();
}

// Create an ASCII art overlay with poem lines
function createAsciiOverlay(canvas, context, poemLines) {
  if (!poemLines || poemLines.length === 0) return;
  
  const width = canvas.width;
  const height = canvas.height;
  
  // Create a temporary canvas to capture the current drawing
  const tempCanvas = document.createElement('canvas');
  tempCanvas.width = width;
  tempCanvas.height = height;
  const tempContext = tempCanvas.getContext('2d');
  tempContext.drawImage(canvas, 0, 0);
  
  // Get image data
  const imageData = tempContext.getImageData(0, 0, width, height).data;
  
  // Clear the canvas for the ASCII overlay
  context.clearRect(0, 0, width, height);
  context.fillStyle = "#333";
  context.fillRect(0, 0, width, height);
  
  // Calculate grid dimensions
  const cellSize = 12; // Size of each ASCII character
  const cols = Math.floor(width / cellSize);
  const rows = Math.floor(height / cellSize);
  
  // Prepare poem display
  const poemLinesCount = poemLines.length;
  let currentLine = 0;
  const lineHeight = Math.floor(rows / poemLinesCount);
  
  // Set text properties
  context.font = `${cellSize}px monospace`;
  context.textAlign = 'center';
  context.textBaseline = 'middle';
  
  // Use a different unicode range for each line for visual variety
  let rangeIndex = dRandomInt(unicodeRanges.length);
  
  // Generate ASCII art representation
  for (let y = 0; y < rows; y++) {
    // Determine if this row should contain poem text
    const poemLineIndex = Math.floor(y / lineHeight);
    const isPoemRow = poemLineIndex < poemLinesCount && y % lineHeight === Math.floor(lineHeight / 2);
    
    for (let x = 0; x < cols; x++) {
      const posX = x * cellSize;
      const posY = y * cellSize;
      
      // Sample image data from a slightly larger area
      let avgBrightness = 0;
      const sampleSize = 3;
      for (let sy = 0; sy < sampleSize; sy++) {
        for (let sx = 0; sx < sampleSize; sx++) {
          const sampledX = Math.min(width - 1, posX + sx * cellSize / sampleSize);
          const sampledY = Math.min(height - 1, posY + sy * cellSize / sampleSize);
          const pixelIndex = (Math.floor(sampledY) * width + Math.floor(sampledX)) * 4;
          const r = imageData[pixelIndex];
          const g = imageData[pixelIndex + 1];
          const b = imageData[pixelIndex + 2];
          avgBrightness += (r + g + b) / 3;
        }
      }
      avgBrightness /= (sampleSize * sampleSize * 255);
      
      // Determine character
      let char;
      if (isPoemRow) {
        // Use the poem text for this row
        const poemLine = poemLines[poemLineIndex];
        const charPos = Math.floor(x * poemLine.length / cols);
        char = poemLine.charAt(charPos);
        if (char === ' ' || char === '') {
          // For spaces in the poem, use ASCII character
          char = valueToChar(1 - avgBrightness, true, rangeIndex);
        }
      } else {
        // Use ASCII/Unicode for non-poem rows
        char = valueToChar(1 - avgBrightness, true, rangeIndex);
      }
      
      // Draw the character
      context.fillStyle = `rgba(255, 255, 255, ${0.2 + avgBrightness * 0.8})`;
      context.fillText(char, posX + cellSize / 2, posY + cellSize / 2);
    }
    
    // Update the Unicode range index for each row for variety
    if (y % 5 === 0) {
      rangeIndex = (rangeIndex + 1) % unicodeRanges.length;
    }
  }
}

// Expose the drawing functions globally

window.patternRenderer = {
  renderPattern: drawPatternWithPoem,
  renderGlass: drawGlassWithPoem,
  renderFlower: drawFlowerWithPoem,
  groupNameString: groupNameString
};
