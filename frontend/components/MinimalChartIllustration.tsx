interface Props {
  size?: number
}

export default function MinimalChartIllustration({ size = 320 }: Props) {
  const cx = size / 2
  const cy = size / 2
  const Ro = size * 0.46   // outer circle
  const Rm = size * 0.34   // middle circle
  const Ri = size * 0.18   // inner circle

  const pt = (r: number, deg: number) => ({
    x: cx + r * Math.cos(((deg - 90) * Math.PI) / 180),
    y: cy + r * Math.sin(((deg - 90) * Math.PI) / 180),
  })

  const col = 'rgba(255,255,255,0.55)'
  const colDim = 'rgba(255,255,255,0.2)'
  const colFaint = 'rgba(255,255,255,0.1)'

  return (
    <svg
      viewBox={`0 0 ${size} ${size}`}
      width={size}
      height={size}
      style={{ overflow: 'visible' }}
      aria-hidden
    >
      {/* Outer circle */}
      <circle cx={cx} cy={cy} r={Ro} fill="none" stroke={colDim} strokeWidth="0.8" />

      {/* Dashed middle circle */}
      <circle
        cx={cx} cy={cy} r={Rm}
        fill="none"
        stroke={colFaint}
        strokeWidth="0.6"
        strokeDasharray="3 5"
      />

      {/* Inner circle */}
      <circle cx={cx} cy={cy} r={Ri} fill="none" stroke={colDim} strokeWidth="0.6" />

      {/* Cross-hair lines (full diameter) */}
      <line x1={cx} y1={cy - Ro} x2={cx} y2={cy + Ro} stroke={colFaint} strokeWidth="0.6" />
      <line x1={cx - Ro} y1={cy} x2={cx + Ro} y2={cy} stroke={colFaint} strokeWidth="0.6" />

      {/* Cardinal dots on outer ring */}
      {[0, 90, 180, 270].map(deg => {
        const p = pt(Ro, deg)
        return <circle key={deg} cx={p.x} cy={p.y} r={size * 0.012} fill={col} />
      })}

      {/* Dots on middle ring at intercardinal positions */}
      {[45, 135, 225, 315].map(deg => {
        const p = pt(Rm, deg)
        return <circle key={deg} cx={p.x} cy={p.y} r={size * 0.008} fill={colDim} />
      })}

      {/* One highlighted planet dot */}
      {(() => {
        const p = pt(Rm, 38)
        return (
          <>
            <circle cx={p.x} cy={p.y} r={size * 0.015} fill="rgba(255,255,255,0.0)" stroke={col} strokeWidth="0.8" />
            <circle cx={p.x} cy={p.y} r={size * 0.006} fill={col} />
          </>
        )
      })()}

      {/* Second planet dot */}
      {(() => {
        const p = pt(Rm, 162)
        return <circle cx={p.x} cy={p.y} r={size * 0.007} fill="rgba(255,255,255,0.45)" />
      })()}

      {/* Center dot */}
      <circle cx={cx} cy={cy} r={size * 0.018} fill="none" stroke={colDim} strokeWidth="0.6" />
      <circle cx={cx} cy={cy} r={size * 0.005} fill={col} />
    </svg>
  )
}
