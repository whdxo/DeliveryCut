import type { GenerateInput, GenerateOutput, Tool } from "@/lib/types/api"

const TOOL_VALUES = ["microwave", "pan", "airfryer"] as const
const TIME_LIMIT_VALUES = [5, 10, 15] as const

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
        required: [
          "optionId",
          "title",
          "timeMin",
          "tools",
          "ingredients",
          "steps",
          "tip",
        ],
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
            maxItems: 5,
            items: { type: "string", minLength: 1 },
          },
          tip: { type: "string", minLength: 1 },
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

  if (
    data.dislikedIngredientsText !== undefined &&
    typeof data.dislikedIngredientsText !== "string"
  ) {
    errors.push("dislikedIngredientsText must be a string")
  }

  if (
    data.userId !== undefined &&
    data.userId !== null &&
    typeof data.userId !== "string"
  ) {
    errors.push("userId must be a string or null")
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
    },
  }
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
        errors.push(
          `menuOptions[${index}].timeMin must be <= input.timeLimitMin (${input.timeLimitMin})`
        )
      }

      if (!Array.isArray(menu.steps) || menu.steps.length < 3 || menu.steps.length > 5) {
        errors.push(`menuOptions[${index}].steps must contain 3 to 5 items`)
      }

      if (
        !Array.isArray(menu.tools) ||
        menu.tools.length < 1 ||
        menu.tools.some((tool) => !isTool(tool))
      ) {
        errors.push(`menuOptions[${index}].tools includes invalid value`)
      }

      if (typeof menu.tip !== "string" || menu.tip.trim().length === 0) {
        errors.push(`menuOptions[${index}].tip is required`)
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
