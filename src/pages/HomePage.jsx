import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import useWindowTitle from '../hooks/useWindowTitle'
import { useTheme } from '../context/ThemeContext'

function HomePage() {
  useWindowTitle('AnkaBanka — Employee Portal')
  const { dark } = useTheme()
  const [offset, setOffset] = useState({ x: 0, y: 0 })

  useEffect(() => {
    const handleMouse = (e) => {
      const cx = window.innerWidth / 2
      const cy = window.innerHeight / 2
      const dx = (e.clientX - cx) / cx  // -1 to 1
      const dy = (e.clientY - cy) / cy  // -1 to 1
      setOffset({ x: -dx * 45, y: -dy * 30 })
    }
    window.addEventListener('mousemove', handleMouse)
    return () => window.removeEventListener('mousemove', handleMouse)
  }, [])

  return (
    <div className="relative min-h-[680px] space-y-20">
      {/* Blob container */}
      <div aria-hidden="true" className="pointer-events-none absolute inset-0">
        {/* Blob 1 — violet, tall narrow ellipse */}
        <div
          className="absolute top-0 left-[38%] w-[538px] h-[650px]"
          style={{
            transform: `translate(${offset.x}px, ${offset.y}px) rotate(18deg)`,
            transition: 'transform 0.7s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            background: dark
              ? 'radial-gradient(ellipse at 50% 50%, rgba(99, 32, 255, 0.98) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at 50% 50%, rgba(138, 92, 246, 0.87) 0%, transparent 70%)',
            filter: 'blur(64px)',
          }}
        />
        {/* Blob 2 — blue, wide flat ellipse, slower parallax */}
        <div
          className="absolute top-12 left-[30%] w-[700px] h-[375px]"
          style={{
            transform: `translate(${offset.x * 0.55}px, ${offset.y * 0.55}px) rotate(-12deg)`,
            transition: 'transform 1.1s cubic-bezier(0.25, 0.46, 0.45, 0.94)',
            background: dark
              ? 'radial-gradient(ellipse at 50% 50%, rgba(31, 132, 255, 0.9) 0%, transparent 70%)'
              : 'radial-gradient(ellipse at 50% 50%, rgba(96, 165, 250, 0.88) 0%, transparent 70%)',
            filter: 'blur(70px)',
          }}
        />
      </div>

      {/* Hero */}
      <section className="relative pt-8 pb-4">
        <p className="section-label mb-6">Employee Portal</p>
        <h1 className="font-serif text-5xl sm:text-6xl lg:text-7xl font-light text-slate-900 dark:text-white leading-tight mb-6">
          AnkaBanka Internal
        </h1>
        <div className="gold-divider mx-0" />
        <p className="text-slate-500 dark:text-slate-400 text-lg font-light max-w-lg mb-10 leading-relaxed">
          Internal tools and systems for AnkaBanka staff. Sign in with your employee credentials to continue.
        </p>
        <Link to="/login" className="btn-primary">
          Employee Login
        </Link>
      </section>
    </div>
  )
}

export default HomePage
