import type { FridgeCategory, QuantityUnit } from "@/lib/types/api"

export const FRIDGE_CATEGORIES: { value: FridgeCategory; label: string }[] = [
  { value: "meat", label: "육류" },
  { value: "seafood", label: "해산물" },
  { value: "vegetable", label: "채소" },
  { value: "processed", label: "가공식품" },
  { value: "seasoning", label: "조미료" },
  { value: "other", label: "기타" },
]

export const QUANTITY_UNITS: { value: QuantityUnit; label: string }[] = [
  { value: "count", label: "개" },
  { value: "g", label: "g" },
  { value: "kg", label: "kg" },
  { value: "ml", label: "ml" },
  { value: "l", label: "L" },
  { value: "pack", label: "팩" },
  { value: "tbsp", label: "큰술" },
  { value: "tsp", label: "작은술" },
]

export const categoryLabel = (category: FridgeCategory) => {
  return FRIDGE_CATEGORIES.find((item) => item.value === category)?.label ?? "기타"
}

export const unitLabel = (unit: QuantityUnit) => {
  return QUANTITY_UNITS.find((item) => item.value === unit)?.label ?? unit
}
