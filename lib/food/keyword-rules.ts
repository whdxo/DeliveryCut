import type { FoodSearchItem } from "@/lib/types/api"

const normalize = (value: string) => value.trim().toLowerCase()

const KEYWORD_RULES: Array<{
  keywords: string[]
  result: Pick<FoodSearchItem, "category" | "defaultUnit">
}> = [
  {
    keywords: ["소고기", "쇠고기", "돼지고기", "안창살", "살치살", "등심", "채끝", "갈비", "삼겹", "목살", "사태", "양지"],
    result: { category: "meat", defaultUnit: "g" },
  },
  {
    keywords: ["호박", "양파", "대파", "마늘", "파", "감자", "당근", "버섯", "배추", "상추", "오이", "토마토"],
    result: { category: "vegetable", defaultUnit: "count" },
  },
  {
    keywords: ["간장", "진간장", "국간장", "양조간장", "고추장", "된장", "소금", "설탕", "식초", "후추", "식용유", "참기름", "들기름", "올리브유", "카놀라유"],
    result: { category: "seasoning", defaultUnit: "ml" },
  },
]

export const inferFoodByKeyword = (
  name: string
): Pick<FoodSearchItem, "category" | "subCategory" | "defaultUnit"> | null => {
  const key = normalize(name)
  if (!key) return null

  for (const rule of KEYWORD_RULES) {
    if (rule.keywords.some((keyword) => key.includes(keyword))) {
      return {
        category: rule.result.category,
        subCategory: name,
        defaultUnit: rule.result.defaultUnit,
      }
    }
  }

  return null
}

