import { saveGeneratedPlan, getGeneratedPlanById } from "./firestore"
import type { StoredMenuPlan, GenerateInput, GenerateOutput } from "@/lib/types/api"

/**
 * 작업을 의뢰한 팀원의 워크플로우에 맞춰 함수명을 매핑합니다.
 */

interface SaveResultData {
    input: GenerateInput
    output: GenerateOutput
    createdAt: string
    userId: string | null
}

export const saveResult = async (resultId: string, data: SaveResultData) => {
    // StoredMenuPlan 구조에 맞게 변환하여 저장
    const plan: StoredMenuPlan = {
        resultId,
        input: data.input,
        output: data.output,
        createdAt: data.createdAt,
        userId: data.userId,
        meta: {
            source: "openai",
            model: "gpt-4-turbo", // 기본 모델
        },
        updatedAt: new Date().toISOString()
    }
    return await saveGeneratedPlan(plan)
}

export const getResult = async (resultId: string) => {
    const response = await getGeneratedPlanById(resultId)
    if (response.error || !response.data) return null
    return response.data
}
