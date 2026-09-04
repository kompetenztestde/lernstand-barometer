import { computed, ref, type Ref } from 'vue'
import { useQuery, useQueries } from '@tanstack/vue-query'
import { useAuthHeaders } from '@/composables/useAuthHeaders'
import { getCompLvlDescription } from '@/queries/useItemParamDefsQuery'

const TBA3_DATA_API_URL = import.meta.env.VITE_TBA3_DATA_API_URL
const tgId = import.meta.env.VITE_TEST_GROUP
const testId = import.meta.env.VITE_TEST_ID
const mathTestIds = [import.meta.env.VITE_MATH_TEST_ID_A, import.meta.env.VITE_MATH_TEST_ID_B] as const

export function normalizeLevel(level: string): string {
    if (level === 'Ia' || level === 'Ib') return 'I'
    return level
}

const levelMeta = {
    I: { labelLong: 'Kompetenzstufe I', labelShort: 'KS I', color: 'var(--color-competence-level-1)' },
    II: { labelLong: 'Kompetenzstufe II', labelShort: 'KS II', color: 'var(--color-competence-level-2)' },
    III: { labelLong: 'Kompetenzstufe III', labelShort: 'KS III', color: 'var(--color-competence-level-3)' },
    IV: { labelLong: 'Kompetenzstufe IV', labelShort: 'KS IV', color: 'var(--color-competence-level-4)' },
    V: { labelLong: 'Kompetenzstufe V', labelShort: 'KS V', color: 'var(--color-competence-level-5)' },
} as const

const orderedLevels = ['I', 'II', 'III', 'IV', 'V'] as const

export type DonutDataElement = {
    id: string
    labelLong: string
    labelShort: string
    color: string
    value: number
}

export type ApiStudentCompetenceLevel = {
    value: string
    subject: { name: string; id: string }
    domain?: { name: string; id: string } | null
}

export type ApiStudentCompetenceLevels = {
    code: string
    competenceLevels: ApiStudentCompetenceLevel[]
}

export type ApiGroupCompetenceLevelEntry = {
    nameShort: string
    name: string
    descriptiveStatistics: {
        frequency: number
        total: number
        mean: number | null
    }
}

export type ApiGroupCompetenceLevelDomain = {
    name: string
    domain?: { name: string; id: string } | null
    subject: { name: string; id: string }
    competenceLevels: ApiGroupCompetenceLevelEntry[]
}

export type ApiCompetenceLevelsResponse = {
    groupData?: ApiGroupCompetenceLevelDomain[]
    studentsData?: ApiStudentCompetenceLevels[]
}

type ApiResponse = {
    success: boolean
    data?: ApiCompetenceLevelsResponse
}

export function mapToDonutData(groupData: ApiGroupCompetenceLevelDomain[], domainId: string): DonutDataElement[] {
    const domainData = groupData.find((d) => d.domain?.id === domainId)
    if (!domainData) return []

    return orderedLevels.map((level) => {
        const entry = domainData.competenceLevels.find((cl) => cl.nameShort === level)
        return {
            id: `${domainId}_${level}`,
            ...levelMeta[level],
            description: getCompLvlDescription(domainId, level),
            value: Math.round((entry?.descriptiveStatistics.mean ?? 0) * 100),
        }
    })
}

async function fetchCompetenceLevels(
    groupId: number,
    headers: HeadersInit,
    fetchTestId: string = testId,
): Promise<ApiCompetenceLevelsResponse> {
    const res = await fetch(
        `${TBA3_DATA_API_URL}/test-groups/${tgId}/tests/${fetchTestId}/groups/${groupId}/competence-levels?type=group%2Cstudents`,
        { headers },
    )
    if (!res.ok) throw new Error(`Fehler beim Laden der Kompetenzstufen (${res.status})`)
    const json: ApiResponse = await res.json()
    return json.data ?? {}
}

