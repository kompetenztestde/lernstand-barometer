import { zipSync, strToU8 } from 'fflate'
import type { TableauData, TableauAggColumn, TableauItemColumn } from '@/queries/useTableauQuery'
import { displayGender, displayBlsf, displayDeuKennt, formatNum } from '@/queries/useTableauQuery'

// ── XML helpers ───────────────────────────────────────────────────────────────

function esc(s: string | null | undefined): string {
    if (!s) return ''
    return s.replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;')
}

function strCell(value: string, style?: string, paraStyle?: string): string {
    const s = style ? ` table:style-name="${style}"` : ''
    const p = paraStyle ? ` text:style-name="${paraStyle}"` : ''
    return `<table:table-cell${s} office:value-type="string"><text:p${p}>${esc(value)}</text:p></table:table-cell>`
}

/** Numeric cell. `decimals` forces toFixed formatting (e.g. 1 for Ø row). */
function numCell(value: number | null, style?: string, decimals?: number, paraStyle?: string): string {
    const s = style ? ` table:style-name="${style}"` : ''
    const p = paraStyle ? ` text:style-name="${paraStyle}"` : ''
    if (value === null) return `<table:table-cell${s}/>`
    const stored = decimals !== undefined ? parseFloat(value.toFixed(decimals)) : value
    const disp = decimals !== undefined ? value.toFixed(decimals) : formatNum(value)
    return `<table:table-cell${s} office:value-type="float" office:value="${stored}"><text:p${p}>${disp}</text:p></table:table-cell>`
}

function emptyCell(style?: string): string {
    const s = style ? ` table:style-name="${style}"` : ''
    return `<table:table-cell${s}/>`
}

function emptyCells(n: number): string {
    return `<table:table-cell table:number-columns-repeated="${n}"/>`
}

function row(cells: string[], style?: string): string {
    const s = style ? ` table:style-name="${style}"` : ''
    return `<table:table-row${s}>${cells.join('')}</table:table-row>`
}

// ── Group-separator helpers ───────────────────────────────────────────────────

function isGroupStart(cols: TableauItemColumn[], i: number): boolean {
    return i === 0 || cols[i].taskName !== cols[i - 1].taskName
}

function gs(base: string, cols: TableauItemColumn[], i: number): string {
    return isGroupStart(cols, i) ? base + '-gs' : base
}

// ── Cell style system ─────────────────────────────────────────────────────────

type CS = {
    bg?: string
    center?: boolean; right?: boolean; fix?: boolean
    vMid?: boolean; vBot?: boolean; rot90?: boolean
    bT?: boolean; bB?: boolean; bL?: boolean; bR?: boolean
    bold?: boolean; italic?: boolean; gray?: boolean; fs11?: boolean
}

const thick = '0.088cm solid #505050'

function renderCellStyles(defs: Record<string, CS>): string {
    return Object.entries(defs).map(([name, s]) => {
        const cp: string[] = []
        if (s.bg)     cp.push(`fo:background-color="${s.bg}"`)
        if (s.fix)    cp.push('style:text-align-source="fix"')
        if (s.vMid)   cp.push('style:vertical-align="middle"')
        if (s.vBot)   cp.push('style:vertical-align="bottom"')
        if (s.rot90)  cp.push('style:rotation-angle="90"')
        if (s.bT)     cp.push(`fo:border-top="${thick}"`)
        if (s.bB)     cp.push(`fo:border-bottom="${thick}"`)
        if (s.bL)     cp.push(`fo:border-left="${thick}"`)
        if (s.bR)     cp.push(`fo:border-right="${thick}"`)
        const pp: string[] = []
        if (s.center)      pp.push('fo:text-align="center"')
        else if (s.right)  pp.push('fo:text-align="end"')
        const tp: string[] = [`fo:font-size="${s.fs11 ? '11' : '9'}pt"`]
        if (s.bold)   tp.push('fo:font-weight="bold"')
        if (s.italic) tp.push('fo:font-style="italic"')
        if (s.gray)   tp.push('fo:color="#888888"')
        const ppXml = pp.length > 0 ? `\n      <style:paragraph-properties ${pp.join(' ')}/>` : ''
        return `    <style:style style:name="${name}" style:family="table-cell">
      <style:table-cell-properties ${cp.join(' ')}/>
      <style:text-properties ${tp.join(' ')}/>${ppXml}
    </style:style>`
    }).join('\n')
}

function v(base: CS, extra: Partial<CS>): CS { return { ...base, ...extra } }

