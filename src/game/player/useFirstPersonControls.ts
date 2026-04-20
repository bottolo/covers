import { useEffect, useRef } from 'react'
import { MAX_PITCH, MOUSE_SENSITIVITY } from '../config'

export type FirstPersonKeys = {
  forward: boolean
  back: boolean
  left: boolean
  right: boolean
}

export function useFirstPersonControls(initialYaw: number) {
  const yaw = useRef(initialYaw)
  const pitch = useRef(0)
  const keys = useRef<FirstPersonKeys>({
    forward: false,
    back: false,
    left: false,
    right: false,
  })
  const pointerLocked = useRef(false)

  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      if (e.repeat) return
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = true
          break
        case 'KeyS':
        case 'ArrowDown':
          keys.current.back = true
          break
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = true
          break
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = true
          break
        default:
          break
      }
    }

    const onKeyUp = (e: KeyboardEvent) => {
      switch (e.code) {
        case 'KeyW':
        case 'ArrowUp':
          keys.current.forward = false
          break
        case 'KeyS':
        case 'ArrowDown':
          keys.current.back = false
          break
        case 'KeyA':
        case 'ArrowLeft':
          keys.current.left = false
          break
        case 'KeyD':
        case 'ArrowRight':
          keys.current.right = false
          break
        default:
          break
      }
    }

    window.addEventListener('keydown', onKeyDown)
    window.addEventListener('keyup', onKeyUp)
    return () => {
      window.removeEventListener('keydown', onKeyDown)
      window.removeEventListener('keyup', onKeyUp)
    }
  }, [])

  useEffect(() => {
    const onPointerLockChange = () => {
      pointerLocked.current = document.pointerLockElement !== null
    }

    onPointerLockChange()
    document.addEventListener('pointerlockchange', onPointerLockChange)
    return () =>
      document.removeEventListener('pointerlockchange', onPointerLockChange)
  }, [])

  useEffect(() => {
    const onMouseMove = (e: MouseEvent) => {
      if (!pointerLocked.current) return
      yaw.current -= e.movementX * MOUSE_SENSITIVITY
      pitch.current -= e.movementY * MOUSE_SENSITIVITY
      pitch.current = Math.max(
        -MAX_PITCH,
        Math.min(MAX_PITCH, pitch.current)
      )
    }

    document.addEventListener('mousemove', onMouseMove)
    return () => document.removeEventListener('mousemove', onMouseMove)
  }, [])

  return { yaw, pitch, keys, pointerLocked }
}
