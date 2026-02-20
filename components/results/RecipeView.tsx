import { canonicalizeFoodName, isSeasoningLike, normalizeFoodKey } from "@/lib/food/normalize"
import type { FlavorDesign, Step } from "@/lib/types/api"

interface Recipe {
  name: string
  ingredients: string[]
  steps: string[]
  flavorDesign?: FlavorDesign
}

interface MealPlanDay {
  day: string
  meals: string[]
}

interface RecipeViewProps {
  recipe: Recipe
  mealPlan: MealPlanDay[]
  activeTab: "recipe" | "plan"
  onTabChange: (tab: "recipe" | "plan") => void
}

const toFractionText = (value: number): string | null => {
  const rounded = Number(value.toFixed(2))
  if (rounded === 0.25) return "1/4"
  if (rounded === 0.5) return "1/2"
  if (rounded === 0.75) return "3/4"
  return null
}

const formatAmountWithUnit = (amount: number, unit: string) => {
  if (unit === "count") {
    const fraction = toFractionText(amount)
    return `${fraction ?? amount}개`
  }

  return `${amount}${unit}`
}

const formatStep = (step: Step) => {
  const extras: string[] = []
  if (step.heat) extras.push(`불세기 ${step.heat}`)
  if (typeof step.timerMin === "number") extras.push(`${step.timerMin}분`)
  if (step.why) extras.push(step.why)

  return {
    n: step.n,
    text: step.text,
    extra: extras.join(" · "),
  }
}

export default function RecipeView({ recipe, mealPlan, activeTab, onTabChange }: RecipeViewProps) {
  const flavor = recipe.flavorDesign
  const stepsV2 = flavor?.recipeStepsV2 ?? []
  const effectiveSteps =
    stepsV2.length > 0
      ? stepsV2.map(formatStep)
      : (recipe.flavorDesign?.recipeSteps ?? recipe.steps).map((text, idx) => ({ n: idx + 1, text, extra: "" }))

  const seasoningKeys = new Set(
    (flavor?.seasoningAmounts ?? [])
      .map((item) => normalizeFoodKey(canonicalizeFoodName(item.name)))
      .filter(Boolean)
  )

  const visibleIngredientAmounts = (flavor?.ingredientAmounts ?? []).filter((item) => {
    const canonical = canonicalizeFoodName(item.name)
    const key = normalizeFoodKey(canonical)
    if (!key) return false
    if (isSeasoningLike(canonical)) return false

    for (const seasoningKey of seasoningKeys) {
      if (key === seasoningKey || key.includes(seasoningKey) || seasoningKey.includes(key)) {
        return false
      }
    }

    return true
  })

  const shouldUseStructuredIngredients = visibleIngredientAmounts.length > 0

  return (
    <div className="flex-1 bg-dc-surface rounded-2xl border border-dc-border p-5 lg:p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-dc-text text-base lg:text-lg font-bold">🍳 {recipe.name} - 레시피</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onTabChange("recipe")}
            className={`h-7 px-3 rounded-full text-xs font-medium transition-colors ${
              activeTab === "recipe" ? "bg-dc-primary text-white" : "bg-dc-muted text-dc-text-secondary"
            }`}
          >
            레시피
          </button>
          <button
            onClick={() => onTabChange("plan")}
            className={`h-7 px-3 rounded-full text-xs font-medium transition-colors ${
              activeTab === "plan" ? "bg-dc-primary text-white" : "bg-dc-muted text-dc-text-secondary"
            }`}
          >
            3일 플랜
          </button>
        </div>
      </div>

      {activeTab === "recipe" && (
        <>
          <div className="flex flex-col gap-2">
            <div className="text-dc-text text-sm font-semibold">재료</div>
            {shouldUseStructuredIngredients ? (
              <div className="flex flex-wrap gap-2">
                {visibleIngredientAmounts.map((item) => (
                  <span key={`${item.name}-${item.unit}`} className="px-2 py-1 rounded-full bg-dc-muted text-dc-text-secondary text-xs">
                    {item.name} {formatAmountWithUnit(item.amount, item.unit)}
                  </span>
                ))}
              </div>
            ) : (
              <div className="flex flex-col gap-1.5">
                {recipe.ingredients.map((ing, i) => (
                  <div key={i} className="flex items-center gap-2 text-dc-text-secondary text-sm">
                    <span className="text-dc-primary">✦</span>
                    {ing}
                  </div>
                ))}
              </div>
            )}
          </div>

          {flavor?.seasoningAmounts?.length ? (
            <div className="flex flex-col gap-2">
              <div className="text-dc-text text-sm font-semibold">양념</div>
              <div className="flex flex-wrap gap-2">
                {flavor.seasoningAmounts.map((item) => (
                  <span key={`${item.name}-${item.unit}`} className="px-2 py-1 rounded-full bg-dc-muted text-dc-text-secondary text-xs">
                    {item.name} {item.amount}
                    {item.unit}
                  </span>
                ))}
              </div>
            </div>
          ) : null}

          <div className="h-px bg-dc-border" />

          <div className="flex flex-col gap-2">
            <div className="text-dc-text text-sm font-semibold">조리 순서</div>
            <ol className="flex flex-col gap-2">
              {effectiveSteps.map((step, i) => (
                <li key={`${step.n}-${i}`} className="flex gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-dc-primary text-white text-[11px] font-bold flex items-center justify-center flex-none mt-0.5">
                    {step.n}
                  </span>
                  <div className="flex flex-col gap-0.5">
                    <span className="text-dc-text-secondary leading-relaxed">{step.text}</span>
                    {step.extra ? <span className="text-[11px] text-dc-text-muted">{step.extra}</span> : null}
                  </div>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}

      {activeTab === "plan" && <ThreeDayPlan mealPlan={mealPlan} />}
    </div>
  )
}

function ThreeDayPlan({ mealPlan }: { mealPlan: MealPlanDay[] }) {
  return (
    <div className="flex flex-col gap-3">
      {mealPlan.map((day, i) => (
        <div key={i} className="flex flex-col gap-1">
          <div className="text-dc-text text-xs font-semibold">{day.day}</div>
          <div className="text-dc-text-secondary text-xs leading-relaxed">{day.meals.join(" · ")}</div>
        </div>
      ))}
    </div>
  )
}
