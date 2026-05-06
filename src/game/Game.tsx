import { Sky } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Suspense } from 'react'
import { PCFShadowMap } from 'three'
import { CityAlbumsWorld } from './environment/CityAlbumsWorld'
import { CityScene } from './environment/CityScene'
import { FirstPersonPlayer } from './player/FirstPersonPlayer'

export function Game() {
  return (
    <Canvas
      className="h-full w-full touch-none"
      shadows={{ type: PCFShadowMap }}
      gl={{ antialias: true }}
    >
      <fog attach="fog" args={['#9bb8d6', 80, 600]} />
      <Sky sunPosition={[120, 40, 120]} turbidity={4} rayleigh={0.6} />
      <ambientLight intensity={0.45} />
      <directionalLight
        castShadow
        intensity={1.35}
        position={[14, 28, 10]}
        shadow-mapSize={[2048, 2048]}
      />
      <Suspense fallback={null}>
        <CityScene />
        <CityAlbumsWorld />
        <FirstPersonPlayer />
      </Suspense>
    </Canvas>
  )
}
