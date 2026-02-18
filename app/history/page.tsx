"use client"

import { useState } from "react"
import Link from "next/link"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"

const FILTERS = ["전체", "5분 이하", "10분", "15분 이상"]

const MOCK_HISTORY = [
  {
    date: "오늘 · 2026. 2. 17",
    items: [
      {
        id: 1,
        name: "계란 볶음밥",
        tags: ["5분", "3가지 재료", "팬"],
        time: "방금 전 2:30",
        totalTime: "5분",
      },
      {
        id: 2,
        name: "계란 토스트",
        tags: ["계란", "바나나", "치즈"],
        time: "전자레인지 2분",
        totalTime: "7분",
      },
    ],
  },
  {
    date: "어제 · 2026. 2. 16",
    items: [
      {
        id: 3,
        name: "고구마 치즈구이",
        tags: ["고구마", "모짜렐라치즈", "버터"],
        time: "어제",
        totalTime: "8분",
      },
    ],
  },
]

export default function HistoryPage() {
  const [activeFilter, setActiveFilter] = useState("전체")

  return (
    <div className="min-h-screen bg-dc-bg">
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      <div className="flex w-full min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        {/*
          ✅ 모바일 패딩: px-5(20px) py-5(20px)
          ✅ pb-nav-safe: 하단 네비 + safe area 여백
        */}
        <div className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-5 lg:py-12 flex flex-col gap-5 lg:gap-6 pb-nav-safe lg:pb-12">

          {/* 페이지 헤더 */}
          <div className="flex flex-col gap-1">
            {/* ✅ 모바일 22px / 데스크탑 28px */}
            <h1 className="text-dc-text text-[22px] lg:text-[28px] font-bold">히스토리</h1>
            <p className="text-dc-text-secondary text-[13px] lg:text-sm leading-relaxed">
              이전에 만든 메뉴 플랜을 다시 사용해보세요
            </p>
          </div>

          {/* 필터 탭 */}
          <div className="flex gap-2 overflow-x-auto pb-0.5 -mx-5 px-5 lg:mx-0 lg:px-0 lg:flex-wrap">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                // ✅ 필터 버튼 h-11(44px) 터치 영역
                className={`flex-none h-11 px-4 rounded-full text-[13px] font-medium transition-colors whitespace-nowrap ${
                  activeFilter === filter
                    ? "bg-dc-primary text-white"
                    : "bg-dc-muted text-dc-text-secondary hover:bg-dc-border"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* 히스토리 목록 */}
          <div className="flex flex-col gap-6">
            {MOCK_HISTORY.map((group) => (
              <div key={group.date} className="flex flex-col gap-3">
                {/* ✅ 날짜 라벨 12px */}
                <div className="text-dc-text-muted text-[12px] font-semibold tracking-wide">
                  {group.date}
                </div>

                {/* ✅ 통합 카드: 모바일 1열 / 데스크탑 3열 */}
                <div className="grid grid-cols-1 lg:grid-cols-3 gap-3 lg:gap-4">
                  {group.items.map((item) => (
                    <HistoryCard key={item.id} item={item} />
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      <MobileBottomNav />
    </div>
  )
}

function HistoryCard({ item }: { item: typeof MOCK_HISTORY[0]["items"][0] }) {
  return (
    <div className="bg-dc-surface rounded-2xl border border-dc-border p-4 flex flex-col gap-3">
      <div className="flex flex-col gap-1.5">
        {/* 뱃지 */}
        <span className="text-[11px] font-semibold text-dc-primary bg-dc-primary-light px-2.5 py-1 rounded-full w-fit">
          {item.time}
        </span>
        {/* ✅ 카드 제목: 15px */}
        <div className="text-dc-text text-[15px] font-bold leading-snug">{item.name}</div>
        {/* ✅ 태그: 12px */}
        <div className="text-dc-text-secondary text-[12px] leading-relaxed">
          {item.tags.join(" · ")}
        </div>
      </div>

      {/* 버튼 영역 */}
      <div className="flex gap-2 mt-0.5">
        {/* ✅ 버튼 h-11(44px) 터치 영역 */}
        <Link
          href={`/result?history=${item.id}`}
          className="flex-1 h-11 bg-dc-primary text-white text-[13px] font-semibold rounded-xl flex items-center justify-center hover:bg-[#2d6b45] transition-colors"
        >
          다시 사용하기
        </Link>
        <Link
          href={`/result?history=${item.id}`}
          className="h-11 px-4 bg-dc-muted text-dc-text-secondary text-[13px] font-medium rounded-xl flex items-center justify-center hover:bg-dc-border transition-colors"
        >
          보기
        </Link>
      </div>
    </div>
  )
}