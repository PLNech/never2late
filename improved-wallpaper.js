// Enhanced Wallpaper.js for Interactive Flower Poem Installation
// Based on original wallpaper.js with added animation and interactivity

// for our deterministic random number generator
var a = 1664525 * Math.random();
var c = 1013904223;
var seed = 1234;

// Animation state
let animationState = {
    baseRotation: 0,
    transitionSpeed: 0.001,
    noiseOffset: 0,
    mouseInfluence: { x: 0, y: 0 },
    activePatterns: [],
    colorPalette: generateFlowerPalette()
};

// Generate a palette of flower-inspired colors
function generateFlowerPalette() {
    const baseColors = [
        // Rose colors
        "#FF007F", "#FF66B2", "#FF3399", 
        // Lavender colors
        "#E6E6FA", "#9370DB", "#8A2BE2",
        // Sunflower colors
        "#FFD700", "#FFA500", "#FF8C00",
        // Lily colors
        "#FFF0F5", "#FFB6C1", "#FF69B4",
        // Greenery
        "#228B22", "#32CD32", "#7CFC00"
    ];
    
    // Create variations
    let palette = [...baseColors];
    
    // Add lighter and darker variations
    baseColors.forEach(color => {
        // Add lighter version
        palette.push(adjustColorBrightness(color, 30));
        // Add darker version
        palette.push(adjustColorBrightness(color, -30));
    });
    
    return palette;
}

// Helper to adjust color brightness
function adjustColorBrightness(hex, percent) {
    // Convert hex to RGB
    let r = parseInt(hex.substring(1, 3), 16);
    let g = parseInt(hex.substring(3, 5), 16);
    let b = parseInt(hex.substring(5, 7), 16);
    
    // Adjust brightness
    r = Math.max(0, Math.min(255, r + percent));
    g = Math.max(0, Math.min(255, g + percent));
    b = Math.max(0, Math.min(255, b + percent));
    
    // Convert back to hex
    return "#" + ((1 << 24) + (r << 16) + (g << 8) + b).toString(16).slice(1);
}

//function seedDeterministicRandomNumberGenerator(newSeed) {
function seedDRand(newSeed) {
    seed = newSeed;
    //console.log("seed = " + seed + "\n");
}

function dRandom() {
    // define the recurrence relationship
    seed = parseInt(a * seed + c) % 982451497;
    // return an integer 
    // Could return a float in (0, 1) by dividing by m
    return seed;
}

// helper function which returns an integer from 0 to spread - 1
// for 4 it would be 0, 1, 2, or 3 (not 4)
function dRandomInt(spread) {
    return (dRandom() % spread);
}

// returns an integer from min to max (inclusive)
function dRandomIn(min, max) {
    return min + dRandom() % (max - min + 1);
}

// return a float in the 0-1 range
function dRandomFloat() {
    return dRandom() / 982451497;
}

// return a float in the min-max range
function dRandomFloatIn(min, max) {
    return min + (max - min) * dRandom() / 982451497;
}

// uses the fibonacci sequence to generate pseudorandom numbers
function fibonacci(a, b) {
    var period = Math.pow(10, 6);
    //console.log("testing fibonacci sequence. inputs are " + a + " and " + b);
    var iterations = 128;
    a += 552219;
    var c;
    for (var i = 0; i < iterations; i++) {
        c = a + b;
        if (c > period)
            c = c % period;
        a = b;
        b = c;
        //console.log(c);
    }
    return b;
}

// for drawing
var canvas;
var context;

// wallpaper groups
var groupNameString = ["p1", "pm", "pmm", "pg", "cm", "pmg", "cmm", "pgg", "p2", "p3", "p3m1", "p31m", "p4", "p4m", "p4g", "p6", "p6m"];
var group = groupNameString[groupNameString.length - 1]; //pick(groupNameString);

var errorSubdivisions = 8;
var errorRange = 2;

var baseRotation = Math.random() * 30 * Math.PI * 2;
var group = pick(groupNameString);

var polygonSides = 3;
var angle0 = Math.PI / 3;
var xSpacing = 64;
var ySpacing = 64;
var rotationOffset = Math.random();
var rotateRule = Math.random();
var rowRotateRule = Math.random();
var shear = Math.random();
var xFlip = false;
var yFlip = false;
var yFlipPairs = false;
var yFlipRows = false;
var instancesPerStep = 1;
var mirrorInstances = false;
var autoInvert = false;

