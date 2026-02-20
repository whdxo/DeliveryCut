import { NextResponse } from "next/server"
import type { ApiError } from "@/lib/types/api"
import { getUsageQuota, resolveUsageIdentity } from "@/lib/usage/quota"

const jsonError = (status: number, code: string, message: string, details?: unknown) => {
  const body: ApiError = { error: { code, message, details } }
  return NextResponse.json(body, { status })
}

export async function GET(request: Request) {
  const userId = request.headers.get("x-user-id")?.trim() || null
  const identityResult = resolveUsageIdentity(request, userId)

  if (!identityResult.identity) {
    return jsonError(400, identityResult.errorCode ?? "INVALID_IDENTITY", identityResult.message ?? "Failed to resolve identity")
  }

  try {
    const quota = await getUsageQuota(identityResult.identity)
    return NextResponse.json({
      dailyLimit: quota.dailyLimit,
      usedCount: quota.usedCount,
      remainingCount: quota.remainingCount,
      dateKey: quota.dateKey,
      isOpenFree: true,
    })
  } catch (error) {
    return jsonError(500, "INTERNAL_ERROR", "Failed to load usage quota", String(error))
  }
}
