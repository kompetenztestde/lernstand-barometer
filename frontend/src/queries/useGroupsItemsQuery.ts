import { computed, type Ref } from 'vue'
import { useQueries, useQuery } from '@tanstack/vue-query'
import { useAuthHeaders } from '@/composables/useAuthHeaders'

const TBA3_DATA_API_URL = import.meta.env.VITE_TBA3_DATA_API_URL
const tgId = import.meta.env.VITE_TEST_GROUP
const testId = import.meta.env.VITE_TEST_ID

type ApiItemParameters = {
    logit: number | null
    bistaPoints: number | null
    solutionFrequencyGymnasium: number | null
    solutionFrequencyNonGymnasium: number | null
    competenceLevel: { name: string; nameShort: string; description: string } | null
    coreIdea: { name: string; nameShort: string; description: string } | null
    cognitiveDemandLevel: { name: string; nameShort: string; description: string } | null
    generalMathematicalCompetence: { name: string; nameShort: string; description: string }[]
    domain: { name: string; nameShort: string; description: string }[]
    competences: { name: string; nameShort: string; description: string }[]
}

export type ApiGroupItem = {
    iqbId: string
    name: string
    position: number
    parameters: ApiItemParameters
    descriptiveStatistics: {
        total: number | null
        frequency: number | null
        mean: number | null
        meanComparison: number | null
        frequencyComparison: number | null
        standardDeviation: number | null
    }
}

export type ApiGroupItems = {
    groupData?: {
        groupId: number
        groupName: string
        schoolForm: string | null
        items: ApiGroupItem[]
    }
}

type ApiResponse = {
    success: boolean
    data?: ApiGroupItems
}

async function fetchGroupItems(groupId: number, headers: HeadersInit): Promise<ApiGroupItems> {
    const res = await fetch(`${TBA3_DATA_API_URL}/test-groups/${tgId}/tests/${testId}/groups/${groupId}/items?type=group`, { headers })
    if (!res.ok) throw new Error(`Fehler beim Laden der Aufgaben (${res.status})`)
    const json: ApiResponse = await res.json()
    return json.data ?? {}
}

async function fetchStudentItems(groupId: number, studentCode: string, headers: HeadersInit): Promise<ApiGroupItems> {
    const res = await fetch(
        `${TBA3_DATA_API_URL}/test-groups/${tgId}/tests/${testId}/groups/${groupId}/items?type=students&student-code=${encodeURIComponent(studentCode)}`,
        { headers },
    )
    if (!res.ok) throw new Error(`Fehler beim Laden der Schüleraufgaben (${res.status})`)
    const json: { success: boolean; data?: { studentsData?: { code: string; items: ApiGroupItem[] }[] } } = await res.json()
    // The API returns `studentsData` (not `groupData`) when a student-code is supplied.
    // Normalise into the groupData shape so all consumers stay consistent.
    const items = json.data?.studentsData?.find((s) => s.code === studentCode)?.items ?? json.data?.studentsData?.[0]?.items ?? []
    return { groupData: { groupId, groupName: '', schoolForm: null, items } }
}

export function useStudentItemsQuery(groupId: Ref<number | null>, studentCode: Ref<string | null>) {
    const { getHeaders } = useAuthHeaders()
    return useQuery({
        queryKey: computed(() => ['student-items', tgId, testId, groupId.value, studentCode.value]),
        queryFn: () => fetchStudentItems(groupId.value!, studentCode.value!, getHeaders()),
        enabled: computed(() => groupId.value !== null && studentCode.value !== null),
        retry: 1,
    })
}

/**
 * Demo variant: scans all participated groups in parallel to find student items by code.
 * Used when no groupId is available (demo-student login).
 */
export function useDemoStudentItemsQuery(groupIds: Ref<number[]>, studentCode: Ref<string | null>) {
    const { getHeaders } = useAuthHeaders()
    const results = useQueries({
        queries: computed(() =>
            groupIds.value.map((groupId) => ({
                queryKey: ['student-items', tgId, testId, groupId, studentCode.value],
                queryFn: () => fetchStudentItems(groupId, studentCode.value!, getHeaders()),
                enabled: studentCode.value !== null && groupIds.value.length > 0,
                retry: 1,
            })),
        ),
    })
    const data = computed(() => {
        for (const result of results.value) {
            if (result.data?.groupData?.items?.length) return result.data
        }
        return undefined
    })
    const isPending = computed(() => data.value === undefined && results.value.some((r) => r.isPending))
    return { data, isPending }
}

