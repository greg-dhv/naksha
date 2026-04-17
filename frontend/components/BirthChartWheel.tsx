'use client'
import { ChartData } from '@/lib/types'
import { PLANET_SYMBOLS, PLANET_COLORS } from '@/lib/api'

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
const SIGN_GLYPHS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']

const SIZE  = 400
const CX    = 200
const CY    = 200

// Ring radii
const R_FRAME     = 193   // outer decorative stroke
const R_SIGN_OUT  = 186   // sign ring outer edge
const R_SIGN_IN   = 150   // sign ring inner edge  (36px thin ring)
const R_PLANET    = 107   // planet symbol radius
const R_INNER     = 48    // center circle

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

function signSegment(startDeg: number, endDeg: number, r_out: number, r_in: number) {
  const s1 = polar(r_out, startDeg)
  const e1 = polar(r_out, endDeg)
  const s2 = polar(r_in,  endDeg)
  const e2 = polar(r_in,  startDeg)
  return `M ${s1.x} ${s1.y} A ${r_out} ${r_out} 0 0 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${r_in} ${r_in} 0 0 0 ${e2.x} ${e2.y} Z`
}

interface Props { chart: ChartData }

export default function BirthChartWheel({ chart }: Props) {
  const { lagna, planets } = chart
  const offset = lagna.sign_index * 30  // rotate so lagna is at top

  // Group planets by sign for stacking
  const bySign: Record<number, string[]> = {}
  for (const [name, p] of Object.entries(planets)) {
    if (!bySign[p.sign_index]) bySign[p.sign_index] = []
    bySign[p.sign_index].push(name)
  }

  return (
    <div style={{ width: '100%', maxWidth: SIZE, aspectRatio: '1', position: 'relative' }}>
      <svg
        viewBox={`0 0 ${SIZE} ${SIZE}`}
        width={SIZE}
        height={SIZE}
        style={{ width: '100%', height: 'auto', display: 'block' }}
      >
        <defs>
          <radialGradient id="innerBg" cx="50%" cy="50%" r="50%">
            <stop offset="0%"   stopColor="rgba(30,45,58,0.6)" />
            <stop offset="100%" stopColor="rgba(17,27,36,0.95)" />
          </radialGradient>
        </defs>

        {/* ── Outer frame ── */}
        <circle cx={CX} cy={CY} r={R_FRAME}
          fill="none"
          stroke="rgba(255,255,255,0.10)"
          strokeWidth="0.8"
        />

        {/* ── 12 spoke lines (house + sign dividers, from inner circle to outer frame) ── */}
        {Array.from({ length: 12 }).map((_, i) => {
          const angle = i * 30 + offset
          const isLagna = i === 0
          return (
            <path
              key={`spoke-${i}`}
              d={spoke(angle, R_INNER + 4, R_FRAME)}
              stroke={isLagna ? 'rgba(212,184,150,0.55)' : 'rgba(255,255,255,0.10)'}
              strokeWidth={isLagna ? 1.2 : 0.6}
              fill="none"
            />
          )
        })}

        {/* ── Sign ring segments ── */}
        {SIGNS.map((sign, i) => {
          const startDeg = i * 30 + offset
          const endDeg   = (i + 1) * 30 + offset
          const midDeg   = startDeg + 15
          const mid      = polar((R_SIGN_OUT + R_SIGN_IN) / 2, midDeg)
          const isLagna  = i === 0
          return (
            <g key={`sign-${i}`}>
              <path
                d={signSegment(startDeg, endDeg, R_SIGN_OUT, R_SIGN_IN)}
                fill={isLagna ? 'rgba(212,184,150,0.07)' : i % 2 === 0 ? 'rgba(255,255,255,0.03)' : 'rgba(255,255,255,0.01)'}
                stroke="none"
              />
              <text
                x={mid.x}
                y={mid.y + 0.5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="11"
                fill={isLagna ? 'rgba(212,184,150,0.75)' : 'rgba(255,255,255,0.35)'}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {SIGN_GLYPHS[i]}
              </text>
            </g>
          )
        })}

        {/* ── Inner area background ── */}
        <circle cx={CX} cy={CY} r={R_SIGN_IN}
          fill="url(#innerBg)"
          stroke="rgba(255,255,255,0.07)"
          strokeWidth="0.5"
        />

        {/* ── Planets ── */}
        {Object.entries(planets).map(([name, p]) => {
          const signPlanets = bySign[p.sign_index] || []
          const idx   = signPlanets.indexOf(name)
          const total = signPlanets.length
          const spread = total > 1 ? (idx - (total - 1) / 2) * (20 / total) : 0
          const angleDeg = p.sign_index * 30 + 15 + offset + spread
          const pos   = polar(R_PLANET, angleDeg)
          const color = PLANET_COLORS[name] || 'rgba(255,255,255,0.7)'

          return (
            <g key={name}>
              <text
                x={pos.x}
                y={pos.y + 0.5}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="13"
                fill={color}
                style={{
                  pointerEvents: 'none',
                  userSelect: 'none',
                  filter: `drop-shadow(0 0 5px ${color}55)`,
                  fontWeight: 400,
                }}
              >
                {PLANET_SYMBOLS[name] || name[0]}
              </text>
              {p.is_retrograde && (
                <text
                  x={pos.x + 7}
                  y={pos.y - 5}
                  fontSize="6"
                  fill="rgba(255,255,255,0.35)"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  ℞
                </text>
              )}
            </g>
          )
        })}

        {/* ── Center circle ── */}
        <circle cx={CX} cy={CY} r={R_INNER}
          fill="#111b24"
          stroke="rgba(212,184,150,0.25)"
          strokeWidth="0.8"
        />
        {/* Lagna sign glyph */}
        <text
          x={CX}
          y={CY - 4}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="20"
          fill="rgba(212,184,150,0.80)"
          style={{ userSelect: 'none' }}
        >
          {SIGN_GLYPHS[lagna.sign_index]}
        </text>
        <text
          x={CX}
          y={CY + 14}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="7"
          fill="rgba(255,255,255,0.28)"
          letterSpacing="2"
          style={{ userSelect: 'none' }}
        >
          ASC
        </text>
      </svg>
    </div>
  )
}
