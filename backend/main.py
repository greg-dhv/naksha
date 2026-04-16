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
    CoreReading, NaturalPowers, Archetype, GrowthPath, SoulHistory, EnergyReading,
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
    energy_reading,
)

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

FIRE_SIGNS  = {'Aries', 'Leo', 'Sagittarius'}
EARTH_SIGNS = {'Taurus', 'Virgo', 'Capricorn'}
AIR_SIGNS   = {'Gemini', 'Libra', 'Aquarius'}
WATER_SIGNS = {'Cancer', 'Scorpio', 'Pisces'}


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
            saturn.get("sign", ""), saturn.get("house", 0),
            mars.get("sign", ""), mars.get("house", 0),
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
            maha["planet"] if maha else "unknown",
            fallback={})

        f_soul = ex.submit(safe_dict, soul_history_reading,
            req.name,
            ketu.get("sign", ""), ketu.get("house", 0), ketu.get("nakshatra", ""),
            moon["sign"], moon["nakshatra"],
            saturn.get("sign", ""), saturn.get("house", 0),
            fallback={})

        f_energy = ex.submit(safe_dict, energy_reading,
            req.name,
            lagna["sign"], lagna["nakshatra"],
            moon["sign"], moon["nakshatra"],
            sun["sign"],
            mars.get("sign", ""), mars.get("house", 0),
            saturn.get("sign", ""), saturn.get("house", 0),
            jupiter.get("sign", ""), jupiter.get("house", 0),
            venus.get("sign", ""),
            elements,
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
        energy_raw     = f_energy.result()

    # Build optional reading objects (None if AI call returned empty)
    def _core_obj(r):
        keys = ["who_are_you", "what_stands_out", "how_you_come_across", "inner_world", "what_drives_you"]
        if not r or not any(r.get(k) for k in keys):
            return None
        return CoreReading(**{k: r.get(k, "") for k in keys})

    def _powers_obj(r):
        if not r or not r.get("gifts"):
            return None
        archetypes = [Archetype(**a) for a in r.get("archetypes", []) if isinstance(a, dict)]
        return NaturalPowers(gifts=r.get("gifts", ""), archetypes=archetypes)

    def _growth_obj(r):
        keys = ["life_teaching", "dharma", "spiritual_path"]
        if not r or not any(r.get(k) for k in keys):
            return None
        return GrowthPath(**{k: r.get(k, "") for k in keys})

    def _soul_obj(r):
        if not r or not any(r.get(k) for k in ["soul_knows", "past_life_themes"]):
            return None
        return SoulHistory(soul_knows=r.get("soul_knows", ""), past_life_themes=r.get("past_life_themes", ""))

    def _energy_obj(r):
        keys = ["dominant_force", "shiva_score", "shakti_score", "vishnu_score",
                "shiva_explanation", "shakti_explanation", "vishnu_explanation", "cultivate", "practices"]
        if not r or not r.get("dominant_force"):
            return None
        return EnergyReading(**{k: r.get(k, "" if isinstance("", str) else 0) for k in keys})

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
            energy=_energy_obj(energy_raw),
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
