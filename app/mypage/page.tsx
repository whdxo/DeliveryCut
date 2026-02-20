"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { User } from "lucide-react"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import { logOut, onAuthChange } from "@/lib/firebase"
import { unitLabel } from "@/lib/fridge/constants"
import type { FridgeItem, FridgeListResponse } from "@/lib/types/api"
import { deleteUser, EmailAuthProvider, reauthenticateWithCredential, GoogleAuthProvider, reauthenticateWithPopup } from "firebase/auth"
import { collection, getDocs, deleteDoc, query, where } from "firebase/firestore"
import { auth, db } from "@/lib/firebase/config"
import { collections } from "@/lib/firebase/firestore"

type MyProfileViewModel = {
  name: string
  email: string
  joinedAt: string
  providerId: string
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

  // 회원탈퇴 모달
  const [showDeleteModal, setShowDeleteModal] = useState(false)
  const [deleteStep, setDeleteStep] = useState<"confirm" | "reauth" | "deleting">("confirm")
  const [deletePassword, setDeletePassword] = useState("")
  const [deleteError, setDeleteError] = useState("")

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

      const providerId = user.providerData[0]?.providerId ?? "password"
      setProfile({
        name: user.displayName?.trim() || "사용자",
        email: user.email?.trim() || "-",
        joinedAt: formatJoinDate(user.metadata.creationTime),
        providerId,
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
        if (!response.ok) throw new Error("냉장고 데이터를 불러오지 못했습니다")
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
    if (!error) router.push("/")
  }

  // Firestore 유저 데이터 전체 삭제
  const deleteUserData = async (uid: string) => {
    // 서브컬렉션 (fridgeItems, consumptionLogs)
    const subCollections = [
      collections.fridgeItems,
      collections.consumptionLogs,
    ]
    for (const sub of subCollections) {
      const ref = collection(db, collections.users, uid, sub)
      const snap = await getDocs(ref)
      await Promise.all(snap.docs.map((d) => deleteDoc(d.ref)))
    }
    // menuPlans (최상위 컬렉션, userId 필드로 쿼리)
    const plansRef = collection(db, collections.menuPlans)
    const plansQuery = query(plansRef, where("userId", "==", uid))
    const plansSnap = await getDocs(plansQuery)
    await Promise.all(plansSnap.docs.map((d) => deleteDoc(d.ref)))
  }

  const handleDeleteAccount = async () => {
    const user = auth.currentUser
    if (!user || !userId) return

    setDeleteStep("deleting")
    setDeleteError("")

    try {
      const providerId = user.providerData[0]?.providerId ?? "password"

      // 재인증
      if (providerId === "google.com") {
        const googleProvider = new GoogleAuthProvider()
        await reauthenticateWithPopup(user, googleProvider)
      } else if (providerId === "password" && user.email) {
        const credential = EmailAuthProvider.credential(user.email, deletePassword)
        await reauthenticateWithCredential(user, credential)
      }

      // Firestore 데이터 삭제
      await deleteUserData(userId)

      // Firebase Auth 계정 삭제
      await deleteUser(user)

      router.replace("/")
    } catch (err) {
      const code = (err as { code?: string })?.code ?? ""
      if (code === "auth/wrong-password" || code === "auth/invalid-credential") {
        setDeleteError("비밀번호가 올바르지 않아요.")
      } else if (code === "auth/popup-closed-by-user") {
        setDeleteError("구글 로그인 창이 닫혔어요. 다시 시도해주세요.")
      } else {
        setDeleteError("오류가 발생했어요. 다시 시도해주세요.")
      }
      setDeleteStep(profile?.providerId === "password" ? "reauth" : "confirm")
    }
  }

  const openDeleteModal = () => {
    setShowDeleteModal(true)
    // 구글 로그인이면 바로 confirm, 이메일이면 reauth(비번 입력) 단계
    setDeleteStep(profile?.providerId === "password" ? "reauth" : "confirm")
    setDeletePassword("")
    setDeleteError("")
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

          {/* 프로필 */}
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

          {/* 냉장고 */}
          <section className="bg-dc-surface rounded-2xl border border-dc-border p-4 lg:p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧊</span>
                <h2 className="text-dc-text text-[17px] font-bold">내 냉장고</h2>
              </div>
              <span className="text-dc-text-secondary text-[12px]">{fridgeItems.length}개 재료</span>
            </div>

            {fridgeLoading && <p className="text-dc-text-secondary text-[13px] py-2">냉장고 데이터를 불러오는 중...</p>}
            {fridgeError && <p className="text-red-600 text-[13px] py-2">{fridgeError}</p>}
            {!fridgeLoading && !fridgeError && fridgeItems.length === 0 && (
              <p className="text-dc-text-secondary text-[13px] py-2">아직 등록된 재료가 없어요</p>
            )}
            {!fridgeLoading && !fridgeError && previewItems.length > 0 && (
              <>
                <div className="flex flex-wrap gap-2 mb-3">
                  {previewItems.map((item) => (
                    <span key={item.id} className="h-10 px-3 bg-dc-primary-light text-dc-primary text-[13px] font-medium rounded-full flex items-center">
                      {item.name} {item.amount}{unitLabel(item.unit)}
                    </span>
                  ))}
                </div>
                {fridgeItems.length > MAX_FRIDGE_PREVIEW && (
                  <p className="text-dc-text-muted text-[12px]">+{fridgeItems.length - MAX_FRIDGE_PREVIEW}개 더 있음</p>
                )}
              </>
            )}

            <Link
              href="/fridge"
              className="mt-3 w-full h-11 bg-dc-primary text-white text-[13px] font-semibold rounded-xl hover:bg-[#2d6b45] transition-colors flex items-center justify-center"
            >
              냉장고 관리
            </Link>
          </section>

          {/* 버튼들 */}
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

            <button
              onClick={openDeleteModal}
              disabled={!profileLoaded}
              className="w-full flex items-center justify-between min-h-[56px] px-5 transition-colors hover:bg-red-50 disabled:opacity-60"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">⚠️</span>
                <span className="text-[15px] font-medium text-red-400">회원탈퇴</span>
              </div>
              <span className="text-dc-text-muted text-lg">›</span>
            </button>
          </section>

          <p className="text-center text-dc-text-muted text-[12px] mt-6">DeliveryCut v1.0.0</p>
        </main>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      <MobileBottomNav />

      {/* 회원탈퇴 모달 */}
      {showDeleteModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center px-5 bg-black/50">
          <div className="w-full max-w-sm bg-dc-surface rounded-2xl p-6 shadow-xl">

            {/* confirm 단계 (구글 로그인) */}
            {deleteStep === "confirm" && (
              <>
                <div className="text-2xl mb-3">⚠️</div>
                <h2 className="text-dc-text text-[17px] font-bold mb-2">정말 탈퇴할까요?</h2>
                <p className="text-dc-text-secondary text-[13px] leading-relaxed mb-1">
                  탈퇴하면 아래 데이터가 모두 삭제돼요.
                </p>
                <ul className="text-dc-text-muted text-[12px] mb-5 space-y-1 pl-1">
                  <li>• 냉장고 재료 전체</li>
                  <li>• 소비 기록 전체</li>
                  <li>• 계정 정보</li>
                </ul>
                <p className="text-[12px] text-dc-text-muted mb-5">
                  구글 계정으로 재인증이 필요해요.
                </p>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 h-11 rounded-xl bg-dc-muted text-dc-text-secondary text-[13px] font-semibold"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    className="flex-1 h-11 rounded-xl bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-colors"
                  >
                    탈퇴 진행
                  </button>
                </div>
              </>
            )}

            {/* reauth 단계 (이메일 로그인 - 비밀번호 확인) */}
            {deleteStep === "reauth" && (
              <>
                <div className="text-2xl mb-3">⚠️</div>
                <h2 className="text-dc-text text-[17px] font-bold mb-2">정말 탈퇴할까요?</h2>
                <p className="text-dc-text-secondary text-[13px] leading-relaxed mb-4">
                  탈퇴하면 냉장고 재료, 소비 기록, 계정 정보가 모두 삭제돼요.
                </p>
                <div className="mb-4">
                  <label className="text-dc-text text-[13px] font-semibold block mb-1.5">
                    비밀번호 확인
                  </label>
                  <input
                    type="password"
                    value={deletePassword}
                    onChange={(e) => setDeletePassword(e.target.value)}
                    placeholder="현재 비밀번호 입력"
                    className="w-full h-11 px-4 bg-dc-muted rounded-xl text-dc-text text-[14px] placeholder:text-dc-text-muted focus:outline-none focus:ring-1 focus:ring-red-400 border border-transparent focus:border-red-400 transition-colors"
                  />
                  {deleteError && (
                    <p className="text-red-500 text-[12px] mt-1.5">{deleteError}</p>
                  )}
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setShowDeleteModal(false)}
                    className="flex-1 h-11 rounded-xl bg-dc-muted text-dc-text-secondary text-[13px] font-semibold"
                  >
                    취소
                  </button>
                  <button
                    onClick={handleDeleteAccount}
                    disabled={!deletePassword.trim()}
                    className="flex-1 h-11 rounded-xl bg-red-500 text-white text-[13px] font-semibold hover:bg-red-600 transition-colors disabled:opacity-40"
                  >
                    탈퇴하기
                  </button>
                </div>
              </>
            )}

            {/* deleting 단계 */}
            {deleteStep === "deleting" && (
              <div className="flex flex-col items-center py-4 gap-4">
                <div className="w-8 h-8 border-2 border-dc-border border-t-dc-primary rounded-full animate-spin" />
                <p className="text-dc-text text-[14px] font-semibold">탈퇴 처리 중...</p>
                <p className="text-dc-text-secondary text-[12px]">잠시만 기다려주세요</p>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}