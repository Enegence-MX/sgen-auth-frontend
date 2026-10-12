import { createContext, useContext } from 'react'

export const OverlayContainer = createContext<HTMLDivElement | null | undefined>(undefined)

export function useOverlayContainer() {
  return useContext(OverlayContainer)
}
