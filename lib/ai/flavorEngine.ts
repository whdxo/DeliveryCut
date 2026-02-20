import type {
  CookingMethod,
  FlavorDesign,
  FlavorPatternCandidate,
  FlavorScoreBreakdown,
  IngredientAmount,
  MenuOption,
  SeasoningAmount,
  Step,
  Taste5,
  Tool,
} from "@/lib/types/api"
import { canonicalizeFoodName, foodNameIncludes, isSeasoningLike, normalizeFoodKey } from "@/lib/food/normalize"
import { FLAVOR_PATTERNS, PANTRY_TASTE_MAP, TARGET_TASTE_BY_METHOD, type FlavorPattern } from "./flavorCatalog"

interface EvaluateInput {
  ingredients: string[]
  pantry: string[]
  cookingTools: Tool[]
  menu: Pick<MenuOption, "title" | "steps" | "ingredients" | "timeMin">
}

const TASTE_KEYS = ["sweet", "salty", "sour", "bitter", "umami"] as const
const FALLBACK_PRIORITY: Record<CookingMethod, string[]> = {
  salad: ["basic-sour", "basic-savory", "basic-spicy"],
  stir_fry: ["basic-savory", "basic-spicy", "basic-sour"],
  braise: ["basic-savory", "basic-spicy", "basic-sour"],
  grill: ["basic-spicy", "basic-savory", "basic-sour"],
  pan_fry: ["basic-spicy", "basic-savory", "basic-sour"],
  soup: ["basic-savory", "basic-sour", "basic-spicy"],
  microwave: ["basic-savory", "basic-sour", "basic-spicy"],
}

const clamp5 = (value: number) => Math.max(0, Math.min(5, Math.round(value)))
const round1 = (value: number) => Number(value.toFixed(1))

const isBasicPattern = (patternId: string) => patternId.startsWith("basic-")

const hashString = (value: string) => {
  let hash = 0
  for (let i = 0; i < value.length; i += 1) {
    hash = (hash * 31 + value.charCodeAt(i)) >>> 0
  }
  return hash
}

const getSeasoningGuides = (pattern: FlavorPattern) => {
  if (pattern.defaultSeasoningGuideVariants && pattern.defaultSeasoningGuideVariants.length > 0) {
    return pattern.defaultSeasoningGuideVariants
  }
  return [pattern.defaultSeasoningGuide]
}

const pickSeasoningGuide = (pattern: FlavorPattern, seedKey: string) => {
  const guides = getSeasoningGuides(pattern)
  const index = hashString(`${pattern.id}:${seedKey}`) % guides.length
  return guides[index]
}

const hasIngredientKeyword = (ingredients: string[], keywords: string[]) => {
  const merged = normalizeFoodKey(ingredients.join(" "))
  return keywords.some((keyword) => merged.includes(normalizeFoodKey(keyword)))
}

const getIngredientPatternBonus = (
  pattern: FlavorPattern,
  ingredients: string[],
  method: CookingMethod,
  tools: Tool[]
): number => {
  const hasKimchi = hasIngredientKeyword(ingredients, ["김치"])
  const hasPork = hasIngredientKeyword(ingredients, ["돼지고기", "삼겹살", "목살"])

  if (hasKimchi && pattern.id === "kimchi-spicy") {
    let bonus = 20
    if (method === "soup") bonus += 8
    if (tools.includes("pot")) bonus += 5
    if (hasPork) bonus += 5
    return bonus
  }

  if (hasKimchi && pattern.id === "doenjang-savory") return -14
  if (!hasKimchi && pattern.id === "kimchi-spicy") return -10

  return 0
}

const getTitlePatternBonus = (title: string, pattern: FlavorPattern): number => {
  const titleKey = normalizeFoodKey(title)
  if (!titleKey) return 0

  const hasRequiredKeyword = pattern.requiredSeasonings.some((seasoning) => {
    const seasoningKey = normalizeFoodKey(canonicalizeFoodName(seasoning))
    return seasoningKey && (titleKey.includes(seasoningKey) || seasoningKey.includes(titleKey))
  })

  return hasRequiredKeyword ? 15 : 0
}

