"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"

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

interface PlanData {
  id: string
  createdAt: string
  days: 3 | 7
  mealsPerDay: 1 | 2 | 3
  budget: number
  plan: Array<{
    day: number
    meals: string[]
  }>
  shoppingList: Array<{
    name: string
    quantity: number
    unit: string
    substituteKeywords: string[]
  }>
  estimatedCost: number
}

export default function PlanDetailPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get("planId")
  const resultRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [planData, setPlanData] = useState<PlanData | null>(null)
  const [checkedMeals, setCheckedMeals] = useState<Record<string, boolean>>({})
  const [checkedShopping, setCheckedShopping] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!planId) {
      router.replace("/history")
      return
    }

    // TODO: Firestore에서 플랜 불러오기
    // const fetchPlan = async () => {
    //   const { data } = await getPlannerPlan(planId)
    //   if (data) setPlanData(data)
    //   setLoading(false)
    // }
    // fetchPlan()

    // 임시: Mock 데이터
    setTimeout(() => {
      setPlanData({
        id: planId,
        createdAt: new Date().toISOString(),
        days: 3,
        mealsPerDay: 2,
        budget: 30000,
        plan: [
          { day: 1, meals: ["참치 김치 덮밥", "계란국"] },
          { day: 2, meals: ["감자볶음밥", "참치마요덮밥"] },
          { day: 3, meals: ["오믈렛", "된장국"] },
        ],
        shoppingList: [
          { name: "계란", quantity: 10, unit: "개", substituteKeywords: ["유정란", "계란 10구"] },
          { name: "두부", quantity: 3, unit: "모", substituteKeywords: ["부침용 두부", "찌개용 두부"] },
          { name: "김치", quantity: 1, unit: "팩", substituteKeywords: ["배추김치", "볶음김치"] },
          { name: "참치캔", quantity: 4, unit: "개", substituteKeywords: ["라이트참치", "참치 통조림"] },
          { name: "감자", quantity: 4, unit: "개", substituteKeywords: ["감자 중", "감자 대"] },
        ],
        estimatedCost: 28000,
      })
      setLoading(false)
    }, 300)
  }, [planId, router])

  const toggleMeal = (key: string) =>
    setCheckedMeals((prev) => ({ ...prev, [key]: !prev[key] }))

  const toggleShopping = (key: string) =>
    setCheckedShopping((prev) => ({ ...prev, [key]: !prev[key] }))

  const checkedCount = Object.values(checkedShopping).filter(Boolean).length

  if (loading) {
    return (
      <div className="min-h-screen bg-dc-bg flex items-center justify-center">
        <div className="text-dc-text-secondary">플랜을 불러오는 중...</div>
      </div>
    )
  }

  if (!planData) {
    return (
      <div className="min-h-screen bg-dc-bg flex items-center justify-center">
        <div className="text-center">
          <div className="text-4xl mb-4">📅</div>
          <div className="text-dc-text font-semibold mb-4">플랜을 찾을 수 없어요</div>
          <button
            onClick={() => router.push("/history")}
            className="h-10 px-4 bg-dc-primary text-white text-sm font-medium rounded-lg hover:bg-[#2d6b45] transition-colors"
          >
            히스토리로 돌아가기
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-dc-bg">
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      <div className="flex w-full min-h-[calc(100vh-4rem)]">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        <main className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-8 lg:py-12 pb-24 lg:pb-12">
          {/* 헤더 */}
          <header className="mb-6">
            <button
              onClick={() => router.push("/history?tab=식단플랜")}
              className="text-dc-text-secondary text-sm font-medium hover:text-dc-text transition-colors mb-3 flex items-center gap-1"
            >
              ← 뒤로가기
            </button>
            <p className="inline-flex px-3 py-1 rounded-full bg-dc-primary-light text-dc-primary text-xs font-semibold">
              저장된 플랜
            </p>
            <h1 className="mt-3 text-dc-text text-2xl lg:text-[28px] font-bold">
              {planData.days}일 식단 플랜
            </h1>
            <p className="mt-1 text-dc-text-secondary text-sm">
              하루 {planData.mealsPerDay}끼 · 예산 {planData.budget.toLocaleString()}원
            </p>
          </header>

          <div ref={resultRef}>
            <div className="flex items-center gap-3 mb-6">
              <div className="flex-1 h-px bg-dc-border" />
              <div className="flex items-center gap-2 px-3 py-1.5 bg-dc-primary-light rounded-full">
                <span className="w-1.5 h-1.5 rounded-full bg-dc-primary" />
                <span className="text-dc-primary text-[12px] font-bold">
                  {new Date(planData.createdAt).toLocaleDateString("ko-KR")}
                </span>
              </div>
              <div className="flex-1 h-px bg-dc-border" />
            </div>

            {/* Day 카드 그리드 */}
            <div className={`grid gap-4 mb-6 ${planData.days === 3 ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-4"}`}>
              {planData.plan.map((row) => {
                const color = DAY_COLORS[(row.day - 1) % DAY_COLORS.length]
                return (
                  <div key={row.day} className="bg-dc-surface border border-dc-border rounded-2xl overflow-hidden">
                    <div className={`${color.header} px-4 py-3 flex items-center justify-between`}>
                      <span className={`${color.label} text-sm font-bold`}>Day {row.day}</span>
                      <span className="text-dc-text-secondary text-[11px]">{planData.mealsPerDay}끼</span>
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
                                className={`text-[13px] font-bold leading-tight hover:text-dc-primary transition-colors truncate block ${
                                  isDone ? "line-through text-dc-text-muted" : "text-dc-text"
                                }`}
                              >
                                {meal} 🔍
                              </a>
                            </div>
                            <button
                              onClick={() => toggleMeal(key)}
                              className={`w-6 h-6 rounded-full border-2 flex-shrink-0 flex items-center justify-center text-[10px] font-bold transition-colors ${
                                isDone
                                  ? "bg-dc-primary border-dc-primary text-white"
                                  : "border-dc-border bg-white text-transparent"
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
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-dc-text text-base font-bold">🛒 통합 장보기 리스트</h2>
                <span className="text-[11px] font-semibold text-dc-primary bg-dc-primary-light px-2.5 py-1 rounded-full">
                  {checkedCount}/{planData.shoppingList.length}개 완료
                </span>
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
                {planData.shoppingList.map((item) => {
                  const isDone = checkedShopping[item.name]
                  return (
                    <button
                      key={item.name}
                      onClick={() => toggleShopping(item.name)}
                      className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                        isDone
                          ? "bg-dc-muted border-dc-border opacity-50"
                          : "bg-dc-muted border-dc-border hover:border-dc-primary"
                      }`}
                    >
                      <div className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center text-[9px] font-bold transition-colors ${
                        isDone ? "bg-dc-primary border-dc-primary text-white" : "border-dc-border bg-white"
                      }`}>
                        {isDone && "✓"}
                      </div>
                      <div className="min-w-0">
                        <p className={`text-sm font-bold ${isDone ? "line-through text-dc-text-muted" : "text-dc-text"}`}>
                          {item.name} {item.quantity}{item.unit}
                        </p>
                        <p className="text-dc-text-muted text-[11px] truncate">
                          {item.substituteKeywords.join(", ")}
                        </p>
                      </div>
                    </button>
                  )
                })}
              </div>

              <a
                href="https://www.coupang.com/np/search?q=장보기"
                target="_blank"
                rel="noreferrer"
                className="h-11 rounded-xl bg-dc-primary text-white text-sm font-semibold flex items-center justify-center hover:bg-[#2d6b45] transition-colors"
              >
                쿠팡 검색으로 구매하기
              </a>
            </div>
          </div>
        </main>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      <MobileBottomNav />
    </div>
  )
}