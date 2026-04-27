'use client'
import { ChartData } from '@/lib/types'
import { PLANET_SYMBOLS, PLANET_COLORS } from '@/lib/api'

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
const SIGN_GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']
const SIGN_SHORT  = ['Ari','Tau','Gem','Can','Leo','Vir','Lib','Sco','Sag','Cap','Aqu','Pis']

// Planet name abbreviations for labels
const PLANET_ABBREV: Record<string, string> = {
  Sun: 'Sun', Moon: 'Moon', Mars: 'Mars', Mercury: 'Mer',
  Jupiter: 'Jup', Venus: 'Ven', Saturn: 'Sat', Rahu: 'Rahu', Ketu: 'Ketu',
}

const SIZE = 480
const CX   = 240
const CY   = 240

// Ring radii
const R_OUTER_RING = 225   // outermost stroke (sign names outside this)
const R_SIGN_OUT   = 216   // sign ring outer edge
const R_SIGN_IN    = 170   // sign ring inner edge (46px ring)
const R_SIGN_MID   = (R_SIGN_OUT + R_SIGN_IN) / 2  // 193 — glyph center
const R_PLANET     = 128   // planet glyph radius
const R_LABEL      = 108   // planet label radius (name · deg)
const R_INNER      = 54    // center badge circle

const toRad = (deg: number) => (deg * Math.PI) / 180

function polar(r: number, angleDeg: number) {
  const a = toRad(angleDeg - 90)
  return { x: CX + r * Math.cos(a), y: CY + r * Math.sin(a) }
}

function spoke(angleDeg: number, r1: number, r2: number) {
  const p1 = polar(r1, angleDeg)
  const p2 = polar(r2, angleDeg)
  return `M ${p1.x} ${p1.y} L ${p2.x} ${p2.y}`
}

function arcSegment(startDeg: number, endDeg: number, r_out: number, r_in: number) {
  const s1 = polar(r_out, startDeg)
  const e1 = polar(r_out, endDeg)
  const s2 = polar(r_in,  endDeg)
  const e2 = polar(r_in,  startDeg)
  return `M ${s1.x} ${s1.y} A ${r_out} ${r_out} 0 0 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${r_in} ${r_in} 0 0 0 ${e2.x} ${e2.y} Z`
}

interface Props { chart: ChartData }

