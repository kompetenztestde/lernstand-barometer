import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { queryClient } from '@/queryClient'
import { useViewSelectionStore } from './viewSelection'

type Role = 'teacher' | 'student' | 'demo' | 'demo-student'

export const useAuthStore = defineStore('auth', () => {
    const token = ref<string | null>(localStorage.getItem('token'))
    const role = ref<Role | null>(localStorage.getItem('role') as Role | null)
    const expiresAt = ref<number | null>(localStorage.getItem('expires-at') ? Number(localStorage.getItem('expires-at')) : null)
    const studentCode = ref<string | null>(localStorage.getItem('student-code'))
    const studentGroupId = ref<number | null>(
        localStorage.getItem('student-group-id') ? Number(localStorage.getItem('student-group-id')) : null,
    )

    const isAuthenticated = computed(() => !!token.value)
    const isSessionExpired = computed(() => !!expiresAt.value && Date.now() > expiresAt.value)

    function login(newToken: string, newRole: Role, tokenExpiresAt?: string, newStudentCode?: string, newGroupId?: number) {
        const expiry = tokenExpiresAt
            ? new Date(tokenExpiresAt).getTime()
            : (() => {
                  const d = new Date()
                  d.setHours(23, 59, 59, 999)
                  return d.getTime()
              })()

        token.value = newToken
        role.value = newRole
        expiresAt.value = expiry
        const trimmed = newStudentCode?.trim()
        const normalizedCode = trimmed ? (trimmed.length > 3 ? trimmed.slice(0, 3) : trimmed) : null
        studentCode.value = normalizedCode

        localStorage.setItem('token', newToken)
        localStorage.setItem('role', newRole)
        localStorage.setItem('expires-at', String(expiry))
        if (normalizedCode) localStorage.setItem('student-code', normalizedCode)
        else localStorage.removeItem('student-code')
        studentGroupId.value = newGroupId ?? null
        if (newGroupId) localStorage.setItem('student-group-id', String(newGroupId))
        else localStorage.removeItem('student-group-id')
    }

    function logout() {
        token.value = null
        role.value = null
        expiresAt.value = null
        studentCode.value = null
        studentGroupId.value = null
        localStorage.removeItem('token')
        localStorage.removeItem('role')
        localStorage.removeItem('expires-at')
        localStorage.removeItem('student-code')
        localStorage.removeItem('student-group-id')
        localStorage.removeItem('view-group-id')
        useViewSelectionStore().setSelectedGroupId(null)
        queryClient.clear()
    }

    return {
        token,
        role,
        studentCode,
        studentGroupId,
        isAuthenticated,
        isSessionExpired,
        login,
        logout,
    }
})
