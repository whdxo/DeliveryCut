import { NextResponse } from "next/server"
import {
  addFridgeItem,
  getFridgeItemsByUserId,
  searchFoodCatalogItems,
} from "@/lib/firebase"
import { FRIDGE_CATEGORIES, QUANTITY_UNITS } from "@/lib/fridge/constants"
import { isQuantityUnit } from "@/lib/fridge/unit"
import { inferFallbackFood } from "@/lib/food/fallback"
import { inferFoodByKeyword } from "@/lib/food/keyword-rules"
import type {
  ApiError,
  FridgeCategory,
  FridgeCreateInput,
  FridgeListResponse,
  FoodSearchItem,
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

const normalize = (value: string) => value.trim().toLowerCase()

const formatDateOnly = (date: Date) => {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, "0")
  const d = String(date.getDate()).padStart(2, "0")
  return `${y}-${m}-${d}`
}

const addDays = (days: number) => {
  const now = new Date()
  const next = new Date(now)
  next.setDate(next.getDate() + days)
  return formatDateOnly(next)
}

const pickBestMatch = (name: string, items: FoodSearchItem[]) => {
  const key = normalize(name)
  const score = (item: FoodSearchItem) => {
    const candidates = [item.displayName, item.subCategory, item.name].filter((v): v is string => !!v)
    let best = Number.MAX_SAFE_INTEGER
    for (const candidate of candidates) {
      const value = normalize(candidate)
      if (value === key) best = Math.min(best, 0)
      else if (value.startsWith(key) || key.startsWith(value)) best = Math.min(best, 1)
      else if (value.includes(key) || key.includes(value)) best = Math.min(best, 2)
    }
    return best
  }

  return [...items]
    .sort((a, b) => {
      const sa = score(a)
      const sb = score(b)
      if (sa !== sb) return sa - sb
      const al = a.displayName ?? a.subCategory ?? a.name
      const bl = b.displayName ?? b.subCategory ?? b.name
      return al.localeCompare(bl, "ko")
    })
    .find((item) => score(item) < Number.MAX_SAFE_INTEGER) ?? null
}


const resolveFoodMeta = async (name: string) => {
  const catalog = await searchFoodCatalogItems(name, 10)
  const fromCatalog = !catalog.error ? pickBestMatch(name, catalog.data) : null
  if (fromCatalog) return fromCatalog


  const fallback = inferFallbackFood(name)
  if (fallback) {
    return {
      name: fallback.name,
      category: fallback.category,
      subCategory: fallback.subCategory,
      defaultUnit: fallback.defaultUnit,
      source: "fallback" as const,
    }
  }

  const keyword = inferFoodByKeyword(name)
  if (keyword) {
    return {
      name,
      category: keyword.category,
      subCategory: keyword.subCategory,
      defaultUnit: keyword.defaultUnit,
      source: "fallback" as const,
    }
  }

  return null
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
  const rawCategory = typeof body.category === "string" ? body.category : undefined
  const rawSubCategory = typeof body.subCategory === "string" ? body.subCategory.trim() : ""
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

  if (rawCategory && !isValidCategory(rawCategory)) {
    return jsonError(400, "INVALID_INPUT", "invalid category")
  }

  if (expiresOn && !isValidDateOnly(expiresOn)) {
    return jsonError(400, "INVALID_INPUT", "expiresOn must be YYYY-MM-DD format")
  }

  const resolved = await resolveFoodMeta(name)
  const category = rawCategory && rawCategory !== "other" ? rawCategory : resolved?.category ?? "other"
  const subCategory = rawSubCategory || resolved?.displayName || resolved?.subCategory || name
  const fallbackMeta = inferFallbackFood(name)
  const resolvedExpiresOn = expiresOn || (fallbackMeta?.defaultShelfLifeDays ? addDays(fallbackMeta.defaultShelfLifeDays) : undefined)

  const { item, error } = await addFridgeItem(userId, {
    name,
    category,
    subCategory,
    amount,
    unit,
    expiresOn: resolvedExpiresOn,
  })

  if (error || !item) {
    return jsonError(500, "INTERNAL_ERROR", "Failed to add fridge item", error)
  }

  return NextResponse.json(item)
}

