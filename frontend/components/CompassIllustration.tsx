interface Props {
  size?: number
}

const SIGNS = ['♈','♉','♊','♋','♌','♍','♎','♏','♐','♑','♒','♓']

export default function CompassIllustration({ size = 260 }: Props) {
  const cx = size / 2
  const cy = size / 2
  const R  = size * 0.46   // outer ring
  const R2 = size * 0.375  // sign ring inner edge
  const R3 = size * 0.28   // middle ring
  const R4 = size * 0.14   // inner ring

  const pt = (r: number, deg: number) => ({
    x: cx + r * Math.cos(((deg - 90) * Math.PI) / 180),
    y: cy + r * Math.sin(((deg - 90) * Math.PI) / 180),
  })

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ overflow: 'visible' }}
      aria-hidden
    >
      {/* Outer ring */}
      <circle cx={cx} cy={cy} r={R}  fill="none" stroke="rgba(200,170,110,0.22)" strokeWidth="0.6" />

      {/* Degree tick marks — every 10° */}
      {Array.from({ length: 36 }).map((_, i) => {
        const deg   = i * 10
        const isMaj = deg % 30 === 0
        const inner = isMaj ? R - 8 : R - 4
        const p1 = pt(R, deg)
        const p2 = pt(inner, deg)
        return (
          <line
            key={`tick-${i}`}
            x1={p1.x} y1={p1.y}
            x2={p2.x} y2={p2.y}
            stroke={isMaj ? 'rgba(200,170,110,0.5)' : 'rgba(200,170,110,0.18)'}
            strokeWidth={isMaj ? '0.8' : '0.5'}
          />
        )
      })}

      {/* Sign ring */}
      <circle cx={cx} cy={cy} r={R2} fill="none" stroke="rgba(255,255,255,0.07)" strokeWidth="0.5" />

      {/* Sign division lines */}
      {Array.from({ length: 12 }).map((_, i) => {
        const p1 = pt(R2, i * 30)
        const p2 = pt(R, i * 30)
        return (
          <line
            key={`sign-${i}`}
            x1={p1.x} y1={p1.y}
            x2={p2.x} y2={p2.y}
            stroke="rgba(200,170,110,0.3)"
            strokeWidth="0.6"
          />
        )
      })}

      {/* Sign glyphs */}
      {SIGNS.map((glyph, i) => {
        const mid = pt((R + R2) / 2, i * 30 + 15)
        return (
          <text
            key={`glyph-${i}`}
            x={mid.x} y={mid.y}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={size * 0.042}
            fill="rgba(200,170,110,0.45)"
            style={{ userSelect: 'none' }}
          >
            {glyph}
          </text>
        )
      })}

      {/* 27 nakshatra dots on sign ring */}
      {Array.from({ length: 27 }).map((_, i) => {
        const p = pt(R2, i * (360 / 27))
        return (
          <circle
            key={`nak-${i}`}
            cx={p.x} cy={p.y}
            r={size * 0.007}
            fill="rgba(200,170,110,0.55)"
          />
        )
      })}

      {/* Middle ring */}
      <circle cx={cx} cy={cy} r={R3} fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="0.5" />

      {/* Cross-hairs */}
      {[0, 90, 180, 270].map(deg => {
        const p1 = pt(R4, deg)
        const p2 = pt(R3, deg)
        return (
          <line
            key={`cross-${deg}`}
            x1={p1.x} y1={p1.y}
            x2={p2.x} y2={p2.y}
            stroke="rgba(200,170,110,0.2)"
            strokeWidth="0.6"
          />
        )
      })}

      {/* Diagonal cross */}
      {[45, 135, 225, 315].map(deg => {
        const p1 = pt(R4 * 0.6, deg)
        const p2 = pt(R3 * 0.7, deg)
        return (
          <line
            key={`diag-${deg}`}
            x1={p1.x} y1={p1.y}
            x2={p2.x} y2={p2.y}
            stroke="rgba(255,255,255,0.06)"
            strokeWidth="0.5"
          />
        )
      })}

      {/* Cardinal dots */}
      {[0, 90, 180, 270].map(deg => {
        const p = pt(R3 + (R2 - R3) / 2, deg)
        return (
          <circle key={`card-${deg}`} cx={p.x} cy={p.y} r={size * 0.009} fill="rgba(200,170,110,0.3)" />
        )
      })}

      {/* Inner ring */}
      <circle cx={cx} cy={cy} r={R4} fill="none" stroke="rgba(200,170,110,0.14)" strokeWidth="0.5" />

      {/* 8-pointed star in center */}
      {Array.from({ length: 8 }).map((_, i) => {
        const p1 = pt(size * 0.025, i * 45)
        const p2 = pt(R4 * 0.5, i * 45)
        return (
          <line
            key={`star-${i}`}
            x1={p1.x} y1={p1.y}
            x2={p2.x} y2={p2.y}
            stroke="rgba(200,170,110,0.35)"
            strokeWidth="0.5"
          />
        )
      })}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={size * 0.012} fill="none" stroke="rgba(200,170,110,0.6)" strokeWidth="0.6" />
      <circle cx={cx} cy={cy} r={size * 0.004} fill="rgba(200,170,110,0.8)" />

      {/* North marker */}
      {(() => {
        const p = pt(R + 14, 0)
        return <text x={p.x} y={p.y} textAnchor="middle" dominantBaseline="middle" fontSize={size * 0.038} fill="rgba(200,170,110,0.5)" style={{ userSelect: 'none', fontFamily: 'system-ui' }}>N</text>
      })()}
    </svg>
  )
}
