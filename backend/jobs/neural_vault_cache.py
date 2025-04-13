import logging
import os
import shutil
import random
import asyncio
import httpx
import aiofiles
import aiofiles.os
from typing import List, Dict, Any, Optional, Tuple
from pathlib import Path
from dotenv import load_dotenv

logger = logging.getLogger(__name__)


dotenv_path = Path(__file__).resolve().parent.parent.parent / '.env'
load_dotenv(dotenv_path=dotenv_path)

CACHE_DIR = Path(__file__).parent / "neural_vault_files"
REPO_API_URL = os.getenv("NEURAL_VAULT_REPO_API_URL")
TARGET_FOLDERS_STR = os.getenv("NEURAL_VAULT_TARGET_FOLDERS")
REQUEST_TIMEOUT_STR = os.getenv("NEURAL_VAULT_REQUEST_TIMEOUT")

if not REPO_API_URL or not TARGET_FOLDERS_STR or not REQUEST_TIMEOUT_STR or not REQUEST_TIMEOUT_STR.isdigit():
    raise ValueError("Missing required environment") 

TARGET_FOLDERS = [
    folder.strip() for folder in TARGET_FOLDERS_STR.split(",") if folder.strip()
]
REQUEST_TIMEOUT = int(REQUEST_TIMEOUT_STR)
GITHUB_HEADERS = {"Accept": "application/vnd.github.v3+json"} 


async def _fetch_github_contents_async(
    client: httpx.AsyncClient, url: str
) -> List[Dict[str, Any]]:
    """Fetches directory contents from GitHub API asynchronously.""" 
    try:
        response = await client.get(
            url, headers=GITHUB_HEADERS, timeout=REQUEST_TIMEOUT 
        )
        response.raise_for_status()
        return response.json()
    except httpx.RequestError as e:
        logger.error(f"Error fetching GitHub contents from {url}: {e}", exc_info=True)
        return []
    except httpx.HTTPStatusError as e:
        logger.error(
            f"HTTP error fetching GitHub contents from {url}: {e.response.status_code}",
            exc_info=True,
        )
        return []


async def _fetch_and_save_file_async(
    client: httpx.AsyncClient, download_url: str, save_path: Path
):
    """Fetches file content asynchronously and saves it locally using aiofiles.""" 
    try:
        
        content_response = await client.get(download_url, timeout=REQUEST_TIMEOUT)
        content_response.raise_for_status()

        save_path.parent.mkdir(parents=True, exist_ok=True)

        async with aiofiles.open(save_path, "w", encoding="utf-8") as f:
            await f.write(content_response.text)
        return True
    except httpx.RequestError as e:
        logger.error(f"Error downloading file {download_url}: {e}", exc_info=True)
        return False
    except httpx.HTTPStatusError as e:
        logger.error(
            f"HTTP error downloading file {download_url}: {e.response.status_code}",
            exc_info=True,
        )
        return False
    except IOError as e:
        logger.error(f"Error saving file {save_path}: {e}", exc_info=True)
        return False


async def _get_files_recursive_async(
    client: httpx.AsyncClient, url: str, current_path_prefix: str = ""
) -> List[Tuple[str, str]]:
    """
    Recursively fetches markdown file download URLs and their relative paths from GitHub asynchronously.
    Returns a list of tuples: (relative_save_path, download_url).
    """
    files_to_download = []
    contents = await _fetch_github_contents_async(client, url) 

    tasks = []
    for item in contents:
        item_name = item["name"]
        relative_path = (
            f"{current_path_prefix}{item_name}" if current_path_prefix else item_name
        )

        if item["type"] == "file" and item_name.endswith(".md"):
            if item.get("download_url"):
                local_save_path = relative_path.replace("/", "_")
                files_to_download.append((local_save_path, item["download_url"]))
            else:
                logger.warning(f"No download_url found for file: {item['path']}")
        elif item["type"] == "dir":

            tasks.append(
                _get_files_recursive_async(client, item["url"], f"{relative_path}/")
            )

    if tasks:
        results = await asyncio.gather(*tasks)
        for result in results:
            files_to_download.extend(result)

    return files_to_download


