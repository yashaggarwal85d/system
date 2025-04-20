import re
import requests
import logging
import urllib.parse
from fastapi import HTTPException, status

from utils.general.get_env import getenv

logger = logging.getLogger(__name__)

GITHUB_ACCESS_TOKEN = getenv("GITHUB_ACCESS_TOKEN")
IGNORED_FOLDERS = getenv("GITHUB_IGNORED_FOLDERS", "").split(",")


def extract_owner_repo(github_url: str):
    match = re.search(r"github\.com/([^/]+)/([^/.]+)", github_url)
    if not match:
        raise ValueError("Invalid GitHub repo URL provided in player profile.")
    return match.group(1), match.group(2)


def fetch_github_repo_tree(owner: str, repo: str) -> list:
    api_url = f"https://api.github.com/repos/{owner}/{repo}/git/trees/HEAD?recursive=1"
    headers = {
        "Authorization": f"Bearer {GITHUB_ACCESS_TOKEN}",
        "User-Agent": "fastapi-github-file-picker",
        "Accept": "application/vnd.github.v3+json",
    }
    try:
        response = requests.get(api_url, headers=headers)
        response.raise_for_status()
        tree_data = response.json()
        if "tree" not in tree_data:
            logger.error(
                f"Unexpected response structure from GitHub API for {owner}/{repo}: {tree_data}"
            )
            raise HTTPException(
                status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
                detail="Failed to parse repository file tree from GitHub.",
            )
        return tree_data.get("tree", [])
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching GitHub repo tree for {owner}/{repo}: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Could not connect to GitHub API: {e}",
        )
    except Exception as e:
        logger.error(
            f"Unexpected error fetching GitHub repo tree for {owner}/{repo}: {e}",
            exc_info=True,
        )
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="An unexpected error occurred while fetching repository data.",
        )


def fetch_file_content(owner: str, repo: str, file_path: str) -> str:
    encoded_path_parts = [urllib.parse.quote(part) for part in file_path.split("/")]
    encoded_file_path = "/".join(encoded_path_parts)

    raw_url = (
        f"https://raw.githubusercontent.com/{owner}/{repo}/HEAD/{encoded_file_path}"
    )
    try:
        content_response = requests.get(raw_url)
        content_response.raise_for_status()
        return content_response.text
    except requests.exceptions.RequestException as e:
        logger.error(f"Error fetching file content from {raw_url}: {e}")
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail=f"Failed to fetch file content from GitHub: {e}",
        )


def process_note_content(content: str, tree: list, owner: str, repo: str) -> str:

    def replace_asset_link(match):
        asset_reference = match.group(1).strip()
        found_path = None

        for item in tree:
            if item.get("path") == asset_reference and item.get("type") == "blob":
                found_path = item["path"]
                break

        if not found_path:
            for item in tree:

                if (
                    item.get("path", "").endswith(f"/{asset_reference}")
                    or item.get("path") == asset_reference
                ):
                    if item.get("type") == "blob":
                        found_path = item["path"]
                        break

        if found_path:
            try:
                encoded_path_parts = [
                    urllib.parse.quote(part) for part in found_path.split("/")
                ]
                encoded_path = "/".join(encoded_path_parts)
                raw_url = f"https://raw.githubusercontent.com/{owner}/{repo}/HEAD/{encoded_path}"
                return f"![]({raw_url})"
            except Exception as e:
                logger.warning(
                    f"Error processing asset link for '{asset_reference}' (found path: {found_path}): {e}"
                )
                return match.group(0)
        else:
            logger.warning(
                f"Asset '{asset_reference}' referenced in note not found in repository tree for {owner}/{repo}."
            )
            return match.group(0)

    processed_content = re.sub(r"!\[\[([^\]]+)\]\]", replace_asset_link, content)
    return processed_content


def get_markdown_files(tree: list) -> list[str]:
    valid_ignored_folders = [f.strip() for f in IGNORED_FOLDERS if f and f.strip()]
    md_files = [
        item["path"]
        for item in tree
        if item.get("type") == "blob"
        and item.get("path", "").endswith(".md")
        and not any(
            item.get("path", "").startswith(f"{ignore}/")
            for ignore in valid_ignored_folders
            if ignore
        )
    ]
    return md_files
