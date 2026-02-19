import { inferFallbackFood, FOOD_FALLBACK_DICTIONARY } from "@/lib/food/fallback"
import type { FoodSearchItem } from "@/lib/types/api"

const normalize = (value: string) => value.trim().toLowerCase()

const dedupeByName = (items: FoodSearchItem[]) => {
  const map = new Map<string, FoodSearchItem>()
  for (const item of items) {
    const key = normalize(item.name)
    if (!key) continue
    if (!map.has(key)) {
      map.set(key, item)
    }
  }
  return [...map.values()]
}

const inferCategoryByKeyword = (name: string): Pick<FoodSearchItem, "category" | "subCategory" | "defaultUnit"> | null => {
  const key = normalize(name)
  const meatKeywords = ["소고기", "쇠고기", "돼지고기", "안창살", "살치살", "등심", "채끝", "갈비", "삼겹", "목살", "사태", "양지"]
  const vegetableKeywords = ["호박", "양파", "대파", "마늘", "파", "감자", "당근", "버섯", "배추", "상추", "오이", "토마토"]
  const seasoningKeywords = ["간장", "고추장", "된장", "소금", "설탕", "식초", "후추"]

  if (meatKeywords.some((k) => key.includes(k))) {
    return { category: "meat", subCategory: name, defaultUnit: "g" }
  }

  if (vegetableKeywords.some((k) => key.includes(k))) {
    return { category: "vegetable", subCategory: name, defaultUnit: "count" }
  }

  if (seasoningKeywords.some((k) => key.includes(k))) {
    return { category: "seasoning", subCategory: name, defaultUnit: "ml" }
  }

  return null
}

export const buildFallbackCatalogItems = () => {
  return FOOD_FALLBACK_DICTIONARY.map((item) => ({
    name: item.name,
    category: item.category,
    subCategory: item.subCategory,
    defaultUnit: item.defaultUnit,
    source: "fallback" as const,
  }))
}

const extractRowsFromMfdsPayload = (payload: unknown): Record<string, unknown>[] => {
  if (!payload || typeof payload !== "object") return []
  const root = payload as Record<string, unknown>
  for (const value of Object.values(root)) {
    if (!value || typeof value !== "object") continue
    const obj = value as Record<string, unknown>
    if (Array.isArray(obj.row)) {
      return obj.row.filter((row): row is Record<string, unknown> => !!row && typeof row === "object")
    }
  }
  return []
}

const mapMfdsRowToItem = (row: Record<string, unknown>): FoodSearchItem | null => {
  const rawName = typeof row.DESC_KOR === "string" ? row.DESC_KOR.trim() : ""
  if (!rawName) return null

  const inferred = inferFallbackFood(rawName)
  const keyword = inferCategoryByKeyword(rawName)

  return {
    name: rawName,
    category: inferred?.category ?? keyword?.category ?? "other",
    subCategory: inferred?.subCategory ?? keyword?.subCategory ?? rawName,
    defaultUnit: inferred?.defaultUnit ?? keyword?.defaultUnit ?? "count",
    source: "mfds",
  }
}

export const fetchMfdsFoodsByQuery = async (q: string, timeoutMs = 8000): Promise<FoodSearchItem[]> => {
  const keyword = q.trim()
  if (!keyword) return []

  const apiKey = process.env.MFDS_OPEN_API_KEY
  const serviceId = process.env.MFDS_SERVICE_ID ?? "I2790"

  if (!apiKey) return []

  const url = `https://openapi.foodsafetykorea.go.kr/api/${apiKey}/${serviceId}/json/1/30/DESC_KOR=${encodeURIComponent(keyword)}`

  const controller = new AbortController()
  const timer = setTimeout(() => controller.abort(), timeoutMs)

  try {
    const response = await fetch(url, {
      method: "GET",
      signal: controller.signal,
      cache: "no-store",
    })

    if (!response.ok) return []

    const payload = (await response.json()) as unknown
    const rows = extractRowsFromMfdsPayload(payload)

    const mapped = rows
      .map(mapMfdsRowToItem)
      .filter((item): item is FoodSearchItem => item !== null)

    const deduped = dedupeByName(mapped)

    return deduped
      .sort((a, b) => {
        const ap = normalize(a.name).startsWith(normalize(keyword)) ? 0 : 1
        const bp = normalize(b.name).startsWith(normalize(keyword)) ? 0 : 1
        if (ap !== bp) return ap - bp
        return a.name.localeCompare(b.name, "ko")
      })
      .slice(0, 10)
  } catch {
    return []
  } finally {
    clearTimeout(timer)
  }
}
