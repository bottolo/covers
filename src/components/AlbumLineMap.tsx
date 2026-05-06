import type { AlbumWorldPoint } from '../game/environment/CityAlbumsWorld'
import type { PlayerPose } from '../game/player/FirstPersonPlayer'

type AlbumLineMapProps = {
  playerPose: PlayerPose | null
  albumPoints: AlbumWorldPoint[]
}

export function AlbumLineMap({ playerPose, albumPoints }: AlbumLineMapProps) {
  if (!playerPose || albumPoints.length === 0) return null

  const forwardX = -Math.sin(playerPose.yaw)
  const forwardZ = -Math.cos(playerPose.yaw)
  const rightX = Math.cos(playerPose.yaw)
  const rightZ = -Math.sin(playerPose.yaw)

  const dots = albumPoints.map((point, index) => {
    const dx = point[0] - playerPose.position[0]
    const dz = point[2] - playerPose.position[2]
    const planarDistance = Math.hypot(dx, dz)
    if (planarDistance < 1e-4) {
      return { id: `album-dot-${index}`, xPercent: 0, opacity: 1, ahead: true }
    }

    const inv = 1 / planarDistance
    const dirX = dx * inv
    const dirZ = dz * inv
    const lateral = dirX * rightX + dirZ * rightZ
    const forward = dirX * forwardX + dirZ * forwardZ

    return {
      id: `album-dot-${index}`,
      xPercent: Math.max(-48, Math.min(48, lateral * 48)),
      opacity: forward >= 0 ? 0.95 : 0.45,
      ahead: forward >= 0,
    }
  })

  return (
    <div className="pointer-events-none absolute bottom-4 left-1/2 z-30 w-[min(92vw,680px)] -translate-x-1/2">
      <div className="relative h-7 rounded-full border border-neutral-200/70 bg-black/20 backdrop-blur-sm">
        <div className="absolute left-4 right-4 top-1/2 h-[2px] -translate-y-1/2 bg-neutral-200/70" />
        {dots.map((dot) => (
          <span
            key={dot.id}
            className={`absolute top-1/2 h-2.5 w-2.5 -translate-x-1/2 -translate-y-1/2 rounded-full ${
              dot.ahead ? 'bg-sky-300' : 'bg-neutral-300'
            }`}
            style={{
              left: `calc(50% + ${dot.xPercent}%)`,
              opacity: dot.opacity,
            }}
          />
        ))}
      </div>
    </div>
  )
}
