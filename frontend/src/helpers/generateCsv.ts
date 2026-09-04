import type { TableauData } from '@/queries/useTableauQuery'
import { displayGender, displayBlsf, displayDeuKennt, formatNum } from '@/queries/useTableauQuery'

// ── CSV helpers ───────────────────────────────────────────────────────────────

function csvCell(value: string | number | null): string {
    if (value === null) return ''
    const s = String(value)
    // Quote if contains comma, newline, or double quote
    if (s.includes(',') || s.includes('\n') || s.includes('"')) {
        return `"${s.replace(/"/g, '""')}"`
    }
    return s
}

function csvRow(cells: (string | number | null)[]): string {
    return cells.map(csvCell).join(',')
}

// ── Public API ────────────────────────────────────────────────────────────────

export function generateCsv(data: TableauData, groupLabel: string): Blob {
    const lines: string[] = []

    // Metadata
    lines.push(csvRow(['Deutsch Kl. 8']))
    lines.push(csvRow(['KT-Testzugang (TH)']))
    lines.push(csvRow([`Klasse: ${groupLabel}`]))
    lines.push('')

    // Header row
    const covarHeaders = ['SuS-Code', 'Geschlecht', 'Halbjahresnote', 'BL/SF', 'Ungen. D.Kenntn.']
    const itemHeaders = data.itemColumns.map((c) => c.taskNumber + (c.taskName ? ' ' + c.taskName : ''))
    const aggHeaders = data.aggColumns.map((c) => c.displayName)
    lines.push(csvRow([...covarHeaders, ...itemHeaders, ...aggHeaders]))

    // (Max) row
    lines.push(
        csvRow([
            '(Max)',
            '',
            '',
            '',
            '',
            ...data.itemMaxVals.map((v) => (v !== null ? v : '')),
            ...data.aggMaxVals.map((v) => (v !== null ? v : '')),
        ]),
    )

    // Student rows
    for (const sr of data.studentRows) {
        lines.push(
            csvRow([
                sr.code,
                displayGender(sr.covariates.gender),
                sr.covariates.hnote !== null ? sr.covariates.hnote : '',
                displayBlsf(sr.covariates.blsf),
                displayDeuKennt(sr.covariates.DeuKennt),
                ...sr.itemScores.map((v) => (v !== null ? v : '')),
                ...sr.aggScores.map((v, i) => (v !== null ? (data.aggColumns[i].isPercent ? v.toFixed(1) : formatNum(v)) : '')),
            ]),
        )
    }

    // Ø row
    lines.push(
        csvRow([
            'Ø',
            '',
            '',
            '',
            '',
            ...data.groupItemScores.map((v) => (v !== null ? v.toFixed(1) : '')),
            ...data.groupAggScores.map((v) => (v !== null ? v.toFixed(1) : '')),
        ]),
    )

    // Separator + legend
    lines.push('')
    lines.push('')
    lines.push(csvRow(['Erläuterungen zu den Spalten']))
    lines.push(csvRow(['Spalte', 'Erläuterung']))
    for (const leg of data.legend) {
        lines.push(csvRow([leg.key, leg.description]))
    }

    // BOM for correct encoding in Excel
    const bom = '\uFEFF'
    return new Blob([bom + lines.join('\n')], { type: 'text/csv;charset=utf-8' })
}
