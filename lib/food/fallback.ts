import type { FridgeCategory, QuantityUnit } from "@/lib/types/api"

export interface FoodFallbackItem {
  name: string
  category: FridgeCategory
  subCategory: string
  defaultUnit: QuantityUnit
  defaultShelfLifeDays?: number
}

export const FOOD_FALLBACK_DICTIONARY: FoodFallbackItem[] = [
  { name: "계란", category: "processed", subCategory: "계란", defaultUnit: "count", defaultShelfLifeDays: 21 },
  { name: "닭가슴살", category: "meat", subCategory: "닭고기", defaultUnit: "g", defaultShelfLifeDays: 3 },
  { name: "소고기", category: "meat", subCategory: "소고기", defaultUnit: "g", defaultShelfLifeDays: 3 },
  { name: "돼지고기", category: "meat", subCategory: "돼지고기", defaultUnit: "g", defaultShelfLifeDays: 3 },
  { name: "삼겹살", category: "meat", subCategory: "삼겹살", defaultUnit: "g", defaultShelfLifeDays: 3 },
  { name: "연어", category: "seafood", subCategory: "연어", defaultUnit: "g", defaultShelfLifeDays: 2 },
  { name: "새우", category: "seafood", subCategory: "새우", defaultUnit: "g", defaultShelfLifeDays: 2 },
  { name: "양파", category: "vegetable", subCategory: "양파", defaultUnit: "count", defaultShelfLifeDays: 21 },
  { name: "마늘", category: "vegetable", subCategory: "마늘", defaultUnit: "count", defaultShelfLifeDays: 30 },
  { name: "대파", category: "vegetable", subCategory: "대파", defaultUnit: "count", defaultShelfLifeDays: 10 },
  { name: "파", category: "vegetable", subCategory: "파", defaultUnit: "count", defaultShelfLifeDays: 7 },
  { name: "두부", category: "processed", subCategory: "두부", defaultUnit: "pack", defaultShelfLifeDays: 7 },
  { name: "김치", category: "processed", subCategory: "김치", defaultUnit: "g", defaultShelfLifeDays: 30 },
  { name: "간장", category: "seasoning", subCategory: "간장", defaultUnit: "ml", defaultShelfLifeDays: 180 },
  { name: "고추장", category: "seasoning", subCategory: "고추장", defaultUnit: "g", defaultShelfLifeDays: 180 },
]

const normalize = (value: string) => value.trim().toLowerCase()

export const searchFallbackFoods = (q: string) => {
  const keyword = normalize(q)
  if (!keyword) return []

  const dedup = new Map<string, FoodFallbackItem>()
  for (const item of FOOD_FALLBACK_DICTIONARY) {
    const normalized = normalize(item.name)
    if (!normalized.includes(keyword)) continue
    if (!dedup.has(item.name)) {
      dedup.set(item.name, item)
    }
  }

  return [...dedup.values()]
    .sort((a, b) => {
      const ap = normalize(a.name).startsWith(keyword) ? 0 : 1
      const bp = normalize(b.name).startsWith(keyword) ? 0 : 1
      if (ap !== bp) return ap - bp
      return a.name.localeCompare(b.name, "ko")
    })
    .slice(0, 10)
}

export const inferFallbackFood = (name: string): FoodFallbackItem | null => {
  const keyword = normalize(name)
  if (!keyword) return null

  const exact = FOOD_FALLBACK_DICTIONARY.find((item) => normalize(item.name) === keyword)
  if (exact) return exact

  const prefix = FOOD_FALLBACK_DICTIONARY.find((item) => normalize(item.name).startsWith(keyword))
  if (prefix) return prefix

  const includes = FOOD_FALLBACK_DICTIONARY.find((item) => normalize(item.name).includes(keyword))
  return includes ?? null
}
