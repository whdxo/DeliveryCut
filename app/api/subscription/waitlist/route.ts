import { NextResponse } from "next/server"
import type { ApiError } from "@/lib/types/api"
import { resolveUsageIdentity, saveSubscriptionWaitlist } from "@/lib/usage/quota"

const jsonError = (status: number, code: string, message: string, details?: unknown) => {
  const body: ApiError = { error: { code, message, details } }
  return NextResponse.json(body, { status })
}

export async function POST(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON")
  }

  const userId = typeof payload === "object" && payload && "userId" in payload && typeof (payload as { userId?: unknown }).userId === "string"
    ? ((payload as { userId: string }).userId.trim() || null)
    : null

  const identityResult = resolveUsageIdentity(request, userId)
  if (!identityResult.identity) {
    return jsonError(400, identityResult.errorCode ?? "INVALID_IDENTITY", identityResult.message ?? "Failed to resolve identity")
  }

  const email = typeof payload === "object" && payload && "email" in payload && typeof (payload as { email?: unknown }).email === "string"
    ? (payload as { email: string }).email
    : undefined

  const note = typeof payload === "object" && payload && "note" in payload && typeof (payload as { note?: unknown }).note === "string"
    ? (payload as { note: string }).note
    : undefined

  try {
    const saved = await saveSubscriptionWaitlist({
      identity: identityResult.identity,
      email,
      note,
    })

    return NextResponse.json(saved)
  } catch (error) {
    const message = String(error)
    const isPermissionError =
      message.includes("permission-denied") ||
      message.includes("Missing or insufficient permissions")

    if (isPermissionError) {
      return NextResponse.json({
        requestId: crypto.randomUUID(),
        submittedAt: new Date().toISOString(),
        persisted: false,
      })
    }

    return jsonError(500, "INTERNAL_ERROR", "Failed to submit subscription waitlist", message)
  }
}

