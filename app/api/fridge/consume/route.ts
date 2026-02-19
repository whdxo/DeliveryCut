import { NextResponse } from "next/server"
import { consumeFridgeItems } from "@/lib/firebase"
import { isQuantityUnit } from "@/lib/fridge/unit"
import type { ApiError, FridgeConsumeInput } from "@/lib/types/api"

const jsonError = (status: number, code: string, message: string, details?: unknown) => {
  const body: ApiError = { error: { code, message, details } }
  return NextResponse.json(body, { status })
}

const getUserIdFromHeader = (request: Request) => {
  const userId = request.headers.get("x-user-id")?.trim()
  return userId || null
}

export async function POST(request: Request) {
  const userId = getUserIdFromHeader(request)
  if (!userId) {
    return jsonError(401, "UNAUTHORIZED", "Login required")
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonError(400, "INVALID_INPUT", "Request body must be valid JSON")
  }

  const body = payload as Partial<FridgeConsumeInput>

  if (!body.recipeId || typeof body.recipeId !== "string") {
    return jsonError(400, "INVALID_INPUT", "recipeId is required")
  }

  if (!Array.isArray(body.items) || body.items.length === 0) {
    return jsonError(400, "INVALID_INPUT", "items must be non-empty array")
  }

  for (const item of body.items) {
    if (!item || typeof item !== "object") {
      return jsonError(400, "INVALID_INPUT", "invalid consume item")
    }

    const parsed = item as { itemId?: unknown; amount?: unknown; unit?: unknown }
    if (typeof parsed.itemId !== "string" || !parsed.itemId.trim()) {
      return jsonError(400, "INVALID_INPUT", "itemId is required")
    }

    if (typeof parsed.amount !== "number" || !Number.isFinite(parsed.amount) || parsed.amount <= 0) {
      return jsonError(400, "INVALID_INPUT", "amount must be greater than 0")
    }

    if (typeof parsed.unit !== "string" || !isQuantityUnit(parsed.unit)) {
      return jsonError(400, "INVALID_INPUT", "invalid unit")
    }
  }

  const { data, error } = await consumeFridgeItems(userId, {
    recipeId: body.recipeId,
    resultId: typeof body.resultId === "string" ? body.resultId : undefined,
    items: body.items,
  } as FridgeConsumeInput)

  if (error?.startsWith("ITEM_NOT_FOUND:")) {
    return jsonError(404, "ITEM_NOT_FOUND", "One or more fridge items were not found", error)
  }

  if (error?.startsWith("INSUFFICIENT_STOCK:")) {
    return jsonError(409, "INSUFFICIENT_STOCK", "Insufficient stock for one or more items", error)
  }

  if (error?.startsWith("INVALID_UNIT:")) {
    return jsonError(400, "INVALID_INPUT", "Incompatible unit conversion", error)
  }

  if (error || !data) {
    return jsonError(500, "INTERNAL_ERROR", "Failed to consume fridge items", error)
  }

  return NextResponse.json({ consumed: data })
}
