import { computed, type Ref } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthHeaders } from '@/composables/useAuthHeaders'

const TBA3_DATA_API_URL = import.meta.env.VITE_TBA3_DATA_API_URL
const tgId = import.meta.env.VITE_TEST_GROUP
const testId = import.meta.env.VITE_TEST_ID

// ── API shapes ────────────────────────────────────────────────────────────────

type ApiStats = {
    total: number | null
    mean: number | null
    frequency: number | null
    meanComparison: number | null
    frequencyComparison: number | null
    standardDeviation: number | null
}

type ApiItem = {
    iqbId: string
    name: string
    position: number
    descriptiveStatistics: ApiStats
}

type ApiAgg = {
    type: string | null
    value: string | null
    ktColumnName: string
    descriptiveStatistics: ApiStats
}

type ApiCovariate = Record<string, string | number | null>

// /items?type=students  →  { data: { studentsData: [...] } }
type ApiStudentItemData = {
    code: string
    covariates: ApiCovariate[]
    items: ApiItem[]
}

// /aggregations?type=students  →  { data: { studentsData: [...] } }
type ApiStudentAggData = {
    code: string
    aggregations: ApiAgg[]
}

// /items?type=group  →  { data: { groupData: { ... } } }
type ApiGroupItemsData = {
    groupData?: { groupId: number; groupName: string; items: ApiItem[] }
}

// /aggregations?type=group  →  { data: { groupData: { ... } } }
type ApiGroupAggsData = {
    groupData?: {
        groupId: number
        groupName: string
        numberOfStudents: number
        aggregations: ApiAgg[]
    }
}

// ── Output types ──────────────────────────────────────────────────────────────

export type TableauItemColumn = {
    iqbId: string
    taskNumber: string
    taskName: string
    maxVal: number | null
    position: number
}

export type TableauAggColumn = {
    ktColumnName: string
    displayName: string
    maxVal: number | null
    isPercent: boolean
    aggType: string | null
}

export type CovariateValues = {
    gender: string | null
    hnote: number | null
    blsf: number | null
    DeuKennt: number | null
}

export type TableauStudentRow = {
    code: string
    covariates: CovariateValues
    // indexed to itemColumns; null = no data
    itemScores: (number | null)[]
    // indexed to aggColumns; frequency for raw cols, mean for % cols
    aggScores: (number | null)[]
}

export type TableauLegendRow = {
    key: string
    description: string
}

export type TableauData = {
    groupId: number
    groupName: string
    numberOfStudents: number
    itemColumns: TableauItemColumn[]
    aggColumns: TableauAggColumn[]
    studentRows: TableauStudentRow[]
    // Ø row – frequency (raw mean) per item, frequency/mean per agg col
    groupItemScores: (number | null)[]
    groupAggScores: (number | null)[]
    // Max row
    itemMaxVals: (number | null)[]
    aggMaxVals: (number | null)[]
    legend: TableauLegendRow[]
}

// ── Covariate helpers ─────────────────────────────────────────────────────────

function parseCovariates(raw: ApiCovariate[]): CovariateValues {
    const flat: Record<string, string | number | null> = Object.assign({}, ...raw)
    return {
        gender: typeof flat.gender === 'string' ? flat.gender : null,
        hnote: typeof flat.hnote === 'number' ? flat.hnote : null,
        blsf: typeof flat.blsf === 'number' ? flat.blsf : null,
        DeuKennt: typeof flat.DeuKennt === 'number' ? flat.DeuKennt : null,
    }
}

// ── Legend ────────────────────────────────────────────────────────────────────