const inferCookingMethod = (
  title: string,
  ingredients: string[],
  tools: Tool[],
  timeMin: number
): CookingMethod => {
  const key = normalizeFoodKey(title)
  const ingredientKey = normalizeFoodKey(ingredients.join(" "))

  if (key.includes("국") || key.includes("찌개") || key.includes("탕")) return "soup"
  if (key.includes("조림") || key.includes("찜")) return "braise"
  if (key.includes("샐러드") || key.includes("무침")) return "salad"
  if (key.includes("구이")) return "grill"
  if (key.includes("전") || key.includes("부침")) return "pan_fry"
  if (tools.includes("microwave")) return "microwave"

  if (ingredientKey.includes("달걀") || ingredientKey.includes("계란")) return "pan_fry"
  if (timeMin <= 7 && tools.includes("pan")) return "stir_fry"

  return "stir_fry"
}

const tasteFromSeasonings = (seasonings: SeasoningAmount[]): Taste5 => {
  const total = { sweet: 0, salty: 0, sour: 0, bitter: 0, umami: 0 }
  let weightSum = 0

  for (const seasoning of seasonings) {
    const canonical = canonicalizeFoodName(seasoning.name)
    const taste = PANTRY_TASTE_MAP[canonical] ?? PANTRY_TASTE_MAP[seasoning.name]
    if (!taste) continue

    const unitWeight = { tsp: 5, tbsp: 15, ml: 1, g: 1 }[seasoning.unit] || 1;
    const weight = Math.max(0.2, seasoning.amount * unitWeight);
    weightSum += weight

    total.sweet += taste.sweet * weight
    total.salty += taste.salty * weight
    total.sour += taste.sour * weight
    total.bitter += taste.bitter * weight
    total.umami += taste.umami * weight
  }

  if (weightSum === 0) return { sweet: 1, salty: 1, sour: 0, bitter: 0, umami: 1 }

  return {
    sweet: clamp5(total.sweet / weightSum),
    salty: clamp5(total.salty / weightSum),
    sour: clamp5(total.sour / weightSum),
    bitter: clamp5(total.bitter / weightSum),
    umami: clamp5(total.umami / weightSum),
  }
}

const calcTasteTargetScore = (tasteBalance: Taste5, method: CookingMethod): number => {
  const target = TARGET_TASTE_BY_METHOD[method]
  let distance = 0

  for (const key of TASTE_KEYS) {
    const value = tasteBalance[key]
    const min = target.min[key]
    const max = target.max[key]

    if (value < min) distance += min - value
    else if (value > max) distance += value - max
  }

  const normalized = Math.max(0, 1 - distance / 25)
  return round1(normalized * 100)
}

const SEASONING_CANONICAL = new Set([
  "간장",
  "고추장",
  "된장",
  "버터",
  "소금",
  "후추",
  "식초",
  "설탕",
  "참기름",
  "들기름",
  "굴소스",
  "케첩",
  "마요네즈",
  "식용유",
])

const toFractionText = (value: number): string | null => {
  const rounded = Number(value.toFixed(2))
  if (rounded === 0.25) return "1/4"
  if (rounded === 0.5) return "1/2"
  if (rounded === 0.75) return "3/4"
  return null
}

const formatIngredientAmountLabel = (item: IngredientAmount) => {
  if (item.unit === "count") {
    const fraction = toFractionText(item.amount)
    return `${item.name} ${fraction ?? item.amount}개`
  }

  return `${item.name} ${item.amount}${item.unit}`
}

const estimateIngredientAmount = (ingredient: string): IngredientAmount | null => {
  const canonical = canonicalizeFoodName(ingredient)
  const key = normalizeFoodKey(canonical)

  if (isSeasoningLike(canonical) || SEASONING_CANONICAL.has(canonical)) return null

  if (/(돼지고기|삼겹살|목살|소고기|한우|닭고기|닭다리|닭가슴살|고기|새우|오징어|문어|낙지|생선|연어|참치|고등어)/.test(key)) {
    return { name: ingredient, amount: 200, unit: "g" }
  }

  if (/(두부)/.test(key)) return { name: ingredient, amount: 150, unit: "g" }

  if (/(양파)/.test(key)) return { name: ingredient, amount: 0.5, unit: "count" }
  if (/(당근)/.test(key)) return { name: ingredient, amount: 0.25, unit: "count" }
  if (/(대파|쪽파|실파|파)/.test(key)) return { name: ingredient, amount: 1, unit: "count" }
  if (/(마늘)/.test(key)) return { name: ingredient, amount: 3, unit: "count" }

  if (/(계란|달걀)/.test(key)) return { name: ingredient, amount: 2, unit: "count" }
  if (/(물|육수|브로스)/.test(key)) return { name: ingredient, amount: 500, unit: "ml" }

  return { name: ingredient, amount: 1, unit: "count" }
}

