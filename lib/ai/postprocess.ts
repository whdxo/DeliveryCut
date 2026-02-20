import { canonicalizeFoodName, foodNameEquals, foodNameIncludes, isSeasoningLike } from "@/lib/food/normalize"
import type {
  FridgeCategory,
  GenerateInput,
  GenerateOutput,
  QuantityUnit,
  ShoppingItem,
} from "@/lib/types/api"

type InventoryItem = {
  name: string
  amount: number
  unit: QuantityUnit
  category?: FridgeCategory
}

const extractInventory = (input: GenerateInput): InventoryItem[] => {
  if (Array.isArray(input.inventoryContext) && input.inventoryContext.length > 0) {
    return input.inventoryContext
      .filter((item) => Number.isFinite(item.amount) && item.amount > 0 && typeof item.name === "string")
      .map((item) => ({
        name: item.name,
        amount: item.amount,
        unit: item.unit,
        category: item.category,
      }))
  }

  if (Array.isArray(input.fridgeContext) && input.fridgeContext.length > 0) {
    return input.fridgeContext
      .filter((item) => Number.isFinite(item.amount) && item.amount > 0 && typeof item.name === "string")
      .map((item) => ({
        name: item.name,
        amount: item.amount,
        unit: item.unit,
      }))
  }

  return []
}

const getUsedNames = (output: GenerateOutput): string[] => {
  const names = new Set<string>()

  for (const menu of output.menuOptions) {
    for (const ingredient of menu.ingredients) {
      if (ingredient?.trim()) names.add(canonicalizeFoodName(ingredient))
    }

    for (const seasoning of menu.flavorDesign?.seasoningAmounts ?? []) {
      if (seasoning.name?.trim()) names.add(canonicalizeFoodName(seasoning.name))
    }

    for (const ingredientAmount of menu.flavorDesign?.ingredientAmounts ?? []) {
      if (!ingredientAmount.name?.trim()) continue
      const canonical = canonicalizeFoodName(ingredientAmount.name)
      if (isSeasoningLike(canonical)) continue
      names.add(canonical)
    }
  }

  return [...names]
}

const hasInventoryItem = (item: ShoppingItem, inventory: InventoryItem[]): boolean => {
  const candidates = inventory.filter(
    (stock) => foodNameEquals(stock.name, item.item) || foodNameIncludes(stock.name, item.item)
  )

  if (candidates.length === 0) return false

  // "없는 재료만" 기준: 이름이 매칭되고 수량이 0보다 크면 보유로 간주한다.
  return candidates.some((stock) => Number.isFinite(stock.amount) && stock.amount > 0)
}

const reconcileShoppingList = (shoppingList: ShoppingItem[], usedNames: string[], inventory: InventoryItem[]) => {
  const normalizedUsed = usedNames.map((name) => canonicalizeFoodName(name))
  const next: ShoppingItem[] = []

  for (const item of shoppingList) {
    if (!item?.item?.trim() || !Number.isFinite(item.quantity) || item.quantity <= 0) continue

    const canonicalItem = canonicalizeFoodName(item.item)
    const isUsed = normalizedUsed.some((used) => foodNameEquals(used, canonicalItem) || foodNameIncludes(used, canonicalItem))
    if (!isUsed) continue

    if (hasInventoryItem(item, inventory)) continue

    next.push({
      ...item,
      item: canonicalItem,
    })
  }

  return next
}

export const finalizeShoppingList = (output: GenerateOutput, input: GenerateInput): GenerateOutput => {
  const inventory = extractInventory(input)
  if (inventory.length === 0) return output

  const usedNames = getUsedNames(output)
  const shoppingList = reconcileShoppingList(output.shoppingList, usedNames, inventory)

  return {
    ...output,
    shoppingList,
  }
}
