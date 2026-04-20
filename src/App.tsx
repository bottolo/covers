import { useEffect, useState } from 'react'
import { Game } from './game/Game'

function PointerLockHint() {
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const sync = () => setLocked(document.pointerLockElement !== null)
    sync()
    document.addEventListener('pointerlockchange', sync)
    return () => document.removeEventListener('pointerlockchange', sync)
  }, [])

  if (locked) return null

  return (
    <div
      className="pointer-events-none absolute bottom-[12%] left-1/2 z-10 max-w-[min(92vw,420px)] -translate-x-1/2 rounded-lg border border-neutral-200 bg-white/80 px-3.5 py-2.5 text-center text-[15px] text-neutral-900 shadow-lg ring-1 ring-black/5 dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-100 dark:shadow-xl dark:ring-white/10"
      aria-live="polite"
    >
      Click the scene to capture the pointer — WASD to move, mouse to look.
    </div>
  )
}

export default function App() {
  return (
    <div className="relative h-full min-h-0 w-full">
      <PointerLockHint />
      <Game />
    </div>
  )
}
