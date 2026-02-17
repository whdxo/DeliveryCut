import { NextResponse } from "next/server"
import { generateMenu } from "@/lib/ai/generateMenu"
import { validateGenerateInput, validateGenerateOutput } from "@/lib/ai/schema"
import { saveGeneratedPlan } from "@/lib/firebase"
import type { ApiError, GenerateResponse, StoredMenuPlan } from "@/lib/types/api"

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

export async function POST(request: Request) {
  let payload: unknown

  try {
    payload = await request.json()
  } catch {
    return jsonError(400, "INVALID_JSON", "Request body must be valid JSON")
  }

  const inputValidation = validateGenerateInput(payload)
  if (!inputValidation.valid || !inputValidation.data) {
    return jsonError(400, "INVALID_INPUT", "Input validation failed", inputValidation.errors)
  }

  try {
    const output = await generateMenu(inputValidation.data)
    const outputValidation = validateGenerateOutput(output, inputValidation.data)

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
      userId: null,
      input: inputValidation.data,
      output: outputValidation.data,
      meta: {
        source: "mock",
        model: "mock-v1",
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
