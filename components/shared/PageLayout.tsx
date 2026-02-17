"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

// 3-column desktop layout: side | center(960px) | side
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

  return (
    <div className="w-full bg-dc-surface flex">
      {/* left side panel - desktop only */}
      <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block h-16" />

      {/* center nav */}
      <div className="w-full lg:w-[960px] lg:flex-none h-16 flex items-center justify-between px-5 lg:px-10 bg-dc-surface">
        <Link href="/" className="flex items-center gap-2">
          <div className="w-7 h-7 rounded-[7px] bg-dc-primary flex items-center justify-center">
            <span className="text-white text-[11px] font-bold">DC</span>
          </div>
          <span className="text-dc-text text-[17px] font-bold">DeliveryCut</span>
        </Link>

        {variant === "landing" ? (
          <div className="flex items-center gap-2">
            <Link
              href="/login"
              className="h-9 px-5 rounded-full bg-dc-muted text-dc-text text-[13px] font-semibold flex items-center justify-center hover:bg-dc-border transition-colors"
            >
              로그인
            </Link>
            <Link
              href="/login"
              className="h-9 px-5 rounded-full bg-dc-primary text-white text-[13px] font-semibold flex items-center justify-center hover:bg-[#2d6b45] transition-colors"
            >
              무료로 시작하기
            </Link>
          </div>
        ) : (
          <div className="flex items-center gap-3">
            <Link
              href="/home"
              className={`text-[13px] font-medium transition-colors ${
                pathname === "/home" ? "text-dc-primary font-semibold" : "text-dc-text-secondary hover:text-dc-text"
              }`}
            >
              새로 만들기
            </Link>
            <Link
              href="/history"
              className={`text-[13px] font-medium transition-colors ${
                pathname === "/history" ? "text-dc-primary font-semibold" : "text-dc-text-secondary hover:text-dc-text"
              }`}
            >
              히스토리
            </Link>
          </div>
        )}
      </div>

      {/* right side panel - desktop only */}
      <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block h-16" />
    </div>
  )
}

// Mobile bottom nav
export function MobileBottomNav() {
  const pathname = usePathname()

  return (
    <div className="lg:hidden fixed bottom-0 left-0 right-0 h-16 bg-dc-surface border-t border-dc-border flex z-50">
      <Link
        href="/home"
        className={`flex-1 flex flex-col items-center justify-center gap-1 text-[11px] ${
          pathname === "/home" ? "text-dc-primary font-semibold" : "text-dc-text-muted"
        }`}
      >
        <span className="text-xl">🏠</span>
        <span>홈</span>
      </Link>
      <Link
        href="/history"
        className={`flex-1 flex flex-col items-center justify-center gap-1 text-[11px] ${
          pathname === "/history" ? "text-dc-primary font-semibold" : "text-dc-text-muted"
        }`}
      >
        <span className="text-xl">📋</span>
        <span>히스토리</span>
      </Link>
    </div>
  )
}
