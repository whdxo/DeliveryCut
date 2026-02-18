// 냉장고 카테고리 (고정 6분류 + 기타)
export type FridgeCategory = 
  | "meat"       // 육류
  | "seafood"    // 해산물
  | "vegetable"  // 채소
  | "processed"  // 가공식품
  | "seasoning"  // 조미료
  | "other"      // 기타

// 수량 단위
export type QuantityUnit = 
  | "count"  // 개
  | "g"      // 그램
  | "kg"     // 킬로그램
  | "ml"     // 밀리리터
  | "l"      // 리터
  | "pack"   // 팩
  | "tbsp"   // 큰술
  | "tsp"    // 작은술

// 냉장고 아이템
export interface FridgeItem {
  id: string
  name: string
  category: FridgeCategory
  amount: number
  unit: QuantityUnit
  expiresOn?: string  // YYYY-MM-DD
  source?: string     // 출처 (API, manual 등)
  createdAt: string
  updatedAt: string
}

// 냉장고 아이템 생성 입력
export interface FridgeCreateInput {
  name: string
  category?: FridgeCategory
  amount: number
  unit: QuantityUnit
  expiresOn?: string
}

// 카테고리 정보
export interface CategoryInfo {
  id: FridgeCategory
  label: string
  icon: string
}

// 단위 정보
export interface UnitInfo {
  id: QuantityUnit
  label: string
  type: "solid" | "liquid" | "seasoning"
}

// 카테고리 목록
export const CATEGORIES: CategoryInfo[] = [
  { id: "meat", label: "육류", icon: "🥩" },
  { id: "seafood", label: "해산물", icon: "🐟" },
  { id: "vegetable", label: "채소", icon: "🥬" },
  { id: "processed", label: "가공식품", icon: "🥫" },
  { id: "seasoning", label: "조미료", icon: "🧂" },
  { id: "other", label: "기타", icon: "📦" },
]

// 단위 목록
export const UNITS: UnitInfo[] = [
  { id: "count", label: "개", type: "solid" },
  { id: "g", label: "g", type: "solid" },
  { id: "kg", label: "kg", type: "solid" },
  { id: "pack", label: "팩", type: "solid" },
  { id: "ml", label: "ml", type: "liquid" },
  { id: "l", label: "l", type: "liquid" },
  { id: "tbsp", label: "큰술", type: "seasoning" },
  { id: "tsp", label: "작은술", type: "seasoning" },
]

// 카테고리별 추천 재료
export const INGREDIENT_SUGGESTIONS: Record<FridgeCategory, string[]> = {
  meat: ["소고기", "돼지고기", "닭가슴살", "베이컨", "소시지"],
  seafood: ["참치캔", "고등어", "새우", "오징어", "연어"],
  vegetable: ["양파", "대파", "감자", "당근", "김치", "시금치", "버섯", "토마토"],
  processed: ["두부", "계란", "라면", "스파게티면", "식빵", "우유", "치즈"],
  seasoning: ["간장", "참기름", "고추장", "된장", "식용유", "소금", "설탕", "후추"],
  other: ["밥", "떡", "만두"],
}