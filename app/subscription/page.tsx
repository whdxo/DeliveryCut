"use client"

import { useState } from "react"
import { NavBar, MobileBottomNav } from "@/components/shared/PageLayout"
import { onAuthChange } from "@/lib/firebase"
import { getOrCreateDeviceId } from "@/lib/client/deviceId"

export default function SubscriptionPage() {
  const [email, setEmail] = useState("")
  const [note, setNote] = useState("")
  const [done, setDone] = useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState("")

  const submitWaitlist = async () => {
    if (loading) return
    setLoading(true)
    setError("")

    let userId = null
    await new Promise((resolve) => {
      const unsub = onAuthChange((u) => {
        userId = u?.uid ?? null
        unsub()
        resolve(undefined)
      })
    })

    try {
      const res = await fetch("/api/subscription/waitlist", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-device-id": getOrCreateDeviceId(),
        },
        body: JSON.stringify({ userId, email: email.trim() || undefined, note: note.trim() || undefined }),
      })

      if (!res.ok) {
        const data = await res.json()
        setError(data?.error?.message ?? "신청 중 오류가 발생했어요")
        return
      }

      setDone(true)
    } catch {
      setError("네트워크 오류가 발생했어요")
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-dc-bg">
      <div className="sticky top-0 z-50 w-full border-b border-dc-border bg-dc-surface">
        <NavBar variant="app" />
      </div>

      <div className="flex w-full min-h-[calc(100vh-4rem)]">
        <div className="flex-1 bg-dc-side border-r border-dc-border hidden lg:block" />

        <main className="w-full lg:w-[960px] lg:flex-none px-5 lg:px-10 py-8 lg:py-12 pb-24 lg:pb-12">
          <section className="bg-dc-surface border border-dc-border rounded-2xl p-6 lg:p-8">
            <p className="inline-flex px-3 py-1 rounded-full bg-dc-primary-light text-dc-primary text-xs font-semibold">
              Subscription
            </p>
            <h1 className="mt-3 text-dc-text text-2xl lg:text-[30px] font-bold">구독 안내</h1>
            <p className="mt-2 text-dc-primary text-sm font-semibold">
              현재 오픈 기간으로 모든 구독 기능을 무료 제공 중입니다.
            </p>
            <p className="mt-2 text-dc-text-secondary text-sm">
              정식 유료화 시 우선 안내를 받고 싶다면 알림 신청을 남겨주세요.
            </p>

            {done ? (
              <div className="mt-6 p-4 rounded-xl bg-dc-primary-light text-dc-primary text-sm font-medium">
                신청이 완료됐어요. 정식 출시 전에 안내드릴게요.
              </div>
            ) : (
              <div className="mt-6 space-y-3">
                <input
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="이메일 (선택)"
                  className="w-full h-11 px-4 bg-dc-muted rounded-xl text-dc-text text-sm"
                />
                <textarea
                  value={note}
                  onChange={(e) => setNote(e.target.value)}
                  rows={3}
                  placeholder="남기고 싶은 메모 (선택)"
                  className="w-full px-4 py-3 bg-dc-muted rounded-xl text-dc-text text-sm resize-none"
                />
                {error && <p className="text-red-600 text-sm">{error}</p>}
                <button
                  type="button"
                  onClick={submitWaitlist}
                  disabled={loading}
                  className="h-11 px-5 bg-dc-primary text-white text-sm font-semibold rounded-xl hover:bg-[#2d6b45] transition-colors disabled:opacity-60"
                >
                  {loading ? "신청 중..." : "알림 신청"}
                </button>
              </div>
            )}
          </section>
        </main>

        <div className="flex-1 bg-dc-side border-l border-dc-border hidden lg:block" />
      </div>

      <MobileBottomNav />
    </div>
  )
}
