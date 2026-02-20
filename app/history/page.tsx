"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { onAuthChange } from "@/lib/firebase/auth"
import { getUserMenuPlans, getUserPlannerPlans } from "@/lib/firebase/firestore"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import type { StoredMenuPlan, StoredPlannerPlan } from "@/lib/types/api"

type MainTab = "추천 결과" | "식단 플랜"
type TimeFilter = "전체" | "5분 이하" | "10분" | "15분"

const FILTERS: TimeFilter[] = ["전체", "5분 이하", "10분", "15분"]

// 탭 URL 파라미터 상수 (오타 방지)
const TAB_PARAM_PLAN = "식단플랜" as const

// ─── 목 플랜 데이터 제거됨 (실제 Firebase 데이터 사용) ───────────

// ─── 날짜 그룹핑 ─────────────────────────────────────────────────
const toDateLabel = (isoString: string) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTime = today.getTime()
  const yesterdayTime = todayTime - 86400000
  const d = new Date(isoString)
  d.setHours(0, 0, 0, 0)
  const t = d.getTime()
  if (t === todayTime) return "오늘"
  if (t === yesterdayTime) return "어제"
  return new Date(isoString).toLocaleDateString("ko-KR", {
    year: "numeric",
    month: "long",
    day: "numeric",
  })
}

const groupByDate = <T extends { createdAt: string }>(items: T[]): Record<string, T[]> => {
  const groups: Record<string, T[]> = {}
  items.forEach((item) => {
    const label = toDateLabel(item.createdAt)
    if (!groups[label]) groups[label] = []
    groups[label].push(item) // ✅ 버그 수정: plan → item
  })
  return groups
}

// ─── 추천 결과 카드 ───────────────────────────────────────────────
function HistoryCard({ plan }: { plan: StoredMenuPlan }) {
  const mainTitle = plan.output.menuOptions[0]?.title || "메뉴 이름 없음"
  const timeStr = new Date(plan.createdAt).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })
  const tags = plan.output.menuOptions.slice(0, 3).map((m) => m.title)

  return (
    <div className="bg-dc-surface rounded-2xl border border-dc-border p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <span className="text-[11px] font-semibold text-dc-primary bg-dc-primary-light px-2.5 py-1 rounded-full w-fit">
          {timeStr}
        </span>
        <div className="text-dc-text text-[15px] font-bold leading-snug">{mainTitle}</div>
        <div className="text-dc-text-secondary text-[12px] leading-relaxed">
          {tags.join(" · ")}
        </div>
      </div>
      <Link
        href={`/result?resultId=${plan.resultId}`}
        className="h-11 bg-dc-primary text-white text-[13px] font-semibold rounded-xl flex items-center justify-center hover:bg-[#2d6b45] transition-colors"
      >
        다시 사용하기
      </Link>
    </div>
  )
}

// ─── 식단 플랜 카드 ──────────────────────────────────────────────
function PlanCard({ plan }: { plan: StoredPlannerPlan }) {
  const timeStr = new Date(plan.createdAt).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  const day1 = plan.output.dayPlans[0]
  const mealsPerDay = plan.input.mealsPerDay
  const preview = day1?.meals.slice(0, mealsPerDay) || []

  return (
    <div className="bg-dc-surface rounded-2xl border border-dc-border p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        <div className="flex items-center justify-between">
          <span className="text-[11px] font-semibold text-dc-primary bg-dc-primary-light px-2.5 py-1 rounded-full">
            {timeStr}
          </span>
          <span className="text-[11px] text-dc-text-muted">
            {plan.input.days}일 · 하루 {mealsPerDay}끼
          </span>
        </div>
        <div className="text-dc-text text-[15px] font-bold leading-snug">
          {plan.input.days}일 식단 플랜
        </div>
        {plan.input.budget && (
          <div className="text-dc-text-muted text-[12px]">
            예산 {plan.input.budget.toLocaleString()}원
          </div>
        )}
      </div>

      {/* Day 1 미리보기 */}
      {preview.length > 0 && (
        <div className="bg-dc-muted rounded-xl p-3 flex flex-col gap-1.5">
          <span className="text-[11px] font-semibold text-dc-text-muted">Day 1 미리보기</span>
          {preview.map((meal, i) => (
            <div key={i} className="flex items-center gap-2">
              <span className="text-[11px] text-dc-text-muted w-6 flex-none">
                {["아침", "점심", "저녁"][i]}
              </span>
              <span className="text-[13px] text-dc-text font-medium">{meal.name}</span>
            </div>
          ))}
        </div>
      )}

      {/* 장보기 요약 */}
      <div className="flex items-center text-[12px] text-dc-text-secondary">
        <span>🛒 장보기 {plan.output.shoppingList.length}가지</span>
        <span className="ml-auto font-semibold text-dc-primary">
          약 {plan.output.totalEstimatedCost.toLocaleString()}원
        </span>
      </div>

      {/* 버튼 */}
      <Link
        href={`/planner/detail?planId=${plan.planId}`}
        className="w-full h-11 bg-dc-primary text-white text-[13px] font-semibold rounded-xl hover:bg-[#2d6b45] transition-colors flex items-center justify-center"
      >
        자세히 보기
      </Link>
    </div>
  )
}

