import httpx
from typing import List, Dict

COMMON_FILES = [
    "robots.txt",
    ".env",
    "config.json",
    "backup.zip",
    "admin.php",
    "index.php",
    "favicon.ico"
]

COMMON_DIRS = [
    "admin",
    "login",
    "uploads",
    "static",
    "api",
    "assets"
]


async def _run(url: str, wordlist: List[str]) -> List[Dict]:
    results = []

    async with httpx.AsyncClient(
        follow_redirects=True,
        timeout=5
    ) as client:
        for word in wordlist:
            target = f"{url}/{word}"

            try:
                r = await client.get(target)

                results.append({
                    "path": word,
                    "url": target,
                    "status": r.status_code
                })

            except httpx.RequestError:
                results.append({
                    "path": word,
                    "url": target,
                    "status": "ERR"
                })

    return results


async def run_dir_enum(url: str, mode: str = "files") -> List[Dict]:
    """
    mode = files | dirs
    """
    url = url.rstrip("/")

    if mode == "files":
        wordlist = COMMON_FILES
    else:
        wordlist = COMMON_DIRS

    return await _run(url, wordlist)
