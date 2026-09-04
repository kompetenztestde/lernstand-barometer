<script setup lang="ts">
import { ref, computed, watch, onMounted } from 'vue'
import { usePageReady } from '@/composables/usePageReady'
import { useRoute, useRouter } from 'vue-router'
import { useViewSelectionStore } from '@/stores/viewSelection'
import BaseCard from '@/components/base/BaseCard.vue'
import BaseLoadingBox from '@/components/base/BaseLoadingBox.vue'
import IconInfoCircle from '@/components/icons/IconInfoCircle.vue'
import SelfEvaluationResultBox from '@/components/charts/subjectResultBox/SelfEvaluationResultBox.vue'
import SelfEvaluationStudentPrint from './selfEvaluation/SelfEvaluationStudentPrint.vue'
import SelfEvaluationGroupPrint from './selfEvaluation/SelfEvaluationGroupPrint.vue'
import GroupSelectButton from '@/components/base/GroupSelectButton.vue'
import { useStudentsQuery, useStudentCompetenceLevelsQuery, normalizeLevel } from '@/queries/useStudentsQuery'
import { useCompetenceIdDefsQuery } from '@/queries/useItemParamDefsQuery'
import { useStudentAggregationsForStudentQuery } from '@/queries/useGroupsAggregationsQuery'
import StandardBox from '@/components/studentDialogue/StandardBox.vue'
import PrintPdfButton from '@/components/base/PrintPdfButton.vue'
import NameImportButton from '@/components/base/NameImportButton.vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseSelect from '@/components/base/BaseSelect.vue'
import { useStudentNamesStore } from '@/stores/studentNames'
import { usePrintPdf } from '@/composables/usePrintPdf'
import IconDownload from '@/components/icons/IconDownload.vue'

const pdfEnabled = import.meta.env.VITE_PDF_ENABLED === 'true'

const route = useRoute()
const router = useRouter()
const viewSelection = useViewSelectionStore()
const studentNamesStore = useStudentNamesStore()
const { downloadAllPdf, isLoadingAll } = usePrintPdf('self-evaluation')
const selectedGroupId = computed({
    get: () => viewSelection.selectedGroupId,
    set: (val) => viewSelection.setSelectedGroupId(val),
})
const selectedStudentCode = ref<string | null>(null)

const { data: studentsData, isPending: studentsPending } = useStudentsQuery(selectedGroupId)

const studentCodes = computed(() => ((studentsData.value?.studentsData ?? []).map((s) => s.code).filter(Boolean) as string[]).sort())

const studentSelectOptions = computed(() =>
    studentCodes.value.map((code) => ({
        value: code,
        label: studentNamesStore.getName(code) ? `${code} – ${studentNamesStore.getName(code)}` : code,
    })),
)

// When group changes, reset student and remove stale ?code from URL
watch(selectedGroupId, () => {
    selectedStudentCode.value = null
    if (route.query.code) {
        router.replace({ query: Object.fromEntries(Object.entries(route.query).filter(([k]) => k !== 'code')) })
    }
})

// Auto-select from ?code URL param or fall back to first student
watch(
    studentCodes,
    (codes) => {
        if (codes.length === 0) return
        const fromUrl = typeof route.query.code === 'string' ? (codes.find((c) => c === route.query.code) ?? null) : null
        if (!selectedStudentCode.value || !codes.includes(selectedStudentCode.value)) {
            selectedStudentCode.value = fromUrl ?? codes[0]
        }
    },
    { immediate: true },
)

// Keep ?code URL param in sync with selection
watch(
    selectedStudentCode,
    (code) => {
        if (code != null && route.query.code !== code) {
            router.replace({ query: { ...route.query, code } })
        }
    },
    { immediate: true },
)

// React to browser back/forward navigation
watch(
    () => route.query.code,
    (code) => {
        if (typeof code === 'string' && code !== selectedStudentCode.value && studentCodes.value.includes(code)) {
            selectedStudentCode.value = code
        }
    },
)

const { data: competenceData, isPending: competencePending } = useStudentCompetenceLevelsQuery(selectedStudentCode, selectedGroupId)

const romanToNumber: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5 }
function toLevelNumber(raw: string | null | undefined): number {
    if (!raw) return 0
    const normalized = normalizeLevel(raw)
    return romanToNumber[normalized] ?? parseInt(normalized) ?? 0
}

const studentEntry = computed(() => competenceData.value?.[0])

const leseverstehenLevel = computed(() => {
    const entry = studentEntry.value?.competenceLevels.find((cl) => cl.domain?.id === 'le')
    return toLevelNumber(entry?.value)
})

const orthografieLevel = computed(() => {
    const entry = studentEntry.value?.competenceLevels.find((cl) => cl.domain?.id === 'rs')
    return toLevelNumber(entry?.value)
})

