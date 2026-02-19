import { NextResponse } from "next/server"
import { searchFoodCatalogItems, upsertFoodCatalogItems } from "@/lib/firebase"
import { fetchMfdsFoodsByQuery } from "@/lib/food/catalog"
import { searchFallbackFoods } from "@/lib/food/fallback"
import type { FoodSearchResponse } from "@/lib/types/api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim() ?? ""

  if (!q) {
    const empty: FoodSearchResponse = { items: [] }
    return NextResponse.json(empty)
  }

  const cached = await searchFoodCatalogItems(q, 10)
  if (!cached.error && cached.data.length > 0) {
    return NextResponse.json({ items: cached.data })
  }

  const mfdsItems = await fetchMfdsFoodsByQuery(q)
  if (mfdsItems.length > 0) {
    await upsertFoodCatalogItems(mfdsItems)
    return NextResponse.json({ items: mfdsItems })
  }

  const fallbackItems = searchFallbackFoods(q).map((item) => ({
    name: item.name,
    displayName: item.subCategory ?? item.name,
    state: null,
    category: item.category,
    subCategory: item.subCategory,
    defaultUnit: item.defaultUnit,
    source: "fallback" as const,
  }))

  if (fallbackItems.length > 0) {
    await upsertFoodCatalogItems(fallbackItems)
  }

  const response: FoodSearchResponse = { items: fallbackItems }
  return NextResponse.json(response)
}
