<script setup lang="ts">
import { computed, toRef } from 'vue'
import SelfEvaluationResultBox from '@/components/charts/subjectResultBox/SelfEvaluationResultBox.vue'
import StandardBox from '@/components/studentDialogue/StandardBox.vue'
import BaseLoadingBox from '@/components/base/BaseLoadingBox.vue'
import InfoBox from './studentDialogue/InfoBox.vue'
import { useStudentCompetenceLevelsQuery, normalizeLevel } from '@/queries/useStudentsQuery'
import { useStudentAggregationsForStudentQuery } from '@/queries/useGroupsAggregationsQuery'
import { useCompetenceIdDefsQuery } from '@/queries/useItemParamDefsQuery'
import { useStudentNamesStore } from '@/stores/studentNames'

const props = defineProps<{ code: string; groupId: number }>()

const namesStore = useStudentNamesStore()
const codeRef = toRef(() => props.code)
const groupIdRef = toRef(() => props.groupId)

const { data: competenceData, isPending: competencePending } = useStudentCompetenceLevelsQuery(codeRef, groupIdRef)
const { data: aggsData, isPending: aggsPending } = useStudentAggregationsForStudentQuery(groupIdRef, codeRef)
const { data: competenceIdDefs } = useCompetenceIdDefsQuery()

const romanToNumber: Record<string, number> = { I: 1, II: 2, III: 3, IV: 4, V: 5 }
function toLevelNumber(raw: string | null | undefined): number {
    if (!raw) return 0
    const normalized = normalizeLevel(raw)
    return romanToNumber[normalized] ?? parseInt(normalized) ?? 0
}

const studentEntry = computed(() => competenceData.value?.[0])
const leseverstehenLevel = computed(() => toLevelNumber(studentEntry.value?.competenceLevels.find((cl) => cl.domain?.id === 'le')?.value))
const orthografieLevel = computed(() => toLevelNumber(studentEntry.value?.competenceLevels.find((cl) => cl.domain?.id === 'rs')?.value))

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

const competenceDescriptions = computed(() => Object.fromEntries((competenceIdDefs.value ?? []).map((d) => [d.id, d.description])))

const isLoading = computed(() => competencePending.value || aggsPending.value)
const klarname = computed(() => namesStore.getName(props.code))
</script>

<template>
    <div class="print:break-after-page">
        <div class="mb-4">
            <p class="text-xl font-bold text-gray-900">{{ klarname ?? code }}</p>
            <p v-if="klarname" class="font-mono text-sm text-gray-400">{{ code }}</p>
        </div>

        <BaseLoadingBox v-if="isLoading" class="h-32" />

        <div v-else class="grid grid-cols-2 gap-4" style="grid-template-columns: repeat(2, minmax(0, 24rem))">
            <div class="space-y-4">
                <SelfEvaluationResultBox class="border-gray-300!" title="Leseverstehen" :actual-level="leseverstehenLevel" />
                <SelfEvaluationResultBox class="border-gray-300!" title="Orthografie" :actual-level="orthografieLevel" />
                <StandardBox
                    v-if="worstStandard"
                    class="border-gray-300!"
                    title="Noch zu üben"
                    :standard="`Bildungsstandard ${worstStandard.value}`"
                    :description="competenceDescriptions[worstStandard.value ?? '']"
                />
            </div>
            <div class="space-y-4">
                <InfoBox text-option="difficultyHint" />
                <InfoBox text-option="helpHint" />
                <StandardBox
                    v-if="bestStandard"
                    class="border-gray-300!"
                    title="Bereits geschafft"
                    :standard="`Bildungsstandard ${bestStandard.value}`"
                    :description="competenceDescriptions[bestStandard.value ?? '']"
                />
            </div>
        </div>
    </div>
</template>