const { data: aggsData, isPending: aggsPending } = useStudentAggregationsForStudentQuery(selectedGroupId, selectedStudentCode)
const qualifyingStandards = computed(() => (aggsData.value ?? []).filter((a) => a.type === 'competenceId' && a.includedIqbIds.length >= 3))

const worstStandard = computed(() => {
    const candidates = qualifyingStandards.value.filter((a) => a.descriptiveStatistics.mean !== null)
    if (!candidates.length) return null
    return candidates.reduce((worst, a) => (a.descriptiveStatistics.mean! < worst.descriptiveStatistics.mean! ? a : worst))
})

const bestStandard = computed(() => {
    const candidates = qualifyingStandards.value.filter((a) => a.descriptiveStatistics.mean !== null)
    if (!candidates.length) return null
    return candidates.reduce((best, a) => (a.descriptiveStatistics.mean! > best.descriptiveStatistics.mean! ? a : best))
})

const { data: competenceIdDefs } = useCompetenceIdDefsQuery()
const competenceDescriptions = computed(() => Object.fromEntries((competenceIdDefs.value ?? []).map((d) => [d.id, d.description])))

const isLoading = computed(() => competencePending.value || aggsPending.value)

usePageReady(computed(() => selectedGroupId.value !== null && studentsPending.value))

const printAllCodes = ref<string[]>([])
const printStudentCode = ref<string | null>(null)

onMounted(() => {
    const printCode = localStorage.getItem('print-student-code')
    if (printCode) {
        printStudentCode.value = printCode
        localStorage.removeItem('print-student-code')
    }
    const printCodes = localStorage.getItem('print-student-codes')
    if (printCodes) {
        printAllCodes.value = JSON.parse(printCodes)
        localStorage.removeItem('print-student-codes')
    }
})

function onStudentKeydown(e: KeyboardEvent, code: string) {
    const idx = studentCodes.value.indexOf(code)
    if (e.key === 'ArrowDown') {
        e.preventDefault()
        const next = studentCodes.value[(idx + 1) % studentCodes.value.length]
        selectedStudentCode.value = next
        ;(document.querySelector(`[data-student-code="${next}"]`) as HTMLElement | null)?.focus()
    } else if (e.key === 'ArrowUp') {
        e.preventDefault()
        const prev = studentCodes.value[(idx - 1 + studentCodes.value.length) % studentCodes.value.length]
        selectedStudentCode.value = prev
        ;(document.querySelector(`[data-student-code="${prev}"]`) as HTMLElement | null)?.focus()
    }
}
</script>

