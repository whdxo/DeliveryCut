"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import Link from "next/link"
import { signUp, signInWithGoogle, onAuthChange } from "@/lib/firebase/auth"

const errorMessages: Record<string, string> = {
  'auth/email-already-in-use': '이미 사용 중인 이메일입니다',
  'auth/invalid-email': '이메일 형식이 올바르지 않습니다',
  'auth/weak-password': '비밀번호는 6자 이상이어야 합니다',
  'auth/network-request-failed': '네트워크 연결을 확인해주세요',
}

export default function SignupPage() {
  const router = useRouter()
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [passwordConfirm, setPasswordConfirm] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) router.push("/home")
    })
    return () => unsubscribe()
  }, [router])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    if (password.length < 6) {
      setError("비밀번호는 6자 이상이어야 합니다")
      setLoading(false)
      return
    }

    if (password !== passwordConfirm) {
      setError("비밀번호가 일치하지 않습니다")
      setLoading(false)
      return
    }

    const { error: authError } = await signUp(email.trim(), password)

    if (authError) {
      const code = (authError as { code?: string })?.code ?? "unknown"
      setError(errorMessages[code] || "회원가입에 실패했습니다")
      setLoading(false)
      return
    }

    router.push("/home")
  }

  const handleGoogleLogin = async () => {
    setLoading(true)
    setError(null)
    const { error: authError } = await signInWithGoogle()

    if (authError) {
      setError("구글 로그인에 실패했습니다")
      setLoading(false)
      return
    }

    router.push("/home")
  }

  return (
    <div className="min-h-screen bg-dc-bg flex flex-col">

      {/* 헤더 */}
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

      {/* 본문 */}
      <div className="flex-1 flex w-full">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        <div className="w-full lg:w-[960px] lg:flex-none flex items-center justify-center px-5 py-12 lg:py-0">
          <div className="w-full max-w-[480px] bg-dc-surface rounded-2xl border border-dc-border p-8 lg:p-12 flex flex-col gap-6 lg:gap-8">

            <div className="flex flex-col items-center gap-1.5 text-center">
              <h1 className="text-dc-text text-2xl lg:text-[24px] font-bold">회원가입</h1>
              <p className="text-dc-text-secondary text-sm">간편하게 가입하고 메뉴를 저장하세요</p>
            </div>

            <button
              type="button"
              onClick={handleGoogleLogin}
              disabled={loading}
              className="w-full h-[52px] bg-white text-dc-text text-[15px] font-semibold rounded-xl border border-dc-border hover:bg-dc-muted transition-colors disabled:opacity-50 flex items-center justify-center gap-3"
            >
              <svg width="20" height="20" viewBox="0 0 24 24">
                <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" fill="#4285F4" />
                <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
                <path d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z" fill="#FBBC05" />
                <path d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
              </svg>
              Google로 시작하기
            </button>

            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-dc-border" />
              <span className="text-dc-text-muted text-[13px]">또는</span>
              <div className="flex-1 h-px bg-dc-border" />
            </div>

            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
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
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="6자 이상 입력하세요"
                  className="w-full h-12 px-4 bg-dc-muted border border-dc-border rounded-[10px] text-dc-text text-sm placeholder:text-dc-text-muted focus:outline-none focus:border-dc-primary focus:bg-white transition-colors"
                  required
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-dc-text text-[13px] font-semibold">비밀번호 확인</label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  placeholder="비밀번호를 다시 입력하세요"
                  className="w-full h-12 px-4 bg-dc-muted border border-dc-border rounded-[10px] text-dc-text text-sm placeholder:text-dc-text-muted focus:outline-none focus:border-dc-primary focus:bg-white transition-colors"
                  required
                />
              </div>

              {error && (
                <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700">
                  {error}
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[52px] bg-dc-primary text-white text-base font-bold rounded-xl hover:bg-[#2d6b45] transition-colors flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? "가입 중..." : "회원가입"}
              </button>
            </form>

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