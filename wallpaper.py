#!/usr/bin/env python3
"""
Wallpaper Generator with Unicode Characters

This script generates artistic patterns using Unicode characters,
inspired by the wallpaper groups in mathematics and crystallography.
It can output to terminal, HTML files, or run as an interactive
animation in the browser.

Features:
- Generate deterministic or random patterns
- Support for all 17 wallpaper groups
- Export to HTML, text files, or PNG images
- Run as interactive animation in a browser
"""

import random
import math
import argparse
import os
import time
import http.server
import socketserver
import json
from pathlib import Path
from typing import List, Dict, Any, Tuple, Optional, Set, Union
import unicodedata
import csv
import sys
from generator import WORD_SET


# ===== Deterministic Random Number Generator =====
class DeterministicRNG:
    def __init__(self, seed: int = 1234):
        self.a = 1664525
        self.c = 1013904223
        self.m = 982451497
        self.seed = seed

    def set_seed(self, seed: int) -> None:
        """Set the seed for the random number generator"""
        self.seed = seed

    def random(self) -> int:
        """Generate the next random integer"""
        self.seed = (self.a * self.seed + self.c) % self.m
        return self.seed

    def random_int(self, spread: int) -> int:
        """Generate a random integer from 0 to spread-1"""
        if spread <= 0:  # Fix: prevent division by zero
            return 0
        return self.random() % spread

    def random_range(self, min_val: int, max_val: int) -> int:
        """Generate a random integer from min to max (inclusive)"""
        return min_val + self.random_int(max_val - min_val + 1)

    def random_float(self) -> float:
        """Generate a random float in the range [0, 1)"""
        return self.random() / self.m

    def random_float_range(self, min_val: float, max_val: float) -> float:
        """Generate a random float in the range [min_val, max_val)"""
        return min_val + (max_val - min_val) * self.random_float()

    def pick(self, array: List) -> Any:
        """Pick a random element from an array"""
        if not array:  # Fix: check for empty array
            return None
        return array[self.random_int(len(array))]


