import os
import shutil
import random
import requests
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from dotenv import load_dotenv

# Load environment variables from .env file located in the same directory as main.py usually
# Assuming .env is in the parent directory relative to this file (backend/.env)
dotenv_path = Path(__file__).resolve().parent / '.env'
load_dotenv(dotenv_path=dotenv_path)

# --- Configuration ---
CACHE_DIR = Path(__file__).parent / "neural_vault_files"

# Load from environment variables with defaults
REPO_API_URL = os.getenv(
    "NEURAL_VAULT_REPO_API_URL",
    "https://api.github.com/repos/yashaggarwal85d/Neural-Vault/contents/"
)
TARGET_FOLDERS_STR = os.getenv("NEURAL_VAULT_TARGET_FOLDERS", "Books,Internet,Misc")
# Parse comma-separated string into a list, stripping whitespace
TARGET_FOLDERS = [folder.strip() for folder in TARGET_FOLDERS_STR.split(',') if folder.strip()]

REQUEST_TIMEOUT = int(os.getenv("NEURAL_VAULT_REQUEST_TIMEOUT", 15))

GITHUB_HEADERS = {"Accept": "application/vnd.github.v3+json"}
# Optional: Add GitHub Token if needed for private repos or rate limiting
# GITHUB_TOKEN = os.getenv("GITHUB_TOKEN")
# if GITHUB_TOKEN:
#     GITHUB_HEADERS["Authorization"] = f"token {GITHUB_TOKEN}"


# --- Helper Functions ---

def _fetch_github_contents(url: str) -> List[Dict[str, Any]]:
    """Fetches directory contents from GitHub API."""
    try:
        response = requests.get(url, headers=GITHUB_HEADERS, timeout=REQUEST_TIMEOUT)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.RequestException as e:
        print(f"Error fetching GitHub contents from {url}: {e}")
        return [] # Return empty list on error

def _fetch_and_save_file(download_url: str, save_path: Path):
    """Fetches file content and saves it locally."""
    try:
        content_response = requests.get(download_url, timeout=REQUEST_TIMEOUT)
        content_response.raise_for_status()
        # Ensure parent directory exists
        save_path.parent.mkdir(parents=True, exist_ok=True)
        with open(save_path, 'w', encoding='utf-8') as f:
            f.write(content_response.text)
        # print(f"Saved: {save_path}") # Optional: verbose logging
        return True
    except requests.exceptions.RequestException as e:
        print(f"Error downloading file {download_url}: {e}")
        return False
    except IOError as e:
        print(f"Error saving file {save_path}: {e}")
        return False

def _get_files_recursive(url: str, current_path_prefix: str = "") -> List[Tuple[str, str]]:
    """
    Recursively fetches markdown file download URLs and their relative paths from GitHub.
    Returns a list of tuples: (relative_save_path, download_url).
    """
    files_to_download = []
    contents = _fetch_github_contents(url)

    for item in contents:
        item_name = item['name']
        relative_path = f"{current_path_prefix}{item_name}" if current_path_prefix else item_name

        if item['type'] == 'file' and item_name.endswith('.md'):
            if item.get('download_url'):
                 # Replace path separators for local saving if needed, ensure uniqueness
                local_save_path = relative_path.replace("/", "_") # Simple replacement
                files_to_download.append((local_save_path, item['download_url']))
            else:
                print(f"Warning: No download_url found for file: {item['path']}")
        elif item['type'] == 'dir':
            files_to_download.extend(_get_files_recursive(item['url'], f"{relative_path}/")) # Pass API URL for subdir

    return files_to_download

# --- Public Caching Functions ---

def update_cache():
    """
    Updates the local cache of Neural Vault files.
    Clears the existing cache and fetches fresh files from GitHub.
    """
    print("Starting Neural Vault cache update...")
    # Ensure cache directory exists, clear if it does
    if CACHE_DIR.exists():
        print(f"Clearing existing cache directory: {CACHE_DIR}")
        shutil.rmtree(CACHE_DIR)
    CACHE_DIR.mkdir(parents=True, exist_ok=True)
    print(f"Created cache directory: {CACHE_DIR}")

    all_files_to_download: List[Tuple[str, str]] = []
    for folder in TARGET_FOLDERS:
        folder_url = f"{REPO_API_URL}{folder}"
        print(f"Fetching file list from: {folder}...")
        all_files_to_download.extend(_get_files_recursive(folder_url, f"{folder}/"))

    if not all_files_to_download:
        print("Warning: No markdown files found to download.")
        return

    print(f"Found {len(all_files_to_download)} markdown files to download.")
    saved_count = 0
    failed_count = 0

    for relative_save_path, download_url in all_files_to_download:
        local_save_path = CACHE_DIR / relative_save_path
        if _fetch_and_save_file(download_url, local_save_path):
            saved_count += 1
        else:
            failed_count += 1

    print(f"Neural Vault cache update finished. Saved: {saved_count}, Failed: {failed_count}")


def get_random_cached_entry() -> Optional[Tuple[str, str]]:
    """
    Gets the filename and content of a random file from the local cache.
    Returns (filename, content) or None if the cache is empty or inaccessible.
    """
    if not CACHE_DIR.exists() or not any(CACHE_DIR.iterdir()):
        print("Cache directory does not exist or is empty.")
        # Optionally trigger an immediate cache update here?
        # update_cache()
        return None

    try:
        cached_files = [f for f in CACHE_DIR.iterdir() if f.is_file() and f.name.endswith('.md')]
        if not cached_files:
            print("No markdown files found in the cache directory.")
            return None

        random_file_path = random.choice(cached_files)

        with open(random_file_path, 'r', encoding='utf-8') as f:
            content = f.read()

        # Return the original-like filename (e.g., remove folder prefix if desired)
        # For now, return the name as saved in cache (e.g., Books_Subfolder_File.md)
        filename = random_file_path.name
        return filename, content

    except FileNotFoundError:
        print(f"Error: Selected cache file not found (should not happen if listing worked).")
        return None
    except IOError as e:
        print(f"Error reading cache file {random_file_path.name}: {e}")
        return None
    except Exception as e:
        print(f"Unexpected error retrieving cached entry: {e}")
        return None

# --- Main block for testing ---
if __name__ == "__main__":
    print("Running cache update manually...")
    update_cache()
    print("\nAttempting to get a random entry:")
    entry = get_random_cached_entry()
    if entry:
        filename, content = entry
        print(f"\nGot entry: {filename}")
        print("-" * 20)
        print(content[:300] + "...") # Print snippet
        print("-" * 20)
    else:
        print("Could not retrieve an entry.")
