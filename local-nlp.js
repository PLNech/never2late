/**
 * i've never picked a protected flower - Interactive Installation
 * Local NLP processing module to replace ConceptNet API
 */

const natural = require('natural');
const wordnet = new natural.WordNet();
const TfIdf = natural.TfIdf;
const tokenizer = new natural.WordTokenizer();
const stemmer = natural.PorterStemmer;

// Word association database - can be expanded with more data
const wordAssociations = {
  // Core flower-related terms
  flower: ['bloom', 'petal', 'garden', 'blossom', 'stem', 'leaf', 'rose', 'tulip', 'daisy', 'orchid', 'lily', 'bouquet', 'floristry', 'vase'],
  bloom: ['flower', 'blossom', 'petal', 'garden', 'spring', 'color', 'fragrance', 'growth', 'flourish'],
  petal: ['flower', 'rose', 'soft', 'delicate', 'fall', 'colorful', 'bloom', 'fragrant', 'arrange'],
  garden: ['flower', 'plant', 'grow', 'soil', 'seed', 'water', 'sunlight', 'nature', 'landscape', 'outdoor'],
  
  // Nature elements
  nature: ['environment', 'outdoor', 'wild', 'forest', 'natural', 'landscape', 'ecosystem', 'wilderness', 'earth'],
  water: ['river', 'lake', 'ocean', 'rain', 'droplet', 'flow', 'hydration', 'moist', 'wet', 'stream'],
  sun: ['light', 'warm', 'bright', 'day', 'shine', 'solar', 'ray', 'glow', 'radiant', 'dawn'],
  tree: ['forest', 'branch', 'leaf', 'wood', 'trunk', 'shade', 'root', 'tall', 'evergreen', 'fruit'],
  
  // Colors
  color: ['red', 'blue', 'green', 'yellow', 'purple', 'orange', 'white', 'black', 'hue', 'shade'],
  red: ['rose', 'blood', 'bright', 'vibrant', 'passion', 'love', 'crimson', 'scarlet', 'fire'],
  blue: ['sky', 'water', 'ocean', 'calm', 'serene', 'cobalt', 'azure', 'indigo', 'sapphire'],
  green: ['leaf', 'grass', 'nature', 'envy', 'fresh', 'emerald', 'forest', 'lush', 'verdant'],
  
  // Weather and seasons
  weather: ['rain', 'sun', 'cloud', 'storm', 'wind', 'humidity', 'temperature', 'forecast', 'climate'],
  season: ['spring', 'summer', 'fall', 'winter', 'cycle', 'annual', 'change', 'weather', 'temporal'],
  spring: ['bloom', 'flower', 'grow', 'rebirth', 'fresh', 'renewal', 'bud', 'nest', 'thaw'],
  summer: ['hot', 'sun', 'warm', 'vacation', 'beach', 'bright', 'long', 'day', 'glow'],
  
  // Emotion words
  beauty: ['attractive', 'lovely', 'elegant', 'pretty', 'gorgeous', 'graceful', 'stunning', 'aesthetic', 'pleasing'],
  peace: ['calm', 'quiet', 'tranquil', 'serene', 'harmony', 'relaxation', 'stillness', 'gentle', 'meditation'],
  love: ['affection', 'care', 'admire', 'cherish', 'adore', 'passion', 'heart', 'romantic', 'devotion'],
  
  // Time-related concepts
  time: ['moment', 'hour', 'day', 'year', 'passing', 'fleeting', 'eternal', 'temporary', 'enduring'],
  memory: ['remember', 'past', 'recall', 'nostalgia', 'forget', 'reminisce', 'remind', 'thought', 'recollection'],
  
  // Abstract concepts
  life: ['living', 'existence', 'vitality', 'animate', 'birth', 'grow', 'flourish', 'thrive', 'experience'],
  death: ['end', 'passing', 'decay', 'finite', 'mortality', 'expire', 'wither', 'fade', 'eternal']
};

