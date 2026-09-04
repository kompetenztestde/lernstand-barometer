<script setup lang="ts">
import BaseTooltipHint from '@/components/base/BaseTooltipHint.vue'
import type { ScoreBarData } from './types'

const emit = defineEmits<{
    barEnter: []
    barLeave: []
}>()

const props = withDefaults(defineProps<{ data: ScoreBarData }>(), {
    data: () => ({
        barValue: 0,
        barLength: 50,
        color: '#aaa',
        showValue: true,
        barValuePrefix: '',
        barValueSuffix: '',
        barThickness: '1.4rem',
        comingSoon: false,
    }),
})
</script>

<template>
    <div class="group w-full hover:cursor-pointer">
        <div v-if="props.data.title" class="mb-0.5 text-xs text-gray-600">
            <BaseTooltipHint
                v-if="props.data.titleTooltip"
                :label="props.data.title ?? undefined"
                :tooltip="props.data.titleTooltip"
                :underline-offset="props.data.titleTooltipUnderlineOffset"
                :underline-thickness="props.data.titleTooltipUnderlineThickness"
            />
            <template v-else>{{ props.data.title }}</template>
        </div>
        <div
            class="relative"
            :class="{ 'blur-xs': props.data.comingSoon }"
            @mouseenter="emit('barEnter')"
            @mouseleave="emit('barLeave')"
        >
            <!-- outer border of the full bar -->
            <div
                class="absolute h-7 w-full rounded border bg-white"
                :style="{ 'border-color': props.data.color ?? '#aaa', height: props.data.barThickness ?? '1.4rem' }"
            ></div>
            <!-- bar depending on barLength from 0 to 100 -->
            <div
                class="absolute h-7 rounded-l"
                :style="{
                    width: props.data.comingSoon ? '50%' : `${props.data.barLength}%`,
                    'background-color': props.data.color ?? '#aaa',
                    height: props.data.barThickness ?? '1.4rem',
                }"
            ></div>
            <!-- value display in the middle of the bar -->
            <div v-if="!props.data.comingSoon" class="flex h-7 w-full items-center justify-center" :style="{ height: props.data.barThickness ?? '1.4rem' }">
                <div class="inline-block rounded border-[0.5px] border-gray-300 bg-gray-100 px-1 text-xs opacity-90">
                    {{ props.data.barDisplayedValue ? props.data.barDisplayedValue : (props.data.barValuePrefix ?? '') + props.data.barValue + (props.data.barValueSuffix ?? '') }}
                </div>
            </div>
        </div>
        <!-- coming soon text -->
        <div v-if="props.data.comingSoon" class="flex h-7 w-full items-center justify-center" :style="{ height: props.data.barThickness ?? '1.4rem' }">
            <div class="inline-block rounded border-[0.5px] border-gray-300 bg-gray-100 px-1 text-xs opacity-90">bald verfügbar</div>
        </div>
    </div>
</template>
