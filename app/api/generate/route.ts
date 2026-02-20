import { NextResponse } from "next/server"
import { generateMenu } from "@/lib/ai/generateMenu"
import { validateGenerateInput, validateGenerateOutput } from "@/lib/ai/schema"
import { finalizeShoppingList } from "@/lib/ai/postprocess"
import { saveGeneratedPlan, getFridgeItemsByUserId, getUserMenuPlans } from "@/lib/firebase"
import type { ApiError, GenerateInput, GenerateResponse, StoredMenuPlan } from "@/lib/types/api"

const jsonError = (status: number, code: string, message: string, details?: unknown) => {
  const body: ApiError = { error: { code, message, details } }
  return NextResponse.json(body, { status })
}

const stripUndefined = <T>(value: T): T => {
  if (Array.isArray(value)) {
    return value.map((item) => stripUndefined(item)) as T
  }

  if (value && typeof value === "object") {
    const entries = Object.entries(value as Record<string, unknown>)
      .filter(([, v]) => v !== undefined)
      .map(([k, v]) => [k, stripUndefined(v)])

    return Object.fromEntries(entries) as T
  }

  return value
}

const parseRequestUserId = (payload: unknown): { userId: string | null; error?: string } => {
  if (!payload || typeof payload !== "object" || !("userId" in payload)) {
    return { userId: null }
  }

  const raw = (payload as { userId?: unknown }).userId

  if (raw === undefined || raw === null) {
    return { userId: null }
  }

  if (typeof raw !== "string") {
    return { userId: null, error: "userId must be a string or null" }
  }

  return { userId: raw.trim() || null }
}

const withInventoryContext = async (input: GenerateInput, userId: string | null): Promise<GenerateInput> => {
  if (Array.isArray(input.inventoryContext) && input.inventoryContext.length > 0) {
    return input
  }

  if (!userId) return input

  const fridgeResult = await getFridgeItemsByUserId(userId)
  if (fridgeResult.error || !fridgeResult.data) {
    return input
  }

  const inventoryContext = fridgeResult.data
    .filter((item) => Number.isFinite(item.amount) && item.amount > 0)
    .map((item) => ({
      name: item.name,
      amount: item.amount,
      unit: item.unit,
      category: item.category,
    }))

  if (inventoryContext.length === 0) return input

  return {
    ...input,
    inventoryContext,
  }
}

export async function POST(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON")
  }

  const userIdParsing = parseRequestUserId(payload)
  if (userIdParsing.error) {
    return jsonError(400, "INVALID_INPUT", userIdParsing.error)
  }

  const inputValidation = validateGenerateInput(payload)
  if (!inputValidation.valid || !inputValidation.data) {
    return jsonError(400, "INVALID_INPUT", "Input validation failed", inputValidation.errors)
  }

  try {
    let recentMenus: string[] = []
    if (userIdParsing.userId) {
      const { data: plans } = await getUserMenuPlans(userIdParsing.userId)
      recentMenus = (plans ?? [])
        .flatMap((p) => p.output.menuOptions.map((m) => m.title))
        .slice(0, 6)
    }

    const inputWithInventory = await withInventoryContext(inputValidation.data, userIdParsing.userId)

    const rawOutput = await generateMenu({ ...inputWithInventory, recentMenus })
    const output = finalizeShoppingList(rawOutput, inputWithInventory)
    const outputValidation = validateGenerateOutput(output, inputWithInventory)

    if (!outputValidation.valid || !outputValidation.data) {
      return jsonError(
        422,
        "INVALID_AI_OUTPUT",
        "AI output does not match schema rules",
        outputValidation.errors
      )
    }

    const resultId = crypto.randomUUID()
    const now = new Date().toISOString()

    const stored: StoredMenuPlan = stripUndefined({
      resultId,
      userId: userIdParsing.userId,
      input: inputWithInventory,
      output: outputValidation.data,
      meta: {
        source: "openai",
        model: "gpt-4o-mini",
      },
      createdAt: now,
      updatedAt: now,
    })

    const { error: saveError } = await saveGeneratedPlan(stored)
    if (saveError) {
      return jsonError(500, "FIRESTORE_SAVE_FAILED", "Failed to save generated plan", saveError)
    }

    const response: GenerateResponse = {
      resultId,
      output: outputValidation.data,
    }

    return NextResponse.json(response)
  } catch (error) {
    return jsonError(500, "INTERNAL_ERROR", "Failed to generate menu", String(error))
  }
}
