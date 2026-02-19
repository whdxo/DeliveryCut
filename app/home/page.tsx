"use client"

import { useState, useEffect, useMemo } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { Refrigerator, Zap, CalendarDays } from "lucide-react"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import LoginPromptModal from "@/components/shared/LoginPromptModal"
import { onAuthChange } from "@/lib/firebase"
import type { ApiError, GenerateInput, GenerateResponse, ResultResponse, Tool } from "@/lib/types/api"

/**
 * ─────────────────────────────────────────────────────────────────────────────
 * 상수 / 타입
 * ─────────────────────────────────────────────────────────────────────────────
 */
const TIME_OPTIONS = ["5분", "10분", "15분"]
const TOOL_OPTIONS = ["전자레인지", "팬", "에어프라이어"]
const INGREDIENT_TAGS = ["계란", "두부", "김치", "양파", "참치", "스팸", "대파"]

const FEATURE_CARDS = [
  {
    title: "레시피 추천",
    desc: "지금 있는 재료로 즉시 한 끼 추천을 받고, 레시피와 영상, 간단 장보기까지 확인합니다.",
    href: "/quick",
    badge: "즉시 한 끼",
    cta: "레시피 추천받기",
    icon: Zap,
  },
  {
    title: "3일 플랜",
    desc: "3일 식단을 자동으로 구성하고 통합 장보기 리스트를 생성합니다.",
    href: "/planner",
    badge: "주간 관리",
    cta: "3일 플랜 만들기",
    icon: CalendarDays,
  },
  {
    title: "냉장고",
    desc: "보유 재료를 관리하고 추천 화면에서 버튼으로 빠르게 재료를 추가할 수 있어요.",
    href: "/fridge",
    badge: "재료 관리",
    cta: "냉장고 관리하기",
    icon: Refrigerator,
  },
] as const

const cacheKey = (resultId: string) => `deliverycut:result:${resultId}`

const toTool = (tool: string): Tool => {
  if (tool === "전자레인지") return "microwave"
  if (tool === "팬") return "pan"
  return "airfryer"
}

