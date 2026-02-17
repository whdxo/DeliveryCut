interface Recipe {
  name: string
  ingredients: string[]
  steps: string[]
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

export default function RecipeView({ recipe, mealPlan, activeTab, onTabChange }: RecipeViewProps) {
  return (
    <div className="flex-1 bg-dc-surface rounded-2xl border border-dc-border p-5 lg:p-6 flex flex-col gap-4">
      <div className="flex items-center gap-3 flex-wrap">
        <h2 className="text-dc-text text-base lg:text-lg font-bold">🍳 {recipe.name} — 레시피</h2>
        <div className="flex gap-2">
          <button
            onClick={() => onTabChange("recipe")}
            className={`h-7 px-3 rounded-full text-xs font-medium transition-colors ${activeTab === "recipe" ? "bg-dc-primary text-white" : "bg-dc-muted text-dc-text-secondary"
              }`}
          >
            레시피
          </button>
          <button
            onClick={() => onTabChange("plan")}
            className={`h-7 px-3 rounded-full text-xs font-medium transition-colors ${activeTab === "plan" ? "bg-dc-primary text-white" : "bg-dc-muted text-dc-text-secondary"
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
            <div className="flex flex-col gap-1.5">
              {recipe.ingredients.map((ing, i) => (
                <div key={i} className="flex items-center gap-2 text-dc-text-secondary text-sm">
                  <span className="text-dc-primary">✦</span>
                  {ing}
                </div>
              ))}
            </div>
          </div>

          <div className="h-px bg-dc-border" />

          <div className="flex flex-col gap-2">
            <div className="text-dc-text text-sm font-semibold">조리 순서</div>
            <ol className="flex flex-col gap-2">
              {recipe.steps.map((step, i) => (
                <li key={i} className="flex gap-3 text-sm">
                  <span className="w-5 h-5 rounded-full bg-dc-primary text-white text-[11px] font-bold flex items-center justify-center flex-none mt-0.5">
                    {i + 1}
                  </span>
                  <span className="text-dc-text-secondary leading-relaxed">{step}</span>
                </li>
              ))}
            </ol>
          </div>
        </>
      )}

      {activeTab === "plan" && (
        <ThreeDayPlan mealPlan={mealPlan} />
      )}
    </div>
  )
}

function ThreeDayPlan({ mealPlan }: { mealPlan: MealPlanDay[] }) {
  return (
    <div className="flex flex-col gap-3">
      {mealPlan.map((day, i) => (
        <div key={i} className="flex flex-col gap-1">
          <div className="text-dc-text text-xs font-semibold">{day.day}</div>
          <div className="text-dc-text-secondary text-xs leading-relaxed">
            {day.meals.join(" · ")}
          </div>
        </div>
      ))}
    </div>
  )
}