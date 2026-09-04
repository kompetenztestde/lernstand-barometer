import { computed, type Ref } from 'vue'
import { useQuery, useQueries } from '@tanstack/vue-query'
import { useAuthHeaders } from '@/composables/useAuthHeaders'

const TBA3_DATA_API_URL = import.meta.env.VITE_TBA3_DATA_API_URL
const tgId = import.meta.env.VITE_TEST_GROUP
const testId = import.meta.env.VITE_TEST_ID

type ApiDescriptiveStatistics = {
    total: number | null
    mean: number | null
    frequency: number | null
    meanComparison: number | null
    frequencyComparison: number | null
    standardDeviation: number | null
}

export type ApiAggregationItem = {
    type: string | null
    value: string | null
    ktColumnName: string
    includedIqbIds: string[]
    descriptiveStatistics: ApiDescriptiveStatistics
}

export type ApiGroupAggregations = {
    groupData?: {
        groupId: number
        groupName: string
        schoolForm: string | null
        numberOfStudents: number
        aggregations: ApiAggregationItem[]
    }
}

type ApiResponse = {
    success: boolean
    data?: ApiGroupAggregations
}

export type BarPair = { mean: number; meanComparison: number }

const romanToCompLvlValues: Record<string, string[]> = { I: ['1a', '1b'], II: ['2'], III: ['3'], IV: ['4'], V: ['5'] }

export function mapAggregationsToChart(aggregations: ApiAggregationItem[]) {
    const findAvg = (type: string, values: string[]): BarPair => {
        const matches = aggregations.filter((a) => a.type === type && values.includes(a.value ?? ''))
        const avg = (key: 'mean' | 'meanComparison') => {
            const nums = matches.map((a) => a.descriptiveStatistics[key]).filter((v): v is number => v !== null)
            return nums.length ? nums.reduce((s, v) => s + v, 0) / nums.length : 0
        }
        return { mean: Math.round(avg('mean')), meanComparison: Math.round(avg('meanComparison')) }
    }

    const competenceItems = aggregations.filter((a) => a.type === 'competenceId' && a.value !== null)

    return {
        domainBars: {
            le: findAvg('domain', ['Lesen']),
            rs: findAvg('domain', ['Orthografie']),
        },
        compLvlBars: {
            le: Object.fromEntries(
                Object.entries(romanToCompLvlValues).map(([roman, vals]) => [roman, findAvg('competenceLevelReading', vals)]),
            ),
            rs: Object.fromEntries(
                Object.entries(romanToCompLvlValues).map(([roman, vals]) => [roman, findAvg('competenceLevelOrthography', vals)]),
            ),
        },
        competenceIdBars: Object.fromEntries(
            competenceItems.map((a) => [
                a.value!,
                {
                    mean: Math.round(a.descriptiveStatistics.mean ?? 0),
                    meanComparison: Math.round(a.descriptiveStatistics.meanComparison ?? 0),
                },
            ]),
        ),
        competenceIdDefs: competenceItems.map((a) => ({
            competenceId: a.value!,
            label: `Bildungsstandard ${a.value}`,
            description: '',
        })),
    }
}

async function fetchGroupAggregations(groupId: number, headers: HeadersInit): Promise<ApiGroupAggregations> {
    const res = await fetch(`${TBA3_DATA_API_URL}/test-groups/${tgId}/tests/${testId}/groups/${groupId}/aggregations?type=group`, {
        headers,
    })
    if (!res.ok) throw new Error(`Fehler beim Laden der Aggregationen (${res.status})`)
    const json: ApiResponse = await res.json()
    return json.data ?? {}
}

export function useGroupsAggregationsQuery(groupId: Ref<number | null>) {
    const { getHeaders } = useAuthHeaders()
    return useQuery({
        queryKey: computed(() => ['aggregations', tgId, testId, groupId.value]),
        queryFn: () => fetchGroupAggregations(groupId.value!, getHeaders()),
        enabled: computed(() => groupId.value !== null),
        retry: 1,
    })
}

