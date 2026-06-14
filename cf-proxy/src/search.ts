import { sql, type Kysely, type RawBuilder } from "kysely"
import type { DB } from "./db/types"
import { buildSearchTokenGroups } from "./search-query"

export interface SearchQueryParams {
    q?: string
    package?: string
    subcategory_name?: string
    limit?: string
    is_basic?: string
    is_preferred?: string
    is_extended_promotional?: string
}

interface SearchRow {
    lcsc: number | null
    mfr: string | null
    package: string | null
    description: string | null
    stock: number | null
    price: string | null
    price1: number | null
    basic: number | null
    preferred: number | null
    extended_promotional: number | null
    category: string | null
    subcategory: string | null
}

const buildWhereClause = (conditions: RawBuilder<unknown>[]) =>
    conditions.length > 0 ? sql.join(conditions, sql` AND `) : sql`1 = 1`

const canFallbackToLikeSearch = (error: unknown): boolean =>
    error instanceof Error &&
    /no such table: search_index_fts/i.test(error.message)

const isMissingFtsReadinessTable = (error: unknown): boolean =>
    error instanceof Error &&
    /no such table: search_index_fts_meta/i.test(error.message)

async function isFtsSearchReady(db: Kysely<DB>): Promise<boolean> {
    try {
          const result = await sql`
                SELECT value
                      FROM search_index_fts_meta
                            WHERE key = 'ready'
                                  LIMIT 1
                                      `.execute(db)

      return (result.rows[0] a
