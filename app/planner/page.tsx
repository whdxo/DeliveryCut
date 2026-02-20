"use client"

import { useState, useRef, useEffect } from "react"
import { Refrigerator } from "lucide-react"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import { onAuthChange } from "@/lib/firebase/auth"
import { addFridgeItem, updateFridgeItem, deleteFridgeItem, getFridgeItemsByUserId } from "@/lib/firebase/firestore"
import { unitLabel } from "@/lib/fridge/constants"
import type { PlannerInput, PlannerResponse, PlannerOutput, PlannerMeal, ApiError, ShoppingItem, FridgeItem } from "@/lib/types/api"

const MEAL_ICONS = ["🌅", "☀️", "🌙"]
const MEAL_TIMES = ["아침", "점심", "저녁"]

const DAY_COLORS = [
  { header: "bg-[#e8f5ee]", label: "text-[#2d6b45]" },
  { header: "bg-[#e8f0fb]", label: "text-[#2d52a0]" },
  { header: "bg-[#fef3e2]", label: "text-[#b45309]" },
  { header: "bg-[#fce8f3]", label: "text-[#9d174d]" },
  { header: "bg-[#e8f5ee]", label: "text-[#2d6b45]" },
  { header: "bg-[#e8f0fb]", label: "text-[#2d52a0]" },
  { header: "bg-[#fef3e2]", label: "text-[#b45309]" },
]

// 장보기 아이템에 대체 키워드 추가
function getSubstituteKeywords(itemName: string): string[] {
  const keywords: Record<string, string[]> = {
    "계란": ["유정란", "계란 10구"],
    "두부": ["부침용 두부", "찌개용 두부"],
    "김치": ["배추김치", "볶음김치"],
    "참치캔": ["라이트참치", "참치 통조림"],
    "참치": ["라이트참치", "참치 통조림"],
    "감자": ["감자 중", "감자 대"],
  }
  return keywords[itemName] || [itemName]
}

