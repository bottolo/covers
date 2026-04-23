import { CORRIDOR_LENGTH, PORTRAIT_CENTER_Y } from '../config'

export type PortraitSlot = {
  id: string
  side: 'left' | 'right'
  z: number
  y: number
}

type Anchor = {
  id: string
  side: 'left' | 'right'
  zNorm: number
}

// Sketch-inspired anchors: two to three staggered heights on each wall.
const portraitAnchors: readonly Anchor[] = [
  { id: 'left-back', side: 'left', zNorm: -0.82 },
  { id: 'left-mid', side: 'left', zNorm: -0.2 },
  { id: 'left-front', side: 'left', zNorm: 0.5 },
  { id: 'right-back', side: 'right', zNorm: -0.5 },
  { id: 'right-mid', side: 'right', zNorm: 0.2 },
  { id: 'right-front', side: 'right', zNorm: 0.82 },
] as const

function hashSeed(chunkIndex: number, cycle: number): number {
  let seed = (chunkIndex + 1) * 73856093 ^ (cycle + 1) * 19349663
  seed ^= seed >>> 16
  return seed >>> 0
}

function random01(seed: number): () => number {
  let state = seed || 1
  return () => {
    state ^= state << 13
    state ^= state >>> 17
    state ^= state << 5
    return (state >>> 0) / 4294967296
  }
}

function shuffle<T>(items: readonly T[], random: () => number): T[] {
  const copy = [...items]
  for (let i = copy.length - 1; i > 0; i -= 1) {
    const j = Math.floor(random() * (i + 1))
    ;[copy[i], copy[j]] = [copy[j], copy[i]]
  }
  return copy
}

export function getPortraitSlotsForChunk(chunkIndex: number, cycle: number, count: number): PortraitSlot[] {
  const random = random01(hashSeed(chunkIndex, cycle))
  const selectedAnchors = shuffle(portraitAnchors, random).slice(0, count)
  const zHalf = CORRIDOR_LENGTH / 2

  return selectedAnchors.map((anchor, index) => {
    const jitter = (random() - 0.5) * 0.8
    return {
      id: `${anchor.id}-${index}`,
      side: anchor.side,
      z: anchor.zNorm * (zHalf - 1) + jitter,
      y: PORTRAIT_CENTER_Y + (random() - 0.5) * 0.08,
    }
  })
}
