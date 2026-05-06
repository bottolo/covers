import { useGLTF } from '@react-three/drei'
import { RigidBody } from '@react-three/rapier'
import { useLayoutEffect } from 'react'
import { Group, Mesh } from 'three'
import { CITY_Y_OFFSET } from '../config'

useGLTF.preload('/models/city_v03.glb')

export function CityScene() {
  const { scene } = useGLTF('/models/city_v03.glb') as { scene: Group }

  useLayoutEffect(() => {
    scene.traverse((child) => {
      if (child instanceof Mesh) {
        child.castShadow = false
        child.receiveShadow = false
      }
    })
  }, [scene])

  return (
    <RigidBody type="fixed" colliders="trimesh" position={[0, CITY_Y_OFFSET, 0]}>
      <primitive object={scene} />
    </RigidBody>
  )
}