const normalizeIngredientAmounts = (items: IngredientAmount[]): IngredientAmount[] => {
  const byKey = new Map<string, IngredientAmount>()

  for (const item of items) {
    const canonical = canonicalizeFoodName(item.name)
    const key = normalizeFoodKey(canonical)
    if (!key) continue

    const current = byKey.get(key)
    if (!current) {
      byKey.set(key, { ...item, name: canonical })
      continue
    }

    if (current.unit !== item.unit) {
      // 단위가 충돌하면 첫 단위를 유지해 과도한 변환을 피한다.
      continue
    }

    current.amount = Number((current.amount + item.amount).toFixed(2))
  }

  return [...byKey.values()]
}

const removeSeasoningOverlap = (ingredients: IngredientAmount[], seasonings: SeasoningAmount[]): IngredientAmount[] => {
  const seasoningKeys = new Set(
    seasonings.map((item) => normalizeFoodKey(canonicalizeFoodName(item.name))).filter(Boolean)
  )

  return ingredients.filter((item) => {
    const canonical = canonicalizeFoodName(item.name)
    const key = normalizeFoodKey(canonical)
    if (!key) return false

    if (isSeasoningLike(canonical) || SEASONING_CANONICAL.has(canonical)) return false

    for (const seasoningKey of seasoningKeys) {
      if (key === seasoningKey || key.includes(seasoningKey) || seasoningKey.includes(key)) {
        return false
      }
    }

    return true
  })
}

const buildIngredientAmounts = (ingredients: string[]): IngredientAmount[] => {
  const estimated = ingredients
    .map((name) => name.trim())
    .filter(Boolean)
    .slice(0, 8)
    .map(estimateIngredientAmount)
    .filter((item): item is IngredientAmount => item !== null)

  return normalizeIngredientAmounts(estimated)
}

const completeSeasoningAmounts = (pattern: FlavorPattern, pantry: string[], seedKey: string): SeasoningAmount[] => {
  const selectedGuide = pickSeasoningGuide(pattern, seedKey)

  const rows = selectedGuide.map((guide) => ({ ...guide }))

  if (rows.length >= 2) return rows

  const fallback: SeasoningAmount[] = []
  if (pantry.some((item) => foodNameIncludes(item, "간장"))) fallback.push({ name: "간장", amount: 1, unit: "tbsp" })
  if (pantry.some((item) => foodNameIncludes(item, "소금"))) fallback.push({ name: "소금", amount: 0.2, unit: "tsp" })
  if (pantry.some((item) => foodNameIncludes(item, "마늘"))) fallback.push({ name: "다진마늘", amount: 0.4, unit: "tbsp" })
  if (pantry.some((item) => foodNameIncludes(item, "후추"))) fallback.push({ name: "후추", amount: 0.2, unit: "tsp" })

  const merged = rows.length > 0 ? [...rows, ...fallback].slice(0, 4) : fallback.slice(0, 4)
  if (merged.length === 0) merged.push({ name: "소금", amount: 0.2, unit: "tsp" })

  return merged
}