const compLvlRs: Record<string, string> = {
    '1a': 'Phonographische und einfache silbische Schreibungen sowie Großschreibung von Konkreta',
    '1b': 'Ansatzweise Markierung von Vokalkürze und Vokallänge, Schreibungen mit konsonantischen und vokalischen Ableitungen sowie Großschreibung von Abstrakta',
    '2': 'Teilweise Beachtung von Morphemkonstanz, Großschreibung von Nominalisierungen und Zeichensetzung',
    '3': 'Weitgehendes Beherrschen von Wortschreibungs- und Zeichensetzungsregeln',
    '4': 'Identifizierung von Fehlerschwerpunkten, Ableitung von Rechtschreibregeln und Beherrschen der Zeichensetzung',
    '5': 'Korrektur schwer ableitbarer und morphologisch komplexer Wörter sowie sicheres Beherrschen der Zeichensetzung',
}

const compLvlLe: Record<string, string> = {
    '1a': 'Lokalisieren und Wiedergeben prominenter Einzelinformationen',
    '1b': 'Benachbarte Informationen miteinander verknüpfen',
    '2': 'Informationen miteinander verknüpfen und Textstrukturen erfassen',
    '3': 'Verstreute Informationen miteinander verknüpfen und den Text ansatzweise als Ganzen erfassen',
    '4': 'Auf der Ebene des Textes wesentliche Zusammenhänge erkennen und die Textgestaltung reflektieren',
    '5': 'Interpretieren, Begründen und Bewerten',
}

const cogDemand: Record<string, string> = {
    '1': 'Informationen aus dem Stimulus wiedergegeben',
    '2': 'Verknüpfen von Informationen',
    '3': 'Reflexion und Beurteilung von Informationen aus dem Stimulus',
    i: 'Informationen aus dem Stimulus wiedergegeben',
    ii: 'Verknüpfen von Informationen',
    iii: 'Reflexion und Beurteilung von Informationen aus dem Stimulus',
}

const bildungsstandard: Record<string, string> = {
    '2.5': 'Richtig schreiben',
    '3.3': 'Literarische Texte verstehen und nutzen',
    '3.4': 'Sach- und Gebrauchstexte verstehen und nutzen',
    '4.3': 'Leistungen von Sätzen und Wortarten kennen und für Sprechen, Schreiben (für MSA: und Textuntersuchung) nutzen',
}

function aggDescription(type: string | null, value: string | null): string {
    const v = (value ?? '').toLowerCase()
    switch (type) {
        case 'domain':
            return value ?? ''
        case 'competenceLevelOrthography':
            return compLvlRs[v] ?? value ?? ''
        case 'competenceLevelReading':
            return compLvlLe[v] ?? value ?? ''
        case 'cognitiveDemandLevel':
            return cogDemand[v] ?? value ?? ''
        case 'standard':
            return bildungsstandard[value ?? ''] ?? value ?? ''
        case 'total':
            return 'Summe der Punktwerte aller Teilaufgaben'
        default:
            return value ?? ''
    }
}

function buildLegend(groupAggs: ApiAgg[]): TableauLegendRow[] {
    return groupAggs
        .filter((a) => !a.ktColumnName.startsWith('%') && !excludedAggColumns.has(a.ktColumnName))
        .map((a) => ({ key: buildAggDisplayName(a), description: aggDescription(a.type, a.value) }))
}

// ── Friendly column names ─────────────────────────────────────────────────────

// Columns to remove entirely (KT-internal, not relevant for display)
const excludedAggColumns = new Set(['cTB_Lesen_ohne2_8'])

function buildAggDisplayName(agg: ApiAgg): string {
    const isPercent = agg.ktColumnName.startsWith('% ')
    const base = isPercent ? agg.ktColumnName.slice(2) : agg.ktColumnName
    const v = agg.value ?? ''

    let label: string
    switch (agg.type) {
        case 'domain':
            label = v
            break
        case 'competenceLevelOrthography':
            label = `Kompetenzstufe Orthografie ${v}`
            break
        case 'competenceLevelReading':
            label = `Kompetenzstufe Lesen ${v}`
            break
        case 'cognitiveDemandLevel':
            label = `Anforderungsbereich ${v}`
            break
        case 'standard':
        case 'competenceId':
            label = `Bildungsstandard ${v}`
            break
        case 'total':
            label = v || 'Gesamt'
            break
        default:
            label = base
    }

    return isPercent ? `% ${label}` : label
}

