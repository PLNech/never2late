#!/usr/bin/env python3
"""
Poetry Generator using spaCy for local NLP processing and cleaned English language data.
This script generates thematic poems by traversing related concepts using word vectors
and semantic similarity.

Features:
- Generate multiple poems with themes that evolve from one to the next
- Output as text, HTML or serve via a simple HTTP API
- Option to generate a large batch of poems for offline browsing
"""

import argparse
import csv
import http.server
import json
import multiprocessing
import os
import pickle
import random
import socketserver
import time
from pathlib import Path
from typing import List, Dict, Any, Optional

import numpy as np
import spacy

WORD_SET = [
    "dog", "flower", "windmill", "cliff", "forest", "city", "home", "light", "excess", "clean",
    "crossroads", "horizon", "road", "settlement", "boulder", "outcropping", "signpost", "well",
    "shelter", "storm", "scrub", "crop field", "farm", "silo", "bird flock", "sign",
    "detour", "rest stop", "traffic jam", "traffic", "tunnel", "convenience store", "mile marker",
    "cave", "windbreak", "street", "path", "river", "hill", "land", "line", "house",
    "bank", "bridge", "rock", "valley", "wind", "sky", "landscape", "ocean", "cloud",
    "cliff", "expanse", "shore", "peak", "sphere", "lake", "moon", "background", "darkness",
    "desert", "twilight", "boundary", "surface", "colony", "village", "trade", "district",
    "territory", "province", "cliff", "pebble", "crag", "ledge", "slab", "rubble", "mound",
    "ravine", "pillar", "brick", "bluff", "bush", "sand", "stump", "chunk", "crater", "timber",
    "gravestone", "railway", "canal", "mill", "farm", "undergrowth", "shrub", "thicket",
    "shrubbery", "brush", "birch", "estate", "garden", "field", "plant", "crop", "drink", "trust",
    "trace", "sky", "cross", "road", "railway", "roadway", "lane", "route", "trail", "ridge",
    "coast", "beach", "canyon", "travel", "stream", "refuge", "comfort", "shadow", "shade",
    "roof", "outcrop", "mountainside", "wasteland", "boulder", "pinnacle", "rain", "weather",
    "fire", "breeze", "ice", "sea", "garden", "sky", "bird", "sunset", "dam", "river", "wash",
    "ocean", "hill", "valley", "tree", "flower", "flame", "fire", "tree"
]
WORD_SET += [
    # Death, grief, remembrance
    "grave", "coffin", "mourning", "ashes", "sepulcher", "tomb", "funeral", "farewell",
    "loss", "lament", "dirge", "obituary", "requiem", "epitaph", "wake", "veil", "sorrow",
    "keening", "grief", "shroud", "wither", "transience",

    # Contemplation, meaning, wisdom
    "stillness", "echo", "memory", "legacy", "thought", "reflection", "wisdom", "insight",
    "truth", "silence", "reverie", "meditation", "presence", "absence", "eternity", "paradox",
    "soul", "mind", "spirit", "understanding", "acceptance", "seeking",

    # Beauty, time, seasons
    "autumn", "winter", "leaves", "petal", "bloom", "blossom", "cycle", "season", "equinox",
    "solstice", "sunset", "dusk", "twilight", "dawn", "hour", "clock", "calendar", "pendulum",
    "decay", "growth", "moment", "fleeting", "passing", "fade", "renewal", "ebb", "flow",

    # Flowers (emphasized)
    "rose", "lily", "chrysanthemum", "poppy", "tulip", "violet", "iris", "daffodil", "peony",
    "camellia", "lavender", "carnation", "sunflower", "magnolia", "hyacinth", "daisy",
    "wilt", "bloom", "garland", "bouquet", "wreath", "meadow", "perfume", "dew", "blush",

    # Heritage, remembrance
    "ancestor", "portrait", "lineage", "roots", "stone", "monument", "keepsake", "heirloom",
    "name", "inscription", "story", "voice", "photo", "ruin", "echo", "trace", "fragment",
    "inheritance", "generation", "reminder", "archive", "dust", "history", "ritual", "memory", "remember"
]


def count_syllables(word: str) -> int:
    """
    Count the number of syllables in a word using a simple heuristic approach.

    Args:
        word: The word to count syllables for

    Returns:
        The estimated number of syllables
    """
    word = word.lower()
    # Remove non-alphanumeric characters
    word = ''.join(c for c in word if c.isalnum())

    if not word:
        return 0

    # Count vowel groups as syllables
    vowels = "aeiouy"
    # Count consecutive vowels as one syllable
    count = 0
    prev_is_vowel = False

    for char in word:
        is_vowel = char in vowels
        if is_vowel and not prev_is_vowel:
            count += 1
        prev_is_vowel = is_vowel

    # Special cases
    if word.endswith('e'):
        count -= 1
    if word.endswith('le') and len(word) > 2 and word[-3] not in vowels:
        count += 1
    if count == 0:
        count = 1  # Every word has at least one syllable

    return count


