"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Clock, Flame, ChevronRight, Refrigerator } from "lucide-react"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
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

// ─── 상수 ────────────────────────────────────────────────────────
const TIME_OPTIONS = ["5분", "10분", "15분"]
const TOOL_OPTIONS = ["전자레인지", "팬", "에어프라이어"]
function toTool(tool: string): Tool {
  switch (tool) {
    case "전자레인지": return "microwave"
    case "팬": return "pan"
    case "에어프라이어": return "airfryer"
    default: throw new Error(`Unknown tool: ${tool}`)
  }
}
const TIME_MAP: Record<string, 5 | 10 | 15> = {
  "5분": 5,
  "10분": 10,
  "15분": 15,
}
const EXPIRY_URGENT_DAYS = 3
const EXPIRY_WARN_DAYS = 7

// ─── 유통기한 헬퍼 ───────────────────────────────────────────────
function getDaysLeft(expiresOn: string): number {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const exp = new Date(expiresOn)
  exp.setHours(0, 0, 0, 0)
  return Math.ceil((exp.getTime() - today.getTime()) / (24 * 60 * 60 * 1000))
}

function getExpiryLabel(days: number): string {
  if (days < 0) return "만료됨"
  if (days === 0) return "오늘까지"
  return `D-${days}`
}

function getExpiryBadge(days: number): string {
  if (days <= 0) return "text-red-600 bg-red-50 border-red-200"
  if (days <= EXPIRY_URGENT_DAYS) return "text-amber-700 bg-amber-50 border-amber-200"
  return "text-yellow-700 bg-yellow-50 border-yellow-200"
}

function containsIngredient(source: string, name: string) {
  return source.split(",").map((t) => t.trim()).includes(name.trim())
}

function removeIngredient(source: string, name: string): string {
  return source
    .split(",")
    .map((t) => t.trim())
    .filter((t) => t !== name.trim())
    .join(", ")
}

// ─── 서브 컴포넌트 ────────────────────────────────────────────────
function OptionPill({ label, active, onClick }: { label: string; active: boolean; onClick: () => void }) {
  return (
    <button
      type="button"
      onClick={onClick}
      className={`h-11 flex-1 rounded-xl text-[13px] font-semibold transition-all duration-150
        ${active
          ? "bg-dc-primary text-white shadow-sm"
          : "bg-dc-muted text-dc-text-secondary hover:bg-[#E8E6E1] active:scale-[0.98]"
        }`}
    >
      {label}
    </button>
  )
}

function FridgeChip({ item, added, onToggle }: { item: FridgeItem; added: boolean; onToggle: () => void }) {
  const days = item.expiresOn ? getDaysLeft(item.expiresOn) : null
  const hasExpiry = days !== null && days <= EXPIRY_WARN_DAYS

  return (
    <button
      type="button"
      onClick={onToggle}
      className={`
        h-9 pl-2.5 pr-3 rounded-full text-[13px] font-medium
        flex items-center gap-1.5 transition-all duration-150 active:scale-[0.97]
        ${added
          ? "bg-dc-border text-dc-text-muted opacity-60"
          : "bg-dc-primary-light text-dc-primary hover:brightness-95"
        }
      `}
    >
      {hasExpiry && (
        <span className={`text-[10px] font-bold px-1.5 py-[2px] rounded-full border ${getExpiryBadge(days!)}`}>
          {getExpiryLabel(days!)}
        </span>
      )}
      {added && <span className="text-[11px]">✓</span>}
      <span>{item.name}</span>
      <span className="text-[11px] text-dc-primary/50">
        {item.amount}{unitLabel(item.unit)}
      </span>
    </button>
  )
}

