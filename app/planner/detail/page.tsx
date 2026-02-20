"use client"

import { useEffect, useState, useRef, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import { getPlannerPlan } from "@/lib/firebase/firestore"
import type { StoredPlannerPlan, ShoppingItem } from "@/lib/types/api"

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

function PlanDetailContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const planId = searchParams.get("planId")
  const resultRef = useRef<HTMLDivElement>(null)

  const [loading, setLoading] = useState(true)
  const [planData, setPlanData] = useState<StoredPlannerPlan | null>(null)
  const [checkedMeals, setCheckedMeals] = useState<Record<string, boolean>>({})
  const [checkedShopping, setCheckedShopping] = useState<Record<string, boolean>>({})

  useEffect(() => {
    if (!planId) {
      router.replace("/history")
      return
    }

    const fetchPlan = async () => {
      const { data, error } = await getPlannerPlan(planId)
      if (error || !data) {
        console.error("[플랜 상세] 플랜 조회 실패:", error)
      } else {
        setPlanData(data)
      }
      setLoading(false)
    }
    fetchPlan()
  }, [planId, router])

  const toggleMeal = (key: string) =>
    setCheckedMeals((prev) => ({ ...prev, [key]: !prev[key] }))

  const toggleShopping = (key: string) =>
    setCheckedShopping((prev) => ({ ...prev, [key]: !prev[key] }))

  const checkedCount = Object.values(checkedShopping).filter(Boolean).length

  // ✅ 장보기 목록 아이템을 합쳐서 쿠팡 검색 쿼리 생성
  const coupangSearchQuery = planData?.output.shoppingList
    .slice(0, 3)
    .map((item) => item.item)
    .join("+") ?? "장보기"

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
    <div className="flex w-full min-h-[calc(100vh-4rem)]">
      <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

      <main className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-8 lg:py-12 pb-24 lg:pb-12">
        {/* 헤더 */}
        <header className="mb-6">
          {/* ✅ router.back()으로 변경 — 어디서 왔든 이전 페이지로 돌아감 */}
          <button
            onClick={() => router.back()}
            className="text-dc-text-secondary text-sm font-medium hover:text-dc-text transition-colors mb-3 flex items-center gap-1"
          >
            ← 뒤로가기
          </button>
          <p className="inline-flex px-3 py-1 rounded-full bg-dc-primary-light text-dc-primary text-xs font-semibold">
            저장된 플랜
          </p>
          <h1 className="mt-3 text-dc-text text-2xl lg:text-[28px] font-bold">
            {planData.input.days}일 식단 플랜
          </h1>
          <p className="mt-1 text-dc-text-secondary text-sm">
            하루 {planData.input.mealsPerDay}끼
            {planData.input.budget && ` · 예산 ${planData.input.budget.toLocaleString()}원`}
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
          <div
            className={`grid gap-4 mb-6 ${
              planData.input.days === 3 ? "grid-cols-1 lg:grid-cols-3" : "grid-cols-1 lg:grid-cols-4"
            }`}
          >
            {planData.output.dayPlans.map((dayPlan) => {
              const color = DAY_COLORS[(dayPlan.day - 1) % DAY_COLORS.length]
              return (
                <div
                  key={dayPlan.day}
                  className="bg-dc-surface border border-dc-border rounded-2xl overflow-hidden"
                >
                  <div
                    className={`${color.header} px-4 py-3 flex items-center justify-between`}
                  >
                    <span className={`${color.label} text-sm font-bold`}>Day {dayPlan.day}</span>
                    <span className="text-dc-text-secondary text-[11px]">
                      {planData.input.mealsPerDay}끼
                    </span>
                  </div>

                  <div className="divide-y divide-dc-border">
                    {dayPlan.meals.map((meal, mealIdx) => {
                      const key = `${dayPlan.day}-${mealIdx}`
                      const isDone = checkedMeals[key]
                      return (
                        <div key={mealIdx} className="px-4 py-3 flex items-center gap-3">
                          <span className="text-lg flex-shrink-0">{MEAL_ICONS[mealIdx]}</span>
                          <div className="flex-1 min-w-0">
                            <div className="text-[10px] font-bold text-dc-text-muted mb-0.5">
                              {MEAL_TIMES[mealIdx]}
                            </div>
                            <a
                              href={`https://www.youtube.com/results?search_query=${encodeURIComponent(meal.name + " 레시피")}`}
                              target="_blank"
                              rel="noreferrer"
                              className={`text-[13px] font-bold leading-tight hover:text-dc-primary transition-colors truncate block ${
                                isDone ? "line-through text-dc-text-muted" : "text-dc-text"
                              }`}
                            >
                              {meal.name} 🔍
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
                {checkedCount}/{planData.output.shoppingList.length}개 완료
              </span>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mb-4">
              {planData.output.shoppingList.map((item) => {
                const isDone = checkedShopping[item.item]
                return (
                  <button
                    key={item.item}
                    onClick={() => toggleShopping(item.item)}
                    className={`flex items-center gap-3 p-3 rounded-xl border transition-all text-left ${
                      isDone
                        ? "bg-dc-muted border-dc-border opacity-50"
                        : "bg-dc-muted border-dc-border hover:border-dc-primary"
                    }`}
                  >
                    <div
                      className={`w-5 h-5 rounded-md border-2 flex-shrink-0 flex items-center justify-center text-[9px] font-bold transition-colors ${
                        isDone
                          ? "bg-dc-primary border-dc-primary text-white"
                          : "border-dc-border bg-white"
                      }`}
                    >
                      {isDone && "✓"}
                    </div>
                    <div className="min-w-0">
                      <p
                        className={`text-sm font-bold ${
                          isDone ? "line-through text-dc-text-muted" : "text-dc-text"
                        }`}
                      >
                        {item.item} {item.quantity}
                        {item.unit}
                      </p>
                      {item.reason && (
                        <p className="text-dc-text-muted text-[11px] truncate">
                          {item.reason}
                        </p>
                      )}
                    </div>
                  </button>
                )
              })}
            </div>

            {/* ✅ 쿠팡 링크: 장보기 목록 상위 3개 아이템으로 동적 검색 */}
            <a
              href={`https://www.coupang.com/np/search?q=${coupangSearchQuery}`}
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
  )
}

export default function PlanDetailPage() {
  return (
    <div className="min-h-screen bg-dc-bg">
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      {/* ✅ useSearchParams 사용 컴포넌트를 Suspense로 감쌈 */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-dc-text-secondary">
            플랜을 불러오는 중...
          </div>
        }
      >
        <PlanDetailContent />
      </Suspense>

      <MobileBottomNav />
    </div>
  )
}