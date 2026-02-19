"use client"

import { useEffect, useMemo, useState } from "react"
import { useRouter } from "next/navigation"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import { onAuthChange } from "@/lib/firebase"
import type {
  FoodSearchItem,
  FoodSearchResponse,
  FridgeCategory,
  FridgeItem,
  FridgeListResponse,
  QuantityUnit,
} from "@/lib/types/api"
import { CATEGORIES, INGREDIENT_SUGGESTIONS, UNITS } from "@/lib/types/fridge"

export default function FridgePage() {
  const router = useRouter()

  const [userId, setUserId] = useState<string | null>(null)
  const [authLoading, setAuthLoading] = useState(true)

  const [items, setItems] = useState<FridgeItem[]>([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const [activeCategory, setActiveCategory] = useState<FridgeCategory | "all">("all")
  const [sortBy, setSortBy] = useState<"expiresOn" | "updatedAt">("expiresOn")
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingItem, setEditingItem] = useState<FridgeItem | null>(null)
  const [saving, setSaving] = useState(false)

  const [formName, setFormName] = useState("")
  const [formCategory, setFormCategory] = useState<FridgeCategory>("other")
  const [formAmount, setFormAmount] = useState("1")
  const [formUnit, setFormUnit] = useState<QuantityUnit>("count")
  const [formExpiresOn, setFormExpiresOn] = useState("")

  const [foodSuggestions, setFoodSuggestions] = useState<FoodSearchItem[]>([])
  const [foodSearchLoading, setFoodSearchLoading] = useState(false)
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [activeSuggestionIndex, setActiveSuggestionIndex] = useState(-1)
  const [selectedFood, setSelectedFood] = useState<FoodSearchItem | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (!user) {
        setUserId(null)
        setAuthLoading(false)
        router.replace("/login")
        return
      }

      setUserId(user.uid)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  const loadItems = async (uid: string) => {
    setLoading(true)
    setError(null)

    try {
      const response = await fetch(`/api/fridge`, {
        headers: { "x-user-id": uid },
      })

      if (!response.ok) {
        throw new Error("냉장고 데이터를 불러오지 못했습니다")
      }

      const data = (await response.json()) as FridgeListResponse
      setItems(data.items)
    } catch {
      setItems([])
      setError("냉장고 데이터를 불러오지 못했습니다")
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!userId) return
    void loadItems(userId)
  }, [userId])

  useEffect(() => {
    if (!showAddModal) {
      setFoodSuggestions([])
      setFoodSearchLoading(false)
      setShowSuggestions(false)
      setActiveSuggestionIndex(-1)
      return
    }

    const keyword = formName.trim()
    if (keyword.length < 1) {
      setFoodSuggestions([])
      setFoodSearchLoading(false)
      setActiveSuggestionIndex(-1)
      return
    }

    const controller = new AbortController()
    const timer = setTimeout(async () => {
      setFoodSearchLoading(true)
      try {
        const response = await fetch(`/api/fooddb/search?q=${encodeURIComponent(keyword)}`, {
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error("식품 검색 실패")
        }

        const data = (await response.json()) as FoodSearchResponse
        setFoodSuggestions(data.items ?? [])
        setShowSuggestions(true)
        setActiveSuggestionIndex(-1)
      } catch {
        if (!controller.signal.aborted) {
          setFoodSuggestions([])
        }
      } finally {
        if (!controller.signal.aborted) {
          setFoodSearchLoading(false)
        }
      }
    }, 300)

    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [formName, showAddModal])

  const resetForm = () => {
    setFormName("")
    setFormCategory("other")
    setFormAmount("1")
    setFormUnit("count")
    setFormExpiresOn("")
    setEditingItem(null)

    setFoodSuggestions([])
    setFoodSearchLoading(false)
    setShowSuggestions(false)
    setActiveSuggestionIndex(-1)
    setSelectedFood(null)
  }

  const openAddModal = () => {
    resetForm()
    setShowAddModal(true)
  }

  const openEditModal = (item: FridgeItem) => {
    setFormName(item.name)
    setFormCategory(item.category)
    setFormAmount(String(item.amount))
    setFormUnit(item.unit)
    setFormExpiresOn(item.expiresOn ?? "")
    setEditingItem(item)
    setShowAddModal(true)

    setFoodSuggestions([])
    setFoodSearchLoading(false)
    setShowSuggestions(false)
    setActiveSuggestionIndex(-1)
    setSelectedFood(null)
  }

  const selectSuggestion = (item: FoodSearchItem) => {
    const displayName = item.displayName?.trim() || item.name
    setFormName(displayName)
    setFormCategory(item.category)
    setFormUnit(item.defaultUnit)
    setSelectedFood(item)
    setShowSuggestions(false)
    setActiveSuggestionIndex(-1)
  }

  const handleSubmit = async () => {
    if (!userId || saving) return

    const amount = Number.parseFloat(formAmount)
    if (!formName.trim() || Number.isNaN(amount) || amount <= 0) {
      alert("재료명과 수량을 올바르게 입력해주세요")
      return
    }

    const trimmedName = formName.trim()
    const selectedName = (selectedFood?.displayName ?? selectedFood?.name ?? "").trim()
    const useSelectedMeta = !!selectedFood && selectedName.length > 0 && selectedName === trimmedName

    setSaving(true)

    try {
      if (editingItem) {
        const response = await fetch(`/api/fridge/${editingItem.id}`, {
          method: "PATCH",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({
            name: trimmedName,
            amount,
            unit: formUnit,
            expiresOn: formExpiresOn || null,
          }),
        })

        if (!response.ok) {
          throw new Error("재료 수정에 실패했습니다")
        }
      } else {
        const response = await fetch("/api/fridge", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "x-user-id": userId,
          },
          body: JSON.stringify({
            name: trimmedName,
            category: useSelectedMeta ? selectedFood.category : undefined,
            subCategory: useSelectedMeta
              ? (selectedFood.subCategory ?? selectedFood.displayName ?? selectedFood.name)
              : undefined,
            amount,
            unit: formUnit,
            expiresOn: formExpiresOn || undefined,
          }),
        })

        if (!response.ok) {
          throw new Error("재료 추가에 실패했습니다")
        }
      }

      setShowAddModal(false)
      resetForm()
      await loadItems(userId)
    } catch {
      alert(editingItem ? "재료 수정에 실패했습니다" : "재료 추가에 실패했습니다")
    } finally {
      setSaving(false)
    }
  }

  const handleDelete = async (id: string) => {
    if (!userId) return
    if (!confirm("이 재료를 삭제하시겠습니까?")) return

    try {
      const response = await fetch(`/api/fridge/${id}`, {
        method: "DELETE",
        headers: { "x-user-id": userId },
      })

      if (!response.ok) {
        throw new Error("삭제 실패")
      }

      await loadItems(userId)
    } catch {
      alert("재료 삭제에 실패했습니다")
    }
  }

  const handleQuickAdd = (name: string, category: FridgeCategory) => {
    setFormName(name)
    setFormCategory(category)
    setFormAmount("1")
    setFormUnit("count")
    setFormExpiresOn("")
    setEditingItem(null)
    setShowAddModal(true)

    setFoodSuggestions([])
    setFoodSearchLoading(false)
    setShowSuggestions(false)
    setActiveSuggestionIndex(-1)
    setSelectedFood(null)
  }

  const handleQuickStart = () => {
    if (items.length === 0) {
      alert("냉장고에 재료를 먼저 추가해주세요")
      return
    }
    const ingredientsStr = items.map((item) => `${item.name} ${item.amount}${item.unit}`).join(", ")
    const params = new URLSearchParams({
      ingredients: ingredientsStr,
      mode: "quick",
    })
    router.push(`/quick?${params.toString()}`)
  }

  const getDday = (expiresOn?: string | null) => {
    if (!expiresOn) return null
    const today = new Date()
    today.setHours(0, 0, 0, 0)
    const expiry = new Date(expiresOn)
    const diff = Math.floor((expiry.getTime() - today.getTime()) / (1000 * 60 * 60 * 24))
    return diff
  }

  const filteredItems = useMemo(() => {
    const base = activeCategory === "all"
      ? [...items]
      : items.filter((item) => item.category === activeCategory)

    if (sortBy === "expiresOn") {
      return base.sort((a, b) => {
        if (!a.expiresOn) return 1
        if (!b.expiresOn) return -1
        return a.expiresOn.localeCompare(b.expiresOn)
      })
    }

    return base.sort((a, b) => b.updatedAt.localeCompare(a.updatedAt))
  }, [items, activeCategory, sortBy])

  return (
    <div className="min-h-screen bg-dc-bg">
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      <div className="flex w-full min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        <main className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-5 lg:py-12 pb-nav-safe lg:pb-12">
          <header className="mb-5 lg:mb-6 flex items-end justify-between">
            <div>
              <h1 className="text-dc-text text-[22px] lg:text-[28px] font-bold flex items-center gap-2">
                <span>🧊</span>
                내 냉장고
              </h1>
              <p className="mt-1.5 text-dc-text-secondary text-[13px] lg:text-sm leading-relaxed">
                재료를 등록하고 관리해보세요
              </p>
            </div>
            <button
              onClick={openAddModal}
              disabled={authLoading || !userId}
              className="h-11 px-5 bg-dc-primary text-white text-[13px] font-semibold rounded-xl hover:bg-[#2d6b45] transition-colors flex items-center gap-1.5 disabled:opacity-60"
            >
              <span className="text-base">+</span>
              추가
            </button>
          </header>

          <section className="mb-4">
            <div className="flex gap-2 overflow-x-auto pb-1 -mx-5 px-5 lg:mx-0 lg:px-0">
              <button
                onClick={() => setActiveCategory("all")}
                className={`flex-none h-11 px-4 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap ${
                  activeCategory === "all"
                    ? "bg-dc-primary text-white"
                    : "bg-dc-muted text-dc-text-secondary hover:bg-dc-border"
                }`}
              >
                전체 ({items.length})
              </button>
              {CATEGORIES.map((cat) => {
                const count = items.filter((item) => item.category === cat.id).length
                return (
                  <button
                    key={cat.id}
                    onClick={() => setActiveCategory(cat.id)}
                    className={`flex-none h-11 px-4 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap flex items-center gap-1.5 ${
                      activeCategory === cat.id
                        ? "bg-dc-primary text-white"
                        : "bg-dc-muted text-dc-text-secondary hover:bg-dc-border"
                    }`}
                  >
                    <span>{cat.icon}</span>
                    {cat.label} ({count})
                  </button>
                )
              })}
            </div>
          </section>

          <section className="mb-4 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <span className="text-dc-text-secondary text-[12px]">정렬:</span>
              <button
                onClick={() => setSortBy("expiresOn")}
                className={`h-9 px-3 rounded-lg text-[12px] font-medium transition-colors ${
                  sortBy === "expiresOn" ? "bg-dc-primary text-white" : "bg-dc-muted text-dc-text-secondary"
                }`}
              >
                유통기한순
              </button>
              <button
                onClick={() => setSortBy("updatedAt")}
                className={`h-9 px-3 rounded-lg text-[12px] font-medium transition-colors ${
                  sortBy === "updatedAt" ? "bg-dc-primary text-white" : "bg-dc-muted text-dc-text-secondary"
                }`}
              >
                최신순
              </button>
            </div>
            {items.length > 0 && (
              <button
                onClick={handleQuickStart}
                className="h-9 px-4 bg-dc-primary text-white text-[12px] font-semibold rounded-lg hover:bg-[#2d6b45] transition-colors flex items-center gap-1"
              >
                <span>⚡</span>
                바로 추천받기
              </button>
            )}
          </section>

          {error ? <p className="text-red-600 text-[13px] mb-3">{error}</p> : null}
          {loading ? <p className="text-dc-text-secondary text-[13px] mb-3">냉장고 데이터를 불러오는 중...</p> : null}

          <section className="space-y-3">
            {!loading && filteredItems.length > 0 ? (
              filteredItems.map((item) => {
                const dday = getDday(item.expiresOn)
                const isExpiringSoon = dday !== null && dday <= 3
                const isExpired = dday !== null && dday < 0
                const category = CATEGORIES.find((c) => c.id === item.category)
                const label = UNITS.find((u) => u.id === item.unit)?.label || item.unit

                return (
                  <div key={item.id} className="bg-dc-surface rounded-2xl border border-dc-border p-4 flex items-center gap-4">
                    <div className="w-12 h-12 rounded-xl bg-dc-muted flex items-center justify-center text-2xl flex-none">
                      {category?.icon || "📦"}
                    </div>

                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <p className="text-dc-text text-[15px] font-bold truncate">{item.name}</p>
                        {isExpired && (
                          <span className="text-[10px] font-bold text-red-600 bg-red-50 px-2 py-0.5 rounded-full">만료</span>
                        )}
                        {!isExpired && isExpiringSoon && (
                          <span className="text-[10px] font-bold text-orange-600 bg-orange-50 px-2 py-0.5 rounded-full">D-{dday}</span>
                        )}
                      </div>
                      <div className="flex items-center gap-3 mt-1">
                        <span className="text-dc-text-secondary text-[13px]">
                          {item.amount}
                          {label}
                        </span>
                        {item.expiresOn && <span className="text-dc-text-muted text-[12px]">~ {item.expiresOn}</span>}
                      </div>
                    </div>

                    <div className="flex gap-2 flex-none">
                      <button
                        onClick={() => openEditModal(item)}
                        className="w-9 h-9 bg-dc-muted rounded-lg text-dc-text-secondary text-[13px] font-medium hover:bg-dc-border transition-colors flex items-center justify-center"
                      >
                        ✎
                      </button>
                      <button
                        onClick={() => handleDelete(item.id)}
                        className="w-9 h-9 bg-dc-muted rounded-lg text-dc-text-secondary text-[13px] font-medium hover:bg-red-50 hover:text-red-600 transition-colors flex items-center justify-center"
                      >
                        ×
                      </button>
                    </div>
                  </div>
                )
              })
            ) : !loading ? (
              <div className="bg-dc-surface rounded-2xl border border-dc-border p-8 text-center">
                <p className="text-dc-text-secondary text-[14px] mb-3">
                  {activeCategory === "all" ? "냉장고가 비어있어요" : "이 카테고리에 재료가 없어요"}
                </p>
                <button
                  onClick={openAddModal}
                  className="h-11 px-5 bg-dc-primary text-white text-[13px] font-semibold rounded-xl hover:bg-[#2d6b45] transition-colors"
                >
                  재료 추가하기
                </button>
              </div>
            ) : null}
          </section>

          {activeCategory === "all" && (
            <section className="mt-6 bg-dc-surface rounded-2xl border border-dc-border p-5">
              <h3 className="text-dc-text text-[15px] font-bold mb-3">빠른 추가</h3>
              <div className="space-y-3">
                {CATEGORIES.map((cat) => (
                  <div key={cat.id}>
                    <p className="text-dc-text-secondary text-[12px] font-semibold mb-2 flex items-center gap-1.5">
                      <span>{cat.icon}</span>
                      {cat.label}
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {(INGREDIENT_SUGGESTIONS[cat.id] ?? []).slice(0, 5).map((name) => (
                        <button
                          key={name}
                          onClick={() => handleQuickAdd(name, cat.id)}
                          className="h-9 px-3 bg-dc-muted text-dc-text-secondary text-[12px] font-medium rounded-full hover:bg-dc-primary hover:text-white transition-colors"
                        >
                          + {name}
                        </button>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </section>
          )}
        </main>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      {showAddModal && (
        <div className="fixed inset-0 bg-black/30 z-[100] flex items-end lg:items-center justify-center">
          <div
            className="bg-dc-surface w-full lg:w-[480px] lg:rounded-2xl rounded-t-3xl p-6 lg:p-8 max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="lg:hidden w-10 h-1 bg-dc-border rounded-full mx-auto mb-4" />

            <h2 className="text-dc-text text-[18px] font-bold mb-5">{editingItem ? "재료 수정" : "재료 추가"}</h2>

            <div className="space-y-4">
              <div className="relative">
                <label className="text-dc-text text-[13px] font-semibold block mb-2">
                  재료명 <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={formName}
                  onChange={(e) => {
                    setFormName(e.target.value)
                    setSelectedFood(null)
                    setShowSuggestions(true)
                    setActiveSuggestionIndex(-1)
                  }}
                  onFocus={() => {
                    if (formName.trim().length >= 1) {
                      setShowSuggestions(true)
                    }
                  }}
                  onKeyDown={(e) => {
                    if (!showSuggestions || foodSuggestions.length === 0) return

                    if (e.key === "ArrowDown") {
                      e.preventDefault()
                      setActiveSuggestionIndex((prev) => Math.min(prev + 1, foodSuggestions.length - 1))
                      return
                    }

                    if (e.key === "ArrowUp") {
                      e.preventDefault()
                      setActiveSuggestionIndex((prev) => Math.max(prev - 1, 0))
                      return
                    }

                    if (e.key === "Enter" && activeSuggestionIndex >= 0) {
                      e.preventDefault()
                      const picked = foodSuggestions[activeSuggestionIndex]
                      if (picked) selectSuggestion(picked)
                      return
                    }

                    if (e.key === "Escape") {
                      setShowSuggestions(false)
                      setActiveSuggestionIndex(-1)
                    }
                  }}
                  placeholder="예) 계란"
                  className="w-full h-11 px-4 bg-dc-muted rounded-xl text-dc-text text-[15px] placeholder:text-dc-text-muted focus:outline-none focus:ring-1 focus:ring-dc-primary border border-transparent focus:border-dc-primary transition-colors"
                />

                {showSuggestions && formName.trim().length >= 1 && (
                  <div className="absolute z-20 mt-2 w-full rounded-xl border border-dc-border bg-dc-surface shadow-md overflow-hidden">
                    <div className="max-h-56 overflow-y-auto">
                      {foodSearchLoading ? (
                        <p className="px-3 py-2 text-[12px] text-dc-text-secondary">검색 중...</p>
                      ) : foodSuggestions.length > 0 ? (
                        foodSuggestions.map((item, index) => {
                          const displayName = item.displayName?.trim() || item.name
                          const isActive = index === activeSuggestionIndex
                          return (
                            <button
                              key={`${item.name}-${index}`}
                              type="button"
                              onMouseDown={(evt) => evt.preventDefault()}
                              onClick={() => selectSuggestion(item)}
                              className={`w-full text-left px-3 py-2 transition-colors ${
                                isActive ? "bg-dc-muted" : "hover:bg-dc-muted"
                              }`}
                            >
                              <p className="text-[13px] font-medium text-dc-text">{displayName}</p>
                              <p className="text-[11px] text-dc-text-secondary">
                                {item.category}
                                {item.subCategory ? ` · ${item.subCategory}` : ""}
                              </p>
                            </button>
                          )
                        })
                      ) : (
                        <p className="px-3 py-2 text-[12px] text-dc-text-secondary">검색 결과가 없습니다. 직접 추가할 수 있어요.</p>
                      )}
                    </div>
                  </div>
                )}
              </div>

              <div className="grid grid-cols-[1fr_120px] gap-2">
                <div>
                  <label className="text-dc-text text-[13px] font-semibold block mb-2">
                    수량 <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="number"
                    step="1"
                    min="1"
                    value={formAmount}
                    onChange={(e) => setFormAmount(e.target.value)}
                    placeholder="1"
                    className="w-full h-11 px-4 bg-dc-muted rounded-xl text-dc-text text-[15px] placeholder:text-dc-text-muted focus:outline-none focus:ring-1 focus:ring-dc-primary border border-transparent focus:border-dc-primary transition-colors"
                  />
                </div>
                <div>
                  <label className="text-dc-text text-[13px] font-semibold block mb-2">단위</label>
                  <select
                    value={formUnit}
                    onChange={(e) => setFormUnit(e.target.value as QuantityUnit)}
                    className="w-full h-11 px-3 bg-dc-muted rounded-xl text-dc-text text-[15px] focus:outline-none focus:ring-1 focus:ring-dc-primary border border-transparent focus:border-dc-primary transition-colors"
                  >
                    {UNITS.map((unit) => (
                      <option key={unit.id} value={unit.id}>
                        {unit.label}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="text-dc-text text-[13px] font-semibold block mb-2">유통기한 (선택)</label>
                <input
                  type="date"
                  value={formExpiresOn}
                  onChange={(e) => setFormExpiresOn(e.target.value)}
                  className="w-full h-11 px-4 bg-dc-muted rounded-xl text-dc-text text-[15px] focus:outline-none focus:ring-1 focus:ring-dc-primary border border-transparent focus:border-dc-primary transition-colors"
                />
              </div>
            </div>

            <div className="flex gap-2 mt-6">
              <button
                onClick={() => {
                  setShowAddModal(false)
                  resetForm()
                }}
                className="flex-1 h-12 bg-dc-muted text-dc-text-secondary text-[15px] font-semibold rounded-xl hover:bg-dc-border transition-colors"
              >
                취소
              </button>
              <button
                onClick={handleSubmit}
                disabled={saving}
                className="flex-1 h-12 bg-dc-primary text-white text-[15px] font-bold rounded-xl hover:bg-[#2d6b45] transition-colors disabled:opacity-60"
              >
                {saving ? "저장 중..." : editingItem ? "수정" : "추가"}
              </button>
            </div>
          </div>
        </div>
      )}

      <MobileBottomNav />
    </div>
  )
}




