import { computed } from 'vue'
import { useQuery } from '@tanstack/vue-query'
import { useAuthStore } from '@/stores/auth'
import { useAuthHeaders } from '@/composables/useAuthHeaders'

const TBA3_DATA_API_URL = import.meta.env.VITE_TBA3_DATA_API_URL

type SchoolInformation = {
    schoolName: string
    schoolNumber: string
    schoolId: string
    schoolForm: string
}

type SchoolInformationResponse = {
    success: boolean
    data?: SchoolInformation
}

async function fetchSchoolInformation(headers: HeadersInit): Promise<SchoolInformation | null> {
    const res = await fetch(`${TBA3_DATA_API_URL}/school-information`, { headers })
    if (!res.ok) throw new Error(`Fehler beim Laden der Schulinformationen (${res.status})`)
    const data: SchoolInformationResponse = await res.json()
    return data.data ?? null
}

export function useSchoolInformationQuery() {
    const auth = useAuthStore()
    const { getHeaders } = useAuthHeaders()
    return useQuery({
        queryKey: ['school-information'],
        queryFn: () => fetchSchoolInformation(getHeaders()),
        enabled: computed(() => auth.role === 'teacher' || auth.role === 'demo'),
        retry: 1,
    })
}
