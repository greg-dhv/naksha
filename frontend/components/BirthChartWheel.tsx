'use client'
import { ChartData } from '@/lib/types'
import { PLANET_SYMBOLS, PLANET_COLORS, SIGN_SYMBOLS } from '@/lib/api'

const SIGNS = ['Aries','Taurus','Gemini','Cancer','Leo','Virgo','Libra','Scorpio','Sagittarius','Capricorn','Aquarius','Pisces']
const SIGN_SYMBOLS_ARR = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']

const ELEMENT_COLORS: Record<string, string> = {
  Aries: 'rgba(232,100,60,0.13)',
  Leo: 'rgba(232,100,60,0.13)',
  Sagittarius: 'rgba(232,100,60,0.13)',
  Taurus: 'rgba(80,170,100,0.10)',
  Virgo: 'rgba(80,170,100,0.10)',
  Capricorn: 'rgba(80,170,100,0.10)',
  Gemini: 'rgba(100,160,240,0.10)',
  Libra: 'rgba(100,160,240,0.10)',
  Aquarius: 'rgba(100,160,240,0.10)',
  Cancer: 'rgba(80,150,220,0.13)',
  Scorpio: 'rgba(80,150,220,0.13)',
  Pisces: 'rgba(80,150,220,0.13)',
}

interface Props {
  chart: ChartData
}

const CX = 220
const CY = 220
const R_NAK = 210       // nakshatra outer
const R_SIGN_OUT = 195  // sign ring outer
const R_SIGN_IN = 160   // sign ring inner
const R_HOUSE_IN = 138  // house ring inner
const R_PLANET = 116    // planet placement radius
const R_INNER = 52      // center circle

const toRad = (deg: number) => (deg * Math.PI) / 180
// 0° = Aries = top of chart. Longitude goes clockwise.
const lonToAngle = (lon: number) => toRad(lon - 90)

function polarToXY(cx: number, cy: number, r: number, angleDeg: number) {
  const a = toRad(angleDeg - 90)
  return { x: cx + r * Math.cos(a), y: cy + r * Math.sin(a) }
}

function arcPath(cx: number, cy: number, r: number, startDeg: number, endDeg: number): string {
  const s = polarToXY(cx, cy, r, startDeg)
  const e = polarToXY(cx, cy, r, endDeg)
  const large = (endDeg - startDeg) % 360 > 180 ? 1 : 0
  return `M ${s.x} ${s.y} A ${r} ${r} 0 ${large} 1 ${e.x} ${e.y}`
}

function segmentPath(cx: number, cy: number, r1: number, r2: number, startDeg: number, endDeg: number): string {
  const s1 = polarToXY(cx, cy, r1, startDeg)
  const e1 = polarToXY(cx, cy, r1, endDeg)
  const s2 = polarToXY(cx, cy, r2, endDeg)
  const e2 = polarToXY(cx, cy, r2, startDeg)
  const large = (endDeg - startDeg) % 360 > 180 ? 1 : 0
  return `M ${s1.x} ${s1.y} A ${r1} ${r1} 0 ${large} 1 ${e1.x} ${e1.y} L ${s2.x} ${s2.y} A ${r2} ${r2} 0 ${large} 0 ${e2.x} ${e2.y} Z`
}