export default function BirthChartWheel({ chart }: Props) {
  const { lagna, planets } = chart
  const offset = lagna.sign_index * 30

  // Group planets by sign for angular spreading
  const bySign: Record<number, string[]> = {}
  for (const [name, p] of Object.entries(planets)) {
    if (!bySign[p.sign_index]) bySign[p.sign_index] = []
    bySign[p.sign_index].push(name)
  }

  return (
    <div style={{ width: '100%', aspectRatio: '1', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          {/* Gradient for inner area */}
          <radialGradient id="bcw-innerBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(28,40,56,0.7)" />
            <stop offset="100%" stopColor="rgba(10,16,24,0.98)" />
          </radialGradient>
          {/* Lagna spoke highlight gradient */}
          <linearGradient id="bcw-lagnaSpoke" x1="0%" y1="0%" x2="100%" y2="0%">
            <stop offset="0%" stopColor="rgba(212,184,150,0)" />
            <stop offset="100%" stopColor="rgba(212,184,150,0.5)" />
          </linearGradient>
          {/* Glow filter for ASC dot */}
          <filter id="bcw-glow" x="-50%" y="-50%" width="200%" height="200%">
            <feGaussianBlur stdDeviation="3" result="blur" />
            <feMerge>
              <feMergeNode in="blur" />
              <feMergeNode in="SourceGraphic" />
            </feMerge>
          </filter>
        </defs>

        {/* ── Outermost circle ── */}
        <circle cx={CX} cy={CY} r={R_OUTER_RING}
          fill="none"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.5"
        />

        {/* ── Sign ring segments ── */}
        {SIGNS.map((sign, i) => {
          const startDeg = i * 30 + offset
          const endDeg   = (i + 1) * 30 + offset
          const midDeg   = startDeg + 15
          const mid      = polar(R_SIGN_MID, midDeg)
          const isLagna  = i === lagna.sign_index

          return (
            <g key={`sign-${i}`}>
              <path
                d={arcSegment(startDeg, endDeg, R_SIGN_OUT, R_SIGN_IN)}
                fill={isLagna
                  ? 'rgba(155,138,224,0.10)'
                  : i % 2 === 0 ? 'rgba(255,255,255,0.025)' : 'rgba(255,255,255,0.010)'}
                stroke="none"
              />
              {/* Sign glyph */}
              <text
                x={mid.x}
                y={mid.y - 7}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="14"
                fill={isLagna ? 'rgba(155,138,224,0.90)' : 'rgba(255,255,255,0.38)'}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {SIGN_GLYPHS[i]}
              </text>
              {/* Sign short name */}
              <text
                x={mid.x}
                y={mid.y + 8}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="7"
                letterSpacing="0.08em"
                fill={isLagna ? 'rgba(155,138,224,0.60)' : 'rgba(255,255,255,0.20)'}
                style={{ pointerEvents: 'none', userSelect: 'none', textTransform: 'uppercase' }}
              >
                {SIGN_SHORT[i]}
              </text>
            </g>
          )
        })}

        {/* ── Sign ring outer + inner strokes ── */}
        <circle cx={CX} cy={CY} r={R_SIGN_OUT}
          fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="0.6"
        />
        <circle cx={CX} cy={CY} r={R_SIGN_IN}
          fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5"
        />

        {/* ── 12 spoke dividers (from inner circle to sign ring outer) ── */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle   = i * 30 + offset
          const isLagna = i === lagna.sign_index
          return (
            <path
              key={`spoke-${i}`}
              d={spoke(angle, R_INNER + 4, R_SIGN_OUT)}
              stroke={isLagna ? 'rgba(155,138,224,0.45)' : 'rgba(255,255,255,0.08)'}
              strokeWidth={isLagna ? 1.0 : 0.5}
              fill="none"
            />
          )
        })}

        {/* ── Inner area background ── */}
        <circle cx={CX} cy={CY} r={R_SIGN_IN}
          fill="url(#bcw-innerBg)"
        />

        {/* ── ASC dot on sign ring ── */}
        {(() => {
          const ascAngle = lagna.sign_index * 30 + offset
          const dotPos   = polar(R_SIGN_OUT, ascAngle)
          return (
            <circle
              cx={dotPos.x}
              cy={dotPos.y}
              r={5}
              fill="#D4B896"
              filter="url(#bcw-glow)"
            />
          )
        })()}

        {/* ── Planets ── */}
        {Object.entries(planets).map(([name, p]) => {
          const signPlanets = bySign[p.sign_index] || []
          const idx    = signPlanets.indexOf(name)
          const total  = signPlanets.length
          const spread = total > 1 ? (idx - (total - 1) / 2) * (22 / total) : 0
          const angleDeg = p.sign_index * 30 + 15 + offset + spread

          const glyphPos = polar(R_PLANET, angleDeg)
          const labelPos = polar(R_LABEL,  angleDeg)
          const color    = PLANET_COLORS[name] || 'rgba(255,255,255,0.75)'

          return (
            <g key={name}>
              {/* Glyph */}
              <text
                x={glyphPos.x}
                y={glyphPos.y + 0.5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="16"
                fill={color}
                style={{
                  pointerEvents: 'none',
                  userSelect: 'none',
                  filter: `drop-shadow(0 0 6px ${color}60)`,
                  fontWeight: 400,
                }}
              >
                {PLANET_SYMBOLS[name] || name[0]}
              </text>
              {/* Retrograde marker */}
              {p.is_retrograde && (
                <text
                  x={glyphPos.x + 9}
                  y={glyphPos.y - 7}
                  fontSize="7"
                  fill="rgba(255,255,255,0.35)"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  ℞
                </text>
              )}
              {/* Name label */}
              <text
                x={labelPos.x}
                y={labelPos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fill="rgba(255,255,255,0.50)"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {PLANET_ABBREV[name] || name}
              </text>
            </g>
          )
        })}

        {/* ── Center badge ── */}
        <rect
          x={CX - 30}
          y={CY - 30}
          width={60}
          height={60}
          rx={10}
          ry={10}
          fill="rgba(155,138,224,0.12)"
          stroke="rgba(155,138,224,0.30)"
          strokeWidth="1"
        />
        <text
          x={CX}
          y={CY - 1}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="26"
          fill="rgba(155,138,224,0.90)"
          style={{ userSelect: 'none' }}
        >
          {SIGN_GLYPHS[lagna.sign_index]}
        </text>
        <text
          x={CX}
          y={CY + 20}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="7"
          fill="rgba(255,255,255,0.30)"
          letterSpacing="2.5"
          style={{ userSelect: 'none' }}
        >
          ASC
        </text>
      </svg>
    </div>
  )
}
