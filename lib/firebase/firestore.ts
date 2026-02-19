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
} from "firebase/firestore"
import type {
  FridgeCategory,
  FridgeConsumeInput,
  FridgeConsumeResult,
  FridgeCreateInput,
  FridgeItem,
  FridgeUpdateInput,
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
  try {
    const result = await runTransaction(db, async (transaction) => {
      const beforeSnapshots: Record<string, FridgeItem> = {}
      const consumeResults: FridgeConsumeResult[] = []

      for (const consumeItem of input.items) {
        const itemRef = doc(db, collections.users, userId, collections.fridgeItems, consumeItem.itemId)
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
        transaction.update(itemRef, {
          amount: nextAmount,
          updatedAt: new Date().toISOString(),
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

      const logRef = doc(collection(db, collections.users, userId, collections.consumptionLogs))
      transaction.set(logRef, {
        recipeId: input.recipeId,
        resultId: input.resultId ?? null,
        consumedItems: consumeResults,
        consumedAt: new Date().toISOString(),
        snapshotBefore: beforeSnapshots,
      })

      return consumeResults
    })

    return { data: result, error: null }
  } catch (error: any) {
    return { data: null, error: error.message as string }
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
    const menuPlans = querySnapshot.docs.map((docItem) =>
      docItem.data() as StoredMenuPlan
    )
    return { data: menuPlans, error: null }
  } catch (error: unknown) {
    return { data: null, error: error instanceof Error ? error.message : String(error) }
  }
}

