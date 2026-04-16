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
    degree: float
    longitude: float
    house: int
    nakshatra: str
    nakshatra_index: int
    nakshatra_lord: str
    pada: int
    is_retrograde: bool
    combust: bool
    dignity: str             # exalted | own | moolatrikona | debilitated | neutral


class LagnaInfo(BaseModel):
    sign: str
    sign_index: int
    degree: float
    longitude: float
    nakshatra: str
    nakshatra_index: int
    nakshatra_lord: str
    pada: int


class DivisionalPlacement(BaseModel):
    sign: str
    sign_index: int
    house: int


class ChartMetadata(BaseModel):
    julian_day_ut: float
    ayanamsa: float
    computation_version: str
    computed_at: str


class Panchanga(BaseModel):
    tithi: str
    tithi_index: int
    vara: str
    yoga: str
    yoga_index: int
    karana: str
    karana_index: int


class DetectedYoga(BaseModel):
    name: str
    type: str
    planets: List[str]
    houses: List[int]
    description: str


class ChartData(BaseModel):
    lagna: LagnaInfo
    planets: Dict[str, PlanetInfo]
    navamsa: Dict[str, DivisionalPlacement]
    dasamsa: Dict[str, DivisionalPlacement]
    panchanga: Panchanga
    yogas: List[DetectedYoga]
    metadata: ChartMetadata


# ── Dasha tree (3 levels) ────────────────────────────────────────────────────

class PratyantarPeriod(BaseModel):
    planet: str
    start_date: str
    end_date: str


class AntarPeriodFull(BaseModel):
    planet: str
    start_date: str
    end_date: str
    pratyantardashas: List[PratyantarPeriod]


class MahadashaPeriod(BaseModel):
    planet: str
    start_date: str
    end_date: str
    years: float
    antardashas: List[AntarPeriodFull]


class DashaData(BaseModel):
    current_mahadasha: Optional[MahadashaPeriod]
    current_antardasha: Optional[AntarPeriodFull]
    current_pratyantardasha: Optional[PratyantarPeriod]
    all_mahadashas: List[MahadashaPeriod]


# ── AI readings ──────────────────────────────────────────────────────────────

class ThreePillars(BaseModel):
    ascendant: str
    moon: str
    sun: str


class KarmicAxis(BaseModel):
    ketu: str
    rahu: str
    axis_name: str


class CoreReading(BaseModel):
    who_are_you: str
    what_stands_out: str
    how_you_come_across: str
    inner_world: str
    what_drives_you: str


class Archetype(BaseModel):
    name: str
    description: str


class NaturalPowers(BaseModel):
    gifts: str
    archetypes: List[Archetype]


class GrowthPath(BaseModel):
    life_teaching: str
    dharma: str
    spiritual_path: str


class SoulHistory(BaseModel):
    soul_knows: str
    past_life_themes: str


class EnergyReading(BaseModel):
    dominant_force: str
    shiva_score: int
    shakti_score: int
    vishnu_score: int
    shiva_explanation: str
    shakti_explanation: str
    vishnu_explanation: str
    cultivate: str
    practices: str


class Readings(BaseModel):
    nakshatra_archetype: str
    life_season: str
    essence: str
    three_pillars: ThreePillars
    karmic_axis: KarmicAxis
    planet_readings: Dict[str, str]
    # Extended reading categories
    core: Optional[CoreReading] = None
    natural_powers: Optional[NaturalPowers] = None
    growth_path: Optional[GrowthPath] = None
    soul_history: Optional[SoulHistory] = None
    energy: Optional[EnergyReading] = None


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
