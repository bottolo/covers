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

export default {
  async fetch(request, env) {
    const url = new URL(request.url)

    if (url.pathname !== '/api/albums') {
      return new Response('Not Found', { status: 404 })
    }

    if (request.method !== 'GET') {
      return new Response('Method Not Allowed', { status: 405 })
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
