"use client"

import { useState, Suspense, useMemo, useEffect } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import MenuCard from "@/components/results/MenuCard"
import RecipeView from "@/components/results/RecipeView"
import ShoppingList from "@/components/results/ShoppingList"
import { onAuthChange } from "@/lib/firebase"
import { isQuantityUnit } from "@/lib/fridge/unit"
import type {
  ApiError,
  FridgeConsumeInput,
  FridgeConsumeResult,
  FridgeItem,
  MenuOption,
  QuantityUnit,
  ResultResponse,
  Tool,
} from "@/lib/types/api"

const cacheKey = (resultId: string) => `deliverycut:result:${resultId}`

const toolLabel: Record<Tool, string> = {
  microwave: "전자레인지",
  pan: "팬",
  airfryer: "에어프라이어",
}

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

function normalizeShoppingUnit(unit: string): QuantityUnit {
  if (isQuantityUnit(unit)) return unit
  const lower = unit.toLowerCase()
  if (lower === "개") return "count"
  if (lower === "l") return "l"
  if (lower === "ml") return "ml"
  if (lower === "kg") return "kg"
  if (lower === "g") return "g"
  return "count"
}

function normalizeName(value: string) {
  return value.toLowerCase().replace(/[\s,()\-_/]/g, "")
}

function findBestFridgeMatch(query: string, fridgeItems: FridgeItem[]) {
  const key = normalizeName(query)
  if (!key) return null

  const score = (item: FridgeItem) => {
    const itemKey = normalizeName(item.name)
    if (!itemKey) return Number.MAX_SAFE_INTEGER
    if (itemKey === key) return 0
    if (itemKey.startsWith(key) || key.startsWith(itemKey)) return 1
    if (itemKey.includes(key) || key.includes(itemKey)) return 2
    return Number.MAX_SAFE_INTEGER
  }

  return [...fridgeItems]
    .sort((a, b) => {
      const sa = score(a)
      const sb = score(b)
      if (sa !== sb) return sa - sb
      return normalizeName(a.name).length - normalizeName(b.name).length
    })
    .find((item) => score(item) < Number.MAX_SAFE_INTEGER) ?? null
}