var canvasCount = 3;

function pick(array) {
    return array[dRandomInt(array.length)];
}

function jitter(input, amount) {
    return input - amount + 2 * amount * (Math.random() * 20);
}

// returns the specified corner point as an array {x, y}
function getCorner(index, groupName) {
    var newPoint = { x: 0, y: 0 };
    var distance = xSpacing;

    if (groupName == "p3m1")
        distance = 2 / Math.sqrt(3) * xSpacing / 2;
    if ((groupName == "p4") || (groupName == "p4m")
        || (groupName == "p4g"))
        distance = xSpacing / 2;

    if (index == 0) {
        newPoint.x = 0;
        newPoint.y = 0;
    }
    else if (index == 1) {
        if ((groupName == "p3"))
            distance = 0.5 * xSpacing / Math.sqrt(3 / 4);
        if ((groupName == "p6m"))
            distance = 0.5 * xSpacing;
        newPoint.x = distance;
        newPoint.y = 0;
    }
    else if (index == 2) {
        if ((groupName == "p3"))
            distance = 0.5 * xSpacing / Math.sqrt(3 / 4);
        if ((groupName == "p31m") || (groupName == "p6")
            || (groupName == "p6m"))
            distance = 2 / Math.sqrt(3) * xSpacing / 2;
        if ((groupName == "p4m"))
            distance = 0.5 * Math.sqrt(2) * xSpacing;
        newPoint.x = distance * Math.cos(angle0);
        newPoint.y = distance * Math.sin(angle0);
    }
    else if (index == 3) { // used for quadrilaterals only- optional fourth corner
        if ((groupName == "p3"))
            distance = 0.5 * xSpacing / Math.sqrt(3 / 4);
        if ((groupName == "p1") || (groupName == "p2"))
            distance = 2 * (Math.sqrt(3) / 2) * xSpacing;
        if ((groupName == "pm") || (groupName == "pmm")
            || (groupName == "pg") || (groupName == "cm")
            || (groupName == "cmm") || (groupName == "pgg")
            || (groupName == "pmg"))
            distance = xSpacing * Math.sqrt(2);
        if ((groupName == "p4") || (groupName == "p4m")
            || (groupName == "p4g"))
            distance = Math.sqrt(2) * xSpacing / 2;
        newPoint.x = distance * Math.cos(angle0 / 2);
        newPoint.y = distance * Math.sin(angle0 / 2);
    }

    return newPoint;
}

function lerp(n1, n2, blend) {
    return (1.0 - blend) * n1 + blend * n2;
}

function randArr(arr) {
    var rand = arr[Math.floor(Math.random() * arr.length)];
    return rand;
}

