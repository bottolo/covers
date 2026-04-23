import { useInfiniteQuery, useQuery } from '@tanstack/react-query'
import type { Album, AlbumsQueryParams, AlbumsResponse } from '../types/albums'

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

export const infiniteAlbumsQueryKey = (limit: number, cycle: number) =>
  ['albums', 'infinite', { limit, cycle }] as const

export function useInfiniteAlbumsQuery(options: { limit: number; cycle: number }) {
  return useInfiniteQuery({
    queryKey: infiniteAlbumsQueryKey(options.limit, options.cycle),
    queryFn: ({ pageParam }) =>
      fetchAlbums({
        limit: options.limit,
        cursor: (pageParam as number | null | undefined) ?? null,
      }),
    initialPageParam: null as number | null,
    getNextPageParam: (lastPage) => lastPage.nextCursor ?? undefined,
  })
}

export function flattenAlbumPages(pages?: AlbumsResponse[]): AlbumsResponse['items'] {
  if (!pages) return []
  return pages.flatMap((page) => page.items)
}

export async function fetchAllAlbums(batchSize = 100): Promise<Album[]> {
  const all: Album[] = []
  let cursor: number | null = null

  while (true) {
    const page = await fetchAlbums({ limit: batchSize, cursor })
    all.push(...page.items)

    if (page.nextCursor === null) {
      return all
    }
    cursor = page.nextCursor
  }
}

export function useAllAlbumsQuery(batchSize = 100) {
  return useQuery({
    queryKey: ['albums', 'all', batchSize] as const,
    queryFn: () => fetchAllAlbums(batchSize),
    staleTime: Number.POSITIVE_INFINITY,
    gcTime: Number.POSITIVE_INFINITY,
  })
}
