import { ChartResponse, GeocodeResult, AuthUser, ChatMessage, BondResult, UserSearchResult } from './types'

const BASE = process.env.NEXT_PUBLIC_API_URL || ''

function authHeaders(token: string) {
  return { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` }
}

// ── Auth ─────────────────────────────────────────────
export async function register(email: string, password: string, username: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${BASE}/api/auth/register`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password, username }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Registration failed') }
  return res.json()
}

export async function login(email: string, password: string): Promise<{ token: string; user: AuthUser }> {
  const res = await fetch(`${BASE}/api/auth/login`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ email, password }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Login failed') }
  return res.json()
}

export async function getMe(token: string): Promise<AuthUser> {
  const res = await fetch(`${BASE}/api/auth/me`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Unauthorized')
  return res.json()
}

// ── Users ─────────────────────────────────────────────
export async function saveChart(token: string, chart_data: object, birth_data: object): Promise<void> {
  const res = await fetch(`${BASE}/api/users/chart`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ chart_data, birth_data }),
  })
  if (!res.ok) throw new Error('Failed to save chart')
}

export async function getUserChart(token: string): Promise<ChartResponse> {
  const res = await fetch(`${BASE}/api/users/chart`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('No chart')
  return res.json()
}

export async function deleteAccount(token: string): Promise<void> {
  const res = await fetch(`${BASE}/api/users/me`, { method: 'DELETE', headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to delete account')
}

export async function searchUsers(token: string, q: string): Promise<UserSearchResult[]> {
  const res = await fetch(`${BASE}/api/users/search?q=${encodeURIComponent(q)}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Search failed')
  return res.json()
}

// ── Chat ──────────────────────────────────────────────
export interface ChatSession {
  session_id: string
  preview: string | null
  last_at: string
}

export async function getChatSessions(token: string): Promise<ChatSession[]> {
  const res = await fetch(`${BASE}/api/chat/sessions`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to load sessions')
  return res.json()
}

export async function getChatHistory(token: string, session_id: string): Promise<ChatMessage[]> {
  const res = await fetch(`${BASE}/api/chat/history?session_id=${encodeURIComponent(session_id)}`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to load history')
  return res.json()
}

export function streamChat(token: string, message: string, session_id: string, onToken: (text: string) => void): Promise<void> {
  return new Promise(async (resolve, reject) => {
    try {
      const res = await fetch(`${BASE}/api/chat/stream`, {
        method: 'POST',
        headers: authHeaders(token),
        body: JSON.stringify({ message, session_id }),
      })
      if (!res.ok) { const e = await res.json().catch(() => ({})); reject(new Error(e.detail || 'Chat failed')); return }
      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value)
        // Collect all text tokens from this network read into one update
        // so React renders once per read rather than batching N tokens silently
        let batchedText = ''
        let isDone = false
        let streamError: string | null = null
        for (const line of chunk.split('\n')) {
          if (!line.startsWith('data: ')) continue
          try {
            const data = JSON.parse(line.slice(6))
            if (data.text) batchedText += data.text
            if (data.done) isDone = true
            if (data.error) streamError = data.error
          } catch {}
        }
        if (batchedText) onToken(batchedText)
        if (streamError) { reject(new Error(streamError)); return }
        if (isDone) { resolve(); return }
      }
      resolve()
    } catch (e) { reject(e) }
  })
}

// ── Home ──────────────────────────────────────────────
export interface WeeklySection {
  label: string | null
  body: string
}

export interface HomeData {
  weekly_briefing: string | null
  weekly_sections: WeeklySection[] | null
  weekly_pull_quote: string | null
  weekly_carry_label: string | null
  weekly_carry_text: string | null
  weekly_cycle_insight: string | null
  weekly_briefing_week: string | null
  birth_name: string
  life_cycle: {
    mahadasha: { planet: string; start_date: string; end_date: string; years: number } | null
    antardasha: { planet: string; start_date: string; end_date: string } | null
    pratyantardasha: { planet: string; start_date: string; end_date: string } | null
  }
}

export async function getHomeData(token: string): Promise<HomeData> {
  const res = await fetch(`${BASE}/api/home`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to load home data')
  return res.json()
}

// ── Bonds ─────────────────────────────────────────────
export async function listBonds(token: string): Promise<BondResult[]> {
  const res = await fetch(`${BASE}/api/bonds/history`, { headers: authHeaders(token) })
  if (!res.ok) throw new Error('Failed to load bond history')
  return res.json()
}

export async function getCompatibility(token: string, target_username: string, relationship_type: string): Promise<BondResult> {
  const res = await fetch(`${BASE}/api/bonds/compatibility`, {
    method: 'POST',
    headers: authHeaders(token),
    body: JSON.stringify({ target_username, relationship_type }),
  })
  if (!res.ok) { const e = await res.json().catch(() => ({})); throw new Error(e.detail || 'Compatibility failed') }
  return res.json()
}

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
