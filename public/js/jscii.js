/**
 * Enhanced Jscii - Image to ASCII converter for interactive installations
 * Based on the original jscii.js with added interactivity and animation
 */

!function() {
    // Configuration
    const config = {
        defaultWidth: 150,          // Default width for conversions
        defaultCharset: 'unicode',  // Use unicode by default
        animationInterval: 100,     // Time between animation frames (ms) 
        unicodeRanges: [            // Unicode character ranges to sample from
            [0x2500, 0x257F],       // Box Drawing
            [0x2580, 0x259F],       // Block Elements
            [0x25A0, 0x25FF],       // Geometric Shapes
            [0x2600, 0x26FF],       // Miscellaneous Symbols
            [0x2700, 0x27BF],       // Dingbats
            [0x1F300, 0x1F5FF],     // Miscellaneous Symbols and Pictographs
            [0x1F600, 0x1F64F],     // Emoticons
            [0x1F680, 0x1F6FF],     // Transport and Map Symbols
            [0x1F900, 0x1F9FF],     // Supplemental Symbols and Pictographs
        ],
        flowerUnicodeSet: [         // Unicode characters specifically for flower themes
            '❀', '✿', '✾', '❁', '✽', '✼', '✻', '✺', '✹', '✸', '✷', '✶', '✵', '✴', '❃', '❂', '❁', 
            '❀', '✿', '✾', '✽', '✼', '✻', '✺', '✹', '✸', '✷', '✶', '✵', '✴', '❃', '❂', '❁', '❀', 
            '⚘', '⚜', '☘', '♠', '♣', '♥', '♦', '♧', '♡', '♢', '⚘', '⚜', '☘', '♠', '♣', '♥', '♦',
            '░', '▒', '▓', '█', '▄', '▀', '■', '□', '▪', '▫', '▬', '▭', '▮', '▯'
        ]
    };

    // Character sets for different ASCII output styles
    const charsets = {
        // Original charset from the project
        standard: ['@', '#', '=', '?', '/', '*', ';', '"', ':', '~', '-', '_', ',', '.', '`', ' ', ' '],
        
        // More detailed charset for better gradients
        detailed: ['$', '@', 'B', '%', '8', '&', 'W', 'M', '#', '*', 'o', 'a', 'h', 'k', 'b', 'd', 'p', 'q', 'w', 'm', 'Z', 'O', '0', 'Q', 'L', 'C', 'J', 'U', 'Y', 'X', 'z', 'c', 'v', 'u', 'n', 'x', 'r', 'j', 'f', 't', '/', '\\', '|', '(', ')', '1', '{', '}', '[', ']', '?', '-', '_', '+', '~', '<', '>', 'i', '!', 'l', 'I', ';', ':', ',', '"', '^', '`', '\'', '.', ' ', ' '],
        
        // Unicode character set - dynamically generated
        unicode: [],
        
        // Flower-themed Unicode characters
        flowerUnicode: config.flowerUnicodeSet
    };

    // Populate the unicode charset
    function populateUnicodeCharset() {
        // Start with the flower-themed characters
        charsets.unicode = [...config.flowerUnicodeSet];
        
        // Add characters from the defined Unicode ranges
        config.unicodeRanges.forEach(range => {
            for (let code = range[0]; code <= range[1]; code++) {
                // Skip control characters and invalid Unicode
                if (code < 0x20 || (code >= 0x7F && code <= 0x9F)) continue;
                
                try {
                    const char = String.fromCodePoint(code);
                    charsets.unicode.push(char);
                } catch (e) {
                    // Skip any problematic characters
                }
            }
        });
        
        // Ensure the blank space is at the end for white
        charsets.unicode.push(' ');
        charsets.unicode.push(' ');
    }
    
    // Initialize Unicode charsets
    populateUnicodeCharset();

    /**
     * log when getUserMedia or when video metadata loading fail
     */
    function logError(err) { if (console && console.log) console.log('Error!', err); return false; }

    /**
     * Enhanced Jscii Class
     * Options:
     * el        - DOM node (img or video)
     * container - if supplied, ascii string will automatically be set on container innerHTML during a render
     * fn        - function, callback to fire during a render with ascii string as arguments[0]
     * width     - hi-res images/videos must be resized down, specify width and jscii will figure out height
     * color     - enable color ascii (highly experimental)
     * interval  - integer - for videos only, this is the interval between each render
     * webrtc    - bool, default false, only applicable if 'el' is a video
     * charset   - string, which character set to use ('standard', 'detailed', 'unicode', 'flowerUnicode')
     * animate   - bool, whether to animate the ASCII characters
     * invertBrightness - bool, whether to invert the brightness mapping
     * poemText  - string or array, text to embed within the ASCII pattern
     */
    function EnhancedJscii(params) {
        var self = this;

        // Basic setup from original Jscii
        var el = this.el = params.el;
        this.container = params.container;
        this.fn = typeof params.fn === 'function' ? params.fn : null;
        this.width = typeof params.width === 'number' ? params.width : config.defaultWidth;
        this.color = !!params.color;
        this.webrtc = !!params.webrtc;
        
        // Enhanced options
        this.animate = params.animate !== undefined ? !!params.animate : false;
        this.charset = params.charset || config.defaultCharset;
        this.invertBrightness = params.invertBrightness !== undefined ? !!params.invertBrightness : false;
        this.poemText = params.poemText || null;
        this.animationSpeed = params.animationSpeed || 1;
        
        // Animation state
        this.animationFrame = 0;
        this.animationTimer = null;
        
        // Canvas setup
        this.canvas = document.createElement('canvas');
        this.ctx = this.canvas.getContext('2d');

        // Character set setup
        this.chars = charsets[this.charset] || charsets.standard;
        
        // For pattern generation
        this.patternOffset = 0;
        
        // Handle different element types
        var nodeName = el.nodeName;
        if (nodeName === 'IMG') {
            el.addEventListener('load', function() { self.render(); });
        } else if (nodeName === 'VIDEO') {
            this.interval = typeof params.interval === 'number' ? params.interval : 15;

            if (this.webrtc) {
                if (typeof navigator.getUserMedia !== 'function') {
                    return logError((el.innerHTML = 'Error: browser does not support WebRTC'));
                }
                navigator.getUserMedia({ video: true, audio: false }, function(localMediaStream) {
                    self.mediaStream = localMediaStream;
                    el.src = (window.URL || window.webkitURL).createObjectURL(localMediaStream);
                }, logError);
            }
            el.addEventListener('loadeddata', function() { self.play(); });
        } else if (nodeName === 'CANVAS') {
            // Support for canvas directly
            this.render();
        }
    }

    /**
     * start rendering, for video type only
     */
    EnhancedJscii.prototype.play = function() {
        var self = this;
        self.pause().videoTimer = setInterval(function() {
            if (self.mediaStream || !self.webrtc) self.render();
        }, self.interval);
        return self;
    };

    /**
     * pause rendering, for video type only
     */
    EnhancedJscii.prototype.pause = function() {
        if (this.videoTimer) clearInterval(this.videoTimer);
        return this;
    };

    /**
     * Start ASCII animation
     */
    EnhancedJscii.prototype.startAnimation = function() {
        if (this.animationTimer) clearInterval(this.animationTimer);
        
        var self = this;
        this.animationTimer = setInterval(function() {
            self.animationFrame++;
            self.patternOffset += 0.1 * self.animationSpeed;
            
            // Periodically shuffle the charset for visual variety
            if (self.animationFrame % 30 === 0) {
                self.shuffleCharset();
            }
            
            self.render();
        }, config.animationInterval);
        
        return this;
    };

    /**
     * Stop ASCII animation
     */
    EnhancedJscii.prototype.stopAnimation = function() {
        if (this.animationTimer) clearInterval(this.animationTimer);
        this.animationTimer = null;
        return this;
    };

    /**
     * Shuffle the character set for animation effects
     */
    EnhancedJscii.prototype.shuffleCharset = function() {
        // Keep a portion of the charset ordered for brightness mapping
        let preserveCount = Math.floor(this.chars.length * 0.7);
        let preservedChars = this.chars.slice(0, preserveCount);
        
        // Shuffle the rest
        let shuffleChars = this.chars.slice(preserveCount);
        for (let i = shuffleChars.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [shuffleChars[i], shuffleChars[j]] = [shuffleChars[j], shuffleChars[i]];
        }
        
        // Combine back
        this.chars = preservedChars.concat(shuffleChars);
    };

    /**
     * getter/setter for output dimension
     */
    EnhancedJscii.prototype.dimension = function(width, height) {
        if (typeof width === 'number' && typeof height === 'number') {
            this._scaledWidth = this.canvas.width = width;
            this._scaledHeight = this.canvas.height = height;
            return this;
        } else {
            return { width: this._scaledWidth, height: this._scaledHeight };
        }
    };

    /**
     * gets context image data, perform ascii conversion, append string to container
     */
    EnhancedJscii.prototype.render = function() {
        var el = this.el, nodeName = el.nodeName, ratio;
        var dim = this.dimension(), width, height;
        
        if (!dim.width || !dim.height) {
            ratio = nodeName === 'IMG' ? el.height / el.width : el.videoHeight / el.videoWidth;
            this.dimension(this.width, parseInt(this.width * ratio, 10));
            dim = this.dimension();
        }
        
        width = dim.width;
        height = dim.height;

        // Might take a few cycles before we
        if (!width || !height) return;

        this.ctx.drawImage(this.el, 0, 0, width, height);
        this.imageData = this.ctx.getImageData(0, 0, width, height).data;
        
        // Generate ASCII with optional animation effects
        var asciiStr;
        if (this.animate) {
            asciiStr = this.getAnimatedAsciiString();
        } else {
            asciiStr = this.getAsciiString();
        }
        
        // If we have poem text, embed it
        if (this.poemText) {
            asciiStr = this.embedPoemInAscii(asciiStr);
        }
        
        if (this.container) this.container.innerHTML = asciiStr;
        if (this.fn) this.fn(asciiStr);
        
        // If animation is enabled and not already running, start it
        if (this.animate && !this.animationTimer) {
            this.startAnimation();
        }
        
        return this;
    };

    /**
     * given a picture/frame's pixel data and a defined width and height
     * return the ASCII string representing the image
     */
    EnhancedJscii.prototype.getAsciiString = function() {
        var getChar = function(val, chars) {
            return chars[parseInt(val * (chars.length - 1), 10)];
        };

        var dim = this.dimension(), width = dim.width, height = dim.height;
        var len = width * height, d = this.imageData, str = '';

        // Helper function to retrieve rgb value from pixel data
        var getRGB = function(i) { return [d[i = i * 4], d[i + 1], d[i + 2]]; };

        for (var i = 0; i < len; i++) {
            if (i % width === 0) str += '\n';
            var rgb = getRGB(i);
            var val = Math.max(rgb[0], rgb[1], rgb[2]) / 255;
            
            // Optionally invert brightness mapping
            if (this.invertBrightness) {
                val = 1 - val;
            }
            
            if (this.color) {
                str += '<font style="color: rgb(' + rgb.join(',') + ')">' + getChar(val, this.chars) + '</font>';
            } else {
                str += getChar(val, this.chars);
            }
        }
        return str;
    };

    /**
     * Generate ASCII string with animation effects
     */
    EnhancedJscii.prototype.getAnimatedAsciiString = function() {
        var getChar = function(val, chars, i, j) {
            // Apply pattern offset to create wave-like effects
            val = (val + Math.sin(i/10 + this.patternOffset) * 0.1 + Math.cos(j/10 + this.patternOffset) * 0.1);
            val = Math.max(0, Math.min(1, val)); // Clamp to 0-1 range
            return chars[parseInt(val * (chars.length - 1), 10)];
        }.bind(this);

        var dim = this.dimension(), width = dim.width, height = dim.height;
        var len = width * height, d = this.imageData, str = '';

        // Helper function to retrieve rgb value from pixel data
        var getRGB = function(i) { return [d[i = i * 4], d[i + 1], d[i + 2]]; };

        for (var y = 0; y < height; y++) {
            str += '\n';
            for (var x = 0; x < width; x++) {
                var i = y * width + x;
                var rgb = getRGB(i);
                var val = Math.max(rgb[0], rgb[1], rgb[2]) / 255;
                
                // Optionally invert brightness mapping
                if (this.invertBrightness) {
                    val = 1 - val;
                }
                
                if (this.color) {
                    // Animate color by shifting hue
                    var hsl = rgbToHsl(rgb[0], rgb[1], rgb[2]);
                    hsl[0] = (hsl[0] + this.patternOffset * 0.1) % 1;
                    var animatedRgb = hslToRgb(hsl[0], hsl[1], hsl[2]);
                    
                    str += '<font style="color: rgb(' + animatedRgb.join(',') + ')">' + getChar(val, this.chars, x, y) + '</font>';
                } else {
                    str += getChar(val, this.chars, x, y);
                }
            }
        }
        return str;
    };

    /**
     * Embed poem text within the ASCII art
     */
    EnhancedJscii.prototype.embedPoemInAscii = function(asciiStr) {
        if (!this.poemText) return asciiStr;
        
        // Convert to array if it's a string
        var poemLines = Array.isArray(this.poemText) ? this.poemText : this.poemText.split('\n');
        
        // Split the ASCII into lines
        var asciiLines = asciiStr.split('\n');
        
        // Calculate where to start embedding the poem
        var startLine = Math.floor((asciiLines.length - poemLines.length) / 2);
        if (startLine < 0) startLine = 0;
        
        // Embed each line of the poem
        for (var i = 0; i < poemLines.length; i++) {
            var targetLine = startLine + i;
            if (targetLine >= asciiLines.length) break;
            
            var poemLine = poemLines[i];
            var asciiLine = asciiLines[targetLine];
            
            // Calculate centering
            var startPos = Math.floor((asciiLine.length - poemLine.length) / 2);
            if (startPos < 0) startPos = 0;
            
            // Check if line contains HTML tags (for color)
            if (asciiLine.indexOf('<font') >= 0) {
                // This is more complex - we'd need to parse HTML properly
                // For simplicity, we'll just highlight the entire line
                asciiLines[targetLine] = '<span style="background-color: rgba(0,0,0,0.5); color: white;">' + 
                                        poemLine + '</span>';
            } else {
                // Replace the middle portion with the poem line
                var newLine = asciiLine.substring(0, startPos);
                newLine += '<span style="background-color: rgba(0,0,0,0.5); color: white;">' + 
                           poemLine + '</span>';
                newLine += asciiLine.substring(startPos + poemLine.length);
                asciiLines[targetLine] = newLine;
            }
        }
        
        return asciiLines.join('\n');
    };

    /**
     * Create a new EnhancedJscii instance with specified parameters
     */
    function createJscii(params) {
        return new EnhancedJscii(params);
    }

    /**
     * Utility function to convert RGB to HSL
     * Based on: https://en.wikipedia.org/wiki/HSL_and_HSV#From_RGB
     */
    function rgbToHsl(r, g, b) {
        r /= 255, g /= 255, b /= 255;
        var max = Math.max(r, g, b), min = Math.min(r, g, b);
        var h, s, l = (max + min) / 2;

        if (max == min) {
            h = s = 0; // achromatic
        } else {
            var d = max - min;
            s = l > 0.5 ? d / (2 - max - min) : d / (max + min);
            switch (max) {
                case r: h = (g - b) / d + (g < b ? 6 : 0); break;
                case g: h = (b - r) / d + 2; break;
                case b: h = (r - g) / d + 4; break;
            }
            h /= 6;
        }

        return [h, s, l];
    }

    /**
     * Utility function to convert HSL to RGB
     * Based on: https://en.wikipedia.org/wiki/HSL_and_HSV#HSL_to_RGB
     */
    function hslToRgb(h, s, l) {
        var r, g, b;

        if (s == 0) {
            r = g = b = l; // achromatic
        } else {
            var hue2rgb = function(p, q, t) {
                if (t < 0) t += 1;
                if (t > 1) t -= 1;
                if (t < 1/6) return p + (q - p) * 6 * t;
                if (t < 1/2) return q;
                if (t < 2/3) return p + (q - p) * (2/3 - t) * 6;
                return p;
            };

            var q = l < 0.5 ? l * (1 + s) : l + s - l * s;
            var p = 2 * l - q;
            r = hue2rgb(p, q, h + 1/3);
            g = hue2rgb(p, q, h);
            b = hue2rgb(p, q, h - 1/3);
        }

        return [Math.round(r * 255), Math.round(g * 255), Math.round(b * 255)];
    }

    // Export our enhanced Jscii functions
    window.EnhancedJscii = EnhancedJscii;
    window.createJscii = createJscii;
    
    // Also export the original Jscii for compatibility
    window.Jscii = EnhancedJscii;

}();
