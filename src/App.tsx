import { AlbumsDebugBox } from './components/AlbumsDebugBox'
import { MiniPlayer } from './components/MiniPlayer'
import { Game } from './game/Game'

export default function App() {
  return (
    <div className="relative h-full min-h-0 w-full">
      <MiniPlayer />
      <AlbumsDebugBox />
      <Game />
    </div>
  )
}
