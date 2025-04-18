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

import random
import csv
import spacy
import os
import json
import argparse
import http.server
import socketserver
from typing import List, Dict, Any, Tuple, Optional
from pathlib import Path
from threading import Thread
import time
import multiprocessing

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
    def __init__(self, input_csv: str, nlp_model: str = "en_core_web_md", num_poems: int = 20,
                 poem_length: int = 22, output_dir: str = "poems", seed_word: Optional[str] = None):
        """
        Initialize the poem generator.

        Args:
            input_csv: Path to the CSV file with cleaned sentences
            nlp_model: spaCy model to use
            num_poems: Number of poems to generate
            poem_length: Maximum number of lines in each poem
            output_dir: Directory to save generated poems
            seed_word: Optional starting seed word
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
        self.initial_seed = seed_word if seed_word else random.choice(WORD_SET)
        self.poem_cache = {}  # Cache for storing generated poems

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

    def make_poem(self, seed_word: str) -> Tuple[List[str], str]:
        """
        Generate a poem based on a seed word

        Args:
            seed_word: The word to base the poem on

        Returns:
            Tuple of (poem lines, theme word)
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
        return cluster[:self.poem_length], seed_word

    def choose_next_seed(self, current_seed: str) -> str:
        """Choose the next seed word based on the current one"""
        related = self.find_related_words(current_seed, n=8)

        # If we found related words, choose one at random
        if related:
            return random.choice(related)

        # Otherwise choose a random word from our seed set
        return random.choice(WORD_SET)

    def generate_poem(self, seed_word: Optional[str] = None) -> Dict[str, Any]:
        """
        Generate a single poem

        Args:
            seed_word: Optional seed word to use

        Returns:
            Dictionary containing poem data
        """
        if not seed_word:
            seed_word = random.choice(WORD_SET)

        poem_lines, theme = self.make_poem(seed_word)
        return {
            "lines": poem_lines,
            "theme": theme,
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

            if poem_lines:
                # Create a dictionary with poem data
                poem_data = {
                    "id": i + 1,
                    "lines": poem_lines,
                    "theme": theme,
                    "seed": current_seed,
                    "timestamp": time.time()
                }

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
        if format == "txt":
            for poem in poems:
                filename = os.path.join(self.output_dir, f"poem_{poem['id']}.txt")
                with open(filename, 'w', encoding='utf-8') as f:
                    f.write(f"Theme: {poem['theme']}\n\n")
                    for line in poem['lines']:
                        f.write(f"{line}\n")

            # Also save all poems to a single file
            with open(os.path.join(self.output_dir, "all_poems.txt"), 'w', encoding='utf-8') as f:
                for poem in poems:
                    f.write(f"--- Poem {poem['id']} (Theme: {poem['theme']}) ---\n")
                    for line in poem['lines']:
                        f.write(f"{line}\n")
                    f.write("\n\n")

        elif format == "html":
            # Create a simple HTML output with all poems
            with open(os.path.join(self.output_dir, "poems.html"), 'w', encoding='utf-8') as f:
                f.write("""<!DOCTYPE html>
                <html>
                <head>
                    <meta charset="utf-8">
                    <title>Generated Poems</title>
                    <style>
                        body { font-family: monospace; max-width: 800px; margin: 0 auto; padding: 20px; }
                        .poem { margin-bottom: 40px; padding: 20px; border: 1px solid #eee; page-break-after: always; }
                        .theme { font-weight: bold; margin-bottom: 15px; font-size: 1.2em; }
                        .line { margin-bottom: 8px; }
                        h1 { text-align: center; margin-bottom: 40px; }
                    </style>
                </head>
                <body>
                <h1>Generated Poems</h1>
                """)

                for poem in poems:
                    f.write(f'<div class="poem">\n')
                    f.write(f'<div class="theme">Theme: {poem["theme"]}</div>\n')
                    for line in poem['lines']:
                        f.write(f'<div class="line">{line}</div>\n')
                    f.write('</div>\n')

                f.write("</body></html>")

        elif format == "json":
            # Save as JSON
            with open(os.path.join(self.output_dir, "poems.json"), 'w', encoding='utf-8') as f:
                json.dump(poems, f, indent=2)

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


def main():
    parser = argparse.ArgumentParser(description="Generate poems using spaCy and cleaned language data")
    parser.add_argument("-i", "--input", default="clean4.csv", help="Input CSV file with cleaned sentences")
    parser.add_argument("-n", "--num-poems", type=int, default=20, help="Number of poems to generate")
    parser.add_argument("-l", "--length", type=int, default=22, help="Maximum number of lines per poem")
    parser.add_argument("-m", "--model", default="en_core_web_md", help="spaCy model to use")
    parser.add_argument("-o", "--output-dir", default="poems", help="Directory to save generated poems")
    parser.add_argument("-f", "--format", choices=["txt", "html", "json"], default="txt", help="Output format")
    parser.add_argument("-s", "--seed", default=None, help="Initial seed word for poem generation")
    parser.add_argument("-p", "--port", type=int, default=None, help="Run as HTTP server on specified port")
    parser.add_argument("-b", "--batch", type=int, default=None, help="Generate a large batch of poems (specify count)")
    parser.add_argument("-w", "--workers", type=int, default=4, help="Number of worker processes for batch generation")
    args = parser.parse_args()

    generator = PoemGenerator(
        input_csv=args.input,
        nlp_model=args.model,
        num_poems=args.num_poems,
        poem_length=args.length,
        output_dir=args.output_dir,
        seed_word=args.seed
    )

    # If port is specified, run as HTTP server
    if args.port:
        run_server(generator, args.port)
    # If batch is specified, generate a large batch
    elif args.batch:
        poems = generator.generate_large_batch(args.batch, args.workers)
        generator.save_poems(poems, format=args.format)
    # Otherwise, generate regular number of poems
    else:
        poems = generator.generate_poems()
        generator.save_poems(poems, format=args.format)


if __name__ == "__main__":
    main()