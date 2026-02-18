import { NextResponse } from "next/server"
import { addFridgeItem, getFridgeItemsByUserId } from "@/lib/firebase"
import { FRIDGE_CATEGORIES, QUANTITY_UNITS } from "@/lib/fridge/constants"
import { isQuantityUnit } from "@/lib/fridge/unit"
import type {
  ApiError,
  FridgeCategory,
  FridgeCreateInput,
  FridgeListResponse,
} from "@/lib/types/api"

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

export async function GET(request: Request) {
  const userId = getUserIdFromHeader(request)
  if (!userId) {
    return jsonError(401, "UNAUTHORIZED", "Login required")
  }

  const { searchParams } = new URL(request.url)
  const categoryParam = searchParams.get("category")
  const sortParam = searchParams.get("sort")

  const category = categoryParam && isValidCategory(categoryParam) ? categoryParam : undefined
  const sort = sortParam === "expiresOn" || sortParam === "updatedAt" ? sortParam : "updatedAt"

  const { data, error } = await getFridgeItemsByUserId(userId, { category, sort })
  if (error || !data) {
    return jsonError(500, "INTERNAL_ERROR", "Failed to load fridge items", error)
  }

  const response: FridgeListResponse = { items: data }
  return NextResponse.json(response)
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

  const body = payload as Partial<FridgeCreateInput>
  const name = typeof body.name === "string" ? body.name.trim() : ""
  const amount = Number(body.amount)
  const unit = typeof body.unit === "string" ? body.unit : ""
  const category = typeof body.category === "string" ? body.category : "other"
  const expiresOn = typeof body.expiresOn === "string" ? body.expiresOn.trim() : ""

  if (!name) {
    return jsonError(400, "INVALID_INPUT", "name is required")
  }

  if (!Number.isFinite(amount) || amount <= 0) {
    return jsonError(400, "INVALID_INPUT", "amount must be greater than 0")
  }

  if (!isQuantityUnit(unit)) {
    return jsonError(400, "INVALID_INPUT", `unit must be one of: ${QUANTITY_UNITS.map((u) => u.value).join(", ")}`)
  }

  if (!isValidCategory(category)) {
    return jsonError(400, "INVALID_INPUT", "invalid category")
  }

  if (expiresOn && !isValidDateOnly(expiresOn)) {
    return jsonError(400, "INVALID_INPUT", "expiresOn must be YYYY-MM-DD format")
  }

  const { item, error } = await addFridgeItem(userId, {
    name,
    category,
    amount,
    unit,
    expiresOn: expiresOn || undefined,
  })

  if (error || !item) {
    return jsonError(500, "INTERNAL_ERROR", "Failed to add fridge item", error)
  }

  return NextResponse.json(item)
}
