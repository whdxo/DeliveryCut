import OpenAI from "openai"
import {
  SYSTEM_PROMPT,
  RULES_PROMPT,
  buildUserPrompt,
  PLANNER_SYSTEM_PROMPT,
  PLANNER_RULES_PROMPT,
  buildPlannerUserPrompt,
} from "./prompts"
import { applyFlavorDesignToMenu } from "./flavorEngine"
import { PANTRY_TASTE_MAP, DEFAULT_PANTRY } from "./flavorCatalog"
import { canonicalizeFoodName, normalizeFoodKey } from "@/lib/food/normalize"
import type {
  GenerateInput,
  GenerateOutput,
  MenuOption,
  PlannerInput,
  PlannerOutput,
  Tool,
} from "@/lib/types/api"

const getClient = () =>
  new OpenAI({
    apiKey: process.env.OPENAI_API_KEY,
  })

const strictSchema = {
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
          "difficulty",
          "kcal",
        ],
        properties: {
          optionId: { type: "string" },
          title: { type: "string" },
          timeMin: { type: "number" },
          tools: {
            type: "array",
            items: { type: "string", enum: ["microwave", "pan", "airfryer", "pot"] },
          },
          ingredients: {
            type: "array",
            items: { type: "string" },
          },
          steps: {
            type: "array",
            minItems: 3,
            maxItems: 5,
            items: { type: "string" },
          },
          tip: { type: "string" },
          difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
          kcal: { type: "number" },
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
          breakfast: { type: "string" },
          lunch: { type: "string" },
          dinner: { type: "string" },
        },
      },
    },
    shoppingList: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["item", "quantity", "unit", "reason"],
        properties: {
          item: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
  },
} as const

const plannerStrictSchema = {
  type: "object",
  additionalProperties: false,
  required: ["dayPlans", "shoppingList", "totalEstimatedCost", "cookingTips"],
  properties: {
    dayPlans: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["day", "meals"],
        properties: {
          day: { type: "number" },
          meals: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              required: ["name", "timeMin", "ingredients", "isLeftover"],
              properties: {
                name: { type: "string" },
                timeMin: { type: "number" },
                ingredients: { type: "array", items: { type: "string" } },
                isLeftover: { type: "boolean" },
              },
            },
          },
        },
      },
    },
    shoppingList: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        required: ["item", "quantity", "unit", "reason"],
        properties: {
          item: { type: "string" },
          quantity: { type: "number" },
          unit: { type: "string" },
          reason: { type: "string" },
        },
      },
    },
    totalEstimatedCost: { type: "number" },
    cookingTips: { type: "array", items: { type: "string" } },
  },
} as const

const normalizeText = (value: string) => value.trim()

const parseCommaSeparated = (value: string) =>
  value
    .split(",")
    .map((token) => normalizeText(token))
    .filter(Boolean)

const hasTasteProfile = (value: string) => {
  const canonical = canonicalizeFoodName(value)
  return Boolean(PANTRY_TASTE_MAP[canonical] ?? PANTRY_TASTE_MAP[value])
}

export const collectPantryFromInput = (input: GenerateInput): string[] => {
  const fromIngredients = parseCommaSeparated(input.ingredientsText)
  const fromFridge = (input.fridgeContext ?? []).map((item) => normalizeText(item.name)).filter(Boolean)
  const fromInventory = (input.inventoryContext ?? []).map((item) => normalizeText(item.name)).filter(Boolean)
  const fromInventorySeasoning = (input.inventoryContext ?? [])
    .filter((item) => item.category === "seasoning")
    .map((item) => normalizeText(item.name))
    .filter(Boolean)

  const seasoningCandidates = [...fromInventorySeasoning, ...fromIngredients, ...fromFridge, ...fromInventory]
    .map((name) => canonicalizeFoodName(name))
    .filter((name) => !!name)
    .filter((name) => fromInventorySeasoning.some((src) => canonicalizeFoodName(src) === name) || hasTasteProfile(name))

  const ordered = [...DEFAULT_PANTRY, ...seasoningCandidates]
  const deduped: string[] = []
  const seen = new Set<string>()

  for (const item of ordered) {
    const canonical = canonicalizeFoodName(item)
    const key = normalizeFoodKey(canonical)
    if (!key || seen.has(key)) continue
    seen.add(key)
    deduped.push(canonical)
  }

  return deduped
}

const SOUP_KEYWORDS = ["국", "찌개", "탕", "전골", "스프"] as const

const hasSoupLikeMenu = (menu: Pick<MenuOption, "title" | "steps">) => {
  const titleKey = normalizeFoodKey(menu.title)
  if (SOUP_KEYWORDS.some((keyword) => titleKey.includes(keyword))) return true

  return menu.steps.some((step) => {
    const stepKey = normalizeFoodKey(step)
    return stepKey.includes("끓") || stepKey.includes("국물") || stepKey.includes("우려")
  })
}

