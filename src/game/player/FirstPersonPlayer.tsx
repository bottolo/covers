import { PerspectiveCamera } from '@react-three/drei'
import { useFrame, useThree } from '@react-three/fiber'
import {
  CapsuleCollider,
  RapierRigidBody,
  RigidBody,
  useRapier,
} from '@react-three/rapier'
import { useCallback, useEffect, useRef } from 'react'
import { Group, Vector3 } from 'three'
import {
  AIR_ACCEL,
  AIR_STRAFE_FACTOR,
  CHARGED_JUMP_SPEED,
  CLIMB_SPEED,
  CROUCH_SPEED,
  GROUND_ACCEL,
  JUMP_CHARGE_MAX_MS,
  JUMP_SPEED,
  MAX_PITCH,
  MOVE_SPEED,
  PLAYER_CAPSULE_HALF_HEIGHT,
  PLAYER_CROUCH_EYE_HEIGHT,
  PLAYER_EYE_HEIGHT,
  PLAYER_INITIAL_YAW,
  PLAYER_RADIUS,
  RUN_SPEED,
  CITY_STREET_EXTENT,
} from '../config'
import { getCityAlbumPoints } from '../environment/cityAlbumDebug'
import { useFirstPersonControls } from './useFirstPersonControls'

const _forward = new Vector3()
const _right = new Vector3()
const _move = new Vector3()
const INITIAL_BODY_POSITION: [number, number, number] = [
  0,
  PLAYER_CAPSULE_HALF_HEIGHT + PLAYER_RADIUS,
  0,
]
const RAYCAST_ORIGIN_Y = 220

function randomStreetCoordinate() {
  return (Math.random() * 2 - 1) * CITY_STREET_EXTENT
}

