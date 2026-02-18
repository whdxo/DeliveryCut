import { NextResponse } from "next/server"
import { generateMenu } from "@/lib/ai/generateMenu"
import { validateGenerateInput, validateGenerateOutput } from "@/lib/ai/schema"
import { saveResult } from "@/lib/firebase/results"
import type { ApiError, GenerateResponse } from "@/lib/types/api"

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

    const response: GenerateResponse = {
      resultId,
      output: outputValidation.data,
    }

    // 🔗 Firestore에 저장
    const saveResponse = await saveResult(resultId, {
      input: inputValidation.data,
      output: outputValidation.data,
      userId: null,
    })

    if (saveResponse.error) {
      return jsonError(
        500,
        "FIRESTORE_SAVE_FAILED",
        "Failed to save generated plan to database",
        saveResponse.error
      )
    }

    return NextResponse.json(response)
  } catch (error) {
    return jsonError(500, "INTERNAL_ERROR", "Failed to generate menu", String(error))
  }
}
