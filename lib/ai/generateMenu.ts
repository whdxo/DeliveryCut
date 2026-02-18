import type { GenerateInput, GenerateOutput } from "@/lib/types/api"

const parseIngredients = (text: string) =>
  text
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean)

export const generateMenu = async (input: GenerateInput): Promise<GenerateOutput> => {
  const ingredients = parseIngredients(input.ingredientsText)
  const base = ingredients.length > 0 ? ingredients : ["계란", "김치", "두부"]

  // TODO(air): OpenAI 연동 전까지는 공용 타입/스키마 검증용 mock 반환
  return {
    menuOptions: [
      {
        optionId: "option-1",
        title: `${base[0]} 볶음밥`,
        timeMin: input.timeLimitMin,
        tools: [input.tools[0]],
        ingredients: base.slice(0, 4),
        steps: [
          "재료를 손질한다.",
          "도구에 맞춰 빠르게 조리한다.",
          "간을 맞춘 뒤 완성한다.",
        ],
        tip: "수분 많은 재료는 마지막에 넣으세요.",
        difficulty: "easy",
      },
      {
        optionId: "option-2",
        title: `${base[Math.min(1, base.length - 1)]} 덮밥`,
        timeMin: input.timeLimitMin,
        tools: input.tools,
        ingredients: base.slice(0, 5),
        steps: [
          "주재료를 먹기 좋게 썬다.",
          "볶거나 데워서 익힌다.",
          "밥 위에 올려 마무리한다.",
        ],
        tip: "강불 단시간 조리가 식감을 살립니다.",
      },
      {
        optionId: "option-3",
        title: `${base[Math.min(2, base.length - 1)]} 한그릇`,
        timeMin: input.timeLimitMin,
        tools: [input.tools[0]],
        ingredients: base.slice(0, 4),
        steps: [
          "재료를 한 번에 조리 가능한 형태로 준비한다.",
          "도구에 맞게 5~10분 조리한다.",
          "간을 맞춘 뒤 담아낸다.",
        ],
        tip: "소금은 마지막에 조절하는 게 안전합니다.",
      },
    ],
    threeDayPlan: [
      { day: 1, breakfast: "계란 토스트", lunch: "김치볶음밥", dinner: "두부 덮밥" },
      { day: 2, breakfast: "오트밀", lunch: "잔반 볶음", dinner: "원팬 구이" },
      { day: 3, breakfast: "삶은 계란", lunch: "비빔 한그릇", dinner: "재료 털이 스프" },
    ],
    shoppingList: [
      { item: "대파", quantity: 1, unit: "단", reason: "향 보강" },
      { item: "간장", quantity: 1, unit: "병" },
    ],
    ingredientsUsed: Object.fromEntries(base.map((item) => [item, 1])),
  }
}