// --- Student-level aggregations ---

export type ApiStudentAggregation = {
    code: string
    aggregations: ApiAggregationItem[]
}

type ApiStudentsResponse = {
    success: boolean
    data?: { studentsData?: ApiStudentAggregation[] }
}

export type StudentDomainMeans = {
    leseverstehen: number | null
    orthografie: number | null
}

export function mapStudentDomainMeans(aggregations: ApiAggregationItem[]): StudentDomainMeans {
    const find = (value: string) => aggregations.find((a) => a.type === 'domain' && a.value === value)?.descriptiveStatistics.mean ?? null
    return {
        leseverstehen: find('Lesen'),
        orthografie: find('Orthografie'),
    }
}

export type StudentDomainScores = {
    leseverstehenScore: number | null
    orthografieScore: number | null
}

export function mapStudentDomainScores(aggregations: ApiAggregationItem[]): StudentDomainScores {
    const find = (value: string) => aggregations.find((a) => a.type === 'domain' && a.value === value)?.descriptiveStatistics.frequency ?? null
    return {
        leseverstehenScore: find('Lesen'),
        orthografieScore: find('Orthografie'),
    }
}

export function mapDomainTotals(aggregations: ApiAggregationItem[]): Record<string, number> {
    const find = (value: string) => aggregations.find((a) => a.type === 'domain' && a.value === value)?.descriptiveStatistics.total ?? 0
    return {
        le: find('Lesen'),
        rs: find('Orthografie'),
    }
}

async function fetchStudentAggregations(groupId: number, headers: HeadersInit): Promise<ApiStudentAggregation[]> {
    const res = await fetch(`${TBA3_DATA_API_URL}/test-groups/${tgId}/tests/${testId}/groups/${groupId}/aggregations?type=students`, {
        headers,
    })
    if (!res.ok) throw new Error(`Fehler beim Laden der Schüler-Aggregationen (${res.status})`)
    const json: ApiStudentsResponse = await res.json()
    return json.data?.studentsData ?? []
}

export function useStudentAggregationsQuery(groupId: Ref<number | null>) {
    const { getHeaders } = useAuthHeaders()
    return useQuery({
        queryKey: computed(() => ['student-aggregations', tgId, testId, groupId.value]),
        queryFn: () => fetchStudentAggregations(groupId.value!, getHeaders()),
        enabled: computed(() => groupId.value !== null),
        retry: 1,
    })
}

export function useStudentAggregationsForStudentQuery(groupId: Ref<number | null>, studentCode: Ref<string | null>) {
    const { getHeaders } = useAuthHeaders()
    return useQuery({
        queryKey: computed(() => ['student-aggregations-for-student', tgId, testId, groupId.value, studentCode.value]),
        queryFn: async () => {
            const all = await fetchStudentAggregations(groupId.value!, getHeaders())
            return all.find((s) => s.code === studentCode.value)?.aggregations ?? []
        },
        enabled: computed(() => groupId.value !== null && studentCode.value !== null),
        retry: 1,
    })
}

export function useDemoStudentAggregationsQuery(groupIds: Ref<number[]>, studentCode: Ref<string | null>) {
    const { getHeaders } = useAuthHeaders()
    const results = useQueries({
        queries: computed(() =>
            groupIds.value.map((groupId) => ({
                queryKey: ['student-aggregations-for-student', tgId, testId, groupId, studentCode.value],
                queryFn: async () => {
                    const all = await fetchStudentAggregations(groupId, getHeaders())
                    return all.find((s) => s.code === studentCode.value)?.aggregations ?? []
                },
                enabled: studentCode.value !== null && groupIds.value.length > 0,
                retry: 1,
            })),
        ),
    })
    const data = computed<ApiAggregationItem[]>(() => {
        for (const result of results.value) {
            if (result.data && result.data.length > 0) return result.data
        }
        return []
    })
    const isPending = computed(() => data.value.length === 0 && results.value.some((r) => r.isPending))
    return { data, isPending }
}
