import { NextResponse } from "next/server"
import { searchFallbackFoods } from "@/lib/food/fallback"
import type { FoodSearchResponse } from "@/lib/types/api"

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url)
  const q = searchParams.get("q")?.trim() ?? ""

  if (!q) {
    const empty: FoodSearchResponse = { items: [] }
    return NextResponse.json(empty)
  }

  // TODO: 식약처 Open API key 연결 시 외부 검색 결과를 먼저 시도
  // 현재는 내부 fallback 사전을 우선 제공
  const items = searchFallbackFoods(q).map((item) => ({
    name: item.name,
    category: item.category,
    defaultUnit: item.defaultUnit,
    source: "fallback" as const,
  }))

  const response: FoodSearchResponse = { items }
  return NextResponse.json(response)
}
