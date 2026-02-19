import type { QuantityUnit } from "@/lib/types/api"

const MASS_TO_G: Record<QuantityUnit, number | null> = {
  g: 1,
  kg: 1000,
  ml: null,
  l: null,
  count: null,
  pack: null,
  tbsp: null,
  tsp: null,
}

const VOLUME_TO_ML: Record<QuantityUnit, number | null> = {
  ml: 1,
  l: 1000,
  g: null,
  kg: null,
  count: null,
  pack: null,
  tbsp: null,
  tsp: null,
}

export const isQuantityUnit = (value: string): value is QuantityUnit => {
  return ["count", "g", "kg", "ml", "l", "pack", "tbsp", "tsp"].includes(value)
}

export const convertUnit = (amount: number, from: QuantityUnit, to: QuantityUnit): number | null => {
  if (from === to) return amount

  const fromMass = MASS_TO_G[from]
  const toMass = MASS_TO_G[to]
  if (fromMass && toMass) {
    return (amount * fromMass) / toMass
  }

  const fromVolume = VOLUME_TO_ML[from]
  const toVolume = VOLUME_TO_ML[to]
  if (fromVolume && toVolume) {
    return (amount * fromVolume) / toVolume
  }

  return null
}
