import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { Physics } from '@react-three/rapier'
import { Corridor } from './environment/Corridor'
import { FirstPersonPlayer } from './player/FirstPersonPlayer'

export function Game() {
  return (
    <Canvas className="h-full w-full touch-none" shadows gl={{ antialias: true }}>
      <ambientLight intensity={0.35} />
      <directionalLight
        castShadow
        intensity={1.25}
        position={[8, 14, 6]}
        shadow-mapSize={[2048, 2048]}
      />
      <Suspense fallback={null}>
        <Physics gravity={[0, -9.81, 0]}>
          <Corridor />
          <FirstPersonPlayer />
        </Physics>
      </Suspense>
    </Canvas>
  )
}