# ===== Wallpaper Patterns =====
class WallpaperPattern:
    # All 17 wallpaper groups
    GROUP_NAMES = [
        "p1", "pm", "pmm", "pg", "cm", "pmg", "cmm", "pgg",
        "p2", "p3", "p3m1", "p31m", "p4", "p4m", "p4g", "p6", "p6m"
    ]

    def __init__(self, width: int, height: int, seed: Optional[int] = None):
        """
        Initialize a wallpaper pattern generator

        Args:
            width: Width of the pattern in characters
            height: Height of the pattern in characters
            seed: Optional seed for random number generation
        """
        self.width = width
        self.height = height
        self.rng = DeterministicRNG(seed if seed is not None else int(time.time()))

        # Pattern parameters
        self.group = self.rng.pick(self.GROUP_NAMES)
        self.base_rotation = self.rng.random_float() * 2 * math.pi
        self.x_spacing = 16
        self.y_spacing = 16
        self.polygon_sides = 4
        self.angle0 = math.pi / 2
        self.rotation_offset = 0
        self.rotate_rule = 0
        self.row_rotate_rule = 0
        self.shear = 0
        self.x_flip = False
        self.y_flip = False
        self.y_flip_pairs = False
        self.y_flip_rows = False
        self.instances_per_step = 1
        self.mirror_instances = False

        # Unicode characters to use for patterns
        self.unicode_blocks = self._load_unicode_blocks()
        self.pattern_chars = self._select_unicode_chars(100)  # Fix: Initialize with some chars

        # Set the rules for the selected wallpaper group
        self._set_rules(self.group)

        # Initialize the canvas
        self.canvas = [[' ' for _ in range(self.width)] for _ in range(self.height)]

        # Load poem data if available
        self.poems = self._load_poems()

    def _load_poems(self) -> List[str]:
        """Load poems from the poems directory if it exists"""
        poems = []
        poems_dir = Path("poems")
        if poems_dir.exists() and poems_dir.is_dir():
            for poem_file in poems_dir.glob("poem_*.txt"):
                try:
                    with open(poem_file, 'r', encoding='utf-8') as f:
                        lines = f.readlines()
                        # Skip the theme line and empty line
                        if len(lines) > 2:
                            poems.extend([line.strip() for line in lines[2:] if line.strip()])
                except Exception:
                    pass

        # If no poems found from files, use some default poem lines
        if not poems:
            poems = [
                "digital whispers dance across empty space",
                "fractured geometry of forgotten dreams",
                "pattern logic emerges from chaos",
                "echoes of silicon in patterns unfold",
                "symmetry breaks at the edge of perception",
                "terminal beauty in unicode spaces",
                "glyphs arrange like constellations",
                "digital artifacts reveal hidden truths",
                "characters drift in mathematical seas",
                "structured randomness tells a story"
            ]

        return poems

    def _load_unicode_blocks(self) -> Dict[str, Tuple[int, int]]:
        """Load interesting Unicode block ranges"""
        return {
            "Box Drawing": (0x2500, 0x257F),
            "Block Elements": (0x2580, 0x259F),
            "Geometric Shapes": (0x25A0, 0x25FF),
            "Miscellaneous Symbols": (0x2600, 0x26FF),
            "Dingbats": (0x2700, 0x27BF),
            "Mathematical Operators": (0x2200, 0x22FF),
            "Miscellaneous Technical": (0x2300, 0x23FF),
            "Braille Patterns": (0x2800, 0x28FF),
            "CJK Symbols and Punctuation": (0x3000, 0x303F),
            "Hiragana": (0x3040, 0x309F),
            "Katakana": (0x30A0, 0x30FF),
            "CJK Unified Ideographs": (0x4E00, 0x9FFF),
            "Arrows": (0x2190, 0x21FF),
            "Symbols for Legacy Computing": (0x1FB00, 0x1FBFF),
            "Mahjong Tiles": (0x1F000, 0x1F02F),
            "Domino Tiles": (0x1F030, 0x1F09F),
            "Playing Cards": (0x1F0A0, 0x1F0FF),
            "Miscellaneous Symbols And Pictographs": (0x1F300, 0x1F5FF),
        }

    def _select_unicode_chars(self, count: int) -> List[str]:
        """Select a specified number of interesting Unicode characters"""
        chars = []

        # Prioritize these character sets for the glitch aesthetic
        priority_blocks = {
            "Box Drawing": (0x2500, 0x257F),
            "Block Elements": (0x2580, 0x259F),
            "Braille Patterns": (0x2800, 0x28FF),
            "CJK Symbols and Punctuation": (0x3000, 0x303F),
            "Geometric Shapes": (0x25A0, 0x25FF),
            "Mathematical Operators": (0x2200, 0x22FF),
            "Miscellaneous Technical": (0x2300, 0x23FF),
            "Arrows": (0x2190, 0x21FF),
            "Miscellaneous Symbols": (0x2600, 0x26FF),
        }

        # Add some cursed/glitchy Unicode (avoid emoji)
        glitch_chars = [
            '█', '▓', '▒', '░', '▀', '▄', '▌', '▐', '■', '□', '▪', '▫', '▬', '▭', '▮',
            '▯', '▰', '▱', '▲', '△', '▴', '▵', '▶', '▷', '▸', '▹', '►', '▻', '▼', '▽',
            '▾', '▿', '◀', '◁', '◂', '◃', '◄', '◅', '◆', '◇', '◈', '◉', '◊', '○', '◌',
            '◍', '◎', '●', '◐', '◑', '◒', '◓', '◔', '◕', '◖', '◗', '◘', '◙', '◚', '◛',
            '◜', '◝', '◞', '◟', '◠', '◡', '◢', '◣', '◤', '◥', '◦', '◧', '◨', '◩', '◪',
            '◫', '◬', '◭', '◮', '◯', '│', '┃', '┄', '┅', '┆', '┇', '┈', '┉', '┊', '┋',
            '┌', '┍', '┎', '┏', '┐', '┑', '┒', '┓', '└', '┕', '┖', '┗', '┘', '┙', '┚',
            '┛', '├', '┝', '┞', '┟', '┠', '┡', '┢', '┣', '┤', '┥', '┦', '┧', '┨', '┩',
            '┪', '┫', '┬', '┭', '┮', '┯', '┰', '┱', '┲', '┳', '┴', '┵', '┶', '┷', '┸',
            '┹', '┺', '┻', '┼', '┽', '┾', '┿', '╀', '╁', '╂', '╃', '╄', '╅', '╆', '╇',
            '╈', '╉', '╊', '╋', '╌', '╍', '╎', '╏', '═', '║', '╒', '╓', '╔', '╕', '╖',
            '╗', '╘', '╙', '╚', '╛', '╜', '╝', '╞', '╟', '╠', '╡', '╢', '╣', '╤', '╥',
            '╦', '╧', '╨', '╩', '╪', '╫', '╬', '╭', '╮', '╯', '╰', '╱', '╲', '╳', '╴',
            '╵', '╶', '╷', '╸', '╹', '╺', '╻', '╼', '╽', '╾', '╿', '⎕', '⌧', '⌐', '¬',
            '¦', '¯', '‾', '⎺', '⎻', '⎼', '⎽', '―', '⎯', '⎰', '⎱'
        ]

        # Create a focused set of characters for the aesthetic
        for _ in range(count // 2):
            chars.append(self.rng.pick(glitch_chars))

        # Add some characters from the priority blocks
        blocks = list(priority_blocks.items())
        for _ in range(count - len(chars)):
            block_name, (start, end) = self.rng.pick(blocks)
            code_point = self.rng.random_range(start, min(end, start + 50))
            try:
                char = chr(code_point)
                # Check if the character is displayable and not a control character
                if unicodedata.category(char)[0] != 'C':
                    chars.append(char)
                else:
                    chars.append(self.rng.pick(glitch_chars))
            except (ValueError, UnicodeEncodeError):
                chars.append(self.rng.pick(glitch_chars))

        return chars

    def _set_rules(self, group: str) -> None:
        """Set the symmetry rules for the requested wallpaper group"""
        # Default values for a rectangular grid
        self.polygon_sides = 4
        self.angle0 = math.pi / 2
        self.x_spacing = 16
        self.y_spacing = 16
        self.rotation_offset = 0
        self.rotate_rule = 0
        self.row_rotate_rule = 0
        self.shear = 0
        self.x_flip = False
        self.y_flip = False
        self.y_flip_pairs = False
        self.y_flip_rows = False
        self.instances_per_step = 1
        self.mirror_instances = False

        # Set specific parameters for each group
        if group == "p1":  # Translation only
            self.polygon_sides = 4
            self.y_spacing = math.sqrt(3 / 4) * self.x_spacing
            self.angle0 = math.pi / 3
            self.shear = 0.5
            self.x_spacing *= 0.5

        elif group == "pm":  # Reflection along one axis
            self.polygon_sides = 4
            self.x_flip = True
            self.x_spacing *= 0.5

        elif group == "pmm":  # Reflection along two axes
            self.polygon_sides = 4
            self.x_flip = True
            self.y_flip_rows = True
            self.x_spacing *= 0.5

        elif group == "pg":  # Glide reflection
            self.polygon_sides = 4
            self.y_flip = True
            self.x_spacing *= 0.5

        elif group == "pmg":  # Reflection + rotation
            self.polygon_sides = 4
            self.x_flip = True
            self.y_flip_pairs = True
            self.x_spacing *= 0.5

        elif group == "cmm":  # Reflection + diagonal
            self.polygon_sides = 4
            self.x_flip = True
            self.y_flip_pairs = True
            self.y_flip_rows = True
            self.x_spacing *= 0.5

        elif group == "pgg":  # Two perpendicular glide reflections
            self.polygon_sides = 4
            self.row_rotate_rule = math.pi
            self.y_flip = True
            self.x_spacing *= 0.5

        elif group == "p2":  # 2-fold rotational symmetry
            self.polygon_sides = 4
            self.y_spacing = math.sqrt(3 / 4) * self.x_spacing
            self.angle0 = math.pi / 3
            self.rotate_rule = math.pi
            self.shear = 0.5
            self.x_spacing *= 0.5

        elif group == "p4":  # 4-fold rotational symmetry
            self.polygon_sides = 4
            self.x_spacing *= 2
            self.y_spacing *= 2
            self.instances_per_step = 4

        elif group == "p4m":  # 4-fold rotational symmetry + reflection
            self.polygon_sides = 3
            self.angle0 = math.pi / 4
            self.x_spacing *= 2
            self.y_spacing *= 2
            self.instances_per_step = 4
            self.mirror_instances = True

        elif group == "p4g":  # 4-fold rotational symmetry + reflection + glide
            self.polygon_sides = 4
            self.rotate_rule = math.pi / 2
            self.x_spacing *= 2
            self.y_spacing *= 2
            self.shear = 1
            self.instances_per_step = 2
            self.mirror_instances = True

        elif group == "cm":  # Reflection + glide reflection
            self.polygon_sides = 4
            self.x_flip = True
            self.shear = 1.0
            self.x_spacing *= 0.5

        elif group == "p3":  # 3-fold rotational symmetry
            self.polygon_sides = 4
            self.rotation_offset = math.pi / 6
            self.angle0 = math.pi * 2 / 3
            self.x_spacing *= 2
            self.y_spacing = math.sqrt(3 / 4) * self.x_spacing
            self.shear = 0.5
            self.instances_per_step = 3

        elif group == "p3m1":  # 3-fold rotational symmetry + reflection
            self.polygon_sides = 3
            self.angle0 = math.pi / 3
            self.rotation_offset = math.pi / 6
            self.rotate_rule = math.pi * 2 / 3
            self.x_spacing *= 2
            self.y_spacing = math.sqrt(3 / 4) * self.x_spacing
            self.shear = 0.5
            self.instances_per_step = 3
            self.mirror_instances = True

        elif group == "p31m":  # 3-fold rotational symmetry + reflection
            self.polygon_sides = 3
            self.angle0 = math.pi / 6
            self.x_spacing *= 2
            self.y_spacing = math.sqrt(3 / 4) * self.x_spacing
            self.shear = 0.5
            self.instances_per_step = 3
            self.mirror_instances = True

        elif group == "p6":  # 6-fold rotational symmetry
            self.polygon_sides = 3
            self.angle0 = math.pi / 6
            self.x_spacing *= 2
            self.y_spacing = math.sqrt(3 / 4) * self.x_spacing
            self.shear = 0.5
            self.instances_per_step = 6

        elif group == "p6m":  # 6-fold rotational symmetry + reflection
            self.polygon_sides = 3
            self.angle0 = math.pi / 6
            self.x_spacing *= 2
            self.y_spacing = math.sqrt(3 / 4) * self.x_spacing
            self.shear = 0.5
            self.instances_per_step = 6
            self.mirror_instances = True

    def _jitter(self, value: float, amount: float) -> float:
        """Add a small random variation to a value"""
        return value - amount + 2 * amount * self.rng.random_float()

    def _get_corner(self, index: int) -> Tuple[float, float]:
        """Get the coordinates of a corner point for the current pattern"""
        new_point = (0, 0)
        distance = self.x_spacing

        if self.group == "p3m1":
            distance = 2 / math.sqrt(3) * self.x_spacing / 2
        if self.group in ["p4", "p4m", "p4g"]:
            distance = self.x_spacing / 2

        if index == 0:
            new_point = (0, 0)
        elif index == 1:
            if self.group == "p3":
                distance = 0.5 * self.x_spacing / math.sqrt(3 / 4)
            if self.group == "p6m":
                distance = 0.5 * self.x_spacing
            new_point = (distance, 0)
        elif index == 2:
            if self.group == "p3":
                distance = 0.5 * self.x_spacing / math.sqrt(3 / 4)
            if self.group in ["p31m", "p6", "p6m"]:
                distance = 2 / math.sqrt(3) * self.x_spacing / 2
            if self.group == "p4m":
                distance = 0.5 * math.sqrt(2) * self.x_spacing
            new_point = (distance * math.cos(self.angle0), distance * math.sin(self.angle0))
        elif index == 3:
            if self.group == "p3":
                distance = 0.5 * self.x_spacing / math.sqrt(3 / 4)
            if self.group in ["p1", "p2"]:
                distance = 2 * (math.sqrt(3) / 2) * self.x_spacing
            if self.group in ["pm", "pmm", "pg", "cm", "cmm", "pgg", "pmg"]:
                distance = self.x_spacing * math.sqrt(2)
            if self.group in ["p4", "p4m", "p4g"]:
                distance = math.sqrt(2) * self.x_spacing / 2
            new_point = (distance * math.cos(self.angle0 / 2), distance * math.sin(self.angle0 / 2))

        return new_point

    def _lerp(self, n1: float, n2: float, blend: float) -> float:
        """Linear interpolation between two values"""
        return (1.0 - blend) * n1 + blend * n2

    def _transform_to_canvas(self, x: float, y: float) -> Tuple[int, int]:
        """Transform a point in pattern coordinates to canvas coordinates"""
        # Center the pattern and scale appropriately
        center_x = self.width // 2
        center_y = self.height // 2

        # Apply base rotation
        cos_rot = math.cos(self.base_rotation)
        sin_rot = math.sin(self.base_rotation)
        rot_x = x * cos_rot - y * sin_rot
        rot_y = x * sin_rot + y * cos_rot

        # Transform to canvas coordinates
        canvas_x = int(center_x + rot_x)
        canvas_y = int(center_y + rot_y)

        # Ensure we stay within bounds
        canvas_x = max(0, min(self.width - 1, canvas_x))
        canvas_y = max(0, min(self.height - 1, canvas_y))

        return canvas_x, canvas_y

    def _get_random_point_in_domain(self) -> Tuple[float, float]:
        """Get a random point within the fundamental domain"""
        corner0 = self._get_corner(0)
        corner1 = self._get_corner(1)
        corner2 = self._get_corner(2)

        center = (0, 0)
        if self.polygon_sides == 4:
            corner3 = self._get_corner(3)
            center = ((corner3[0] + corner0[0]) / 2, (corner3[1] + corner0[1]) / 2)
        else:
            center = ((corner0[0] + corner1[0] + corner2[0]) / 3,
                      (corner0[1] + corner1[1] + corner2[1]) / 3)

        # Start with corner0
        new_point = corner0

        # Blend with corner1
        blend = self.rng.random_float()
        new_point = (self._lerp(new_point[0], corner1[0], blend),
                     self._lerp(new_point[1], corner1[1], blend))

        if self.polygon_sides == 3:
            # Blend with corner2
            blend = self.rng.random_float()
            new_point = (self._lerp(new_point[0], corner2[0], blend),
                         self._lerp(new_point[1], corner2[1], blend))

        if self.polygon_sides == 4:
            # Blend with y coordinate of corner2
            blend = self.rng.random_float()
            new_point = (new_point[0], self._lerp(new_point[1], corner2[1], blend))
            # Apply shear
            new_point = (new_point[0] + (corner2[0] - corner0[0]) * blend, new_point[1])

        return new_point

    def draw_pattern(self) -> None:
        """Draw the pattern according to the current wallpaper group rules"""
        # Clear the canvas
        self.canvas = [[' ' for _ in range(self.width)] for _ in range(self.height)]

        # Ensure pattern_chars is not empty
        if not self.pattern_chars:
            self.pattern_chars = self._select_unicode_chars(100)

        # Place a glyph at each position according to the pattern rules
        x_count = int(self.height / self.x_spacing) + 2
        y_count = int(self.height / self.y_spacing) + 2

        for y in range(y_count):
            for x in range(x_count):
                # Calculate position
                pos_x = (x - x_count / 2 + (y - y_count / 2) * self.shear) * self.x_spacing
                pos_y = (y - y_count / 2) * self.y_spacing

                # Determine rotation for this instance
                current_rotation = self.rotate_rule * x + self.row_rotate_rule * y + self.rotation_offset

                # Apply the symmetry transformations
                for i in range(self.instances_per_step):
                    rot = i * (2.0 * math.pi / self.instances_per_step)

                    # For radial rules with mirroring per instance
                    for flip in [-1, 1] if self.mirror_instances else [1]:
                        # Determine x flip for this instance
                        x_flipped = False
                        if self.x_flip and (x % 2 == 0):
                            x_flipped = True
                            pos_x += self.x_spacing

                        # Determine y flip for this instance
                        y_flipped = False
                        if (self.y_flip and (x % 2 == 0)) or \
                                (self.y_flip_pairs and (math.floor(x / 2) % 2 == 0)) or \
                                (self.y_flip_rows and (y % 2 == 0)):
                            y_flipped = True
                            if self.y_flip_rows:
                                pos_y += self.y_spacing

                        # Add random variation to make it more interesting
                        # Place a pattern glyph
                        glyph = self.rng.pick(self.pattern_chars)
                        if glyph is None:  # Fallback if pick returns None
                            glyph = "█"

                        # Calculate final position with all transformations
                        final_x = pos_x
                        final_y = pos_y

                        # Apply rotation
                        if rot != 0 or current_rotation != 0:
                            total_rot = rot + current_rotation
                            cos_rot = math.cos(total_rot)
                            sin_rot = math.sin(total_rot)
                            final_x, final_y = (
                                pos_x * cos_rot - pos_y * sin_rot,
                                pos_x * sin_rot + pos_y * cos_rot
                            )

                        # Apply flips
                        if x_flipped:
                            final_x = -final_x
                        if y_flipped:
                            final_y = -final_y

                        # Add a jitter for organic feel
                        jitter_amount = 0.2
                        final_x = self._jitter(final_x, jitter_amount)
                        final_y = self._jitter(final_y, jitter_amount)

                        # Transform to canvas coordinates
                        canvas_x, canvas_y = self._transform_to_canvas(final_x, final_y)

                        # Place the glyph on the canvas
                        if 0 <= canvas_x < self.width and 0 <= canvas_y < self.height:
                            self.canvas[canvas_y][canvas_x] = glyph

    def embed_poem(self, poem_lines: List[str]) -> None:
        """Embed a poem into the pattern"""
        if not poem_lines:
            return

        # Select random poem lines to highlight if there are too many
        if len(poem_lines) > 5:
            selected_lines = []
            for _ in range(min(5, len(poem_lines))):
                line = self.rng.pick(poem_lines)
                if line not in selected_lines and line.strip():
                    selected_lines.append(line)
            poem_lines = selected_lines

        # Find suitable lines in the pattern to embed text
        canvas_height = self.height
        spacing = max(3, canvas_height // (len(poem_lines) + 2))

        # Add poem lines distributed across the canvas
        for i, line in enumerate(poem_lines):
            if not line.strip():
                continue

            # Calculate vertical position with some variation
            y = (i + 1) * spacing
            if y >= canvas_height:
                break

            # Calculate horizontal position to center the text
            start_x = max(0, (self.width - len(line)) // 2)

            # Highlight some parts of the poem with yellow color
            # In terminal mode this will be normal text
            # In HTML mode this will be styled as yellow highlights
            line = f'<poem>{line}</poem>'

            # Embed the text
            for x in range(self.width):
                if x < start_x or x >= start_x + len(line):
                    continue
                char_index = x - start_x
                if char_index < len(line):
                    self.canvas[y][x] = line[char_index]

    def generate_pattern(self, poem_lines: Optional[List[str]] = None) -> None:
        """Generate a complete pattern, optionally embedding a poem"""
        self.draw_pattern()

        # If no poem lines are provided, select random ones from loaded poems
        if not poem_lines and self.poems:
            # Generate 2 random poem lines
            selected_poem_lines = []
            for _ in range(2):
                if self.poems:
                    line = self.rng.pick(self.poems)
                    if line and line not in selected_poem_lines:
                        selected_poem_lines.append(line)

            if selected_poem_lines:
                self.embed_poem(selected_poem_lines)

    def to_text(self) -> str:
        """Convert the pattern to a text string"""
        return '\n'.join([''.join(row) for row in self.canvas])

    def to_html(self) -> str:
        """Convert the pattern to HTML"""
        html = [
            '<!DOCTYPE html>',
            '<html>',
            '<head>',
            '    <meta charset="utf-8">',
            '    <title>Unicode Wallpaper Pattern</title>',
            '    <style>',
            '        body { background-color: #fff; color: #000; margin: 0; padding: 0; }',
            '        .pattern { font-family: monospace; white-space: pre; line-height: 1; font-size: 14px; }',
            '        .pattern poem { background-color: #ff0; color: #000; }',
            '    </style>',
            '</head>',
            '<body>',
            '<div class="pattern">'
        ]

        for row in self.canvas:
            line = ''.join(row)
            # Replace <poem> tags with span for HTML
            line = line.replace('<poem>', '<span style="background-color: #ff0; color: #000;">')
            line = line.replace('</poem>', '</span>')
            html.append(line)

        html.extend([
            '</div>',
            '</body>',
            '</html>'
        ])

        return '\n'.join(html)

    def save_to_file(self, filename: str, format: str = "txt") -> None:
        """Save the pattern to a file"""
        if format == "txt":
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(self.to_text())
        elif format == "html":
            with open(filename, 'w', encoding='utf-8') as f:
                f.write(self.to_html())

    def set_random_group(self) -> None:
        """Set a random wallpaper group and regenerate the pattern rules"""
        self.group = self.rng.pick(self.GROUP_NAMES)
        self._set_rules(self.group)

    def _draw_pattern_dense(self, density_factor=1.0):
        """Draw a pattern with increased density"""
        # Clear the canvas
        self.canvas = [[' ' for _ in range(self.width)] for _ in range(self.height)]

        # Fill with characters more densely
        char_count = int(self.width * self.height * density_factor)
        for _ in range(char_count):
            x = self.rng.random_int(self.width)
            y = self.rng.random_int(self.height)
            self.canvas[y][x] = self.rng.pick(self.pattern_chars)

# ===== Animation and Web Server =====
class UnicodePatternServer:
    """A simple server for serving animated Unicode patterns"""

    def __init__(self, port: int = 8000, width: int = 80, height: int = 40, seed: Optional[int] = None):
        """
        Initialize the pattern server

        Args:
            port: Port number to listen on
            width: Width of the pattern in characters
            height: Height of the pattern in characters
            seed: Optional seed for random number generation
        """
        self.port = port
        self.width = width
        self.height = height
        self.seed = seed
        self.handler = None
        self.server = None
        self.pattern_generator = WallpaperPattern(width, height, seed)

    def _create_handler(self):
        """Create a request handler class for the server"""
        pattern_generator = self.pattern_generator

        class PatternRequestHandler(http.server.SimpleHTTPRequestHandler):
            def do_GET(self):
                if self.path == '/':
                    self.send_response(200)
                    self.send_header('Content-type', 'text/html')
                    self.end_headers()

                    # Create the HTML page with animation
                    html = self._create_animation_html()
                    self.wfile.write(html.encode('utf-8'))

                elif self.path == '/pattern':
                    self.send_response(200)
                    self.send_header('Content-type', 'application/json')
                    self.end_headers()

                    # Generate a new pattern
                    pattern_generator.set_random_group()
                    pattern_generator.generate_pattern()

                    # Return the pattern as JSON
                    pattern_data = {
                        'pattern': pattern_generator.to_text(),
                        'group': pattern_generator.group
                    }
                    self.wfile.write(json.dumps(pattern_data).encode('utf-8'))

                else:
                    # Serve static files
                    super().do_GET()

            def _create_animation_html(self):
                """Create HTML for the animated pattern display"""
                return f"""<!DOCTYPE html>
                        <html>
                        <head>
                            <meta charset="utf-8">
                            <title>I NEVER PICKED A PROTECTED FLOWER EXCEPT FOR YOU</title>
                            <style>
                                body {{
                                    background-color: #fff;
                                    color: #000;
                                    font-family: monospace;
                                    display: flex;
                                    flex-direction: column;
                                    justify-content: center;
                                    align-items: center;
                                    height: 100vh;
                                    margin: 0;
                                    padding: 20px;
                                }}
                                .pattern-container {{
                                    background-color: #fff;
                                    padding: 20px;
                                    border-radius: 5px;
                                    margin-bottom: 20px;
                                    white-space: pre;
                                    line-height: 1;
                                    font-size: 14px;
                                    overflow: hidden;
                                    border: 1px solid #000;
                                }}
                                .controls {{
                                    margin-top: 20px;
                                }}
                                .pattern-info {{
                                    margin-bottom: 10px;
                                    font-size: 16px;
                                }}
                                button {{
                                    background-color: #000;
                                    color: #fff;
                                    border: none;
                                    padding: 10px 20px;
                                    border-radius: 5px;
                                    cursor: pointer;
                                    margin-right: 10px;
                                }}
                                button:hover {{
                                    background-color: #333;
                                }}
                                poem {{
                                    background-color: #ff0;
                                    color: #000;
                                }}
                            </style>
                        </head>
                        <body>
                            <div class="pattern-info">Wallpaper Group: <span id="group-name">{pattern_generator.group}</span></div>
                            <div class="pattern-container" id="pattern">
                                {pattern_generator.to_text().replace('<poem>', '<poem>').replace('</poem>', '</poem>')}
                            </div>
                            <div class="controls">
                                <button id="new-pattern">Generate New Pattern</button>
                                <button id="toggle-animation">Start Animation</button>
                            </div>
        
                            <script>
                                const patternElement = document.getElementById('pattern');
                                const groupNameElement = document.getElementById('group-name');
                                const newPatternButton = document.getElementById('new-pattern');
                                const toggleAnimationButton = document.getElementById('toggle-animation');
        
                                let animationInterval = null;
        
                                function parseAndFormatPattern(patternText) {{
                                    // Replace <poem> tags with actual HTML elements
                                    return patternText
                                        .replace(/<poem>/g, '<span style="background-color: #ff0; color: #000;">')
                                        .replace(/<\/poem>/g, '</span>');
                                }}
        
                                async function fetchNewPattern() {{
                                    try {{
                                        const response = await fetch('/pattern');
                                        const data = await response.json();
                                        patternElement.innerHTML = parseAndFormatPattern(data.pattern);
                                        groupNameElement.textContent = data.group;
                                    }} catch (error) {{
                                        console.error('Error fetching pattern:', error);
                                    }}
                                }}
        
                                newPatternButton.addEventListener('click', fetchNewPattern);
        
                                toggleAnimationButton.addEventListener('click', () => {{
                                    if (animationInterval) {{
                                        clearInterval(animationInterval);
                                        animationInterval = null;
                                        toggleAnimationButton.textContent = 'Start Animation';
                                    }} else {{
                                        animationInterval = setInterval(fetchNewPattern, 3000);
                                        toggleAnimationButton.textContent = 'Stop Animation';
                                    }}
                                }});
        
                                // Initial formatting
                                patternElement.innerHTML = parseAndFormatPattern(patternElement.textContent);
                            </script>
                        </body>
                        </html>"""

        return PatternRequestHandler

    def run(self):
        """Run the server"""
        handler_class = self._create_handler()
        self.server = socketserver.TCPServer(("", self.port), handler_class)

        print(f"Starting pattern server at http://localhost:{self.port}")
        print("Press Ctrl+C to stop the server")

        try:
            self.server.serve_forever()
        except KeyboardInterrupt:
            print("\nShutting down server")
            self.server.shutdown()


def main():
    parser = argparse.ArgumentParser(description="Generate Unicode wallpaper patterns")
    parser.add_argument("-W", "--width", type=int, default=80, help="Width of the pattern in characters")
    parser.add_argument("-H", "--height", type=int, default=40, help="Height of the pattern in characters")
    parser.add_argument("-s", "--seed", type=int, default=None, help="Random seed for pattern generation")
    parser.add_argument("-g", "--group", choices=WallpaperPattern.GROUP_NAMES, help="Specific wallpaper group to use")
    parser.add_argument("-p", "--port", type=int, default=None, help="Run as web server on specified port")
    parser.add_argument("-o", "--output", default=None, help="Output file path")
    parser.add_argument("-f", "--format", choices=["txt", "html"], default="txt", help="Output format")
    parser.add_argument("--poem", default=None, help="Text file containing poem to embed")
    parser.add_argument("-D", "--density", type=int, default=200, help="Character density (higher = more characters)")
    parser.add_argument("-b", "--background", choices=["white", "black"], default="white",
                        help="Background color for HTML output (default: white)")
    parser.add_argument("-i", "--interactive", type=int, nargs='?', const=100,
                        help="Run in interactive mode with auto-updates (optional: interval in ms, default: 100)")
    parser.add_argument("--chaos", action="store_true",
                        help="Run in chaos mode with varying density and update intervals")
    args = parser.parse_args()

    # Create the pattern generator
    pattern = WallpaperPattern(args.width, args.height, args.seed)

    # Set specific wallpaper group if requested
    if args.group:
        pattern.group = args.group
        pattern._set_rules(args.group)

    # Set character density
    pattern.pattern_chars = pattern._select_unicode_chars(args.density)
    pattern.draw_pattern = lambda: pattern._draw_pattern_dense(args.density / (args.width * args.height))

    # Load poem if specified
    poem_lines = None
    if args.poem:
        try:
            with open(args.poem, 'r', encoding='utf-8') as f:
                poem_lines = f.read().splitlines()
        except Exception as e:
            print(f"Error loading poem: {e}")

    # Generate the pattern
    pattern.generate_pattern(poem_lines)

    # Run as web server if port is specified
    if args.port:
        server = UnicodePatternServer(args.port, args.width, args.height, args.seed)
        server.run()
    # Run in interactive terminal mode or chaos mode
    elif args.interactive is not None or args.chaos:
        try:
            import time
            import os
            import sys
            import math

            if args.chaos:
                print("CHAOS MODE! (Ctrl+C to exit)")
                # Starting values
                density = 100
                interval = 0.2  # seconds
                phase = 0
                chaos_factor = 0  # starts calm, gets more chaotic
            else:
                interval = args.interactive / 1000.0  # Convert ms to seconds
                print(f"Interactive mode (Ctrl+C to exit, updating every {args.interactive}ms)")

            while True:
                # Clear screen (cross-platform)
                os.system('cls' if os.name == 'nt' else 'clear')

                if args.chaos:
                    # Update chaos values
                    phase += 0.05
                    chaos_factor = min(1.0, chaos_factor + 0.005)  # slowly increase chaos

                    # Vary density between 5 and 1500, using sine waves with increasing chaos
                    base_density = 750 + 745 * math.sin(phase)
                    chaos_wave = 200 * math.sin(phase * 3.7) * chaos_factor
                    density = max(5, min(1500, int(base_density + chaos_wave)))

                    # Vary interval between 15ms and 500ms
                    base_interval = 0.25 + 0.225 * math.sin(phase * 0.7)
                    interval_chaos = 0.15 * math.sin(phase * 5.3) * chaos_factor
                    interval = max(0.015, min(0.5, base_interval + interval_chaos))

                    # Update the pattern with new density
                    pattern.pattern_chars = pattern._select_unicode_chars(density)

                # Generate a new pattern
                pattern.set_random_group()
                pattern.generate_pattern(poem_lines)

                # Print the pattern
                if args.chaos:
                    print(f"CHAOS MODE! Density: {density}, Refresh: {int(interval*1000)}ms, Group: {pattern.group}")
                else:
                    print(f"Wallpaper Group: {pattern.group}")

                print(pattern.to_text())
                print("\nPress Ctrl+C to exit")

                # Wait for the interval
                time.sleep(interval)

        except KeyboardInterrupt:
            print("\nExiting interactive mode")
        # Otherwise, output pattern to file or stdout
    else:
        if args.output:
            pattern.save_to_file(args.output, args.format)
            print(f"Pattern saved to {args.output}")
        else:
            print(pattern.to_text())


if __name__ == "__main__":
    main()