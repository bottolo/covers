/** Museum tower spiral (one GLB turn); ramp midline and album wall placement. */
export const TOWER_RAMP_INNER_RADIUS = 1.259
export const TOWER_RAMP_OUTER_RADIUS = 7.515
export const TOWER_RAMP_MID_RADIUS =
  (TOWER_RAMP_INNER_RADIUS + TOWER_RAMP_OUTER_RADIUS) / 2
export const TOWER_RISE_PER_TURN = 4
export const TOWER_SEGMENTS_PER_TURN = 16
export const TOWER_PANEL_RADIUS =
  (TOWER_RAMP_INNER_RADIUS + TOWER_RAMP_OUTER_RADIUS) / 2
export const TOWER_PANEL_LIFT = 0.14

export const TWO_PI = Math.PI * 2

/** Vertical rise per radian of arc along the helix. */
export const TOWER_RISE_PER_RADIAN = TOWER_RISE_PER_TURN / TWO_PI

/** Endless tower chunking and album placement. */
export const ALBUMS_PER_TURN = 8
export const ACTIVE_TURN_COUNT = 3
export const INITIAL_ALBUM_PAGE_SIZE = ALBUMS_PER_TURN * ACTIVE_TURN_COUNT
export const ALBUM_PREFETCH_BUFFER = ALBUMS_PER_TURN * 2

/** Capsule mesh (visual only; no physics). */
export const PLAYER_CAPSULE_HALF_HEIGHT = 0.55
export const PLAYER_RADIUS = 0.35

/** Camera height above ramp (feet at helix Y). */
export const PLAYER_EYE_HEIGHT = 1.62

/** Helix arc at spawn (rad); θ = 0 → midline on +X, ramp Y = 0. */
export const PLAYER_SPAWN_ARC = 0

/** Initial yaw offset for mouse look (see FirstPersonPlayer + helix base yaw). */
export const PLAYER_INITIAL_YAW = Math.PI

export const MOVE_SPEED = 6
export const STRAFE_SPEED = 1.5
export const MOUSE_SENSITIVITY = 0.0022
export const MAX_PITCH = Math.PI / 2 - 0.05

/** City backdrop sits below the floating tower. */
export const CITY_Y_OFFSET = 0
export const ALBUMS_PER_CITY = 24
export const CITY_STREET_EXTENT = 1200
export const CITY_STREET_SPACING = 120
export const CITY_ALBUM_BASE_Y = 1.1
export const CITY_ALBUM_FLOAT_AMPLITUDE = 0.45
export const CITY_ALBUM_FLOAT_SPEED = 0.9

export const PORTRAIT_WIDTH = 1
export const PORTRAIT_HEIGHT = 1
export const PORTRAIT_CENTER_Y = 1.95
export const PORTRAIT_WALL_INSET = 0.05
export const PORTRAIT_TEXT_LINE_HEIGHT = 0.17

export function chunkIndexFromArc(arcRadians: number): number {
  return Math.floor(arcRadians / TWO_PI)
}

/** Feet position on the helix at arc `s` (rad) and radius `r` from Y axis. */
export function helixFeetPosition(
  arcRadians: number,
  radius: number
): [number, number, number] {
  const y = (arcRadians / TWO_PI) * TOWER_RISE_PER_TURN
  return [
    radius * Math.cos(arcRadians),
    y,
    radius * Math.sin(arcRadians),
  ]
}

/** World-space yaw (rad) so local -Z aligns with horizontal tangent (climb direction). */
export function helixBaseYaw(arcRadians: number): number {
  return Math.atan2(Math.sin(arcRadians), -Math.cos(arcRadians))
}

/** |d/ds (r cos s, y(s), r sin s)| for constant r — path length per radian of arc. */
export function helixPathDerivativeLength(radius: number): number {
  return Math.sqrt(radius * radius + TOWER_RISE_PER_RADIAN * TOWER_RISE_PER_RADIAN)
}
