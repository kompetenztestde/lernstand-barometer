import { ref } from 'vue'
import type { Ref } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useViewSelectionStore } from '@/stores/viewSelection'

export type PrintPage = 'result-tests' | 'result-groups' | 'conference' | 'self-evaluation'

const pageLabels: Record<PrintPage, string> = {
    'result-tests': 'Fachbericht',
    'result-groups': 'Klassenbericht',
    'conference': 'Fachkonferenz',
    'self-evaluation': 'Selbsteinschätzung',
}

interface PrintOptions {
    studentCode?: Ref<string | null>
    groupId?: Ref<number | null>
    name?: Ref<string | null>
}

function getStudentNames(): string | undefined {
    const raw = localStorage.getItem('student-names')
    return raw ?? undefined
}

async function sendPrintRequest(body: Record<string, unknown>): Promise<Blob> {
    const response = await fetch('/api/print', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
    })
    if (!response.ok) throw new Error('PDF konnte nicht erstellt werden.')
    return response.blob()
}

function triggerDownload(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = filename
    document.body.appendChild(a)
    a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
}

export function usePrintPdf(page: PrintPage, options?: PrintOptions) {
    const auth = useAuthStore()
    const viewSelection = useViewSelectionStore()
    const isLoading = ref(false)
    const isLoadingAll = ref(false)
    const error = ref<string | null>(null)

    function baseBody(): Record<string, unknown> {
        return {
            page,
            token: auth.token,
            role: auth.role,
            expiresAt: localStorage.getItem('expires-at'),
            groupId: options?.groupId?.value ?? viewSelection.selectedGroupId,
            studentNames: getStudentNames(),
        }
    }

    async function downloadPdf() {
        isLoading.value = true
        error.value = null
        try {
            const body = baseBody()
            if (options?.studentCode?.value) {
                body.studentCode = options.studentCode.value
            }
            const blob = await sendPrintRequest(body)
            const label = pageLabels[page]
            const name = options?.name?.value ?? options?.studentCode?.value
            const filename = name ? `${label}_${name}.pdf` : `${label}.pdf`
            triggerDownload(blob, filename)
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Unbekannter Fehler'
        } finally {
            isLoading.value = false
        }
    }

    async function downloadAllPdf(studentCodes: string[]) {
        isLoadingAll.value = true
        error.value = null
        try {
            const blob = await sendPrintRequest({ ...baseBody(), studentCodes })
            const label = pageLabels[page]
            const name = options?.name?.value
            const filename = name ? `${label}_${name}.pdf` : `${label}.pdf`
            triggerDownload(blob, filename)
        } catch (e) {
            error.value = e instanceof Error ? e.message : 'Unbekannter Fehler'
        } finally {
            isLoadingAll.value = false
        }
    }

    return { downloadPdf, downloadAllPdf, isLoading, isLoadingAll, error }
}
