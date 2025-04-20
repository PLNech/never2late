# ₦∃⋁∃ℝ²ᒪΔͲ∃ ▓░▒ d⍜t⍜ unicode poetry ▒▓▓░

> *"the day she picked a p̕͜r̀o̸tec̀͝t̨ed̷͞ f͟͡l̀o̵͢w͜͝e̕r̀͝ the sky ͡҉͜҉͢f̡͘e҉͠ļ̷̵̴̵͘͟͟ļ̷̵̴̵͘͟͟"*

## ᓚᘏᗢ A B̶r̴o̴k̶e̶n̷ I̴ and A B̶r̴o̴k̶e̶n̷ Y̵o̷u̶ ᓚᘏᗢ

*Never2Late* 𝓲𝓼 an ██████ poetry-██████ making machine ████████ from what is ████████ lost. 
In the spaces between ███ █████ on WordReference.com, ███████ oblivion, we find the ██████████ of language 
from ███████ our collective ████.

Developed for la _Fête des Fleurs_, 2025 edition.

![image](https://github.com/user-attachments/assets/a362785c-3a4e-467f-900f-8ead1ad03761)

----
## *"𝔻𝕖𝕒𝕥𝕙 𝕚𝕤 𝕟𝕠𝕥 𝕥𝕙𝕖 𝕖𝕟𝕕 𝕠𝕗 𝕓𝕖𝕒𝕦𝕥𝕪. ℙ𝕠𝕖𝕥𝕣𝕪 𝕚𝕤 𝕥𝕙𝕖 𝕣𝕖𝕤𝕦𝕣𝕣𝕖𝕔𝕥𝕚𝕠𝕟 𝕠𝕗 𝕞𝕖𝕒𝕟𝕚𝕟𝕘."*

▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

## ℂ𝕣𝕖𝕕𝕚𝕥𝕤 𝕒𝕟𝕕 𝔸𝕔𝕜𝕟𝕠𝕨𝕝𝕖𝕕𝕘𝕖𝕞𝕖𝕟𝕥𝕤 ⌬⎰◊⠬⠃↤☘

- **Profuse thanks to everest pipkin**, whose work ["i've never picked a protected flower"](https://github.com/everestpipkin/never/blob/master/never.pdf) inspired this project.  
Their 400-page generative glitch poetry PDF is IMO a masterpiece of digital art and concrete poetry <3 
- The [original forum thread](https://forum.wordreference.com/threads/ive-never-picked-a-protected-flower.644138/) which inspired the projects' names

> *"i've never picked a protected flower"* 
See the source at [github.com/everestpipkin/never](https://github.com/everestpipkin/never)


## 🅼🅰🅽🅸🅵🅴🆂🆃🅾

Instead of relying on external APIs for conceptual relationships, we use local NLP models with [spaCy + vector similarity computations](https://spacy.io/usage/linguistic-features#vectors-similarity) to retrieve semantically proximate words directly from the corpus, based on English NLP pre-trained [word models](https://spacy.io/usage/models).

The project is composed of four independent yet interconnected parts:

1. `scraper.py` - ɨצɬཞąƈɬʂ raw language from the collective unconscious
2. `clean.py` - ꎇꀤ꒒꓄ꏂꋪꌗ the noise from the signal
3. `generator.py` - ੮гคຖŞ৲๏гຖŞ random words into semantic poetry
4. `wallpaper.py` - єη¢α∂єѕ the poems into unicode patterns

▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓

## 🄸🄽🅂🅃🄰🄻🄻🄰🅃🄸🄾🄽 ╜◊⎼▲▅⠌◇╯◆

```bash
# Clone the repository
git clone https://github.com/PLNech/never2.git
cd never2

# Optional but recommended: create a virtual environment
python -m venv venv
source venv/bin/activate  # On Windows: venv\Scripts\activate

# Install dependencies
pip install spacy beautifulsoup4 requests numpy
python -m spacy download en_core_web_lg
```

## 🆄🆂🅰🅶🅴

### 1. 𝕊𝕔𝕣𝕒𝕡𝕚𝕟𝕘 ℙ𝕠𝕖𝕥𝕣𝕪 𝕀𝕟𝕘𝕣𝕖𝕕𝕚𝕖𝕟𝕥𝕤

```bash
python scraper.py --start 1 --end 100 --delay 2 --batch 20
```

Options:
- `--start START` - Starting page number
- `--end END` - Ending page number
- `--delay DELAY` - Delay between requests (seconds)
- `--batch BATCH` - Save to disk after this many pages

![image](https://github.com/user-attachments/assets/502d359c-6bd9-4eec-b5f1-8ca31ed5b07f)

> *"In the gaps between forum words, I found sentences that never existed."*

### 2. ᶜˡᵉᵃⁿⁱⁿᵍ ᵗʰᵉ ᴰᵃᵗᵃ

```bash
python clean.py -i english4.csv -o clean4.csv
```

Options:
- `-i INPUT, --input INPUT` - Input CSV file (default: english4.csv)
- `-o OUTPUT, --output OUTPUT` - Output CSV file (default: derived from input)

> *"Language is a virus 𝒇𝒓𝒐𝒎 𝒐𝒖𝒕𝒆𝒓 𝒔𝒑𝒂𝒄𝒆."*

### 3. 𝔾𝕖𝕟𝕖𝕣𝕒𝕥𝕚𝕟𝕘 ℙ𝕠𝕖𝕞𝕤

```bash
python generator.py -i clean4.csv -n 20 -l 5 -f html --feet 575 --cache vectors_cache.pkl
```

Options:
- `-i INPUT, --input INPUT` - Input CSV file with cleaned sentences
- `-n NUM_POEMS, --num-poems NUM_POEMS` - Number of poems to generate
- `-l LENGTH, --length LENGTH` - Maximum number of lines per poem
- `-m MODEL, --model MODEL` - spaCy model to use (default: en_core_web_lg)
- `-o OUTPUT_DIR, --output-dir OUTPUT_DIR` - Directory to save generated poems
- `-f {txt,html,json}, --format {txt,html,json}` - Output format
- `-s SEED, --seed SEED` - Initial seed word for poem generation
- `-p PORT, --port PORT` - Run as HTTP server on specified port
- `-b BATCH, --batch BATCH` - Generate a large batch of poems (specify count)
- `-w WORKERS, --workers WORKERS` - Number of worker processes for batch generation
- `--cache CACHE` - Cache file for word vectors and similarity
- `-r RELATED, --related RELATED` - Test related words
- `--feet FEET` - Pattern for syllable counts (e.g., "575" for haiku, "12x4" for alexandrines)
- `--test` - Run tests for word similarity

#### Example - `python generator.py -i clean.csv -b 100 -f txt --feet "575" --cache .poem_cache.bin`
```commandline
Loading spaCy model: en_core_web_lg...
Loading cache from .poem_cache.bin...
Loaded 1545 word vectors, 310284 similarity pairs, and 216 related words sets
Loading data from clean.csv...
Loaded 10268 sentences from 2166 users
Found 15 words related to 'thought': ['think', 'believed', 'probably', 'because', 'something', 'understanding', 'knowing', 'deliberately', 'remember', 'imperceptibly']
Using cached related words for 'blush'
Found 15 words related to 'trail': ['road', 'mountainside', 'roadway', 'mountain', 'route', 'canyon', 'path', 'ridge', 'mountains', 'outcropping']
Using cached related words for 'flame'
Using cached related words for 'decay'
Using cached related words for 'sky'
[...]
Using cached related words for 'brick'
Using cached related words for 'boundary'
Saved 100 poems to poems
Saving cache to .poem_cache.bin...
Saved 1545 word vectors, 322200 similarity pairs, and 225 related words sets
```

![image](https://github.com/user-attachments/assets/95a96503-2e5c-47e0-b45b-fc13549e592e)


> *"Every poem is an epitaph. ／人◕ ‿‿ ◕人＼"*

### 4. 💮 Creating Unicode Wallpaper 💮

```bash
python wallpaper.py -W 80 -H 24 -g pmm --poem poems/poem_1.txt -f html -o pattern.html
```

Options:
- `-W WIDTH, --width WIDTH` - Width of the pattern in characters
- `-H HEIGHT, --height HEIGHT` - Height of the pattern in characters
- `-s SEED, --seed SEED` - Random seed for pattern generation
- `-g {p1,pm,pmm,...}, --group {p1,pm,pmm,...}` - Specific wallpaper group to use
- `-p PORT, --port PORT` - Run as web server on specified port
- `-o OUTPUT, --output OUTPUT` - Output file path
- `-f {txt,html}, --format {txt,html}` - Output format
- `--poem POEM` - Text file containing poem to embed
- `-D DENSITY, --density DENSITY` - Character density (higher = more characters)
- `-b {white,black}, --background {white,black}` - Background color for HTML output
- `-i [INTERACTIVE], --interactive [INTERACTIVE]` - Run in interactive mode with auto-updates
- `--chaos` - Run in chaos mode with varying density and update intervals

## Examples ⌯◓▀⌂┣⎺◊

The `-D` parameter controls the density of Unicode characters in the output. Here are examples with increasing density values:

| Command                    | Results                                          |
|----------------------------| ------------------------------------------------ |
| `-D 50 -H 10 -W 40`        | ![image](https://github.com/user-attachments/assets/8b7fda22-1ec2-4a00-84ba-5b268ecf672e) |
| `-D 100 -H 12 -W 40`       | ![image](https://github.com/user-attachments/assets/0b553bc9-841e-41ca-9138-996ddd6f87b2) |
| `-D 500 -H 28 -W 80`       | ![image](https://github.com/user-attachments/assets/bf542700-bf62-404a-b4ce-25adcd46d9f4) |
| `-D 1000 -H 10 -W 40`      | ![image](https://github.com/user-attachments/assets/15452188-3f58-4df8-8064-9742013f6fa1) |

## 🅣🅞🅓🅞 ▒▓▒▓▒▓▒▓▒▓▒▓▒

- **Rework wallpaper.py**: Current implementation is far from the unicode magic of everest's original project. Needs significant upgrades to achieve bolder aesthetic impact.
- Add support for more output formats and embedding options
- Improve interactive visualization modes
- Rework web interface
- Enhance thematic poem generation
- Fine-tune feet/syllable matching logic

▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓▓


## ℓιƈєηѕє ╛╝╜┶⌧┊

This project is free software. Take it, use it, modify it, reshare it. Just add/download your own dataset!

🅛🅘🅒🅔🅝🅢🅔🅓 🅤🅝🅓🅔🅡 🅣🅗🅔 🅖🅝🅤 🅖🅟🅛-𝟹.𝟶
