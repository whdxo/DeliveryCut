import { collection, doc, getDoc, runTransaction, setDoc } from "firebase/firestore"
import { db } from "@/lib/firebase/config"
import { collections } from "@/lib/firebase/firestore"

export type UsageIdentityType = "uid" | "device"
export type UsageFeature = "quick" | "planner"

export interface UsageIdentity {
  identityType: UsageIdentityType
  identityId: string
}

export interface UsageQuotaResult {
  allowed: boolean
  dailyLimit: number
  usedCount: number
  remainingCount: number
  dateKey: string
}

const DAILY_LIMIT = 10
const KST_TIME_ZONE = "Asia/Seoul"

const getKstDateKey = () => {
  const parts = new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).formatToParts(new Date())

  const y = parts.find((part) => part.type === "year")?.value
  const m = parts.find((part) => part.type === "month")?.value
  const d = parts.find((part) => part.type === "day")?.value

  if (!y || !m || !d) {
    const fallback = new Date()
    const yy = fallback.getUTCFullYear()
    const mm = String(fallback.getUTCMonth() + 1).padStart(2, "0")
    const dd = String(fallback.getUTCDate()).padStart(2, "0")
    return `${yy}-${mm}-${dd}`
  }

  return `${y}-${m}-${d}`
}

const isValidDeviceId = (value: string) => /^dc_[a-zA-Z0-9_-]{8,64}$/.test(value)

export const resolveUsageIdentity = (request: Request, userId: string | null): { identity: UsageIdentity | null; errorCode?: string; message?: string } => {
  const normalizedUserId = typeof userId === "string" ? userId.trim() : ""
  if (normalizedUserId) {
    return {
      identity: {
        identityType: "uid",
        identityId: normalizedUserId,
      },
    }
  }

  const headerDeviceId = request.headers.get("x-device-id")?.trim() ?? ""
  if (!headerDeviceId) {
    return {
      identity: null,
      errorCode: "MISSING_DEVICE_ID",
      message: "x-device-id header is required for anonymous requests",
    }
  }

  if (!isValidDeviceId(headerDeviceId)) {
    return {
      identity: null,
      errorCode: "INVALID_DEVICE_ID",
      message: "x-device-id format is invalid",
    }
  }

  return {
    identity: {
      identityType: "device",
      identityId: headerDeviceId,
    },
  }
}

const toDocId = (identity: UsageIdentity, dateKey: string) => `${identity.identityType}:${identity.identityId}:${dateKey}`

export const getUsageQuota = async (identity: UsageIdentity): Promise<UsageQuotaResult> => {
  const dateKey = getKstDateKey()
  const usageRef = doc(db, collections.usageDaily, toDocId(identity, dateKey))

  const snap = await getDoc(usageRef)
  const usedCount = snap.exists() ? Number((snap.data() as { totalCount?: number }).totalCount ?? 0) : 0
  const safeUsed = Number.isFinite(usedCount) && usedCount > 0 ? usedCount : 0

  return {
    allowed: safeUsed < DAILY_LIMIT,
    dailyLimit: DAILY_LIMIT,
    usedCount: safeUsed,
    remainingCount: Math.max(DAILY_LIMIT - safeUsed, 0),
    dateKey,
  }
}

export const checkAndConsumeUsageQuota = async (
  identity: UsageIdentity,
  feature: UsageFeature
): Promise<UsageQuotaResult> => {
  const dateKey = getKstDateKey()
  const usageRef = doc(db, collections.usageDaily, toDocId(identity, dateKey))

  return runTransaction(db, async (transaction) => {
    const snap = await transaction.get(usageRef)

    const current = snap.exists()
      ? (snap.data() as {
          quickCount?: number
          plannerCount?: number
          totalCount?: number
        })
      : {}

    const quickCount = Number(current.quickCount ?? 0)
    const plannerCount = Number(current.plannerCount ?? 0)
    const totalCount = Number(current.totalCount ?? 0)

    const safeQuick = Number.isFinite(quickCount) && quickCount > 0 ? quickCount : 0
    const safePlanner = Number.isFinite(plannerCount) && plannerCount > 0 ? plannerCount : 0
    const safeTotal = Number.isFinite(totalCount) && totalCount > 0 ? totalCount : 0

    // ✅ 무제한 모드: 카운트만 기록하고 제한 없음
    const nextQuick = feature === "quick" ? safeQuick + 1 : safeQuick
    const nextPlanner = feature === "planner" ? safePlanner + 1 : safePlanner
    const nextTotal = safeTotal + 1

    const payload = {
      identityType: identity.identityType,
      identityId: identity.identityId,
      dateKey,
      quickCount: nextQuick,
      plannerCount: nextPlanner,
      totalCount: nextTotal,
      updatedAt: new Date().toISOString(),
    }

    if (snap.exists()) {
      transaction.update(usageRef, payload)
    } else {
      transaction.set(usageRef, payload)
    }

    // ✅ 항상 allowed: true 반환 (무제한 사용)
    return {
      allowed: true,
      dailyLimit: DAILY_LIMIT,
      usedCount: nextTotal,
      remainingCount: Math.max(DAILY_LIMIT - nextTotal, 0),
      dateKey,
    }
  })
}

export const saveSubscriptionWaitlist = async (input: {
  identity: UsageIdentity
  email?: string
  note?: string
}) => {
  const requestId = crypto.randomUUID()
  const now = new Date().toISOString()

  await setDoc(doc(collection(db, collections.subscriptionWaitlist), requestId), {
    requestId,
    identityType: input.identity.identityType,
    identityId: input.identity.identityId,
    email: input.email?.trim() || null,
    note: input.note?.trim() || null,
    status: "pending",
    createdAt: now,
    updatedAt: now,
  })

  return {
    requestId,
    submittedAt: now,
  }
}
