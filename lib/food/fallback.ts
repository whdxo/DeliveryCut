import type { FridgeCategory, QuantityUnit } from "@/lib/types/api"

export interface FoodFallbackItem {
  name: string
  category: FridgeCategory
  defaultUnit: QuantityUnit
}

export const FOOD_FALLBACK_DICTIONARY: FoodFallbackItem[] = [
  { name: "계란", category: "processed", defaultUnit: "count" },
  { name: "닭가슴살", category: "meat", defaultUnit: "g" },
  { name: "소고기", category: "meat", defaultUnit: "g" },
  { name: "돼지고기", category: "meat", defaultUnit: "g" },
  { name: "연어", category: "seafood", defaultUnit: "g" },
  { name: "새우", category: "seafood", defaultUnit: "g" },
  { name: "양파", category: "vegetable", defaultUnit: "count" },
  { name: "대파", category: "vegetable", defaultUnit: "count" },
  { name: "파", category: "vegetable", defaultUnit: "count" },
  { name: "두부", category: "processed", defaultUnit: "pack" },
  { name: "김치", category: "processed", defaultUnit: "g" },
  { name: "간장", category: "seasoning", defaultUnit: "ml" },
  { name: "고추장", category: "seasoning", defaultUnit: "g" },
]

export const searchFallbackFoods = (q: string) => {
  const keyword = q.trim().toLowerCase()
  if (!keyword) return []

  const dedup = new Map<string, FoodFallbackItem>()
  for (const item of FOOD_FALLBACK_DICTIONARY) {
    const normalized = item.name.toLowerCase()
    if (!normalized.includes(keyword)) continue
    if (!dedup.has(item.name)) {
      dedup.set(item.name, item)
    }
  }

  return [...dedup.values()]
    .sort((a, b) => {
      const ap = a.name.startsWith(q) ? 0 : 1
      const bp = b.name.startsWith(q) ? 0 : 1
      if (ap !== bp) return ap - bp
      return a.name.localeCompare(b.name, "ko")
    })
    .slice(0, 10)
}
