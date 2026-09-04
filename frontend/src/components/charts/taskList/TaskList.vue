<script setup lang="ts">
import { computed, nextTick, reactive, ref, watch } from 'vue'
import BaseButton from '@/components/base/BaseButton.vue'
import BaseFilterButton from '@/components/base/BaseFilterButton.vue'
import BasePagination from '@/components/base/BasePagination.vue'
import BaseSortButton from '@/components/base/BaseSortButton.vue'
import TaskBarChart from '@/components/charts/taskBarChart/TaskBarChart.vue'
import type { TaskListData, TaskListTask, TaskListCompetenceLevelDef } from './types'

const props = defineProps<{ data: TaskListData; expandedTaskId: string | null; activeQuestion?: string | null }>()
const emit = defineEmits<{ (e: 'update:expandedTaskId', id: string | null): void }>()

type SortDirection = 'default' | 'asc' | 'desc'
type SortProperty = 'mean' | 'meanCorrected' | 'position'

interface FilterState {
    domains: string[]
    competenceLevelRomans: string[]
}

const competenceLevels = ['I', 'II', 'III', 'IV', 'V'] as const

const filterState = reactive<FilterState>({
    domains: props.data.domains.map((d) => d.domainId),
    competenceLevelRomans: [...competenceLevels],
})

const sortConfig = reactive<{ property: SortProperty; direction: SortDirection }>({
    property: 'position',
    direction: 'asc',
})

function toggleSort(property: SortProperty) {
    if (sortConfig.property === property) {
        if (sortConfig.direction === 'default') sortConfig.direction = 'asc'
        else if (sortConfig.direction === 'asc') sortConfig.direction = 'desc'
        else sortConfig.direction = 'default'
        return
    }
    sortConfig.property = property
    sortConfig.direction = 'asc'
}

function toggleFilter(type: keyof FilterState, id: string) {
    if (filterState[type].includes(id)) {
        filterState[type] = filterState[type].filter((el) => el !== id)
    } else {
        filterState[type] = [...filterState[type], id]
    }
}

function clearFilters() {
    filterState.domains = props.data.domains.map((d) => d.domainId)
    filterState.competenceLevelRomans = [...competenceLevels]
}

function getCompLvlDef(domainId: string, romanNumber: string): TaskListCompetenceLevelDef | undefined {
    return props.data.domains.find((d) => d.domainId === domainId)?.competenceLevels.find((cl) => cl.romanNumber === romanNumber)
}

function isTaskHighlighted(task: TaskListTask, allTasks: TaskListTask[]): boolean {
    const q = props.activeQuestion
    if (!q) return false
    const { mean, meanCorrected } = task
    if (q === 'groesser-fairer') return mean !== null && meanCorrected !== null && mean > meanCorrected
    if (q === 'kleiner-fairer') return mean !== null && meanCorrected !== null && mean < meanCorrected
    if (q === 'hoechster') {
        const max = Math.max(...allTasks.filter((t) => t.mean !== null).map((t) => t.mean!))
        return mean !== null && mean === max
    }
    if (q === 'kleinster') {
        const min = Math.min(...allTasks.filter((t) => t.mean !== null).map((t) => t.mean!))
        return mean !== null && mean === min
    }
    if (q === 'groesster-abstand-groesser') {
        const above = allTasks.filter((t) => t.mean !== null && t.meanCorrected !== null && t.mean > t.meanCorrected)
        if (!above.length) return false
        const maxDiff = Math.max(...above.map((t) => t.mean! - t.meanCorrected!))
        return mean !== null && meanCorrected !== null && mean > meanCorrected && mean - meanCorrected === maxDiff
    }
    if (q === 'groesster-abstand-kleiner') {
        const below = allTasks.filter((t) => t.mean !== null && t.meanCorrected !== null && t.mean < t.meanCorrected)
        if (!below.length) return false
        const maxDiff = Math.max(...below.map((t) => t.meanCorrected! - t.mean!))
        return mean !== null && meanCorrected !== null && mean < meanCorrected && meanCorrected - mean === maxDiff
    }
    return false
}

function rowClass(task: TaskListTask): string {
    if (!props.activeQuestion) return ''
    return isTaskHighlighted(task, paginatedTasks.value) ? 'bg-interpretation/5' : 'opacity-20'
}

