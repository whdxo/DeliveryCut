/* eslint-disable no-console */
const admin = require("firebase-admin")

const COLLECTION = "foodCatalog"
const BATCH_SIZE = 400

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

const run = async () => {
  const dryRun = process.argv.includes("--dry-run")

  initAdmin()
  const db = admin.firestore()
  const snapshot = await db.collection(COLLECTION).get()

  console.log(`[normalize-food-catalog] totalDocs=${snapshot.size} dryRun=${dryRun}`)

  let batch = db.batch()
  let pending = 0
  let updated = 0

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() || {}
    const name = String(data.name ?? "").trim()
    if (!name) continue

    const parsed = parseDisplayAndState(name)

    const patch = {
      displayName: parsed.displayName,
      displayNameLower: normalize(parsed.displayName),
      state: parsed.state,
      subCategory: data.subCategory || parsed.displayName,
      subCategoryLower: normalize(String(data.subCategory || parsed.displayName)),
      nameLower: normalize(name),
      updatedAt: new Date().toISOString(),
    }

    updated += 1

    if (!dryRun) {
      batch.set(docSnap.ref, patch, { merge: true })
      pending += 1

      if (pending >= BATCH_SIZE) {
        await batch.commit()
        batch = db.batch()
        pending = 0
      }
    }
  }

  if (!dryRun && pending > 0) {
    await batch.commit()
  }

  console.log(`[normalize-food-catalog] updated=${updated}`)
}

run().catch((error) => {
  console.error("[normalize-food-catalog] failed", error)
  process.exit(1)
})

