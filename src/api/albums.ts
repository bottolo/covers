import { useQuery } from '@tanstack/react-query'
import type { AlbumsQueryParams, AlbumsResponse } from '../types/albums'

export const albumsQueryKey = (params: AlbumsQueryParams) => ['albums', params] as const

export async function fetchAlbums(params: AlbumsQueryParams): Promise<AlbumsResponse> {
  const searchParams = new URLSearchParams({ limit: String(params.limit) })
  if (params.cursor !== null) {
    searchParams.set('cursor', String(params.cursor))
  }

  const response = await fetch(`/api/albums?${searchParams.toString()}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch albums (${response.status})`)
  }

  return (await response.json()) as AlbumsResponse
}

export function useAlbumsQuery(params: AlbumsQueryParams) {
  return useQuery({
    queryKey: albumsQueryKey(params),
    queryFn: () => fetchAlbums(params),
  })
}
