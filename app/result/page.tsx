"use client"

import { Suspense, useMemo, useState } from "react"
import Link from "next/link"
import { useSearchParams } from "next/navigation"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import MenuCard from "@/components/results/MenuCard"
import RecipeView from "@/components/results/RecipeView"
import ShoppingList from "@/components/results/ShoppingList"
import type { MenuOption, ResultResponse, Tool } from "@/lib/types/api"

type Menu = {
  id: number
  name: string
  tags: string[]
  reason: string
  ingredients: string[]
  steps: string[]
  videoUrl: string
  recipeUrl: string
  shopping: Array<{ name: string; amount: string }>
}

const MOCK_MENUS: Menu[] = [
  {
    id: 0,
    name: "참치 김치 덮밥",
    tags: ["10분", "팬", "1인분"],
    reason: "입력한 재료와 시간 조건을 가장 잘 만족하는 메뉴입니다.",
    ingredients: ["참치 1캔", "김치 1/2컵", "밥 1공기", "간장 1스푼"],
    steps: [
      "팬에 김치를 2분 정도 볶습니다.",
      "참치와 간장을 넣고 1분 더 볶습니다.",
      "밥 위에 올려 마무리합니다.",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=참치+김치+덮밥+레시피",
    recipeUrl: "https://www.10000recipe.com/recipe/list.html?q=참치김치덮밥",
    shopping: [
      { name: "참치캔", amount: "1개" },
      { name: "김치", amount: "1팩" },
      { name: "간장", amount: "소용량 1병" },
    ],
  },
  {
    id: 1,
    name: "계란 두부 스크램블",
    tags: ["5분", "전자레인지", "1인분"],
    reason: "조리 시간이 가장 짧고 실패 확률이 낮습니다.",
    ingredients: ["계란 2개", "두부 1/2모", "소금 약간"],
    steps: [
      "두부를 으깨고 계란과 섞습니다.",
      "전자레인지 2분 가열 후 섞습니다.",
      "1분 추가 가열 후 간을 맞춥니다.",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=계란+두부+스크램블",
    recipeUrl: "https://www.10000recipe.com/recipe/list.html?q=계란두부스크램블",
    shopping: [
      { name: "계란", amount: "10구 1판" },
      { name: "두부", amount: "1모" },
    ],
  },
  {
    id: 2,
    name: "감자 계란국",
    tags: ["15분", "냄비", "2인분"],
    reason: "남은 감자 활용도와 포만감이 높은 조합입니다.",
    ingredients: ["감자 1개", "계란 1개", "대파 약간", "국간장 1스푼"],
    steps: [
      "감자를 얇게 썰어 물과 함께 끓입니다.",
      "국간장으로 간을 맞춥니다.",
      "계란을 풀어 넣고 대파를 올립니다.",
    ],
    videoUrl: "https://www.youtube.com/results?search_query=감자+계란국+레시피",
    recipeUrl: "https://www.10000recipe.com/recipe/list.html?q=감자계란국",
    shopping: [
      { name: "감자", amount: "2개" },
      { name: "대파", amount: "1단" },
      { name: "국간장", amount: "소용량 1병" },
    ],
  },
]

function getCoupangUrl(keyword: string) {
  return `https://www.coupang.com/np/search?q=${encodeURIComponent(keyword)}`
}

// ─── 메인 컨텐츠 ──────────────────────────────────────────────────────────────
function ResultContent() {
  const searchParams = useSearchParams()
  const [selectedMenu, setSelectedMenu] = useState(0)
  const selected = MOCK_MENUS[selectedMenu]

  const summary = useMemo(() => {
    const time = searchParams.get("time") || "10분"
    const tools = searchParams.get("tools") || "팬"
    const ingredients = searchParams.get("ingredients") || "입력 재료 없음"
    return { time, tools, ingredients }
  }, [searchParams])

  return (
    <div className="min-h-screen bg-dc-bg">
      {/* 헤더 */}
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        {/* ✅ 모바일 전용 결과 헤더: h-14(56px) */}
        <div className="lg:hidden flex items-center justify-between h-14 px-5 bg-dc-surface">
          <div className="flex items-center gap-2.5">
            {/* ✅ 뒤로가기 터치 영역 44×44px */}
            <Link
              href="/quick"
              className="w-11 h-11 bg-dc-muted rounded-xl flex items-center justify-center text-dc-text-secondary text-lg"
            >
              ←
            </Link>
            <span className="text-dc-text text-[15px] font-bold">추천 결과</span>
          </div>
          {/* ✅ 다시입력 버튼 터치 영역 44px */}
          <Link
            href="/quick"
            className="h-11 px-4 bg-dc-muted rounded-xl text-dc-text-secondary text-[13px] font-medium flex items-center"
          >
            다시 입력
          </Link>
        </div>
        <div className="hidden lg:block">
          <NavBar variant="app" />
        </div>
      </div>

      <div className="flex w-full min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        {/*
          ✅ 모바일 패딩: px-5(20px) py-4(16px)
          ✅ 하단: pb-nav-safe (네비 56px + safe area)
        */}
        <main className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-4 lg:py-12 flex flex-col gap-4 lg:gap-6 pb-nav-safe lg:pb-12">

          {/* 입력 요약 */}
          <section className="bg-dc-surface border border-dc-border rounded-2xl p-4 lg:p-5">
            <p className="text-dc-text text-[13px] font-semibold">입력 요약</p>
            <p className="text-dc-text-secondary text-[12px] lg:text-xs mt-1.5 leading-relaxed">
              시간: {summary.time} · 도구: {summary.tools}
            </p>
            <p className="text-dc-text-secondary text-[12px] lg:text-xs mt-0.5 leading-relaxed">
              재료: {summary.ingredients}
            </p>
          </section>

          {/* 메뉴 선택 */}
          <section className="flex flex-col gap-3">
            {/* ✅ 섹션 제목: 모바일 18px / 데스크탑 28px */}
            <h1 className="text-dc-text text-[18px] lg:text-[28px] font-bold">추천 메뉴 3가지</h1>

            {/*
              ✅ 모바일: 가로 스크롤 snap
                - flex + overflow-x-auto
                - 카드 w-[180px]: 375px 화면에서 2.1개 보여 "더 있음" 암시
              ✅ 데스크탑: 3열 그리드
            */}
            <div className="flex gap-3 overflow-x-auto pb-1 snap-x snap-mandatory scroll-smooth -mx-5 px-5 lg:mx-0 lg:px-0 lg:grid lg:grid-cols-3 lg:overflow-visible lg:pb-0">
              {MOCK_MENUS.map((menu) => (
                <button
                  key={menu.id}
                  onClick={() => setSelectedMenu(menu.id)}
                  className={`flex-none w-[180px] lg:w-auto snap-start p-4 rounded-2xl border text-left transition-all ${
                    selectedMenu === menu.id
                      ? "border-dc-primary bg-dc-primary-light"
                      : "border-dc-border bg-dc-surface"
                  }`}
                >
                  <p className="text-dc-text text-[14px] font-bold leading-snug">{menu.name}</p>
                  <p className="text-dc-text-secondary text-[12px] mt-1">{menu.tags.join(" · ")}</p>
                  {selectedMenu === menu.id && (
                    <span className="mt-2 inline-block text-[11px] font-bold text-dc-primary">✓ 선택됨</span>
                  )}
                </button>
              ))}
            </div>
          </section>

          {/*
            ✅ 모바일: 장보기 먼저(위), 레시피 아래 → flex-col-reverse
            ✅ 데스크탑: 레시피 왼쪽, 장보기 오른쪽 → grid
          */}
          <section className="flex flex-col-reverse gap-4 lg:gap-6 lg:grid lg:grid-cols-[1fr_280px]">

            {/* 레시피 상세 */}
            <article className="bg-dc-surface rounded-2xl border border-dc-border p-5 lg:p-6">
              <div className="flex items-start justify-between gap-3">
                <div>
                  {/* ✅ 메뉴명: 모바일 17px / 데스크탑 18px */}
                  <h2 className="text-dc-text text-[17px] lg:text-lg font-bold">{selected.name}</h2>
                  {/* ✅ 설명: 13px, 줄간격 1.6 */}
                  <p className="text-dc-text-secondary text-[13px] mt-1.5 leading-relaxed">{selected.reason}</p>
                </div>
                <span className="text-[11px] font-semibold bg-dc-primary-light text-dc-primary px-2.5 py-1 rounded-full whitespace-nowrap flex-none">
                  선택됨
                </span>
              </div>

              {/* 재료 */}
              <div className="mt-5">
                <p className="text-dc-text text-[13px] font-semibold">재료</p>
                <ul className="mt-2 space-y-1.5">
                  {selected.ingredients.map((item) => (
                    <li key={item} className="text-dc-text-secondary text-[14px] leading-relaxed flex gap-1.5">
                      <span className="text-dc-text-muted">-</span>
                      <span>{item}</span>
                    </li>
                  ))}
                </ul>
              </div>

              <div className="h-px bg-dc-border my-5" />

              {/* 조리 순서 */}
              <div>
                <p className="text-dc-text text-[13px] font-semibold">조리 순서</p>
                <ol className="mt-2 space-y-2.5">
                  {selected.steps.map((step, index) => (
                    <li key={step} className="flex gap-2.5">
                      <span className="text-dc-primary text-[14px] font-bold flex-none">{index + 1}.</span>
                      {/* ✅ 레시피 본문: 14px, 줄간격 1.7 */}
                      <span className="text-dc-text-secondary text-[14px] leading-[1.7]">{step}</span>
                    </li>
                  ))}
                </ol>
              </div>

              {/* 액션 버튼들 */}
              <div className="mt-6 flex flex-col sm:flex-row gap-2">
                {/* ✅ 버튼 h-11(44px) 터치 영역 */}
                <a
                  href={selected.recipeUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-11 px-4 rounded-xl bg-dc-primary text-white text-[13px] font-semibold flex items-center justify-center hover:bg-[#2d6b45] transition-colors"
                >
                  레시피 더보기
                </a>
                <a
                  href={selected.videoUrl}
                  target="_blank"
                  rel="noreferrer"
                  className="h-11 px-4 rounded-xl bg-dc-muted text-dc-text-secondary text-[13px] font-semibold flex items-center justify-center hover:bg-dc-border transition-colors"
                >
                  유튜브 영상 보기
                </a>
              </div>
            </article>

            {/* 장보기 (모바일에서 레시피 위에 표시) */}
            <aside className="bg-dc-surface rounded-2xl border border-dc-border p-5 lg:p-6">
              <div className="flex items-center justify-between mb-3">
                <h2 className="text-dc-text text-[15px] font-bold">간단 장보기</h2>
                <span className="text-[10px] font-semibold text-dc-primary bg-dc-primary-light px-2 py-0.5 rounded-full">
                  quick
                </span>
              </div>
              <div className="divide-y divide-dc-border">
                {selected.shopping.map((item) => (
                  // ✅ 장보기 아이템 min-h-[44px] 터치 영역
                  <div key={item.name} className="flex items-center justify-between min-h-[44px]">
                    <span className="text-dc-text text-[14px]">{item.name}</span>
                    <span className="text-dc-text-secondary text-[12px]">{item.amount}</span>
                  </div>
                ))}
              </div>
              {/* ✅ 버튼 h-11(44px) */}
              <a
                href={getCoupangUrl(selected.shopping[0]?.name ?? selected.name)}
                target="_blank"
                rel="noreferrer"
                className="mt-4 h-11 rounded-xl bg-dc-muted text-dc-text-secondary text-[13px] font-semibold flex items-center justify-center hover:bg-dc-border transition-colors"
              >
                이 메뉴 재료 구매 검색
              </a>
            </aside>
          </section>
        </main>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      <MobileBottomNav />
    </div>
  )
}

export default function ResultPage() {
  return (
    <Suspense
      fallback={
        <div className="min-h-screen bg-dc-bg flex items-center justify-center text-dc-text-secondary text-sm">
          로딩 중...
        </div>
      }
    >
      <ResultContent />
    </Suspense>
  )
}