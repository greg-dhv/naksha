from fastapi import APIRouter, Depends
from database import db
from routers.auth import get_current_user
from anthropic import Anthropic
import os
import json
from datetime import date, timedelta

router = APIRouter(prefix="/home", tags=["home"])
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def _last_monday() -> date:
    today = date.today()
    return today - timedelta(days=today.weekday())


def _generate_weekly_briefing(user: dict, week_start: date) -> dict:
    birth = user.get("birth_data") or {}
    chart = user.get("chart_data") or {}
    name = birth.get("name", "this person")
    dasha = chart.get("dasha") or {}
    maha = dasha.get("current_mahadasha") or {}
    antar = dasha.get("current_antardasha") or {}
    pratyantar = dasha.get("current_pratyantardasha") or {}

    prompt = f"""Write a personal weekly briefing for the week of {week_start.strftime("%B %d, %Y")}.

Their natal chart:
{json.dumps(chart.get("chart"), indent=2)}

Their active dasha periods right now:
Major period (Mahadasha): {maha.get("planet", "unknown")} from {maha.get("start_date", "")} to {maha.get("end_date", "")}
Sub-period (Antardasha): {antar.get("planet", "unknown")} from {antar.get("start_date", "")} to {antar.get("end_date", "")}
Current influence (Pratyantardasha): {pratyantar.get("planet", "unknown")} from {pratyantar.get("start_date", "")} to {pratyantar.get("end_date", "")}

Respond ONLY with valid JSON (no markdown, no code fences), using this exact structure:
{{
  "pull_quote": "One sentence capturing the essential truth of this week. Specific to their chart. Poetic and memorable. Something they'd want to carry all week.",
  "sections": [
    {{
      "label": "2 to 3 word section title. Choose something evocative and specific to this week, not generic. E.g. 'The pull inward', 'Where power sits', 'What wants to move'.",
      "body": "The dominant energy of this week and WHY it is present. Explain the underlying astrological logic in plain language FIRST, then name the planet or concept. 2 to 3 short sentences."
    }},
    {{
      "label": "2 to 3 word section title for the practical dimension of this week.",
      "body": "One concrete area of life to direct attention toward and one tangible suggestion. Explain the reasoning before the advice. 2 to 3 short sentences."
    }},
    {{
      "label": "2 to 3 word section title for the inner or relational dimension of this week.",
      "body": "The subtler, inner or relational quality of this week. What is being asked at a deeper level. 2 short sentences."
    }}
  ],
  "carry_label": "Choose exactly ONE of: 'A question to sit with' or 'This week's word' or 'A practice' or 'Watch for this'",
  "carry_text": "One specific thing to carry through the week. A question, a theme word, a brief practice, or a single astrological event to notice. One sentence only. No explanation — just the question or thing itself.",
  "cycle_insight": "1 to 2 sentences on why this specific combination of planetary periods creates the quality of this week. Use plain language first, then name the planets."
}}

Strict rules:
- NEVER use the person's name. Always say 'you' and 'your'.
- NEVER use dashes (no em dashes, no hyphens used as punctuation).
- Always explain WHY before naming a planet or concept. Earn the jargon.
- Write for someone intelligent but new to astrology. No oversimplification, no jargon dumps.
- Speak directly as 'you'. Warm, precise, slightly poetic.
- Each section body is short prose. No bullet points.
- Never predict specific events. Illuminate patterns and energies instead."""

    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=900,
        temperature=0.7,
        messages=[{"role": "user", "content": prompt}],
    )
    text = response.content[0].text.strip()

    # Strip markdown code fences if Claude wrapped the JSON
    if text.startswith("```"):
        lines = text.split("\n")
        text = "\n".join(lines[1:])  # drop the opening ```json line
    if text.endswith("```"):
        text = text[:text.rfind("```")].strip()

    try:
        parsed = json.loads(text)
        if isinstance(parsed, dict):
            return parsed
    except (json.JSONDecodeError, ValueError):
        pass

    # Fallback: treat whole response as plain briefing
    return {
        "pull_quote": None,
        "paragraph1": text,
        "paragraph2": None,
        "carry_label": None,
        "carry_text": None,
        "cycle_insight": None,
    }


def _parse_briefing(stored: str) -> dict:
    """Parse a stored briefing — either new structured JSON or legacy plain text."""
    try:
        parsed = json.loads(stored)
        if isinstance(parsed, dict):
            return parsed
    except (json.JSONDecodeError, ValueError):
        pass
    # Legacy plain text
    return {
        "pull_quote": None,
        "paragraph1": stored,
        "paragraph2": None,
        "carry_label": None,
        "carry_text": None,
        "cycle_insight": None,
    }


@router.get("")
def get_home(current_user: dict = Depends(get_current_user)):
    chart_data = current_user.get("chart_data") or {}
    dasha = chart_data.get("dasha") or {}

    briefing_data = None
    briefing_week = None

    if chart_data:
        last_monday = _last_monday()
        stored_week = current_user.get("weekly_briefing_week")
        stored_briefing = current_user.get("weekly_briefing")

        needs_refresh = (
            not stored_briefing
            or not stored_week
            or str(stored_week) < str(last_monday)
        )

        if needs_refresh:
            briefing_data = _generate_weekly_briefing(current_user, last_monday)
            db.table("users").update({
                "weekly_briefing": json.dumps(briefing_data),
                "weekly_briefing_week": str(last_monday),
            }).eq("id", current_user["id"]).execute()
        else:
            briefing_data = _parse_briefing(stored_briefing)

        briefing_week = str(last_monday)

    birth_data = current_user.get("birth_data") or {}

    # Build sections list; fall back to paragraph1/paragraph2 for legacy stored briefings
    weekly_sections = None
    weekly_briefing = None
    if briefing_data:
        sections = briefing_data.get("sections")
        if sections and isinstance(sections, list):
            weekly_sections = sections
            weekly_briefing = "\n\n".join(s.get("body", "") for s in sections if s.get("body"))
        else:
            # Legacy format
            parts = [briefing_data.get("paragraph1"), briefing_data.get("paragraph2")]
            bodies = [p for p in parts if p]
            weekly_briefing = "\n\n".join(bodies)
            weekly_sections = [{"label": None, "body": b} for b in bodies]

    return {
        "weekly_briefing": weekly_briefing,
        "weekly_sections": weekly_sections,
        "weekly_pull_quote": briefing_data.get("pull_quote") if briefing_data else None,
        "weekly_carry_label": briefing_data.get("carry_label") if briefing_data else None,
        "weekly_carry_text": briefing_data.get("carry_text") if briefing_data else None,
        "weekly_cycle_insight": briefing_data.get("cycle_insight") if briefing_data else None,
        "weekly_briefing_week": briefing_week,
        "birth_name": birth_data.get("name", ""),
        "life_cycle": {
            "mahadasha": dasha.get("current_mahadasha"),
            "antardasha": dasha.get("current_antardasha"),
            "pratyantardasha": dasha.get("current_pratyantardasha"),
        },
    }
