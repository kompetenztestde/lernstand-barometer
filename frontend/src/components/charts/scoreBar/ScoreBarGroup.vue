<script setup lang="ts">
/**
 * Why bar groups?
 *  - They add the ability to display differences between a group of bars.
 */

import { ref, reactive } from 'vue'
import ScoreBar from './ScoreBar.vue'
import type { ScoreBarData } from './types'

interface BarState extends ScoreBarData {
    calculatedDifference: number
}

interface Props {
    bars: ScoreBarData[]
    orientation?: 'row' | 'col'
    showTitle?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    orientation: 'row',
    showTitle: true,
})

const showDifference = ref(false)

const barsState: BarState[] = reactive(props.bars.map((bar) => ({ ...bar, calculatedDifference: 0 })))

const manageDifference = (focusedBar: BarState, barIndex: number) => {
    showDifference.value = true
    barsState.forEach((bar, i) => {
        bar.calculatedDifference = bar.barValue - focusedBar.barValue
        if (bar.calculatedDifference > 0) bar.barDisplayedValue = 'Differenz: +' + bar.calculatedDifference
        else if (bar.calculatedDifference < 0) bar.barDisplayedValue = 'Differenz: ' + bar.calculatedDifference
        else bar.barDisplayedValue = 'Differenz: 0'
        if (i === barIndex) bar.barDisplayedValue = null
    })
}
</script>

<template>
    <div class="flex grow gap-4" :class="props.orientation === 'row' ? 'flex-row' : 'flex-col'">
        <ScoreBar
            v-for="(bar, index) in barsState"
            :key="index"
            :data="{
                ...bar,
                title: props.showTitle ? bar.title : null,
                barDisplayedValue: showDifference ? bar.barDisplayedValue : null,
            }"
            @bar-enter="manageDifference(bar, index)"
            @bar-leave="showDifference = false"
        />
    </div>
</template>
