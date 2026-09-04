export type SubDomainChartBar = {
    /** Class mean score (0–100 %) */
    mean: number
    /** Fair comparison value (0–100 %) */
    meanComparison: number
}

export type SubDomainChartDomainDef = {
    domainId: string
    /** Display label, e.g. "Leseverstehen" */
    label: string
    /** Full description shown in the SubDomainLabel tooltip */
    description: string
}

export type SubDomainChartCompLvlDef = {
    romanNumber: string
    subtitle: string
    description: string
}

export type SubDomainChartCompetenceDef = {
    /** Bildungsstandard code, e.g. "2.5" */
    competenceId: string
    label: string
    description: string
}

export type SubDomainChartData = {
    /** Bars per domain, keyed by domainId (e.g. "le", "rs") */
    domainBars: Record<string, SubDomainChartBar>
    /** Bars per competence level, keyed by domainId then Roman numeral */
    compLvlBars: Record<string, Record<string, SubDomainChartBar>>
    /** Bars per Bildungsstandard, keyed by competenceId (e.g. "2.5") */
    competenceIdBars: Record<string, SubDomainChartBar>
    domainDefs: SubDomainChartDomainDef[]
    /** Competence level definitions per domain, keyed by domainId */
    compLvlDefs: Record<string, SubDomainChartCompLvlDef[]>
    competenceIdDefs: SubDomainChartCompetenceDef[]
    /** Optional tooltip text for the "Fairer Vergleichswert" label */
    fairComparisonTooltip?: string
}
