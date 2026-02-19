import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  limit,
  Timestamp,
  runTransaction,
  writeBatch,
} from "firebase/firestore"
import type {
  FridgeCategory,
  FridgeConsumeInput,
  FridgeConsumeResult,
  FridgeCreateInput,
  FridgeItem,
  FridgeUpdateInput,
  FoodSearchItem,
  QuantityUnit,
  StoredMenuPlan,
} from "@/lib/types/api"
import { convertUnit } from "@/lib/fridge/unit"
import { db } from "./config"

export const collections = {
  users: "users",
  menuPlans: "menuPlans",
  ingredients: "ingredients",
  fridgeItems: "fridgeItems",
  consumptionLogs: "consumptionLogs",
  foodCatalog: "foodCatalog",
}

export const setDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    await setDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: Timestamp.now(),
    })
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export const getDocument = async (collectionName: string, docId: string) => {
  try {
    const docRef = doc(db, collectionName, docId)
    const docSnap = await getDoc(docRef)

    if (docSnap.exists()) {
      return { data: { id: docSnap.id, ...docSnap.data() }, error: null }
    }

    return { data: null, error: "Document not found" }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export const updateDocument = async (collectionName: string, docId: string, data: any) => {
  try {
    await updateDoc(doc(db, collectionName, docId), {
      ...data,
      updatedAt: Timestamp.now(),
    })
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export const deleteDocument = async (collectionName: string, docId: string) => {
  try {
    await deleteDoc(doc(db, collectionName, docId))
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export const getDocuments = async (collectionName: string) => {
  try {
    const querySnapshot = await getDocs(collection(db, collectionName))
    const documents = querySnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }))
    return { data: documents, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export const saveGeneratedPlan = async (plan: StoredMenuPlan) => {
  try {
    await setDoc(doc(db, collections.menuPlans, plan.resultId), plan)
    return { id: plan.resultId, error: null }
  } catch (error: any) {
    return { id: null, error: error.message }
  }
}

export const getGeneratedPlanById = async (resultId: string) => {
  try {
    const docRef = doc(db, collections.menuPlans, resultId)
    const docSnap = await getDoc(docRef)

    if (!docSnap.exists()) {
      return { data: null, error: "Document not found" }
    }

    return { data: docSnap.data() as StoredMenuPlan, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

const normalizeFridgeDoc = (docId: string, raw: Record<string, unknown>): FridgeItem => {
  const nowIso = new Date(0).toISOString()

  const name = typeof raw.name === "string" ? raw.name : ""
  const category = (typeof raw.category === "string" ? raw.category : "other") as FridgeCategory

  // migration fallback: quantity -> amount
  const legacyQuantity = typeof raw.quantity === "number" ? raw.quantity : null
  const amount = typeof raw.amount === "number" ? raw.amount : legacyQuantity ?? 1

  // migration fallback: missing unit -> count
  const unit = (typeof raw.unit === "string" ? raw.unit : "count") as QuantityUnit

  return {
    id: docId,
    name,
    category,
    subCategory: typeof raw.subCategory === "string" ? raw.subCategory : name,
    amount,
    unit,
    expiresOn: typeof raw.expiresOn === "string" ? raw.expiresOn : null,
    source: (typeof raw.source === "string" ? raw.source : "manual") as "manual" | "mfds" | "fallback",
    createdAt: typeof raw.createdAt === "string" ? raw.createdAt : nowIso,
    updatedAt: typeof raw.updatedAt === "string" ? raw.updatedAt : nowIso,
  }
}

export const getFridgeItemsByUserId = async (
  userId: string,
  options?: { category?: FridgeCategory; sort?: "expiresOn" | "updatedAt" }
) => {
  try {
    const itemsRef = collection(db, collections.users, userId, collections.fridgeItems)
    const snapshot = await getDocs(query(itemsRef, orderBy("updatedAt", "desc")))

    let items = snapshot.docs.map((docItem) =>
      normalizeFridgeDoc(docItem.id, docItem.data() as Record<string, unknown>)
    )

    if (options?.category) {
      items = items.filter((item) => item.category === options.category)
    }

    if (options?.sort === "expiresOn") {
      items.sort((a, b) => {
        const av = a.expiresOn ? Date.parse(a.expiresOn) : Number.MAX_SAFE_INTEGER
        const bv = b.expiresOn ? Date.parse(b.expiresOn) : Number.MAX_SAFE_INTEGER
        return av - bv
      })
    }

    return { data: items, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}

export const addFridgeItem = async (userId: string, input: FridgeCreateInput) => {
  try {
    const name = input.name.trim()
    const amount = input.amount
    if (!name) {
      return { item: null, error: "name is required" }
    }

    if (!Number.isFinite(amount) || amount <= 0) {
      return { item: null, error: "amount must be greater than 0" }
    }

    const now = new Date().toISOString()
    const itemRef = doc(collection(db, collections.users, userId, collections.fridgeItems))

    const item: FridgeItem = {
      id: itemRef.id,
      name,
      category: input.category ?? "other",
      subCategory: input.subCategory?.trim() || name,
      amount,
      unit: input.unit,
      expiresOn: input.expiresOn?.trim() || null,
      source: "manual",
      createdAt: now,
      updatedAt: now,
    }

    await setDoc(itemRef, item)
    return { item, error: null }
  } catch (error: any) {
    return { item: null, error: error.message }
  }
}

export const updateFridgeItem = async (userId: string, itemId: string, input: FridgeUpdateInput) => {
  try {
    const itemRef = doc(db, collections.users, userId, collections.fridgeItems, itemId)
    const existing = await getDoc(itemRef)
    if (!existing.exists()) {
      return { item: null, error: "Item not found" }
    }

    const payload: Record<string, unknown> = { updatedAt: new Date().toISOString() }

    if (typeof input.name === "string") payload.name = input.name.trim()
    if (input.category) payload.category = input.category
    if (typeof input.subCategory === "string") payload.subCategory = input.subCategory.trim()
    if (typeof input.amount === "number") payload.amount = input.amount
    if (input.unit) payload.unit = input.unit
    if (input.expiresOn !== undefined) payload.expiresOn = input.expiresOn

    await updateDoc(itemRef, payload)

    const updatedSnap = await getDoc(itemRef)
    const updated = normalizeFridgeDoc(updatedSnap.id, updatedSnap.data() as Record<string, unknown>)
    return { item: updated, error: null }
  } catch (error: any) {
    return { item: null, error: error.message }
  }
}

export const deleteFridgeItem = async (userId: string, itemId: string) => {
  try {
    const itemRef = doc(db, collections.users, userId, collections.fridgeItems, itemId)
    const existing = await getDoc(itemRef)

    if (!existing.exists()) {
      return { error: "Item not found" }
    }

    await deleteDoc(itemRef)
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

export const consumeFridgeItems = async (userId: string, input: FridgeConsumeInput) => {
  const runConsumeTransaction = async (withLog: boolean) => {
    return runTransaction(db, async (transaction) => {
      const beforeSnapshots: Record<string, FridgeItem> = {}
      const consumeResults: FridgeConsumeResult[] = []
      const updates: Array<{ itemId: string; afterAmount: number }> = []

      // 1) Read all target docs first.
      const refs = input.items.map((consumeItem) => ({
        consumeItem,
        itemRef: doc(db, collections.users, userId, collections.fridgeItems, consumeItem.itemId),
      }))

      for (const { consumeItem, itemRef } of refs) {
        const snap = await transaction.get(itemRef)
        if (!snap.exists()) {
          throw new Error(`ITEM_NOT_FOUND:${consumeItem.itemId}`)
        }

        const stock = normalizeFridgeDoc(snap.id, snap.data() as Record<string, unknown>)
        beforeSnapshots[stock.id] = stock

        const converted = convertUnit(consumeItem.amount, consumeItem.unit, stock.unit)
        if (converted === null) {
          throw new Error(`INVALID_UNIT:${stock.id}`)
        }

        if (converted > stock.amount) {
          throw new Error(`INSUFFICIENT_STOCK:${stock.id}`)
        }

        const nextAmount = Number((stock.amount - converted).toFixed(4))

        updates.push({
          itemId: stock.id,
          afterAmount: nextAmount,
        })

        consumeResults.push({
          consumedItemId: stock.id,
          beforeAmount: stock.amount,
          consumedAmount: consumeItem.amount,
          consumedUnit: consumeItem.unit,
          afterAmount: nextAmount,
          stockUnit: stock.unit,
        })
      }

      // 2) Then apply writes.
      for (const updateItem of updates) {
        const itemRef = doc(db, collections.users, userId, collections.fridgeItems, updateItem.itemId)
        if (updateItem.afterAmount <= 0) {
          transaction.delete(itemRef)
          continue
        }

        transaction.update(itemRef, {
          amount: updateItem.afterAmount,
          updatedAt: new Date().toISOString(),
        })
      }

      if (withLog) {
        const logRef = doc(collection(db, collections.users, userId, collections.consumptionLogs))
        transaction.set(logRef, {
          recipeId: input.recipeId,
          resultId: input.resultId ?? null,
          consumedItems: consumeResults,
          consumedAt: new Date().toISOString(),
          snapshotBefore: beforeSnapshots,
        })
      }

      return consumeResults
    })
  }

  try {
    const result = await runConsumeTransaction(true)
    return { data: result, error: null }
  } catch (error: any) {
    const message = String(error?.message ?? error)
    const isPermissionError = message.includes("permission-denied") || message.includes("Missing or insufficient permissions")

    if (isPermissionError) {
      try {
        // If logging path is blocked by rules, still allow stock deduction.
        const fallbackResult = await runConsumeTransaction(false)
        return { data: fallbackResult, error: null }
      } catch (fallbackError: any) {
        return {
          data: null,
          error: `Fallback consume failed after permission-denied (${message}): ${String(fallbackError?.message ?? fallbackError)}`,
        }
      }
    }

    return { data: null, error: message }
  }
}
const normalizeFoodCatalogKey = (value: string) => value.trim().toLowerCase()

const normalizeFoodCatalogDoc = (docId: string, raw: Record<string, unknown>): FoodSearchItem => {
  const name = typeof raw.name === "string" ? raw.name : docId
  const displayName = typeof raw.displayName === "string" && raw.displayName.trim() ? raw.displayName.trim() : undefined
  const state = typeof raw.state === "string" ? raw.state : null
  const category = (typeof raw.category === "string" ? raw.category : "other") as FoodSearchItem["category"]
  const subCategory = typeof raw.subCategory === "string" && raw.subCategory.trim() ? raw.subCategory : displayName ?? name
  const defaultUnit = (typeof raw.defaultUnit === "string" ? raw.defaultUnit : "count") as FoodSearchItem["defaultUnit"]
  const source = (typeof raw.source === "string" ? raw.source : "fallback") as FoodSearchItem["source"]

  return {
    name,
    displayName,
    state,
    category,
    subCategory,
    defaultUnit,
    source,
  }
}

export const upsertFoodCatalogItems = async (items: FoodSearchItem[]) => {
  try {
    if (items.length === 0) {
      return { count: 0, error: null }
    }

    const batch = writeBatch(db)
    let count = 0

    const dedupe = new Map<string, FoodSearchItem>()
    for (const item of items) {
      const key = normalizeFoodCatalogKey(item.name)
      if (!key) continue
      if (!dedupe.has(key)) {
        dedupe.set(key, item)
      }
    }

    for (const [key, item] of dedupe.entries()) {
      const docRef = doc(db, collections.foodCatalog, key)
      batch.set(
        docRef,
        {
          name: item.name,
          nameLower: key,
          displayName: item.displayName ?? item.subCategory ?? item.name,
          displayNameLower: normalizeFoodCatalogKey(item.displayName ?? item.subCategory ?? item.name),
          state: item.state ?? null,
          category: item.category,
          subCategory: item.subCategory ?? item.displayName ?? item.name,
          subCategoryLower: normalizeFoodCatalogKey(item.subCategory ?? item.displayName ?? item.name),
          defaultUnit: item.defaultUnit,
          source: item.source,
          updatedAt: new Date().toISOString(),
        },
        { merge: true }
      )
      count += 1
    }

    await batch.commit()
    return { count, error: null }
  } catch (error: any) {
    return { count: 0, error: error.message }
  }
}

export const searchFoodCatalogItems = async (q: string, max = 10) => {
  try {
    const keyword = normalizeFoodCatalogKey(q)
    if (!keyword) {
      return { data: [], error: null }
    }

    const catalogRef = collection(db, collections.foodCatalog)
    const endKeyword = `${keyword}\uf8ff`

    const queryByField = async (field: "nameLower" | "displayNameLower" | "subCategoryLower") => {
      return getDocs(
        query(
          catalogRef,
          where(field, ">=", keyword),
          where(field, "<=", endKeyword),
          orderBy(field),
          limit(Math.max(max, 20))
        )
      )
    }

    const [nameSnap, displaySnap, subSnap] = await Promise.all([
      queryByField("nameLower"),
      queryByField("displayNameLower"),
      queryByField("subCategoryLower"),
    ])

    const merged = new Map<string, FoodSearchItem>()
    for (const snap of [nameSnap, displaySnap, subSnap]) {
      for (const docItem of snap.docs) {
        const raw = docItem.data() as Record<string, unknown>
        if (raw.hidden === true) continue

        if (!merged.has(docItem.id)) {
          merged.set(docItem.id, normalizeFoodCatalogDoc(docItem.id, raw))
        }
      }
    }

    const rawItems = [...merged.values()]
      .sort((a, b) => {
        const aSortKey = a.displayName ?? a.subCategory ?? a.name
        const bSortKey = b.displayName ?? b.subCategory ?? b.name
        const aKey = normalizeFoodCatalogKey(aSortKey)
        const bKey = normalizeFoodCatalogKey(bSortKey)
        const ap = aKey.startsWith(keyword) ? 0 : 1
        const bp = bKey.startsWith(keyword) ? 0 : 1
        if (ap !== bp) return ap - bp
        return aSortKey.localeCompare(bSortKey, "ko")
      })

    const deduped = new Map<string, FoodSearchItem>()
    for (const item of rawItems) {
      const key = normalizeFoodCatalogKey(item.displayName ?? item.subCategory ?? item.name)
      if (!key) continue
      if (!deduped.has(key)) {
        deduped.set(key, {
          ...item,
          state: null,
          subCategory: item.displayName ?? item.subCategory ?? item.name,
        })
      }
    }

    const items = [...deduped.values()].slice(0, max)
    return { data: items, error: null }
  } catch (error: any) {
    return { data: [], error: error.message }
  }
}
export const saveMenuPlan = async (userId: string, menuPlan: any) => {
  try {
    const menuPlanRef = doc(collection(db, collections.menuPlans))
    await setDoc(menuPlanRef, {
      userId,
      ...menuPlan,
      createdAt: Timestamp.now(),
      updatedAt: Timestamp.now(),
    })
    return { id: menuPlanRef.id, error: null }
  } catch (error: any) {
    return { id: null, error: error.message }
  }
}

export const getUserMenuPlans = async (userId: string) => {
  try {
    const q = query(
      collection(db, collections.menuPlans),
      where("userId", "==", userId),
      orderBy("createdAt", "desc"),
      limit(10)
    )
    const querySnapshot = await getDocs(q)
    const menuPlans = querySnapshot.docs.map((docItem) => ({
      id: docItem.id,
      ...docItem.data(),
    }))
    return { data: menuPlans, error: null }
  } catch (error: any) {
    return { data: null, error: error.message }
  }
}
