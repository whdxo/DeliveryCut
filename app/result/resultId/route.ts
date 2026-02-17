import { NextResponse } from "next/server"
// 🔗 팀원 작업 완료 후 아래 주석 해제
// import { getResult } from "@/lib/firebase/results"

export async function GET(
    _request: Request,
    { params }: { params: { resultId: string } }
) {
    const { resultId } = params

    if (!resultId) {
        return NextResponse.json(
            { error: { code: "BAD_REQUEST", message: "resultId is required" } },
            { status: 400 }
        )
    }

    // 🔗 팀원 작업 완료 후 아래 블록 주석 해제 + 그 아래 임시 응답 제거
    // const result = await getResult(resultId)
    // if (!result) {
    //   return NextResponse.json(
    //     { error: { code: "NOT_FOUND", message: "Result not found" } },
    //     { status: 404 }
    //   )
    // }
    // return NextResponse.json(result)

    // ⚠️ 임시: 팀원 Firestore 연동 전까지 404 반환
    return NextResponse.json(
        { error: { code: "NOT_FOUND", message: "Result not found" } },
        { status: 404 }
    )
}