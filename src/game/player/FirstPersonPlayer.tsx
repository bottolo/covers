import { useFrame, useThree } from '@react-three/fiber'
import {
  CapsuleCollider,
  Physics,
  RapierRigidBody,
  RigidBody,
} from '@react-three/rapier'
import { useEffect, useLayoutEffect, useMemo, useRef } from 'react'
import type { PerspectiveCamera as PerspectiveCameraType } from 'three'
import { Group, Vector3 } from 'three'
import {
  MOVE_SPEED,
  PLAYER_CAPSULE_HALF_HEIGHT,
  PLAYER_INITIAL_YAW,
  PLAYER_RADIUS,
  playerCameraLocalY,
  playerSpawnPosition,
} from '../config'
import { useFirstPersonControls } from './useFirstPersonControls'

const _move = new Vector3()
const _forward = new Vector3()
const _right = new Vector3()

export function FirstPersonPlayer() {
  const body = useRef<RapierRigidBody>(null)
  const look = useRef<Group>(null)
  const cameraRef = useRef<PerspectiveCameraType>(null)
  const setThree = useThree((s) => s.set)
  const { gl } = useThree()
  const { yaw, pitch, keys, pointerLocked } = useFirstPersonControls(
    PLAYER_INITIAL_YAW
  )

  const spawn = useMemo(() => playerSpawnPosition(), [])
  const cameraLocalY = useMemo(() => playerCameraLocalY(), [])

  useLayoutEffect(() => {
    const cam = cameraRef.current
    if (cam) setThree({ camera: cam })
  }, [setThree])

  useEffect(() => {
    const canvas = gl.domElement
    const onClick = () => {
      canvas.requestPointerLock()
    }
    canvas.addEventListener('click', onClick)
    return () => canvas.removeEventListener('click', onClick)
  }, [gl])

  useFrame(() => {
    const rb = body.current
    const head = look.current
    if (!rb) return

    if (head) {
      head.rotation.order = 'YXZ'
      head.rotation.y = yaw.current
      head.rotation.x = pitch.current
      head.rotation.z = 0
    }

    _forward.set(
      -Math.sin(yaw.current),
      0,
      -Math.cos(yaw.current),
    )
    _right.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current))

    const k = keys.current
    _move.set(0, 0, 0)
    if (k.forward) _move.add(_forward)
    if (k.back) _move.sub(_forward)
    if (k.left) _move.sub(_right)
    if (k.right) _move.add(_right)

    const horizontal = pointerLocked.current
    if (_move.lengthSq() > 1e-8) {
      _move.normalize().multiplyScalar(MOVE_SPEED)
    } else {
      _move.set(0, 0, 0)
    }

    const lv = rb.linvel()
    if (horizontal) {
      rb.setLinvel({ x: _move.x, y: lv.y, z: _move.z }, true)
    } else {
      rb.setLinvel({ x: 0, y: lv.y, z: 0 }, true)
    }
  })

  const cylLen = PLAYER_CAPSULE_HALF_HEIGHT * 2

  return (
    <Physics>
    <RigidBody
      ref={body}
      position={spawn}
      colliders={false}
      enabledRotations={[false, false, false]}
      linearDamping={2.5}
      friction={1}
    >
      <CapsuleCollider
        args={[PLAYER_CAPSULE_HALF_HEIGHT, PLAYER_RADIUS]}
      />
      <mesh castShadow receiveShadow>
        <capsuleGeometry args={[PLAYER_RADIUS, cylLen, 6, 12]} />
        <meshStandardMaterial color="#c4b8a8" roughness={0.8} />
      </mesh>

      <group position={[0, cameraLocalY, 0]}>
        <group ref={look}>
          <perspectiveCamera ref={cameraRef} fov={75} near={0.06} far={200} />
          </group>
        </group>
      </RigidBody>
    </Physics>
  )
}
