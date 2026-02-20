import type { CookingMethod, Taste5, QuantityUnit, Tool } from "@/lib/types/api"

export interface FlavorPattern {
  id: string
  keyword: string
  requiredSeasonings: string[]
  preferredSeasonings: string[]
  defaultSeasoningGuide: Array<{
    name: string
    amount: number
    unit: Extract<QuantityUnit, "tsp" | "tbsp" | "ml" | "g">
  }>
  defaultSeasoningGuideVariants?: Array<
    Array<{
      name: string
      amount: number
      unit: Extract<QuantityUnit, "tsp" | "tbsp" | "ml" | "g">
    }>
  >
  bestMethods: CookingMethod[]
  preferredTools?: Tool[]
}

export const DEFAULT_PANTRY = ["간장", "소금", "후추", "다진마늘", "고춧가루"] as const

export const PANTRY_TASTE_MAP: Record<string, Taste5> = {
  "간장": { sweet: 1, salty: 4, sour: 0, bitter: 0, umami: 4 },
  "진간장": { sweet: 1, salty: 4, sour: 0, bitter: 0, umami: 4 },
  "국간장": { sweet: 0, salty: 4, sour: 0, bitter: 0, umami: 3 },
  "고추장": { sweet: 2, salty: 3, sour: 0, bitter: 1, umami: 3 },
  "된장": { sweet: 1, salty: 3, sour: 0, bitter: 1, umami: 4 },
  "고춧가루": { sweet: 0, salty: 0, sour: 0, bitter: 1, umami: 1 },
  "참기름": { sweet: 0, salty: 0, sour: 0, bitter: 0, umami: 2 },
  "들기름": { sweet: 0, salty: 0, sour: 0, bitter: 0, umami: 2 },
  "버터": { sweet: 0, salty: 1, sour: 0, bitter: 0, umami: 2 },
  "설탕": { sweet: 5, salty: 0, sour: 0, bitter: 0, umami: 0 },
  "올리고당": { sweet: 4, salty: 0, sour: 0, bitter: 0, umami: 0 },
  "식초": { sweet: 0, salty: 0, sour: 5, bitter: 0, umami: 0 },
  "소금": { sweet: 0, salty: 5, sour: 0, bitter: 0, umami: 0 },
  "후추": { sweet: 0, salty: 0, sour: 0, bitter: 2, umami: 0 },
  "굴소스": { sweet: 1, salty: 4, sour: 0, bitter: 0, umami: 5 },
  "케첩": { sweet: 2, salty: 1, sour: 2, bitter: 0, umami: 1 },
  "마요네즈": { sweet: 1, salty: 1, sour: 1, bitter: 0, umami: 1 },
  "다진마늘": { sweet: 0, salty: 0, sour: 0, bitter: 0, umami: 2 },
  "마늘": { sweet: 0, salty: 0, sour: 0, bitter: 0, umami: 2 },
  "청주": { sweet: 1, salty: 0, sour: 0, bitter: 0, umami: 0 },
}

export const TARGET_TASTE_BY_METHOD: Record<CookingMethod, { min: Taste5; max: Taste5 }> = {
  stir_fry: {
    min: { sweet: 1, salty: 2, sour: 0, bitter: 0, umami: 3 },
    max: { sweet: 3, salty: 4, sour: 2, bitter: 1, umami: 5 },
  },
  braise: {
    min: { sweet: 1, salty: 2, sour: 0, bitter: 0, umami: 3 },
    max: { sweet: 3, salty: 4, sour: 2, bitter: 1, umami: 5 },
  },
  soup: {
    min: { sweet: 0, salty: 2, sour: 0, bitter: 0, umami: 3 },
    max: { sweet: 2, salty: 4, sour: 2, bitter: 1, umami: 5 },
  },
  salad: {
    min: { sweet: 1, salty: 1, sour: 2, bitter: 0, umami: 1 },
    max: { sweet: 3, salty: 3, sour: 5, bitter: 1, umami: 3 },
  },
  grill: {
    min: { sweet: 0, salty: 2, sour: 0, bitter: 0, umami: 3 },
    max: { sweet: 2, salty: 4, sour: 2, bitter: 1, umami: 5 },
  },
  pan_fry: {
    min: { sweet: 0, salty: 2, sour: 0, bitter: 0, umami: 2 },
    max: { sweet: 2, salty: 4, sour: 2, bitter: 1, umami: 4 },
  },
  microwave: {
    min: { sweet: 0, salty: 1, sour: 0, bitter: 0, umami: 2 },
    max: { sweet: 2, salty: 3, sour: 2, bitter: 1, umami: 4 },
  },
}

