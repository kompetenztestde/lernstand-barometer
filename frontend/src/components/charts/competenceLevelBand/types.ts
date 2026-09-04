export type CompetenceLevelBandData = {
    /** Reached competence level (1–5), null if no data available */
    competenceLevel: number | null
    /** Domain ID used to load level descriptions (e.g. 'le', 'rs' for Deutsch; '' for Mathe which has no domains; omit to disable tooltip) */
    domainId?: string
}
