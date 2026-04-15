'use client'
import { useEffect, useRef } from 'react'

interface Particle {
  x: number
  y: number
  vx: number
  vy: number
  baseOpacity: number
  opacity: number
  size: number
  brightness: number
  brightTarget: number
  brightTimer: number
  brightDuration: number
}

export default function LuminousField({ intensity = 1 }: { intensity?: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animId: number
    let time = 0

    const resize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    resize()
    window.addEventListener('resize', resize)

    const COUNT = Math.floor(380 * intensity)
    const particles: Particle[] = Array.from({ length: COUNT }, () => ({
      x: Math.random() * window.innerWidth,
      y: Math.random() * window.innerHeight,
      vx: 0,
      vy: 0,
      baseOpacity: Math.random() * 0.35 + 0.04,
      opacity: Math.random() * 0.35 + 0.04,
      size: Math.random() * 1.4 + 0.4,
      brightness: 1,
      brightTarget: 1,
      brightTimer: 0,
      brightDuration: 0,
    }))

    // Randomly ignite a particle into a luminous flare
    const flareInterval = setInterval(() => {
      const p = particles[Math.floor(Math.random() * particles.length)]
      p.brightTarget = 3.5 + Math.random() * 2.5
      p.brightDuration = 80 + Math.random() * 140
      p.brightTimer = 0
    }, 180)

    const flow = (x: number, y: number, t: number): number => {
      const s = 0.0022
      return (
        Math.sin(x * s + t * 0.00014) * Math.PI +
        Math.cos(y * s * 1.4 + t * 0.00009) * Math.PI * 0.55 +
        Math.sin((x - y) * s * 0.8 + t * 0.00011) * Math.PI * 0.35 +
        Math.cos((x + y * 0.5) * s * 0.5 + t * 0.00007) * Math.PI * 0.2
      )
    }

    const draw = () => {
      // Soft fade trail — lower alpha = longer trail
      ctx.fillStyle = 'rgba(7, 7, 15, 0.14)'
      ctx.fillRect(0, 0, canvas.width, canvas.height)

      for (const p of particles) {
        const angle = flow(p.x, p.y, time)
        p.vx = p.vx * 0.96 + Math.cos(angle) * 0.22
        p.vy = p.vy * 0.96 + Math.sin(angle) * 0.22

        p.x = (p.x + p.vx + canvas.width) % canvas.width
        p.y = (p.y + p.vy + canvas.height) % canvas.height

        // Brightness lifecycle
        if (p.brightDuration > 0) {
          p.brightTimer++
          const t2 = p.brightTimer / p.brightDuration
          if (t2 < 0.25) {
            p.brightness = 1 + (p.brightTarget - 1) * (t2 / 0.25)
          } else if (t2 < 0.65) {
            // hold at peak
          } else {
            p.brightness = 1 + (p.brightTarget - 1) * (1 - (t2 - 0.65) / 0.35)
          }
          if (p.brightTimer >= p.brightDuration) {
            p.brightness = 1
            p.brightTarget = 1
            p.brightDuration = 0
            p.brightTimer = 0
          }
        }

        const alpha = Math.min(p.baseOpacity * p.brightness, 0.9)
        const sz = p.size * Math.min(p.brightness, 2.2)

        // Soft radial glow for bright particles
        if (p.brightness > 1.8) {
          const gr = sz * 5
          const grd = ctx.createRadialGradient(p.x, p.y, 0, p.x, p.y, gr)
          grd.addColorStop(0, `rgba(242, 235, 218, ${alpha * 0.35})`)
          grd.addColorStop(0.5, `rgba(200, 185, 155, ${alpha * 0.1})`)
          grd.addColorStop(1, 'rgba(200, 185, 155, 0)')
          ctx.beginPath()
          ctx.arc(p.x, p.y, gr, 0, Math.PI * 2)
          ctx.fillStyle = grd
          ctx.fill()
        }

        // Particle dot
        ctx.beginPath()
        ctx.arc(p.x, p.y, sz, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(242, 235, 218, ${alpha})`
        ctx.fill()
      }

      time++
      animId = requestAnimationFrame(draw)
    }

    draw()
    return () => {
      cancelAnimationFrame(animId)
      clearInterval(flareInterval)
      window.removeEventListener('resize', resize)
    }
  }, [intensity])

  return (
    <canvas
      ref={canvasRef}
      className="fixed inset-0 pointer-events-none"
      style={{ zIndex: 0 }}
    />
  )
}
