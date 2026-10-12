import { useEffect, useState } from 'react'
import { guideSections, type GuideSectionId } from './guide-sections'

export function useActiveGuideSection() {
  const [active, setActive] = useState<GuideSectionId>(() => guideSections.find(({ id }) => `#${id}` === globalThis.location.hash)?.id ?? 'palette')
  useEffect(() => {
    let frame = 0
    function update() {
      frame = 0
      let current: GuideSectionId = 'palette'
      for (const { id } of guideSections) {
        const section = document.getElementById(id)
        if (section && section.getBoundingClientRect().top <= 136) current = id
      }
      const height = document.documentElement.scrollHeight
      if (height > globalThis.innerHeight && Math.ceil(globalThis.scrollY + globalThis.innerHeight) >= height - 2) current = 'loadingStates'
      setActive(current)
    }
    function schedule() {
      if (!frame) frame = requestAnimationFrame(update)
    }
    function followHash() {
      const section = guideSections.find(({ id }) => `#${id}` === globalThis.location.hash)
      if (section) setActive(section.id)
    }
    schedule()
    globalThis.addEventListener('scroll', schedule, { passive: true })
    globalThis.addEventListener('resize', schedule)
    globalThis.addEventListener('hashchange', followHash)
    return () => {
      cancelAnimationFrame(frame)
      globalThis.removeEventListener('scroll', schedule)
      globalThis.removeEventListener('resize', schedule)
      globalThis.removeEventListener('hashchange', followHash)
    }
  }, [])
  return active
}
