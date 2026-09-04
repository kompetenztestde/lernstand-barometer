export type TaskDetailPanelProps = {
    /** Unique IQB identifier — used to resolve task images */
    iqbId: string
    /** Display number, e.g. "1.1" */
    taskNumber: string
    /** Human-readable task name */
    name: string
    /** Whether the panel is visible */
    isExpanded?: boolean
    /** Competence level as Roman numeral, e.g. "III" */
    competenceLevelRoman?: string | null
    /** Short label for the competence level, e.g. "Regelstandard" */
    compLvlSubtitle?: string
    /** Full description of the competence level */
    compLvlDescription?: string
    /** Bildungsstandard this task targets */
    competenceId?: { name: string; nameShort: string; description: string } | null
    /** Cognitive demand level / Anforderungsbereich */
    cognitiveDemandLevel?: { name: string; nameShort: string; description: string } | null
}
