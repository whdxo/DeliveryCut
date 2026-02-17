"use client"

import Link from "next/link"
import { useState } from "react"

export default function LoginPage() {
  const [showPassword, setShowPassword] = useState(false)
  const [email, setEmail] = useState("")
  const [password, setPassword] = useState("")

  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault()
    // TODO: Firebase auth 연동
    console.log("login", email, password)
  }

  return (
    <div className="min-h-screen bg-dc-bg flex flex-col">
      {/* NavBar */}
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

      {/* Body */}
      <div className="flex-1 flex w-full">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />
        <div className="w-full lg:w-[960px] lg:flex-none flex items-center justify-center px-5 py-12 lg:py-0">
          {/* Login Card */}
          <div className="w-full max-w-[480px] bg-dc-surface rounded-2xl border border-dc-border p-8 lg:p-12 flex flex-col gap-6 lg:gap-8">
            {/* Header */}
            <div className="flex flex-col items-center gap-1.5 text-center">
              <h1 className="text-dc-text text-2xl lg:text-[24px] font-bold">로그인</h1>
              <p className="text-dc-text-secondary text-sm">이메일로 계속하기</p>
            </div>

            {/* Form */}
            <form onSubmit={handleLogin} className="flex flex-col gap-4">
              {/* Email */}
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

              {/* Password */}
              <div className="flex flex-col gap-1.5">
                <label className="text-dc-text text-[13px] font-semibold">비밀번호</label>
                <div className="relative">
                  <input
                    type={showPassword ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="비밀번호 입력"
                    className="w-full h-12 px-4 pr-16 bg-dc-muted border border-dc-border rounded-[10px] text-dc-text text-sm placeholder:text-dc-text-muted focus:outline-none focus:border-dc-primary focus:bg-white transition-colors"
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

              {/* Forgot password */}
              <div className="flex justify-end">
                <button type="button" className="text-dc-primary text-[13px] font-medium hover:underline">
                  비밀번호를 잊으셨나요?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                className="w-full h-[52px] bg-dc-primary text-white text-base font-bold rounded-xl hover:bg-[#2d6b45] transition-colors flex items-center justify-center"
              >
                로그인
              </button>
            </form>

            {/* Divider */}
            <div className="flex items-center gap-3">
              <div className="flex-1 h-px bg-dc-border" />
              <span className="text-dc-text-muted text-[13px]">또는</span>
              <div className="flex-1 h-px bg-dc-border" />
            </div>

            {/* Sign up link */}
            <div className="flex items-center justify-center gap-1">
              <span className="text-dc-text-secondary text-sm">아직 계정이 없으신가요?</span>
              <Link href="/signup" className="text-dc-primary text-sm font-semibold hover:underline">
                회원가입
              </Link>
            </div>
          </div>
        </div>
        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>
    </div>
  )
}
