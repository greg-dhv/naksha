export interface PlanetInfo {
  name: string
  sign: string
  sign_index: number
  degree: number
  longitude: number
  house: number
  nakshatra: string
  nakshatra_index: number
  nakshatra_lord: string
  pada: number
  is_retrograde: boolean
  combust: boolean
  dignity: 'exalted' | 'own' | 'moolatrikona' | 'debilitated' | 'neutral'
}

export interface LagnaInfo {
  sign: string
  sign_index: number
  degree: number
  longitude: number
  nakshatra: string
  nakshatra_index: number
  nakshatra_lord: string
  pada: number
}

export interface DivisionalPlacement {
  sign: string
  sign_index: number
  house: number
}

export interface ChartMetadata {
  julian_day_ut: number
  ayanamsa: number
  computation_version: string
  computed_at: string
}

export interface Panchanga {
  tithi: string
  tithi_index: number
  vara: string
  yoga: string
  yoga_index: number
  karana: string
  karana_index: number
}

export interface DetectedYoga {
  name: string
  type: string
  planets: string[]
  houses: number[]
  description: string
}

export interface ChartData {
  lagna: LagnaInfo
  planets: Record<string, PlanetInfo>
  navamsa: Record<string, DivisionalPlacement>
  dasamsa: Record<string, DivisionalPlacement>
  panchanga: Panchanga
  yogas: DetectedYoga[]
  metadata: ChartMetadata
}

export interface PratyantarPeriod {
  planet: string
  start_date: string
  end_date: string
}

export interface AntarPeriodFull {
  planet: string
  start_date: string
  end_date: string
  pratyantardashas: PratyantarPeriod[]
}

export interface MahadashaPeriod {
  planet: string
  start_date: string
  end_date: string
  years: number
  antardashas: AntarPeriodFull[]
}

export interface DashaData {
  current_mahadasha: MahadashaPeriod | null
  current_antardasha: AntarPeriodFull | null
  current_pratyantardasha: PratyantarPeriod | null
  all_mahadashas: MahadashaPeriod[]
}

export interface ThreePillars {
  ascendant: string
  moon: string
  sun: string
}

export interface KarmicAxis {
  ketu: string
  rahu: string
  axis_name: string
}

export interface CoreReading {
  who_are_you: string
  what_stands_out: string
  how_you_come_across: string
  inner_world: string
  what_drives_you: string
}

export interface Archetype {
  name: string
  description: string
}

export interface NaturalPowers {
  gifts: string
  archetypes: Archetype[]
}

export interface GrowthPath {
  life_teaching: string
  dharma: string
  spiritual_path: string
}

export interface SoulHistory {
  soul_knows: string
  past_life_themes: string
}

export interface EnergyReading {
  dominant_force: string
  shiva_score: number
  shakti_score: number
  vishnu_score: number
  shiva_explanation: string
  shakti_explanation: string
  vishnu_explanation: string
  cultivate: string
  practices: string
}

export interface Readings {
  nakshatra_archetype: string
  life_season: string
  essence: string
  three_pillars: ThreePillars
  karmic_axis: KarmicAxis
  planet_readings: Record<string, string>
  core?: CoreReading
  natural_powers?: NaturalPowers
  growth_path?: GrowthPath
  soul_history?: SoulHistory
  energy?: EnergyReading
}

export interface ChartMeta {
  name: string
  birth_date: string
  birth_time: string
  location_name: string
  moon_nakshatra: string
  moon_nakshatra_lord: string
  lagna_sign: string
}

export interface ChartResponse {
  chart: ChartData
  dasha: DashaData
  readings: Readings
  meta: ChartMeta
}

export interface GeocodeResult {
  display_name: string
  short_name: string
  lat: number
  lon: number
}
