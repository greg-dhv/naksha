import httpx
from typing import Optional


NOMINATIM_URL = "https://nominatim.openstreetmap.org/search"
HEADERS = {"User-Agent": "Naksha/1.0 (vedic astrology app; contact@naksha.app)"}


async def geocode(query: str, limit: int = 5) -> list[dict]:
    params = {
        "q": query,
        "format": "json",
        "addressdetails": 1,
        "limit": limit,
    }
    async with httpx.AsyncClient(timeout=10.0) as client:
        response = await client.get(NOMINATIM_URL, params=params, headers=HEADERS)
        response.raise_for_status()
        results = response.json()

    output = []
    for r in results:
        display = r.get("display_name", "")
        # Shorten display name: city, country only
        parts = display.split(",")
        short = ", ".join([p.strip() for p in parts[:2]])
        output.append({
            "display_name": display,
            "short_name": short,
            "lat": float(r["lat"]),
            "lon": float(r["lon"]),
        })
    return output
