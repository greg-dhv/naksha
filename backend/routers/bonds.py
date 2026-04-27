from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from database import db
from routers.auth import get_current_user
from anthropic import Anthropic
import os
import json
import re

router = APIRouter(prefix="/bonds", tags=["bonds"])
client = Anthropic(api_key=os.getenv("ANTHROPIC_API_KEY"))


def _slim_chart(chart_data: dict) -> dict:
    """Strip fields that are expensive but useless for compatibility analysis."""
    if not chart_data:
        return {}
    slim = {
        "lagna": chart_data.get("lagna"),
        "planets": chart_data.get("planets"),
        "navamsa": chart_data.get("navamsa"),
        "yogas": chart_data.get("yogas"),
    }
    # Include only current dasha periods, not the full lifetime timeline
    dasha = chart_data.get("dasha") or {}
    slim["dasha"] = {
        "current_mahadasha": {k: v for k, v in (dasha.get("current_mahadasha") or {}).items() if k != "antardashas"},
        "current_antardasha": {k: v for k, v in (dasha.get("current_antardasha") or {}).items() if k != "pratyantardashas"},
        "current_pratyantardasha": dasha.get("current_pratyantardasha"),
    }
    return slim


def _build_compatibility_prompt(user1: dict, user2: dict, relationship_type: str) -> str:
    name1 = (user1.get("birth_data") or {}).get("name", f"@{user1['username']}")
    name2 = (user2.get("birth_data") or {}).get("name", f"@{user2['username']}")
    rel = "friendship" if relationship_type == "friendship" else "romantic partnership"

    if relationship_type == "friendship":
        cat1, cat1_hint = "Communication style", "Mercury placements, 3rd house"
        cat2, cat2_hint = "Shared values & interests", "Sun and Jupiter connections"
        cat3, cat3_hint = "How you energize each other", "Mars and Jupiter aspects"
        cat4, cat4_hint = "Friction", "Mars clashes, tense squares — honest but not discouraging"
        cat5, cat5_hint = "Growth you offer each other", "nodal overlaps, Saturn contacts"
    else:
        cat1, cat1_hint = "Emotional connection", "Moon-to-Moon, Venus aspects"
        cat2, cat2_hint = "Communication", "Mercury connections, 3rd house"
        cat3, cat3_hint = "Physical & romantic chemistry", "Venus-Mars aspects"
        cat4, cat4_hint = "Conflict patterns", "Mars clashes, tense aspects — honest but not discouraging"
        cat5, cat5_hint = "Long-term potential", "Saturn, 7th house, nodal overlaps"

    return f"""You are a master Vedic astrologer generating a compatibility reading between {name1} and {name2} for a {rel}.

{name1}'s chart (@{user1['username']}):
{json.dumps(_slim_chart(user1.get("chart_data")), indent=2)}

{name2}'s chart (@{user2['username']}):
{json.dumps(_slim_chart(user2.get("chart_data")), indent=2)}

Return ONLY valid JSON (no markdown fences, no text outside the JSON object) with this exact structure:

{{
  "archetype_name": "2-4 word poetic name for this specific bond (e.g. 'The Mirror Bond', 'Grounded Flame', 'Quiet Orbit')",
  "archetype_tagline": "One evocative sentence capturing the core felt quality of this pairing",
  "score": 75,
  "core_dynamic": "2-3 sentence paragraph capturing how these two energies meet — the vibe. Warm, direct, poetic. Use {name1} and {name2} by name.",
  "categories": [
    {{"label": "{cat1}", "score": 80, "person1_context": "short phrase for {name1}: their key dasha or placement + 2-3 word quality (e.g. 'Moon Mahadasha · emotional openness')", "person2_context": "short phrase for {name2}: their key dasha or placement + 2-3 word quality", "chips": ["2-4 specific planets/nakshatras/dashas from either chart most relevant to this dimension, e.g. 'Moon · Scorpio H8' or 'Venus Mahadasha' or 'Rohini nakshatra'"], "narrative": "1-2 sentences grounded in their specific planets — {cat1_hint}. Describe the dynamic between them, not just each person individually."}},
    {{"label": "{cat2}", "score": 70, "person1_context": "short phrase for {name1}", "person2_context": "short phrase for {name2}", "chips": ["2-4 relevant placements"], "narrative": "1-2 sentences — {cat2_hint}. Describe the dynamic."}},
    {{"label": "{cat3}", "score": 75, "person1_context": "short phrase for {name1}", "person2_context": "short phrase for {name2}", "chips": ["2-4 relevant placements"], "narrative": "1-2 sentences — {cat3_hint}. Describe the dynamic."}},
    {{"label": "{cat4}", "score": 55, "person1_context": "short phrase for {name1}", "person2_context": "short phrase for {name2}", "chips": ["2-4 relevant placements"], "narrative": "1-2 sentences — {cat4_hint}. Describe the dynamic."}},
    {{"label": "{cat5}", "score": 80, "person1_context": "short phrase for {name1}", "person2_context": "short phrase for {name2}", "chips": ["2-4 relevant placements"], "narrative": "1-2 sentences — {cat5_hint}. Describe the dynamic."}}
  ],
  "flow_pairs": [
    {{"gift": "One specific strength or natural gift in this connection — grounded in a real planetary dynamic, 8-15 words", "practice": "An imperative, concrete action they can take to use this gift well — starts with a verb, different angle from the gift, does NOT repeat the central noun or verb used in 'gift', 8-15 words"}},
    {{"gift": "...", "practice": "..."}},
    {{"gift": "...", "practice": "..."}},
    {{"gift": "...", "practice": "..."}}
  ],
  "closing_question": "One open-ended question tailored to this specific pairing — a conversation-starter, not a test"
}}

Rules:
- Replace example numbers with real assessed scores (average pairing = 60-70, strong = 75-85, rare = 88+)
- Reference specific planetary positions from both charts — never generic statements
- Exactly 3-4 flow_pairs; each "practice" must be the direct action that deploys or honours the paired "gift" — not a separate topic
- The "practice" half MUST NOT repeat the central noun or verb from the "gift" half — find a different angle, different vocabulary
- Each half must be readable independently; the connection between them should be conceptual, not lexical
- "practice" must use imperative mood and start with an action verb (e.g. "Name it early", "Let silences breathe", "Build rituals around")
- Warm, precise, slightly poetic tone throughout
- Never predict events — illuminate patterns and energies
- Never use em-dashes (—), double hyphens (--), or standalone hyphens (-) as visual separators or list markers — write in natural prose only"""