def count_sentence_syllables(sentence: str) -> int:
    """Count the number of syllables in a sentence."""
    # Split the sentence into words and count syllables for each
    words = sentence.split()
    return sum(count_syllables(word) for word in words)


class PoemGenerator:
    def __init__(self, input_csv: str, nlp_model: str = "en_core_web_lg", num_poems: int = 20,
                 poem_length: int = 22, output_dir: str = "poems", seed_word: Optional[str] = None,
                 cache_file: Optional[str] = None):
        """
        Initialize the poem generator.

        Args:
            input_csv: Path to the CSV file with cleaned sentences
            nlp_model: spaCy model to use
            num_poems: Number of poems to generate
            poem_length: Maximum number of lines in each poem
            output_dir: Directory to save generated poems
            seed_word: Optional starting seed word
            cache_file: File to store vectors
        """
        print(f"Loading spaCy model: {nlp_model}...")
        try:
            self.nlp = spacy.load(nlp_model)
        except OSError:
            print(f"Model {nlp_model} not found. Attempting to download...")
            import subprocess
            subprocess.run(["python", "-m", "spacy", "download", nlp_model])
            self.nlp = spacy.load(nlp_model)

        self.sentences = []
        self.sentences_by_user = {}
        self.current_cluster = []
        self.last_related_words = []
        self.num_poems = num_poems
        self.poem_length = poem_length
        self.output_dir = output_dir
        self.input_csv = input_csv
        self.nlp_model = nlp_model
        self.initial_seed = seed_word if seed_word else random.choice(WORD_SET)
        self.poem_cache = {}  # Cache for storing generated poems
        self.used_sentences = set()  # Track used sentences across poems
        self.used_themes = set()  # Track used themes to avoid repetition

        self.corpus_words = None  # Will store unique content words from corpus
        self.similarity_cache = {}  # Cache for word similarities
        self.word_vectors_cache = {}  # Cache for word vectors
        self.related_words_cache = {}  # Cache for related words results
        self.cache_file = cache_file

        if cache_file and os.path.exists(cache_file):
            self.load_cache()

        # Create output directory if it doesn't exist
        Path(output_dir).mkdir(exist_ok=True)

        # Load data from CSV
        self.load_data(input_csv)

    def save_cache(self):
        """Save word vectors, similarity cache, and related words cache to file"""
        if not self.cache_file:
            return

        cache_data = {
            'word_vectors': self.word_vectors_cache,
            'similarity': self.similarity_cache,
            'corpus_words': self.corpus_words,
            'related_words': self.related_words_cache
        }

        print(f"Saving cache to {self.cache_file}...")
        with open(self.cache_file, 'wb') as f:
            pickle.dump(cache_data, f)
        print(f"Saved {len(self.word_vectors_cache)} word vectors, {len(self.similarity_cache)} similarity pairs, "
              f"and {len(self.related_words_cache)} related words sets")

    # Update load_cache to load related_words_cache:
    def load_cache(self):
        """Load word vectors, similarity cache, and related words cache from file"""
        if not self.cache_file or not os.path.exists(self.cache_file):
            return

        print(f"Loading cache from {self.cache_file}...")
        try:
            with open(self.cache_file, 'rb') as f:
                cache_data = pickle.load(f)

            self.word_vectors_cache = cache_data.get('word_vectors', {})
            self.similarity_cache = cache_data.get('similarity', {})
            self.corpus_words = cache_data.get('corpus_words', None)
            self.related_words_cache = cache_data.get('related_words', {})

            print(f"Loaded {len(self.word_vectors_cache)} word vectors, {len(self.similarity_cache)} similarity pairs, "
                  f"and {len(self.related_words_cache)} related words sets")
        except Exception as e:
            print(f"Error loading cache: {e}")

    def load_data(self, csv_path: str) -> None:
        """Load and process data from CSV file"""
        print(f"Loading data from {csv_path}...")
        try:
            with open(csv_path, 'r', encoding='utf-8') as f:
                reader = csv.reader(f)
                next(reader)  # Skip header
                for row in reader:
                    if len(row) >= 2 and row[0].strip():
                        sentence = row[0].strip().lower()
                        user = row[1].strip() if len(row) > 1 else "anonymous"

                        self.sentences.append(sentence)

                        # Group sentences by user
                        if user not in self.sentences_by_user:
                            self.sentences_by_user[user] = []
                        self.sentences_by_user[user].append(sentence)

            print(f"Loaded {len(self.sentences)} sentences from {len(self.sentences_by_user)} users")
        except Exception as e:
            print(f"Error loading data: {e}")
            exit(1)

    def extract_corpus_vocabulary(self):
        """Extract and cache all content words from the corpus"""
        if self.corpus_words is not None:
            return self.corpus_words

        print("Extracting vocabulary from corpus...")
        start_time = time.time()

        # Combined expanded stopwords list (copied from find_related_words)
        stopwords = {'the', 'a', 'an', 'and', 'or', 'but', 'if', 'then', 'there', 'here', 'that', 'this', 'those',
                     'these', 'it', 'its', 'is', 'was', 'be', 'been', 'being', 'am', 'are', 'were', 'will', 'would',
                     'shall', 'should', 'may', 'might', 'must', 'can', 'could', 'you', 'your', 'we', 'our', 'they',
                     'their', 'he', 'his', 'him', 'she', 'her', 'i', 'my', 'me', 'mine', 'what', 'who', 'whom', 'which',
                     'where', 'when', 'why', 'how', 'all', 'any', 'both', 'each', 'few', 'more', 'most', 'some', 'such',
                     'have', 'got', 'does', 'did', 'was', 'has', 'have', 'had', 'need', 'cause', 'miss',
                     'jan', 'feb', 'mar', 'apr', 'may', 'jun', 'jul', 'aug', 'sep', 'sept', 'oct', 'nov', 'dec',
                     'by', 'now', 'to', 'be', 'not', 'you', 'find', 'ought', 'we', 'they', 'us', 'dare',
                     'no', 'nor', 'not', 'only', 'own', 'same',
                     'so', 'than', 'too', 'very', 'let', 'just', 'now', 'ever'}

        # Common abbreviations and stems to filter out
        abbrevs_and_stems = {'inc', 'ltd', 'corp', 'cuz', 'cos', 'coz', 'bout', 'doin', 'goin',
                             'nothin', 'lovin', 'havin', 'fla', 'calif', 'tenn', 'okla', 'wis',
                             'ind', 'mich', 'mont', 'colo', 'conn', 'bros', 'sen', 'gen', 'mrs',
                             'gov', 'ariz', 'minn', 'ark', 'ill', 'wash', 'mass', 'dept', 'dist',
                             'sha', 'kan', 'ala', 'prof', 'ore', 'rep', 'nuff', 'gon', 'deb', 'xdd',
                             'rev', 'adm', 'nev', 'messrs', 'del', 'kans', 'neb',
                             'div', 'assn', 'assoc', 'mfg', 'natl', 'intl', 'amer', 'univ', 'tech',
                             'admin', 'mgr', 'pres', 'dir', 'coord', 'eng', 'sci', 'acct', 'atty'}

        # Combine all sentences into one large text for batch processing
        all_text = " ".join(self.sentences)
        doc = self.nlp(all_text)
        print("Doc generated.")
        corpus_words = set()
        for token in doc:
            token_text_lower = token.text.lower()
            if (token_text_lower not in stopwords and
                    token_text_lower not in abbrevs_and_stems and
                    token.is_alpha and
                    len(token_text_lower) > 2 and
                    not token.is_punct and
                    not token.is_space):
                corpus_words.add(token_text_lower)

        # Also include predefined WORD_SET
        for word in WORD_SET:
            word_lower = word.lower()
            if (word_lower not in stopwords and
                    word_lower not in abbrevs_and_stems and
                    len(word_lower) > 2):
                corpus_words.add(word_lower)

        # Store in instance variable
        self.corpus_words = corpus_words

        # Pre-compute vectors for all corpus words to speed up similarity calculations
        print(f"Pre-computing vectors for {len(corpus_words)} words...")
        for word in corpus_words:
            self.get_vector(word)

        if self.cache_file:
            print(f"Saving vectors to cache {self.cache_file}...")
            self.save_cache()
        print(f"Extracted {len(corpus_words)} unique content words in {time.time() - start_time:.2f} seconds")
        return corpus_words

    def get_vector(self, word):
        """Get and cache vector for a word"""
        if word in self.word_vectors_cache:
            return self.word_vectors_cache[word]

        doc = self.nlp(word)
        if len(doc) > 0 and doc[0].has_vector:
            vector = doc[0].vector
            self.word_vectors_cache[word] = vector
            return vector
        return None

    def compute_similarity(self, word1, word2):
        """Compute and cache similarity between two words"""
        # Create a cache key (alphabetically sorted for consistent ordering)
        cache_key = tuple(sorted([word1, word2]))

        if cache_key in self.similarity_cache:
            return self.similarity_cache[cache_key]

        vector1 = self.get_vector(word1)
        vector2 = self.get_vector(word2)

        if vector1 is not None and vector2 is not None:
            # Calculate cosine similarity directly from vectors
            similarity = np.dot(vector1, vector2) / (np.linalg.norm(vector1) * np.linalg.norm(vector2))
            self.similarity_cache[cache_key] = similarity
            return similarity
        return 0.0

    def find_related_words(self, word: str, n: int = 15) -> List[str]:
        """
        Find words related to the given word using spaCy word vectors,
        with memoization for better performance.

        Args:
            word: The seed word to find related words for
            n: Number of related words to return

        Returns:
            List of related words
        """
        # Check if result is already in cache
        cache_key = (word.lower(), n)
        if cache_key in self.related_words_cache:
            related = self.related_words_cache[cache_key]
            print(f"Using cached related words for '{word}': {related[:15]}")
            return related

        # Process the word to get the lemma
        doc = self.nlp(word)
        if not doc or len(doc) == 0:
            return []

        word_lower = word.lower()

        # Skip processing if word not in vocabulary or has no vector
        if self.get_vector(word_lower) is None:
            print(f"Word '{word}' has no vector in the vocabulary")
            return []

        # Make sure corpus words are extracted
        if self.corpus_words is None:
            self.extract_corpus_vocabulary()

        # Calculate similarity with batch processing
        batch_size = 500  # Process words in batches
        all_similarities = []

        # Process in batches with multiprocessing
        all_words = list(self.corpus_words)
        word_batches = [all_words[i:i + batch_size] for i in range(0, len(all_words), batch_size)]

        # Process each batch
        for batch in word_batches:
            batch_similarities = []
            for candidate in batch:
                if candidate != word_lower:
                    similarity = self.compute_similarity(word_lower, candidate)
                    batch_similarities.append((candidate, similarity, len(candidate)))
            all_similarities.extend(batch_similarities)

        # Sort by similarity with length bonus
        all_similarities.sort(key=lambda x: (x[1] + (x[2] * 0.01)), reverse=True)

        # Get top candidates
        result = [word for word, _, _ in all_similarities[:min(n, len(all_similarities))]]

        # Cache the result
        self.related_words_cache[cache_key] = result

        print(f"Found {len(result)} words related to '{word}': {result[:10]}")
        return result

    def make_poem(self, seed_word: str, feet_pattern: Optional[str] = None) -> tuple[list[str], str]:
        """
        Generate a poem based on a seed word and optional syllable pattern

        Args:
            seed_word: The word to base the poem on
            feet_pattern: Optional pattern of syllables per line (e.g., "575" for haiku)

        Returns:
            Tuple of (poem lines, theme word)
        """
        # Find related words to the seed word
        related_words = self.find_related_words(seed_word)

        # Use the first properly formed related word as the theme (not a partial word)
        theme = seed_word
        for word in related_words:
            if len(word) >= 4:
                theme = word
                break

        if not related_words:
            related_words = [seed_word]

        # Add the seed word to ensure it's included
        if seed_word not in related_words:
            related_words.append(seed_word)

        # Parse feet pattern if provided
        feet_targets = None
        if feet_pattern:
            feet_targets = []
            # Handle patterns like "575" for haiku or "12x4" for 4 lines of 12 syllables
            if 'x' in feet_pattern:
                parts = feet_pattern.split('x')
                if len(parts) == 2 and parts[0].isdigit() and parts[1].isdigit():
                    syl_count = int(parts[0])
                    line_count = int(parts[1])
                    feet_targets = [syl_count] * line_count
            else:
                # Each digit represents syllables in one line
                for char in feet_pattern:
                    if char.isdigit():
                        feet_targets.append(int(char))

        # If we have a specific pattern, adjust our poem length
        if feet_targets:
            self.poem_length = len(feet_targets)

        # Pre-calculate syllable counts for sentences to avoid repeated computation
        sentence_syllables = {}
        for sentence in self.sentences:
            sentence_syllables[sentence] = count_sentence_syllables(sentence)

        # Build a cluster of sentences containing those words and matching syllable counts
        cluster = []

        if feet_targets:
            # Determine if this is a strict pattern (like haiku) that needs exact matches
            strict_pattern = feet_pattern in ["575", "57577", "35353535"] or len(feet_targets) <= 5

            # For each target syllable count, find matching sentences
            for i, target_syllables in enumerate(feet_targets):
                target_met = False

                # Try up to 10 times to find an exact match for strict patterns
                max_retries = 10 if strict_pattern else 3
                retry_count = 0

                while not target_met and retry_count < max_retries:
                    retry_count += 1

                    # Set acceptable margin - for strict patterns, require exact match
                    if strict_pattern:
                        acceptable_margin = 0  # Exact match required for haiku and short forms
                    else:
                        acceptable_margin = 1  # For longer forms, allow ±1 syllable

                    # Try to find a sentence with matching syllable count containing a related word
                    for word in related_words:
                        for sentence in self.sentences:
                            if word in sentence.split() and sentence not in cluster:
                                # Prioritize unused sentences
                                if sentence not in self.used_sentences or len(self.used_sentences) > len(
                                        self.sentences) * 0.7:
                                    syl_count = sentence_syllables[sentence]
                                    # Check if within acceptable margin
                                    if abs(syl_count - target_syllables) <= acceptable_margin:
                                        cluster.append(sentence)
                                        self.used_sentences.add(sentence)  # Mark as used
                                        target_met = True
                                        break
                        if target_met:
                            break

                    # If still no match after multiple tries, gradually relax constraints
                    if not target_met and retry_count >= max_retries - 1:
                        acceptable_margin = 1  # Allow ±1 syllable on last try

                # If we still couldn't find a matching sentence, use the closest one
                if not target_met:
                    best_sentence = None
                    best_diff = float('inf')
                    best_used = True  # Track if our best match is already used

                    for sentence in self.sentences:
                        if sentence not in cluster:
                            for word in related_words:
                                if word in sentence.split():
                                    syl_diff = abs(sentence_syllables[sentence] - target_syllables)
                                    # Prefer unused sentences with a similar syllable count
                                    is_used = sentence in self.used_sentences
                                    if (syl_diff < best_diff or (syl_diff == best_diff and is_used < best_used)):
                                        best_diff = syl_diff
                                        best_sentence = sentence
                                        best_used = is_used

                    if best_sentence:
                        cluster.append(best_sentence)
                        self.used_sentences.add(best_sentence)  # Mark as used
                    else:
                        # If still no match, just find any sentence with close syllable count
                        for sentence in self.sentences:
                            if sentence not in cluster:
                                syl_diff = abs(sentence_syllables[sentence] - target_syllables)
                                is_used = sentence in self.used_sentences
                                if (syl_diff < best_diff or (syl_diff == best_diff and is_used < best_used)):
                                    best_diff = syl_diff
                                    best_sentence = sentence
                                    best_used = is_used

                        if best_sentence:
                            cluster.append(best_sentence)
                            self.used_sentences.add(best_sentence)  # Mark as used
        else:
            # Original approach for non-syllable-constrained poems
            for word in related_words:
                for sentence in self.sentences:
                    if word in sentence.split() and sentence not in cluster:
                        # Only use sentences that haven't been used in previous poems
                        if sentence not in self.used_sentences:
                            cluster.append(sentence)
                            self.used_sentences.add(sentence)  # Mark as used
                            if len(cluster) >= self.poem_length:
                                break
                        # If we're running low on sentences, allow some reuse
                        elif len(self.used_sentences) > len(self.sentences) * 0.7:
                            cluster.append(sentence)
                            if len(cluster) >= self.poem_length:
                                break

                if len(cluster) >= self.poem_length:
                    break

            # If we don't have enough sentences, add more from the seed word
            if len(cluster) < min(self.poem_length, 5):
                for sentence in self.sentences:
                    if seed_word in sentence and sentence not in cluster:
                        cluster.append(sentence)
                        self.used_sentences.add(sentence)  # Mark as used
                    if len(cluster) >= self.poem_length:
                        break

        # If we still don't have enough lines, fill in with related sentences
        while len(cluster) < self.poem_length and len(cluster) < len(self.sentences):
            best_sentence = None
            best_score = -1

            for sentence in self.sentences:
                if sentence not in cluster:
                    # Give bonus to unused sentences
                    sentence_score_multiplier = 2.0 if sentence not in self.used_sentences else 1.0
                    # Calculate a relevance score
                    score = 0
                    for word in related_words:
                        if word in sentence:
                            score += 1

                    score *= sentence_score_multiplier

                    if score > best_score:
                        best_score = score
                        best_sentence = sentence

            if best_sentence:
                cluster.append(best_sentence)
                self.used_sentences.add(best_sentence)
            else:
                # If all else fails, add a random sentence
                remaining = [s for s in self.sentences if s not in cluster]
                if remaining:
                    random_sentence = random.choice(remaining)
                    cluster.append(random_sentence)
                    self.used_sentences.add(random_sentence)
                else:
                    break

        # For syllable-constrained poems, don't shuffle
        if not feet_targets:
            random.shuffle(cluster)

        return cluster[:self.poem_length], theme

    def choose_next_seed(self, current_seed: str) -> str:
        """Choose the next seed word based on the current one"""
        related = self.find_related_words(current_seed, n=8)

        # If we found related words, choose one at random
        if related:
            return random.choice(related)

        # Otherwise choose a random word from our seed set
        return random.choice(WORD_SET)

    def generate_poem(self, seed_word: Optional[str] = None, feet_pattern: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a single poem

        Args:
            seed_word: Optional seed word to use
            feet_pattern: Optional pattern of syllables (e.g., "575" for haiku)

        Returns:
            Dictionary containing poem data
        """
        if not seed_word:
            seed_word = random.choice(WORD_SET)

        poem_lines, theme = self.make_poem(seed_word, feet_pattern)
        syllable_counts = [count_sentence_syllables(line) for line in poem_lines]

        return {
            "lines": poem_lines,
            "theme": theme,
            "seed": seed_word,
            "syllable_counts": syllable_counts,
            "timestamp": time.time()
        }

    def generate_poems(self) -> List[Dict[str, Any]]:
        """
        Generate a series of poems

        Returns:
            List of poem dictionaries with lines, theme, and metadata
        """
        all_poems = []
        current_seed = self.initial_seed

        print(f"Generating {self.num_poems} poems...")
        for i in range(self.num_poems):
            print(f"Poem {i + 1}/{self.num_poems}: seed '{current_seed}'")

            # Generate the poem
            poem_lines, theme = self.make_poem(current_seed)

            # Try to find an unused theme if this one has been used
            attempts = 0
            while theme in self.used_themes and attempts < 5:  # Limit attempts to avoid infinite loops
                # Get a different seed
                new_seed = self.choose_next_seed(current_seed)
                if new_seed != current_seed:
                    current_seed = new_seed
                    poem_lines, theme = self.make_poem(current_seed)
                    attempts += 1
                else:
                    break

            if poem_lines:
                # Calculate syllable counts for information
                syllable_counts = [count_sentence_syllables(line) for line in poem_lines]

                # Create a dictionary with poem data
                poem_data = {
                    "id": i + 1,
                    "lines": poem_lines,
                    "theme": theme,
                    "seed": current_seed,
                    "syllable_counts": syllable_counts,
                    "timestamp": time.time()
                }

                # Track used theme
                self.used_themes.add(theme)
                all_poems.append(poem_data)

                # Choose the next seed word
                current_seed = self.choose_next_seed(current_seed)
            else:
                # If we couldn't make a poem, try with a different seed
                current_seed = random.choice(WORD_SET)

        return all_poems

    def generate_large_batch(self, batch_size: int, workers: int = 4) -> List[Dict[str, Any]]:
        """
        Generate a large batch of poems using multiple processes

        Args:
            batch_size: Number of poems to generate
            workers: Number of worker processes

        Returns:
            List of poem dictionaries
        """
        print(f"Generating {batch_size} poems using {workers} workers...")

        if workers > 1:
            # Use multiprocessing for large batches
            pool = multiprocessing.Pool(processes=workers)
            poems_per_worker = batch_size // workers

            # Create tasks for each worker
            tasks = []
            for i in range(workers):
                count = poems_per_worker
                if i == workers - 1:  # last worker gets any remainder
                    count += batch_size % workers
                tasks.append(count)

            # Process the tasks
            results = pool.map(self._worker_generate_poems, tasks)
            pool.close()
            pool.join()

            # Combine results
            all_poems = []
            for result in results:
                all_poems.extend(result)

            # Renumber the poem IDs
            for i, poem in enumerate(all_poems):
                poem["id"] = i + 1

            return all_poems
        else:
            # Single process
            return self.generate_poems()

    def _worker_generate_poems(self, count: int) -> List[Dict[str, Any]]:
        """
        Worker function for multiprocessing

        Args:
            count: Number of poems to generate in this worker

        Returns:
            List of poem dictionaries
        """
        generator = PoemGenerator(
            input_csv=self.input_csv,
            nlp_model=self.nlp_model,
            num_poems=count,
            poem_length=self.poem_length
        )
        return generator.generate_poems()

    def save_poems(self, poems: List[Dict[str, Any]], format: str = "txt") -> None:
        """
        Save the generated poems to files

        Args:
            poems: List of poem dictionaries
            format: Output format ("txt", "html", or "json")
        """
        if "txt" in format:
            for poem in poems:
                txt = f"poem_{poem['id'] if 'id' in poem else '1'}.txt"
                filename = os.path.join(self.output_dir, txt)
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(f"Theme: {poem['theme']}\n\n")
                    for line in poem['lines']:
                        f.write(f"{line}\n")
                print(f"Saved {txt}", end="\r")

            # Also save all poems to a single file
            with open(os.path.join(self.output_dir, "all_poems.txt"), 'w', encoding='utf-8') as f:
                for poem in poems:
                    poem_id = poem['id'] if 'id' in poem else ''
                    f.write(f"--- Poem {poem_id} (Theme: {poem['theme']}) ---\n")
                    for line in poem['lines']:
                        f.write(f"{line}\n")
                    f.write("\n\n")
            print("Saved all_poems.txt")
        if "html" in format:
            # Create a simple HTML output with all poems
            with open(os.path.join(self.output_dir, "poems.html"), 'w', encoding='utf-8') as f:
                f.write("""<!DOCTYPE html>
                    <html>
                    <head>
                        <meta charset="utf-8">
                        <title>I never picked a protected flower</title>
                        <style>
                            body { font-family: monospace; max-width: 800px; margin: 0 auto; padding: 20px; }
                            .poem { margin-bottom: 40px; padding: 20px; border: 1px solid #eee; page-break-after: always; }
                            .theme { font-weight: bold; margin-bottom: 15px; font-size: 1.2em; }
                            .line { margin-bottom: 8px; }
                            .syllables { color: #888; font-size: 0.8em; margin-left: 10px; }
                            h1 { text-align: center; margin-bottom: 40px; }
                            .controls { text-align: center; margin-bottom: 20px; }
                            button { padding: 8px 16px; cursor: pointer; }
                        </style>
                        <script>
                            function toggleSyllables() {
                                const syllables = document.querySelectorAll('.syllables');
                                const btn = document.getElementById('toggleBtn');
    
                                for (let syl of syllables) {
                                    if (syl.style.display === 'none') {
                                        syl.style.display = 'inline';
                                        btn.textContent = 'Hide Syllable Counts';
                                    } else {
                                        syl.style.display = 'none';
                                        btn.textContent = 'Show Syllable Counts';
                                    }
                                }
                            }
                        </script>
                    </head>
                    <body>
                    <h1>Generated Poems</h1>
                    <div class="controls">
                        <button id="toggleBtn" onclick="toggleSyllables()">Hide Syllable Counts</button>
                    </div>
                    """)

                for poem in poems:
                    f.write(f'<div class="poem">\n')
                    f.write(f'<div class="theme">Theme: {poem["theme"]}</div>\n')

                    # If we have syllable counts, display them
                    if 'syllable_counts' in poem:
                        for i, (line, count) in enumerate(zip(poem['lines'], poem['syllable_counts'])):
                            f.write(
                                f'<div class="line">{line}<span class="syllables">({count} syllables)</span></div>\n')
                    else:
                        for line in poem['lines']:
                            f.write(f'<div class="line">{line}</div>\n')

                    f.write('</div>\n')

                f.write("</body></html>")
            print("Saved poems.html")


        if "json" in format:
            # Save as JSON
            with open(os.path.join(self.output_dir, "poems.json"), 'w', encoding='utf-8') as f:
                json.dump(poems, f, indent=2)
            print("Saved poems.json")

        filtered = [",", "txt", "json", "html"]
        remaining = format
        for f in filtered:
            remaining = remaining.replace(f, "")
        if len(remaining):
            print(f"Unknown format {format}...")
        print(f"Saved {len(poems)} poems to {self.output_dir}")


class PoemHTTPRequestHandler(http.server.SimpleHTTPRequestHandler):
    """Custom HTTP request handler for serving poems"""

    def __init__(self, *args, generator=None, **kwargs):
        self.generator = generator
        super().__init__(*args, **kwargs)

    def do_GET(self):
        """Handle GET requests"""
        if self.path == "/poems/" or self.path == "/poems":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            # Generate poems if not already cached
            if not hasattr(self.server, "poems") or not self.server.poems:
                self.server.poems = self.generator.generate_poems()

            # Send all poems as JSON
            self.wfile.write(json.dumps(self.server.poems).encode())

        elif self.path == "/poem/" or self.path == "/poem":
            self.send_response(200)
            self.send_header("Content-type", "application/json")
            self.end_headers()

            # Generate a new poem or get a random one from cache
            if hasattr(self.server, "poems") and self.server.poems:
                poem = random.choice(self.server.poems)
            else:
                poem = self.generator.generate_poem()

            # Send the poem as JSON
            self.wfile.write(json.dumps(poem).encode())

        else:
            # Default handler for other paths
            super().do_GET()


def run_server(generator, port):
    """
    Run an HTTP server that serves poems

    Args:
        generator: PoemGenerator instance
        port: Port number to listen on
    """

    # Create a custom server that holds a reference to the generator
    class PoemHTTPServer(socketserver.TCPServer):
        def __init__(self, server_address, RequestHandlerClass, generator):
            self.generator = generator
            self.poems = []  # Cache for poems
            super().__init__(server_address, RequestHandlerClass)

    # Create a handler class that has access to the generator
    class Handler(http.server.SimpleHTTPRequestHandler):
        def __init__(self, *args, **kwargs):
            super().__init__(*args, **kwargs)

        def do_GET(self):
            if self.path == "/poems/" or self.path == "/poems":
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()

                # Generate poems if not already cached
                if not self.server.poems:
                    self.server.poems = self.server.generator.generate_poems()

                # Send all poems as JSON
                self.wfile.write(json.dumps(self.server.poems).encode())

            elif self.path == "/poem/" or self.path == "/poem":
                self.send_response(200)
                self.send_header("Content-type", "application/json")
                self.end_headers()

                # Generate a new poem or get a random one from cache
                if self.server.poems:
                    poem = random.choice(self.server.poems)
                else:
                    poem = self.server.generator.generate_poem()

                # Send the poem as JSON
                self.wfile.write(json.dumps(poem).encode())

            else:
                # Default handler for other paths
                super().do_GET()

    server = PoemHTTPServer("0.0.0.0")

    print(f"Starting server on port {port}...")
    print(f"Access poems at http://localhost:{port}/poems/ or http://localhost:{port}/poem/")
    server.serve_forever()


def test_find_related_words():
    """Test function to check if find_related_words is working"""
    generator = PoemGenerator(
        input_csv="./clean4.csv",  # Replace with your actual CSV path
        nlp_model="en_core_web_lg",
        num_poems=4,
        poem_length=3,
        output_dir="poems/"
    )

    test_words = ["mountain", "love", "computer", "ocean", "tree"]
    print("Testing word similarity feature...")

    for word in test_words:
        print(f"\nTesting word: {word}")
        related = generator.find_related_words(word)
        if related:
            print(f"{word} -> {', '.join(related)}")
        else:
            print(f"{word} -> No related words found")

    return generator


def main():
    parser = argparse.ArgumentParser(description="Generate poems using spaCy and cleaned language data")
    parser.add_argument("-i", "--input", default="clean4.csv", help="Input CSV file with cleaned sentences")
    parser.add_argument("-n", "--num-poems", type=int, default=20, help="Number of poems to generate")
    parser.add_argument("-l", "--length", type=int, default=22, help="Maximum number of lines per poem")
    parser.add_argument("-m", "--model", default="en_core_web_lg", help="spaCy model to use")
    parser.add_argument("-o", "--output-dir", default="poems", help="Directory to save generated poems")
    parser.add_argument("-f", "--format", type=str, default="txt,json,html", help="Output format (one or more of txt, json, html, comma-separated)")
    parser.add_argument("-s", "--seed", default=None, help="Initial seed word for poem generation")
    parser.add_argument("-p", "--port", type=int, default=None, help="Run as HTTP server on specified port")
    parser.add_argument("-b", "--batch", type=int, default=None, help="Generate a large batch of poems (specify count)")
    parser.add_argument("-w", "--workers", type=int, default=4, help="Number of worker processes for batch generation")
    parser.add_argument("--cache", type=str, default=None, help="Cache file for word vectors and similarity")
    parser.add_argument("-r", "--related", type=str, default=None, help="Test related words")
    parser.add_argument("--feet", type=str, default=None,
                        help="Pattern for syllable counts (e.g., '575' for haiku, '12x4' for alexandrines)")
    parser.add_argument("--test", action="store_true", help="Run tests for word similarity")
    args = parser.parse_args()

    # Test mode
    if args.test:
        test_find_related_words()
        return

    generator = PoemGenerator(
        input_csv=args.input,
        nlp_model=args.model,
        num_poems=args.num_poems,
        poem_length=args.length,
        output_dir=args.output_dir,
        seed_word=args.seed,
        cache_file=args.cache
    )

    if args.related:
        if "," in args.related:
            args.related = args.related.split(",")
        else:
            args.related = [args.related]
        for word in args.related:
            related = generator.find_related_words(word)
            if related:
                print(f"{word} -> {', '.join(related)}")
            else:
                print(f"No related words found for '{word}'")
        return

    # If batch is specified, generate a large batch
    elif args.batch:
        # Need to update the generate_large_batch logic to support feet patterns
        if args.feet:
            poems = []
            for _ in range(args.batch):
                poems.append(generator.generate_poem(seed_word=args.seed, feet_pattern=args.feet))
        else:
            poems = generator.generate_large_batch(args.batch, args.workers)
        generator.save_poems(poems, format=args.format)
    # Otherwise, generate regular number of poems
    else:
        if args.feet:
            poems = []
            for _ in range(generator.num_poems):
                poem = generator.generate_poem(seed_word=args.seed, feet_pattern=args.feet)
                poems.append(poem)
        else:
            poems = generator.generate_poems()
        generator.save_poems(poems, format=args.format)

    if args.cache:
        generator.save_cache()


if __name__ == "__main__":
    main()
