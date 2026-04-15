from pydantic import BaseModel
from typing import Optional, Dict, List


class ChartRequest(BaseModel):
    name: str
    birth_date: str          # YYYY-MM-DD
    birth_time: str          # HH:MM  (local time at birth location)
    birth_time_unknown: bool = False
    lat: float
    lon: float
    location_name: str


class GeocodeRequest(BaseModel):
    query: str


class GeocodeResult(BaseModel):
    display_name: str
    lat: float
    lon: float


class PlanetInfo(BaseModel):
    name: str
    sign: str
    sign_index: int
    degree: float            # degree within sign
    longitude: float         # absolute sidereal longitude
    house: int
    nakshatra: str
    nakshatra_index: int
    pada: int
    is_retrograde: bool


class LagnaInfo(BaseModel):
    sign: str
    sign_index: int
    degree: float
    longitude: float
    nakshatra: str
    nakshatra_index: int
    pada: int


class ChartData(BaseModel):
    lagna: LagnaInfo
    planets: Dict[str, PlanetInfo]


class DashaPeriod(BaseModel):
    planet: str
    start_date: str
    end_date: str
    years: float


class AntarPeriod(BaseModel):
    planet: str
    start_date: str
    end_date: str


class DashaData(BaseModel):
    current_mahadasha: Optional[DashaPeriod]
    current_antardasha: Optional[AntarPeriod]
    all_mahadashas: List[DashaPeriod]


class Readings(BaseModel):
    nakshatra_archetype: str
    life_season: str


class ChartMeta(BaseModel):
    name: str
    birth_date: str
    birth_time: str
    location_name: str
    moon_nakshatra: str
    moon_nakshatra_lord: str
    lagna_sign: str


class ChartResponse(BaseModel):
    chart: ChartData
    dasha: DashaData
    readings: Readings
    meta: ChartMeta
