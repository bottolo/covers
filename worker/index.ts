interface AlbumRow {
  id: number
  name: string
  year: number | null
  artists: string
  cover_url: string
  urls: string
  metadata: string
  created_at: string
  updated_at: string
}

interface Album {
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

function parseJsonValue<T>(value: string, fallback: T): T {
  try {
    const parsed = JSON.parse(value)
    return parsed as T
  } catch {
    return fallback
  }
}

function toAlbum(row: AlbumRow): Album {
  return {
    id: row.id,
    name: row.name,
    year: row.year,
    artists: parseJsonValue<string[]>(row.artists, []),
    coverUrl: row.cover_url,
    urls: parseJsonValue<Record<string, string>>(row.urls, {}),
    metadata: parseJsonValue<Record<string, unknown>>(row.metadata, {}),
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  }
}

function parseLimit(value: string | null): number {
  const parsed = Number.parseInt(value ?? '', 10)
  if (Number.isNaN(parsed)) return 20
  return Math.min(Math.max(parsed, 1), 100)
}

function parseCursor(value: string | null): number | null {
  if (!value) return null
  const parsed = Number.parseInt(value, 10)
  return Number.isNaN(parsed) ? null : parsed
}

function fallbackCoverSvg(): string {
  return `<svg xmlns="http://www.w3.org/2000/svg" width="512" height="512"><rect width="100%" height="100%" fill="#1f2937"/><text x="50%" y="50%" dominant-baseline="middle" text-anchor="middle" font-size="36" fill="#d1d5db" font-family="Arial, sans-serif">Cover unavailable</text></svg>`
}

async function handleCoverProxy(requestUrl: URL): Promise<Response> {
  const source = requestUrl.searchParams.get('url')
  if (!source) {
    return new Response('Missing url query parameter', { status: 400 })
  }

  let remoteUrl: URL
  try {
    remoteUrl = new URL(source)
  } catch {
    return new Response('Invalid cover URL', { status: 400 })
  }

  if (!['http:', 'https:'].includes(remoteUrl.protocol)) {
    return new Response('Unsupported protocol', { status: 400 })
  }

  try {
    const proxied = await fetch(remoteUrl.toString(), {
      headers: {
        'user-agent': 'covers-worker/1.0',
      },
      redirect: 'follow',
    })

    if (!proxied.ok || !proxied.body) {
      return new Response(fallbackCoverSvg(), {
        headers: {
          'content-type': 'image/svg+xml; charset=utf-8',
          'cache-control': 'public, max-age=300',
        },
      })
    }

    const headers = new Headers()
    headers.set(
      'content-type',
      proxied.headers.get('content-type') ?? 'application/octet-stream'
    )
    headers.set('cache-control', 'public, max-age=3600')

    return new Response(proxied.body, { headers })
  } catch {
    return new Response(fallbackCoverSvg(), {
      headers: {
        'content-type': 'image/svg+xml; charset=utf-8',
        'cache-control': 'public, max-age=300',
      },
    })
  }
}

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 })
    }

    if (url.pathname === '/api/cover') {
      return handleCoverProxy(url)
    }

    if (url.pathname !== '/api/albums') {
      return new Response('Not Found', { status: 404 })
    }

    const limit = parseLimit(url.searchParams.get('limit'))
    const cursor = parseCursor(url.searchParams.get('cursor'))

    const baseSql =
      'SELECT id, name, year, artists, cover_url, urls, metadata, created_at, updated_at FROM albums'
    const sql =
      cursor === null
        ? `${baseSql} ORDER BY id DESC LIMIT ?`
        : `${baseSql} WHERE id < ? ORDER BY id DESC LIMIT ?`

    const statement =
      cursor === null ? env.DB.prepare(sql).bind(limit) : env.DB.prepare(sql).bind(cursor, limit)

    const { results = [] } = await statement.all<AlbumRow>()
    const items = results.map(toAlbum)
    const nextCursor = items.length === limit ? items.at(-1)?.id ?? null : null

    return Response.json({ items, nextCursor })
  },
} satisfies ExportedHandler<Env>
