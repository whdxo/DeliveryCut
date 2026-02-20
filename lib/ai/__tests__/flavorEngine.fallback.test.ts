import { describe, expect, it } from "vitest"
import { evaluateFlavorPatterns } from "../flavorEngine"

describe("fallback candidates", () => {
  it("샐러드 성격 입력에서 후보가 항상 3개를 채운다", () => {
    const flavor = evaluateFlavorPatterns({
      ingredients: ["양배추", "오이"],
      pantry: ["소금"],
      cookingTools: ["pan"],
      menu: {
        title: "양배추 샐러드",
        ingredients: ["양배추", "오이"],
        steps: ["재료를 자른다", "버무린다", "완성한다"],
        timeMin: 10,
      },
    })

    expect(flavor.topCandidates).toHaveLength(3)
  })

  it("non-basic 후보가 있으면 basic 패턴을 topCandidates에 넣지 않는다", () => {
    const flavor = evaluateFlavorPatterns({
      ingredients: ["돼지고기"],
      pantry: ["고추장", "간장"],
      cookingTools: ["pan"],
      menu: {
        title: "돼지고기 구이",
        ingredients: ["돼지고기"],
        steps: ["재료를 준비한다", "굽는다", "마무리한다"],
        timeMin: 10,
      },
    })

    expect(flavor.topCandidates).toHaveLength(3)
    expect(flavor.topCandidates.every((c) => !c.id.startsWith("basic-"))).toBe(true)
  })
})


  it("김치+돼지고기+냄비 입력에서 김치 계열 패턴을 우선 선택한다", () => {
    const flavor = evaluateFlavorPatterns({
      ingredients: ["돼지고기", "김치", "양파", "파"],
      pantry: ["간장", "고춧가루", "다진마늘", "소금"],
      cookingTools: ["pot"],
      menu: {
        title: "돼지고기 김치찌개",
        ingredients: ["돼지고기", "김치", "양파", "파"],
        steps: ["재료를 손질한다", "끓인다", "마무리한다"],
        timeMin: 10,
      },
    })

    expect(flavor.pattern.id).toBe("kimchi-spicy")
  })
