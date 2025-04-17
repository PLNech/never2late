/**
 * Minimal poem generator for the flower installation
 * Simplified from the original but maintains the spirit
 */

// Basic word associations for offline use
const wordAssociations = {
  flower: ['petal', 'bloom', 'garden', 'blossom', 'lotus', 'rose', 'tulip', 'orchid'],
  petal: ['flower', 'fragile', 'soft', 'fall', 'delicate', 'color', 'unfold'],
  bloom: ['flower', 'open', 'spring', 'growth', 'bud', 'unfold', 'blossom'],
  garden: ['flower', 'grow', 'plant', 'soil', 'seed', 'tend', 'cultivate'],
  nature: ['wild', 'growth', 'natural', 'earth', 'organic', 'forest', 'field'],
  light: ['sun', 'shine', 'glow', 'bright', 'dawn', 'illuminate', 'shadow'],
  water: ['river', 'rain', 'dew', 'droplet', 'mist', 'stream', 'pool'],
  time: ['season', 'moment', 'cycle', 'eternal', 'ephemeral', 'fleeting', 'memory']
};

// Database of flower-themed sentences
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
  "a flower's life is brief but beautiful"
];

// Set to track used sentences
const usedSentences = new Set();

/**
 * Find related words for a seed word
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
        related = related.concat(values.filter(v => v !== word).slice(0, 3));
      }
    }
  }
  
  // If still no results, use default nature/flower words
  if (related.length === 0) {
    related = ['flower', 'nature', 'garden', 'bloom', 'petal'];
  }
  
  // Deduplicate and take requested count
  return [...new Set(related)].slice(0, count);
}

/**
 * Generate a poem based on a seed word
 * @param {string} seedWord - The word to center the poem around
 * @param {number} lineCount - Number of lines in the poem
 * @returns {string[]} The generated poem
 */
function generatePoem(seedWord, lineCount = 5) {
  // Reset used sentences if we've used more than half
  if (usedSentences.size > sentenceDatabase.length / 2) {
    usedSentences.clear();
  }
  
  // Find related words to our seed
  const relatedWords = findRelatedWords(seedWord, 8);
  const allWords = [seedWord, ...relatedWords];
  
  // Generate poem by finding sentences for each term
  const poem = [];
  
  // Try each word until we have enough lines
  for (const word of allWords) {
    // Skip if we have enough lines
    if (poem.length >= lineCount) break;
    
    // Find sentences containing this word
    const matchingSentences = sentenceDatabase.filter(sentence => 
      sentence.toLowerCase().includes(word.toLowerCase()) && 
      !usedSentences.has(sentence)
    );
    
    // Add a random matching sentence
    if (matchingSentences.length > 0) {
      const selectedSentence = matchingSentences[Math.floor(Math.random() * matchingSentences.length)];
      poem.push(selectedSentence);
      usedSentences.add(selectedSentence);
    }
  }
  
  // If we still don't have enough lines, add random unused sentences
  while (poem.length < lineCount) {
    const unusedSentences = sentenceDatabase.filter(sentence => !usedSentences.has(sentence));
    
    if (unusedSentences.length === 0) {
      // If all sentences used, just pick any
      const randomSentence = sentenceDatabase[Math.floor(Math.random() * sentenceDatabase.length)];
      poem.push(randomSentence);
    } else {
      // Otherwise pick an unused one
      const randomSentence = unusedSentences[Math.floor(Math.random() * unusedSentences.length)];
      poem.push(randomSentence);
      usedSentences.add(randomSentence);
    }
  }
  
  return poem;
}

// Make functions available globally
window.PoemGenerator = {
  generatePoem,
  findRelatedWords,
  getRandomSeedWord: () => {
    const seeds = Object.keys(wordAssociations);
    return seeds[Math.floor(Math.random() * seeds.length)];
  }
};
