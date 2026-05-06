import { PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import { useEffect, useMemo, useRef } from 'react'
import { Group, Vector3 } from 'three'
import {
  CITY_STREET_EXTENT,
  MAX_PITCH,
  NOCLIP_BASE_SPEED,
  NOCLIP_BOOST_MULTIPLIER,
  NOCLIP_VERTICAL_SPEED,
  PLAYER_CROUCH_EYE_HEIGHT,
  PLAYER_EYE_HEIGHT,
  PLAYER_INITIAL_YAW,
} from '../config'
import { getCityAlbumPoints } from '../environment/cityAlbumDebug'
import { useFirstPersonControls } from './useFirstPersonControls'

const _forward = new Vector3()
const _right = new Vector3()
const _up = new Vector3(0, 1, 0)
const _move = new Vector3()

export type PlayerPose = {
  position: [number, number, number]
  yaw: number
}

type FirstPersonPlayerProps = {
  onPoseChange?: (pose: PlayerPose) => void
}

export function FirstPersonPlayer({ onPoseChange }: FirstPersonPlayerProps) {
  const root = useRef<Group>(null)
  const look = useRef<Group>(null)
  const positionRef = useRef(new Vector3(0, PLAYER_EYE_HEIGHT + 10, 0))
  const touchForward = useRef(false)
  const activeTouchId = useRef<number | null>(null)
  const touchLastX = useRef(0)
  const touchLastY = useRef(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const longPressTimer = useRef<number | null>(null)
  const debugCycleIndexRef = useRef(-1)
  const cameraLocalY = useRef(PLAYER_EYE_HEIGHT)
  const lastPoseEmitAt = useRef(0)
  const { gl } = useThree()
  const { yaw, pitch, keys } = useFirstPersonControls(PLAYER_INITIAL_YAW)

  const maxPitch = useMemo(() => MAX_PITCH, [])

  useEffect(() => {
    positionRef.current.set(
      (Math.random() * 2 - 1) * CITY_STREET_EXTENT,
      PLAYER_EYE_HEIGHT + 10,
      (Math.random() * 2 - 1) * CITY_STREET_EXTENT
    )
  }, [])

  useEffect(() => {
    const onDebugTeleport = (event: KeyboardEvent) => {
      if (event.code !== 'KeyR') return
      const points = getCityAlbumPoints()
      if (points.length === 0) return
      debugCycleIndexRef.current =
        (debugCycleIndexRef.current + 1) % points.length
      const [x, y, z] = points[debugCycleIndexRef.current]
      positionRef.current.set(x, y + 2.8, z)
    }

    window.addEventListener('keydown', onDebugTeleport)
    return () => window.removeEventListener('keydown', onDebugTeleport)
  }, [])

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
      pitch.current = Math.max(-maxPitch, Math.min(maxPitch, pitch.current))

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
  }, [gl, maxPitch, pitch, yaw])

  useFrame((_, delta) => {
    const node = root.current
    const head = look.current
    if (!node || !head) return

    const k = keys.current
    _forward.set(-Math.sin(yaw.current), 0, -Math.cos(yaw.current))
    _right.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current))

    _move.set(0, 0, 0)
    if (k.forward || touchForward.current) _move.add(_forward)
    if (k.back) _move.sub(_forward)
    if (k.left) _move.sub(_right)
    if (k.right) _move.add(_right)
    if (k.jump) _move.add(_up)
    if (k.crouch) _move.sub(_up)

    const speedMultiplier = k.run ? NOCLIP_BOOST_MULTIPLIER : 1
    const planarSpeed = NOCLIP_BASE_SPEED * speedMultiplier
    const verticalSpeed = NOCLIP_VERTICAL_SPEED * speedMultiplier

    if (_move.lengthSq() > 1e-8) {
      const verticalInput = _move.y
      _move.y = 0
      if (_move.lengthSq() > 1e-8) {
        _move.normalize().multiplyScalar(planarSpeed)
      }
      _move.y = Math.sign(verticalInput) * Math.abs(verticalInput) * verticalSpeed
      positionRef.current.addScaledVector(_move, delta)
    }

    node.position.copy(positionRef.current)

    const targetCameraHeight = k.crouch ? PLAYER_CROUCH_EYE_HEIGHT : PLAYER_EYE_HEIGHT
    cameraLocalY.current += (targetCameraHeight - cameraLocalY.current) * Math.min(1, delta * 10)

    head.rotation.order = 'YXZ'
    head.rotation.y = yaw.current
    head.rotation.x = pitch.current
    head.rotation.z = 0
    head.position.y = cameraLocalY.current

    const now = performance.now()
    if (now - lastPoseEmitAt.current > 50) {
      lastPoseEmitAt.current = now
      onPoseChange?.({
        position: [positionRef.current.x, positionRef.current.y, positionRef.current.z],
        yaw: yaw.current,
      })
    }
  })

  return (
    <group ref={root} position={[0, PLAYER_EYE_HEIGHT + 10, 0]}>
      <group ref={look} position={[0, PLAYER_EYE_HEIGHT, 0]}>
        <PerspectiveCamera makeDefault fov={75} near={0.06} far={6000} />
      </group>
    </group>
  )
}
