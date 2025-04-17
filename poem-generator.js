/**
 * i've never picked a protected flower - Interactive Installation
 * Updated poem generation module using local NLP instead of ConceptNet
 */

const nlp = window.nlp | {};

// Collection of seed words to use when we get stuck
const seedWordset = [
  "flower", "bloom", "petal", "garden", "blossom", "stem", "leaf", "nature",
  "growth", "beauty", "fragrance", "color", "sunlight", "seed", "root",
  "meadow", "rose", "lotus", "orchid", "tulip", "lily", "daisy", "bouquet",
  "water", "soil", "wind", "rain", "summer", "spring", "light", "shadow",
  "landscape", "field", "earth", "sky", "sun", "moon", "cloud", "river",
  "ocean", "mountain", "valley", "forest", "tree", "branch", "bird", "butterfly",
  "insect", "bee", "harmony", "peace", "tranquility", "meditation", "breath",
  "life", "death", "renewal", "cycle", "season", "scent", "aroma", "warmth",
  "coolness", "morning", "evening", "dew", "rain", "storm", "calm", "wild"
];

// Sample database of sentences (in production this would be loaded from a file)
let sentenceDatabase = [
  "i've never picked a protected flower",
  "the garden blooms in unexpected colors",
  "petals fall silently to the ground",
  "a flower grows through cracks in concrete",
  "the scent of roses fills the room",
  "wildflowers dance in the summer breeze",
  "the lotus rises from murky waters",
  "spring brings new blossoms to bare branches",
  "the garden keeper tends each bloom with care",
  "sunlight filters through translucent petals",
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
  "a bouquet of fresh-cut flowers brightens the room",
  "flower markets burst with vibrant colors",
  "hummingbirds hover near bright blossoms",
  "frost etches patterns on the last autumn flowers",
  "seeds germinate in warm spring soil",
  "each flower carries its own story",
  "a flower can break through stone",
  "gardens reveal the passage of time",
  "water droplets magnify petal details",
  "some flowers bloom only at night",
  "the language of flowers speaks in silence",
  "each garden reflects its keeper's soul",
  "fallen petals make a soft carpet",
  "the greenhouse protects exotic blooms",
  "flower fields stretch to the horizon",
  "pressed flowers between book pages",
  "flower essences capture ephemeral scents",
  "the winter garden sleeps beneath snow",
  "flowers teach us about impermanence",
  "a windowsill garden greets the morning sun",
  "flower crowns adorn celebration days",
  "botanical gardens preserve rare species",
  "the florist arranges with careful hands",
  "every flower begins as a tiny seed",
  "a flower's life is brief but beautiful"
];

// Keep track of used sentences to avoid repetition
let usedSentences = new Set();

// Initialize the module
function initializeDatabase(sentences) {
  if (sentences && sentences.length > 0) {
    sentenceDatabase = sentences;
  }
  usedSentences.clear();
}

// Get a random sentence containing the keyword
function getSentenceWithKeyword(keyword) {
  // Create a filtered list of sentences containing the keyword
  const matchingSentences = sentenceDatabase.filter(sentence => 
    sentence.toLowerCase().includes(keyword.toLowerCase()) && 
    !usedSentences.has(sentence)
  );
  
  if (matchingSentences.length === 0) {
    // If no unused sentences match, we can either:
    // 1. Reset used sentences tracking
    if (usedSentences.size > sentenceDatabase.length / 2) {
      usedSentences.clear();
      return getSentenceWithKeyword(keyword);
    }
    // 2. Or return null to indicate no matches
    return null;
  }
  
  // Get a random matching sentence
  const selectedSentence = matchingSentences[Math.floor(Math.random() * matchingSentences.length)];
  usedSentences.add(selectedSentence);
  
  return selectedSentence;
}

