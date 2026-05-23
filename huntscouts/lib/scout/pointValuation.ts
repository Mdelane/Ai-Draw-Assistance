export const STATE_POINT_COST_MATRIX: Record<string, Record<string, number>> = {
  Colorado: { default: 38 },
  Wyoming:  { default: 15, elk: 52, deer: 27, pronghorn: 21, bighorn: 15, moose: 15, bison: 15 },
  Montana:  { default: 10 },
  Utah:     { default: 10 },
  Idaho:    { default: 17 },
  Arizona:  { default: 15 },
  Nevada:   { default: 25 },
}

export type PointsValuation = {
  state: string
  species: string
  points: number
  annualFee: number
  totalInvested: number
}

export function valuatePoints(state: string, species: string, points: number): PointsValuation {
  const stateMatrix = STATE_POINT_COST_MATRIX[state]
  const annualFee = stateMatrix
    ? (stateMatrix[species.toLowerCase()] ?? stateMatrix.default ?? 15)
    : 15

  return {
    state,
    species,
    points,
    annualFee,
    totalInvested: points * annualFee,
  }
}

export function valuatePortfolio(combos: { state: string; species: string; points: number }[]): {
  valuations: PointsValuation[]
  totalInvested: number
} {
  const valuations = combos.map(c => valuatePoints(c.state, c.species, c.points))
  const totalInvested = valuations.reduce((sum, v) => sum + v.totalInvested, 0)
  return { valuations, totalInvested }
}