export function FirstPersonPlayer() {
  const body = useRef<RapierRigidBody>(null)
  const look = useRef<Group>(null)
  const { gl } = useThree()
  const { world, rapier } = useRapier()
  const spawnPosition = useRef({
    x: 0,
    y: PLAYER_CAPSULE_HALF_HEIGHT + PLAYER_RADIUS,
    z: 0,
  })
  const touchForward = useRef(false)
  const activeTouchId = useRef<number | null>(null)
  const touchLastX = useRef(0)
  const touchLastY = useRef(0)
  const touchStartX = useRef(0)
  const touchStartY = useRef(0)
  const longPressTimer = useRef<number | null>(null)
  const debugCycleIndexRef = useRef(-1)
  const wasJumpPressed = useRef(false)
  const canJump = useRef(true)
  const jumpChargeMs = useRef(0)
  const spawnResolved = useRef(false)
  const spawnRetryAt = useRef(0)
  const bobPhase = useRef(0)
  const cameraLocalY = useRef(PLAYER_EYE_HEIGHT - (PLAYER_CAPSULE_HALF_HEIGHT + PLAYER_RADIUS))
  const { yaw, pitch, keys } = useFirstPersonControls(PLAYER_INITIAL_YAW)

  const resolveGroundSpawn = useCallback((x: number, z: number) => {
    const ray = new rapier.Ray(
      { x, y: RAYCAST_ORIGIN_Y, z },
      { x: 0, y: -1, z: 0 }
    )
    const hit = world.castRay(ray, 600, true)
    if (!hit) return null
    return (
      RAYCAST_ORIGIN_Y -
      hit.timeOfImpact +
      PLAYER_CAPSULE_HALF_HEIGHT +
      PLAYER_RADIUS +
      0.03
    )
  }, [rapier, world])

  const chooseValidSpawn = useCallback(() => {
    const albumPoints = getCityAlbumPoints()
    for (let i = 0; i < albumPoints.length; i += 1) {
      const [x, , z] = albumPoints[i]
      const y = resolveGroundSpawn(x, z)
      if (y !== null) return { x, y, z }
    }
    for (let i = 0; i < 40; i += 1) {
      const x = randomStreetCoordinate()
      const z = randomStreetCoordinate()
      const y = resolveGroundSpawn(x, z)
      if (y !== null) return { x, y, z }
    }
    return null
  }, [resolveGroundSpawn])

  useEffect(() => {
    const rb = body.current
    if (!rb) return
    const resolved = chooseValidSpawn()
    if (!resolved) return
    spawnPosition.current = resolved
    spawnResolved.current = true
    rb.setTranslation(spawnPosition.current, true)
    rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
  }, [chooseValidSpawn])

  useEffect(() => {
    const onDebugTeleport = (event: KeyboardEvent) => {
      if (event.code !== 'KeyR') return
      const points = getCityAlbumPoints()
      if (points.length === 0) return
      debugCycleIndexRef.current =
        (debugCycleIndexRef.current + 1) % points.length
      const [x, , z] = points[debugCycleIndexRef.current]
      const rb = body.current
      if (!rb) return
      const groundY = resolveGroundSpawn(x, z)
      if (groundY === null) return
      rb.setTranslation(
        { x, y: groundY, z },
        true
      )
      rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
    }

    window.addEventListener('keydown', onDebugTeleport)
    return () => window.removeEventListener('keydown', onDebugTeleport)
  }, [resolveGroundSpawn])

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
  }, [gl, pitch, yaw])

  useFrame((_, delta) => {
    const rb = body.current
    const head = look.current
    if (!rb) return

    if (!spawnResolved.current) {
      const now = performance.now()
      if (now >= spawnRetryAt.current) {
        spawnRetryAt.current = now + 250
        const resolved = chooseValidSpawn()
        if (resolved) {
          spawnPosition.current = resolved
          spawnResolved.current = true
          rb.setTranslation(spawnPosition.current, true)
          rb.setLinvel({ x: 0, y: 0, z: 0 }, true)
        }
      }
    }

    const k = keys.current
    _forward.set(-Math.sin(yaw.current), 0, -Math.cos(yaw.current))
    _right.set(Math.cos(yaw.current), 0, -Math.sin(yaw.current))

    const forwardInput = (k.forward || touchForward.current ? 1 : 0) - (k.back ? 1 : 0)
    const strafeInput = (k.right ? 1 : 0) - (k.left ? 1 : 0)
    const hasMoveInput = forwardInput !== 0 || strafeInput !== 0

    _move
      .copy(_forward)
      .multiplyScalar(forwardInput)
      .addScaledVector(_right, strafeInput)

    const translation = rb.translation()
    const downRay = new rapier.Ray(
      { x: translation.x, y: translation.y, z: translation.z },
      { x: 0, y: -1, z: 0 }
    )
    const groundHit = world.castRay(downRay, PLAYER_CAPSULE_HALF_HEIGHT + PLAYER_RADIUS + 0.15, true)
    const grounded =
      groundHit !== null &&
      groundHit.timeOfImpact <= PLAYER_CAPSULE_HALF_HEIGHT + PLAYER_RADIUS + 0.08

    const lv = rb.linvel()
    let nextY = lv.y
    const speed = k.crouch ? CROUCH_SPEED : k.run ? RUN_SPEED : MOVE_SPEED
    const jumpChargeRatio = Math.min(1, jumpChargeMs.current / JUMP_CHARGE_MAX_MS)

    let targetX = 0
    let targetZ = 0
    if (_move.lengthSq() > 1e-8) {
      _move.normalize()
      if (!grounded) {
        // Air control keeps direction changes but reduces lateral strafe authority.
        _move
          .copy(_forward)
          .multiplyScalar(forwardInput)
          .addScaledVector(_right, strafeInput * AIR_STRAFE_FACTOR)
        if (_move.lengthSq() > 1e-8) _move.normalize()
      }
      const chargingOnGround = grounded && canJump.current && k.jump
      const chargeMoveFactor = chargingOnGround ? 0.35 : 1
      targetX = _move.x * speed * chargeMoveFactor
      targetZ = _move.z * speed * chargeMoveFactor
    }

    const jumpPressed = k.jump
    if (grounded && lv.y <= 0.15) {
      canJump.current = true
    }
    if (grounded && canJump.current && jumpPressed) {
      jumpChargeMs.current = Math.min(
        JUMP_CHARGE_MAX_MS,
        jumpChargeMs.current + delta * 1000
      )
    }
    if (
      grounded &&
      canJump.current &&
      wasJumpPressed.current &&
      !jumpPressed &&
      jumpChargeMs.current > 0
    ) {
      const t = Math.min(1, jumpChargeMs.current / JUMP_CHARGE_MAX_MS)
      nextY = JUMP_SPEED + (CHARGED_JUMP_SPEED - JUMP_SPEED) * t
      jumpChargeMs.current = 0
      canJump.current = false
    } else if (jumpPressed && !grounded && forwardInput > 0) {
      const frontRay = new rapier.Ray(
        { x: translation.x, y: translation.y + 0.1, z: translation.z },
        { x: _forward.x, y: 0, z: _forward.z }
      )
      const frontHit = world.castRay(frontRay, PLAYER_RADIUS + 0.45, true)
      if (frontHit) {
        nextY = Math.max(nextY, CLIMB_SPEED)
      }
    } else if (!jumpPressed && !grounded) {
      jumpChargeMs.current = 0
    }
    wasJumpPressed.current = jumpPressed

    const accel = grounded ? GROUND_ACCEL : AIR_ACCEL
    const blend = Math.min(1, accel * delta)
    const nextX = lv.x + (targetX - lv.x) * blend
    const nextZ = lv.z + (targetZ - lv.z) * blend
    rb.setLinvel({ x: nextX, y: nextY, z: nextZ }, true)

    if (head) {
      const horizontalSpeed = Math.hypot(nextX, nextZ)
      const speedRatio = Math.min(1, horizontalSpeed / Math.max(1, speed))
      const sprintingAnim =
        grounded && k.run && !k.crouch && hasMoveInput && !(grounded && k.jump && canJump.current)
      if (grounded && horizontalSpeed > 0.2) {
        const bobFrequency = sprintingAnim ? 15 : 9
        bobPhase.current += delta * bobFrequency
      }
      const bobAmplitude = grounded ? speedRatio : 0
      const bob = Math.sin(bobPhase.current) * bobAmplitude
      const bobPitch = bob * (sprintingAnim ? 0.02 : 0.012)
      const bobRoll =
        Math.cos(bobPhase.current * 0.5) * bobAmplitude * (sprintingAnim ? 0.03 : 0.016)

      const standingCameraHeight =
        PLAYER_EYE_HEIGHT - (PLAYER_CAPSULE_HALF_HEIGHT + PLAYER_RADIUS)
      const crouchCameraHeight =
        PLAYER_CROUCH_EYE_HEIGHT - (PLAYER_CAPSULE_HALF_HEIGHT + PLAYER_RADIUS)
      const chargedCameraHeight =
        standingCameraHeight -
        (standingCameraHeight - crouchCameraHeight) * 0.92 * jumpChargeRatio
      const targetCameraHeight = k.crouch
        ? crouchCameraHeight
        : Math.min(standingCameraHeight, chargedCameraHeight)
      cameraLocalY.current += (targetCameraHeight - cameraLocalY.current) * Math.min(1, delta * 12)

      head.rotation.order = 'YXZ'
      head.rotation.y = yaw.current
      head.rotation.x = pitch.current + bobPitch
      head.rotation.z = bobRoll
      head.position.y = cameraLocalY.current
    }
  })

  return (
    <RigidBody
      ref={body}
      colliders={false}
      enabledRotations={[false, false, false]}
      linearDamping={0.45}
      angularDamping={1.8}
      mass={1}
      position={INITIAL_BODY_POSITION}
    >
      <CapsuleCollider args={[PLAYER_CAPSULE_HALF_HEIGHT, PLAYER_RADIUS]} />

      <group>
        <group
          ref={look}
          position={[0, PLAYER_EYE_HEIGHT - (PLAYER_CAPSULE_HALF_HEIGHT + PLAYER_RADIUS), 0]}
        >
          <PerspectiveCamera makeDefault fov={75} near={0.06} far={4500} />
        </group>
      </group>
    </RigidBody>
  )
}
