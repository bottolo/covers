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
    <div className="game-hint" aria-live="polite">
      Click the scene to capture the pointer — WASD to move, mouse to look.
    </div>
  )
}

export default function App() {
  return (
    <div className="game-root">
      <PointerLockHint />
      <Game />
    </div>
  )
}
