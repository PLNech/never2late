#!/usr/bin/env python3
"""
Poetry Generator using spaCy for local NLP processing and cleaned English language data.
This script generates thematic poems by traversing related concepts using word vectors
and semantic similarity.
"""

import random
import csv
import spacy
import os
import argparse
from typing import List, Set, Dict, Any
from pathlib import Path

# Initial seed words
WORD_SET = [
    "dog", "flower", "windmill", "cliff", "forest", "city", "home", "light", "excess", "clean",
    "crossroads", "horizon", "road", "settlement", "boulder", "outcropping", "signpost", "well",
    "shelter", "storm", "scrub", "railroad", "truck stop", "gas station", "weigh station",
    "crop field", "farm", "silo", "bird flock", "highway", "sign", "turnpike", "construction site",
    "detour", "rest stop", "traffic jam", "traffic", "tunnel", "convenience store", "mile marker",
    "cave", "windbreak", "billboard", "street", "path", "river", "hill", "land", "line", "house",
    "bank", "bridge", "highway", "rock", "valley", "wind", "sky", "landscape", "ocean", "cloud",
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


class PoemGenerator:
    def __init__(self, input_csv: str, nlp_model: str = "en_core_web_lg", num_poems: int = 20,
                 poem_length: int = 22, output_dir: str = "poems"):
        """
        Initialize the poem generator.

        Args:
            input_csv: Path to the CSV file with cleaned sentences
            nlp_model: spaCy model to use
            num_poems: Number of poems to generate
            poem_length: Maximum number of lines in each poem
            output_dir: Directory to save generated poems
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

        # Create output directory if it doesn't exist
        Path(output_dir).mkdir(exist_ok=True)

        # Load data from CSV
        self.load_data(input_csv)

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

    def find_related_words(self, word: str, n: int = 15) -> List[str]:
        """
        Find words related to the given word using spaCy word vectors

        Args:
            word: The seed word to find related words for
            n: Number of related words to return

        Returns:
            List of related words
        """
        # Skip processing if word not in vocabulary
        if word not in self.nlp.vocab:
            return []

        word_token = self.nlp(word)[0]

        # Find similar words using vector similarity
        related = []
        for token in self.nlp.vocab:
            # Only consider actual words with vectors
            if token.has_vector and token.is_alpha and len(token.text) > 1:
                similarity = word_token.similarity(token)
                related.append((token.text, similarity))

        # Sort by similarity and take top n
        related.sort(key=lambda x: x[1], reverse=True)
        return [word for word, _ in related[:n]]

    def make_poem(self, seed_word: str) -> List[str]:
        """
        Generate a poem based on a seed word

        Args:
            seed_word: The word to base the poem on

        Returns:
            List of lines in the poem
        """
        # Find related words to the seed word
        related_words = self.find_related_words(seed_word)
        if not related_words:
            related_words = [seed_word]

        # Add the seed word to ensure it's included
        if seed_word not in related_words:
            related_words.append(seed_word)

        # Build a cluster of sentences containing those words
        cluster = []
        for word in related_words:
            for sentence in self.sentences:
                if word in sentence.split() and sentence not in cluster:
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
                if len(cluster) >= self.poem_length:
                    break

        # Shuffle the cluster and limit to poem_length
        random.shuffle(cluster)
        return cluster[:self.poem_length]

    def choose_next_seed(self, current_seed: str) -> str:
        """Choose the next seed word based on the current one"""
        related = self.find_related_words(current_seed, n=8)

        # If we found related words, choose one at random
        if related:
            return random.choice(related)

        # Otherwise choose a random word from our seed set
        return random.choice(WORD_SET)

    def generate_poems(self) -> List[List[str]]:
        """Generate a series of poems"""
        all_poems = []
        current_seed = random.choice(WORD_SET)

        print(f"Generating {self.num_poems} poems...")
        for i in range(self.num_poems):
            print(f"Poem {i + 1}/{self.num_poems}: seed '{current_seed}'")
            poem = self.make_poem(current_seed)

            if poem:
                all_poems.append(poem)
                # Choose the next seed word
                current_seed = self.choose_next_seed(current_seed)
            else:
                # If we couldn't make a poem, try with a different seed
                current_seed = random.choice(WORD_SET)

        return all_poems

    def save_poems(self, poems: List[List[str]], format: str = "txt") -> None:
        """Save the generated poems to files"""
        if format == "txt":
            for i, poem in enumerate(poems):
                filename = os.path.join(self.output_dir, f"poem_{i + 1}.txt")
                with open(filename, 'w', encoding='utf-8') as f:
                    for line in poem:
                        f.write(f"{line}\n")

            # Also save all poems to a single file
            with open(os.path.join(self.output_dir, "all_poems.txt"), 'w', encoding='utf-8') as f:
                for i, poem in enumerate(poems):
                    f.write(f"--- Poem {i + 1} ---\n")
                    for line in poem:
                        f.write(f"{line}\n")
                    f.write("\n\n")

        elif format == "html":
            # Create a simple HTML output
            with open(os.path.join(self.output_dir, "poems.html"), 'w', encoding='utf-8') as f:
                f.write("""<!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Generated Poems</title>
                    <style>
                        body { font-family: monospace; max-width: 800px; margin: 0 auto; }
                        .poem { margin-bottom: 40px; padding: 20px; border: 1px solid #eee; page-break-after: always; }
                        .line { margin-bottom: 8px; }
                    </style>
                </head>
                <body>
                """)

                for i, poem in enumerate(poems):
                    f.write(f'<div class="poem">\n')
                    for line in poem:
                        f.write(f'<div class="line">{line}</div>\n')
                    f.write('</div>\n')

                f.write("</body></html>")

        print(f"Saved {len(poems)} poems to {self.output_dir}")


def main():
    parser = argparse.ArgumentParser(description="Generate poems using spaCy and cleaned language data")
    parser.add_argument("-i", "--input", default="clean4.csv", help="Input CSV file with cleaned sentences")
    parser.add_argument("-n", "--num-poems", type=int, default=20, help="Number of poems to generate")
    parser.add_argument("-l", "--length", type=int, default=22, help="Maximum number of lines per poem")
    parser.add_argument("-m", "--model", default="en_core_web_lg", help="spaCy model to use")
    parser.add_argument("-o", "--output-dir", default="poems", help="Directory to save generated poems")
    parser.add_argument("-f", "--format", choices=["txt", "html"], default="txt", help="Output format")
    args = parser.parse_args()

    generator = PoemGenerator(
        input_csv=args.input,
        nlp_model=args.model,
        num_poems=args.num_poems,
        poem_length=args.length,
        output_dir=args.output_dir
    )

    poems = generator.generate_poems()
    generator.save_poems(poems, format=args.format)


if __name__ == "__main__":
    main()