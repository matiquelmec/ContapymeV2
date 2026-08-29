'use client'

import { useEffect, useRef, useState } from 'react'

interface AnimatedCounterProps {
  value: number
  prefix?: string
  suffix?: string
  duration?: number
  className?: string
  formatter?: (val: number) => string
}

export function AnimatedCounter({
  value,
  prefix = '',
  suffix = '',
  duration = 1200,
  className = '',
  formatter,
}: AnimatedCounterProps) {
  const [displayValue, setDisplayValue] = useState(0)
  const startTimeRef = useRef<number | null>(null)
  const fromValueRef = useRef(0)

  useEffect(() => {
    fromValueRef.current = displayValue
    startTimeRef.current = null

    let animationFrameId: number

    const step = (timestamp: number) => {
      if (!startTimeRef.current) startTimeRef.current = timestamp
      const progress = Math.min((timestamp - startTimeRef.current) / duration, 1)
      const easeOutExpo = progress === 1 ? 1 : 1 - Math.pow(2, -10 * progress)
      const current = Math.round(fromValueRef.current + (value - fromValueRef.current) * easeOutExpo)

      setDisplayValue(current)

      if (progress < 1) {
        animationFrameId = requestAnimationFrame(step)
      }
    }

    animationFrameId = requestAnimationFrame(step)

    return () => cancelAnimationFrame(animationFrameId)
  }, [value, duration])

  const formatted = formatter
    ? formatter(displayValue)
    : displayValue.toLocaleString('es-CL')

  return (
    <span className={`tabular-nums inline-block transition-all ${className}`}>
      {prefix}{formatted}{suffix}
    </span>
  )
}
