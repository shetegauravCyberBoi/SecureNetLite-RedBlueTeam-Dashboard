import asyncio
import httpx
from typing import List, Dict

WORDLIST = ["admin", "login", "test", "api", "dev"]
VALID_STATUS = {200, 301, 302, 401, 403}


def _clean_url(url: str) -> str:
    return (
        url.replace("FUZZ.", "")
           .replace("/FUZZ", "")
           .replace("FUZZ", "")
           .rstrip("/")
    )


async def _baseline(client: httpx.AsyncClient, url: str) -> int:
    try:
        r = await client.get(_clean_url(url))
        return len(r.text)
    except Exception:
        return 0


async def _probe(client, target, word, baseline_len):
    try:
        r = await client.get(target)
        length = len(r.text)

        return {
            "payload": word,
            "url": target,
            "status": r.status_code,
            "length": length,
            "positive": (
                r.status_code in VALID_STATUS
                and length != baseline_len
            )
        }

    except httpx.RequestError as e:
        return {
            "payload": word,
            "url": target,
            "status": "ERR",
            "error": str(e),
            "positive": False
        }


# ✅ PURE ASYNC — NO LOOP MANAGEMENT
async def run_ffuf(url: str) -> List[Dict]:
    async with httpx.AsyncClient(
        follow_redirects=True,
        timeout=httpx.Timeout(5.0)
    ) as client:

        baseline_len = await _baseline(client, url)

        tasks = [
            _probe(client, url.replace("FUZZ", w), w, baseline_len)
            for w in WORDLIST
        ]

        return await asyncio.gather(*tasks)