export const FLAVOR_PATTERNS: FlavorPattern[] = [
  {
    id: "ganjang-butter",
    keyword: "간장버터",
    requiredSeasonings: ["간장", "버터"],
    preferredSeasonings: ["다진마늘", "후추", "설탕"],
    defaultSeasoningGuide: [
      { name: "간장", amount: 1, unit: "tbsp" },
      { name: "버터", amount: 8, unit: "g" },
      { name: "다진마늘", amount: 0.5, unit: "tbsp" },
      { name: "후추", amount: 0.2, unit: "tsp" },
    ],
    defaultSeasoningGuideVariants: [
      [
        { name: "간장", amount: 1, unit: "tbsp" },
        { name: "버터", amount: 8, unit: "g" },
        { name: "다진마늘", amount: 0.5, unit: "tbsp" },
      ],
      [
        { name: "간장", amount: 1.3, unit: "tbsp" },
        { name: "버터", amount: 6, unit: "g" },
        { name: "후추", amount: 0.2, unit: "tsp" },
      ],
      [
        { name: "간장", amount: 0.9, unit: "tbsp" },
        { name: "버터", amount: 10, unit: "g" },
        { name: "다진마늘", amount: 0.3, unit: "tbsp" },
      ],
    ],
    bestMethods: ["stir_fry", "pan_fry", "grill"],
    preferredTools: ["pan", "pot"],
  },
  {
    id: "gochujang-sweet",
    keyword: "고추장달큰",
    requiredSeasonings: ["고추장"],
    preferredSeasonings: ["설탕", "간장", "다진마늘"],
    defaultSeasoningGuide: [
      { name: "고추장", amount: 1, unit: "tbsp" },
      { name: "간장", amount: 0.5, unit: "tbsp" },
      { name: "설탕", amount: 0.5, unit: "tbsp" },
      { name: "다진마늘", amount: 0.5, unit: "tbsp" },
    ],
    defaultSeasoningGuideVariants: [
      [
        { name: "고추장", amount: 1, unit: "tbsp" },
        { name: "간장", amount: 0.5, unit: "tbsp" },
        { name: "설탕", amount: 0.5, unit: "tbsp" },
      ],
      [
        { name: "고추장", amount: 0.8, unit: "tbsp" },
        { name: "간장", amount: 0.7, unit: "tbsp" },
        { name: "다진마늘", amount: 0.4, unit: "tbsp" },
      ],
      [
        { name: "고추장", amount: 1.2, unit: "tbsp" },
        { name: "설탕", amount: 0.4, unit: "tbsp" },
        { name: "다진마늘", amount: 0.6, unit: "tbsp" },
      ],
    ],
    bestMethods: ["stir_fry", "braise", "pan_fry"],
    preferredTools: ["pan", "pot"],
  },
  {
    id: "soy-garlic",
    keyword: "간장마늘",
    requiredSeasonings: ["간장", "다진마늘"],
    preferredSeasonings: ["설탕", "참기름", "후추"],
    defaultSeasoningGuide: [
      { name: "간장", amount: 1.5, unit: "tbsp" },
      { name: "다진마늘", amount: 0.7, unit: "tbsp" },
      { name: "설탕", amount: 0.3, unit: "tbsp" },
      { name: "참기름", amount: 0.5, unit: "tsp" },
    ],
    defaultSeasoningGuideVariants: [
      [
        { name: "간장", amount: 1.5, unit: "tbsp" },
        { name: "다진마늘", amount: 0.7, unit: "tbsp" },
        { name: "참기름", amount: 0.5, unit: "tsp" },
      ],
      [
        { name: "간장", amount: 1.2, unit: "tbsp" },
        { name: "다진마늘", amount: 0.9, unit: "tbsp" },
        { name: "설탕", amount: 0.2, unit: "tbsp" },
      ],
      [
        { name: "간장", amount: 1.7, unit: "tbsp" },
        { name: "다진마늘", amount: 0.5, unit: "tbsp" },
        { name: "후추", amount: 0.2, unit: "tsp" },
      ],
    ],
    bestMethods: ["stir_fry", "braise", "pan_fry"],
    preferredTools: ["pan", "pot"],
  },
  {
    id: "kimchi-spicy",
    keyword: "김치칼칼",
    requiredSeasonings: ["고춧가루", "다진마늘"],
    preferredSeasonings: ["간장", "소금", "후추"],
    defaultSeasoningGuide: [
      { name: "고춧가루", amount: 0.7, unit: "tbsp" },
      { name: "다진마늘", amount: 0.6, unit: "tbsp" },
      { name: "간장", amount: 0.4, unit: "tbsp" },
    ],
    defaultSeasoningGuideVariants: [
      [
        { name: "고춧가루", amount: 0.7, unit: "tbsp" },
        { name: "다진마늘", amount: 0.6, unit: "tbsp" },
        { name: "간장", amount: 0.4, unit: "tbsp" },
      ],
      [
        { name: "고춧가루", amount: 0.9, unit: "tbsp" },
        { name: "다진마늘", amount: 0.5, unit: "tbsp" },
        { name: "간장", amount: 0.3, unit: "tbsp" },
      ],
      [
        { name: "고춧가루", amount: 0.6, unit: "tbsp" },
        { name: "다진마늘", amount: 0.7, unit: "tbsp" },
        { name: "소금", amount: 0.2, unit: "tsp" },
      ],
    ],
    bestMethods: ["soup", "braise"],
    preferredTools: ["pot", "pan"],
  },
  {
    id: "doenjang-savory",
    keyword: "된장감칠",
    requiredSeasonings: ["된장"],
    preferredSeasonings: ["다진마늘", "고춧가루", "국간장"],
    defaultSeasoningGuide: [
      { name: "된장", amount: 1, unit: "tbsp" },
      { name: "다진마늘", amount: 0.5, unit: "tbsp" },
      { name: "국간장", amount: 0.5, unit: "tbsp" },
    ],
    defaultSeasoningGuideVariants: [
      [
        { name: "된장", amount: 1, unit: "tbsp" },
        { name: "다진마늘", amount: 0.5, unit: "tbsp" },
        { name: "국간장", amount: 0.5, unit: "tbsp" },
      ],
      [
        { name: "된장", amount: 0.8, unit: "tbsp" },
        { name: "다진마늘", amount: 0.7, unit: "tbsp" },
        { name: "고춧가루", amount: 0.3, unit: "tbsp" },
      ],
      [
        { name: "된장", amount: 1.2, unit: "tbsp" },
        { name: "국간장", amount: 0.3, unit: "tbsp" },
        { name: "다진마늘", amount: 0.4, unit: "tbsp" },
      ],
    ],
    bestMethods: ["soup", "braise"],
    preferredTools: ["pot", "pan"],
  },
  {
    id: "basic-savory",
    keyword: "담백감칠",
    requiredSeasonings: ["소금"],
    preferredSeasonings: ["후추", "다진마늘", "간장"],
    defaultSeasoningGuide: [
      { name: "소금", amount: 0.3, unit: "tsp" },
      { name: "후추", amount: 0.2, unit: "tsp" },
      { name: "다진마늘", amount: 0.3, unit: "tbsp" },
    ],
    defaultSeasoningGuideVariants: [
      [
        { name: "소금", amount: 0.3, unit: "tsp" },
        { name: "후추", amount: 0.2, unit: "tsp" },
        { name: "다진마늘", amount: 0.3, unit: "tbsp" },
      ],
      [
        { name: "소금", amount: 0.2, unit: "tsp" },
        { name: "간장", amount: 0.4, unit: "tbsp" },
        { name: "다진마늘", amount: 0.2, unit: "tbsp" },
      ],
    ],
    bestMethods: ["stir_fry", "braise", "soup", "salad", "grill", "pan_fry", "microwave"],
    preferredTools: ["pan", "pot", "microwave", "airfryer"],
  },
  {
    id: "basic-spicy",
    keyword: "매콤기본",
    requiredSeasonings: ["고추장"],
    preferredSeasonings: ["다진마늘", "간장", "설탕"],
    defaultSeasoningGuide: [
      { name: "고추장", amount: 0.8, unit: "tbsp" },
      { name: "간장", amount: 0.4, unit: "tbsp" },
      { name: "다진마늘", amount: 0.4, unit: "tbsp" },
    ],
    defaultSeasoningGuideVariants: [
      [
        { name: "고추장", amount: 0.8, unit: "tbsp" },
        { name: "간장", amount: 0.4, unit: "tbsp" },
        { name: "다진마늘", amount: 0.4, unit: "tbsp" },
      ],
      [
        { name: "고추장", amount: 0.9, unit: "tbsp" },
        { name: "설탕", amount: 0.3, unit: "tbsp" },
        { name: "다진마늘", amount: 0.3, unit: "tbsp" },
      ],
    ],
    bestMethods: ["stir_fry", "braise", "grill", "pan_fry"],
    preferredTools: ["pan", "pot", "airfryer"],
  },
  {
    id: "basic-sour",
    keyword: "상큼기본",
    requiredSeasonings: ["식초"],
    preferredSeasonings: ["설탕", "소금", "후추"],
    defaultSeasoningGuide: [
      { name: "식초", amount: 0.8, unit: "tbsp" },
      { name: "설탕", amount: 0.3, unit: "tbsp" },
      { name: "소금", amount: 0.2, unit: "tsp" },
    ],
    defaultSeasoningGuideVariants: [
      [
        { name: "식초", amount: 0.8, unit: "tbsp" },
        { name: "설탕", amount: 0.3, unit: "tbsp" },
        { name: "소금", amount: 0.2, unit: "tsp" },
      ],
      [
        { name: "식초", amount: 0.6, unit: "tbsp" },
        { name: "설탕", amount: 0.4, unit: "tbsp" },
        { name: "후추", amount: 0.1, unit: "tsp" },
      ],
    ],
    bestMethods: ["salad", "pan_fry", "microwave"],
    preferredTools: ["pan", "microwave"],
  },
]
