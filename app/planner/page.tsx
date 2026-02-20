"use client"

import { useMemo, useState, useRef, useEffect } from "react"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import { onAuthChange } from "@/lib/firebase/auth"
import { addFridgeItem, updateFridgeItem, deleteFridgeItem, getFridgeItemsByUserId } from "@/lib/firebase/firestore"

type ShoppingItem = {
  name: string
  quantity: number
  unit: string
  substituteKeywords: string[]
}

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

const PLAN_BASE = [
  ["참치 김치 덮밥", "계란국", "두부조림"],
  ["감자볶음밥", "참치마요덮밥", "김치어묵탕"],
  ["오믈렛", "된장국", "두부부침"],
  ["닭가슴살 샐러드", "계란볶음밥", "김치찌개"],
  ["참치김밥", "어묵볶음", "두부스크램블"],
  ["감자수프", "계란말이", "김치볶음밥"],
  ["된장야채국", "참치샌드", "두부된장무침"],
]

const SHOPPING_BASE: ShoppingItem[] = [
  { name: "계란", quantity: 10, unit: "개", substituteKeywords: ["유정란", "계란 10구"] },
  { name: "두부", quantity: 3, unit: "모", substituteKeywords: ["부침용 두부", "찌개용 두부"] },
  { name: "김치", quantity: 1, unit: "팩", substituteKeywords: ["배추김치", "볶음김치"] },
  { name: "참치캔", quantity: 4, unit: "개", substituteKeywords: ["라이트참치", "참치 통조림"] },
  { name: "감자", quantity: 4, unit: "개", substituteKeywords: ["감자 중", "감자 대"] },
]

