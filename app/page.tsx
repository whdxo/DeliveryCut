"use client"

import Link from "next/link"
import { NavBar } from "@/components/shared/PageLayout"

const SEASONAL_MENUS: Record<number, { name: string; emoji: string; ingredients: string }[]> = {
  1: [{ name: "김치찌개", emoji: "🍲", ingredients: "김치, 돼지고기, 두부, 대파" },{ name: "떡국", emoji: "🍜", ingredients: "떡국떡, 계란, 대파, 육수" },{ name: "소불고기", emoji: "🥩", ingredients: "소고기, 양파, 당근, 간장" }],
  2: [{ name: "된장찌개", emoji: "🍲", ingredients: "된장, 두부, 애호박, 양파" },{ name: "계란말이 + 제육볶음", emoji: "🥚", ingredients: "계란, 돼지고기, 고추장, 양파" },{ name: "닭볶음탕", emoji: "🍗", ingredients: "닭, 감자, 당근, 고추장" }],
  3: [{ name: "봄동겉절이 + 된장국", emoji: "🥬", ingredients: "봄동, 된장, 두부, 멸치" },{ name: "두부조림", emoji: "🟫", ingredients: "두부, 간장, 고춧가루, 대파" },{ name: "비빔밥", emoji: "🍚", ingredients: "밥, 시금치, 당근, 계란, 고추장" }],
  4: [{ name: "냉이된장국", emoji: "🌿", ingredients: "냉이, 된장, 두부, 멸치" },{ name: "오이무침 + 불고기", emoji: "🥒", ingredients: "오이, 소고기, 간장, 참기름" },{ name: "참치마요덮밥", emoji: "🐟", ingredients: "참치캔, 마요네즈, 밥, 김" }],
  5: [{ name: "비빔국수", emoji: "🍜", ingredients: "소면, 오이, 당근, 고추장" },{ name: "애호박볶음 + 계란찜", emoji: "🥦", ingredients: "애호박, 계란, 새우젓, 대파" },{ name: "카레라이스", emoji: "🍛", ingredients: "카레가루, 감자, 당근, 양파" }],
  6: [{ name: "열무비빔밥", emoji: "🥗", ingredients: "열무김치, 밥, 계란, 고추장" },{ name: "오이냉국", emoji: "🥒", ingredients: "오이, 식초, 설탕, 깨" },{ name: "닭가슴살 샐러드", emoji: "🥙", ingredients: "닭가슴살, 양상추, 토마토, 드레싱" }],
  7: [{ name: "콩국수", emoji: "🍜", ingredients: "콩, 소면, 오이, 소금" },{ name: "삼겹살 구이 + 쌈채소", emoji: "🥬", ingredients: "삼겹살, 상추, 깻잎, 마늘" },{ name: "김치볶음밥", emoji: "🍳", ingredients: "김치, 밥, 계란, 참기름" }],
  8: [{ name: "냉면", emoji: "🍜", ingredients: "냉면면, 육수, 오이, 계란" },{ name: "가지볶음 + 제육볶음", emoji: "🍆", ingredients: "가지, 돼지고기, 고추장, 양파" },{ name: "참치김치찌개", emoji: "🍲", ingredients: "참치캔, 김치, 두부, 대파" }],
  9: [{ name: "버섯불고기", emoji: "🍄", ingredients: "버섯, 소고기, 간장, 양파" },{ name: "감자조림", emoji: "🥔", ingredients: "감자, 간장, 설탕, 고추" },{ name: "된장찌개", emoji: "🍲", ingredients: "된장, 두부, 버섯, 애호박" }],
  10: [{ name: "고등어구이", emoji: "🐟", ingredients: "고등어, 소금, 무, 대파" },{ name: "시금치나물 + 소고기무국", emoji: "🥬", ingredients: "시금치, 소고기, 무, 간장" },{ name: "잡채", emoji: "🍜", ingredients: "당면, 시금치, 당근, 소고기" }],
  11: [{ name: "순두부찌개", emoji: "🍲", ingredients: "순두부, 계란, 고추장, 대파" },{ name: "김치볶음 + 계란후라이", emoji: "🥚", ingredients: "김치, 계란, 참기름, 밥" },{ name: "닭갈비", emoji: "🍗", ingredients: "닭, 고추장, 고구마, 양배추" }],
  12: [{ name: "부대찌개", emoji: "🍲", ingredients: "햄, 소시지, 김치, 라면, 두부" },{ name: "갈비찜", emoji: "🥩", ingredients: "소갈비, 당근, 무, 간장" },{ name: "김치찌개", emoji: "🍲", ingredients: "김치, 돼지고기, 두부, 대파" }],
}

const MONTH_LABELS: Record<number, string> = {
  1: "1월 겨울", 2: "2월 겨울", 3: "3월 초봄", 4: "4월 봄",
  5: "5월 봄", 6: "6월 초여름", 7: "7월 여름", 8: "8월 여름",
  9: "9월 초가을", 10: "10월 가을", 11: "11월 늦가을", 12: "12월 겨울",
}

