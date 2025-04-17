// Enhanced Poem Generator for Interactive Installation
// Based on the original generator.js

// Configuration
const config = {
    apiEndpoint: 'https://api.conceptnet.io/c/en/',
    apiParams: '?filter=/c/en&limit=200',
    transitionTime: 10000,   // Time between poem transitions (ms)
    maxPoemsPerCollection: 20,
    useLocalFallback: true,  // Use local wordset if API fails
    flowerTheme: true        // Focus on flower-related words
};

// Word sets - expanded with flower-themed words for the party
const wordset = [
    // Core flower words
    "flower", "petal", "bloom", "garden", "blossom", "rose", "daisy", "sunflower", 
    "tulip", "lily", "orchid", "bouquet", "wildflower", "meadow", "floral",
    
    // Related concepts
    "spring", "butterfly", "nectar", "pollen", "fragrance", "seeds", "stem", "bud",
    "grow", "plant", "soil", "root", "leaf", "thorn", "color", "beauty",
    
    // Garden concepts
    "garden", "vine", "bee", "pollinate", "sunshine", "dew", "rain", "breeze",
    "grow", "nurture", "pruning", "arrangement", "perennial", "annual",
    
    // Emotional concepts
    "love", "delicate", "admire", "gift", "celebration", "memory", "joy", "nature",
    "bloom", "flourish", "wither", "cycle", "renewal", "ephemeral", "eternal",
    
    // Original dataset words
    "cliff", "forest", "city", "home", "light", "excess", "clean",
    "crossroads", "horizon", "road", "settlement", "boulder", "outcropping", 
    "signpost", "well", "shelter", "storm", "scrub", "railroad"
];

// Storage for our generated poems and related words
let state = {
    currentWord: "",
    relatedWords: [],
    poemCollection: [],
    pendingPoems: [],
    processingQueue: false,
    lastGenerationTime: 0,
    sentArr: []  // Collected sentences to avoid repetition
};

// Mock sentence database - would be replaced with actual data
const sampleSentences = [
    "i've never picked a protected flower",
    "held its petals with gentle fingers",
    "watching colors fade in the sunlight",
    "the garden grows wild in spring",
    "untamed beauty blooms between fences",
    "nature claims what we abandon",
    "she collects dried flowers",
    "preserves memories in pressed petals",
    "a fragile archive of summer",
    "pollen drifts through afternoon light",
    "microscopic journeys of creation",
    "the invisible dance of flowers",
    "a single rose on the windowsill",
    "defiant against winter's approach",
    "the last bloom of autumn",
    "wildflowers grow through concrete cracks",
    "persistent reminders of nature's strength",
    "beauty finds a way",
    "i wait for tulips every spring",
    "bright promises of warmth returning",
    "petals unfurling in slow motion",
    "she planted sunflower seeds along the fence",
    "tall sentinels tracking the sun's path",
    "golden faces nodding in agreement",
    "the scent of jasmine fills the evening air",
    "invisible tendrils of sweetness",
    "memories triggered by fragrance",
    "flowers pressed between book pages",
    "preserved moments of past summers",
    "flattened beauty still vibrant with color",
    "morning dew collects on spider webs",
    "transforming threads into crystal necklaces",
    "temporary jewelry for garden sculptures"
];

// Initialize the poem generator
function initPoemGenerator() {
    console.log("Initializing poem generator...");
    
    // Start with a random flower-themed word
    state.currentWord = getRandomWord();
    
    // Begin the generation process
    generateRelatedWords(state.currentWord);
    
    // Set up interval for poem generation
    setInterval(checkAndGeneratePoem, 1000);
}

// Get a random word from our wordset
function getRandomWord() {
    return wordset[Math.floor(Math.random() * wordset.length)];
}

// Generate related words using ConceptNet API
function generateRelatedWords(word) {
    console.log(`Generating related words for: ${word}`);
    
    if (config.useLocalFallback) {
        // Simulate API response with local processing
        simulateConceptNetResponse(word);
        return;
    }
    
    // In a real implementation, this would call the ConceptNet API
    // Using the endpoint: config.apiEndpoint + word + config.apiParams
    // For demonstration purposes, we'll use the simulation
    simulateConceptNetResponse(word);
}