// Base styles (borders already baked in where they apply to entire rows)
const _HEADER:    CS = { center: true, fix: true, rot90: true, vBot: true, bold: true, bT: true }
const _SC:        CS = { bg: '#ededed', center: true, fix: true, vMid: true, italic: true, bT: true, bB: true }
const _NC:        CS = { center: true, fix: true, vMid: true }
const _AGG_ABS_H: CS = { bg: '#f2f6f7', center: true, fix: true, rot90: true, vBot: true, bold: true, bT: true }
const _AGG_REL_H: CS = { bg: '#f7f2f6', center: true, fix: true, rot90: true, vBot: true, bold: true, bT: true }
const _AGG_ABS_S: CS = { bg: '#f2f6f7', center: true, fix: true, vMid: true, italic: true, bT: true, bB: true }
const _AGG_REL_S: CS = { bg: '#f7f2f6', center: true, fix: true, vMid: true, italic: true, bT: true, bB: true }
const _AGG_ABS_N: CS = { bg: '#f2f6f7', center: true, fix: true, vMid: true }
const _AGG_REL_N: CS = { bg: '#f7f2f6', center: true, fix: true, vMid: true }
const _MAX_S:     CS = { bg: '#ededed', center: true, fix: true, vMid: true, italic: true, gray: true, bT: true, bB: true }
const _MAX_ABS:   CS = { bg: '#f2f6f7', center: true, fix: true, vMid: true, italic: true, gray: true, bT: true, bB: true }
const _MAX_REL:   CS = { bg: '#f7f2f6', center: true, fix: true, vMid: true, italic: true, gray: true, bT: true, bB: true }

function buildCellStyleDefs(): Record<string, CS> {
    const d: Record<string, CS> = {
        title:      { center: true, vMid: true, bold: true, fs11: true },
        'meta-title': { bold: true, vMid: true, fs11: true },
        normal:     { vMid: true },
        'leg-key':  { right: true, fix: true, vMid: true },
        'leg-desc': { vMid: true },
        // header row
        'header':       _HEADER,
        'header-gs':    v(_HEADER, { bL: true }),
        'header-FL':    v(_HEADER, { bL: true }),   // outer-left (first table column)
        // Ø row
        'sc':           _SC,
        'sc-gs':        v(_SC,    { bL: true }),
        'sc-FL':        v(_SC,    { bL: true }),     // outer-left
        // student rows
        'nc':           _NC,
        'nc-gs':        v(_NC,    { bL: true }),
        'nc-FL':        v(_NC,    { bL: true }),     // outer-left
        // max row
        'max-s':        _MAX_S,
        'max-gs':       v(_MAX_S, { bL: true }),
        'max-s-FL':     v(_MAX_S, { bL: true }),     // outer-left
    }

    // Agg variants: base + all L/R/LR combinations
    const aggBases: [string, CS][] = [
        ['agg-abs-h', _AGG_ABS_H], ['agg-rel-h', _AGG_REL_H],
        ['agg-abs-s', _AGG_ABS_S], ['agg-rel-s', _AGG_REL_S],
        ['agg-abs-n', _AGG_ABS_N], ['agg-rel-n', _AGG_REL_N],
        ['max-agg-abs', _MAX_ABS], ['max-agg-rel', _MAX_REL],
    ]
    for (const [name, base] of aggBases) {
        d[name]          = base
        d[`${name}-L`]   = v(base, { bL: true })
        d[`${name}-R`]   = v(base, { bR: true })
        d[`${name}-LR`]  = v(base, { bL: true, bR: true })
    }

    return d
}

// ── Agg-column style helpers ──────────────────────────────────────────────────

/** Effective type key: distinguishes absolute vs. relative and tracks aggType transitions. */
function aggTypeKey(col: TableauAggColumn): string {
    return (col.isPercent ? '%' : '') + (col.aggType ?? '')
}

/** Returns style name for an agg cell, appending -L / -R / -LR border suffixes. */
function aggSt(base: string, ac: TableauAggColumn[], i: number): string {
    const typeStart = i === 0 || aggTypeKey(ac[i]) !== aggTypeKey(ac[i - 1])
    const isLast = i === ac.length - 1
    const suffix = (typeStart ? 'L' : '') + (isLast ? 'R' : '')
    return suffix ? `${base}-${suffix}` : base
}

// ── Content XML ───────────────────────────────────────────────────────────────

