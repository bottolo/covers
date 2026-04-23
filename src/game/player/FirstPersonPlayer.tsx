import { PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import {
  CapsuleCollider,
  RapierRigidBody,
  RigidBody,
} from '@react-three/rapier'
import { useEffect, useMemo, useRef } from 'react'
import { Group, Vector3 } from 'three'
import {
  chunkIndexFromZ,
  MAX_PITCH,
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

type FirstPersonPlayerProps = {
  onChunkIndexChange?: (chunkIndex: number) => void
}

export function FirstPersonPlayer({ onChunkIndexChange }: FirstPersonPlayerProps) {
  const body = useRef<RapierRigidBody>(null)
  const look = useRef<Group>(null)
  const lastChunkIndex = useRef<number | null>(null)
  const touchForward = useRef(false)
  const activeTouchId = useRef<number | null>(null)
  const touchLastX = useRef(0)
  const touchLastY = useRef(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const longPressTimer = useRef<number | null>(null)
  const { gl } = useThree()
  const { yaw, pitch, keys, pointerLocked } = useFirstPersonControls(
    PLAYER_INITIAL_YAW
  )

  const spawn = useMemo(() => playerSpawnPosition(), [])
  const cameraLocalY = useMemo(() => playerCameraLocalY(), [])

  useEffect(() => {
    const canvas = gl.domElement
    const TOUCH_LONG_PRESS_MS = 280
    const TOUCH_MOVE_CANCEL_PX = 12
    const TOUCH_LOOK_SENSITIVITY = 0.0032

    const clearLongPressTimer = () => {
      if (longPressTimer.current !== null) {
        window.clearTimeout(longPressTimer.current)
        longPressTimer.current = null
      }
    }

    const findTouchById = (touches: TouchList, id: number) => {
      for (let index = 0; index < touches.length; index += 1) {
        const touch = touches.item(index)
        if (touch?.identifier === id) return touch
      }
      return null
    }

    const onClick = () => {
      canvas.requestPointerLock()
    }

    const onTouchStart = (event: TouchEvent) => {
      if (activeTouchId.current !== null) return
      const touch = event.changedTouches.item(0)
      if (!touch) return

      activeTouchId.current = touch.identifier
      touchStartX.current = touch.clientX
      touchStartY.current = touch.clientY
      touchLastX.current = touch.clientX
      touchLastY.current = touch.clientY
      touchForward.current = false

      clearLongPressTimer()
      longPressTimer.current = window.setTimeout(() => {
        touchForward.current = true
      }, TOUCH_LONG_PRESS_MS)
    }

    const onTouchMove = (event: TouchEvent) => {
      if (activeTouchId.current === null) return
      const touch = findTouchById(event.touches, activeTouchId.current)
      if (!touch) return

      const deltaX = touch.clientX - touchLastX.current
      const deltaY = touch.clientY - touchLastY.current
      touchLastX.current = touch.clientX
      touchLastY.current = touch.clientY

      yaw.current -= deltaX * TOUCH_LOOK_SENSITIVITY
      pitch.current -= deltaY * TOUCH_LOOK_SENSITIVITY
      pitch.current = Math.max(-MAX_PITCH, Math.min(MAX_PITCH, pitch.current))

      const movedDistanceX = touch.clientX - touchStartX.current
      const movedDistanceY = touch.clientY - touchStartY.current
      const movedDistance = Math.hypot(movedDistanceX, movedDistanceY)
      if (movedDistance > TOUCH_MOVE_CANCEL_PX && !touchForward.current) {
        clearLongPressTimer()
      }

      event.preventDefault()
    }

    const onTouchEndOrCancel = (event: TouchEvent) => {
      if (activeTouchId.current === null) return
      const ended = findTouchById(event.changedTouches, activeTouchId.current)
      if (!ended) return

      clearLongPressTimer()
      activeTouchId.current = null
      touchForward.current = false
    }

    canvas.addEventListener('click', onClick)
    canvas.addEventListener('touchstart', onTouchStart, { passive: true })
    canvas.addEventListener('touchmove', onTouchMove, { passive: false })
    canvas.addEventListener('touchend', onTouchEndOrCancel, { passive: true })
    canvas.addEventListener('touchcancel', onTouchEndOrCancel, { passive: true })

    return () => {
      clearLongPressTimer()
      canvas.removeEventListener('click', onClick)
      canvas.removeEventListener('touchstart', onTouchStart)
      canvas.removeEventListener('touchmove', onTouchMove)
      canvas.removeEventListener('touchend', onTouchEndOrCancel)
      canvas.removeEventListener('touchcancel', onTouchEndOrCancel)
    }
  }, [gl])

  useFrame(() => {
    const rb = body.current
    const head = look.current
    if (!rb) return

    const z = rb.translation().z
    const currentChunk = chunkIndexFromZ(z)
    if (lastChunkIndex.current !== currentChunk) {
      lastChunkIndex.current = currentChunk
      onChunkIndexChange?.(currentChunk)
    }

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
    if (touchForward.current) _move.add(_forward)

    const horizontal = pointerLocked.current || touchForward.current
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
          <PerspectiveCamera makeDefault fov={75} near={0.06} far={200} />
        </group>
      </group>
    </RigidBody>
  )
}
