import { Sky } from '@react-three/drei'
import { Canvas } from '@react-three/fiber'
import { Physics } from '@react-three/rapier'
import { Suspense, useCallback, useState } from 'react'
import { PCFShadowMap } from 'three'
import { AlbumLineMap } from '../components/AlbumLineMap'
import { WORLD_GRAVITY } from './config'
import {
  CityAlbumsWorld,
  type AlbumWorldPoint,
} from './environment/CityAlbumsWorld'
import { CityScene } from './environment/CityScene'
import { FirstPersonPlayer, type PlayerPose } from './player/FirstPersonPlayer'

export function Game() {
  const [playerPose, setPlayerPose] = useState<PlayerPose | null>(null)
  const [albumPoints, setAlbumPoints] = useState<AlbumWorldPoint[]>([])

  const handlePoseChange = useCallback((pose: PlayerPose) => {
    setPlayerPose(pose)
  }, [])

  const handlePointsChange = useCallback((points: AlbumWorldPoint[]) => {
    setAlbumPoints(points)
  }, [])

  return (
    <>
      <Canvas
        className="h-full w-full touch-none"
        shadows={{ type: PCFShadowMap }}
        gl={{ antialias: true }}
      >
        <fog attach="fog" args={['#a8bfd8', 520, 3200]} />
        <Sky sunPosition={[120, 40, 120]} turbidity={4} rayleigh={0.6} />
        <ambientLight intensity={0.45} />
        <directionalLight
          castShadow
          intensity={1.35}
          position={[14, 28, 10]}
          shadow-mapSize={[2048, 2048]}
        />
        <Suspense fallback={null}>
          <Physics gravity={[0, -WORLD_GRAVITY, 0]}>
            <CityScene />
            <CityAlbumsWorld onPointsChange={handlePointsChange} />
            <FirstPersonPlayer onPoseChange={handlePoseChange} />
          </Physics>
        </Suspense>
      </Canvas>
      <AlbumLineMap playerPose={playerPose} albumPoints={albumPoints} />
    </>
  )
}