function buildContentXml(data: TableauData, groupLabel: string, schoolName: string): string {
    const rows: string[] = []
    const ic = data.itemColumns
    const ac = data.aggColumns

    // ── Metadata rows (col A empty, content from col B) ────────────────────────
    rows.push(row([emptyCell(), strCell('Deutsch Kl. 8', 'meta-title')]))
    rows.push(row([emptyCell(), strCell(schoolName, 'normal')]))
    rows.push(row([emptyCell(), strCell(`Klasse: ${groupLabel}`, 'normal')]))
    rows.push(row([emptyCell()]))

    // ── Header row ─────────────────────────────────────────────────────────────
    const covarHeaders = ['SuS-Code', 'Geschlecht', 'Halbjahresnote', 'BL/SF', 'Ungen. D.Kenntn.']
    const pad = '  '
    const headerCells = [
        emptyCell(),
        strCell(pad + covarHeaders[0], 'header-FL', 'p-center'),
        ...covarHeaders.slice(1).map((h) => strCell(pad + h, 'header', 'p-center')),
        ...ic.map((col, i) => {
            const label = isGroupStart(ic, i) && col.taskName ? `${col.taskNumber} ${col.taskName}` : col.taskNumber
            return strCell(pad + label, gs('header', ic, i), 'p-center')
        }),
        ...ac.map((col, i) => strCell(pad + col.displayName, aggSt(col.isPercent ? 'agg-rel-h' : 'agg-abs-h', ac, i), 'p-center')),
    ]
    rows.push(row(headerCells, 'ro-header'))

    // ── (Max) row ──────────────────────────────────────────────────────────────
    const maxCells = [
        emptyCell(),
        strCell('(Max)', 'max-s-FL', 'p-center'),
        emptyCell('max-s'),
        emptyCell('max-s'),
        emptyCell('max-s'),
        emptyCell('max-s'),
        ...data.itemMaxVals.map((v, i) => numCell(v, isGroupStart(ic, i) ? 'max-gs' : 'max-s', undefined, 'p-center')),
        ...data.aggMaxVals.map((v, i) => numCell(v, aggSt(ac[i].isPercent ? 'max-agg-rel' : 'max-agg-abs', ac, i), undefined, 'p-center')),
    ]
    rows.push(row(maxCells, 'ro-data'))

    // ── Student rows ───────────────────────────────────────────────────────────
    for (const sr of data.studentRows) {
        const cells = [
            emptyCell(),
            strCell(sr.code, 'nc-FL', 'p-center'),
            strCell(displayGender(sr.covariates.gender), 'nc', 'p-center'),
            numCell(sr.covariates.hnote, 'nc', undefined, 'p-center'),
            strCell(displayBlsf(sr.covariates.blsf), 'nc', 'p-center'),
            strCell(displayDeuKennt(sr.covariates.DeuKennt), 'nc', 'p-center'),
            ...sr.itemScores.map((v, i) => numCell(v, gs('nc', ic, i), undefined, 'p-center')),
            ...sr.aggScores.map((v, i) =>
                numCell(v, aggSt(ac[i].isPercent ? 'agg-rel-n' : 'agg-abs-n', ac, i), ac[i].isPercent ? 1 : undefined, 'p-center'),
            ),
        ]
        rows.push(row(cells, 'ro-data'))
    }

    // ── Ø row ──────────────────────────────────────────────────────────────────
    const avgCells = [
        emptyCell(),
        strCell('Ø', 'sc-FL', 'p-center'),
        emptyCell('sc'),
        emptyCell('sc'),
        emptyCell('sc'),
        emptyCell('sc'),
        ...data.groupItemScores.map((v, i) => numCell(v, gs('sc', ic, i), 1, 'p-center')),
        ...data.groupAggScores.map((v, i) =>
            numCell(v, aggSt(ac[i].isPercent ? 'agg-rel-s' : 'agg-abs-s', ac, i), 1, 'p-center'),
        ),
    ]
    rows.push(row(avgCells, 'ro-data'))

    // ── Separator ──────────────────────────────────────────────────────────────
    rows.push(row([emptyCell()]))
    rows.push(row([emptyCell()]))

    // ── Legend ─────────────────────────────────────────────────────────────────
    // Heading in col K (11th, +1 for empty col A), key in col J (10th), description in col L (12th)
    rows.push(row([emptyCells(11), strCell('Erläuterungen zu den Spalten', 'title')]))
    for (const leg of data.legend) {
        rows.push(row([emptyCells(10), strCell(leg.key, 'leg-key'), emptyCell(), strCell(leg.description, 'leg-desc')]))
    }

    const cellStyles = renderCellStyles(buildCellStyleDefs())

    return `<?xml version="1.0" encoding="UTF-8"?>
<office:document-content
  xmlns:office="urn:oasis:names:tc:opendocument:xmlns:office:1.0"
  xmlns:table="urn:oasis:names:tc:opendocument:xmlns:table:1.0"
  xmlns:text="urn:oasis:names:tc:opendocument:xmlns:text:1.0"
  xmlns:fo="urn:oasis:names:tc:opendocument:xmlns:xsl-fo-compatible:1.0"
  xmlns:style="urn:oasis:names:tc:opendocument:xmlns:style:1.0"
  xmlns:number="urn:oasis:names:tc:opendocument:xmlns:datastyle:1.0"
  office:version="1.3">
  <office:automatic-styles>
    <!-- paragraph alignment (cross-app centering for numeric cells) -->
    <style:style style:name="p-center" style:family="paragraph">
      <style:paragraph-properties fo:text-align="center"/>
    </style:style>
${cellStyles}
    <!-- row / column dimensions -->
    <style:style style:name="ro-header" style:family="table-row">
      <style:table-row-properties style:row-height="5.75cm" style:use-optimal-row-height="false"/>
    </style:style>
    <style:style style:name="ro-data" style:family="table-row">
      <style:table-row-properties style:row-height="0.65cm" style:use-optimal-row-height="false"/>
    </style:style>
    <style:style style:name="co-suscode" style:family="table-column">
      <style:table-column-properties style:column-width="1.2cm"/>
    </style:style>
    <style:style style:name="co-narrow" style:family="table-column">
      <style:table-column-properties style:column-width="0.6cm"/>
    </style:style>
    <style:style style:name="co-blsf" style:family="table-column">
      <style:table-column-properties style:column-width="1.4cm"/>
    </style:style>
    <style:style style:name="co-deukennt" style:family="table-column">
      <style:table-column-properties style:column-width="0.8cm"/>
    </style:style>
    <style:style style:name="co-item" style:family="table-column">
      <style:table-column-properties style:column-width="1.0cm"/>
    </style:style>
    <style:style style:name="co-agg" style:family="table-column">
      <style:table-column-properties style:column-width="1.2cm"/>
    </style:style>
  </office:automatic-styles>
  <office:body>
    <office:spreadsheet>
      <table:table table:name="Tabellarische Auswertung">
        <table:table-column table:style-name="co-item"/>
        <table:table-column table:style-name="co-suscode"/>
        <table:table-column table:style-name="co-narrow" table:number-columns-repeated="2"/>
        <table:table-column table:style-name="co-blsf"/>
        <table:table-column table:style-name="co-deukennt"/>
        <table:table-column table:style-name="co-item" table:number-columns-repeated="${data.itemColumns.length}"/>
        <table:table-column table:style-name="co-agg" table:number-columns-repeated="${data.aggColumns.length}"/>
        ${rows.join('\n        ')}
      </table:table>
    </office:spreadsheet>
  </office:body>
</office:document-content>`
}