/**
 * Maps the API's `parameters.competenceLevel.nameShort` to a roman numeral ('I'–'V').
 *
 * The API returns mixed formats depending on the item: arabic numbers ('1', '2'…),
 * arabic sub-levels ('1a', '1b'), or roman numerals ('I', 'Ia', 'Ib', 'II'…).
 * Both '1a' and '1b' collapse to level 'I' since the app only distinguishes five levels.
 * Lookup is case-insensitive. If no match is found, the raw value is passed through.
 */
const compLvlToRoman: Record<string, string> = {
    '1': 'I',
    '1a': 'I',
    '1b': 'I',
    ia: 'I',
    ib: 'I',
    i: 'I',
    '2': 'II',
    ii: 'II',
    '3': 'III',
    iii: 'III',
    '4': 'IV',
    iv: 'IV',
    '5': 'V',
    v: 'V',
}

export type TaskListItem = {
    iqbId: string
    position: number
    taskNumber: string
    name: string
    domain: string
    competenceLevel: string
    total: number | null // max possible score (max_val); used to determine solved state
    frequency: number | null // raw score for student items (-1 = no data); count for group items
    mean: number | null // only present for group items (0–100 %)
    meanCorrected: number | null
    competenceId: { name: string; nameShort: string; description: string } | null
    cognitiveDemandLevel: { name: string; nameShort: string; description: string } | null
}

/**
 * Resolves the internal domain ID ('le' | 'rs') from an API item.
 *
 * The API's `parameters.domain[0].nameShort` is inconsistent: observed values include
 * 'lesen', 'LE', 'l', 'orthografie', 'RS', etc. — none of which directly match the
 * app's internal IDs. Resolution order:
 *   1. Exact match ('le' / 'rs') — future-proof if the API normalises.
 *   2. Prefix match on the lowercased nameShort ('les…' → 'le', 'ort…'/'rec…' → 'rs').
 *   3. iqbId prefix fallback: item IDs follow the pattern 'iDL…' (Lesen) / 'iDO…'
 *      (Orthografie), which is stable across API versions.
 */
function mapDomain(item: ApiGroupItem): string {
    const raw = (item.parameters.domain[0]?.nameShort ?? '').toLowerCase()
    if (raw === 'le' || raw === 'rs') return raw
    if (raw.startsWith('les') || raw === 'l') return 'le'
    if (raw.startsWith('ort') || raw.startsWith('rec') || raw === 'o') return 'rs'
    const prefix = item.iqbId.slice(0, 3).toUpperCase()
    if (prefix === 'IDL') return 'le'
    if (prefix === 'IDO') return 'rs'
    return raw
}

/**
 * Maps raw API items to the shape expected by TaskList.
 *
 * Two API quirks are handled here:
 *
 * 1. **Item name / task name**: The API `name` field doubles as both a task number and
 *    (for the first item in a task group) the human-readable task title. For example:
 *      - "1.1 Sportunterricht" → taskNumber "1.1", name "Sportunterricht"
 *      - "1.2"                 → taskNumber "1.2", name "Sportunterricht" (carried forward)
 *    Items are sorted by `position` first; the last seen name is reused until a new one
 *    appears (i.e. the next `name` field containing a space).
 *
 * 2. **nameShort normalisation**: Both `domain` and `competenceLevel` use `nameShort`
 *    values that do not match the app's internal IDs — see `mapDomain` and
 *    `compLvlToRoman` for the mapping details.
 */
export function mapItemsToTaskList(items: ApiGroupItem[]): TaskListItem[] {
    const sorted = [...items].sort((a, b) => a.position - b.position)
    let currentName = ''
    return sorted.map((item) => {
        const spaceIdx = item.name.indexOf(' ')
        let taskNumber: string
        let taskName: string
        if (spaceIdx !== -1) {
            taskNumber = item.name.slice(0, spaceIdx)
            taskName = item.name.slice(spaceIdx + 1)
            currentName = taskName
        } else {
            taskNumber = item.name
            taskName = currentName
        }
        const domain = mapDomain(item)
        const rawLvl = item.parameters.competenceLevel?.nameShort ?? ''
        const competenceLevel = compLvlToRoman[rawLvl.toLowerCase()] ?? rawLvl
        return {
            iqbId: item.iqbId,
            position: item.position,
            taskNumber,
            name: taskName,
            domain,
            competenceLevel,
            total: item.descriptiveStatistics.total,
            frequency: item.descriptiveStatistics.frequency,
            mean: item.descriptiveStatistics.mean ?? null,
            meanCorrected: item.descriptiveStatistics.meanComparison ?? null,
            competenceId: item.parameters.competences[0] ?? null,
            cognitiveDemandLevel: item.parameters.cognitiveDemandLevel,
        }
    })
}

const compLvlOrder = ['I', 'II', 'III', 'IV', 'V'] as const
const compLvlRank: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5 }