export default function LandingPage() {
  const currentMonth = new Date().getMonth() + 1
  const menus = SEASONAL_MENUS[currentMonth]
  const monthLabel = MONTH_LABELS[currentMonth]

  return (
    <div className="min-h-screen bg-dc-bg">
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="landing" />
      </div>

      {/* Hero */}
      <section className="w-full bg-dc-bg">
        <div className="flex w-full">
          <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />
          <div className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-12 py-12 lg:py-20">
            <div className="flex flex-col md:flex-row gap-8 md:gap-10 lg:gap-12 items-start">
              {/* Left */}
              <div className="flex-1 flex flex-col gap-6 lg:gap-7">
                <div className="inline-flex">
                  <span className="bg-dc-primary-light text-dc-primary text-xs font-medium px-3.5 py-1.5 rounded-full">
                    배달비 0원 ✦ AI 레시피
                  </span>
                </div>
                <div className="flex flex-col gap-2">
                  <h1 className="text-dc-text-secondary text-lg lg:text-xl font-medium">배달비 아깝잖아요.</h1>
                  <h2 className="text-dc-text text-3xl lg:text-5xl font-bold leading-tight">
                    냉장고 재료로<br />
                    <span className="text-dc-primary">5분만에</span> 만들어요.
                  </h2>
                </div>
                <p className="text-dc-text-secondary text-sm lg:text-base leading-relaxed max-w-md">
                  있는 재료 입력하면 AI가 딱 맞는 메뉴를 추천해드려요.<br className="hidden lg:block" />
                  시간, 도구, 기피 재료까지 고려한 맞춤 레시피.
                </p>
                <div className="flex flex-col sm:flex-row gap-3">
                  <Link
                    href="/home"
                    className="h-[52px] px-7 bg-dc-primary text-white text-[15px] font-bold rounded-xl flex items-center justify-center hover:bg-[#2d6b45] transition-colors"
                  >
                    지금 바로 시작하기
                  </Link>
                  <Link
                    href="/subscription"
                    className="h-[52px] px-7 bg-dc-surface text-dc-primary text-[15px] font-bold rounded-xl flex items-center justify-center hover:bg-dc-primary-light transition-colors"
                  >
                    구독 안내
                  </Link>
                </div>
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
                    <div className="text-dc-text-muted text-xs mt-0.5">하루 10회까지 무료 제공</div>
                  </div>
                </div>
              </div>

              {/* Right: 제철 메뉴 카드 */}
              <div className="w-full md:w-[340px] lg:w-[380px] md:flex-none">
                <div className="bg-dc-surface rounded-2xl p-5 border border-dc-border shadow-sm">
                  <div className="flex items-center justify-between mb-3">
                    <div className="text-dc-text-muted text-xs font-medium">이달의 제철 메뉴 ✦</div>
                    <span className="text-[10px] font-bold text-dc-primary bg-dc-primary-light px-2 py-0.5 rounded-full">
                      {monthLabel}
                    </span>
                  </div>
                  <div className="flex flex-col gap-3">
                    {menus.map((item, i) => (
                      <Link
                        key={i}
                        href={`/quick?menu=${encodeURIComponent(item.ingredients)}`}
                        className={`flex items-start gap-3 p-3 rounded-xl hover:opacity-90 transition-opacity ${i === 0 ? "bg-dc-primary-light" : "bg-dc-muted"}`}
                      >
                        <div className={`w-10 h-10 rounded-xl flex items-center justify-center text-lg flex-shrink-0 ${i === 0 ? "bg-dc-primary" : "bg-dc-border"}`}>
                          {item.emoji}
                        </div>
                        <div className="flex-1 min-w-0">
                          <div className="text-dc-text text-sm font-semibold">{item.name}</div>
                          <div className="text-dc-text-secondary text-[11px] truncate mt-0.5">{item.ingredients}</div>
                        </div>
                        {i === 0 && (
                          <span className="bg-dc-primary text-white text-[10px] font-bold px-2 py-0.5 rounded-full flex-shrink-0">추천</span>
                        )}
                      </Link>
                    ))}
                  </div>
                  <p className="mt-3 text-center text-dc-text-muted text-[11px]">클릭하면 재료가 자동으로 입력돼요 🍳</p>
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
                  { num: "1", title: "재료 입력", desc: "냉장고에 있는 재료와 사용 가능한 조리 도구, 요리 시간을 입력해요." },
                  { num: "2", title: "AI 분석", desc: "AI가 입력된 재료와 조건을 분석해서 최적의 메뉴 3가지를 추천해요." },
                  { num: "3", title: "요리 시작!", desc: "레시피, 3일 플랜, 장보기 목록까지 한번에 받아서 바로 요리해요." },
                ].map((step) => (
                  <div key={step.num} className="bg-dc-surface rounded-2xl p-6 border border-dc-border flex flex-col gap-3.5">
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
                현재 오픈 기간으로 모든 구독 기능을 무료 제공 중입니다.
              </p>
              <Link
                href="/home"
                className="h-[52px] px-7 bg-dc-surface text-dc-primary text-[15px] font-bold rounded-xl flex items-center justify-center hover:bg-dc-primary-light transition-colors w-fit"
              >
                메뉴 추천받기 →
              </Link>
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
                  <img src="/logo.png" alt="DeliveryCut" style={{width:'24px',height:'24px',minWidth:'24px'}} />
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

