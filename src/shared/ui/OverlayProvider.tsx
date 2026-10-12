import { useState, type ReactNode } from 'react'
import { OverlayContainer } from './use-overlay-container'

/** Keeps portalled controls inside the current theme scope. */
export function OverlayProvider({ children }: Readonly<{ children: ReactNode }>) {
  const [container, setContainer] = useState<HTMLDivElement | null>(null)
  return (
    <OverlayContainer.Provider value={container}>
      {children}
      <div ref={setContainer} />
    </OverlayContainer.Provider>
  )
}

