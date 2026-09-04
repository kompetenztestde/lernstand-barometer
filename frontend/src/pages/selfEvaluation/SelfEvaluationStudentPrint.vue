<script setup lang="ts">
import { computed, toRef } from 'vue'
import { usePageReady } from '@/composables/usePageReady'
import SelfEvaluationResultBox from '@/components/charts/subjectResultBox/SelfEvaluationResultBox.vue'
import StandardBox from '@/components/studentDialogue/StandardBox.vue'
import BaseLoadingBox from '@/components/base/BaseLoadingBox.vue'
import InfoBox from '@/components/studentDialogue/InfoBox.vue'
import { useStudentCompetenceLevelsQuery, normalizeLevel } from '@/queries/useStudentsQuery'
import { useStudentAggregationsForStudentQuery } from '@/queries/useGroupsAggregationsQuery'
import { useCompetenceIdDefsQuery } from '@/queries/useItemParamDefsQuery'
import { useStudentNamesStore } from '@/stores/studentNames'
import BaseHeading from '@/components/base/BaseHeading.vue'

const props = defineProps<{
    code: string
    groupId: number
    selfAssessmentLE?: string | null
    selfAssessmentRS?: string | null
}>()

const ratingScores: Record<string, number> = {
    'gar nicht gut': 1,
    mittel: 2,
    gut: 3,
    hervorragend: 4,
    perfekt: 5,
}

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
usePageReady(isLoading)
const fullName = computed(() => namesStore.getName(props.code))
</script>

<template>
    <div>
        <BaseHeading level="h2">Selbsteinschätzung</BaseHeading>

        <div class="mb-8">
            <p v-if="fullName" class="text-lg font-bold text-gray-900">Name: {{ fullName }}</p>
            <p v-else class="text-lg font-bold text-gray-900">Name: _______________________________________</p>
            <p class="text-md text-gray-800">Code: {{ code }}</p>
        </div>

        <BaseLoadingBox v-if="isLoading" class="h-32" />

        <div v-else>
            <div class="grid grid-cols-2 gap-4" style="grid-template-columns: repeat(2, minmax(0, 24rem))">
                <div class="space-y-4">
                    <SelfEvaluationResultBox
                        class="border-gray-300! shadow-none!"
                        title="Leseverstehen"
                        :actual-level="leseverstehenLevel"
                        :self-assessment="props.selfAssessmentLE ?? undefined"
                        :self-score="props.selfAssessmentLE ? ratingScores[props.selfAssessmentLE] : undefined"
                    />
                    <SelfEvaluationResultBox
                        class="border-gray-300! shadow-none!"
                        title="Orthografie"
                        :actual-level="orthografieLevel"
                        :self-assessment="props.selfAssessmentRS ?? undefined"
                        :self-score="props.selfAssessmentRS ? ratingScores[props.selfAssessmentRS] : undefined"
                    />
                </div>
                <div class="space-y-4">
                    <InfoBox text-option="difficultyHint" class="border-gray-300! shadow-none!" />
                    <InfoBox text-option="helpHint" class="border-gray-300! shadow-none!" />
                    <StandardBox
                        v-if="bestStandard"
                        class="border-gray-300! shadow-none!"
                        title="Bereits geschafft"
                        :standard="`Bildungsstandard ${bestStandard.value}`"
                        :description="competenceDescriptions[bestStandard.value ?? '']"
                    />
                    <StandardBox
                        v-if="worstStandard"
                        class="border-gray-300! shadow-none!"
                        title="Noch zu üben"
                        :standard="`Bildungsstandard ${worstStandard.value}`"
                        :description="competenceDescriptions[worstStandard.value ?? '']"
                    />
                </div>
            </div>
            <div class="mt-12">
                <p>
                    Während des Lernentwicklungsgesprächs am
                    <span class="px-2"
                        ><span class="text-gray-400">____</span>.<span class="text-gray-400">____</span>.<span class="text-gray-400"
                            >________</span
                        ></span
                    >
                    werden folgende Lernziele vereinbart:
                </p>
                <div class="mt-4">
                    <div class="h-12 border-b border-gray-400"></div>
                    <div class="h-12 border-b border-gray-400"></div>
                    <div class="h-12 border-b border-gray-400"></div>
                    <div class="h-12 border-b border-gray-400"></div>
                    <div class="h-12 border-b border-gray-400"></div>
                    <div class="h-12 border-b border-gray-400"></div>
                    <div class="h-12 border-b border-gray-400"></div>
                    <div class="h-12 border-b border-gray-400"></div>
                </div>
                <div class="grid grid-cols-3 pt-24">
                    <div>Unterschrift Lehrkraft</div>
                    <div>Unterschrift Schüler:in</div>
                    <div>Unterschrift Eltern</div>
                </div>
            </div>
        </div>
    </div>
</template>
