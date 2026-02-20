import type { CookingMethod, GenerateInput, GenerateOutput, Tool } from "@/lib/types/api"

const TOOL_VALUES = ["microwave", "pan", "airfryer", "pot"] as const
const TIME_LIMIT_VALUES = [5, 10, 15] as const
const COOKING_METHOD_VALUES = ["stir_fry", "braise", "soup", "salad", "grill", "pan_fry", "microwave"] as const

export const generateOutputJsonSchema = {
  type: "object",
  additionalProperties: false,
  required: ["menuOptions", "threeDayPlan", "shoppingList"],
  properties: {
    menuOptions: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["optionId", "title", "timeMin", "tools", "ingredients", "steps", "tip", "flavorDesign"],
        properties: {
          optionId: { type: "string", minLength: 1 },
          title: { type: "string", minLength: 1 },
          timeMin: { type: "number", minimum: 1 },
          tools: {
            type: "array",
            minItems: 1,
            items: { type: "string", enum: [...TOOL_VALUES] },
          },
          ingredients: {
            type: "array",
            minItems: 1,
            items: { type: "string", minLength: 1 },
          },
          steps: {
            type: "array",
            minItems: 3,
            maxItems: 7,
            items: { type: "string", minLength: 1 },
          },
          tip: { type: "string", minLength: 1 },
          flavorDesign: {
            type: "object",
            additionalProperties: false,
            required: [
              "pattern",
              "method",
              "topCandidates",
              "seasoningAmounts",
              "tasteBalance",
              "recipeSteps",
              "recipeStepsV2",
            ],
            properties: {
              pattern: {
                type: "object",
                additionalProperties: false,
                required: ["id", "keyword"],
                properties: {
                  id: { type: "string", minLength: 1 },
                  keyword: { type: "string", minLength: 1 },
                },
              },
              method: { type: "string", enum: [...COOKING_METHOD_VALUES] },
              topCandidates: {
                type: "array",
                minItems: 3,
                maxItems: 3,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["id", "keyword", "score", "reason", "scores"],
                  properties: {
                    id: { type: "string", minLength: 1 },
                    keyword: { type: "string", minLength: 1 },
                    score: { type: "number", minimum: 0, maximum: 100 },
                    reason: { type: "string", minLength: 1 },
                    scores: {
                      type: "object",
                      additionalProperties: false,
                      required: ["availabilityScore", "methodFitScore", "tasteTargetScore", "totalScore"],
                      properties: {
                        availabilityScore: { type: "number", minimum: 0, maximum: 100 },
                        methodFitScore: { type: "number", minimum: 0, maximum: 100 },
                        tasteTargetScore: { type: "number", minimum: 0, maximum: 100 },
                        totalScore: { type: "number", minimum: 0, maximum: 120 },
                      },
                    },
                  },
                },
              },
              seasoningAmounts: {
                type: "array",
                minItems: 1,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["name", "amount", "unit"],
                  properties: {
                    name: { type: "string", minLength: 1 },
                    amount: { type: "number", minimum: 0 },
                    unit: { type: "string", enum: ["tsp", "tbsp", "ml", "g"] },
                  },
                },
              },
              ingredientAmounts: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["name", "amount", "unit"],
                  properties: {
                    name: { type: "string", minLength: 1 },
                    amount: { type: "number", minimum: 0 },
                    unit: { type: "string", enum: ["count", "g", "ml", "tbsp", "tsp"] },
                  },
                },
              },
              tasteBalance: {
                type: "object",
                additionalProperties: false,
                required: ["sweet", "salty", "sour", "bitter", "umami"],
                properties: {
                  sweet: { type: "number", minimum: 0, maximum: 5 },
                  salty: { type: "number", minimum: 0, maximum: 5 },
                  sour: { type: "number", minimum: 0, maximum: 5 },
                  bitter: { type: "number", minimum: 0, maximum: 5 },
                  umami: { type: "number", minimum: 0, maximum: 5 },
                },
              },
              targetTaste: {
                type: "object",
                additionalProperties: false,
                required: ["sweet", "salty", "sour", "bitter", "umami"],
                properties: {
                  sweet: { type: "number", minimum: 0, maximum: 5 },
                  salty: { type: "number", minimum: 0, maximum: 5 },
                  sour: { type: "number", minimum: 0, maximum: 5 },
                  bitter: { type: "number", minimum: 0, maximum: 5 },
                  umami: { type: "number", minimum: 0, maximum: 5 },
                },
              },
              scoreBreakdown: {
                type: "object",
                additionalProperties: false,
                required: ["availabilityScore", "methodFitScore", "tasteTargetScore", "totalScore"],
                properties: {
                  availabilityScore: { type: "number", minimum: 0, maximum: 100 },
                  methodFitScore: { type: "number", minimum: 0, maximum: 100 },
                  tasteTargetScore: { type: "number", minimum: 0, maximum: 100 },
                  totalScore: { type: "number", minimum: 0, maximum: 120 },
                },
              },
              recipeSteps: {
                type: "array",
                minItems: 3,
                maxItems: 7,
                items: { type: "string", minLength: 1 },
              },
              recipeStepsV2: {
                type: "array",
                minItems: 4,
                maxItems: 7,
                items: {
                  type: "object",
                  additionalProperties: false,
                  required: ["n", "text"],
                  properties: {
                    n: { type: "number", minimum: 1 },
                    text: { type: "string", minLength: 1 },
                    heat: { type: "string", enum: ["low", "medium", "high"] },
                    timerMin: { type: "number", minimum: 0 },
                    why: { type: "string", minLength: 1 },
                  },
                },
              },
            },
          },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          kcal: { type: "number", minimum: 0 },
        },
      },
    },
    threeDayPlan: {
      type: "array",
      minItems: 3,
      maxItems: 3,
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day", "breakfast", "lunch", "dinner"],
        properties: {
          day: { type: "number", enum: [1, 2, 3] },
          breakfast: { type: "string", minLength: 1 },
          lunch: { type: "string", minLength: 1 },
          dinner: { type: "string", minLength: 1 },
        },
      },
    },
    shoppingList: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["item", "quantity", "unit"],
        properties: {
          item: { type: "string", minLength: 1 },
          quantity: { type: "number", minimum: 0 },
          unit: { type: "string", minLength: 1 },
          reason: { type: "string" },
        },
      },
    },
    ingredientsUsed: {
      type: "object",
      additionalProperties: { type: "number", minimum: 0 },
    },
  },
} as const

