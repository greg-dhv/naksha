export interface PlanetInfo {
  name: string
  sign: string
  sign_index: number
  degree: number
  longitude: number
  house: number
  nakshatra: string
  nakshatra_index: number
  pada: number
  is_retrograde: boolean
}

export interface LagnaInfo {
  sign: string
  sign_index: number
  degree: number
  longitude: number
  nakshatra: string
  nakshatra_index: number
  pada: number
}

export interface ChartData {
  lagna: LagnaInfo
  planets: Record<string, PlanetInfo>
}

export interface DashaPeriod {
  planet: string
  start_date: string
  end_date: string
  years: number
}

export interface AntarPeriod {
  planet: string
  start_date: string
  end_date: string
}

export interface DashaData {
  current_mahadasha: DashaPeriod | null
  current_antardasha: AntarPeriod | null
  all_mahadashas: DashaPeriod[]
}

export interface Readings {
  nakshatra_archetype: string
  life_season: string
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
