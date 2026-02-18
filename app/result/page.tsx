"use client"

import { Suspense, useEffect, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import type { MenuOption, ResultResponse, StoredMenuPlan } from "@/lib/types/api"

function getCoupangUrl(keyword: string) {
  return `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}`
}

function ResultContent() {
  const searchParams = useSearchParams()
  const resultId = searchParams.get("resultId")

  const [result, setResult] = useState<ResultResponse | null>(null)
  const [selectedIndex, setSelectedIndex] = useState(0)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState("")

  useEffect(() => {
    if (!resultId) {
      setError("결과를 찾을 수 없습니다.")
      setLoading(false)
      return
    }

    // sessionStorage 캐시 우선
    const cached = sessionStorage.getItem(`deliverycut:result:${resultId}`)
    if (cached) {
      try {
        setResult(JSON.parse(cached) as ResultResponse)
        setLoading(false)
        return
      } catch {
        // 캐시 파싱 실패 시 API로 fallback
      }
    }

    // API 조회 (StoredMenuPlan → ResultResponse 변환)
    fetch(`/api/results/${resultId}`)
      .then((res) => {
        if (!res.ok) throw new Error("not found")
        return res.json() as Promise<StoredMenuPlan>
      })
      .then((data) => {
        const converted: ResultResponse = {
          resultId: data.resultId,
          input: data.input,
          output: data.output,
          createdAt: data.createdAt,
        }
        setResult(converted)
      })
      .catch(() => setError("결과를 불러오지 못했습니다."))
      .finally(() => setLoading(false))
  }, [resultId])

  if (loading) {
    return (
      <div className="min-h-screen bg-dc-bg flex items-center justify-center">
        <p className="text-dc-text-secondary text-sm">AI 메뉴를 불러오는 중...</p>
      </div>
    )
  }

  if (error || !result) {
    return (
      <div className="min-h-screen bg-dc-bg flex flex-col items-center justify-center gap-4">
        <p className="text-dc-text-secondary text-sm">{error || "결과를 찾을 수 없습니다."}</p>
        <Link href="/quick" className="h-11 px-6 rounded-xl bg-dc-primary text-white text-sm font-semibold flex items-center">
          다시 시도하기
        </Link>
      </div>
    )
  }

  const { output, input } = result
  const menus = output.menuOptions
  const selected: MenuOption = menus[selectedIndex]

  const toolDisplayNames: Record<string, string> = {
    microwave: "전자레인지",
    pan: "팬",
    airfryer: "에어프라이어",
  }

  return (
    <div className="min-h-screen bg-dc-bg">
      {/* 헤더 */}
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <div className="lg:hidden flex items-center justify-between h-14 px-5 bg-dc-surface">
          <div className="flex items-center gap-2.5">
            <Link
              href="/quick"
              className="w-11 h-11 bg-dc-muted rounded-xl flex items-center justify-center text-dc-text-secondary text-lg"
            >
              ←
            </Link>
            <span className="text-dc-text text-[15px] font-bold">추천 결과</span>
          </div>
          <Link
            href="/quick"
            className="h-11 px-4 bg-dc-muted rounded-xl text-dc-text-secondary text-[13px] font-medium flex items-center"
          >
            다시 입력
          </Link>
        </div>
        <div className="hidden lg:block">
          <NavBar variant="app" />
        </div>
      </div>

      <div className="flex w-full min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        <main className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-4 lg:py-12 flex flex-col gap-4 lg:gap-6 pb-nav-safe lg:pb-12">

          {/* 입력 요약 */}
          <section className="bg-dc-surface border border-dc-border rounded-2xl p-4 lg:p-5">
            <p className="text-dc-text text-[13px] font-semibold">입력 요약</p>
            <p className="text-dc-text-secondary text-[12px] lg:text-xs mt-1.5 leading-relaxed">
              시간: {input.timeLimitMin}분 · 도구: {input.tools.map((t) => toolDisplayNames[t] ?? t).join(", ")}
            </p>
            <p className="text-dc-text-secondary text-[12px] lg:text-xs mt-0.5 leading-relaxed">
              재료: {input.ingredientsText}
            </p>
          </section>

          {/* 메뉴 선택 */}
          <section className="flex flex-col gap-3">
            <h1 className="text-dc-text text-[18px] lg:text-[28px] font-bold">추천 메뉴 3가지</h1>
            <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth -mx-5 px-5 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
              {menus.map((menu, index) => (
                <button
                  key={menu.optionId}
                  onClick={() => setSelectedIndex(index)}
                  className={`flex-none w-[180px] lg:w-auto snap-start p-4 rounded-2xl border text-left transition-all ${
                    selectedIndex === index
                      ? "border-dc-primary bg-dc-primary-light"
                      : "border-dc-border bg-dc-surface"
                  }`}
                >
                  <p className="text-dc-text text-[14px] font-bold leading-snug">{menu.title}</p>
                  <p className="text-dc-text-secondary text-[12px] mt-1">
                    {menu.timeMin}분 · {menu.tools.map((t) => toolDisplayNames[t] ?? t).join("+")}
                    {menu.difficulty ? ` · ${menu.difficulty}` : ""}
                  </p>
                  {selectedIndex === index && (
                    <span className="mt-2 inline-block text-[11px] font-bold text-dc-primary">✓ 선택됨</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/* 레시피 + 장보기 */}
          <section className="flex flex-col-reverse gap-4 lg:gap-6 lg:grid lg:grid-cols-[1fr_280px]">

            {/* 레시피 상세 */}
            <article className="bg-dc-surface rounded-2xl border border-dc-border p-5 lg:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <h2 className="text-dc-text text-[17px] lg:text-lg font-bold">{selected.title}</h2>
                  {selected.tip && (
                    <p className="text-dc-text-secondary text-[13px] mt-1.5 leading-relaxed">
                      💡 {selected.tip}
                    </p>
                  )}
                </div>
                <span className="text-[11px] font-semibold bg-dc-primary-light text-dc-primary px-2.5 py-1 rounded-full whitespace-nowrap flex-none">
                  선택됨
                </span>
              </div>

              {/* 재료 */}
              <div className="mt-5">
                <p className="text-dc-text text-[13px] font-semibold">재료</p>
                <ul className="mt-2 space-y-1.5">
                  {selected.ingredients.map((item) => (
                    <li key={item} className="text-dc-text-secondary text-[14px] leading-relaxed flex gap-1.5">
                      <span className="text-dc-text-muted">-</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="h-px bg-dc-border my-5" />

              {/* 조리 순서 */}
              <div>
                <p className="text-dc-text text-[13px] font-semibold">조리 순서</p>
                <ol className="mt-2 space-y-2.5">
                  {selected.steps.map((step, index) => (
                    <li key={index} className="flex gap-2.5">
                      <span className="text-dc-primary text-[14px] font-bold flex-none">{index + 1}.</span>
                      <span className="text-dc-text-secondary text-[14px] leading-[1.7]">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 액션 버튼 */}
              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                <a
                  href={`https://www.10000recipe.com/recipe/list.html?q=${encodeURIComponent(selected.title)}`}
                  target="_blank"
                  rel="noreferrer"
                  className="h-11 px-4 rounded-xl bg-dc-primary text-white text-[13px] font-semibold flex items-center justify-center hover:bg-[#2d6b45] transition-colors"
                >
                  레시피 더보기
                </a>
                <a
                  href={`https://www.youtube.com/results?search_query=${encodeURIComponent(selected.title + " 레시피")}`}
                  target="_blank"
                  rel="noreferrer"
                  className="h-11 px-4 rounded-xl bg-dc-muted text-dc-text-secondary text-[13px] font-semibold flex items-center justify-center hover:bg-dc-border transition-colors"
                >
                  유튜브 영상 보기
                </a>
              </div>
            </article>

            {/* 장보기 */}
            <aside className="bg-dc-surface rounded-2xl border border-dc-border p-5 lg:p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-dc-text text-[15px] font-bold">간단 장보기</h2>
                <span className="text-[10px] font-semibold text-dc-primary bg-dc-primary-light px-2 py-0.5 rounded-full">
                  quick
                </span>
              </div>
              {output.shoppingList.length === 0 ? (
                <p className="text-dc-text-secondary text-[13px]">추가 구매 필요 없음</p>
              ) : (
                <div className="divide-y divide-dc-border">
                  {output.shoppingList.map((item) => (
                    <div key={item.item} className="flex items-center justify-between min-h-[44px]">
                      <span className="text-dc-text text-[14px]">{item.item}</span>
                      <span className="text-dc-text-secondary text-[12px]">{item.quantity}{item.unit}</span>
                    </div>
                  ))}
                </div>
              )}
              {output.shoppingList.length > 0 && (
                <a
                  href={getCoupangUrl(output.shoppingList[0]?.item ?? selected.title)}
                  target="_blank"
                  rel="noreferrer"
                  className="mt-4 h-11 rounded-xl bg-dc-muted text-dc-text-secondary text-[13px] font-semibold flex items-center justify-center hover:bg-dc-border transition-colors"
                >
                  이 메뉴 재료 구매 검색
                </a>
              )}
            </aside>
          </section>

          {/* 3일 플랜 */}
          <section className="bg-dc-surface border border-dc-border rounded-2xl p-5 lg:p-6">
            <h2 className="text-dc-text text-[15px] font-bold mb-4">3일 식단 플랜</h2>
            <div className="space-y-3">
              {output.threeDayPlan.map((day) => (
                <div key={day.day} className="border border-dc-border rounded-xl p-3">
                  <p className="text-dc-text text-[13px] font-semibold">{day.day}일차</p>
                  <p className="mt-1 text-dc-text-secondary text-[13px]">
                    아침: {day.breakfast} · 점심: {day.lunch} · 저녁: {day.dinner}
                  </p>
                </div>
              ))}
            </div>
          </section>
        </main>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      <MobileBottomNav />
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-dc-bg flex items-center justify-center text-dc-text-secondary text-sm">
          로딩 중...
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  )
}