// Simulate ConceptNet API response
function simulateConceptNetResponse(word) {
    // Create a mapping of words to related concepts
    const wordMap = {
        // Flower-specific relationships
        "flower": ["petal", "bloom", "garden", "blossom", "bouquet", "floral", "fragrance"],
        "petal": ["flower", "soft", "fragile", "color", "rose", "fall", "delicate"],
        "bloom": ["flower", "open", "spring", "growth", "blossom", "flourish", "vibrant"],
        "garden": ["flower", "grow", "plant", "nature", "cultivate", "soil", "beauty"],
        "blossom": ["tree", "flower", "spring", "beauty", "fragrance", "cherry", "bloom"],
        "rose": ["thorn", "red", "love", "flower", "romance", "valentine", "fragrance"],
        "daisy": ["field", "simple", "white", "flower", "chain", "innocent", "meadow"],
        "sunflower": ["sun", "tall", "yellow", "seed", "summer", "field", "bright"],
        "tulip": ["spring", "bulb", "holland", "color", "festival", "garden", "flower"],
        "lily": ["water", "peace", "white", "easter", "pond", "flower", "pure"],
        
        // General concepts
        "nature": ["outdoor", "wild", "environment", "natural", "earth", "beauty", "forest"],
        "beauty": ["aesthetic", "attractive", "pleasing", "art", "elegant", "grace", "harmony"],
        "fragrance": ["scent", "aroma", "smell", "perfume", "sweet", "essence", "flower"],
        "color": ["hue", "shade", "vibrant", "palette", "rainbow", "spectrum", "pigment"],
        "spring": ["season", "flower", "bloom", "growth", "renewal", "fresh", "warm"],
    };
    
    // Get related words if we have them in our map
    let relatedWords = wordMap[word.toLowerCase()];
    
    // If we don't have specific mappings, use some general flower-related terms
    if (!relatedWords) {
        const flowerBaseWords = ["flower", "petal", "bloom", "garden", "nature", "beauty"];
        relatedWords = flowerBaseWords.concat(
            wordset.sort(() => Math.random() - 0.5).slice(0, 5)
        );
    }
    
    // Update our state
    state.relatedWords = relatedWords.filter(word => word.length > 0);
    
    // Process the words to find matching sentences
    processRelatedWords(state.relatedWords);
}

// Process the related words to find matching sentences
function processRelatedWords(relatedWords) {
    console.log("Processing related words:", relatedWords);
    state.processingQueue = true;
    
    // In the actual implementation, this would search through your database
    // For now, we'll simulate finding matches in our sample sentences
    let matches = [];
    
    relatedWords.forEach(word => {
        // Find sentences that contain this word
        const matchingSentences = sampleSentences.filter(sentence => 
            sentence.toLowerCase().includes(word.toLowerCase()) && 
            !state.sentArr.includes(sentence)
        );
        
        // Add unique matches
        matchingSentences.forEach(sentence => {
            if (!matches.includes(sentence)) {
                matches.push(sentence);
            }
        });
    });
    
    // If we don't have enough matches, add some random sentences
    if (matches.length < 3) {
        const randomSentences = sampleSentences
            .filter(sentence => !matches.includes(sentence) && !state.sentArr.includes(sentence))
            .sort(() => Math.random() - 0.5)
            .slice(0, 5);
        
        matches = matches.concat(randomSentences);
    }
    
    // Limit to a reasonable number of sentences
    matches = matches.slice(0, 8);
    
    // Update our state
    state.pendingPoems.push({
        keyword: state.currentWord,
        sentences: matches,
        timestamp: Date.now()
    });
    
    // Track these sentences to avoid repetition
    state.sentArr = state.sentArr.concat(matches);
    
    // If we get too many tracked sentences, start removing older ones
    if (state.sentArr.length > 100) {
        state.sentArr = state.sentArr.slice(-50);
    }
    
    console.log(`Created poem based on "${state.currentWord}" with ${matches.length} lines`);
    
    // Choose a new word for the next poem - from one of the related words
    if (relatedWords.length > 0) {
        state.currentWord = relatedWords[Math.floor(Math.random() * relatedWords.length)];
    } else {
        state.currentWord = getRandomWord();
    }
    
    // Generate the next set of related words
    generateRelatedWords(state.currentWord);
    
    state.processingQueue = false;
}

// Check if we should generate a new poem
function checkAndGeneratePoem() {
    const now = Date.now();
    
    // If we're already processing or it's too soon, skip
    if (state.processingQueue || now - state.lastGenerationTime < config.transitionTime) {
        return;
    }
    
    // If we have pending poems, use one
    if (state.pendingPoems.length > 0) {
        const poem = state.pendingPoems.shift();
        state.poemCollection.push(poem);
        state.lastGenerationTime = now;
        
        // Trigger a custom event that the UI can listen for
        const poemEvent = new CustomEvent('poemGenerated', { 
            detail: { 
                poem: poem.sentences, 
                keyword: poem.keyword 
            } 
        });
        document.dispatchEvent(poemEvent);
        
        console.log(`Added poem to collection. Total poems: ${state.poemCollection.length}`);
        
        // Limit collection size
        if (state.poemCollection.length > config.maxPoemsPerCollection) {
            state.poemCollection.shift();
        }
    }
    // If we need more poems, start a new generation cycle
    else if (state.pendingPoems.length < 3) {
        generateRelatedWords(state.currentWord);
    }
}

// Function to get the current active poem
function getCurrentPoem() {
    if (state.poemCollection.length > 0) {
        return state.poemCollection[state.poemCollection.length - 1];
    }
    return null;
}

// Function to manually trigger a new poem
function triggerNewPoem() {
    state.lastGenerationTime = 0; // Reset the timer to trigger immediately
    checkAndGeneratePoem();
}

// Shuffle function for arrays
function shuffle(array) {
    for (let i = array.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [array[i], array[j]] = [array[j], array[i]];
    }
    return array;
}

// Export the poem generator functions
window.poemGenerator = {
    init: initPoemGenerator,
    getCurrentPoem: getCurrentPoem,
    triggerNewPoem: triggerNewPoem,
    getRandomWord: getRandomWord
};

// Initialize when the DOM is loaded
document.addEventListener('DOMContentLoaded', initPoemGenerator);
