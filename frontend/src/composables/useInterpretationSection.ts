import { ref, computed, watch } from 'vue'
import type { Ref } from 'vue'

export type InterpretationQuestion = {
    id: string
    label: string
}

export function useInterpretationSection(
    computeHighlights: (activeQuestion: string) => Set<string>,
    showInterpretation: Ref<boolean>,
) {
    const activeQuestion = ref<string | null>(null)

    const highlights = computed((): Set<string> | null => {
        if (!activeQuestion.value) return null
        return computeHighlights(activeQuestion.value)
    })

    const rowClass = (rowId: string): string => {
        if (!highlights.value) return ''
        return highlights.value.has(rowId) ? 'bg-interpretation/20' : 'opacity-20'
    }

    watch(showInterpretation, (show) => {
        if (!show) activeQuestion.value = null
    })

    return { activeQuestion, highlights, rowClass }
}
