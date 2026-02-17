"use client"

import { useState, Suspense, useMemo, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import MenuCard from "@/components/results/MenuCard"
import RecipeView from "@/components/results/RecipeView"
import ShoppingList from "@/components/results/ShoppingList"
import type { MenuOption, ResultResponse, Tool } from "@/lib/types/api"

const cacheKey = (resultId: string) => `deliverycut:result:${resultId}`

const toolLabel: Record<Tool, string> = {
  microwave: "전자레인지",
  pan: "팬",
  airfryer: "에어프라이어",
}

// ─── 로딩 스켈레톤 ────────────────────────────────────────────────────────────
function SkeletonCard() {
  return (
    <div className="animate-pulse bg-dc-surface rounded-2xl border border-dc-border p-5 flex flex-col gap-3">
      <div className="h-4 bg-dc-muted rounded w-1/3" />
      <div className="h-3 bg-dc-muted rounded w-2/3" />
      <div className="h-3 bg-dc-muted rounded w-1/2" />
    </div>
  )
}

function LoadingState() {
  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="hidden lg:grid grid-cols-3 gap-4">
        <SkeletonCard />
        <SkeletonCard />
        <SkeletonCard />
      </div>
      <div className="flex flex-col lg:flex-row gap-6">
        <div className="flex-1 animate-pulse bg-dc-surface rounded-2xl border border-dc-border p-6 h-64" />
        <div className="lg:w-[280px] animate-pulse bg-dc-surface rounded-2xl border border-dc-border p-6 h-64" />
      </div>
    </div>
  )
}

// ─── 에러 화면 ────────────────────────────────────────────────────────────────
function ErrorState({ message }: { message: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-24 gap-4 text-center">
      <div className="text-4xl">😕</div>
      <div className="text-dc-text font-bold text-lg">결과를 찾을 수 없어요</div>
      <div className="text-dc-text-secondary text-sm">{message}</div>
      <Link
        href="/home"
        className="mt-2 h-11 px-6 bg-dc-primary text-white text-sm font-bold rounded-xl flex items-center hover:bg-[#2d6b45] transition-colors"
      >
        다시 만들기
      </Link>
    </div>
  )
}

// ─── 메인 컨텐츠 ──────────────────────────────────────────────────────────────
function ResultContent() {
  const searchParams = useSearchParams()
  const resultId = searchParams.get("resultId")

  const [activeTab, setActiveTab] = useState<"recipe" | "plan">("recipe")
  const [selectedMenu, setSelectedMenu] = useState(0)
  const [result, setResult] = useState<ResultResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    if (!resultId) {
      setError("올바르지 않은 접근이에요.")
      setLoading(false)
      return
    }

    // 1️⃣ sessionStorage 먼저 확인 (빠름)
    const cached = sessionStorage.getItem(cacheKey(resultId))
    if (cached) {
      try {
        setResult(JSON.parse(cached) as ResultResponse)
        setLoading(false)
        return
      } catch {
        // 파싱 실패 시 API로 fallback
      }
    }

    // 2️⃣ sessionStorage 없으면 API 조회
    setLoading(true)
    fetch(`/api/results/${resultId}`)
      .then((res) => {
        if (!res.ok) throw new Error("결과가 만료됐거나 존재하지 않아요.")
        return res.json()
      })
      .then((data: ResultResponse) => {
        setResult(data)
      })
      .catch((err: Error) => {
        setError(err.message)
      })
      .finally(() => {
        setLoading(false)
      })
  }, [resultId])

  const menus = useMemo(() => {
    if (!result) return []
    return result.output.menuOptions.map((menu, idx) => ({
      id: idx,
      name: menu.title,
      tags: [`${menu.timeMin}분`, ...menu.tools.map((tool) => toolLabel[tool]), "1인분"],
    }))
  }, [result])

  const selectedData: MenuOption | null = useMemo(() => {
    if (!result) return null
    return result.output.menuOptions[selectedMenu] || null
  }, [result, selectedMenu])

  const recipe = selectedData
    ? { name: selectedData.title, ingredients: selectedData.ingredients, steps: selectedData.steps }
    : null

  const mealPlan = result
    ? result.output.threeDayPlan.map((item) => ({
      day: `Day ${item.day}`,
      meals: [item.breakfast, item.lunch, item.dinner],
    }))
    : []

  const shopping = result
    ? result.output.shoppingList.map((item) => ({
      name: item.item,
      amount: `${item.quantity}${item.unit}`,
    }))
    : []

  return (
    <div className="min-h-screen bg-dc-bg">
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <div className="lg:hidden flex items-center justify-between h-14 px-5 bg-dc-surface">
          <div className="flex items-center gap-2">
            <Link
              href="/home"
              className="w-8 h-8 bg-dc-muted rounded-lg flex items-center justify-center text-dc-text-secondary text-lg"
            >
              ←
            </Link>
            <span className="text-dc-text text-base font-bold">추천 결과</span>
          </div>
          <Link
            href="/home"
            className="h-8 px-3 bg-dc-muted rounded-lg text-dc-text-secondary text-xs font-medium flex items-center"
          >
            다시 만들기
          </Link>
        </div>
        <div className="hidden lg:block">
          <NavBar variant="app" />
        </div>
      </div>

      <div className="flex w-full">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        <div className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-6 lg:py-12 flex flex-col gap-6 lg:gap-8 pb-24 lg:pb-12">
          <div className="hidden lg:flex flex-col gap-1">
            <h1 className="text-dc-text text-[28px] font-bold">오늘의 추천 메뉴</h1>
            <p className="text-dc-text-secondary text-sm">메뉴를 선택하면 레시피와 장보기 목록을 볼 수 있어요</p>
          </div>
          <div className="lg:hidden flex flex-col gap-1">
            <h1 className="text-dc-text text-xl font-bold">오늘의 추천 메뉴</h1>
            <p className="text-dc-text-secondary text-xs">메뉴를 선택하면 레시피를 볼 수 있어요</p>
          </div>

          {/* 로딩 */}
          {loading && <LoadingState />}

          {/* 에러 */}
          {!loading && error && <ErrorState message={error} />}

          {/* 정상 */}
          {!loading && !error && result && recipe && (
            <>
              <MenuCard menus={menus} selectedMenu={selectedMenu} onSelect={setSelectedMenu} />
              <div className="flex flex-col lg:flex-row gap-6">
                <RecipeView
                  recipe={recipe}
                  mealPlan={mealPlan}
                  activeTab={activeTab}
                  onTabChange={setActiveTab}
                />
                <ShoppingList items={shopping} />
              </div>
            </>
          )}
        </div>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      <MobileBottomNav />
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-dc-bg flex items-center justify-center text-dc-text-secondary">로딩 중...</div>}>
      <ResultContent />
    </Suspense>
  )
}