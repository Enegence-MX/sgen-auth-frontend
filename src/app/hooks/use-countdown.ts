import { useEffect, useRef, useState } from 'react'

export function useCountdown(deadline: string | undefined, onExpire: () => void): number | undefined {
  const [now, setNow] = useState(() => Date.now())
  const expire = useRef(onExpire)
  useEffect(() => {
    expire.current = onExpire
  }, [onExpire])
  useEffect(() => {
    if (!deadline) return
    const end = Date.parse(deadline)
    function tick() {
      const current = Date.now()
      setNow(current)
      if (current >= end) expire.current()
    }
    tick()
    const timer = setInterval(tick, 1000)
    return () => clearInterval(timer)
  }, [deadline])
  return deadline ? Math.max(0, Date.parse(deadline) - now) : undefined
}

export function formatCountdown(milliseconds: number): string {
  const seconds = Math.ceil(milliseconds / 1000)
  return `${Math.floor(seconds / 60)}:${String(seconds % 60).padStart(2, '0')}`
}