function buildManifest(): string {
    return `<?xml version="1.0" encoding="UTF-8"?>
<manifest:manifest
  xmlns:manifest="urn:oasis:names:tc:opendocument:xmlns:manifest:1.0"
  manifest:version="1.3">
  <manifest:file-entry manifest:full-path="/" manifest:version="1.3" manifest:media-type="application/vnd.oasis.opendocument.spreadsheet"/>
  <manifest:file-entry manifest:full-path="content.xml" manifest:media-type="text/xml"/>
</manifest:manifest>`
}

// ── Public API ────────────────────────────────────────────────────────────────

export function generateOds(data: TableauData, groupLabel: string, schoolName: string): Blob {
    const contentXml = buildContentXml(data, groupLabel, schoolName)
    const zip = zipSync(
        {
            mimetype: [strToU8('application/vnd.oasis.opendocument.spreadsheet'), { level: 0 }],
            'META-INF/manifest.xml': strToU8(buildManifest()),
            'content.xml': strToU8(contentXml),
        },
        { comment: 'ODS generated by KT-Report' },
    )
    return new Blob([zip.buffer as ArrayBuffer], { type: 'application/vnd.oasis.opendocument.spreadsheet' })
}

export function triggerDownload(blob: Blob, filename: string): void {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    a.click()
    URL.revokeObjectURL(url)
}
