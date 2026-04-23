import { Text, useTexture } from '@react-three/drei'
import { DoubleSide } from 'three'
import type { Album } from '../../types/albums'
import {
  PORTRAIT_HEIGHT,
  PORTRAIT_TEXT_LINE_HEIGHT,
  PORTRAIT_WIDTH,
} from '../config'

type PortraitProps = {
  album: Album
  position: [number, number, number]
  rotation: [number, number, number]
}

export function Portrait({ album, position, rotation }: PortraitProps) {
  const artistsText = album.artists.join(', ')
  const yearText = album.year ?? 'Unknown year'
  const proxiedCoverUrl = `/api/cover?url=${encodeURIComponent(album.coverUrl)}`
  const coverTexture = useTexture(proxiedCoverUrl)
  const linkEntries = Object.entries(album.urls).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0
  )

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.01]} receiveShadow>
        <planeGeometry args={[PORTRAIT_WIDTH + 0.08, PORTRAIT_HEIGHT + 0.08]} />
        <meshStandardMaterial color="#121212" roughness={0.9} side={DoubleSide} />
      </mesh>

      <mesh receiveShadow castShadow>
        <planeGeometry args={[PORTRAIT_WIDTH, PORTRAIT_HEIGHT]} />
        <meshStandardMaterial
          map={coverTexture}
          side={DoubleSide}
          roughness={0.85}
          metalness={0}
        />
      </mesh>

      <Text
        color="#f5f5f5"
        anchorX="center"
        anchorY="top"
        maxWidth={PORTRAIT_WIDTH + 0.2}
        fontSize={0.12}
        position={[0, -PORTRAIT_HEIGHT / 2 - 0.1, 0.02]}
      >
        {album.name}
      </Text>
      <Text
        color="#d1d5db"
        anchorX="center"
        anchorY="top"
        maxWidth={PORTRAIT_WIDTH + 0.2}
        fontSize={0.1}
        position={[0, -PORTRAIT_HEIGHT / 2 - 0.1 - PORTRAIT_TEXT_LINE_HEIGHT, 0.02]}
      >
        {artistsText}
      </Text>
      <Text
        color="#9ca3af"
        anchorX="center"
        anchorY="top"
        maxWidth={PORTRAIT_WIDTH + 0.2}
        fontSize={0.095}
        position={[0, -PORTRAIT_HEIGHT / 2 - 0.1 - PORTRAIT_TEXT_LINE_HEIGHT * 2, 0.02]}
      >
        {String(yearText)}
      </Text>

      {linkEntries.slice(0, 2).map(([label, href], index) => (
        <Text
          key={`${label}-${href}`}
          color="#7dd3fc"
          anchorX="center"
          anchorY="top"
          maxWidth={PORTRAIT_WIDTH + 0.2}
          fontSize={0.09}
          position={[
            0,
            -PORTRAIT_HEIGHT / 2 - 0.1 - PORTRAIT_TEXT_LINE_HEIGHT * (3 + index),
            0.02,
          ]}
          onPointerDown={(event) => {
            event.stopPropagation()
            window.open(href, '_blank', 'noopener,noreferrer')
          }}
        >
          {label}
        </Text>
      ))}
    </group>
  )
}
