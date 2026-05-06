import { Billboard } from '@react-three/drei'
import { useFrame } from '@react-three/fiber'
import { useRapier } from '@react-three/rapier'
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
  CITY_ALBUM_MIN_ROOF_Y,
  CITY_ALBUM_ROOF_OFFSET,
  CITY_STREET_EXTENT,
} from '../config'
import { setCityAlbumPoints } from './cityAlbumDebug'
import { Portrait } from './Portrait'

type Placement = {
  position: [number, number, number]
  phase: number
  rotationY: number
}
const ROOF_RAY_ORIGIN_Y = 260
export type AlbumWorldPoint = [number, number, number]

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

function createRoofPlacement(
  random: () => number,
  world: ReturnType<typeof useRapier>['world'],
  rapier: ReturnType<typeof useRapier>['rapier']
): Placement | null {
  const x = (random() * 2 - 1) * CITY_STREET_EXTENT
  const z = (random() * 2 - 1) * CITY_STREET_EXTENT
  const ray = new rapier.Ray(
    { x, y: ROOF_RAY_ORIGIN_Y, z },
    { x: 0, y: -1, z: 0 }
  )
  const hit = world.castRay(ray, ROOF_RAY_ORIGIN_Y + 80, true)
  if (!hit) return null
  const surfaceY = ROOF_RAY_ORIGIN_Y - hit.timeOfImpact
  if (surfaceY < CITY_ALBUM_MIN_ROOF_Y) return null
  return {
    position: [x, Math.max(CITY_ALBUM_BASE_Y, surfaceY + CITY_ALBUM_ROOF_OFFSET), z],
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
      <Billboard follow lockX lockZ>
        <Portrait album={album} position={[0, 0, 0]} rotation={[0, 0, 0]} />
      </Billboard>
    </group>
  )
}

type CityAlbumsWorldProps = {
  onPointsChange?: (points: AlbumWorldPoint[]) => void
}

export function CityAlbumsWorld({ onPointsChange }: CityAlbumsWorldProps) {
  const { world, rapier } = useRapier()
  const { data: allAlbums } = useAllAlbumsQuery(ALBUM_PREFETCH_BUFFER + ALBUMS_PER_CITY)
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000_000))
  const regenerationAttemptsRef = useRef(0)

  const placements = useMemo(() => {
    const random = mulberry32(seed)
    const roofPlacements: Placement[] = []
    let attempts = 0
    while (roofPlacements.length < ALBUMS_PER_CITY && attempts < ALBUMS_PER_CITY * 120) {
      attempts += 1
      const placement = createRoofPlacement(random, world, rapier)
      if (placement) roofPlacements.push(placement)
    }

    if (roofPlacements.length === 0) {
      return Array.from({ length: ALBUMS_PER_CITY }, () => ({
        position: [0, CITY_ALBUM_BASE_Y + 12, 0] as [number, number, number],
        phase: random() * Math.PI * 2,
        rotationY: random() * Math.PI * 2,
      }))
    }

    const sourceCount = roofPlacements.length
    while (roofPlacements.length < ALBUMS_PER_CITY) {
      roofPlacements.push(roofPlacements[roofPlacements.length % sourceCount])
    }
    return roofPlacements
  }, [rapier, seed, world])

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

    const roundedKey = (p: [number, number, number]) =>
      `${Math.round(p[0])}:${Math.round(p[1])}:${Math.round(p[2])}`
    const uniquePointCount = new Set(points.map(roundedKey)).size

    let probeRoofHits = 0
    const probeCount = 40
    for (let i = 0; i < probeCount; i += 1) {
      const x = (Math.random() * 2 - 1) * CITY_STREET_EXTENT
      const z = (Math.random() * 2 - 1) * CITY_STREET_EXTENT
      const ray = new rapier.Ray(
        { x, y: ROOF_RAY_ORIGIN_Y, z },
        { x: 0, y: -1, z: 0 }
      )
      const hit = world.castRay(ray, ROOF_RAY_ORIGIN_Y + 80, true)
      if (!hit) continue
      const surfaceY = ROOF_RAY_ORIGIN_Y - hit.timeOfImpact
      if (surfaceY >= CITY_ALBUM_MIN_ROOF_Y) probeRoofHits += 1
    }

    if (
      visibleAlbums.length > 0 &&
      uniquePointCount <= 1 &&
      probeRoofHits > 0 &&
      regenerationAttemptsRef.current < 8
    ) {
      regenerationAttemptsRef.current += 1
      setSeed((prev) => prev + 1)
    } else if (uniquePointCount > 1) {
      regenerationAttemptsRef.current = 0
    }

    setCityAlbumPoints(points)
    onPointsChange?.(points)
  }, [onPointsChange, placements, rapier, visibleAlbums.length, world])

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