export default function BirthChartWheel({ chart }: Props) {
  const { lagna, planets } = chart
  const lagnaOffset = lagna.sign_index * 30  // degrees the lagna is rotated

  // Planets — collect per sign for stacking
  const planetsBySign: Record<number, Array<{ name: string; degree: number }>> = {}
  for (const [name, p] of Object.entries(planets)) {
    if (!planetsBySign[p.sign_index]) planetsBySign[p.sign_index] = []
    planetsBySign[p.sign_index].push({ name, degree: p.degree })
  }

  const size = 440

  return (
    <div className="relative flex items-center justify-center" style={{ width: size, height: size, maxWidth: '100%' }}>
      <svg
        viewBox={`0 0 ${size} ${size}`}
        width={size}
        height={size}
        style={{ maxWidth: '100%', height: 'auto' }}
      >
        <defs>
          <radialGradient id="centerGlow" cx="50%" cy="50%" r="50%">
            <stop offset="0%" stopColor="rgba(201,164,90,0.08)" />
            <stop offset="100%" stopColor="transparent" />
          </radialGradient>
          <filter id="softGlow">
            <feGaussianBlur stdDeviation="2" result="blur" />
            <feComposite in="SourceGraphic" in2="blur" operator="over" />
          </filter>
        </defs>

        {/* Outer ambient glow */}
        <circle cx={CX} cy={CY} r={R_NAK + 10} fill="url(#centerGlow)" />

        {/* Nakshatra ring — 27 segments */}
        {Array.from({ length: 27 }).map((_, i) => {
          const startDeg = i * (360 / 27) + lagnaOffset
          const endDeg = (i + 1) * (360 / 27) + lagnaOffset
          const midDeg = (startDeg + endDeg) / 2
          const mid = polarToXY(CX, CY, (R_NAK + R_SIGN_OUT) / 2, midDeg)
          return (
            <g key={`nak-${i}`}>
              <path
                d={segmentPath(CX, CY, R_NAK, R_SIGN_OUT, startDeg, endDeg)}
                fill="transparent"
                stroke="rgba(201,164,90,0.12)"
                strokeWidth="0.5"
              />
            </g>
          )
        })}

        {/* Sign ring — 12 segments */}
        {SIGNS.map((sign, i) => {
          const startDeg = i * 30 + lagnaOffset
          const endDeg = (i + 1) * 30 + lagnaOffset
          const midDeg = (startDeg + endDeg) / 2
          const mid = polarToXY(CX, CY, (R_SIGN_OUT + R_SIGN_IN) / 2, midDeg)
          return (
            <g key={`sign-${i}`}>
              <path
                d={segmentPath(CX, CY, R_SIGN_OUT, R_SIGN_IN, startDeg, endDeg)}
                fill={ELEMENT_COLORS[sign]}
                stroke="rgba(255,255,255,0.07)"
                strokeWidth="0.6"
              />
              <text
                x={mid.x}
                y={mid.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="12"
                fill="rgba(242,235,218,0.55)"
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {SIGN_SYMBOLS_ARR[i]}
              </text>
            </g>
          )
        })}

        {/* House ring — 12 houses (whole sign) */}
        {Array.from({ length: 12 }).map((_, i) => {
          const startDeg = i * 30 + lagnaOffset
          const endDeg = (i + 1) * 30 + lagnaOffset
          const midDeg = (startDeg + endDeg) / 2
          const mid = polarToXY(CX, CY, (R_SIGN_IN + R_HOUSE_IN) / 2, midDeg)
          const isLagna = i === 0
          return (
            <g key={`house-${i}`}>
              <path
                d={segmentPath(CX, CY, R_SIGN_IN, R_HOUSE_IN, startDeg, endDeg)}
                fill={isLagna ? 'rgba(201,164,90,0.08)' : 'transparent'}
                stroke="rgba(255,255,255,0.06)"
                strokeWidth="0.5"
              />
              <text
                x={mid.x}
                y={mid.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="9"
                fill={isLagna ? 'rgba(201,164,90,0.8)' : 'rgba(242,235,218,0.22)'}
                style={{ pointerEvents: 'none', userSelect: 'none' }}
              >
                {i + 1}
              </text>
            </g>
          )
        })}

        {/* Ascendant tick */}
        <line
          x1={polarToXY(CX, CY, R_HOUSE_IN, lagnaOffset).x}
          y1={polarToXY(CX, CY, R_HOUSE_IN, lagnaOffset).y}
          x2={polarToXY(CX, CY, R_NAK, lagnaOffset).x}
          y2={polarToXY(CX, CY, R_NAK, lagnaOffset).y}
          stroke="rgba(201,164,90,0.5)"
          strokeWidth="1"
        />

        {/* Inner background circle */}
        <circle
          cx={CX}
          cy={CY}
          r={R_HOUSE_IN}
          fill="rgba(7,7,15,0.6)"
          stroke="rgba(255,255,255,0.06)"
          strokeWidth="0.5"
        />

        {/* Planets */}
        {Object.entries(planets).map(([name, p]) => {
          const planetsInSign = planetsBySign[p.sign_index] || []
          const myIdx = planetsInSign.findIndex(x => x.name === name)
          const total = planetsInSign.length
          // Spread planets within their sign segment
          const spreadAngle = total > 1 ? (myIdx - (total - 1) / 2) * (22 / total) : 0
          const baseDeg = p.sign_index * 30 + 15 + lagnaOffset + spreadAngle

          const pos = polarToXY(CX, CY, R_PLANET, baseDeg)
          const symbol = PLANET_SYMBOLS[name] || name.slice(0, 2)
          const color = PLANET_COLORS[name] || 'rgba(242,235,218,0.7)'

          return (
            <g key={name}>
              {/* Soft glow behind planet */}
              <circle
                cx={pos.x}
                cy={pos.y}
                r={10}
                fill={`${color}20`}
              />
              <text
                x={pos.x}
                y={pos.y}
                textAnchor="middle"
                dominantBaseline="middle"
                fontSize="13"
                fill={color}
                style={{ pointerEvents: 'none', userSelect: 'none', filter: `drop-shadow(0 0 4px ${color}60)` }}
              >
                {symbol}
              </text>
              {p.is_retrograde && (
                <text
                  x={pos.x + 7}
                  y={pos.y - 6}
                  fontSize="6"
                  fill="rgba(242,235,218,0.4)"
                  style={{ pointerEvents: 'none', userSelect: 'none' }}
                >
                  R
                </text>
              )}
            </g>
          )
        })}

        {/* Center circle */}
        <circle
          cx={CX}
          cy={CY}
          r={R_INNER}
          fill="rgba(7,7,15,0.9)"
          stroke="rgba(201,164,90,0.18)"
          strokeWidth="1"
        />
        <text
          x={CX}
          y={CY - 6}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="9"
          fill="rgba(201,164,90,0.5)"
          letterSpacing="3"
          style={{ userSelect: 'none' }}
        >
          NAKSHA
        </text>
        <text
          x={CX}
          y={CY + 10}
          textAnchor="middle"
          dominantBaseline="middle"
          fontSize="8"
          fill="rgba(242,235,218,0.25)"
          style={{ userSelect: 'none' }}
        >
          {lagna.sign} rising
        </text>
      </svg>
    </div>
  )
}