/**
 * Whether the student fully solved this item.
 *
 * For student queries the API only returns `total` (max_val) and `frequency`
 * (raw score, or -1 when no data). `mean` is absent from student item responses.
 * An item is solved when the student's raw score equals the maximum possible score.
 *
 * For group queries `mean` (0–100 %) is the fallback.
 */
function isSolved(item: TaskListItem): boolean {
    if (item.total !== null && item.frequency !== null && item.frequency >= 0) {
        return item.frequency >= item.total
    }
    return item.mean !== null && item.mean >= 99
}

/**
 * Whether the item has any recorded data for this student.
 * frequency === -1 is the PHP sentinel meaning "no data".
 */
function isAttempted(item: TaskListItem): boolean {
    if (item.frequency !== null) return item.frequency >= 0
    return item.mean !== null
}

function pickItems(all: TaskListItem[], taskNumbers: string[]): TaskListItem[] {
    const nums = new Set(taskNumbers)
    return all.filter((i) => nums.has(i.taskNumber))
}

/**
 * Picks up to `maxCount` unsolved items to practise, ordered by ascending competence level.
 * Falls back to position order for items whose competence level isn't recognised.
 */
function buildUnsolvedSuggestions(items: TaskListItem[], maxCount = 3): string[] {
    const suggestions: string[] = []
    for (const level of compLvlOrder) {
        for (const item of items.filter((i) => i.competenceLevel === level)) {
            suggestions.push(item.taskNumber)
            if (suggestions.length >= maxCount) return suggestions
        }
    }
    // Fallback: items with unrecognised levels, sorted by test position
    if (suggestions.length < maxCount) {
        const known = new Set(suggestions)
        const unranked = items
            .filter((i) => !compLvlOrder.includes(i.competenceLevel as (typeof compLvlOrder)[number]))
            .sort((a, b) => a.position - b.position)
        for (const item of unranked) {
            if (!known.has(item.taskNumber)) suggestions.push(item.taskNumber)
            if (suggestions.length >= maxCount) return suggestions
        }
    }
    return suggestions
}

/**
 * Picks up to `maxCount` solved items, ordered by descending competence level
 * (hardest first), then by descending position as a secondary proxy for difficulty.
 */
function buildSolvedSuggestions(items: TaskListItem[], maxCount = 3): string[] {
    return [...items]
        .sort((a, b) => {
            const rankDiff = (compLvlRank[b.competenceLevel] ?? 0) - (compLvlRank[a.competenceLevel] ?? 0)
            return rankDiff !== 0 ? rankDiff : b.position - a.position
        })
        .slice(0, maxCount)
        .map((i) => i.taskNumber)
}

/**
 * Shared composable used by both the student dialogue (StudentSelfEvaluationPage)
 * and the teacher preview (SelfEvaluationPage).
 *
 * Returns reactive task suggestion lists derived from the already-mapped item array.
 * Pass the `studentItems` computed ref from either page directly.
 */
export function useTaskSuggestions(items: Ref<TaskListItem[]>) {
    const failed = computed(() => items.value.filter((i) => isAttempted(i) && !isSolved(i)))
    const solved = computed(() => items.value.filter(isSolved))
    const solvedAll = computed(() => items.value.length > 0 && failed.value.length === 0)

    const unsolvedTaskNumbers = computed(() => buildUnsolvedSuggestions(failed.value))
    const solvedTaskNumbers = computed(() => buildSolvedSuggestions(solved.value))

    // Full item objects for richer display (e.g. teacher preview)
    const unsolvedItems = computed(() => pickItems(failed.value, unsolvedTaskNumbers.value))
    const solvedItems = computed(() => pickItems(solved.value, solvedTaskNumbers.value))

    return {
        solvedAll,
        unsolvedTasks: unsolvedTaskNumbers, // string[] — for TaskListBox
        solvedTasks: solvedTaskNumbers, // string[] — for TaskListBox
        unsolvedItems, // TaskListItem[] — for rich display
        solvedItems, // TaskListItem[] — for rich display
    }
}

export function useGroupItemsQuery(groupId: Ref<number | null>) {
    const { getHeaders } = useAuthHeaders()
    return useQuery({
        queryKey: computed(() => ['group-items', tgId, testId, groupId.value]),
        queryFn: () => fetchGroupItems(groupId.value!, getHeaders()),
        enabled: computed(() => groupId.value !== null),
        retry: 1,
    })
}

export function useGroupsItemsQuery(groupIds: Ref<number[]>) {
    const { getHeaders } = useAuthHeaders()
    const queries = computed(() =>
        groupIds.value.map((groupId) => ({
            queryKey: ['group-items', tgId, testId, groupId],
            queryFn: () => fetchGroupItems(groupId, getHeaders()),
            retry: 1,
        })),
    )
    return useQueries({ queries })
}
