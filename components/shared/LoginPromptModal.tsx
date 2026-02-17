"use client"

import { useEffect, useState } from "react"
import Link from "next/link"

interface LoginPromptModalProps {
  onClose: () => void
}

export default function LoginPromptModal({ onClose }: LoginPromptModalProps) {
  const [visible, setVisible] = useState(false)

  useEffect(() => {
    // 살짝 딜레이 후 애니메이션 진입
    const t = setTimeout(() => setVisible(true), 50)
    return () => clearTimeout(t)
  }, [])

  const handleClose = () => {
    setVisible(false)
    setTimeout(onClose, 300)
  }

  return (
    <>
      {/* Backdrop */}
      <div
        onClick={handleClose}
        className={`fixed inset-0 bg-black/30 z-50 transition-opacity duration-300 ${
          visible ? "opacity-100" : "opacity-0"
        }`}
      />

      {/* Modal — bottom sheet on mobile, centered card on desktop */}
      <div
        className={`fixed z-50 transition-all duration-300
          bottom-0 left-0 right-0
          lg:bottom-auto lg:left-1/2 lg:top-1/2 lg:-translate-x-1/2 lg:-translate-y-1/2 lg:w-[420px]
          ${visible ? "translate-y-0 opacity-100" : "translate-y-full opacity-0 lg:translate-y-[-40%]"}
        `}
      >
        <div className="bg-dc-surface rounded-t-3xl lg:rounded-2xl p-6 lg:p-8 flex flex-col gap-5 shadow-2xl">
          {/* Handle bar - mobile only */}
          <div className="lg:hidden w-10 h-1 bg-dc-border rounded-full mx-auto -mt-1" />

          {/* Icon + Title */}
          <div className="flex flex-col items-center gap-3 text-center">
            <div className="w-14 h-14 bg-dc-primary-light rounded-2xl flex items-center justify-center text-2xl">
              🍳
            </div>
            <div className="flex flex-col gap-1">
              <h2 className="text-dc-text text-lg font-bold">로그인하면 더 편리해요</h2>
              <p className="text-dc-text-secondary text-sm leading-relaxed">
                비회원으로도 사용 가능하지만,<br />
                로그인하면 추천 결과가 <span className="text-dc-primary font-semibold">히스토리에 자동 저장</span>돼요.
              </p>
            </div>
          </div>

          {/* Benefits */}
          <div className="flex flex-col gap-2 bg-dc-muted rounded-xl p-4">
            {[
              { icon: "📋", text: "추천 메뉴 히스토리 저장" },
              { icon: "🔄", text: "이전 결과 다시 사용하기" },
              { icon: "🛒", text: "장보기 목록 보관" },
            ].map((item) => (
              <div key={item.text} className="flex items-center gap-3">
                <span className="text-base">{item.icon}</span>
                <span className="text-dc-text text-sm">{item.text}</span>
              </div>
            ))}
          </div>

          {/* Buttons */}
          <div className="flex flex-col gap-2">
            <Link
              href="/login"
              className="w-full h-[52px] bg-dc-primary text-white text-base font-bold rounded-xl flex items-center justify-center hover:bg-[#2d6b45] transition-colors"
            >
              로그인하고 저장하기
            </Link>
            <button
              onClick={handleClose}
              className="w-full h-[48px] bg-dc-muted text-dc-text-secondary text-sm font-medium rounded-xl hover:bg-dc-border transition-colors"
            >
              그냥 계속할게요
            </button>
          </div>
        </div>
      </div>
    </>
  )
}
