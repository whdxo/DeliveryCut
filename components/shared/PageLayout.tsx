"use client"

import Link from "next/link"
import { useEffect, useState, type ReactNode } from "react"
import { usePathname, useRouter } from "next/navigation"
import { logOut, onAuthChange } from "@/lib/firebase"

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

        {variant === "landing" ? (
          <div className="flex items-center gap-2">
            {isLoggedIn ? (
              <button
                type="button"
                onClick={handleLogout}
                className="h-9 px-5 rounded-full bg-dc-muted text-dc-text text-[13px] font-semibold flex items-center justify-center hover:bg-dc-border transition-colors"
              >
                로그아웃
              </button>
            ) : (
              <Link
                href="/login"
                className="h-9 px-5 rounded-full bg-dc-muted text-dc-text text-[13px] font-semibold flex items-center justify-center hover:bg-dc-border transition-colors"
              >
                로그인
              </Link>
            )}
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
            {/* ✅ 데스크탑 네비에도 마이페이지 추가 */}
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

  // ✅ 4개 탭: 추천, 플랜, 히스토리, 마이페이지
  const tabs = [
    { href: "/quick",   icon: "⚡", label: "추천",      active: pathname === "/quick" || pathname === "/result" },
    { href: "/planner", icon: "📅", label: "플랜",      active: pathname === "/planner" },
    { href: "/history", icon: "📋", label: "히스토리",   active: pathname === "/history" },
    { href: "/mypage",  icon: "👤", label: "마이",      active: pathname === "/mypage" },
  ]

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 bg-dc-surface border-t border-dc-border flex z-50 pb-safe">
      {tabs.map((tab) => (
        <Link
          key={tab.href}
          href={tab.href}
          className={`flex-1 flex flex-col items-center justify-center gap-[3px] min-h-[56px] pt-2 pb-1 transition-colors ${
            tab.active ? "text-dc-primary" : "text-dc-text-muted"
          }`}
        >
          {/* 아이콘 22px */}
          <span className="text-[22px] leading-none">{tab.icon}</span>
          {/* ✅ 라벨 10px - 4개 탭이라 글자 작게 (마이페이지 → 마이) */}
          <span className={`text-[10px] ${tab.active ? "font-semibold" : "font-medium"}`}>
            {tab.label}
          </span>
        </Link>
      ))}
    </div>
  )
}