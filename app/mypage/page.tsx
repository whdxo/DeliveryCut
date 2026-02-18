"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import { User } from "lucide-react"
import { logOut } from "@/lib/firebase"

export default function MyPage() {
  const router = useRouter()
  
  const [myIngredients, setMyIngredients] = useState<string[]>([
    "계란", "김치", "두부", "양파", "참치캔", "밥"
  ])
  
  const [newIngredient, setNewIngredient] = useState("")
  const [showAddInput, setShowAddInput] = useState(false)

  const user = {
    email: "user@example.com",
    name: "사용자",
    joinDate: "2026. 2. 17",
  }

  const handleAddIngredient = () => {
    if (newIngredient.trim() && !myIngredients.includes(newIngredient.trim())) {
      setMyIngredients([...myIngredients, newIngredient.trim()])
      setNewIngredient("")
      setShowAddInput(false)
    }
  }

  const handleRemoveIngredient = (ingredient: string) => {
    setMyIngredients(myIngredients.filter(item => item !== ingredient))
  }

  const handleQuickStart = () => {
    const params = new URLSearchParams({
      ingredients: myIngredients.join(", "),
      mode: "quick",
    })
    router.push(`/quick?${params.toString()}`)
  }

  // ✅ 로그아웃 구현
  const handleLogout = async () => {
    const { error } = await logOut()
    if (!error) {
      router.push("/")
    }
  }

  return (
    <div className="min-h-screen bg-dc-bg">
      {/* ✅ 모바일 최적화: sticky 헤더 */}
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      <div className="flex w-full min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        {/* ✅ 모바일 최적화: px-5(모바일) px-10(데스크탑), pb-nav-safe */}
        <main className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-5 lg:py-12 pb-nav-safe lg:pb-12">
          
          <header className="mb-5 lg:mb-6">
            {/* ✅ 모바일 최적화: text-[22px](모바일) text-[28px](데스크탑) */}
            <h1 className="text-dc-text text-[22px] lg:text-[28px] font-bold">마이페이지</h1>
            {/* ✅ 모바일 최적화: text-[13px](모바일) text-sm(데스크탑) */}
            <p className="mt-1.5 text-dc-text-secondary text-[13px] lg:text-sm leading-relaxed">
              내 정보와 냉장고 재료를 관리할 수 있어요
            </p>
          </header>

          {/* 사용자 정보 */}
          <section className="bg-dc-surface rounded-2xl border border-dc-border p-5 mb-4">
            <div className="flex items-center gap-4">
              {/* ✅ 1. Lucide User 아이콘 사용 */}
              <div className="w-16 h-16 rounded-full bg-dc-primary flex items-center justify-center flex-none">
                <User size={32} className="text-white" />
              </div>
              <div className="flex-1 min-w-0">
                {/* ✅ 모바일 최적화: truncate로 긴 텍스트 처리 */}
                <p className="text-dc-text text-[17px] font-bold truncate">{user.name}</p>
                <p className="text-dc-text-secondary text-[13px] mt-0.5 truncate">{user.email}</p>
                <p className="text-dc-text-muted text-[12px] mt-1">가입일: {user.joinDate}</p>
              </div>
            </div>
          </section>

          {/* 내 냉장고 */}
          <section className="bg-dc-surface rounded-2xl border border-dc-border p-4 lg:p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧊</span>
                <h2 className="text-dc-text text-[17px] font-bold">내 냉장고</h2>
              </div>
              <span className="text-dc-text-secondary text-[12px]">
                {myIngredients.length}개 재료
              </span>
            </div>

            {myIngredients.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {myIngredients.map((ingredient) => (
                  <button
                    key={ingredient}
                    onClick={() => handleRemoveIngredient(ingredient)}
                    /* ✅ 모바일 최적화: h-11(44px) 터치 영역 */
                    className="h-11 px-4 bg-dc-primary-light text-dc-primary text-[13px] font-medium rounded-full flex items-center gap-2 hover:bg-dc-primary hover:text-white transition-colors"
                  >
                    {ingredient}
                    <span className="text-xs opacity-60">×</span>
                  </button>
                ))}
              </div>
            ) : (
              <p className="text-dc-text-secondary text-[13px] mb-4 text-center py-4">
                아직 등록된 재료가 없어요
              </p>
            )}

            {showAddInput ? (
              /* ✅ 모바일 최적화: flex-col(모바일) flex-row(데스크탑) */
              <div className="flex flex-col sm:flex-row gap-2 mb-3">
                <input
                  type="text"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddIngredient()}
                  placeholder="재료 이름 입력"
                  /* ✅ 모바일 최적화: h-11(44px) 터치 영역 */
                  className="flex-1 h-11 px-4 bg-dc-muted rounded-xl text-dc-text text-[15px] placeholder:text-dc-text-muted focus:outline-none focus:ring-1 focus:ring-dc-primary border border-transparent focus:border-dc-primary transition-colors"
                  autoFocus
                />
                <div className="flex gap-2">
                  <button
                    onClick={handleAddIngredient}
                    className="flex-1 sm:flex-none h-11 px-5 bg-dc-primary text-white text-[13px] font-semibold rounded-xl hover:bg-[#2d6b45] transition-colors"
                  >
                    추가
                  </button>
                  <button
                    onClick={() => {
                      setShowAddInput(false)
                      setNewIngredient("")
                    }}
                    className="flex-1 sm:flex-none h-11 px-4 bg-dc-muted text-dc-text-secondary text-[13px] font-medium rounded-xl hover:bg-dc-border transition-colors"
                  >
                    취소
                  </button>
                </div>
              </div>
            ) : (
              <button
                onClick={() => setShowAddInput(true)}
                /* ✅ 모바일 최적화: h-11(44px) 터치 영역 */
                className="w-full h-11 border-2 border-dashed border-dc-border text-dc-text-secondary text-[13px] font-medium rounded-xl hover:border-dc-primary hover:text-dc-primary transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg">+</span>
                재료 추가하기
              </button>
            )}

            {myIngredients.length > 0 && (
              <button
                onClick={handleQuickStart}
                /* ✅ 모바일 최적화: h-12(48px) 터치 영역 */
                className="w-full h-12 mt-3 bg-dc-primary text-white text-[15px] font-bold rounded-xl hover:bg-[#2d6b45] transition-colors flex items-center justify-center gap-2"
              >
                <span>⚡</span>
                이 재료로 바로 추천받기
              </button>
            )}
          </section>

          {/* 메뉴 */}
          <section className="bg-dc-surface rounded-2xl border border-dc-border divide-y divide-dc-border overflow-hidden">
            <Link
              href="/fridge"
              className="flex items-center justify-between min-h-[56px] px-5 transition-colors hover:bg-dc-muted"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🧊</span>
                <span className="text-[15px] font-medium text-dc-text">냉장고 관리</span>
              </div>
              <span className="text-dc-text-muted text-lg">›</span>
            </Link>
            {/* ✅ 2. 로그아웃 구현 */}
            <button
              onClick={handleLogout}
              className="w-full flex items-center justify-between min-h-[56px] px-5 transition-colors hover:bg-red-50"
            >
              <div className="flex items-center gap-3">
                <span className="text-xl">🚪</span>
                <span className="text-[15px] font-medium text-red-600">로그아웃</span>
              </div>
              <span className="text-dc-text-muted text-lg">›</span>
            </button>
          </section>

          <p className="text-center text-dc-text-muted text-[12px] mt-6">
            DeliveryCut v1.0.0
          </p>
        </main>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      {/* ✅ 모바일 최적화: 하단 네비 */}
      <MobileBottomNav />
    </div>
  )
}