// ── Assembly ──────────────────────────────────────────────────────────────────

function assembleTableauData(
    groupItemsData: ApiGroupItemsData,
    groupAggsData: ApiGroupAggsData,
    studentItems: ApiStudentItemData[],
    studentAggs: ApiStudentAggData[],
): TableauData {
    const gd = groupAggsData.groupData
    const gi = groupItemsData.groupData

    const groupId = gd?.groupId ?? gi?.groupId ?? 0
    const groupName = gd?.groupName ?? gi?.groupName ?? ''
    const numberOfStudents = gd?.numberOfStudents ?? studentItems.length

    // 1. Item columns (sorted by position)
    const sortedGroupItems = [...(gi?.items ?? [])].sort((a, b) => a.position - b.position)
    let currentTaskName = ''
    const itemColumns: TableauItemColumn[] = sortedGroupItems.map((item) => {
        const spaceIdx = item.name.indexOf(' ')
        let taskNumber: string, taskName: string
        if (spaceIdx !== -1) {
            taskNumber = item.name.slice(0, spaceIdx)
            taskName = item.name.slice(spaceIdx + 1)
            currentTaskName = taskName
        } else {
            taskNumber = item.name
            taskName = currentTaskName
        }
        return { iqbId: item.iqbId, taskNumber, taskName, maxVal: item.descriptiveStatistics.total, position: item.position }
    })

    // 2. Aggregation columns – only non-% base columns from API; relative columns are derived
    const rawGroupAggs = gd?.aggregations ?? []
    const absoluteGroupAggs = rawGroupAggs.filter(
        (a) => !a.ktColumnName.startsWith('%') && !excludedAggColumns.has(a.ktColumnName),
    )
    const aggColumns: TableauAggColumn[] = [
        ...absoluteGroupAggs.map((agg) => ({
            ktColumnName: agg.ktColumnName,
            displayName: buildAggDisplayName(agg),
            maxVal: agg.descriptiveStatistics.total ?? null,
            isPercent: false,
            aggType: agg.type,
        })),
        ...absoluteGroupAggs.map((agg) => ({
            ktColumnName: '% ' + agg.ktColumnName,
            displayName: '% ' + buildAggDisplayName(agg),
            maxVal: 100 as number | null,
            isPercent: true,
            aggType: agg.type,
        })),
    ]

    // Index maps
    const itemIdxByIqbId = new Map(itemColumns.map((c, i) => [c.iqbId, i]))
    const aggIdxByName = new Map(aggColumns.map((c, i) => [c.ktColumnName, i]))

    // 3. Student rows
    const covarByCode = new Map(studentItems.map((s) => [s.code, parseCovariates(s.covariates)]))
    const aggByCode = new Map(studentAggs.map((s) => [s.code, s.aggregations]))

    const studentRows: TableauStudentRow[] = studentItems.filter((sd) => !!sd.code).map((sd) => {
        const itemScores: (number | null)[] = new Array(itemColumns.length).fill(null)
        const aggScores: (number | null)[] = new Array(aggColumns.length).fill(null)

        for (const item of sd.items) {
            const idx = itemIdxByIqbId.get(item.iqbId)
            if (idx !== undefined) {
                const f = item.descriptiveStatistics.frequency
                itemScores[idx] = f !== null && f >= 0 ? f : null
            }
        }

        for (const agg of aggByCode.get(sd.code) ?? []) {
            if (agg.ktColumnName.startsWith('%')) continue
            const absIdx = aggIdxByName.get(agg.ktColumnName)
            if (absIdx !== undefined) aggScores[absIdx] = agg.descriptiveStatistics.frequency ?? null
            const relIdx = aggIdxByName.get('% ' + agg.ktColumnName)
            if (relIdx !== undefined) aggScores[relIdx] = agg.descriptiveStatistics.mean ?? null
        }

        return {
            code: sd.code,
            covariates: covarByCode.get(sd.code) ?? { gender: null, hnote: null, blsf: null, DeuKennt: null },
            itemScores,
            aggScores,
        }
    })

    // 4. Group (Ø) row
    const groupItemScores: (number | null)[] = new Array(itemColumns.length).fill(null)
    for (const item of sortedGroupItems) {
        const idx = itemIdxByIqbId.get(item.iqbId)
        if (idx !== undefined) {
            groupItemScores[idx] = item.descriptiveStatistics.frequency ?? null
        }
    }

    const groupAggScores: (number | null)[] = new Array(aggColumns.length).fill(null)
    for (const agg of absoluteGroupAggs) {
        const absIdx = aggIdxByName.get(agg.ktColumnName)
        if (absIdx !== undefined) groupAggScores[absIdx] = agg.descriptiveStatistics.frequency ?? null
        const relIdx = aggIdxByName.get('% ' + agg.ktColumnName)
        if (relIdx !== undefined) groupAggScores[relIdx] = agg.descriptiveStatistics.mean ?? null
    }

    return {
        groupId,
        groupName,
        numberOfStudents,
        itemColumns,
        aggColumns,
        studentRows,
        groupItemScores,
        groupAggScores,
        itemMaxVals: itemColumns.map((c) => c.maxVal),
        aggMaxVals: aggColumns.map((c) => c.maxVal),
        legend: buildLegend(absoluteGroupAggs),
    }
}

