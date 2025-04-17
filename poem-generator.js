/**
 * Enhanced poem generator for the flower installation
 * Integrates concepts from Everest Pipkin's original work
 */

// Extended word associations for a richer semantic network
// Similar to ConceptNet but offline
const wordAssociations = {
  flower: ['petal', 'bloom', 'garden', 'blossom', 'lotus', 'rose', 'tulip', 'orchid', 'grow', 'scent', 'fragrance', 'bouquet'],
  petal: ['flower', 'fragile', 'soft', 'fall', 'delicate', 'color', 'unfold', 'pink', 'red', 'white', 'touch', 'texture'],
  bloom: ['flower', 'open', 'spring', 'growth', 'bud', 'unfold', 'blossom', 'season', 'flourish', 'life', 'cycle'],
  garden: ['flower', 'grow', 'plant', 'soil', 'seed', 'tend', 'cultivate', 'nurture', 'plot', 'vegetable', 'herb', 'botanical'],
  nature: ['wild', 'growth', 'natural', 'earth', 'organic', 'forest', 'field', 'environment', 'ecosystem', 'harmony', 'balance'],
  light: ['sun', 'shine', 'glow', 'bright', 'dawn', 'illuminate', 'shadow', 'ray', 'beam', 'radiance', 'photosynthesis'],
  water: ['river', 'rain', 'dew', 'droplet', 'mist', 'stream', 'pool', 'hydrate', 'nourish', 'flow', 'current', 'life'],
  time: ['season', 'moment', 'cycle', 'eternal', 'ephemeral', 'fleeting', 'memory', 'history', 'present', 'future', 'past'],
  life: ['birth', 'growth', 'living', 'existence', 'vitality', 'animate', 'breathe', 'survive', 'thrive', 'organic'],
  seed: ['beginning', 'potential', 'embryo', 'start', 'origin', 'sprout', 'germinate', 'plant', 'future', 'dormant'],
  root: ['foundation', 'grounded', 'soil', 'anchor', 'underground', 'base', 'support', 'nutrient', 'depth', 'hidden'],
  soil: ['earth', 'dirt', 'ground', 'loam', 'clay', 'fertile', 'rich', 'dark', 'compost', 'humus', 'mineral'],
  sun: ['light', 'warm', 'bright', 'celestial', 'orbit', 'shine', 'heat', 'ray', 'solar', 'life', 'energy'],
  moon: ['night', 'cycle', 'wax', 'wane', 'luna', 'tide', 'celestial', 'glow', 'silver', 'crater', 'reflect'],
  season: ['change', 'cycle', 'weather', 'time', 'annual', 'periodic', 'transition', 'rhythm', 'pattern', 'nature'],
  wind: ['breeze', 'air', 'blow', 'movement', 'invisible', 'rustle', 'whisper', 'cool', 'carry', 'pollen', 'seed'],
  rain: ['water', 'fall', 'drop', 'wet', 'nourish', 'cloud', 'storm', 'gentle', 'pour', 'shower', 'sustain']
};

// Extended database of flower-themed sentences
// Inspired by Pipkin's original approach of using scraped forum posts
const sentenceDatabase = [
  "i've never picked a protected flower",
  "the garden blooms in unexpected colors",
  "petals fall silently to the ground",
  "a flower grows through cracks in concrete",
  "the scent of roses fills the room",
  "wildflowers dance in the summer breeze",
  "the lotus rises from murky waters",
  "spring brings new blossoms to bare branches",
  "morning dew glistens on flower buds",
  "bees buzz from flower to flower",
  "the orchid opens slowly over days",
  "dried flowers preserve summer memories",
  "seeds scatter in the autumn wind",
  "the night-blooming jasmine awakens at dusk",
  "a single flower stands in a simple vase",
  "roots reach deep into dark soil",
  "garden walls protect delicate blooms",
  "flowers close their petals at twilight",
  "a meadow of wildflowers stretches to the horizon",
  "rain nourishes thirsty garden beds",
  "a butterfly rests on a bright petal",
  "the gardener's hands are stained with soil",
  "flowers turn to follow the sun's path",
  "each flower carries its own story",
  "a flower can break through stone",
  "gardens reveal the passage of time",
  "water droplets magnify petal details",
  "some flowers bloom only at night",
  "the language of flowers speaks in silence",
  "each garden reflects its keeper's soul",
  "fallen petals make a soft carpet",
  "flower fields stretch to the horizon",
  "pressed flowers between book pages",
  "the winter garden sleeps beneath snow",
  "flowers teach us about impermanence",
  "a windowsill garden greets the morning sun",
  "flower crowns adorn celebration days",
  "botanical gardens preserve rare species",
  "the florist arranges with careful hands",
  "every flower begins as a tiny seed",
  "a flower's life is brief but beautiful",
  "moonlight reveals night-blooming flowers",
  "the forest floor is carpeted with wildflowers",
  "ancient gardens hide forgotten blooms",
  "fallen leaves nurture next year's flowers",
  "the first crocus breaks through melting snow",
  "desert flowers wait years to bloom",
  "pollen dusts the air with golden promise",
  "rare orchids hide in mountain shadows",
  "flower bulbs store life underground",
  "generations tend the same garden paths",
  "a terrarium holds miniature garden worlds",
  "frost etches patterns on the last autumn flowers",
  "urban gardens reclaim concrete spaces",
  "heirloom seeds carry family histories",
  "tropical flowers display outrageous color",
  "storm winds scatter magnolia petals",
  "invasive flowers change native landscapes",
  "bonsai trees bloom with tiny perfect flowers",
  "poisonous blooms warn with vibrant colors",
  "botanists catalog vanishing flower species",
  "medicinal flowers heal ancient ailments",
  "the hummingbird's favorite flower glows red",
  "sacred lotuses adorn temple ponds",
  "the last flower of summer fades slowly",
  "children string daisy chains in meadows",
  "flower essences capture subtle energies",
  "the perfumer distills flower fragrances",
  "flowers speak a wordless language of emotion",
  "floating water lilies bridge two worlds",
  "time-lapse cameras reveal flowers dancing",
  "ancient pollen tells stories of lost climates",
  "market stalls overflow with cut flowers",
  "farmers rotate flower crops with vegetables",
  "microscopes reveal flower universes",
  "a single seed pod contains multitudes",
  "sunflowers track the movement of light",
  "hybrid flowers combine unexpected traits",
  "fossilized flowers preserve ancient forms",
  "flower mandalas represent cosmic order",
  "butterfly gardens foster endangered pollinators"
];

