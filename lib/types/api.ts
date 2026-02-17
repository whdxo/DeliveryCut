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
  input: GenerateInput
  output: GenerateOutput
  meta: MenuPlanMeta
  createdAt: string
  updatedAt: string
}
