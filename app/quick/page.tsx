"use client"

import { useState } from "react"
import { useRouter } from "next/navigation"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import type { GenerateInput, GenerateResponse, ResultResponse, Tool } from "@/lib/types/api"

const TIME_OPTIONS = ["5분", "10분", "15분"]
const TOOL_OPTIONS = ["전자레인지", "팬", "에어프라이어"]
const INGREDIENT_TAGS = ["계란", "두부", "김치", "참치", "감자", "양파"]

const TOOL_MAP: Record<string, Tool> = {
  전자레인지: "microwave",
  팬: "pan",
  에어프라이어: "airfryer",
}

const TIME_MAP: Record<string, 5 | 10 | 15> = {
  "5분": 5,
  "10분": 10,
  "15분": 15,
}

export default function QuickPage() {
  const router = useRouter()
  const [selectedTime, setSelectedTime] = useState("10분")
  const [selectedTools, setSelectedTools] = useState<string[]>(["팬"])
  const [ingredients, setIngredients] = useState("")
  const [avoidIngredients, setAvoidIngredients] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    )
  }

  const handleSubmit = async () => {
    if (!ingredients.trim() || isSubmitting) return
    setIsSubmitting(true)
    setError("")

    const payload: GenerateInput = {
      timeLimitMin: TIME_MAP[selectedTime] ?? 10,
      tools: selectedTools.map((t) => TOOL_MAP[t]).filter(Boolean) as Tool[],
      ingredientsText: ingredients.trim(),
      ...(avoidIngredients.trim() ? { dislikedIngredientsText: avoidIngredients.trim() } : {}),
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })
      const data = await res.json() as GenerateResponse

      if (!res.ok) {
        setError("메뉴 생성 중 오류가 발생했습니다. 다시 시도해주세요.")
        return
      }

      const cached: ResultResponse = {
        resultId: data.resultId,
        input: payload,
        output: data.output,
        createdAt: new Date().toISOString(),
      }
      sessionStorage.setItem(`deliverycut:result:${data.resultId}`, JSON.stringify(cached))
      router.push(`/result?resultId=${data.resultId}`)
    } catch {
      setError("네트워크 오류가 발생했습니다. 다시 시도해주세요.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-dc-bg">
      {/* 헤더: 모바일 h-14(56px) */}
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      <div className="flex w-full min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        {/*
          ✅ 모바일 패딩: px-5(20px) py-5(20px)
          ✅ 하단: pb-[148px] = 모바일 sticky버튼(52px) + 하단네비(56px) + 여유(40px)
          ✅ 데스크탑: px-10 py-12 pb-12
        */}
        <main className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-5 lg:py-12 pb-[148px] lg:pb-12">

          {/* 페이지 헤더 */}
          <header className="mb-5 lg:mb-6">
            <p className="inline-flex px-3 py-1 rounded-full bg-dc-primary-light text-dc-primary text-xs font-semibold">
              Quick Recommendation
            </p>
            {/* ✅ 모바일 22px / 데스크탑 28px */}
            <h1 className="mt-3 text-dc-text text-[22px] lg:text-[28px] font-bold leading-snug">
              빠른 AI 레시피 추천
            </h1>
            {/* ✅ 모바일 13px / 데스크탑 14px, 줄간격 1.6 */}
            <p className="mt-1.5 text-dc-text-secondary text-[13px] lg:text-sm leading-relaxed">
              지금 먹을 한 끼를 빠르게 추천하고, 레시피와 영상까지 바로 확인합니다.
            </p>
          </header>

          <section className="grid grid-cols-1 lg:grid-cols-[1fr_280px] gap-4 lg:gap-6">
            <div className="flex flex-col gap-3 lg:gap-4">

              {/* 요리 시간 */}
              <div className="bg-dc-surface rounded-2xl border border-dc-border p-4 lg:p-5">
                {/* ✅ 섹션 라벨 13px */}
                <p className="text-dc-text text-[13px] font-semibold mb-3">요리 시간</p>
                <div className="flex gap-2">
                  {TIME_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      // ✅ 터치 최소 높이 h-11(44px)
                      className={`flex-1 h-11 rounded-xl text-[13px] font-medium transition-colors ${
                        selectedTime === t
                          ? "bg-dc-primary text-white font-semibold"
                          : "bg-dc-muted text-dc-text-secondary hover:bg-dc-border"
                      }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              {/* 조리 도구 */}
              <div className="bg-dc-surface rounded-2xl border border-dc-border p-4 lg:p-5">
                <p className="text-dc-text text-[13px] font-semibold mb-3">조리 도구</p>
                <div className="flex flex-wrap gap-2">
                  {TOOL_OPTIONS.map((tool) => (
                    <button
                      key={tool}
                      onClick={() => toggleTool(tool)}
                      // ✅ 터치 최소 높이 h-11(44px), 가로 여백 px-4
                      className={`h-11 px-4 rounded-full text-[13px] font-medium transition-colors ${
                        selectedTools.includes(tool)
                          ? "bg-dc-primary text-white"
                          : "bg-dc-muted text-dc-text-secondary hover:bg-dc-border"
                      }`}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>

              {/* 재료 입력 */}
              <div className="bg-dc-surface rounded-2xl border border-dc-border p-4 lg:p-5 flex flex-col gap-3">
                <p className="text-dc-text text-[13px] font-semibold">재료 입력</p>
                {/* ✅ 모바일 h-28(112px) / 데스크탑 h-24(96px), 폰트 15px */}
                <textarea
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  placeholder="예) 계란, 두부, 김치"
                  className="w-full h-28 lg:h-24 px-4 py-3 bg-dc-muted rounded-xl text-dc-text text-[15px] placeholder:text-dc-text-muted resize-none focus:outline-none focus:ring-1 focus:ring-dc-primary border border-transparent focus:border-dc-primary transition-colors leading-relaxed"
                />
                {/* ✅ 재료 태그: h-11(44px) 터치 영역 확보 */}
                <div className="flex flex-wrap gap-2">
                  {INGREDIENT_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setIngredients((prev) => (prev ? `${prev}, ${tag}` : tag))}
                      className="h-11 px-4 rounded-full bg-dc-muted text-dc-text-secondary text-[13px] font-medium hover:bg-dc-border transition-colors"
                    >
                      + {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* 기피 재료 */}
              <div className="bg-dc-surface rounded-2xl border border-dc-border p-4 lg:p-5">
                <p className="text-dc-text text-[13px] font-semibold mb-2.5">기피 재료</p>
                {/* ✅ 입력 높이 h-11(44px) */}
                <input
                  value={avoidIngredients}
                  onChange={(e) => setAvoidIngredients(e.target.value)}
                  placeholder="예) 고수, 땅콩"
                  className="w-full h-11 px-4 bg-dc-muted rounded-xl text-dc-text text-[15px] placeholder:text-dc-text-muted focus:outline-none focus:ring-1 focus:ring-dc-primary border border-transparent focus:border-dc-primary transition-colors"
                />
              </div>

              {/* 에러 메시지 */}
              {error && (
                <p className="text-red-500 text-[13px] px-1">{error}</p>
              )}

              {/* ✅ 데스크탑 전용 인라인 CTA - h-[52px] */}
              <button
                onClick={handleSubmit}
                disabled={!ingredients.trim() || isSubmitting}
                className="hidden lg:flex w-full h-[52px] bg-dc-primary text-white text-base font-bold rounded-xl items-center justify-center hover:bg-[#2d6b45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "AI 메뉴 생성 중..." : "배달컷 메뉴 추천받기"}
              </button>
            </div>

            {/* ✅ 사이드 정보: 데스크탑에서만 표시 */}
            <aside className="hidden lg:block bg-dc-surface rounded-2xl border border-dc-border p-5 h-fit">
              <h2 className="text-dc-text text-sm font-semibold mb-3">추천 결과에서 제공되는 정보</h2>
              <ul className="text-xs text-dc-text-secondary space-y-2.5 leading-relaxed">
                <li className="flex items-center gap-2">
                  <span className="text-dc-primary">✦</span> 메뉴 3개 추천
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-dc-primary">✦</span> 선택 메뉴 상세 레시피
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-dc-primary">✦</span> 유튜브 영상 바로가기
                </li>
                <li className="flex items-center gap-2">
                  <span className="text-dc-primary">✦</span> 간단 장보기 목록
                </li>
              </ul>
            </aside>
          </section>
        </main>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      {/*
        ✅ 모바일 전용 하단 고정 CTA
        - bottom-0 위에 MobileBottomNav(56px)가 있으므로 bottom-[56px]
        - safe area는 style로 직접 처리
        - 버튼 h-[52px], 좌우 px-5, 상단 pt-3 여백
      */}
      <div
        className="lg:hidden fixed left-0 right-0 px-5 pt-3 bg-dc-bg/95 backdrop-blur-sm border-t border-dc-border z-40"
        style={{ bottom: "calc(56px + env(safe-area-inset-bottom))" }}
      >
        <button
          onClick={handleSubmit}
          disabled={!ingredients.trim() || isSubmitting}
          className="w-full h-[52px] bg-dc-primary text-white text-[15px] font-bold rounded-xl flex items-center justify-center disabled:opacity-40 disabled:cursor-not-allowed transition-colors mb-3"
        >
          {isSubmitting ? "AI 메뉴 생성 중..." : ingredients.trim() ? "배달컷 메뉴 추천받기 →" : "재료를 먼저 입력해주세요"}
        </button>
      </div>

      <MobileBottomNav />
    </div>
  )
}