import { Html, Image, Text } from '@react-three/drei'
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
  const linkEntries = Object.entries(album.urls).filter(
    (entry): entry is [string, string] => typeof entry[1] === 'string' && entry[1].length > 0
  )

  return (
    <group position={position} rotation={rotation}>
      <mesh position={[0, 0, -0.01]} receiveShadow>
        <planeGeometry args={[PORTRAIT_WIDTH + 0.08, PORTRAIT_HEIGHT + 0.08]} />
        <meshStandardMaterial color="#121212" roughness={0.9} side={DoubleSide} />
      </mesh>

      <Image
        url={proxiedCoverUrl}
        toneMapped={false}
        scale={[PORTRAIT_WIDTH, PORTRAIT_HEIGHT]}
      />

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

      {linkEntries.length > 0 && (
        <Html
          transform
          center
          distanceFactor={9}
          position={[0, -PORTRAIT_HEIGHT / 2 - 0.5, 0.03]}
        >
          <div className="pointer-events-auto min-w-[120px] rounded bg-black/65 px-2 py-1 text-center text-[10px] text-white">
            <div className="mb-0.5 text-[10px] font-semibold text-neutral-100">Links</div>
            <div className="flex flex-wrap items-center justify-center gap-1">
              {linkEntries.map(([label, href]) => (
                <a
                  key={label}
                  href={href}
                  target="_blank"
                  rel="noreferrer"
                  className="rounded border border-white/20 px-1.5 py-0.5 text-[9px] text-sky-300 hover:bg-white/10"
                >
                  {label}
                </a>
              ))}
            </div>
          </div>
        </Html>
      )}
    </group>
  )
}