// ─── 메인 ─────────────────────────────────────────────────────────
export default function QuickPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [selectedTime, setSelectedTime] = useState("10분")
  const [selectedTools, setSelectedTools] = useState<string[]>(["팬"])
  const [ingredients, setIngredients] = useState("")
  const [avoidIngredients, setAvoidIngredients] = useState("")
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [error, setError] = useState("")

  const [authUserId, setAuthUserId] = useState<string | null>(null)
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([])

  // ✨ 랜딩 페이지에서 메뉴 이름을 넘겨받으면 재료 입력창에 자동 입력
  useEffect(() => {
    const menuFromLanding = searchParams.get("menu")
    if (menuFromLanding) {
      setIngredients(menuFromLanding)
    }
  }, [searchParams])

  useEffect(() => {
    const unsub = onAuthChange((u) => setAuthUserId(u?.uid ?? null))
    return () => unsub()
  }, [])

  useEffect(() => {
    if (!authUserId) { setFridgeItems([]); return }
    fetch("/api/fridge?sort=updatedAt", { headers: { "x-user-id": authUserId } })
      .then((r) => r.ok ? r.json() : null)
      .then((d: FridgeListResponse | null) => setFridgeItems(d?.items ?? []))
      .catch(() => setFridgeItems([]))
  }, [authUserId])

  const sortedFridge = [...fridgeItems].sort((a, b) => {
    const da = a.expiresOn ? getDaysLeft(a.expiresOn) : 999
    const db = b.expiresOn ? getDaysLeft(b.expiresOn) : 999
    return da - db
  })

  const urgentItems = sortedFridge.filter(
    (i) => i.expiresOn && getDaysLeft(i.expiresOn) <= EXPIRY_URGENT_DAYS
  )

  const toggleTool = (t: string) =>
    setSelectedTools((p) => p.includes(t) ? p.filter((x) => x !== t) : [...p, t])

  const toggleIngredient = (name: string) => {
    if (!name.trim()) return
    setIngredients((prev) => {
      if (containsIngredient(prev, name)) return removeIngredient(prev, name)
      if (!prev.trim()) return name
      return `${prev}, ${name}`
    })
  }

  const handleSubmit = async () => {
    if (!ingredients.trim() || isSubmitting) return
    setIsSubmitting(true)
    setError("")

    const payload: GenerateInput = {
      timeLimitMin: TIME_MAP[selectedTime] ?? 10,
      tools: selectedTools.map(toTool),
      ingredientsText: ingredients.trim(),
      ...(avoidIngredients.trim() ? { dislikedIngredientsText: avoidIngredients.trim() } : {}),
    }

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...payload, userId: authUserId }),
      })
      const data = (await res.json()) as GenerateResponse | ApiError
      if (!res.ok) {
        setError("error" in data ? data.error.message : "메뉴 생성 중 오류가 발생했어요.")
        return
      }
      const ok = data as GenerateResponse
      const cached: ResultResponse = {
        resultId: ok.resultId,
        input: payload,
        output: ok.output,
        createdAt: new Date().toISOString(),
      }
      sessionStorage.setItem(`deliverycut:result:${ok.resultId}`, JSON.stringify(cached))
      router.push(`/result?resultId=${ok.resultId}`)
    } catch {
      setError("네트워크 오류가 발생했어요. 다시 시도해주세요.")
    } finally {
      setIsSubmitting(false)
    }
  }

  const canSubmit = ingredients.trim().length > 0 && !isSubmitting

  return (
    <div className="min-h-screen bg-dc-bg">
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      <div className="flex w-full">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        <main className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-6 lg:py-12 pb-[148px] lg:pb-16 flex flex-col gap-5 lg:gap-6">

          <header className="flex flex-col gap-1">
            <div className="flex items-center gap-2">
              <span className="inline-flex h-6 px-2.5 items-center rounded-full bg-dc-primary-light text-dc-primary text-[11px] font-bold tracking-wide">
                AI 추천
              </span>
              {/* ✨ 랜딩에서 넘어온 경우 메뉴 이름 표시 */}
              {searchParams.get("menu") && (
                <span className="inline-flex h-6 px-2.5 items-center rounded-full bg-dc-muted text-dc-text-secondary text-[11px] font-medium">
                  {searchParams.get("menu")} 레시피
                </span>
              )}
            </div>
            <h1 className="text-dc-text text-[22px] lg:text-[28px] font-bold leading-snug mt-1">
              지금 만들 수 있는 한 끼
            </h1>
            <p className="text-dc-text-secondary text-[13px] lg:text-sm">
              재료와 조건을 입력하면 AI가 딱 맞는 메뉴 3개를 추천해요
            </p>
          </header>

          <div className="grid grid-cols-1 lg:grid-cols-[1fr_268px] gap-5 lg:gap-6">
            <div className="flex flex-col gap-4">

              {/* 요리 시간 */}
              <section className="bg-dc-surface rounded-2xl border border-dc-border p-4 lg:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Clock size={14} className="text-dc-text-secondary" />
                  <span className="text-dc-text text-[13px] font-semibold">요리 시간</span>
                </div>
                <div className="flex gap-2">
                  {TIME_OPTIONS.map((t) => (
                    <OptionPill key={t} label={t} active={selectedTime === t} onClick={() => setSelectedTime(t)} />
                  ))}
                </div>
              </section>

              {/* 조리 도구 */}
              <section className="bg-dc-surface rounded-2xl border border-dc-border p-4 lg:p-5">
                <div className="flex items-center gap-2 mb-3">
                  <Flame size={14} className="text-dc-text-secondary" />
                  <span className="text-dc-text text-[13px] font-semibold">조리 도구</span>
                </div>
                <div className="flex flex-wrap gap-2">
                  {TOOL_OPTIONS.map((tool) => (
                    <button
                      key={tool}
                      type="button"
                      onClick={() => toggleTool(tool)}
                      className={`h-11 px-5 rounded-full text-[13px] font-semibold transition-all duration-150
                        ${selectedTools.includes(tool)
                          ? "bg-dc-primary text-white shadow-sm"
                          : "bg-dc-muted text-dc-text-secondary hover:bg-[#E8E6E1] active:scale-[0.98]"
                        }`}
                    >
                      {tool}
                    </button>
                  ))}
                </div>
              </section>

              {/* 재료 입력 + 냉장고 */}
              <section className="bg-dc-surface rounded-2xl border border-dc-border p-4 lg:p-5 flex flex-col gap-4">
                <div className="flex flex-col gap-2">
                  <span className="text-dc-text text-[13px] font-semibold">재료 입력</span>
                  <textarea
                    value={ingredients}
                    onChange={(e) => setIngredients(e.target.value)}
                    placeholder="예) 계란, 두부, 김치, 양파"
                    rows={3}
                    className="w-full px-4 py-3 bg-dc-muted rounded-xl text-dc-text text-[15px] placeholder:text-dc-text-muted resize-none focus:outline-none focus:ring-1 focus:ring-dc-primary border border-transparent focus:border-dc-primary transition-colors leading-relaxed"
                  />
                </div>

                {authUserId && fridgeItems.length === 0 && (
                  <div className="pt-1 border-t border-dc-border">
                    <div className="flex items-center gap-2 py-3 px-1">
                      <Refrigerator size={14} className="text-dc-text-muted flex-none" />
                      <span className="text-dc-text-muted text-[13px]">
                        냉장고가 비어있어요.{" "}
                        <a href="/fridge" className="text-dc-primary font-medium underline underline-offset-2">
                          재료 추가하기
                        </a>
                      </span>
                    </div>
                  </div>
                )}

                {fridgeItems.length > 0 && (
                  <div className="flex flex-col gap-3 pt-1 border-t border-dc-border">
                    {urgentItems.length > 0 && (
                      <div className="flex flex-col gap-2">
                        <div className="flex items-center gap-1.5">
                          <span className="relative flex h-2 w-2">
                            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-amber-400 opacity-75" />
                            <span className="relative inline-flex rounded-full h-2 w-2 bg-amber-400" />
                          </span>
                          <span className="text-[12px] font-semibold text-dc-text">먼저 쓸 재료</span>
                          <span className="text-[11px] text-dc-text-muted">유통기한 3일 이내</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {urgentItems.map((item) => (
                            <FridgeChip
                              key={item.id}
                              item={item}
                              added={containsIngredient(ingredients, item.name)}
                              onToggle={() => toggleIngredient(item.name)}
                            />
                          ))}
                        </div>
                      </div>
                    )}
                    <div className="flex flex-col gap-2">
                      <div className="flex items-center gap-1.5">
                        <Refrigerator size={13} className="text-dc-text-muted" />
                        <span className="text-[12px] font-semibold text-dc-text-secondary">내 냉장고에서 선택</span>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {sortedFridge.map((item) => (
                          <FridgeChip
                            key={item.id}
                            item={item}
                            added={containsIngredient(ingredients, item.name)}
                            onToggle={() => toggleIngredient(item.name)}
                          />
                        ))}
                      </div>
                    </div>
                  </div>
                )}
              </section>

              {/* 기피 재료 */}
              <section className="bg-dc-surface rounded-2xl border border-dc-border p-4 lg:p-5">
                <span className="text-dc-text text-[13px] font-semibold block mb-2.5">기피 재료</span>
                <input
                  value={avoidIngredients}
                  onChange={(e) => setAvoidIngredients(e.target.value)}
                  placeholder="예) 고수, 땅콩"
                  className="w-full h-11 px-4 bg-dc-muted rounded-xl text-dc-text text-[15px] placeholder:text-dc-text-muted focus:outline-none focus:ring-1 focus:ring-dc-primary border border-transparent focus:border-dc-primary transition-colors"
                />
              </section>

              {error && <p className="text-red-500 text-[13px] px-1">{error}</p>}

              {/* 데스크탑 제출 버튼 */}
              <button
                type="button"
                onClick={handleSubmit}
                disabled={!canSubmit}
                className="hidden lg:flex w-full h-[52px] bg-dc-primary text-white text-[15px] font-bold rounded-xl items-center justify-center gap-2 hover:bg-[#2d6b45] transition-colors disabled:opacity-40 disabled:cursor-not-allowed"
              >
                {isSubmitting ? (
                  <>
                    <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    AI 메뉴 생성 중...
                  </>
                ) : (
                  <>배달컷 메뉴 추천받기 <ChevronRight size={18} /></>
                )}
              </button>
            </div>

            {/* 데스크탑 사이드 패널 */}
            <aside className="hidden lg:flex flex-col gap-4">
              <div className="bg-dc-surface rounded-2xl border border-dc-border p-5">
                <p className="text-dc-text text-[13px] font-semibold mb-4">추천 결과에 포함되는 것</p>
                <div className="flex flex-col gap-3">
                  {[
                    { emoji: "🍽️", text: "메뉴 3가지 추천" },
                    { emoji: "📋", text: "선택 메뉴 상세 레시피" },
                    { emoji: "📅", text: "3일 식단 플랜" },
                    { emoji: "🛒", text: "부족한 재료 장보기 목록" },
                  ].map((item) => (
                    <div key={item.text} className="flex items-center gap-3">
                      <span className="text-base w-6 text-center">{item.emoji}</span>
                      <span className="text-dc-text-secondary text-[13px]">{item.text}</span>
                    </div>
                  ))}
                </div>
              </div>
              <div className="bg-dc-primary-light rounded-2xl p-5">
                <p className="text-dc-primary text-[13px] font-bold mb-1">💡 잘 되는 입력법</p>
                <p className="text-dc-primary/80 text-[12px] leading-relaxed">
                  재료를 쉼표로 구분해서 입력하면 더 정확한 추천을 받을 수 있어요.
                  <br /><br />
                  예) <span className="font-semibold">계란 2개, 두부 반모, 김치</span>
                </p>
              </div>
            </aside>
          </div>
        </main>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      {/* 모바일 하단 고정 버튼 */}
      <div
        className="lg:hidden fixed left-0 right-0 px-5 pt-3 pb-3 bg-dc-bg/95 backdrop-blur-sm border-t border-dc-border z-40"
        style={{ bottom: "calc(56px + env(safe-area-inset-bottom))" }}
      >
        <button
          type="button"
          onClick={handleSubmit}
          disabled={!canSubmit}
          className="w-full h-[52px] bg-dc-primary text-white text-[15px] font-bold rounded-xl flex items-center justify-center gap-2 disabled:opacity-40 disabled:cursor-not-allowed transition-colors"
        >
          {isSubmitting ? (
            <>
              <span className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              AI 메뉴 생성 중...
            </>
          ) : canSubmit ? (
            <>배달컷 메뉴 추천받기 <ChevronRight size={18} /></>
          ) : (
            "재료를 먼저 입력해주세요"
          )}
        </button>
      </div>

      <MobileBottomNav />
    </div>
  )
}