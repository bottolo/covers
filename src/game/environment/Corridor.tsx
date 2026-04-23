import { CuboidCollider, RigidBody } from '@react-three/rapier'
import type { Album } from '../../types/albums'
import {
  CORRIDOR_LENGTH,
  CORRIDOR_INNER_WIDTH,
  FLOOR_THICKNESS,
  PORTRAIT_WALL_INSET,
  WALL_HEIGHT,
  WALL_THICKNESS,
  corridorOuterHalfLength,
  corridorOuterHalfWidth,
} from '../config'
import { getPortraitSlotsForChunk } from './layout'
import { Portrait } from './Portrait'

const wallColor = '#5c6470'
const floorColor = '#3d4249'

type CorridorChunkProps = {
  chunkIndex: number
  cycle: number
  albums: Album[]
  openBack: boolean
  openFront: boolean
}

export function CorridorChunk({
  chunkIndex,
  cycle,
  albums,
  openBack,
  openFront,
}: CorridorChunkProps) {
  const hx = corridorOuterHalfWidth()
  const hz = corridorOuterHalfLength()
  const hyFloor = FLOOR_THICKNESS / 2
  const hyWall = WALL_HEIGHT / 2
  const t = WALL_THICKNESS

  const innerHalf = CORRIDOR_INNER_WIDTH / 2
  const lenHalf = CORRIDOR_LENGTH / 2
  const zCenter = chunkIndex * CORRIDOR_LENGTH
  const slots = getPortraitSlotsForChunk(chunkIndex, cycle, albums.length)

  return (
    <>
      <RigidBody type="fixed" colliders={false}>
        <mesh position={[0, -hyFloor, zCenter]} receiveShadow>
          <boxGeometry args={[hx * 2, FLOOR_THICKNESS, hz * 2]} />
          <meshStandardMaterial color={floorColor} />
        </mesh>
        <CuboidCollider args={[hx, hyFloor, hz]} position={[0, -hyFloor, zCenter]} />
      </RigidBody>

      <RigidBody type="fixed" colliders={false}>
        <mesh position={[-innerHalf - t / 2, hyWall, zCenter]} castShadow receiveShadow>
          <boxGeometry args={[t, WALL_HEIGHT, hz * 2]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
        <CuboidCollider
          args={[t / 2, hyWall, hz]}
          position={[-innerHalf - t / 2, hyWall, zCenter]}
        />
      </RigidBody>

      <RigidBody type="fixed" colliders={false}>
        <mesh position={[innerHalf + t / 2, hyWall, zCenter]} castShadow receiveShadow>
          <boxGeometry args={[t, WALL_HEIGHT, hz * 2]} />
          <meshStandardMaterial color={wallColor} />
        </mesh>
        <CuboidCollider
          args={[t / 2, hyWall, hz]}
          position={[innerHalf + t / 2, hyWall, zCenter]}
        />
      </RigidBody>

      {!openBack && (
        <RigidBody type="fixed" colliders={false}>
          <mesh position={[0, hyWall, zCenter - lenHalf - t / 2]} castShadow receiveShadow>
            <boxGeometry args={[hx * 2, WALL_HEIGHT, t]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
          <CuboidCollider
            args={[hx, hyWall, t / 2]}
            position={[0, hyWall, zCenter - lenHalf - t / 2]}
          />
        </RigidBody>
      )}

      {!openFront && (
        <RigidBody type="fixed" colliders={false}>
          <mesh position={[0, hyWall, zCenter + lenHalf + t / 2]} castShadow receiveShadow>
            <boxGeometry args={[hx * 2, WALL_HEIGHT, t]} />
            <meshStandardMaterial color={wallColor} />
          </mesh>
          <CuboidCollider
            args={[hx, hyWall, t / 2]}
            position={[0, hyWall, zCenter + lenHalf + t / 2]}
          />
        </RigidBody>
      )}

      {albums.map((album, index) => {
        const slot = slots[index]
        if (!slot) return null

        const x =
          slot.side === 'left'
            ? -innerHalf + PORTRAIT_WALL_INSET
            : innerHalf - PORTRAIT_WALL_INSET
        const rotationY = slot.side === 'left' ? Math.PI / 2 : -Math.PI / 2

        return (
          <Portrait
            key={`${chunkIndex}-${slot.id}-${album.id}`}
            album={album}
            position={[x, slot.y, zCenter + slot.z]}
            rotation={[0, rotationY, 0]}
          />
        )
      })}
    </>
  )
}

export function Corridor() {
  return (
    <CorridorChunk
      chunkIndex={0}
      cycle={0}
      albums={[]}
      openBack={false}
      openFront={false}
    />
  )
}