async function fetchStudentCompetenceLevels(
    groupId: number,
    studentCode: string,
    headers: HeadersInit,
): Promise<ApiStudentCompetenceLevels[]> {
    const res = await fetch(
        `${TBA3_DATA_API_URL}/test-groups/${tgId}/tests/${testId}/groups/${groupId}/competence-levels?type=students&student-code=${encodeURIComponent(studentCode)}`,
        { headers },
    )
    if (!res.ok) throw new Error(`Fehler beim Laden der Schülerergebnisse (${res.status})`)
    const json: { success: boolean; data?: { studentsData?: ApiStudentCompetenceLevels[] } } = await res.json()
    return json.data?.studentsData ?? []
}

export function useStudentCompetenceLevelsQuery(studentCode: Ref<string | null>, groupId: Ref<number | null>) {
    const { getHeaders } = useAuthHeaders()
    return useQuery({
        queryKey: computed(() => ['student-competence-levels', tgId, testId, groupId.value, studentCode.value]),
        queryFn: () => fetchStudentCompetenceLevels(groupId.value!, studentCode.value!, getHeaders()),
        enabled: computed(() => studentCode.value !== null && groupId.value !== null),
        staleTime: 10 * 60 * 1000,
        retry: 1,
    })
}

/**
 * Demo variant: scans all participated groups in parallel to find the student by code.
 * Used when no groupId is available (demo-student login).
 */
export function useDemoStudentCompetenceLevelsQuery(studentCode: Ref<string | null>, groupIds: Ref<number[]>) {
    const { getHeaders } = useAuthHeaders()
    const results = useQueries({
        queries: computed(() =>
            groupIds.value.map((groupId) => ({
                queryKey: ['student-competence-levels', tgId, testId, groupId, studentCode.value],
                queryFn: () => fetchStudentCompetenceLevels(groupId, studentCode.value!, getHeaders()),
                enabled: studentCode.value !== null && groupIds.value.length > 0,
                staleTime: 10 * 60 * 1000,
                retry: 1,
            })),
        ),
    })
    const data = computed(() => {
        for (const result of results.value) {
            if (result.data?.some((s) => s.code)) return result.data
        }
        return undefined
    })
    const groupId = computed(() => {
        for (let i = 0; i < results.value.length; i++) {
            if (results.value[i].data?.some((s) => s.code)) return groupIds.value[i] ?? null
        }
        return null
    })
    const isPending = computed(() => data.value === undefined && results.value.some((r) => r.isPending))
    return { data, groupId, isPending }
}

export function useStudentsQuery(groupId: Ref<number | null>) {
    const { getHeaders } = useAuthHeaders()
    return useQuery({
        queryKey: computed(() => ['competence-levels', tgId, testId, groupId.value]),
        queryFn: () => fetchCompetenceLevels(groupId.value!, getHeaders()),
        enabled: computed(() => groupId.value !== null),
        retry: 1,
    })
}

/**
 * Fetches math competence levels for a group.
 * A group participates in exactly one of the two math test IDs (VITE_MATH_TEST_ID_A / _B).
 * Both are fetched in parallel; the first one that returns student data with codes is used.
 */
export function useMathStudentsQuery(groupId: Ref<number | null>, participatedTestIds: Ref<(number | string)[] | null> = ref(null)) {
    const { getHeaders } = useAuthHeaders()
    const results = useQueries({
        queries: computed(() =>
            mathTestIds.map((testId) => ({
                queryKey: ['competence-levels', tgId, testId, groupId.value],
                queryFn: () => fetchCompetenceLevels(groupId.value!, getHeaders(), testId),
                enabled:
                    groupId.value !== null &&
                    participatedTestIds.value !== null &&
                    participatedTestIds.value.map(String).includes(String(testId)),
                retry: 1,
            })),
        ),
    })
    const data = computed(() => {
        for (const result of results.value) {
            if (result.data?.studentsData?.some((s) => s.code)) return result.data.studentsData
        }
        return undefined
    })
    // fetchStatus === 'idle' means the query is disabled — don't treat it as loading
    const isPending = computed(() => data.value === undefined && results.value.some((r) => r.isPending && r.fetchStatus === 'fetching'))
    return { data, isPending }
}
