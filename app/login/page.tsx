"use client"

import { useState, useEffect, Suspense } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import Link from "next/link"
import { signIn, signInWithGoogle, onAuthChange } from "@/lib/firebase/auth"
import { NavBar } from "@/components/shared/PageLayout"

const errorMessages: Record<string, string> = {
  'auth/user-not-found': '등록되지 않은 이메일입니다',
  'auth/wrong-password': '비밀번호가 틀렸습니다',
  'auth/invalid-email': '이메일 형식이 올바르지 않습니다',
  'auth/invalid-credential': '이메일 또는 비밀번호가 올바르지 않습니다',
  'auth/too-many-requests': '너무 많은 시도가 있었습니다. 잠시 후 다시 시도해주세요',
  'auth/network-request-failed': '네트워크 연결을 확인해주세요',
}

function LoginForm() {
  const router = useRouter()
  const searchParams = useSearchParams()
  const redirect = searchParams.get("redirect") || "/home"

  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // 이미 로그인한 사용자는 리디렉션
  useEffect(() => {
    const unsubscribe = onAuthChange((user) => {
      if (user) {
        router.replace(redirect)
      }
    })
    return () => unsubscribe()
  }, [router, redirect])

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    setLoading(true)
    setError(null)

    const { error: authError } = await signIn(email.trim(), password)

    if (authError) {
      const code = typeof authError === 'string' ? authError : (authError as { code?: string })?.code || "unknown"
      setError(errorMessages[code] || "로그인에 실패했습니다")
      setLoading(false)
      return
    }

    router.push(redirect)
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

    router.push(redirect)
  }

  return (
    <div className="w-full max-w-md">
      <div className="bg-dc-surface rounded-2xl border border-dc-border p-8 flex flex-col gap-6 shadow-sm">
        <div className="flex flex-col gap-2 text-center">
          <h1 className="text-dc-text text-2xl font-bold">로그인</h1>
          <p className="text-dc-text-secondary text-sm">
            DeliveryCut에 오신 것을 환영합니다
          </p>
        </div>

        <button
          onClick={handleGoogleLogin}
          className="w-full h-12 bg-white border border-dc-border text-dc-text text-sm font-semibold rounded-xl flex items-center justify-center gap-3 hover:bg-dc-muted transition-colors"
        >
          <svg width="20" height="20" viewBox="0 0 24 24">
            <path
              d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
              fill="#4285F4"
            />
            <path
              d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-1 .67-2.28 1.07-3.71 1.07-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
              fill="#34A853"
            />
            <path
              d="M5.84 14.09c-.22-.67-.35-1.39-.35-2.09s.13-1.42.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l3.66-2.84z"
              fill="#FBBC05"
            />
            <path
              d="M12 5.38c1.62 0 3.06.56 4.21 1.66l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
              fill="#EA4335"
            />
          </svg>
          Google로 시작하기
        </button>

        <div className="flex items-center gap-3">
          <div className="flex-1 h-px bg-dc-border" />
          <span className="text-dc-text-muted text-xs">또는 이메일로 로그인</span>
          <div className="flex-1 h-px bg-dc-border" />
        </div>

        <form onSubmit={handleSubmit} className="flex flex-col gap-4">
          <div className="flex flex-col gap-2">
            <label className="text-dc-text text-sm font-medium">이메일</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="example@email.com"
              className="w-full h-12 px-4 bg-dc-muted rounded-xl text-dc-text text-sm placeholder:text-dc-text-muted focus:outline-none focus:ring-2 focus:ring-dc-primary border border-transparent focus:border-dc-primary transition-colors"
              required
            />
          </div>

          <div className="flex flex-col gap-2">
            <label className="text-dc-text text-sm font-medium">비밀번호</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="비밀번호를 입력하세요"
              className="w-full h-12 px-4 bg-dc-muted rounded-xl text-dc-text text-sm placeholder:text-dc-text-muted focus:outline-none focus:ring-2 focus:ring-dc-primary border border-transparent focus:border-dc-primary transition-colors"
              required
            />
          </div>

          {error && (
            <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
              {error}
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full h-12 bg-dc-primary text-white text-base font-bold rounded-xl hover:bg-[#2d6b45] transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "로그인 중..." : "로그인"}
          </button>
        </form>

        <div className="text-center text-sm text-dc-text-secondary">
          계정이 없으신가요?{" "}
          <Link href="/signup" className="text-dc-primary font-medium hover:underline">
            회원가입
          </Link>
        </div>
      </div>
    </div>
  )
}

export default function LoginPage() {
  return (
    <div className="min-h-screen bg-dc-bg">
      <NavBar variant="app" />

      <div className="flex items-center justify-center px-5 py-12 lg:py-24">
        <Suspense fallback={<div className="text-dc-text-secondary">로딩 중...</div>}>
          <LoginForm />
        </Suspense>
      </div>
    </div>
  )
}