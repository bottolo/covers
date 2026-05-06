import { Clone, useGLTF } from '@react-three/drei'
import type { Album } from '../../types/albums'
import {
  ALBUMS_PER_TURN,
  TOWER_PANEL_LIFT,
  TOWER_PANEL_RADIUS,
  TOWER_RISE_PER_TURN,
  TOWER_SEGMENTS_PER_TURN,
} from '../config'
import { Portrait } from './Portrait'

useGLTF.preload('/models/museum_tower.glb')

type MuseumTowerChunkProps = {
  chunkIndex: number
  albums: Album[]
}

export function MuseumTowerChunk({ chunkIndex, albums }: MuseumTowerChunkProps) {
  const { scene } = useGLTF('/models/museum_tower.glb')
  const chunkY = chunkIndex * TOWER_RISE_PER_TURN

  return (
    <group position={[0, chunkY, 0]}>
      <Clone key={chunkIndex} object={scene} />

      {albums.map((album, index) => {
        if (index >= ALBUMS_PER_TURN) return null
        const seg = Math.floor(
          (index * TOWER_SEGMENTS_PER_TURN) / ALBUMS_PER_TURN
        )
        const theta =
          ((seg + 0.5) / TOWER_SEGMENTS_PER_TURN) * Math.PI * 2
        const localY =
          ((seg + 0.5) / TOWER_SEGMENTS_PER_TURN) * TOWER_RISE_PER_TURN
        const x = TOWER_PANEL_RADIUS * Math.cos(theta)
        const z = TOWER_PANEL_RADIUS * Math.sin(theta)
        const y = localY + TOWER_PANEL_LIFT
        const rotationY = Math.atan2(x, z) + Math.PI

        return (
          <Portrait
            key={`${chunkIndex}-${seg}-${album.id}`}
            album={album}
            position={[x, y, z]}
            rotation={[0, rotationY, 0]}
          />
        )
      })}
    </group>
  )
}
