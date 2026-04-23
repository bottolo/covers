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

/** Endless corridor chunking and album placement. */
export const ALBUMS_PER_CORRIDOR = 4
export const ACTIVE_CORRIDOR_COUNT = 3
export const INITIAL_ALBUM_PAGE_SIZE = ALBUMS_PER_CORRIDOR * ACTIVE_CORRIDOR_COUNT
export const ALBUM_PREFETCH_BUFFER = ALBUMS_PER_CORRIDOR * 2

export const PORTRAIT_WIDTH = 1
export const PORTRAIT_HEIGHT = 1
export const PORTRAIT_CENTER_Y = 1.95
export const PORTRAIT_WALL_INSET = 0.05
export const PORTRAIT_TEXT_LINE_HEIGHT = 0.17

/** Chunk index boundaries for a corridor centered at chunkIndex * CORRIDOR_LENGTH. */
export function chunkStartZ(chunkIndex: number): number {
  return chunkIndex * CORRIDOR_LENGTH - CORRIDOR_LENGTH / 2
}

export function chunkEndZ(chunkIndex: number): number {
  return chunkIndex * CORRIDOR_LENGTH + CORRIDOR_LENGTH / 2
}

export function chunkIndexFromZ(z: number): number {
  return Math.floor((z + CORRIDOR_LENGTH / 2) / CORRIDOR_LENGTH)
}

/** Half extents helpers for outer shell (includes wall thickness). */
export function corridorOuterHalfWidth(): number {
  return CORRIDOR_INNER_WIDTH / 2 + WALL_THICKNESS
}

export function corridorOuterHalfLength(): number {
  return CORRIDOR_LENGTH / 2 + WALL_THICKNESS
}
