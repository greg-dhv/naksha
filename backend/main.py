from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import date
from concurrent.futures import ThreadPoolExecutor
import os
from dotenv import load_dotenv

from models import (
    ChartRequest, GeocodeRequest, ChartResponse,
    ChartData, LagnaInfo, PlanetInfo, DivisionalPlacement, ChartMetadata,
    Panchanga, DetectedYoga,
    DashaData, MahadashaPeriod, AntarPeriodFull, PratyantarPeriod,
    Readings, ChartMeta, ThreePillars, KarmicAxis,
    StandoutItem, CoreReading, NaturalPowers, Archetype,
    GrowthPath, SoulTheme, SoulHistory, LoveReading,
)
from calculations import calculate_chart, calculate_dasha, NAKSHATRA_LORDS
from geocoding import geocode
from ai_service import (
    nakshatra_archetype_reading,
    life_season_reading,
    essence_reading,
    three_pillars_reading,
    karmic_axis_reading,
    all_planet_readings,
    core_reading,
    natural_powers_reading,
    growth_path_reading,
    soul_history_reading,
    love_reading,
)

from routers import auth as auth_router, users as users_router, chat as chat_router, bonds as bonds_router, home as home_router

load_dotenv()

app = FastAPI(title="Naksha API")

FRONTEND_URL = os.environ.get("FRONTEND_URL", "http://localhost:3000")

