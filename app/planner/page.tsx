"use client"

import { useMemo, useState } from "react"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"

type ShoppingItem = {
  name: string
  quantity: number
  unit: string
  substituteKeywords: string[]
}

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
  const [days, setDays] = useState<3 | 7>(3)
  const [mealsPerDay, setMealsPerDay] = useState<1 | 2 | 3>(2)
  const [budget, setBudget] = useState("30000")
  const [avoid, setAvoid] = useState("")
  const [generated, setGenerated] = useState(false)

  const plan = useMemo(() => {
    return Array.from({ length: days }, (_, i) => ({
      day: `${i + 1}일차`,
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
                        className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${
                          days === value
                            ? "bg-dc-primary text-white"
                            : "bg-dc-muted text-dc-text-secondary hover:bg-dc-border"
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
                        className={`flex-1 h-10 rounded-lg text-sm font-medium transition-colors ${
                          mealsPerDay === value
                            ? "bg-dc-primary text-white"
                            : "bg-dc-muted text-dc-text-secondary hover:bg-dc-border"
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
                onClick={() => setGenerated(true)}
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

          {generated && (
            <section className="mt-6 grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
              <article className="bg-dc-surface border border-dc-border rounded-2xl p-5 lg:p-6">
                <h2 className="text-dc-text text-base font-bold">일자별 식단</h2>
                <div className="mt-4 space-y-3">
                  {plan.map((row) => (
                    <div key={row.day} className="border border-dc-border rounded-xl p-3">
                      <p className="text-dc-text text-sm font-semibold">{row.day}</p>
                      <p className="mt-1 text-dc-text-secondary text-sm">{row.meals.join(" · ")}</p>
                    </div>
                  ))}
                </div>
              </article>

              <aside className="bg-dc-surface border border-dc-border rounded-2xl p-5 lg:p-6">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-dc-text text-base font-bold">통합 장보기</h2>
                  <span className="text-[10px] font-semibold text-dc-primary bg-dc-primary-light px-2 py-0.5 rounded-full">
                    표준 스키마
                  </span>
                </div>
                <div className="space-y-2">
                  {shoppingList.map((item) => (
                    <div key={item.name} className="rounded-lg bg-dc-muted p-3">
                      <p className="text-dc-text text-sm font-semibold">
                        {item.name} {item.quantity}
                        {item.unit}
                      </p>
                      <p className="text-dc-text-secondary text-xs mt-1">
                        대체키워드: {item.substituteKeywords.join(", ")}
                      </p>
                    </div>
                  ))}
                </div>
                <a
                  href="https://www.coupang.com/np/search?q=장보기"
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 h-10 rounded-xl bg-dc-primary text-white text-sm font-semibold flex items-center justify-center hover:bg-[#2d6b45] transition-colors"
                >
                  쿠팡 검색으로 구매하기
                </a>
              </aside>
            </section>
          )}
        </main>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      <MobileBottomNav />
    </div>
  )
}
