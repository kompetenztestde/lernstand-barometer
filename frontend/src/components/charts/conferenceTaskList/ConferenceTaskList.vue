<script setup lang="ts">
import { computed, nextTick, ref, watch } from 'vue'
import BasePagination from '@/components/base/BasePagination.vue'
import InterpretationButton from '@/components/charts/InterpretationButton.vue'
import InterpretationPanel from '@/components/charts/InterpretationPanel.vue'
import { useInterpretationSection, type InterpretationQuestion } from '@/composables/useInterpretationSection'
import type { TaskListItem } from '@/queries/useGroupsItemsQuery'
import ConferenceColumnHeader from './ConferenceColumnHeader.vue'
import ConferenceTaskRow from './ConferenceTaskRow.vue'
import IconInfoCircle from '@/components/icons/IconInfoCircle.vue'
import { colors } from './utils'

interface Props {
    items: TaskListItem[]
    itemMaps: Map<string, TaskListItem>[]
    groupNames: string[]
    view: 'A' | 'B'
    viewBDetail: 'simple' | 'complex'
}

const props = defineProps<Props>()

const pageSize = ref<number>(-1)
const currentPage = ref(1)
const expandedId = ref<string | null>(null)

// Group by task name so page -1 shows one task (with all its sub-items) at a time
const taskGroups = computed(() => {
    const groups = new Map<string, TaskListItem[]>()
    for (const item of props.items) {
        const key = item.name || item.iqbId
        if (!groups.has(key)) groups.set(key, [])
        groups.get(key)!.push(item)
    }
    return [...groups.values()]
})

watch([() => props.items, pageSize], () => {
    currentPage.value = 1
})

watch(currentPage, () => {
    nextTick(() => document.getElementById('conference-list')?.scrollIntoView({ behavior: 'smooth', block: 'nearest' }))
})

const totalPages = computed(() => {
    if (pageSize.value === 0) return 1
    if (pageSize.value === -1) return Math.max(1, taskGroups.value.length)
    return Math.max(1, Math.ceil(props.items.length / pageSize.value))
})

const paginatedItems = computed(() => {
    if (pageSize.value === 0) return props.items
    if (pageSize.value === -1) return taskGroups.value[currentPage.value - 1] ?? []
    const start = (currentPage.value - 1) * pageSize.value
    return props.items.slice(start, start + pageSize.value)
})

const half = computed(() => Math.ceil(paginatedItems.value.length / 2))
const leftItems = computed(() => paginatedItems.value.slice(0, half.value))
const rightItems = computed(() => paginatedItems.value.slice(half.value))

const pageLabels = computed(() => {
    if (pageSize.value === 0) return []
    if (pageSize.value === -1) return taskGroups.value.map((group) => group[0]?.name ?? '')
    const labels: string[] = []
    for (let i = 0; i < totalPages.value; i++) {
        const start = i * pageSize.value
        const slice = props.items.slice(start, start + pageSize.value)
        const names = [...new Set(slice.map((t) => t.name).filter(Boolean))]
        labels.push(names.join(', '))
    }
    return labels
})

function groupItemsFor(item: TaskListItem): (TaskListItem | undefined)[] {
    return props.itemMaps.map((m) => m.get(item.iqbId))
}

function toggleExpand(iqbId: string) {
    expandedId.value = expandedId.value === iqbId ? null : iqbId
}

const legendColors = computed(() => {
    const isSimple = props.view === 'A' && props.viewBDetail === 'simple'
    return Object.values(colors).map((c) => ({
        colorClass: c.colorClass,
        description: c.descriptionSimple,
        ...(isSimple ? {} : { descriptionDetailed: c.description }),
    }))
})

const showSubDomainInterpretation = ref(false)

// prettier-ignore
function getCategoryId(mean: number | null, meanComparison: number | null): string | null {
    if (mean === null || meanComparison === null) return null
    const diff = mean - meanComparison
    if (mean > 90 && meanComparison > 90) return 'excellent'
    if (diff > 0)                         return 'better'
    if (diff <= -10)                      return 'worse'
    return 'bad'
}

const categoryRank: Record<string, number> = { excellent: 1, better: 2, worse: 3, bad: 4 }

function itemInterpretation(item: TaskListItem): string {
    const ranks = props.itemMaps
        .map((m) => m.get(item.iqbId))
        .map((g) => (g ? getCategoryId(g.mean, g.meanCorrected) : null))
        .filter((c): c is string => c !== null)
        .map((c) => categoryRank[c])
        .filter((r): r is number => r !== undefined)

    if (ranks.length < 2) return 'kein'
    const minR = Math.min(...ranks)
    const maxR = Math.max(...ranks)
    if (minR === maxR) return 'kein'

    const presentRanks = new Set(ranks)
    for (let r = minR + 1; r < maxR; r++) {
        if (!presentRanks.has(r)) return 'stark'
    }
    return 'leicht'
}

const interpretationQuestions: InterpretationQuestion[] = [
    { id: 'stark', label: '↕ Klassen unterscheiden sich stark' },
    { id: 'leicht', label: '↔ Klassen unterscheiden sich leicht' },
    { id: 'kein', label: '= Kein Unterschied' },
]

