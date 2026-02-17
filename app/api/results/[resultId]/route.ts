import { NextResponse } from "next/server"
import { getGeneratedPlanById } from "@/lib/firebase"
import type { ApiError, ResultResponse, StoredMenuPlan } from "@/lib/types/api"

const jsonError = (status: number, code: string, message: string, details?: unknown) => {
  const body: ApiError = { error: { code, message, details } }
  return NextResponse.json(body, { status })
}

export async function GET(
  _request: Request,
  context: { params: Promise<{ resultId: string }> }
) {
  const { resultId } = await context.params

  if (!resultId || typeof resultId !== "string") {
    return jsonError(400, "INVALID_RESULT_ID", "resultId is required")
  }

  const { data, error } = await getGeneratedPlanById(resultId)

  if (error && error !== "Document not found") {
    return jsonError(500, "FIRESTORE_READ_FAILED", "Failed to read generated plan", error)
  }

  if (!data) {
    return jsonError(404, "RESULT_NOT_FOUND", "Result not found")
  }

  const plan = data as StoredMenuPlan

  const response: ResultResponse = {
    resultId: plan.resultId,
    input: plan.input,
    output: plan.output,
    createdAt: plan.createdAt,
  }

  return NextResponse.json(response)
}