// ── Fetch ─────────────────────────────────────────────────────────────────────

async function fetchTableauData(groupId: number, headers: HeadersInit): Promise<TableauData> {
    const base = `${TBA3_DATA_API_URL}/test-groups/${tgId}/tests/${testId}/groups/${groupId}`

    const [siRes, saRes, giRes, gaRes] = await Promise.all([
        fetch(`${base}/items?type=students`, { headers }),
        fetch(`${base}/aggregations?type=students`, { headers }),
        fetch(`${base}/items?type=group`, { headers }),
        fetch(`${base}/aggregations?type=group`, { headers }),
    ])

    for (const [label, res] of [
        ['items/students', siRes],
        ['aggregations/students', saRes],
        ['items/group', giRes],
        ['aggregations/group', gaRes],
    ] as [string, Response][]) {
        if (!res.ok) throw new Error(`Tableau: Fehler beim Laden von ${label} (${res.status})`)
    }

    const [siJson, saJson, giJson, gaJson] = await Promise.all([siRes.json(), saRes.json(), giRes.json(), gaRes.json()])

    return assembleTableauData(
        (giJson.data ?? {}) as ApiGroupItemsData,
        (gaJson.data ?? {}) as ApiGroupAggsData,
        (siJson.data?.studentsData ?? []) as ApiStudentItemData[],
        (saJson.data?.studentsData ?? []) as ApiStudentAggData[],
    )
}

export function useTableauQuery(groupId: Ref<number | null>) {
    const { getHeaders } = useAuthHeaders()
    return useQuery({
        queryKey: computed(() => ['tableau', tgId, testId, groupId.value]),
        queryFn: () => fetchTableauData(groupId.value!, getHeaders()),
        enabled: computed(() => groupId.value !== null),
        retry: 1,
        staleTime: 5 * 60 * 1000,
    })
}

// ── Display helpers (used by both component and generate*) ────────────────────

export function displayGender(v: string | null): string {
    if (v === 'male') return 'm'
    if (v === 'female') return 'w'
    if (v === 'diverse') return 'd'
    return ''
}

export function displayBlsf(v: number | null): string {
    if (v === null) return ''
    if (v === 0) return 'Keine'
    return `SF${v}`
}

export function displayDeuKennt(v: number | null): string {
    return v === 1 ? 'Ja' : ''
}

export function formatNum(v: number | null): string {
    if (v === null) return ''
    // avoid unnecessary trailing zeros
    return String(Math.round(v * 1000) / 1000)
}