// Enhanced draw pattern with animation options
function drawPattern(canvasName, groupName, timestamp) {
    canvas = document.getElementById(canvasName);
    if (!canvas) return; // Safety check

    context = canvas.getContext("2d");
    context.save();

    // Dynamic blending mode based on theme
    let blendModes = ["multiply", "screen", "overlay", "soft-light", "difference", "exclusion", "luminosity"];
    context.globalCompositeOperation = blendModes[Math.floor(timestamp / 5000) % blendModes.length];

    // Update animation state
    animationState.noiseOffset += 0.01;
    animationState.baseRotation += animationState.transitionSpeed;

    // set the pattern parameters with animation influence
    setRules(groupName);
    
    // Add mouse influence
    xSpacing = xSpacing * (1 + animationState.mouseInfluence.x * 0.1);
    ySpacing = ySpacing * (1 + animationState.mouseInfluence.y * 0.1);

    // Background with subtle gradient
    context.save();
    context.globalCompositeOperation = 'destination-under';
    let gradient = context.createRadialGradient(
        canvas.width/2, canvas.height/2, 10,
        canvas.width/2, canvas.height/2, canvas.width/2
    );
    gradient.addColorStop(0, "#333");
    gradient.addColorStop(1, "#111");
    context.fillStyle = gradient;
    context.fillRect(0, 0, canvas.width, canvas.height);
    context.restore();

    context.save();
    context.translate(canvas.width / 2, canvas.height / 2);
    context.rotate(baseRotation + animationState.baseRotation);

    // the pattern zone
    group = groupName;

    // test corners
    context.lineWidth = 2;
    var corner0 = getCorner(0, groupName);
    var corner1 = getCorner(1, groupName);
    context.strokeStyle = "#333";
    var corner2 = getCorner(2, groupName);
    context.strokeStyle = "#fff";
    var center = { x: 0, y: 0 };
    var corner3;
    if (polygonSides == 4) {
        corner3 = getCorner(3, groupName);
        context.strokeStyle = "#666";
        center.x = (corner3.x + corner0.x) / 2;
        center.y = (corner3.y + corner0.y) / 2;
    }
    else {
        center.x = (corner0.x + corner1.x + corner2.x) / 3;
        center.y = (corner0.y + corner1.y + corner2.y) / 3;
    }

    // outline
    context.strokeStyle = "#333";
    if (polygonSides == 3) {
        drawStroke(corner1.x, corner1.y, corner2.x, corner2.y);
        drawStroke(corner2.x, corner2.y, corner0.x, corner0.y);
    }
    else {
        drawStroke(corner1.x, corner1.y, corner3.x, corner3.y);
        drawStroke(corner3.x, corner3.y, corner2.x, corner2.y);
        drawStroke(corner2.x, corner2.y, corner0.x, corner0.y);
    }

    // inset outline
    var blend = 0.25 + Math.sin(timestamp / 1000) * 0.1; // Animate the blend factor
    inset0 = { x: lerp(corner0.x, center.x, blend), y: lerp(corner0.y, center.y, blend) };
    inset1 = { x: lerp(corner1.x, center.x, blend), y: lerp(corner1.y, center.y, blend) };
    inset2 = { x: lerp(corner2.x, center.x, blend), y: lerp(corner2.y, center.y, blend) };
    if (polygonSides == 4)
        inset3 = { x: lerp(corner3.x, center.x, blend), y: lerp(corner3.y, center.y, blend) };
    
    context.lineWidth = 2 + Math.sin(timestamp / 800) * 0.5; // Animate line width
    context.strokeStyle = pick(animationState.colorPalette);
    drawStroke(inset0.x, inset0.y, inset1.x, inset1.y);
    
    if (polygonSides == 3) {
        drawStroke(inset1.x, inset1.y, inset2.x, inset2.y);
        drawStroke(inset2.x, inset2.y, inset0.x, inset0.y);
    }
    else {
        drawStroke(inset1.x, inset1.y, inset3.x, inset3.y);
        drawStroke(inset3.x, inset3.y, inset2.x, inset2.y);
        drawStroke(inset2.x, inset2.y, inset0.x, inset0.y);
    }

    // Number of elements changes with time
    let elementCount = 32 + Math.sin(timestamp / 2000) * 16;
    
    for (var i = 0; i < elementCount; i++) {
        context.save();
        context.lineWidth = 4 + Math.sin(timestamp / 500 + i) * 2;
        context.globalAlpha = 0.6 + Math.sin(timestamp / 1000 + i * 0.1) * 0.4;
        
        // Use more vibrant colors from our palette
        context.strokeStyle = pick(animationState.colorPalette);

        var x0 = dRandomFloatIn(-xSpacing, xSpacing);
        var y0 = dRandomFloatIn(-ySpacing, ySpacing);
        var x1 = dRandomFloatIn(-xSpacing, xSpacing);
        var y1 = dRandomFloatIn(-ySpacing, ySpacing);
        
        // Create more varied patterns
        let patternType = (i + Math.floor(timestamp / 1000)) % 4;
        
        switch(patternType) {
            case 0:
                // Lines
                drawStroke(x0, y0, x1, y1);
                break;
            case 1:
                // Circles
                context.beginPath();
                let radius = 5 + Math.sin(timestamp / 500 + i) * 3;
                context.arc(x0, y0, radius, 0, Math.PI * 2);
                context.stroke();
                break;
            case 2:
                // Squares
                let size = 10 + Math.sin(timestamp / 600 + i) * 5;
                context.strokeRect(x0 - size/2, y0 - size/2, size, size);
                break;
            case 3:
                // Small triangles
                context.beginPath();
                context.moveTo(x0, y0);
                context.lineTo(x0 + 10, y0 + 5);
                context.lineTo(x0 + 5, y0 + 15);
                context.closePath();
                context.stroke();
                break;
        }
        
        context.restore();
    }
    // end of pattern zone

    context.restore();
    
    // Request next animation frame
    requestAnimationFrame((timestamp) => drawPattern(canvasName, groupName, timestamp));
}

