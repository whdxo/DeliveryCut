export type TimeLimitMin = 5 | 10 | 15
export type Tool = "microwave" | "pan" | "airfryer" | "pot"
export type Difficulty = "easy" | "medium" | "hard"
export type CookingMethod = "stir_fry" | "braise" | "soup" | "salad" | "grill" | "pan_fry" | "microwave"
export type RecipeHeat = "low" | "medium" | "high"

export interface FridgeContextItem {
  name: string
  amount: number
  unit: QuantityUnit
  daysLeft?: number | null
}

export interface GenerateInput {
  timeLimitMin: TimeLimitMin
  tools: Tool[]
  ingredientsText: string
  dislikedIngredientsText?: string
  userId?: string | null
  fridgeContext?: FridgeContextItem[]
  inventoryContext?: Array<{
    name: string
    amount: number
    unit: QuantityUnit
    category?: FridgeCategory
  }>
  recentMenus?: string[]
}

export interface Taste5 {
  sweet: number
  salty: number
  sour: number
  bitter: number
  umami: number
}

export interface FlavorScoreBreakdown {
  availabilityScore: number
  methodFitScore: number
  tasteTargetScore: number
  totalScore: number
}

export interface FlavorPatternCandidate {
  id: string
  keyword: string
  score: number
  reason: string
  scores?: FlavorScoreBreakdown
}

export interface SeasoningAmount {
  name: string
  amount: number
  unit: "tsp" | "tbsp" | "ml" | "g"
}

export interface IngredientAmount {
  name: string
  amount: number
  unit: "count" | "g" | "ml" | "tbsp" | "tsp"
}

export interface Step {
  n: number
  text: string
  heat?: RecipeHeat
  timerMin?: number
  why?: string
}

export interface FlavorDesign {
  pattern: {
    id: string
    keyword: string
  }
  method: CookingMethod
  topCandidates: [FlavorPatternCandidate, FlavorPatternCandidate, FlavorPatternCandidate]
  seasoningAmounts: SeasoningAmount[]
  ingredientAmounts?: IngredientAmount[]
  tasteBalance: Taste5
  targetTaste?: Taste5
  scoreBreakdown?: FlavorScoreBreakdown
  recipeSteps: string[]
  recipeStepsV2: Step[]
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
  flavorDesign?: FlavorDesign
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

// Planner

export interface PlannerInput {
  days: 3 | 7
  mealsPerDay: 1 | 2 | 3
  budget?: number
  fridgeIngredients?: string
  dislikedIngredientsText?: string
  userId?: string | null
}

export interface PlannerMeal {
  name: string
  timeMin: number
  ingredients: string[]
  isLeftover: boolean
}

export interface PlannerDayPlan {
  day: number
  meals: PlannerMeal[]
}

export interface PlannerOutput {
  dayPlans: PlannerDayPlan[]
  shoppingList: ShoppingItem[]
  totalEstimatedCost: number
  cookingTips: string[]
}

export interface PlannerResponse {
  planId: string
  output: PlannerOutput
}

export interface StoredPlannerPlan {
  planId: string
  userId?: string | null
  input: PlannerInput
  output: PlannerOutput
  createdAt: string
  updatedAt: string
}

export interface UsageQuotaResponse {
  dailyLimit: number
  usedCount: number
  remainingCount: number
  dateKey: string
  isOpenFree: boolean
}

export interface SubscriptionWaitlistResponse {
  requestId: string
  submittedAt: string
}