const scorePattern = (
  pattern: FlavorPattern,
  pantry: string[],
  ingredients: string[],
  method: CookingMethod,
  tools: Tool[],
  menuTitle: string
): { breakdown: FlavorScoreBreakdown; reason: string } => {
  const requiredTotal = pattern.requiredSeasonings.length
  const requiredHit = pattern.requiredSeasonings.filter((s) => pantry.some((item) => foodNameIncludes(item, s))).length
  const requiredRatio = requiredTotal === 0 ? 1 : requiredHit / requiredTotal

  const preferredTotal = pattern.preferredSeasonings.length
  const preferredHit = pattern.preferredSeasonings.filter((s) => pantry.some((item) => foodNameIncludes(item, s))).length
  const preferredRatio = preferredTotal === 0 ? 1 : preferredHit / preferredTotal

  const availabilityScore = round1((requiredRatio * 0.7 + preferredRatio * 0.3) * 100)
  const methodFitScore = round1((pattern.bestMethods.includes(method) ? 1 : 0.15) * 100)

  const seasoningAmounts = completeSeasoningAmounts(pattern, pantry, menuTitle)
  const tasteBalance = tasteFromSeasonings(seasoningAmounts)
  const tasteTargetScore = calcTasteTargetScore(tasteBalance, method)

  const toolBonus = pattern.preferredTools?.some((tool) => tools.includes(tool)) ? 3 : 0
  const ingredientBonus = ingredients.length > 0 ? 2 : 0
  const titleBonus = getTitlePatternBonus(menuTitle, pattern)
  const ingredientPatternBonus = getIngredientPatternBonus(pattern, ingredients, method, tools)

  let totalScore = round1(
    availabilityScore * 0.45 + methodFitScore * 0.3 + tasteTargetScore * 0.25 + toolBonus + ingredientBonus + titleBonus + ingredientPatternBonus
  )

  if (isBasicPattern(pattern.id)) {
    totalScore = round1(totalScore * 0.75)
  }

  const reason = [
    `필수 조미료 ${requiredHit}/${requiredTotal || 0}`,
    `method 적합도 ${Math.round(methodFitScore)}점`,
    `target taste 근접도 ${Math.round(tasteTargetScore)}점`,
    titleBonus > 0 ? `제목 키워드 보너스 +${titleBonus}` : null,
    ingredientPatternBonus !== 0 ? `재료-패턴 보정 ${ingredientPatternBonus > 0 ? `+${ingredientPatternBonus}` : ingredientPatternBonus}` : null,
    isBasicPattern(pattern.id) ? "basic 패널티 적용" : null,
  ].filter(Boolean).join(" · ")

  return {
    breakdown: {
      availabilityScore,
      methodFitScore,
      tasteTargetScore,
      totalScore,
    },
    reason,
  }
}

type ScoredPattern = {
  pattern: FlavorPattern
  reason: string
  breakdown: FlavorScoreBreakdown
}

const selectTopCandidates = (
  scoredRows: ScoredPattern[],
  method: CookingMethod,
  pantry: string[],
  ingredients: string[],
  tools: Tool[],
  menuTitle: string
): ScoredPattern[] => {
  const nonBasicRows = scoredRows.filter((row) => !isBasicPattern(row.pattern.id))

  const primaryNonBasic = nonBasicRows
    .filter((row) => row.breakdown.totalScore >= 35 || row.pattern.bestMethods.includes(method))
    .slice(0, 3)

  if (primaryNonBasic.length > 0) {
    const selected = [...primaryNonBasic]
    const seen = new Set(selected.map((row) => row.pattern.id))

    for (const row of nonBasicRows) {
      if (selected.length >= 3) break
      if (seen.has(row.pattern.id)) continue
      selected.push(row)
      seen.add(row.pattern.id)
    }

    return selected.slice(0, 3)
  }

  const selected: ScoredPattern[] = []
  const seen = new Set<string>()

  for (const fallbackId of FALLBACK_PRIORITY[method]) {
    if (selected.length >= 3) break
    if (seen.has(fallbackId)) continue

    const pattern = FLAVOR_PATTERNS.find((item) => item.id === fallbackId)
    if (!pattern) continue

    const { breakdown, reason } = scorePattern(pattern, pantry, ingredients, method, tools, menuTitle)
    selected.push({ pattern, breakdown, reason: `${reason} · fallback` })
    seen.add(pattern.id)
  }

  if (selected.length < 3) {
    for (const row of scoredRows) {
      if (selected.length >= 3) break
      if (seen.has(row.pattern.id)) continue
      selected.push(row)
      seen.add(row.pattern.id)
    }
  }

  return selected.slice(0, 3)
}

type StepContext = {
  ingredientText: string
  seasoningText: string
  patternKeyword: string
}

