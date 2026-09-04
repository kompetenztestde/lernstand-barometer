export type DonutD3DataElement = {
    /** Unique identifier for this segment */
    id: string
    /** Short label shown in the legend */
    labelShort: string
    /** Long label shown in the description panel */
    labelLong: string
    /** Optional description shown below the chart when the segment is active */
    description?: string
    /** CSS color value, e.g. 'var(--color-competence-level-3)' */
    color: string
    /** Segment value — either a percentage (0–100) for single-segment mode, or a relative count for multi-segment mode */
    value: number
}
