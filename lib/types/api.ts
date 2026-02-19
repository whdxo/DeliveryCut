export type TimeLimitMin = 5 | 10 | 15
export type Tool = "microwave" | "pan" | "airfryer"
export type Difficulty = "easy" | "medium" | "hard"

export interface GenerateInput {
  timeLimitMin: TimeLimitMin
  tools: Tool[]
  ingredientsText: string
  dislikedIngredientsText?: string
}

export interface MenuOption {
  optionId: string
  title: string
  timeMin: number
  tools: Tool[]
  ingredients: string[]
  steps: string[]
  tip: string
  difficulty?: Difficulty
  kcal?: number
}

export interface ThreeDayPlanItem {
  day: 1 | 2 | 3
  breakfast: string
  lunch: string
  dinner: string
}

export interface ShoppingItem {
  item: string
  quantity: number
  unit: string
  reason?: string
}

export interface GenerateOutput {
  menuOptions: [MenuOption, MenuOption, MenuOption]
  threeDayPlan: [ThreeDayPlanItem, ThreeDayPlanItem, ThreeDayPlanItem]
  shoppingList: ShoppingItem[]
  ingredientsUsed?: Record<string, number>
}

export interface GenerateResponse {
  resultId: string
  output: GenerateOutput
}

export interface ResultResponse {
  resultId: string
  input: GenerateInput
  output: GenerateOutput
  createdAt: string
}

export interface ApiError {
  error: {
    code: string
    message: string
    details?: unknown
  }
}

export interface MenuPlanMeta {
  source: "openai" | "mock"
  model: string
}

export interface StoredMenuPlan {
  resultId: string
  userId?: string | null
  input: GenerateInput
  output: GenerateOutput
  meta: MenuPlanMeta
  createdAt: string
  updatedAt: string
}

export type FridgeCategory = "meat" | "seafood" | "vegetable" | "processed" | "seasoning" | "other"
export type QuantityUnit = "count" | "g" | "kg" | "ml" | "l" | "pack" | "tbsp" | "tsp"

export interface FridgeItem {
  id: string
  name: string
  category: FridgeCategory
  subCategory?: string
  amount: number
  unit: QuantityUnit
  expiresOn?: string | null
  source?: "manual" | "mfds" | "fallback"
  createdAt: string
  updatedAt: string
}

export interface FridgeListResponse {
  items: FridgeItem[]
}

export interface FridgeCreateInput {
  name: string
  category?: FridgeCategory
  subCategory?: string
  amount: number
  unit: QuantityUnit
  expiresOn?: string
}

export interface FridgeUpdateInput {
  name?: string
  category?: FridgeCategory
  subCategory?: string
  amount?: number
  unit?: QuantityUnit
  expiresOn?: string | null
}

export interface FridgeConsumeItemInput {
  itemId: string
  amount: number
  unit: QuantityUnit
}

export interface FridgeConsumeInput {
  recipeId: string
  resultId?: string
  items: FridgeConsumeItemInput[]
}

export interface FridgeConsumeResult {
  consumedItemId: string
  beforeAmount: number
  consumedAmount: number
  consumedUnit: QuantityUnit
  afterAmount: number
  stockUnit: QuantityUnit
}

export interface FoodSearchItem {
  name: string
  displayName?: string
  state?: string | null
  category: FridgeCategory
  subCategory?: string
  defaultUnit: QuantityUnit
  source: "mfds" | "fallback" | "xlsx"
}

export interface FoodSearchResponse {
  items: FoodSearchItem[]
}