// Special terms that should directly reference specific terms in our database
const synonymMap = {
  'blossom': 'bloom',
  'floral': 'flower',
  'blooming': 'bloom',
  'blossoming': 'bloom',
  'florals': 'flower',
  'bouquet': 'flower',
  'petals': 'petal',
  'gardens': 'garden',
  'gardening': 'garden',
  'watering': 'water',
  'waters': 'water',
  'trees': 'tree',
  'flowering': 'flower',
  'spring': 'season',
  'springing': 'spring',
  'seasonal': 'season',
  'summers': 'summer',
  'summery': 'summer',
  'beautiful': 'beauty',
  'beauteous': 'beauty',
  'peaceful': 'peace',
  'loving': 'love',
  'memories': 'memory',
  'memorial': 'memory',
  'remembering': 'memory',
  'lives': 'life',
  'living': 'life',
  'dying': 'death'
};

/**
 * Find related terms for a given word
 * @param {string} word - The word to find related terms for
 * @param {number} limit - Maximum number of related terms to return
 * @returns {Promise<string[]>} Array of related terms
 */
async function findRelatedTerms(word, limit = 10) {
  word = word.toLowerCase().trim();
  const relatedTerms = new Set();
  
  // First check our direct associations database
  const directAssociations = getDirectAssociations(word);
  if (directAssociations.length > 0) {
    directAssociations.forEach(term => relatedTerms.add(term));
  }
  
  // Then try WordNet for synonyms, hypernyms, and hyponyms
  const wordnetResults = await getWordNetAssociations(word);
  if (wordnetResults.length > 0) {
    wordnetResults.forEach(term => relatedTerms.add(term));
  }
  
  // If we still don't have enough, add some general terms
  if (relatedTerms.size < limit) {
    addGeneralTerms(relatedTerms, word);
  }
  
  // Convert Set to Array, remove the original word, and limit the results
  return [...relatedTerms]
    .filter(term => term !== word)
    .slice(0, limit);
}

/**
 * Get directly associated terms from our database
 * @param {string} word - The word to find associations for
 * @returns {string[]} Array of associated terms
 */
function getDirectAssociations(word) {
  // Check if the word is in our synonym map
  const mappedWord = synonymMap[word] || word;
  
  // Get direct associations from our database
  if (wordAssociations[mappedWord]) {
    return wordAssociations[mappedWord];
  }
  
  // If the word isn't in our database, check if any term has this word in its associated terms
  const relatedTerms = [];
  for (const [key, values] of Object.entries(wordAssociations)) {
    if (values.includes(word)) {
      relatedTerms.push(key);
      // Add some of this key's other associations
      values.forEach(value => {
        if (value !== word && !relatedTerms.includes(value)) {
          relatedTerms.push(value);
        }
      });
    }
  }
  
  return relatedTerms;
}

/**
 * Get WordNet associations (synonyms, hypernyms, hyponyms)
 * @param {string} word - The word to find associations for
 * @returns {Promise<string[]>} Array of associated terms from WordNet
 */
function getWordNetAssociations(word) {
  return new Promise((resolve) => {
    const results = new Set();
    
    // Look up the word in WordNet
    wordnet.lookup(word, (details) => {
      if (!details || details.length === 0) {
        resolve([]);
        return;
      }
      
      // Process each sense of the word
      details.forEach(sense => {
        // Add synonyms
        if (sense.synonyms) {
          sense.synonyms.forEach(synonym => {
            // Clean up the synonym (remove underscores, etc.)
            const cleanSynonym = synonym.replace(/_/g, ' ');
            if (cleanSynonym !== word) {
              results.add(cleanSynonym);
            }
          });
        }
      });
      
      // Resolve with unique results
      resolve([...results]);
    });
  });
}

/**
 * Add general terms based on the semantic domain
 * @param {Set} termSet - Set to add terms to
 * @param {string} word - The original word
 */
