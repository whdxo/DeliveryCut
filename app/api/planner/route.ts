import { NextResponse } from "next/server"
import { generatePlan } from "@/lib/ai/generateMenu"
import { savePlannerPlan } from "@/lib/firebase"
import { checkAndConsumeUsageQuota, resolveUsageIdentity } from "@/lib/usage/quota"
import type { ApiError, PlannerInput, PlannerResponse, StoredPlannerPlan } from "@/lib/types/api"

const jsonError = (status: number, code: string, message: string, details?: unknown) => {
  const body: ApiError = { error: { code, message, details } }
  return NextResponse.json(body, { status })
}

const stripUndefined = <T>(value: T): T => {
  if (Array.isArray(value)) return value.map((item) => stripUndefined(item)) as T
  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, stripUndefined(v)])
    return Object.fromEntries(entries) as T
  }
  return value
}

function parsePlannerInput(payload: unknown): { data: PlannerInput | null; error?: string } {
  if (!payload || typeof payload !== "object") return { data: null, error: "Request body must be an object" }

  const p = payload as Record<string, unknown>

  const days = p.days
  if (days !== 3 && days !== 7) return { data: null, error: "days must be 3 or 7" }

  const mealsPerDay = p.mealsPerDay
  if (mealsPerDay !== 1 && mealsPerDay !== 2 && mealsPerDay !== 3)
    return { data: null, error: "mealsPerDay must be 1, 2, or 3" }

  const budget = p.budget !== undefined ? Number(p.budget) : undefined
  if (budget !== undefined && (!Number.isFinite(budget) || budget <= 0))
    return { data: null, error: "budget must be a positive number" }

  const fridgeIngredients =
    typeof p.fridgeIngredients === "string" && p.fridgeIngredients.trim()
      ? p.fridgeIngredients.trim()
      : undefined

  const dislikedIngredientsText =
    typeof p.dislikedIngredientsText === "string" && p.dislikedIngredientsText.trim()
      ? p.dislikedIngredientsText.trim()
      : undefined

  const userId =
    typeof p.userId === "string" ? p.userId.trim() || null : null

  return {
    data: {
      days,
      mealsPerDay,
      ...(budget !== undefined ? { budget } : {}),
      ...(fridgeIngredients ? { fridgeIngredients } : {}),
      ...(dislikedIngredientsText ? { dislikedIngredientsText } : {}),
      userId,
    },
  }
}

export async function POST(request: Request) {
  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON")
  }

  const { data: input, error: parseError } = parsePlannerInput(payload)
  if (!input) return jsonError(400, "INVALID_INPUT", parseError ?? "Invalid input")

  const identityResult = resolveUsageIdentity(request, input.userId ?? null)
  if (!identityResult.identity) {
    return jsonError(400, identityResult.errorCode ?? "INVALID_IDENTITY", identityResult.message ?? "Failed to resolve identity")
  }

  // ✅ 무제한 모드: quota 체크만 하고 차단하지 않음 (확인용)
  await checkAndConsumeUsageQuota(identityResult.identity, "planner")

  try {
    const output = await generatePlan(input)

    const planId = crypto.randomUUID()
    const now = new Date().toISOString()

    const stored: StoredPlannerPlan = stripUndefined({
      planId,
      userId: input.userId ?? null,
      input,
      output,
      createdAt: now,
      updatedAt: now,
    })

    const { error: saveError } = await savePlannerPlan(stored)
    if (saveError) {
      return jsonError(500, "FIRESTORE_SAVE_FAILED", "Failed to save planner plan", saveError)
    }

    const response: PlannerResponse = { planId, output }
    return NextResponse.json(response)
  } catch (error) {
    return jsonError(500, "INTERNAL_ERROR", "Failed to generate plan", String(error))
  }
}
