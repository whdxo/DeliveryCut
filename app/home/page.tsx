"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import LoginPromptModal from "@/components/shared/LoginPromptModal"
import { onAuthChange } from "@/lib/firebase"
import { unitLabel } from "@/lib/fridge/constants"
import type {
  ApiError,
  FridgeItem,
  FridgeListResponse,
  GenerateInput,
  GenerateResponse,
  ResultResponse,
  Tool,
} from "@/lib/types/api"

const TIME_OPTIONS = ["5분", "10분", "15분"]
const TOOL_OPTIONS = ["전자레인지", "팬", "에어프라이어"]
const INGREDIENT_TAGS = ["계란", "두부", "김치", "양파", "참치", "스팸", "대파"]

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

const cacheKey = (resultId: string) => `deliverycut:result:${resultId}`

const toTool = (tool: string): Tool => {
  if (tool === "전자레인지") return "microwave"
  if (tool === "팬") return "pan"
  return "airfryer"
}

const containsIngredient = (source: string, item: string) => {
  const normalized = source
    .split(",")
    .map((token) => token.trim())
    .filter(Boolean)

  return normalized.includes(item.trim())
}

export default function HomePage() {
  const router = useRouter()
  const [selectedTime, setSelectedTime] = useState("10분")
  const [selectedTools, setSelectedTools] = useState<string[]>(["전자레인지"])
  const [ingredients, setIngredients] = useState("")
  const [showLoginPrompt, setShowLoginPrompt] = useState(false)
  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([])
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setAuthUserId(user?.uid ?? null)
      setShowLoginPrompt(!user)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    if (!authUserId) {
      setFridgeItems([])
      return
    }

    const loadFridge = async () => {
      try {
        const response = await fetch("/api/fridge", {
          headers: { "x-user-id": authUserId },
        })

        if (!response.ok) {
          setFridgeItems([])
          return
        }

        const data = (await response.json()) as FridgeListResponse
        setFridgeItems(data.items)
      } catch {
        setFridgeItems([])
      }
    }

    void loadFridge()
  }, [authUserId])

  const toggleTool = (tool: string) => {
    setSelectedTools((prev) =>
      prev.includes(tool) ? prev.filter((t) => t !== tool) : [...prev, tool]
    )
  }

  const appendIngredient = (item: string) => {
    if (!item.trim()) return

    setIngredients((prev) => {
      if (!prev.trim()) return item
      if (containsIngredient(prev, item)) return prev
      return `${prev}, ${item}`
    })
  }

  const handleSubmit = async () => {
    if (!ingredients.trim() || isSubmitting) return

    setIsSubmitting(true)
    setError(null)

    const payload: GenerateInput = {
      timeLimitMin: Number.parseInt(selectedTime, 10) as 5 | 10 | 15,
      tools: selectedTools.map(toTool),
      ingredientsText: ingredients.trim(),
    }

    try {
      const response = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, userId: authUserId }),
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

      <div className="flex w-full">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        <div className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-0 pb-24 lg:pb-0">
          <div className="flex flex-col lg:flex-row">
            <div className="flex-1 px-0 lg:px-10 py-8 lg:py-12 flex flex-col gap-6">
              <div className="flex flex-col gap-1">
                <h1 className="text-dc-text text-2xl lg:text-[28px] font-bold">오늘 뭐 먹지?</h1>
                <p className="text-dc-text-secondary text-[13px] lg:text-sm">
                  재료와 조건을 입력하면 AI가 메뉴를 추천해요
                </p>
              </div>

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
                      onClick={() => appendIngredient(tag)}
                      className="h-8 px-3.5 rounded-full bg-dc-muted text-dc-text-secondary text-[13px] font-medium hover:bg-dc-border transition-colors"
                    >
                      {tag}
                    </button>
                  ))}
                </div>

                {fridgeItems.length > 0 ? (
                  <div className="pt-1 flex flex-col gap-2">
                    <div className="text-dc-text-secondary text-xs font-semibold">내 냉장고에서 추가</div>
                    <div className="flex flex-wrap gap-2">
                      {fridgeItems.map((item) => (
                        <button
                          key={item.id}
                          onClick={() => appendIngredient(item.name)}
                          className="h-8 px-3.5 rounded-full bg-dc-primary-light text-dc-primary text-[13px] font-medium hover:brightness-95 transition"
                        >
                          + {item.name} {item.amount}{unitLabel(item.unit)}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : null}
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

            <div className="hidden lg:flex w-[300px] flex-none border-l border-dc-border flex-col gap-0 py-12 pr-0">
              <div className="px-6 pb-4">
                <div className="text-dc-text text-sm font-semibold">✓ 지금 뭐 해요?</div>
              </div>
              {TIPS.map((tip, i) => (
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
        </div>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      <MobileBottomNav />
    </div>
  )
}






