<script setup lang="ts">
import { computed, ref, watch } from 'vue'
import { useStudentsQuery } from '@/queries/useStudentsQuery'
import { useDomainDefsQuery, useCompLvlDefsQuery, getCompLvlDescription } from '@/queries/useItemParamDefsQuery'
import {
    useGroupsAggregationsQuery,
    useStudentAggregationsQuery,
    mapStudentDomainMeans,
    mapStudentDomainScores,
    mapDomainTotals,
} from '@/queries/useGroupsAggregationsQuery'
import { useCompetenceCutoffsQuery } from '@/queries/useCompetenceCutoffsQuery'
import { StudentsInCompetenceBoxes, type StudentsInCompetenceBoxesData } from '@/components/charts/studentsInCompetenceBoxes'
import BaseHeading from '@/components/base/BaseHeading.vue'
import BaseLoadingBox from '@/components/base/BaseLoadingBox.vue'
import BaseTooltipHint from '@/components/base/BaseTooltipHint.vue'
import InterpretationButton from '@/components/charts/InterpretationButton.vue'
import InterpretationPanel from '@/components/charts/InterpretationPanel.vue'
import type { InterpretationQuestion } from '@/composables/useInterpretationSection'
import { getGlossaryTerm } from '@/queries/useGlossaryQuery.ts'

const props = defineProps<{ groupId: number }>()

const groupIdRef = computed(() => props.groupId)

const showInterpretation = ref(false)
const activeQuestion = ref<string | null>(null)

// clear active highlight when the panel is closed
watch(showInterpretation, (show) => {
    if (!show) activeQuestion.value = null
})

const questions: InterpretationQuestion[] = [
    { id: 'mindeststandard-nicht-erreicht', label: 'Mindeststandard nicht erreicht (Kompetenzstufe 1)' },
    { id: 'mindeststandard-erreicht', label: 'Mindeststandard erreicht (Kompetenzstufe 2 bis 5)' },
    { id: 'haeufigste', label: 'Am häufigsten erreichte Kompetenzstufe' },
]

const { data: studentsData, isPending: studentsIsPending, isError: studentsIsError } = useStudentsQuery(groupIdRef)
const { data: domainDefs } = useDomainDefsQuery()
const { data: compLvlDefs } = useCompLvlDefsQuery()
const { data: aggregationsData } = useGroupsAggregationsQuery(groupIdRef)
const { data: studentAggregationsData } = useStudentAggregationsQuery(groupIdRef)
const { data: competenceCutoffsData } = useCompetenceCutoffsQuery()

// keys are arabic numeral strings to match the API's competenceLevel format
const arabicToRoman: Record<string, string> = { '1': 'I', '2': 'II', '3': 'III', '4': 'IV', '5': 'V' }

// pre-index by student code for O(1) lookup inside the nested competenceLevel map below
const studentMeansMap = computed(() => {
    const map = new Map<string, { leseverstehen: number | null; orthografie: number | null }>()
    for (const s of studentAggregationsData.value ?? []) {
        if (s.code) map.set(s.code, mapStudentDomainMeans(s.aggregations))
    }
    return map
})

// raw scores (points) are separate from means (percentages) — both needed by the chart tooltip
const studentScoresMap = computed(() => {
    const map = new Map<string, { leseverstehenScore: number | null; orthografieScore: number | null }>()
    for (const s of studentAggregationsData.value ?? []) {
        if (s.code) map.set(s.code, mapStudentDomainScores(s.aggregations))
    }
    return map
})

const studentsInCompetenceBoxesData = computed<StudentsInCompetenceBoxesData | null>(() => {
    const students = studentsData.value?.studentsData
    if (!students || !domainDefs.value || !compLvlDefs.value) return null
    const cutoffsMap = new Map((competenceCutoffsData.value ?? []).map((d) => [d.domainId, d]))
    const domainTotals = aggregationsData.value?.groupData?.aggregations
        ? mapDomainTotals(aggregationsData.value.groupData.aggregations)
        : {}
    return {
        domains: domainDefs.value.map((domain) => {
            const domainCutoffs = cutoffsMap.get(domain.domainId)
            return {
                domainId: domain.domainId,
                label: domain.name,
                total: domainTotals[domain.domainId] ?? 0,
                cutoffs: (domainCutoffs?.cutoffs ?? []).map((c) => ({
                    ...c,
                    description: getCompLvlDescription(domain.domainId, c.competenceLevel),
                })),
                competenceLevelBoxes: ['1', '2', '3', '4', '5'].map((arabic) => {
                    const roman = arabicToRoman[arabic]
                    // subjectId 'de' because competence level texts are subject-specific in the API
                    const def = compLvlDefs
                        .value!.find((d) => d.domainId === domain.domainId && d.subjectId === 'de')
                        ?.competenceLevels.find((cl) => cl.arabicNumber === arabic)
                    return {
                        arabicNumber: arabic,
                        romanNumber: roman,
                        subtitle: def?.subtitle ?? '',
                        description: def?.description ?? '',
                        students: students
                            .filter((s) => {
                                if (!s.code) return false
                                return s.competenceLevels.find((cl) => cl.domain?.id === domain.domainId)?.value === roman
                            })
                            .map((s) => ({
                                code: s.code!,
                                leseverstehenMean: studentMeansMap.value.get(s.code!)?.leseverstehen ?? null,
                                orthografieMean: studentMeansMap.value.get(s.code!)?.orthografie ?? null,
                                leseverstehenLevel: s.competenceLevels.find((cl) => cl.domain?.id === 'le')?.value ?? null,
                                orthografieLevel: s.competenceLevels.find((cl) => cl.domain?.id === 'rs')?.value ?? null,
                                leseverstehenScore: studentScoresMap.value.get(s.code!)?.leseverstehenScore ?? null,
                                orthografieScore: studentScoresMap.value.get(s.code!)?.orthografieScore ?? null,
                            })),
                    }
                }),
            }
        }),
    }
})
</script>

<template>
    <section class="print:break-after-page">
        <BaseHeading level="h2">
            <span class="flex items-center justify-between">
                <span
                    >Schüler:innen nach
                    <BaseTooltipHint :tooltip="getGlossaryTerm('competence-level')?.description">Kompetenzstufen</BaseTooltipHint></span
                >
                <InterpretationButton v-model="showInterpretation" />
            </span>
        </BaseHeading>
        <!-- Interpretation panel -->
        <InterpretationPanel :questions="questions" :show="showInterpretation" v-model="activeQuestion" class="mb-8" />
        <!-- Loading and error management -->
        <BaseLoadingBox v-if="studentsIsPending" class="h-48" />
        <p v-else-if="studentsIsError" role="alert" class="text-sm text-red-600">Fehler beim Laden der Schüler:innen-Daten.</p>
        <!-- Main chart -->
        <StudentsInCompetenceBoxes
            v-else-if="studentsInCompetenceBoxesData"
            :data="studentsInCompetenceBoxesData"
            :activeQuestion="activeQuestion"
        />
    </section>
</template>