const filteredTasks = computed(() => {
    const knownLevels = new Set(competenceLevels)
    const filtered = props.data.tasks.filter(
        (task) =>
            filterState.domains.includes(task.domain) &&
            (!knownLevels.has(task.competenceLevel as (typeof competenceLevels)[number]) ||
                filterState.competenceLevelRomans.includes(task.competenceLevel)),
    )
    if (sortConfig.direction === 'default') return filtered
    const dir = sortConfig.direction === 'asc' ? 1 : -1
    return [...filtered].sort((a, b) => dir * ((a[sortConfig.property] ?? 0) - (b[sortConfig.property] ?? 0)))
})

const pageSizeOptions = [
    { value: -1, label: 'Aufgabe' },
    { value: 10, label: '10 Items' },
    { value: 20, label: '20 Items' },
    { value: 50, label: '50 Items' },
    { value: 0, label: 'Alle' },
]

const pageSize = ref<number>(-1)
const showFilters = ref(false)

const hasActiveFilters = computed(
    () => filterState.domains.length < props.data.domains.length || filterState.competenceLevelRomans.length < competenceLevels.length,
)
const currentPage = ref<number>(1)

// Group by task name — all sub-items of the same parent task share the same name (e.g. "Sportunterricht")
const taskGroups = computed(() => {
    const groups = new Map<string, typeof filteredTasks.value>()
    for (const task of filteredTasks.value) {
        const key = task.name || task.iqbId
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(task)
    }
    return [...groups.values()]
})

watch([filteredTasks, pageSize], () => {
    currentPage.value = 1
})