export default function PlannerPage() {
  const resultRef = useRef<HTMLDivElement>(null)

  const [days, setDays] = useState<3 | 7>(3)
  const [mealsPerDay, setMealsPerDay] = useState<1 | 2 | 3>(2)
  const [budget, setBudget] = useState("30000")
  const [avoid, setAvoid] = useState("")
  const [generated, setGenerated] = useState(false)
  const [checkedMeals, setCheckedMeals] = useState<Record<string, boolean>>({})
  const [checkedShopping, setCheckedShopping] = useState<Record<string, boolean>>({})
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  // itemId 저장: 냉장고에 추가된 재료의 Firestore doc ID
  const [fridgeItemIds, setFridgeItemIds] = useState<Record<string, string>>({})

  useEffect(() => {
    const unsub = onAuthChange((u) => setAuthUserId(u?.uid ?? null))
    return () => unsub()
  }, [])

  const plan = useMemo(() => {
    return Array.from({ length: days }, (_, i) => ({
      day: i + 1,
      meals: PLAN_BASE[i].slice(0, mealsPerDay),
    }))
  }, [days, mealsPerDay])

  const shoppingList = useMemo(() => {
    const multiplier = days === 7 ? 2 : 1
    return SHOPPING_BASE.map((item) => ({
      ...item,
      quantity: item.quantity * multiplier,
    }))
  }, [days])

  const handleGenerate = () => {
    setGenerated(true)
    setCheckedMeals({})
    setCheckedShopping({})
    setFridgeItemIds({})
    setTimeout(() => {
      resultRef.current?.scrollIntoView({ behavior: "smooth", block: "start" })
    }, 100)
  }

  const toggleMeal = (key: string) => {
    setCheckedMeals((prev) => ({ ...prev, [key]: !prev[key] }))
  }

  const toggleShopping = async (item: ShoppingItem) => {
    const willCheck = !checkedShopping[item.name]
    setCheckedShopping((prev) => ({ ...prev, [item.name]: willCheck }))

    if (!authUserId) return

    if (willCheck) {
      // ✅ 체크: 냉장고에 추가 (중복이면 수량 합산)
      try {
        const { data } = await getFridgeItemsByUserId(authUserId)
        const existing = data?.find((f) => f.name === item.name)

        if (existing) {
          // 이미 있으면 수량 합산
          await updateFridgeItem(authUserId, existing.id, {
            amount: existing.amount + item.quantity,
          })
          setFridgeItemIds((prev) => ({ ...prev, [item.name]: existing.id }))
        } else {
          // 없으면 새로 추가
          const { item: newItem } = await addFridgeItem(authUserId, {
            name: item.name,
            amount: item.quantity,
            unit: item.unit as any,
            category: "other",
          })
          if (newItem) {
            setFridgeItemIds((prev) => ({ ...prev, [item.name]: newItem.id }))
          }
        }
      } catch {
        // 실패해도 체크는 유지
      }
    } else {
      // ❌ 체크 취소: 냉장고에서 삭제 (수량 합산했던 경우 다시 빼기)
      try {
        const { data } = await getFridgeItemsByUserId(authUserId)
        const existing = data?.find((f) => f.name === item.name)

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
          delete next[item.name]
          return next
        })
      } catch {
        // 실패해도 체크 취소는 유지
      }
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

              <button
                onClick={handleGenerate}
                className="mt-5 w-full h-[52px] bg-dc-primary text-white text-base font-bold rounded-xl hover:bg-[#2d6b45] transition-colors"
              >
                플랜 생성하기
              </button>
            </div>

            <aside className="bg-dc-surface border border-dc-border rounded-2xl p-5 h-fit">
              <h2 className="text-dc-text text-sm font-semibold">현재 입력 요약</h2>
              <div className="mt-3 text-sm text-dc-text-secondary space-y-1">
                <p>기간: {days}일</p>
                <p>하루: {mealsPerDay}끼</p>
                <p>예산: {Number(budget || 0).toLocaleString()}원</p>
                <p>기피: {avoid || "없음"}</p>
              </div>
            </aside>
          </section>

          {/* 결과 영역 */}
          {generated && (
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
                {plan.map((row) => {
                  const color = DAY_COLORS[(row.day - 1) % DAY_COLORS.length]
                  return (
                    <div key={row.day} className="bg-dc-surface border border-dc-border rounded-2xl overflow-hidden">
                      <div className={`${color.header} px-4 py-3 flex items-center justify-between`}>
                        <span className={`${color.label} text-sm font-bold`}>Day {row.day}</span>
                        <span className="text-dc-text-secondary text-[11px]">{mealsPerDay}끼</span>
                      </div>
                      <div className="divide-y divide-dc-border">
                        {row.meals.map((meal, mealIdx) => {
                          const key = `${row.day}-${mealIdx}`
                          const isDone = checkedMeals[key]
                          return (
                            <div key={mealIdx} className="px-4 py-3 flex items-center gap-3">
                              <span className="text-lg flex-shrink-0">{MEAL_ICONS[mealIdx]}</span>
                              <div className="flex-1 min-w-0">
                                <div className="text-[10px] font-bold text-dc-text-muted mb-0.5">
                                  {MEAL_TIMES[mealIdx]}
                                </div>
                                <a
                                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(meal + " 레시피")}`}
                                  target="_blank"
                                  rel="noreferrer"
                                  className={`text-[13px] font-bold leading-tight hover:text-dc-primary transition-colors truncate block ${isDone ? "line-through text-dc-text-muted" : "text-dc-text"}`}
                                >
                                  {meal} 🔍
                                </a>
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
                    {checkedCount}/{shoppingList.length}개 완료
                  </span>
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
                  {shoppingList.map((item) => {
                    const isDone = checkedShopping[item.name]
                    const inFridge = !!fridgeItemIds[item.name]
                    return (
                      <div
                        key={item.name}
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
                              {item.name} {item.quantity}{item.unit}
                            </p>
                            {inFridge && (
                              <span className="text-[10px] font-bold text-dc-primary bg-dc-primary-light px-1.5 py-0.5 rounded-full">
                                🧊 냉장고
                              </span>
                            )}
                          </div>
                          <p className="text-dc-text-muted text-[11px] truncate">
                            {item.substituteKeywords.join(", ")}
                          </p>
                        </div>

                        {/* 쿠팡 버튼 */}
                        <a
                          href={`https://www.coupang.com/np/search?q=${encodeURIComponent(item.substituteKeywords[0] ?? item.name)}`}
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