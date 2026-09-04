import type { ScoreBarData } from './types'

export const mockScoreBarData: ScoreBarData = {
    title: 'Klassen-MW',
    barValue: 72,
    barLength: 72,
    barValueSuffix: '%',
    color: 'var(--color-primary)',
}

export const mockScoreBarGroupData: ScoreBarData[] = [
    {
        title: 'Klassen-MW',
        barValue: 72,
        barLength: 72,
        barValueSuffix: '%',
        color: 'var(--color-primary)',
    },
    {
        title: 'Fairer Vergleichswert',
        barValue: 68,
        barLength: 68,
        barValueSuffix: '%',
        color: 'var(--color-tertiary)',
    },
]