const createBaseSteps = (method: CookingMethod, context: StepContext): Step[] => {
  const templates: Record<CookingMethod, Array<(ctx: StepContext) => Omit<Step, "n">[]>> = {
    stir_fry: [
      (ctx) => [
        { text: `${ctx.ingredientText}를 균일하게 썰고 양념(${ctx.seasoningText})을 미리 섞습니다.`, timerMin: 2, why: "준비를 먼저 하면 조리 중 당황하지 않아요." },
        { text: "팬을 중강불로 예열한 뒤 기름을 둘러 향채를 먼저 볶습니다.", heat: "high", timerMin: 1 },
        { text: "주재료를 넣고 강불에서 빠르게 볶아 수분을 날립니다.", heat: "high", timerMin: 2, why: "센불로 볶아야 물기가 덜 생깁니다." },
        { text: `${ctx.patternKeyword} 양념을 넣고 중불로 낮춰 코팅합니다.`, heat: "medium", timerMin: 2 },
        { text: "불을 끄고 간을 확인해 소금/후추로 마무리합니다.", why: "마지막 간 조절이 전체 밸런스를 결정합니다." },
      ],
      (ctx) => [
        { text: `${ctx.ingredientText}를 손질하고 양념(${ctx.seasoningText})을 1차로 준비합니다.`, timerMin: 2 },
        { text: "팬을 충분히 달군 뒤 기름을 두르고 주재료를 바로 투입합니다.", heat: "high", timerMin: 1 },
        { text: "재료 겉면이 익으면 중불로 내리고 양념을 넣어 볶습니다.", heat: "medium", timerMin: 2, why: "양념이 타지 않도록 불을 낮춰요." },
        { text: "필요 시 물 2큰술을 넣어 농도를 맞춘 뒤 1분 더 익힙니다.", heat: "low", timerMin: 1 },
      ],
    ],
    braise: [
      (ctx) => [
        { text: `${ctx.ingredientText}를 준비하고 양념(${ctx.seasoningText})을 섞습니다.`, timerMin: 2 },
        { text: "팬에 주재료를 1분 볶아 표면을 잡습니다.", heat: "medium", timerMin: 1 },
        { text: "양념과 물을 넣고 중불에서 졸입니다.", heat: "medium", timerMin: 4, why: "졸이는 동안 재료에 간이 배어요." },
        { text: "국물이 자작해지면 약불로 1~2분 더 농축합니다.", heat: "low", timerMin: 2 },
      ],
      (ctx) => [
        { text: `${ctx.ingredientText}를 먹기 좋게 썰고 양념(${ctx.seasoningText})을 계량합니다.`, timerMin: 2 },
        { text: "냄비에 재료와 양념을 넣고 중불에서 끓입니다.", heat: "medium", timerMin: 3 },
        { text: "끓기 시작하면 약불로 줄여 졸입니다.", heat: "low", timerMin: 4, why: "약불로 천천히 졸여야 짠맛이 튀지 않아요." },
        { text: "마무리로 간을 확인해 소량 조절합니다.", why: "졸임 요리는 끝 간이 중요합니다." },
      ],
    ],
    soup: [
      (ctx) => [
        { text: `${ctx.ingredientText}를 손질하고 국물 양념(${ctx.seasoningText})을 준비합니다.`, timerMin: 2 },
        { text: "냄비에 물과 주재료를 넣고 중불로 끓입니다.", heat: "medium", timerMin: 4 },
        { text: `${ctx.patternKeyword} 양념을 넣고 2분 더 끓입니다.`, heat: "medium", timerMin: 2 },
        { text: "거품을 걷고 약불에서 1분 안정화 후 간을 봅니다.", heat: "low", timerMin: 1, why: "마무리 안정화로 국물 맛이 깔끔해집니다." },
      ],
      (ctx) => [
        { text: `${ctx.ingredientText}를 같은 크기로 썰어 익힘 편차를 줄입니다.`, timerMin: 2, why: "크기가 다르면 일부가 덜 익어요." },
        { text: "냄비를 중불로 올리고 향채를 먼저 짧게 가열합니다.", heat: "medium", timerMin: 1 },
        { text: `물과 재료를 넣어 끓인 뒤 양념(${ctx.seasoningText})을 넣습니다.`, heat: "medium", timerMin: 4 },
        { text: "마지막 1분 약불로 두어 맛을 정리합니다.", heat: "low", timerMin: 1 },
      ],
    ],
    salad: [
      (ctx) => [
        { text: `${ctx.ingredientText}를 물기 없이 준비합니다.`, timerMin: 2, why: "물기가 많으면 드레싱이 묽어져요." },
        { text: `드레싱(${ctx.seasoningText})을 먼저 섞어 맛을 봅니다.`, timerMin: 1 },
        { text: "재료에 드레싱을 넣고 가볍게 버무립니다.", heat: "low", timerMin: 1 },
        { text: "간을 확인해 산미/단맛을 소량 조정합니다.", why: "샐러드는 마지막 균형 조정이 핵심입니다." },
      ],
      (ctx) => [
        { text: `${ctx.ingredientText}를 한입 크기로 썰고 볼에 담습니다.`, timerMin: 2 },
        { text: `소스(${ctx.seasoningText})를 따로 만들어 농도를 맞춥니다.`, timerMin: 1 },
        { text: "먹기 직전에 소스를 넣고 20초만 버무립니다.", heat: "low", timerMin: 1, why: "오래 버무리면 식감이 죽어요." },
        { text: `필요하면 ${ctx.patternKeyword} 풍미 재료를 소량 추가합니다.`, why: "향 보강으로 완성도를 높입니다." },
      ],
    ],
    grill: [
      (ctx) => [
        { text: `${ctx.ingredientText}에 양념(${ctx.seasoningText})을 고루 바릅니다.`, timerMin: 2 },
        { text: "팬/그릴을 강불로 예열합니다.", heat: "high", timerMin: 1 },
        { text: "재료를 올려 겉면을 먼저 구워 육즙을 잡습니다.", heat: "high", timerMin: 2, why: "초기 고온이 식감을 좌우합니다." },
        { text: "중불로 낮춰 속까지 익힌 뒤 간을 정리합니다.", heat: "medium", timerMin: 2 },
      ],
      (ctx) => [
        { text: `${ctx.ingredientText}를 두께를 맞춰 준비합니다.`, timerMin: 2 },
        { text: "강불에 1차 시어링 후 뒤집습니다.", heat: "high", timerMin: 2 },
        { text: `${ctx.patternKeyword} 양념을 얇게 덧발라 2차로 굽습니다.`, heat: "medium", timerMin: 2 },
        { text: "불을 끄고 1분 레스팅 후 제공합니다.", timerMin: 1, why: "레스팅하면 육즙이 안정됩니다." },
      ],
    ],
    pan_fry: [
      (ctx) => [
        { text: `${ctx.ingredientText}를 준비하고 팬프라이 양념(${ctx.seasoningText})을 맞춥니다.`, timerMin: 2 },
        { text: "팬을 중불로 예열해 기름을 얇게 펴줍니다.", heat: "medium", timerMin: 1 },
        { text: "재료를 올려 앞뒤로 노릇하게 굽습니다.", heat: "medium", timerMin: 3 },
        { text: `마지막에 ${ctx.patternKeyword} 포인트 양념으로 맛을 보정합니다.`, why: "마지막 보정으로 풍미를 또렷하게 합니다." },
      ],
      (ctx) => [
        { text: `${ctx.ingredientText}를 얇게 펴고 양념(${ctx.seasoningText})을 입힙니다.`, timerMin: 2 },
        { text: "중강불에서 1차로 굽고 뒤집습니다.", heat: "high", timerMin: 2 },
        { text: "중불로 낮춰 내부까지 익힙니다.", heat: "medium", timerMin: 2, why: "겉만 타는 것을 방지합니다." },
        { text: "간을 확인해 소금/후추로 마무리합니다.", why: "팬요리는 최종 간 조절이 품질을 좌우합니다." },
      ],
    ],
    microwave: [
      (ctx) => [
        { text: `${ctx.ingredientText}를 내열 용기에 담고 양념(${ctx.seasoningText})을 섞습니다.`, timerMin: 2 },
        { text: "전자레인지 중강으로 2분 가열 후 한 번 섞습니다.", heat: "medium", timerMin: 2 },
        { text: "다시 1~2분 추가 가열해 익힘을 맞춥니다.", heat: "medium", timerMin: 2, why: "중간 교반이 고른 익힘에 중요합니다." },
        { text: `마지막에 ${ctx.patternKeyword} 풍미를 소량 보정합니다.`, timerMin: 1 },
      ],
      (ctx) => [
        { text: `${ctx.ingredientText}를 균일하게 자른 뒤 용기에 담습니다.`, timerMin: 2 },
        { text: `양념(${ctx.seasoningText})을 넣고 뚜껑/랩으로 수분을 유지합니다.`, timerMin: 1 },
        { text: "2분 가열 후 상태 확인, 필요 시 1분씩 추가합니다.", heat: "medium", timerMin: 3, why: "전자레인지는 과가열이 빠릅니다." },
        { text: "완료 후 30초 뜸 들여 잔열로 마무리합니다.", timerMin: 1 },
      ],
    ],
  }

  const methodTemplates = templates[method]
  const keywordSeed = normalizeFoodKey(context.patternKeyword).length
  const index = keywordSeed % methodTemplates.length
  const selected = methodTemplates[index](context)

  return selected.map((step, stepIndex) => ({ ...step, n: stepIndex + 1 }))
}

