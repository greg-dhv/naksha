from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from datetime import date
import os
from dotenv import load_dotenv

from models import ChartRequest, GeocodeRequest, ChartResponse
from calculations import calculate_chart, calculate_dasha, NAKSHATRA_LORDS
from geocoding import geocode
from ai_service import nakshatra_archetype_reading, life_season_reading

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
        chart = calculate_chart(birth_date, birth_time, req.lat, req.lon)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Chart calculation failed: {e}")

    moon = chart["planets"]["Moon"]
    dasha = calculate_dasha(birth_date, moon["longitude"])

    maha = dasha["current_mahadasha"]
    antar = dasha["current_antardasha"]

    # AI readings
    try:
        nakshatra_reading = nakshatra_archetype_reading(
            name=req.name,
            moon_nakshatra=moon["nakshatra"],
            moon_pada=moon["pada"],
            moon_sign=moon["sign"],
            moon_house=moon["house"],
            lagna_sign=chart["lagna"]["sign"],
        )
    except Exception as e:
        nakshatra_reading = f"[Reading unavailable: {e}]"

    try:
        season_reading = life_season_reading(
            name=req.name,
            lagna_sign=chart["lagna"]["sign"],
            moon_nakshatra=moon["nakshatra"],
            moon_sign=moon["sign"],
            maha_planet=maha["planet"] if maha else "unknown",
            maha_start=maha["start_date"] if maha else "",
            maha_end=maha["end_date"] if maha else "",
            maha_years=maha["years"] if maha else 0,
            antar_planet=antar["planet"] if antar else None,
            antar_end=antar["end_date"] if antar else None,
        )
    except Exception as e:
        season_reading = f"[Reading unavailable: {e}]"

    from models import (
        ChartData, LagnaInfo, PlanetInfo, DashaData, DashaPeriod,
        AntarPeriod, Readings, ChartMeta
    )

    lagna_raw = chart["lagna"]
    planets_raw = chart["planets"]

    return ChartResponse(
        chart=ChartData(
            lagna=LagnaInfo(**lagna_raw),
            planets={
                k: PlanetInfo(**v) for k, v in planets_raw.items()
            },
        ),
        dasha=DashaData(
            current_mahadasha=DashaPeriod(**maha) if maha else None,
            current_antardasha=AntarPeriod(**antar) if antar else None,
            all_mahadashas=[DashaPeriod(**m) for m in dasha["all_mahadashas"]],
        ),
        readings=Readings(
            nakshatra_archetype=nakshatra_reading,
            life_season=season_reading,
        ),
        meta=ChartMeta(
            name=req.name,
            birth_date=req.birth_date,
            birth_time=birth_time,
            location_name=req.location_name,
            moon_nakshatra=moon["nakshatra"],
            moon_nakshatra_lord=NAKSHATRA_LORDS[moon["nakshatra_index"]],
            lagna_sign=chart["lagna"]["sign"],
        ),
    )
