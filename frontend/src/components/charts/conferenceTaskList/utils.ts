export const compLvls = ['I', 'II', 'III', 'IV', 'V'] as const

export const colors = {
    excellent: {
        description: 'Klassenwert und fairer Vergleichswert sind größer als 90 %',
        descriptionSimple: 'Exzellent',
        colorClass: 'bg-excellent border border-excellent-darker',
    },
    better: {
        description: 'Klassenwert ist größer als der faire Vergleichswert.',
        descriptionSimple: 'Gut',
        colorClass: 'bg-better border border-better-darker',
    },
    worse: {
        description: 'Klassenwert ist maximal 10 % geringer als der faire Vergleichswert.',
        descriptionSimple: 'Okay',
        colorClass: 'bg-worse border border-worse-darker',
    },
    bad: {
        description: 'Klassenwert mehr als 10 % geringer als der faire Vergleichswert.',
        descriptionSimple: 'Nicht gut',
        colorClass: 'bg-bad border border-bad-darker',
    },
    nodata: {
        description: 'Keine Daten vorhanden.',
        descriptionSimple: 'Keine Daten',
        colorClass: 'bg-nodata border border-nodata-darker',
    },
}

// prettier-ignore
export function lvlStyle(mean: number | null, meanComparison: number | null): string {
    if (mean === null || meanComparison === null) return colors.nodata.colorClass // gray, no data
    const diff = mean - meanComparison
    // API values are on a 0–100 scale, so thresholds are 90 and 10 (not 0.9 / 0.1)
    if (mean > 90 && meanComparison > 90) return colors.excellent.colorClass // blue, excellent
    if (diff > 0)                         return colors.better.colorClass // green, better
    if (diff <= -10)                      return colors.worse.colorClass // yellow, worse
    return colors.bad.colorClass // red, bad
}
