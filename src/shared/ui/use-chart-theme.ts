import { useEffect, useState, type RefObject } from 'react'

export interface ChartTheme {
  primary: string
  series: string[]
  text: string
  strong: string
  border: string
  surface: string
  font: string
  reducedMotion: boolean
}

export function useChartTheme(host: RefObject<HTMLElement | null>) {
  const [theme, setTheme] = useState<ChartTheme | null>(null)
  useEffect(() => {
    const element = host.current
    if (!element) return
    const scope = element.closest('[data-theme]') ?? document.documentElement
    const motion = globalThis.matchMedia?.('(prefers-reduced-motion: reduce)')
    let active = true
    function synchronize() {
      if (!active || !element) return
      const style = getComputedStyle(element)
      const token = (name: string) => style.getPropertyValue(`--${name}`).trim()
      setTheme({
        primary: token('color-primary'),
        series: ['color-primary', 'color-success-text', 'color-warning-text', 'color-danger-text', 'color-text-muted'].map(token),
        text: token('color-text'),
        strong: token('color-text-strong'),
        border: token('color-border'),
        surface: token('color-surface'),
        font: token('font-family-body'),
        reducedMotion: motion?.matches ?? false,
      })
    }
    synchronize()
    const observer = new MutationObserver(synchronize)
    const options = { attributes: true, attributeFilter: ['data-theme', 'class', 'style'] }
    observer.observe(scope, options)
    if (scope !== document.documentElement) observer.observe(document.documentElement, options)
    motion?.addEventListener('change', synchronize)
    void document.fonts?.ready.then(synchronize)
    return () => {
      active = false
      observer.disconnect()
      motion?.removeEventListener('change', synchronize)
    }
  }, [host])
  return theme
}
