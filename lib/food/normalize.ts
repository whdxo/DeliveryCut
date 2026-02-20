const NAME_ALIAS: Record<string, string> = {
  진간장: "간장",
  국간장: "간장",
  양조간장: "간장",
  맛간장: "간장",
  조선간장: "간장",
  간장소스: "간장",

  고추장양념: "고추장",
  초고추장: "고추장",
  쌈장: "된장",
  된장찌개양념: "된장",

  무염버터: "버터",
  가염버터: "버터",
  버터소스: "버터",

  식용유: "식용유",
  올리브유: "식용유",
  카놀라유: "식용유",
  포도씨유: "식용유",

  굵은소금: "소금",
  천일염: "소금",
  꽃소금: "소금",

  후추가루: "후추",
  다진마늘: "마늘",
  마늘가루: "마늘",

  백설탕: "설탕",
  황설탕: "설탕",
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

export const normalizeFoodKey = (value: string): string => {
  return value.toLowerCase().replace(/[\s,()\-_/]/g, "")
}

export const canonicalizeFoodName = (value: string): string => {
  const trimmed = value.trim()
  if (!trimmed) return ""

  const key = normalizeFoodKey(trimmed)

  for (const [alias, canonical] of Object.entries(NAME_ALIAS)) {
    const aliasKey = normalizeFoodKey(alias)
    if (key === aliasKey || key.includes(aliasKey)) {
      return canonical
    }
  }

  return trimmed
}

export const isSeasoningLike = (value: string): boolean => {
  const canonical = canonicalizeFoodName(value)
  if (!canonical) return false
  if (SEASONING_CANONICAL.has(canonical)) return true

  const key = normalizeFoodKey(canonical)
  return /(간장|고추장|된장|버터|소금|후추|식초|설탕|기름|굴소스|케첩|마요네즈)/.test(key)
}

export const foodNameEquals = (a: string, b: string): boolean => {
  const ak = normalizeFoodKey(canonicalizeFoodName(a))
  const bk = normalizeFoodKey(canonicalizeFoodName(b))
  if (!ak || !bk) return false
  return ak === bk
}

export const foodNameIncludes = (target: string, query: string): boolean => {
  const tk = normalizeFoodKey(canonicalizeFoodName(target))
  const qk = normalizeFoodKey(canonicalizeFoodName(query))
  if (!tk || !qk) return false
  return tk === qk
}
