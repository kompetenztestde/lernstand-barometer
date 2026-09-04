import { useAuthStore } from '@/stores/auth'

export function useAuthHeaders() {
    const auth = useAuthStore()

    function getHeaders(): HeadersInit {
        // demo accounts authenticate with a shared school API key instead of a personal JWT
        if (auth.role === 'demo' || auth.role === 'demo-student') {
            return { 'X-API-KEY-SCHOOL': auth.token! }
        }
        return { Authorization: `Bearer ${auth.token}` }
    }

    return { getHeaders }
}
