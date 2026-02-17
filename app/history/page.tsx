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
        savedMenus: 3,
        totalTime: "2분 5:15",
      },
      {
        id: 2,
        name: "게란 토스트",
        tags: ["재료", "계란", "바나나", "치즈"],
        time: "전자레인지 2분 5:15",
        savedMenus: 1,
        totalTime: "7:20",
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
        savedMenus: 2,
        totalTime: "8분",
      },
    ],
  },
]

export default function HistoryPage() {
  const [activeFilter, setActiveFilter] = useState("전체")

  return (
    <div className="min-h-screen bg-dc-bg">
      {/* NavBar */}
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      {/* Body */}
      <div className="flex w-full">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        <div className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-6 lg:py-12 flex flex-col gap-6 pb-24 lg:pb-12">

          {/* Header */}
          <div className="flex flex-col gap-1">
            <h1 className="text-dc-text text-2xl lg:text-[28px] font-bold">히스토리</h1>
            <p className="text-dc-text-secondary text-xs lg:text-sm">
              이전에 만든 메뉴 플랜을 다시 사용해보세요
            </p>
          </div>

          {/* Filters */}
          <div className="flex flex-wrap gap-2">
            {FILTERS.map((filter) => (
              <button
                key={filter}
                onClick={() => setActiveFilter(filter)}
                className={`h-8 px-4 rounded-full text-[13px] font-medium transition-colors ${
                  activeFilter === filter
                    ? "bg-dc-primary text-white"
                    : "bg-dc-muted text-dc-text-secondary hover:bg-dc-border"
                }`}
              >
                {filter}
              </button>
            ))}
          </div>

          {/* History List */}
          <div className="flex flex-col gap-6">
            {MOCK_HISTORY.map((group) => (
              <div key={group.date} className="flex flex-col gap-3">
                <div className="text-dc-text-muted text-[12px] font-semibold">{group.date}</div>

                {/* Desktop: 3-col grid */}
                <div className="hidden lg:grid grid-cols-3 gap-4">
                  {group.items.map((item) => (
                    <HistoryCard key={item.id} item={item} />
                  ))}
                </div>

                {/* Mobile: list */}
                <div className="lg:hidden flex flex-col gap-3">
                  {group.items.map((item) => (
                    <MobileHistoryCard key={item.id} item={item} />
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
    <div className="bg-dc-surface rounded-2xl border border-dc-border p-5 flex flex-col gap-3">
      <div className="flex items-start justify-between">
        <div className="flex flex-col gap-1">
          <div className="flex items-center gap-2">
            <span className="text-[10px] font-semibold text-dc-primary bg-dc-primary-light px-2 py-0.5 rounded-full">
              전자레인지 2분 {item.totalTime}
            </span>
          </div>
          <div className="text-dc-text text-sm font-bold mt-1">{item.name}</div>
          <div className="text-dc-text-secondary text-xs">{item.tags.join(", ")}</div>
        </div>
      </div>
      <div className="flex gap-2 mt-1">
        <Link
          href={`/result?history=${item.id}`}
          className="flex-1 h-9 bg-dc-primary text-white text-[13px] font-semibold rounded-lg flex items-center justify-center hover:bg-[#2d6b45] transition-colors"
        >
          다시 사용하기
        </Link>
        <Link
          href={`/result?history=${item.id}`}
          className="h-9 px-3 bg-dc-muted text-dc-text-secondary text-[13px] font-medium rounded-lg flex items-center justify-center hover:bg-dc-border transition-colors"
        >
          보기
        </Link>
      </div>
    </div>
  )
}

function MobileHistoryCard({ item }: { item: typeof MOCK_HISTORY[0]["items"][0] }) {
  return (
    <div className="bg-dc-surface rounded-2xl border border-dc-border p-4 flex flex-col gap-3">
      <div className="flex items-start gap-3">
        <div className="flex-1 flex flex-col gap-1">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-[10px] font-semibold text-dc-primary bg-dc-primary-light px-2 py-0.5 rounded-full">
              {item.time}
            </span>
          </div>
          <div className="text-dc-text text-sm font-bold">{item.name}</div>
          <div className="text-dc-text-secondary text-xs">{item.tags.join(", ")}</div>
        </div>
      </div>
      <div className="flex gap-2">
        <Link
          href={`/result?history=${item.id}`}
          className="flex-1 h-10 bg-dc-primary text-white text-[13px] font-semibold rounded-xl flex items-center justify-center hover:bg-[#2d6b45] transition-colors"
        >
          다시 사용하기
        </Link>
        <Link
          href={`/result?history=${item.id}`}
          className="h-10 px-3 bg-dc-muted text-dc-text-secondary text-[13px] font-medium rounded-xl flex items-center justify-center hover:bg-dc-border transition-colors"
        >
          보기
        </Link>
      </div>
    </div>
  )
}
