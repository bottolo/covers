/** Corridor inner playable box: symmetric along Z; inner width along X. */
export const CORRIDOR_INNER_WIDTH = 4
export const CORRIDOR_LENGTH = 24
export const WALL_HEIGHT = 4
export const WALL_THICKNESS = 0.15
export const FLOOR_THICKNESS = 0.2

/** Capsule collider uses Rapier convention: args = [halfHeight, radius]. */
export const PLAYER_CAPSULE_HALF_HEIGHT = 0.55
export const PLAYER_RADIUS = 0.35

/** Standing: bottom of capsule on y=0 → rigid-body Y = halfHeight + radius. */
export function playerSpawnHeight(): number {
  return PLAYER_CAPSULE_HALF_HEIGHT + PLAYER_RADIUS
}

/** Camera height from ground (m); local Y on the rigid body is this minus spawn height. */
export const PLAYER_EYE_HEIGHT = 1.62

export function playerCameraLocalY(): number {
  return PLAYER_EYE_HEIGHT - playerSpawnHeight()
}

/** Near the back wall inside the corridor, facing +Z. */
export function playerSpawnPosition(): [number, number, number] {
  const hz = CORRIDOR_LENGTH / 2 + WALL_THICKNESS
  const margin = 0.75
  const z = -hz + WALL_THICKNESS + PLAYER_RADIUS + margin
  return [0, playerSpawnHeight(), z]
}

/** Initial yaw (rad): rotate from default -Z forward so the player looks down +Z. */
export const PLAYER_INITIAL_YAW = Math.PI

export const MOVE_SPEED = 6
export const MOUSE_SENSITIVITY = 0.0022
export const MAX_PITCH = Math.PI / 2 - 0.05

/** Half extents helpers for outer shell (includes wall thickness). */
export function corridorOuterHalfWidth(): number {
  return CORRIDOR_INNER_WIDTH / 2 + WALL_THICKNESS
}

export function corridorOuterHalfLength(): number {
  return CORRIDOR_LENGTH / 2 + WALL_THICKNESS
}
