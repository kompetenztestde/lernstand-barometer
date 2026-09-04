import { useQuery } from '@tanstack/vue-query'
import { useAuthHeaders } from '@/composables/useAuthHeaders'

const TBA3_DATA_API_URL = import.meta.env.VITE_TBA3_DATA_API_URL
const tgId = import.meta.env.VITE_TEST_GROUP
const testId = import.meta.env.VITE_TEST_ID
const mathTestIds = [import.meta.env.VITE_MATH_TEST_ID_A, import.meta.env.VITE_MATH_TEST_ID_B].filter(Boolean)

export type ApiParticipatedGroup = {
    groupId: number
    groupLevel: string
    groupName: string
    numberOfStudents: number
    schoolForm: string
    participatedTests: (number | string)[]
}

type ApiResponse = {
    success: boolean
    data?: ApiParticipatedGroup[]
}

async function fetchParticipatedGroups(headers: HeadersInit): Promise<ApiParticipatedGroup[]> {
    const allTestIds = [testId, ...mathTestIds].join(',')
    const res = await fetch(`${TBA3_DATA_API_URL}/test-groups/${tgId}/participated-groups?test-ids=${allTestIds}`, { headers })
    if (!res.ok) throw new Error(`Fehler beim Laden der Klassen (${res.status})`)
    const json: ApiResponse = await res.json()
    return json.data ?? []
}

export function useParticipatedGroupsQuery() {
    const { getHeaders } = useAuthHeaders()
    return useQuery({
        queryKey: ['participated-groups', tgId, testId, ...mathTestIds],
        queryFn: () => fetchParticipatedGroups(getHeaders()),
        staleTime: 10 * 60 * 1000,
        retry: 1,
    })
}
