import { NextResponse } from "next/server"
import { getResult } from "@/lib/firebase/results"

export async function GET(
    _request: Request,
    { params }: { params: Promise<{ resultId: string }> }
) {
    const { resultId } = await params

    if (!resultId) {
        return NextResponse.json(
            { error: { code: "BAD_REQUEST", message: "resultId is required" } },
            { status: 400 }
        )
    }

    const result = await getResult(resultId)
    if (!result) {
        return NextResponse.json(
            { error: { code: "NOT_FOUND", message: "Result not found" } },
            { status: 404 }
        )
    }
    return NextResponse.json(result)
}