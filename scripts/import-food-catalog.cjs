/* eslint-disable no-console */
const fs = require("fs")
const path = require("path")
const XLSX = require("xlsx")
const admin = require("firebase-admin")

const COLLECTION = "foodCatalog"
const BATCH_SIZE = 400

const CATEGORY_MAP = {
  meat: ["육류", "소고기", "쇠고기", "돼지고기", "닭고기", "가금류"],
  seafood: ["해산물", "수산물", "어패류", "생선", "갑각류"],
  vegetable: ["채소", "야채", "버섯", "나물", "과채"],
  processed: ["가공식품", "유제품", "두부", "곡류", "면류", "빵류", "콩류"],
  seasoning: ["조미료", "양념", "소스", "향신료", "장류"],
}

const STATE_KEYWORDS = [
  "생것",
  "삶은것",
  "삶은 것",
  "데친것",
  "구운것",
  "찐것",
  "볶은것",
  "말린것",
  "조림",
  "절임",
  "냉동",
]

const normalize = (value) => String(value ?? "").trim().toLowerCase()

const slugifyName = (name) =>
  normalize(name)
    .replace(/[\s\t\n\r]+/g, "-")
    .replace(/[\\/\[\]#?]/g, "")
    .slice(0, 120)

const cleanToken = (token) => String(token ?? "").replace(/^[-_\s]+/, "").trim()

const parseDisplayAndState = (name) => {
  const parts = String(name)
    .split(",")
    .map(cleanToken)
    .filter(Boolean)

  if (parts.length === 0) {
    return { displayName: String(name).trim(), state: null }
  }

  const statePart = [...parts].reverse().find((part) => STATE_KEYWORDS.some((k) => normalize(part).includes(normalize(k))))
  const nonStateParts = parts.filter((part) => !STATE_KEYWORDS.some((k) => normalize(part).includes(normalize(k))))

  let displayName = nonStateParts[0] || parts[0]
  if (nonStateParts.length >= 2) {
    displayName = nonStateParts[1]
  }

  return {
    displayName: displayName.trim(),
    state: statePart ? statePart.trim() : null,
  }
}

const inferCategoryByText = (text) => {
  const key = normalize(text)
  for (const [category, keywords] of Object.entries(CATEGORY_MAP)) {
    if (keywords.some((k) => key.includes(normalize(k)))) {
      return category
    }
  }
  return "other"
}

const resolveCredential = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (raw) {
    const parsed = JSON.parse(raw)
    return admin.credential.cert(parsed)
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.credential.applicationDefault()
  }
  throw new Error(
    "Firebase Admin credential is missing. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS."
  )
}

const initAdmin = () => {
  if (admin.apps.length > 0) return admin.app()
  return admin.initializeApp({
    credential: resolveCredential(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

const findHeaderIndex = (rows) => {
  for (let i = 0; i < Math.min(rows.length, 20); i += 1) {
    const row = rows[i] || []
    if (row.some((cell) => String(cell).includes("식품명")) && row.some((cell) => String(cell).includes("식품군"))) {
      return i
    }
  }
  return -1
}

const parseRowsFromSheet = (sheet) => {
  const rows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: "" })
  const headerIndex = findHeaderIndex(rows)
  if (headerIndex < 0) return []

  const header = rows[headerIndex]
  const idxGroup = header.findIndex((h) => String(h).includes("식품군"))
  const idxName = header.findIndex((h) => String(h).includes("식품명"))

  if (idxGroup < 0 || idxName < 0) return []

  const out = []
  for (let i = headerIndex + 2; i < rows.length; i += 1) {
    const row = rows[i]
    if (!row || row.length === 0) continue

    const name = String(row[idxName] ?? "").trim()
    if (!name) continue

    const group = String(row[idxGroup] ?? "").trim()

    out.push({ name, group })
  }
  return out
}

const mapItem = ({ name, group }) => {
  const category = inferCategoryByText(group || name)
  const parsed = parseDisplayAndState(name)

  return {
    id: slugifyName(name),
    data: {
      name,
      nameLower: normalize(name),
      displayName: parsed.displayName,
      state: parsed.state,
      category,
      subCategory: parsed.displayName,
      defaultUnit: category === "seasoning" ? "ml" : category === "meat" || category === "seafood" ? "g" : "count",
      source: "xlsx",
      updatedAt: new Date().toISOString(),
    },
  }
}

const run = async () => {
  const args = process.argv.slice(2)
  const dryRun = args.includes("--dry-run")
  const inputPath = args.find((arg) => !arg.startsWith("--")) || process.env.FOOD_XLSX_PATH

  if (!inputPath) {
    throw new Error("Usage: npm run import:foods -- <xlsx-path> [--dry-run]")
  }

  const absPath = path.resolve(inputPath)
  if (!fs.existsSync(absPath)) {
    throw new Error(`XLSX file not found: ${absPath}`)
  }

  const workbook = XLSX.readFile(absPath)

  let selectedSheetName = null
  let parsedRows = []

  for (const candidate of workbook.SheetNames) {
    const sheet = workbook.Sheets[candidate]
    const parsed = parseRowsFromSheet(sheet)
    if (parsed.length > 0) {
      selectedSheetName = candidate
      parsedRows = parsed
      break
    }
  }

  if (!selectedSheetName) {
    throw new Error("No parsable data sheet found")
  }

  const mapped = parsedRows.map(mapItem).filter((item) => !!item.id)

  const dedupe = new Map()
  for (const item of mapped) {
    if (!dedupe.has(item.id)) dedupe.set(item.id, item)
  }

  const items = [...dedupe.values()]

  console.log(`[import-food-catalog] sheet=${selectedSheetName} rows=${parsedRows.length} mapped=${items.length} dryRun=${dryRun}`)

  if (dryRun) return

  initAdmin()
  const db = admin.firestore()

  let batch = db.batch()
  let pending = 0
  let committed = 0

  for (const item of items) {
    const ref = db.collection(COLLECTION).doc(item.id)
    batch.set(ref, item.data, { merge: true })
    pending += 1

    if (pending >= BATCH_SIZE) {
      await batch.commit()
      committed += pending
      batch = db.batch()
      pending = 0
    }
  }

  if (pending > 0) {
    await batch.commit()
    committed += pending
  }

  console.log(`[import-food-catalog] completed upserted=${committed}`)
}

run().catch((error) => {
  console.error("[import-food-catalog] failed", error)
  process.exit(1)
})
