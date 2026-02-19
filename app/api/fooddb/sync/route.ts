import { NextResponse } from "next/server"
import { upsertFoodCatalogItems } from "@/lib/firebase"
import { buildFallbackCatalogItems, fetchMfdsFoodsByQuery } from "@/lib/food/catalog"

export async function POST(request: Request) {
  let payload: unknown = null
  try {
    payload = await request.json()
  } catch {
    payload = null
  }

  const body = (payload ?? {}) as { q?: string }
  const q = typeof body.q === "string" ? body.q.trim() : ""

  if (q) {
    const mfdsItems = await fetchMfdsFoodsByQuery(q)
    const { count, error } = await upsertFoodCatalogItems(mfdsItems)
    return NextResponse.json({ ok: !error, mode: "mfds", query: q, fetched: mfdsItems.length, upserted: count, error })
  }

  const fallbackItems = buildFallbackCatalogItems()
  const { count, error } = await upsertFoodCatalogItems(fallbackItems)
  return NextResponse.json({ ok: !error, mode: "fallback", upserted: count, error })
}
