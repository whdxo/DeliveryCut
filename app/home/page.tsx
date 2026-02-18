import Link from "next/link"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"

const FEATURE_CARDS = [
  {
    title: "빠른 AI 레시피 추천",
    desc: "지금 있는 재료로 즉시 한 끼 추천을 받고, 레시피와 영상, 간단 장보기까지 확인합니다.",
    href: "/quick",
    badge: "즉시 한 끼",
    cta: "빠르게 추천받기",
  },
  {
    title: "플랜 생성기",
    desc: "3일/7일, 하루 1/2/3끼 기준으로 식단을 만들고 통합 장보기 리스트를 생성합니다.",
    href: "/planner",
    badge: "주간 관리",
    cta: "플랜 만들기",
  },
]

export default function HomePage() {
  return (
    <div className="min-h-screen bg-dc-bg">
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      <div className="flex w-full min-h-[calc(100vh-4rem)]">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        <main className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-8 lg:py-12 pb-24 lg:pb-12">
          <section className="bg-dc-surface border border-dc-border rounded-2xl p-6 lg:p-8 mb-6">
            <p className="inline-flex px-3 py-1 rounded-full bg-dc-primary-light text-dc-primary text-xs font-semibold">
              DeliveryCut Workflow
            </p>
            <h1 className="mt-4 text-dc-text text-2xl lg:text-3xl font-bold">
              배달컷 메뉴를 2가지 목적에 맞게 분리했어요
            </h1>
            <p className="mt-2 text-dc-text-secondary text-sm lg:text-base max-w-[700px] leading-relaxed">
              장보기/구매연동은 독립 메뉴가 아니라 추천 결과 내부에서 바로 이어지도록 구성했습니다.
            </p>
          </section>

          <section className="grid grid-cols-1 lg:grid-cols-2 gap-4">
            {FEATURE_CARDS.map((feature) => (
              <article
                key={feature.title}
                className="bg-dc-surface border border-dc-border rounded-2xl p-5 lg:p-6 flex flex-col"
              >
                <span className="inline-flex w-fit px-2.5 py-1 rounded-full bg-dc-muted text-dc-text-secondary text-[11px] font-semibold">
                  {feature.badge}
                </span>
                <h2 className="mt-4 text-dc-text text-lg font-bold">{feature.title}</h2>
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
            ))}
          </section>
        </main>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      <MobileBottomNav />
    </div>
  )
}
