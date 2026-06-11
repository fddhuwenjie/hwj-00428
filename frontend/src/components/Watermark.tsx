import { useEffect, useRef } from 'react'

interface WatermarkProps {
  text: string
  userName: string
  viewTime: string
  children: React.ReactNode
}

export default function Watermark({ text, userName, viewTime, children }: WatermarkProps) {
  const containerRef = useRef<HTMLDivElement>(null)

  const watermarkText = `${text} - ${userName} - ${viewTime}`

  return (
    <div ref={containerRef} className="relative">
      <div
        className="absolute inset-0 pointer-events-none overflow-hidden z-10"
        style={{
          backgroundImage: `linear-gradient(45deg, transparent 45%, rgba(0,0,0,0.03) 50%, transparent 55%)`,
          backgroundSize: '150px 150px',
        }}
      >
        <div
          className="absolute inset-0 flex items-center justify-center"
          style={{
            transform: 'rotate(-25deg)',
            opacity: 0.15,
          }}
        >
          <div
            className="whitespace-nowrap text-gray-900 font-bold text-2xl"
            style={{
              backgroundRepeat: 'repeat',
              backgroundSize: '400px 200px',
              width: '200%',
              height: '200%',
              display: 'flex',
              flexWrap: 'wrap',
              gap: '80px',
              padding: '100px',
            }}
          >
            {Array.from({ length: 50 }).map((_, i) => (
              <span key={i} className="select-none">
                {watermarkText}
              </span>
            ))}
          </div>
        </div>
      </div>
      {children}
    </div>
  )
}
