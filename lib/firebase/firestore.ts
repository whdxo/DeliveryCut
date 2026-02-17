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
} from "firebase/firestore"
import type { StoredMenuPlan } from "@/lib/types/api"
import { db } from "./config"

/**
 * Firestore 컬렉션 참조
 */
export const collections = {
  users: "users",
  menuPlans: "menuPlans",
  ingredients: "ingredients",
}

/**
 * 문서 생성 또는 업데이트
 */
export const setDocument = async (
  collectionName: string,
  docId: string,
  data: any
) => {
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

/**
 * 문서 읽기
 */
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

/**
 * 문서 업데이트
 */
export const updateDocument = async (
  collectionName: string,
  docId: string,
  data: any
) => {
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

/**
 * 문서 삭제
 */
export const deleteDocument = async (
  collectionName: string,
  docId: string
) => {
  try {
    await deleteDoc(doc(db, collectionName, docId))
    return { error: null }
  } catch (error: any) {
    return { error: error.message }
  }
}

/**
 * 컬렉션의 모든 문서 읽기
 */
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

/**
 * FS1/FS2 공용 저장 규약: menuPlans/{resultId}
 */
export const saveGeneratedPlan = async (plan: StoredMenuPlan) => {
  try {
    await setDoc(doc(db, collections.menuPlans, plan.resultId), plan)
    return { id: plan.resultId, error: null }
  } catch (error: any) {
    return { id: null, error: error.message }
  }
}

/**
 * resultId로 저장된 결과 조회
 */
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

/**
 * 사용자별 메뉴 플랜 저장 (legacy)
 */
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

/**
 * 사용자의 메뉴 플랜 가져오기
 */
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
