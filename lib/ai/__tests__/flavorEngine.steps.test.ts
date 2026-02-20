import { describe, expect, it, vi } from "vitest"
import { __test__ } from "../flavorEngine"

describe("step templates", () => {
  it("동일 입력에서도 템플릿이 달라질 수 있다", () => {
    const spy = vi.spyOn(Math, "random")
    spy.mockReturnValueOnce(0.0)
    const a = __test__.createBaseSteps("stir_fry", {
      ingredientText: "돼지고기 200g",
      seasoningText: "간장 1tbsp",
      patternKeyword: "간장마늘",
    })

    spy.mockReturnValueOnce(0.99)
    const b = __test__.createBaseSteps("stir_fry", {
      ingredientText: "돼지고기 200g",
      seasoningText: "간장 1tbsp",
      patternKeyword: "간장마늘",
    })

    spy.mockRestore()

    expect(a.map((s) => s.text).join("|")).not.toBe(b.map((s) => s.text).join("|"))
  })

  it("메타데이터 60% 규칙 보정이 동작한다", () => {
    const patched = __test__.ensureStepMetadataCoverage([
      { n: 1, text: "a" },
      { n: 2, text: "b" },
      { n: 3, text: "c" },
      { n: 4, text: "d" },
      { n: 5, text: "e" },
    ])

    const covered = patched.filter((step) => step.heat || step.timerMin !== undefined || step.why).length
    expect(covered).toBeGreaterThanOrEqual(3)
  })
})
