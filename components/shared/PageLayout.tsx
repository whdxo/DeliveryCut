"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { usePathname, useRouter } from "next/navigation"
import { logOut, onAuthChange } from "@/lib/firebase"
// ✅ Lucide 아이콘 import
import { Zap, Calendar, History, User } from "lucide-react"

export function DesktopLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex w-full min-h-screen">
      <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />
      <div className="w-full lg:w-[960px] lg:flex-none min-h-screen bg-dc-bg">
        {children}
      </div>
      <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
    </div>
  )
}

interface NavBarProps {
  variant?: "landing" | "app"
}

export function NavBar({ variant = "app" }: NavBarProps) {
  const pathname = usePathname()
  const router = useRouter()
  const [isLoggedIn, setIsLoggedIn] = useState(false)

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      setIsLoggedIn(Boolean(user))
    })

    return () => unsubscribe()
  }, [])

  const handleLogout = async () => {
    const { error } = await logOut()
    if (!error) {
      router.push("/")
    }
  }

  return (
    <div className="w-full bg-dc-surface flex">
      <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block h-14 lg:h-16" />

      <div className="w-full lg:w-[960px] lg:flex-none h-14 lg:h-16 flex items-center justify-between px-5 lg:px-10 bg-dc-surface">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[7px] bg-dc-primary flex items-center justify-center">
            <span className="text-white text-[11px] font-bold">DC</span>
          </div>
          <span className="text-dc-text text-base lg:text-[17px] font-bold">DeliveryCut</span>
        </Link>

        {/* ✅ 수정: 중복 제거, 로그인 상태에 따라 분기 */}
        {variant === "landing" ? (
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="h-11 px-5 rounded-full bg-dc-muted text-dc-text text-[13px] font-semibold flex items-center justify-center hover:bg-dc-border transition-colors"
              >
                로그아웃
              </button>
            ) : (
              <>
                <Link
                  href="/login"
                  className="h-11 px-4 rounded-full bg-dc-muted text-dc-text text-[13px] font-semibold flex items-center justify-center hover:bg-dc-border transition-colors"
                >
                  로그인
                </Link>
                <Link
                  href="/home"
                  className="h-11 px-4 rounded-full bg-dc-primary text-white text-[13px] font-semibold flex items-center justify-center hover:bg-[#2d6b45] transition-colors"
                >
                  무료로 시작하기
                </Link>
              </>
            )}
          </div>
        ) : (
          <div className="hidden lg:flex items-center gap-3">
            <Link
              href="/quick"
              className={`text-[13px] font-medium transition-colors ${
                pathname === "/quick" || pathname === "/result"
                  ? "text-dc-primary font-semibold"
                  : "text-dc-text-secondary hover:text-dc-text"
              }`}
            >
              빠른추천
            </Link>
            <Link
              href="/planner"
              className={`text-[13px] font-medium transition-colors ${
                pathname === "/planner"
                  ? "text-dc-primary font-semibold"
                  : "text-dc-text-secondary hover:text-dc-text"
              }`}
            >
              플랜생성기
            </Link>
            <Link
              href="/history"
              className={`text-[13px] font-medium transition-colors ${
                pathname === "/history"
                  ? "text-dc-primary font-semibold"
                  : "text-dc-text-secondary hover:text-dc-text"
              }`}
            >
              히스토리
            </Link>
            <Link
              href="/mypage"
              className={`text-[13px] font-medium transition-colors ${
                pathname === "/mypage"
                  ? "text-dc-primary font-semibold"
                  : "text-dc-text-secondary hover:text-dc-text"
              }`}
            >
              마이페이지
            </Link>
          </div>
        )}
      </div>

      <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block h-14 lg:h-16" />
    </div>
  )
}

export function MobileBottomNav() {
  const pathname = usePathname()

  // ✅ Lucide 아이콘 사용
  const tabs = [
    { href: "/quick",   icon: Zap,      label: "추천",      active: pathname === "/quick" || pathname === "/result" },
    { href: "/planner", icon: Calendar, label: "플랜",      active: pathname === "/planner" },
    { href: "/history", icon: History,  label: "히스토리",   active: pathname === "/history" },
    { href: "/mypage",  icon: User,     label: "마이페이지",      active: pathname === "/mypage" },
  ]

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-dc-surface border-t border-dc-border flex z-50 pb-safe">
      {tabs.map((tab) => {
        const IconComponent = tab.icon
        return (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex-1 flex flex-col items-center justify-center gap-[3px] min-h-[56px] pt-2 pb-1 transition-colors ${
              tab.active ? "text-dc-primary" : "text-dc-text-muted"
            }`}
          >
            {/* ✅ Lucide 아이콘 렌더링 (22px) */}
            <IconComponent size={22} strokeWidth={2} />
            <span className={`text-[10px] ${tab.active ? "font-semibold" : "font-medium"}`}>
              {tab.label}
            </span>
          </Link>
        )
      })}
    </div>
  )
}