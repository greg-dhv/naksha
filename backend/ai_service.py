import anthropic
import os
from datetime import date
from typing import Optional

client = anthropic.Anthropic(api_key=os.environ.get("ANTHROPIC_API_KEY"))

MODEL = "claude-sonnet-4-6"
TEMPERATURE = 0.7


def _call(system: str, user: str) -> str:
    message = client.messages.create(
        model=MODEL,
        max_tokens=1024,
        temperature=TEMPERATURE,
        system=system,
        messages=[{"role": "user", "content": user}],
    )
    return message.content[0].text


def nakshatra_archetype_reading(
    name: str,
    moon_nakshatra: str,
    moon_pada: int,
    moon_sign: str,
    moon_house: int,
    lagna_sign: str,
) -> str:
    system = """You are the voice of Naksha, a Vedic astrology guide. You speak directly, warmly, and with precision. You interpret specific chart data — never speak in generalities. You write in flowing prose paragraphs, never bullet points. You speak in second person ("you", "your"). You explain Vedic concepts in plain English first, naming the Sanskrit term only after. You empower the reader's agency — this is a map of their nature, not their fate."""

    user = f"""Write a nakshatra archetype reading for {name}.

Chart data:
- Moon in {moon_sign} (house {moon_house}), birth star: {moon_nakshatra}, pada {moon_pada}
- Rising sign (lagna): {lagna_sign}

Write approximately 150 words. Focus on the core emotional archetype and soul essence of the {moon_nakshatra} nakshatra — what it means to be this kind of person at the deepest level. Reference their pada and sign placement where meaningful. Make it feel like a mirror that knows them. End on an empowering note."""

    return _call(system, user)


def life_season_reading(
    name: str,
    lagna_sign: str,
    moon_nakshatra: str,
    moon_sign: str,
    maha_planet: str,
    maha_start: str,
    maha_end: str,
    maha_years: float,
    antar_planet: Optional[str],
    antar_end: Optional[str],
) -> str:
    system = """You are the voice of Naksha, a Vedic astrology guide. You speak directly, warmly, and with precision. You interpret specific chart data — never speak in generalities. You write in flowing prose paragraphs, never bullet points. You speak in second person ("you", "your"). You never predict specific events — you illuminate patterns, energies, and invitations. You say "this period invites" not "this period will". You are honest about challenges without catastrophizing."""

    antar_context = ""
    if antar_planet and antar_end:
        antar_context = f"\n- Current sub-period (antardasha): {antar_planet}, active until {antar_end}"

    user = f"""Write a current life season reading for {name}.

Chart data:
- Rising sign: {lagna_sign}
- Moon in {moon_sign}, birth star: {moon_nakshatra}

Current dasha period:
- Major period (mahadasha): {maha_planet} — began {maha_start}, ends {maha_end} ({maha_years:.1f} years total){antar_context}

Write approximately 200 words. Describe the texture, themes, gifts, and challenges of this {maha_planet} mahadasha. If there is an active antardasha, weave it in as the specific current within the larger tide. Connect to their lagna and Moon nakshatra to make it personal. This is the era they are living through."""

    return _call(system, user)
