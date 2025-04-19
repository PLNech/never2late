#!/usr/bin/env python3
import csv
import re
import string
import argparse
import os

def clean_sentence(text):
    """Clean a sentence according to specified rules."""
    if not text or not isinstance(text, str):
        return ""
    
    # Remove HTML/XML tags
    text = re.sub(r'<.*?>', '', text)
    
    # Remove content within brackets
    text = re.sub(r'\[.*?\]', '', text)
    
    # Remove parentheses
    text = text.replace('(', '').replace(')', '')
    
    # Remove quotes
    text = text.replace('"', '').replace("'", '')
    
    # Handle slashes - take text before first slash
    if '/' in text:
        text = text.split('/')[0]
    
    # Handle backslashes similarly
    if '\\' in text:
        text = text.split('\\')[0]
    
    # Handle "vs" occurrences
    if ' vs ' in text.lower():
        text = text.split(' vs ')[0]
    
    # Handle "v " occurrences
    if ' v ' in text.lower():
        text = text.split(' v ')[0]
    
    # Normalize spaces
    text = re.sub(r'\s+', ' ', text).strip()
    
    # Skip sentences containing specific keywords related to grammar
    skip_keywords = [
        '?', 'grammar', 'pronunciation', 'punctuation', 'punctuate',
        'english', 'sentence', 'verb', 'adjective', 'noun', 'question',
        ' or ', 'gerund', 'tense', ':', ' vs ', ' v ', 'perfect'
    ]
    
    for keyword in skip_keywords:
        if keyword in text.lower():
            return ""
    
    # Skip sentences beginning with "what" or "how to"
    if text.lower().startswith('what') or text.lower().startswith('how to'):
        return ""
    
    # Skip sentences ending with "..."
    if text.lower().endswith('...'):
        return ""
    
    return text

def determine_output_filename(input_filename, output_arg):
    """Determine output filename based on input name and provided output argument."""
    # If specific output was provided, use it
    if output_arg:
        return output_arg
    
    # Check if input follows the pattern "english" + digits
    match = re.match(r'english(\d+)\.csv', os.path.basename(input_filename))
    if match:
        # Use the same number but with "clean" prefix
        return f"clean{match.group(1)}.csv"
    else:
        # Default output filename
        return "clean.csv"

def parse_args():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Clean English sentences from a CSV file.')
    parser.add_argument('-i', '--input', default='english4.csv',
                        help='Input CSV file (default: english4.csv)')
    parser.add_argument('-o', '--output', default=None,
                        help='Output CSV file (default: determined from input filename)')
    return parser.parse_args()

def main():
    # Parse command line arguments
    args = parse_args()
    
    # Determine input and output files
    input_file = args.input
    output_file = determine_output_filename(input_file, args.output)
    
    cleaned_entries = []
    
    # Process the CSV file
    try:
        with open(input_file, 'r', encoding='utf-8') as csvfile:
            reader = csv.reader(csvfile)
            header = next(reader)  # Skip header row
            
            for row in reader:
                if not row or len(row) < 2:
                    continue
                    
                # Extract the title column (sentence) and user
                sentence = row[0] if row else ""
                user = row[1] if len(row) > 1 else ""
                
                # Clean the sentence
                cleaned = clean_sentence(sentence)
                
                # If there's still content after cleaning, add it along with the user
                if cleaned:
                    cleaned_entries.append((cleaned, user))
    except FileNotFoundError:
        print(f"Error: Input file '{input_file}' not found.")
        return
    except Exception as e:
        print(f"Error processing file: {e}")
        return
    
    # Write cleaned entries to output file
    try:
        with open(output_file, 'w', encoding='utf-8') as outfile:
            # Write header
            outfile.write("title,user\n")
            
            # Write cleaned entries with their users
            for sentence, user in cleaned_entries:
                outfile.write(f"{sentence},{user}\n")
        
        print(f"Processing complete. {len(cleaned_entries)} entries saved to {output_file}")
    except Exception as e:
        print(f"Error writing to output file: {e}")

if __name__ == "__main__":
    main()
