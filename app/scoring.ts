type MatchFactor = {
  score: number
  weight: string
}

export function calculateMatchScore(factors: MatchFactor[]) {
  const weightedScore = factors.reduce((total, factor) => {
    const weight = Number.parseFloat(factor.weight) / 100

    return total + factor.score * weight
  }, 0)

  return Math.round(weightedScore)
}