/*
draws a single linear stroke
respects the symmetries of the pattern
*/
function drawStroke(startX, startY, endX, endY) {
    context.save();

    var xCount = canvas.height / xSpacing + 2;
    var yCount = canvas.height / ySpacing + 2;

    // Make jitter responsive to animation
    var jitterAmount = 0.1 + animationState.noiseOffset * 0.05;

    for (var y = 0; y < yCount; y++) {
        for (var x = 0; x < xCount; x++) {
            context.save();
            context.translate((x - xCount / 2 + (y - yCount / 2) * shear) * xSpacing, (y - yCount / 2) * ySpacing);

            // determine rotation for this instance
            var currentRotation = rotateRule * x + rowRotateRule * y + rotationOffset + animationState.baseRotation * 0.2;
            context.rotate(currentRotation);
            // determine x flip for this instance
            if ((xFlip) && (x % 2 == 0)) {
                context.scale(-1, 1);
                context.translate(xSpacing, 0);
            }
            // determine y flip for this instance
            if ((yFlip) && (x % 2 == 0))
                context.scale(1, -1);
            if ((yFlipPairs) && (Math.floor(x / 2) % 2 == 0))
                context.scale(1, -1);
            if ((yFlipRows) && (y % 2 == 0)) {
                context.scale(1, -1);
                context.translate(0, ySpacing);
            }

            for (var i = 0; i < instancesPerStep; i++) {
                context.save();
                context.rotate(i * (2.0 * Math.PI / instancesPerStep));
                // replace with bounds awareness
                // for radial rules with mirroring per instance
                var flipMax = 0;
                if (mirrorInstances)
                    flipMax = 2;
                for (var flip = -1; flip <= flipMax; flip += 2) {
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

// Create a triangle with animation parameters
function drawTriangle(x0, y0, x1, y1, x2, y2, groupName) {
    context.save();

    var xCount = canvas.height / xSpacing + 2;
    var yCount = canvas.height / ySpacing + 2;

    // Animate jitter amount
    var jitterAmount = 0.1 + Math.sin(Date.now() / 500) * 0.05;

    for (var y = 0; y < yCount; y++) {
        for (var x = 0; x < xCount; x++) {
            context.save();
            context.translate((x - xCount / 2 + (y - yCount / 2) * shear) * xSpacing, (y - yCount / 2) * ySpacing);

            if (autoInvert) {
                var adjust = 0;
                if ((groupName == "p1")
                    || (groupName == "cm"))
                    adjust = y % 2;
                if (groupName == "pg")
                    adjust = x % 2;
                var colorGroup = (x + y + adjust) % 2;
            }

            // determine rotation for this instance with animation
            var currentRotation = rotateRule * x + rowRotateRule * y + rotationOffset + animationState.baseRotation;
            context.rotate(currentRotation);
            // determine x flip for this instance
            if ((xFlip) && (x % 2 == 0)) {
                context.scale(-1, 1);
                context.translate(xSpacing, 0);
            }
            // determine y flip for this instance
            if ((yFlip) && (x % 2 == 0))
                context.scale(1, -1);
            if ((yFlipPairs) && (Math.floor(x / 2) % 2 == 0))
                context.scale(1, -1);
            if ((yFlipRows) && (y % 2 == 0)) {
                context.scale(1, -1);
                context.translate(0, ySpacing);
            }

            for (var i = 0; i < instancesPerStep; i++) {
                context.save();
                context.rotate(i * (2.0 * Math.PI / instancesPerStep));
                // for radial rules with mirroring per instance
                var flipMax = 0;
                if (mirrorInstances)
                    flipMax = 2;
                for (var flip = -1; flip <= flipMax; flip += 2) {
                    context.save();

                    // color group for radial rules
                    if (groupName == "p31m")
                        colorGroup = flip < 0;
                    if (groupName == "p3m1")
                        colorGroup = flip < 0;
                    if (groupName == "p6") {
                        colorGroup = i % 2;
                    }
                    if (groupName == "p6m") {
                        colorGroup = flip > 0;
                    }

                    if (autoInvert) {
                        if (colorGroup == 0)
                            context.fillStyle = pick(animationState.colorPalette);
                        else
                            context.fillStyle = pick(animationState.colorPalette);
                    } else {
                        // Use our flower palette
                        context.fillStyle = pick(animationState.colorPalette);
                    }
                    
                    context.scale(1, flip);
                    context.beginPath();
                    context.moveTo(jitter(x0, jitterAmount), jitter(y0, jitterAmount));
                    context.lineTo(jitter(x1, jitterAmount), jitter(y1, jitterAmount));
                    context.lineTo(jitter(x2, jitterAmount), jitter(y2, jitterAmount));
                    context.closePath();
                    context.fill();
                    context.restore();
                }
                context.restore();
            }
            context.restore();
        }
    }

    context.restore();
}

// Create a canvas for the pattern and set up animation
function makePatternCanvas(parentDiv, r) {
    parentDiv.innerHTML = "";

    var newCanvas = document.createElement("canvas");
    newCanvas.width = parentDiv.clientWidth;
    newCanvas.height = parentDiv.clientHeight;
    newCanvas.id = "patternCanvas" + r;
    newCanvas.style.border = 0;
    newCanvas.style.margin = 0;
    parentDiv.appendChild(newCanvas);

    // Set up resize handler
    window.addEventListener('resize', function() {
        if (parentDiv.clientWidth > 0 && parentDiv.clientHeight > 0) {
            newCanvas.width = parentDiv.clientWidth;
            newCanvas.height = parentDiv.clientHeight;
        }
    });
}

// Setup tilings with animation
function setupTilingPatterns(parentDiv, poem, r) {
    parentDiv.style.padding = 0;
    makePatternCanvas(parentDiv, r);

    randomize(); // dither pattern
    
    // Choose pattern based on poem content
    let patternSelector = 0;
    if (poem) {
        // Use characteristics of the poem to influence pattern choice
        let periods = (poem.match(/\./g) || []).length;
        let commas = (poem.match(/,/g) || []).length;
        let spaces = (poem.match(/ /g) || []).length;
        
        patternSelector = (periods + commas * 2 + spaces / 10) % 3;
    }
    
    group = pick(groupNameString);
    baseRotation = dRandomFloat() * Math.PI * 2;
    
    // Store this pattern in the active patterns
    animationState.activePatterns.push({
        canvasId: "patternCanvas" + r,
        group: group,
        startTime: Date.now()
    });
    
    if (patternSelector < 1) {
        console.log("wallpaper " + group);
        // Start the animation loop
        requestAnimationFrame((timestamp) => drawPattern("patternCanvas" + r, group, timestamp));
    }
    else if (patternSelector < 2) {
        console.log("glass");
        drawGlass("patternCanvas" + r, poem);
    }
    else {
        console.log("flower");
        drawFlower("patternCanvas" + r, poem);
    }
}

// Update mouse influence
function updateMouseInfluence(x, y) {
    // Convert screen coordinates to -1 to 1 range
    const windowWidth = window.innerWidth;
    const windowHeight = window.innerHeight;
    
    animationState.mouseInfluence.x = (x / windowWidth * 2) - 1;
    animationState.mouseInfluence.y = (y / windowHeight * 2) - 1;
}

// Function to handle mouse movement
function handleMouseMove(event) {
    updateMouseInfluence(event.clientX, event.clientY);
}

// Function to handle touch movement
function handleTouchMove(event) {
    if (event.touches.length > 0) {
        updateMouseInfluence(event.touches[0].clientX, event.touches[0].clientY);
    }
}

// Enhanced flower generator with animation
function drawFlower(c, poem) {
    var canvas = document.getElementById(c);
    context = canvas.getContext('2d');
    width = canvas.clientWidth;
    height = canvas.clientHeight;

    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1;

    var hm = Math.random() < 0.5 ? -1 : 1;

    // Parse poem metrics for visualization
    var text = poem ? poem.toString() : "flower bloom beauty nature";
    var textlength = text.length;
    var period = (text.match(/\./g) || []).length * (Math.random() * 10) || 5;
    var comma = (text.match(/,/g) || []).length * (Math.random() * 10) || 3;
    var space = (text.match(/ /g) || []).length * (Math.random() * 10) || 10;
    var dash = (text.match(/-/g) || []).length * (Math.random() * 10) || 2;
    var upper = text.replace(/[a-z]/g, '').length * (Math.random() * 10) || 5;
    var lower = text.replace(/[A-Z]/g, '').length * (Math.random() * 10) || 20;

    quality = textlength / (0.007 * textlength) || 100;

    canvas = document.getElementById(c);
    context = canvas.getContext('2d');
    width = canvas.clientWidth;
    height = canvas.clientHeight;
    radius = (Math.random() * (period + comma + dash)) || 20;

    // number of layers
    quality = quality;
    layers = [];
    // width/height of layers
    layerSize = comma * (Math.random() * 30) + (Math.random() * quality) * 0.2 || 30;

    function initialize() {
        for (var i = 0; i < quality; i++) {
            layers.push({
                x: width / 2 + Math.sin(i / quality * 2 * Math.PI) * (radius - layerSize),
                y: height / 2 + Math.cos(i / quality * 2 * Math.PI) * (radius - layerSize),
                r: i / 1000 * Math.PI
            });
        }

        resize();

        // Initial rendering
        for (d = 50; d < Math.floor(Math.random() * 350); d++) {
            update();
        }
        
        // Set up animation loop
        animateFlower();
    }

    function animateFlower() {
        // Subtly update the layers
        for (var i = 0; i < layers.length; i++) {
            layers[i].r += 0.01;
            layers[i].x += Math.sin(Date.now() / 1000 + i) * 0.2;
            layers[i].y += Math.cos(Date.now() / 1000 + i * 0.5) * 0.2;
        }
        
        // Redraw
        paint();
        
        // Continue animation
        requestAnimationFrame(animateFlower);
    }

    function resize() {
        canvas.width = width;
        canvas.height = height;
    }

    function update() {
        step();
        paint();
    }

    // step take
    function step() {
        for (var i = 0, len = layers.length; i < len; i++) {
            layers[i].r += 1;
        }
    }

    // current state
    function paint() {
        // Clear with semi-transparent background for trail effect
        context.fillStyle = "rgba(20, 20, 20, 0.1)";
        context.fillRect(0, 0, canvas.width, canvas.height);
        
        var layersLength = layers.length;
        for (var i = 0, len = layersLength; i < len; i++) {
            context.save();
            context.globalCompositeOperation = 'screen';
            paintLayer(layers[i]);
            context.restore();
        }
    }

    // paints one layer
    function paintLayer(layer, mask) {
        context.save();
        context.globalCompositeOperation = 'destination-under';
        context.fillStyle = "#555";
        context.fillRect(0, 0, canvas.width, canvas.height);
        context.restore();

        context.beginPath();
        context.arc(width / 2, height / 2, width / 2, 0, Math.PI * 2);

        context.beginPath();
        context.translate(layer.x, layer.y);
        context.rotate(layer.r);
        
        // Use colors from our flower palette
        context.strokeStyle = pick(animationState.colorPalette);

        context.globalAlpha = ((Math.random() * 10) * 1);

        function first() {
            context.lineWidth = (Math.random() * comma);
            var randwidth = (Math.random() * width) / (((Math.random() * 6) * 0.1) + 4);
            var randheight = (Math.random() * height) / (((Math.random() * 6) * 0.1) + 4);

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
            context.arcTo(randwidth + space * 0.03, randheight + space * 0.03, randwidth + space * 0.03, randheight + space * 0.03, dash);
            context.stroke();
        }

        function second() {
            context.lineWidth = (Math.random() * 10) + 0.2;
            var randwidth = (Math.random() * width) / (((Math.random() * 6) * 0.6) + 2);
            var randheight = (Math.random() * height) / (((Math.random() * 6) * 0.6) + 2);

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
            context.arcTo(randwidth + (Math.random() * space) * 0.05, randheight + (Math.random() * space) * 0.05, randwidth + space * 0.05, randheight + space * 0.05, (Math.random() * textlength));
            context.strokeRect(lower * Math.random() * 0.9, -period * Math.random() * 0.9, -period * Math.random() * 0.9, comma * Math.random() * 0.9);
        }

        function third() {
            context.lineWidth = (Math.random() * 10) * 0.3;

            var randwidth = width / (Math.random() * 100);
            var randheight = height / (Math.random() * 100);

            context.globalAlpha = 0.1;
            context.arcTo(randwidth + (Math.random() * space) * 0.05, randheight + (Math.random() * space) * 0.05, randwidth + space * 0.05, randheight + space * 0.05, (Math.random() * textlength));
            context.stroke();
        }

        function fourth() {
            context.lineWidth = 3.1;

            context.setLineDash([comma, period, dash]);
            context.lineDashOffset = 2;
            context.globalAlpha = 0.3;
            context.strokeRect(-upper * Math.random() * 0.7, -comma * Math.random() * 0.7, period * Math.random() * 0.7, period * Math.random() * 0.7);
            context.globalAlpha = 0.3;
            context.strokeRect(lower * Math.random() * 0.9, -period * Math.random() * 0.9, -period * Math.random() * 0.9, comma * Math.random() * 0.9);
        }

        function fifth() {
            context.lineWidth = (Math.random() * 10) + 1;

            var randwidth = (Math.random() * width) / (((Math.random() * 6) * 0.1) + 4);
            var randheight = (Math.random() * height) / (((Math.random() * 6) * 0.1) + 4);
            var um = Math.random() * 5;

            context.globalAlpha = 0.3;
            context.moveTo(randwidth, randheight);
            context.lineTo(randwidth - Math.random() * um, randheight - Math.random() * um);
            context.stroke();
            context.lineTo(randwidth - Math.random() * um, randheight - Math.random() * um);
            context.stroke();
            //
            context.globalAlpha = 0.2;
            context.moveTo(randwidth + comma, randheight + comma);
            context.lineTo(randwidth - period, randheight - period);
            context.stroke();
            context.globalAlpha = 0.1;
            context.arcTo(randwidth + space * 0.02, randheight + space * 0.02, randwidth + space * 0.03, randheight + space * 0.03, dash);
            context.stroke();
        }

        function sixth() {
            context.lineWidth = (Math.random() * 10) + 0.4;
            var randwidth = (Math.random() * width) / (((Math.random() * 6) * 0.1) + 5);
            var randheight = (Math.random() * height) / (((Math.random() * 6) * 0.1) + 5);

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

        var modifier = (Math.floor(Math.random() * 100)) * hm * 0.01;
        var option = text.length * 0.005 + modifier;
        if (option < 1) { first(); }
        else if (option > 1 && option < 2) { second(); }
        else if (option > 2 && option < 3) { sixth(); }
        else if (option > 3 && option < 4) { fourth(); }
        else if (option > 4 && option < 5) { fifth(); }
        else { sixth(); }

        context.restore();
    }

    initialize();
    
    // Add event listeners for interaction
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove);
}

// Enhanced glass generator with animation
function drawGlass(c, poem) {
    var canvas = document.getElementById(c);
    context = canvas.getContext('2d');
    width = canvas.clientWidth;
    height = canvas.clientHeight;

    context.globalCompositeOperation = "source-over";
    context.globalAlpha = 1;

    function animateGlass() {
        // Clear with semi-transparent black for motion trail
        context.fillStyle = "rgba(20, 20, 20, 0.1)";
        context.fillRect(0, 0, width, height);
        
        // Parameters that change with time
        var time = Date.now() / 1000;
        var sides = Math.floor(5 + Math.sin(time * 0.2) * 3 + 10);
        var angleRotate = time * 20 % 360;
        var sizeGen = 15 + Math.sin(time * 0.5) * 10;
        
        // Draw the glass effect
        context.save();
        context.translate(width / 2, height / 2);
        context.rotate(angleRotate * Math.PI / 180);
        
        // Central shape
        var numberOfSides = sides;
        var size = sizeGen;
        
        context.beginPath();
        context.moveTo(size * Math.cos(0), size * Math.sin(0));
        
        for (var i = 1; i <= numberOfSides; i += 1) {
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
        context.fillStyle = pick(animationState.colorPalette);
        context.fill();
        context.restore();
        
        context.stroke();
        context.closePath();
        
        // Initial shape
        context.moveTo(size * Math.cos(0), size * Math.sin(0));
        
        for (var i = 1; i <= numberOfSides; i += 1) {
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
            context.fillStyle = pick(animationState.colorPalette);
            context.restore();
            
            context.lineTo(
                size * 5 * Math.cos((i) * 2 * Math.PI / numberOfSides), 
                size * 5 * Math.sin((i) * 2 * Math.PI / numberOfSides)
            );
            
            context.save();
            context.globalAlpha = 0.4;
            context.globalCompositeOperation = "overlay";
            context.fillStyle = pick(animationState.colorPalette);
            context.fill();
            context.restore();
            
            context.stroke();
            context.closePath();
        }
        
        // Inner structure
        context.moveTo(size * Math.cos(0), size * Math.sin(0));
        
        for (var i = 1; i <= numberOfSides; i += 1) {
            context.moveTo(
                size * 3 * Math.cos((i + 0.5) * 2 * (Math.PI / numberOfSides)), 
                size * 3 * Math.sin((i + 0.5) * 2 * (Math.PI / numberOfSides))
            );
            
            context.beginPath();
            context.arc(
                size * 3 * Math.cos((i + 0.5) * 2 * (Math.PI / numberOfSides)),
                size * 3 * Math.sin((i + 0.5) * 2 * (Math.PI / numberOfSides)),
                size * 3,
                0,
                2 * Math.PI
            );
            
            context.save();
            context.globalAlpha = 0.4;
            context.globalCompositeOperation = "overlay";
            context.fillStyle = pick(animationState.colorPalette);
            context.fill();
            context.restore();
            
            context.stroke();
            context.closePath();
            
            context.moveTo(
                size * Math.cos(i * 2 * Math.PI / numberOfSides), 
                size * Math.sin(i * 2 * Math.PI / numberOfSides)
            );
            context.beginPath();
            context.stroke();
            context.closePath();
            
            context.moveTo(
                size * 3 * Math.cos((i + 1) * 2 * Math.PI / numberOfSides), 
                size * 3 * Math.sin((i + 1) * 2 * Math.PI / numberOfSides)
            );
            context.moveTo(
                size * 5 * Math.cos((i + 1) * 2 * Math.PI / numberOfSides), 
                size * 5 * Math.sin((i + 1) * 2 * Math.PI / numberOfSides)
            );
            context.moveTo(
                size * 5 * Math.cos((i) * 2 * Math.PI / numberOfSides), 
                size * 5 * Math.sin((i) * 2 * Math.PI / numberOfSides)
            );
        }
        
        // Additional decorative elements
        for (var i = 1; i <= numberOfSides; i += 1) {
            context.moveTo(
                size * Math.cos(i * 2 * Math.PI / numberOfSides), 
                size * Math.sin(i * 2 * Math.PI / numberOfSides)
            );
            
            context.save();
            context.lineWidth = size / 10;
            context.beginPath();
            context.arc(
                (size * Math.cos(Math.PI * 2 / numberOfSides)) * Math.cos(i * 2 * Math.PI / numberOfSides), 
                (size * Math.cos(Math.PI * 2 / numberOfSides)) * Math.sin(i * 2 * Math.PI / numberOfSides), 
                size / numberOfSides,
                0,
                2 * Math.PI
            );
            
            context.save();
            context.globalCompositeOperation = "lighter";
            context.fillStyle = pick(animationState.colorPalette);
            context.fill();
            context.restore();
            
            context.stroke();
            context.closePath();
            context.restore();
        }
        
        context.restore();
        
        // Continue animation
        requestAnimationFrame(animateGlass);
    }
    
    // Start the animation
    animateGlass();
    
    // Add event listeners for interaction
    canvas.addEventListener('mousemove', handleMouseMove);
    canvas.addEventListener('touchmove', handleTouchMove);
}

// Randomize the pattern
function randomize() {
    neighbor = [];
    errorRange = dRandomInt(403) + 1;
    errorSubdivisions = 32;
    var remainder = 32;
    var threshold = Math.max(0, dRandomFloat() - 0.5); // when this is greater than zero, it doesn't distribute all the difference.
    var neighborCount = 4 + dRandomFloat() * 8;
    for (var i = 0; i < neighborCount; i++) {
        var newY = dRandomInt(errorRange + 1);
        var newX = dRandomInt(errorRange + 1);
        if (newY > 0)
            newX = dRandomInt(2 * errorRange + 1) - errorRange;
        var newFraction = Math.max(1, dRandomInt(Math.min(errorSubdivisions / 3, remainder)));
        neighbor.push({ x: newX, y: newY, fraction: newFraction });
        remainder -= newFraction;
    }
}

// Initialize event listeners for global mouse movement
document.addEventListener('mousemove', handleMouseMove);
document.addEventListener('touchmove', handleTouchMove);

// Export functions for use in interactive-controller.js
window.drawPatternAnimated = drawPattern;
window.drawFlowerAnimated = drawFlower;
window.drawGlassAnimated = drawGlass;
window.updateMouseInfluence = updateMouseInfluence;
