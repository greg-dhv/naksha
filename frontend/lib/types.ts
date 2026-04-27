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

export interface StandoutItem {
  headline: string
  body: string
  tag: string  // planet name (e.g. "Jupiter", "Saturn", "Rahu") — used to highlight chart cell
}

export interface CoreReading {
  who_are_you: string
  what_stands_out: StandoutItem[]
  presence_and_inner_world: string
}

export interface Archetype {
  name: string
  description: string
  strength_labels?: string[]
}

export interface NaturalPowers {
  gifts: string
  archetypes: Archetype[]
}

export interface GrowthPath {
  dharma: string
  what_to_create: string
  growth_blocks: string
}

export interface SoulTheme {
  theme: string
  description: string
  past_life_labels?: string[]
}

export interface SoulHistory {
  soul_themes: SoulTheme[]
}

export interface LoveReading {
  love_style: string
  relationship_needs: string
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
  love?: LoveReading
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

// ── Auth ──────────────────────────────────────────────
export interface AuthUser {
  id: string
  email: string
  username: string
  has_chart: boolean
}

export interface ChatMessage {
  id: string
  role: 'user' | 'assistant'
  content: string
}

export interface BondCategory {
  label: string
  score: number
  narrative: string
  person1_context?: string
  person2_context?: string
  chips?: string[]
}

export interface FlowPair {
  gift: string
  practice: string
}

export interface BondReport {
  archetype_name: string
  archetype_tagline: string
  score: number
  core_dynamic: string
  categories: BondCategory[]
  flow_pairs: FlowPair[]
  closing_question: string
}

export interface BondResult {
  id: string
  report: BondReport
  relationship_type: string
  person1: { username: string; name: string }
  person2: { username: string; name: string }
}

export interface UserSearchResult {
  id: string
  username: string
  has_chart: boolean
}
