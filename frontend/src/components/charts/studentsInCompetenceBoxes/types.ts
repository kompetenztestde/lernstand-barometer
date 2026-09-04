export type StudentIconData = {
    /** Student code used to resolve the display name */
    code: string
    /** Mean score in Leseverstehen (0–100 %), null if no data */
    leseverstehenMean: number | null
    /** Mean score in Orthografie (0–100 %), null if no data */
    orthografieMean: number | null
    /** Competence level in Leseverstehen as Roman numeral, e.g. "III" */
    leseverstehenLevel: string | null
    /** Competence level in Orthografie as Roman numeral, e.g. "III" */
    orthografieLevel: string | null
    /** Absolute score in Leseverstehen, null if no data */
    leseverstehenScore: number | null
    /** Absolute score in Orthografie, null if no data */
    orthografieScore: number | null
}

export type CompetenceLevelBoxData = {
    /** Arabic numeral '1'–'5' — used for the color class */
    arabicNumber: string
    /** Roman numeral 'I'–'V' — shown in the box heading */
    romanNumber: string
    /** Short label, e.g. "Regelstandard" */
    subtitle: string
    /** Full description shown in the tooltip */
    description: string
    students: StudentIconData[]
}

export type StudentsInCompetenceBoxesDomainData = {
    domainId: string
    /** Display name, e.g. "Leseverstehen" */
    label: string
    /** Maximum possible absolute score for this domain */
    total: number
    /** Competence level cutoffs for the score bar */
    cutoffs: import('@/queries/useCompetenceCutoffsQuery').CompetenceLevelCutoff[]
    competenceLevelBoxes: CompetenceLevelBoxData[]
}

export type StudentsInCompetenceBoxesData = {
    domains: StudentsInCompetenceBoxesDomainData[]
}