function ResultContent() {
  const searchParams = useSearchParams()
  const resultId = searchParams.get("resultId")

  const [activeTab, setActiveTab] = useState<"recipe" | "plan">("recipe")
  const [selectedMenu, setSelectedMenu] = useState(0)
  const [result, setResult] = useState<ResultResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const [userId, setUserId] = useState<string | null>(null)
  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([])
  const [showConsumeModal, setShowConsumeModal] = useState(false)
  const [consumeDraft, setConsumeDraft] = useState<{ itemId: string; name: string; amount: number; unit: QuantityUnit }[]>([])
  const [consumeError, setConsumeError] = useState<string | null>(null)
  const [consumeSuccess, setConsumeSuccess] = useState<string | null>(null)
  const [consuming, setConsuming] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setUserId(user?.uid ?? null)
    })

    return () => unsubscribe()
  }, [])

  useEffect(() => {
    const fetchData = async () => {
      if (!resultId) {
        setError("올바르지 않은 접근이에요.")
        setLoading(false)
        return
      }

      const cached = sessionStorage.getItem(cacheKey(resultId))
      if (cached) {
        try {
          setResult(JSON.parse(cached) as ResultResponse)
          setLoading(false)
          return
        } catch {
          // fallback to API
        }
      }

      setLoading(true)
      try {
        const res = await fetch(`/api/results/${resultId}`)
        if (!res.ok) {
          throw new Error("결과가 만료됐거나 존재하지 않아요.")
        }
        const data: ResultResponse = await res.json()
        setResult(data)
      } catch (err) {
        setError(err instanceof Error ? err.message : "알 수 없는 오류가 발생했습니다.")
      } finally {
        setLoading(false)
      }
    }

    void fetchData()
  }, [resultId])

  useEffect(() => {
    if (!userId) return

    const loadFridge = async () => {
      try {
        const response = await fetch("/api/fridge", {
          headers: { "x-user-id": userId },
        })
        if (!response.ok) return
        const data = (await response.json()) as { items: FridgeItem[] }
        setFridgeItems(data.items)
      } catch {
        // ignore fridge sync failure on result page
      }
    }

    void loadFridge()
  }, [userId])

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

  const prepareConsumeDraft = () => {
    if (!userId) {
      setConsumeError("로그인 후 차감 기능을 사용할 수 있어요.")
      return
    }

    if (!result || !selectedData) return

    const byItemId = new Map<string, { itemId: string; name: string; amount: number; unit: QuantityUnit }>()

    for (const shoppingItem of result.output.shoppingList) {
      const matched = findBestFridgeMatch(shoppingItem.item, fridgeItems)
      if (!matched) continue

      byItemId.set(matched.id, {
        itemId: matched.id,
        name: matched.name,
        amount: shoppingItem.quantity,
        unit: normalizeShoppingUnit(shoppingItem.unit),
      })
    }

    for (const ingredientName of selectedData.ingredients) {
      const matched = findBestFridgeMatch(ingredientName, fridgeItems)
      if (!matched || byItemId.has(matched.id)) continue

      byItemId.set(matched.id, {
        itemId: matched.id,
        name: matched.name,
        amount: 1,
        unit: matched.unit,
      })
    }

    const rows = [...byItemId.values()]
    setConsumeDraft(rows)
    setConsumeError(rows.length === 0 ? "차감할 재료를 찾지 못했습니다. 냉장고 이름과 식재료 이름을 확인해주세요." : null)
    setConsumeSuccess(null)
    setShowConsumeModal(true)
  }

  const submitConsume = async () => {
    if (!userId || !selectedData || !result || consumeDraft.length === 0 || consuming) {
      setConsumeError("차감할 재료가 없습니다.")
      return
    }

    const payload: FridgeConsumeInput = {
      recipeId: selectedData.optionId,
      resultId: result.resultId,
      items: consumeDraft.map((item) => ({
        itemId: item.itemId,
        amount: item.amount,
        unit: item.unit,
      })),
    }

    setConsuming(true)

    try {
      const response = await fetch("/api/fridge/consume", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-user-id": userId,
        },
        body: JSON.stringify(payload),
      })

      if (!response.ok) {
        const apiError = (await response.json()) as ApiError
        throw new Error(apiError.error.message)
      }

      const body = (await response.json()) as { consumed: FridgeConsumeResult[] }
      const consumed = body.consumed ?? []

      setFridgeItems((prev) =>
        prev
          .map((item) => {
            const hit = consumed.find((row) => row.consumedItemId === item.id)
            if (!hit) return item
            return {
              ...item,
              amount: hit.afterAmount,
              updatedAt: new Date().toISOString(),
            }
          })
          .filter((item) => item.amount > 0)
      )

      setConsumeSuccess(`차감이 완료되었습니다. (${consumed.length}개 재료)`)
      setShowConsumeModal(false)
    } catch (consumeSubmitError) {
      setConsumeError(consumeSubmitError instanceof Error ? consumeSubmitError.message : "재료 차감에 실패했습니다.")
    } finally {
      setConsuming(false)
    }
  }

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

          {loading && <LoadingState />}
          {!loading && error && <ErrorState message={error} />}

          {!loading && !error && result && recipe && (
            <>
              <MenuCard menus={menus} selectedMenu={selectedMenu} onSelect={setSelectedMenu} />

              <div className="flex justify-end">
                <button
                  type="button"
                  onClick={prepareConsumeDraft}
                  className="h-10 px-4 rounded-xl bg-dc-primary text-white text-sm font-semibold disabled:opacity-50"
                >
                  요리 완료 후 재료 차감
                </button>
              </div>

              {consumeError ? (
                <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{consumeError}</div>
              ) : null}
              {consumeSuccess ? (
                <div className="rounded-xl border border-green-200 bg-green-50 px-4 py-3 text-sm text-green-700">{consumeSuccess}</div>
              ) : null}

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

      {showConsumeModal ? (
        <div className="fixed inset-0 z-[100] bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-xl bg-white rounded-2xl border border-dc-border p-5 flex flex-col gap-4">
            <div className="flex items-center justify-between">
              <h2 className="text-base font-bold text-dc-text">재료 차감 확인</h2>
              <button type="button" onClick={() => setShowConsumeModal(false)} className="text-dc-text-secondary">닫기</button>
            </div>

            {consumeDraft.length === 0 ? (
              <div className="text-sm text-dc-text-secondary">장보기 목록/레시피와 일치하는 냉장고 재료가 없습니다.</div>
            ) : (
              <div className="flex flex-col gap-2 max-h-[40vh] overflow-auto">
                {consumeDraft.map((item, idx) => (
                  <div key={item.itemId} className="flex gap-2 items-center">
                    <div className="w-28 text-sm text-dc-text">{item.name}</div>
                    <input
                      type="number"
                      min={1}
                      step={1}
                      value={item.amount}
                      onChange={(e) => {
                        const next = [...consumeDraft]
                        next[idx] = {
                          ...next[idx],
                          amount: Number(e.target.value),
                        }
                        setConsumeDraft(next)
                      }}
                      className="h-9 w-24 px-2 border border-dc-border rounded-lg"
                    />
                    <select
                      value={item.unit}
                      onChange={(e) => {
                        const next = [...consumeDraft]
                        next[idx] = {
                          ...next[idx],
                          unit: e.target.value as QuantityUnit,
                        }
                        setConsumeDraft(next)
                      }}
                      className="h-9 px-2 border border-dc-border rounded-lg"
                    >
                      <option value="count">개</option>
                      <option value="g">g</option>
                      <option value="kg">kg</option>
                      <option value="ml">ml</option>
                      <option value="l">L</option>
                      <option value="pack">팩</option>
                      <option value="tbsp">큰술</option>
                      <option value="tsp">작은술</option>
                    </select>
                  </div>
                ))}
              </div>
            )}

            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setShowConsumeModal(false)}
                className="h-9 px-4 rounded-lg border border-dc-border text-sm"
              >
                취소
              </button>
              <button
                type="button"
                onClick={submitConsume}
                disabled={consuming || consumeDraft.length === 0}
                className="h-9 px-4 rounded-lg bg-dc-primary text-white text-sm font-semibold disabled:opacity-50"
              >
                {consuming ? "차감 중..." : "확정 차감"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

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