export const isTool = (value: string): value is Tool => {
  return TOOL_VALUES.includes(value as Tool)
}

const isCookingMethod = (value: string): value is CookingMethod => {
  return COOKING_METHOD_VALUES.includes(value as CookingMethod)
}

export const validateGenerateInput = (
  payload: unknown
): { valid: boolean; data?: GenerateInput; errors?: string[] } => {
  const errors: string[] = []

  if (!payload || typeof payload !== "object") {
    return { valid: false, errors: ["Request body must be an object"] }
  }

  const data = payload as Partial<GenerateInput>

  if (!TIME_LIMIT_VALUES.includes(data.timeLimitMin as (typeof TIME_LIMIT_VALUES)[number])) {
    errors.push("timeLimitMin must be one of 5, 10, 15")
  }

  if (!Array.isArray(data.tools) || data.tools.length < 1) {
    errors.push("tools must be a non-empty array")
  } else {
    for (const tool of data.tools) {
      if (!isTool(tool)) {
        errors.push(`Invalid tool: ${tool}`)
      }
    }
  }

  if (typeof data.ingredientsText !== "string" || data.ingredientsText.trim().length === 0) {
    errors.push("ingredientsText is required")
  }

  if (data.dislikedIngredientsText !== undefined && typeof data.dislikedIngredientsText !== "string") {
    errors.push("dislikedIngredientsText must be a string")
  }

  if (data.userId !== undefined && data.userId !== null && typeof data.userId !== "string") {
    errors.push("userId must be a string or null")
  }

  if (data.inventoryContext !== undefined) {
    if (!Array.isArray(data.inventoryContext)) {
      errors.push("inventoryContext must be an array")
    } else {
      data.inventoryContext.forEach((item, index) => {
        if (!item || typeof item !== "object") {
          errors.push(`inventoryContext[${index}] must be an object`)
          return
        }

        if (typeof item.name !== "string" || item.name.trim().length === 0) {
          errors.push(`inventoryContext[${index}].name is required`)
        }

        if (typeof item.amount !== "number" || !Number.isFinite(item.amount) || item.amount <= 0) {
          errors.push(`inventoryContext[${index}].amount must be greater than 0`)
        }

        if (typeof item.unit !== "string" || item.unit.trim().length === 0) {
          errors.push(`inventoryContext[${index}].unit is required`)
        }
      })
    }
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return {
    valid: true,
    data: {
      timeLimitMin: data.timeLimitMin as GenerateInput["timeLimitMin"],
      tools: data.tools as GenerateInput["tools"],
      ingredientsText: data.ingredientsText!.trim(),
      dislikedIngredientsText: data.dislikedIngredientsText?.trim() || undefined,
      userId: data.userId || null,
      inventoryContext: data.inventoryContext as GenerateInput["inventoryContext"],
    },
  }
}

const hasStepMetadata = (step: { heat?: unknown; timerMin?: unknown; why?: unknown }) => {
  return Boolean(step.heat || step.timerMin !== undefined || step.why)
}

export const validateGenerateOutput = (
  output: unknown,
  input: GenerateInput
): { valid: boolean; data?: GenerateOutput; errors?: string[] } => {
  const errors: string[] = []

  if (!output || typeof output !== "object") {
    return { valid: false, errors: ["Output must be an object"] }
  }

  const value = output as Partial<GenerateOutput>

  if (!Array.isArray(value.menuOptions) || value.menuOptions.length !== 3) {
    errors.push("menuOptions must contain exactly 3 items")
  }

  if (!Array.isArray(value.threeDayPlan) || value.threeDayPlan.length !== 3) {
    errors.push("threeDayPlan must contain exactly 3 items")
  }

  if (!Array.isArray(value.shoppingList)) {
    errors.push("shoppingList must be an array")
  }

  if (Array.isArray(value.menuOptions)) {
    value.menuOptions.forEach((menu, index) => {
      if (!menu || typeof menu !== "object") {
        errors.push(`menuOptions[${index}] must be an object`)
        return
      }

      if (typeof menu.title !== "string" || menu.title.trim().length === 0) {
        errors.push(`menuOptions[${index}].title is required`)
      }

      if (typeof menu.timeMin !== "number") {
        errors.push(`menuOptions[${index}].timeMin must be number`)
      } else if (menu.timeMin > input.timeLimitMin) {
        errors.push(`menuOptions[${index}].timeMin must be <= input.timeLimitMin (${input.timeLimitMin})`)
      }

      if (!Array.isArray(menu.steps) || menu.steps.length < 3 || menu.steps.length > 7) {
        errors.push(`menuOptions[${index}].steps must contain 3 to 7 items`)
      }

      if (!Array.isArray(menu.tools) || menu.tools.length < 1 || menu.tools.some((tool) => !isTool(tool))) {
        errors.push(`menuOptions[${index}].tools includes invalid value`)
      }

      if (typeof menu.tip !== "string" || menu.tip.trim().length === 0) {
        errors.push(`menuOptions[${index}].tip is required`)
      }

      const flavorDesign = menu.flavorDesign
      if (!flavorDesign || typeof flavorDesign !== "object") {
        errors.push(`menuOptions[${index}].flavorDesign is required`)
        return
      }

      if (typeof flavorDesign.method !== "string" || !isCookingMethod(flavorDesign.method)) {
        errors.push(`menuOptions[${index}].flavorDesign.method is invalid`)
      }

      if (!Array.isArray(flavorDesign.topCandidates) || flavorDesign.topCandidates.length !== 3) {
        errors.push(`menuOptions[${index}].flavorDesign.topCandidates must contain exactly 3 items`)
      }

      if (!Array.isArray(flavorDesign.recipeStepsV2) || flavorDesign.recipeStepsV2.length < 4 || flavorDesign.recipeStepsV2.length > 7) {
        errors.push(`menuOptions[${index}].flavorDesign.recipeStepsV2 must contain 4 to 7 items`)
      } else {
        const metadataCount = flavorDesign.recipeStepsV2.filter((step) => hasStepMetadata(step)).length
        const minRequired = Math.ceil(flavorDesign.recipeStepsV2.length * 0.6)
        if (metadataCount < minRequired) {
          errors.push(`menuOptions[${index}].flavorDesign.recipeStepsV2 must include heat/timerMin/why in at least 60% steps`)
        }
      }

      if (!Array.isArray(flavorDesign.recipeSteps) || flavorDesign.recipeSteps.length < 3 || flavorDesign.recipeSteps.length > 7) {
        errors.push(`menuOptions[${index}].flavorDesign.recipeSteps must contain 3 to 7 items`)
      }

      const tasteBalance = flavorDesign.tasteBalance
      const tasteKeys = ["sweet", "salty", "sour", "bitter", "umami"] as const
      for (const key of tasteKeys) {
        const tasteValue = tasteBalance?.[key]
        if (typeof tasteValue !== "number" || tasteValue < 0 || tasteValue > 5) {
          errors.push(`menuOptions[${index}].flavorDesign.tasteBalance.${key} must be between 0 and 5`)
        }
      }

      if (!Array.isArray(flavorDesign.seasoningAmounts) || flavorDesign.seasoningAmounts.length === 0) {
        errors.push(`menuOptions[${index}].flavorDesign.seasoningAmounts must contain at least 1 item`)
      }
    })
  }

  if (Array.isArray(value.threeDayPlan)) {
    value.threeDayPlan.forEach((item, index) => {
      if (!item || typeof item !== "object") {
        errors.push(`threeDayPlan[${index}] must be an object`)
        return
      }

      if (![1, 2, 3].includes(item.day)) {
        errors.push(`threeDayPlan[${index}].day must be one of 1, 2, 3`)
      }
    })
  }

  if (errors.length > 0) {
    return { valid: false, errors }
  }

  return { valid: true, data: value as GenerateOutput }
}