// Set to track used sentences
const usedSentences = new Set();

/**
 * Find related words for a seed word
 * Enhanced with weighted relationships and broader connections
 * @param {string} word - The seed word
 * @param {number} count - Number of related words to return
 * @returns {string[]} Related words
 */
function findRelatedWords(word, count = 5) {
  word = word.toLowerCase();
  
  // Direct associations from our database
  let related = wordAssociations[word] || [];
  
  // If we don't have direct associations, look for the word in values
  if (related.length === 0) {
    for (const [key, values] of Object.entries(wordAssociations)) {
      if (values.includes(word)) {
        related.push(key);
        // Add some values from this key
        related = related.concat(values.filter(v => v !== word).slice(0, 4));
      }
    }
  }
  
  // Secondary connections - find words related to our related words
  // This mimics ConceptNet's broader semantic network
  if (related.length > 0 && related.length < count * 2) {
    const secondaryRelated = [];
    for (const relatedWord of related.slice(0, 3)) {
      if (wordAssociations[relatedWord]) {
        secondaryRelated.push(...wordAssociations[relatedWord].slice(0, 3));
      }
    }
    related = related.concat(secondaryRelated.filter(w => w !== word && !related.includes(w)));
  }
  
  // If still no results, use default nature/flower words
  if (related.length === 0) {
    related = ['flower', 'nature', 'garden', 'bloom', 'petal', 'seed', 'root', 'soil'];
  }
  
  // Use deterministic shuffle if available, otherwise just use standard shuffle
  const shuffleFn = window.DRand && window.DRand.dShuffle ? window.DRand.dShuffle : 
    (arr => {
      const newArr = [...arr];
      for (let i = newArr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [newArr[i], newArr[j]] = [newArr[j], newArr[i]];
      }
      return newArr;
    });
  
  // Deduplicate, shuffle and take requested count
  return [...new Set(related)].length > count 
    ? shuffleFn([...new Set(related)]).slice(0, count)
    : [...new Set(related)];
}

/**
 * Generate a poem based on a seed word
 * Enhanced with better thematic cohesion and optional styling
 * @param {string} seedWord - The word to center the poem around
 * @param {number} lineCount - Number of lines in the poem
 * @param {Object} options - Additional options
 * @returns {string[]} The generated poem
 */
