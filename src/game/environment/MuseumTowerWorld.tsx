import { useMemo, useState } from 'react'
import { useAllAlbumsQuery } from '../../api/albums'
import type { Album } from '../../types/albums'
import { ALBUMS_PER_TURN } from '../config'
import { MuseumTowerChunk } from './MuseumTower'

type MuseumTowerWorldProps = {
  currentChunkIndex: number
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

function shuffleWithSeed(items: Album[], seed: number): Album[] {
  const random = mulberry32(seed)
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

function positiveModulo(value: number, modulo: number): number {
  return ((value % modulo) + modulo) % modulo
}

function albumsForTurn(allAlbums: Album[], turnIndex: number): Album[] {
  if (allAlbums.length === 0) return []
  const start = positiveModulo(turnIndex * ALBUMS_PER_TURN, allAlbums.length)
  return Array.from({ length: ALBUMS_PER_TURN }, (_, offset) => {
    const albumIndex = (start + offset) % allAlbums.length
    return allAlbums[albumIndex]
  })
}

export function MuseumTowerWorld({ currentChunkIndex }: MuseumTowerWorldProps) {
  const [sessionSeed] = useState(() =>
    Math.floor(Math.random() * 1_000_000_000)
  )
  const { data: allAlbums, isLoading } = useAllAlbumsQuery()

  const shuffledAlbums = useMemo(() => {
    if (!allAlbums || allAlbums.length === 0) return []
    return shuffleWithSeed(allAlbums, sessionSeed)
  }, [allAlbums, sessionSeed])

  const activeTurns = useMemo(
    () => [currentChunkIndex - 1, currentChunkIndex, currentChunkIndex + 1],
    [currentChunkIndex]
  )

  const layoutSeed = sessionSeed

  return (
    <>
      {activeTurns.map((turnIndex) => (
        <MuseumTowerChunk
          key={`${layoutSeed}-${turnIndex}`}
          chunkIndex={turnIndex}
          albums={isLoading ? [] : albumsForTurn(shuffledAlbums, turnIndex)}
        />
      ))}
    </>
  )
}
