"use client"

import { useState, Suspense } from "react"
import Link from "next/link"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"

// Mock data — will be replaced with AI API
const MOCK_MENUS = [
  { id: 0, name: "계란 볶음밥", tags: ["5분", "팬 하나", "1인분"], selected: true },
  { id: 1, name: "두부 된장찌개", tags: ["10분", "냄비"], selected: false },
  { id: 2, name: "전자레인지 찜닭", tags: ["15분", "전자레인지", "1인분"], selected: false },
]

const MOCK_RECIPE = {
  name: "계란 볶음밥",
  ingredients: ["계란 2개", "밥 1공기", "간장(1작은술)", "참기름 1큰술"],
  steps: [
    "계란 기름 두르고 후추를 촉촉하게 볶는다",
    "계란 넣고 스크램블 게 하면 간단하나",
    "밥을 넣고 빠기 간장, 참기름으로 볶는다",
    "스크램블 계란 판 넣고 가볍게 다시 무쳐라",
  ],
}

const MOCK_MEAL_PLAN = [
  { day: "월요일", meals: ["계란 볶음밥", "두부찌개", "참치 볶음 스크램블", "두부 정도", "채소 볶음"] },
  { day: "화요일", meals: ["참치 볶음밥", "콩나물 볶음이", "계란 스크램블도 무방", "스프라이더 계란", "채소 볶음"] },
  { day: "수요일", meals: ["콩 두부 스크랄빈", "계란 볶음 이상", "이상기도 가능"] },
]

const MOCK_SHOPPING = [
  { name: "계란", amount: "4개" },
  { name: "두부", amount: "반모" },
  { name: "참기름", amount: "적당량" },
  { name: "달걀노른자", amount: "200g" },
  { name: "된장", amount: "적당" },
  { name: "대파", amount: "약간" },
]

