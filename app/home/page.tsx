"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import LoginPromptModal from "@/components/shared/LoginPromptModal"

const TIME_OPTIONS = ["5분", "10분", "15분"]
const TOOL_OPTIONS = ["전자레인지", "팬", "에어프라이어"]
const INGREDIENT_TAGS = ["계란", "두부", "김치"]

const TIPS = [
  {
    title: "알찬 볶음밥",
    desc: "소 반큰술 · 참기름 1큰술 · 1인분",
    badge: "🌟 인기",
  },
  {
    title: "냉장고 간편식",
    desc: "계란 · 두부·당근 · 스크램블도 무방",
    badge: "🔥 추천",
  },
  {
    title: "장보기 교복",
    desc: "계란 · 당근 · 두부 · 핫소스,파파 · 파 · 잡",
    badge: "✨ 새",
  },
]

export default function HomePage() {
  const router = useRouter()
  const [selectedTime, setSelectedTime] = useState("10분")
  const [selectedTools, setSelectedTools] = useState<string[]>(["전자레인지"])
  const [ingredients, setIngredients] = useState("")
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)

  useEffect(() => {
    // 비로그인 상태면 진입 시 모달 표시 (TODO: 실제 auth 상태로 교체)
    const isLoggedIn = false
    if (!isLoggedIn) {
      const t = setTimeout(() => setShowLoginPrompt(true), 600)
      return () => clearTimeout(t)
    }
  }, [])

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    )
  }

  const handleSubmit = () => {
    if (!ingredients.trim()) return
    const params = new URLSearchParams({
      time: selectedTime,
      tools: selectedTools.join(","),
      ingredients,
    })
    router.push(`/result?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-dc-bg">
      {showLoginPrompt && (
        <LoginPromptModal onClose={() => setShowLoginPrompt(false)} />
      )}
      {/* NavBar */}
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      {/* Body */}
      <div className="flex w-full">
        {/* Side Left - desktop only */}
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        {/* Center Content */}
        <div className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-0 pb-24 lg:pb-0">
          <div className="flex flex-col lg:flex-row">

            {/* Main Form Area */}
            <div className="flex-1 px-0 lg:px-10 py-8 lg:py-12 flex flex-col gap-6">
              {/* Title */}
              <div className="flex flex-col gap-1">
                <h1 className="text-dc-text text-2xl lg:text-[28px] font-bold">오늘 뭐 먹지?</h1>
                <p className="text-dc-text-secondary text-[13px] lg:text-sm">
                  재료와 조건을 입력하면 AI가 메뉴를 추천해요
                </p>
              </div>

              {/* Time Card */}
              <div className="bg-dc-surface rounded-2xl border border-dc-border p-4 lg:p-5 flex flex-col gap-3">
                <div className="text-dc-text text-[13px] font-semibold">⏱ 요리 시간</div>
                <div className="flex gap-2">
                  {TIME_OPTIONS.map((t) => (
                    <button
                      key={t}
                      onClick={() => setSelectedTime(t)}
                      className={`flex-1 h-10 rounded-lg text-[13px] font-medium transition-colors ${
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

              {/* Tool Card */}
              <div className="bg-dc-surface rounded-2xl border border-dc-border p-4 lg:p-5 flex flex-col gap-3">
                <div className="text-dc-text text-[13px] font-semibold">🍳 조리 도구</div>
                <div className="flex flex-wrap gap-2">
                  {TOOL_OPTIONS.map((tool) => (
                    <button
                      key={tool}
                      onClick={() => toggleTool(tool)}
                      className={`h-9 px-4 rounded-full text-[13px] font-medium transition-colors ${
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

              {/* Ingredient Card */}
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
                      onClick={() => setIngredients((prev) => prev ? `${prev}, ${tag}` : tag)}
                      className="h-8 px-3.5 rounded-full bg-dc-muted text-dc-text-secondary text-[13px] font-medium hover:bg-dc-border transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>
              </div>

              {/* CTA Button */}
              <button
                onClick={handleSubmit}
                disabled={!ingredients.trim()}
                className="w-full h-[52px] bg-dc-primary text-white text-base font-bold rounded-xl flex items-center justify-center hover:bg-[#2d6b45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
              >
                배달컷 메뉴 만들기 →
              </button>
            </div>

            {/* Right Tips Sidebar - desktop only */}
            <div className="hidden lg:flex w-[300px] flex-none border-l border-dc-border flex-col gap-0 py-12 pr-0">
              <div className="px-6 pb-4">
                <div className="text-dc-text text-sm font-semibold">✓ 지금 뭐 해요?</div>
              </div>
              {TIPS.map((tip, i) => (
                <div
                  key={i}
                  className="px-6 py-4 border-t border-dc-border flex flex-col gap-1"
                >
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
        </div>

        {/* Side Right - desktop only */}
        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      {/* Mobile Bottom Nav */}
      <MobileBottomNav />
    </div>
  )
}
