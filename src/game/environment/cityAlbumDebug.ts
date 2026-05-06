export type CityAlbumPoint = [number, number, number]

let cityAlbumPoints: CityAlbumPoint[] = []

export function setCityAlbumPoints(points: CityAlbumPoint[]) {
  cityAlbumPoints = points
}

export function getCityAlbumPoints(): CityAlbumPoint[] {
  return cityAlbumPoints
}