const { activeQuestion, rowClass } = useInterpretationSection(
    (q) => new Set(props.items.filter((item) => itemInterpretation(item) === q).map((item) => item.iqbId)),
    showSubDomainInterpretation,
)
</script>

<template>
    <div id="conference-list">
        <p v-if="items.length === 0" class="text-sm text-gray-500">Keine Daten vorhanden.</p>
        <template v-else>
            <div class="mb-4 flex justify-between gap-2">
                <!-- Interpretation button -->
                <InterpretationButton v-model="showSubDomainInterpretation" />
                <!-- Pagination controls -->
                <BasePagination
                    v-model:pageSize="pageSize"
                    v-model:currentPage="currentPage"
                    class="print:hidden"
                    :totalPages="totalPages"
                    :pageLabels="pageLabels"
                />
            </div>

            <InterpretationPanel
                :questions="interpretationQuestions"
                :show="showSubDomainInterpretation"
                v-model="activeQuestion"
                class="mb-4"
            >
                <template #pre-buttons>
                    <div class="flex items-center">
                        <IconInfoCircle class="mr-1 size-5!" /> Die Interpretationshilfen werden nur für die angezeigte Seite berechnet.
                    </div>
                </template>
            </InterpretationPanel>
            <!-- Color legend (screen) -->
            <div class="mt-4 rounded-xl border border-gray-200 px-6 py-3 text-sm text-gray-600 print:hidden">
                <p class="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">Klasse relativ zum fairen Vergleichswert</p>
                <div
                    class="gap-x-6 gap-y-1"
                    :class="props.view === 'A' && props.viewBDetail === 'complex' ? 'grid grid-cols-2' : 'flex flex-wrap'"
                >
                    <div
                        v-for="(color, index) in legendColors"
                        :key="index"
                        class="flex items-center gap-2"
                        v-tippy="{
                            content: 'descriptionDetailed' in color ? color.descriptionDetailed : undefined,
                            disabled: !('descriptionDetailed' in color),
                        }"
                    >
                        <div :class="color.colorClass" class="size-3.5 shrink-0 rounded-sm"></div>
                        <span>{{ color.description }}</span>
                    </div>
                </div>
            </div>
            <!-- Task rows: left column fills first, then right -->
            <div class="mt-8 grid grid-cols-1 overflow-x-auto rounded xl:grid-cols-2 xl:gap-4 print:hidden">
                <div class="min-w-0">
                    <!-- Column header left -->
                    <ConferenceColumnHeader :view="view" :groupNames="groupNames" />
                    <div>
                        <ConferenceTaskRow
                            v-for="item in leftItems"
                            :key="item.iqbId"
                            class="hover:bg-primary/5 rounded-none border border-b-0 border-gray-200! first:rounded-t-lg last:rounded-none! xl:last:border-b"
                            :item="item"
                            :groupItems="groupItemsFor(item)"
                            :isExpanded="expandedId === item.iqbId"
                            :view="view"
                            :viewBDetail="viewBDetail"
                            :class="rowClass(item.iqbId)"
                            @click="toggleExpand(item.iqbId)"
                        />
                    </div>
                </div>
                <div class="min-w-0">
                    <!-- Column header right: only visible in 2-column layout -->
                    <ConferenceColumnHeader :view="view" :groupNames="groupNames" class="hidden xl:flex" />
                    <div>
                        <ConferenceTaskRow
                            v-for="item in rightItems"
                            :key="item.iqbId"
                            class="hover:bg-primary/5 rounded-none border border-b-0 border-gray-200! last:rounded-b-lg last:border-b"
                            :item="item"
                            :groupItems="groupItemsFor(item)"
                            :isExpanded="expandedId === item.iqbId"
                            :view="view"
                            :viewBDetail="viewBDetail"
                            :class="rowClass(item.iqbId)"
                            @click="toggleExpand(item.iqbId)"
                        />
                    </div>
                </div>
            </div>

            <!-- Print: legend at top, then all items in a single column -->
            <div class="hidden print:block">
                <!-- Color legend at top for print -->
                <div class="mb-4 rounded border border-gray-200 px-6 py-3 text-sm text-gray-600">
                    <p class="mb-2 text-xs font-semibold tracking-wide text-gray-400 uppercase">Klasse relativ zum fairen Vergleichswert</p>
                    <div class="flex flex-wrap gap-x-6 gap-y-1">
                        <div v-for="(color, index) in legendColors" :key="index" class="flex items-center gap-2">
                            <div :class="color.colorClass" class="size-3.5 shrink-0 rounded-sm"></div>
                            <span>{{ color.description }}</span>
                        </div>
                    </div>
                </div>
                <!-- Column header -->
                <ConferenceColumnHeader :view="view" :groupNames="groupNames" />
                <!-- All items -->
                <div>
                    <ConferenceTaskRow
                        v-for="item in props.items"
                        :key="item.iqbId"
                        class="rounded-none border border-b-0 border-gray-200! first:rounded-t-lg last:rounded-b-lg last:border-b"
                        :item="item"
                        :groupItems="groupItemsFor(item)"
                        :isExpanded="false"
                        :view="view"
                        :viewBDetail="viewBDetail"
                    />
                </div>
            </div>
        </template>
    </div>
</template>
