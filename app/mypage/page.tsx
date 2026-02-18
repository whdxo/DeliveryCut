"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User } from "lucide-react"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import { logOut, onAuthChange } from "@/lib/firebase"
import { unitLabel } from "@/lib/fridge/constants"
import type { FridgeItem, FridgeListResponse } from "@/lib/types/api"

type MyProfileViewModel = {
  name: string
  email: string
  joinedAt: string
}

const MAX_FRIDGE_PREVIEW = 8

const formatJoinDate = (creationTime?: string | null) => {
  if (!creationTime) return "-"

  const date = new Date(creationTime)
  if (Number.isNaN(date.getTime())) return "-"

  return `${date.getFullYear()}. ${date.getMonth() + 1}. ${date.getDate()}`
}

export default function MyPage() {
  const router = useRouter()

  const [authLoading, setAuthLoading] = useState(true)
  const [profileLoaded, setProfileLoaded] = useState(false)
  const [userId, setUserId] = useState<string | null>(null)
  const [profile, setProfile] = useState<MyProfileViewModel | null>(null)

  const [fridgeItems, setFridgeItems] = useState<FridgeItem[]>([])
  const [fridgeLoading, setFridgeLoading] = useState(false)
  const [fridgeError, setFridgeError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (!user) {
        setAuthLoading(false)
        setProfileLoaded(false)
        setUserId(null)
        setProfile(null)
        router.replace("/login")
        return
      }

      setProfile({
        name: user.displayName?.trim() || "사용자",
        email: user.email?.trim() || "-",
        joinedAt: formatJoinDate(user.metadata.creationTime),
      })
      setUserId(user.uid)
      setProfileLoaded(true)
      setAuthLoading(false)
    })

    return () => unsubscribe()
  }, [router])

  useEffect(() => {
    if (!userId) return

    const loadFridge = async () => {
      setFridgeLoading(true)
      setFridgeError(null)

      try {
        const response = await fetch("/api/fridge?sort=updatedAt", {
          headers: { "x-user-id": userId },
        })

        if (!response.ok) {
          throw new Error("냉장고 데이터를 불러오지 못했습니다")
        }

        const data = (await response.json()) as FridgeListResponse
        setFridgeItems(data.items)
      } catch {
        setFridgeItems([])
        setFridgeError("데이터를 불러오지 못했습니다")
      } finally {
        setFridgeLoading(false)
      }
    }

    void loadFridge()
  }, [userId])

  const handleLogout = async () => {
    const { error } = await logOut()
    if (!error) {
      router.push("/")
    }
  }

  const previewItems = fridgeItems.slice(0, MAX_FRIDGE_PREVIEW)

  return (
    <div className="min-h-screen bg-dc-bg">
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      <div className="flex w-full min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        <main className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-5 lg:py-12 pb-nav-safe lg:pb-12">
          <header className="mb-5 lg:mb-6">
            <h1 className="text-dc-text text-[22px] lg:text-[28px] font-bold">마이페이지</h1>
            <p className="mt-1.5 text-dc-text-secondary text-[13px] lg:text-sm leading-relaxed">
              내 정보와 냉장고 상태를 확인할 수 있어요
            </p>
          </header>

          <section className="bg-dc-surface rounded-2xl border border-dc-border p-5 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-dc-primary flex items-center justify-center flex-none">
                <User size={32} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                {authLoading ? (
                  <p className="text-dc-text-secondary text-[13px]">사용자 정보를 불러오는 중...</p>
                ) : (
                  <>
                    <p className="text-dc-text text-[17px] font-bold truncate">{profile?.name ?? "사용자"}</p>
                    <p className="text-dc-text-secondary text-[13px] mt-0.5 truncate">{profile?.email ?? "-"}</p>
                    <p className="text-dc-text-muted text-[12px] mt-1">가입일: {profile?.joinedAt ?? "-"}</p>
                  </>
                )}
              </div>
            </div>
          </section>

          <section className="bg-dc-surface rounded-2xl border border-dc-border p-4 lg:p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧊</span>
                <h2 className="text-dc-text text-[17px] font-bold">내 냉장고</h2>
              </div>
              <span className="text-dc-text-secondary text-[12px]">{fridgeItems.length}개 재료</span>
            </div>

            {fridgeLoading ? (
              <p className="text-dc-text-secondary text-[13px] py-2">냉장고 데이터를 불러오는 중...</p>
            ) : null}

            {fridgeError ? (
              <p className="text-red-600 text-[13px] py-2">{fridgeError}</p>
            ) : null}

            {!fridgeLoading && !fridgeError && fridgeItems.length === 0 ? (
              <p className="text-dc-text-secondary text-[13px] py-2">아직 등록된 재료가 없어요</p>
            ) : null}

            {!fridgeLoading && !fridgeError && previewItems.length > 0 ? (
              <>
                <div className="flex flex-wrap gap-2 mb-3">
                  {previewItems.map((item) => (
                    <span
                      key={item.id}
                      className="h-10 px-3 bg-dc-primary-light text-dc-primary text-[13px] font-medium rounded-full flex items-center"
                    >
                      {item.name} {item.amount}
                      {unitLabel(item.unit)}
                    </span>
                  ))}
                </div>
                {fridgeItems.length > MAX_FRIDGE_PREVIEW ? (
                  <p className="text-dc-text-muted text-[12px]">+{fridgeItems.length - MAX_FRIDGE_PREVIEW}개 더 있음</p>
                ) : null}
              </>
            ) : null}

            <Link
              href="/fridge"
              className="mt-3 w-full h-11 bg-dc-primary text-white text-[13px] font-semibold rounded-xl hover:bg-[#2d6b45] transition-colors flex items-center justify-center"
            >
              냉장고 관리
            </Link>
          </section>

          <section className="bg-dc-surface rounded-2xl border border-dc-border divide-y divide-dc-border overflow-hidden">
            <button
              onClick={handleLogout}
              disabled={!profileLoaded}
              className="w-full flex items-center justify-between min-h-[56px] px-5 transition-colors hover:bg-red-50 disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🚪</span>
                <span className="text-[15px] font-medium text-red-600">로그아웃</span>
              </div>
              <span className="text-dc-text-muted text-lg">›</span>
            </button>
          </section>

          <p className="text-center text-dc-text-muted text-[12px] mt-6">DeliveryCut v1.0.0</p>
        </main>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      <MobileBottomNav />
    </div>
  )
}
