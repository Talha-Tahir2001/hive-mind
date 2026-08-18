import * as React from "react"

const MOBILE_BREAKPOINT = 768

function getSnapshot(): boolean {
  return window.innerWidth <= MOBILE_BREAKPOINT
}

function subscribe(onStoreChange: () => void): () => void {
  const mql = window.matchMedia(`(max-width: ${MOBILE_BREAKPOINT - 1}px)`)
  mql.addEventListener("change", onStoreChange)
  return () => mql.removeEventListener("change", onStoreChange)
}

export function useIsMobile() {
  return React.useSyncExternalStore(subscribe, getSnapshot, () => false)
}