const ensureStepMetadataCoverage = (steps: Step[]) => {
  const minRequired = Math.ceil(steps.length * 0.6)
  let covered = steps.filter((step) => step.heat || step.timerMin !== undefined || step.why).length
  if (covered >= minRequired) return steps

  let needed = minRequired - covered
  return steps.map((step) => {
    if (needed <= 0) return step
    if (step.heat || step.timerMin !== undefined || step.why) return step
    needed -= 1
    covered += 1
    return {
      ...step,
      timerMin: 1,
      why: "작업 순서를 명확히 해 실수를 줄입니다.",
    }
  })
}

const buildRecipeStepsV2 = (
  menu: Pick<MenuOption, "steps" | "ingredients">,
  method: CookingMethod,
  patternKeyword: string,
  seasonings: SeasoningAmount[],
  ingredientAmounts: IngredientAmount[]
): Step[] => {
  const ingredientText = ingredientAmounts
    .slice(0, 3)
    .map((item) => formatIngredientAmountLabel(item))
    .join(", ")

  const seasoningText = seasonings
    .map((item) => `${item.name} ${item.amount}${item.unit}`)
    .join(", ")

  const base = createBaseSteps(method, {
    ingredientText: ingredientText || "주재료",
    seasoningText: seasoningText || "기본 간",
    patternKeyword,
  })

  if (base.length < 4) {
    for (const original of menu.steps) {
      if (base.length >= 4) break
      base.push({
        n: base.length + 1,
        text: original,
        timerMin: 1,
      })
    }
  }

  const sliced = base.slice(0, 7).map((step, index) => ({ ...step, n: index + 1 }))
  return ensureStepMetadataCoverage(sliced)
}
export const evaluateFlavorPatterns = ({ ingredients, pantry, cookingTools, menu }: EvaluateInput): FlavorDesign => {
  const method = inferCookingMethod(menu.title, ingredients, cookingTools, menu.timeMin)

  const scoredRows = FLAVOR_PATTERNS.map((pattern) => {
    const { breakdown, reason } = scorePattern(pattern, pantry, ingredients, method, cookingTools, menu.title)
    return {
      pattern,
      reason,
      breakdown,
    }
  }).sort((a, b) => b.breakdown.totalScore - a.breakdown.totalScore)

  const selectedRows = selectTopCandidates(scoredRows, method, pantry, ingredients, cookingTools, menu.title)

  const topCandidates: FlavorPatternCandidate[] = selectedRows.map((row) => ({
    id: row.pattern.id,
    keyword: row.pattern.keyword,
    score: row.breakdown.totalScore,
    reason: row.reason,
    scores: row.breakdown,
  }))

  const selected = selectedRows[0]
  const seasoningAmounts = completeSeasoningAmounts(selected.pattern, pantry, menu.title)
  const ingredientAmounts = buildIngredientAmounts(menu.ingredients)
  const tasteBalance = tasteFromSeasonings(seasoningAmounts)
  const recipeStepsV2 = buildRecipeStepsV2(menu, method, selected.pattern.keyword, seasoningAmounts, ingredientAmounts)

  return {
    pattern: {
      id: selected.pattern.id,
      keyword: selected.pattern.keyword,
    },
    method,
    topCandidates: topCandidates.slice(0, 3) as [FlavorPatternCandidate, FlavorPatternCandidate, FlavorPatternCandidate],
    seasoningAmounts,
    ingredientAmounts,
    tasteBalance,
    targetTaste: TARGET_TASTE_BY_METHOD[method].max,
    scoreBreakdown: selected.breakdown,
    recipeSteps: recipeStepsV2.map((step) => step.text),
    recipeStepsV2,
  }
}

export const applyFlavorDesignToMenu = (menu: MenuOption, pantry: string[], tools: Tool[]): MenuOption => {
  const flavorDesign = evaluateFlavorPatterns({
    ingredients: menu.ingredients,
    pantry,
    cookingTools: tools,
    menu,
  })

  return {
    ...menu,
    flavorDesign,
  }
}

export const __test__ = {
  inferCookingMethod,
  selectTopCandidates,
  createBaseSteps,
  ensureStepMetadataCoverage,
  normalizeIngredientAmounts,
  removeSeasoningOverlap,
  formatIngredientAmountLabel,
}





