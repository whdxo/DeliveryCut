import { NextResponse } from "next/server"
import { deleteFridgeItem, updateFridgeItem } from "@/lib/firebase"
import { FRIDGE_CATEGORIES } from "@/lib/fridge/constants"
import { isQuantityUnit } from "@/lib/fridge/unit"
import type { ApiError, FridgeCategory, FridgeUpdateInput } from "@/lib/types/api"

const jsonError = (status: number, code: string, message: string, details?: unknown) => {
  const body: ApiError = { error: { code, message, details } }
  return NextResponse.json(body, { status })
}

const getUserIdFromHeader = (request: Request) => {
  const userId = request.headers.get("x-user-id")?.trim()
  return userId || null
}

const isValidDateOnly = (value: string) => /^\d{4}-\d{2}-\d{2}$/.test(value)
const isValidCategory = (value: string): value is FridgeCategory => {
  return FRIDGE_CATEGORIES.some((item) => item.value === value)
}

export async function PATCH(
  request: Request,
  context: { params: Promise<{ itemId: string }> }
) {
  const userId = getUserIdFromHeader(request)
  if (!userId) {
    return jsonError(401, "UNAUTHORIZED", "Login required")
  }

  const { itemId } = await context.params
  if (!itemId) {
    return jsonError(400, "INVALID_INPUT", "itemId is required")
  }

  let payload: unknown
  try {
    payload = await request.json()
  } catch {
    return jsonError(400, "INVALID_INPUT", "Request body must be valid JSON")
  }

  const body = payload as FridgeUpdateInput
  const patch: FridgeUpdateInput = {}

  if (body.name !== undefined) {
    if (typeof body.name !== "string" || !body.name.trim()) {
      return jsonError(400, "INVALID_INPUT", "name must be non-empty string")
    }
    patch.name = body.name.trim()
  }

  if (body.category !== undefined) {
    if (!isValidCategory(body.category)) {
      return jsonError(400, "INVALID_INPUT", "invalid category")
    }
    patch.category = body.category
  }

  if (body.amount !== undefined) {
    if (!Number.isFinite(body.amount) || body.amount <= 0) {
      return jsonError(400, "INVALID_INPUT", "amount must be greater than 0")
    }
    patch.amount = body.amount
  }

  if (body.unit !== undefined) {
    if (!isQuantityUnit(body.unit)) {
      return jsonError(400, "INVALID_INPUT", "invalid unit")
    }
    patch.unit = body.unit
  }

  if (body.expiresOn !== undefined) {
    if (body.expiresOn !== null && (typeof body.expiresOn !== "string" || !isValidDateOnly(body.expiresOn))) {
      return jsonError(400, "INVALID_INPUT", "expiresOn must be YYYY-MM-DD or null")
    }
    patch.expiresOn = body.expiresOn
  }

  const { item, error } = await updateFridgeItem(userId, itemId, patch)

  if (error === "Item not found") {
    return jsonError(404, "ITEM_NOT_FOUND", "Fridge item not found")
  }

  if (error || !item) {
    return jsonError(500, "INTERNAL_ERROR", "Failed to update fridge item", error)
  }

  return NextResponse.json(item)
}

export async function DELETE(
  request: Request,
  context: { params: Promise<{ itemId: string }> }
) {
  const userId = getUserIdFromHeader(request)
  if (!userId) {
    return jsonError(401, "UNAUTHORIZED", "Login required")
  }

  const { itemId } = await context.params
  if (!itemId) {
    return jsonError(400, "INVALID_INPUT", "itemId is required")
  }

  const { error } = await deleteFridgeItem(userId, itemId)

  if (error === "Item not found") {
    return jsonError(404, "ITEM_NOT_FOUND", "Fridge item not found")
  }

  if (error) {
    return jsonError(500, "INTERNAL_ERROR", "Failed to delete fridge item", error)
  }

  return NextResponse.json({ ok: true })
}
