import { describe, expect, it } from "vitest"
import { evaluateFlavorPatterns } from "../flavorEngine"

describe("ingredient amount normalization", () => {
  it("육류는 g 단위로 추정된다", () => {
    const flavor = evaluateFlavorPatterns({
      ingredients: ["돼지고기"],
      pantry: ["간장", "소금"],
      cookingTools: ["pan"],
      menu: {
        title: "돼지고기 볶음",
        ingredients: ["돼지고기"],
        steps: ["손질", "볶기", "마무리"],
        timeMin: 10,
      },
    })

    const pork = (flavor.ingredientAmounts ?? []).find((item) => item.name.includes("돼지고기"))
    expect(pork).toBeTruthy()
    expect(pork?.unit).toBe("g")
    expect((pork?.amount ?? 0) >= 100).toBe(true)
  })

  it("양파/당근/파/마늘은 분수/개수 count로 추정된다", () => {
    const flavor = evaluateFlavorPatterns({
      ingredients: ["양파", "당근", "파", "마늘"],
      pantry: ["간장", "소금"],
      cookingTools: ["pan"],
      menu: {
        title: "채소볶음",
        ingredients: ["양파", "당근", "파", "마늘"],
        steps: ["손질", "볶기", "마무리"],
        timeMin: 10,
      },
    })

    const amounts = flavor.ingredientAmounts ?? []
    const onion = amounts.find((item) => item.name === "양파")
    const carrot = amounts.find((item) => item.name === "당근")
    const greenOnion = amounts.find((item) => item.name === "파")
    const garlic = amounts.find((item) => item.name === "마늘")

    expect(onion?.unit).toBe("count")
    expect(onion?.amount).toBe(0.5)
    expect(carrot?.unit).toBe("count")
    expect(carrot?.amount).toBe(0.25)
    expect(greenOnion?.unit).toBe("count")
    expect(greenOnion?.amount).toBe(1)
    expect(garlic?.unit).toBe("count")
    expect(garlic?.amount).toBe(3)
  })

  it("조미료는 ingredientAmounts에서 제거되고 seasoningAmounts에만 남는다", () => {
    const flavor = evaluateFlavorPatterns({
      ingredients: ["돼지고기", "간장", "고추장", "버터"],
      pantry: ["간장", "고추장", "버터", "소금"],
      cookingTools: ["pan"],
      menu: {
        title: "돼지고기 볶음",
        ingredients: ["돼지고기", "간장", "고추장", "버터"],
        steps: ["손질", "볶기", "마무리"],
        timeMin: 10,
      },
    })

    const ingredientNames = (flavor.ingredientAmounts ?? []).map((item) => item.name)
    expect(ingredientNames.some((name) => /(간장|고추장|된장|버터)/.test(name))).toBe(false)
    expect(flavor.seasoningAmounts.length > 0).toBe(true)
  })
})
