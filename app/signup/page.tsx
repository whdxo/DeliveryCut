"use client"

import Link from "next/link"
import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { onAuthChange, signInWithGoogle, signUp } from "@/lib/firebase"

export default function SignUpPage() {
  const router = useRouter()
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [isLoading, setIsLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        router.replace("/home")
      }
    })

    return () => unsubscribe()
  }, [router])

  const handleSignUp = async (e: React.FormEvent) => {
    e.preventDefault()

    setIsLoading(true)
    setError(null)

    const { user, error: authError } = await signUp(email.trim(), password)

    if (authError || !user) {
      setError(authError || "회원가입에 실패했습니다.")
      setIsLoading(false)
      return
    }

    router.replace("/home")
  }

  const handleGoogleSignUp = async () => {
    setIsLoading(true)
    setError(null)

    const { user, error: authError } = await signInWithGoogle()

    if (authError || !user) {
      setError(authError || "구글 로그인에 실패했습니다.")
      setIsLoading(false)
      return
    }

    router.replace("/home")
  }

  return (
    <div className="min-h-screen bg-dc-bg flex flex-col">
      <div className="w-full bg-dc-surface border-b border-dc-border">
        <div className="flex w-full">
          <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block h-16" />
          <div className="w-full lg:w-[960px] lg:flex-none h-16 flex items-center px-5 lg:px-10">
            <Link href="/" className="flex items-center gap-2">
              <div className="w-7 h-7 rounded-[7px] bg-dc-primary flex items-center justify-center">
                <span className="text-white text-[11px] font-bold">DC</span>
              </div>
              <span className="text-dc-text text-[17px] font-bold">DeliveryCut</span>
            </Link>
          </div>
          <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block h-16" />
        </div>
      </div>

      <div className="flex-1 flex w-full">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />
        <div className="w-full lg:w-[960px] lg:flex-none flex items-center justify-center px-5 py-12 lg:py-0">
          <div className="w-full max-w-[480px] bg-dc-surface rounded-2xl border border-dc-border p-8 lg:p-12 flex flex-col gap-6 lg:gap-8">
            <div className="flex flex-col items-center gap-1.5 text-center">
              <h1 className="text-dc-text text-2xl lg:text-[24px] font-bold">회원가입</h1>
              <p className="text-dc-text-secondary text-sm">이메일 또는 구글로 시작하기</p>
            </div>

            <form onSubmit={handleSignUp} className="flex flex-col gap-4">
              <div className="flex flex-col gap-1.5">
                <label className="text-dc-text text-[13px] font-semibold">이메일</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="example@email.com"
                  className="w-full h-12 px-4 bg-dc-muted border border-dc-border rounded-[10px] text-dc-text text-sm placeholder:text-dc-text-muted focus:outline-none focus:border-dc-primary focus:bg-white transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-dc-text text-[13px] font-semibold">비밀번호</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="6자 이상 비밀번호"
                    className="w-full h-12 px-4 pr-16 bg-dc-muted border border-dc-border rounded-[10px] text-dc-text text-sm placeholder:text-dc-text-muted focus:outline-none focus:border-dc-primary focus:bg-white transition-colors"
                    minLength={6}
                    required
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-dc-text-secondary text-[13px] font-medium hover:text-dc-text"
                  >
                    {showPassword ? "숨기기" : "보기"}
                  </button>
                </div>
              </div>

              <button
                type="submit"
                disabled={isLoading}
                className="w-full h-[52px] bg-dc-primary text-white text-base font-bold rounded-xl hover:bg-[#2d6b45] transition-colors flex items-center justify-center disabled:opacity-50"
              >
                {isLoading ? "처리 중..." : "회원가입"}
              </button>
            </form>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-dc-border" />
              <span className="text-dc-text-muted text-[13px]">또는</span>
              <div className="flex-1 h-px bg-dc-border" />
            </div>

            <button
              type="button"
              onClick={handleGoogleSignUp}
              disabled={isLoading}
              className="w-full h-[52px] bg-white text-dc-text text-[15px] font-semibold rounded-xl border border-dc-border hover:bg-dc-muted transition-colors disabled:opacity-50"
            >
              Google로 계속하기
            </button>

            {error ? (
              <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                {error}
              </div>
            ) : null}

            <div className="flex items-center justify-center gap-1">
              <span className="text-dc-text-secondary text-sm">이미 계정이 있으신가요?</span>
              <Link href="/login" className="text-dc-primary text-sm font-semibold hover:underline">
                로그인
              </Link>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>
    </div>
  )
}
