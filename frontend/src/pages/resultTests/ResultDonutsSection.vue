<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudentsQuery, mapToDonutData } from '@/queries/useStudentsQuery'
import BaseHeading from '@/components/base/BaseHeading.vue'
import BaseLoadingBox from '@/components/base/BaseLoadingBox.vue'
import BaseTooltipHint from '@/components/base/BaseTooltipHint.vue'
import InterpretationButton from '@/components/charts/InterpretationButton.vue'
import InterpretationPanel from '@/components/charts/InterpretationPanel.vue'
import type { InterpretationQuestion } from '@/composables/useInterpretationSection'
import { DonutD3 } from '@/components/charts/donutD3'
import { getGlossaryTerm } from '@/queries/useGlossaryQuery.ts'

const props = defineProps<{ groupId: number }>()

const groupIdRef = computed(() => props.groupId)
const { data: studentsData, isPending: studentsIsPending, isError: studentsIsError } = useStudentsQuery(groupIdRef)

// 'le' = Leseverstehen, 'rs' = Rechtschreibung/Orthografie (API domain IDs)
const donutDataLeseverstehen = computed(() => (studentsData.value?.groupData ? mapToDonutData(studentsData.value.groupData, 'le') : []))
const donutDataOrthografie = computed(() => (studentsData.value?.groupData ? mapToDonutData(studentsData.value.groupData, 'rs') : []))

const showInterpretation = ref(false)
const activeQuestion = ref<string | null>(null)

watch(showInterpretation, (show) => {
    if (!show) activeQuestion.value = null
})

const questions: InterpretationQuestion[] = [
    { id: 'mindeststandard-nicht-erreicht', label: 'Mindeststandard nicht erreicht (Kompetenzstufe I)' },
    { id: 'mindeststandard-erreicht', label: 'Mindeststandard erreicht (Kompetenzstufe II bis V)' },
    { id: 'haeufigste', label: 'Am häufigsten erreichte Kompetenzstufe' },
]

function highlightedIds(domainId: string, data: ReturnType<typeof mapToDonutData>): string[] {
    if (!activeQuestion.value || data.length === 0) return []
    if (activeQuestion.value === 'mindeststandard-nicht-erreicht') return [`${domainId}_I`]
    if (activeQuestion.value === 'mindeststandard-erreicht') return ['II', 'III', 'IV', 'V'].map((l) => `${domainId}_${l}`)
    if (activeQuestion.value === 'haeufigste') {
        const max = data.reduce((a, b) => (b.value > a.value ? b : a))
        return [max.id]
    }
    return []
}

const highlightedIdsLe = computed(() => highlightedIds('le', donutDataLeseverstehen.value))
const highlightedIdsRs = computed(() => highlightedIds('rs', donutDataOrthografie.value))
</script>

<template>
    <section class="print:break-after-page">
        <BaseHeading level="h2">
            <span class="flex items-center justify-between">
                <span
                    >Erreichte
                    <BaseTooltipHint :tooltip="getGlossaryTerm('competence-level')?.description">Kompetenzstufen</BaseTooltipHint> −
                    <BaseTooltipHint :tooltip="getGlossaryTerm('distribution')?.description">Verteilung</BaseTooltipHint></span
                >
                <InterpretationButton v-model="showInterpretation" />
            </span>
        </BaseHeading>
        <InterpretationPanel :questions="questions" :show="showInterpretation" v-model="activeQuestion" class="mb-8" />
        <div v-if="studentsIsError" role="alert" class="text-red-600">Fehler beim Laden der Kompetenzstufen. Bitte Seite neu laden.</div>
        <div v-else class="mb-5 grid grid-cols-2 gap-16 sm:flex-row xl:gap-24">
            <div>
                <BaseHeading level="h3">Leseverstehen</BaseHeading>
                <BaseLoadingBox v-if="studentsIsPending" class="h-48" />
                <DonutD3 v-else-if="donutDataLeseverstehen.length" :data="donutDataLeseverstehen" :highlighted-ids="highlightedIdsLe" />
                <p v-else class="text-sm text-gray-500">Keine Daten vorhanden.</p>
            </div>
            <div>
                <BaseHeading level="h3">Orthografie</BaseHeading>
                <BaseLoadingBox v-if="studentsIsPending" class="h-48" />
                <DonutD3 v-else-if="donutDataOrthografie.length" :data="donutDataOrthografie" :highlighted-ids="highlightedIdsRs" />
                <p v-else class="text-sm text-gray-500">Keine Daten vorhanden.</p>
            </div>
        </div>
    </section>
</template>