function generatePoem(seedWord, lineCount = 5, options = {}) {
  const { 
    resetUsedSentences = false,
    matchThreshold = 0.5,  // How strictly to match the theme (0-1)
    allowRepeatWords = false, // Allow repeating key words across lines
    favorShortLines = true // Prefer shorter lines when available
  } = options;
  
  // Reset used sentences if requested or if we've used more than half
  if (resetUsedSentences || usedSentences.size > sentenceDatabase.length / 2) {
    usedSentences.clear();
  }
  
  // Find related words to our seed
  const relatedWords = findRelatedWords(seedWord, Math.min(12, lineCount * 2));
  const allWords = [seedWord, ...relatedWords];
  
  // Keep track of used words to avoid repetition if desired
  const usedWords = new Set();
  usedWords.add(seedWord);
  
  // Generate poem by finding sentences for each term
  const poem = [];
  const usedPatterns = new Set(); // To avoid similar sentence structures
  
  // Try each word until we have enough lines
  for (const word of allWords) {
    // Skip if we have enough lines or we're avoiding repeated words
    if (poem.length >= lineCount) break;
    if (!allowRepeatWords && usedWords.has(word)) continue;
    
    // Find sentences containing this word
    let matchingSentences = sentenceDatabase.filter(sentence => 
      sentence.toLowerCase().includes(word.toLowerCase()) && 
      !usedSentences.has(sentence)
    );
    
    // If favoring short lines, sort by length
    if (favorShortLines) {
      matchingSentences.sort((a, b) => a.length - b.length);
    }
    
    // Add a matching sentence if available
    if (matchingSentences.length > 0) {
      // Use the pick function from DRand if available, otherwise random
      const pickFn = window.DRand && window.DRand.pick ? window.DRand.pick : 
        (arr => arr[Math.floor(Math.random() * arr.length)]);
        
      const selectedSentence = pickFn(matchingSentences);
      poem.push(selectedSentence);
      usedSentences.add(selectedSentence);
      
      // Mark word as used
      usedWords.add(word);
      
      // Add some key words from the sentence to avoid repetition
      if (!allowRepeatWords) {
        const words = selectedSentence.toLowerCase().split(/\s+/);
        for (const w of words) {
          if (w.length > 4) usedWords.add(w);
        }
      }
      
      // Detect sentence pattern to avoid similar structures
      const pattern = getSentencePattern(selectedSentence);
      usedPatterns.add(pattern);
    }
  }
  
  // If we still don't have enough lines, add random unused sentences
  // Try to find sentences that match our theme through secondary connections
  while (poem.length < lineCount) {
    // Find sentences that haven't been used yet
    const unusedSentences = sentenceDatabase.filter(sentence => !usedSentences.has(sentence));
    
    if (unusedSentences.length === 0) {
      // If all sentences used, just pick any
      const randomSentence = sentenceDatabase[Math.floor(Math.random() * sentenceDatabase.length)];
      poem.push(randomSentence);
    } else {
      // Score sentences based on theme relevance
      const scoredSentences = unusedSentences.map(sentence => {
        // Count how many related words appear in the sentence
        const words = sentence.toLowerCase().split(/\s+/);
        let matchScore = 0;
        
        for (const word of words) {
          if (allWords.includes(word)) {
            matchScore += 2; // Direct match
          } else {
            // Check for partial matches
            for (const relatedWord of allWords) {
              if (word.includes(relatedWord) || relatedWord.includes(word)) {
                matchScore += 0.5; // Partial match
              }
            }
          }
        }
        
        // Adjust score based on sentence length if favoring shorter lines
        if (favorShortLines) {
          matchScore = matchScore * (1 - ((sentence.length / 80) * 0.5));
        }
        
        // Reduce score for similar patterns
        const pattern = getSentencePattern(sentence);
        if (usedPatterns.has(pattern)) {
          matchScore *= 0.7;
        }
        
        return { sentence, score: matchScore };
      });
      
      // Sort by score
      scoredSentences.sort((a, b) => b.score - a.score);
      
      // Take the top scoring sentence
      const topSentence = scoredSentences[0].sentence;
      poem.push(topSentence);
      usedSentences.add(topSentence);
      
      // Add the pattern to avoid similar structures
      usedPatterns.add(getSentencePattern(topSentence));
    }
  }
  
  return poem;
}

/**
 * Get a simplified pattern of the sentence structure
 * Used to avoid repetitive sentence patterns
 * @param {string} sentence - The sentence to analyze
 * @returns {string} A simplified pattern representation
 */
function getSentencePattern(sentence) {
  // Create a very simplified representation of the sentence structure
  return sentence
    .replace(/[a-z]+/gi, 'W') // Words to W
    .replace(/\s+/g, ' ')     // Normalize spaces
    .replace(/WWW+/g, 'W3')   // Multiple words to W3
    .replace(/WW/g, 'W2')     // Two words to W2
    .substring(0, 10);        // Just the start of the pattern
}

/**
 * Get a random seed word from our word associations
 * @returns {string} A random seed word
 */
function getRandomSeedWord() {
  const seeds = Object.keys(wordAssociations);
  
  // Use the DRand pick function if available, otherwise use standard random
  if (window.DRand && window.DRand.pick) {
    return window.DRand.pick(seeds);
  }
  
  return seeds[Math.floor(Math.random() * seeds.length)];
}

/**
 * Find a new seed word based on the current poem
 * This helps create a thematic flow between poems
 * @param {string[]} poem - The current poem
 * @returns {string} A new seed word
 */
function findNextSeedWord(poem) {
  if (!poem || poem.length === 0) {
    return getRandomSeedWord();
  }
  
  // Extract all words from the poem
  const allWords = poem.join(' ').toLowerCase().split(/\s+/);
  
  // Filter to words that are in our associations
  const potentialSeeds = allWords.filter(word => 
    word.length > 3 && (
      wordAssociations[word] || 
      Object.values(wordAssociations).some(values => values.includes(word))
    )
  );
  
  if (potentialSeeds.length === 0) {
    return getRandomSeedWord();
  }
  
  // Use the DRand pick function if available, otherwise use standard random
  if (window.DRand && window.DRand.pick) {
    return window.DRand.pick(potentialSeeds);
  }
  
  return potentialSeeds[Math.floor(Math.random() * potentialSeeds.length)];
}

// Make functions available globally
window.PoemGenerator = {
  generatePoem,
  findRelatedWords,
  getRandomSeedWord,
  findNextSeedWord
};
