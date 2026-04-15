import { ChartResponse, GeocodeResult } from './types'

const BASE = process.env.NEXT_PUBLIC_API_URL || ''

export async function geocodeLocation(query: string): Promise<GeocodeResult[]> {
  const res = await fetch(`${BASE}/api/geocode`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ query }),
  })
  if (!res.ok) throw new Error('Geocoding failed')
  return res.json()
}

export async function generateChart(payload: {
  name: string
  birth_date: string
  birth_time: string
  birth_time_unknown: boolean
  lat: number
  lon: number
  location_name: string
}): Promise<ChartResponse> {
  const res = await fetch(`${BASE}/api/chart`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(payload),
  })
  if (!res.ok) {
    const err = await res.json().catch(() => ({}))
    throw new Error(err.detail || 'Chart generation failed')
  }
  return res.json()
}

export const PLANET_ORDER = ['Sun', 'Moon', 'Mars', 'Mercury', 'Jupiter', 'Venus', 'Saturn', 'Rahu', 'Ketu']

export const SIGN_SYMBOLS: Record<string, string> = {
  Aries: '♈', Taurus: '♉', Gemini: '♊', Cancer: '♋',
  Leo: '♌', Virgo: '♍', Libra: '♎', Scorpio: '♏',
  Sagittarius: '♐', Capricorn: '♑', Aquarius: '♒', Pisces: '♓',
}

export const PLANET_SYMBOLS: Record<string, string> = {
  Sun: '☉', Moon: '☽', Mars: '♂', Mercury: '☿',
  Jupiter: '♃', Venus: '♀', Saturn: '♄', Rahu: '☊', Ketu: '☋',
}

export const PLANET_COLORS: Record<string, string> = {
  Sun: '#f5c842',
  Moon: '#d4e8f0',
  Mars: '#e85c4a',
  Mercury: '#7ec8a0',
  Jupiter: '#f0a830',
  Venus: '#e8a0c0',
  Saturn: '#8899bb',
  Rahu: '#a080c0',
  Ketu: '#c0a070',
}
