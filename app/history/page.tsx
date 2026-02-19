"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { onAuthChange } from "@/lib/firebase/auth"
import { getUserMenuPlans } from "@/lib/firebase/firestore"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import type { StoredMenuPlan } from "@/lib/types/api"

type TimeFilter = "전체" | "5분 이하" | "10분" | "15분"

const FILTERS: TimeFilter[] = ["전체", "5분 이하", "10분", "15분"]

// 날짜 그룹핑 헬퍼
const groupByDate = (plans: StoredMenuPlan[]) => {
  const today = new Date()
  today.setHours(0, 0, 0, 0)
  const todayTime = today.getTime()
  const yesterdayTime = todayTime - 86400000

  const groups: Record<string, StoredMenuPlan[]> = {}

  plans.forEach((plan) => {
    const planDate = new Date(plan.createdAt)
    planDate.setHours(0, 0, 0, 0)
    const planTime = planDate.getTime()

    let label: string
    if (planTime === todayTime) {
      label = "오늘"
    } else if (planTime === yesterdayTime) {
      label = "어제"
    } else {
      label = new Date(plan.createdAt).toLocaleDateString("ko-KR", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    }

    if (!groups[label]) groups[label] = []
    groups[label].push(plan)
  })

  return groups
}

export default function HistoryPage() {
  const router = useRouter()
  const [userId, setUserId] = useState<string | null>(null)
  const [history, setHistory] = useState<StoredMenuPlan[]>([])
  const [activeFilter, setActiveFilter] = useState<TimeFilter>("전체")
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // 인증 체크
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (!user) {
        router.replace("/login?redirect=/history")
      } else {
        setUserId(user.uid)
      }
    })
    return () => unsubscribe()
  }, [router])

  // 히스토리 조회
  useEffect(() => {
    if (!userId) return

    const fetchHistory = async () => {
      setLoading(true)
      try {
        const { data, error: fetchError } = await getUserMenuPlans(userId)
        if (fetchError) {
          setError("히스토리를 불러오는데 실패했습니다")
        } else {
          setHistory(data || [])
        }
      } catch (err) {
        setError("알 수 없는 오류가 발생했습니다")
      } finally {
        setLoading(false)
      }
    }

    fetchHistory()
  }, [userId])

  // 필터링 logic
  const filteredHistory = history.filter((item) => {
    if (activeFilter === "전체") return true

    const timeLimit = item.output.menuOptions[0]?.timeMin
    if (activeFilter === "5분 이하") return timeLimit <= 5
    if (activeFilter === "10분") return timeLimit === 10
    if (activeFilter === "15분") return timeLimit === 15
    return true
  })

  const groupedHistory = groupByDate(filteredHistory)

  return (
    <div className="min-h-screen bg-dc-bg">
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      <div className="flex w-full min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        <div className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-5 lg:py-12 flex flex-col gap-5 lg:gap-6 pb-nav-safe lg:pb-12">

          {/* 페이지 헤더 */}
          <div className="flex flex-col gap-1">
            <h1 className="text-dc-text text-[22px] lg:text-[28px] font-bold">내 히스토리</h1>
            <p className="text-dc-text-secondary text-[13px] lg:text-sm leading-relaxed">
              이전에 생성한 메뉴 목록을 확인하세요
            </p>
          </div>

          {/* 필터 탭 */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-5 px-5 lg:mx-0 lg:px-0 lg:flex-wrap">
            {FILTERS.map((f) => (
              <button
                key={f}
                onClick={() => setActiveFilter(f)}
                className={`flex-none h-11 px-4 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap ${activeFilter === f
                    ? "bg-dc-primary text-white"
                    : "bg-dc-muted text-dc-text-secondary hover:bg-dc-border"
                  }`}
              >
                {f}
              </button>
            ))}
          </div>

          {/* 로딩 */}
          {loading && (
            <div className="flex items-center justify-center py-12 text-dc-text-secondary">
              로딩 중...
            </div>
          )}

          {/* 에러 */}
          {!loading && error && (
            <div className="flex flex-col items-center justify-center py-12 gap-4">
              <div className="text-dc-text font-semibold">{error}</div>
              <button
                onClick={() => window.location.reload()}
                className="h-10 px-4 bg-dc-primary text-white text-sm font-medium rounded-lg hover:bg-[#2d6b45] transition-colors"
              >
                다시 시도
              </button>
            </div>
          )}

          {/* 빈 히스토리 */}
          {!loading && !error && filteredHistory.length === 0 && (
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

          {/* 히스토리 목록 */}
          {!loading && !error && filteredHistory.length > 0 && (
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
        </div>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      <MobileBottomNav />
    </div>
  )
}

function HistoryCard({ plan }: { plan: StoredMenuPlan }) {
  const mainTitle = plan.output.menuOptions[0]?.title || "메뉴 이름 없음"
  const timeStr = new Date(plan.createdAt).toLocaleTimeString("ko-KR", {
    hour: "2-digit",
    minute: "2-digit",
  })

  // 첫 3개 메뉴 이름을 태그로 사용
  const tags = plan.output.menuOptions.slice(0, 3).map(m => m.title)

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

      <div className="flex gap-2 mt-0.5">
        <Link
          href={`/result?resultId=${plan.resultId}`}
          className="flex-1 h-11 bg-dc-primary text-white text-[13px] font-semibold rounded-xl flex items-center justify-center hover:bg-[#2d6b45] transition-colors"
        >
          다시 사용하기
        </Link>
        <Link
          href={`/result?resultId=${plan.resultId}`}
          className="h-11 px-4 bg-dc-muted text-dc-text-secondary text-[13px] font-medium rounded-xl flex items-center justify-center hover:bg-dc-border transition-colors"
        >
          보기
        </Link>
      </div>
    </div>
  )
}
