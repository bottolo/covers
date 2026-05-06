import { useFrame } from '@react-three/fiber'
import { useEffect, useMemo, useRef, useState } from 'react'
import { Group } from 'three'
import { useAllAlbumsQuery } from '../../api/albums'
import type { Album } from '../../types/albums'
import {
  ALBUM_PREFETCH_BUFFER,
  ALBUMS_PER_CITY,
  CITY_ALBUM_BASE_Y,
  CITY_ALBUM_FLOAT_AMPLITUDE,
  CITY_ALBUM_FLOAT_SPEED,
  CITY_STREET_EXTENT,
  CITY_STREET_SPACING,
} from '../config'
import { setCityAlbumPoints } from './cityAlbumDebug'
import { Portrait } from './Portrait'

type Placement = {
  position: [number, number, number]
  phase: number
  rotationY: number
}

function mulberry32(seed: number): () => number {
  let value = seed
  return () => {
    value += 0x6d2b79f5
    let t = value
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

function createStreetPlacement(random: () => number): Placement {
  const alongX = random() > 0.5
  const streetLine =
    (Math.floor((random() * 2 - 1) * (CITY_STREET_EXTENT / CITY_STREET_SPACING)) *
      CITY_STREET_SPACING)
  const along = (random() * 2 - 1) * CITY_STREET_EXTENT
  const lateralJitter = (random() - 0.5) * 6
  const x = alongX ? along : streetLine + lateralJitter
  const z = alongX ? streetLine + lateralJitter : along
  return {
    position: [x, CITY_ALBUM_BASE_Y, z],
    phase: random() * Math.PI * 2,
    rotationY: random() * Math.PI * 2,
  }
}

function FloatingPortrait({
  album,
  placement,
}: {
  album: Album
  placement: Placement
}) {
  const group = useRef<Group>(null)
  const [baseX, baseY, baseZ] = placement.position

  useFrame(({ clock }) => {
    const node = group.current
    if (!node) return
    const t = clock.getElapsedTime()
    node.position.y =
      baseY +
      Math.sin(t * CITY_ALBUM_FLOAT_SPEED + placement.phase) *
        CITY_ALBUM_FLOAT_AMPLITUDE
  })

  return (
    <group
      ref={group}
      position={[baseX, baseY, baseZ]}
      rotation={[0, placement.rotationY, 0]}
    >
      <Portrait album={album} position={[0, 0, 0]} rotation={[0, 0, 0]} />
    </group>
  )
}

export function CityAlbumsWorld() {
  const { data: allAlbums } = useAllAlbumsQuery(ALBUM_PREFETCH_BUFFER + ALBUMS_PER_CITY)
  const [seed] = useState(() => Math.floor(Math.random() * 1_000_000_000))

  const placements = useMemo(() => {
    const random = mulberry32(seed)
    return Array.from({ length: ALBUMS_PER_CITY }, () => createStreetPlacement(random))
  }, [seed])

  const visibleAlbums = useMemo(() => {
    if (!allAlbums || allAlbums.length === 0) return []
    return Array.from({ length: ALBUMS_PER_CITY }, (_, index) => {
      return allAlbums[index % allAlbums.length]
    })
  }, [allAlbums])

  useEffect(() => {
    const points = placements
      .slice(0, visibleAlbums.length)
      .map((entry) => entry.position)
    setCityAlbumPoints(points)
  }, [placements, visibleAlbums.length])

  return (
    <>
      {visibleAlbums.map((album, index) => (
        <FloatingPortrait
          key={`${album.id}-${index}`}
          album={album}
          placement={placements[index]}
        />
      ))}
    </>
  )
}