const toSoupTitle = (title: string, ingredients: string[]) => {
  const ingredientKey = normalizeFoodKey(ingredients.join(" "))
  const hasKimchi = ingredientKey.includes("김치")
  const hasPork = ingredientKey.includes("돼지고기") || ingredientKey.includes("삼겹살") || ingredientKey.includes("목살")

  if (hasKimchi && hasPork) return "돼지고기 김치찌개"
  if (hasKimchi) return "김치찌개"

  const cleaned = title.replace(/(볶음밥|볶음|구이|덮밥|비빔|샐러드|무침)/g, "").trim()
  const base = cleaned.length > 0 ? cleaned : "집밥"
  return `${base} 된장찌개`
}

const enforcePotSoupMenu = (output: GenerateOutput, input: GenerateInput): GenerateOutput => {
  if (!input.tools.includes("pot")) return output
  if (output.menuOptions.some((menu) => hasSoupLikeMenu(menu))) return output

  const targetIndex = output.menuOptions.findIndex((menu) => menu.tools.includes("pot"))
  const index = targetIndex >= 0 ? targetIndex : 0
  const target = output.menuOptions[index]

  const nextTools = [...new Set(["pot", ...target.tools])].filter((tool): tool is Tool => input.tools.includes(tool as Tool))
  const ingredientKey = normalizeFoodKey(target.ingredients.join(" "))
  const hasKimchi = ingredientKey.includes("김치")
  const hasPork = ingredientKey.includes("돼지고기") || ingredientKey.includes("삼겹살") || ingredientKey.includes("목살")

  const nextIngredientsBase = target.ingredients.some((item) => normalizeFoodKey(item).includes("물") || normalizeFoodKey(item).includes("육수"))
    ? [...target.ingredients]
    : [...target.ingredients, "물"]

  const nextIngredients = [...nextIngredientsBase]
  if (hasKimchi && !nextIngredients.some((item) => normalizeFoodKey(item).includes("김치"))) nextIngredients.push("김치")
  if (hasKimchi && hasPork && !nextIngredients.some((item) => /(돼지고기|삼겹살|목살)/.test(normalizeFoodKey(item)))) nextIngredients.push("돼지고기")

  const nextMenu: MenuOption = {
    ...target,
    title: toSoupTitle(target.title, target.ingredients),
    tools: nextTools.length > 0 ? nextTools : ["pot"],
    ingredients: nextIngredients,
    steps: hasKimchi
      ? [
          "냄비에 돼지고기와 김치를 1분간 먼저 볶아 잡내와 신맛을 정리합니다.",
          "물 500ml를 넣고 중불에서 4분 끓입니다.",
          "고춧가루, 다진마늘, 간장을 넣고 2분 더 끓여 간을 맞춥니다.",
          "대파를 넣고 약불에서 1분 마무리합니다.",
        ]
      : [
          "재료를 먹기 좋은 크기로 썰어 냄비에 담습니다.",
          "물 500ml를 넣고 중불에서 4분간 끓여 기본 국물을 만듭니다.",
          "된장 또는 간장을 풀고 2분 더 끓여 간을 맞춥니다.",
          "약불에서 1분 뜸 들인 뒤 부족한 간을 보정해 마무리합니다.",
        ],
    tip: hasKimchi
      ? "김치는 먼저 1분 볶고 끓이면 신맛이 줄고 감칠맛이 살아납니다."
      : "국물 요리는 마지막 1분 약불로 끓인 뒤 간을 보정하면 맛이 안정됩니다.",
  }

  const nextMenuOptions = [...output.menuOptions] as GenerateOutput["menuOptions"]
  nextMenuOptions[index] = nextMenu

  return {
    ...output,
    menuOptions: nextMenuOptions,
  }
}
const enrichWithFlavorDesign = (
  output: GenerateOutput,
  input: GenerateInput
): GenerateOutput => {
  const pantry = collectPantryFromInput(input)

  return {
    ...output,
    menuOptions: output.menuOptions.map((menu) =>
      applyFlavorDesignToMenu(menu, pantry, input.tools)
    ) as GenerateOutput["menuOptions"],
  }
}

export const generatePlan = async (input: PlannerInput): Promise<PlannerOutput> => {
  const response = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: PLANNER_SYSTEM_PROMPT },
      { role: "system", content: PLANNER_RULES_PROMPT },
      { role: "user", content: buildPlannerUserPrompt(input) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "planner_generation",
        strict: true,
        schema: plannerStrictSchema,
      },
    },
    temperature: 0.7,
    max_tokens: 4000,
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("OpenAI returned empty response")

  return JSON.parse(content) as PlannerOutput
}

export const generateMenu = async (input: GenerateInput): Promise<GenerateOutput> => {
  const response = await getClient().chat.completions.create({
    model: "gpt-4o-mini",
    messages: [
      { role: "system", content: SYSTEM_PROMPT },
      { role: "system", content: RULES_PROMPT },
      { role: "user", content: buildUserPrompt(input) },
    ],
    response_format: {
      type: "json_schema",
      json_schema: {
        name: "menu_generation",
        strict: true,
        schema: strictSchema,
      },
    },
    temperature: 0.7,
    max_tokens: 2500,
  })

  const content = response.choices[0]?.message?.content
  if (!content) throw new Error("OpenAI returned empty response")

  const raw = JSON.parse(content) as GenerateOutput
  const normalized = enforcePotSoupMenu(raw, input)
  return enrichWithFlavorDesign(normalized, input)
}




export const __test__ = {
  hasSoupLikeMenu,
  enforcePotSoupMenu,
}
