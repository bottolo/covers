import { useState } from 'react'
import { useAlbumsQuery } from '../api/albums'

const initialLimit = 20

export function AlbumsDebugBox() {
  const [isCollapsed, setIsCollapsed] = useState(true)
  const { data, isLoading, isError, error, refetch, isFetching } = useAlbumsQuery({
    limit: initialLimit,
    cursor: null,
  })

  if (isCollapsed) {
    return (
      <aside className="absolute left-4 top-16 z-20">
        <button
          type="button"
          onClick={() => setIsCollapsed(false)}
          aria-expanded="false"
          className="rounded-full border border-neutral-300 bg-white/90 px-3 py-1.5 text-xs font-medium text-neutral-900 shadow-lg backdrop-blur-sm hover:bg-neutral-100 dark:border-neutral-600 dark:bg-neutral-900/80 dark:text-neutral-100 dark:hover:bg-neutral-800"
        >
          Open Albums Debug
        </button>
      </aside>
    )
  }

  return (
    <aside className="absolute left-4 top-16 z-20 w-[min(92vw,520px)]">
      <div className="rounded-lg border border-neutral-200 bg-white/90 p-2 text-sm text-neutral-900 shadow-lg backdrop-blur-sm dark:border-neutral-700 dark:bg-neutral-900/80 dark:text-neutral-100">
        <div className="flex items-center justify-between">
          <h2 className="text-sm font-semibold">Albums</h2>
          <div className="flex items-center gap-2">
            {!isCollapsed && (
              <button
                type="button"
                onClick={() => void refetch()}
                className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
              >
                {isFetching ? 'Refreshing...' : 'Refresh'}
              </button>
            )}
            <button
              type="button"
              onClick={() => setIsCollapsed((current) => !current)}
              aria-expanded={!isCollapsed}
              className="rounded border border-neutral-300 px-2 py-1 text-xs hover:bg-neutral-100 dark:border-neutral-600 dark:hover:bg-neutral-800"
            >
              Collapse
            </button>
          </div>
        </div>

        <div className="mt-2">
          {isLoading && <p>Loading albums...</p>}
          {isError && <p className="text-red-600 dark:text-red-400">{error.message}</p>}
          {!isLoading && !isError && (
            <div className="space-y-2">
              <p>
                {data?.items.length ?? 0} album(s) loaded. Next cursor: {data?.nextCursor ?? 'none'}
              </p>
              <ul className="max-h-56 space-y-1 overflow-auto pr-1 text-xs">
                {data?.items.map((album) => (
                  <li
                    key={album.id}
                    className="rounded border border-neutral-200 p-2 dark:border-neutral-700"
                  >
                    <p className="font-medium">{album.name}</p>
                    <p className="text-neutral-600 dark:text-neutral-300">
                      {album.year ?? 'Unknown year'} - {album.artists.join(', ')}
                    </p>
                  </li>
                ))}
              </ul>
            </div>
          )}
        </div>
      </div>
    </aside>
  )
}
