export type TaskListTask = {
    /** Unique IQB identifier */
    iqbId: string
    /** Numeric position — used for sorting */
    position: number
    /** Display number, e.g. "1.1" */
    taskNumber: string
    /** Human-readable task name */
    name: string
    /** Domain identifier matching TaskListDomainDef.domainId, e.g. "le" or "rs" */
    domain: string
    /** Competence level as Roman numeral, e.g. "III" */
    competenceLevel: string
    /** Class mean score (0–100 %), null if no data available */
    mean: number | null
    /** Fair comparison value (0–100 %), null if no data available */
    meanCorrected: number | null
    /** Bildungsstandard this task targets */
    competenceId: { name: string; nameShort: string; description: string } | null
    /** Cognitive demand level / Anforderungsbereich */
    cognitiveDemandLevel: { name: string; nameShort: string; description: string } | null
}

export type TaskListCompetenceLevelDef = {
    /** Roman numeral identifying this level, e.g. "III" — matches TaskListTask.competenceLevel */
    romanNumber: string
    /** Short label, e.g. "Regelstandard" */
    subtitle: string
    /** Full description of the competence level */
    description: string
}

export type TaskListDomainDef = {
    /** Identifier matching TaskListTask.domain */
    domainId: string
    /** Display label shown in the domain filter, e.g. "Leseverstehen" */
    label: string
    competenceLevels: TaskListCompetenceLevelDef[]
}

export type TaskListData = {
    tasks: TaskListTask[]
    /** One entry per domain — drives the filter UI and competence level tooltips */
    domains: TaskListDomainDef[]
}
