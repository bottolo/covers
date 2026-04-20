import { CuboidCollider, Physics, RigidBody } from '@react-three/rapier'
import {
  CORRIDOR_LENGTH,
  CORRIDOR_INNER_WIDTH,
  FLOOR_THICKNESS,
  WALL_HEIGHT,
  WALL_THICKNESS,
  corridorOuterHalfLength,
  corridorOuterHalfWidth,
} from '../config'

const wallColor = '#5c6470'
const floorColor = '#3d4249'

export function Corridor() {
  const hx = corridorOuterHalfWidth()
  const hz = corridorOuterHalfLength()
  const hyFloor = FLOOR_THICKNESS / 2
  const hyWall = WALL_HEIGHT / 2
  const t = WALL_THICKNESS

  const innerHalf = CORRIDOR_INNER_WIDTH / 2
  const lenHalf = CORRIDOR_LENGTH / 2

  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <mesh position={[0, -hyFloor, 0]} receiveShadow>
          <boxGeometry args={[hx * 2, FLOOR_THICKNESS, hz * 2]} />
          <meshStandardMaterial color={floorColor} />
        </mesh>
        <CuboidCollider args={[hx, hyFloor, hz]} position={[0, -hyFloor, 0]} />
      </RigidBody>

      <RigidBody type="fixed" colliders={false}>
        <mesh position={[-innerHalf - t / 2, hyWall, 0]} castShadow receiveShadow>
          <boxGeometry args={[t, WALL_HEIGHT, hz * 2]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
        <CuboidCollider
          args={[t / 2, hyWall, hz]}
          position={[-innerHalf - t / 2, hyWall, 0]}
        />
      </RigidBody>

      <RigidBody type="fixed" colliders={false}>
        <mesh position={[innerHalf + t / 2, hyWall, 0]} castShadow receiveShadow>
          <boxGeometry args={[t, WALL_HEIGHT, hz * 2]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
        <CuboidCollider
          args={[t / 2, hyWall, hz]}
          position={[innerHalf + t / 2, hyWall, 0]}
        />
      </RigidBody>

      <RigidBody type="fixed" colliders={false}>
        <mesh position={[0, hyWall, -lenHalf - t / 2]} castShadow receiveShadow>
          <boxGeometry args={[hx * 2, WALL_HEIGHT, t]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
        <CuboidCollider
          args={[hx, hyWall, t / 2]}
          position={[0, hyWall, -lenHalf - t / 2]}
        />
      </RigidBody>

      <RigidBody type="fixed" colliders={false}>
        <mesh position={[0, hyWall, lenHalf + t / 2]} castShadow receiveShadow>
          <boxGeometry args={[hx * 2, WALL_HEIGHT, t]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
        <CuboidCollider
          args={[hx, hyWall, t / 2]}
          position={[0, hyWall, lenHalf + t / 2]}
        />
      </RigidBody>
    </>
  )
}
