import { useMutation } from '@tanstack/vue-query'

const authApiUrl = import.meta.env.VITE_AUTH_API_URL

type SchoolLoginRequest = {
    region: string
    schulNr: string
    passwort: string
}

type StudentLoginRequest = {
    surveyId: number
    loginPw: string
    loginCode: string
}

type AuthResponse = {
    status: boolean
    status_message: string
    token: string
    tokenExpiresIn: number
    tokenExpiresAt: string
    groupId?: number
}

async function parseJsonOrThrow(res: Response): Promise<AuthResponse> {
    const contentType = res.headers.get('content-type') ?? ''
    if (!contentType.includes('application/json')) {
        throw new Error(`Unerwartete Antwort vom Server (${res.status}).`)
    }
    return res.json()
}

async function loginSchool(body: SchoolLoginRequest): Promise<AuthResponse> {
    const res = await fetch(`${authApiUrl}/school`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    const data = await parseJsonOrThrow(res)
    if (!data.status) throw new Error(data.status_message || 'Anmeldung fehlgeschlagen.')
    return data
}

async function loginStudent(body: StudentLoginRequest): Promise<AuthResponse> {
    const res = await fetch(`${authApiUrl}/student`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    const data = await parseJsonOrThrow(res)
    if (!data.status) throw new Error(data.status_message || 'Anmeldung fehlgeschlagen.')
    return data
}

export function useSchoolLoginMutation() {
    return useMutation({ mutationFn: loginSchool })
}

export function useStudentLoginMutation() {
    return useMutation({ mutationFn: loginStudent })
}
