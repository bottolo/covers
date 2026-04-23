export type Album = {
  id: number
  name: string
  year: number | null
  artists: string[]
  coverUrl: string
  urls: Record<string, string>
  metadata: Record<string, unknown>
  createdAt: string
  updatedAt: string
}

export type AlbumsResponse = {
  items: Album[]
  nextCursor: number | null
}

export type AlbumsQueryParams = {
  limit: number
  cursor: number | null
}
