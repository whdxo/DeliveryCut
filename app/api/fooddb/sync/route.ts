import { NextResponse } from "next/server"
import { upsertFoodCatalogItems } from "@/lib/firebase"
import { buildFallbackCatalogItems } from "@/lib/food/catalog"
import { searchFallbackFoods } from "@/lib/food/fallback"
import type { ApiError, FoodSearchItem } from "@/lib/types/api"

const jsonError = (status: number, code: string, message: string) => {
  const body: ApiError = { error: { code, message } }
  return NextResponse.json(body, { status })
}

const isAuthorizedAdmin = (request: Request) => {
  const adminKey = process.env.FOODDB_SYNC_ADMIN_KEY?.trim()
  if (!adminKey) return false

  const headerKey = request.headers.get("x-admin-key")?.trim()
  if (headerKey === adminKey) return true

  const authHeader = request.headers.get("authorization")?.trim() ?? ""
  if (authHeader.toLowerCase().startsWith("bearer ")) {
    const token = authHeader.slice(7).trim()
    if (token === adminKey) return true
  }

  return false
}

const toCatalogItem = (item: { name: string; category: FoodSearchItem["category"]; subCategory?: string; defaultUnit: FoodSearchItem["defaultUnit"] }): FoodSearchItem => ({
  name: item.name,
  displayName: item.subCategory ?? item.name,
  state: null,
  category: item.category,
  subCategory: item.subCategory,
  defaultUnit: item.defaultUnit,
  source: "fallback",
})

export async function POST(request: Request) {
  if (!isAuthorizedAdmin(request)) {
    return jsonError(401, "UNAUTHORIZED", "Admin authorization is required")
  }

  let payload: unknown = null
  try {
    payload = await request.json()
  } catch {
    payload = null
  }

  const body = (payload ?? {}) as { q?: string }
  const q = typeof body.q === "string" ? body.q.trim() : ""

  const items: FoodSearchItem[] = q
    ? searchFallbackFoods(q).map(toCatalogItem)
    : buildFallbackCatalogItems()

  const { count, error } = await upsertFoodCatalogItems(items)
  return NextResponse.json({
    ok: !error,
    mode: q ? "fallback-query" : "fallback-all",
    query: q || null,
    upserted: count,
    error,
  })
}
