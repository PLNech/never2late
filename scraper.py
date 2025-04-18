#!/usr/bin/env python3
"""
Minimal fix for the WordReference forum scraper with proper data saving.
"""

import requests
import csv
from bs4 import BeautifulSoup
import os
import time
import signal
import sys
import logging
import argparse

# Set up basic logging
logging.basicConfig(
    level=logging.INFO,
    format='%(asctime)s - %(levelname)s - %(message)s'
)
logger = logging.getLogger(__name__)

# Global variables for tracking
current_page = None
saved_up_to = None
rows_to_save = []

def signal_handler(sig, frame):
    """Handle keyboard interrupts by saving data first."""
    global rows_to_save, saved_up_to, current_page
    
    # Save any pending data before exiting
    if rows_to_save:
        with open('english4.csv', 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(rows_to_save)
        logger.info(f"Emergency saved {len(rows_to_save)} rows before exit")
        saved_up_to = current_page
    
    logger.info(f"\nInterrupted at page {current_page}. Progress saved up to page {saved_up_to}.")
    logger.info(f"To resume, restart with: --start {current_page}")
    sys.exit(0)

def parse_arguments():
    """Parse command line arguments."""
    parser = argparse.ArgumentParser(description='Scrape forum content')
    parser.add_argument('--start', type=int, default=7881, help='Starting page number')
    parser.add_argument('--end', type=int, default=9613, help='Ending page number')
    parser.add_argument('--delay', type=float, default=0.5, help='Delay between requests')
    parser.add_argument('--batch', type=int, default=10, help='Save to disk after this many pages')
    return parser.parse_args()

def main():
    global current_page, saved_up_to, rows_to_save
    
    # Set up signal handler for Ctrl+C
    signal.signal(signal.SIGINT, signal_handler)
    
    args = parse_arguments()
    
    # Initialize CSV if it doesn't exist
    if not os.path.exists('english4.csv') or os.path.getsize('english4.csv') == 0:
        with open('english4.csv', 'w', newline='') as f:
            writer = csv.writer(f)
            writer.writerow(['title', 'user'])
            logger.info("Created new CSV file with headers")
    
    # Process pages
    processed_pages = 0
    total_rows = 0
    
    # Main loop
    for page_num in range(args.start, args.end + 1):
        current_page = page_num
        page_url = f"https://forum.wordreference.com/forums/english-only.6/page-{page_num}"
        logger.info(f"Processing {page_url}")
        
        try:
            # Send request
            headers = {
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
            response = requests.get(page_url, headers=headers, timeout=10)
            
            if response.status_code == 200:
                soup = BeautifulSoup(response.text, 'html.parser')
                
                # First try the modern structure
                thread_items = soup.select('div.structItem--thread')
                
                if not thread_items:
                    # Fall back to any element with preview-tooltip
                    thread_items = soup.find_all("a", attrs={"data-xf-init": "preview-tooltip"})
                
                for item in thread_items:
                    # For modern structure
                    if item.name == 'div':
                        title_elem = item.select_one('div.structItem-title a')
                        user_elem = item.select_one('a.username')
                        
                        if title_elem and user_elem:
                            title_text = title_elem.text.strip()
                            user_text = user_elem.text.strip()
                            
                            if title_text:
                                rows_to_save.append([title_text, user_text])
                                total_rows += 1
                    # For fallback structure
                    else:
                        title_text = item.text.strip()
                        next_tag = item.find_next('a')
                        user_text = next_tag.text.strip() if next_tag else ""
                        
                        if title_text:
                            rows_to_save.append([title_text, user_text])
                            total_rows += 1
                
                processed_pages += 1
                
                # Save after processing batch of pages
                if processed_pages % args.batch == 0:
                    with open('english4.csv', 'a', newline='') as f:
                        writer = csv.writer(f)
                        writer.writerows(rows_to_save)
                    
                    logger.info(f"Saved {len(rows_to_save)} rows to english4.csv")
                    saved_up_to = page_num
                    rows_to_save = []
            else:
                logger.warning(f"Failed to get page, status code: {response.status_code}")
                
        except Exception as e:
            logger.error(f"Error processing {page_url}: {e}")
        
        # Be nice to the server
        time.sleep(args.delay)
    
    # Save any remaining rows
    if rows_to_save:
        with open('english4.csv', 'a', newline='') as f:
            writer = csv.writer(f)
            writer.writerows(rows_to_save)
        
        logger.info(f"Saved final {len(rows_to_save)} rows to english4.csv")
    
    logger.info(f"Scraping complete. Processed {processed_pages} pages, collected {total_rows} rows.")

if __name__ == "__main__":
    main()