export default function HomePage() {
  const router = useRouter()
  const [selectedTime, setSelectedTime] = useState("10분")
  const [selectedTools, setSelectedTools] = useState<string[]>(["전자레인지"])
  const [ingredients, setIngredients] = useState("")
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [user, setUser] = useState<import("firebase/auth").User | null>(null)
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange((firebaseUser) => {
      setUser(firebaseUser)
      setShowLoginPrompt(!firebaseUser)
    })

    return () => unsubscribe()
  }, [])

  const cards = useMemo(() => FEATURE_CARDS, [])

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    )
  }

  const handleSubmit = async () => {
    if (!ingredients.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    const payload: GenerateInput = {
      timeLimitMin: Number.parseInt(selectedTime, 10) as 5 | 10 | 15,
      tools: selectedTools.map(toTool),
      ingredientsText: ingredients.trim(),
      userId: user?.uid || null,
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const apiError = (await response.json()) as ApiError
        throw new Error(apiError.error.message)
      }

      const data = (await response.json()) as GenerateResponse

      const cached: ResultResponse = {
        resultId: data.resultId,
        input: payload,
        output: data.output,
        createdAt: new Date().toISOString(),
      }
      sessionStorage.setItem(cacheKey(data.resultId), JSON.stringify(cached))

      router.push(`/result?resultId=${data.resultId}`)
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "메뉴 생성 중 오류가 발생했습니다.")
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-dc-bg">
      {showLoginPrompt ? <LoginPromptModal onClose={() => setShowLoginPrompt(false)} /> : null}

      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      <div className="flex w-full min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        <main className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-8 lg:py-12 pb-nav-safe lg:pb-12">
          {/* 배너 섹션 */}
          <section className="bg-dc-surface border border-dc-border rounded-2xl p-6 lg:p-8 mb-6">
            <p className="inline-flex px-3 py-1 rounded-full bg-dc-primary-light text-dc-primary text-xs font-semibold">
              DeliveryCut Home
            </p>
            <h1 className="mt-4 text-dc-text text-2xl lg:text-3xl font-bold">원하는 기능을 선택하세요</h1>
            <p className="mt-2 text-dc-text-secondary text-sm lg:text-base max-w-[700px] leading-relaxed">
              레시피 추천, 3일 플랜, 냉장고 관리 중 필요한 기능으로 바로 이동할 수 있습니다.
            </p>
          </section>

          <div className="flex flex-col lg:flex-row gap-6 mb-8">
            {/* 좌측: 메뉴 생성기 */}
            <div className="flex-1 flex flex-col gap-6">
              <div className="bg-dc-surface rounded-2xl border border-dc-border p-4 lg:p-5 flex flex-col gap-3">
                <div className="text-dc-text text-[13px] font-semibold">⏱ 요리 시간</div>
                <div className="flex gap-2">
                  {TIME_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className={`flex-1 h-10 rounded-lg text-[13px] font-medium transition-colors ${selectedTime === t
                        ? "bg-dc-primary text-white font-semibold"
                        : "bg-dc-muted text-dc-text-secondary hover:bg-dc-border"
                        }`}
                    >
                      {t}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-dc-surface rounded-2xl border border-dc-border p-4 lg:p-5 flex flex-col gap-3">
                <div className="text-dc-text text-[13px] font-semibold">🍳 조리 도구</div>
                <div className="flex flex-wrap gap-2">
                  {TOOL_OPTIONS.map((tool) => (
                    <button
                      key={tool}
                      onClick={() => toggleTool(tool)}
                      className={`h-9 px-4 rounded-full text-[13px] font-medium transition-colors ${selectedTools.includes(tool)
                        ? "bg-dc-primary text-white"
                        : "bg-dc-muted text-dc-text-secondary hover:bg-dc-border"
                        }`}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </div>

              <div className="bg-dc-surface rounded-2xl border border-dc-border p-4 lg:p-5 flex flex-col gap-3">
                <div className="text-dc-text text-[13px] font-semibold">🥦 냉장고 재료</div>
                <textarea
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  placeholder="예) 계란, 두부, 김치, 당근"
                  className="w-full h-20 lg:h-[88px] px-4 py-3 bg-dc-muted rounded-xl text-dc-text text-sm placeholder:text-dc-text-muted resize-none focus:outline-none focus:ring-1 focus:ring-dc-primary border border-transparent focus:border-dc-primary transition-colors"
                />
                <div className="flex flex-wrap gap-2">
                  {INGREDIENT_TAGS.map((tag) => (
                    <button
                      key={tag}
                      onClick={() => setIngredients((prev) => (prev ? `${prev}, ${tag}` : tag))}
                      className="h-8 px-3.5 rounded-full bg-dc-muted text-dc-text-secondary text-[13px] font-medium hover:bg-dc-border transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {error ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                  {error}
                </div>
              ) : null}

              <button
                onClick={handleSubmit}
                disabled={!ingredients.trim() || isSubmitting}
                className="w-full h-[52px] bg-dc-primary text-white text-base font-bold rounded-xl flex items-center justify-center hover:bg-[#2d6b45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {isSubmitting ? "생성 중..." : "배달컷 메뉴 만들기 →"}
              </button>
            </div>

            {/* 우측: 팁 섹션 (기존 유지) */}
            <div className="hidden lg:flex w-[300px] flex-none border-l border-dc-border flex-col gap-0 py-0 pr-0">
              <div className="px-6 pb-4">
                <div className="text-dc-text text-sm font-semibold">✓ 지금 뭐 해요?</div>
              </div>
              {[
                { title: "알찬 볶음밥", desc: "소 반큰술 · 참기름 1큰술 · 1인분", badge: "🌟 인기" },
                { title: "냉장고 간편식", desc: "계란 · 두부·당근 · 스크램블도 무방", badge: "🔥 추천" },
                { title: "장보기 교복", desc: "계란 · 당근 · 두부 · 핫소스", badge: "✨ 새" },
              ].map((tip, i) => (
                <div key={i} className="px-6 py-4 border-t border-dc-border flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] font-semibold text-dc-primary bg-dc-primary-light px-2 py-0.5 rounded-full">
                      {tip.badge}
                    </span>
                  </div>
                  <div className="text-dc-text text-sm font-semibold">{tip.title}</div>
                  <div className="text-dc-text-secondary text-xs">{tip.desc}</div>
                </div>
              ))}
            </div>
          </div>

          <section className="grid grid-cols-1 lg:grid-cols-3 gap-4">
            {cards.map((feature) => {
              const IconComponent = feature.icon
              return (
                <article
                  key={feature.title}
                  className="bg-dc-surface border border-dc-border rounded-2xl p-5 lg:p-6 flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-dc-muted rounded-xl flex items-center justify-center">
                      <IconComponent size={20} className="text-dc-primary" />
                    </div>
                    <span className="inline-flex px-2.5 py-1 rounded-full bg-dc-muted text-dc-text-secondary text-[11px] font-semibold">
                      {feature.badge}
                    </span>
                  </div>
                  <h2 className="text-dc-text text-lg font-bold">{feature.title}</h2>
                  <p className="mt-2 text-dc-text-secondary text-sm leading-relaxed flex-1">{feature.desc}</p>
                  <Link
                    href={feature.href}
                    className="mt-5 h-11 rounded-xl bg-dc-primary text-white text-sm font-semibold flex items-center justify-center hover:bg-[#2d6b45] transition-colors"
                  >
                    {feature.cta}
                  </Link>
                </article>
              )
            })}
          </section>
        </main>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      <MobileBottomNav />
    </div>
  )
}