function addGeneralTerms(termSet, word) {
  // Determine semantic domain by checking for the word in our associations
  let semanticDomain = null;
  
  for (const domain of ['flower', 'nature', 'color', 'weather', 'season', 'beauty', 'peace', 'love', 'time', 'memory', 'life']) {
    const domainTerms = wordAssociations[domain] || [];
    if (domainTerms.includes(word) || synonymMap[word] === domain || word === domain) {
      semanticDomain = domain;
      break;
    }
  }
  
  // If no domain found, use a default domain
  if (!semanticDomain) {
    semanticDomain = 'flower';
  }
  
  // Add some terms from the domain
  const domainTerms = wordAssociations[semanticDomain] || [];
  domainTerms.forEach(term => termSet.add(term));
  
  // Add some general flower-related terms if we're in a different domain
  if (semanticDomain !== 'flower') {
    const flowerTerms = wordAssociations['flower'] || [];
    for (let i = 0; i < Math.min(3, flowerTerms.length); i++) {
      termSet.add(flowerTerms[i]);
    }
  }
}

/**
 * Find related poems for a word from a database of poems/lines
 * @param {string} word - The word to find related poems for
 * @param {string[]} poemDatabase - Database of poem lines
 * @param {number} count - Number of lines to return
 * @returns {Promise<string[]>} Array of related poem lines
 */
async function findRelatedPoems(word, poemDatabase, count = 8) {
  const relatedTerms = await findRelatedTerms(word, 20);
  const allTerms = [word, ...relatedTerms];
  const relevantPoems = [];
  
  // Use TF-IDF to rank poem lines by relevance to terms
  const tfidf = new TfIdf();
  
  // Add each poem line as a document to the TF-IDF model
  poemDatabase.forEach((line, index) => {
    tfidf.addDocument(line.toLowerCase());
  });
  
  // For each term, find the most relevant lines
  for (const term of allTerms) {
    // Get the top matches for this term
    const matches = [];
    tfidf.tfidfs(term, (i, measure) => {
      if (measure > 0) {
        matches.push({ index: i, score: measure });
      }
    });
    
    // Sort by relevance score
    matches.sort((a, b) => b.score - a.score);
    
    // Add the top matches to our results
    for (const match of matches.slice(0, 3)) {
      const poemLine = poemDatabase[match.index];
      if (!relevantPoems.includes(poemLine)) {
        relevantPoems.push(poemLine);
        
        // Break early if we have enough poems
        if (relevantPoems.length >= count) {
          break;
        }
      }
    }
    
    // Break early if we have enough poems
    if (relevantPoems.length >= count) {
      break;
    }
  }
  
  // If we still don't have enough lines, add random ones
  while (relevantPoems.length < count && poemDatabase.length > 0) {
    const randomIndex = Math.floor(Math.random() * poemDatabase.length);
    const randomLine = poemDatabase[randomIndex];
    
    if (!relevantPoems.includes(randomLine)) {
      relevantPoems.push(randomLine);
    }
  }
  
  return relevantPoems;
}

/**
 * Find a path between two words through related terms
 * @param {string} startWord - The starting word
 * @param {string} endWord - The target word
 * @param {number} maxLength - Maximum path length
 * @returns {Promise<string[]|null>} The path array or null if no path found
 */
async function findWordPath(startWord, endWord, maxLength = 5) {
  startWord = startWord.toLowerCase().trim();
  endWord = endWord.toLowerCase().trim();
  
  // If the words are the same, return immediately
  if (startWord === endWord) {
    return [startWord];
  }
  
  // Breadth-first search for a path
  const visited = new Set();
  const queue = [{ word: startWord, path: [startWord] }];
  
  while (queue.length > 0) {
    const { word, path } = queue.shift();
    
    // Stop if the path is too long
    if (path.length > maxLength) {
      continue;
    }
    
    // Skip if already visited
    if (visited.has(word)) {
      continue;
    }
    
    visited.add(word);
    
    // Get related terms
    const relatedTerms = await findRelatedTerms(word, 10);
    
    for (const relatedTerm of relatedTerms) {
      // If we found the target word, return the path
      if (relatedTerm === endWord) {
        return [...path, endWord];
      }
      
      // Otherwise, add the related term to the queue
      if (!visited.has(relatedTerm)) {
        queue.push({
          word: relatedTerm,
          path: [...path, relatedTerm]
        });
      }
    }
  }
  
  // No path found
  return null;
}

// Export the functions
module.exports = {
  findRelatedTerms,
  findRelatedPoems,
  findWordPath
};
