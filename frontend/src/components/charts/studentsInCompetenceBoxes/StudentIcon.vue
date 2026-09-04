<script setup lang="ts">
import BaseModal from '@/components/base/BaseModal.vue'
import { ref, computed } from 'vue'
import { StudentScoreBar } from '@/components/charts/studentScoreBar'
import { useStudentNamesStore } from '@/stores/studentNames'
import type { StudentIconData } from './types'
import type { CompetenceLevelCutoff } from '@/queries/useCompetenceCutoffsQuery'
import IconStudent from '@/components/icons/IconStudent.vue'

const props = defineProps<{
    data: StudentIconData
    domainId: string
    domainLabel: string
    cutoffs: CompetenceLevelCutoff[]
    total: number
}>()

const namesStore = useStudentNamesStore()
const fullName = computed(() => namesStore.getName(props.data.code))

const showModal = ref(false)

// Render tooltip text depending on available full names
const tooltipContent = computed(() => {
    const code = props.data.code
    const name = fullName.value
    if (!name) return `<span class="font-semibold">${code}</span>`
    return `<span class="font-semibold">${name}</span><span class="ml-1 font-mono font-normal text-gray-400 text-xs">(${code})</span>`
})

const domainScore = computed(() => {
    if (props.domainId === 'le') return props.data.leseverstehenScore
    if (props.domainId === 'rs') return props.data.orthografieScore
    return null
})
</script>

<template>
    <!-- modal that opens when the user clicks on the student icon -->
    <BaseModal :is-open="showModal" @close="showModal = false">
        <template #header>
            <h3 class="text-xl font-semibold text-gray-800">
                {{ fullName ?? props.data.code }}
                <span v-if="fullName" class="ml-2 font-mono text-sm font-normal text-gray-400">({{ props.data.code }})</span>
            </h3>
            <p class="mt-0.5 text-sm font-medium text-gray-500">Erreichte Punkte und Kompetenzstufe – {{ props.domainLabel }}</p>
        </template>
        <!-- chart that displays a band with cutoffs for each competence-level -->
        <StudentScoreBar
            class="my-8 px-10"
            :data="{
                score: domainScore,
                total: props.total,
                domainLabel: props.domainLabel,
                cutoffs: props.cutoffs,
            }"
        />
    </BaseModal>
    <!-- student icon -->
    <div
        class="group inline-block cursor-pointer text-center"
        tabindex="0"
        role="button"
        :aria-label="fullName ? fullName + ' (' + data.code + ')' : data.code"
        v-tippy="{ content: tooltipContent }"
        @click="showModal = true"
        @keydown.enter="showModal = true"
    >
        <IconStudent class="text-gray-500 group-hover:text-black" />
        <!-- Only for printed version -->
        <span class="hidden font-mono text-xs print:block"
            ><span class="rounded border border-gray-400 px-1 py-0.5">{{ data.code }}</span></span
        >
    </div>
</template>
