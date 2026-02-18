"use client"

import { useState } from "react"
import Link from "next/link"
import { useRouter } from "next/navigation"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"

// 자주 쓰는 재료 카테고리별 추천 목록
const INGREDIENT_SUGGESTIONS = {
  "단백질": ["계란", "두부", "참치캔", "닭가슴살", "소시지", "베이컨"],
  "채소": ["양파", "대파", "감자", "당근", "김치", "시금치", "버섯"],
  "탄수화물": ["밥", "라면", "스파게티면", "식빵", "떡"],
  "조미료": ["간장", "참기름", "고추장", "된장", "식용유", "소금"],
}

export default function MyPage() {
  const router = useRouter()
  
  // TODO: 실제로는 Firebase/LocalStorage에서 가져와야 함
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

  const menuItems = [
    { label: "알림 설정", href: "/mypage/notifications", icon: "🔔" },
    { label: "장보기 히스토리", href: "/mypage/shopping", icon: "🛒" },
    { label: "문의하기", href: "/mypage/contact", icon: "💬" },
    { label: "로그아웃", href: "/logout", icon: "🚪", danger: true },
  ]

  // 재료 추가
  const handleAddIngredient = () => {
    if (newIngredient.trim() && !myIngredients.includes(newIngredient.trim())) {
      setMyIngredients([...myIngredients, newIngredient.trim()])
      setNewIngredient("")
      setShowAddInput(false)
      // TODO: Firebase/LocalStorage에 저장
    }
  }

  // 재료 삭제
  const handleRemoveIngredient = (ingredient: string) => {
    setMyIngredients(myIngredients.filter(item => item !== ingredient))
    // TODO: Firebase/LocalStorage에서 삭제
  }

  // 추천 재료 추가
  const handleAddSuggestion = (ingredient: string) => {
    if (!myIngredients.includes(ingredient)) {
      setMyIngredients([...myIngredients, ingredient])
      // TODO: Firebase/LocalStorage에 저장
    }
  }

  // 내 냉장고 재료로 바로 추천받기
  const handleQuickStart = () => {
    const params = new URLSearchParams({
      ingredients: myIngredients.join(", "),
      mode: "quick",
    })
    router.push(`/quick?${params.toString()}`)
  }

  return (
    <div className="min-h-screen bg-dc-bg">
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      <div className="flex w-full min-h-[calc(100vh-3.5rem)] lg:min-h-[calc(100vh-4rem)]">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        <main className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-5 lg:py-12 pb-nav-safe lg:pb-12">
          
          {/* 페이지 헤더 */}
          <header className="mb-5 lg:mb-6">
            <h1 className="text-dc-text text-[22px] lg:text-[28px] font-bold">마이페이지</h1>
            <p className="mt-1.5 text-dc-text-secondary text-[13px] lg:text-sm leading-relaxed">
              내 정보와 냉장고 재료를 관리할 수 있어요
            </p>
          </header>

          {/* 사용자 정보 카드 */}
          <section className="bg-dc-surface rounded-2xl border border-dc-border p-5 mb-4">
            <div className="flex items-center gap-4">
              <div className="w-16 h-16 rounded-full bg-dc-primary flex items-center justify-center text-white text-2xl flex-none">
                👤
              </div>
              <div className="flex-1">
                <p className="text-dc-text text-[17px] font-bold">{user.name}</p>
                <p className="text-dc-text-secondary text-[13px] mt-0.5">{user.email}</p>
                <p className="text-dc-text-muted text-[12px] mt-1">가입일: {user.joinDate}</p>
              </div>
            </div>
          </section>

          {/* ✅ 내 냉장고 섹션 */}
          <section className="bg-dc-surface rounded-2xl border border-dc-border p-5 mb-4">
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2">
                <span className="text-2xl">🧊</span>
                <h2 className="text-dc-text text-[17px] font-bold">내 냉장고</h2>
              </div>
              <span className="text-dc-text-secondary text-[12px]">
                {myIngredients.length}개 재료
              </span>
            </div>

            {/* 재료 목록 */}
            {myIngredients.length > 0 ? (
              <div className="flex flex-wrap gap-2 mb-4">
                {myIngredients.map((ingredient) => (
                  <button
                    key={ingredient}
                    onClick={() => handleRemoveIngredient(ingredient)}
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

            {/* 재료 추가 영역 */}
            {showAddInput ? (
              <div className="flex gap-2 mb-3">
                <input
                  type="text"
                  value={newIngredient}
                  onChange={(e) => setNewIngredient(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && handleAddIngredient()}
                  placeholder="재료 이름 입력"
                  className="flex-1 h-11 px-4 bg-dc-muted rounded-xl text-dc-text text-[15px] placeholder:text-dc-text-muted focus:outline-none focus:ring-1 focus:ring-dc-primary border border-transparent focus:border-dc-primary transition-colors"
                  autoFocus
                />
                <button
                  onClick={handleAddIngredient}
                  className="h-11 px-5 bg-dc-primary text-white text-[13px] font-semibold rounded-xl hover:bg-[#2d6b45] transition-colors"
                >
                  추가
                </button>
                <button
                  onClick={() => {
                    setShowAddInput(false)
                    setNewIngredient("")
                  }}
                  className="h-11 px-4 bg-dc-muted text-dc-text-secondary text-[13px] font-medium rounded-xl hover:bg-dc-border transition-colors"
                >
                  취소
                </button>
              </div>
            ) : (
              <button
                onClick={() => setShowAddInput(true)}
                className="w-full h-11 border-2 border-dashed border-dc-border text-dc-text-secondary text-[13px] font-medium rounded-xl hover:border-dc-primary hover:text-dc-primary transition-colors flex items-center justify-center gap-2"
              >
                <span className="text-lg">+</span>
                재료 추가하기
              </button>
            )}

            {/* 이 재료로 바로 추천받기 버튼 */}
            {myIngredients.length > 0 && (
              <button
                onClick={handleQuickStart}
                className="w-full h-12 mt-3 bg-dc-primary text-white text-[15px] font-bold rounded-xl hover:bg-[#2d6b45] transition-colors flex items-center justify-center gap-2"
              >
                <span>⚡</span>
                이 재료로 바로 추천받기
              </button>
            )}
          </section>

          {/* ✅ 자주 쓰는 재료 추천 */}
          <section className="bg-dc-surface rounded-2xl border border-dc-border p-5 mb-4">
            <h3 className="text-dc-text text-[15px] font-bold mb-3">자주 쓰는 재료 추천</h3>
            <div className="space-y-3">
              {Object.entries(INGREDIENT_SUGGESTIONS).map(([category, items]) => (
                <div key={category}>
                  <p className="text-dc-text-secondary text-[12px] font-semibold mb-2">{category}</p>
                  <div className="flex flex-wrap gap-2">
                    {items.map((item) => (
                      <button
                        key={item}
                        onClick={() => handleAddSuggestion(item)}
                        disabled={myIngredients.includes(item)}
                        className={`h-9 px-3 text-[12px] font-medium rounded-full transition-colors ${
                          myIngredients.includes(item)
                            ? "bg-dc-muted text-dc-text-muted cursor-not-allowed"
                            : "bg-dc-muted text-dc-text-secondary hover:bg-dc-primary hover:text-white"
                        }`}
                      >
                        + {item}
                      </button>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </section>

          {/* 사용 통계 */}
          <section className="grid grid-cols-3 gap-3 mb-4">
            <div className="bg-dc-surface rounded-2xl border border-dc-border p-4 text-center">
              <p className="text-dc-text text-2xl font-bold">12</p>
              <p className="text-dc-text-secondary text-[12px] mt-1">추천받은 메뉴</p>
            </div>
            <div className="bg-dc-surface rounded-2xl border border-dc-border p-4 text-center">
              <p className="text-dc-text text-2xl font-bold">5</p>
              <p className="text-dc-text-secondary text-[12px] mt-1">저장한 플랜</p>
            </div>
            <div className="bg-dc-surface rounded-2xl border border-dc-border p-4 text-center">
              <p className="text-dc-text text-2xl font-bold">8</p>
              <p className="text-dc-text-secondary text-[12px] mt-1">요리한 횟수</p>
            </div>
          </section>

          {/* 메뉴 리스트 */}
          <section className="bg-dc-surface rounded-2xl border border-dc-border divide-y divide-dc-border overflow-hidden">
            {menuItems.map((item) => (
              <Link
                key={item.label}
                href={item.href}
                className={`flex items-center justify-between min-h-[56px] px-5 transition-colors ${
                  item.danger
                    ? "hover:bg-red-50"
                    : "hover:bg-dc-muted"
                }`}
              >
                <div className="flex items-center gap-3">
                  <span className="text-xl">{item.icon}</span>
                  <span className={`text-[15px] font-medium ${
                    item.danger ? "text-red-600" : "text-dc-text"
                  }`}>
                    {item.label}
                  </span>
                </div>
                <span className="text-dc-text-muted text-lg">›</span>
              </Link>
            ))}
          </section>

          {/* 버전 정보 */}
          <p className="text-center text-dc-text-muted text-[12px] mt-6">
            DeliveryCut v1.0.0
          </p>
        </main>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      <MobileBottomNav />
    </div>
  )
}