import { useEffect, useState } from 'react'
import { useQuery } from '@tanstack/react-query'
import { Game } from './game/Game'

function PointerLockHint() {
  const [locked, setLocked] = useState(false)

  useEffect(() => {
    const sync = () => setLocked(document.pointerLockElement !== null)
    sync()
    document.addEventListener('pointerlockchange', sync)
    return () => document.removeEventListener('pointerlockchange', sync)
  }, [])

  if (locked) return null

  return (
    <div
      className="pointer-events-none absolute bottom-[12%] left-1/2 z-10 max-w-[min(92vw,420px)] -translate-x-1/2 rounded-lg border border-neutral-200 bg-white/80 px-3.5 py-2.5 text-center text-[15px] text-neutral-900 shadow-lg ring-1 ring-black/5 dark:border-neutral-700 dark:bg-neutral-900/70 dark:text-neutral-100 dark:shadow-xl dark:ring-white/10"
      aria-live="polite"
    >
      Click the scene to capture the pointer — WASD to move, mouse to look.
    </div>
  )
}

type Album = {
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

type AlbumsResponse = {
  items: Album[]
  nextCursor: number | null
}

const initialLimit = 20

async function fetchAlbums({ limit, cursor }: { limit: number; cursor: number | null }) {
  const searchParams = new URLSearchParams({ limit: String(limit) })
  if (cursor !== null) {
    searchParams.set('cursor', String(cursor))
  }

  const response = await fetch(`/api/albums?${searchParams.toString()}`)
  if (!response.ok) {
    throw new Error(`Failed to fetch albums (${response.status})`)
  }

  return (await response.json()) as AlbumsResponse
}

function AlbumsDebugBox() {
  const { data, isLoading, isError, error, refetch, isFetching } = useQuery({
    queryKey: ['albums', { limit: initialLimit, cursor: null }],
    queryFn: () => fetchAlbums({ limit: initialLimit, cursor: null }),
  })

  return (
    <aside className="absolute left-4 top-4 z-20 w-[min(92vw,520px)] rounded-lg border border-neutral-200 bg-white/90 p-3 text-sm text-neutral-900 shadow-lg backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-100">
      <div className="mb-2 flex items-center justify-between">
        <h2 className="text-sm font-semibold">D1 albums</h2>
        <button
          type="button"
          onClick={() => void refetch()}
          className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
        >
          {isFetching ? 'Refreshing...' : 'Refresh'}
        </button>
      </div>

      {isLoading && <p>Loading albums...</p>}
      {isError && <p className="text-red-600 dark:text-red-400">{error.message}</p>}
      {!isLoading && !isError && (
        <div className="space-y-2">
          <p>
            {data?.items.length ?? 0} album(s) loaded. Next cursor:{' '}
            {data?.nextCursor ?? 'none'}
          </p>
          <ul className="max-h-56 space-y-1 overflow-auto pr-1 text-xs">
            {data?.items.map((album) => (
              <li key={album.id} className="rounded border border-neutral-200 p-2 dark:border-neutral-700">
                <p className="font-medium">{album.name}</p>
                <p className="text-neutral-600 dark:text-neutral-300">
                  {album.year ?? 'Unknown year'} - {album.artists.join(', ')}
                </p>
              </li>
            ))}
          </ul>
        </div>
      )}
    </aside>
  )
}

export default function App() {
  return (
    <div className="relative h-full min-h-0 w-full">
      <AlbumsDebugBox />
      <PointerLockHint />
      <Game />
    </div>
  )
}