// ─── useSearchParams 사용 부분을 별도 컴포넌트로 분리 ─────────────
function HistoryContent() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const tabParam = searchParams.get("tab")

  const [userId, setUserId] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<MainTab>(
    tabParam === TAB_PARAM_PLAN ? "식단 플랜" : "추천 결과"
  )
  const [history, setHistory] = useState<StoredMenuPlan[]>([])
  const [activeFilter, setActiveFilter] = useState<TimeFilter>("전체")
  const [loadingHistory, setLoadingHistory] = useState(true)
  const [historyError, setHistoryError] = useState<string | null>(null)
  const [plannerPlans, setPlannerPlans] = useState<StoredPlannerPlan[]>([])
  const [loadingPlans, setLoadingPlans] = useState(true)
  const [plansError, setPlansError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (!user) router.replace("/login?redirect=/history")
      else setUserId(user.uid)
    })
    return () => unsubscribe()
  }, [router])

  // URL 쿼리 파라미터로 탭 동기화
  useEffect(() => {
    setActiveTab(tabParam === TAB_PARAM_PLAN ? "식단 플랜" : "추천 결과")
  }, [tabParam])

  const handleTabChange = (tab: MainTab) => {
    setActiveTab(tab)
    router.push(
      tab === "식단 플랜" ? `/history?tab=${TAB_PARAM_PLAN}` : "/history",
      { scroll: false }
    )
  }

  const fetchHistory = async (uid: string) => {
    setLoadingHistory(true)
    setHistoryError(null)
    const { data, error } = await getUserMenuPlans(uid)
    if (error) setHistoryError("히스토리를 불러오는데 실패했습니다")
    else setHistory(data || [])
    setLoadingHistory(false)
  }

  const fetchPlannerPlans = async (uid: string) => {
    setLoadingPlans(true)
    setPlansError(null)
    const { data, error } = await getUserPlannerPlans(uid)
    if (error) setPlansError("플랜 목록을 불러오는데 실패했습니다")
    else setPlannerPlans(data || [])
    setLoadingPlans(false)
  }

  useEffect(() => {
    if (!userId) return
    fetchHistory(userId)
    fetchPlannerPlans(userId)
  }, [userId])

  // ✅ 필터 로직: timeMin이 timeLimitMin(5/10/15) 기준으로 저장되므로 범위 비교
  const filteredHistory = history.filter((item) => {
    if (activeFilter === "전체") return true
    const t = item.output.menuOptions[0]?.timeMin
    if (t === undefined || t === null) return false
    if (activeFilter === "5분 이하") return t <= 5
    if (activeFilter === "10분") return t <= 10
    if (activeFilter === "15분") return t <= 15
    return true
  })

  const groupedHistory = groupByDate(filteredHistory)
  const groupedPlans = groupByDate(plannerPlans)

  return (
    <div className="flex w-full min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
      <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

      <div className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-5 lg:py-12 flex flex-col gap-5 lg:gap-6 pb-nav-safe lg:pb-12">
        <div className="flex flex-col gap-1">
          <h1 className="text-dc-text text-[22px] lg:text-[28px] font-bold">내 히스토리</h1>
          <p className="text-dc-text-secondary text-[13px] lg:text-sm leading-relaxed">
            이전에 생성한 메뉴와 식단 플랜을 확인하세요
          </p>
        </div>

        {/* 메인 탭 */}
        <div className="flex bg-dc-muted rounded-xl p-1 gap-1">
          {(["추천 결과", "식단 플랜"] as MainTab[]).map((tab) => (
            <button
              key={tab}
              type="button"
              onClick={() => handleTabChange(tab)}
              className={`flex-1 h-10 rounded-lg text-[13px] font-semibold transition-all duration-150 ${
                activeTab === tab
                  ? "bg-dc-surface text-dc-text shadow-sm"
                  : "text-dc-text-muted hover:text-dc-text"
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* ── 추천 결과 탭 ── */}
        {activeTab === "추천 결과" && (
          <>
            <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-5 px-5 lg:mx-0 lg:px-0 lg:flex-wrap">
              {FILTERS.map((f) => (
                <button
                  key={f}
                  onClick={() => setActiveFilter(f)}
                  className={`flex-none h-11 px-4 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap ${
                    activeFilter === f
                      ? "bg-dc-primary text-white"
                      : "bg-dc-muted text-dc-text-secondary hover:bg-dc-border"
                  }`}
                >
                  {f}
                </button>
              ))}
            </div>

            {loadingHistory && (
              <div className="flex items-center justify-center py-12 text-dc-text-secondary">
                로딩 중...
              </div>
            )}
            {!loadingHistory && historyError && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="text-dc-text font-semibold">{historyError}</div>
                <button
                  onClick={() => userId && fetchHistory(userId)}
                  className="h-10 px-4 bg-dc-primary text-white text-sm font-medium rounded-lg hover:bg-[#2d6b45] transition-colors"
                >
                  다시 시도
                </button>
              </div>
            )}
            {!loadingHistory && !historyError && filteredHistory.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="text-4xl">📋</div>
                <div className="text-dc-text font-semibold">아직 생성한 메뉴가 없어요</div>
                <Link
                  href="/home"
                  className="h-10 px-4 bg-dc-primary text-white text-sm font-medium rounded-lg hover:bg-[#2d6b45] transition-colors flex items-center"
                >
                  메뉴 만들러 가기
                </Link>
              </div>
            )}
            {!loadingHistory && !historyError && filteredHistory.length > 0 && (
              <div className="flex flex-col gap-6">
                {Object.entries(groupedHistory).map(([date, plans]) => (
                  <div key={date} className="flex flex-col gap-3">
                    <div className="text-dc-text-muted text-[12px] font-semibold tracking-wide">
                      {date}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
                      {plans.map((plan) => (
                        <HistoryCard key={plan.resultId} plan={plan} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}

        {/* ── 식단 플랜 탭 ── */}
        {activeTab === "식단 플랜" && (
          <>
            {loadingPlans && (
              <div className="flex items-center justify-center py-12 text-dc-text-secondary">
                로딩 중...
              </div>
            )}
            {!loadingPlans && plansError && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="text-dc-text font-semibold">{plansError}</div>
                <button
                  onClick={() => userId && fetchPlannerPlans(userId)}
                  className="h-10 px-4 bg-dc-primary text-white text-sm font-medium rounded-lg hover:bg-[#2d6b45] transition-colors"
                >
                  다시 시도
                </button>
              </div>
            )}
            {!loadingPlans && !plansError && plannerPlans.length === 0 && (
              <div className="flex flex-col items-center justify-center py-12 gap-4">
                <div className="text-4xl">📅</div>
                <div className="text-dc-text font-semibold">저장된 식단 플랜이 없어요</div>
                <Link
                  href="/planner"
                  className="h-10 px-4 bg-dc-primary text-white text-sm font-medium rounded-lg hover:bg-[#2d6b45] transition-colors flex items-center"
                >
                  플랜 만들러 가기
                </Link>
              </div>
            )}
            {!loadingPlans && !plansError && plannerPlans.length > 0 && (
              <div className="flex flex-col gap-6">
                {Object.entries(groupedPlans).map(([date, plans]) => (
                  <div key={date} className="flex flex-col gap-3">
                    <div className="text-dc-text-muted text-[12px] font-semibold tracking-wide">
                      {date}
                    </div>
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
                      {plans.map((plan) => (
                        <PlanCard key={plan.planId} plan={plan} />
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
    </div>
  )
}

// ─── 메인 ────────────────────────────────────────────────────────
export default function HistoryPage() {
  return (
    <div className="min-h-screen bg-dc-bg">
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      {/* ✅ useSearchParams를 사용하는 컴포넌트를 Suspense로 감싸야 빌드 에러 없음 */}
      <Suspense
        fallback={
          <div className="flex items-center justify-center py-20 text-dc-text-secondary">
            로딩 중...
          </div>
        }
      >
        <HistoryContent />
      </Suspense>

      <MobileBottomNav />
    </div>
  )
}