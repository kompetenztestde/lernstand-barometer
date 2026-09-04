<script setup lang="ts">
import { useAttrs } from 'vue'
import BaseCaret from '@/components/base/BaseCaret.vue'
import { ScoreBarGroup } from '@/components/charts/scoreBar'
import TaskDetailPanel from '@/components/charts/taskDetailPanel/TaskDetailPanel.vue'
import type { TaskBarChartData } from './types'

const attrs = useAttrs()

interface Props {
    data: TaskBarChartData
    isExpanded?: boolean
}

const props = withDefaults(defineProps<Props>(), {
    isExpanded: false,
})
</script>

<template>
    <div
        v-bind="attrs"
        class="rounded border p-0 text-gray-700 transition-all print:break-inside-avoid"
        :class="props.isExpanded ? 'border-gray-300' : 'border-transparent hover:border-gray-300'"
        tabindex="0"
        role="button"
        :aria-expanded="props.isExpanded"
        @keydown.enter="($el as HTMLElement).click()"
    >
        <div class="flex cursor-pointer items-center gap-4 rounded px-4 py-1">
            <BaseCaret :isExpanded="props.isExpanded" class="text-gray-400 print:hidden" />
            <div class="w-12">{{ props.data.taskNumber }}</div>
            <div class="w-2/10">{{ props.data.name }}</div>
            <ScoreBarGroup
                orientation="row"
                :showTitle="true"
                :bars="[
                    {
                        title: 'Klassen-MW',
                        barValue: props.data.mean,
                        barLength: props.data.mean,
                        barValueSuffix: '%',
                        color: 'var(--color-primary)',
                    },
                    {
                        title: 'Fairer Vergleichswert',
                        barValue: props.data.meanCorrected,
                        barLength: props.data.meanCorrected,
                        barValueSuffix: '%',
                        color: 'var(--color-tertiary)',
                    },
                ]"
            ></ScoreBarGroup>
        </div>

        <TaskDetailPanel
            :isExpanded="props.isExpanded"
            :iqbId="props.data.iqbId"
            :taskNumber="props.data.taskNumber"
            :name="props.data.name"
            :competenceLevelRoman="props.data.competenceLevelRoman"
            :compLvlSubtitle="props.data.compLvlSubtitle"
            :compLvlDescription="props.data.compLvlDescription"
            :competenceId="props.data.competenceId"
            :cognitiveDemandLevel="props.data.cognitiveDemandLevel"
        />
    </div>
</template>
