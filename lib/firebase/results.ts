import { saveGeneratedPlan, getGeneratedPlanById } from "./firestore"
import type { StoredMenuPlan, GenerateInput, GenerateOutput } from "@/lib/types/api"

/**
 * 작업을 의뢰한 팀원의 워크플로우에 맞춰 함수명을 매핑합니다.
 */

interface SaveResultData {
    input: GenerateInput
    output: GenerateOutput
    userId: string | null
}

export const saveResult = async (resultId: string, data: SaveResultData) => {
    const now = new Date().toISOString()

    // StoredMenuPlan 구조에 맞게 변환하여 저장
    // Firebase는 undefined 값을 허용하지 않으므로 제거
    const sanitizedInput = Object.fromEntries(
        Object.entries(data.input).filter(([, v]) => v !== undefined)
    ) as GenerateInput

    const plan: StoredMenuPlan = {
        resultId,
        input: sanitizedInput,
        output: data.output,
        userId: data.userId,
        meta: {
            source: "openai",
            model: "gpt-4-turbo", // 기본 모델
        },
        createdAt: now,
        updatedAt: now,
    }
    return await saveGeneratedPlan(plan)
}

export const getResult = async (resultId: string) => {
    const response = await getGeneratedPlanById(resultId)
    if (response.error || !response.data) return null
    return response.data
}