// Generate a poem based on a seed word
async function generatePoem(seedWord, lineCount = 8) {
  try {
    // Get related terms using local NLP instead of ConceptNet
    const relatedTerms = await nlp.findRelatedTerms(seedWord, 20);
    
    // If we couldn't get related terms, use our backup wordset
    const termsToUse = relatedTerms.length > 0 ? 
      relatedTerms : 
      seedWordset.filter(word => word !== seedWord);
    
    // Start with the seed word
    const allTerms = [seedWord, ...termsToUse];
    
    // Generate poem by finding sentences for each term
    const poem = [];
    let attemptCount = 0;
    
    // Keep trying terms until we have enough lines or run out of attempts
    while (poem.length < lineCount && attemptCount < allTerms.length * 2) {
      const currentTerm = allTerms[attemptCount % allTerms.length];
      const sentence = getSentenceWithKeyword(currentTerm);
      
      if (sentence && !poem.includes(sentence)) {
        poem.push(sentence);
      }
      
      attemptCount++;
    }
    
    // If we don't have enough lines, fill in with random sentences
    while (poem.length < lineCount) {
      const randomIndex = Math.floor(Math.random() * sentenceDatabase.length);
      const randomSentence = sentenceDatabase[randomIndex];
      
      if (!poem.includes(randomSentence)) {
        poem.push(randomSentence);
      }
    }
    
    return poem;
  } catch (error) {
    console.error("Error generating poem:", error);
    // Return a fallback poem if there's an error
    return [
      `a ${seedWord} stands alone`,
      "light catches its edges",
      "seasons change but it remains",
      "the wind carries its essence",
      "time flows around it",
      "in silence it speaks volumes",
      "memory holds its image",
      "beauty in simplicity"
    ];
  }
}

// Load the sentence database from a file
async function loadSentenceDatabase(filePath) {
  try {
    const fs = require('fs');
    const util = require('util');
    const readFile = util.promisify(fs.readFile);
    
    const data = await readFile(filePath, 'utf8');
    const sentences = data
      .split('\n')
      .map(line => line.trim())
      .filter(line => line.length > 0);
    
    initializeDatabase(sentences);
    return sentences;
  } catch (error) {
    console.error("Error loading sentence database:", error);
    return null;
  }
}

// Generate a poem that transitions between two concepts
async function generateTransitionPoem(startTerm, endTerm, lineCount = 10) {
  try {
    // Try to find a path between the terms
    const path = await nlp.findWordPath(startTerm, endTerm);
    
    if (!path) {
      // If no path found, just generate a regular poem
      return generatePoem(startTerm, lineCount);
    }
    
    // Generate a poem following the path
    const poem = [];
    
    for (const term of path) {
      const sentence = getSentenceWithKeyword(term);
      if (sentence) {
        poem.push(sentence);
      }
      
      // If we have enough lines, stop
      if (poem.length >= lineCount) {
        break;
      }
    }
    
    // If we don't have enough lines, add more related to the end term
    if (poem.length < lineCount) {
      const relatedToEnd = await nlp.findRelatedTerms(endTerm, 10);
      
      for (const term of relatedToEnd) {
        if (poem.length >= lineCount) {
          break;
        }
        
        const sentence = getSentenceWithKeyword(term);
        if (sentence && !poem.includes(sentence)) {
          poem.push(sentence);
        }
      }
    }
    
    // If still not enough, fill with random sentences
    while (poem.length < lineCount) {
      const randomIndex = Math.floor(Math.random() * sentenceDatabase.length);
      const randomSentence = sentenceDatabase[randomIndex];
      
      if (!poem.includes(randomSentence)) {
        poem.push(randomSentence);
      }
    }
    
    return poem;
  } catch (error) {
    console.error("Error generating transition poem:", error);
    return generatePoem(startTerm, lineCount);
  }
}

// Generate a poem directly from our local NLP module
async function generateNlpPoem(seedWord, lineCount = 8) {
  try {
    return await nlp.findRelatedPoems(seedWord, sentenceDatabase, lineCount);
  } catch (error) {
    console.error("Error generating NLP poem:", error);
    return generatePoem(seedWord, lineCount);
  }
}

// Export functions for Node.js environment
module.exports = {
  initialize: initializeDatabase,
  generatePoem,
  generateTransitionPoem,
  generateNlpPoem,
  findRelatedTerms: nlp.findRelatedTerms,
  loadSentenceDatabase,
  getSeedWords: () => [...seedWordset] // Return a copy of the seed words
};
