/* eslint-disable no-console */
const admin = require("firebase-admin")

const COLLECTION = "foodCatalog"
const BATCH_SIZE = 400

const normalize = (value) => String(value ?? "").trim().toLowerCase()

const resolveCredential = () => {
  const raw = process.env.FIREBASE_SERVICE_ACCOUNT_JSON
  if (raw) {
    const parsed = JSON.parse(raw)
    return admin.credential.cert(parsed)
  }
  if (process.env.GOOGLE_APPLICATION_CREDENTIALS) {
    return admin.credential.applicationDefault()
  }
  throw new Error("Firebase Admin credential is missing. Set FIREBASE_SERVICE_ACCOUNT_JSON or GOOGLE_APPLICATION_CREDENTIALS.")
}

const initAdmin = () => {
  if (admin.apps.length > 0) return admin.app()
  return admin.initializeApp({
    credential: resolveCredential(),
    projectId: process.env.NEXT_PUBLIC_FIREBASE_PROJECT_ID,
  })
}

const sourceRank = (source) => {
  if (source === "xlsx") return 0
  if (source === "mfds") return 1
  if (source === "fallback") return 2
  return 3
}

const pickCanonical = (docs) => {
  return [...docs].sort((a, b) => {
    const ar = sourceRank(a.source)
    const br = sourceRank(b.source)
    if (ar !== br) return ar - br

    const al = String(a.displayName || a.subCategory || a.name || "")
    const bl = String(b.displayName || b.subCategory || b.name || "")
    return al.localeCompare(bl, "ko")
  })[0]
}

const run = async () => {
  const dryRun = process.argv.includes("--dry-run")
  const deleteDuplicates = process.argv.includes("--delete-duplicates")

  initAdmin()
  const db = admin.firestore()
  const snapshot = await db.collection(COLLECTION).get()

  const groups = new Map()
  for (const docSnap of snapshot.docs) {
    const data = docSnap.data() || {}
    const displayName = String(data.displayName || data.subCategory || data.name || "").trim()
    if (!displayName) continue
    const key = normalize(displayName)

    if (!groups.has(key)) groups.set(key, [])
    groups.get(key).push({
      id: docSnap.id,
      ref: docSnap.ref,
      ...data,
      canonicalDisplayName: displayName,
    })
  }

  let groupCount = 0
  let duplicateGroups = 0
  let hiddenCount = 0
  let deletedCount = 0

  let batch = db.batch()
  let pending = 0

  for (const [canonicalKey, docs] of groups.entries()) {
    groupCount += 1
    const canonical = pickCanonical(docs)
    const variantsCount = docs.length
    if (variantsCount > 1) duplicateGroups += 1

    const canonicalPatch = {
      canonicalKey,
      canonicalName: canonical.canonicalDisplayName,
      isCanonical: true,
      hidden: false,
      variantsCount,
      updatedAt: new Date().toISOString(),
    }

    if (!dryRun) {
      batch.set(canonical.ref, canonicalPatch, { merge: true })
      pending += 1
    }

    for (const item of docs) {
      if (item.id === canonical.id) continue

      hiddenCount += 1

      if (deleteDuplicates) {
        if (!dryRun) {
          batch.delete(item.ref)
          pending += 1
        }
        deletedCount += 1
      } else if (!dryRun) {
        batch.set(
          item.ref,
          {
            canonicalKey,
            canonicalName: canonical.canonicalDisplayName,
            canonicalRef: canonical.id,
            isCanonical: false,
            hidden: true,
            updatedAt: new Date().toISOString(),
          },
          { merge: true }
        )
        pending += 1
      }

      if (pending >= BATCH_SIZE) {
        await batch.commit()
        batch = db.batch()
        pending = 0
      }
    }

    if (pending >= BATCH_SIZE) {
      await batch.commit()
      batch = db.batch()
      pending = 0
    }
  }

  if (!dryRun && pending > 0) {
    await batch.commit()
  }

  console.log(`[dedupe-food-catalog] dryRun=${dryRun} deleteDuplicates=${deleteDuplicates}`)
  console.log(`[dedupe-food-catalog] groups=${groupCount} duplicateGroups=${duplicateGroups}`)
  console.log(`[dedupe-food-catalog] hiddenMarked=${hiddenCount} deleted=${deletedCount}`)
}

run().catch((error) => {
  console.error("[dedupe-food-catalog] failed", error)
  process.exit(1)
})