class CompatibilityRequest(BaseModel):
    target_username: str
    relationship_type: str  # "friendship" | "relationship"


@router.post("/compatibility")
def compatibility(body: CompatibilityRequest, current_user: dict = Depends(get_current_user)):
    if not current_user.get("chart_data"):
        raise HTTPException(status_code=400, detail="You need a chart to generate compatibility.")
    if body.relationship_type not in ("friendship", "relationship"):
        raise HTTPException(status_code=400, detail="relationship_type must be 'friendship' or 'relationship'")

    target_username = body.target_username.lstrip("@").lower()
    result = db.table("users").select("*").eq("username", target_username).execute()
    if not result.data:
        raise HTTPException(status_code=404, detail="User not found")

    target = result.data[0]
    if not target.get("chart_data"):
        raise HTTPException(status_code=400, detail=f"@{target['username']} hasn't generated their chart yet.")
    if target["id"] == current_user["id"]:
        raise HTTPException(status_code=400, detail="Cannot generate compatibility with yourself.")

    prompt = _build_compatibility_prompt(current_user, target, body.relationship_type)
    response = client.messages.create(
        model="claude-sonnet-4-6",
        max_tokens=3000,
        temperature=0.7,
        messages=[{"role": "user", "content": prompt}],
    )

    raw = response.content[0].text.strip()
    # Strip markdown fences if the model wraps output despite instructions
    raw = re.sub(r'^```[a-z]*\n?', '', raw)
    raw = re.sub(r'\n?```$', '', raw.strip())

    try:
        structured = json.loads(raw)
    except json.JSONDecodeError:
        raise HTTPException(status_code=500, detail="AI returned malformed data. Please try again.")

    bond = db.table("bonds").insert({
        "user_id_1": current_user["id"],
        "user_id_2": target["id"],
        "relationship_type": body.relationship_type,
        "report": json.dumps(structured),
    }).execute().data[0]

    name1 = (current_user.get("birth_data") or {}).get("name", current_user["username"])
    name2 = (target.get("birth_data") or {}).get("name", target["username"])

    return {
        "id": bond["id"],
        "report": structured,
        "relationship_type": body.relationship_type,
        "person1": {"username": current_user["username"], "name": name1},
        "person2": {"username": target["username"], "name": name2},
    }


@router.get("/history")
def bond_history(current_user: dict = Depends(get_current_user)):
    result = db.table("bonds").select("id, relationship_type, report, user_id_1, user_id_2").or_(
        f"user_id_1.eq.{current_user['id']},user_id_2.eq.{current_user['id']}"
    ).order("created_at", desc=True).execute()

    bonds = result.data
    if not bonds:
        return []

    user_ids = list({b["user_id_1"] for b in bonds} | {b["user_id_2"] for b in bonds})
    users_result = db.table("users").select("id, username, birth_data").in_("id", user_ids).execute()
    users_map = {u["id"]: u for u in users_result.data}

    items = []
    for bond in bonds:
        u1 = users_map.get(bond["user_id_1"], {})
        u2 = users_map.get(bond["user_id_2"], {})
        name1 = (u1.get("birth_data") or {}).get("name", u1.get("username", ""))
        name2 = (u2.get("birth_data") or {}).get("name", u2.get("username", ""))
        report = json.loads(bond["report"]) if isinstance(bond["report"], str) else bond["report"]
        items.append({
            "id": bond["id"],
            "relationship_type": bond["relationship_type"],
            "report": report,
            "person1": {"username": u1.get("username", ""), "name": name1},
            "person2": {"username": u2.get("username", ""), "name": name2},
        })
    return items