async def update_cache_async():
    """
    Updates the local cache of Neural Vault files asynchronously.
    Clears the existing cache and fetches fresh files from GitHub.
    """
    logger.info("Starting Neural Vault cache update (async)...")

    async with httpx.AsyncClient() as client:
        all_files_to_download: List[Tuple[str, str]] = []
        logger.info("Fetching file lists from GitHub (async)...")

        fetch_tasks = []
        for folder in TARGET_FOLDERS:
            folder_url = f"{REPO_API_URL}{folder}"
            logger.info(f"  - Scheduling fetch from: {folder}...")
            fetch_tasks.append(
                _get_files_recursive_async(client, folder_url, f"{folder}/")
            )

        try:
            folder_results = await asyncio.gather(*fetch_tasks, return_exceptions=True)
            fetch_error = False
            for i, result in enumerate(folder_results):
                if isinstance(result, Exception):
                    logger.error(
                        f"Error during file list fetching for {TARGET_FOLDERS[i]}: {result}",
                        exc_info=result,
                    )
                    fetch_error = True
                elif result:
                    all_files_to_download.extend(result)
                else:
                    logger.warning(
                        f"Could not fetch or find files in folder: {TARGET_FOLDERS[i]}"
                    )

            if fetch_error:
                logger.error(
                    "Aborting cache update due to errors during file list fetching."
                )
                return

        except Exception as e:
            logger.error(
                f"Unexpected error during file list gathering: {e}", exc_info=True
            )
            return

        if not all_files_to_download:
            logger.info(
                "No markdown files found in target folders. Cache update not needed."
            )
            return

        logger.info(
            f"Successfully fetched list of {len(all_files_to_download)} markdown files."
        )

        logger.info("Preparing local cache directory (async)...")
        try:
            if await aiofiles.os.path.exists(CACHE_DIR):
                logger.info(f"Clearing existing cache directory: {CACHE_DIR}")

                await asyncio.to_thread(shutil.rmtree, CACHE_DIR)
            await aiofiles.os.makedirs(CACHE_DIR, exist_ok=True)
            logger.info(f"Ensured cache directory exists: {CACHE_DIR}")
        except OSError as e:
            logger.error(
                f"Error managing cache directory {CACHE_DIR}: {e}", exc_info=True
            )
            logger.error("Aborting cache update.")
            return

        logger.info("Downloading files concurrently (async)...")
        download_tasks = []
        download_tasks = []
        for relative_save_path, download_url in all_files_to_download:
            local_save_path = CACHE_DIR / relative_save_path
            download_tasks.append(
                _fetch_and_save_file_async(client, download_url, local_save_path)
            )

        results = await asyncio.gather(*download_tasks)
        saved_count = sum(1 for r in results if r is True)
        failed_count = len(results) - saved_count

        logger.info(
            f"Neural Vault cache update finished. Saved: {saved_count}, Failed: {failed_count}"
        )


async def get_random_cached_entry_async() -> Optional[Tuple[str, str]]:
    """
    Gets the filename and content of a random file from the local cache asynchronously.
    Returns (filename, content) or None if the cache is empty or inaccessible.
    """
    try:
        if not await aiofiles.os.path.exists(CACHE_DIR):
            logger.warning("Cache directory does not exist.")
            return None

        dir_entries = await asyncio.to_thread(os.scandir, CACHE_DIR)
        cached_files_paths = []
        for entry in dir_entries:
            if entry.is_file() and entry.name.endswith(".md"):
                cached_files_paths.append(Path(entry.path))

        if not cached_files_paths:
            logger.warning("No markdown files found in the cache directory.")
            return None

        random_file_path = random.choice(cached_files_paths)

        async with aiofiles.open(random_file_path, "r", encoding="utf-8") as f:
            content = await f.read()

        filename = random_file_path.name
        return filename, content
    except Exception as e:
        logger.error(f"Unexpected error retrieving cached entry: {e}", exc_info=True)
        return None
