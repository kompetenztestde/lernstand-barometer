<script setup lang="ts">
import { computed } from 'vue'
import type { CompetenceLevelBandData } from './types'

import { useCompLvlDefsQuery } from '@/queries/useItemParamDefsQuery'

const props = defineProps<{ data: CompetenceLevelBandData }>()

const { data: compLvlDefs } = useCompLvlDefsQuery()

const arabicToRoman: Record<number, string> = { 1: 'I', 2: 'II', 3: 'III', 4: 'IV', 5: 'V' }

function tippyOptions(level: number) {
    if (props.data.domainId === undefined || !compLvlDefs.value) return { trigger: 'manual' as const }
    const domainDef = compLvlDefs.value.find((d) => d.domainId === props.data.domainId)
    const lvl = domainDef?.competenceLevels.find((l) => l.arabicNumber === String(level))
    if (!lvl) return { trigger: 'manual' as const }
    const title = `Kompetenzstufe ${arabicToRoman[level]}: ${lvl.subtitle}`
    const content = `<p class="font-semibold mb-1">${title}</p><p class="text-sm leading-snug">${lvl.description}</p>`
    return { content, maxWidth: 320, allowHTML: true }
}

// Full class names as static strings so Tailwind includes them in the bundle
const textLevelClasses: Record<number, string> = {
    1: 'text-competence-level-1',
    2: 'text-competence-level-2',
    3: 'text-competence-level-3',
    4: 'text-competence-level-4',
    5: 'text-competence-level-5',
}
const bgLevelClasses: Record<number, string> = {
    1: 'bg-competence-level-1',
    2: 'bg-competence-level-2',
    3: 'bg-competence-level-3',
    4: 'bg-competence-level-4',
    5: 'bg-competence-level-5',
}

const textLevelClass = computed(() => (props.data.competenceLevel ? textLevelClasses[props.data.competenceLevel] : ''))
const bgLevelClass = computed(() => (props.data.competenceLevel ? bgLevelClasses[props.data.competenceLevel] : ''))
</script>

<template>
    <div class="inline-block text-sm">
        <div v-if="props.data.competenceLevel" class="border-primary inline-flex cursor-pointer overflow-hidden rounded border select-none">
            <span
                v-for="level in 5"
                :key="level"
                v-tippy="tippyOptions(level)"
                tabindex="0"
                :aria-label="`Kompetenzstufe ${arabicToRoman[level]}`"
                class="hover:bg-secondary inline-block w-6 px-1 py-0.5 text-center font-semibold transition-colors last:border-r-0 hover:text-white print:text-shadow-none"
                :class="[
                    `${bgLevelClass} ${textLevelClass}`,
                    props.data.competenceLevel === level ? 'text-white [text-shadow:0_0_1px_rgba(0,0,0,1)]' : '',
                    props.data.competenceLevel < level ? 'bg-white text-white' : '',
                ]"
            >
                {{ arabicToRoman[level] }}
            </span>
        </div>
        <div v-else>Kein Wert</div>
    </div>
</template>