export default function PlannerPage() {
  const resultRef = useRef<HTMLDivElement>(null)

  const [days, setDays] = useState<3 | 7>(3)
  const [mealsPerDay, setMealsPerDay] = useState<1 | 2 | 3>(2)
  const [budget, setBudget] = useState("30000")
  const [avoid, setAvoid] = useState("")
  const [fridgeIngredients, setFridgeIngredients] = useState("")

  const [isGenerating, setIsGenerating] = useState(false)
  const [error, setError] = useState("")
  const [planOutput, setPlanOutput] = useState<PlannerOutput | null>(null)

  const [checkedMeals, setCheckedMeals] = useState<Record<string, boolean>>({})
  const [checkedShopping, setCheckedShopping] = useState<Record<string, boolean>>({})
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [fridgeItemIds, setFridgeItemIds] = useState<Record<string, string>>({})
  const [fridgeError, setFridgeError] = useState("")
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([])

  useEffect(() => {
    const unsub = onAuthChange((u) => setAuthUserId(u?.uid ?? null))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!authUserId) {
      setFridgeItems([])
      return
    }

    getFridgeItemsByUserId(authUserId)
      .then(({ data }) => setFridgeItems(data ?? []))
      .catch(() => setFridgeItems([]))
  }, [authUserId])

  const containsIngredient = (text: string, name: string) => {
    const target = name.trim().toLowerCase()
    if (!target) return false
    return text
      .split(",")
      .map((token) => token.trim().toLowerCase())
      .filter(Boolean)
      .includes(target)
  }

  const removeIngredient = (text: string, name: string) => {
    const target = name.trim().toLowerCase()
    return text
      .split(",")
      .map((token) => token.trim())
      .filter((token) => token && token.toLowerCase() !== target)
      .join(", ")
  }

  const toggleFridgeIngredient = (name: string) => {
    if (!name.trim()) return
    setFridgeIngredients((prev) => {
      if (containsIngredient(prev, name)) return removeIngredient(prev, name)
      if (!prev.trim()) return name
      return `${prev}, ${name}`
    })
  }

  const handleGenerate = async () => {
    if (isGenerating) return

    setIsGenerating(true)
    setError("")
    setPlanOutput(null)

    const payload: PlannerInput = {
      days,
      mealsPerDay,
      ...(budget && Number(budget) > 0 ? { budget: Number(budget) } : {}),
      ...(fridgeIngredients.trim() ? { fridgeIngredients: fridgeIngredients.trim() } : {}),
      ...(avoid.trim() ? { dislikedIngredientsText: avoid.trim() } : {}),
      userId: authUserId,
    }

    try {
      const res = await fetch("/api/planner", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      const data = (await res.json()) as PlannerResponse | ApiError

      if (!res.ok) {
        setError("error" in data ? data.error.message : "플랜 생성 중 오류가 발생했어요.")
        return
      }

      const ok = data as PlannerResponse
      setPlanOutput(ok.output)
      setCheckedMeals({})
      setCheckedShopping({})
      setFridgeItemIds({})

      setTimeout(() => {
        resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
      }, 100)
    } catch {
      setError("네트워크 오류가 발생했어요. 다시 시도해주세요.")
    } finally {
      setIsGenerating(false)
    }
  }

  const toggleMeal = (key: string) => {
    setCheckedMeals((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleShopping = async (item: ShoppingItem) => {
    const itemName = item.item
    const previousCheckedState = checkedShopping[itemName] || false
    const willCheck = !previousCheckedState

    // Optimistic UI update
    setCheckedShopping((prev) => ({ ...prev, [itemName]: willCheck }))
    setFridgeError("")

    if (!authUserId) return

    try {
      if (willCheck) {
        // ✅ 체크: 냉장고에 추가 (중복이면 수량 합산)
        const { data } = await getFridgeItemsByUserId(authUserId)
        const existing = data?.find((f) => f.name === itemName)

        if (existing) {
          // 이미 있으면 수량 합산
          await updateFridgeItem(authUserId, existing.id, {
            amount: existing.amount + item.quantity,
          })
          setFridgeItemIds((prev) => ({ ...prev, [itemName]: existing.id }))
        } else {
          // 없으면 새로 추가
          const { item: newItem } = await addFridgeItem(authUserId, {
            name: itemName,
            amount: item.quantity,
            unit: item.unit as any,
            category: "other",
          })
          if (newItem) {
            setFridgeItemIds((prev) => ({ ...prev, [itemName]: newItem.id }))
          }
        }
      } else {
        // ❌ 체크 취소: 냉장고에서 삭제 (수량 합산했던 경우 다시 빼기)
        const { data } = await getFridgeItemsByUserId(authUserId)
        const existing = data?.find((f) => f.name === itemName)

        if (existing) {
          const newAmount = existing.amount - item.quantity
          if (newAmount <= 0) {
            // 수량이 0 이하면 아예 삭제
            await deleteFridgeItem(authUserId, existing.id)
          } else {
            // 수량만 되돌리기
            await updateFridgeItem(authUserId, existing.id, { amount: newAmount })
          }
        }
        setFridgeItemIds((prev) => {
          const next = { ...prev }
          delete next[itemName]
          return next
        })
      }
    } catch (error) {
      // Revert UI state on error
      setCheckedShopping((prev) => ({ ...prev, [itemName]: previousCheckedState }))
      setFridgeError(`"${itemName}" 냉장고 ${willCheck ? "추가" : "삭제"} 중 오류가 발생했어요. 다시 시도해주세요.`)

      // Auto-clear error after 5 seconds
      setTimeout(() => setFridgeError(""), 5000)
    }
  }

  const checkedCount = Object.values(checkedShopping).filter(Boolean).length

  return (
    <div className="min-h-screen bg-dc-bg">
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      <div className="flex w-full min-h-[calc(100vh-4rem)]">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        <main className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-8 lg:py-12 pb-24 lg:pb-12">
          <header className="mb-6">
            <p className="inline-flex px-3 py-1 rounded-full bg-dc-primary-light text-dc-primary text-xs font-semibold">
              Plan Generator MVP
            </p>
            <h1 className="mt-3 text-dc-text text-2xl lg:text-[28px] font-bold">플랜 생성기</h1>
            <p className="mt-1 text-dc-text-secondary text-sm">
              기간, 하루 끼니 수, 예산, 기피재료를 바탕으로 식단과 통합 장보기를 생성합니다.
            </p>
          </header>

          {/* 입력 영역 */}
          <section className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
            <div className="bg-dc-surface border border-dc-border rounded-2xl p-5 lg:p-6">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div>
                  <p className="text-dc-text text-sm font-semibold mb-2">기간</p>
                  <div className="flex gap-2">
                    {[3, 7].map((value) => (
                      <button
                        key={value}
                        onClick={() => setDays(value as 3 | 7)}
                        className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${days === value ? "bg-dc-primary text-white" : "bg-dc-muted text-dc-text-secondary hover:bg-dc-border"
                          }`}
                      >
                        {value}일
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-dc-text text-sm font-semibold mb-2">하루 끼니 수</p>
                  <div className="flex gap-2">
                    {[1, 2, 3].map((value) => (
                      <button
                        key={value}
                        onClick={() => setMealsPerDay(value as 1 | 2 | 3)}
                        className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${mealsPerDay === value ? "bg-dc-primary text-white" : "bg-dc-muted text-dc-text-secondary hover:bg-dc-border"
                          }`}
                      >
                        {value}끼
                      </button>
                    ))}
                  </div>
                </div>

                <div>
                  <p className="text-dc-text text-sm font-semibold mb-2">예산 (원)</p>
                  <input
                    value={budget}
                    onChange={(e) => setBudget(e.target.value)}
                    className="w-full h-11 px-4 bg-dc-muted rounded-xl text-dc-text text-sm focus:outline-none focus:ring-1 focus:ring-dc-primary border border-transparent focus:border-dc-primary transition-colors"
                  />
                </div>

                <div>
                  <p className="text-dc-text text-sm font-semibold mb-2">기피 재료</p>
                  <input
                    value={avoid}
                    onChange={(e) => setAvoid(e.target.value)}
                    placeholder="예) 땅콩, 고수"
                    className="w-full h-11 px-4 bg-dc-muted rounded-xl text-dc-text text-sm placeholder:text-dc-text-muted focus:outline-none focus:ring-1 focus:ring-dc-primary border border-transparent focus:border-dc-primary transition-colors"
                  />
                </div>
              </div>

              <div className="mt-4">
                <p className="text-dc-text text-sm font-semibold mb-2">냉장고 재료 (선택)</p>
                <textarea
                  value={fridgeIngredients}
                  onChange={(e) => setFridgeIngredients(e.target.value)}
                  placeholder="예) 계란, 두부, 김치"
                  rows={2}
                  className="w-full px-4 py-3 bg-dc-muted rounded-xl text-dc-text text-sm placeholder:text-dc-text-muted focus:outline-none focus:ring-1 focus:ring-dc-primary border border-transparent focus:border-dc-primary transition-colors resize-none"
                />

                {authUserId && fridgeItems.length === 0 && (
                  <div className="mt-3 px-3 py-2 rounded-lg bg-dc-muted text-dc-text-muted text-xs">
                    냉장고가 비어있어요. /fridge 에서 재료를 추가해 주세요.
                  </div>
                )}

                {fridgeItems.length > 0 && (
                  <div className="mt-3 flex flex-col gap-2">
                    <div className="flex items-center gap-1.5">
                      <Refrigerator size={13} className="text-dc-text-muted" />
                      <span className="text-[12px] font-semibold text-dc-text-secondary">내 냉장고에서 선택</span>
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {fridgeItems.map((item) => {
                        const selected = containsIngredient(fridgeIngredients, item.name)
                        return (
                          <button
                            key={item.id}
                            type="button"
                            onClick={() => toggleFridgeIngredient(item.name)}
                            className={selected
                              ? "h-9 px-3 rounded-full border text-[12px] font-medium transition-colors bg-dc-primary text-white border-dc-primary"
                              : "h-9 px-3 rounded-full border text-[12px] font-medium transition-colors bg-dc-muted text-dc-text-secondary border-dc-border hover:bg-dc-border"
                            }
                          >
                            {item.name} {item.amount}
                            {unitLabel(item.unit)}
                          </button>
                        )
                      })}
                    </div>
                  </div>
                )}
              </div>

              <button
                onClick={handleGenerate}
                disabled={isGenerating}
                className="mt-5 w-full h-[52px] bg-dc-primary text-white text-base font-bold rounded-xl hover:bg-[#2d6b45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isGenerating ? "플랜 생성 중..." : "플랜 생성하기"}
              </button>
            </div>

            <aside className="bg-dc-surface border border-dc-border rounded-2xl p-5 h-fit">
              <h2 className="text-dc-text text-sm font-semibold">현재 입력 요약</h2>
              <div className="mt-3 text-sm text-dc-text-secondary space-y-1">
                <p>기간: {days}일</p>
                <p>하루: {mealsPerDay}끼</p>
                <p>예산: {Number(budget || 0).toLocaleString()}원</p>
                <p>냉장고: {fridgeIngredients || "없음"}</p>
                <p>기피: {avoid || "없음"}</p>
              </div>
            </aside>
          </section>

          {/* 오류 메시지 */}
          {error && (
            <div className="mt-6 p-4 bg-red-50 border border-red-200 rounded-xl">
              <p className="text-red-600 text-sm font-medium">{error}</p>
            </div>
          )}

          {/* 냉장고 추가/삭제 오류 메시지 */}
          {fridgeError && (
            <div className="mt-6 p-4 bg-yellow-50 border border-yellow-200 rounded-xl">
              <p className="text-yellow-800 text-sm font-medium">{fridgeError}</p>
            </div>
          )}

          {/* 결과 영역 */}
          {planOutput && (
            <div ref={resultRef} className="mt-8">
              <div className="flex items-center gap-3 mb-6">
                <div className="flex-1 h-px bg-dc-border" />
                <div className="flex items-center gap-2 px-3 py-1.5 bg-dc-primary-light rounded-full">
                  <span className="w-1.5 h-1.5 rounded-full bg-dc-primary" />
                  <span className="text-dc-primary text-[12px] font-bold">생성 완료</span>
                </div>
                <div className="flex-1 h-px bg-dc-border" />
              </div>

              {/* Day 카드 그리드 */}
              <div className={`grid gap-4 mb-6 ${days === 3 ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-4"}`}>
                {planOutput.dayPlans.map((dayPlan) => {
                  const color = DAY_COLORS[(dayPlan.day - 1) % DAY_COLORS.length]
                  return (
                    <div key={dayPlan.day} className="bg-dc-surface border border-dc-border rounded-2xl overflow-hidden">
                      <div className={`${color.header} px-4 py-3 flex items-center justify-between`}>
                        <span className={`${color.label} text-sm font-bold`}>Day {dayPlan.day}</span>
                        <span className="text-dc-text-secondary text-[11px]">{dayPlan.meals.length}끼</span>
                      </div>
                      <div className="divide-y divide-dc-border">
                        {dayPlan.meals.map((meal: PlannerMeal, mealIdx: number) => {
                          const key = `${dayPlan.day}-${mealIdx}`
                          const isDone = checkedMeals[key]
                          return (
                            <div key={mealIdx} className="px-4 py-3 flex items-center gap-3">
                              <span className="text-lg flex-shrink-0">{MEAL_ICONS[mealIdx % 3]}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-bold text-dc-text-muted mb-0.5 flex items-center gap-1">
                                  {MEAL_TIMES[mealIdx % 3]}
                                  {meal.isLeftover && (
                                    <span className="text-[9px] bg-dc-primary-light text-dc-primary px-1 py-0.5 rounded">
                                      재활용
                                    </span>
                                  )}
                                </div>
                                <a
                                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(meal.name + " 레시피")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`text-[13px] font-bold leading-tight hover:text-dc-primary transition-colors truncate block ${isDone ? "line-through text-dc-text-muted" : "text-dc-text"}`}
                                >
                                  {meal.name} 🔍
                                </a>
                                <p className="text-[10px] text-dc-text-muted mt-0.5">
                                  {meal.timeMin}분 · {meal.ingredients.slice(0, 3).join(", ")}
                                </p>
                              </div>
                              <button
                                onClick={() => toggleMeal(key)}
                                className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[10px] font-bold transition-colors ${isDone ? "bg-dc-primary border-dc-primary text-white" : "border-dc-border bg-white text-transparent"
                                  }`}
                              >
                                ✓
                              </button>
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  )
                })}
              </div>

              {/* 장보기 리스트 */}
              <div className="bg-dc-surface border border-dc-border rounded-2xl p-5 lg:p-6">
                <div className="flex items-center justify-between mb-1">
                  <h2 className="text-dc-text text-base font-bold">🛒 통합 장보기 리스트</h2>
                  <span className="text-[11px] font-semibold text-dc-primary bg-dc-primary-light px-2.5 py-1 rounded-full">
                    {checkedCount}/{planOutput.shoppingList.length}개 완료
                  </span>
                </div>

                <div className="mb-3 p-2 bg-dc-muted rounded-lg">
                  <p className="text-[11px] text-dc-text-secondary">
                    💰 예상 총 비용: <span className="font-bold text-dc-text">{planOutput.totalEstimatedCost.toLocaleString()}원</span>
                  </p>
                </div>

                {!authUserId ? (
                  <p className="text-[11px] text-dc-text-muted mb-3">
                    로그인하면 체크 시 냉장고에 자동으로 추가돼요 🧊
                  </p>
                ) : (
                  <p className="text-[11px] text-dc-primary mb-3">
                    ✓ 체크하면 냉장고에 추가, 취소하면 삭제돼요 🧊
                  </p>
                )}

                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
                  {planOutput.shoppingList.map((item: ShoppingItem) => {
                    const itemName = item.item
                    const isDone = checkedShopping[itemName]
                    const inFridge = !!fridgeItemIds[itemName]
                    const keywords = getSubstituteKeywords(itemName)
                    return (
                      <div
                        key={itemName}
                        className={`flex items-center gap-3 p-3 rounded-xl border transition-all ${isDone ? "bg-dc-muted border-dc-border opacity-50" : "bg-dc-muted border-dc-border"
                          }`}
                      >
                        {/* 체크버튼 */}
                        <button
                          onClick={() => toggleShopping(item)}
                          className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center text-[9px] font-bold transition-colors ${isDone ? "bg-dc-primary border-dc-primary text-white" : "border-dc-border bg-white"
                            }`}
                        >
                          {isDone && "✓"}
                        </button>

                        {/* 재료 정보 */}
                        <div className="flex-1 min-w-0">
                          <div className="flex items-center gap-1.5 flex-wrap">
                            <p className={`text-sm font-bold ${isDone ? "line-through text-dc-text-muted" : "text-dc-text"}`}>
                              {itemName} {item.quantity}{item.unit}
                            </p>
                            {inFridge && (
                              <span className="text-[10px] font-bold text-dc-primary bg-dc-primary-light px-1.5 py-0.5 rounded-full">
                                🧊 냉장고
                              </span>
                            )}
                          </div>
                          <p className="text-dc-text-muted text-[11px] truncate">
                            {item.reason || keywords.join(", ")}
                          </p>
                        </div>

                        {/* 쿠팡 버튼 */}
                        <a
                          href={`https://www.coupang.com/np/search?q=${encodeURIComponent(keywords[0] ?? itemName)}`}
                          target="_blank"
                          rel="noreferrer"
                          onClick={(e) => e.stopPropagation()}
                          className="flex-shrink-0 flex items-center gap-1 px-2.5 py-1.5 bg-[#fff3e0] text-[#e65100] text-[11px] font-bold rounded-lg hover:opacity-80 transition-opacity"
                        >
                          🛒
                        </a>
                      </div>
                    )
                  })}
                </div>

                {/* 요리 팁 */}
                {planOutput.cookingTips.length > 0 && (
                  <div className="mt-6 pt-4 border-t border-dc-border">
                    <h3 className="text-dc-text text-sm font-bold mb-2">💡 요리 팁</h3>
                    <ul className="space-y-1">
                      {planOutput.cookingTips.map((tip, idx) => (
                        <li key={idx} className="text-dc-text-secondary text-[12px] leading-relaxed">
                          • {tip}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>
            </div>
          )}
        </main>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      <MobileBottomNav />
    </div>
  )
}
