import { useRef, useEffect, useCallback } from 'react'

interface SignatureCanvasProps {
  width?: number
  height?: number
  onSignatureChange?: (base64: string | null) => void
}

export default function SignatureCanvas({ width = 500, height = 200, onSignatureChange }: SignatureCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const isDrawingRef = useRef(false)
  const hasContentRef = useRef(false)

  const getCtx = useCallback(() => {
    return canvasRef.current?.getContext('2d') ?? null
  }, [])

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#1E3A5F'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
  }, [])

  const getPos = (e: React.MouseEvent | React.TouchEvent) => {
    const canvas = canvasRef.current!
    const rect = canvas.getBoundingClientRect()
    const scaleX = canvas.width / rect.width
    const scaleY = canvas.height / rect.height
    if ('touches' in e) {
      const touch = e.touches[0] || e.changedTouches[0]
      return { x: (touch.clientX - rect.left) * scaleX, y: (touch.clientY - rect.top) * scaleY }
    }
    return { x: (e.clientX - rect.left) * scaleX, y: (e.clientY - rect.top) * scaleY }
  }

  const startDraw = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault()
    isDrawingRef.current = true
    const ctx = getCtx()
    if (!ctx) return
    const pos = getPos(e)
    ctx.beginPath()
    ctx.moveTo(pos.x, pos.y)
  }

  const draw = (e: React.MouseEvent | React.TouchEvent) => {
    if ('touches' in e) e.preventDefault()
    if (!isDrawingRef.current) return
    const ctx = getCtx()
    if (!ctx) return
    const pos = getPos(e)
    ctx.lineTo(pos.x, pos.y)
    ctx.stroke()
    hasContentRef.current = true
  }

  const endDraw = () => {
    if (!isDrawingRef.current) return
    isDrawingRef.current = false
    const ctx = getCtx()
    if (ctx) ctx.closePath()
    if (hasContentRef.current && onSignatureChange) {
      onSignatureChange(canvasRef.current!.toDataURL('image/png'))
    }
  }

  const clear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')!
    ctx.fillStyle = '#FFFFFF'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    ctx.strokeStyle = '#1E3A5F'
    ctx.lineWidth = 2
    ctx.lineCap = 'round'
    ctx.lineJoin = 'round'
    hasContentRef.current = false
    onSignatureChange?.(null)
  }

  return (
    <div className="flex flex-col items-center gap-3">
      <div className="border-2 border-dashed border-gray-300 rounded-lg overflow-hidden">
        <canvas
          ref={canvasRef}
          width={width}
          height={height}
          className="cursor-crosshair max-w-full"
          style={{ width: '100%', maxWidth: `${width}px`, height: 'auto' }}
          onMouseDown={startDraw}
          onMouseMove={draw}
          onMouseUp={endDraw}
          onMouseLeave={endDraw}
          onTouchStart={startDraw}
          onTouchMove={draw}
          onTouchEnd={endDraw}
        />
      </div>
      <button
        onClick={clear}
        className="px-4 py-1.5 text-sm bg-gray-100 text-gray-600 rounded hover:bg-gray-200 transition-colors"
      >
        清除签名
      </button>
    </div>
  )
}