function ResultContent() {
  const [selectedMenu, setSelectedMenu] = useState(0)
  const [activeTab, setActiveTab] = useState<"recipe" | "plan">("recipe")

  return (
    <div className="min-h-screen bg-dc-bg">
      {/* NavBar */}
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        {/* Mobile back nav */}
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
        {/* Desktop nav */}
        <div className="hidden lg:block">
          <NavBar variant="app" />
        </div>
      </div>

      {/* Body */}
      <div className="flex w-full">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        <div className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-6 lg:py-12 flex flex-col gap-6 lg:gap-8 pb-24 lg:pb-12">

          {/* Page header - desktop only */}
          <div className="hidden lg:flex flex-col gap-1">
            <h1 className="text-dc-text text-[28px] font-bold">오늘의 추천 메뉴</h1>
            <p className="text-dc-text-secondary text-sm">
              메뉴를 선택하면 레시피와 장보기 목록을 볼 수 있어요
            </p>
          </div>

          {/* Mobile: Page header */}
          <div className="lg:hidden flex flex-col gap-1">
            <h1 className="text-dc-text text-xl font-bold">오늘의 추천 메뉴</h1>
            <p className="text-dc-text-secondary text-xs">메뉴를 선택하면 레시피를 볼 수 있어요</p>
          </div>

          {/* Menu Selection */}
          <div className="flex flex-col gap-3">
            <div className="text-dc-text text-sm lg:text-base font-semibold">📋 메뉴 선택</div>

            {/* Desktop: 3-col grid */}
            <div className="hidden lg:grid grid-cols-3 gap-4">
              {MOCK_MENUS.map((menu) => (
                <button
                  key={menu.id}
                  onClick={() => setSelectedMenu(menu.id)}
                  className={`p-5 rounded-2xl border text-left transition-all ${
                    selectedMenu === menu.id
                      ? "border-dc-primary bg-dc-primary-light"
                      : "border-dc-border bg-dc-surface hover:border-dc-primary/50"
                  }`}
                >
                  <div className="flex items-start justify-between mb-2">
                    <div className="text-dc-text text-sm font-bold">{menu.name}</div>
                    {selectedMenu === menu.id && (
                      <span className="text-[10px] font-bold bg-dc-primary text-white px-2 py-0.5 rounded-full">선택됨</span>
                    )}
                  </div>
                  <div className="flex flex-wrap gap-1">
                    {menu.tags.map((tag) => (
                      <span key={tag} className="text-xs text-dc-text-secondary bg-dc-muted px-2 py-0.5 rounded-full">
                        {tag}
                      </span>
                    ))}
                  </div>
                </button>
              ))}
            </div>

            {/* Mobile: list */}
            <div className="lg:hidden flex flex-col gap-2">
              {MOCK_MENUS.map((menu) => (
                <button
                  key={menu.id}
                  onClick={() => setSelectedMenu(menu.id)}
                  className={`w-full flex items-center justify-between p-4 rounded-xl border transition-all text-left ${
                    selectedMenu === menu.id
                      ? "border-dc-primary bg-dc-primary-light"
                      : "border-dc-border bg-dc-surface"
                  }`}
                >
                  <div>
                    <div className="text-dc-text text-sm font-semibold">{menu.name}</div>
                    <div className="text-dc-text-secondary text-xs mt-0.5">{menu.tags.join(" · ")}</div>
                  </div>
                  <span className="text-dc-text-secondary">→</span>
                </button>
              ))}
            </div>
          </div>

          {/* Main Content: Recipe + Shopping */}
          <div className="flex flex-col lg:flex-row gap-6">
            {/* Left: Recipe */}
            <div className="flex-1 bg-dc-surface rounded-2xl border border-dc-border p-5 lg:p-6 flex flex-col gap-4">
              <div className="flex items-center gap-3 flex-wrap">
                <h2 className="text-dc-text text-base lg:text-lg font-bold">
                  🍳 {MOCK_RECIPE.name} — 레시피
                </h2>
                <div className="flex gap-2">
                  <button
                    onClick={() => setActiveTab("recipe")}
                    className={`h-7 px-3 rounded-full text-xs font-medium transition-colors ${
                      activeTab === "recipe" ? "bg-dc-primary text-white" : "bg-dc-muted text-dc-text-secondary"
                    }`}
                  >
                    레시피
                  </button>
                  <button
                    onClick={() => setActiveTab("plan")}
                    className={`h-7 px-3 rounded-full text-xs font-medium transition-colors ${
                      activeTab === "plan" ? "bg-dc-primary text-white" : "bg-dc-muted text-dc-text-secondary"
                    }`}
                  >
                    3일 플랜
                  </button>
                </div>
              </div>

              {activeTab === "recipe" && (
                <>
                  {/* Ingredients */}
                  <div className="flex flex-col gap-2">
                    <div className="text-dc-text text-sm font-semibold">재료</div>
                    <div className="flex flex-col gap-1.5">
                      {MOCK_RECIPE.ingredients.map((ing, i) => (
                        <div key={i} className="flex items-center gap-2 text-dc-text-secondary text-sm">
                          <span className="text-dc-primary">✦</span>
                          {ing}
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="h-px bg-dc-border" />

                  {/* Steps */}
                  <div className="flex flex-col gap-2">
                    <div className="text-dc-text text-sm font-semibold">조리 순서</div>
                    <ol className="flex flex-col gap-2">
                      {MOCK_RECIPE.steps.map((step, i) => (
                        <li key={i} className="flex gap-3 text-sm">
                          <span className="w-5 h-5 rounded-full bg-dc-primary text-white text-[11px] font-bold flex items-center justify-center flex-none mt-0.5">
                            {i + 1}
                          </span>
                          <span className="text-dc-text-secondary leading-relaxed">{step}</span>
                        </li>
                      ))}
                    </ol>
                  </div>
                </>
              )}

              {activeTab === "plan" && (
                <div className="flex flex-col gap-3">
                  {MOCK_MEAL_PLAN.map((day, i) => (
                    <div key={i} className="flex flex-col gap-1">
                      <div className="text-dc-text text-xs font-semibold">{day.day}</div>
                      <div className="text-dc-text-secondary text-xs leading-relaxed">
                        {day.meals.join(" · ")}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Right: Shopping List */}
            <div className="lg:w-[280px] lg:flex-none bg-dc-surface rounded-2xl border border-dc-border p-5 lg:p-6 flex flex-col gap-4">
              <div className="flex items-center gap-2">
                <h2 className="text-dc-text text-base font-bold">🛒 장보기 목록</h2>
                <span className="text-[10px] font-semibold text-dc-primary bg-dc-primary-light px-2 py-0.5 rounded-full">
                  AI 추천
                </span>
              </div>
              <div className="flex flex-col gap-2">
                {MOCK_SHOPPING.map((item, i) => (
                  <div key={i} className="flex items-center justify-between">
                    <span className="text-dc-text text-sm">{item.name}</span>
                    <span className="text-dc-text-secondary text-xs">{item.amount}</span>
                  </div>
                ))}
              </div>
              <button className="w-full h-11 bg-dc-muted rounded-xl text-dc-text-secondary text-sm font-medium hover:bg-dc-border transition-colors">
                다시 생성하기
              </button>
            </div>
          </div>
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