<template>
    <!-- Screen content -->
    <div class="print:hidden">
        <BaseCard class="bg-primary! mb-6 text-white">
            <template v-slot:body>
                <div class="flex items-center gap-4">
                    <div aria-hidden="true"><IconInfoCircle /></div>
                    <div>
                        Die folgende Selbsteinschätzung steht den Schülerinnen und Schülern über ihre Online-Test-Zugangsdaten zur
                        Verfügung. Als Lehrkraft können Sie im Folgenden Klasse und Code auswählen, um zu sehen, was den Schüler:innen
                        angezeigt wird. Über den Menüpunkt „Berichte downloaden” können Sie die Selbsteinschätzung ausdrucken. Luca, ein
                        Chatbot, führt die Schüler:innen durch ein Gespräch über ihre Selbsteinschätzung, das tatsächliche Ergebnis und
                        Übungsvorschläge. Hier sehen Sie die Zusammenfassung, die auch den Schüler:innen präsentiert wird.
                    </div>
                </div>
            </template>
        </BaseCard>

        <div class="flex items-center justify-between 2xl:mb-4">
            <GroupSelectButton v-model="selectedGroupId" />
            <div class="flex items-center gap-2">
                <NameImportButton />
                <BaseButton
                    v-if="pdfEnabled && selectedGroupId && studentCodes.length > 0"
                    variant="primary-outline"
                    :loading="isLoadingAll"
                    class="gap-1.5"
                    @click="downloadAllPdf(studentCodes)"
                >
                    <IconDownload class="size-4" />
                    {{ isLoadingAll ? 'PDF wird generiert…' : 'Klasse als PDF' }}
                </BaseButton>
                <PrintPdfButton
                    v-if="selectedGroupId && selectedStudentCode"
                    page="self-evaluation"
                    :student-code="selectedStudentCode"
                    text="Schüler:in als PDF"
                />
            </div>
        </div>

        <!-- selection by dropdown menu when screen is too little -->
        <div v-if="selectedGroupId && !studentsPending && studentCodes.length > 0" class="mb-8 flex w-fit items-center gap-2 2xl:hidden">
            <p id="student-select-mobile-label" class="font-medium tracking-wide text-gray-600">Schüler:in:</p>
            <BaseSelect
                id="student-select-mobile"
                :model-value="selectedStudentCode ?? undefined"
                @update:model-value="selectedStudentCode = $event as string"
                :options="studentSelectOptions"
                placeholder="Code auswählen"
            />
        </div>

        <div v-if="selectedGroupId" class="grid grid-cols-1 items-start gap-12 2xl:grid-cols-[auto_1fr]">
            <!-- sidebar student selection, only visible when screen is bigger -->
            <div class="hidden w-fit min-w-36 2xl:block">
                <p id="student-list-label" class="mb-4 text-sm font-bold tracking-wide text-gray-700 uppercase">Code</p>
                <BaseLoadingBox v-if="studentsPending" class="h-32" />
                <p v-else-if="studentCodes.length === 0" class="text-sm text-gray-400 italic">Keine Schüler:innen gefunden.</p>
                <ul
                    v-else
                    role="listbox"
                    aria-labelledby="student-list-label"
                    class="max-h-[70vh] overflow-auto rounded border border-gray-200 bg-white shadow-md shadow-gray-100"
                >
                    <li
                        v-for="code in studentCodes"
                        :key="code"
                        role="option"
                        :aria-selected="selectedStudentCode === code"
                        :data-student-code="code"
                        :tabindex="selectedStudentCode === code || selectedStudentCode === null ? 0 : -1"
                        class="cursor-pointer border-b border-gray-100 px-3 py-2 last:border-b-0 focus-visible:outline-2 focus-visible:-outline-offset-2 focus-visible:outline-gray-500"
                        :class="selectedStudentCode === code ? 'bg-primary text-white' : 'text-gray-800 hover:bg-gray-100'"
                        @click="selectedStudentCode = code"
                        @keydown.enter="selectedStudentCode = code"
                        @keydown.space.prevent="selectedStudentCode = code"
                        @keydown="onStudentKeydown($event, code)"
                    >
                        <span class="mr-3 font-mono">{{ code }}</span>
                        <span
                            v-if="studentNamesStore.getName(code)"
                            class="truncate text-xs"
                            :class="selectedStudentCode === code ? 'text-white/70' : 'text-gray-400'"
                            >{{ studentNamesStore.getName(code) }}</span
                        >
                    </li>
                </ul>
            </div>

            <!-- Protocol view for selected student -->
            <div class="">
                <p v-if="!selectedStudentCode" class="text-sm text-gray-500 italic">
                    Bitte einen Code auswählen, um die Selbsteinschätzung anzuzeigen.
                </p>
                <template v-else>
                    <p class="mb-4 text-sm font-bold tracking-wide text-gray-700 uppercase">Gesprächsprotokoll</p>
                    <BaseLoadingBox v-if="isLoading" class="h-32" />
                    <div v-else class="grid grid-cols-[auto_1fr] gap-4">
                        <div class="flex flex-col space-y-4">
                            <SelfEvaluationResultBox class="border-gray-300!" title="Leseverstehen" :actual-level="leseverstehenLevel" />
                            <SelfEvaluationResultBox class="border-gray-300!" title="Orthografie" :actual-level="orthografieLevel" />
                        </div>
                        <div class="space-y-4">
                            <p v-if="qualifyingStandards.length === 0" class="text-sm text-gray-400 italic">
                                Keine Aggregationsdaten für diesen Code verfügbar.
                            </p>
                            <template v-else>
                                <StandardBox
                                    v-if="worstStandard"
                                    class="border-gray-300!"
                                    title="Noch zu üben"
                                    :standard="`Bildungsstandard ${worstStandard.value}`"
                                    :description="competenceDescriptions[worstStandard.value ?? '']"
                                />
                                <StandardBox
                                    v-if="bestStandard"
                                    class="border-gray-300!"
                                    title="Bereits geschafft"
                                    :standard="`Bildungsstandard ${bestStandard.value}`"
                                    :description="competenceDescriptions[bestStandard.value ?? '']"
                                />
                            </template>
                        </div>
                    </div>
                </template>
            </div>
        </div>
    </div>

    <!-- Print: single student -->
    <SelfEvaluationStudentPrint
        v-if="printStudentCode && selectedGroupId"
        class="hidden print:block"
        :code="printStudentCode"
        :group-id="selectedGroupId"
    />

    <!-- Print: whole class -->
    <SelfEvaluationGroupPrint
        v-if="printAllCodes.length > 0 && selectedGroupId"
        class="hidden print:block"
        :codes="printAllCodes"
        :group-id="selectedGroupId"
    />
</template>
