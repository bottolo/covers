import { Canvas } from '@react-three/fiber'
import { Suspense, useState } from 'react'
import { Physics } from '@react-three/rapier'
import { CorridorWorld } from './environment/CorridorWorld'
import { FirstPersonPlayer } from './player/FirstPersonPlayer'

export function Game() {
  const [currentChunkIndex, setCurrentChunkIndex] = useState(0)

  return (
    <Canvas className="h-full w-full touch-none" shadows gl={{ antialias: true }}>
      <fog attach="fog" args={['#ffffff', 8, 24]} />
      <ambientLight intensity={0.35} />
      <directionalLight
        castShadow
        intensity={1.25}
        position={[8, 14, 6]}
        shadow-mapSize={[2048, 2048]}
      />
      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]}>
          <CorridorWorld currentChunkIndex={currentChunkIndex} />
          <FirstPersonPlayer onChunkIndexChange={setCurrentChunkIndex} />
        </Physics>
      </Suspense>
    </Canvas>
  )
}
