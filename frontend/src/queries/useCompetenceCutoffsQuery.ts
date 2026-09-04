import { useQuery } from '@tanstack/vue-query'

export type CompetenceLevelCutoff = {
    /** Roman numeral 'I'–'V' */
    competenceLevel: string
    /** '1'–'5' — used for the color CSS class */
    arabicNumber: string
    /** e.g. 'Regelstandard' */
    subtitle: string
    /** Full competence level description */
    description?: string
    /** Minimum absolute score to reach this level — TODO: fill in */
    cutoff: number
}

export type DomainCutoffs = {
    domainId: string
    cutoffs: CompetenceLevelCutoff[]
}

// TODO: replace placeholder 0 values with actual cutoffs and totals from the test spec
const mockData: DomainCutoffs[] = [
    {
        domainId: 'le',
        cutoffs: [
            { competenceLevel: 'I', arabicNumber: '1', subtitle: 'Unter Mindeststandard', cutoff: 11 },
            { competenceLevel: 'II', arabicNumber: '2', subtitle: 'Mindeststandard', cutoff: 15 },
            { competenceLevel: 'III', arabicNumber: '3', subtitle: 'Regelstandard', cutoff: 19 },
            { competenceLevel: 'IV', arabicNumber: '4', subtitle: 'Regelstandard Plus', cutoff: 23 },
            { competenceLevel: 'V', arabicNumber: '5', subtitle: 'Maximalstandard', cutoff: 27 },
        ],
    },
    {
        domainId: 'rs',
        cutoffs: [
            { competenceLevel: 'I', arabicNumber: '1', subtitle: 'Unter Mindeststandard', cutoff: 41 },
            { competenceLevel: 'II', arabicNumber: '2', subtitle: 'Mindeststandard', cutoff: 55 },
            { competenceLevel: 'III', arabicNumber: '3', subtitle: 'Regelstandard', cutoff: 70 },
            { competenceLevel: 'IV', arabicNumber: '4', subtitle: 'Regelstandard Plus', cutoff: 81 },
            { competenceLevel: 'V', arabicNumber: '5', subtitle: 'Maximalstandard', cutoff: 93 },
        ],
    },
]

export function useCompetenceCutoffsQuery() {
    return useQuery<DomainCutoffs[], Error>({
        queryKey: ['competenceCutoffs'],
        queryFn: () => mockData,
        staleTime: 30 * 60 * 1000,
        gcTime: 30 * 60 * 1000,
    })
}
