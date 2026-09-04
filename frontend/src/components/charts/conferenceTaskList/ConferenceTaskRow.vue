<script setup lang="ts">
import { computed } from 'vue'
import BaseCaret from '@/components/base/BaseCaret.vue'
import TaskDetailPanel from '@/components/charts/taskDetailPanel/TaskDetailPanel.vue'
import type { TaskListItem } from '@/queries/useGroupsItemsQuery'
import { getCompLvlDef } from '@/queries/useItemParamDefsQuery'
import { lvlStyle, compLvls } from './utils'

defineOptions({ inheritAttrs: false })

interface Props {
    item: TaskListItem
    groupItems: (TaskListItem | undefined)[]
    isExpanded: boolean
    view: 'A' | 'B'
    viewBDetail: 'simple' | 'complex'
}

const props = defineProps<Props>()
const emit = defineEmits<{ click: [] }>()

const compLvlDef = computed(() => getCompLvlDef(props.item.domain, props.item.competenceLevel))
</script>

<template>
    <div
        v-bind="$attrs"
        class="rounded border p-0 text-gray-700 transition-all print:break-inside-avoid"
        :class="props.isExpanded ? 'border-gray-300' : 'border-transparent hover:border-gray-300'"
    >
        <!-- Row header -->
        <div class="flex cursor-pointer items-center justify-center gap-4 rounded px-4 py-1 xl:justify-start" @click="emit('click')">
            <BaseCaret :isExpanded="props.isExpanded" class="shrink-0 text-gray-400 print:hidden" />
            <div class="w-12 shrink-0 text-sm font-semibold text-gray-500">{{ props.item.taskNumber }}</div>
            <div class="w-50 shrink-0 truncate text-sm">{{ props.item.name }}</div>

            <!-- View A: one colored badge per group -->
            <div v-if="view === 'A'" class="flex shrink-0 items-center gap-2">
                <template v-for="(groupItem, i) in groupItems" :key="i">
                    <span
                        v-if="groupItem?.competenceLevel"
                        :class="[
                            lvlStyle(groupItem.mean, groupItem.meanCorrected),
                            'inline-flex size-8 items-center justify-center rounded text-xs font-semibold text-gray-800',
                        ]"
                    >
                        <template v-if="viewBDetail === 'complex'">{{ groupItem.competenceLevel }}</template>
                    </span>
                    <span v-else class="inline-flex size-8 items-center justify-center rounded bg-gray-200 text-xs text-gray-400">–</span>
                </template>
            </div>

            <!-- View B: 5 competence-level cells per group -->
            <div v-else class="flex shrink-0 items-center gap-3">
                <div v-for="(groupItem, i) in groupItems" :key="i" class="flex gap-px">
                    <div
                        v-for="lvl in compLvls"
                        :key="lvl"
                        class="size-7"
                        :class="groupItem?.competenceLevel === lvl ? lvlStyle(groupItem.mean, groupItem.meanCorrected) : 'bg-gray-50'"
                    ></div>
                </div>
            </div>
        </div>

        <TaskDetailPanel
            :isExpanded="props.isExpanded"
            :iqbId="props.item.iqbId"
            :taskNumber="props.item.taskNumber"
            :name="props.item.name"
            :competenceLevelRoman="props.item.competenceLevel"
            :compLvlSubtitle="compLvlDef?.subtitle"
            :compLvlDescription="compLvlDef?.description"
            :competenceId="props.item.competenceId"
            :cognitiveDemandLevel="props.item.cognitiveDemandLevel"
        />
    </div>
</template>
