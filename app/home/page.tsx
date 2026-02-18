"use client"

import { useState } from "react"
import Link from "next/link"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import { Refrigerator, Zap, CalendarDays } from "lucide-react"

const FEATURE_CARDS = [
  {
    title: "빠른 AI 레시피 추천",
    desc: "지금 있는 재료로 즉시 한 끼 추천을 받고, 레시피와 영상, 간단 장보기까지 확인합니다.",
    href: "/quick",
    badge: "즉시 한 끼",
    cta: "빠르게 추천받기",
    icon: Zap,
  },
  {
    title: "플랜 생성기",
    desc: "3일/7일, 하루 1/2/3끼 기준으로 식단을 만들고 통합 장보기 리스트를 생성합니다.",
    href: "/planner",
    badge: "주간 관리",
    cta: "플랜 만들기",
    icon: CalendarDays,
  },
]

export default function HomePage() {
  const [fridgeItems] = useState<string[]>([
    "계란", "김치", "두부", "양파", "참치캔"
  ])

  return (
    <div className="min-h-screen bg-dc-bg">
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      <div className="flex w-full min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        <main className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-8 lg:py-12 pb-nav-safe lg:pb-12">
          
          {/* ✅ 냉장고 요약 섹션 - 그라데이션만 제거, 나머지 동일 */}
          <section className="bg-dc-surface border border-dc-border rounded-2xl p-6 lg:p-8 mb-6">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 bg-dc-primary rounded-2xl flex items-center justify-center">
                  <Refrigerator size={24} className="text-white" />
                </div>
                <div>
                  <h2 className="text-dc-text text-[18px] font-bold">내 냉장고</h2>
                  <p className="text-dc-text-secondary text-[13px]">
                    {fridgeItems.length > 0 ? `${fridgeItems.length}개 재료 등록됨` : "재료를 등록해보세요"}
                  </p>
                </div>
              </div>
              <Link
                href="/fridge"
                className="h-10 px-4 bg-dc-primary text-white text-[13px] font-semibold rounded-xl hover:bg-[#2d6b45] transition-colors flex items-center gap-1.5"
              >
                관리
              </Link>
            </div>

            {/* 재료 미리보기 */}
            {fridgeItems.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {fridgeItems.slice(0, 8).map((item) => (
                  <span
                    key={item}
                    className="h-9 px-3 bg-white text-dc-primary text-[13px] font-medium rounded-full flex items-center border border-dc-primary/20"
                  >
                    {item}
                  </span>
                ))}
                {fridgeItems.length > 8 && (
                  <span className="h-9 px-3 bg-white text-dc-text-secondary text-[13px] font-medium rounded-full flex items-center border border-dc-border">
                    +{fridgeItems.length - 8}개
                  </span>
                )}
              </div>
            ) : (
              <div className="bg-white/50 rounded-xl p-6 text-center mb-4">
                <p className="text-dc-text-secondary text-[14px]">
                  냉장고에 재료를 등록하면 빠르게 메뉴를 추천받을 수 있어요
                </p>
              </div>
            )}

            {/* 빠른 추천 버튼 */}
            {fridgeItems.length > 0 && (
              <Link
                href={`/quick?ingredients=${encodeURIComponent(fridgeItems.join(", "))}`}
                className="w-full h-12 bg-dc-primary text-white text-[15px] font-bold rounded-xl hover:bg-[#2d6b45] transition-colors flex items-center justify-center gap-2"
              >
                <Zap size={18} />
                이 재료로 바로 추천받기
              </Link>
            )}
          </section>

          {/* 기능 카드 2개 */}
          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {FEATURE_CARDS.map((feature) => {
              const IconComponent = feature.icon
              return (
                <article
                  key={feature.title}
                  className="bg-dc-surface border border-dc-border rounded-2xl p-5 lg:p-6 flex flex-col"
                >
                  <div className="flex items-center gap-3 mb-3">
                    <div className="w-10 h-10 bg-dc-muted rounded-xl flex items-center justify-center">
                      <IconComponent size={20} className="text-dc-primary" />
                    </div>
                    <span className="inline-flex px-2.5 py-1 rounded-full bg-dc-muted text-dc-text-secondary text-[11px] font-semibold">
                      {feature.badge}
                    </span>
                  </div>
                  <h2 className="text-dc-text text-lg font-bold">{feature.title}</h2>
                  <p className="mt-2 text-dc-text-secondary text-sm leading-relaxed flex-1">
                    {feature.desc}
                  </p>
                  <Link
                    href={feature.href}
                    className="mt-5 h-11 rounded-xl bg-dc-primary text-white text-sm font-semibold flex items-center justify-center hover:bg-[#2d6b45] transition-colors"
                  >
                    {feature.cta}
                  </Link>
                </article>
              )
            })}
          </section>
        </main>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      <MobileBottomNav />
    </div>
  )
}