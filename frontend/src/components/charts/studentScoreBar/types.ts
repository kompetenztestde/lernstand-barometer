import type { CompetenceLevelCutoff } from '@/queries/useCompetenceCutoffsQuery'

export type StudentScoreBarData = {
    /** Student's absolute score, null if unavailable */
    score: number | null
    /** Maximum possible score for this domain */
    total: number
    /** Display name of the domain, e.g. 'Leseverstehen' */
    domainLabel: string
    cutoffs: CompetenceLevelCutoff[]
}
