import { describe, expect, it } from "vitest"
import { __test__, collectPantryFromInput } from "../generateMenu"

describe("collectPantryFromInput", () => {
  it("일반 식재료만 입력하면 DEFAULT_PANTRY 중심으로 구성된다", () => {
    const pantry = collectPantryFromInput({
      timeLimitMin: 10,
      tools: ["pan"],
      ingredientsText: "감자, 양파",
    })

    expect(pantry).toContain("간장")
    expect(pantry).toContain("소금")
    expect(pantry).toContain("후추")
    expect(pantry).toContain("마늘")
    expect(pantry).not.toContain("감자")
    expect(pantry).not.toContain("양파")
  })

  it("조미료 입력과 seasoning inventory를 pantry에 반영한다", () => {
    const pantry = collectPantryFromInput({
      timeLimitMin: 10,
      tools: ["pan"],
      ingredientsText: "간장, 고추장, 감자",
      inventoryContext: [
        { name: "식용유", amount: 1, unit: "ml", category: "seasoning" },
      ],
    })

    expect(pantry).toContain("간장")
    expect(pantry).toContain("고추장")
    expect(pantry).toContain("식용유")
    expect(pantry).not.toContain("감자")
  })
})


describe("enforcePotSoupMenu", () => {
  it("냄비 선택 시 국물류 메뉴가 없으면 최소 1개를 보정한다", () => {
    const output = {
      menuOptions: [
        {
          optionId: "option-1",
          title: "돼지고기 볶음",
          timeMin: 10,
          tools: ["pan"],
          ingredients: ["돼지고기", "양파"],
          steps: ["볶기", "간하기", "마무리"],
          tip: "센불로 볶기",
        },
        {
          optionId: "option-2",
          title: "계란볶음",
          timeMin: 8,
          tools: ["pan"],
          ingredients: ["계란", "파"],
          steps: ["재료 손질", "볶기", "완성"],
          tip: "약불 유지",
        },
        {
          optionId: "option-3",
          title: "두부구이",
          timeMin: 9,
          tools: ["airfryer"],
          ingredients: ["두부"],
          steps: ["자르기", "굽기", "완성"],
          tip: "수분 제거",
        },
      ],
      threeDayPlan: [
        { day: 1, breakfast: "A", lunch: "B", dinner: "C" },
        { day: 2, breakfast: "A", lunch: "B", dinner: "C" },
        { day: 3, breakfast: "A", lunch: "B", dinner: "C" },
      ],
      shoppingList: [],
    } as const

    const normalized = __test__.enforcePotSoupMenu(output as any, {
      timeLimitMin: 10,
      tools: ["pot", "pan"],
      ingredientsText: "돼지고기, 양파",
    })

    expect(normalized.menuOptions.some((menu) => __test__.hasSoupLikeMenu(menu))).toBe(true)
  })
})
