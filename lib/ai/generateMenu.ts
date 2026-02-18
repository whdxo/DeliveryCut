import OpenAI from "openai"
import { SYSTEM_PROMPT, RULES_PROMPT, buildUserPrompt } from "./prompts"
import type { GenerateInput, GenerateOutput } from "@/lib/types/api"

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
})

// OpenAI strict 모드용 스키마 (모든 properties가 required에 포함돼야 함)
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
        required: ["optionId", "title", "timeMin", "tools", "ingredients", "steps", "tip", "difficulty", "kcal"],
        properties: {
          optionId: { type: "string" },
          title: { type: "string" },
          timeMin: { type: "number" },
          tools: {
            type: "array",
            items: { type: "string", enum: ["microwave", "pan", "airfryer"] },
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

export const generateMenu = async (input: GenerateInput): Promise<GenerateOutput> => {
  const response = await client.chat.completions.create({
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

  return JSON.parse(content) as GenerateOutput
}
