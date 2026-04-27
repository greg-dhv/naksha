// ── Illustration lookups ───────────────────────────────────────────────────────
// Maps display names (as returned by the API) to public asset paths.
// No runtime fetch — data inlined from _index.json files.

// Nakshatra: "Mrigashira" → "/nakshatras/05-mrigashira.svg"
const NAKSHATRA_SLUG: Record<string, string> = {
  'Ashwini':           '01-ashwini',
  'Bharani':           '02-bharani',
  'Krittika':          '03-krittika',
  'Rohini':            '04-rohini',
  'Mrigashira':        '05-mrigashira',
  'Ardra':             '06-ardra',
  'Punarvasu':         '07-punarvasu',
  'Pushya':            '08-pushya',
  'Ashlesha':          '09-ashlesha',
  'Magha':             '10-magha',
  'Purva Phalguni':    '11-purva-phalguni',
  'Uttara Phalguni':   '12-uttara-phalguni',
  'Hasta':             '13-hasta',
  'Chitra':            '14-chitra',
  'Swati':             '15-swati',
  'Vishakha':          '16-vishakha',
  'Anuradha':          '17-anuradha',
  'Jyeshtha':          '18-jyeshtha',
  'Mula':              '19-mula',
  'Purva Ashadha':     '20-purva-ashadha',
  'Uttara Ashadha':    '21-uttara-ashadha',
  'Shravana':          '22-shravana',
  'Dhanishtha':        '23-dhanishta',
  'Shatabhisha':       '24-shatabhisha',
  'Purva Bhadrapada':  '25-purva-bhadrapada',
  'Uttara Bhadrapada': '26-uttara-bhadrapada',
  'Revati':            '27-revati',
}

// Yoga: "Gaja Kesari" → { src: "/yogas/gaja-kesari.svg", color: "#5B8CFF" }
const YOGA_META: Record<string, { slug: string; color: string }> = {
  'Ruchaka':                   { slug: 'ruchaka',             color: '#D4B896' },
  'Bhadra':                    { slug: 'bhadra',              color: '#D4B896' },
  'Hamsa':                     { slug: 'hamsa',               color: '#D4B896' },
  'Malavya':                   { slug: 'malavya',             color: '#D4B896' },
  'Shasha':                    { slug: 'shasha',              color: '#D4B896' },
  'Budha-Aditya':              { slug: 'budha-aditya',        color: '#5B8CFF' },
  'Gaja Kesari':               { slug: 'gaja-kesari',         color: '#5B8CFF' },
  'Gajakesari':                { slug: 'gaja-kesari',         color: '#5B8CFF' },
  'Chandra-Mangala':           { slug: 'chandra-mangala',     color: '#5B8CFF' },
  'Sunapha':                   { slug: 'sunapha',             color: '#5B8CFF' },
  'Anapha':                    { slug: 'anapha',              color: '#5B8CFF' },
  'Durudhara':                 { slug: 'durudhara',           color: '#5B8CFF' },
  'Kemadruma':                 { slug: 'kemadruma',           color: '#5B8CFF' },
  'Dharma-Karma Adhipati':     { slug: 'dharma-karma',        color: '#5B8CFF' },
  'Vipreet Raja':              { slug: 'vipreet-raja',        color: '#5B8CFF' },
  'Raja (generic)':            { slug: 'raja-generic',        color: '#5B8CFF' },
  'Lakshmi':                   { slug: 'lakshmi',             color: '#D4B896' },
  'Dhana (generic)':           { slug: 'dhana-generic',       color: '#D4B896' },
  'Pravrajya':                 { slug: 'pravrajya',           color: '#B99CDF' },
  'Adhi':                      { slug: 'adhi',                color: '#B99CDF' },
  'Kala Sarpa':                { slug: 'kala-sarpa',          color: '#B99CDF' },
  'Shrapit Dosha':             { slug: 'shrapit',             color: '#B99CDF' },
  'Guru Chandala':             { slug: 'guru-chandala',       color: '#B99CDF' },
  'Angarak':                   { slug: 'angarak',             color: '#B99CDF' },
  'Sarasvati':                 { slug: 'sarasvati',           color: '#D4B896' },
  'Sarasvati (with Moon)':     { slug: 'sarasvati-moon',      color: '#D4B896' },
  'Parivartana':               { slug: 'parivartana',         color: '#5B8CFF' },
  'Neecha Bhanga Raja':        { slug: 'neecha-bhanga',       color: '#D4B896' },
  'Kemadruma Bhanga':          { slug: 'kemadruma-bhanga',    color: '#D4B896' },
  'Vipreet (redemption)':      { slug: 'vipreet-redemption',  color: '#D4B896' },
}

export function getNakshatraSrc(name: string): string | null {
  const slug = NAKSHATRA_SLUG[name]
  return slug ? `/nakshatras/${slug}.svg` : null
}

export function getYogaMeta(name: string): { src: string; color: string } | null {
  const meta = YOGA_META[name]
  return meta ? { src: `/yogas/${meta.slug}.svg`, color: meta.color } : null
}
