<script setup lang="ts">
import { computed } from 'vue'
import BaseTooltipHint from '@/components/base/BaseTooltipHint.vue'
import type { CompetenceLevelBoxData } from './types'

const props = defineProps<{ data: CompetenceLevelBoxData; highlighted?: boolean }>()

const title = computed(() => `Kompetenzstufe ${props.data.romanNumber}`)

// Full class names as static strings so Tailwind includes them in the bundle
const levelClasses: Record<string, string> = {
    '1': 'bg-competence-level-1',
    '2': 'bg-competence-level-2',
    '3': 'bg-competence-level-3',
    '4': 'bg-competence-level-4',
    '5': 'bg-competence-level-5',
}

const levelClass = computed(() => levelClasses[props.data.arabicNumber])
</script>

<template>
    <div class="group/box flex flex-1 cursor-pointer flex-col">
        <div
            class="rounded-tl rounded-tr border border-b-0 px-4 py-2"
            :class="highlighted ? ['bg-secondary', 'border-secondary'] : ['border-primary', levelClass]"
        >
            <p class="text-center font-semibold text-nowrap text-white shadow-black drop-shadow-sm print:shadow-none print:drop-shadow-none">
                <BaseTooltipHint
                    :label="title"
                    :tooltip="{
                        content: `<div class='text-primary font-bold'>${title}: ${props.data.subtitle}</div><div>${props.data.description}</div>`,
                    }"
                />
            </p>
        </div>
        <div
            class="flex flex-1 flex-wrap items-center justify-center border px-3 py-6"
            :class="highlighted ? 'border-secondary' : 'border-primary'"
        >
            <slot></slot>
        </div>
    </div>
</template>
