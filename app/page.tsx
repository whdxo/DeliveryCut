"use client"

import Link from "next/link"
import { NavBar } from "@/components/shared/PageLayout"

export default function LandingPage() {
  return (
    <div className="min-h-screen bg-dc-bg">
      {/* NavBar */}
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="landing" />
      </div>

      {/* Hero Section */}
      <section className="w-full bg-dc-bg">
        <div className="flex w-full">
          <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />
          <div className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-12 py-12 lg:py-20">
            <div className="flex flex-col lg:flex-row gap-8 lg:gap-12 items-start">
              {/* Left: Hero text */}
              <div className="flex-1 flex flex-col gap-6 lg:gap-7">
                {/* Badge */}
                <div className="inline-flex">
                  <span className="bg-dc-primary-light text-dc-primary text-xs font-medium px-3.5 py-1.5 rounded-full">
                    배달비 0원 ✦ AI 레시피
                  </span>
                </div>

                {/* Title */}
                <div className="flex flex-col gap-2">
                  <h1 className="text-dc-text-secondary text-lg lg:text-xl font-medium">
                    배달비 아깝잖아요.
                  </h1>
                  <h2 className="text-dc-text text-3xl lg:text-5xl font-bold leading-tight">
                    냉장고 재료로
                    <br />
                    <span className="text-dc-primary">5분만에</span> 만들어요.
                  </h2>
                </div>

                {/* Description */}
                <p className="text-dc-text-secondary text-sm lg:text-base leading-relaxed max-w-md">
                  있는 재료 입력하면 AI가 딱 맞는 메뉴를 추천해드려요.
                  <br className="hidden lg:block" />
                  시간, 도구, 기피 재료까지 고려한 맞춤 레시피.
                </p>

                {/* CTA Buttons */}
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/home"
                    className="h-[52px] px-7 bg-dc-primary text-white text-[15px] font-bold rounded-xl flex items-center justify-center hover:bg-[#2d6b45] transition-colors"
                  >
                    지금 바로 시작하기 →
                  </Link>
                </div>

                {/* Stats */}
                <div className="flex gap-8 pt-2">
                  <div>
                    <div className="text-dc-text text-xl font-bold">5분~</div>
                    <div className="text-dc-text-muted text-xs mt-0.5">1인 메뉴 조리 시간</div>
                  </div>
                  <div>
                    <div className="text-dc-text text-xl font-bold">3가지</div>
                    <div className="text-dc-text-muted text-xs mt-0.5">매 추천 메뉴 수</div>
                  </div>
                  <div>
                    <div className="text-dc-text text-xl font-bold">무료</div>
                    <div className="text-dc-text-muted text-xs mt-0.5">완전 무료로 이용해요</div>
                  </div>
                </div>
              </div>

              {/* Right: Preview card - desktop only */}
              <div className="hidden lg:block w-[380px] flex-none">
                <div className="bg-dc-surface rounded-2xl p-5 border border-dc-border shadow-sm">
                  <div className="text-dc-text-muted text-xs font-medium mb-3">오늘의 추천 메뉴 ✦</div>
                  <div className="flex flex-col gap-3">
                    {[
                      { name: "계란볶음밥", tags: ["5분", "팬 하나"], badge: "추천" },
                      { name: "참치찌개", tags: ["15분", "냄비"], badge: "" },
                      { name: "냉파스타", tags: ["10분", "삶기"], badge: "" },
                    ].map((item, i) => (
                      <div
                        key={i}
                        className={`flex items-center gap-3 p-3 rounded-xl ${
                          i === 0 ? "bg-dc-primary-light" : "bg-dc-muted"
                        }`}
                      >
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg ${
                            i === 0 ? "bg-dc-primary" : "bg-dc-border"
                          }`}
                        >
                          {["🍳", "🍲", "🍝"][i]}
                        </div>
                        <div className="flex-1">
                          <div className="text-dc-text text-sm font-semibold">{item.name}</div>
                          <div className="text-dc-text-secondary text-xs">{item.tags.join(" · ")}</div>
                        </div>
                        {item.badge && (
                          <span className="bg-dc-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
                            {item.badge}
                          </span>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
        </div>
      </section>

      {/* How It Works */}
      <section className="w-full bg-dc-bg">
        <div className="flex w-full">
          <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />
          <div className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-12 py-12 lg:py-16">
            <div className="flex flex-col gap-10">
              <div className="flex flex-col gap-2">
                <h2 className="text-dc-text text-2xl lg:text-[28px] font-bold">이렇게 사용해요</h2>
                <p className="text-dc-text-secondary text-[15px]">딱 3단계면 오늘 저녁 메뉴 해결!</p>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
                {[
                  {
                    num: "1",
                    title: "재료 입력",
                    desc: "냉장고에 있는 재료와 사용 가능한 조리 도구, 요리 시간을 입력해요.",
                  },
                  {
                    num: "2",
                    title: "AI 분석",
                    desc: "AI가 입력된 재료와 조건을 분석해서 최적의 메뉴 3가지를 추천해요.",
                  },
                  {
                    num: "3",
                    title: "요리 시작!",
                    desc: "레시피, 3일 플랜, 장보기 목록까지 한번에 받아서 바로 요리해요.",
                  },
                ].map((step) => (
                  <div
                    key={step.num}
                    className="bg-dc-surface rounded-2xl p-6 border border-dc-border flex flex-col gap-3.5"
                  >
                    <div className="w-9 h-9 bg-dc-primary rounded-full flex items-center justify-center text-white text-base font-bold flex-none">
                      {step.num}
                    </div>
                    <div className="text-dc-text text-base font-bold">{step.title}</div>
                    <p className="text-dc-text-secondary text-[13px] leading-relaxed">{step.desc}</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
          <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
        </div>
      </section>

      {/* Final CTA */}
      <section className="w-full">
        <div className="flex w-full">
          <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />
          <div className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-12 py-12 lg:py-16 bg-dc-primary">
            <div className="flex flex-col gap-6 max-w-lg">
              <h2 className="text-white text-2xl lg:text-[32px] font-bold leading-snug">
                오늘 저녁, 뭐 먹을지 고민 끝! 🍽
              </h2>
              <p className="text-dc-primary-light text-sm lg:text-base">
                지금 바로 냉장고 재료를 입력해보세요. 완전 무료예요.
              </p>
              <div className="flex flex-col sm:flex-row gap-3">
                <Link
                  href="/home"
                  className="h-[52px] px-7 bg-dc-surface text-dc-primary text-[15px] font-bold rounded-xl flex items-center justify-center hover:bg-dc-primary-light transition-colors w-full sm:w-auto"
                >
                  메뉴 추천받기 →
                </Link>
              </div>
            </div>
          </div>
          <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
        </div>
      </section>

      {/* Footer */}
      <footer className="w-full bg-dc-text">
        <div className="flex w-full">
          <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />
          <div className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-12 py-10">
            <div className="flex items-center justify-between flex-col lg:flex-row gap-4">
              <div className="flex flex-col gap-2">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-md bg-dc-primary flex items-center justify-center">
                    <span className="text-white text-[10px] font-bold">DC</span>
                  </div>
                  <span className="text-white text-sm font-bold">DeliveryCut</span>
                </div>
                <p className="text-dc-text-secondary text-xs">배달 대신, 내 손으로 🍳</p>
              </div>
              <p className="text-dc-text-secondary text-xs">© 2026 DeliveryCut. All rights reserved.</p>
            </div>
          </div>
          <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
        </div>
      </footer>
    </div>
  )
}