watch(currentPage, () => {
    nextTick(() => document.getElementById('aufgabenliste')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
})

const totalPages = computed(() => {
    if (pageSize.value === 0) return 1
    if (pageSize.value === -1) return Math.max(1, taskGroups.value.length)
    return Math.max(1, Math.ceil(filteredTasks.value.length / pageSize.value))
})

const paginatedTasks = computed(() => {
    if (pageSize.value === 0) return filteredTasks.value
    if (pageSize.value === -1) return taskGroups.value[currentPage.value - 1] ?? []
    const start = (currentPage.value - 1) * pageSize.value
    return filteredTasks.value.slice(start, start + pageSize.value)
})

const maxPageCount = computed(() => {
    if (pageSize.value === 0) return 0
    if (pageSize.value === -1) return Math.max(0, ...taskGroups.value.map((g) => g.length))
    return Math.min(pageSize.value, filteredTasks.value.length)
})

const ghostCount = computed(() => Math.max(0, maxPageCount.value - paginatedTasks.value.length))

const pageLabels = computed(() => {
    if (pageSize.value === 0) return []
    if (pageSize.value === -1) return taskGroups.value.map((group) => group[0]?.name ?? '')
    const labels: string[] = []
    for (let i = 0; i < totalPages.value; i++) {
        const start = i * pageSize.value
        const slice = filteredTasks.value.slice(start, start + pageSize.value)
        const names = [...new Set(slice.map((t) => t.name).filter(Boolean))]
        labels.push(names.join(', '))
    }
    return labels
})
</script>

<template>
    <!-- Filter toggle -->

    <!-- Task list -->
    <p v-if="props.data.tasks.length === 0 || props.data.tasks.every((t) => t.mean === null)" class="text-sm text-gray-500">
        Keine Daten vorhanden.
    </p>
    <template v-else>
        <!-- Filter, sorting and pagination controls -->
        <div class="-mt-4 mb-3 flex items-center justify-end gap-8 print:hidden">
            <!-- Filter Button  -->
            <div class="mr-auto flex items-center gap-2 print:hidden">
                <BaseButton size="sm" variant="default-outline" :active="showFilters" @click="showFilters = !showFilters">
                    Filter &amp; Sortierung
                    <span v-if="hasActiveFilters" class="bg-primary ml-1.5 inline-block size-2 rounded-full"></span>
                </BaseButton>
                <BaseButton v-if="hasActiveFilters" size="sm" variant="default-outline" @click="clearFilters">
                    Filter zurücksetzen
                </BaseButton>
                <div class="text-sm text-gray-500" v-if="filteredTasks.length !== props.data.tasks.length">
                    {{ filteredTasks.length }} von {{ props.data.tasks.length }} angezeigt
                </div>
            </div>

            <BasePagination
                v-model:pageSize="pageSize"
                v-model:currentPage="currentPage"
                :totalPages="totalPages"
                :pageLabels="pageLabels"
                :pageSizeOptions="pageSizeOptions"
            />
        </div>
        <!-- Sorting and Filter -->
        <div v-if="showFilters" class="mb-4 flex gap-6 rounded bg-gray-100 p-4 print:hidden">
            <div>
                <div class="mb-2 text-sm font-bold tracking-wider uppercase">Sortierung</div>
                <div class="flex gap-2 text-sm">
                    <BaseSortButton
                        :direction="sortConfig.property === 'position' ? sortConfig.direction : 'default'"
                        @click="toggleSort('position')"
                        >Position</BaseSortButton
                    >
                    <BaseSortButton
                        :direction="sortConfig.property === 'mean' ? sortConfig.direction : 'default'"
                        @click="toggleSort('mean')"
                        >Klassen-MW</BaseSortButton
                    >
                    <BaseSortButton
                        :direction="sortConfig.property === 'meanCorrected' ? sortConfig.direction : 'default'"
                        @click="toggleSort('meanCorrected')"
                        >Fairer Vergleichswert</BaseSortButton
                    >
                </div>
            </div>
            <div>
                <div class="mb-2 text-sm font-bold tracking-wider uppercase">Filter Domäne</div>
                <div class="flex flex-wrap gap-1 text-sm">
                    <BaseFilterButton
                        v-for="domain in props.data.domains"
                        :key="domain.domainId"
                        :isFilteredBy="filterState.domains.includes(domain.domainId)"
                        @click="toggleFilter('domains', domain.domainId)"
                        >{{ domain.label }}</BaseFilterButton
                    >
                </div>
            </div>
            <div>
                <div class="mb-2 text-sm font-bold tracking-wider uppercase">Filter Parameter</div>
                <div class="flex flex-wrap gap-0.5 text-sm">
                    <BaseFilterButton
                        v-for="level in competenceLevels"
                        :key="level"
                        class="w-20"
                        :isFilteredBy="filterState.competenceLevelRomans.includes(level)"
                        @click="toggleFilter('competenceLevelRomans', level)"
                        >KS {{ level }}</BaseFilterButton
                    >
                </div>
            </div>
        </div>
        <!-- Task view (screen) -->
        <div class="space-y-1 rounded print:hidden">
            <TaskBarChart
                v-for="task in paginatedTasks"
                :key="task.iqbId"
                :data-iqb-id="task.iqbId"
                :class="rowClass(task)"
                class="transition-opacity"
                :data="{
                    iqbId: task.iqbId,
                    taskNumber: task.taskNumber,
                    name: task.name,
                    competenceLevelRoman: task.competenceLevel,
                    compLvlSubtitle: getCompLvlDef(task.domain, task.competenceLevel)?.subtitle,
                    compLvlDescription: getCompLvlDef(task.domain, task.competenceLevel)?.description,
                    mean: Math.round(task.mean ?? 0),
                    meanCorrected: Math.round(task.meanCorrected ?? 0),
                    competenceId: task.competenceId,
                    cognitiveDemandLevel: task.cognitiveDemandLevel,
                }"
                :isExpanded="props.expandedTaskId === task.iqbId"
                @click="emit('update:expandedTaskId', props.expandedTaskId === task.iqbId ? null : task.iqbId)"
            />
            <!-- Ghost rows to prevent layout shift when the new page has fewer items -->
            <div v-for="i in ghostCount" :key="`ghost-${i}`" class="invisible rounded border border-transparent p-0" aria-hidden="true">
                <div class="flex items-center gap-4 rounded px-4 py-1">
                    <div class="size-4 shrink-0"></div>
                    <div class="w-12 text-sm">&nbsp;</div>
                    <div class="w-2/10 text-sm">&nbsp;</div>
                    <div class="flex grow gap-4">
                        <div class="w-full">
                            <div class="mb-0.5 text-xs">&nbsp;</div>
                            <div style="height: 1.4rem"></div>
                        </div>
                        <div class="w-full">
                            <div class="mb-0.5 text-xs">&nbsp;</div>
                            <div style="height: 1.4rem"></div>
                        </div>
                    </div>
                </div>
            </div>
        </div>
        <!-- Task view (print) — always renders all filtered tasks so the browser captures them -->
        <div class="hidden space-y-1 rounded print:block">
            <TaskBarChart
                v-for="task in filteredTasks"
                :key="task.iqbId"
                :data="{
                    iqbId: task.iqbId,
                    taskNumber: task.taskNumber,
                    name: task.name,
                    competenceLevelRoman: task.competenceLevel,
                    compLvlSubtitle: getCompLvlDef(task.domain, task.competenceLevel)?.subtitle,
                    compLvlDescription: getCompLvlDef(task.domain, task.competenceLevel)?.description,
                    mean: Math.round(task.mean ?? 0),
                    meanCorrected: Math.round(task.meanCorrected ?? 0),
                    competenceId: task.competenceId,
                    cognitiveDemandLevel: task.cognitiveDemandLevel,
                }"
                :isExpanded="false"
            />
        </div>
    </template>
</template>
