export type TaskBarChartData = {
    /** Unique IQB identifier — used to resolve task images */
    iqbId: string
    /** Display number, e.g. "1.1" */
    taskNumber: string
    /** Human-readable task name */
    name: string
    /** Competence level as Roman numeral, e.g. "III" */
    competenceLevelRoman: string
    /** Short label for the competence level, e.g. "Regelstandard" */
    compLvlSubtitle?: string
    /** Full description of the competence level */
    compLvlDescription?: string
    /** Bildungsstandard this task targets */
    competenceId?: { name: string; nameShort: string; description: string } | null
    /** Cognitive demand level / Anforderungsbereich */
    cognitiveDemandLevel?: { name: string; nameShort: string; description: string } | null
    /** Class mean score (0–100 %) */
    mean: number
    /** Fair comparison value (0–100 %) */
    meanCorrected: number
}
