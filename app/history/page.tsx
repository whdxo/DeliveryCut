"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { onAuthChange } from "@/lib/firebase/auth"
import { getUserMenuPlans } from "@/lib/firebase/firestore"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import type { StoredMenuPlan } from "@/lib/types/api"

type TimeFilter = "all" | 5 | 10 | 15

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
  const [filter, setFilter] = useState<TimeFilter>("all")
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

  // 필터링
  const filteredHistory = history.filter((item) => {
    if (filter === "all") return true
    // 첫 번째 메뉴의 timeMin으로 필터링
    return item.output.menuOptions[0]?.timeMin === filter
  })

  const groupedHistory = groupByDate(filteredHistory)

  return (
    <div className="min-h-screen bg-dc-bg">
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      <div className="flex w-full">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        <div className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-6 lg:py-12 flex flex-col gap-6 lg:gap-8 pb-24 lg:pb-12">
          <div className="flex flex-col gap-1">
            <h1 className="text-dc-text text-2xl lg:text-[28px] font-bold">내 히스토리</h1>
            <p className="text-dc-text-secondary text-sm">
              이전에 생성한 메뉴 목록을 확인하세요
            </p>
          </div>

          {/* 필터 칩 */}
          <div className="flex gap-2 flex-wrap">
            <button
              onClick={() => setFilter("all")}
              className={`h-9 px-4 rounded-full text-sm font-medium transition-colors ${filter === "all"
                  ? "bg-dc-primary text-white"
                  : "bg-dc-muted text-dc-text-secondary hover:bg-dc-border"
                }`}
            >
              전체
            </button>
            <button
              onClick={() => setFilter(5)}
              className={`h-9 px-4 rounded-full text-sm font-medium transition-colors ${filter === 5
                  ? "bg-dc-primary text-white"
                  : "bg-dc-muted text-dc-text-secondary hover:bg-dc-border"
                }`}
            >
              5분 이하
            </button>
            <button
              onClick={() => setFilter(10)}
              className={`h-9 px-4 rounded-full text-sm font-medium transition-colors ${filter === 10
                  ? "bg-dc-primary text-white"
                  : "bg-dc-muted text-dc-text-secondary hover:bg-dc-border"
                }`}
            >
              10분
            </button>
            <button
              onClick={() => setFilter(15)}
              className={`h-9 px-4 rounded-full text-sm font-medium transition-colors ${filter === 15
                  ? "bg-dc-primary text-white"
                  : "bg-dc-muted text-dc-text-secondary hover:bg-dc-border"
                }`}
            >
              15분
            </button>
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
                  <div className="text-dc-text text-sm font-semibold">{date}</div>
                  <div className="flex flex-col gap-3">
                    {plans.map((plan) => (
                      <div
                        key={plan.resultId}
                        className="bg-dc-surface rounded-xl border border-dc-border p-5 flex flex-col gap-3"
                      >
                        <div className="flex items-start justify-between gap-4">
                          <div className="flex flex-col gap-1">
                            <div className="text-dc-text font-semibold">
                              {plan.output.menuOptions[0]?.title || "메뉴 이름 없음"}
                            </div>
                            <div className="text-dc-text-secondary text-xs">
                              {new Date(plan.createdAt).toLocaleTimeString("ko-KR", {
                                hour: "2-digit",
                                minute: "2-digit",
                              })}
                            </div>
                          </div>
                          <Link
                            href={`/result?resultId=${plan.resultId}`}
                            className="h-9 px-4 bg-dc-primary text-white text-sm font-medium rounded-lg hover:bg-[#2d6b45] transition-colors flex items-center flex-none"
                          >
                            다시 보기
                          </Link>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {plan.output.menuOptions.slice(0, 3).map((menu, idx) => (
                            <span
                              key={idx}
                              className="text-xs text-dc-text-secondary bg-dc-muted px-2 py-1 rounded-full"
                            >
                              {menu.title}
                            </span>
                          ))}
                        </div>
                      </div>
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