app.add_middleware(
    CORSMiddleware,
    allow_origins=[FRONTEND_URL, "http://localhost:3000"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth_router.router, prefix="/api")
app.include_router(users_router.router, prefix="/api")
app.include_router(chat_router.router, prefix="/api")
app.include_router(bonds_router.router, prefix="/api")
app.include_router(home_router.router, prefix="/api")

FIRE_SIGNS  = {'Aries', 'Leo', 'Sagittarius'}
EARTH_SIGNS = {'Taurus', 'Virgo', 'Capricorn'}
AIR_SIGNS   = {'Gemini', 'Libra', 'Aquarius'}
WATER_SIGNS = {'Cancer', 'Scorpio', 'Pisces'}

SIGNS = ['Aries', 'Taurus', 'Gemini', 'Cancer', 'Leo', 'Virgo',
         'Libra', 'Scorpio', 'Sagittarius', 'Capricorn', 'Aquarius', 'Pisces']


def _element_balance(planets_raw: dict) -> dict:
    counts = {'fire': 0, 'earth': 0, 'air': 0, 'water': 0}
    for name, p in planets_raw.items():
        if name in ('Rahu', 'Ketu'):
            continue
        s = p['sign']
        if s in FIRE_SIGNS:       counts['fire']  += 1
        elif s in EARTH_SIGNS:    counts['earth'] += 1
        elif s in AIR_SIGNS:      counts['air']   += 1
        elif s in WATER_SIGNS:    counts['water'] += 1
    return counts


def _build_pratyantar(pt: dict) -> PratyantarPeriod:
    return PratyantarPeriod(**pt)


def _build_antar(a: dict) -> AntarPeriodFull:
    return AntarPeriodFull(
        planet=a['planet'],
        start_date=a['start_date'],
        end_date=a['end_date'],
        pratyantardashas=[_build_pratyantar(pt) for pt in a['pratyantardashas']],
    )


def _build_maha(m: dict) -> MahadashaPeriod:
    return MahadashaPeriod(
        planet=m['planet'],
        start_date=m['start_date'],
        end_date=m['end_date'],
        years=m['years'],
        antardashas=[_build_antar(a) for a in m['antardashas']],
    )


@app.get("/health")
def health():
    return {"status": "ok"}


@app.post("/api/geocode")
async def geocode_location(req: GeocodeRequest):
    try:
        results = await geocode(req.query)
        return results
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/api/chart", response_model=ChartResponse)
def generate_chart(req: ChartRequest):
    try:
        birth_date = date.fromisoformat(req.birth_date)
    except ValueError:
        raise HTTPException(status_code=422, detail="Invalid birth_date format. Use YYYY-MM-DD.")

    birth_time = req.birth_time if not req.birth_time_unknown else "12:00"

    try:
        chart_raw = calculate_chart(birth_date, birth_time, req.lat, req.lon)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chart calculation failed: {e}")

    moon = chart_raw["planets"]["Moon"]
    sun  = chart_raw["planets"]["Sun"]
    lagna = chart_raw["lagna"]
    planets_raw = chart_raw["planets"]
    dasha = calculate_dasha(birth_date, moon["longitude"])

    maha     = dasha["current_mahadasha"]
    antar    = dasha["current_antardasha"]
    pratyantar = dasha["current_pratyantardasha"]

    rahu    = planets_raw.get("Rahu", {})
    ketu    = planets_raw.get("Ketu", {})
    saturn  = planets_raw.get("Saturn", {})
    mars    = planets_raw.get("Mars", {})
    jupiter = planets_raw.get("Jupiter", {})
    mercury = planets_raw.get("Mercury", {})
    venus   = planets_raw.get("Venus", {})

    elements = _element_balance(planets_raw)

    seventh_house_sign = SIGNS[(lagna["sign_index"] + 6) % 12]
    tenth_house_sign   = SIGNS[(lagna["sign_index"] + 9) % 12]
    debilitated_str    = ", ".join(
        name for name, p in planets_raw.items() if p.get("dignity") == "debilitated"
    ) or "none"

    planet_list = [
        {
            "name": name,
            "sign": p["sign"],
            "house": p["house"],
            "nakshatra": p["nakshatra"],
            "pada": p["pada"],
            "degree": p["degree"],
            "is_retrograde": p.get("is_retrograde", False),
        }
        for name, p in planets_raw.items()
    ]

    def safe(fn, *args, **kwargs):
        try:
            return fn(*args, **kwargs)
        except Exception as e:
            return f"[unavailable: {e}]"

    def safe_dict(fn, *args, fallback=None, **kwargs):
        try:
            result = fn(*args, **kwargs)
            return result if isinstance(result, dict) else (fallback or {})
        except Exception:
            return fallback or {}

    # Run all AI calls in parallel
    with ThreadPoolExecutor(max_workers=11) as ex:
        f_nakshatra = ex.submit(safe, nakshatra_archetype_reading,
            req.name, moon["nakshatra"], moon["pada"], moon["sign"], moon["house"], lagna["sign"])

        f_season = ex.submit(safe, life_season_reading,
            req.name, lagna["sign"], moon["nakshatra"], moon["sign"],
            maha["planet"] if maha else "unknown",
            maha["start_date"] if maha else "",
            maha["end_date"] if maha else "",
            maha["years"] if maha else 0,
            antar["planet"] if antar else None,
            antar["end_date"] if antar else None)

        f_essence = ex.submit(safe, essence_reading,
            req.name, lagna["sign"], lagna["nakshatra"],
            moon["sign"], moon["nakshatra"],
            sun["sign"], sun["house"],
            maha["planet"] if maha else "unknown")

        f_pillars = ex.submit(safe_dict, three_pillars_reading,
            req.name,
            lagna["sign"], lagna["nakshatra"], lagna["degree"], lagna["pada"],
            moon["sign"], moon["nakshatra"], moon["degree"], moon["pada"],
            sun["sign"], sun["nakshatra"], sun["degree"], sun["house"], sun["pada"],
            fallback={"ascendant": "", "moon": "", "sun": ""})

        f_karmic = ex.submit(safe_dict, karmic_axis_reading,
            req.name,
            ketu.get("sign", ""), ketu.get("house", 0), ketu.get("nakshatra", ""),
            rahu.get("sign", ""), rahu.get("house", 0), rahu.get("nakshatra", ""),
            fallback={"ketu": "", "rahu": "", "axis_name": ""})

        f_planets = ex.submit(safe_dict, all_planet_readings,
            req.name, lagna["sign"], planet_list,
            fallback={})

        f_core = ex.submit(safe_dict, core_reading,
            req.name,
            lagna["sign"], lagna["nakshatra"], lagna["pada"],
            moon["sign"], moon["nakshatra"], moon["house"],
            sun["sign"], sun["house"], sun["nakshatra"],
            chart_raw["planets"],
            chart_raw["yogas"],
            maha["planet"] if maha else "unknown",
            fallback={})

        f_powers = ex.submit(safe_dict, natural_powers_reading,
            req.name,
            lagna["sign"], lagna["nakshatra"],
            moon["sign"], moon["nakshatra"],
            jupiter.get("sign", ""), jupiter.get("house", 0),
            mercury.get("sign", ""), mercury.get("house", 0),
            venus.get("sign", ""), venus.get("house", 0),
            sun["sign"], sun["house"],
            chart_raw["yogas"],
            fallback={})

        f_growth = ex.submit(safe_dict, growth_path_reading,
            req.name,
            lagna["sign"],
            moon["sign"], moon["nakshatra"],
            rahu.get("sign", ""), rahu.get("house", 0), rahu.get("nakshatra", ""),
            saturn.get("sign", ""), saturn.get("house", 0),
            jupiter.get("sign", ""), jupiter.get("house", 0),
            tenth_house_sign,
            debilitated_str,
            maha["planet"] if maha else "unknown",
            fallback={})

        f_soul = ex.submit(safe_dict, soul_history_reading,
            req.name,
            ketu.get("sign", ""), ketu.get("house", 0), ketu.get("nakshatra", ""),
            moon["sign"], moon["nakshatra"],
            saturn.get("sign", ""), saturn.get("house", 0),
            fallback={})

        f_love = ex.submit(safe_dict, love_reading,
            lagna["sign"],
            seventh_house_sign,
            venus.get("sign", ""), venus.get("house", 0), venus.get("nakshatra", ""),
            moon["sign"], moon["house"], moon["nakshatra"],
            mars.get("sign", ""), mars.get("house", 0),
            rahu.get("sign", ""), rahu.get("house", 0),
            fallback={})

        nakshatra_text = f_nakshatra.result()
        season_text    = f_season.result()
        essence_text   = f_essence.result()
        pillars_raw    = f_pillars.result()
        karmic_raw     = f_karmic.result()
        planet_texts   = f_planets.result()
        core_raw       = f_core.result()
        powers_raw     = f_powers.result()
        growth_raw     = f_growth.result()
        soul_raw       = f_soul.result()
        love_raw       = f_love.result()

    # Build optional reading objects (None if AI call returned empty)
    def _core_obj(r):
        if not r or not r.get("who_are_you"):
            return None
        standout_raw = r.get("what_stands_out", [])
        if not isinstance(standout_raw, list):
            standout_raw = []
        standout_items = [
            StandoutItem(
                headline=s.get("headline", ""),
                body=s.get("body", ""),
                tag=s.get("tag", ""),
            )
            for s in standout_raw if isinstance(s, dict)
        ]
        return CoreReading(
            who_are_you=r.get("who_are_you", ""),
            what_stands_out=standout_items,
            presence_and_inner_world=r.get("presence_and_inner_world", ""),
        )

    def _powers_obj(r):
        if not r or not r.get("gifts"):
            return None
        archetypes = [Archetype(**a) for a in r.get("archetypes", []) if isinstance(a, dict)]
        return NaturalPowers(gifts=r.get("gifts", ""), archetypes=archetypes)

    def _growth_obj(r):
        keys = ["dharma", "what_to_create", "growth_blocks"]
        if not r or not any(r.get(k) for k in keys):
            return None
        return GrowthPath(**{k: r.get(k, "") for k in keys})

    def _soul_obj(r):
        themes_raw = r.get("soul_themes", []) if r else []
        if not themes_raw or not isinstance(themes_raw, list):
            return None
        themes = [
            SoulTheme(
                theme=t.get("theme", ""),
                description=t.get("description", ""),
                past_life_labels=[l for l in t.get("past_life_labels", []) if isinstance(l, str)],
            )
            for t in themes_raw if isinstance(t, dict)
        ]
        return SoulHistory(soul_themes=themes) if themes else None

    def _love_obj(r):
        if not r or not r.get("love_style"):
            return None
        return LoveReading(
            love_style=r.get("love_style", ""),
            relationship_needs=r.get("relationship_needs", ""),
        )

    return ChartResponse(
        chart=ChartData(
            lagna=LagnaInfo(**lagna),
            planets={k: PlanetInfo(**v) for k, v in planets_raw.items()},
            navamsa={k: DivisionalPlacement(**v) for k, v in chart_raw["navamsa"].items()},
            dasamsa={k: DivisionalPlacement(**v) for k, v in chart_raw["dasamsa"].items()},
            panchanga=Panchanga(**chart_raw["panchanga"]),
            yogas=[DetectedYoga(**y) for y in chart_raw["yogas"]],
            metadata=ChartMetadata(**chart_raw["metadata"]),
        ),
        dasha=DashaData(
            current_mahadasha=_build_maha(maha) if maha else None,
            current_antardasha=_build_antar(antar) if antar else None,
            current_pratyantardasha=_build_pratyantar(pratyantar) if pratyantar else None,
            all_mahadashas=[_build_maha(m) for m in dasha["all_mahadashas"]],
        ),
        readings=Readings(
            nakshatra_archetype=nakshatra_text,
            life_season=season_text,
            essence=essence_text,
            three_pillars=ThreePillars(**pillars_raw),
            karmic_axis=KarmicAxis(**karmic_raw),
            planet_readings=planet_texts,
            core=_core_obj(core_raw),
            natural_powers=_powers_obj(powers_raw),
            growth_path=_growth_obj(growth_raw),
            soul_history=_soul_obj(soul_raw),
            love=_love_obj(love_raw),
        ),
        meta=ChartMeta(
            name=req.name,
            birth_date=req.birth_date,
            birth_time=birth_time,
            location_name=req.location_name,
            moon_nakshatra=moon["nakshatra"],
            moon_nakshatra_lord=NAKSHATRA_LORDS[moon["nakshatra_index"]],
            lagna_sign=lagna["sign"],
        ),
    )
